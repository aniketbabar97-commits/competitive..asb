'use strict';
// ---------- tiny helpers ----------
const $ = (s) => document.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rs = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
let ME = null, CONFIG = {};

async function api(url, opts = {}) {
  const o = { credentials: 'same-origin', ...opts };
  if (o.body && !(o.body instanceof FormData)) { o.headers = { 'Content-Type': 'application/json' }; o.body = JSON.stringify(o.body); }
  const r = await fetch(url, o);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'Request failed');
  return data;
}
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2600); }
const view = (html) => { $('#app').innerHTML = html; };
const formData = (form) => Object.fromEntries(new FormData(form).entries());

function renderNav() {
  $('#nav').innerHTML = ME
    ? `<a href="#/">Courses</a><a href="#/my">My Learning</a>${ME.role === 'admin' ? '<a href="#/admin">Admin</a>' : ''}<button class="ghost" id="logout">Logout</button>`
    : `<a href="#/">Courses</a><a href="#/login">Login</a><a href="#/register" class="btn">Register</a>`;
  $('#logout')?.addEventListener('click', async () => { await api('/api/auth/logout', { method: 'POST', body: {} }); ME = null; location.hash = '#/'; renderNav(); });
}

// ---------- pages ----------
async function home(params) {
  const exam = params.get('exam') || '';
  const [exams, courses, ann] = await Promise.all([api('/api/exams'), api('/api/courses' + (exam ? `?exam=${encodeURIComponent(exam)}` : '')), api('/api/announcements')]);
  view(`
  <section class="hero"><h1>नवोदय & शिष्यवृत्ती परीक्षेची संपूर्ण तयारी</h1>
    <p>Video lectures, PDF notes and mock tests for JNVST Class 6 & 9, Maharashtra Scholarship (5th & 8th) and NMMS – in Marathi, Hindi & English.</p></section>
  ${ann.length ? `<div class="card" style="margin-bottom:16px"><b>📢 ${esc(ann[0].title)}</b> <span class="muted">${esc(ann[0].body)}</span></div>` : ''}
  <div class="chips"><a class="chip ${!exam ? 'on' : ''}" href="#/">All</a>${exams.map((e) => `<a class="chip ${exam === e.slug ? 'on' : ''}" href="#/?exam=${esc(e.slug)}" title="${esc(e.name_mr)}">${esc(e.name)}</a>`).join('')}</div>
  <div class="grid">${courses.map(courseCard).join('') || '<p class="muted">No courses yet for this exam.</p>'}</div>`);
}
const courseCard = (c) => `<a class="card" href="#/course/${c.id}" style="color:inherit">
  <div class="small muted">${esc(c.exam_name || '')} · ${esc(c.language)}</div><h3>${esc(c.title)}</h3>
  <p class="small muted">${esc((c.description || '').slice(0, 110))}</p>
  <div class="small muted">🎬 ${c.lectures} lectures · 📄 ${c.materials} PDFs · 📝 ${c.tests} tests</div>
  <div style="margin-top:8px"><span class="price">${c.price ? rs(c.price) : 'FREE'}</span>${c.mrp > c.price ? `<span class="mrp">${rs(c.mrp)}</span>` : ''}</div></a>`;

async function course(id) {
  const d = await api('/api/courses/' + id); const c = d.course;
  view(`<div class="small muted"><a href="#/?exam=${esc(c.exam_slug || '')}">${esc(c.exam_name || 'Courses')}</a></div>
  <h1>${esc(c.title)}</h1><p>${esc(c.description)}</p>
  <div class="card" style="margin-bottom:16px">${d.enrolled ? '<b style="color:var(--ok)">✔ You are enrolled</b>' : `
    <span class="price">${c.price ? rs(c.price) : 'FREE'}</span>${c.mrp > c.price ? `<span class="mrp">${rs(c.mrp)}</span>` : ''}
    <span class="small muted"> · valid ${c.validity_days} days · ${esc(c.language)}</span>
    <div class="row" style="margin-top:10px"><input id="coupon" placeholder="Coupon code (optional)" style="max-width:220px"><button id="buy">${c.price ? 'Buy now' : 'Enroll free'}</button></div>`}</div>
  <div class="grid">
   <div class="card"><h3>🎬 Lectures</h3><ul class="list">${d.lectures.map((l) => `<li><span>${l.locked ? '🔒' : '▶'} ${esc(l.title)} <span class="small muted">${l.duration_min}m</span></span>${l.locked ? '' : `<a href="#/watch/${l.id}">${l.is_preview && !d.enrolled ? 'Preview' : 'Watch'}</a>`}</li>`).join('') || '<li class="muted">Coming soon</li>'}</ul></div>
   <div class="card"><h3>📄 Study material</h3><ul class="list">${d.materials.map((m) => `<li><span>${m.locked ? '🔒' : '📄'} ${esc(m.title)}</span>${m.locked ? '' : `<a href="/api/materials/${m.id}/download" target="_blank" rel="noopener">Open</a>`}</li>`).join('') || '<li class="muted">Coming soon</li>'}</ul></div>
   <div class="card"><h3>📝 Mock tests</h3><ul class="list">${d.tests.map((t) => `<li><span>${t.locked ? '🔒' : '📝'} ${esc(t.title)} <span class="small muted">${t.questions} Q · ${t.duration_min}m</span></span>${t.locked ? '' : `<a href="#/test/${t.id}">Start</a>`}</li>`).join('') || '<li class="muted">Coming soon</li>'}</ul></div>
  </div>`);
  $('#buy')?.addEventListener('click', () => buy(c.id, $('#coupon').value.trim()));
}

async function buy(courseId, coupon) {
  if (!ME) { location.hash = '#/login?next=' + encodeURIComponent('#/course/' + courseId); return; }
  try {
    if (coupon) { const q = await api('/api/checkout/quote', { method: 'POST', body: { course_id: courseId, coupon } }); if (!confirm(`Coupon applied! Pay ${rs(q.amount)}?`)) return; }
    const o = await api('/api/checkout/create', { method: 'POST', body: { course_id: courseId, coupon } });
    if (o.status === 'paid') { toast('Enrolled!'); return course(courseId); }
    if (o.mode === 'mock') {
      if (!confirm(`TEST MODE: simulate a successful payment of ${rs(o.amount)}?`)) return;
      await api('/api/checkout/verify', { method: 'POST', body: { order_id: o.order_id } }); toast('Payment successful 🎉'); return course(courseId);
    }
    await loadScript('https://checkout.razorpay.com/v1/checkout.js');
    new window.Razorpay({
      key: o.key, amount: o.amount * 100, currency: 'INR', name: 'Vidyarthi Path', order_id: o.rzp_order_id,
      prefill: { name: o.name, contact: o.phone },
      handler: async (resp) => { try { await api('/api/checkout/verify', { method: 'POST', body: { order_id: o.order_id, ...resp } }); toast('Payment successful 🎉'); course(courseId); } catch (e) { toast(e.message); } },
    }).open();
  } catch (e) { toast(e.message); }
}
const loadScript = (src) => new Promise((ok, no) => { if (document.querySelector(`script[src="${src}"]`)) return ok(); const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });

async function watch(id) {
  const l = await api('/api/lectures/' + id);
  const p = l.player;
  view(`<a href="#/course/${l.course_id}">← Back to course</a><h2>${esc(l.title)}</h2>
  <div class="player">${p?.type === 'iframe' ? `<iframe src="${esc(p.src)}" allow="encrypted-media; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`
    : p ? `<video src="${esc(p.src)}" controls controlsList="nodownload"></video>` : '<p style="color:#fff;padding:20px">Video unavailable</p>'}</div>
  <p class="small muted">Watermarked for ${esc(ME.name)} · ${esc(ME.phone.replace(/\d(?=\d{4})/g, '•'))}</p>`);
}

let timerHandle;
async function test(id) {
  const { test: t, questions } = await api('/api/tests/' + id);
  let left = t.duration_min * 60;
  view(`<a href="#/course/${t.course_id}">← Back</a><h2>${esc(t.title)}</h2><div class="timer" id="timer"></div>
  <form id="tf">${questions.map((q, i) => `<div class="card q"><b>Q${i + 1}. ${esc(q.text)}</b>
   ${q.options.map((o, j) => `<label><input type="radio" name="${q.id}" value="${j}">${esc(o)}</label>`).join('')}</div>`).join('')}
  <button>Submit test</button></form>`);
  const submit = async () => {
    clearInterval(timerHandle);
    const answers = {}; new FormData($('#tf')).forEach((v, k) => { answers[k] = Number(v); });
    const r = await api(`/api/tests/${id}/submit`, { method: 'POST', body: { answers } });
    view(`<a href="#/course/${t.course_id}">← Back to course</a><div class="card" style="text-align:center"><h2>Score: ${r.score} / ${r.total}</h2><p>Your rank on this test: <b>#${r.rank}</b></p></div>
    ${r.review.map((q, i) => `<div class="card q"><b>Q${i + 1}. ${esc(q.text)}</b>${q.options.map((o, j) => `<label class="${j === q.answer_index ? 'right' : j === q.chosen ? 'wrong' : ''}">${j === q.answer_index ? '✔' : j === q.chosen ? '✘' : '○'} ${esc(o)}</label>`).join('')}
    ${q.explanation ? `<p class="small muted">💡 ${esc(q.explanation)}</p>` : ''}</div>`).join('')}`);
  };
  const tick = () => { left--; const el = $('#timer'); if (!el) return clearInterval(timerHandle); el.textContent = `⏱ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; if (left <= 0) { toast('Time up!'); submit(); } };
  clearInterval(timerHandle); timerHandle = setInterval(tick, 1000); tick();
  $('#tf').addEventListener('submit', (e) => { e.preventDefault(); if (confirm('Submit the test?')) submit(); });
}

async function my() {
  if (!ME) return (location.hash = '#/login');
  const [cs, at] = await Promise.all([api('/api/my/courses'), api('/api/my/attempts')]);
  view(`<h2>नमस्कार, ${esc(ME.name)} 👋</h2><h3>My courses</h3>
  <div class="grid">${cs.map((c) => `<a class="card" href="#/course/${c.id}" style="color:inherit"><div class="small muted">${esc(c.exam_name || '')}</div><h3>${esc(c.title)}</h3><div class="small muted">Valid till ${esc((c.expires_at || '').slice(0, 10))}</div></a>`).join('') || '<p class="muted">No courses yet. <a href="#/">Browse courses</a></p>'}</div>
  <h3>Test history</h3><div class="card tablewrap"><table><tr><th>Test</th><th>Score</th><th>Date</th></tr>${at.map((a) => `<tr><td>${esc(a.title)}</td><td>${a.score}/${a.total}</td><td>${esc(a.created_at.slice(0, 16))}</td></tr>`).join('') || '<tr><td colspan="3" class="muted">No attempts yet</td></tr>'}</table></div>`);
}

function authPage(kind, params) {
  const reg = kind === 'register';
  view(`<form class="card form" id="af"><h2>${reg ? 'Create account' : 'Login'}</h2>
   ${reg ? '<label>Student / Parent name</label><input name="name" required maxlength="100">' : ''}
   <label>Mobile number</label><input name="phone" required inputmode="numeric" pattern="[6-9][0-9]{9}" maxlength="10" placeholder="10-digit mobile">
   <label>Password</label><input name="password" type="password" required minlength="${reg ? 8 : 1}">
   ${reg ? `<div class="row"><div><label>Class</label><select name="class_level"><option>4th</option><option>5th</option><option>7th</option><option>8th</option><option>Other</option></select></div><div><label>District</label><input name="district" maxlength="100"></div></div>` : ''}
   <button style="width:100%">${reg ? 'Register' : 'Login'}</button>
   <p class="small muted">${reg ? 'Already registered? <a href="#/login">Login</a>' : 'New here? <a href="#/register">Create account</a>'}</p></form>`);
  $('#af').addEventListener('submit', async (e) => {
    e.preventDefault();
    try { ME = (await api('/api/auth/' + kind, { method: 'POST', body: formData(e.target) })).user; renderNav(); toast('Welcome, ' + ME.name); const n = params.get('next'); location.hash = n && n.startsWith('#/') ? n : '#/my'; }
    catch (er) { toast(er.message); }
  });
}

// ---------- admin ----------
const ADMIN_TABS = ['dashboard', 'courses', 'users', 'orders', 'coupons', 'announcements'];
async function adminPage(tab, arg) {
  if (ME?.role !== 'admin') return view('<p>Admins only.</p>');
  tab = tab || 'dashboard';
  const tabs = `<h2>Admin panel</h2><div class="tabs">${ADMIN_TABS.map((t) => `<a class="chip ${t === tab ? 'on' : ''}" href="#/admin/${t}">${t[0].toUpperCase() + t.slice(1)}</a>`).join('')}</div>`;
  const A = (p, o) => api('/api/admin' + p, o);
  const reload = () => adminPage(tab, arg);

  if (tab === 'dashboard') {
    const s = await A('/stats');
    view(tabs + `<div class="grid">${[['Students', s.students], ['Courses', s.courses], ['Enrollments', s.enrollments], ['Total revenue', rs(s.revenue)], ['Revenue (30 days)', rs(s.revenue30)], ['Test attempts', s.attempts]]
      .map(([k, v]) => `<div class="card"><div class="muted small">${k}</div><div class="stat">${esc(v)}</div></div>`).join('')}</div>
      <h3>Top courses</h3><div class="card tablewrap"><table><tr><th>Course</th><th>Sales</th><th>Revenue</th></tr>${s.topCourses.map((c) => `<tr><td>${esc(c.title)}</td><td>${c.sales}</td><td>${rs(c.revenue)}</td></tr>`).join('')}</table></div>`);
  }

  if (tab === 'courses' && !arg) {
    const [cs, exams] = await Promise.all([A('/courses'), api('/api/exams')]);
    view(tabs + `<details class="card"><summary><b>+ New course</b></summary>${courseForm(exams, {})}</details>
     <div class="card tablewrap" style="margin-top:16px"><table><tr><th>ID</th><th>Title</th><th>Exam</th><th>Price</th><th>Status</th><th></th></tr>
     ${cs.map((c) => `<tr><td>${c.id}</td><td>${esc(c.title)}</td><td>${esc(c.exam_name || '-')}</td><td>${rs(c.price)}</td><td>${c.published ? '✅ Live' : '📝 Draft'}</td>
      <td><a href="#/admin/courses/${c.id}">Manage</a></td></tr>`).join('')}</table></div>`);
    $('#cf').addEventListener('submit', async (e) => { e.preventDefault(); try { const r = await A('/courses', { method: 'POST', body: { ...formData(e.target), published: e.target.published.checked } }); toast('Course created'); location.hash = '#/admin/courses/' + r.id; } catch (er) { toast(er.message); } });
  }

  if (tab === 'courses' && arg) {
    const id = Number(arg);
    const [cs, exams, ct] = await Promise.all([A('/courses'), api('/api/exams'), A(`/courses/${id}/content`)]);
    const c = cs.find((x) => x.id === id); if (!c) return view(tabs + 'Not found');
    view(tabs + `<a href="#/admin/courses">← All courses</a> · <a href="#/course/${id}">View as student</a>
     <details class="card" open><summary><b>Course details</b></summary>${courseForm(exams, c)}<button class="danger" id="del">Delete course</button></details>
     <div class="grid" style="margin-top:16px">
      <div class="card"><h3>🎬 Lectures</h3><ul class="list">${ct.lectures.map((l) => `<li><span>${l.position}. ${esc(l.title)} ${l.is_preview ? '<span class="small">(free)</span>' : ''}</span><button class="ghost" data-del="/lectures/${l.id}">✕</button></li>`).join('')}</ul>
       <form id="lf"><input name="title" placeholder="Lecture title" required><input name="video_url" placeholder="YouTube (unlisted) / Vimeo / MP4 URL" required>
       <div class="row"><input name="duration_min" type="number" placeholder="Minutes"><input name="position" type="number" placeholder="Order"></div>
       <label><input type="checkbox" name="is_preview" style="width:auto"> Free preview</label><br><button>Add lecture</button></form></div>
      <div class="card"><h3>📄 PDFs / Notes</h3><ul class="list">${ct.materials.map((m) => `<li><span>${esc(m.title)} ${m.is_preview ? '<span class="small">(free)</span>' : ''}</span><button class="ghost" data-del="/materials/${m.id}">✕</button></li>`).join('')}</ul>
       <form id="mf"><input name="title" placeholder="Title"><input name="file" type="file" accept="application/pdf" required>
       <label><input type="checkbox" name="is_preview" value="1" style="width:auto"> Free preview</label><br><button>Upload PDF</button></form></div>
      <div class="card"><h3>📝 Tests</h3><ul class="list">${ct.tests.map((t) => `<li><span>${esc(t.title)} <span class="small muted">${t.questions} Q</span></span><span><a href="#/admin/test/${t.id}">Questions</a> <button class="ghost" data-del="/tests/${t.id}">✕</button></span></li>`).join('')}</ul>
       <form id="tf2"><input name="title" placeholder="Test title" required><input name="duration_min" type="number" placeholder="Duration (min)">
       <label><input type="checkbox" name="is_preview" style="width:auto"> Free test</label><br><button>Add test</button></form></div></div>`);
    $('#cf').addEventListener('submit', async (e) => { e.preventDefault(); try { await A('/courses/' + id, { method: 'PUT', body: { ...formData(e.target), published: e.target.published.checked } }); toast('Saved'); reload(); } catch (er) { toast(er.message); } });
    $('#del').onclick = async () => { if (confirm('Delete this course and all its content?')) { try { await A('/courses/' + id, { method: 'DELETE' }); location.hash = '#/admin/courses'; } catch (er) { toast(er.message); } } };
    $('#lf').addEventListener('submit', async (e) => { e.preventDefault(); try { await A(`/courses/${id}/lectures`, { method: 'POST', body: { ...formData(e.target), is_preview: e.target.is_preview.checked } }); reload(); } catch (er) { toast(er.message); } });
    $('#tf2').addEventListener('submit', async (e) => { e.preventDefault(); try { await A(`/courses/${id}/tests`, { method: 'POST', body: { ...formData(e.target), is_preview: e.target.is_preview.checked } }); reload(); } catch (er) { toast(er.message); } });
    $('#mf').addEventListener('submit', async (e) => { e.preventDefault(); try { await A(`/courses/${id}/materials`, { method: 'POST', body: new FormData(e.target) }); toast('Uploaded'); reload(); } catch (er) { toast(er.message); } });
    bindDeletes(A, reload);
  }

  if (tab === 'test') {
    const qs = await A(`/tests/${arg}/questions`);
    view(tabs + `<a href="javascript:history.back()">← Back</a><h3>Questions (${qs.length})</h3>
     ${qs.map((q, i) => `<div class="card q"><b>Q${i + 1}. ${esc(q.text)}</b> <button class="ghost" data-del="/questions/${q.id}">✕</button>${q.options.map((o, j) => `<div class="${j === q.answer_index ? 'right' : ''}">${j === q.answer_index ? '✔' : '○'} ${esc(o)}</div>`).join('')}</div>`).join('')}
     <div class="card"><h3>Add question</h3><form id="qf"><textarea name="text" placeholder="Question (Marathi / English)" required></textarea>
      ${[0, 1, 2, 3].map((i) => `<div class="row"><input name="opt${i}" placeholder="Option ${String.fromCharCode(65 + i)}" ${i < 2 ? 'required' : ''}></div>`).join('')}
      <label>Correct option</label><select name="answer_index"><option value="0">A</option><option value="1">B</option><option value="2">C</option><option value="3">D</option></select>
      <input name="explanation" placeholder="Explanation (optional)"><button>Add</button></form></div>
     <div class="card"><h3>Bulk import (CSV)</h3><p class="small muted">One question per line: <code>question,optionA,optionB,optionC,optionD,correct(A-D),explanation</code></p>
      <form id="bf"><textarea name="csv" rows="6"></textarea><button>Import</button></form></div>`);
    $('#qf').addEventListener('submit', async (e) => { e.preventDefault(); const f = formData(e.target);
      try { await A(`/tests/${arg}/questions`, { method: 'POST', body: { text: f.text, options: [f.opt0, f.opt1, f.opt2, f.opt3].filter(Boolean), answer_index: Number(f.answer_index), explanation: f.explanation } }); reload(); } catch (er) { toast(er.message); } });
    $('#bf').addEventListener('submit', async (e) => { e.preventDefault();
      const bulk = e.target.csv.value.split('\n').map((l) => parseCsvLine(l)).filter((p) => p.length >= 6).map((p) => ({ text: p[0], options: p.slice(1, 5).filter(Boolean), answer_index: 'ABCD'.indexOf(p[5].trim().toUpperCase()), explanation: p[6] || '' }));
      try { const r = await A(`/tests/${arg}/questions`, { method: 'POST', body: { bulk } }); toast(`Imported ${r.added}`); reload(); } catch (er) { toast(er.message); } });
    bindDeletes(A, reload);
  }

  if (tab === 'users') {
    const [us, cs] = await Promise.all([A('/users?q=' + encodeURIComponent(arg || '')), A('/courses')]);
    view(tabs + `<form id="us" class="row"><input name="q" placeholder="Search name or mobile" value="${esc(arg || '')}"><button>Search</button></form>
     <div class="card tablewrap"><table><tr><th>Name</th><th>Mobile</th><th>Class / District</th><th>Courses</th><th>Role</th><th>Status</th><th>Grant course</th></tr>
     ${us.map((u) => `<tr><td>${esc(u.name)}</td><td>${esc(u.phone)}</td><td>${esc(u.class_level || '')} ${esc(u.district || '')}</td><td>${u.courses}</td>
      <td><select data-role="${u.id}" ${u.id === ME.id ? 'disabled' : ''}><option ${u.role === 'student' ? 'selected' : ''}>student</option><option ${u.role === 'admin' ? 'selected' : ''}>admin</option></select></td>
      <td><button class="${u.blocked ? '' : 'ghost'}" data-block="${u.id}" data-b="${u.blocked}" ${u.id === ME.id ? 'disabled' : ''}>${u.blocked ? 'Unblock' : 'Block'}</button></td>
      <td><select data-grant="${u.id}"><option value="">—</option>${cs.map((c) => `<option value="${c.id}">${esc(c.title)}</option>`).join('')}</select></td></tr>`).join('')}</table></div>`);
    $('#us').addEventListener('submit', (e) => { e.preventDefault(); location.hash = '#/admin/users/' + encodeURIComponent(e.target.q.value); });
    const row = (id) => us.find((u) => u.id === Number(id));
    document.querySelectorAll('[data-role]').forEach((s) => s.onchange = async () => { const u = row(s.dataset.role); await A('/users/' + u.id, { method: 'PUT', body: { role: s.value, blocked: !!u.blocked } }).catch((e) => toast(e.message)); reload(); });
    document.querySelectorAll('[data-block]').forEach((b) => b.onclick = async () => { const u = row(b.dataset.block); await A('/users/' + u.id, { method: 'PUT', body: { role: u.role, blocked: !u.blocked } }).catch((e) => toast(e.message)); reload(); });
    document.querySelectorAll('[data-grant]').forEach((s) => s.onchange = async () => { if (!s.value) return; await A(`/users/${s.dataset.grant}/grant`, { method: 'POST', body: { course_id: Number(s.value) } }).then(() => toast('Access granted')).catch((e) => toast(e.message)); reload(); });
  }

  if (tab === 'orders') {
    const os = await A('/orders');
    const csv = ['id,date,student,mobile,course,amount,coupon,status,payment_id'].concat(os.map((o) => [o.id, o.created_at, o.user_name, o.phone, o.course_title, o.amount, o.coupon_code || '', o.status, o.provider_payment_id || ''].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))).join('\n');
    view(tabs + `<a class="btn ghost" download="orders.csv" href="data:text/csv;charset=utf-8,${encodeURIComponent(csv)}">⬇ Export CSV</a>
     <div class="card tablewrap" style="margin-top:12px"><table><tr><th>#</th><th>Date</th><th>Student</th><th>Course</th><th>Amount</th><th>Coupon</th><th>Status</th></tr>
     ${os.map((o) => `<tr><td>${o.id}</td><td>${esc(o.created_at.slice(0, 16))}</td><td>${esc(o.user_name)}<br><span class="small muted">${esc(o.phone)}</span></td><td>${esc(o.course_title)}</td><td>${rs(o.amount)}</td><td>${esc(o.coupon_code || '')}</td><td>${esc(o.status)}</td></tr>`).join('')}</table></div>`);
  }

  if (tab === 'coupons') {
    const cps = await A('/coupons');
    view(tabs + `<form id="cpf" class="card row"><input name="code" placeholder="CODE" required><input name="percent_off" type="number" min="1" max="100" placeholder="% off" required><input name="max_uses" type="number" placeholder="Max uses"><button>Save coupon</button></form>
     <div class="card tablewrap"><table><tr><th>Code</th><th>% off</th><th>Used</th><th>Status</th><th></th></tr>${cps.map((c) => `<tr><td>${esc(c.code)}</td><td>${c.percent_off}%</td><td>${c.used}/${c.max_uses}</td><td>${c.active ? 'Active' : 'Disabled'}</td><td>${c.active ? `<button class="ghost" data-del="/coupons/${encodeURIComponent(c.code)}">Disable</button>` : ''}</td></tr>`).join('')}</table></div>`);
    $('#cpf').addEventListener('submit', async (e) => { e.preventDefault(); try { await A('/coupons', { method: 'POST', body: formData(e.target) }); reload(); } catch (er) { toast(er.message); } });
    bindDeletes(A, reload);
  }

  if (tab === 'announcements') {
    const an = await api('/api/announcements');
    view(tabs + `<form id="anf" class="card"><input name="title" placeholder="Title" required><textarea name="body" placeholder="Message"></textarea><button>Publish</button></form>
     <ul class="list card">${an.map((a) => `<li><span><b>${esc(a.title)}</b> <span class="muted">${esc(a.body)}</span></span><button class="ghost" data-del="/announcements/${a.id}">✕</button></li>`).join('')}</ul>`);
    $('#anf').addEventListener('submit', async (e) => { e.preventDefault(); try { await A('/announcements', { method: 'POST', body: formData(e.target) }); reload(); } catch (er) { toast(er.message); } });
    bindDeletes(A, reload);
  }
}
function bindDeletes(A, reload) {
  document.querySelectorAll('[data-del]').forEach((b) => b.onclick = async () => { if (!confirm('Are you sure?')) return; try { await A(b.dataset.del, { method: 'DELETE' }); reload(); } catch (e) { toast(e.message); } });
}
function parseCsvLine(line) {
  const out = []; let cur = '', q = false;
  for (const ch of line.trim()) { if (ch === '"') q = !q; else if (ch === ',' && !q) { out.push(cur.trim()); cur = ''; } else cur += ch; }
  out.push(cur.trim()); return out;
}
const courseForm = (exams, c) => `<form id="cf"><label>Title</label><input name="title" required value="${esc(c.title)}">
  <label>Exam</label><select name="exam_id">${exams.map((e) => `<option value="${e.id}" ${e.id === c.exam_id ? 'selected' : ''}>${esc(e.name)}</option>`).join('')}</select>
  <label>Description</label><textarea name="description" rows="3">${esc(c.description)}</textarea>
  <div class="row"><div><label>Price ₹</label><input name="price" type="number" min="0" value="${c.price ?? 0}"></div><div><label>MRP ₹</label><input name="mrp" type="number" min="0" value="${c.mrp ?? 0}"></div><div><label>Validity (days)</label><input name="validity_days" type="number" min="1" value="${c.validity_days ?? 365}"></div></div>
  <label>Language</label><input name="language" value="${esc(c.language || 'Marathi')}">
  <label><input type="checkbox" name="published" style="width:auto" ${c.published ? 'checked' : ''}> Published (visible to students)</label><br><button>Save</button></form>`;

// ---------- router ----------
async function route() {
  const [p, qs] = (location.hash.slice(1) || '/').split('?');
  const params = new URLSearchParams(qs || '');
  const parts = p.split('/').filter(Boolean);
  clearInterval(timerHandle);
  try {
    if (!parts.length) return await home(params);
    if (parts[0] === 'course') return await course(parts[1]);
    if (parts[0] === 'watch') return ME ? await watch(parts[1]) : authPage('login', new URLSearchParams({ next: location.hash }));
    if (parts[0] === 'test') return ME ? await test(parts[1]) : authPage('login', new URLSearchParams({ next: location.hash }));
    if (parts[0] === 'my') return await my();
    if (parts[0] === 'login' || parts[0] === 'register') return authPage(parts[0], params);
    if (parts[0] === 'admin') return await adminPage(parts[1], parts[2] && decodeURIComponent(parts[2]));
    view('<p>Page not found. <a href="#/">Go home</a></p>');
  } catch (e) { view(`<div class="card"><p>⚠️ ${esc(e.message)}</p><a href="#/">Go home</a></div>`); }
}
window.addEventListener('hashchange', () => { route(); window.scrollTo(0, 0); });
(async () => { const r = await api('/api/me'); ME = r.user; CONFIG = r; renderNav(); route(); })();
