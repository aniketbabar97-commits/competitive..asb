# Market research & strategy

*Updated Nov 2026. Volumes come from news reports of official board/NTA/NVS/MSCE figures, and sources sometimes differ slightly. **Check exam patterns and dates on the official sites before you publish content.***

## 1. Exam landscape, patterns and volumes

### Entrance exams
| Exam | Body | For | Pattern | Volume |
|---|---|---|---|---|
| **JNVST Class 6** | NVS | Class 5 students (rural quota 75%) | 80 MCQ / 100 marks / 2 h. Mental Ability 40 Q (50), Arithmetic 20 Q (25), Language 20 Q (25). No negative marking. Offered in about 20 languages incl. Marathi | **24.7 lakh registered / 19.2 lakh appeared / 47,252 selected** (2024). The 2026 cycle declared results for 20 lakh+ candidates. Selection rate is about 2.5%, so demand for practice is huge |
| **JNVST Class 9** | NVS | Class 8 (lateral entry) | English, Hindi, Maths, Science | Small: a few lakh |
| **AISSEE (Sainik School)** | NTA | Class 6 & 9 | OMR MCQ. Class 6: Language, Maths, Intelligence, GK | **2 lakh+ (2026)**. In 2024: 1.51 lakh for Class 6 and 50k for Class 9 |

### Maharashtra scholarships (core market)
| Exam | Pattern | Volume |
|---|---|---|
| **⚠️ Pattern change:** MSCE moved the scholarship exams **from Classes 5 & 8 to Classes 4 & 7** starting 2025-26. The final 5th/8th exams were held in Feb 2026. Class 4 pays ₹5,000/yr and Class 7 pays ₹7,500/yr. Age limits are 10 yrs (Cl. 4) and 13 yrs (Cl. 7). The 2027 cycle's applications reportedly opened in late Oct 2026 for an exam around **21 Feb 2027**. **Launch timing: this is the window to sell 4th/7th crash courses right now.** | Paper 1: First Language + Maths. Paper 2: Third Language (English) + Intelligence | **2025: 9.44 lakh registered, 9.13 lakh appeared** (5th: 5.47 lakh, 8th: 3.66 lakh). Only 22% qualified, which shows how hard the exam is and why prep sells |
| **NMMS** (Class 8) | MAT 90 Q + SAT 90 Q | ₹12,000/yr for Classes 9–12. Maharashtra has one of the largest NMMS quotas |
| **MTS, BDS, Prajnashodh** | Private talent-search exams | Lakhs of students, Classes 2–9. A cheap add-on catalogue |
| **Olympiads (SOF/IMO/NSO)** | Classes 1–12 | Tens of lakhs nationally. Strongest in CBSE/ICSE schools |

### School boards (largest long-term market)
| Board | Volume (2026) |
|---|---|
| **Maharashtra SSC (Class 10)** | about **16 lakh** registered |
| **Maharashtra HSC (Class 12)** | about **14–15 lakh** (Science alone is about 8 lakh) |
| **CBSE Class 10** | about **25 lakh** (two board exams a year from 2026) |
| **CBSE Class 12** | about **18.6 lakh** |
| **ICSE/ISC** | about **3.6 lakh** nationally, about 30k ICSE students in Maharashtra |

**What this means:** the competitive-exam niche (JNVST + scholarships + NMMS + AISSEE) has about **35 lakh+ test-takers a year** and very few good Marathi products. The school-board market is about 10× larger but has heavy competition (PW, BYJU'S, Vedantu, Toppr, Marathi YouTube channels). **Strategy: win the niche first** (Classes 4–8, Marathi, exam-focused), then expand upward with the same students into SSC, CBSE and ICSE, Classes 9–10.

## 2. Competition & positioning
| Player | Strength | Weakness |
|---|---|---|
| PW, Adda247, Testbook | Brand, price, apps | Barely covers these exams, Hindi/English only |
| Marathi YouTube teachers | Trust and reach (lakhs of subscribers) | No structure, tests or tracking. **Recruit them as faculty or affiliates** |
| Printed guides (Navneet, Target, Sahyadri) | In every shop | Static, no feedback or rank |
| Local coaching | Personal attention | ₹5–15k/yr, only in towns |

**Positioning:** "Marathi-first, exam-specific, with a state rank on every test, for less than the price of a guide book."

## 3. Video hosting: what costs the least
Assume 1,000 students who each watch 30 hours a month at about 0.5 GB/hour (720p) = **about 15 TB a month**.

| Option | Pricing (USD list, confirm with vendor) | Approx. monthly cost at 15 TB | Protection |
|---|---|---|---|
| **YouTube unlisted** | Free | ₹0 | ❌ Links can be shared, downloaders work. OK for the free/demo content only |
| **Bunny Stream** ⭐ | Delivery from about $0.005–0.01/GB, storage $0.01/GB, **no encoding fee** | **about $75–150 (₹6–13k)** | Token-signed URLs, domain lock, optional MediaCage DRM add-on |
| Cloudflare Stream | $5 / 1,000 min stored + $1 / 1,000 min delivered | 1.8M min delivered ≈ **$1,800** | Signed URLs |
| VdoCipher | Annual plans: about $145–150/yr (1–1.5 TB), up to $1.6k–5k/yr. About $0.05/GB overage, +18% GST | 15 TB ≈ **$750+** | ✅ Real Widevine/FairPlay DRM + dynamic watermark. The Indian ed-tech standard |
| Mux | About $0.0008–0.001/min delivered | ≈ $1,500+ | Signed URLs |

**Recommendation:**
1. **Launch:** use **Bunny Stream** for paid content (already integrated: paste the `iframe.mediadelivery.net/embed/...` URL and set `BUNNY_STREAM_TOKEN_KEY` for signed, expiring links). Use YouTube unlisted for free demo lectures to get reach.
2. **Once piracy actually hurts** (usually after about ₹5L/month revenue), move premium batches to **VdoCipher DRM**. The `embedUrl()` adapter in `src/server.js` is the only place to change.
3. The app already adds a phone-number watermark and blocks downloads.

## 4. Pricing
| Product | Price |
|---|---|
| Scholarship 4th/7th full course | ₹999–1,499 |
| Navodaya full batch | ₹1,499–2,499 |
| Test series only | ₹199–499 |
| Crash course (last 45 days) | ₹499–799 |
| Board subject course (SSC/CBSE/ICSE) | ₹999–2,999 per year |
| Single PDF pack | ₹49–149 |
Use the MRP strike-through and festival coupons; both are built into the admin panel.

## 5. Website & app strategy
- **Now:** the website is a **PWA**. Students can "Install" it on Android and it opens like an app. The app shell is cached for flaky rural networks, and the site is mobile-first with a bottom tab bar. This is what most Indian ed-tech companies do in their first year.
- **Next (about 2–4 weeks):** wrap the same web app with **Capacitor** to publish on the **Play Store** (needed for discovery and trust). Add **FCM push notifications** for "test tomorrow" reminders.
- **Later:** a native app only if offline downloads with DRM become necessary (VdoCipher has a native SDK).

## 6. Growth playbook
1. **Free weekly all-Maharashtra mock test** with a district/state rank, shareable on WhatsApp. This is the cheapest acquisition loop.
2. **Teacher affiliate coupons** (10–20% commission). Zilla Parishad school teachers drive scholarship enrollments.
3. **Callback leads** (already built): call within 24 hours. Converting through calls and WhatsApp beats ads for parents in this segment.
4. YouTube Shorts and Instagram Reels in Marathi, plus Facebook/YouTube ads targeted at parents in Maharashtra districts during Oct–Feb (scholarship) and Jun–Sep (JNVST registration).
5. Printed question-bank add-on shipped via Shiprocket (high margin).

## 7. Compliance
- **DPDP Act 2023:** the users are children, so you need **verifiable parental consent**, no behavioural ads or tracking, minimal data collection, and a grievance officer.
- GST registration (18% on online education) and invoices. Terms, privacy and refund pages already exist; fill in the real details.
- Don't use the NVS/MSCE/CBSE/CISCE logos. The footer disclaimer is already in place.

## 8. Roadmap
| Phase | Scope | Status |
|---|---|---|
| 1 | Catalogue by exam/board/class, courses, lectures, PDFs, timed mock tests with palette and rank, Razorpay, coupons, admin panel | ✅ Done |
| 2 | Marathi/English UI, redesigned UX, PWA install, progress tracking, Bunny Stream signed video, callback leads | ✅ Done (this PR) |
| 3 | OTP login (MSG91), GST invoices, parental consent flow, Play Store app (Capacitor), push notifications, live classes (YouTube Live/Zoom) | Next |
| 4 | State-wide test series with district leaderboards, affiliate dashboard, doubt forum, multi-teacher revenue share, AI doubt solver in Marathi | Later |

## Sources
- JNVST volumes: [Careers360 – selection numbers](https://school.careers360.com/articles/how-many-students-are-selected-in-navodaya), [Careers360 – 2026 results](https://news.careers360.com/jawahar-navodaya-summer-bound-class-6-result-released-live-jnvst-link-navodaya-gov-in-download-scorecard-toppers-updates/amp)
- MH scholarship 2025: [Careers360](https://news.careers360.com/maharashtra-class5-8-scholarship-result-2025-declared-mscepune-in-overall-pass-percentage-at-22-06)
- Class 4/7 change: [Free Press Journal](https://www.freepressjournal.in/education/maharashtra-scholarship-exams-to-be-conducted-for-students-of-classes-4-7-from-2026), [Careers360](https://news.careers360.com/maharashtra-revises-state-scholarship-exams-class-4-and-7-to-replace-classes-5-and-8-from-2025-26), [2027 application form](https://school.careers360.com/articles/msce-pune-4th-7th-scholarship-applications-form-2027)
- AISSEE: [Collegedunia](https://collegedunia.com/exams/aissee/results), [Careers360](https://news.careers360.com/aissee-2026-registration-deadline-extended-till-november-9-exam-on-january-18-exams-nta-nic-in-sainik-school-society)
- Boards: [CBSE 2026](https://news.careers360.com/cbse-board-exam-2026-begins-today-class-10-12-new-format-45-lakh-appear-admit-card-timings-question-paper-pdf-26-countries/amp), [MH SSC](https://www.punekarnews.in/?p=228855), [MH HSC](https://www.aacrao.org/edge/emergent-news/maharashtra-hsc-exams-2026-more-than-13-lakh-students-to-appear-for-class-12th-exams/), [ICSE](https://www.freepressjournal.in/amp/education/icse-isc-results-2026-declared-over-36-lakh-students-score-high-as-pass-rate-remains-above-99)
- Video: [Bunny vs Cloudflare (pkgpulse)](https://www.pkgpulse.com/guides/mux-vs-cloudflare-stream-vs-bunny-stream-video-cdn-2026), [Cloudflare Stream pricing](https://blog.blazingcdn.com/en-us/cloudflares-pricing-for-video-streaming-services), [VdoCipher FAQ](https://www.vdocipher.com/page/faq/), [VdoCipher plans](https://apis.io/plans/vdocipher/vdocipher-plans-pricing/)
