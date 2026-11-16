// Website CMS: site settings, banners, FAQs, testimonials, static pages, exam catalogue, image uploads.
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const db = require('./db');

db.exec(`
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS banners (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, title_mr TEXT, subtitle TEXT, subtitle_mr TEXT, image_url TEXT, link TEXT, active INTEGER NOT NULL DEFAULT 1, position INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS faqs (id INTEGER PRIMARY KEY AUTOINCREMENT, q_en TEXT, q_mr TEXT, a_en TEXT, a_mr TEXT, position INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS testimonials (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, meta TEXT, text TEXT, rating INTEGER DEFAULT 5, photo_url TEXT, active INTEGER NOT NULL DEFAULT 1, position INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS pages (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT UNIQUE NOT NULL, title TEXT, title_mr TEXT, body TEXT, body_mr TEXT, in_footer INTEGER NOT NULL DEFAULT 1);
`);

// ---- field whitelists (types: text, int, bool, url, slug) ----
const COLLECTIONS = {
  banners: { title: 'text', title_mr: 'text', subtitle: 'text', subtitle_mr: 'text', image_url: 'url', link: 'url', active: 'bool', position: 'int' },
  faqs: { q_en: 'text', q_mr: 'text', a_en: 'text', a_mr: 'text', position: 'int' },
  testimonials: { name: 'text', meta: 'text', text: 'text', rating: 'int', photo_url: 'url', active: 'bool', position: 'int' },
  pages: { slug: 'slug', title: 'text', title_mr: 'text', body: 'text', body_mr: 'text', in_footer: 'bool' },
};
const SETTINGS = {
  brand_name: 'SchoolPariksha', brand_tagline: 'Navodaya, Scholarship & School Exam Preparation', logo_url: '',
  primary_color: '#1d3c78', accent_color: '#f2a007',
  hero_pill_en: 'Scholarship 4th & 7th · 2027 batch now open', hero_pill_mr: 'शिष्यवृत्ती ४ थी व ७ वी · २०२७ बॅच सुरू',
  hero_title_en: 'Exam preparation that speaks <em>your language</em>', hero_title_mr: 'तुमच्या भाषेत, <em>परीक्षेची</em> खरी तयारी',
  hero_lead_en: 'Navodaya, Maharashtra Scholarship, NMMS, Sainik School and Classes 1–12 for State Board, CBSE and ICSE. Short video lessons, printable notes and timed mock tests with a state-wide rank.',
  hero_lead_mr: 'नवोदय, शिष्यवृत्ती, NMMS, सैनिक स्कूल आणि इयत्ता १ ते १२ – राज्य मंडळ, CBSE व ICSE. छोटे व्हिडिओ धडे, नोट्स आणि राज्यस्तरीय रँकसह वेळबद्ध सराव चाचण्या.',
  footer_about_en: 'Affordable, high-quality exam preparation for every student in Maharashtra, in their own language.',
  footer_about_mr: 'महाराष्ट्रातील प्रत्येक विद्यार्थ्यासाठी त्याच्या भाषेत परवडणारी, दर्जेदार परीक्षा तयारी.',
  contact_phone: '', contact_whatsapp: '', contact_email: '', contact_address: '',
  social_youtube: '', social_instagram: '', social_facebook: '', social_telegram: '',
  show_stats: '1', show_testimonials: '1', show_features: '1',
  default_language: 'mr',
};
const HEX = /^#[0-9a-fA-F]{6}$/;
const safeUrl = (v) => { v = String(v ?? '').trim().slice(0, 500); if (!v) return ''; if (/^\/(?!\/)/.test(v) || /^https?:\/\//i.test(v) || /^#\//.test(v)) return v; return null; };
// Hero titles may contain <em> only; everything else is escaped on render, so strip any other tags here.
const emOnly = (v) => String(v ?? '').replace(/<(?!\/?em>)[^>]*>/gi, '').slice(0, 300);

function clean(fields, body) {
  const out = {};
  for (const [k, type] of Object.entries(fields)) {
    if (!(k in body)) continue;
    const v = body[k];
    if (type === 'int') out[k] = Number.parseInt(v, 10) || 0;
    else if (type === 'bool') out[k] = v === true || v === 1 || v === '1' || v === 'true' || v === 'on' ? 1 : 0;
    else if (type === 'url') { const u = safeUrl(v); if (u === null) throw new Error(`${k}: use an https:// link or a /path`); out[k] = u; }
    else if (type === 'slug') { const s = String(v).toLowerCase().trim(); if (!/^[a-z0-9-]{2,40}$/.test(s)) throw new Error('slug: use a-z, 0-9 and dashes'); out[k] = s; }
    else out[k] = String(v ?? '').slice(0, 20000);
  }
  return out;
}

function getSettings() {
  const rows = db.prepare('SELECT key,value FROM settings').all();
  const s = { ...SETTINGS }; rows.forEach((r) => { if (r.key in SETTINGS) s[r.key] = r.value; });
  return s;
}

// ---- seed defaults once ----
if (!db.prepare('SELECT COUNT(*) c FROM faqs').get().c) {
  const i = db.prepare('INSERT INTO faqs (q_en,q_mr,a_en,a_mr,position) VALUES (?,?,?,?,?)');
  [
    ['Which exams do you cover?', 'कोणत्या परीक्षांची तयारी करून घेता?', 'JNVST (Navodaya) Class 6 & 9, Maharashtra Scholarship (Class 4 & 7, the new pattern), NMMS, Sainik School (AISSEE), Olympiads, MTS, and the school syllabus for State Board, CBSE and ICSE.', 'नवोदय (JNVST) इ. ६ वी व ९ वी, महाराष्ट्र शिष्यवृत्ती (इ. ४ थी व ७ वी – नवीन पॅटर्न), NMMS, सैनिक स्कूल, ऑलिम्पियाड, MTS तसेच राज्य मंडळ, CBSE व ICSE शालेय अभ्यासक्रम.'],
    ['What language are the lectures in?', 'लेक्चर्स कोणत्या भाषेत आहेत?', 'Most courses are in Marathi, with English and semi-English medium options. Each course shows its language.', 'बहुतेक कोर्सेस मराठीत आहेत. इंग्रजी व सेमी-इंग्रजी माध्यमही उपलब्ध आहे.'],
    ['Can I watch on my phone?', 'मोबाईलवर पाहता येईल का?', 'Yes. Open the website in Chrome and tap "Install app" to add it to your home screen like an app.', 'हो! Chrome मध्ये वेबसाइट उघडा आणि "ॲप इन्स्टॉल करा" वर टॅप करा.'],
    ['How do I pay?', 'पैसे कसे भरायचे?', 'Pay securely with UPI (GPay, PhonePe, Paytm), debit/credit card or net-banking.', 'UPI (GPay, PhonePe, Paytm), डेबिट/क्रेडिट कार्ड किंवा नेट-बँकिंगने सुरक्षितपणे पैसे भरा.'],
  ].forEach((r, n) => i.run(...r, n));
}
if (!db.prepare('SELECT COUNT(*) c FROM pages').get().c) {
  const i = db.prepare('INSERT INTO pages (slug,title,title_mr,body,body_mr) VALUES (?,?,?,?,?)');
  i.run('contact', 'Contact us', 'संपर्क', 'Call or WhatsApp us, Monday–Saturday, 9am–7pm.\n\nEdit this page in **Admin → Website → Pages**.', 'सोमवार–शनिवार, सकाळी ९ ते सायं. ७.');
  i.run('privacy', 'Privacy policy', 'गोपनीयता धोरण', 'We collect your name, mobile number, class and district to provide our courses. We never sell your data.\n\nBecause our learners are children, we process data only with parental consent, as required by the Digital Personal Data Protection Act, 2023. To delete your data, contact support.', '');
  i.run('terms', 'Terms of use', 'अटी', 'Course content is for personal use by the registered student only. Sharing your login or recording or redistributing content is not allowed and may lead to your account being blocked.', '');
  i.run('refund', 'Refund policy', 'परतावा धोरण', 'Refunds are available within 7 days of purchase if less than 20% of the course has been watched. Contact support with your order number.', '');
  i.run('about', 'About us', 'आमच्याबद्दल', 'Tell your story here: who the teachers are, why you started, and your results.', '');
}

// ---- routes ----
function mount(app, { auth, admin, err, IMAGE_DIR }) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
  app.use('/media', express.static(IMAGE_DIR, { maxAge: '30d', setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff') }));

  // Everything the public site needs in one call.
  app.get('/api/site', (req, res) => {
    const one = (sql) => db.prepare(sql).get().v;
    res.json({
      settings: getSettings(),
      banners: db.prepare('SELECT * FROM banners WHERE active=1 ORDER BY position,id').all(),
      faqs: db.prepare('SELECT * FROM faqs ORDER BY position,id').all(),
      testimonials: db.prepare('SELECT * FROM testimonials WHERE active=1 ORDER BY position,id').all(),
      pages: db.prepare('SELECT slug,title,title_mr,in_footer FROM pages ORDER BY id').all(),
      stats: {
        courses: one('SELECT COUNT(*) v FROM courses WHERE published=1'),
        lectures: one('SELECT COUNT(*) v FROM lectures l JOIN courses c ON c.id=l.course_id WHERE c.published=1'),
        questions: one('SELECT COUNT(*) v FROM questions'),
        students: one("SELECT COUNT(*) v FROM users WHERE role='student'"),
        exams: one('SELECT COUNT(*) v FROM exams'),
      },
    });
  });
  app.get('/api/pages/:slug', (req, res) => {
    const p = db.prepare('SELECT * FROM pages WHERE slug=?').get(String(req.params.slug).slice(0, 40));
    return p ? res.json(p) : err(res, 404, 'Page not found');
  });
  // Dynamic PWA manifest so the installed app carries the current brand.
  app.get('/manifest.webmanifest', (req, res) => {
    const s = getSettings();
    res.type('application/manifest+json').json({
      name: s.brand_name, short_name: s.brand_name.slice(0, 12), description: s.brand_tagline, start_url: '/#/', scope: '/', display: 'standalone',
      orientation: 'portrait', background_color: '#f6f7fb', theme_color: HEX.test(s.primary_color) ? s.primary_color : '#1d3c78', lang: 'mr-IN',
      icons: [{ src: s.logo_url && s.logo_url.startsWith('/media/') ? s.logo_url : '/icon.svg', sizes: 'any', type: s.logo_url && s.logo_url.startsWith('/media/') ? undefined : 'image/svg+xml', purpose: 'any maskable' }],
    });
  });

  const A = express.Router();
  A.use(auth, admin);
  A.get('/settings', (req, res) => res.json(getSettings()));
  A.put('/settings', (req, res) => {
    const up = db.prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
    for (const [k, v] of Object.entries(req.body || {})) {
      if (!(k in SETTINGS)) continue;
      let val = String(v ?? '').slice(0, 2000);
      if (k.endsWith('_color') && !HEX.test(val)) return err(res, 400, `${k} must be a colour like #3b2fc9`);
      if (k === 'logo_url' || k.startsWith('social_')) { const u = safeUrl(val); if (u === null) return err(res, 400, `${k}: use an https:// link`); val = u; }
      if (k.startsWith('hero_title')) val = emOnly(val);
      if (k === 'default_language' && !['mr', 'en'].includes(val)) continue;
      up.run(k, val);
    }
    res.json(getSettings());
  });

  for (const [name, fields] of Object.entries(COLLECTIONS)) {
    const order = 'position' in fields ? 'position,id' : 'id';
    A.get(`/cms/${name}`, (req, res) => res.json(db.prepare(`SELECT * FROM ${name} ORDER BY ${order}`).all()));
    A.post(`/cms/${name}`, (req, res) => {
      try {
        const f = clean(fields, req.body || {}); const k = Object.keys(f);
        if (!k.length) return err(res, 400, 'Nothing to save');
        const r = db.prepare(`INSERT INTO ${name} (${k.join(',')}) VALUES (${k.map(() => '?').join(',')})`).run(...Object.values(f));
        res.json({ id: Number(r.lastInsertRowid) });
      } catch (e) { err(res, 400, /UNIQUE/.test(e.message) ? 'That slug is already used' : e.message); }
    });
    A.put(`/cms/${name}/:id`, (req, res) => {
      try {
        const f = clean(fields, req.body || {}); const k = Object.keys(f);
        if (!k.length) return err(res, 400, 'Nothing to save');
        db.prepare(`UPDATE ${name} SET ${k.map((x) => x + '=?').join(',')} WHERE id=?`).run(...Object.values(f), Number(req.params.id));
        res.json({ ok: true });
      } catch (e) { err(res, 400, /UNIQUE/.test(e.message) ? 'That slug is already used' : e.message); }
    });
    A.delete(`/cms/${name}/:id`, (req, res) => { db.prepare(`DELETE FROM ${name} WHERE id=?`).run(Number(req.params.id)); res.json({ ok: true }); });
  }

  // Exam catalogue editing
  const examFields = { name: 'text', name_mr: 'text', category: 'text', icon: 'text', description: 'text', position: 'int', slug: 'slug' };
  const CATS = ['entrance', 'scholarship', 'olympiad', 'school'];
  const examBody = (b) => { const f = clean(examFields, b); if ('category' in f && !CATS.includes(f.category)) throw new Error('Invalid category'); if ('icon' in f) f.icon = f.icon.slice(0, 8); if ('name' in f && !f.name.trim()) throw new Error('Name required'); return f; };
  A.post('/exams', (req, res) => {
    try { const f = examBody(req.body || {}); if (!f.slug || !f.name) return err(res, 400, 'Name and slug required'); const k = Object.keys(f);
      res.json({ id: Number(db.prepare(`INSERT INTO exams (${k.join(',')}) VALUES (${k.map(() => '?').join(',')})`).run(...Object.values(f)).lastInsertRowid) });
    } catch (e) { err(res, 400, /UNIQUE/.test(e.message) ? 'That slug is already used' : e.message); }
  });
  A.put('/exams/:id', (req, res) => {
    try { const f = examBody(req.body || {}); delete f.slug; const k = Object.keys(f); if (!k.length) return err(res, 400, 'Nothing to save');
      db.prepare(`UPDATE exams SET ${k.map((x) => x + '=?').join(',')} WHERE id=?`).run(...Object.values(f), Number(req.params.id)); res.json({ ok: true });
    } catch (e) { err(res, 400, e.message); }
  });
  A.delete('/exams/:id', (req, res) => {
    const id = Number(req.params.id);
    if (db.prepare('SELECT 1 FROM courses WHERE exam_id=?').get(id)) return err(res, 409, 'Move or delete this exam’s courses first');
    db.prepare('DELETE FROM exams WHERE id=?').run(id); res.json({ ok: true });
  });

  // Image upload (banners, logo, course thumbnails, testimonial photos). SVG is not allowed (script risk).
  const SIGS = [['png', [0x89, 0x50, 0x4e, 0x47]], ['jpg', [0xff, 0xd8, 0xff]], ['gif', [0x47, 0x49, 0x46, 0x38]], ['webp', [0x52, 0x49, 0x46, 0x46]]];
  const img = multer({ storage: multer.memoryStorage(), limits: { fileSize: 3 * 1024 * 1024 } });
  A.post('/images', img.single('file'), (req, res) => {
    const buf = req.file?.buffer; if (!buf) return err(res, 400, 'Choose an image (PNG, JPG, WEBP or GIF, max 3 MB)');
    const hit = SIGS.find(([, sig]) => sig.every((b, i) => buf[i] === b));
    if (!hit || (hit[0] === 'webp' && buf.slice(8, 12).toString() !== 'WEBP')) return err(res, 400, 'Only PNG, JPG, WEBP or GIF images are allowed');
    const name = crypto.randomUUID() + '.' + hit[0];
    fs.writeFileSync(path.join(IMAGE_DIR, name), buf);
    res.json({ url: '/media/' + name });
  });
  app.use('/api/admin', A);
}

module.exports = { mount, getSettings, safeUrl };
