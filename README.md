# SchoolPariksha 📘

A bilingual (**मराठी / English**) learning platform for **Navodaya (JNVST)**, **Maharashtra Scholarship (Class 4 & 7)**, **NMMS**, **Sainik School**, **Olympiads**, and **State Board / CBSE / ICSE** Classes 1–12. It sells video lectures, PDF notes and timed mock tests, works as an installable app (PWA), and has a full admin panel.

See [`docs/RESEARCH.md`](docs/RESEARCH.md) for market research, product strategy and the roadmap.

## Features
**Students:** switch between Marathi and English, filter by goal/exam, board and class, install the site as an app, track lecture progress, take mock tests with a question palette and mark-for-review, browse courses by exam, free preview lectures/PDFs/tests, register/login with mobile + password, buy with Razorpay (UPI/cards) and apply coupons, watch lectures, open PDFs, take timed mock tests with instant score, rank and explanations, and see their own course list and test history.

**Admin (`#/admin`):** call-back leads (with WhatsApp link), sign-up chart, featured courses, board/class tagging, revenue/enrollment dashboard, create/edit/publish courses (price, MRP, validity), add lectures (YouTube unlisted/Vimeo/MP4), upload PDFs, build tests (single question or CSV bulk import), manage users (search, block, make admin, grant or revoke course access manually for cash/UPI payments), orders with CSV export, coupons and announcements.

**Security:** bcrypt passwords, httpOnly JWT session cookie, rate-limited login, Helmet CSP, CSRF protection (same-origin + JSON-only mutations), parameterised SQL, server-side access checks on every paid resource, PDFs kept outside the public folder and served only to enrolled users, PDF magic-byte check on upload, and Razorpay signature verification.

## Login options
- **Mobile + password**, **mobile + OTP**, **forgot password via OTP**, and **Continue with Google (Gmail)**.
- Parent/guardian consent is recorded at sign-up (required by the DPDP Act because users are children).
- Google users are asked once for a mobile number; the account then also works with mobile login.

### Enable Google sign-in (free, about 10 minutes)
1. Go to <https://console.cloud.google.com/> → create a project, e.g. "SchoolPariksha".
2. **APIs & Services → OAuth consent screen** → External → app name, support email, logo (use `public/brand/emblem.png`) → publish.
3. **Credentials → Create credentials → OAuth client ID → Web application**.
   - Authorised JavaScript origins: `https://yourdomain.com` (and `http://localhost:3000` for testing).
4. Copy the **Client ID** and start the server with `GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com`.
No client secret is needed: the server verifies Google's signed ID token against Google's public keys.

### Enable SMS OTP (MSG91)
Set `MSG91_AUTH_KEY` and `MSG91_TEMPLATE_ID` (a DLT-approved template containing `##OTP##`). Without them, development mode shows the OTP on screen and in the server log; production refuses to send.

## Learning community (Udemy-style)
- **Live classes:** schedule in Admin → Live classes. Stream on YouTube Live (embedded) and/or give a Zoom/Meet link. The site shows "Live now" banners, countdowns, attendance and recordings. Access is limited to enrolled students unless the class is marked free.
- **Live chat:** real-time chat beside the stream (Server-Sent Events, no extra service), online count, staff badge, admins can delete messages, 1 message per 3 seconds per student.
- **Doubts / Q&A:** per course and per lesson, with upvotes, teacher answers, a "resolved" state and an admin inbox with unanswered doubts first.
- **Ratings & reviews** (enrolled students only), star averages on cards and course pages, admin moderation.
- **Wishlist, certificates** (auto-issued at 100% completion, printable, public verification link), a **notification bell**, **personal notes per lesson**, **instructor profiles**, and **curriculum sections**.

> Scaling note: chat runs in-process. Past roughly 2–3k concurrent viewers per server, add Redis pub/sub or move chat to a managed service (Ably/Pusher).

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
| `GOOGLE_CLIENT_ID` | Enables "Continue with Google" |
| `MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID` | SMS OTP for login and password reset |
| `BUNNY_STREAM_TOKEN_KEY` | Bunny Stream token-auth key: lecture links are signed and expire after 3 hours |
| `PORT`, `DATA_DIR`, `UPLOAD_DIR` | Server port, database folder, PDF storage |

## Structure
```
src/server.js   API: auth, catalogue, content access, checkout, admin
src/db.js       SQLite schema + seed data
public/         Single-page front end (student site + admin panel)
docs/           Research & roadmap
```
