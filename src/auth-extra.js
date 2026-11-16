// Google sign-in, OTP login / password reset, profile & consent.
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const db = require('./db');

const cols = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
for (const [c, d] of [['google_sub', 'TEXT'], ['avatar_url', 'TEXT'], ['consent_at', 'TEXT'], ['phone_verified', 'INTEGER NOT NULL DEFAULT 0']]) if (!cols.includes(c)) db.exec(`ALTER TABLE users ADD COLUMN ${c} ${d}`);
db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google ON users(google_sub) WHERE google_sub IS NOT NULL;
CREATE TABLE IF NOT EXISTS otps (phone TEXT PRIMARY KEY, code_hash TEXT NOT NULL, expires_at INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, sent_at INTEGER NOT NULL);`);

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const JWKS_URL = process.env.GOOGLE_JWKS_URL || 'https://www.googleapis.com/oauth2/v3/certs';
const IS_PROD = process.env.NODE_ENV === 'production';
const PHONE_RE = /^[6-9]\d{9}$/;
// Google-only accounts get a placeholder until the user adds a mobile number.
const placeholderPhone = (sub) => 'g' + crypto.createHash('sha256').update(sub).digest('hex').slice(0, 15);
const hasRealPhone = (u) => PHONE_RE.test(u.phone);

let jwks = { keys: [], at: 0 };
async function googleKey(kid) {
  if (!jwks.keys.find((k) => k.kid === kid) || Date.now() - jwks.at > 6 * 3600e3) {
    const r = await fetch(JWKS_URL); if (!r.ok) throw new Error('Could not reach Google');
    jwks = { keys: (await r.json()).keys || [], at: Date.now() };
  }
  const k = jwks.keys.find((x) => x.kid === kid); if (!k) throw new Error('Unknown Google key');
  return crypto.createPublicKey({ key: k, format: 'jwk' });
}
async function verifyGoogle(idToken) {
  const dec = jwt.decode(idToken, { complete: true });
  if (!dec?.header?.kid) throw new Error('Invalid Google token');
  const key = await googleKey(dec.header.kid);
  const p = jwt.verify(idToken, key, { algorithms: ['RS256'], audience: GOOGLE_CLIENT_ID, issuer: ['accounts.google.com', 'https://accounts.google.com'] });
  if (!p.email_verified) throw new Error('Google email is not verified');
  return p;
}

async function sendSms(phone, code) {
  // MSG91 OTP API. Set MSG91_AUTH_KEY + MSG91_TEMPLATE_ID (DLT-approved template with ##OTP##).
  if (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) {
    const r = await fetch(`https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(process.env.MSG91_TEMPLATE_ID)}&mobile=91${phone}&otp=${code}`, { method: 'POST', headers: { authkey: process.env.MSG91_AUTH_KEY, 'Content-Type': 'application/json' }, body: '{}' });
    if (!r.ok) throw new Error('SMS could not be sent, try again');
    return 'sms';
  }
  if (IS_PROD) throw new Error('SMS is not configured');
  console.log(`[dev] OTP for ${phone}: ${code}`);
  return 'dev';
}

function mount(app, { err, setSession, publicUser, auth }) {
  const str = (v, m = 200) => (typeof v === 'string' ? v.trim().slice(0, m) : '');
  const limiter = rateLimit({ windowMs: 15 * 60e3, limit: 20, standardHeaders: true, legacyHeaders: false });
  const otpLimiter = rateLimit({ windowMs: 60 * 60e3, limit: 8, standardHeaders: true, legacyHeaders: false });

  app.get('/api/auth/config', (req, res) => res.json({ google_client_id: GOOGLE_CLIENT_ID || null, sms: !!process.env.MSG91_AUTH_KEY || !IS_PROD }));

  app.post('/api/auth/google', limiter, async (req, res) => {
    if (!GOOGLE_CLIENT_ID) return err(res, 503, 'Google sign-in is not configured');
    let p; try { p = await verifyGoogle(str(req.body.credential, 4096)); } catch (e) { return err(res, 401, e.message || 'Google sign-in failed'); }
    let u = db.prepare('SELECT * FROM users WHERE google_sub=?').get(p.sub)
      || db.prepare('SELECT * FROM users WHERE lower(email)=lower(?) AND google_sub IS NULL').get(p.email);
    if (u) {
      if (u.blocked) return err(res, 403, 'Your account has been blocked. Contact support.');
      db.prepare('UPDATE users SET google_sub=?, email=COALESCE(email,?), avatar_url=? WHERE id=?').run(p.sub, p.email, p.picture || null, u.id);
    } else {
      const r = db.prepare('INSERT INTO users (name,phone,email,password_hash,google_sub,avatar_url) VALUES (?,?,?,?,?,?)')
        .run(str(p.name, 100) || p.email.split('@')[0], placeholderPhone(p.sub), p.email, bcrypt.hashSync(crypto.randomBytes(24).toString('hex'), 8), p.sub, p.picture || null);
      u = { id: Number(r.lastInsertRowid) };
    }
    u = db.prepare('SELECT * FROM users WHERE id=?').get(u.id);
    setSession(res, u.id);
    res.json({ user: publicUser(u), needs_profile: !hasRealPhone(u) || !u.consent_at });
  });

  // OTP: login (existing account) or reset password
  app.post('/api/auth/otp/request', otpLimiter, async (req, res) => {
    const phone = str(req.body.phone, 10);
    if (!PHONE_RE.test(phone)) return err(res, 400, 'Enter a valid 10-digit mobile number');
    const prev = db.prepare('SELECT sent_at FROM otps WHERE phone=?').get(phone);
    if (prev && Date.now() - prev.sent_at < 45e3) return err(res, 429, 'Please wait a few seconds before requesting another OTP');
    const exists = !!db.prepare('SELECT 1 FROM users WHERE phone=?').get(phone);
    // Same response whether or not the number is registered (prevents account enumeration), but only send SMS to real accounts.
    const code = String(crypto.randomInt(100000, 1000000));
    db.prepare('INSERT INTO otps (phone,code_hash,expires_at,attempts,sent_at) VALUES (?,?,?,0,?) ON CONFLICT(phone) DO UPDATE SET code_hash=excluded.code_hash, expires_at=excluded.expires_at, attempts=0, sent_at=excluded.sent_at')
      .run(phone, bcrypt.hashSync(code, 8), Date.now() + 10 * 60e3, Date.now());
    let mode = 'sms';
    if (exists) { try { mode = await sendSms(phone, code); } catch (e) { return err(res, 502, e.message); } }
    res.json({ ok: true, ...(mode === 'dev' && !IS_PROD ? { dev_code: code } : {}) });
  });
  app.post('/api/auth/otp/verify', limiter, (req, res) => {
    const phone = str(req.body.phone, 10), code = str(req.body.code, 6), np = str(req.body.new_password, 200);
    const o = db.prepare('SELECT * FROM otps WHERE phone=?').get(phone);
    const u = db.prepare('SELECT * FROM users WHERE phone=?').get(phone);
    if (!o || o.expires_at < Date.now() || o.attempts >= 5 || !u) return err(res, 400, 'OTP expired or invalid. Request a new one.');
    if (!bcrypt.compareSync(code, o.code_hash)) { db.prepare('UPDATE otps SET attempts=attempts+1 WHERE phone=?').run(phone); return err(res, 400, 'Wrong OTP'); }
    db.prepare('DELETE FROM otps WHERE phone=?').run(phone);
    if (u.blocked) return err(res, 403, 'Your account has been blocked. Contact support.');
    if (np) { if (np.length < 8) return err(res, 400, 'Password must be at least 8 characters'); db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(np, 10), u.id); }
    db.prepare('UPDATE users SET phone_verified=1 WHERE id=?').run(u.id);
    setSession(res, u.id);
    res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(u.id)) });
  });

  // Profile
  app.put('/api/me', auth, (req, res) => {
    const name = str(req.body.name, 100), email = 'email' in req.body ? str(req.body.email, 200) : (req.user.email || ''), phone = str(req.body.phone, 10);
    if (!name) return err(res, 400, 'Name is required');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return err(res, 400, 'Enter a valid email');
    let newPhone = req.user.phone;
    if (phone && phone !== req.user.phone) {
      if (!PHONE_RE.test(phone)) return err(res, 400, 'Enter a valid 10-digit mobile number');
      if (db.prepare('SELECT 1 FROM users WHERE phone=? AND id<>?').get(phone, req.user.id)) return err(res, 409, 'This mobile number is already registered. Log in with it instead.');
      newPhone = phone;
    }
    if (!PHONE_RE.test(newPhone)) return err(res, 400, 'Please add your mobile number');
    const consent = req.body.consent === true || req.user.consent_at;
    if (!consent) return err(res, 400, 'Parent/guardian consent is required');
    db.prepare(`UPDATE users SET name=?, email=?, phone=?, class_level=?, district=?, consent_at=COALESCE(consent_at, CASE WHEN ? THEN datetime('now') END), phone_verified=CASE WHEN phone<>? THEN 0 ELSE phone_verified END WHERE id=?`)
      .run(name, email || null, newPhone, str(req.body.class_level, 5) || null, str(req.body.district, 100) || null, consent ? 1 : 0, newPhone, req.user.id);
    res.json({ user: publicUser(db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id)) });
  });
  app.put('/api/me/password', auth, (req, res) => {
    const cur = str(req.body.current, 200), np = str(req.body.new_password, 200);
    if (np.length < 8) return err(res, 400, 'New password must be at least 8 characters');
    if (!req.user.google_sub || hasRealPhone(req.user)) { if (!req.user.google_sub && !bcrypt.compareSync(cur, req.user.password_hash)) return err(res, 400, 'Current password is wrong'); }
    db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(np, 10), req.user.id);
    res.json({ ok: true });
  });
}
module.exports = { mount, hasRealPhone };
