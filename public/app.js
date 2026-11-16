'use strict';
/* ======================================================================
   Vidyarthi Path – single-page front end (student site + admin panel)
   ====================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = { get: (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } } };
let ME = null, CONFIG = {}, EXAMS = [];
let LANG = store.get('vp_lang', 'mr');

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
    pay_test: 'TEST MODE: simulate a successful payment of', paid: 'Payment successful 🎉', coupon_ok: 'Coupon applied!', you_pay: 'You pay',
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
    pay_test: 'टेस्ट मोड: पेमेंट यशस्वी समजायचे?', paid: 'पेमेंट यशस्वी 🎉', coupon_ok: 'कूपन लागू झाले!', you_pay: 'भरायची रक्कम',
    foot_about: 'महाराष्ट्रातील प्रत्येक विद्यार्थ्यासाठी त्याच्या भाषेत परवडणारी, दर्जेदार परीक्षा तयारी.',
    exams: 'परीक्षा', company: 'कंपनी', support: 'मदत', privacy: 'गोपनीयता धोरण', terms: 'अटी', refund: 'परतावा धोरण', contact: 'संपर्क',
    confirm: 'नक्की?', cancel: 'रद्द करा', ok: 'ठीक आहे', not_found: 'पान सापडले नाही', go_home: 'मुख्यपृष्ठावर जा',
  },
};
const t = (k) => I18N[LANG][k] ?? I18N.en[k] ?? k;
const examName = (e) => (LANG === 'mr' && (e.name_mr || e.exam_name_mr)) || e.name || e.exam_name || '';
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
const hue = (id) => [[250, 285], [14, 38], [160, 190], [330, 355], [200, 230], [40, 20]][id % 6];
const grad = (id) => { const [a, b] = hue(id); return `linear-gradient(135deg,hsl(${a} 72% 52%),hsl(${b} 78% 46%))`; };
const pct = (p, m) => (m > p ? Math.round((1 - p / m) * 100) : 0);
const initials = (n) => (n || '?').split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase();

/* ---------------- shell ---------------- */
function renderShell() {
  document.documentElement.lang = LANG === 'mr' ? 'mr' : 'en';
  const route = (location.hash.slice(2).split(/[/?]/)[0]) || '';
  const on = (r) => (route === r ? 'on' : '');
  $('#top').innerHTML = `<div class="wrap">
    <a href="#/" class="brand" aria-label="Vidyarthi Path home"><img src="/icon.svg" alt="">Vidyarthi<b>Path</b></a>
    <nav class="navlinks hide-sm"><a class="${on('')}" href="#/">${t('home')}</a><a class="${on('explore')}" href="#/explore">${t('explore')}</a>${ME ? `<a class="${on('my')}" href="#/my">${t('my')}</a>` : ''}${ME?.role === 'admin' ? `<a class="${on('admin')}" href="#/admin">${t('admin')}</a>` : ''}</nav>
    <form class="search hide-sm" id="hsearch" role="search"><span>🔍</span><input name="q" placeholder="${esc(t('search_ph'))}" aria-label="Search"></form>
    <div class="spacer"></div>
    <div class="lang" role="group" aria-label="Language"><button data-lang="mr" class="${LANG === 'mr' ? 'on' : ''}">मराठी</button><button data-lang="en" class="${LANG === 'en' ? 'on' : ''}">EN</button></div>
    ${ME ? `<button class="avatar" id="av" aria-label="Account menu">${esc(initials(ME.name))}</button>` : `<a class="btn ghost sm hide-sm" href="#/login">${t('login')}</a><a class="btn sm" href="#/register">${t('register')}</a>`}
  </div><div id="menuslot"></div>`;
  $('#tabbar').innerHTML = `<a class="${on('')}" href="#/"><i>🏠</i>${t('home')}</a><a class="${on('explore')}" href="#/explore"><i>📚</i>${t('explore')}</a><a class="${on('my')}" href="#/my"><i>🎓</i>${t('my')}</a>${ME?.role === 'admin' ? `<a class="${on('admin')}" href="#/admin"><i>⚙️</i>${t('admin')}</a>` : ''}<a class="${on('login') || on('account')}" href="${ME ? '#/account' : '#/login'}"><i>👤</i>${ME ? t('account') : t('login')}</a>`;
  $$('[data-lang]').forEach((b) => (b.onclick = () => { LANG = b.dataset.lang; store.set('vp_lang', LANG); route_(); }));
  $('#hsearch')?.addEventListener('submit', (e) => { e.preventDefault(); go('#/explore?q=' + encodeURIComponent(e.target.q.value.trim())); });
  $('#av')?.addEventListener('click', (e) => {
    e.stopPropagation(); const s = $('#menuslot');
    if (s.innerHTML) { s.innerHTML = ''; return; }
    s.innerHTML = `<div class="menu wrap" style="position:absolute"><div style="padding:8px 12px"><b>${esc(ME.name)}</b><div class="xs muted">${esc(ME.phone)}</div></div><a href="#/my">🎓 ${t('my')}</a>${ME.role === 'admin' ? `<a href="#/admin">⚙️ ${t('admin')}</a>` : ''}<button id="lo">↩ ${t('logout')}</button></div>`;
    $('#lo').onclick = logout;
  });
  $('#foot').innerHTML = `<div class="wrap"><div><a href="#/" class="brand" style="padding:0"><img src="/icon.svg" alt="">Vidyarthi<b>Path</b></a><p class="muted small" style="margin-top:10px">${t('foot_about')}</p></div>
   <div><h4>${t('exams')}</h4>${EXAMS.slice(0, 6).map((e) => `<a href="#/explore?exam=${esc(e.slug)}">${esc(examName(e))}</a>`).join('')}</div>
   <div><h4>${t('board')}</h4><a href="#/explore?board=State">${t('state')}</a><a href="#/explore?board=CBSE">CBSE</a><a href="#/explore?board=ICSE">ICSE</a></div>
   <div><h4>${t('support')}</h4><a href="#/page/contact">${t('contact')}</a><a href="#/page/privacy">${t('privacy')}</a><a href="#/page/terms">${t('terms')}</a><a href="#/page/refund">${t('refund')}</a></div></div>
   <div class="copy">© ${new Date().getFullYear()} Vidyarthi Path · Not affiliated with NVS, MSCE, CBSE or CISCE</div>`;
}
document.addEventListener('click', (e) => { if (!e.target.closest('#menuslot') && !e.target.closest('#av')) { const s = $('#menuslot'); if (s) s.innerHTML = ''; } });
async function logout() { await api('/api/auth/logout', { method: 'POST', body: {} }); ME = null; go('#/'); route_(); }

// PWA install prompt
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; $('#installslot') && renderInstall(); });
function renderInstall() {
  const s = $('#installslot'); if (!s || !deferredInstall) return;
  s.innerHTML = `<div class="install"><span style="font-size:24px">📲</span><span class="grow" style="flex:1">${t('install')}</span><button class="btn sm accent" id="inst">${t('install_btn')}</button></div>`;
  $('#inst').onclick = async () => { deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; s.innerHTML = ''; };
}
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));

/* ---------------- components ---------------- */
function courseCard(c) {
  const off = pct(c.price, c.mrp);
  return `<a class="cc" href="#/course/${c.id}">
    <div class="thumb" style="background:${grad(c.id)}">${c.featured ? '<span class="badge accent">★ Bestseller</span>' : ''}<span class="big" aria-hidden="true">${esc(c.exam_icon || '📘')}</span><div class="tt">${esc(c.title)}</div></div>
    <div class="body">
      <div class="row" style="gap:6px"><span class="badge">${esc(examName(c))}</span>${c.class_level ? `<span class="badge accent">${t('class')} ${esc(c.class_level)}</span>` : ''}</div>
      <p class="small muted" style="margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(c.description || '')}</p>
      <div class="meta"><span>🎬 ${c.lectures}</span><span>📄 ${c.materials}</span><span>📝 ${c.tests}</span><span>🗣 ${esc(c.language)}</span></div>
      <div class="foot"><div><span class="price">${c.price ? rs(c.price) : t('free')}</span>${c.mrp > c.price ? `<span class="mrp">${rs(c.mrp)}</span><span class="off">${off}% off</span>` : ''}</div><span class="btn sm soft">→</span></div>
    </div></a>`;
}
const skelGrid = (n = 4) => `<div class="grid">${Array(n).fill('<div class="skel card-skel"></div>').join('')}</div>`;

/* ---------------- home ---------------- */
async function home() {
  const featured = await api('/api/courses?featured=1');
  const ann = await api('/api/announcements').catch(() => []);
  const popular = EXAMS.filter((e) => ['jnvst-6', 'mh-scholarship-4', 'mh-scholarship-7', 'nmms'].includes(e.slug));
  view(`
  <section class="hero"><div class="wrap">
    <div>
      <span class="pill">${t('hero_pill')}</span>
      <h1>${t('hero_h1')}</h1>
      <p class="lead">${t('hero_lead')}</p>
      <form class="search" id="bigsearch" role="search"><span>🔍</span><input name="q" placeholder="${esc(t('search_ph'))}" aria-label="Search courses"></form>
      <div class="quick"><span style="opacity:.8;font-size:14px">${t('popular')}</span> ${popular.map((e) => `<a href="#/explore?exam=${esc(e.slug)}">${esc(examName(e))}</a>`).join('')}</div>
    </div>
    <div class="hero-card" aria-hidden="true">
      <div class="stat"><b>13+</b><span>${LANG === 'mr' ? 'परीक्षा व बोर्ड एकाच ठिकाणी' : 'exams & boards in one place'}</span></div>
      <div class="stat"><b>२ भाषा</b><span>${LANG === 'mr' ? 'मराठी आणि इंग्रजी' : 'Marathi & English'}</span></div>
      <div class="stat"><b>२४×७</b><span>${LANG === 'mr' ? 'कधीही, कुठेही शिका' : 'learn anytime, anywhere'}</span></div>
      <div class="stat"><b>₹0</b><span>${LANG === 'mr' ? 'मोफत डेमो लेक्चर्स' : 'free demo lectures'}</span></div>
    </div>
  </div></section>
  <div class="wrap">
    <div id="installslot"></div>
    ${ann.length ? `<div class="card row" style="margin-top:20px;gap:12px"><span style="font-size:22px">📢</span><div class="grow"><b>${esc(ann[0].title)}</b> <span class="muted">${esc(ann[0].body)}</span></div></div>` : ''}
    <section class="section">
      <div class="sechead"><div><h2>${t('choose_goal')}</h2><p class="muted">${t('choose_goal_sub')}</p></div></div>
      <div class="grid goals">${EXAMS.filter((e) => !/-5$|-8$/.test(e.slug)).map((e) => `<a class="goal" href="#/explore?exam=${esc(e.slug)}"><span class="ic">${esc(e.icon || '📘')}</span><b>${esc(examName(e))}</b><span>${t('cat_' + e.category)}${e.courses ? ` · ${e.courses} ${t('results')}` : ''}</span></a>`).join('')}</div>
    </section>
    <section class="section" style="padding-top:0">
      <div class="sechead"><h2>${t('by_board')}</h2></div>
      <div class="card"><div class="chips" style="margin-bottom:14px">${BOARDS.slice(1).map(([v, k]) => `<a class="chip" href="#/explore?board=${v}">${t(k)}</a>`).join('')}</div>
      <div class="chips">${CLASSES.map((c) => `<a class="chip" href="#/explore?class=${c}">${t('class')} ${num(c)}</a>`).join('')}</div></div>
    </section>
    <section class="section" style="padding-top:0">
      <div class="sechead"><div><h2>${t('featured')}</h2><p class="muted">${t('featured_sub')}</p></div><a href="#/explore" class="btn ghost sm">${t('view_all')}</a></div>
      <div class="grid">${featured.map(courseCard).join('')}</div>
    </section>
    <section class="section">
      <div class="sechead"><h2>${t('why')}</h2></div>
      <div class="grid g3">${[['🗣', 'f1'], ['📝', 'f2'], ['📱', 'f3'], ['💰', 'f4'], ['📈', 'f5'], ['🛡', 'f6']].map(([i, k]) => `<div class="card feat"><span class="ic">${i}</span><div><h3>${t(k)}</h3><p>${t(k + 'd')}</p></div></div>`).join('')}</div>
    </section>
    <section class="section" style="padding-top:0">
      <div class="sechead"><h2>${t('how')}</h2></div>
      <div class="steps">${['s1', 's2', 's3', 's4'].map((k) => `<div class="step"><b>${t(k)}</b></div>`).join('')}</div>
    </section>
    <section class="section"><div class="cta">
      <div><h2>${t('cta_h')}</h2><p>${t('cta_p')}</p></div>
      <form id="lead" class="stack"><input name="name" placeholder="${esc(t('name'))}" maxlength="100" autocomplete="name">
        <div class="row"><input class="grow" name="phone" required inputmode="numeric" pattern="[6-9][0-9]{9}" maxlength="10" placeholder="${esc(t('mobile'))}" autocomplete="tel-national">
        <select name="class_level" style="max-width:150px" aria-label="${esc(t('class'))}">${CLASSES.map((c) => `<option value="${c}">${t('class')} ${num(c)}</option>`).join('')}</select></div>
        <button class="btn accent block">${t('cta_btn')}</button></form>
    </div></section>
    <section class="section" style="padding-top:0;max-width:820px;margin:0 auto">
      <h2 class="center">${t('faq')}</h2>
      ${[1, 2, 3, 4].map((i) => `<details class="faq"><summary>${t('q' + i)}</summary><p>${t('a' + i)}</p></details>`).join('')}
    </section>
  </div>`);
  renderInstall();
  $('#bigsearch').addEventListener('submit', (e) => { e.preventDefault(); go('#/explore?q=' + encodeURIComponent(e.target.q.value.trim())); });
  $('#lead').addEventListener('submit', async (e) => { e.preventDefault(); try { await api('/api/leads', { method: 'POST', body: formData(e.target) }); e.target.reset(); toast(t('thanks_lead')); } catch (er) { toast(er.message); } });
}

/* ---------------- explore ---------------- */
async function explore(params) {
  const f = { q: params.get('q') || '', exam: params.get('exam') || '', board: params.get('board') || '', class: params.get('class') || '', category: params.get('category') || '' };
  const link = (patch) => { const p = new URLSearchParams(); Object.entries({ ...f, ...patch }).forEach(([k, v]) => v && p.set(k, v)); const s = p.toString(); return '#/explore' + (s ? '?' + s : ''); };
  const exam = EXAMS.find((e) => e.slug === f.exam);
  view(`<div class="wrap"><div class="explore">
    <aside class="filters"><div class="card">
      <form id="fs" class="search" style="max-width:none"><span>🔍</span><input name="q" value="${esc(f.q)}" placeholder="${esc(t('search_ph'))}" aria-label="Search"></form>
      <h4>${t('category')}</h4><div class="chips"><a class="chip ${!f.category ? 'on' : ''}" href="${link({ category: '', exam: '' })}">${t('all')}</a>${CATS.map((c) => `<a class="chip ${f.category === c ? 'on' : ''}" href="${link({ category: c, exam: '' })}">${t('cat_' + c)}</a>`).join('')}</div>
      <h4>${t('exam')}</h4><div class="chips">${EXAMS.filter((e) => !f.category || e.category === f.category).map((e) => `<a class="chip ${f.exam === e.slug ? 'on' : ''}" href="${link({ exam: f.exam === e.slug ? '' : e.slug })}">${esc(e.icon)} ${esc(examName(e))}</a>`).join('')}</div>
      <h4>${t('board')}</h4><div class="chips">${BOARDS.map(([v, k]) => `<a class="chip ${f.board === v ? 'on' : ''}" href="${link({ board: v })}">${t(k)}</a>`).join('')}</div>
      <h4>${t('class')}</h4><div class="chips">${CLASSES.map((c) => `<a class="chip ${f.class === c ? 'on' : ''}" href="${link({ class: f.class === c ? '' : c })}">${num(c)}</a>`).join('')}</div>
      ${Object.values(f).some(Boolean) ? `<a class="btn ghost sm block" style="margin-top:18px" href="#/explore">✕ ${t('clear')}</a>` : ''}
    </div></aside>
    <section>
      ${exam ? `<div class="card" style="margin-bottom:18px;display:flex;gap:16px;align-items:flex-start"><span class="goal" style="border:0;padding:0;min-height:0"><span class="ic">${esc(exam.icon)}</span></span><div><h2 style="margin-bottom:4px">${esc(examName(exam))}</h2><p class="muted small" style="margin:0">${esc(exam.description || '')}</p></div></div>` : `<h2>${t('explore')}</h2>`}
      <div id="res">${skelGrid(6)}</div>
    </section></div></div>`);
  $('#fs').addEventListener('submit', (e) => { e.preventDefault(); go(link({ q: e.target.q.value.trim() })); });
  const qs = new URLSearchParams(); Object.entries(f).forEach(([k, v]) => v && qs.set(k, v));
  const cs = await api('/api/courses?' + qs);
  $('#res').innerHTML = cs.length ? `<p class="muted small">${cs.length} ${t('results')}</p><div class="grid">${cs.map(courseCard).join('')}</div>`
    : `<div class="empty card"><div class="em">🔎</div><p>${t('no_results')}</p><a class="btn soft" href="#/explore">${t('clear')}</a></div>`;
}

/* ---------------- course ---------------- */
async function course(id, params) {
  const d = await api('/api/courses/' + id); const c = d.course;
  const [h1, h2] = hue(c.id);
  const done = d.lectures.filter((l) => l.done).length, total = d.lectures.length;
  const tab = params.get('tab') || 'lectures';
  const off = pct(c.price, c.mrp);
  const nextLec = d.lectures.find((l) => !l.done && !l.locked) || d.lectures.find((l) => !l.locked);
  const buyBtn = d.enrolled
    ? (nextLec ? `<a class="btn block lg" href="#/watch/${nextLec.id}">▶ ${t('continue')}</a>` : '')
    : `<button class="btn accent block lg" data-buy>${c.price ? t('buy') : t('enroll_free')}</button>`;
  const lecRows = d.lectures.map((l, i) => `<li class="${l.locked ? 'locked' : ''}"><span class="ic ${l.done ? 'done' : ''}">${l.done ? '✓' : l.locked ? '🔒' : '▶'}</span><span class="t"><b>${i + 1}. ${esc(l.title)}</b><span class="xs muted">${l.duration_min} ${t('min')}${l.is_preview && !d.enrolled ? ` · <span class="badge ok">${t('free')}</span>` : ''}</span></span>${l.locked ? '' : `<a class="btn sm ${l.is_preview && !d.enrolled ? 'soft' : 'ghost'}" href="#/watch/${l.id}">${l.is_preview && !d.enrolled ? t('preview') : t('watch')}</a>`}</li>`).join('');
  const matRows = d.materials.map((m) => `<li class="${m.locked ? 'locked' : ''}"><span class="ic">${m.locked ? '🔒' : '📄'}</span><span class="t"><b>${esc(m.title)}</b>${m.is_preview && !d.enrolled ? `<span class="badge ok">${t('free')}</span>` : ''}</span>${m.locked ? '' : `<a class="btn sm ghost" href="/api/materials/${m.id}/download" target="_blank" rel="noopener">${t('open')}</a>`}</li>`).join('');
  const testRows = d.tests.map((x) => `<li class="${x.locked ? 'locked' : ''}"><span class="ic">${x.locked ? '🔒' : '📝'}</span><span class="t"><b>${esc(x.title)}</b><span class="xs muted">${x.questions} ${t('questions')} · ${x.duration_min} ${t('min')}</span></span>${x.locked ? '' : `<a class="btn sm ${x.is_preview && !d.enrolled ? 'soft' : 'ghost'}" href="#/test/${x.id}">${t('start')}</a>`}</li>`).join('');
  const panes = { lectures: lecRows, notes: matRows, tests: testRows };
  view(`<header class="chead" style="--h1:hsl(${h1} 70% 42%);--h2:hsl(${h2} 75% 38%)"><div class="wrap">
    <div class="crumbs small"><a href="#/explore">${t('explore')}</a> › <a href="#/explore?exam=${esc(c.exam_slug || '')}">${esc(examName(c))}</a></div>
    <h1>${esc(c.title)}</h1>
    <div class="meta"><span>🗣 ${esc(c.language)}</span>${c.class_level ? `<span>🎒 ${t('class')} ${esc(c.class_level)}</span>` : ''}${c.board && c.board !== 'All' ? `<span>🏛 ${esc(c.board)}</span>` : ''}<span>🎬 ${total} ${t('lectures')}</span><span>📝 ${d.tests.length} ${t('tests')}</span></div>
  </div></header>
  <div class="wrap"><div class="cbody">
    <div class="stack">
      ${d.enrolled && total ? `<div class="card"><div class="row" style="justify-content:space-between"><b>${t('enrolled')} ✅</b><span class="small muted">${done}/${total} · ${Math.round((done / total) * 100)}% ${t('complete')}</span></div><div class="progress" style="margin-top:10px"><i style="width:${(done / total) * 100}%"></i></div></div>` : ''}
      <div class="card">
        <div class="tabs" role="tablist">${[['lectures', '🎬', d.lectures.length], ['notes', '📄', d.materials.length], ['tests', '📝', d.tests.length]].map(([k, i, n]) => `<button role="tab" aria-selected="${tab === k}" class="${tab === k ? 'on' : ''}" data-tab="${k}">${i} ${t(k)} (${n})</button>`).join('')}</div>
        <ul class="items" id="pane">${panes[tab] || `<li class="muted">${t('coming')}</li>`}</ul>
      </div>
      <div class="card"><h3>${t('about')}</h3><p style="white-space:pre-wrap;margin:0">${esc(c.description)}</p></div>
    </div>
    <aside class="buybox"><div class="card">
      <div class="thumb" style="background:${grad(c.id)}"><span class="big">${esc(c.exam_icon || '📘')}</span></div>
      ${d.enrolled ? '' : `<div><span class="price" style="font-size:30px">${c.price ? rs(c.price) : t('free')}</span>${c.mrp > c.price ? `<span class="mrp">${rs(c.mrp)}</span><span class="off">${off}% off</span>` : ''}</div>`}
      <div style="margin:14px 0">${buyBtn}</div>
      ${!d.enrolled && c.price ? `<details><summary class="small" style="cursor:pointer;color:var(--primary);font-weight:600">${t('coupon')}</summary><div class="row" style="margin-top:8px"><input id="coupon" class="grow" placeholder="CODE" style="text-transform:uppercase"><button class="btn sm soft" id="applyc">${t('apply')}</button></div><div id="cmsg" class="small" style="margin-top:6px"></div></details>` : ''}
      <ul><li><b>${t('inc')}</b></li><li>🎬 ${total} ${t('lectures')}</li><li>📄 ${d.materials.length} ${t('notes')}</li><li>📝 ${d.tests.length} ${t('tests')}</li><li>⏳ ${t('valid')} ${c.validity_days} ${t('days')}</li><li>📱 Mobile + Desktop</li></ul>
    </div></aside>
  </div></div>
  ${d.enrolled ? '' : `<div class="mbuy"><div style="flex:1"><span class="price">${c.price ? rs(c.price) : t('free')}</span>${c.mrp > c.price ? `<span class="mrp">${rs(c.mrp)}</span>` : ''}</div><button class="btn accent" data-buy>${c.price ? t('buy') : t('enroll_free')}</button></div>`}`);
  $$('[data-tab]').forEach((b) => (b.onclick = () => { $$('[data-tab]').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); }); $('#pane').innerHTML = panes[b.dataset.tab] || `<li class="muted">${t('coming')}</li>`; }));
  $$('[data-buy]').forEach((b) => (b.onclick = () => buy(c.id, ($('#coupon')?.value || '').trim())));
  $('#applyc')?.addEventListener('click', async () => {
    if (!ME) return go('#/login?next=' + encodeURIComponent('#/course/' + c.id));
    try { const q = await api('/api/checkout/quote', { method: 'POST', body: { course_id: c.id, coupon: $('#coupon').value.trim() } }); $('#cmsg').innerHTML = `<span style="color:var(--ok);font-weight:700">${t('coupon_ok')} ${t('you_pay')} ${rs(q.amount)}</span>`; }
    catch (e) { $('#cmsg').innerHTML = `<span style="color:var(--bad)">${esc(e.message)}</span>`; }
  });
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
      key: o.key, amount: o.amount * 100, currency: 'INR', name: 'Vidyarthi Path', order_id: o.rzp_order_id, theme: { color: '#3b2fc9' },
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
  view(`<div class="wrap"><div class="watch">
    <div>
      <a href="#/course/${l.course_id}" class="small">← ${t('back_course')}</a>
      <div class="player" style="margin-top:10px">${p?.type === 'iframe' ? `<iframe src="${esc(p.src)}" title="${esc(l.title)}" allow="accelerometer; gyroscope; encrypted-media; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`
        : p ? `<video src="${esc(p.src)}" controls controlsList="nodownload" playsinline></video>` : '<p style="color:#fff;padding:20px">Video unavailable</p>'}
        <span class="wm">${esc(ME.phone)}</span></div>
      <h2 style="margin-top:16px">${esc(l.title)}</h2>
      <div class="row">
        <button class="btn ${l.done ? 'soft' : ''}" id="mk">${l.done ? '✓ ' + t('done') : t('mark_done')}</button>
        <div style="flex:1"></div>
        ${l.prev ? `<a class="btn ghost" href="#/watch/${l.prev.id}">← ${t('prev')}</a>` : ''}
        ${l.next ? `<a class="btn ghost" href="#/watch/${l.next.id}">${t('next')} →</a>` : ''}
      </div>
    </div>
    <aside class="card" style="padding:0;align-self:start"><h3 style="padding:16px 16px 0">${t('playlist')}</h3><div class="playlist">
      ${d.lectures.map((x, i) => x.locked ? `<a aria-disabled="true" style="opacity:.55">🔒 ${i + 1}. ${esc(x.title)}</a>` : `<a href="#/watch/${x.id}" class="${x.id === l.id ? 'on' : ''}">${x.done ? '✅' : '▶'} ${i + 1}. ${esc(x.title)}</a>`).join('')}
    </div></aside></div></div>`);
  $('#mk').onclick = async () => {
    await api(`/api/lectures/${id}/complete`, { method: 'POST', body: { done: !l.done } });
    if (!l.done && l.next) { toast('✓ ' + t('done')); go('#/watch/' + l.next.id); } else route_();
  };
}

/* ---------------- test engine ---------------- */
let timerHandle;
async function test(id) {
  const { test: tst, questions: qs } = await api('/api/tests/' + id);
  const ans = {}, marked = new Set(); let cur = 0, left = tst.duration_min * 60, submitted = false;
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  view(`<div class="testbar"><div class="wrap row"><b class="grow" style="flex:1">${esc(tst.title)}</b><span class="timer" id="timer">${fmt(left)}</span><button class="btn sm" id="sub">${t('submit')}</button></div></div>
    <div class="wrap"><div class="testgrid"><div class="card" id="qbox"></div>
    <aside class="card" style="align-self:start"><b>${qs.length} ${t('questions')}</b><div class="palette" id="pal" style="margin-top:12px"></div>
    <div class="legend"><span><i style="background:var(--ok)"></i>${t('answered')}</span><span><i style="background:var(--accent)"></i>${t('marked')}</span><span><i style="border:1.5px solid var(--line)"></i>${t('not_answered')}</span></div></aside></div></div>`);
  const draw = () => {
    const q = qs[cur];
    $('#qbox').innerHTML = `<div class="row" style="justify-content:space-between;margin-bottom:12px"><span class="badge">Q ${cur + 1} / ${qs.length}</span><button class="btn sm ghost" id="mr">${marked.has(q.id) ? '★' : '☆'} ${t('mark_review')}</button></div>
      <div class="qtext">${esc(q.text)}</div>
      ${q.options.map((o, j) => `<label class="opt ${ans[q.id] === j ? 'sel' : ''}"><input type="radio" name="o" value="${j}" ${ans[q.id] === j ? 'checked' : ''}><span class="k">${'ABCDEF'[j]}</span><span>${esc(o)}</span></label>`).join('')}
      <div class="row" style="margin-top:18px"><button class="btn ghost" id="pv" ${cur === 0 ? 'disabled' : ''}>← ${t('prev')}</button><button class="btn ghost sm" id="cl">${t('clear_resp')}</button><div style="flex:1"></div>
      ${cur < qs.length - 1 ? `<button class="btn" id="nx">${t('next')} →</button>` : `<button class="btn accent" id="fin">${t('submit')}</button>`}</div>`;
    $('#pal').innerHTML = qs.map((x, i) => `<button class="${ans[x.id] !== undefined ? 'ans' : ''} ${marked.has(x.id) ? 'mark' : ''} ${i === cur ? 'cur' : ''}" data-i="${i}" aria-label="Question ${i + 1}">${i + 1}</button>`).join('');
    $$('#qbox .opt input').forEach((r) => (r.onchange = () => { ans[q.id] = Number(r.value); draw(); }));
    $('#mr').onclick = () => { marked.has(q.id) ? marked.delete(q.id) : marked.add(q.id); draw(); };
    $('#cl').onclick = () => { delete ans[q.id]; draw(); };
    $('#pv').onclick = () => { cur--; draw(); };
    $('#nx') && ($('#nx').onclick = () => { cur++; draw(); });
    $('#fin') && ($('#fin').onclick = ask);
    $$('#pal button').forEach((b) => (b.onclick = () => { cur = Number(b.dataset.i); draw(); }));
  };
  const ask = async () => { if (await confirmBox(`${t('submit_q')} (${Object.keys(ans).length}/${qs.length} ${t('answered')})`, t('submit'))) submit(); };
  const submit = async () => {
    if (submitted) return; submitted = true; clearInterval(timerHandle);
    const r = await api(`/api/tests/${id}/submit`, { method: 'POST', body: { answers: ans } });
    const p = r.total ? Math.round((r.score / r.total) * 100) : 0;
    const attempted = Object.keys(ans).length;
    view(`<div class="wrap" style="max-width:860px;padding:24px 16px">
      <a href="#/course/${tst.course_id}" class="small">← ${t('back_course')}</a>
      <div class="card center" style="margin:12px 0 20px"><div class="ring" style="--p:${p}"><div>${p}%</div></div><h2>${t('score')}: ${r.score} / ${r.total}</h2>
      <div class="kpis" style="max-width:520px;margin:16px auto 0"><div class="kpi"><span>${t('rank')}</span><b>#${r.rank}</b></div><div class="kpi"><span>${t('accuracy')}</span><b>${attempted ? Math.round((r.score / attempted) * 100) : 0}%</b></div><div class="kpi"><span>${t('answered')}</span><b>${attempted}/${r.total}</b></div></div>
      <a class="btn soft" style="margin-top:16px" href="#/test/${id}?r=${Date.now()}">↻ ${t('retake')}</a></div>
      <h3>${t('solutions')}</h3>
      ${r.review.map((q, i) => `<div class="card" style="margin-bottom:12px"><div class="qtext" style="font-size:17px">${i + 1}. ${esc(q.text)}</div>${q.options.map((o, j) => `<div class="opt ${j === q.answer_index ? 'right' : j === q.chosen ? 'wrong' : ''}" style="cursor:default"><span class="k">${'ABCDEF'[j]}</span><span>${esc(o)}</span></div>`).join('')}${q.explanation ? `<p class="small" style="background:var(--accent-soft);padding:10px 14px;border-radius:12px;margin:8px 0 0">💡 ${esc(q.explanation)}</p>` : ''}</div>`).join('')}
    </div>`);
    window.scrollTo(0, 0);
  };
  const tick = () => { left--; const el = $('#timer'); if (!el) return clearInterval(timerHandle); el.textContent = fmt(Math.max(0, left)); el.classList.toggle('low', left <= 60); if (left <= 0) { toast(t('time_up')); submit(); } };
  clearInterval(timerHandle); timerHandle = setInterval(tick, 1000);
  $('#sub').onclick = ask; draw();
}

/* ---------------- my learning ---------------- */
async function my() {
  if (!ME) return go('#/login?next=' + encodeURIComponent('#/my'));
  const [cs, at] = await Promise.all([api('/api/my/courses'), api('/api/my/attempts')]);
  const avg = at.length ? Math.round(at.reduce((s, a) => s + (a.total ? a.score / a.total : 0), 0) / at.length * 100) : 0;
  view(`<div class="wrap dash">
    <h1 style="font-size:clamp(24px,4vw,34px)">${t('hello')}, ${esc(ME.name.split(' ')[0])} 👋</h1>
    <div id="installslot"></div>
    <div class="kpis" style="margin:16px 0 28px"><div class="kpi"><span>${t('my_courses')}</span><b>${cs.length}</b></div><div class="kpi"><span>${t('lectures')} ✓</span><b>${cs.reduce((s, c) => s + c.done, 0)}</b></div><div class="kpi"><span>${t('tests')}</span><b>${at.length}</b></div><div class="kpi"><span>${t('accuracy')}</span><b>${avg}%</b></div></div>
    <h2>${t('my_courses')}</h2>
    ${cs.length ? `<div class="grid">${cs.map((c) => { const p = c.total ? Math.round((c.done / c.total) * 100) : 0; return `<a class="cc" href="#/course/${c.id}"><div class="thumb" style="background:${grad(c.id)};aspect-ratio:16/6"><span class="big" style="font-size:44px">${esc(c.exam_icon || '📘')}</span><div class="tt" style="font-size:17px">${esc(c.title)}</div></div><div class="body"><div class="row" style="justify-content:space-between"><span class="small muted">${c.done}/${c.total} ${t('lectures')}</span><b class="small">${p}%</b></div><div class="progress"><i style="width:${p}%"></i></div><span class="xs muted">${t('valid_till')} ${esc((c.expires_at || '').slice(0, 10))}</span><span class="btn sm soft" style="margin-top:6px">▶ ${t('continue')}</span></div></a>`; }).join('')}</div>`
      : `<div class="empty card"><div class="em">🎒</div><p>${t('no_courses')}</p><a class="btn" href="#/explore">${t('browse')}</a></div>`}
    <h2 style="margin-top:36px">${t('test_history')}</h2>
    ${at.length ? `<div class="tblwrap"><table class="tbl"><tr><th>${t('tests')}</th><th>${t('score')}</th><th>%</th><th>Date</th></tr>${at.map((a) => { const p = a.total ? Math.round((a.score / a.total) * 100) : 0; return `<tr><td>${esc(a.title)}</td><td><b>${a.score}/${a.total}</b></td><td><span class="badge ${p >= 60 ? 'ok' : p >= 35 ? 'accent' : 'bad'}">${p}%</span></td><td class="muted">${esc(a.created_at.slice(0, 16))}</td></tr>`; }).join('')}</table></div>` : `<p class="muted">—</p>`}
  </div>`);
  renderInstall();
}
function account() {
  if (!ME) return go('#/login');
  view(`<div class="wrap dash" style="max-width:560px"><div class="card center"><div class="avatar" style="width:72px;height:72px;font-size:26px;margin:0 auto 12px">${esc(initials(ME.name))}</div><h2>${esc(ME.name)}</h2><p class="muted">${esc(ME.phone)}${ME.class_level ? ' · ' + t('class') + ' ' + esc(ME.class_level) : ''}</p>
   <div class="stack" style="text-align:left;margin-top:18px"><a class="btn ghost block" href="#/my">🎓 ${t('my')}</a>${ME.role === 'admin' ? `<a class="btn ghost block" href="#/admin">⚙️ ${t('admin')}</a>` : ''}<a class="btn ghost block" href="#/page/contact">💬 ${t('contact')}</a><button class="btn danger block" id="lo2">${t('logout')}</button></div></div></div>`);
  $('#lo2').onclick = logout;
}

/* ---------------- auth ---------------- */
function authPage(kind, params) {
  if (ME) return go('#/my');
  const reg = kind === 'register';
  view(`<div class="auth"><div class="art"><h2>${reg ? t('create_acc') : t('welcome_back')}</h2><ul style="list-style:none;padding:0">${['auth_l1', 'auth_l2', 'auth_l3', 'auth_l4'].map((k) => `<li>${t(k)}</li>`).join('')}</ul></div>
   <div class="form"><div><h2>${reg ? t('create_acc') : t('login')}</h2>
   <form id="af">
    ${reg ? `<label class="lbl" for="n">${t('name')}</label><input id="n" name="name" required maxlength="100" autocomplete="name">` : ''}
    <label class="lbl" for="p">${t('mobile')}</label><input id="p" name="phone" required inputmode="numeric" pattern="[6-9][0-9]{9}" maxlength="10" placeholder="98XXXXXXXX" autocomplete="tel-national">
    <label class="lbl" for="pw">${t('password')}</label><input id="pw" name="password" type="password" required minlength="${reg ? 8 : 1}" autocomplete="${reg ? 'new-password' : 'current-password'}" ${reg ? `placeholder="${esc(t('pw_hint'))}"` : ''}>
    ${reg ? `<div class="row"><div class="grow"><label class="lbl">${t('class')}</label><select name="class_level">${CLASSES.map((c) => `<option value="${c}" ${c === '4' ? 'selected' : ''}>${t('class')} ${num(c)}</option>`).join('')}</select></div><div class="grow"><label class="lbl">${t('district')}</label><input name="district" maxlength="100" autocomplete="address-level2"></div></div>` : ''}
    <button class="btn block lg" style="margin-top:20px">${reg ? t('register') : t('login')}</button>
   </form><p class="small muted center" style="margin-top:16px">${reg ? `${t('have_acc')} <a href="#/login${params.get('next') ? '?next=' + encodeURIComponent(params.get('next')) : ''}">${t('login')}</a>` : `${t('new_here')} <a href="#/register${params.get('next') ? '?next=' + encodeURIComponent(params.get('next')) : ''}">${t('register')}</a>`}</p></div></div></div>`);
  $('#af').addEventListener('submit', async (e) => {
    e.preventDefault(); const b = $('button', e.target); b.disabled = true;
    try { ME = (await api('/api/auth/' + kind, { method: 'POST', body: formData(e.target) })).user; toast(`${t('hello')}, ${ME.name}`); const n = params.get('next'); go(n && n.startsWith('#/') ? n : '#/my'); }
    catch (er) { toast(er.message); b.disabled = false; }
  });
}

/* ---------------- static pages (edit text before launch) ---------------- */
const PAGES = {
  contact: ['Contact us', '<p>📞 Call / WhatsApp: <b>+91-XXXXXXXXXX</b><br>✉️ Email: support@example.com<br>🕘 Mon–Sat, 9am–7pm</p>'],
  privacy: ['Privacy policy', '<p>We collect your name, mobile number, class and district to provide our courses. We never sell your data. Because our learners are children, we process data only with parental consent, as required by the Digital Personal Data Protection Act, 2023. To delete your data, contact support.</p>'],
  terms: ['Terms of use', '<p>Course content is for personal use by the registered student only. Sharing your login or recording or redistributing content is not allowed and may lead to your account being blocked.</p>'],
  refund: ['Refund policy', '<p>Refunds are available within 7 days of purchase if less than 20% of the course has been watched. Contact support with your order number.</p>'],
};
function page(k) { const p = PAGES[k]; if (!p) return notFound(); view(`<div class="wrap dash" style="max-width:760px"><div class="card"><h1 style="font-size:30px">${p[0]}</h1>${p[1]}</div></div>`); }
const notFound = () => view(`<div class="wrap"><div class="empty"><div class="em">🧭</div><h2>${t('not_found')}</h2><a class="btn" href="#/">${t('go_home')}</a></div></div>`);

/* ======================================================================
   ADMIN PANEL
   ====================================================================== */
const ADMIN_TABS = [['dashboard', '📊', 'Dashboard'], ['courses', '📚', 'Courses'], ['users', '👥', 'Students'], ['orders', '🧾', 'Orders'], ['leads', '📞', 'Leads'], ['coupons', '🏷', 'Coupons'], ['announcements', '📢', 'Announcements']];
async function adminPage(tab, arg) {
  if (ME?.role !== 'admin') return view(`<div class="wrap"><div class="empty"><div class="em">🔒</div><p>Admins only.</p></div></div>`);
  tab = tab || 'dashboard';
  const A = (p, o) => api('/api/admin' + p, o);
  const reload = () => adminPage(tab, arg);
  const shell = (inner) => view(`<div class="wrap"><div class="admin"><nav class="side">${ADMIN_TABS.map(([k, i, l]) => `<a class="${k === tab || (tab === 'test' && k === 'courses') ? 'on' : ''}" href="#/admin/${k}">${i} ${l}</a>`).join('')}</nav><section>${inner}</section></div></div>`);
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
    shell(`<div class="sechead"><h2>Courses</h2></div><details class="card"><summary style="cursor:pointer"><b>＋ Create new course</b></summary>${courseForm({})}</details>
     <div class="tblwrap" style="margin-top:16px"><table class="tbl"><tr><th>Course</th><th>Exam</th><th>Board / Class</th><th>Price</th><th>Status</th><th></th></tr>
     ${cs.map((c) => `<tr><td><b>${esc(c.title)}</b>${c.featured ? ' <span class="badge accent">★</span>' : ''}</td><td>${esc(c.exam_name || '-')}</td><td>${esc(c.board)} ${c.class_level ? '· ' + esc(c.class_level) : ''}</td><td>${rs(c.price)}</td><td>${c.published ? '<span class="badge ok">Live</span>' : '<span class="badge">Draft</span>'}</td><td><a class="btn sm ghost" href="#/admin/courses/${c.id}">Manage</a></td></tr>`).join('')}</table></div>`);
    $('#cf').addEventListener('submit', async (e) => { e.preventDefault(); try { const r = await A('/courses', { method: 'POST', body: courseBody(e.target) }); toast('Course created'); go('#/admin/courses/' + r.id); } catch (er) { onErr(er); } });
  }

  if (tab === 'courses' && arg) {
    const id = Number(arg);
    const [cs, ct] = await Promise.all([A('/courses'), A(`/courses/${id}/content`)]);
    const c = cs.find((x) => x.id === id); if (!c) return shell('Not found');
    shell(`<div class="row" style="margin-bottom:12px"><a href="#/admin/courses" class="small">← All courses</a><span class="muted">·</span><a href="#/course/${id}" class="small">View as student ↗</a></div>
     <h2>${esc(c.title)}</h2>
     <details class="card"><summary style="cursor:pointer"><b>✏️ Course details</b></summary>${courseForm(c)}<button class="btn danger sm" id="del" style="margin-top:10px">Delete course</button></details>
     <div class="grid" style="margin-top:16px;grid-template-columns:repeat(auto-fit,minmax(320px,1fr))">
      <div class="card"><h3>🎬 Lectures (${ct.lectures.length})</h3><ul class="items">${ct.lectures.map((l) => `<li><span class="t"><b>${l.position}. ${esc(l.title)}</b><span class="xs muted">${l.duration_min}m ${l.is_preview ? '· free preview' : ''}</span></span><button class="iconbtn" data-del="/lectures/${l.id}" aria-label="Delete">🗑</button></li>`).join('')}</ul>
       <form id="lf" class="stack" style="margin-top:12px"><input name="title" placeholder="Lecture title" required><input name="video_url" placeholder="Bunny Stream / YouTube (unlisted) / Vimeo / MP4 URL" required>
       <div class="row"><input class="grow" name="duration_min" type="number" min="0" placeholder="Minutes"><input class="grow" name="position" type="number" placeholder="Order #"></div>
       <label class="check"><input type="checkbox" name="is_preview"> Free preview</label><button class="btn sm">＋ Add lecture</button></form></div>
      <div class="card"><h3>📄 PDFs / Notes (${ct.materials.length})</h3><ul class="items">${ct.materials.map((m) => `<li><span class="t"><b>${esc(m.title)}</b><span class="xs muted">${esc(m.original_name)} ${m.is_preview ? '· free' : ''}</span></span><button class="iconbtn" data-del="/materials/${m.id}" aria-label="Delete">🗑</button></li>`).join('')}</ul>
       <form id="mf" class="stack" style="margin-top:12px"><input name="title" placeholder="Title (e.g. Chapter 1 notes)"><input name="file" type="file" accept="application/pdf" required>
       <label class="check"><input type="checkbox" name="is_preview" value="1"> Free preview</label><button class="btn sm">⬆ Upload PDF</button></form></div>
      <div class="card"><h3>📝 Tests (${ct.tests.length})</h3><ul class="items">${ct.tests.map((x) => `<li><span class="t"><b>${esc(x.title)}</b><span class="xs muted">${x.questions} Q · ${x.duration_min}m ${x.is_preview ? '· free' : ''}</span></span><a class="btn sm ghost" href="#/admin/test/${x.id}">Questions</a><button class="iconbtn" data-del="/tests/${x.id}" aria-label="Delete">🗑</button></li>`).join('')}</ul>
       <form id="tf2" class="stack" style="margin-top:12px"><input name="title" placeholder="Test title" required><input name="duration_min" type="number" min="1" placeholder="Duration (minutes)">
       <label class="check"><input type="checkbox" name="is_preview"> Free test</label><button class="btn sm">＋ Add test</button></form></div></div>`);
    $('#cf').addEventListener('submit', async (e) => { e.preventDefault(); try { await A('/courses/' + id, { method: 'PUT', body: courseBody(e.target) }); toast('Saved'); reload(); } catch (er) { onErr(er); } });
    $('#del').onclick = async () => { if (await confirmBox('Delete this course and all its content?', 'Delete')) { try { await A('/courses/' + id, { method: 'DELETE' }); go('#/admin/courses'); } catch (er) { onErr(er); } } };
    $('#lf').addEventListener('submit', async (e) => { e.preventDefault(); try { await A(`/courses/${id}/lectures`, { method: 'POST', body: { ...formData(e.target), is_preview: e.target.is_preview.checked } }); toast('Lecture added'); reload(); } catch (er) { onErr(er); } });
    $('#tf2').addEventListener('submit', async (e) => { e.preventDefault(); try { await A(`/courses/${id}/tests`, { method: 'POST', body: { ...formData(e.target), is_preview: e.target.is_preview.checked } }); reload(); } catch (er) { onErr(er); } });
    $('#mf').addEventListener('submit', async (e) => { e.preventDefault(); const b = $('button', e.target); b.disabled = true; b.textContent = 'Uploading…'; try { await A(`/courses/${id}/materials`, { method: 'POST', body: new FormData(e.target) }); toast('Uploaded'); reload(); } catch (er) { onErr(er); b.disabled = false; b.textContent = '⬆ Upload PDF'; } });
    bindDeletes(A, reload);
  }

  if (tab === 'test') {
    const qs = await A(`/tests/${arg}/questions`);
    shell(`<a href="javascript:history.back()" class="small">← Back</a><h2>Questions (${qs.length})</h2>
     ${qs.map((q, i) => `<div class="card" style="margin-bottom:10px"><div class="row" style="justify-content:space-between;align-items:flex-start"><b style="flex:1">Q${i + 1}. ${esc(q.text)}</b><button class="iconbtn" data-del="/questions/${q.id}" aria-label="Delete">🗑</button></div>${q.options.map((o, j) => `<div class="small" style="padding:3px 0;${j === q.answer_index ? 'color:var(--ok);font-weight:700' : ''}">${j === q.answer_index ? '✔' : '○'} ${'ABCDEF'[j]}. ${esc(o)}</div>`).join('')}${q.explanation ? `<div class="xs muted">💡 ${esc(q.explanation)}</div>` : ''}</div>`).join('')}
     <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(320px,1fr));margin-top:16px">
     <div class="card"><h3>＋ Add question</h3><form id="qf" class="stack"><textarea name="text" rows="3" placeholder="Question (Marathi / English)" required></textarea>
      ${[0, 1, 2, 3].map((i) => `<input name="opt${i}" placeholder="Option ${'ABCD'[i]}" ${i < 2 ? 'required' : ''}>`).join('')}
      <div class="row"><label class="small grow">Correct option</label><select name="answer_index" style="max-width:120px">${[0, 1, 2, 3].map((i) => `<option value="${i}">${'ABCD'[i]}</option>`).join('')}</select></div>
      <input name="explanation" placeholder="Explanation (optional)"><button class="btn sm">Add question</button></form></div>
     <div class="card"><h3>⬆ Bulk import (CSV / Excel paste)</h3><p class="small muted">One question per line:<br><code>question,optionA,optionB,optionC,optionD,correct(A-D),explanation</code></p>
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
    shell(`<h2>Students</h2><form id="us" class="search" style="max-width:420px;margin-bottom:16px"><span>🔍</span><input name="q" placeholder="Search name or mobile" value="${esc(arg || '')}"></form>
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
    shell(`<div class="sechead"><h2>Orders</h2><a class="btn ghost sm" download="orders.csv" href="data:text/csv;charset=utf-8,${encodeURIComponent(csv)}">⬇ Export CSV</a></div>
     <div class="tblwrap"><table class="tbl"><tr><th>#</th><th>Date</th><th>Student</th><th>Course</th><th>Amount</th><th>Coupon</th><th>Status</th></tr>
     ${os.map((o) => `<tr><td>${o.id}</td><td class="muted">${esc(o.created_at.slice(0, 16))}</td><td><b>${esc(o.user_name)}</b><div class="xs muted">${esc(o.phone)}</div></td><td>${esc(o.course_title)}</td><td><b>${rs(o.amount)}</b></td><td>${esc(o.coupon_code || '')}</td><td><span class="badge ${o.status === 'paid' ? 'ok' : o.status === 'failed' ? 'bad' : ''}">${esc(o.status)}</span></td></tr>`).join('') || '<tr><td colspan="7" class="muted">No orders yet</td></tr>'}</table></div>`);
  }

  if (tab === 'leads') {
    const ls = await A('/leads');
    shell(`<h2>Call-back leads</h2><p class="muted small">Requests from the homepage "Request a call back" form. Call them within 24 hours: this is your best conversion channel.</p>
     <div class="tblwrap"><table class="tbl"><tr><th>Date</th><th>Name</th><th>Mobile</th><th>Class</th><th></th></tr>
     ${ls.map((l) => `<tr><td class="muted">${esc(l.created_at.slice(0, 16))}</td><td>${esc(l.name || '-')}</td><td><a href="tel:${esc(l.phone)}">${esc(l.phone)}</a> · <a href="https://wa.me/91${esc(l.phone)}" target="_blank" rel="noopener">WhatsApp</a></td><td>${esc(l.class_level || '')}</td><td><button class="iconbtn" data-del="/leads/${l.id}" aria-label="Delete">✓</button></td></tr>`).join('') || '<tr><td colspan="5" class="muted">No leads yet</td></tr>'}</table></div>`);
    bindDeletes(A, reload);
  }

  if (tab === 'coupons') {
    const cps = await A('/coupons');
    shell(`<h2>Coupons</h2><form id="cpf" class="card row" style="margin-bottom:16px"><input class="grow" name="code" placeholder="CODE" required style="text-transform:uppercase"><input class="grow" name="percent_off" type="number" min="1" max="100" placeholder="% off" required><input class="grow" name="max_uses" type="number" min="1" placeholder="Max uses"><button class="btn">Save coupon</button></form>
     <div class="tblwrap"><table class="tbl"><tr><th>Code</th><th>Discount</th><th>Used</th><th>Status</th><th></th></tr>${cps.map((c) => `<tr><td><b>${esc(c.code)}</b></td><td>${c.percent_off}%</td><td>${c.used}/${c.max_uses}</td><td>${c.active ? '<span class="badge ok">Active</span>' : '<span class="badge">Disabled</span>'}</td><td>${c.active ? `<button class="btn sm ghost" data-del="/coupons/${encodeURIComponent(c.code)}">Disable</button>` : ''}</td></tr>`).join('')}</table></div>`);
    $('#cpf').addEventListener('submit', async (e) => { e.preventDefault(); try { await A('/coupons', { method: 'POST', body: formData(e.target) }); reload(); } catch (er) { onErr(er); } });
    bindDeletes(A, reload);
  }

  if (tab === 'announcements') {
    const an = await api('/api/announcements');
    shell(`<h2>Announcements</h2><form id="anf" class="card stack" style="margin-bottom:16px"><input name="title" placeholder="Title" required><textarea name="body" rows="2" placeholder="Message (shown on the homepage)"></textarea><button class="btn sm">Publish</button></form>
     <div class="card"><ul class="items">${an.map((a) => `<li><span class="t"><b>${esc(a.title)}</b><span class="small muted">${esc(a.body)}</span></span><button class="iconbtn" data-del="/announcements/${a.id}" aria-label="Delete">🗑</button></li>`).join('') || '<li class="muted">None</li>'}</ul></div>`);
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
const courseBody = (f) => ({ ...formData(f), published: f.published.checked, featured: f.featured.checked });
const courseForm = (c) => `<form id="cf" style="margin-top:12px"><div class="formgrid">
  <div class="full"><label class="lbl">Title</label><input name="title" required value="${esc(c.title)}"></div>
  <div><label class="lbl">Exam / category</label><select name="exam_id">${EXAMS.map((e) => `<option value="${e.id}" ${e.id === c.exam_id ? 'selected' : ''}>${esc(e.icon)} ${esc(e.name)}</option>`).join('')}</select></div>
  <div><label class="lbl">Board</label><select name="board">${['All', 'State', 'CBSE', 'ICSE'].map((b) => `<option ${b === (c.board || 'All') ? 'selected' : ''}>${b}</option>`).join('')}</select></div>
  <div><label class="lbl">Class</label><select name="class_level"><option value="">Any</option>${CLASSES.map((x) => `<option ${x === c.class_level ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
  <div><label class="lbl">Language</label><input name="language" value="${esc(c.language || 'Marathi')}"></div>
  <div class="full"><label class="lbl">Description</label><textarea name="description" rows="3">${esc(c.description)}</textarea></div>
  <div><label class="lbl">Price ₹</label><input name="price" type="number" min="0" value="${c.price ?? 0}"></div>
  <div><label class="lbl">MRP ₹ (strike-through)</label><input name="mrp" type="number" min="0" value="${c.mrp ?? 0}"></div>
  <div><label class="lbl">Validity (days)</label><input name="validity_days" type="number" min="1" value="${c.validity_days ?? 365}"></div>
  </div><div class="row"><label class="check"><input type="checkbox" name="published" ${c.published ? 'checked' : ''}> Published</label><label class="check"><input type="checkbox" name="featured" ${c.featured ? 'checked' : ''}> ★ Featured on homepage</label></div>
  <button class="btn">Save course</button></form>`;

/* ======================================================================
   ROUTER
   ====================================================================== */
async function route_() {
  const [p, qs] = (location.hash.slice(1) || '/').split('?');
  const params = new URLSearchParams(qs || '');
  const parts = p.split('/').filter(Boolean);
  clearInterval(timerHandle);
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
      case 'account': return account();
      case 'login': case 'register': return authPage(parts[0], params);
      case 'page': return page(parts[1]);
      case 'admin': return await adminPage(parts[1], parts[2] && decodeURIComponent(parts[2]));
      default: return notFound();
    }
  } catch (e) {
    if (e.status === 401) return go('#/login?next=' + encodeURIComponent(location.hash));
    view(`<div class="wrap"><div class="empty card" style="margin-top:24px"><div class="em">⚠️</div><p>${esc(e.message)}</p><a class="btn" href="#/">${t('go_home')}</a></div></div>`);
  }
}
window.addEventListener('hashchange', () => { route_(); window.scrollTo(0, 0); });
(async () => {
  const [me, ex] = await Promise.all([api('/api/me'), api('/api/exams')]);
  ME = me.user; CONFIG = me; EXAMS = ex;
  route_();
})();
