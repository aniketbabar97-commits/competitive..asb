# Market research & product strategy: Navodaya + Maharashtra Scholarship prep

> Based on general market knowledge as of late 2026. **Check exam patterns and dates against the official notices** (navodaya.gov.in, mscepune.in) before you publish content.

## 1. Target exams

| Exam | Conducted by | Who takes it | Pattern (verify each year) |
|---|---|---|---|
| **JNVST Class 6** | Navodaya Vidyalaya Samiti | Students in Class 5, mostly rural | 80 MCQs / 100 marks / 2 hrs: Mental Ability 40 Q (50 marks), Arithmetic 20 Q (25), Language 20 Q (25). No negative marking. Offered in about 20 languages, including Marathi. |
| **JNVST Class 9** | NVS | Students in Class 8 (lateral entry) | English, Hindi, Maths and Science |
| **MH Scholarship 5th (PUP)** | MSCE Pune | Class 5 | Paper 1: First Language + Maths. Paper 2: Third Language (English) + Intelligence (बुद्धिमत्ता) |
| **MH Scholarship 8th (PSS)** | MSCE Pune | Class 8 | Same structure at Class 8 level |
| **NMMS** | MSCE (for the state) | Class 8 | MAT + SAT. ₹12,000/yr scholarship, family income limit applies |

**Market size (rough):** about 25–30 lakh students apply for JNVST nationally each year, and about 5–6 lakh sit the Maharashtra scholarship exams. Parents in Tier-2/3 towns and villages want *Marathi-medium*, affordable and mobile-first prep.

## 2. Competitors
- **Big platforms** (Unacademy, PW/Physics Wallah, Adda247, Testbook): they barely cover these exams, have very little Marathi content, and are built around older students.
- **YouTube teachers** (many Marathi channels with lakhs of subscribers): free and trusted, but unstructured with no tests. These are your best *partners/faculty*, not competitors.
- **Local coaching classes and printed guides** (Navneet, Sahyadri, Target Publications): ₹3,000–15,000/yr offline. Guides cost ₹200–500.
- **Teachable/Graphy/Classplus white-label apps**: many teachers already sell through these, paying a commission and getting generic UX.

**Gap:** a Marathi-first, exam-specific platform with lots of mock tests, priced for rural parents (₹499–₹1,999/yr), that works well on cheap Android phones over 3G/4G.

## 3. Product recommendations (prioritised)
1. **Mock tests are the core product.** Parents pay for practice and a rank. Add state- and district-level leaderboards, OMR-style practice, and a full-length weekly "all-Maharashtra test".
2. **Bilingual content:** Marathi first, then Hindi and English. The UI already uses Devanagari-friendly fonts.
3. **Phone + OTP login** (MSG91/Twilio). Parents often share a single phone.
4. **UPI-first payments** with Razorpay or Cashfree. UPI/QR cost about 0–2% in fees. Add EMI or a "pay later" option for higher-priced batches.
5. **Video hosting:** start with *unlisted YouTube* (free; already supported). At scale, move to **Bunny Stream / VdoCipher / Mux** for DRM, watermarking and anti-download (VdoCipher is widely used by Indian ed-tech).
6. **Android app:** most users will be on Android. Wrap the site as a PWA or TWA first, then build a native app with Flutter or React Native.
7. **Live classes and doubt solving:** YouTube Live or Zoom at first. Add a WhatsApp group per batch, which is how this audience actually communicates.
8. **Printed material add-on:** ship printed notes and question banks through Shiprocket. This is a high-margin upsell.
9. **Teacher/affiliate program:** give school teachers referral coupons with a 10–20% commission. This is the main way to get into village schools.
10. **Parent dashboard:** weekly SMS/WhatsApp progress reports.

## 4. Monetisation
- Full-year batch: ₹999–₹2,499. Crash course: ₹499–₹999. Test series only: ₹199–₹499. Single PDF pack: ₹49–₹149.
- Free demo lectures and one free mock test per course for lead generation (already supported via the "free preview" flags).
- Coupons for festivals, early-bird pricing and school bulk deals (already supported).

## 5. Legal and compliance checklist
- GST registration. Online education is taxable at 18%, with limited exemptions, so check with a CA. Issue invoices.
- DPDP Act 2023: the users are **children**, so you need *verifiable parental consent*, no tracking or behavioural ads, and a privacy policy. Collect only the minimum data.
- Terms, refund policy, privacy policy and a grievance officer contact. These are required by Razorpay and the IT Rules.
- Don't use the NVS or MSCE logos, and don't imply official affiliation.
- Copyright: only original questions, or previous-year papers (which are public); don't copy guide books.

## 6. Recommended production architecture
- **Now (MVP, this repo):** Node/Express + SQLite on a single ₹500–1,500/month VPS (Hetzner, DigitalOcean BLR, Lightsail Mumbai) behind Cloudflare.
- **At about 10k students:** move to Postgres (Supabase/Neon/RDS), S3/R2 for PDFs, Bunny/VdoCipher for video, and Redis for sessions and leaderboards.
- **Ops:** daily DB backups, uptime monitoring, error tracking (Sentry).

## 7. Roadmap
| Phase | Scope |
|---|---|
| ✅ MVP (done) | Catalogue by exam, courses, lectures, PDFs, timed mock tests with auto-scoring and rank, Razorpay checkout, coupons, admin panel (courses/content/questions/CSV import/users/orders/coupons/announcements) |
| Phase 2 | OTP login, GST invoices, Marathi UI toggle, DRM video, PWA install, WhatsApp notifications |
| Phase 3 | Android app, live classes, doubt forum, all-Maharashtra test series with district ranks, affiliate dashboard |
| Phase 4 | Multi-teacher marketplace (teachers upload and earn a revenue share), AI doubt-solver in Marathi |
