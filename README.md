# Vidyarthi Path 📘

An online learning and course-selling platform for **JNVST (Navodaya) Class 6 & 9**, **Maharashtra Scholarship (5th/8th)** and **NMMS** preparation. It sells video lectures, PDF notes and timed mock tests, and has a full admin panel.

See [`docs/RESEARCH.md`](docs/RESEARCH.md) for market research, product strategy and the roadmap.

## Features
**Students:** browse courses by exam, free preview lectures/PDFs/tests, register/login with mobile + password, buy with Razorpay (UPI/cards) and apply coupons, watch lectures, open PDFs, take timed mock tests with instant score, rank and explanations, and see their own course list and test history.

**Admin (`#/admin`):** revenue/enrollment dashboard, create/edit/publish courses (price, MRP, validity), add lectures (YouTube unlisted/Vimeo/MP4), upload PDFs, build tests (single question or CSV bulk import), manage users (search, block, make admin, grant or revoke course access manually for cash/UPI payments), orders with CSV export, coupons and announcements.

**Security:** bcrypt passwords, httpOnly JWT session cookie, rate-limited login, Helmet CSP, CSRF protection (same-origin + JSON-only mutations), parameterised SQL, server-side access checks on every paid resource, PDFs kept outside the public folder and served only to enrolled users, PDF magic-byte check on upload, and Razorpay signature verification.

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
| `PORT`, `DATA_DIR`, `UPLOAD_DIR` | Server port, database folder, PDF storage |

## Structure
```
src/server.js   API: auth, catalogue, content access, checkout, admin
src/db.js       SQLite schema + seed data
public/         Single-page front end (student site + admin panel)
docs/           Research & roadmap
```
