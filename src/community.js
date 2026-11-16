// Live classes + real-time chat (SSE), doubts/Q&A, reviews, wishlist, certificates, notifications, lecture notes, instructors.
const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const db = require('./db');

db.exec(`
CREATE TABLE IF NOT EXISTS instructors (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, name_mr TEXT, title TEXT, bio TEXT, bio_mr TEXT, photo_url TEXT, position INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS live_classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL, description TEXT, starts_at TEXT NOT NULL, duration_min INTEGER NOT NULL DEFAULT 60,
  stream_url TEXT, join_url TEXT, recording_url TEXT, is_free INTEGER NOT NULL DEFAULT 0, chat_enabled INTEGER NOT NULL DEFAULT 1,
  instructor_id INTEGER REFERENCES instructors(id) ON DELETE SET NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS live_chat (id INTEGER PRIMARY KEY AUTOINCREMENT, live_id INTEGER NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, body TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), deleted INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS live_attendance (live_id INTEGER NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, joined_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (live_id, user_id));
CREATE TABLE IF NOT EXISTS doubts (id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE, lecture_id INTEGER REFERENCES lectures(id) ON DELETE SET NULL, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, body TEXT, resolved INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS doubt_replies (id INTEGER PRIMARY KEY AUTOINCREMENT, doubt_id INTEGER NOT NULL REFERENCES doubts(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, body TEXT NOT NULL, is_staff INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS doubt_votes (doubt_id INTEGER NOT NULL REFERENCES doubts(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, PRIMARY KEY (doubt_id, user_id));
CREATE TABLE IF NOT EXISTS reviews (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE, rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5), body TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (user_id, course_id));
CREATE TABLE IF NOT EXISTS wishlist (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE, created_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (user_id, course_id));
CREATE TABLE IF NOT EXISTS certificates (code TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE, issued_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE (user_id, course_id));
CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, title TEXT NOT NULL, body TEXT, link TEXT, read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS lecture_notes (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, lecture_id INTEGER NOT NULL REFERENCES lectures(id) ON DELETE CASCADE, body TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (user_id, lecture_id));
CREATE INDEX IF NOT EXISTS idx_chat_live ON live_chat(live_id, id);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, id);
CREATE INDEX IF NOT EXISTS idx_doubts_course ON doubts(course_id, id);
`);
const cols = (t) => db.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name);
if (!cols('courses').includes('instructor_id')) db.exec('ALTER TABLE courses ADD COLUMN instructor_id INTEGER REFERENCES instructors(id) ON DELETE SET NULL');
if (!cols('lectures').includes('section')) db.exec('ALTER TABLE lectures ADD COLUMN section TEXT');

if (!db.prepare('SELECT COUNT(*) c FROM instructors').get().c) {
  const id = db.prepare('INSERT INTO instructors (name,name_mr,title,bio,bio_mr) VALUES (?,?,?,?,?)')
    .run('Demo Teacher', 'डेमो शिक्षक', 'Mental Ability & Maths', 'Replace this demo profile in Admin → Website → Instructors with your real teacher’s name, photo and experience.', 'हे डेमो प्रोफाइल आहे – खऱ्या शिक्षकाची माहिती ॲडमिनमधून भरा.').lastInsertRowid;
  db.prepare('UPDATE courses SET instructor_id=? WHERE instructor_id IS NULL').run(id);
  db.prepare("UPDATE lectures SET section='Getting started' WHERE section IS NULL AND position<=1").run();
  db.prepare("UPDATE lectures SET section='Mental Ability' WHERE section IS NULL").run();
  // A demo live class tomorrow so the schedule isn't empty on first run.
  const c = db.prepare("SELECT id FROM courses WHERE price=0 LIMIT 1").get();
  db.prepare("INSERT INTO live_classes (course_id,title,description,starts_at,duration_min,stream_url,is_free,instructor_id) VALUES (?,?,?,?,?,?,1,?)")
    .run(c?.id ?? null, 'Free live class: Navodaya Mental Ability – solving series questions fast', 'Open to everyone. Bring a notebook!', new Date(Date.now() + 26 * 3600e3).toISOString(), 60, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', id);
}

const OPEN_EARLY = 15 * 60e3, CLOSE_LATE = 30 * 60e3;
function liveStatus(l, now = Date.now()) {
  const s = Date.parse(l.starts_at), e = s + l.duration_min * 60e3;
  if (now < s - OPEN_EARLY) return 'upcoming';
  if (now <= e + CLOSE_LATE) return now < s ? 'opening' : 'live';
  return 'ended';
}

function notify(userIds, title, body, link) {
  const ins = db.prepare('INSERT INTO notifications (user_id,title,body,link) VALUES (?,?,?,?)');
  db.exec('BEGIN'); try { for (const u of userIds) ins.run(u, title, body || null, link || null); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; }
}

function mount(app, { auth, admin, err, isEnrolled, embedUrl, safeUrl }) {
  const str = (v, max = 5000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const int = (v) => { const n = Number.parseInt(v, 10); return Number.isFinite(n) ? n : null; };
  const isAdmin = (req) => req.user?.role === 'admin';
  const courseAccess = (req, courseId) => isAdmin(req) || (req.user && isEnrolled(req.user.id, courseId));
  const liveAccess = (req, l) => !!req.user && (l.is_free || !l.course_id || courseAccess(req, l.course_id));

  /* ---------- live classes ---------- */
  const liveRow = (l, req) => {
    const status = liveStatus(l); const access = liveAccess(req, l);
    const out = { id: l.id, course_id: l.course_id, course_title: l.course_title, title: l.title, description: l.description, starts_at: l.starts_at, duration_min: l.duration_min,
      is_free: l.is_free, chat_enabled: l.chat_enabled, instructor: l.instructor_name ? { id: l.instructor_id, name: l.instructor_name, photo_url: l.instructor_photo } : null,
      status, access, has_recording: !!l.recording_url, attendees: l.attendees ?? undefined };
    if (access && (status === 'live' || status === 'opening')) { out.player = l.stream_url ? embedUrl(l.stream_url) : null; out.join_url = l.join_url || null; }
    if (access && status === 'ended' && l.recording_url) out.player = embedUrl(l.recording_url);
    return out;
  };
  const LIVE_SQL = `SELECT l.*, c.title course_title, i.name instructor_name, i.photo_url instructor_photo, (SELECT COUNT(*) FROM live_attendance a WHERE a.live_id=l.id) attendees
    FROM live_classes l LEFT JOIN courses c ON c.id=l.course_id LEFT JOIN instructors i ON i.id=l.instructor_id`;
  app.get('/api/live', (req, res) => {
    const course = int(req.query.course);
    let rows = db.prepare(LIVE_SQL + (course ? ' WHERE l.course_id=?' : '') + ' ORDER BY l.starts_at').all(...(course ? [course] : []));
    const list = rows.map((l) => liveRow(l, req));
    res.json({
      now: list.filter((l) => l.status === 'live' || l.status === 'opening'),
      upcoming: list.filter((l) => l.status === 'upcoming').slice(0, 30),
      past: list.filter((l) => l.status === 'ended').reverse().slice(0, 30),
    });
  });
  app.get('/api/live/:id', (req, res) => {
    const l = db.prepare(LIVE_SQL + ' WHERE l.id=?').get(int(req.params.id));
    return l ? res.json(liveRow(l, req)) : err(res, 404, 'Live class not found');
  });
  app.post('/api/live/:id/attend', auth, (req, res) => {
    const l = db.prepare('SELECT * FROM live_classes WHERE id=?').get(int(req.params.id));
    if (!l || !liveAccess(req, l)) return err(res, 403, 'Enroll in the course to join this class');
    db.prepare('INSERT OR IGNORE INTO live_attendance (live_id,user_id) VALUES (?,?)').run(l.id, req.user.id); res.json({ ok: true });
  });

  // ---- real-time chat over Server-Sent Events ----
  const rooms = new Map(); // live_id -> Set(res)
  const broadcast = (liveId, event, data) => { for (const r of rooms.get(liveId) || []) r.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); };
  const presence = (liveId) => broadcast(liveId, 'presence', { online: rooms.get(liveId)?.size || 0 });
  const chatMsg = (m) => ({ id: m.id, body: m.body, at: m.created_at, user: { id: m.user_id, name: m.name, staff: m.role === 'admin' } });
  app.get('/api/live/:id/chat', auth, (req, res) => {
    const l = db.prepare('SELECT * FROM live_classes WHERE id=?').get(int(req.params.id));
    if (!l || !liveAccess(req, l)) return err(res, 403, 'No access');
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.flushHeaders();
    const recent = db.prepare('SELECT m.*, u.name, u.role FROM live_chat m JOIN users u ON u.id=m.user_id WHERE m.live_id=? AND m.deleted=0 ORDER BY m.id DESC LIMIT 60').all(l.id).reverse();
    res.write(`event: history\ndata: ${JSON.stringify({ messages: recent.map(chatMsg), enabled: !!l.chat_enabled })}\n\n`);
    if (!rooms.has(l.id)) rooms.set(l.id, new Set());
    rooms.get(l.id).add(res); presence(l.id);
    const hb = setInterval(() => res.write(': ping\n\n'), 25000);
    req.on('close', () => { clearInterval(hb); rooms.get(l.id)?.delete(res); presence(l.id); });
  });
  const lastPost = new Map();
  app.post('/api/live/:id/chat', auth, (req, res) => {
    const l = db.prepare('SELECT * FROM live_classes WHERE id=?').get(int(req.params.id));
    if (!l || !liveAccess(req, l)) return err(res, 403, 'No access');
    if (!l.chat_enabled && !isAdmin(req)) return err(res, 403, 'Chat is turned off for this class');
    if (liveStatus(l) === 'ended' && !isAdmin(req)) return err(res, 403, 'This class has ended');
    const body = str(req.body.body, 400).replace(/\s+/g, ' ');
    if (!body) return err(res, 400, 'Type a message');
    const k = `${l.id}:${req.user.id}`, now = Date.now();
    if (!isAdmin(req) && now - (lastPost.get(k) || 0) < 3000) return err(res, 429, 'Slow down – one message every 3 seconds');
    lastPost.set(k, now);
    const id = Number(db.prepare('INSERT INTO live_chat (live_id,user_id,body) VALUES (?,?,?)').run(l.id, req.user.id, body).lastInsertRowid);
    const m = db.prepare('SELECT m.*, u.name, u.role FROM live_chat m JOIN users u ON u.id=m.user_id WHERE m.id=?').get(id);
    broadcast(l.id, 'message', chatMsg(m)); res.json({ ok: true });
  });

  /* ---------- doubts / Q&A ---------- */
  app.get('/api/courses/:id/doubts', (req, res) => {
    const cid = int(req.params.id), lec = int(req.query.lecture), uid = req.user?.id || 0;
    const rows = db.prepare(`SELECT d.id,d.title,d.body,d.resolved,d.created_at,d.lecture_id,l.title lecture_title,u.name,
      (SELECT COUNT(*) FROM doubt_votes v WHERE v.doubt_id=d.id) votes, (SELECT COUNT(*) FROM doubt_votes v WHERE v.doubt_id=d.id AND v.user_id=?) voted,
      (SELECT COUNT(*) FROM doubt_replies r WHERE r.doubt_id=d.id) replies, (SELECT COUNT(*) FROM doubt_replies r WHERE r.doubt_id=d.id AND r.is_staff=1) staff_replies
      FROM doubts d JOIN users u ON u.id=d.user_id LEFT JOIN lectures l ON l.id=d.lecture_id WHERE d.course_id=? ${lec ? 'AND d.lecture_id=?' : ''} ORDER BY votes DESC, d.id DESC LIMIT 100`)
      .all(uid, cid, ...(lec ? [lec] : []));
    res.json(rows);
  });
  app.post('/api/courses/:id/doubts', auth, (req, res) => {
    const cid = int(req.params.id);
    if (!courseAccess(req, cid)) return err(res, 403, 'Enroll to ask a doubt');
    const title = str(req.body.title, 200); if (title.length < 5) return err(res, 400, 'Write your question (at least 5 characters)');
    const lec = int(req.body.lecture_id);
    const r = db.prepare('INSERT INTO doubts (course_id,lecture_id,user_id,title,body) VALUES (?,?,?,?,?)').run(cid, lec && db.prepare('SELECT 1 FROM lectures WHERE id=? AND course_id=?').get(lec, cid) ? lec : null, req.user.id, title, str(req.body.body, 3000) || null);
    res.json({ id: Number(r.lastInsertRowid) });
  });
  app.get('/api/doubts/:id', (req, res) => {
    const d = db.prepare('SELECT d.*, u.name, c.title course_title FROM doubts d JOIN users u ON u.id=d.user_id JOIN courses c ON c.id=d.course_id WHERE d.id=?').get(int(req.params.id));
    if (!d) return err(res, 404, 'Not found');
    const replies = db.prepare('SELECT r.id,r.body,r.is_staff,r.created_at,u.name FROM doubt_replies r JOIN users u ON u.id=r.user_id WHERE r.doubt_id=? ORDER BY r.is_staff DESC, r.id').all(d.id);
    res.json({ ...d, user_id: undefined, mine: req.user?.id === d.user_id, replies });
  });
  app.post('/api/doubts/:id/replies', auth, (req, res) => {
    const d = db.prepare('SELECT * FROM doubts WHERE id=?').get(int(req.params.id));
    if (!d || !courseAccess(req, d.course_id)) return err(res, 403, 'No access');
    const body = str(req.body.body, 4000); if (!body) return err(res, 400, 'Write an answer');
    db.prepare('INSERT INTO doubt_replies (doubt_id,user_id,body,is_staff) VALUES (?,?,?,?)').run(d.id, req.user.id, body, isAdmin(req) ? 1 : 0);
    if (d.user_id !== req.user.id) notify([d.user_id], isAdmin(req) ? 'A teacher answered your doubt' : 'New answer to your doubt', d.title, `#/doubt/${d.id}`);
    res.json({ ok: true });
  });
  app.post('/api/doubts/:id/vote', auth, (req, res) => {
    const d = db.prepare('SELECT * FROM doubts WHERE id=?').get(int(req.params.id));
    if (!d || !courseAccess(req, d.course_id)) return err(res, 403, 'No access');
    const had = db.prepare('DELETE FROM doubt_votes WHERE doubt_id=? AND user_id=?').run(d.id, req.user.id).changes;
    if (!had) db.prepare('INSERT INTO doubt_votes (doubt_id,user_id) VALUES (?,?)').run(d.id, req.user.id);
    res.json({ voted: !had });
  });
  app.post('/api/doubts/:id/resolve', auth, (req, res) => {
    const d = db.prepare('SELECT * FROM doubts WHERE id=?').get(int(req.params.id));
    if (!d || (d.user_id !== req.user.id && !isAdmin(req))) return err(res, 403, 'No access');
    db.prepare('UPDATE doubts SET resolved=? WHERE id=?').run(req.body.resolved === false ? 0 : 1, d.id); res.json({ ok: true });
  });

  /* ---------- reviews ---------- */
  app.get('/api/courses/:id/reviews', (req, res) => {
    const cid = int(req.params.id);
    const stats = db.prepare('SELECT COUNT(*) n, ROUND(AVG(rating),1) avg FROM reviews WHERE course_id=?').get(cid);
    const dist = [5, 4, 3, 2, 1].map((r) => db.prepare('SELECT COUNT(*) n FROM reviews WHERE course_id=? AND rating=?').get(cid, r).n);
    const list = db.prepare('SELECT r.rating,r.body,r.created_at,u.name FROM reviews r JOIN users u ON u.id=r.user_id WHERE r.course_id=? ORDER BY (r.body IS NOT NULL AND r.body<>\'\') DESC, r.created_at DESC LIMIT 50').all(cid);
    const mine = req.user ? db.prepare('SELECT rating,body FROM reviews WHERE user_id=? AND course_id=?').get(req.user.id, cid) : null;
    res.json({ ...stats, dist, list, mine: mine || null, can_review: !!req.user && courseAccess(req, cid) });
  });
  app.post('/api/courses/:id/reviews', auth, (req, res) => {
    const cid = int(req.params.id), rating = int(req.body.rating);
    if (!courseAccess(req, cid)) return err(res, 403, 'Only enrolled students can review');
    if (!rating || rating < 1 || rating > 5) return err(res, 400, 'Choose 1 to 5 stars');
    db.prepare('INSERT INTO reviews (user_id,course_id,rating,body) VALUES (?,?,?,?) ON CONFLICT(user_id,course_id) DO UPDATE SET rating=excluded.rating, body=excluded.body, created_at=datetime(\'now\')')
      .run(req.user.id, cid, rating, str(req.body.body, 2000) || null);
    res.json({ ok: true });
  });

  /* ---------- wishlist ---------- */
  app.get('/api/my/wishlist', auth, (req, res) => res.json(db.prepare('SELECT course_id FROM wishlist WHERE user_id=?').all(req.user.id).map((r) => r.course_id)));
  app.post('/api/my/wishlist/:id', auth, (req, res) => {
    const cid = int(req.params.id);
    const had = db.prepare('DELETE FROM wishlist WHERE user_id=? AND course_id=?').run(req.user.id, cid).changes;
    if (!had && db.prepare('SELECT 1 FROM courses WHERE id=?').get(cid)) db.prepare('INSERT INTO wishlist (user_id,course_id) VALUES (?,?)').run(req.user.id, cid);
    res.json({ saved: !had });
  });

  /* ---------- certificates ---------- */
  app.post('/api/courses/:id/certificate', auth, (req, res) => {
    const cid = int(req.params.id);
    if (!isEnrolled(req.user.id, cid)) return err(res, 403, 'Enroll and complete the course first');
    const p = db.prepare('SELECT (SELECT COUNT(*) FROM lectures WHERE course_id=?) total, (SELECT COUNT(*) FROM lecture_progress lp JOIN lectures l ON l.id=lp.lecture_id WHERE l.course_id=? AND lp.user_id=?) done').get(cid, cid, req.user.id);
    if (!p.total || p.done < p.total) return err(res, 400, `Complete all lessons first (${p.done}/${p.total})`);
    let c = db.prepare('SELECT code FROM certificates WHERE user_id=? AND course_id=?').get(req.user.id, cid);
    if (!c) { c = { code: 'SP-' + crypto.randomBytes(5).toString('hex').toUpperCase() }; db.prepare('INSERT INTO certificates (code,user_id,course_id) VALUES (?,?,?)').run(c.code, req.user.id, cid); }
    res.json(c);
  });
  app.get('/api/certificates/:code', (req, res) => {
    const c = db.prepare(`SELECT ce.code, ce.issued_at, u.name student, c.title course, e.name exam, i.name instructor FROM certificates ce JOIN users u ON u.id=ce.user_id JOIN courses c ON c.id=ce.course_id
      LEFT JOIN exams e ON e.id=c.exam_id LEFT JOIN instructors i ON i.id=c.instructor_id WHERE ce.code=?`).get(str(req.params.code, 20).toUpperCase());
    return c ? res.json(c) : err(res, 404, 'Certificate not found');
  });
  app.get('/api/my/certificates', auth, (req, res) => res.json(db.prepare('SELECT ce.code, ce.issued_at, c.title FROM certificates ce JOIN courses c ON c.id=ce.course_id WHERE ce.user_id=? ORDER BY ce.issued_at DESC').all(req.user.id)));

  /* ---------- notifications ---------- */
  app.get('/api/my/notifications', auth, (req, res) => res.json({
    unread: db.prepare('SELECT COUNT(*) n FROM notifications WHERE user_id=? AND read=0').get(req.user.id).n,
    list: db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 30').all(req.user.id),
  }));
  app.post('/api/my/notifications/read', auth, (req, res) => { db.prepare('UPDATE notifications SET read=1 WHERE user_id=?').run(req.user.id); res.json({ ok: true }); });

  /* ---------- personal lecture notes ---------- */
  app.get('/api/lectures/:id/note', auth, (req, res) => res.json(db.prepare('SELECT body, updated_at FROM lecture_notes WHERE user_id=? AND lecture_id=?').get(req.user.id, int(req.params.id)) || { body: '' }));
  app.put('/api/lectures/:id/note', auth, (req, res) => {
    const lid = int(req.params.id), body = str(req.body.body, 20000);
    const l = db.prepare('SELECT course_id, is_preview FROM lectures WHERE id=?').get(lid);
    if (!l || !(l.is_preview || courseAccess(req, l.course_id))) return err(res, 403, 'No access');
    if (!body) db.prepare('DELETE FROM lecture_notes WHERE user_id=? AND lecture_id=?').run(req.user.id, lid);
    else db.prepare("INSERT INTO lecture_notes (user_id,lecture_id,body) VALUES (?,?,?) ON CONFLICT(user_id,lecture_id) DO UPDATE SET body=excluded.body, updated_at=datetime('now')").run(req.user.id, lid, body);
    res.json({ ok: true });
  });

  /* ---------- instructors (public) ---------- */
  app.get('/api/instructors/:id', (req, res) => {
    const i = db.prepare('SELECT * FROM instructors WHERE id=?').get(int(req.params.id));
    if (!i) return err(res, 404, 'Not found');
    const courses = db.prepare('SELECT id,title FROM courses WHERE instructor_id=? AND published=1').all(i.id);
    res.json({ ...i, courses });
  });
  app.get('/api/instructors', (req, res) => res.json(db.prepare('SELECT id,name,name_mr,title,photo_url FROM instructors ORDER BY position,id').all()));

  /* ---------- admin ---------- */
  const A = express.Router(); A.use(auth, admin);
  const liveFields = (b) => {
    const starts = Date.parse(b.starts_at); if (!Number.isFinite(starts)) throw new Error('Choose a valid start date & time');
    const urls = {}; for (const k of ['stream_url', 'join_url', 'recording_url']) { const u = safeUrl(b[k]); if (u === null || (u && !/^https:\/\//.test(u))) throw new Error(`${k.replace('_', ' ')}: use an https:// link`); urls[k] = u || null; }
    const title = str(b.title, 200); if (!title) throw new Error('Title required');
    return [int(b.course_id) || null, title, str(b.description, 2000) || null, new Date(starts).toISOString(), Math.min(600, Math.max(5, int(b.duration_min) || 60)), urls.stream_url, urls.join_url, urls.recording_url, b.is_free ? 1 : 0, b.chat_enabled === false || b.chat_enabled === 0 ? 0 : 1, int(b.instructor_id) || null];
  };
  A.get('/live', (req, res) => res.json(db.prepare(LIVE_SQL + ' ORDER BY l.starts_at DESC LIMIT 200').all().map((l) => ({ ...l, status: liveStatus(l) }))));
  A.post('/live', (req, res) => {
    try {
      const f = liveFields(req.body);
      const id = Number(db.prepare('INSERT INTO live_classes (course_id,title,description,starts_at,duration_min,stream_url,join_url,recording_url,is_free,chat_enabled,instructor_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(...f).lastInsertRowid);
      if (req.body.notify !== false) {
        const users = f[0] && !f[8] ? db.prepare('SELECT user_id FROM enrollments WHERE course_id=?').all(f[0]).map((r) => r.user_id) : db.prepare("SELECT id user_id FROM users WHERE role='student' AND blocked=0").all().map((r) => r.user_id);
        const when = new Date(f[3]).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
        notify(users, 'New live class scheduled', `${f[1]} · ${when} IST`, `#/live/${id}`);
      }
      res.json({ id });
    } catch (e) { err(res, 400, e.message); }
  });
  A.put('/live/:id', (req, res) => {
    try { db.prepare('UPDATE live_classes SET course_id=?,title=?,description=?,starts_at=?,duration_min=?,stream_url=?,join_url=?,recording_url=?,is_free=?,chat_enabled=?,instructor_id=? WHERE id=?').run(...liveFields(req.body), int(req.params.id)); res.json({ ok: true }); }
    catch (e) { err(res, 400, e.message); }
  });
  A.delete('/live/:id', (req, res) => { db.prepare('DELETE FROM live_classes WHERE id=?').run(int(req.params.id)); res.json({ ok: true }); });
  A.get('/live/:id/attendance', (req, res) => res.json(db.prepare('SELECT u.name,u.phone,a.joined_at FROM live_attendance a JOIN users u ON u.id=a.user_id WHERE a.live_id=? ORDER BY a.joined_at').all(int(req.params.id))));
  A.delete('/chat/:id', (req, res) => {
    const m = db.prepare('SELECT * FROM live_chat WHERE id=?').get(int(req.params.id)); if (!m) return err(res, 404, 'Not found');
    db.prepare('UPDATE live_chat SET deleted=1 WHERE id=?').run(m.id); broadcast(m.live_id, 'delete', { id: m.id }); res.json({ ok: true });
  });
  A.get('/doubts', (req, res) => res.json(db.prepare(`SELECT d.id,d.title,d.resolved,d.created_at,c.title course_title,u.name,(SELECT COUNT(*) FROM doubt_replies r WHERE r.doubt_id=d.id AND r.is_staff=1) staff_replies
    FROM doubts d JOIN courses c ON c.id=d.course_id JOIN users u ON u.id=d.user_id ORDER BY staff_replies>0, d.id DESC LIMIT 200`).all()));
  A.delete('/doubts/:id', (req, res) => { db.prepare('DELETE FROM doubts WHERE id=?').run(int(req.params.id)); res.json({ ok: true }); });
  A.get('/reviews', (req, res) => res.json(db.prepare('SELECT r.user_id,r.course_id,r.rating,r.body,r.created_at,u.name,c.title course_title FROM reviews r JOIN users u ON u.id=r.user_id JOIN courses c ON c.id=r.course_id ORDER BY r.created_at DESC LIMIT 300').all()));
  A.delete('/reviews/:uid/:cid', (req, res) => { db.prepare('DELETE FROM reviews WHERE user_id=? AND course_id=?').run(int(req.params.uid), int(req.params.cid)); res.json({ ok: true }); });
  A.post('/notify', (req, res) => {
    const title = str(req.body.title, 200); if (!title) return err(res, 400, 'Title required');
    const cid = int(req.body.course_id);
    const users = cid ? db.prepare('SELECT user_id FROM enrollments WHERE course_id=?').all(cid).map((r) => r.user_id) : db.prepare("SELECT id user_id FROM users WHERE blocked=0").all().map((r) => r.user_id);
    const link = safeUrl(req.body.link); notify(users, title, str(req.body.body, 500), link || null); res.json({ sent: users.length });
  });
  app.use('/api/admin', A);
}

module.exports = { mount };
