const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const db = require('./db');

const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET || (IS_PROD ? null : crypto.randomBytes(32).toString('hex'));
if (!JWT_SECRET) { console.error('JWT_SECRET must be set in production'); process.exit(1); }
const RZP_KEY = process.env.RAZORPAY_KEY_ID;
const RZP_SECRET = process.env.RAZORPAY_KEY_SECRET;
const PAYMENT_MODE = RZP_KEY && RZP_SECRET ? 'razorpay' : (IS_PROD ? 'disabled' : 'mock');
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://checkout.razorpay.com'],
      frameSrc: ["'self'", 'https://www.youtube-nocookie.com', 'https://player.vimeo.com', 'https://api.razorpay.com', 'https://checkout.razorpay.com'],
      connectSrc: ["'self'", 'https://lumberjack.razorpay.com', 'https://api.razorpay.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      mediaSrc: ["'self'", 'https:'],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// ---------- helpers ----------
const COOKIE = 'vp_session';
const cookieOpts = { httpOnly: true, sameSite: 'lax', secure: IS_PROD, maxAge: 7 * 24 * 3600 * 1000, path: '/' };
const int = (v) => { const n = Number.parseInt(v, 10); return Number.isFinite(n) ? n : null; };
const str = (v, max = 5000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const bool = (v) => (v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0);
const err = (res, code, msg) => res.status(code).json({ error: msg });
const publicUser = (u) => u && ({ id: u.id, name: u.name, phone: u.phone, email: u.email, role: u.role, district: u.district, class_level: u.class_level });

// CSRF defence: mutating API requests must be JSON or multipart (not simple form posts) and same-origin.
app.use('/api', (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (origin && origin !== `${req.protocol}://${req.get('host')}`) return err(res, 403, 'Cross-origin request blocked');
  if (!req.is('application/json') && !req.is('multipart/form-data')) return err(res, 415, 'Unsupported content type');
  next();
});

app.use((req, res, next) => {
  const tok = req.cookies[COOKIE];
  if (tok) {
    try {
      const { uid } = jwt.verify(tok, JWT_SECRET);
      const u = db.prepare('SELECT * FROM users WHERE id=?').get(uid);
      if (u && !u.blocked) req.user = u;
    } catch { /* invalid token → anonymous */ }
  }
  next();
});
const auth = (req, res, next) => (req.user ? next() : err(res, 401, 'Please log in'));
const admin = (req, res, next) => (req.user?.role === 'admin' ? next() : err(res, 403, 'Admins only'));

function isEnrolled(userId, courseId) {
  if (!userId) return false;
  const e = db.prepare("SELECT 1 FROM enrollments WHERE user_id=? AND course_id=? AND (expires_at IS NULL OR expires_at > datetime('now'))").get(userId, courseId);
  return !!e;
}
const canAccess = (req, courseId, isPreview) => isPreview || req.user?.role === 'admin' || isEnrolled(req.user?.id, courseId);

function enroll(userId, courseId, orderId) {
  const c = db.prepare('SELECT validity_days FROM courses WHERE id=?').get(courseId);
  db.prepare(`INSERT INTO enrollments (user_id,course_id,order_id,expires_at) VALUES (?,?,?,datetime('now', ?))
    ON CONFLICT(user_id,course_id) DO UPDATE SET order_id=excluded.order_id, expires_at=excluded.expires_at`)
    .run(userId, courseId, orderId, `+${c.validity_days} days`);
}

// Convert YouTube/Vimeo links into privacy-friendly embed URLs; leave direct files as-is.
function embedUrl(url) {
  try {
    const u = new URL(url);
    if (!['http:', 'https:'].includes(u.protocol)) return null;
    if (/(^|\.)youtube\.com$/.test(u.hostname) && u.searchParams.get('v')) return { type: 'iframe', src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(u.searchParams.get('v'))}?rel=0&modestbranding=1` };
    if (u.hostname === 'youtu.be') return { type: 'iframe', src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(u.pathname.slice(1))}?rel=0&modestbranding=1` };
    if (/(^|\.)vimeo\.com$/.test(u.hostname)) return { type: 'iframe', src: `https://player.vimeo.com/video/${encodeURIComponent(u.pathname.split('/').filter(Boolean).pop())}` };
    return { type: 'video', src: u.href };
  } catch { return null; }
}

// ---------- auth ----------
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const PHONE_RE = /^[6-9]\d{9}$/;

app.post('/api/auth/register', authLimiter, (req, res) => {
  const name = str(req.body.name, 100), phone = str(req.body.phone, 10), password = str(req.body.password, 200);
  if (!name || !PHONE_RE.test(phone)) return err(res, 400, 'Enter your name and a valid 10-digit mobile number');
  if (password.length < 8) return err(res, 400, 'Password must be at least 8 characters');
  if (db.prepare('SELECT 1 FROM users WHERE phone=?').get(phone)) return err(res, 409, 'This mobile number is already registered');
  const r = db.prepare('INSERT INTO users (name,phone,email,password_hash,district,class_level) VALUES (?,?,?,?,?,?)')
    .run(name, phone, str(req.body.email, 200) || null, bcrypt.hashSync(password, 10), str(req.body.district, 100) || null, str(req.body.class_level, 20) || null);
  res.cookie(COOKIE, jwt.sign({ uid: Number(r.lastInsertRowid) }, JWT_SECRET, { expiresIn: '7d' }), cookieOpts);
  res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(r.lastInsertRowid)) });
});

app.post('/api/auth/login', authLimiter, (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE phone=?').get(str(req.body.phone, 10));
  if (!u || !bcrypt.compareSync(str(req.body.password, 200), u.password_hash)) return err(res, 401, 'Wrong mobile number or password');
  if (u.blocked) return err(res, 403, 'Your account has been blocked. Contact support.');
  res.cookie(COOKIE, jwt.sign({ uid: u.id }, JWT_SECRET, { expiresIn: '7d' }), cookieOpts);
  res.json({ user: publicUser(u) });
});
app.post('/api/auth/logout', (req, res) => { res.clearCookie(COOKIE, { path: '/' }); res.json({ ok: true }); });
app.get('/api/me', (req, res) => res.json({ user: publicUser(req.user) || null, paymentMode: PAYMENT_MODE, razorpayKey: PAYMENT_MODE === 'razorpay' ? RZP_KEY : null }));

// ---------- public catalogue ----------
app.get('/api/exams', (req, res) => res.json(db.prepare('SELECT * FROM exams ORDER BY id').all()));
app.get('/api/announcements', (req, res) => res.json(db.prepare('SELECT * FROM announcements ORDER BY id DESC LIMIT 10').all()));

app.get('/api/courses', (req, res) => {
  const exam = str(req.query.exam, 50), q = str(req.query.q, 100);
  let sql = `SELECT c.id,c.title,c.description,c.language,c.price,c.mrp,c.thumbnail,e.slug exam_slug,e.name exam_name,
    (SELECT COUNT(*) FROM lectures l WHERE l.course_id=c.id) lectures,
    (SELECT COUNT(*) FROM tests t WHERE t.course_id=c.id) tests,
    (SELECT COUNT(*) FROM materials m WHERE m.course_id=c.id) materials
    FROM courses c LEFT JOIN exams e ON e.id=c.exam_id WHERE c.published=1`;
  const p = [];
  if (exam) { sql += ' AND e.slug=?'; p.push(exam); }
  if (q) { sql += ' AND (c.title LIKE ? OR c.description LIKE ?)'; p.push(`%${q}%`, `%${q}%`); }
  res.json(db.prepare(sql + ' ORDER BY c.id DESC').all(...p));
});

app.get('/api/courses/:id', (req, res) => {
  const id = int(req.params.id);
  const c = db.prepare('SELECT c.*, e.name exam_name, e.slug exam_slug FROM courses c LEFT JOIN exams e ON e.id=c.exam_id WHERE c.id=?').get(id);
  if (!c || (!c.published && req.user?.role !== 'admin')) return err(res, 404, 'Course not found');
  const enrolled = req.user?.role === 'admin' || isEnrolled(req.user?.id, id);
  const lectures = db.prepare('SELECT id,title,duration_min,is_preview,video_url FROM lectures WHERE course_id=? ORDER BY position,id').all(id)
    .map((l) => ({ id: l.id, title: l.title, duration_min: l.duration_min, is_preview: l.is_preview, locked: !(enrolled || l.is_preview) }));
  const materials = db.prepare('SELECT id,title,is_preview FROM materials WHERE course_id=? ORDER BY id').all(id).map((m) => ({ ...m, locked: !(enrolled || m.is_preview) }));
  const tests = db.prepare('SELECT t.id,t.title,t.duration_min,t.is_preview,(SELECT COUNT(*) FROM questions q WHERE q.test_id=t.id) questions FROM tests t WHERE course_id=? ORDER BY id').all(id)
    .map((t) => ({ ...t, locked: !(enrolled || t.is_preview) }));
  res.json({ course: c, enrolled, lectures, materials, tests });
});

// ---------- protected content ----------
app.get('/api/lectures/:id', auth, (req, res) => {
  const l = db.prepare('SELECT * FROM lectures WHERE id=?').get(int(req.params.id));
  if (!l) return err(res, 404, 'Not found');
  if (!canAccess(req, l.course_id, l.is_preview)) return err(res, 403, 'Buy this course to watch');
  res.json({ id: l.id, title: l.title, course_id: l.course_id, player: embedUrl(l.video_url) });
});

app.get('/api/materials/:id/download', auth, (req, res) => {
  const m = db.prepare('SELECT * FROM materials WHERE id=?').get(int(req.params.id));
  if (!m) return err(res, 404, 'Not found');
  if (!canAccess(req, m.course_id, m.is_preview)) return err(res, 403, 'Buy this course to download');
  const file = path.join(UPLOAD_DIR, path.basename(m.file_name));
  if (!fs.existsSync(file)) return err(res, 404, 'File missing');
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(m.original_name)}"`);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Cache-Control', 'private, no-store');
  fs.createReadStream(file).pipe(res);
});

app.get('/api/tests/:id', auth, (req, res) => {
  const t = db.prepare('SELECT * FROM tests WHERE id=?').get(int(req.params.id));
  if (!t) return err(res, 404, 'Not found');
  if (!canAccess(req, t.course_id, t.is_preview)) return err(res, 403, 'Buy this course to attempt');
  const questions = db.prepare('SELECT id,text,options FROM questions WHERE test_id=? ORDER BY id').all(t.id).map((q) => ({ ...q, options: JSON.parse(q.options) }));
  res.json({ test: t, questions });
});

app.post('/api/tests/:id/submit', auth, (req, res) => {
  const t = db.prepare('SELECT * FROM tests WHERE id=?').get(int(req.params.id));
  if (!t) return err(res, 404, 'Not found');
  if (!canAccess(req, t.course_id, t.is_preview)) return err(res, 403, 'Forbidden');
  const answers = req.body.answers && typeof req.body.answers === 'object' ? req.body.answers : {};
  const qs = db.prepare('SELECT * FROM questions WHERE test_id=? ORDER BY id').all(t.id);
  let score = 0; const clean = {};
  const review = qs.map((q) => {
    const a = int(answers[q.id]); clean[q.id] = a;
    const correct = a === q.answer_index; if (correct) score++;
    return { id: q.id, text: q.text, options: JSON.parse(q.options), chosen: a, answer_index: q.answer_index, correct, explanation: q.explanation };
  });
  db.prepare('INSERT INTO attempts (user_id,test_id,score,total,answers) VALUES (?,?,?,?,?)').run(req.user.id, t.id, score, qs.length, JSON.stringify(clean));
  const rank = db.prepare('SELECT COUNT(DISTINCT user_id)+1 r FROM attempts WHERE test_id=? AND score>?').get(t.id, score).r;
  res.json({ score, total: qs.length, rank, review });
});

app.get('/api/my/courses', auth, (req, res) => {
  res.json(db.prepare(`SELECT c.id,c.title,c.language,e.name exam_name,en.expires_at FROM enrollments en JOIN courses c ON c.id=en.course_id
    LEFT JOIN exams e ON e.id=c.exam_id WHERE en.user_id=? ORDER BY en.created_at DESC`).all(req.user.id));
});
app.get('/api/my/attempts', auth, (req, res) => {
  res.json(db.prepare('SELECT a.id,a.score,a.total,a.created_at,t.title FROM attempts a JOIN tests t ON t.id=a.test_id WHERE a.user_id=? ORDER BY a.id DESC LIMIT 50').all(req.user.id));
});

// ---------- checkout ----------
function priceFor(course, code) {
  if (!code) return { amount: course.price, coupon: null };
  const cp = db.prepare('SELECT * FROM coupons WHERE code=? AND active=1 AND used<max_uses').get(code.toUpperCase());
  if (!cp) return { error: 'Invalid or expired coupon' };
  return { amount: Math.max(0, Math.round(course.price * (100 - cp.percent_off) / 100)), coupon: cp.code };
}

app.post('/api/checkout/quote', auth, (req, res) => {
  const c = db.prepare('SELECT * FROM courses WHERE id=? AND published=1').get(int(req.body.course_id));
  if (!c) return err(res, 404, 'Course not found');
  const p = priceFor(c, str(req.body.coupon, 30));
  if (p.error) return err(res, 400, p.error);
  res.json({ amount: p.amount, mrp: c.mrp, coupon: p.coupon });
});

app.post('/api/checkout/create', auth, async (req, res) => {
  const c = db.prepare('SELECT * FROM courses WHERE id=? AND published=1').get(int(req.body.course_id));
  if (!c) return err(res, 404, 'Course not found');
  if (isEnrolled(req.user.id, c.id)) return err(res, 409, 'You already have this course');
  const p = priceFor(c, str(req.body.coupon, 30));
  if (p.error) return err(res, 400, p.error);
  const orderId = Number(db.prepare('INSERT INTO orders (user_id,course_id,amount,coupon_code) VALUES (?,?,?,?)').run(req.user.id, c.id, p.amount, p.coupon).lastInsertRowid);

  if (p.amount === 0) { completeOrder(orderId, 'free'); return res.json({ status: 'paid' }); }
  if (PAYMENT_MODE === 'disabled') return err(res, 503, 'Payments are not configured');
  if (PAYMENT_MODE === 'mock') return res.json({ status: 'created', mode: 'mock', order_id: orderId, amount: p.amount });

  try {
    const r = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + Buffer.from(`${RZP_KEY}:${RZP_SECRET}`).toString('base64') },
      body: JSON.stringify({ amount: p.amount * 100, currency: 'INR', receipt: `order_${orderId}` }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error?.description || 'Razorpay error');
    db.prepare('UPDATE orders SET provider_order_id=? WHERE id=?').run(data.id, orderId);
    res.json({ status: 'created', mode: 'razorpay', order_id: orderId, rzp_order_id: data.id, amount: p.amount, key: RZP_KEY, name: req.user.name, phone: req.user.phone });
  } catch (e) {
    db.prepare("UPDATE orders SET status='failed' WHERE id=?").run(orderId);
    console.error(e); err(res, 502, 'Could not start payment, please try again');
  }
});

function completeOrder(orderId, paymentId) {
  const o = db.prepare('SELECT * FROM orders WHERE id=?').get(orderId);
  if (!o || o.status === 'paid') return o;
  db.exec('BEGIN');
  try {
    db.prepare("UPDATE orders SET status='paid', provider_payment_id=? WHERE id=?").run(paymentId, orderId);
    if (o.coupon_code) db.prepare('UPDATE coupons SET used=used+1 WHERE code=?').run(o.coupon_code);
    enroll(o.user_id, o.course_id, orderId);
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }
  return o;
}

app.post('/api/checkout/verify', auth, (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id=? AND user_id=?').get(int(req.body.order_id), req.user.id);
  if (!o) return err(res, 404, 'Order not found');
  if (PAYMENT_MODE === 'mock') { completeOrder(o.id, 'mock_' + Date.now()); return res.json({ status: 'paid' }); }
  if (PAYMENT_MODE !== 'razorpay') return err(res, 503, 'Payments are not configured');
  const { razorpay_payment_id: pid, razorpay_signature: sig } = req.body;
  const expected = crypto.createHmac('sha256', RZP_SECRET).update(`${o.provider_order_id}|${pid}`).digest('hex');
  const ok = typeof sig === 'string' && sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  if (!ok) { db.prepare("UPDATE orders SET status='failed' WHERE id=?").run(o.id); return err(res, 400, 'Payment verification failed'); }
  completeOrder(o.id, str(pid, 100));
  res.json({ status: 'paid' });
});

// ---------- admin ----------
const A = express.Router();
A.use(auth, admin);

A.get('/stats', (req, res) => {
  const one = (sql) => db.prepare(sql).get().v;
  res.json({
    students: one("SELECT COUNT(*) v FROM users WHERE role='student'"),
    courses: one('SELECT COUNT(*) v FROM courses'),
    enrollments: one('SELECT COUNT(*) v FROM enrollments'),
    revenue: one("SELECT COALESCE(SUM(amount),0) v FROM orders WHERE status='paid'"),
    revenue30: one("SELECT COALESCE(SUM(amount),0) v FROM orders WHERE status='paid' AND created_at > datetime('now','-30 days')"),
    attempts: one('SELECT COUNT(*) v FROM attempts'),
    topCourses: db.prepare("SELECT c.title, COUNT(o.id) sales, COALESCE(SUM(o.amount),0) revenue FROM courses c LEFT JOIN orders o ON o.course_id=c.id AND o.status='paid' GROUP BY c.id ORDER BY revenue DESC LIMIT 5").all(),
  });
});

A.get('/courses', (req, res) => res.json(db.prepare('SELECT c.*, e.name exam_name FROM courses c LEFT JOIN exams e ON e.id=c.exam_id ORDER BY c.id DESC').all()));
const courseFields = (b) => [int(b.exam_id), str(b.title, 200), str(b.description), str(b.language, 50) || 'Marathi', Math.max(0, int(b.price) || 0), Math.max(0, int(b.mrp) || 0), Math.max(1, int(b.validity_days) || 365), str(b.thumbnail, 500) || null, bool(b.published)];
A.post('/courses', (req, res) => {
  const f = courseFields(req.body); if (!f[1]) return err(res, 400, 'Title required');
  const r = db.prepare('INSERT INTO courses (exam_id,title,description,language,price,mrp,validity_days,thumbnail,published) VALUES (?,?,?,?,?,?,?,?,?)').run(...f);
  res.json({ id: Number(r.lastInsertRowid) });
});
A.put('/courses/:id', (req, res) => {
  const f = courseFields(req.body); if (!f[1]) return err(res, 400, 'Title required');
  db.prepare('UPDATE courses SET exam_id=?,title=?,description=?,language=?,price=?,mrp=?,validity_days=?,thumbnail=?,published=? WHERE id=?').run(...f, int(req.params.id));
  res.json({ ok: true });
});
A.delete('/courses/:id', (req, res) => {
  const id = int(req.params.id);
  if (db.prepare("SELECT 1 FROM orders WHERE course_id=? AND status='paid'").get(id)) return err(res, 409, 'Course has paid orders – unpublish it instead');
  db.prepare('DELETE FROM orders WHERE course_id=?').run(id);
  db.prepare('DELETE FROM courses WHERE id=?').run(id); res.json({ ok: true });
});

A.get('/courses/:id/content', (req, res) => {
  const id = int(req.params.id);
  res.json({
    lectures: db.prepare('SELECT * FROM lectures WHERE course_id=? ORDER BY position,id').all(id),
    materials: db.prepare('SELECT id,title,original_name,is_preview FROM materials WHERE course_id=?').all(id),
    tests: db.prepare('SELECT t.*,(SELECT COUNT(*) FROM questions q WHERE q.test_id=t.id) questions FROM tests t WHERE course_id=?').all(id),
  });
});
A.post('/courses/:id/lectures', (req, res) => {
  const b = req.body; const title = str(b.title, 200), url = str(b.video_url, 500);
  if (!title || !embedUrl(url)) return err(res, 400, 'Title and a valid http(s) video URL are required');
  db.prepare('INSERT INTO lectures (course_id,title,video_url,duration_min,is_preview,position) VALUES (?,?,?,?,?,?)')
    .run(int(req.params.id), title, url, int(b.duration_min) || 0, bool(b.is_preview), int(b.position) || 0);
  res.json({ ok: true });
});
A.delete('/lectures/:id', (req, res) => { db.prepare('DELETE FROM lectures WHERE id=?').run(int(req.params.id)); res.json({ ok: true }); });

const upload = multer({
  storage: multer.diskStorage({ destination: UPLOAD_DIR, filename: (req, file, cb) => cb(null, crypto.randomUUID() + '.pdf') }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, file.mimetype === 'application/pdf' && /\.pdf$/i.test(file.originalname)),
});
A.post('/courses/:id/materials', upload.single('file'), (req, res) => {
  if (!req.file) return err(res, 400, 'Please choose a PDF file');
  const head = Buffer.alloc(5); const fd = fs.openSync(req.file.path, 'r'); fs.readSync(fd, head, 0, 5, 0); fs.closeSync(fd);
  if (head.toString() !== '%PDF-') { fs.unlinkSync(req.file.path); return err(res, 400, 'File is not a valid PDF'); }
  db.prepare('INSERT INTO materials (course_id,title,file_name,original_name,is_preview) VALUES (?,?,?,?,?)')
    .run(int(req.params.id), str(req.body.title, 200) || req.file.originalname, req.file.filename, path.basename(req.file.originalname).slice(0, 200), bool(req.body.is_preview));
  res.json({ ok: true });
});
A.delete('/materials/:id', (req, res) => {
  const m = db.prepare('SELECT * FROM materials WHERE id=?').get(int(req.params.id));
  if (m) { fs.rmSync(path.join(UPLOAD_DIR, path.basename(m.file_name)), { force: true }); db.prepare('DELETE FROM materials WHERE id=?').run(m.id); }
  res.json({ ok: true });
});

A.post('/courses/:id/tests', (req, res) => {
  const title = str(req.body.title, 200); if (!title) return err(res, 400, 'Title required');
  const r = db.prepare('INSERT INTO tests (course_id,title,duration_min,is_preview) VALUES (?,?,?,?)').run(int(req.params.id), title, int(req.body.duration_min) || 30, bool(req.body.is_preview));
  res.json({ id: Number(r.lastInsertRowid) });
});
A.delete('/tests/:id', (req, res) => { db.prepare('DELETE FROM tests WHERE id=?').run(int(req.params.id)); res.json({ ok: true }); });
A.get('/tests/:id/questions', (req, res) => res.json(db.prepare('SELECT * FROM questions WHERE test_id=? ORDER BY id').all(int(req.params.id)).map((q) => ({ ...q, options: JSON.parse(q.options) }))));
A.post('/tests/:id/questions', (req, res) => {
  // Accepts one question or {bulk: [...]} for CSV-style import.
  const list = Array.isArray(req.body.bulk) ? req.body.bulk : [req.body];
  const ins = db.prepare('INSERT INTO questions (test_id,text,options,answer_index,explanation) VALUES (?,?,?,?,?)');
  let added = 0;
  for (const q of list.slice(0, 500)) {
    const opts = Array.isArray(q.options) ? q.options.map((o) => str(o, 500)).filter(Boolean).slice(0, 6) : [];
    const ai = int(q.answer_index);
    if (!str(q.text) || opts.length < 2 || ai === null || ai < 0 || ai >= opts.length) continue;
    ins.run(int(req.params.id), str(q.text), JSON.stringify(opts), ai, str(q.explanation) || null); added++;
  }
  if (!added) return err(res, 400, 'No valid questions (need text, 2+ options and a correct answer)');
  res.json({ added });
});
A.delete('/questions/:id', (req, res) => { db.prepare('DELETE FROM questions WHERE id=?').run(int(req.params.id)); res.json({ ok: true }); });

A.get('/users', (req, res) => {
  const q = `%${str(req.query.q, 50)}%`;
  res.json(db.prepare(`SELECT u.id,u.name,u.phone,u.email,u.role,u.district,u.class_level,u.blocked,u.created_at,
    (SELECT COUNT(*) FROM enrollments e WHERE e.user_id=u.id) courses FROM users u WHERE u.name LIKE ? OR u.phone LIKE ? ORDER BY u.id DESC LIMIT 200`).all(q, q));
});
A.put('/users/:id', (req, res) => {
  const id = int(req.params.id);
  if (id === req.user.id) return err(res, 400, 'You cannot change your own role/status');
  const role = req.body.role === 'admin' ? 'admin' : 'student';
  db.prepare('UPDATE users SET role=?, blocked=? WHERE id=?').run(role, bool(req.body.blocked), id); res.json({ ok: true });
});
A.post('/users/:id/grant', (req, res) => {
  const uid = int(req.params.id), cid = int(req.body.course_id);
  if (!db.prepare('SELECT 1 FROM users WHERE id=?').get(uid) || !db.prepare('SELECT 1 FROM courses WHERE id=?').get(cid)) return err(res, 404, 'User or course not found');
  enroll(uid, cid, null); res.json({ ok: true });
});
A.post('/users/:id/revoke', (req, res) => { db.prepare('DELETE FROM enrollments WHERE user_id=? AND course_id=?').run(int(req.params.id), int(req.body.course_id)); res.json({ ok: true }); });

A.get('/orders', (req, res) => res.json(db.prepare(`SELECT o.*, u.name user_name, u.phone, c.title course_title FROM orders o
  JOIN users u ON u.id=o.user_id JOIN courses c ON c.id=o.course_id ORDER BY o.id DESC LIMIT 300`).all()));

A.get('/coupons', (req, res) => res.json(db.prepare('SELECT * FROM coupons ORDER BY code').all()));
A.post('/coupons', (req, res) => {
  const code = str(req.body.code, 30).toUpperCase(), pct = int(req.body.percent_off);
  if (!/^[A-Z0-9]{3,30}$/.test(code) || !pct || pct < 1 || pct > 100) return err(res, 400, 'Code (A-Z, 0-9) and 1–100% required');
  db.prepare('INSERT INTO coupons (code,percent_off,max_uses,active) VALUES (?,?,?,1) ON CONFLICT(code) DO UPDATE SET percent_off=excluded.percent_off, max_uses=excluded.max_uses, active=1')
    .run(code, pct, Math.max(1, int(req.body.max_uses) || 100));
  res.json({ ok: true });
});
A.delete('/coupons/:code', (req, res) => { db.prepare('UPDATE coupons SET active=0 WHERE code=?').run(str(req.params.code, 30)); res.json({ ok: true }); });

A.post('/announcements', (req, res) => {
  const t = str(req.body.title, 200); if (!t) return err(res, 400, 'Title required');
  db.prepare('INSERT INTO announcements (title,body) VALUES (?,?)').run(t, str(req.body.body, 2000)); res.json({ ok: true });
});
A.delete('/announcements/:id', (req, res) => { db.prepare('DELETE FROM announcements WHERE id=?').run(int(req.params.id)); res.json({ ok: true }); });

app.use('/api/admin', A);
app.use('/api', (req, res) => err(res, 404, 'Not found'));

// ---------- static SPA ----------
app.use(express.static(path.join(__dirname, '..', 'public'), { index: 'index.html' }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));
app.use((e, req, res, next) => { console.error(e); err(res, 500, 'Something went wrong'); });

if (require.main === module) app.listen(PORT, () => console.log(`Vidyarthi Path running on http://localhost:${PORT} (payments: ${PAYMENT_MODE})`));
module.exports = app;
