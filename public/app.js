'use strict';
/* ======================================================================
   SchoolPariksha – single-page front end (student site + admin panel)
   ====================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = { get: (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } } };
let ME = null, CONFIG = {}, EXAMS = [], SITE = { settings: {}, banners: [], faqs: [], testimonials: [], pages: [], stats: {} };
let LANG = store.get('vp_lang', '');

/* ---------------- i18n ---------------- */
const I18N = {
  en: {
    home: 'Home', explore: 'Explore', my: 'My Learning', account: 'Account', admin: 'Admin', login: 'Login', register: 'Sign up free', logout: 'Logout',
    search_ph: 'Search Navodaya, Scholarship, CBSE…',
    hero_pill: '🎉 Scholarship 2027 batches now open',
    hero_h1: 'Crack <em>Navodaya</em>, <em>Scholarship</em> & Board exams',
    hero_lead: 'Video lectures, notes and mock tests by expert teachers, in Marathi and English. Made for Classes 1–12 across State Board, CBSE and ICSE.',
    popular: 'Popular:', choose_goal: 'Choose your goal', choose_goal_sub: 'Entrance exams, scholarships, olympiads and school boards',
    by_board: 'Browse by board & class', featured: 'Featured courses', featured_sub: 'Hand-picked batches students love', view_all: 'View all →',
    why: 'Why parents choose us', how: 'How it works',
    f1: 'Marathi + English', f1d: 'Every concept explained in your language, Marathi or English.',
    f2: 'Unlimited mock tests', f2d: 'Real exam pattern, a timer, an instant score, your rank and full solutions.',
    f3: 'Learn anytime', f3d: 'Recorded lectures that work on any phone. Re-watch as often as you need.',
    f4: 'Affordable', f4d: 'Full-year batches for less than the cost of a guide book series.',
    f5: 'Progress tracking', f5d: 'See completed lectures and test scores in one place.',
    f6: 'Safe for kids', f6d: 'No ads and no distractions. Parents stay in control.',
    s1: 'Pick your exam & class', s2: 'Try free demo lectures', s3: 'Enroll & start learning', s4: 'Practice tests, improve rank',
    cta_h: 'Not sure which course is right?', cta_p: 'Leave your number and our counsellor will call you back for free. No spam.', cta_btn: 'Request a call back',
    name: 'Name', mobile: 'Mobile number', password: 'Password', class: 'Class', district: 'District', board: 'Board',
    faq: 'Frequently asked questions',
    q1: 'Which exams do you cover?', a1: 'JNVST (Navodaya) Class 6 & 9, Maharashtra Scholarship (Class 4 & 7, the new pattern), NMMS, Sainik School (AISSEE), Olympiads, MTS, and the school syllabus for State Board, CBSE and ICSE.',
    q2: 'What language are the lectures in?', a2: 'Most courses are in Marathi, with English and semi-English medium options. Each course shows its language.',
    q3: 'Can I watch on my phone?', a3: 'Yes. Open the website in Chrome and tap "Install app" to add it to your home screen like an app.',
    q4: 'How do I pay?', a4: 'Pay securely with UPI (GPay, PhonePe, Paytm), debit/credit card or net-banking.',
    all: 'All', all_boards: 'All boards', state: 'State Board', cbse: 'CBSE', icse: 'ICSE', any_class: 'Any class', category: 'Category', exam: 'Exam',
    cat_entrance: 'Entrance', cat_scholarship: 'Scholarship', cat_olympiad: 'Olympiad', cat_school: 'School',
    results: 'courses', no_results: 'No courses found. Try changing the filters.', clear: 'Clear filters', filters: 'Filters',
    lectures: 'Lectures', notes: 'Notes & PDFs', tests: 'Mock tests', about: 'About', free: 'FREE', buy: 'Buy now', enroll_free: 'Enroll for free',
    enrolled: 'You are enrolled', continue: 'Continue learning', coupon: 'Have a coupon?', apply: 'Apply', valid: 'Valid for', days: 'days',
    preview: 'Preview', watch: 'Watch', open: 'Open', start: 'Start', locked: 'Locked', coming: 'Content coming soon',
    inc: 'This course includes', students: 'students', min: 'min', questions: 'questions',
    mark_done: 'Mark as complete', done: 'Completed', next: 'Next', prev: 'Previous', back_course: 'Back to course', playlist: 'Course content',
    submit: 'Submit test', submit_q: 'Submit the test now?', time_up: 'Time is up! Submitting…', clear_resp: 'Clear', mark_review: 'Mark for review',
    answered: 'Answered', not_answered: 'Not answered', marked: 'Marked', score: 'Score', rank: 'Rank', accuracy: 'Accuracy', solutions: 'Solutions', retake: 'Retake test',
    hello: 'Namaste', my_courses: 'My courses', test_history: 'Test history', no_courses: 'You have not enrolled in any course yet.', browse: 'Browse courses', valid_till: 'Valid till', complete: 'complete',
    welcome_back: 'Welcome back!', create_acc: 'Create your free account', have_acc: 'Already have an account?', new_here: 'New here?', pw_hint: 'At least 8 characters',
    auth_l1: '✔ Free demo lectures in every course', auth_l2: '✔ Mock tests with all-Maharashtra rank', auth_l3: '✔ Notes in Marathi & English', auth_l4: '✔ Works on any phone',
    install: 'Install our app for a faster experience', install_btn: 'Install', thanks_lead: 'Thank you! We will call you soon.',
    pay_test: 'TEST MODE: simulate a successful payment of', paid: 'Payment successful. You are enrolled.', coupon_ok: 'Coupon applied!', you_pay: 'You pay',
    foot_about: 'Affordable, high-quality exam preparation for every student in Maharashtra, in their own language.',
    exams: 'Exams', company: 'Company', support: 'Support', privacy: 'Privacy policy', terms: 'Terms', refund: 'Refund policy', contact: 'Contact us',
    confirm: 'Are you sure?', cancel: 'Cancel', ok: 'OK', not_found: 'Page not found', go_home: 'Go home',
  },
  mr: {
    home: 'मुख्यपृष्ठ', explore: 'कोर्सेस', my: 'माझे शिक्षण', account: 'खाते', admin: 'ॲडमिन', login: 'लॉगिन', register: 'मोफत नोंदणी', logout: 'लॉगआउट',
    search_ph: 'नवोदय, शिष्यवृत्ती, CBSE शोधा…',
    hero_pill: '🎉 शिष्यवृत्ती २०२७ बॅच सुरू',
    hero_h1: '<em>नवोदय</em>, <em>शिष्यवृत्ती</em> आणि बोर्ड परीक्षेत यश मिळवा',
    hero_lead: 'तज्ञ शिक्षकांची व्हिडिओ लेक्चर्स, नोट्स आणि सराव चाचण्या – मराठी व इंग्रजीत. इयत्ता १ ते १२ – राज्य मंडळ, CBSE व ICSE.',
    popular: 'लोकप्रिय:', choose_goal: 'तुमचे ध्येय निवडा', choose_goal_sub: 'प्रवेश परीक्षा, शिष्यवृत्ती, ऑलिम्पियाड आणि शालेय अभ्यासक्रम',
    by_board: 'बोर्ड व इयत्तेनुसार शोधा', featured: 'निवडक कोर्सेस', featured_sub: 'विद्यार्थ्यांच्या आवडीच्या बॅचेस', view_all: 'सर्व पहा →',
    why: 'पालक आम्हालाच का निवडतात', how: 'कसे काम करते',
    f1: 'मराठी + इंग्रजी', f1d: 'प्रत्येक संकल्पना तुमच्या भाषेत समजावून सांगितली आहे.',
    f2: 'अमर्यादित सराव चाचण्या', f2d: 'खऱ्या परीक्षेचा पॅटर्न, टायमर, लगेच गुण, रँक आणि उत्तरांचे स्पष्टीकरण.',
    f3: 'कधीही शिका', f3d: 'कोणत्याही मोबाईलवर चालणारी रेकॉर्डेड लेक्चर्स. हवी तितक्या वेळा पहा.',
    f4: 'परवडणारे शुल्क', f4d: 'गाईड पुस्तकांपेक्षा कमी खर्चात वर्षभराची बॅच.',
    f5: 'प्रगतीचा मागोवा', f5d: 'पूर्ण झालेली लेक्चर्स आणि चाचण्यांचे गुण एका ठिकाणी.',
    f6: 'मुलांसाठी सुरक्षित', f6d: 'जाहिराती नाहीत, लक्ष विचलित होत नाही. नियंत्रण पालकांकडे.',
    s1: 'परीक्षा व इयत्ता निवडा', s2: 'मोफत डेमो लेक्चर पहा', s3: 'प्रवेश घ्या व शिकायला सुरुवात करा', s4: 'सराव चाचण्या द्या, रँक सुधारा',
    cta_h: 'कोणता कोर्स योग्य आहे हे ठरवता येत नाही?', cta_p: 'तुमचा नंबर द्या – आमचे समुपदेशक तुम्हाला मोफत कॉल करतील.', cta_btn: 'कॉल बॅक मागवा',
    name: 'नाव', mobile: 'मोबाईल नंबर', password: 'पासवर्ड', class: 'इयत्ता', district: 'जिल्हा', board: 'बोर्ड',
    faq: 'नेहमी विचारले जाणारे प्रश्न',
    q1: 'कोणत्या परीक्षांची तयारी करून घेता?', a1: 'नवोदय (JNVST) इ. ६ वी व ९ वी, महाराष्ट्र शिष्यवृत्ती (इ. ४ थी व ७ वी – नवीन पॅटर्न), NMMS, सैनिक स्कूल, ऑलिम्पियाड, MTS तसेच राज्य मंडळ, CBSE व ICSE शालेय अभ्यासक्रम.',
    q2: 'लेक्चर्स कोणत्या भाषेत आहेत?', a2: 'बहुतेक कोर्सेस मराठीत आहेत. इंग्रजी व सेमी-इंग्रजी माध्यमही उपलब्ध आहे. प्रत्येक कोर्सवर त्याची भाषा दिलेली आहे.',
    q3: 'मोबाईलवर पाहता येईल का?', a3: 'हो! Chrome मध्ये वेबसाइट उघडा आणि "ॲप इन्स्टॉल करा" वर टॅप करा.',
    q4: 'पैसे कसे भरायचे?', a4: 'UPI (GPay, PhonePe, Paytm), डेबिट/क्रेडिट कार्ड किंवा नेट-बँकिंगने सुरक्षितपणे पैसे भरा.',
    all: 'सर्व', all_boards: 'सर्व बोर्ड', state: 'राज्य मंडळ', cbse: 'CBSE', icse: 'ICSE', any_class: 'कोणतीही इयत्ता', category: 'प्रकार', exam: 'परीक्षा',
    cat_entrance: 'प्रवेश परीक्षा', cat_scholarship: 'शिष्यवृत्ती', cat_olympiad: 'ऑलिम्पियाड', cat_school: 'शालेय',
    results: 'कोर्सेस', no_results: 'कोर्स सापडला नाही. फिल्टर बदलून पहा.', clear: 'फिल्टर काढा', filters: 'फिल्टर',
    lectures: 'लेक्चर्स', notes: 'नोट्स व PDF', tests: 'सराव चाचण्या', about: 'माहिती', free: 'मोफत', buy: 'आत्ताच खरेदी करा', enroll_free: 'मोफत प्रवेश घ्या',
    enrolled: 'तुम्ही प्रवेश घेतला आहे', continue: 'शिकणे सुरू ठेवा', coupon: 'कूपन कोड आहे?', apply: 'लागू करा', valid: 'वैधता', days: 'दिवस',
    preview: 'मोफत पहा', watch: 'पहा', open: 'उघडा', start: 'सुरू करा', locked: 'लॉक', coming: 'लवकरच उपलब्ध',
    inc: 'या कोर्समध्ये समाविष्ट', students: 'विद्यार्थी', min: 'मि.', questions: 'प्रश्न',
    mark_done: 'पूर्ण झाले म्हणून नोंदवा', done: 'पूर्ण', next: 'पुढील', prev: 'मागील', back_course: 'कोर्सकडे परत', playlist: 'कोर्सची यादी',
    submit: 'चाचणी सबमिट करा', submit_q: 'चाचणी आता सबमिट करायची?', time_up: 'वेळ संपली! सबमिट होत आहे…', clear_resp: 'उत्तर काढा', mark_review: 'पुन्हा पाहण्यासाठी खूण',
    answered: 'उत्तर दिले', not_answered: 'उत्तर नाही', marked: 'खूण केलेले', score: 'गुण', rank: 'रँक', accuracy: 'अचूकता', solutions: 'उत्तरे व स्पष्टीकरण', retake: 'पुन्हा चाचणी द्या',
    hello: 'नमस्कार', my_courses: 'माझे कोर्सेस', test_history: 'चाचण्यांचा इतिहास', no_courses: 'तुम्ही अजून कोणताही कोर्स घेतलेला नाही.', browse: 'कोर्सेस पहा', valid_till: 'वैधता', complete: 'पूर्ण',
    welcome_back: 'पुन्हा स्वागत!', create_acc: 'मोफत खाते तयार करा', have_acc: 'आधीच खाते आहे?', new_here: 'नवीन आहात?', pw_hint: 'किमान ८ अक्षरे',
    auth_l1: '✔ प्रत्येक कोर्समध्ये मोफत डेमो लेक्चर', auth_l2: '✔ संपूर्ण महाराष्ट्र रँकसह सराव चाचण्या', auth_l3: '✔ मराठी व इंग्रजी नोट्स', auth_l4: '✔ कोणत्याही मोबाईलवर चालते',
    install: 'जलद अनुभवासाठी आमचे ॲप इन्स्टॉल करा', install_btn: 'इन्स्टॉल', thanks_lead: 'धन्यवाद! आम्ही लवकरच कॉल करू.',
    pay_test: 'टेस्ट मोड: पेमेंट यशस्वी समजायचे?', paid: 'पेमेंट यशस्वी. प्रवेश निश्चित.', coupon_ok: 'कूपन लागू झाले!', you_pay: 'भरायची रक्कम',
    foot_about: 'महाराष्ट्रातील प्रत्येक विद्यार्थ्यासाठी त्याच्या भाषेत परवडणारी, दर्जेदार परीक्षा तयारी.',
    exams: 'परीक्षा', company: 'कंपनी', support: 'मदत', privacy: 'गोपनीयता धोरण', terms: 'अटी', refund: 'परतावा धोरण', contact: 'संपर्क',
    confirm: 'नक्की?', cancel: 'रद्द करा', ok: 'ठीक आहे', not_found: 'पान सापडले नाही', go_home: 'मुख्यपृष्ठावर जा',
  },
};
const t = (k) => I18N[LANG][k] ?? I18N.en[k] ?? k;
const examName = (e) => (LANG === 'mr' && (e.name_mr || e.exam_name_mr)) || e.name || e.exam_name || '';
const S = (k) => SITE.settings[k] ?? '';
const L = (o, base) => (LANG === 'mr' && (o[base + '_mr'] || '').trim()) || o[base + '_en'] || o[base] || o[base + '_mr'] || '';
const BRAND = () => S('brand_name') || 'SchoolPariksha';
// Hero titles allow <em> highlight only: escape everything, then restore <em>.
const emHtml = (v) => esc(v).replace(/&lt;(\/?)em&gt;/g, '<$1em>');
// Mini-markdown for CMS pages: **bold**, [text](https://…), "- " lists, "# " headings, blank-line paragraphs. Input is escaped first.
function md(src) {
  const inline = (x) => esc(x).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/|#\/)[^\s)]+)\)/g, (m, tx, u) => `<a href="${u}" ${u.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}>${tx}</a>`);
  return String(src || '').split(/\n{2,}/).map((blk) => {
    const lines = blk.split('\n');
    if (lines.every((l) => /^\s*-\s+/.test(l))) return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*-\s+/, ''))}</li>`).join('')}</ul>`;
    if (/^#{1,3}\s/.test(blk)) return `<h3>${inline(blk.replace(/^#+\s/, ''))}</h3>`;
    return `<p>${lines.map(inline).join('<br>')}</p>`;
  }).join('');
}
function applyTheme() {
  const r = document.documentElement.style, hex = /^#[0-9a-f]{6}$/i;
  if (hex.test(S('primary_color'))) { r.setProperty('--primary', S('primary_color')); r.setProperty('--primary-2', S('primary_color')); document.querySelector('meta[name=theme-color]')?.setAttribute('content', S('primary_color')); }
  if (hex.test(S('accent_color'))) r.setProperty('--accent', S('accent_color'));
}
const logo = () => (S('logo_url') ? `<img src="${esc(S('logo_url'))}" alt="">` : '<img src="/icon.svg" alt="">');
const rs = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const num = (n) => (LANG === 'mr' ? Number(n).toLocaleString('mr-IN') : Number(n).toLocaleString('en-IN'));
const CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const BOARDS = [['', 'all_boards'], ['State', 'state'], ['CBSE', 'cbse'], ['ICSE', 'icse']];
const CATS = ['entrance', 'scholarship', 'olympiad', 'school'];

/* ---------------- infra ---------------- */
async function api(url, opts = {}) {
  const o = { credentials: 'same-origin', ...opts };
  if (o.body && !(o.body instanceof FormData)) { o.headers = { 'Content-Type': 'application/json' }; o.body = JSON.stringify(o.body); }
  const r = await fetch(url, o);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(data.error || 'Request failed'); e.status = r.status; throw e; }
  return data;
}
let toastT;
function toast(msg) { const el = $('#toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2800); }
const view = (html) => { const a = $('#app'); a.innerHTML = `<div class="fade">${html}</div>`; };
const formData = (form) => Object.fromEntries(new FormData(form).entries());
function confirmBox(msg, okLabel = t('ok')) {
  return new Promise((done) => {
    const m = $('#modal'); m.hidden = false;
    m.innerHTML = `<div class="card" role="dialog" aria-modal="true"><p style="font-size:17px;font-weight:600">${esc(msg)}</p><div class="row" style="justify-content:flex-end"><button class="btn ghost" data-v="0">${t('cancel')}</button><button class="btn" data-v="1">${esc(okLabel)}</button></div></div>`;
    const close = (v) => { m.hidden = true; m.innerHTML = ''; done(v); };
    m.onclick = (e) => { if (e.target === m) close(false); const b = e.target.closest('[data-v]'); if (b) close(b.dataset.v === '1'); };
    $('[data-v="1"]', m).focus();
  });
}
const go = (h) => { location.hash = h; };
/* ---------------- icons (1.8px stroke, 24 grid) ---------------- */
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>', file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  test: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10l1.5 1.5L13 9M9 16h6"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.7 3.3-6 6.5-6s5.9 2.3 6.5 6M16 4.6a3.5 3.5 0 0 1 0 6.8M21.5 20c-.4-2.6-1.8-4.5-3.8-5.4"/>',
  lang: '<path d="M4 5h9M8.5 3v2c0 4-2 7-4.5 8.5M6 9c1 2 3 3.5 6 4.5"/><path d="m12 21 4.5-10L21 21M13.5 18h6"/>',
  book: '<path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H19v-3"/>',
  award: '<circle cx="12" cy="9" r="5.5"/><path d="m8.5 13.5-1.5 7.5 5-2.5 5 2.5-1.5-7.5"/>', target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/>',
  brain: '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5.2A3 3 0 0 0 6 17a3 3 0 0 0 6 1V5a2 2 0 0 0-3-1zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5.2A3 3 0 0 1 18 17a3 3 0 0 1-6 1"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  school: '<path d="m3 9 9-5 9 5-9 5z"/><path d="M7 11.2V16c0 1.5 2.2 3 5 3s5-1.5 5-3v-4.8M21 9v6"/>',
  right: '<path d="m9 6 6 6-6 6"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', left: '<path d="m15 6-6 6 6 6"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
  home: '<path d="m3 10.5 9-7 9 7V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>', compass: '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4 4-6.5 8-6.5s7.2 2.5 8 6.5"/>', star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  phone: '<path d="M5 3.5h3.5l1.5 4.5-2.2 1.4a11 11 0 0 0 6.8 6.8l1.4-2.2 4.5 1.5V19a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3.5 5.1 1.5 1.5 0 0 1 5 3.5z"/>',
  chat: '<path d="M20 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.2A8 8 0 1 1 20 11.5z"/>', mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6 8.5 7 8.5-7"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>', logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.6 14H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9.7 3.6V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1.3z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.3"/>',
  mega: '<path d="M3 10v4a1 1 0 0 0 1 1h3l6 4V5L7 9H4a1 1 0 0 0-1 1zM17 8.5a4.5 4.5 0 0 1 0 7"/>', image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  shield: '<path d="M12 3 5 6v6c0 4.5 3 7.8 7 9 4-1.2 7-4.5 7-9V6z"/><path d="m9 12 2 2 4-4"/>', wifi: '<path d="M2 8.5a15 15 0 0 1 20 0M5.5 12a10 10 0 0 1 13 0M9 15.5a5 5 0 0 1 6 0"/><circle cx="12" cy="19" r="1"/>',
  rupee: '<path d="M6 4h12M6 9h12M14 4c3 0 3 10-6 10l8 7"/>', download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.5 3.5 5.5 3.5 8.5s-1 6-3.5 8.5c-2.5-2.5-3.5-5.5-3.5-8.5s1-6 3.5-8.5z"/>',
  filter: '<path d="M4 5h16l-6 7.5V19l-4 2v-8.5z"/>', flag: '<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>', refresh: '<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>', grid: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>', menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', device: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
};
const ic = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* ---------------- exam identity: icon + cover colour ---------------- */
const EXAM_ICON = (slug = '', cat = '') => (/jnvst/.test(slug) ? 'school' : /scholarship|nmms/.test(slug) ? 'award' : /aissee|sainik/.test(slug) ? 'target' : /olympiad/.test(slug) ? 'brain' : /mts|ntse/.test(slug) ? 'bulb'
  : ({ entrance: 'target', scholarship: 'award', olympiad: 'brain', school: 'book' }[cat] || 'book'));
const COVER_COLORS = ['#1d3c78', '#7a3e0e', '#8a4b0b', '#9a5b13', '#0f5e5a', '#3f5222', '#0e5a73', '#6b2a12', '#8c1d3a', '#1e4fa3', '#4a2a6b', '#2d4a3e', '#5b3a1e'];
const coverColor = (pos, id) => COVER_COLORS[(pos ?? id ?? 0) % COVER_COLORS.length];
const shortCode = (c) => c.exam_short || c.short || (c.exam_name || '').split('(')[0];

/* ---------------- extra copy ---------------- */
Object.assign(I18N.en, {
  find_ph: 'Search an exam, class or subject', find_btn: 'Find courses', trust1: 'Free demo in every course', trust2: 'No ads, safe for children', trust3: 'Pay with UPI',
  pv_note: 'Live mock test', pv_rank: 'Your rank in Maharashtra', pv_q: 'Which number comes next? 3, 6, 12, 24, …',
  st_courses: 'courses', st_lectures: 'video lessons', st_questions: 'practice questions', st_exams: 'exams & boards',
  goal_eyebrow: 'Start with your exam', goal_h: 'What are you preparing for?', goal_p: 'Pick an exam to see its pattern, syllabus and every course we offer for it.',
  board_eyebrow: 'School syllabus', board_h: 'Find your class', board_l: 'Board', class_l: 'Class',
  feat_eyebrow: 'Most enrolled', method_eyebrow: 'Our method', method_h: 'Learn. Practise. Measure.',
  m1: 'Learn in short lessons', m1d: 'Each topic is a 10–20 minute video in Marathi or English, with printable notes to revise from.',
  m2: 'Practise in the real format', m2d: 'Timed tests built on the actual exam pattern, with full solutions explained after every attempt.',
  m3: 'See exactly where you stand', m3d: 'A rank among students across Maharashtra after every test, and a progress view parents can check.',
  testi_eyebrow: 'From families', testi_h: 'What students & parents say', faq_eyebrow: 'Questions', faq_h: 'Before you enroll',
  faq_p: 'Still unsure? Leave your number above and a counsellor will call you back.',
  sort_label: 'Showing', clear_all: 'Clear all', lessons: 'lessons', notes_s: 'notes', tests_s: 'tests',
  includes: 'This course includes', anywhere: 'Works on any phone or computer', in_lang: 'Taught in', mins: 'min',
  share: 'Share', back: 'Back', up_next: 'Up next', of: 'of', q_short: 'Q', end_test: 'Submit test',
  welcome_title: 'Welcome back', reg_title: 'Create your free account', reg_sub: 'It takes 30 seconds. No payment needed to try a demo.',
  login_sub: 'Log in with the mobile number you registered with.', art_h: 'Real exam practice, in your language.',
  continue_where: 'Continue where you left off', overview: 'Overview', all_courses: 'All courses',
});
Object.assign(I18N.mr, {
  find_ph: 'परीक्षा, इयत्ता किंवा विषय शोधा', find_btn: 'कोर्स शोधा', trust1: 'प्रत्येक कोर्समध्ये मोफत डेमो', trust2: 'जाहिराती नाहीत, मुलांसाठी सुरक्षित', trust3: 'UPI ने पेमेंट',
  pv_note: 'लाईव्ह सराव चाचणी', pv_rank: 'महाराष्ट्रातील तुमची रँक', pv_q: 'पुढील संख्या कोणती? ३, ६, १२, २४, …',
  st_courses: 'कोर्सेस', st_lectures: 'व्हिडिओ धडे', st_questions: 'सराव प्रश्न', st_exams: 'परीक्षा व बोर्ड',
  goal_eyebrow: 'तुमच्या परीक्षेपासून सुरुवात करा', goal_h: 'तुम्ही कोणत्या परीक्षेची तयारी करत आहात?', goal_p: 'परीक्षा निवडा – पॅटर्न, अभ्यासक्रम आणि सर्व कोर्सेस एकाच ठिकाणी.',
  board_eyebrow: 'शालेय अभ्यासक्रम', board_h: 'तुमची इयत्ता निवडा', board_l: 'बोर्ड', class_l: 'इयत्ता',
  feat_eyebrow: 'सर्वाधिक पसंतीचे', method_eyebrow: 'आमची पद्धत', method_h: 'शिका. सराव करा. मोजा.',
  m1: 'छोट्या धड्यांत शिका', m1d: 'प्रत्येक विषय १०–२० मिनिटांच्या व्हिडिओत – मराठी किंवा इंग्रजीत – आणि उजळणीसाठी नोट्स.',
  m2: 'खऱ्या पॅटर्नवर सराव', m2d: 'खऱ्या परीक्षेच्या पॅटर्नवर वेळबद्ध चाचण्या, आणि प्रत्येक प्रयत्नानंतर संपूर्ण स्पष्टीकरण.',
  m3: 'तुम्ही कुठे आहात ते पहा', m3d: 'प्रत्येक चाचणीनंतर महाराष्ट्रभरातील रँक, आणि पालकांना पाहता येईल अशी प्रगती.',
  testi_eyebrow: 'पालकांकडून', testi_h: 'विद्यार्थी व पालक काय म्हणतात', faq_eyebrow: 'प्रश्न', faq_h: 'प्रवेश घेण्यापूर्वी',
  faq_p: 'अजून शंका आहे? वर तुमचा नंबर द्या – समुपदेशक तुम्हाला कॉल करतील.',
  sort_label: 'एकूण', clear_all: 'सर्व काढा', lessons: 'धडे', notes_s: 'नोट्स', tests_s: 'चाचण्या',
  includes: 'या कोर्समध्ये', anywhere: 'कोणत्याही मोबाईल/कॉम्प्युटरवर चालते', in_lang: 'भाषा', mins: 'मि.',
  share: 'शेअर', back: 'मागे', up_next: 'पुढील धडा', of: 'पैकी', q_short: 'प्र.', end_test: 'चाचणी सबमिट करा',
  welcome_title: 'पुन्हा स्वागत', reg_title: 'मोफत खाते तयार करा', reg_sub: 'फक्त ३० सेकंद. डेमो पाहण्यासाठी पैसे लागत नाहीत.',
  login_sub: 'नोंदणी केलेल्या मोबाईल नंबरने लॉगिन करा.', art_h: 'खऱ्या परीक्षेचा सराव, तुमच्या भाषेत.',
  continue_where: 'जिथे थांबलात तिथून सुरू करा', overview: 'आढावा', all_courses: 'सर्व कोर्सेस',
});

Object.assign(I18N.en, {
  cd_eyebrow: 'The clock is ticking', cd_h: 'Every day counts. Start today.', days_left: 'days to go', cd_today: 'Exam day!', cd_tent: 'Tentative date, confirm on the official website',
  cd_cta: 'Start preparing',
  dream_eyebrow: 'Dream big', dream_h: 'One exam can change your child’s whole future',
  dream_p: 'These are not just tests. They open doors that change a family’s life, and children from every village and town get through each year.',
  d1: 'Navodaya Vidyalaya', d1v: 'Class 6–12', d1d: 'Residential schooling with food, uniform and books, and almost no fees. One seat in every district goes to the best-prepared child.',
  d2: 'Maharashtra Scholarship', d2v: '₹5,000–7,500/yr', d2d: 'A state merit scholarship for Classes 4 and 7, and a merit-list name your child will be proud of.',
  d3: 'NMMS Scholarship', d3v: '₹12,000/yr', d3d: 'Paid every year from Class 9 to 12: ₹48,000 for a child who prepares well in Class 8.',
  quote_eyebrow: 'Thought for today',
  r_top: 'Outstanding! You are exam-ready.', r_good: 'Great work! You are on the right track.', r_mid: 'Good effort. A little more practice and you’ll be at the top.', r_low: 'Every topper started here. Review the solutions and try again. You will improve.',
  better_than: 'You scored better than', of_students: 'of students who took this test', first_taker: 'You are among the first to take this test. Set the benchmark!',
  cheers: ['Well done! One step closer.', 'Excellent! Keep the momentum going.', 'Great! Toppers are made one lesson at a time.', 'Superb! Your future self will thank you.'],
  streak: 'day streak', streak_0: 'Study today to start a streak', streak_keep: 'Keep it alive: study something today', streak_done: 'Today’s study done. See you tomorrow!',
  gm: 'Good morning', ga: 'Good afternoon', ge: 'Good evening',
});
Object.assign(I18N.mr, {
  cd_eyebrow: 'वेळ वेगाने जात आहे', cd_h: 'प्रत्येक दिवस महत्त्वाचा. आजपासूनच सुरुवात करा.', days_left: 'दिवस बाकी', cd_today: 'आज परीक्षा!', cd_tent: 'तात्पुरती तारीख – अधिकृत वेबसाइटवर खात्री करा',
  cd_cta: 'तयारी सुरू करा',
  dream_eyebrow: 'मोठी स्वप्नं पाहा', dream_h: 'एक परीक्षा तुमच्या मुलाचं संपूर्ण भविष्य बदलू शकते',
  dream_p: 'या फक्त परीक्षा नाहीत – कुटुंबाचं आयुष्य बदलणारे दरवाजे आहेत. आणि दरवर्षी प्रत्येक गावातून, शहरातून मुलं यशस्वी होतात.',
  d1: 'जवाहर नवोदय विद्यालय', d1v: 'इ. ६ ते १२', d1d: 'राहणे, जेवण, गणवेश, पुस्तकांसह निवासी शिक्षण – जवळजवळ मोफत. प्रत्येक जिल्ह्यातील सर्वोत्तम तयारी असलेल्या मुलांना संधी.',
  d2: 'महाराष्ट्र शिष्यवृत्ती', d2v: '₹५,०००–७,५००/वर्ष', d2d: 'इ. ४ थी व ७ वी साठी राज्य गुणवत्ता शिष्यवृत्ती – आणि गुणवत्ता यादीत मुलाचं नाव, अभिमानाची गोष्ट.',
  d3: 'NMMS शिष्यवृत्ती', d3v: '₹१२,०००/वर्ष', d3d: 'इ. ९ ते १२ पर्यंत दरवर्षी – इ. ८ वीत चांगली तयारी केल्यास एकूण ₹४८,०००.',
  quote_eyebrow: 'आजचा विचार',
  r_top: 'अप्रतिम! तुम्ही परीक्षेसाठी तयार आहात.', r_good: 'छान! तुम्ही योग्य मार्गावर आहात.', r_mid: 'चांगला प्रयत्न! थोडा अधिक सराव आणि तुम्ही टॉपवर असाल.', r_low: 'प्रत्येक टॉपरची सुरुवात इथूनच झाली. उत्तरे पाहा आणि पुन्हा प्रयत्न करा – नक्की सुधाराल.',
  better_than: 'तुम्ही', of_students: 'विद्यार्थ्यांपेक्षा जास्त गुण मिळवले', first_taker: 'ही चाचणी देणाऱ्या पहिल्या विद्यार्थ्यांपैकी तुम्ही एक आहात – बेंचमार्क तुम्हीच ठरवा!',
  cheers: ['शाब्बास! ध्येयाच्या एक पाऊल जवळ.', 'उत्तम! असाच वेग ठेवा.', 'छान! टॉपर्स एक-एक धडा करूनच घडतात.', 'खूप छान! भविष्यातले तुम्ही आज तुमचे आभार मानतील.'],
  streak: 'दिवसांची सलग अभ्यास मालिका', streak_0: 'आज अभ्यास करून मालिका सुरू करा', streak_keep: 'मालिका तुटू देऊ नका – आज थोडा अभ्यास करा', streak_done: 'आजचा अभ्यास पूर्ण. उद्या भेटू!',
  gm: 'सुप्रभात', ga: 'नमस्कार', ge: 'शुभ संध्याकाळ',
});
const tA = (k) => I18N[LANG][k] || I18N.en[k];
const daysTo = (d) => Math.ceil((new Date(d + 'T00:00:00') - new Date(new Date().toDateString())) / 864e5);
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = document.createElement('div'); box.className = 'confetti'; box.setAttribute('aria-hidden', 'true');
  const cols = ['#f2a007', '#1d3c78', '#15803d', '#b42318', '#0e5a73'];
  box.innerHTML = Array.from({ length: 90 }, () => `<i style="left:${Math.random() * 100}%;background:${cols[Math.floor(Math.random() * cols.length)]};animation-delay:${Math.random() * .6}s;animation-duration:${2 + Math.random() * 1.6}s;transform:rotate(${Math.random() * 360}deg)"></i>`).join('');
  document.body.appendChild(box); setTimeout(() => box.remove(), 4200);
}
function quoteBand(qs, id = 'qband') {
  if (!qs.length) return '';
  const start = Math.floor(Date.now() / 864e5) % qs.length; // quote of the day
  const q = qs[start];
  return `<section class="qband" id="${id}" data-i="${start}"><div class="wrap"><span class="eyebrow">${t('quote_eyebrow')}</span><blockquote><p>${esc(L(q, 'text'))}</p><footer>— ${esc(L(q, 'author'))}</footer></blockquote>${qs.length > 1 ? `<div class="qnav"><button class="iconbtn" data-q="-1" aria-label="Previous quote">${ic('left')}</button><button class="iconbtn" data-q="1" aria-label="Next quote">${ic('right')}</button></div>` : ''}</div></section>`;
}
function bindQuotes(qs, id = 'qband') {
  const el = $('#' + id); if (!el || qs.length < 2) return;
  const show = (i) => { i = (i + qs.length) % qs.length; el.dataset.i = i; const bq = $('blockquote', el); bq.classList.remove('in'); void bq.offsetWidth; bq.classList.add('in'); $('p', bq).textContent = L(qs[i], 'text'); $('footer', bq).textContent = '— ' + L(qs[i], 'author'); };
  $$('[data-q]', el).forEach((b) => (b.onclick = () => show(Number(el.dataset.i) + Number(b.dataset.q))));
  const iv = setInterval(() => (document.body.contains(el) ? show(Number(el.dataset.i) + 1) : clearInterval(iv)), 9000);
}
const pct = (p, m) => (m > p ? Math.round((1 - p / m) * 100) : 0);
const initials = (n) => (n || '?').split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase();
const grad = (id) => coverColor(null, id); // used by banners without images
const brandMark = () => { const b = BRAND(); const m = b.match(/^(School)(Pariksha)$/i); return m ? `${esc(m[1])}<b>${esc(m[2])}</b>` : esc(b); };

/* ---------------- shell ---------------- */
function renderShell() {
  document.documentElement.lang = LANG === 'mr' ? 'mr' : 'en';
  const route = (location.hash.slice(2).split(/[/?]/)[0]) || '';
  const on = (r) => (route === r ? 'on' : '');
  $('#top').innerHTML = `<div class="wrap">
    <a href="#/" class="brand" aria-label="${esc(BRAND())} – home">${logo()}<span>${brandMark()}</span></a>
    <nav class="navlinks hide-sm" aria-label="Main"><a class="${on('')}" href="#/">${t('home')}</a><a class="${on('explore')}" href="#/explore">${t('explore')}</a><a class="${on('live')}" href="#/live">${t('live')}</a>${ME ? `<a class="${on('my')}" href="#/my">${t('my')}</a>` : ''}${ME?.role === 'admin' ? `<a class="${on('admin')}" href="#/admin">${t('admin')}</a>` : ''}</nav>
    <div class="spacer"></div>
    ${route && route !== 'explore' ? `<form class="search hide-sm" id="hsearch" role="search">${ic('search')}<input name="q" placeholder="${esc(t('find_ph'))}" aria-label="${esc(t('find_ph'))}"></form>` : ''}
    <div class="lang" role="group" aria-label="Language"><button data-lang="mr" class="${LANG === 'mr' ? 'on' : ''}" aria-pressed="${LANG === 'mr'}">मराठी</button><button data-lang="en" class="${LANG === 'en' ? 'on' : ''}" aria-pressed="${LANG === 'en'}">EN</button></div>
    ${bellHtml()}
    ${ME ? `<button class="avatar" id="av" aria-label="Account menu" aria-haspopup="menu">${ME.avatar_url ? `<img src="${esc(ME.avatar_url)}" alt="" referrerpolicy="no-referrer">` : esc(initials(ME.name))}</button>` : `<a class="btn ghost sm hide-sm" href="#/login">${t('login')}</a><a class="btn sm" href="#/register">${t('register')}</a>`}
  </div><div id="menuslot"></div>`;
  const tab = (href, icon, label, active) => `<a class="${active ? 'on' : ''}" href="${href}">${ic(icon)}${label}</a>`;
  $('#tabbar').innerHTML = tab('#/', 'home', t('home'), route === '') + tab('#/explore', 'compass', t('explore'), route === 'explore') + tab('#/live', 'live', t('live'), route === 'live') + tab('#/my', 'school', t('my'), route === 'my')
    + (ME?.role === 'admin' ? tab('#/admin', 'grid', t('admin'), route === 'admin') : '') + tab(ME ? '#/account' : '#/login', 'user', ME ? t('account') : t('login'), ['account', 'login', 'register'].includes(route));
  $$('[data-lang]').forEach((b) => (b.onclick = () => { LANG = b.dataset.lang; store.set('vp_lang', LANG); route_(); }));
  $('#hsearch')?.addEventListener('submit', (e) => { e.preventDefault(); go('#/explore?q=' + encodeURIComponent(e.target.q.value.trim())); });
  bindBell();
  $('#av')?.addEventListener('click', (e) => {
    e.stopPropagation(); const s = $('#menuslot');
    if (s.innerHTML) { s.innerHTML = ''; return; }
    s.innerHTML = `<div class="menu" role="menu"><div style="padding:8px 12px 6px"><b>${esc(ME.name)}</b><div class="xs muted num">${esc(ME.phone || ME.email || '')}</div></div><hr><a href="#/my" role="menuitem">${ic('school')} ${t('my')}</a><a href="#/settings" role="menuitem">${ic('settings')} ${t('settings')}</a><a href="#/wishlist" role="menuitem">${ic('heart')} ${t('wishlist')}</a><a href="#/live" role="menuitem">${ic('live')} ${t('live_classes')}</a>${ME.role === 'admin' ? `<a href="#/admin" role="menuitem">${ic('grid')} ${t('admin')}</a>` : ''}<hr><button id="lo" role="menuitem">${ic('logout')} ${t('logout')}</button></div>`;
    $('#lo').onclick = logout;
  });
  const soc = [['social_youtube', 'YouTube'], ['social_instagram', 'Instagram'], ['social_facebook', 'Facebook'], ['social_telegram', 'Telegram']].filter(([k]) => S(k));
  const examsShown = EXAMS.filter((e) => !/-5$|-8$/.test(e.slug)).slice(0, 7);
  $('#foot').innerHTML = `<div class="wrap">
    <div><img src="/brand/emblem-256.png" alt="${esc(BRAND())}" class="foot-emblem" width="96" height="96"><p class="muted small" style="margin:14px 0 16px;max-width:36ch">${esc(L(SITE.settings, 'footer_about') || t('foot_about'))}</p>
     <div class="contact">${S('contact_phone') ? `<a href="tel:${esc(S('contact_phone'))}">${ic('phone', 'sm')} <span class="num">${esc(S('contact_phone'))}</span></a>` : ''}${S('contact_email') ? `<a href="mailto:${esc(S('contact_email'))}">${ic('mail', 'sm')} ${esc(S('contact_email'))}</a>` : ''}${S('contact_address') ? `<span class="small muted">${ic('pin', 'sm')} ${esc(S('contact_address'))}</span>` : ''}</div></div>
    <div><h4>${t('exams')}</h4>${examsShown.map((e) => `<a href="#/explore?exam=${esc(e.slug)}">${esc(examName(e))}</a>`).join('')}</div>
    <div><h4>${t('board')}</h4><a href="#/explore?board=State">${t('state')}</a><a href="#/explore?board=CBSE">CBSE</a><a href="#/explore?board=ICSE">ICSE</a>${soc.length ? `<h4 style="margin-top:24px">Follow</h4>${soc.map(([k, l]) => `<a href="${esc(S(k))}" target="_blank" rel="noopener">${l}</a>`).join('')}` : ''}</div>
    <div><h4>${t('support')}</h4>${SITE.pages.filter((p) => p.in_footer).map((p) => `<a href="#/page/${esc(p.slug)}">${esc(L(p, 'title'))}</a>`).join('')}</div>
  </div><div class="copy"><span>© ${new Date().getFullYear()} ${esc(BRAND())}</span><span>Independent platform · not affiliated with NVS, MSCE, CBSE or CISCE</span></div>`;
  const wa = S('contact_whatsapp').replace(/\D/g, '');
  let fab = $('#wafab');
  if (wa && !fab) { fab = document.createElement('a'); fab.id = 'wafab'; fab.className = 'wafab'; fab.target = '_blank'; fab.rel = 'noopener'; fab.setAttribute('aria-label', 'Chat on WhatsApp'); fab.innerHTML = ic('chat'); document.body.appendChild(fab); }
  if (fab) { fab.href = `https://wa.me/${wa.length === 10 ? '91' + wa : wa}`; fab.hidden = !wa || ['test', 'watch', 'admin'].includes(route); }
  document.title = `${BRAND()} – ${S('brand_tagline')}`;
}
document.addEventListener('click', (e) => { if (!e.target.closest('#menuslot') && !e.target.closest('#av') && !e.target.closest('#bell')) { const s = $('#menuslot'); if (s) s.innerHTML = ''; } });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { const s = $('#menuslot'); if (s) s.innerHTML = ''; } });
async function logout() { await api('/api/auth/logout', { method: 'POST', body: {} }); ME = null; go('#/'); route_(); }

let deferredInstall = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; $('#installslot') && renderInstall(); });
function renderInstall() {
  const s = $('#installslot'); if (!s || !deferredInstall) return;
  s.innerHTML = `<div class="install">${ic('device', 'lg')}<span style="flex:1">${t('install')}</span><button class="btn sm" id="inst">${t('install_btn')}</button></div>`;
  $('#inst').onclick = async () => { deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; s.innerHTML = ''; };
}
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));

/* ---------------- components ---------------- */
function cover(c, { big = false } = {}) {
  if (c.thumbnail) return `<div class="cover img" style="background-image:url('${esc(c.thumbnail)}')">${c.featured && !big ? `<span class="seal">${LANG === 'mr' ? 'लोकप्रिय' : 'Popular'}</span>` : ''}</div>`;
  return `<div class="cover" style="--c:${coverColor(c.exam_pos, c.id)}"><span class="code">${esc(shortCode(c))}${c.class_level ? ` · ${t('class')} ${esc(c.class_level)}` : ''}</span>${c.featured && !big ? `<span class="seal">${LANG === 'mr' ? 'लोकप्रिय' : 'Popular'}</span>` : ''}<span class="ttl">${esc(c.title)}</span></div>`;
}
function courseCard(c) {
  const off = pct(c.price, c.mrp);
  return `<a class="cc" href="#/course/${c.id}"><span class="ccw">${cover(c)}<button class="wishbtn ${WISH.has(c.id) ? 'on' : ''}" data-wish="${c.id}" aria-label="${esc(t('wishlist'))}" aria-pressed="${WISH.has(c.id)}">${ic('heart', 'sm')}</button></span>
    <div class="body">
      <div class="row" style="gap:6px"><span class="badge pri">${esc(examName(c))}</span>${c.board && c.board !== 'All' ? `<span class="badge">${esc(c.board)}</span>` : ''}</div>
      <p class="desc">${esc(c.description || '')}</p>
      ${c.reviews || c.instructor ? `<div class="row" style="gap:10px;font-size:13.5px">${ratingLine(c)}${c.instructor ? `<span class="muted">${esc(c.instructor)}</span>` : ''}</div>` : ''}
      <div class="meta"><span>${ic('play', 'sm')}${c.lectures} ${t('lessons')}</span><span>${ic('test', 'sm')}${c.tests} ${t('tests_s')}</span><span>${ic('lang', 'sm')}${esc(c.language)}</span></div>
      <div class="foot"><div><span class="price">${c.price ? rs(c.price) : t('free')}</span>${c.mrp > c.price ? `<span class="mrp">${rs(c.mrp)}</span><span class="off">−${off}%</span>` : ''}</div>${ic('arrow')}</div>
    </div></a>`;
}
const skelGrid = (n = 3) => `<div class="grid">${Array(n).fill('<div class="skel card-skel"></div>').join('')}</div>`;

/* ---------------- home ---------------- */
async function home() {
  const [featured, site, ann] = await Promise.all([api('/api/courses?featured=1'), api('/api/site'), api('/api/announcements').catch(() => [])]);
  SITE = site; applyTheme(); const st = SITE.stats;
  const cats = CATS.filter((c) => EXAMS.some((e) => e.category === c));
  const opts = ['15', '18', '24', '48'];
  view(`
  <section class="hero"><div class="wrap">
    <div>
      ${L(SITE.settings, 'hero_pill') ? `<span class="eyebrow">${esc(L(SITE.settings, 'hero_pill'))}</span>` : ''}
      <h1>${emHtml(L(SITE.settings, 'hero_title'))}</h1>
      <p class="lead">${esc(L(SITE.settings, 'hero_lead'))}</p>
      <form class="finder" id="bigsearch" role="search"><div class="search">${ic('search')}<input name="q" placeholder="${esc(t('find_ph'))}" aria-label="${esc(t('find_ph'))}"></div><button class="btn">${t('find_btn')}</button></form>
      <div class="trust"><span>${ic('check', 'sm')}${t('trust1')}</span><span>${ic('check', 'sm')}${t('trust2')}</span><span>${ic('check', 'sm')}${t('trust3')}</span></div>
    </div>
    <div class="preview" aria-hidden="true">
      <span class="pv-note">${t('pv_note')}</span>
      <div class="pv-card">
        <div class="pv-top"><b>JNVST · Mental Ability</b><span class="pv-timer">${ic('clock', 'sm')}18:42</span></div>
        <div class="pv-q">${t('pv_q')}</div>
        ${opts.map((o, i) => `<div class="pv-opt ${i === 3 ? 'ok' : ''}"><span>${'ABCD'[i]}</span>${LANG === 'mr' ? num(o) : o}</div>`).join('')}
        <div class="pv-bar">${Array.from({ length: 12 }, (_, i) => `<i class="${i < 7 ? 'd' : i === 7 ? 'c' : ''}"></i>`).join('')}</div>
      </div>
      <div class="pv-rank"><small>${t('pv_rank')}</small><b>#${LANG === 'mr' ? '१२' : '12'} <em>↑</em></b></div>
    </div>
  </div></section>
  ${S('show_stats') === '1' && st.lectures >= 20 ? `<div class="stats"><div class="wrap statsgrid">${[[st.courses, 'st_courses'], [st.lectures, 'st_lectures'], [st.questions, 'st_questions'], [st.exams, 'st_exams']].map(([n, k]) => `<div><b data-count="${n}">${num(n)}</b><span>${t(k)}</span></div>`).join('')}</div></div>` : ''}
  <div class="wrap">
    <div id="installslot"></div>
    ${(() => { const up = EXAMS.filter((e) => e.exam_date && daysTo(e.exam_date) >= 0).sort((a, b) => a.exam_date.localeCompare(b.exam_date)).slice(0, 3);
      return S('show_countdown') === '1' && up.length ? `<section class="countdown"><div><span class="eyebrow">${t('cd_eyebrow')}</span><h2>${t('cd_h')}</h2></div><div class="cds">${up.map((e) => { const n = daysTo(e.exam_date); return `<a class="cd" href="#/explore?exam=${esc(e.slug)}"><b class="num">${n === 0 ? '🎯' : num(n)}</b><span class="lbl2">${n === 0 ? t('cd_today') : t('days_left')}</span><span class="nm">${esc(examName(e))}</span><span class="dt num" title="${esc(t('cd_tent'))}">${esc(new Date(e.exam_date).toLocaleDateString(LANG === 'mr' ? 'mr-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' }))}*</span></a>`; }).join('')}</div><p class="xs muted" style="margin:10px 0 0">* ${t('cd_tent')}</p></section>` : ''; })()}
    <div id="homelive"></div>
    ${SITE.banners.length ? `<section class="banners" aria-label="Offers"><div class="btrack" id="btrack">${SITE.banners.map((b) => `<a class="banner" ${b.link ? `href="${esc(b.link)}"` : ''} style="${b.image_url ? `background-image:linear-gradient(90deg,rgba(15,20,32,.7),rgba(15,20,32,.05)),url('${esc(b.image_url)}')` : `background:${coverColor(b.id)}`}"><div><b>${esc(L(b, 'title'))}</b>${L(b, 'subtitle') ? `<span>${esc(L(b, 'subtitle'))}</span>` : ''}</div></a>`).join('')}</div>${SITE.banners.length > 1 ? `<div class="bdots">${SITE.banners.map((_, i) => `<button aria-label="Slide ${i + 1}" data-b="${i}"></button>`).join('')}</div>` : ''}</section>` : ''}
    ${ann.length ? `<div class="notice">${ic('mega')}<div><b>${esc(ann[0].title)}</b> ${esc(ann[0].body)}</div></div>` : ''}

    <section class="section">
      <div class="sechead"><div><span class="eyebrow">${t('goal_eyebrow')}</span><h2>${t('goal_h')}</h2><p>${t('goal_p')}</p></div></div>
      <div class="examtabs" role="tablist">${cats.map((c, i) => `<button role="tab" class="${i === 0 ? 'on' : ''}" data-cat="${c}">${t('cat_' + c)}</button>`).join('')}</div>
      <div class="examlist" id="examlist"></div>
    </section>

    ${S('show_dreams') === '1' ? `<section class="dreams"><div class="sechead"><div><span class="eyebrow">${t('dream_eyebrow')}</span><h2>${t('dream_h')}</h2><p>${t('dream_p')}</p></div></div>
      <div class="dgrid">${[1, 2, 3].map((i) => `<div class="dream"><span class="dv">${t('d' + i + 'v')}</span><h3>${t('d' + i)}</h3><p>${t('d' + i + 'd')}</p></div>`).join('')}</div></section>` : ''}

    <section style="padding:56px 0 16px">
      <div class="sechead"><div><span class="eyebrow">${t('board_eyebrow')}</span><h2>${t('board_h')}</h2></div></div>
      <div class="picker"><h4>${t('board_l')}</h4><div class="chips">${BOARDS.slice(1).map(([v, k]) => `<a class="chip" href="#/explore?board=${v}">${t(k)}</a>`).join('')}</div>
        <h4>${t('class_l')}</h4><div class="chips">${CLASSES.map((c) => `<a class="chip num" href="#/explore?class=${c}">${num(c)}</a>`).join('')}</div></div>
    </section>

    ${featured.length ? `<section class="section">
      <div class="sechead"><div><span class="eyebrow">${t('feat_eyebrow')}</span><h2>${t('featured')}</h2></div><a href="#/explore" class="btn ghost">${t('all_courses')} ${ic('arrow', 'sm')}</a></div>
      <div class="grid">${featured.slice(0, 6).map(courseCard).join('')}</div>
    </section>` : ''}

    ${S('show_features') === '1' ? `<section class="section" style="padding-top:24px">
      <div class="sechead"><div><span class="eyebrow">${t('method_eyebrow')}</span><h2>${t('method_h')}</h2></div></div>
      <div class="method">${[1, 2, 3].map((i) => `<div><span class="n">0${i}</span><h3>${t('m' + i)}</h3><p>${t('m' + i + 'd')}</p></div>`).join('')}</div>
    </section>` : ''}

  </div>
  ${S('show_quotes') === '1' ? quoteBand(SITE.quotes || []) : ''}
  <div class="wrap">
    ${S('show_testimonials') === '1' && SITE.testimonials.length ? `<section class="section" style="padding-top:24px"><div class="sechead"><div><span class="eyebrow">${t('testi_eyebrow')}</span><h2>${t('testi_h')}</h2></div></div>
      <div class="scroll-x"><div class="tgrid">${SITE.testimonials.map((x) => `<figure class="card testi"><div class="stars" aria-label="${x.rating} / 5">${'★'.repeat(Math.max(0, Math.min(5, x.rating || 5)))}</div><blockquote>${esc(x.text)}</blockquote><figcaption>${x.photo_url ? `<img src="${esc(x.photo_url)}" alt="">` : `<span class="avatar" style="width:40px;height:40px">${esc(initials(x.name))}</span>`}<span><b>${esc(x.name)}</b><span class="xs muted">${esc(x.meta)}</span></span></figcaption></figure>`).join('')}</div></div></section>` : ''}

    <section class="section" style="padding-top:24px"><div class="cta">
      <div><h2>${t('cta_h')}</h2><p>${t('cta_p')}</p></div>
      <form id="lead" class="stack"><input name="name" placeholder="${esc(t('name'))}" maxlength="100" autocomplete="name">
        <div class="row"><input class="grow" name="phone" required inputmode="numeric" pattern="[6-9][0-9]{9}" maxlength="10" placeholder="${esc(t('mobile'))}" autocomplete="tel-national">
        <select name="class_level" style="max-width:150px" aria-label="${esc(t('class'))}">${CLASSES.map((c) => `<option value="${c}" ${c === '4' ? 'selected' : ''}>${t('class')} ${num(c)}</option>`).join('')}</select></div>
        <button class="btn accent block lg">${ic('phone')} ${t('cta_btn')}</button></form>
    </div></section>

    ${SITE.faqs.length ? `<section class="section" style="padding-top:8px"><div class="faqwrap">
      <div><span class="eyebrow">${t('faq_eyebrow')}</span><h2 style="margin-top:8px">${t('faq_h')}</h2><p class="muted">${t('faq_p')}</p></div>
      <div>${SITE.faqs.map((f) => `<details class="faq"><summary>${esc(L(f, 'q'))}</summary><p>${esc(L(f, 'a'))}</p></details>`).join('')}</div>
    </div></section>` : ''}
  </div>`);
  renderInstall(); bindQuotes(SITE.quotes || []);
  api('/api/live').then((lv) => { const list = [...lv.now, ...lv.upcoming].slice(0, 3); const h = $('#homelive'); if (!h || !list.length) return;
    h.innerHTML = `<section style="margin-top:40px"><div class="sechead" style="margin-bottom:16px"><div><span class="eyebrow">${t('live')}</span><h2>${lv.now.length ? t('live_now') : t('live_classes')}</h2></div><a class="btn ghost" href="#/live">${t('view_all')}</a></div><div class="grid">${list.map(liveCard).join('')}</div></section>`; }).catch(() => {});
  const drawExams = (cat) => {
    $('#examlist').innerHTML = EXAMS.filter((e) => e.category === cat && !/-5$|-8$/.test(e.slug)).map((e) => `<a class="exam" href="#/explore?exam=${esc(e.slug)}"><span class="ico" style="background:${coverColor(e.position, e.id)}">${ic(EXAM_ICON(e.slug, e.category))}</span><span class="txt"><b>${esc(examName(e))}</b><span class="d">${esc(e.description || '')}</span></span><span class="go">${ic('arrow')}</span></a>`).join('');
  };
  $$('[data-cat]').forEach((b) => (b.onclick = () => { $$('[data-cat]').forEach((x) => x.classList.toggle('on', x === b)); drawExams(b.dataset.cat); }));
  if (cats[0]) drawExams(cats[0]);
  const tr = $('#btrack');
  if (tr && SITE.banners.length > 1) {
    let bi = 0; const dots = $$('.bdots button'); const show = (i) => { bi = (i + SITE.banners.length) % SITE.banners.length; tr.style.transform = `translateX(-${bi * 100}%)`; dots.forEach((d, j) => d.classList.toggle('on', j === bi)); };
    dots.forEach((d) => (d.onclick = () => show(Number(d.dataset.b)))); show(0);
    const iv = setInterval(() => (document.body.contains(tr) ? show(bi + 1) : clearInterval(iv)), 6000);
  }
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) $$('[data-count]').forEach((el) => { const n = Number(el.dataset.count); if (!n) return; const t0 = performance.now(); const step = (now) => { const p = Math.min(1, (now - t0) / 900); el.textContent = num(Math.round(n * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); });
  $('#bigsearch').addEventListener('submit', (e) => { e.preventDefault(); go('#/explore?q=' + encodeURIComponent(e.target.q.value.trim())); });
  $('#lead').addEventListener('submit', async (e) => { e.preventDefault(); const b = $('button', e.target); b.disabled = true; try { await api('/api/leads', { method: 'POST', body: formData(e.target) }); e.target.reset(); toast(t('thanks_lead')); } catch (er) { toast(er.message); } b.disabled = false; });
}

/* ---------------- explore ---------------- */
async function explore(params) {
  const f = { q: params.get('q') || '', exam: params.get('exam') || '', board: params.get('board') || '', class: params.get('class') || '', category: params.get('category') || '' };
  const link = (patch) => { const p = new URLSearchParams(); Object.entries({ ...f, ...patch }).forEach(([k, v]) => v && p.set(k, v)); const s = p.toString(); return '#/explore' + (s ? '?' + s : ''); };
  const exam = EXAMS.find((e) => e.slug === f.exam);
  const active = Object.entries(f).filter(([, v]) => v);
  view(`<div class="wrap">
    <div class="pagehead">${exam ? `<span class="eyebrow">${t('cat_' + exam.category)}</span><h1 style="font-size:clamp(30px,4vw,44px);margin-top:10px">${esc(examName(exam))}</h1><p class="muted" style="max-width:70ch">${esc(exam.description || '')}</p>`
      : `<h1 style="font-size:clamp(30px,4vw,44px)">${t('explore')}</h1>`}</div>
    <div class="explore">
    <aside class="filters" id="filters">
      <form id="fs" class="search" style="max-width:none;margin-bottom:8px">${ic('search')}<input name="q" value="${esc(f.q)}" placeholder="${esc(t('find_ph'))}" aria-label="Search"></form>
      <button class="btn ghost block show-sm" id="ftoggle" style="margin-bottom:8px">${ic('filter', 'sm')} ${t('filters')}${active.length ? ` (${active.length})` : ''}</button>
      <div class="fbody">
      <h4>${t('category')}</h4><div class="flist"><a class="${!f.category && !f.exam ? 'on' : ''}" href="${link({ category: '', exam: '' })}">${t('all')}</a>${CATS.map((c) => `<a class="${f.category === c ? 'on' : ''}" href="${link({ category: c, exam: '' })}">${t('cat_' + c)}</a>`).join('')}</div>
      <h4>${t('exam')}</h4><div class="flist">${EXAMS.filter((e) => (!f.category || e.category === f.category) && !/-5$|-8$/.test(e.slug)).map((e) => `<a class="${f.exam === e.slug ? 'on' : ''}" href="${link({ exam: f.exam === e.slug ? '' : e.slug })}"><span>${esc(examName(e))}</span>${e.courses ? `<small>${e.courses}</small>` : ''}</a>`).join('')}</div>
      <h4>${t('board')}</h4><div class="chips">${BOARDS.map(([v, k]) => `<a class="chip ${f.board === v ? 'on' : ''}" href="${link({ board: v })}">${t(k)}</a>`).join('')}</div>
      <h4>${t('class')}</h4><div class="chips">${CLASSES.map((c) => `<a class="chip num ${f.class === c ? 'on' : ''}" href="${link({ class: f.class === c ? '' : c })}">${num(c)}</a>`).join('')}</div>
      </div>
    </aside>
    <section>
      <div class="toolbar"><span class="muted small" id="count"></span>${active.length ? `<div class="chips">${active.map(([k, v]) => `<a class="chip" href="${link({ [k]: '' })}">${esc(k === 'exam' ? examName(exam || {}) : k === 'category' ? t('cat_' + v) : k === 'class' ? `${t('class')} ${v}` : v)} ${ic('x', 'sm')}</a>`).join('')}<a class="btn link small" href="#/explore">${t('clear_all')}</a></div>` : ''}</div>
      <div id="res">${skelGrid(3)}</div>
    </section></div></div>`);
  $('#fs').addEventListener('submit', (e) => { e.preventDefault(); go(link({ q: e.target.q.value.trim() })); });
  $('#ftoggle').onclick = () => $('#filters').classList.toggle('open');
  const qs = new URLSearchParams(); Object.entries(f).forEach(([k, v]) => v && qs.set(k, v));
  const cs = await api('/api/courses?' + qs);
  $('#count').textContent = `${t('sort_label')} ${cs.length} ${t('results')}`;
  $('#res').innerHTML = cs.length ? `<div class="grid">${cs.map(courseCard).join('')}</div>`
    : `<div class="empty card">${ic('search')}<p>${t('no_results')}</p><a class="btn ghost" href="#/explore">${t('clear_all')}</a></div>`;
}

/* ---------------- course ---------------- */
async function course(id, params) {
  const d = await api('/api/courses/' + id); const c = d.course;
  const done = d.lectures.filter((l) => l.done).length, total = d.lectures.length;
  const tab = params.get('tab') || 'lectures';
  const off = pct(c.price, c.mrp);
  const nextLec = d.lectures.find((l) => !l.done && !l.locked) || d.lectures.find((l) => !l.locked);
  const priceHtml = `<span class="price" style="font-size:32px">${c.price ? rs(c.price) : t('free')}</span>${c.mrp > c.price ? `<span class="mrp">${rs(c.mrp)}</span><span class="off">−${off}%</span>` : ''}`;
  const buyBtn = d.enrolled
    ? (nextLec ? `<a class="btn block lg" href="#/watch/${nextLec.id}">${ic('play', 'sm')} ${t('continue')}</a>` : '')
    : `<button class="btn accent block lg" data-buy>${c.price ? t('buy') : t('enroll_free')}</button>`;
  const row = (n, st, title, sub, action, locked, kind) => `<li class="${locked ? 'locked' : ''}"><span class="n">${n}</span><span class="st ${st}">${st === 'done' ? ic('check', 'sm') : st === 'lock' ? ic('lock', 'sm') : ic(kind, 'sm')}</span><span class="t"><b>${title}</b><span>${sub}</span></span>${action}</li>`;
  const lecRows = d.lectures.map((l, i) => row(i + 1, l.done ? 'done' : l.locked ? 'lock' : '', esc(l.title), `${l.duration_min} ${t('mins')}${l.is_preview && !d.enrolled ? ` · <span class="badge ok">${t('free')}</span>` : ''}`,
    l.locked ? '' : `<a class="btn sm ${l.is_preview && !d.enrolled ? 'soft' : 'ghost'}" href="#/watch/${l.id}">${l.is_preview && !d.enrolled ? t('preview') : t('watch')}</a>`, l.locked, 'play')).join('');
  const matRows = d.materials.map((m, i) => row(i + 1, m.locked ? 'lock' : '', esc(m.title), `PDF${m.is_preview && !d.enrolled ? ` · <span class="badge ok">${t('free')}</span>` : ''}`,
    m.locked ? '' : `<a class="btn sm ghost" href="/api/materials/${m.id}/download" target="_blank" rel="noopener">${ic('download', 'sm')} ${t('open')}</a>`, m.locked, 'file')).join('');
  const testRows = d.tests.map((x, i) => row(i + 1, x.locked ? 'lock' : '', esc(x.title), `${x.questions} ${t('questions')} · ${x.duration_min} ${t('mins')}${x.is_preview && !d.enrolled ? ` · <span class="badge ok">${t('free')}</span>` : ''}`,
    x.locked ? '' : `<a class="btn sm ${x.is_preview && !d.enrolled ? 'soft' : 'ghost'}" href="#/test/${x.id}">${t('start')}</a>`, x.locked, 'test')).join('');
  const empty = `<li class="muted" style="justify-content:center;padding:28px 0">${t('coming')}</li>`;
  const panes = { lectures: lecRows || empty, notes: matRows || empty, tests: testRows || empty };
  view(`<header class="chead" style="--c:${coverColor(c.exam_pos, c.id)}"><div class="wrap">
    <div class="crumbs"><a href="#/explore">${t('explore')}</a>${ic('right', 'sm')}<a href="#/explore?exam=${esc(c.exam_slug || '')}">${esc(examName(c))}</a></div>
    <h1>${esc(c.title)}</h1>
    <div class="meta"><span>${ic('lang', 'sm')}${esc(c.language)}</span>${c.class_level ? `<span>${ic('school', 'sm')}${t('class')} ${esc(c.class_level)}</span>` : ''}${c.board && c.board !== 'All' ? `<span>${ic('book', 'sm')}${esc(c.board)}</span>` : ''}<span>${ic('play', 'sm')}${total} ${t('lessons')}</span><span>${ic('test', 'sm')}${d.tests.length} ${t('tests_s')}</span></div>
  </div></header>
  <div class="wrap"><div class="cbody">
    <div class="stack">
      ${d.enrolled && total ? `<div class="card"><div class="row" style="justify-content:space-between"><b style="display:inline-flex;gap:8px;align-items:center;color:var(--ok)">${ic('check')} ${t('enrolled')}</b><span class="small muted num">${done} / ${total} · ${Math.round((done / total) * 100)}%</span></div><div class="progress" style="margin-top:12px"><i style="width:${(done / total) * 100}%"></i></div></div>` : ''}
      <div class="card">
        <div class="tabs" role="tablist">${[['lectures', d.lectures.length], ['notes', d.materials.length], ['tests', d.tests.length]].map(([k, n]) => `<button role="tab" aria-selected="${tab === k}" class="${tab === k ? 'on' : ''}" data-tab="${k}">${t(k)} <small>${n}</small></button>`).join('')}</div>
        <ul class="items" id="pane">${panes[tab]}</ul>
      </div>
      <div class="card"><h3>${t('overview')}</h3><p style="white-space:pre-wrap;margin:0;color:var(--ink-2)">${esc(c.description)}</p></div>
    </div>
    <aside class="buybox"><div class="card">
      ${d.enrolled ? `<span class="eyebrow">${t('continue_where')}</span>` : `<div>${priceHtml}</div>`}
      <div style="margin:16px 0 0">${buyBtn}</div>
      ${!d.enrolled && c.price ? `<details style="margin-top:14px"><summary class="small" style="cursor:pointer;color:var(--primary);font-weight:600">${t('coupon')}</summary><div class="row" style="margin-top:8px"><input id="coupon" class="grow" placeholder="CODE" style="text-transform:uppercase" autocomplete="off"><button class="btn sm ghost" id="applyc">${t('apply')}</button></div><div id="cmsg" class="small" style="margin-top:6px" aria-live="polite"></div></details>` : ''}
      <ul><li style="color:var(--ink);font-weight:600">${t('includes')}</li><li>${ic('play')} ${total} ${t('lessons')}</li><li>${ic('file')} ${d.materials.length} ${t('notes')}</li><li>${ic('test')} ${d.tests.length} ${t('tests')}</li><li>${ic('clock')} ${t('valid')} ${c.validity_days} ${t('days')}</li><li>${ic('device')} ${t('anywhere')}</li></ul>
    </div></aside>
  </div></div>
  ${d.enrolled ? '' : `<div class="mbuy"><div style="flex:1"><span class="price">${c.price ? rs(c.price) : t('free')}</span>${c.mrp > c.price ? `<span class="mrp">${rs(c.mrp)}</span>` : ''}</div><button class="btn accent" data-buy>${c.price ? t('buy') : t('enroll_free')}</button></div>`}`);
  $$('[data-tab]').forEach((b) => (b.onclick = () => { $$('[data-tab]').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); }); $('#pane').innerHTML = panes[b.dataset.tab]; }));
  $$('[data-buy]').forEach((b) => (b.onclick = () => buy(c.id, ($('#coupon')?.value || '').trim())));
  $('#applyc')?.addEventListener('click', async () => {
    if (!ME) return go('#/login?next=' + encodeURIComponent('#/course/' + c.id));
    try { const q = await api('/api/checkout/quote', { method: 'POST', body: { course_id: c.id, coupon: $('#coupon').value.trim() } }); $('#cmsg').innerHTML = `<span style="color:var(--ok);font-weight:600">${t('coupon_ok')} ${t('you_pay')} ${rs(q.amount)}</span>`; }
    catch (e) { $('#cmsg').innerHTML = `<span style="color:var(--bad)">${esc(e.message)}</span>`; }
  });
  await courseExtras(d);
}

async function buy(courseId, coupon) {
  if (!ME) return go('#/login?next=' + encodeURIComponent('#/course/' + courseId));
  try {
    const o = await api('/api/checkout/create', { method: 'POST', body: { course_id: courseId, coupon } });
    const finish = () => { toast(t('paid')); route_(); };
    if (o.status === 'paid') return finish();
    if (o.mode === 'mock') {
      if (!(await confirmBox(`${t('pay_test')} ${rs(o.amount)}`))) return;
      await api('/api/checkout/verify', { method: 'POST', body: { order_id: o.order_id } }); return finish();
    }
    await loadScript('https://checkout.razorpay.com/v1/checkout.js');
    new window.Razorpay({
      key: o.key, amount: o.amount * 100, currency: 'INR', name: BRAND(), order_id: o.rzp_order_id, theme: { color: S('primary_color') || '#1d3c78' },
      prefill: { name: o.name, contact: o.phone },
      handler: async (resp) => { try { await api('/api/checkout/verify', { method: 'POST', body: { order_id: o.order_id, ...resp } }); finish(); } catch (e) { toast(e.message); } },
    }).open();
  } catch (e) { toast(e.message); }
}
const loadScript = (src) => new Promise((ok, no) => { if (document.querySelector(`script[src="${src}"]`)) return ok(); const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });

/* ---------------- watch ---------------- */
async function watch(id) {
  const l = await api('/api/lectures/' + id);
  const d = await api('/api/courses/' + l.course_id);
  const p = l.player;
  const idx = d.lectures.findIndex((x) => x.id === l.id);
  view(`<div class="wrap"><div class="watch">
    <div>
      <a href="#/course/${l.course_id}" class="small" style="display:inline-flex;gap:6px;align-items:center">${ic('left', 'sm')} ${esc(d.course.title)}</a>
      <div class="player" style="margin-top:12px">${p?.type === 'iframe' ? `<iframe src="${esc(p.src)}" title="${esc(l.title)}" allow="accelerometer; gyroscope; encrypted-media; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`
        : p ? `<video src="${esc(p.src)}" controls controlsList="nodownload" playsinline></video>` : '<p style="color:#fff;padding:20px">Video unavailable</p>'}
        <span class="wm">${esc(ME.phone || ME.email || ME.name)}</span></div>
      <div class="row" style="justify-content:space-between;margin-top:20px;align-items:flex-start">
        <div style="flex:1;min-width:220px"><span class="xs muted num">${t('lessons')} ${idx + 1} ${t('of')} ${d.lectures.length}</span><h2 style="font-size:clamp(22px,2.6vw,28px);margin-top:4px">${esc(l.title)}</h2></div>
        <button class="btn ${l.done ? 'soft' : ''}" id="mk">${ic('check', 'sm')} ${l.done ? t('done') : t('mark_done')}</button>
      </div>
      <div class="row" style="margin-top:12px;border-top:1px solid var(--line);padding-top:16px">
        ${l.prev ? `<a class="btn ghost" href="#/watch/${l.prev.id}">${ic('left', 'sm')} ${t('prev')}</a>` : ''}<div style="flex:1"></div>
        ${l.next ? `<a class="btn" href="#/watch/${l.next.id}">${t('next')} ${ic('right', 'sm')}</a>` : ''}
      </div>
    </div>
    <aside class="card" style="padding:0;align-self:start;overflow:hidden"><div style="padding:16px 16px 12px"><h3 style="margin:0">${t('playlist')}</h3><div class="progress" style="margin-top:10px"><i style="width:${d.lectures.length ? (d.lectures.filter((x) => x.done).length / d.lectures.length) * 100 : 0}%"></i></div></div><div class="playlist">
      ${d.lectures.map((x, i) => x.locked ? `<a aria-disabled="true" style="opacity:.55">${ic('lock', 'sm')}<span>${i + 1}. ${esc(x.title)}</span></a>` : `<a href="#/watch/${x.id}" class="${x.id === l.id ? 'on' : ''} ${x.done ? 'done' : ''}">${ic(x.done ? 'check' : 'play', 'sm')}<span style="flex:1">${i + 1}. ${esc(x.title)}</span><span class="xs muted num">${x.duration_min}′</span></a>`).join('')}
    </div></aside></div></div>`);
  watchExtras(l.id, l.course_id, d.enrolled).catch(() => {});
  $('#mk').onclick = async () => {
    await api(`/api/lectures/${id}/complete`, { method: 'POST', body: { done: !l.done } });
    const ch = tA('cheers'); if (!l.done) toast(ch[Math.floor(Math.random() * ch.length)]);
    if (!l.done && l.next) go('#/watch/' + l.next.id); else route_();
  };
}

/* ---------------- test engine ---------------- */
let timerHandle;
async function test(id) {
  const { test: tst, questions: qs } = await api('/api/tests/' + id);
  const ans = {}, marked = new Set(); let cur = 0, left = tst.duration_min * 60, submitted = false;
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  view(`<div class="testbar"><div class="wrap row"><div style="flex:1;min-width:0"><b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(tst.title)}</b><span class="xs muted num" id="prog"></span></div><span class="timer" id="timer" role="timer">${ic('clock', 'sm')}<span>${fmt(left)}</span></span><button class="btn sm" id="sub">${t('end_test')}</button></div></div>
    <div class="wrap"><div class="testgrid"><div class="card" id="qbox" style="padding:28px"></div>
    <aside class="card" style="align-self:start"><b class="small">${qs.length} ${t('questions')}</b><div class="palette" id="pal" style="margin-top:14px"></div>
    <div class="legend"><span><i style="background:var(--ok)"></i>${t('answered')}</span><span><i style="background:var(--accent)"></i>${t('marked')}</span><span><i style="border:1px solid var(--line-2)"></i>${t('not_answered')}</span></div></aside></div></div>`);
  const draw = () => {
    const q = qs[cur];
    $('#prog').textContent = `${Object.keys(ans).length} / ${qs.length} ${t('answered').toLowerCase()}`;
    $('#qbox').innerHTML = `<div class="row" style="justify-content:space-between;margin-bottom:16px"><span class="eyebrow">${t('q_short')} ${cur + 1} ${t('of')} ${qs.length}</span><button class="btn sm ghost" id="mr" aria-pressed="${marked.has(q.id)}">${ic('flag', 'sm')} ${t('mark_review')}</button></div>
      <div class="qtext">${esc(q.text)}</div>
      <div role="radiogroup">${q.options.map((o, j) => `<label class="opt ${ans[q.id] === j ? 'sel' : ''}"><input type="radio" name="o" value="${j}" ${ans[q.id] === j ? 'checked' : ''}><span class="k">${'ABCDEF'[j]}</span><span>${esc(o)}</span></label>`).join('')}</div>
      <div class="row" style="margin-top:22px;padding-top:18px;border-top:1px solid var(--line)"><button class="btn ghost" id="pv" ${cur === 0 ? 'disabled' : ''}>${ic('left', 'sm')} ${t('prev')}</button><button class="btn link small" id="cl">${t('clear_resp')}</button><div style="flex:1"></div>
      ${cur < qs.length - 1 ? `<button class="btn" id="nx">${t('next')} ${ic('right', 'sm')}</button>` : `<button class="btn accent" id="fin">${t('end_test')}</button>`}</div>`;
    $('#pal').innerHTML = qs.map((x, i) => `<button class="${ans[x.id] !== undefined ? 'ans' : ''} ${marked.has(x.id) ? 'mark' : ''} ${i === cur ? 'cur' : ''}" data-i="${i}" aria-label="Question ${i + 1}">${i + 1}</button>`).join('');
    $$('#qbox .opt input').forEach((r) => (r.onchange = () => { ans[q.id] = Number(r.value); draw(); }));
    $('#mr').onclick = () => { marked.has(q.id) ? marked.delete(q.id) : marked.add(q.id); draw(); };
    $('#cl').onclick = () => { delete ans[q.id]; draw(); };
    $('#pv').onclick = () => { cur--; draw(); };
    $('#nx') && ($('#nx').onclick = () => { cur++; draw(); });
    $('#fin') && ($('#fin').onclick = ask);
    $$('#pal button').forEach((b) => (b.onclick = () => { cur = Number(b.dataset.i); draw(); }));
  };
  const ask = async () => { if (await confirmBox(`${t('submit_q')} (${Object.keys(ans).length}/${qs.length} ${t('answered').toLowerCase()})`, t('submit'))) submit(); };
  const submit = async () => {
    if (submitted) return; submitted = true; clearInterval(timerHandle);
    const r = await api(`/api/tests/${id}/submit`, { method: 'POST', body: { answers: ans } });
    const p = r.total ? Math.round((r.score / r.total) * 100) : 0;
    const attempted = Object.keys(ans).length;
    const msg = p >= 85 ? t('r_top') : p >= 60 ? t('r_good') : p >= 35 ? t('r_mid') : t('r_low');
    const cmp = r.better_than === null ? t('first_taker') : LANG === 'mr' ? `${t('better_than')} <b>${num(r.better_than)}%</b> ${t('of_students')}` : `${t('better_than')} <b>${r.better_than}%</b> ${t('of_students')}`;
    view(`<div class="wrap" style="max-width:860px;padding:32px 20px 56px">
      <a href="#/course/${tst.course_id}" class="small" style="display:inline-flex;gap:6px;align-items:center">${ic('left', 'sm')} ${t('back_course')}</a>
      <div class="card result" style="margin:16px 0 28px;padding:28px"><div class="ring" style="--p:${p}"><div>${p}%</div></div>
        <div><span class="eyebrow">${esc(tst.title)}</span><h2 style="margin:8px 0 6px">${esc(msg)}</h2><p class="muted" style="margin:0 0 16px">${t('score')} <b class="num" style="color:var(--ink)">${r.score} / ${r.total}</b> · ${cmp}</p>
        <div class="kpis"><div class="kpi"><span>${t('rank')}</span><b>#${r.rank}</b></div><div class="kpi"><span>${t('accuracy')}</span><b>${attempted ? Math.round((r.score / attempted) * 100) : 0}%</b></div><div class="kpi"><span>${t('answered')}</span><b>${attempted}/${r.total}</b></div></div>
        <a class="btn ghost" style="margin-top:16px" href="#/test/${id}?r=${Date.now()}">${ic('refresh', 'sm')} ${t('retake')}</a></div></div>
      <h3>${t('solutions')}</h3>
      ${r.review.map((q, i) => `<div class="card" style="margin-bottom:14px"><div class="row" style="justify-content:space-between;margin-bottom:10px"><span class="eyebrow">${t('q_short')} ${i + 1}</span>${q.chosen === null || q.chosen === undefined ? `<span class="badge">${t('not_answered')}</span>` : q.correct ? `<span class="badge ok">${ic('check', 'sm')}</span>` : `<span class="badge bad">${ic('x', 'sm')}</span>`}</div><div class="qtext" style="font-size:17.5px">${esc(q.text)}</div>${q.options.map((o, j) => `<div class="opt ${j === q.answer_index ? 'right' : j === q.chosen ? 'wrong' : ''}" style="cursor:default"><span class="k">${'ABCDEF'[j]}</span><span>${esc(o)}</span></div>`).join('')}${q.explanation ? `<div class="expl">${ic('bulb', 'sm')}<span>${esc(q.explanation)}</span></div>` : ''}</div>`).join('')}
    </div>`);
    window.scrollTo(0, 0);
    if (p >= 80) confetti();
  };
  const tick = () => { left--; const el = $('#timer'); if (!el) return clearInterval(timerHandle); $('span', el).textContent = fmt(Math.max(0, left)); el.classList.toggle('low', left <= 60); if (left <= 0) { toast(t('time_up')); submit(); } };
  clearInterval(timerHandle); timerHandle = setInterval(tick, 1000);
  $('#sub').onclick = ask; draw();
}

/* ---------------- my learning ---------------- */
async function my() {
  if (!ME) return go('#/login?next=' + encodeURIComponent('#/my'));
  const [cs, at, sk] = await Promise.all([api('/api/my/courses'), api('/api/my/attempts'), api('/api/my/streak')]);
  const h = new Date().getHours(); const greet = h < 12 ? t('gm') : h < 17 ? t('ga') : t('ge');
  const avg = at.length ? Math.round(at.reduce((s, a) => s + (a.total ? a.score / a.total : 0), 0) / at.length * 100) : 0;
  view(`<div class="wrap dash">
    <span class="eyebrow">${t('my')}</span><h1 style="font-size:clamp(28px,4vw,40px);margin-top:10px">${greet}, ${esc(ME.name.split(' ')[0])}</h1>
    <div id="installslot"></div>
    <div class="streak"><div class="flame ${sk.streak ? 'on' : ''}" aria-hidden="true">${ic('star', 'lg')}</div><div style="flex:1;min-width:180px"><b class="num">${num(sk.streak)}</b> <span>${t('streak')}</span><p class="small muted" style="margin:2px 0 0">${sk.today ? t('streak_done') : sk.streak ? t('streak_keep') : t('streak_0')}</p></div>
      <div class="week">${sk.week.map((d) => `<span class="${d.on ? 'on' : ''}" title="${esc(d.d)}">${new Date(d.d).toLocaleDateString(LANG === 'mr' ? 'mr-IN' : 'en-IN', { weekday: 'narrow' })}</span>`).join('')}</div></div>
    ${(SITE.quotes || []).length ? (() => { const q = SITE.quotes[Math.floor(Date.now() / 864e5) % SITE.quotes.length]; return `<blockquote class="myquote"><p>${esc(L(q, 'text'))}</p><footer>— ${esc(L(q, 'author'))}</footer></blockquote>`; })() : ''}
    <div class="kpis" style="margin:24px 0 40px"><div class="kpi"><span>${t('my_courses')}</span><b>${cs.length}</b></div><div class="kpi"><span>${t('lessons')} · ${t('done')}</span><b>${cs.reduce((s, c) => s + c.done, 0)}</b></div><div class="kpi"><span>${t('tests')}</span><b>${at.length}</b></div><div class="kpi"><span>${t('accuracy')}</span><b>${avg}%</b></div></div>
    <h2 style="font-size:26px">${t('my_courses')}</h2>
    ${cs.length ? `<div class="grid">${cs.map((c) => { const p = c.total ? Math.round((c.done / c.total) * 100) : 0; return `<a class="cc" href="#/course/${c.id}">${cover(c, { big: true })}<div class="body"><div class="row" style="justify-content:space-between"><span class="small muted num">${c.done} / ${c.total} ${t('lessons')}</span><b class="small num">${p}%</b></div><div class="progress"><i style="width:${p}%"></i></div><div class="foot"><span class="xs muted">${t('valid_till')} ${esc((c.expires_at || '').slice(0, 10))}</span><span class="btn sm soft">${ic('play', 'sm')} ${t('continue')}</span></div></div></a>`; }).join('')}</div>`
      : `<div class="empty card">${ic('book')}<p>${t('no_courses')}</p><a class="btn" href="#/explore">${t('browse')}</a></div>`}
    <div id="mycerts"></div>
    <h2 style="font-size:26px;margin-top:48px">${t('test_history')}</h2>
    ${at.length ? `<div class="tblwrap"><table class="tbl"><thead><tr><th>${t('tests')}</th><th>${t('score')}</th><th>%</th><th>Date</th></tr></thead><tbody>${at.map((a) => { const p = a.total ? Math.round((a.score / a.total) * 100) : 0; return `<tr><td>${esc(a.title)}</td><td class="num"><b>${a.score}/${a.total}</b></td><td><span class="badge ${p >= 60 ? 'ok' : p >= 35 ? 'accent' : 'bad'}">${p}%</span></td><td class="muted num">${esc(a.created_at.slice(0, 16))}</td></tr>`; }).join('')}</tbody></table></div>` : `<p class="muted">—</p>`}
  </div>`);
  renderInstall();
  api('/api/my/certificates').then((cs2) => { if (cs2.length) $('#mycerts').innerHTML = `<h2 style="font-size:26px;margin-top:48px">${t('my_certs')}</h2><div class="grid">${cs2.map((x) => `<a class="card certcard" href="#/certificate/${esc(x.code)}">${ic('cert', 'lg')}<b>${esc(x.title)}</b><span class="xs muted num">${esc(x.code)}</span></a>`).join('')}</div>`; }).catch(() => {});
}
function account() {
  if (!ME) return go('#/login');
  view(`<div class="wrap dash" style="max-width:520px"><div class="card center" style="padding:32px"><span class="avatar" style="width:72px;height:72px;font-size:26px;margin:0 auto 14px">${esc(initials(ME.name))}</span><h2 style="font-size:26px">${esc(ME.name)}</h2><p class="muted num">${esc(ME.phone)}${ME.class_level ? ' · ' + t('class') + ' ' + esc(ME.class_level) : ''}</p>
   <div class="stack" style="text-align:left;margin-top:20px"><a class="btn ghost block" href="#/my">${ic('school', 'sm')} ${t('my')}</a>${ME.role === 'admin' ? `<a class="btn ghost block" href="#/admin">${ic('grid', 'sm')} ${t('admin')}</a>` : ''}<a class="btn ghost block" href="#/page/contact">${ic('chat', 'sm')} ${t('contact')}</a><button class="btn ghost block" id="lo2" style="color:var(--bad)">${ic('logout', 'sm')} ${t('logout')}</button></div></div></div>`);
  $('#lo2').onclick = logout;
}

/* ---------------- CMS pages ---------------- */
async function page(slug) {
  const p = await api('/api/pages/' + encodeURIComponent(slug));
  const body = (LANG === 'mr' && (p.body_mr || '').trim()) ? p.body_mr : p.body;
  const wa = S('contact_whatsapp').replace(/\D/g, '');
  const contact = slug === 'contact' ? `<div class="row" style="margin-top:20px">${S('contact_phone') ? `<a class="btn ghost" href="tel:${esc(S('contact_phone'))}">${ic('phone', 'sm')} ${esc(S('contact_phone'))}</a>` : ''}${wa ? `<a class="btn" style="background:#1f9e55" target="_blank" rel="noopener" href="https://wa.me/${wa.length === 10 ? '91' + wa : wa}">${ic('chat', 'sm')} WhatsApp</a>` : ''}${S('contact_email') ? `<a class="btn ghost" href="mailto:${esc(S('contact_email'))}">${ic('mail', 'sm')} ${esc(S('contact_email'))}</a>` : ''}</div>${S('contact_address') ? `<p class="muted" style="margin-top:14px">${ic('pin', 'sm')} ${esc(S('contact_address'))}</p>` : ''}` : '';
  view(`<div class="wrap dash"><article class="prose"><h1 style="font-size:clamp(30px,4vw,44px)">${esc(L(p, 'title'))}</h1>${md(body)}${contact}</article></div>`);
}
const notFound = () => view(`<div class="wrap"><div class="empty" style="padding:96px 16px">${ic('compass')}<h2>${t('not_found')}</h2><a class="btn" href="#/">${t('go_home')}</a></div></div>`);

/* ======================================================================
   ADMIN PANEL
   ====================================================================== */
const ADMIN_TABS = [['dashboard', 'chart', 'Dashboard'], ['courses', 'book', 'Courses'], ['live', 'live', 'Live classes'], ['doubts', 'help', 'Doubts'], ['reviews', 'star', 'Reviews'], ['users', 'users', 'Students'], ['orders', 'receipt', 'Orders'], ['leads', 'phone', 'Leads'], ['coupons', 'tag', 'Coupons'], ['announcements', 'mega', 'Announcements'], ['website', 'globe', 'Website']];
async function adminPage(tab, arg) {
  if (ME?.role !== 'admin') return view(`<div class="wrap"><div class="empty">${ic('lock')}<p>Admins only.</p></div></div>`);
  tab = tab || 'dashboard';
  const A = (p, o) => api('/api/admin' + p, o);
  const reload = () => adminPage(tab, arg);
  if (tab === 'courses') window.INSTR = await api('/api/instructors').catch(() => []);
  const shell = (inner) => view(`<div class="wrap"><div class="admin"><nav class="side">${ADMIN_TABS.map(([k, i, l]) => `<a class="${k === tab || (tab === 'test' && k === 'courses') ? 'on' : ''}" href="#/admin/${k}">${ic(i)} ${l}</a>`).join('')}</nav><section>${inner}</section></div></div>`);
  const onErr = (er) => toast(er.message);

  if (tab === 'dashboard') {
    const s = await A('/stats');
    const max = Math.max(1, ...s.signups.map((x) => x.n));
    shell(`<h2>Dashboard</h2><div class="kpis">${[['Students', s.students], ['Courses', s.courses], ['Enrollments', s.enrollments], ['Total revenue', rs(s.revenue)], ['Revenue (30d)', rs(s.revenue30)], ['Test attempts', s.attempts], ['New leads (7d)', s.leads]]
      .map(([k, v]) => `<div class="kpi"><span>${k}</span><b>${esc(v)}</b></div>`).join('')}</div>
      <div class="grid" style="margin-top:20px;grid-template-columns:repeat(auto-fit,minmax(320px,1fr))">
       <div class="card"><h3>Sign-ups (last 14 days)</h3>${s.signups.length ? `<div class="bars">${s.signups.map((x) => `<div style="height:${(x.n / max) * 100}%" title="${esc(x.d)}: ${x.n}"><span>${x.n}</span></div>`).join('')}</div>` : '<p class="muted">No sign-ups yet</p>'}</div>
       <div class="card"><h3>Top courses</h3><table class="tbl"><tr><th>Course</th><th>Sales</th><th>Revenue</th></tr>${s.topCourses.map((c) => `<tr><td>${esc(c.title)}</td><td>${c.sales}</td><td><b>${rs(c.revenue)}</b></td></tr>`).join('')}</table></div>
      </div>`);
  }

  if (tab === 'courses' && !arg) {
    const cs = await A('/courses');
    shell(`<div class="sechead"><h2>Courses</h2></div><details class="card"><summary style="cursor:pointer"><b>New course</b></summary>${courseForm({})}</details>
     <div class="tblwrap" style="margin-top:16px"><table class="tbl"><tr><th>Course</th><th>Exam</th><th>Board / Class</th><th>Price</th><th>Status</th><th></th></tr>
     ${cs.map((c) => `<tr><td><b>${esc(c.title)}</b>${c.featured ? ' <span class="badge accent">Featured</span>' : ''}</td><td>${esc(c.exam_name || '-')}</td><td>${esc(c.board)} ${c.class_level ? '· ' + esc(c.class_level) : ''}</td><td>${rs(c.price)}</td><td>${c.published ? '<span class="badge ok">Live</span>' : '<span class="badge">Draft</span>'}</td><td><a class="btn sm ghost" href="#/admin/courses/${c.id}">Manage</a></td></tr>`).join('')}</table></div>`);
    bindUploads();
    $('#cf').addEventListener('submit', async (e) => { e.preventDefault(); try { const r = await A('/courses', { method: 'POST', body: courseBody(e.target) }); toast('Course created'); go('#/admin/courses/' + r.id); } catch (er) { onErr(er); } });
  }

  if (tab === 'courses' && arg) {
    const id = Number(arg);
    const [cs, ct] = await Promise.all([A('/courses'), A(`/courses/${id}/content`)]);
    const c = cs.find((x) => x.id === id); if (!c) return shell('Not found');
    shell(`<div class="row" style="margin-bottom:12px"><a href="#/admin/courses" class="small">← All courses</a><span class="muted">·</span><a href="#/course/${id}" class="small">View as student ↗</a></div>
     <h2>${esc(c.title)}</h2>
     <details class="card"><summary style="cursor:pointer"><b>Course details</b></summary>${courseForm(c)}<button class="btn danger sm" id="del" style="margin-top:10px">Delete course</button></details>
     <div class="grid" style="margin-top:16px;grid-template-columns:repeat(auto-fit,minmax(320px,1fr))">
      <div class="card"><h3>Lectures (${ct.lectures.length})</h3><ul class="items">${ct.lectures.map((l) => `<li><span class="t"><b>${l.position}. ${esc(l.title)}</b><span class="xs muted">${l.section ? esc(l.section) + ' · ' : ''}${l.duration_min}m ${l.is_preview ? '· free preview' : ''}</span></span><button class="iconbtn" data-del="/lectures/${l.id}" aria-label="Delete">${ic('trash')}</button></li>`).join('')}</ul>
       <form id="lf" class="stack" style="margin-top:12px"><input name="title" placeholder="Lecture title" required><input name="video_url" placeholder="Bunny Stream / YouTube (unlisted) / Vimeo / MP4 URL" required><input name="section" placeholder="Chapter / section (e.g. Number series)" list="secs"><datalist id="secs">${[...new Set(ct.lectures.map((l) => l.section).filter(Boolean))].map((x) => `<option value="${esc(x)}">`).join('')}</datalist>
       <div class="row"><input class="grow" name="duration_min" type="number" min="0" placeholder="Minutes"><input class="grow" name="position" type="number" placeholder="Order #"></div>
       <label class="check"><input type="checkbox" name="is_preview"> Free preview</label><button class="btn sm">Add lecture</button></form></div>
      <div class="card"><h3>Notes & PDFs (${ct.materials.length})</h3><ul class="items">${ct.materials.map((m) => `<li><span class="t"><b>${esc(m.title)}</b><span class="xs muted">${esc(m.original_name)} ${m.is_preview ? '· free' : ''}</span></span><button class="iconbtn" data-del="/materials/${m.id}" aria-label="Delete">${ic('trash')}</button></li>`).join('')}</ul>
       <form id="mf" class="stack" style="margin-top:12px"><input name="title" placeholder="Title (e.g. Chapter 1 notes)"><input name="file" type="file" accept="application/pdf" required>
       <label class="check"><input type="checkbox" name="is_preview" value="1"> Free preview</label><button class="btn sm">Upload PDF</button></form></div>
      <div class="card"><h3>Tests (${ct.tests.length})</h3><ul class="items">${ct.tests.map((x) => `<li><span class="t"><b>${esc(x.title)}</b><span class="xs muted">${x.questions} Q · ${x.duration_min}m ${x.is_preview ? '· free' : ''}</span></span><a class="btn sm ghost" href="#/admin/test/${x.id}">Questions</a><button class="iconbtn" data-del="/tests/${x.id}" aria-label="Delete">${ic('trash')}</button></li>`).join('')}</ul>
       <form id="tf2" class="stack" style="margin-top:12px"><input name="title" placeholder="Test title" required><input name="duration_min" type="number" min="1" placeholder="Duration (minutes)">
       <label class="check"><input type="checkbox" name="is_preview"> Free test</label><button class="btn sm">Add test</button></form></div></div>`);
    bindUploads();
    $('#cf').addEventListener('submit', async (e) => { e.preventDefault(); try { await A('/courses/' + id, { method: 'PUT', body: courseBody(e.target) }); toast('Saved'); reload(); } catch (er) { onErr(er); } });
    $('#del').onclick = async () => { if (await confirmBox('Delete this course and all its content?', 'Delete')) { try { await A('/courses/' + id, { method: 'DELETE' }); go('#/admin/courses'); } catch (er) { onErr(er); } } };
    $('#lf').addEventListener('submit', async (e) => { e.preventDefault(); try { await A(`/courses/${id}/lectures`, { method: 'POST', body: { ...formData(e.target), is_preview: e.target.is_preview.checked } }); toast('Lecture added'); reload(); } catch (er) { onErr(er); } });
    $('#tf2').addEventListener('submit', async (e) => { e.preventDefault(); try { await A(`/courses/${id}/tests`, { method: 'POST', body: { ...formData(e.target), is_preview: e.target.is_preview.checked } }); reload(); } catch (er) { onErr(er); } });
    $('#mf').addEventListener('submit', async (e) => { e.preventDefault(); const b = $('button', e.target); b.disabled = true; b.textContent = 'Uploading…'; try { await A(`/courses/${id}/materials`, { method: 'POST', body: new FormData(e.target) }); toast('Uploaded'); reload(); } catch (er) { onErr(er); b.disabled = false; b.textContent = 'Upload PDF'; } });
    bindDeletes(A, reload);
  }

  if (tab === 'test') {
    const qs = await A(`/tests/${arg}/questions`);
    shell(`<a href="javascript:history.back()" class="small">← Back</a><h2>Questions (${qs.length})</h2>
     ${qs.map((q, i) => `<div class="card" style="margin-bottom:10px"><div class="row" style="justify-content:space-between;align-items:flex-start"><b style="flex:1">Q${i + 1}. ${esc(q.text)}</b><button class="iconbtn" data-del="/questions/${q.id}" aria-label="Delete">${ic('trash')}</button></div>${q.options.map((o, j) => `<div class="small" style="padding:3px 0;${j === q.answer_index ? 'color:var(--ok);font-weight:700' : ''}">${j === q.answer_index ? '✔' : '○'} ${'ABCDEF'[j]}. ${esc(o)}</div>`).join('')}${q.explanation ? `<div class="xs muted">${esc(q.explanation)}</div>` : ''}</div>`).join('')}
     <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(320px,1fr));margin-top:16px">
     <div class="card"><h3>Add a question</h3><form id="qf" class="stack"><textarea name="text" rows="3" placeholder="Question (Marathi / English)" required></textarea>
      ${[0, 1, 2, 3].map((i) => `<input name="opt${i}" placeholder="Option ${'ABCD'[i]}" ${i < 2 ? 'required' : ''}>`).join('')}
      <div class="row"><label class="small grow">Correct option</label><select name="answer_index" style="max-width:120px">${[0, 1, 2, 3].map((i) => `<option value="${i}">${'ABCD'[i]}</option>`).join('')}</select></div>
      <input name="explanation" placeholder="Explanation (optional)"><button class="btn sm">Add question</button></form></div>
     <div class="card"><h3>Bulk import (CSV / paste from Excel)</h3><p class="small muted">One question per line:<br><code>question,optionA,optionB,optionC,optionD,correct(A-D),explanation</code></p>
      <form id="bf" class="stack"><textarea name="csv" rows="9" placeholder="25% of 240 is?,40,60,80,120,B,240×25/100=60"></textarea><button class="btn sm">Import</button></form></div></div>`);
    $('#qf').addEventListener('submit', async (e) => { e.preventDefault(); const f = formData(e.target);
      try { await A(`/tests/${arg}/questions`, { method: 'POST', body: { text: f.text, options: [f.opt0, f.opt1, f.opt2, f.opt3].filter(Boolean), answer_index: Number(f.answer_index), explanation: f.explanation } }); toast('Added'); reload(); } catch (er) { onErr(er); } });
    $('#bf').addEventListener('submit', async (e) => { e.preventDefault();
      const bulk = e.target.csv.value.split('\n').map(parseCsvLine).filter((p) => p.length >= 6).map((p) => ({ text: p[0], options: p.slice(1, 5).filter(Boolean), answer_index: 'ABCD'.indexOf(p[5].trim().toUpperCase()), explanation: p[6] || '' }));
      try { const r = await A(`/tests/${arg}/questions`, { method: 'POST', body: { bulk } }); toast(`Imported ${r.added}`); reload(); } catch (er) { onErr(er); } });
    bindDeletes(A, reload);
  }

  if (tab === 'users') {
    const [us, cs] = await Promise.all([A('/users?q=' + encodeURIComponent(arg || '')), A('/courses')]);
    shell(`<h2>Students</h2><form id="us" class="search" style="max-width:420px;margin-bottom:16px">${ic('search')}<input name="q" placeholder="Search name or mobile" value="${esc(arg || '')}"></form>
     <div class="tblwrap"><table class="tbl"><tr><th>Student</th><th>Class / District</th><th>Courses</th><th>Role</th><th>Status</th><th>Grant course</th></tr>
     ${us.map((u) => `<tr><td><b>${esc(u.name)}</b><div class="xs muted">${esc(u.phone)}</div></td><td>${esc(u.class_level || '')} ${esc(u.district || '')}</td><td>${u.courses}</td>
      <td><select data-role="${u.id}" ${u.id === ME.id ? 'disabled' : ''}><option ${u.role === 'student' ? 'selected' : ''}>student</option><option ${u.role === 'admin' ? 'selected' : ''}>admin</option></select></td>
      <td><button class="btn sm ${u.blocked ? 'danger' : 'ghost'}" data-block="${u.id}" ${u.id === ME.id ? 'disabled' : ''}>${u.blocked ? 'Blocked' : 'Active'}</button></td>
      <td><select data-grant="${u.id}"><option value="">—</option>${cs.map((c) => `<option value="${c.id}">${esc(c.title)}</option>`).join('')}</select></td></tr>`).join('')}</table></div>`);
    $('#us').addEventListener('submit', (e) => { e.preventDefault(); go('#/admin/users/' + encodeURIComponent(e.target.q.value)); });
    const row = (id) => us.find((u) => u.id === Number(id));
    $$('[data-role]').forEach((s) => (s.onchange = async () => { const u = row(s.dataset.role); await A('/users/' + u.id, { method: 'PUT', body: { role: s.value, blocked: !!u.blocked } }).catch(onErr); reload(); }));
    $$('[data-block]').forEach((b) => (b.onclick = async () => { const u = row(b.dataset.block); await A('/users/' + u.id, { method: 'PUT', body: { role: u.role, blocked: !u.blocked } }).catch(onErr); reload(); }));
    $$('[data-grant]').forEach((s) => (s.onchange = async () => { if (!s.value) return; await A(`/users/${s.dataset.grant}/grant`, { method: 'POST', body: { course_id: Number(s.value) } }).then(() => toast('Access granted')).catch(onErr); reload(); }));
  }

  if (tab === 'orders') {
    const os = await A('/orders');
    const csv = ['id,date,student,mobile,course,amount,coupon,status,payment_id'].concat(os.map((o) => [o.id, o.created_at, o.user_name, o.phone, o.course_title, o.amount, o.coupon_code || '', o.status, o.provider_payment_id || ''].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))).join('\n');
    shell(`<div class="sechead"><h2>Orders</h2><a class="btn ghost sm" download="orders.csv" href="data:text/csv;charset=utf-8,${encodeURIComponent(csv)}">${ic('download','sm')} Export CSV</a></div>
     <div class="tblwrap"><table class="tbl"><tr><th>#</th><th>Date</th><th>Student</th><th>Course</th><th>Amount</th><th>Coupon</th><th>Status</th></tr>
     ${os.map((o) => `<tr><td>${o.id}</td><td class="muted">${esc(o.created_at.slice(0, 16))}</td><td><b>${esc(o.user_name)}</b><div class="xs muted">${esc(o.phone)}</div></td><td>${esc(o.course_title)}</td><td><b>${rs(o.amount)}</b></td><td>${esc(o.coupon_code || '')}</td><td><span class="badge ${o.status === 'paid' ? 'ok' : o.status === 'failed' ? 'bad' : ''}">${esc(o.status)}</span></td></tr>`).join('') || '<tr><td colspan="7" class="muted">No orders yet</td></tr>'}</table></div>`);
  }

  if (tab === 'leads') {
    const ls = await A('/leads');
    shell(`<h2>Call-back leads</h2><p class="muted small">Requests from the homepage "Request a call back" form. Call them within 24 hours: this is your best conversion channel.</p>
     <div class="tblwrap"><table class="tbl"><tr><th>Date</th><th>Name</th><th>Mobile</th><th>Class</th><th></th></tr>
     ${ls.map((l) => `<tr><td class="muted">${esc(l.created_at.slice(0, 16))}</td><td>${esc(l.name || '-')}</td><td><a href="tel:${esc(l.phone)}">${esc(l.phone)}</a> · <a href="https://wa.me/91${esc(l.phone)}" target="_blank" rel="noopener">WhatsApp</a></td><td>${esc(l.class_level || '')}</td><td><button class="iconbtn" data-del="/leads/${l.id}" aria-label="Mark done">${ic('check')}</button></td></tr>`).join('') || '<tr><td colspan="5" class="muted">No leads yet</td></tr>'}</table></div>`);
    bindDeletes(A, reload);
  }

  if (tab === 'coupons') {
    const cps = await A('/coupons');
    shell(`<h2>Coupons</h2><form id="cpf" class="card row" style="margin-bottom:16px"><input class="grow" name="code" placeholder="CODE" required style="text-transform:uppercase"><input class="grow" name="percent_off" type="number" min="1" max="100" placeholder="% off" required><input class="grow" name="max_uses" type="number" min="1" placeholder="Max uses"><button class="btn">Save coupon</button></form>
     <div class="tblwrap"><table class="tbl"><tr><th>Code</th><th>Discount</th><th>Used</th><th>Status</th><th></th></tr>${cps.map((c) => `<tr><td><b>${esc(c.code)}</b></td><td>${c.percent_off}%</td><td>${c.used}/${c.max_uses}</td><td>${c.active ? '<span class="badge ok">Active</span>' : '<span class="badge">Disabled</span>'}</td><td>${c.active ? `<button class="btn sm ghost" data-del="/coupons/${encodeURIComponent(c.code)}">Disable</button>` : ''}</td></tr>`).join('')}</table></div>`);
    $('#cpf').addEventListener('submit', async (e) => { e.preventDefault(); try { await A('/coupons', { method: 'POST', body: formData(e.target) }); reload(); } catch (er) { onErr(er); } });
    bindDeletes(A, reload);
  }

  if (tab === 'live') {
    const [ls, cs, ins] = await Promise.all([A('/live'), A('/courses'), api('/api/instructors')]);
    const local = (iso) => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
    const form = (l = {}) => `<form class="formgrid lf" data-id="${l.id || ''}" style="margin-top:12px">
      <div class="full"><label class="lbl">Title</label><input name="title" required value="${esc(l.title || '')}"></div>
      <div><label class="lbl">Starts at (your local time)</label><input type="datetime-local" name="starts_at" required value="${l.starts_at ? local(l.starts_at) : ''}"></div>
      <div><label class="lbl">Duration (minutes)</label><input type="number" name="duration_min" min="5" value="${l.duration_min || 60}"></div>
      <div><label class="lbl">Course (who can join)</label><select name="course_id"><option value="">Everyone (public)</option>${cs.map((c) => `<option value="${c.id}" ${c.id === l.course_id ? 'selected' : ''}>${esc(c.title)}</option>`).join('')}</select></div>
      <div><label class="lbl">Teacher</label><select name="instructor_id"><option value="">—</option>${ins.map((i) => `<option value="${i.id}" ${i.id === l.instructor_id ? 'selected' : ''}>${esc(i.name)}</option>`).join('')}</select></div>
      <div class="full"><label class="lbl">YouTube Live link (embedded on the site with chat beside it)</label><input name="stream_url" placeholder="https://www.youtube.com/live/…" value="${esc(l.stream_url || '')}"></div>
      <div class="full"><label class="lbl">Zoom / Google Meet link (optional – opens in a new tab)</label><input name="join_url" placeholder="https://meet.google.com/…" value="${esc(l.join_url || '')}"></div>
      <div class="full"><label class="lbl">Recording link (after the class)</label><input name="recording_url" placeholder="https://www.youtube.com/watch?v=…" value="${esc(l.recording_url || '')}"></div>
      <div class="full"><label class="lbl">Description</label><textarea name="description" rows="2">${esc(l.description || '')}</textarea></div>
      <label class="check"><input type="checkbox" name="is_free" ${l.is_free ? 'checked' : ''}> Free for everyone (even if linked to a course)</label>
      <label class="check"><input type="checkbox" name="chat_enabled" ${l.id && !l.chat_enabled ? '' : 'checked'}> Live chat on</label>
      ${l.id ? '' : '<label class="check"><input type="checkbox" name="notify" checked> Notify students now</label>'}
      <div class="full row"><button class="btn sm">${l.id ? 'Save' : 'Schedule class'}</button>${l.id ? `<a class="btn sm ghost" href="#/live/${l.id}" target="_blank">Open room ↗</a><button type="button" class="btn sm ghost" data-att="${l.id}">Attendance (${l.attendees})</button><button type="button" class="btn sm ghost" data-dell="${l.id}">Delete</button>` : ''}</div><div class="full" id="att${l.id || 0}"></div></form>`;
    const badge = (st) => st === 'live' ? '<span class="livepill">LIVE</span>' : st === 'opening' ? '<span class="badge accent">Opening</span>' : st === 'ended' ? '<span class="badge">Ended</span>' : '<span class="badge pri">Upcoming</span>';
    shell(`<h2>Live classes</h2><p class="muted small">Go live on YouTube (unlisted is fine), paste the link here, and students watch inside ${esc(BRAND())} with real-time chat. Zoom or Google Meet links work too.</p>
      <details class="card" open><summary><b>Schedule a live class</b></summary>${form()}</details>
      ${ls.map((l) => `<details class="card" style="margin-top:10px"><summary>${badge(l.status)} <b>${esc(l.title)}</b> <span class="xs muted">${esc(new Date(l.starts_at).toLocaleString())} · ${esc(l.course_title || 'Public')}</span></summary>${form(l)}</details>`).join('')}`);
    $$('form.lf').forEach((f) => f.addEventListener('submit', async (e) => { e.preventDefault(); const b = formData(f);
      const body = { ...b, starts_at: new Date(b.starts_at).toISOString(), is_free: f.is_free.checked, chat_enabled: f.chat_enabled.checked, notify: f.notify ? f.notify.checked : false };
      try { await A('/live' + (f.dataset.id ? '/' + f.dataset.id : ''), { method: f.dataset.id ? 'PUT' : 'POST', body }); toast('Saved'); reload(); } catch (er) { onErr(er); } }));
    $$('[data-dell]').forEach((b) => (b.onclick = async () => { if (await confirmBox('Delete this live class?')) { await A('/live/' + b.dataset.dell, { method: 'DELETE' }); reload(); } }));
    $$('[data-att]').forEach((b) => (b.onclick = async () => { const r = await A(`/live/${b.dataset.att}/attendance`); $('#att' + b.dataset.att).innerHTML = r.length ? `<div class="tblwrap" style="margin-top:10px"><table class="tbl"><tr><th>Student</th><th>Mobile</th><th>Joined</th></tr>${r.map((x) => `<tr><td>${esc(x.name)}</td><td class="num">${esc(x.phone)}</td><td class="muted">${esc(x.joined_at)}</td></tr>`).join('')}</table></div>` : '<p class="muted small">No one has joined yet.</p>'; }));
    return;
  }
  if (tab === 'doubts') {
    const ds = await A('/doubts');
    shell(`<h2>Doubts inbox</h2><p class="muted small">Unanswered doubts are listed first. Fast answers are the #1 reason students renew.</p>
      <div class="tblwrap"><table class="tbl"><tr><th>Question</th><th>Course</th><th>Student</th><th>Status</th><th></th></tr>${ds.map((d) => `<tr><td><a href="#/doubt/${d.id}"><b>${esc(d.title)}</b></a><div class="xs muted">${esc(d.created_at)}</div></td><td>${esc(d.course_title)}</td><td>${esc(d.name)}</td><td>${d.staff_replies ? '<span class="badge ok">Answered</span>' : '<span class="badge bad">Waiting</span>'}</td><td><a class="btn sm" href="#/doubt/${d.id}">Answer</a> <button class="iconbtn" data-del="/doubts/${d.id}" aria-label="Delete">${ic('trash')}</button></td></tr>`).join('') || '<tr><td colspan="5" class="muted">No doubts yet</td></tr>'}</table></div>`);
    bindDeletes(A, reload); return;
  }
  if (tab === 'reviews') {
    const rv = await A('/reviews');
    shell(`<h2>Reviews</h2><div class="tblwrap"><table class="tbl"><tr><th>Course</th><th>Student</th><th>Rating</th><th>Review</th><th></th></tr>${rv.map((r) => `<tr><td>${esc(r.course_title)}</td><td>${esc(r.name)}</td><td>${stars(r.rating, 'sm')}</td><td style="max-width:360px">${esc(r.body || '')}</td><td><button class="iconbtn" data-del="/reviews/${r.user_id}/${r.course_id}" aria-label="Delete">${ic('trash')}</button></td></tr>`).join('') || '<tr><td colspan="5" class="muted">No reviews yet</td></tr>'}</table></div>`);
    bindDeletes(A, reload); return;
  }
  if (tab === 'website') return websiteAdmin(arg || 'settings', shell, A, reload);

  if (tab === 'announcements') {
    const an = await api('/api/announcements');
    const cs0 = await A('/courses');
    shell(`<h2>Announcements</h2><div class="card" style="margin-bottom:16px"><h3>${ic('bell', 'sm')} Send a notification</h3><p class="small muted">Appears in students’ notification bell.</p><form id="ntf" class="formgrid"><div class="full"><input name="title" placeholder="Title, e.g. Mock test #3 is live" required></div><div class="full"><input name="body" placeholder="Message (optional)"></div><div><select name="course_id"><option value="">All students</option>${cs0.map((c) => `<option value="${c.id}">Enrolled in: ${esc(c.title)}</option>`).join('')}</select></div><div><input name="link" placeholder="Link, e.g. #/live or #/course/1"></div><div class="full"><button class="btn sm">Send</button></div></form></div><form id="anf" class="card stack" style="margin-bottom:16px"><input name="title" placeholder="Title" required><textarea name="body" rows="2" placeholder="Message (shown on the homepage)"></textarea><button class="btn sm">Publish</button></form>
     <div class="card"><ul class="items">${an.map((a) => `<li><span class="t"><b>${esc(a.title)}</b><span class="small muted">${esc(a.body)}</span></span><button class="iconbtn" data-del="/announcements/${a.id}" aria-label="Delete">${ic('trash')}</button></li>`).join('') || '<li class="muted">None</li>'}</ul></div>`);
    $('#ntf').addEventListener('submit', async (e) => { e.preventDefault(); try { const r = await A('/notify', { method: 'POST', body: formData(e.target) }); toast(`Sent to ${r.sent} students`); e.target.reset(); } catch (er) { onErr(er); } });
    $('#anf').addEventListener('submit', async (e) => { e.preventDefault(); try { await A('/announcements', { method: 'POST', body: formData(e.target) }); reload(); } catch (er) { onErr(er); } });
    bindDeletes(A, reload);
  }
}
function bindDeletes(A, reload) {
  $$('[data-del]').forEach((b) => (b.onclick = async () => { if (!(await confirmBox(t('confirm')))) return; try { await A(b.dataset.del, { method: 'DELETE' }); reload(); } catch (e) { toast(e.message); } }));
}
function parseCsvLine(line) {
  const out = []; let cur = '', q = false;
  for (const ch of line.trim()) { if (ch === '"') q = !q; else if ((ch === ',' || ch === '\t') && !q) { out.push(cur.trim()); cur = ''; } else cur += ch; }
  out.push(cur.trim()); return out;
}
/* ---------- Website CMS admin ---------- */
function imageField(name, label, val) {
  return `<label class="lbl">${esc(label)}</label><div class="row imgfield"><input class="grow" name="${name}" value="${esc(val || '')}" placeholder="https://… or upload →">${val ? `<img src="${esc(val)}" alt="" class="imgprev">` : ''}<label class="btn sm soft" style="cursor:pointer">${ic('image','sm')} Upload<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-upload="${name}" hidden></label></div>`;
}
function bindUploads(root = document) {
  $$('[data-upload]', root).forEach((inp) => (inp.onchange = async () => {
    const f = inp.files[0]; if (!f) return; const fd = new FormData(); fd.append('file', f);
    try { const r = await api('/api/admin/images', { method: 'POST', body: fd }); const target = inp.closest('form').elements[inp.dataset.upload]; target.value = r.url; toast('Image uploaded – remember to Save'); }
    catch (e) { toast(e.message); }
  }));
}
const CMS = {
  banners: { label: 'Banners', hint: 'Slides shown at the top of the homepage. They rotate every 5 seconds.', row: (r) => `${r.active ? '●' : '○'} ${r.title || '(no title)'}`,
    fields: [['title', 'Title (English)'], ['title_mr', 'Title (मराठी)'], ['subtitle', 'Subtitle (English)'], ['subtitle_mr', 'Subtitle (मराठी)'], ['image_url', 'Background image (wide, e.g. 1600×500)', 'image'], ['link', 'Link when clicked (e.g. #/course/1 or https://…)'], ['position', 'Order', 'int'], ['active', 'Show on website', 'bool']] },
  faqs: { label: 'FAQs', hint: 'Questions shown at the bottom of the homepage.', row: (r) => r.q_en || r.q_mr,
    fields: [['q_en', 'Question (English)'], ['q_mr', 'Question (मराठी)'], ['a_en', 'Answer (English)', 'textarea'], ['a_mr', 'Answer (मराठी)', 'textarea'], ['position', 'Order', 'int']] },
  testimonials: { label: 'Testimonials', hint: 'Real reviews from students or parents. Publish only genuine reviews, with the family’s permission.', row: (r) => `${r.active ? '●' : '○'} ${r.name} – ${'★'.repeat(r.rating || 0)}`,
    fields: [['name', 'Name'], ['meta', 'Detail (e.g. "Parent, Satara · JNVST 2026 selected")'], ['text', 'Review', 'textarea'], ['rating', 'Rating (1–5)', 'int'], ['photo_url', 'Photo (optional)', 'image'], ['position', 'Order', 'int'], ['active', 'Show on website', 'bool']] },
  instructors: { label: 'Instructors', hint: 'Teacher profiles shown on course pages, live classes and certificates. A real photo and experience builds parents’ trust.', row: (r) => `${r.name}${r.title ? ' – ' + r.title : ''}`,
    fields: [['name', 'Name (English)'], ['name_mr', 'Name (मराठी)'], ['title', 'Subjects / designation'], ['photo_url', 'Photo (square)', 'image'], ['bio', 'Bio & experience (English)', 'textarea'], ['bio_mr', 'Bio (मराठी)', 'textarea'], ['position', 'Order', 'int']] },
  quotes: { label: 'Quotes', hint: 'Motivational quotes. One is shown as "Thought for today" on the homepage and in My Learning, and they rotate. Please attribute quotes correctly.', row: (r) => `${r.active ? '●' : '○'} ${(r.text_en || r.text_mr || '').slice(0, 70)} — ${r.author || ''}`,
    fields: [['text_en', 'Quote (English)', 'textarea'], ['text_mr', 'Quote (मराठी)', 'textarea'], ['author', 'Author (English)'], ['author_mr', 'Author (मराठी)'], ['position', 'Order', 'int'], ['active', 'Show on website', 'bool']] },
  pages: { label: 'Pages', hint: 'About, Contact, Privacy, Terms, Refund or any new page, served at /#/page/<slug>. Formatting: **bold**, [link](https://…), "- " for bullet lists, "# " for headings, blank line for a new paragraph.', row: (r) => `/${r.slug} – ${r.title}`,
    fields: [['slug', 'URL slug (a-z, 0-9, -)'], ['title', 'Title (English)'], ['title_mr', 'Title (मराठी)'], ['body', 'Content (English)', 'textarea'], ['body_mr', 'Content (मराठी, optional)', 'textarea'], ['in_footer', 'Show link in footer', 'bool']] },
};
const SETTINGS_FORM = [
  ['Brand', [['brand_name', 'Website / brand name'], ['brand_tagline', 'Tagline (browser title)'], ['logo_url', 'Logo (square PNG)', 'image'], ['primary_color', 'Primary colour', 'color'], ['accent_color', 'Accent colour', 'color'], ['default_language', 'Default language', 'select', ['mr', 'en']]]],
  ['Homepage hero', [['hero_pill_en', 'Top badge (English)'], ['hero_pill_mr', 'Top badge (मराठी)'], ['hero_title_en', 'Headline (English). Wrap words in <em>…</em> to highlight'], ['hero_title_mr', 'Headline (मराठी)'], ['hero_lead_en', 'Sub-text (English)', 'textarea'], ['hero_lead_mr', 'Sub-text (मराठी)', 'textarea']]],
  ['Homepage sections', [['show_stats', 'Show live numbers card', 'bool'], ['show_testimonials', 'Show testimonials', 'bool'], ['show_features', 'Show "Learn. Practise. Measure."', 'bool'], ['show_countdown', 'Show exam countdowns (set dates in Exams)', 'bool'], ['show_quotes', 'Show "Thought for today" quotes', 'bool'], ['show_dreams', 'Show "Dream big" section for parents', 'bool']]],
  ['Contact & footer', [['contact_phone', 'Phone'], ['contact_whatsapp', 'WhatsApp number (shows a floating chat button)'], ['contact_email', 'Email'], ['contact_address', 'Address'], ['footer_about_en', 'Footer text (English)', 'textarea'], ['footer_about_mr', 'Footer text (मराठी)', 'textarea']]],
  ['Social links', [['social_youtube', 'YouTube URL'], ['social_instagram', 'Instagram URL'], ['social_facebook', 'Facebook URL'], ['social_telegram', 'Telegram URL']]],
];
function fieldHtml([k, label, type, opts], v) {
  if (type === 'bool') return `<label class="check full"><input type="checkbox" name="${k}" ${String(v) === '1' || v === 1 ? 'checked' : ''}> ${esc(label)}</label>`;
  if (type === 'image') return `<div class="full">${imageField(k, label, v)}</div>`;
  if (type === 'textarea') return `<div class="full"><label class="lbl">${esc(label)}</label><textarea name="${k}" rows="${k.startsWith('body') ? 10 : 3}">${esc(v ?? '')}</textarea></div>`;
  if (type === 'color') return `<div><label class="lbl">${esc(label)}</label><input type="color" name="${k}" value="${esc(v || '#000000')}" style="height:46px;padding:4px"></div>`;
  if (type === 'date') return `<div><label class="lbl">${esc(label)}</label><input type="date" name="${k}" value="${esc(v || '')}"></div>`;
  if (type === 'select') return `<div><label class="lbl">${esc(label)}</label><select name="${k}">${opts.map((o) => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select></div>`;
  return `<div class="${type === 'int' ? '' : 'full'}"><label class="lbl">${esc(label)}</label><input name="${k}" ${type === 'int' ? 'type="number"' : ''} value="${esc(v ?? '')}"></div>`;
}
const readFields = (form, fields) => Object.fromEntries(fields.map(([k, , type]) => [k, type === 'bool' ? (form.elements[k].checked ? 1 : 0) : form.elements[k].value]));
async function refreshSite() { SITE = await api('/api/site'); applyTheme(); renderShell(); }

async function websiteAdmin(sub, shell, A, reload) {
  const subs = [['settings', 'Settings'], ['banners', 'Banners'], ['faqs', 'FAQs'], ['instructors', 'Instructors'], ['testimonials', 'Testimonials'], ['quotes', 'Quotes'], ['pages', 'Pages'], ['exams', 'Exams & categories']];
  const nav = `<h2>Website</h2><p class="muted small">Everything on the public website is edited here. Changes go live immediately, with no developer needed.</p><div class="chips" style="margin-bottom:18px">${subs.map(([k, l]) => `<a class="chip ${k === sub ? 'on' : ''}" href="#/admin/website/${k}">${l}</a>`).join('')}</div>`;

  if (sub === 'settings') {
    const st = await A('/settings');
    const all = SETTINGS_FORM.flatMap(([, f]) => f);
    shell(nav + `<form id="sf">${SETTINGS_FORM.map(([h, f]) => `<div class="card" style="margin-bottom:14px"><h3>${h}</h3><div class="formgrid">${f.map((x) => fieldHtml(x, st[x[0]])).join('')}</div></div>`).join('')}
      <div class="savebar"><button class="btn lg">Save website settings</button><a class="btn ghost" href="#/" target="_blank">Preview site ↗</a></div></form>`);
    bindUploads();
    $('#sf').addEventListener('submit', async (e) => { e.preventDefault(); try { await A('/settings', { method: 'PUT', body: readFields(e.target, all) }); await refreshSite(); toast('Saved – live on the website'); } catch (er) { toast(er.message); } });
    return;
  }

  if (sub === 'exams') {
    const ex = await api('/api/exams');
    const F = [['exam_date', 'Next exam date (YYYY-MM-DD) – drives the homepage countdown', 'date'], ['name', 'Name (English)'], ['name_mr', 'Name (मराठी)'], ['icon', 'Icon (emoji)'], ['category', 'Category', 'select', ['entrance', 'scholarship', 'olympiad', 'school']], ['position', 'Order', 'int'], ['description', 'Description: pattern, eligibility, dates', 'textarea']];
    shell(nav + `<details class="card" style="margin-bottom:14px"><summary style="cursor:pointer"><b>Add exam / category</b></summary><form id="nx" class="formgrid" style="margin-top:10px">${fieldHtml(['slug', 'URL slug (e.g. mpsc-foundation)'], '')}${F.map((f) => fieldHtml(f, '')).join('')}<div class="full"><button class="btn">Add</button></div></form></details>
      ${ex.map((e) => `<details class="card" style="margin-bottom:10px"><summary style="cursor:pointer;display:flex;gap:10px;align-items:center"><span class="avatar" style="width:32px;height:32px;background:${coverColor(e.position, e.id)}">${ic(EXAM_ICON(e.slug, e.category), 'sm')}</span><b>${esc(e.name)}</b><span class="badge">${esc(e.category)}</span><span class="xs muted">${e.courses} courses${e.exam_date ? ` · exam ${esc(e.exam_date)}` : ''}</span></summary>
        <form class="formgrid" data-exam="${e.id}" style="margin-top:10px">${F.map((f) => fieldHtml(f, e[f[0]])).join('')}<div class="full row"><button class="btn sm">Save</button><button type="button" class="btn sm ghost" data-delx="${e.id}">Delete</button></div></form></details>`).join('')}`);
    const done = async () => { EXAMS = await api('/api/exams'); reload(); };
    $('#nx').addEventListener('submit', async (e) => { e.preventDefault(); try { await A('/exams', { method: 'POST', body: readFields(e.target, [['slug'], ...F]) }); toast('Exam added'); done(); } catch (er) { toast(er.message); } });
    $$('[data-exam]').forEach((f) => f.addEventListener('submit', async (e) => { e.preventDefault(); try { await A('/exams/' + f.dataset.exam, { method: 'PUT', body: readFields(f, F) }); toast('Saved'); done(); } catch (er) { toast(er.message); } }));
    $$('[data-delx]').forEach((b) => (b.onclick = async () => { if (!(await confirmBox('Delete this exam?'))) return; try { await A('/exams/' + b.dataset.delx, { method: 'DELETE' }); done(); } catch (er) { toast(er.message); } }));
    return;
  }

  const cfg = CMS[sub]; if (!cfg) return shell(nav + 'Unknown section');
  const rows = await A('/cms/' + sub);
  const form = (r = {}) => `<form class="formgrid" data-id="${r.id || ''}" style="margin-top:10px">${cfg.fields.map((f) => fieldHtml(f, r[f[0]] ?? (f[2] === 'bool' ? 1 : f[0] === 'rating' ? 5 : ''))).join('')}<div class="full row"><button class="btn sm">${r.id ? 'Save' : 'Add'}</button>${r.id ? `<button type="button" class="btn sm ghost" data-delc="${r.id}">Delete</button>` : ''}${sub === 'pages' && r.slug ? `<a class="btn sm ghost" href="#/page/${esc(r.slug)}" target="_blank">View ↗</a>` : ''}</div></form>`;
  shell(nav + `<p class="small muted">${esc(cfg.hint)}</p><details class="card" style="margin-bottom:14px" ${rows.length ? '' : 'open'}><summary style="cursor:pointer"><b>Add ${cfg.label.toLowerCase().replace(/s$/, '')}</b></summary>${form()}</details>
    ${rows.map((r) => `<details class="card" style="margin-bottom:10px"><summary style="cursor:pointer"><b>${esc(cfg.row(r))}</b></summary>${form(r)}</details>`).join('') || '<p class="muted">Nothing here yet.</p>'}`);
  bindUploads();
  $$('form[data-id]').forEach((f) => f.addEventListener('submit', async (e) => {
    e.preventDefault(); const id = f.dataset.id;
    try { await A(`/cms/${sub}${id ? '/' + id : ''}`, { method: id ? 'PUT' : 'POST', body: readFields(f, cfg.fields) }); await refreshSite(); toast('Saved – live on the website'); reload(); } catch (er) { toast(er.message); }
  }));
  $$('[data-delc]').forEach((b) => (b.onclick = async () => { if (!(await confirmBox(t('confirm')))) return; await A(`/cms/${sub}/${b.dataset.delc}`, { method: 'DELETE' }); await refreshSite(); reload(); }));
}

const courseBody = (f) => ({ ...formData(f), published: f.published.checked, featured: f.featured.checked });
const courseForm = (c) => `<form id="cf" style="margin-top:12px"><div class="formgrid">
  <div class="full"><label class="lbl">Title</label><input name="title" required value="${esc(c.title)}"></div>
  <div><label class="lbl">Exam / category</label><select name="exam_id">${EXAMS.map((e) => `<option value="${e.id}" ${e.id === c.exam_id ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}</select></div>
  <div><label class="lbl">Board</label><select name="board">${['All', 'State', 'CBSE', 'ICSE'].map((b) => `<option ${b === (c.board || 'All') ? 'selected' : ''}>${b}</option>`).join('')}</select></div>
  <div><label class="lbl">Class</label><select name="class_level"><option value="">Any</option>${CLASSES.map((x) => `<option ${x === c.class_level ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
  <div><label class="lbl">Language</label><input name="language" value="${esc(c.language || 'Marathi')}"></div>
  <div><label class="lbl">Teacher</label><select name="instructor_id"><option value="">—</option>${(window.INSTR || []).map((i) => `<option value="${i.id}" ${i.id === c.instructor_id ? 'selected' : ''}>${esc(i.name)}</option>`).join('')}</select></div>
  <div class="full">${imageField('thumbnail', 'Thumbnail image (optional, 16:9)', c.thumbnail)}</div>
  <div class="full"><label class="lbl">Description</label><textarea name="description" rows="3">${esc(c.description)}</textarea></div>
  <div><label class="lbl">Price ₹</label><input name="price" type="number" min="0" value="${c.price ?? 0}"></div>
  <div><label class="lbl">MRP ₹ (strike-through)</label><input name="mrp" type="number" min="0" value="${c.mrp ?? 0}"></div>
  <div><label class="lbl">Validity (days)</label><input name="validity_days" type="number" min="1" value="${c.validity_days ?? 365}"></div>
  </div><div class="row"><label class="check"><input type="checkbox" name="published" ${c.published ? 'checked' : ''}> Published</label><label class="check"><input type="checkbox" name="featured" ${c.featured ? 'checked' : ''}> Featured on homepage</label></div>
  <button class="btn">Save course</button></form>`;


/* ======================================================================
   COMMUNITY: live classes + chat, doubts, reviews, wishlist, certificates, notifications, notes
   ====================================================================== */
Object.assign(I18N.en, {
  live: 'Live', live_classes: 'Live classes', live_now: 'Live now', upcoming: 'Upcoming', past: 'Recordings', join: 'Join class', join_ext: 'Open in Zoom / Meet', watch_rec: 'Watch recording',
  starts_in: 'Starts in', starting: 'Starting soon', ended: 'Ended', free_live: 'Free', enroll_to_join: 'Enroll in the course to join', login_to_join: 'Log in to join',
  chat: 'Live chat', chat_ph: 'Ask or say something…', send: 'Send', online: 'online', chat_off: 'Chat is turned off for this class', no_live: 'No live classes scheduled right now. Check back soon!',
  remind: 'We’ll notify you here when it starts.', attendees: 'attended', staff: 'Teacher',
  doubts: 'Doubts', ask_doubt: 'Ask a doubt', doubt_ph: 'What is your question? Be specific.', doubt_body_ph: 'Add details (optional)', post: 'Post', answers: 'answers', answered_by_teacher: 'Teacher answered',
  no_doubts: 'No doubts yet. Be the first to ask!', your_answer: 'Write an answer…', resolved: 'Resolved', mark_resolved: 'Mark resolved', helpful: 'Same doubt', enroll_to_ask: 'Enroll to ask doubts',
  reviews: 'Reviews', ratings: 'ratings', rate_course: 'Rate this course', review_ph: 'What did you like? How did it help? (optional)', save_review: 'Submit review', your_review: 'Your review', no_reviews: 'No reviews yet.',
  wishlist: 'Wishlist', save: 'Save', saved: 'Saved', wish_empty: 'Your wishlist is empty. Tap ♡ on a course to save it.',
  cert: 'Certificate', get_cert: 'Get your certificate', cert_title: 'Certificate of Completion', cert_body: 'This is to certify that', cert_done: 'has successfully completed', verify: 'Verify at', print: 'Print / Save as PDF', my_certs: 'My certificates',
  notifs: 'Notifications', no_notifs: 'You’re all caught up.', mark_read: 'Mark all read', notes_t: 'My notes', notes_ph: 'Write your notes for this lesson. Saved automatically.', notes_saved: 'Saved',
  instructor: 'Your teacher', lessons_in: 'lessons', about_teacher: 'About the teacher', section_other: 'Lessons',
});
Object.assign(I18N.mr, {
  live: 'लाईव्ह', live_classes: 'लाईव्ह क्लासेस', live_now: 'आत्ता लाईव्ह', upcoming: 'आगामी', past: 'रेकॉर्डिंग्स', join: 'क्लासमध्ये सामील व्हा', join_ext: 'Zoom / Meet मध्ये उघडा', watch_rec: 'रेकॉर्डिंग पहा',
  starts_in: 'सुरू होण्यास', starting: 'लवकरच सुरू', ended: 'संपला', free_live: 'मोफत', enroll_to_join: 'सामील होण्यासाठी कोर्समध्ये प्रवेश घ्या', login_to_join: 'सामील होण्यासाठी लॉगिन करा',
  chat: 'लाईव्ह चॅट', chat_ph: 'प्रश्न विचारा किंवा काही लिहा…', send: 'पाठवा', online: 'ऑनलाईन', chat_off: 'या क्लाससाठी चॅट बंद आहे', no_live: 'सध्या कोणताही लाईव्ह क्लास नियोजित नाही. लवकरच पुन्हा पहा!',
  remind: 'क्लास सुरू झाल्यावर आम्ही इथे सूचना देऊ.', attendees: 'उपस्थित', staff: 'शिक्षक',
  doubts: 'शंका', ask_doubt: 'शंका विचारा', doubt_ph: 'तुमचा प्रश्न काय आहे? स्पष्ट लिहा.', doubt_body_ph: 'अधिक माहिती (ऐच्छिक)', post: 'पोस्ट करा', answers: 'उत्तरे', answered_by_teacher: 'शिक्षकांनी उत्तर दिले',
  no_doubts: 'अजून शंका नाहीत. पहिला प्रश्न तुम्हीच विचारा!', your_answer: 'उत्तर लिहा…', resolved: 'सुटली', mark_resolved: 'शंका सुटली', helpful: 'माझीही हीच शंका', enroll_to_ask: 'शंका विचारण्यासाठी प्रवेश घ्या',
  reviews: 'अभिप्राय', ratings: 'रेटिंग्स', rate_course: 'या कोर्सला रेटिंग द्या', review_ph: 'काय आवडलं? कशी मदत झाली? (ऐच्छिक)', save_review: 'अभिप्राय पाठवा', your_review: 'तुमचा अभिप्राय', no_reviews: 'अजून अभिप्राय नाहीत.',
  wishlist: 'विशलिस्ट', save: 'सेव्ह', saved: 'सेव्ह केले', wish_empty: 'विशलिस्ट रिकामी आहे. कोर्सवरील ♡ दाबून सेव्ह करा.',
  cert: 'प्रमाणपत्र', get_cert: 'प्रमाणपत्र मिळवा', cert_title: 'कोर्स पूर्णता प्रमाणपत्र', cert_body: 'प्रमाणित करण्यात येते की', cert_done: 'यांनी यशस्वीरीत्या पूर्ण केला आहे', verify: 'पडताळणी', print: 'प्रिंट / PDF सेव्ह करा', my_certs: 'माझी प्रमाणपत्रे',
  notifs: 'सूचना', no_notifs: 'नवीन सूचना नाहीत.', mark_read: 'सर्व वाचले', notes_t: 'माझ्या नोट्स', notes_ph: 'या धड्याच्या नोट्स लिहा – आपोआप सेव्ह होतील.', notes_saved: 'सेव्ह झाले',
  instructor: 'तुमचे शिक्षक', lessons_in: 'धडे', about_teacher: 'शिक्षकांविषयी', section_other: 'धडे',
});
Object.assign(ICONS, {
  live: '<circle cx="12" cy="12" r="2.5"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14"/>',
  bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/>', heart: '<path d="M12 20s-7.5-4.6-9.2-9.3C1.7 7.6 3.9 4.5 7 4.5c2 0 3.5 1.1 5 3 1.5-1.9 3-3 5-3 3.1 0 5.3 3.1 4.2 6.2C19.5 15.4 12 20 12 20z"/>',
  help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2.2-2.4 3.7M12 17h.01"/>', up: '<path d="m6 15 6-6 6 6"/>',
  cert: '<rect x="3" y="4" width="18" height="13" rx="2"/><circle cx="12" cy="17" r="3"/><path d="m10.5 19.5-1 2.5 2.5-1 2.5 1-1-2.5M7 8h10M7 11h6"/>', send: '<path d="M4 12 20 4l-6 16-3-7z"/><path d="m11 13 9-9"/>', video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
});

let WISH = new Set(), NOTIF = { unread: 0, list: [] };
async function loadMine() {
  if (!ME) { WISH = new Set(); NOTIF = { unread: 0, list: [] }; return; }
  try { const [w, n] = await Promise.all([api('/api/my/wishlist'), api('/api/my/notifications')]); WISH = new Set(w); NOTIF = n; } catch { /* offline */ }
}
setInterval(async () => { if (!ME || document.hidden) return; try { const n = await api('/api/my/notifications'); const changed = n.unread !== NOTIF.unread; NOTIF = n; if (changed) { const b = $('#bellcount'); if (b) { b.textContent = n.unread; b.hidden = !n.unread; } } } catch { /* ignore */ } }, 60000);

const stars = (r, size = '') => { const v = Math.round((r || 0) * 2) / 2; return `<span class="stars ${size}" aria-label="${r || 0} / 5">${[1, 2, 3, 4, 5].map((i) => `<i class="${v >= i ? 'f' : v >= i - .5 ? 'h' : ''}">★</i>`).join('')}</span>`; };
const ratingLine = (c) => (c.reviews ? `<span class="rating"><b>${Number(c.rating).toFixed(1)}</b>${stars(c.rating, 'sm')}<span class="muted">(${num(c.reviews)})</span></span>` : '');
const fmtWhen = (iso) => new Date(iso).toLocaleString(LANG === 'mr' ? 'mr-IN' : 'en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const relTime = (s) => { const d = (Date.now() - Date.parse(s.replace(' ', 'T') + (s.includes('T') ? '' : 'Z'))) / 1000; const f = new Intl.RelativeTimeFormat(LANG === 'mr' ? 'mr' : 'en', { numeric: 'auto' }); return d < 60 ? f.format(0, 'second') : d < 3600 ? f.format(-Math.round(d / 60), 'minute') : d < 86400 ? f.format(-Math.round(d / 3600), 'hour') : f.format(-Math.round(d / 86400), 'day'); };
function countdownText(iso) { const ms = Date.parse(iso) - Date.now(); if (ms <= 0) return t('starting'); const h = Math.floor(ms / 3600e3), m = Math.floor((ms % 3600e3) / 60e3); return h >= 48 ? `${Math.floor(h / 24)}d` : h ? `${h}h ${m}m` : `${m}m`; }
async function toggleWish(id, btn) {
  if (!ME) return go('#/login?next=' + encodeURIComponent(location.hash));
  const r = await api('/api/my/wishlist/' + id, { method: 'POST', body: {} });
  r.saved ? WISH.add(id) : WISH.delete(id);
  if (btn) { btn.classList.toggle('on', r.saved); btn.setAttribute('aria-pressed', r.saved); const l = $('span', btn); if (l) l.textContent = r.saved ? t('saved') : t('save'); }
  toast(r.saved ? t('saved') + ' ♡' : '✓');
}
document.addEventListener('click', (e) => { const b = e.target.closest('[data-wish]'); if (b) { e.preventDefault(); e.stopPropagation(); toggleWish(Number(b.dataset.wish), b); } });

function liveCard(l) {
  const st = l.status === 'live' ? `<span class="livepill">${t('live_now')}</span>` : l.status === 'opening' ? `<span class="livepill soon">${t('starting')}</span>` : l.status === 'ended' ? `<span class="badge">${t('ended')}</span>` : `<span class="badge pri num">${t('starts_in')} ${countdownText(l.starts_at)}</span>`;
  return `<a class="lc ${l.status}" href="#/live/${l.id}"><div class="lc-top">${st}${l.is_free ? `<span class="badge ok">${t('free_live')}</span>` : ''}</div><b>${esc(l.title)}</b><span class="small muted">${ic('clock', 'sm')} ${esc(fmtWhen(l.starts_at))} · ${l.duration_min} ${t('mins')}</span>${l.course_title ? `<span class="xs muted">${esc(l.course_title)}</span>` : ''}${l.instructor ? `<span class="lc-t">${l.instructor.photo_url ? `<img src="${esc(l.instructor.photo_url)}" alt="">` : `<span class="avatar" style="width:26px;height:26px;font-size:11px">${esc(initials(l.instructor.name))}</span>`}${esc(l.instructor.name)}</span>` : ''}</a>`;
}

/* ---------- live list & room ---------- */
async function livePage() {
  const d = await api('/api/live');
  const sec = (title, list) => (list.length ? `<section style="margin-top:32px"><h2 style="font-size:24px">${title}</h2><div class="grid">${list.map(liveCard).join('')}</div></section>` : '');
  view(`<div class="wrap dash"><span class="eyebrow">${t('live')}</span><h1 style="font-size:clamp(30px,4vw,44px);margin-top:10px">${t('live_classes')}</h1>
    ${!d.now.length && !d.upcoming.length && !d.past.length ? `<div class="empty card">${ic('live')}<p>${t('no_live')}</p></div>` : ''}
    ${sec(t('live_now'), d.now)}${sec(t('upcoming'), d.upcoming)}${sec(t('past'), d.past.filter((l) => l.has_recording))}</div>`);
}
let liveES = null;
async function liveRoom(id) {
  const l = await api('/api/live/' + id);
  if (liveES) { liveES.close(); liveES = null; }
  const gate = !ME ? `<div class="gate">${ic('lock', 'lg')}<p>${t('login_to_join')}</p><a class="btn" href="#/login?next=${encodeURIComponent('#/live/' + id)}">${t('login')}</a></div>`
    : !l.access ? `<div class="gate">${ic('lock', 'lg')}<p>${t('enroll_to_join')}</p>${l.course_id ? `<a class="btn accent" href="#/course/${l.course_id}">${esc(l.course_title || t('buy'))}</a>` : ''}</div>` : '';
  const stage = gate || (l.player ? (l.player.type === 'iframe' ? `<iframe src="${esc(l.player.src)}" title="${esc(l.title)}" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>` : `<video src="${esc(l.player.src)}" controls playsinline></video>`)
    : l.status === 'upcoming' ? `<div class="gate"><span class="eyebrow" style="color:var(--accent)">${t('starts_in')}</span><b class="bigcount num" id="lcount">${countdownText(l.starts_at)}</b><p>${esc(fmtWhen(l.starts_at))}</p><p class="small" style="opacity:.7">${t('remind')}</p></div>`
      : l.status === 'ended' ? `<div class="gate">${ic('video', 'lg')}<p>${t('ended')}</p></div>` : `<div class="gate">${ic('live', 'lg')}<p>${t('starting')}</p></div>`);
  const showChat = ME && l.access && l.status !== 'upcoming';
  view(`<div class="wrap"><div class="liveroom ${showChat ? '' : 'nochat'}">
    <div><div class="row" style="margin-bottom:12px">${l.status === 'live' ? `<span class="livepill">${t('live_now')}</span>` : ''}<a href="#/live" class="small">${ic('left', 'sm')} ${t('live_classes')}</a></div>
      <div class="player">${stage}</div>
      <div class="row" style="justify-content:space-between;margin-top:18px;align-items:flex-start"><div style="flex:1;min-width:240px"><h1 style="font-size:clamp(22px,2.8vw,30px)">${esc(l.title)}</h1><p class="muted small">${ic('clock', 'sm')} ${esc(fmtWhen(l.starts_at))} · ${l.duration_min} ${t('mins')}${l.instructor ? ` · ${esc(l.instructor.name)}` : ''}</p>${l.description ? `<p style="color:var(--ink-2)">${esc(l.description)}</p>` : ''}</div>
      ${l.join_url ? `<a class="btn accent" href="${esc(l.join_url)}" target="_blank" rel="noopener">${ic('video', 'sm')} ${t('join_ext')}</a>` : ''}</div>
    </div>
    ${showChat ? `<aside class="chat card"><div class="chat-h"><b>${t('chat')}</b><span class="xs muted"><i class="dot"></i><span id="online">0</span> ${t('online')}</span></div>
      <div class="chat-list" id="chatlist" aria-live="polite"></div>
      <form class="chat-f" id="chatf"><input name="body" maxlength="400" placeholder="${esc(t('chat_ph'))}" autocomplete="off" aria-label="${esc(t('chat_ph'))}"><button class="btn sm" aria-label="${esc(t('send'))}">${ic('send', 'sm')}</button></form></aside>` : ''}
  </div></div>`);
  if (ME && l.access && (l.status === 'live' || l.status === 'opening')) api(`/api/live/${id}/attend`, { method: 'POST', body: {} }).catch(() => {});
  if (l.status === 'upcoming') { const iv = setInterval(() => { const el = $('#lcount'); if (!el) return clearInterval(iv); el.textContent = countdownText(l.starts_at); if (Date.parse(l.starts_at) - Date.now() < 15 * 60e3) { clearInterval(iv); route_(); } }, 30000); }
  if (!showChat) return;
  const list = $('#chatlist');
  const atBottom = () => list.scrollHeight - list.scrollTop - list.clientHeight < 60;
  const add = (m) => { const stick = atBottom(); const el = document.createElement('div'); el.className = 'msg' + (m.user.staff ? ' staff' : '') + (m.user.id === ME.id ? ' me' : ''); el.dataset.id = m.id;
    el.innerHTML = `<span class="who">${esc(m.user.name)}${m.user.staff ? ` <span class="badge accent">${t('staff')}</span>` : ''}</span><span class="txt">${esc(m.body)}</span>${ME.role === 'admin' ? `<button class="iconbtn del" data-delmsg="${m.id}" aria-label="Delete">${ic('trash', 'sm')}</button>` : ''}`;
    list.appendChild(el); if (stick) list.scrollTop = list.scrollHeight; };
  liveES = new EventSource(`/api/live/${id}/chat`);
  liveES.addEventListener('history', (e) => { const d = JSON.parse(e.data); list.innerHTML = ''; d.messages.forEach(add); list.scrollTop = list.scrollHeight; if (!d.enabled && ME.role !== 'admin') { $('#chatf').innerHTML = `<p class="xs muted" style="margin:0">${t('chat_off')}</p>`; } });
  liveES.addEventListener('message', (e) => add(JSON.parse(e.data)));
  liveES.addEventListener('delete', (e) => { const { id: mid } = JSON.parse(e.data); $(`[data-id="${mid}"]`, list)?.remove(); });
  liveES.addEventListener('presence', (e) => { const o = $('#online'); if (o) o.textContent = num(JSON.parse(e.data).online); });
  list.addEventListener('click', async (e) => { const b = e.target.closest('[data-delmsg]'); if (b) { await api('/api/admin/chat/' + b.dataset.delmsg, { method: 'DELETE' }).catch((er) => toast(er.message)); } });
  $('#chatf')?.addEventListener('submit', async (e) => { e.preventDefault(); const inp = e.target.body; const v = inp.value.trim(); if (!v) return; inp.value = ''; try { await api(`/api/live/${id}/chat`, { method: 'POST', body: { body: v } }); } catch (er) { toast(er.message); inp.value = v; } });
}

/* ---------- doubts ---------- */
function doubtList(rows, courseId, canAsk, lectureId) {
  return `${canAsk ? `<form class="askf" data-course="${courseId}" ${lectureId ? `data-lecture="${lectureId}"` : ''}><input name="title" maxlength="200" placeholder="${esc(t('doubt_ph'))}" required><textarea name="body" rows="2" maxlength="3000" placeholder="${esc(t('doubt_body_ph'))}"></textarea><div class="row" style="justify-content:flex-end"><button class="btn sm">${ic('help', 'sm')} ${t('ask_doubt')}</button></div></form>` : (ME ? `<p class="small muted">${t('enroll_to_ask')}</p>` : '')}
    <ul class="doubts">${rows.map((d) => `<li><button class="vote ${d.voted ? 'on' : ''}" data-vote="${d.id}" ${canAsk ? '' : 'disabled'} aria-label="${esc(t('helpful'))}">${ic('up', 'sm')}<b class="num">${d.votes}</b></button>
      <a href="#/doubt/${d.id}" class="dq"><b>${esc(d.title)}</b><span class="xs muted">${esc(d.name)} · ${relTime(d.created_at)}${d.lecture_title ? ` · ${esc(d.lecture_title)}` : ''}</span></a>
      <span class="dmeta">${d.staff_replies ? `<span class="badge ok">${ic('check', 'sm')} ${t('answered_by_teacher')}</span>` : d.resolved ? `<span class="badge ok">${t('resolved')}</span>` : ''}<span class="xs muted num">${d.replies} ${t('answers')}</span></span></li>`).join('') || `<li class="muted small" style="justify-content:center;padding:24px">${t('no_doubts')}</li>`}</ul>`;
}
function bindDoubts(root, reload) {
  $$('.askf', root).forEach((f) => f.addEventListener('submit', async (e) => { e.preventDefault(); const b = $('button', f); b.disabled = true;
    try { await api(`/api/courses/${f.dataset.course}/doubts`, { method: 'POST', body: { ...formData(f), lecture_id: f.dataset.lecture } }); toast('✓'); reload(); } catch (er) { toast(er.message); b.disabled = false; } }));
  $$('[data-vote]', root).forEach((b) => (b.onclick = async () => { if (!ME) return go('#/login'); try { const r = await api(`/api/doubts/${b.dataset.vote}/vote`, { method: 'POST', body: {} }); b.classList.toggle('on', r.voted); const n = $('b', b); n.textContent = Number(n.textContent) + (r.voted ? 1 : -1); } catch (er) { toast(er.message); } }));
}
async function doubtPage(id) {
  const d = await api('/api/doubts/' + id);
  view(`<div class="wrap dash" style="max-width:820px"><a href="#/course/${d.course_id}?tab=doubts" class="small">${ic('left', 'sm')} ${esc(d.course_title)}</a>
    <article class="card" style="margin-top:14px"><div class="row" style="justify-content:space-between"><span class="eyebrow">${t('doubts')}</span>${d.resolved ? `<span class="badge ok">${t('resolved')}</span>` : ''}</div>
      <h1 style="font-size:clamp(22px,3vw,30px);margin-top:10px">${esc(d.title)}</h1>${d.body ? `<p style="white-space:pre-wrap;color:var(--ink-2)">${esc(d.body)}</p>` : ''}<p class="xs muted">${esc(d.name)} · ${relTime(d.created_at)}</p>
      ${(d.mine || ME?.role === 'admin') && !d.resolved ? `<button class="btn sm ghost" id="resolve">${ic('check', 'sm')} ${t('mark_resolved')}</button>` : ''}</article>
    <h3 style="margin-top:28px">${d.replies.length} ${t('answers')}</h3>
    ${d.replies.map((r) => `<div class="card reply ${r.is_staff ? 'staff' : ''}" style="margin-bottom:12px"><div class="row" style="justify-content:space-between"><b>${esc(r.name)} ${r.is_staff ? `<span class="badge accent">${t('staff')}</span>` : ''}</b><span class="xs muted">${relTime(r.created_at)}</span></div><p style="white-space:pre-wrap;margin:8px 0 0">${esc(r.body)}</p></div>`).join('')}
    ${ME ? `<form id="replyf" class="card stack" style="margin-top:16px"><textarea name="body" rows="3" maxlength="4000" placeholder="${esc(t('your_answer'))}" required></textarea><div class="row" style="justify-content:flex-end"><button class="btn">${t('post')}</button></div></form>` : ''}</div>`);
  $('#resolve')?.addEventListener('click', async () => { await api(`/api/doubts/${id}/resolve`, { method: 'POST', body: {} }); route_(); });
  $('#replyf')?.addEventListener('submit', async (e) => { e.preventDefault(); try { await api(`/api/doubts/${id}/replies`, { method: 'POST', body: formData(e.target) }); route_(); } catch (er) { toast(er.message); } });
}

/* ---------- reviews ---------- */
function reviewsHtml(r) {
  const total = r.n || 0;
  return `<div class="revsum">${total ? `<div class="big"><b>${Number(r.avg).toFixed(1)}</b>${stars(r.avg)}<span class="small muted">${num(total)} ${t('ratings')}</span></div>
    <div class="dist">${r.dist.map((n, i) => `<div><span class="num">${5 - i}★</span><i><b style="width:${total ? (n / total) * 100 : 0}%"></b></i><span class="num muted">${n}</span></div>`).join('')}</div>` : `<p class="muted">${t('no_reviews')}</p>`}</div>
    ${r.can_review ? `<form id="revf" class="revform"><b>${r.mine ? t('your_review') : t('rate_course')}</b><div class="starpick" role="radiogroup">${[1, 2, 3, 4, 5].map((i) => `<label><input type="radio" name="rating" value="${i}" ${r.mine?.rating === i ? 'checked' : ''} required><span aria-label="${i}">★</span></label>`).join('')}</div>
      <textarea name="body" rows="2" maxlength="2000" placeholder="${esc(t('review_ph'))}">${esc(r.mine?.body || '')}</textarea><div class="row" style="justify-content:flex-end"><button class="btn sm">${t('save_review')}</button></div></form>` : ''}
    <ul class="revs">${r.list.map((x) => `<li><div class="row" style="justify-content:space-between"><b>${esc(x.name)}</b>${stars(x.rating, 'sm')}</div>${x.body ? `<p>${esc(x.body)}</p>` : ''}<span class="xs muted">${relTime(x.created_at)}</span></li>`).join('')}</ul>`;
}

/* ---------- course extras: sections, instructor, reviews, Q&A, live, wishlist, certificate ---------- */
async function courseExtras(d) {
  const c = d.course;
  const [rev, dbt, lv] = await Promise.all([api(`/api/courses/${c.id}/reviews`), api(`/api/courses/${c.id}/doubts`), api(`/api/live?course=${c.id}`)]);
  // header rating + students
  const meta = $('.chead .meta'); if (meta && rev.n) meta.insertAdjacentHTML('afterbegin', `<span class="rating light"><b>${Number(rev.avg).toFixed(1)}</b>${stars(rev.avg, 'sm')}<span>(${num(rev.n)})</span></span>`);
  if (meta && c.students) meta.insertAdjacentHTML('beforeend', `<span>${ic('users', 'sm')}${num(c.students)} ${t('students')}</span>`);
  // tabs: Q&A + live
  const tabs = $('.tabs'), pane = $('#pane');
  const liveList = [...lv.now, ...lv.upcoming, ...lv.past.filter((x) => x.has_recording)];
  tabs.insertAdjacentHTML('beforeend', `<button role="tab" data-xtab="doubts">${t('doubts')} <small>${dbt.length}</small></button>${liveList.length ? `<button role="tab" data-xtab="live">${t('live')} <small>${liveList.length}</small></button>` : ''}`);
  const extra = { doubts: () => `<div style="padding:12px 0 4px">${doubtList(dbt, c.id, d.enrolled)}</div>`, live: () => `<div class="grid" style="padding:14px 0">${liveList.map(liveCard).join('')}</div>` };
  const showX = (k) => { $$('.tabs button').forEach((x) => { const on = x.dataset.xtab === k; x.classList.toggle('on', on); x.setAttribute('aria-selected', on); }); pane.innerHTML = extra[k](); if (k === 'doubts') bindDoubts(pane, () => go(`#/course/${c.id}?tab=doubts&r=${Date.now()}`)); };
  $$('[data-xtab]').forEach((b) => (b.onclick = () => showX(b.dataset.xtab)));
  $$('[data-tab]').forEach((b) => b.addEventListener('click', () => $$('[data-xtab]').forEach((x) => x.classList.remove('on'))));
  const want = new URLSearchParams(location.hash.split('?')[1] || '').get('tab');
  if (want === 'doubts' || want === 'live') showX(want);
  // group lectures by section
  const groupLectures = () => {
    if (!$('[data-tab="lectures"].on') || !d.lectures.some((l) => l.section)) return;
    const lis = $$('#pane > li'); let last = null;
    d.lectures.forEach((l, i) => { const sec = l.section || t('section_other'); if (sec !== last && lis[i]) { lis[i].insertAdjacentHTML('beforebegin', `<li class="sec"><b>${esc(sec)}</b><span class="xs muted num">${d.lectures.filter((x) => (x.section || t('section_other')) === sec).length} ${t('lessons_in')}</span></li>`); last = sec; } });
  };
  groupLectures(); $('[data-tab="lectures"]')?.addEventListener('click', () => setTimeout(groupLectures));
  // instructor + reviews cards after overview
  const stack = $('.cbody > .stack');
  if (c.instructor_name) stack.insertAdjacentHTML('beforeend', `<div class="card teacher"><span class="eyebrow">${t('instructor')}</span><div class="row" style="margin-top:12px;align-items:flex-start;flex-wrap:nowrap">${c.instructor_photo ? `<img src="${esc(c.instructor_photo)}" alt="" class="tphoto">` : `<span class="avatar tphoto">${esc(initials(c.instructor_name))}</span>`}<div><h3 style="margin:0">${esc(LANG === 'mr' && c.instructor_name_mr ? c.instructor_name_mr : c.instructor_name)}</h3>${c.instructor_title ? `<p class="small muted" style="margin:2px 0 8px">${esc(c.instructor_title)}</p>` : ''}<p style="margin:0;color:var(--ink-2);white-space:pre-wrap">${esc(LANG === 'mr' && c.instructor_bio_mr ? c.instructor_bio_mr : c.instructor_bio || '')}</p></div></div></div>`);
  stack.insertAdjacentHTML('beforeend', `<div class="card" id="reviews"><h3>${t('reviews')}</h3>${reviewsHtml(rev)}</div>`);
  $('#revf')?.addEventListener('submit', async (e) => { e.preventDefault(); try { await api(`/api/courses/${c.id}/reviews`, { method: 'POST', body: formData(e.target) }); toast('✓ ' + t('save_review')); route_(); } catch (er) { toast(er.message); } });
  // buybox: wishlist + certificate
  const bb = $('.buybox .card');
  const total = d.lectures.length, done = d.lectures.filter((l) => l.done).length;
  if (d.enrolled && total && done === total) bb.insertAdjacentHTML('afterbegin', `<button class="btn accent block" id="getcert" style="margin-bottom:16px">${ic('cert', 'sm')} ${t('get_cert')}</button>`);
  if (!d.enrolled) $('[data-buy]', bb)?.insertAdjacentHTML('afterend', `<button class="btn ghost block wish ${WISH.has(c.id) ? 'on' : ''}" data-wish="${c.id}" aria-pressed="${WISH.has(c.id)}" style="margin-top:10px">${ic('heart', 'sm')} <span>${WISH.has(c.id) ? t('saved') : t('save')}</span></button>`);
  $('#getcert')?.addEventListener('click', async () => { try { const r = await api(`/api/courses/${c.id}/certificate`, { method: 'POST', body: {} }); go('#/certificate/' + r.code); } catch (er) { toast(er.message); } });
  // live-now banner on course page
  if (lv.now.length) $('.cbody > .stack').insertAdjacentHTML('afterbegin', `<a class="livebar" href="#/live/${lv.now[0].id}"><span class="livepill">${t('live_now')}</span><b>${esc(lv.now[0].title)}</b>${ic('arrow')}</a>`);
}

/* ---------- watch extras: notes + lesson doubts ---------- */
async function watchExtras(lectureId, courseId, enrolled) {
  const host = $('.watch > div'); if (!host) return;
  const [note, dbt] = await Promise.all([api(`/api/lectures/${lectureId}/note`).catch(() => ({ body: '' })), api(`/api/courses/${courseId}/doubts?lecture=${lectureId}`)]);
  host.insertAdjacentHTML('beforeend', `<div class="card" style="margin-top:20px;padding-top:0"><div class="tabs" role="tablist"><button class="on" data-wt="notes">${ic('edit', 'sm')} ${t('notes_t')}</button><button data-wt="doubts">${ic('help', 'sm')} ${t('doubts')} <small>${dbt.length}</small></button></div><div id="wpane"></div></div>`);
  const panes = {
    notes: () => `<textarea id="note" rows="6" placeholder="${esc(t('notes_ph'))}" style="margin-top:14px">${esc(note.body)}</textarea><p class="xs muted" id="nstat" style="margin:6px 0 0;min-height:1.2em"></p>`,
    doubts: () => `<div style="padding-top:12px">${doubtList(dbt, courseId, enrolled, lectureId)}</div>`,
  };
  const show = (k) => { $$('[data-wt]').forEach((b) => b.classList.toggle('on', b.dataset.wt === k)); $('#wpane').innerHTML = panes[k]();
    if (k === 'notes') { let tm; $('#note').addEventListener('input', (e) => { clearTimeout(tm); $('#nstat').textContent = '…'; tm = setTimeout(async () => { note.body = e.target.value; await api(`/api/lectures/${lectureId}/note`, { method: 'PUT', body: { body: e.target.value } }).catch(() => {}); const s = $('#nstat'); if (s) s.textContent = '✓ ' + t('notes_saved'); }, 700); }); }
    else bindDoubts($('#wpane'), () => route_()); };
  $$('[data-wt]').forEach((b) => (b.onclick = () => show(b.dataset.wt))); show('notes');
}

/* ---------- certificate ---------- */
async function certificatePage(code) {
  const c = await api('/api/certificates/' + encodeURIComponent(code));
  const url = `${location.origin}/#/certificate/${c.code}`;
  view(`<div class="wrap dash"><div class="row noprint" style="justify-content:space-between;margin-bottom:16px"><a href="#/my" class="small">${ic('left', 'sm')} ${t('my')}</a><button class="btn" id="printc">${ic('download', 'sm')} ${t('print')}</button></div>
    <div class="certificate"><div class="cert-in">
      <div class="cert-brand"><img src="/brand/emblem-256.png" alt="${esc(BRAND())}" class="cert-emblem"></div>
      <span class="eyebrow">${t('cert_title')}</span>
      <p class="cert-l">${t('cert_body')}</p><h1 class="cert-name">${esc(c.student)}</h1><p class="cert-l">${t('cert_done')}</p>
      <h2 class="cert-course">${esc(c.course)}</h2>${c.exam ? `<p class="muted">${esc(c.exam)}</p>` : ''}
      <div class="cert-foot"><div><b>${esc(new Date(c.issued_at.replace(' ', 'T') + 'Z').toLocaleDateString(LANG === 'mr' ? 'mr-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' }))}</b><span>Date</span></div>
        <div class="seal"><img src="/brand/emblem-96.png" alt=""></div>
        <div><b>${esc(c.instructor || BRAND())}</b><span>${t('instructor')}</span></div></div>
      <p class="xs muted cert-v">${t('verify')}: ${esc(url)} · ID ${esc(c.code)}</p>
    </div></div></div>`);
  $('#printc').onclick = () => window.print();
}
/* ---------- wishlist page ---------- */
async function wishPage() {
  if (!ME) return go('#/login?next=' + encodeURIComponent('#/wishlist'));
  const all = await api('/api/courses'); const list = all.filter((c) => WISH.has(c.id));
  view(`<div class="wrap dash"><span class="eyebrow">${ic('heart', 'sm')}</span><h1 style="font-size:clamp(28px,4vw,40px);margin-top:10px">${t('wishlist')}</h1>${list.length ? `<div class="grid">${list.map(courseCard).join('')}</div>` : `<div class="empty card">${ic('heart')}<p>${t('wish_empty')}</p><a class="btn" href="#/explore">${t('browse')}</a></div>`}</div>`);
}
/* ---------- notification bell ---------- */
function bellHtml() { return ME ? `<button class="iconbtn bell" id="bell" aria-label="${esc(t('notifs'))}">${ic('bell')}<span id="bellcount" class="bc" ${NOTIF.unread ? '' : 'hidden'}>${NOTIF.unread}</span></button>` : ''; }
function bindBell() {
  $('#bell')?.addEventListener('click', async (e) => {
    e.stopPropagation(); const s = $('#menuslot'); if (s.innerHTML) { s.innerHTML = ''; return; }
    s.innerHTML = `<div class="menu notif" role="menu"><div class="row" style="justify-content:space-between;padding:8px 12px"><b>${t('notifs')}</b>${NOTIF.unread ? `<button class="btn link xs" id="readall" style="width:auto">${t('mark_read')}</button>` : ''}</div><hr>
      ${NOTIF.list.length ? NOTIF.list.map((n) => `<a href="${esc(n.link || '#/my')}" class="${n.read ? '' : 'unread'}"><span><b>${esc(n.title)}</b>${n.body ? `<span class="xs muted">${esc(n.body)}</span>` : ''}<span class="xs muted">${relTime(n.created_at)}</span></span></a>`).join('') : `<p class="small muted" style="padding:12px">${t('no_notifs')}</p>`}</div>`;
    $('#readall')?.addEventListener('click', async (ev) => { ev.stopPropagation(); await api('/api/my/notifications/read', { method: 'POST', body: {} }); NOTIF.unread = 0; NOTIF.list.forEach((n) => (n.read = 1)); s.innerHTML = ''; renderShell(); });
  });
}


/* ======================================================================
   AUTH: Google sign-in, OTP / forgot password, complete profile, settings
   ====================================================================== */
Object.assign(I18N.en, {
  with_google: 'Continue with Google', or: 'or', tab_pw: 'Password', tab_otp: 'OTP on mobile', forgot: 'Forgot password?', send_otp: 'Send OTP', otp: '6-digit OTP', verify_login: 'Verify & log in',
  otp_sent: 'OTP sent to', resend: 'Resend OTP', reset_h: 'Reset your password', reset_p: 'We’ll send an OTP to your registered mobile number.', new_pw: 'New password', reset_btn: 'Reset password & log in',
  consent_l: 'I am the parent/guardian, or I have my parent’s permission, and I agree to the', terms_l: 'Terms', privacy_l: 'Privacy policy', and: 'and',
  complete_h: 'Almost done!', complete_p: 'Add your mobile number so we can send class reminders and results. Parents also use it to log in.', save_continue: 'Save & continue',
  settings: 'Account settings', profile: 'Profile', email: 'Email', change_pw: 'Change password', cur_pw: 'Current password', save_changes: 'Save changes', signed_google: 'Signed in with Google',
  dev_otp: 'Test mode: your OTP is',
});
Object.assign(I18N.mr, {
  with_google: 'Google ने सुरू ठेवा', or: 'किंवा', tab_pw: 'पासवर्ड', tab_otp: 'मोबाईल OTP', forgot: 'पासवर्ड विसरलात?', send_otp: 'OTP पाठवा', otp: '६ अंकी OTP', verify_login: 'पडताळा व लॉगिन करा',
  otp_sent: 'OTP पाठवला:', resend: 'पुन्हा OTP पाठवा', reset_h: 'पासवर्ड रीसेट करा', reset_p: 'नोंदणीकृत मोबाईल नंबरवर OTP पाठवू.', new_pw: 'नवीन पासवर्ड', reset_btn: 'पासवर्ड बदला व लॉगिन करा',
  consent_l: 'मी पालक आहे / मला पालकांची परवानगी आहे आणि मला मान्य आहे –', terms_l: 'अटी', privacy_l: 'गोपनीयता धोरण', and: 'व',
  complete_h: 'जवळजवळ पूर्ण!', complete_p: 'क्लासची आठवण व निकाल पाठवण्यासाठी तुमचा मोबाईल नंबर द्या. पालक याच नंबरने लॉगिन करू शकतात.', save_continue: 'सेव्ह करा व पुढे चला',
  settings: 'खाते सेटिंग्ज', profile: 'प्रोफाइल', email: 'ईमेल', change_pw: 'पासवर्ड बदला', cur_pw: 'सध्याचा पासवर्ड', save_changes: 'बदल सेव्ह करा', signed_google: 'Google ने लॉगिन केले',
  dev_otp: 'टेस्ट मोड: तुमचा OTP',
});
let AUTHCFG = null;
const googleBtnSvg = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
async function mountGoogle(slot, next) {
  if (!AUTHCFG) AUTHCFG = await api('/api/auth/config').catch(() => ({}));
  if (!AUTHCFG.google_client_id) { slot.innerHTML = ''; return false; }
  slot.innerHTML = `<div id="gbtn" class="gbtn-wrap"><button type="button" class="btn ghost block gfallback" disabled>${googleBtnSvg} ${t('with_google')}</button></div><div class="ordiv"><span>${t('or')}</span></div>`;
  try {
    await loadScript('https://accounts.google.com/gsi/client');
    window.google.accounts.id.initialize({ client_id: AUTHCFG.google_client_id, ux_mode: 'popup', callback: async (resp) => {
      try { const r = await api('/api/auth/google', { method: 'POST', body: { credential: resp.credential } }); ME = r.user; toast(`${t('hello')}, ${ME.name}`);
        go(r.needs_profile ? '#/welcome' + (next ? '?next=' + encodeURIComponent(next) : '') : (next && next.startsWith('#/') ? next : '#/my')); }
      catch (e) { toast(e.message); } } });
    $('#gbtn').innerHTML = ''; window.google.accounts.id.renderButton($('#gbtn'), { theme: 'outline', size: 'large', shape: 'rectangular', text: 'continue_with', width: Math.min(400, $('#gbtn').clientWidth || 360), locale: LANG === 'mr' ? 'mr' : 'en' });
  } catch { /* Google script blocked/offline: keep disabled fallback */ }
  return true;
}
const consentBox = () => `<label class="check consent"><input type="checkbox" name="consent" required> <span>${t('consent_l')} <a href="#/page/terms" target="_blank">${t('terms_l')}</a> ${t('and')} <a href="#/page/privacy" target="_blank">${t('privacy_l')}</a>.</span></label>`;

function authArt() {
  return `<div class="art"><img src="/brand/emblem-256.png" alt="${esc(BRAND())}" class="art-emblem"><h2 style="margin-top:18px">${t('art_h')}</h2><ul>${['auth_l1', 'auth_l2', 'auth_l3', 'auth_l4'].map((k) => `<li>${ic('check')}${t(k).replace(/^✔\s*/, '')}</li>`).join('')}</ul></div>`;
}
function authPage(kind, params) {
  if (ME) return go('#/my');
  const reg = kind === 'register'; const next = params.get('next') || '';
  const nx = next ? '?next=' + encodeURIComponent(next) : '';
  const mode = params.get('mode') || 'pw';
  const phoneField = (id = 'p') => `<label class="lbl" for="${id}">${t('mobile')}</label><div class="pre91"><span class="num">+91</span><input id="${id}" name="phone" required inputmode="numeric" pattern="[6-9][0-9]{9}" maxlength="10" autocomplete="tel-national" class="num"></div>`;
  view(`<div class="auth">${authArt()}
   <div class="form"><div><h1 style="font-size:34px">${reg ? t('reg_title') : t('welcome_title')}</h1><p class="muted">${reg ? t('reg_sub') : t('login_sub')}</p>
   <div id="gslot"></div>
   ${reg ? `<form id="af" novalidate>
      <label class="lbl" for="n">${t('name')}</label><input id="n" name="name" required maxlength="100" autocomplete="name">
      ${phoneField()}
      <label class="lbl" for="pw">${t('password')}</label><input id="pw" name="password" type="password" required minlength="8" autocomplete="new-password" placeholder="${esc(t('pw_hint'))}">
      <div class="row"><div class="grow"><label class="lbl">${t('class')}</label><select name="class_level">${CLASSES.map((c) => `<option value="${c}" ${c === '4' ? 'selected' : ''}>${t('class')} ${num(c)}</option>`).join('')}</select></div><div class="grow"><label class="lbl">${t('district')}</label><input name="district" maxlength="100" autocomplete="address-level2"></div></div>
      ${consentBox()}
      <p id="aerr" class="ferr" aria-live="polite"></p><button class="btn block lg">${t('register')}</button></form>`
    : `<div class="seg" role="tablist"><a role="tab" class="${mode === 'pw' ? 'on' : ''}" href="#/login${nx}">${t('tab_pw')}</a><a role="tab" class="${mode === 'otp' ? 'on' : ''}" href="#/login?mode=otp${next ? '&next=' + encodeURIComponent(next) : ''}">${t('tab_otp')}</a></div>
      ${mode === 'pw' ? `<form id="af" novalidate>${phoneField()}
        <div class="row" style="justify-content:space-between;align-items:baseline"><label class="lbl" for="pw">${t('password')}</label><a class="small" href="#/forgot">${t('forgot')}</a></div><input id="pw" name="password" type="password" required autocomplete="current-password">
        <p id="aerr" class="ferr" aria-live="polite"></p><button class="btn block lg">${t('login')}</button></form>`
      : otpForm(false, next)}`}
   <p class="small muted center" style="margin-top:20px">${reg ? `${t('have_acc')} <a href="#/login${nx}">${t('login')}</a>` : `${t('new_here')} <a href="#/register${nx}">${t('register')}</a>`}</p></div></div></div>`);
  mountGoogle($('#gslot'), next);
  if (!reg && mode === 'otp') return bindOtp(false, next);
  $('#af').addEventListener('submit', async (e) => {
    e.preventDefault(); const err = $('#aerr'); err.textContent = '';
    if (!e.target.checkValidity()) { const bad = $(':invalid', e.target); err.textContent = bad.name === 'phone' ? (LANG === 'mr' ? '१० अंकी मोबाईल नंबर टाका' : 'Enter a valid 10-digit mobile number') : bad.name === 'consent' ? (LANG === 'mr' ? 'पालकांची संमती आवश्यक आहे' : 'Parent/guardian consent is required') : bad.name === 'password' && reg ? t('pw_hint') : (LANG === 'mr' ? 'सर्व माहिती भरा' : 'Please fill in all fields'); bad.focus(); return; }
    const b = $('button', e.target); b.disabled = true;
    const body = formData(e.target); if (reg) body.consent = e.target.consent.checked;
    try { ME = (await api('/api/auth/' + kind, { method: 'POST', body })).user; toast(`${t('hello')}, ${ME.name}`); go(next.startsWith('#/') ? next : '#/my'); }
    catch (er) { err.textContent = er.message; b.disabled = false; }
  });
}
function otpForm(reset) {
  return `<form id="otpf" novalidate><div id="ostep1"><label class="lbl" for="op">${t('mobile')}</label><div class="pre91"><span class="num">+91</span><input id="op" name="phone" required inputmode="numeric" pattern="[6-9][0-9]{9}" maxlength="10" autocomplete="tel-national" class="num"></div>
    <p id="oerr" class="ferr" aria-live="polite"></p><button class="btn block lg" id="osend">${t('send_otp')}</button></div>
    <div id="ostep2" hidden><p class="small" id="osent"></p><label class="lbl" for="oc">${t('otp')}</label><input id="oc" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" class="num otpbox">
    ${reset ? `<label class="lbl" for="onp">${t('new_pw')}</label><input id="onp" name="new_password" type="password" minlength="8" autocomplete="new-password" placeholder="${esc(t('pw_hint'))}">` : ''}
    <p id="oerr2" class="ferr" aria-live="polite"></p><button class="btn block lg" id="overify">${reset ? t('reset_btn') : t('verify_login')}</button><button type="button" class="btn link small" id="oresend" style="margin-top:10px" disabled>${t('resend')}</button></div></form>`;
}
function bindOtp(reset, next) {
  const f = $('#otpf'); let phone = '';
  const send = async () => {
    phone = f.phone.value.trim(); const e1 = $('#oerr'); e1.textContent = '';
    if (!/^[6-9]\d{9}$/.test(phone)) { e1.textContent = LANG === 'mr' ? '१० अंकी मोबाईल नंबर टाका' : 'Enter a valid 10-digit mobile number'; return; }
    try { const r = await api('/api/auth/otp/request', { method: 'POST', body: { phone } }); $('#ostep1').hidden = true; $('#ostep2').hidden = false;
      $('#osent').innerHTML = `${t('otp_sent')} <b class="num">+91 ${esc(phone)}</b>${r.dev_code ? `<br><span class="badge accent">${t('dev_otp')} ${esc(r.dev_code)}</span>` : ''}`; $('#oc').focus();
      const rb = $('#oresend'); rb.disabled = true; let s = 45; const iv = setInterval(() => { if (!document.body.contains(rb)) return clearInterval(iv); rb.textContent = `${t('resend')} (${s--})`; if (s < 0) { clearInterval(iv); rb.disabled = false; rb.textContent = t('resend'); } }, 1000);
    } catch (er) { (e1.offsetParent ? e1 : $('#oerr2')).textContent = er.message; }
  };
  $('#osend').onclick = (e) => { e.preventDefault(); send(); };
  $('#oresend').onclick = () => { $('#ostep1').hidden = true; send(); };
  $('#overify').onclick = async (e) => { e.preventDefault(); const e2 = $('#oerr2'); e2.textContent = '';
    const body = { phone, code: f.code.value.trim() }; if (reset) body.new_password = f.new_password.value;
    if (!/^\d{6}$/.test(body.code)) { e2.textContent = t('otp'); return; }
    try { ME = (await api('/api/auth/otp/verify', { method: 'POST', body })).user; toast(`${t('hello')}, ${ME.name}`); go(next && next.startsWith('#/') ? next : '#/my'); } catch (er) { e2.textContent = er.message; } };
}
function forgotPage() {
  if (ME) return go('#/settings');
  view(`<div class="auth">${authArt()}<div class="form"><div><h1 style="font-size:34px">${t('reset_h')}</h1><p class="muted">${t('reset_p')}</p>${otpForm(true)}<p class="small muted center" style="margin-top:20px"><a href="#/login">${ic('left', 'sm')} ${t('login')}</a></p></div></div></div>`);
  bindOtp(true, '#/my');
}
function welcomePage(params) {
  if (!ME) return go('#/login');
  view(`<div class="wrap dash" style="max-width:520px"><div class="card" style="padding:32px">
    <div class="row" style="flex-wrap:nowrap">${ME.avatar_url ? `<img src="${esc(ME.avatar_url)}" alt="" class="gav" referrerpolicy="no-referrer">` : `<span class="avatar">${esc(initials(ME.name))}</span>`}<div><h1 style="font-size:28px;margin:0">${t('complete_h')}</h1><p class="muted small" style="margin:2px 0 0">${t('complete_p')}</p></div></div>
    <form id="wf" novalidate style="margin-top:10px"><label class="lbl">${t('name')}</label><input name="name" required value="${esc(ME.name)}">
      <label class="lbl">${t('mobile')}</label><div class="pre91"><span class="num">+91</span><input name="phone" required inputmode="numeric" pattern="[6-9][0-9]{9}" maxlength="10" class="num" value="${esc(ME.phone || '')}"></div>
      <div class="row"><div class="grow"><label class="lbl">${t('class')}</label><select name="class_level">${CLASSES.map((c) => `<option value="${c}" ${c === (ME.class_level || '4') ? 'selected' : ''}>${t('class')} ${num(c)}</option>`).join('')}</select></div><div class="grow"><label class="lbl">${t('district')}</label><input name="district" value="${esc(ME.district || '')}"></div></div>
      ${ME.consent ? '' : consentBox()}<p id="werr" class="ferr" aria-live="polite"></p><button class="btn block lg">${t('save_continue')}</button></form></div></div>`);
  $('#wf').addEventListener('submit', async (e) => { e.preventDefault(); const er = $('#werr'); er.textContent = '';
    if (!e.target.checkValidity()) { const bad = $(':invalid', e.target); er.textContent = bad.name === 'consent' ? (LANG === 'mr' ? 'पालकांची संमती आवश्यक आहे' : 'Parent/guardian consent is required') : (LANG === 'mr' ? '१० अंकी मोबाईल नंबर टाका' : 'Enter a valid 10-digit mobile number'); return; }
    try { ME = (await api('/api/me', { method: 'PUT', body: { ...formData(e.target), consent: ME.consent || e.target.consent?.checked === true } })).user; const n = params.get('next'); go(n && n.startsWith('#/') ? n : '#/my'); } catch (x) { er.textContent = x.message; } });
}
function settingsPage() {
  if (!ME) return go('#/login?next=' + encodeURIComponent('#/settings'));
  view(`<div class="wrap dash" style="max-width:640px"><span class="eyebrow">${t('account')}</span><h1 style="font-size:clamp(28px,4vw,38px);margin-top:10px">${t('settings')}</h1>
    <div class="card" style="margin-top:20px"><div class="row" style="flex-wrap:nowrap;margin-bottom:6px">${ME.avatar_url ? `<img src="${esc(ME.avatar_url)}" alt="" class="gav" referrerpolicy="no-referrer">` : `<span class="avatar" style="width:52px;height:52px;font-size:18px">${esc(initials(ME.name))}</span>`}<div><b>${esc(ME.name)}</b>${ME.google ? `<div class="xs muted">${googleBtnSvg} ${t('signed_google')}</div>` : ''}</div></div>
      <h3 style="margin-top:14px">${t('profile')}</h3><form id="pf" novalidate><div class="formgrid">
        <div class="full"><label class="lbl">${t('name')}</label><input name="name" required value="${esc(ME.name)}"></div>
        <div><label class="lbl">${t('mobile')}</label><div class="pre91"><span class="num">+91</span><input name="phone" required inputmode="numeric" pattern="[6-9][0-9]{9}" maxlength="10" class="num" value="${esc(ME.phone || '')}"></div></div>
        <div><label class="lbl">${t('email')}</label><input name="email" type="email" value="${esc(ME.email || '')}"></div>
        <div><label class="lbl">${t('class')}</label><select name="class_level">${CLASSES.map((c) => `<option value="${c}" ${c === ME.class_level ? 'selected' : ''}>${t('class')} ${num(c)}</option>`).join('')}</select></div>
        <div><label class="lbl">${t('district')}</label><input name="district" value="${esc(ME.district || '')}"></div></div>
        ${ME.consent ? '' : consentBox()}<p id="perr" class="ferr" aria-live="polite"></p><button class="btn">${t('save_changes')}</button></form></div>
    <div class="card" style="margin-top:16px"><h3>${t('change_pw')}</h3><form id="cpf" class="stack">${ME.google ? '' : `<div><label class="lbl">${t('cur_pw')}</label><input name="current" type="password" autocomplete="current-password" required></div>`}
      <div><label class="lbl">${t('new_pw')}</label><input name="new_password" type="password" minlength="8" autocomplete="new-password" required placeholder="${esc(t('pw_hint'))}"></div><p id="cerr" class="ferr" aria-live="polite"></p><button class="btn ghost">${t('change_pw')}</button></form></div>
    <button class="btn ghost block" id="lo3" style="margin-top:16px;color:var(--bad)">${ic('logout', 'sm')} ${t('logout')}</button></div>`);
  $('#pf').addEventListener('submit', async (e) => { e.preventDefault(); const er = $('#perr'); er.textContent = '';
    try { ME = (await api('/api/me', { method: 'PUT', body: { ...formData(e.target), consent: ME.consent || e.target.consent?.checked === true } })).user; toast('✓ ' + t('save_changes')); renderShell(); } catch (x) { er.textContent = x.message; } });
  $('#cpf').addEventListener('submit', async (e) => { e.preventDefault(); const er = $('#cerr'); er.textContent = '';
    try { await api('/api/me/password', { method: 'PUT', body: formData(e.target) }); e.target.reset(); toast('✓ ' + t('change_pw')); } catch (x) { er.textContent = x.message; } });
  $('#lo3').onclick = logout;
}

/* ======================================================================
   ROUTER
   ====================================================================== */
async function route_() {
  const [p, qs] = (location.hash.slice(1) || '/').split('?');
  const params = new URLSearchParams(qs || '');
  const parts = p.split('/').filter(Boolean);
  clearInterval(timerHandle);
  if (liveES && parts[0] !== 'live') { liveES.close(); liveES = null; }
  await loadMine();
  if (ME && !ME.phone && !['welcome', 'settings', 'page'].includes(parts[0])) return go('#/welcome?next=' + encodeURIComponent(location.hash));
  renderShell();
  const needAuth = (fn) => (ME ? fn() : go('#/login?next=' + encodeURIComponent(location.hash)));
  try {
    if (!parts.length) return await home();
    switch (parts[0]) {
      case 'explore': return await explore(params);
      case 'course': return await course(parts[1], params);
      case 'watch': return needAuth(() => watch(parts[1]));
      case 'test': return needAuth(() => test(parts[1]));
      case 'my': return await my();
      case 'account': return settingsPage();
      case 'login': case 'register': return authPage(parts[0], params);
      case 'forgot': return forgotPage();
      case 'welcome': return welcomePage(params);
      case 'settings': return settingsPage();
      case 'page': return page(parts[1]);
      case 'live': return parts[1] ? await liveRoom(parts[1]) : await livePage();
      case 'doubt': return await doubtPage(parts[1]);
      case 'certificate': return await certificatePage(parts[1]);
      case 'wishlist': return await wishPage();
      case 'admin': return await adminPage(parts[1], parts[2] && decodeURIComponent(parts[2]));
      default: return notFound();
    }
  } catch (e) {
    if (e.status === 401) return go('#/login?next=' + encodeURIComponent(location.hash));
    view(`<div class="wrap"><div class="empty card" style="margin-top:24px">${ic('flag')}<p>${esc(e.message)}</p><a class="btn" href="#/">${t('go_home')}</a></div></div>`);
  }
}
window.addEventListener('hashchange', () => { route_(); window.scrollTo(0, 0); });
(async () => {
  const [me, ex, site] = await Promise.all([api('/api/me'), api('/api/exams'), api('/api/site')]);
  ME = me.user; CONFIG = me; EXAMS = ex; SITE = site; applyTheme();
  if (!LANG) LANG = S('default_language') || 'mr';
  route_();
})();
// Replace broken profile photos (e.g. expired Google avatar URLs) with initials.
document.addEventListener('error', (e) => {
  const img = e.target; if (!(img instanceof HTMLImageElement) || !img.closest('.avatar, .gav, .row')) return;
  if (img.classList.contains('gav') || img.parentElement?.classList.contains('avatar')) { const s = document.createElement('span'); s.className = 'avatar' + (img.classList.contains('gav') ? ' gav' : ''); s.textContent = initials(ME?.name || '?'); img.replaceWith(s); }
}, true);
