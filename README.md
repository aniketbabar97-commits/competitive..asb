# SchoolPariksha 📘

A bilingual (**मराठी / English**) learning platform for **Navodaya (JNVST)**, **Maharashtra Scholarship (Class 4 & 7)**, **NMMS**, **Sainik School**, **Olympiads**, and **State Board / CBSE / ICSE** Classes 1–12. It sells video lectures, PDF notes and timed mock tests, works as an installable app (PWA), and has a full admin panel.

See [`docs/RESEARCH.md`](docs/RESEARCH.md) for market research, product strategy and the roadmap.

## Features
**Students:** switch between Marathi and English, filter by goal/exam, board and class, install the site as an app, track lecture progress, take mock tests with a question palette and mark-for-review, browse courses by exam, free preview lectures/PDFs/tests, register/login with mobile + password, buy with Razorpay (UPI/cards) and apply coupons, watch lectures, open PDFs, take timed mock tests with instant score, rank and explanations, and see their own course list and test history.

**Admin (`#/admin`):** call-back leads (with WhatsApp link), sign-up chart, featured courses, board/class tagging, revenue/enrollment dashboard, create/edit/publish courses (price, MRP, validity), add lectures (YouTube unlisted/Vimeo/MP4), upload PDFs, build tests (single question or CSV bulk import), manage users (search, block, make admin, grant or revoke course access manually for cash/UPI payments), orders with CSV export, coupons and announcements.

**Security:** bcrypt passwords, httpOnly JWT session cookie, rate-limited login, Helmet CSP, CSRF protection (same-origin + JSON-only mutations), parameterised SQL, server-side access checks on every paid resource, PDFs kept outside the public folder and served only to enrolled users, PDF magic-byte check on upload, and Razorpay signature verification.

## Dynamic website (CMS)
Everything on the public site is stored in the database and edited at **Admin → Website**, with no code changes:
- **Settings:** brand name, logo, colours, default language, hero headline/badge/text (EN + मराठी), which homepage sections to show, contact phone/WhatsApp/email/address, social links, footer text
- **Banners:** rotating homepage slides with uploaded images and links
- **FAQs and testimonials** in both languages
- **Pages:** About, Contact, Privacy, Terms, Refund, or any new page (simple formatting: `**bold**`, `[link](https://…)`, `- lists`)
- **Exams & categories:** add, rename or reorder exams; edit icons and descriptions
- **Course thumbnails:** image upload

The homepage numbers (courses, lectures, questions, exams) are live counts. The PWA manifest also uses the current brand. Uploaded images are stored in `DATA_DIR/media` (PNG/JPG/WEBP/GIF only, 3 MB max).

## Run it
Requires Node **22.13+** (uses built-in `node:sqlite`).
```bash
npm install
npm start            # http://localhost:3000
```
On first run a default admin is created: **mobile `9999999999` / password `admin@123`**. Set `ADMIN_PHONE` / `ADMIN_PASSWORD` before the first start to choose your own.

Without Razorpay keys, payments run in **mock mode** (a confirm dialog simulates payment) so you can test the full flow.

### Environment variables
| Var | Purpose |
|---|---|
| `NODE_ENV=production` | Secure cookies; requires `JWT_SECRET`; disables mock payments |
| `JWT_SECRET` | Long random string |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Enables live payments |
| `ADMIN_PHONE`, `ADMIN_PASSWORD` | First admin account |
| `BUNNY_STREAM_TOKEN_KEY` | Bunny Stream token-auth key: lecture links are signed and expire after 3 hours |
| `PORT`, `DATA_DIR`, `UPLOAD_DIR` | Server port, database folder, PDF storage |

## Structure
```
src/server.js   API: auth, catalogue, content access, checkout, admin
src/db.js       SQLite schema + seed data
public/         Single-page front end (student site + admin panel)
docs/           Research & roadmap
```
