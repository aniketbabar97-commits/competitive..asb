// SQLite data layer using Node's built-in node:sqlite (Node >= 22.13).
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(path.join(DATA_DIR, 'app.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','admin')),
  district TEXT,
  class_level TEXT,
  blocked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS exams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_mr TEXT,
  category TEXT NOT NULL DEFAULT 'entrance',
  icon TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  description TEXT
);
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id INTEGER REFERENCES exams(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  language TEXT NOT NULL DEFAULT 'Marathi',
  board TEXT NOT NULL DEFAULT 'All',
  class_level TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  price INTEGER NOT NULL DEFAULT 0,       -- in rupees
  mrp INTEGER NOT NULL DEFAULT 0,
  validity_days INTEGER NOT NULL DEFAULT 365,
  thumbnail TEXT,
  published INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS lectures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  duration_min INTEGER DEFAULT 0,
  is_preview INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,          -- stored name on disk (random)
  original_name TEXT NOT NULL,
  is_preview INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 30,
  is_preview INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  options TEXT NOT NULL,            -- JSON array of strings
  answer_index INTEGER NOT NULL,
  explanation TEXT
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  course_id INTEGER NOT NULL REFERENCES courses(id),
  amount INTEGER NOT NULL,
  coupon_code TEXT,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created','paid','failed','refunded')),
  provider_order_id TEXT,
  provider_payment_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS enrollments (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  order_id INTEGER REFERENCES orders(id),
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, course_id)
);
CREATE TABLE IF NOT EXISTS coupons (
  code TEXT PRIMARY KEY,
  percent_off INTEGER NOT NULL CHECK (percent_off BETWEEN 1 AND 100),
  max_uses INTEGER NOT NULL DEFAULT 100,
  used INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  answers TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS lecture_progress (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lecture_id INTEGER NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, lecture_id)
);
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT, phone TEXT NOT NULL, class_level TEXT, message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

function addColumn(table, col, def) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
  if (!cols.includes(col)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
}
addColumn('exams', 'category', "TEXT NOT NULL DEFAULT 'entrance'");
addColumn('exams', 'icon', 'TEXT');
addColumn('exams', 'position', 'INTEGER NOT NULL DEFAULT 0');
addColumn('courses', 'board', "TEXT NOT NULL DEFAULT 'All'");
addColumn('courses', 'class_level', 'TEXT');
addColumn('courses', 'featured', 'INTEGER NOT NULL DEFAULT 0');

// Exam catalogue. Upserted on every boot so new exams appear; admins can edit descriptions later.
const EXAMS = [
  // slug, name, name_mr, category, icon, description
  ['jnvst-6', 'JNVST Class 6 (Navodaya)', 'नवोदय प्रवेश परीक्षा – इ. ६ वी', 'entrance', '🏫', 'For Class 5 students. 80 MCQs, 100 marks, 2 hours: Mental Ability 40 Q (50 marks), Arithmetic 20 Q (25), Language 20 Q (25). No negative marking. ~25 lakh applicants for ~47,000 seats.'],
  ['jnvst-9', 'JNVST Class 9 (Navodaya)', 'नवोदय प्रवेश परीक्षा – इ. ९ वी', 'entrance', '🏫', 'Lateral entry for Class 8 students: English, Hindi, Mathematics and Science.'],
  ['mh-scholarship-4', 'Maharashtra Scholarship – Class 4', 'शिष्यवृत्ती परीक्षा – इ. ४ थी', 'scholarship', '🏅', 'New from 2025-26 (replaces Class 5). MSCE Pune. Paper 1: First Language + Mathematics; Paper 2: Third Language (English) + Intelligence Test. Scholarship ₹5,000/year.'],
  ['mh-scholarship-7', 'Maharashtra Scholarship – Class 7', 'शिष्यवृत्ती परीक्षा – इ. ७ वी', 'scholarship', '🏅', 'New from 2025-26 (replaces Class 8). MSCE Pune. Same two-paper pattern at upper-primary level. Scholarship ₹7,500/year.'],
  ['mh-scholarship-5', 'Maharashtra Scholarship – Class 5 (PUP)', 'शिष्यवृत्ती परीक्षा – इ. ५ वी', 'scholarship', '🏅', 'Legacy pattern (last held Feb 2026, ~5.5 lakh appeared in 2025). Useful for previous-year papers.'],
  ['mh-scholarship-8', 'Maharashtra Scholarship – Class 8 (PSS)', 'शिष्यवृत्ती परीक्षा – इ. ८ वी', 'scholarship', '🏅', 'Legacy pattern (last held Feb 2026, ~3.7 lakh appeared in 2025). Useful for previous-year papers.'],
  ['nmms', 'NMMS (Class 8)', 'एन.एम.एम.एस. – इ. ८ वी', 'scholarship', '🎖️', 'National Means-cum-Merit Scholarship: MAT (90 Q) + SAT (90 Q). ₹12,000/year for Classes 9–12.'],
  ['aissee', 'Sainik School (AISSEE)', 'सैनिक स्कूल प्रवेश परीक्षा', 'entrance', '🎯', 'NTA exam for Class 6 and 9 admission to Sainik Schools. 2 lakh+ candidates.'],
  ['olympiad', 'Olympiads (SOF / NSO / IMO)', 'ऑलिम्पियाड', 'olympiad', '🧠', 'Science, Maths, English and Reasoning Olympiads for Classes 1–10.'],
  ['mts-ntse', 'MTS / BDS / State Talent Search', 'एम.टी.एस. / प्रज्ञाशोध', 'olympiad', '💡', 'Popular Maharashtra talent-search exams for Classes 2–9.'],
  ['ssc-board', 'Maharashtra State Board (SSC)', 'महाराष्ट्र राज्य मंडळ', 'school', '📗', 'Classes 1–10 state-board syllabus in Marathi & semi-English medium. ~16 lakh SSC candidates a year.'],
  ['cbse', 'CBSE', 'सी.बी.एस.ई.', 'school', '📘', 'NCERT-based syllabus, Classes 1–12. ~25 lakh Class 10 candidates in 2026.'],
  ['icse', 'ICSE / CISCE', 'आय.सी.एस.ई.', 'school', '📙', 'CISCE syllabus, Classes 1–10 (ICSE) and 11–12 (ISC).'],
];

function seed() {
  const up = db.prepare(`INSERT INTO exams (slug,name,name_mr,category,icon,description,position) VALUES (?,?,?,?,?,?,?)
    ON CONFLICT(slug) DO UPDATE SET category=excluded.category, icon=excluded.icon, position=excluded.position, name_mr=excluded.name_mr`);
  EXAMS.forEach((e, i) => up.run(...e, i));
  const admins = db.prepare("SELECT COUNT(*) c FROM users WHERE role='admin'").get().c;
  if (!admins) {
    const phone = process.env.ADMIN_PHONE || '9999999999';
    const pw = process.env.ADMIN_PASSWORD || 'admin@123';
    db.prepare("INSERT INTO users (name,phone,password_hash,role) VALUES (?,?,?,'admin')")
      .run('Administrator', phone, bcrypt.hashSync(pw, 10));
    if (!process.env.ADMIN_PASSWORD) console.warn(`[seed] Admin created: phone ${phone} / password ${pw} — CHANGE THIS before going live.`);
  }
  const courses = db.prepare('SELECT COUNT(*) c FROM courses').get().c;
  if (!courses) {
    const jnv = db.prepare("SELECT id FROM exams WHERE slug='jnvst-6'").get().id;
    const sch = db.prepare("SELECT id FROM exams WHERE slug='mh-scholarship-4'").get().id;
    const cb = db.prepare("SELECT id FROM exams WHERE slug='cbse'").get().id;
    const ic = db.prepare('INSERT INTO courses (exam_id,title,description,language,price,mrp,board,class_level,featured,published) VALUES (?,?,?,?,?,?,?,?,?,1)');
    const c1 = ic.run(jnv, 'Navodaya Complete Batch 2027', 'Full JNVST Class 6 preparation: Mental Ability, Arithmetic and Language with 40+ video lectures, PDF notes and 10 full mock tests.', 'Marathi + Hindi', 1499, 2999, 'All', '5', 1).lastInsertRowid;
    const c2 = ic.run(sch, 'Shishyavrutti 4th – Complete Course', 'इयत्ता ४ थी शिष्यवृत्ती (नवीन पॅटर्न) – Marathi, Maths, English and Buddhimatta with practice papers.', 'Marathi', 999, 1999, 'State', '4', 1).lastInsertRowid;
    ic.run(jnv, 'Free Navodaya Demo Class', 'Try our teaching style for free.', 'Marathi', 0, 0, 'All', '5', 0);
    ic.run(cb, 'CBSE Class 10 Maths – Full Year', 'Chapter-wise NCERT lectures, solved exemplar and sample papers.', 'English', 1999, 3999, 'CBSE', '10', 1);
    const il = db.prepare('INSERT INTO lectures (course_id,title,video_url,duration_min,is_preview,position) VALUES (?,?,?,?,?,?)');
    il.run(c1, 'Introduction to JNVST & exam pattern', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 12, 1, 1);
    il.run(c1, 'Mental Ability – Odd one out', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 35, 0, 2);
    il.run(c2, 'बुद्धिमत्ता चाचणी – संख्यामालिका', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 28, 1, 1);
    const t = db.prepare('INSERT INTO tests (course_id,title,duration_min,is_preview) VALUES (?,?,?,1)').run(c1, 'Mini Mock Test – Arithmetic', 10).lastInsertRowid;
    const iq = db.prepare('INSERT INTO questions (test_id,text,options,answer_index,explanation) VALUES (?,?,?,?,?)');
    iq.run(t, 'What is 25% of 240?', JSON.stringify(['40', '60', '80', '120']), 1, '240 × 25/100 = 60');
    iq.run(t, 'Which is the smallest prime number?', JSON.stringify(['0', '1', '2', '3']), 2, '2 is the only even prime and the smallest.');
    iq.run(t, 'LCM of 4 and 6 is', JSON.stringify(['12', '24', '2', '10']), 0, 'Multiples of 4: 4,8,12…; of 6: 6,12… → 12');
    db.prepare('INSERT INTO coupons (code,percent_off,max_uses) VALUES (?,?,?)').run('NAVODAYA20', 20, 500);
    db.prepare('INSERT INTO announcements (title,body) VALUES (?,?)').run('Welcome!', 'JNVST 2027 registration window is expected soon – check navodaya.gov.in regularly.');
  }
}
seed();

module.exports = db;
