/* Growing Futures Maths - the API.
   This file does the same jobs the old server.js did: logins, building questions and marking answers
   (so answers never reach the browser before they are marked), quizzes, progress and staff tools.
   It does not know where it runs. Supabase runs it as an Edge Function (functions/api/index.js);
   the tests and the local dev server run it in Node with an in-memory Postgres (dev/server.mjs).

   createApi({db, env}) returns handle(request, {ip}) -> Response.
   db must offer:  query(sql, params) -> rows   and   exec(sql) for several statements.  */
import crypto from 'node:crypto';
import C from './content.js';
import { ensureSchema } from './schema.js';

const SESSION_HOURS = 12;
const TERMS = ['Autumn', 'Spring', 'Summer'];
const KINDS = ['halfterm', 'term', 'mock', 'check', 'custom'];
/* defaults from the Growing Futures Cornwall website (growingfuturesredesign): forest green, warm gold, the circular logo */
const BRAND_DEFAULT = { name: 'Growing Futures Cornwall', product: 'Maths', primary: '#265940', accent: '#dda23c', logo: 'brand/gf-logo.png' };
const OPTIONS_DEFAULT = { youtubeSearch: false, idleStudent: 20, idleStaff: 60 };
export const PRIVACY_DEFAULT = `DRAFT - Growing Futures must check and change this before real students use the platform.

What we keep about you
- Your first name and initial, a username and a scrambled (hashed) password.
- Your answers, quiz results and the topics you have practised.
- Any notes or whiteboard drawings you choose to save.
We do not keep your date of birth, address, email or phone number.

Who can see it
- Staff at Growing Futures can see your progress, answers, notes and drawings. They read notes regularly.
- If you write something in a note that makes staff worried about your safety, they will follow the Growing Futures safeguarding policy.

Why we keep it
- To show you and your tutors what to practise next and how ready you are for your exam.

How long we keep it
- [Growing Futures to fill in: for example, until 12 months after you finish your course.]

Your rights
- You can ask to see the information we hold about you, or ask for it to be corrected or deleted. Speak to a member of staff.

Where it is stored
- On Supabase servers in the [region] region, protected by encryption.`;

/* ---------- small helpers ---------- */
const sha = t => crypto.createHash('sha256').update(t).digest('hex');
function hashPw(pw) { const salt = crypto.randomBytes(16); return 'scrypt$' + salt.toString('hex') + '$' + crypto.scryptSync(String(pw), salt, 32).toString('hex'); }
function checkPw(pw, stored) { const [, s, h] = String(stored).split('$'); if (!s || !h) return false; const a = crypto.scryptSync(String(pw ?? ''), Buffer.from(s, 'hex'), 32), b = Buffer.from(h, 'hex'); return a.length === b.length && crypto.timingSafeEqual(a, b); }
const sameText = (a, b) => { const x = Buffer.from(sha(String(a ?? ''))), y = Buffer.from(sha(String(b ?? ''))); return crypto.timingSafeEqual(x, y); };
const WORDS = ['river', 'maple', 'otter', 'cliff', 'ember', 'harbour', 'willow', 'falcon', 'pebble', 'meadow', 'anchor', 'bramble', 'comet', 'heron', 'lantern', 'orchard', 'puffin', 'quartz', 'summit', 'tiger', 'cedar', 'dolphin', 'forest', 'granite'];
const genPw = () => WORDS[crypto.randomInt(WORDS.length)] + crypto.randomInt(10, 99);
const genStaffPw = () => WORDS[crypto.randomInt(WORDS.length)] + '-' + WORDS[crypto.randomInt(WORDS.length)] + '-' + crypto.randomInt(100, 999);
const cleanUser = s => String(s || '').toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 30);
const randSeed = () => crypto.randomInt(1, 2 ** 31 - 1);
const TOP = lv => C.TOPICS.filter(t => t.level === lv);
const clamp = (v, lo, hi, d) => { v = Math.round(+v); return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; };
function http400(msg, code) { const e = new Error(msg); e.status = code || 400; return e; }

/* ---------- progress maths (unchanged rules) ---------- */
function mastery(p) { if (!p) return null; if (p.recent) return [...p.recent].filter(c => c === '1').length / Math.max(p.recent.length, 5); if (p.diag === 1) return 0.8; if (p.diag === 0) return 0; return null; }
function status(p) { const m = mastery(p); if (m == null) return 'none'; if (!p.recent && p.diag === 1) return 'checked'; return m >= 0.8 ? 'secure' : m >= 0.5 ? 'mid' : 'low'; }
const isOk = s => s === 'secure' || s === 'checked';
const readiness = rows => rows.length ? Math.round(rows.reduce((a, r) => a + (r.mastery || 0), 0) / rows.length * 100) : 0;
function catchUp(u, rows) { return rows.filter(r => !isOk(r.status) && (r.assigned || r.b < u.block)).sort((a, b) => (b.assigned - a.assigned) || ((a.mastery ?? -1) - (b.mastery ?? -1)) || a.b - b.b || a.s - b.s); }
function weighted(rows) { const w = rows.map(r => 1.15 - (r.mastery || 0)); let x = Math.random() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < rows.length; i++) { x -= w[i]; if (x <= 0) return rows[i]; } return rows[rows.length - 1]; }

/* marks one answer: {r:'ok'|'no'|'nudge'|'empty', why}. why says what is wrong with a 'nudge' (right value, wrong form). */
function mark(q, answer) {
  if (q.kind === 'choice') { const i = typeof answer === 'number' ? answer : (/^\d+$/.test(String(answer ?? '')) ? +answer : NaN); return Number.isInteger(i) && i >= 0 && i < q.opts.length ? { r: C.check(q, i) } : { r: 'empty' }; }
  return C.checkFull(q, answer == null ? '' : String(answer).slice(0, 60));
}
/* In a quiz there is no second go, so a "nudge" only earns the mark when the form does not matter
   (an un-simplified ratio when the question did not ask for simplest form). */
const quizOk = (q, m) => m.r === 'ok' || (m.r === 'nudge' && m.why === 'ratio' && !/simplest/i.test(q.text));

/* Hidden screen-reader labels must not give the answer away (for example "11 objects" on a counting question). */
function hideAnswerInLabels(q, pub) {
  const a = C.plain(String(C.answerText(q))).replace(/[£,]/g, '').trim();
  if (!a || a.length > 40) return pub;
  const re = new RegExp('(^|[^0-9.])' + a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^0-9.]|$)', 'i');
  const fix = html => typeof html === 'string' ? html.replace(/aria-label="([^"]*)"/g, (m, l) => re.test(l.replace(/,/g, '')) ? 'aria-label="Diagram. Ask a member of staff if you need it described."' : m) : html;
  return { ...pub, fig: fix(pub.fig), text: fix(pub.text) };
}
const publicQ = q => hideAnswerInLabels(q, C.publicQ(q));

function embedUrl(url) {
  url = String(url || '').trim(); let m;
  if ((m = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(url))) return 'https://www.youtube-nocookie.com/embed/' + m[1];
  if ((m = /vimeo\.com\/(?:video\/)?(\d{6,12})/.exec(url))) return 'https://player.vimeo.com/video/' + m[1];
  return null;
}

/* ---------- building quizzes ---------- */
export function buildQuiz(level, kind, opt) {
  const allT = TOP(level); let pool, extra = [], n = opt.n, sections = false, extraShare = 0.25;
  if (kind === 'halfterm') { pool = allT.filter(t => t.b === opt.block); n = n || 10; }
  else if (kind === 'term') { const b2 = opt.term * 2; pool = allT.filter(t => t.b === b2 - 1 || t.b === b2); extra = allT.filter(t => t.b < b2 - 1); n = n || 20; sections = true; if (opt.term === 3) extraShare = 0.5; /* Summer has only block 5 */ }
  else if (kind === 'mock') { pool = allT; n = n || (level[0] === 'e' ? 20 : 30); sections = true; }
  else if (kind === 'check') { pool = allT.filter(t => t.b < opt.block); n = pool.length; /* one per topic, no cap */ }
  else { pool = allT.filter(t => (opt.topics || []).includes(t.id)); n = n || 10; }
  if (!pool.length) throw http400('There are no topics to build that quiz from.');
  n = Math.max(1, Math.min(60, n | 0));
  const order = t => t.b * 100 + t.s, items = [];
  const nExtra = extra.length ? Math.round(n * extraShare) : 0;
  const take = (src, count) => { const out = []; let bag = []; while (out.length < count) { if (!bag.length) bag = C.shuffle(src); out.push(bag.pop()); } return out; };
  C.setSeed(randSeed());
  const chosen = [...take(pool, n - nExtra), ...(nExtra ? take(extra, nExtra) : [])];
  const nA = sections ? Math.round(n * 0.25) : 0; let a = 0;
  const usedGen = new Set(), usedText = new Set();
  for (const t of C.shuffle(chosen)) {
    const wantNoCalc = a < nA;
    /* never the same question type twice in one quiz while the topic has another type left, and never identical wording */
    const fresh = t.gens.map((_, i) => i).filter(i => !usedGen.has(t.id + ':' + i));
    const gens = fresh.length ? fresh : t.gens.map((_, i) => i);
    let pick = null, fallback = null;
    for (let k = 0; k < 40 && !pick; k++) {
      const seed = randSeed(), gen = gens[crypto.randomInt(gens.length)], q = C.makeQ(t.id, seed, gen);
      if (usedText.has(q.text)) continue;
      const cand = { t: t.id, seed, gen, sec: sections ? (wantNoCalc && !q.calc ? 'A' : 'B') : '', text: q.text };
      if (!fallback) fallback = cand;
      if (!sections || (wantNoCalc ? !q.calc : (q.calc || k > 20))) pick = cand;
    }
    if (!pick) pick = fallback;
    if (!pick) { for (let k = 0; k < 40 && !pick; k++) { const seed = randSeed(), gen = crypto.randomInt(t.gens.length), q = C.makeQ(t.id, seed, gen); if (!usedText.has(q.text)) pick = { t: t.id, seed, gen, sec: sections ? 'B' : '', text: q.text }; } }
    if (!pick) throw http400('Could not build enough different questions. Try fewer questions.');
    usedGen.add(pick.t + ':' + pick.gen); usedText.add(pick.text); delete pick.text;
    if (pick.sec === 'A') a++; items.push(pick);
  }
  items.sort((x, y) => (x.sec > y.sec ? 1 : x.sec < y.sec ? -1 : 0) || order(C.TMAP[x.t]) - order(C.TMAP[y.t]));
  return { items, sections };
}
const quizQs = spec => spec.items.map(it => ({ it, q: C.makeQ(it.t, it.seed, it.gen) }));

/* plain words for the activity log */
const ACTION_NAMES = {
  'POST /api/password': 'changed own password', 'POST /api/admin/students': 'added students', 'PATCH /api/admin/students/:id': 'changed a student',
  'DELETE /api/admin/students/:id': 'deleted a student', 'POST /api/admin/assign': 'changed catch-up topics', 'POST /api/admin/block': 'moved students to another half term',
  'POST /api/admin/video': 'changed a video link', 'POST /api/admin/quizzes': 'made a quiz', 'POST /api/admin/quizzes/:id/assign': 'changed who a quiz is set for',
  'POST /api/admin/quizzes/:id/reset': 'let a student retake a quiz', 'POST /api/admin/quizzes/:id/mark': 'marked an unfinished quiz', 'DELETE /api/admin/quizzes/:id': 'deleted a quiz',
  'POST /api/admin/settings': 'changed settings', 'POST /api/admin/staff': 'added a staff account', 'PATCH /api/admin/staff/:id': 'reset a staff password', 'DELETE /api/admin/staff/:id': 'removed a staff account',
};

/* ======================================================================= */
export function createApi({ db, env = {} }) {
  const E = k => env[k] ?? '';
  const ALLOW_ORIGIN = E('ALLOWED_ORIGIN') || '*';
  /* SQL helpers: write ? for parameters */
  const toPg = sql => { let i = 0; return sql.replace(/\?/g, () => '$' + (++i)); };
  const all = (sql, ...p) => db.query(toPg(sql), p);
  const one = async (sql, ...p) => (await db.query(toPg(sql), p))[0] || null;
  const run = (sql, ...p) => db.query(toPg(sql), p);
  const now = () => Date.now();

  let ready = null, lastTidy = 0;
  const init = () => ready || (ready = (async () => {
    await ensureSchema(db);
    if (E('ADMIN_USER') && E('ADMIN_PASS') && !await one("SELECT 1 FROM gf.users WHERE role='admin'"))
      await run("INSERT INTO gf.users(username,name,role,pass,created) VALUES(?,?,'admin',?,?)", cleanUser(E('ADMIN_USER')), E('ADMIN_NAME') || 'Admin', hashPw(E('ADMIN_PASS')), now());
  })().catch(e => { ready = null; throw e; }));
  async function tidy() {
    if (now() - lastTidy < 3600e3) return; lastTidy = now();
    await run('DELETE FROM gf.sessions WHERE expires<?', now());
    await run('DELETE FROM gf.open_q WHERE ts<?', now() - 2 * 864e5);
    await run('DELETE FROM gf.login_fails WHERE last<? AND until<?', now() - 864e5, now());
    await run('DELETE FROM gf.audit WHERE ts<?', now() - 400 * 864e5);
  }

  /* ---------- settings ---------- */
  const getSetting = async (key, dflt) => { const r = await one('SELECT value FROM gf.settings WHERE key=?', key); let v = {}; try { v = r ? JSON.parse(r.value) : {}; } catch (e) { } return dflt && typeof dflt === 'object' ? { ...dflt, ...v } : (r ? v : dflt); };
  const setSetting = (key, v) => run('INSERT INTO gf.settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', key, JSON.stringify(v));
  const brand = () => getSetting('brand', BRAND_DEFAULT);
  const options = () => getSetting('options', OPTIONS_DEFAULT);

  /* ---------- sessions ---------- */
  async function newSession(userId) { const token = crypto.randomBytes(32).toString('hex'); await run('INSERT INTO gf.sessions(token,user_id,expires,last_active) VALUES(?,?,?,?)', sha(token), userId, now() + SESSION_HOURS * 3600e3, now()); return token; }
  async function userFromReq(req) {
    const tok = req.headers.get('x-gf-session') || ''; if (!/^[a-f0-9]{64}$/.test(tok)) return null;
    const s = await one('SELECT * FROM gf.sessions WHERE token=?', sha(tok)); if (!s || s.expires < now()) return null;
    const u = await one('SELECT * FROM gf.users WHERE id=? AND active=1', s.user_id); if (!u) return null;
    const o = await options(), idle = (u.role === 'admin' ? o.idleStaff : o.idleStudent) * 60e3;
    if (idle > 0 && now() - s.last_active > idle) { await run('DELETE FROM gf.sessions WHERE token=?', s.token); throw http400('You were logged out because nothing happened for a while. Please log in again.', 401); }
    if (now() - s.last_active > 30e3) await run('UPDATE gf.sessions SET last_active=? WHERE token=?', now(), s.token);
    u._token = s.token; return u;
  }

  /* ---------- wrong-password limits, kept in the database so a restart does not forget them ---------- */
  async function tooMany(key) { const f = await one('SELECT * FROM gf.login_fails WHERE key=?', key); return f && f.until > now() ? f : null; }
  async function failed(key, limit, lockMs) {
    const f = await one('SELECT * FROM gf.login_fails WHERE key=?', key), n = (f && f.last > now() - 600e3 ? f.n : 0) + 1;
    await run('INSERT INTO gf.login_fails(key,n,last,until) VALUES(?,?,?,?) ON CONFLICT(key) DO UPDATE SET n=excluded.n,last=excluded.last,until=excluded.until', key, n, now(), n >= limit ? now() + lockMs : 0);
  }
  const clearFails = key => run('DELETE FROM gf.login_fails WHERE key=?', key);

  /* ---------- audit log ---------- */
  const audit = (user, action, detail) => run('INSERT INTO gf.audit(ts,user_id,who,action,detail) VALUES(?,?,?,?,?)', now(), user ? user.id : null, user ? user.username : '', action, String(detail || '').slice(0, 300)).catch(() => { });

  /* ---------- progress ---------- */
  async function progMap(uid) { const m = {}; for (const p of await all('SELECT * FROM gf.progress WHERE user_id=?', uid)) m[p.topic] = p; return m; }
  async function record(uid, topic, ok, src, quizId, given) {
    const p = await one('SELECT * FROM gf.progress WHERE user_id=? AND topic=?', uid, topic);
    const recent = ((p ? p.recent : '') + (ok ? '1' : '0')).slice(-10);
    if (p) await run('UPDATE gf.progress SET attempts=attempts+1,correct=correct+?,recent=?,updated=? WHERE user_id=? AND topic=?', ok ? 1 : 0, recent, now(), uid, topic);
    else await run('INSERT INTO gf.progress(user_id,topic,attempts,correct,recent,updated) VALUES(?,?,1,?,?,?)', uid, topic, ok ? 1 : 0, recent, now());
    await run('INSERT INTO gf.answers(user_id,topic,ok,src,quiz_id,given,ts) VALUES(?,?,?,?,?,?,?)', uid, topic, ok ? 1 : 0, src, quizId || null, given == null ? null : String(given).slice(0, 60), now());
  }
  /* works a topic's progress out again from the answers table (after a quiz is deleted or retaken) */
  async function rebuild(uid, topics) {
    for (const t of new Set(topics)) {
      const rows = await all('SELECT ok,src FROM gf.answers WHERE user_id=? AND topic=? ORDER BY ts,id', uid, t);
      const prac = rows.filter(r => r.src !== 'check'), chk = rows.filter(r => r.src === 'check');
      await run('UPDATE gf.progress SET attempts=?,correct=?,recent=?,diag=?,updated=? WHERE user_id=? AND topic=?', prac.length, prac.filter(r => r.ok).length, prac.map(r => r.ok ? '1' : '0').join('').slice(-10), chk.length ? chk[chk.length - 1].ok : null, now(), uid, t);
    }
  }
  async function topicRows(u, pm) {
    pm = pm || await progMap(u.id); const as = new Set((await all('SELECT topic FROM gf.assigned WHERE user_id=?', u.id)).map(r => r.topic));
    return TOP(u.level).map(t => { const p = pm[t.id]; return { id: t.id, b: t.b, s: t.s, title: t.title, area: t.area, status: status(p), mastery: mastery(p), attempts: p ? p.attempts : 0, correct: p ? p.correct : 0, recent: p ? p.recent : '', lesson: p ? p.lesson : 0, assigned: as.has(t.id) }; });
  }

  /* ---------- practice questions ---------- */
  async function openQuestion(u, topicId, mode) {
    const t = C.TMAP[topicId]; const last = await one('SELECT gen FROM gf.open_q WHERE user_id=? AND topic=? ORDER BY id DESC LIMIT 1', u.id, topicId);
    let gen = crypto.randomInt(t.gens.length); if (last && t.gens.length > 1 && gen === last.gen) gen = (gen + 1) % t.gens.length;
    const seed = randSeed(), q = C.makeQ(topicId, seed, gen);
    const r = await one('INSERT INTO gf.open_q(user_id,topic,mode,seed,gen,ts) VALUES(?,?,?,?,?,?) RETURNING id', u.id, topicId, mode, seed, gen, now());
    return { qid: r.id, q: publicQ(q), tries: 0 };
  }
  async function loadOpen(u, qid) { const o = await one('SELECT * FROM gf.open_q WHERE id=? AND user_id=?', +qid || 0, u.id); if (!o) throw http400('That question has expired. Start a new one.'); return { o, q: C.makeQ(o.topic, o.seed, o.gen) }; }

  /* ---------- quizzes ---------- */
  const specFor = (quiz, qu) => JSON.parse((qu && qu.spec) || quiz.spec);
  async function deadline(quiz, u) { if (!quiz.minutes) return null; return Math.round(quiz.minutes * 60e3 * (1 + (u.extra_time || 0) / 100)); }
  function quizForStudent(quiz, att, spec) {
    return { id: quiz.id, title: quiz.title, kind: quiz.kind, level: quiz.level, minutes: quiz.minutes, n: spec.items.length, sections: spec.sections, state: !att ? 'new' : att.finished ? 'done' : 'started', score: att && att.finished ? att.score : null, total: att && att.finished ? att.total : null };
  }
  function reviewOf(quiz, att, spec) {
    const det = JSON.parse(att.detail || '[]');
    return { title: quiz.title, kind: quiz.kind, score: att.score, total: att.total, finished: att.finished, items: quizQs(spec).map(({ it, q }, i) => ({ sec: it.sec, q: publicQ(q), given: det[i] ? det[i].given : null, ok: det[i] ? det[i].ok : false, solution: C.solutionOf(q) })) };
  }
  async function finishAttempt(u, quiz, att, answers, spec) {
    const qs = quizQs(spec), det = []; let score = 0; const byTopic = {};
    for (let i = 0; i < qs.length; i++) {
      const { it, q } = qs[i], given = answers[i] == null ? null : answers[i], ok = quizOk(q, mark(q, given));
      if (ok) score++; det.push({ given, ok }); (byTopic[it.t] = byTopic[it.t] || []).push(ok);
      if (quiz.kind !== 'check') await record(u.id, it.t, ok, 'quiz', quiz.id, given);
    }
    if (quiz.kind === 'check') for (const [t, oks] of Object.entries(byTopic)) { // starting-point check: pass = can skip, fail = goes on the catch-up list
      const p = await one('SELECT recent FROM gf.progress WHERE user_id=? AND topic=?', u.id, t), d = oks.every(Boolean) ? 1 : 0;
      if (!p) await run('INSERT INTO gf.progress(user_id,topic,diag,updated) VALUES(?,?,?,?)', u.id, t, d, now()); else if (!p.recent) await run('UPDATE gf.progress SET diag=?,updated=? WHERE user_id=? AND topic=?', d, now(), u.id, t);
      await run('INSERT INTO gf.answers(user_id,topic,ok,src,quiz_id,ts) VALUES(?,?,?,?,?,?)', u.id, t, d, 'check', quiz.id, now());
    }
    const r = await one('UPDATE gf.attempts SET finished=?,answers=?,score=?,total=?,detail=? WHERE id=? AND finished IS NULL RETURNING *', now(), JSON.stringify(answers), score, qs.length, JSON.stringify(det), att.id);
    return r || await one('SELECT * FROM gf.attempts WHERE id=?', att.id);
  }
  /* time limits are kept by the server: an attempt whose time has run out is marked with whatever was saved */
  const GRACE = 60e3;
  async function markExpired(where, ...p) {
    const rows = await all(`SELECT a.*,q.title,q.kind,q.level,q.spec AS qspec,q.minutes,qu.spec AS uspec FROM gf.attempts a JOIN gf.quizzes q ON q.id=a.quiz_id LEFT JOIN gf.quiz_users qu ON qu.quiz_id=a.quiz_id AND qu.user_id=a.user_id
      WHERE a.finished IS NULL AND a.ends_at IS NOT NULL AND a.ends_at<? ${where || ''}`, now() - GRACE, ...p);
    for (const a of rows) { const u = await one('SELECT * FROM gf.users WHERE id=?', a.user_id); if (!u) continue; await finishAttempt(u, { id: a.quiz_id, kind: a.kind }, a, JSON.parse(a.answers || '[]'), JSON.parse(a.uspec || a.qspec)); }
  }

  /* ---------- router ---------- */
  const routes = [];
  const route = (method, pattern, role, fn) => routes.push({ method, pattern, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), role, fn });
  const pubUser = u => u && { id: u.id, name: u.name, username: u.username, role: u.role, level: u.level, block: u.block };
  const levels = () => C.LEVEL_ORDER.map(id => ({ id, name: C.LEVELS[id].name, short: C.LEVELS[id].short, blocks: C.LEVELS[id].blocks }));

  /* ================= everyone ================= */
  route('GET', '/api/me', 'public', async ({ user }) => {
    const o = await options();
    return { user: pubUser(user), brand: await brand(), setup: !await one("SELECT 1 FROM gf.users WHERE role='admin'"), setupNeedsCode: !E('ALLOW_OPEN_SETUP'), canRecover: !!E('SETUP_CODE'),
      options: { youtubeSearch: !!o.youtubeSearch, idleMinutes: user ? (user.role === 'admin' ? o.idleStaff : o.idleStudent) : 0 },
      levels: levels(), blockNames: C.BLOCK_NAMES, areas: C.AREAS };
  });
  route('GET', '/api/privacy', 'public', async () => ({ text: await getSetting('privacy', PRIVACY_DEFAULT) }));
  route('POST', '/api/setup', 'public', async ({ body, ip }) => {
    if (await one("SELECT 1 FROM gf.users WHERE role='admin'")) throw http400('Setup has already been done.', 403);
    if (!E('ALLOW_OPEN_SETUP')) {
      if (!E('SETUP_CODE')) throw http400('Setup is locked. Set the SETUP_CODE secret in Supabase first (see the README).', 403);
      if (await tooMany('setup')) throw http400('Too many wrong tries. Wait a few minutes.', 429);
      if (!sameText(body.code, E('SETUP_CODE'))) { await failed('setup', 5, 900e3); throw http400('That setup code is not right.', 403); }
    }
    const username = cleanUser(body.username), name = String(body.name || '').trim().slice(0, 60);
    if (!username || !name) throw http400('Enter a name and a username.'); if (String(body.password || '').length < 8) throw http400('Use a password of at least 8 characters.');
    const r = await one("INSERT INTO gf.users(username,name,role,pass,created) VALUES(?,?,'admin',?,?) RETURNING *", username, name, hashPw(body.password), now());
    await audit(r, 'setup', 'first staff account from ' + ip);
    return { token: await newSession(r.id), user: pubUser(r) };
  });
  route('POST', '/api/login', 'public', async ({ body, ip }) => {
    const username = cleanUser(body.username);
    if (await tooMany('ip:' + ip)) throw http400('Too many wrong tries from this device. Wait 15 minutes or ask a member of staff.', 429);
    if (await tooMany('u:' + username)) throw http400('Too many wrong tries. Wait a few minutes or ask a member of staff.', 429);
    const u = await one('SELECT * FROM gf.users WHERE username=? AND active=1', username);
    if (!u || !checkPw(body.password, u.pass)) { await failed('u:' + username, 8, 300e3); await failed('ip:' + ip, 40, 900e3); await audit(null, 'login failed', username + ' from ' + ip); throw http400('That username or password is not right.', 401); }
    await clearFails('u:' + username); await run('UPDATE gf.users SET last_seen=? WHERE id=?', now(), u.id);
    if (u.role === 'admin') await audit(u, 'login', 'from ' + ip);
    return { user: pubUser(u), token: await newSession(u.id) };
  });
  /* a locked-out member of staff can set a new password with the setup code */
  route('POST', '/api/recover', 'public', async ({ body, ip }) => {
    if (!E('SETUP_CODE')) throw http400('Password recovery is not switched on. Ask whoever runs the Supabase project.', 403);
    if (await tooMany('recover')) throw http400('Too many wrong tries. Wait 15 minutes.', 429);
    if (!sameText(body.code, E('SETUP_CODE'))) { await failed('recover', 5, 900e3); throw http400('That setup code is not right.', 403); }
    const u = await one("SELECT * FROM gf.users WHERE username=? AND role='admin'", cleanUser(body.username)); if (!u) throw http400('No staff account has that username.', 404);
    if (String(body.password || '').length < 8) throw http400('Use a password of at least 8 characters.');
    await run('UPDATE gf.users SET pass=?,active=1 WHERE id=?', hashPw(body.password), u.id); await run('DELETE FROM gf.sessions WHERE user_id=?', u.id); await clearFails('u:' + u.username);
    await audit(u, 'password recovered with setup code', 'from ' + ip); return { ok: true };
  });
  route('POST', '/api/logout', 'public', async ({ user }) => { if (user) await run('DELETE FROM gf.sessions WHERE token=?', user._token); return { ok: true }; });
  route('POST', '/api/password', 'any', async ({ user, body }) => {
    if (!checkPw(body.current, user.pass)) throw http400('Your current password is not right.');
    const min = user.role === 'admin' ? 8 : 4;
    if (String(body.next || '').length < min) throw http400(`Use at least ${min} characters.`);
    await run('UPDATE gf.users SET pass=? WHERE id=?', hashPw(body.next), user.id); await run('DELETE FROM gf.sessions WHERE user_id=? AND token<>?', user.id, user._token);
    await audit(user, 'changed own password', '');
  });

  /* ================= students ================= */
  route('GET', '/api/home', 'student', async ({ user }) => {
    await run('UPDATE gf.users SET last_seen=? WHERE id=?', now(), user.id);
    await markExpired('AND a.user_id=?', user.id);
    const rows = await topicRows(user), cu = catchUp(user, rows);
    const qs = await all('SELECT q.*,qu.spec AS uspec FROM gf.quizzes q JOIN gf.quiz_users qu ON qu.quiz_id=q.id WHERE qu.user_id=? ORDER BY q.id DESC', user.id);
    const atts = {}; for (const a of await all('SELECT * FROM gf.attempts WHERE user_id=?', user.id)) atts[a.quiz_id] = a;
    /* quizzes set for a different level are hidden once the student moves level (finished ones stay in the list) */
    const quizzes = qs.map(q => quizForStudent(q, atts[q.id], specFor(q, { spec: q.uspec }))).filter(q => q.level === user.level || q.state === 'done');
    const st = await one('SELECT COUNT(*) AS n,COUNT(DISTINCT gf.gf_day(ts)) AS d FROM gf.answers WHERE user_id=?', user.id);
    return { user: pubUser(user), topics: rows, catchup: cu.map(r => r.id), quizzes, readiness: readiness(rows), answered: st.n, days: st.d };
  });
  route('GET', '/api/topic/:id', 'student', async ({ user, p }) => {
    const t = C.TMAP[p.id]; if (!t || t.level !== user.level) throw http400('That topic is not on your level.', 404);
    const pr = await one('SELECT * FROM gf.progress WHERE user_id=? AND topic=?', user.id, t.id), v = await one('SELECT url FROM gf.videos WHERE topic=?', t.id);
    return { id: t.id, title: t.title, b: t.b, s: t.s, area: t.area, dfe: t.dfe, vq: t.vq, lesson: t.lesson, video: v ? v.url : null, status: status(pr), recent: pr ? pr.recent : '', assigned: !!await one('SELECT 1 FROM gf.assigned WHERE user_id=? AND topic=?', user.id, t.id) };
  });
  route('POST', '/api/lesson-done', 'student', async ({ user, body }) => {
    const t = C.TMAP[body.topic]; if (!t) throw http400('Unknown topic');
    await run('INSERT INTO gf.progress(user_id,topic,lesson,updated) VALUES(?,?,1,?) ON CONFLICT(user_id,topic) DO UPDATE SET lesson=1', user.id, t.id, now());
  });
  route('POST', '/api/q/new', 'student', async ({ user, body }) => {
    const mode = body.topic ? 'topic' : (body.mode === 'catchup' ? 'catchup' : 'mixed');
    /* a question that was shown but not answered comes back, so reloading the page cannot skip it */
    const open = body.topic
      ? await one("SELECT * FROM gf.open_q WHERE user_id=? AND topic=? AND mode='topic' AND done=0 AND ts>? ORDER BY id DESC LIMIT 1", user.id, String(body.topic), now() - 2 * 864e5)
      : await one('SELECT * FROM gf.open_q WHERE user_id=? AND mode=? AND done=0 AND ts>? ORDER BY id DESC LIMIT 1', user.id, mode, now() - 2 * 864e5);
    if (open && C.TMAP[open.topic] && C.TMAP[open.topic].level === user.level) {
      const q = C.makeQ(open.topic, open.seed, open.gen);
      return { qid: open.id, q: publicQ(q), tries: open.tries, resumed: true, hint: open.tries ? q.hint : '' };
    }
    let id = body.topic;
    if (!id) {
      const rows = await topicRows(user); let pool = mode === 'catchup' ? catchUp(user, rows) : rows.filter(r => r.b <= user.block || user.block === 6); if (!pool.length) pool = rows;
      const last = await one('SELECT topic FROM gf.open_q WHERE user_id=? ORDER BY id DESC LIMIT 1', user.id); if (last && pool.length > 1) pool = pool.filter(r => r.id !== last.topic); id = weighted(pool).id;
    }
    const t = C.TMAP[id]; if (!t || t.level !== user.level) throw http400('That topic is not on your level.', 404);
    return openQuestion(user, id, mode);
  });
  route('POST', '/api/q/answer', 'student', async ({ user, body }) => {
    const { o, q } = await loadOpen(user, body.qid); if (o.done) throw http400('That question is already finished.');
    const m = mark(q, body.answer);
    if (m.r === 'empty') return { result: 'empty' };
    if (m.r === 'nudge') return { result: 'nudge', why: m.why };
    const tries = o.tries + 1, given = body.answer;
    if (m.r === 'ok') { await run('UPDATE gf.open_q SET tries=?,done=1 WHERE id=?', tries, o.id); await record(user.id, o.topic, tries === 1, 'practice', null, given); return { result: 'ok', first: tries === 1, done: true, solution: C.solutionOf(q) }; }
    if (tries >= 2) { await run('UPDATE gf.open_q SET tries=?,done=1 WHERE id=?', tries, o.id); await record(user.id, o.topic, false, 'practice', null, given); return { result: 'no', done: true, solution: C.solutionOf(q) }; }
    await run('UPDATE gf.open_q SET tries=? WHERE id=?', tries, o.id); return { result: 'no', done: false, hint: q.hint };
  });
  route('POST', '/api/q/hint', 'student', async ({ user, body }) => { const { q } = await loadOpen(user, body.qid); return { hint: q.hint }; });
  route('POST', '/api/q/reveal', 'student', async ({ user, body }) => {
    const { o, q } = await loadOpen(user, body.qid);
    if (!o.done) { await run('UPDATE gf.open_q SET done=1 WHERE id=?', o.id); await record(user.id, o.topic, false, 'practice', null, '(showed the method)'); }
    return { solution: C.solutionOf(q) };
  });
  /* a fresh worked example of the same kind - never counts towards progress */
  route('POST', '/api/q/example', 'student', async ({ user, body }) => {
    const t = C.TMAP[body.topic]; if (!t || t.level !== user.level) throw http400('Unknown topic', 404);
    const q = C.makeQ(t.id, randSeed(), body.gen != null ? body.gen : undefined); return { q: publicQ(q), solution: C.solutionOf(q), gen: q.g };
  });
  const myQuiz = async (user, id) => one('SELECT q.*,qu.spec AS uspec FROM gf.quizzes q JOIN gf.quiz_users qu ON qu.quiz_id=q.id WHERE q.id=? AND qu.user_id=?', +id || 0, user.id);
  route('POST', '/api/quiz/:id/start', 'student', async ({ user, p }) => {
    const quiz = await myQuiz(user, p.id); if (!quiz) throw http400('That quiz is not set for you.', 404);
    const spec = specFor(quiz, { spec: quiz.uspec });
    await markExpired('AND a.user_id=? AND a.quiz_id=?', user.id, quiz.id);
    let att = await one('SELECT * FROM gf.attempts WHERE quiz_id=? AND user_id=?', quiz.id, user.id);
    if (!att) {
      if (quiz.level !== user.level) throw http400('That quiz is for a different level. Ask a member of staff.', 404);
      const lim = await deadline(quiz, user);
      await run('INSERT INTO gf.attempts(quiz_id,user_id,started,ends_at,answers) VALUES(?,?,?,?,?) ON CONFLICT(quiz_id,user_id) DO NOTHING', quiz.id, user.id, now(), lim ? now() + lim : null, '[]');
      att = await one('SELECT * FROM gf.attempts WHERE quiz_id=? AND user_id=?', quiz.id, user.id);
    }
    if (att.finished) return { done: true, review: reviewOf(quiz, att, spec) };
    return { done: false, title: quiz.title, kind: quiz.kind, sections: spec.sections, endsAt: att.ends_at, serverNow: now(), answers: JSON.parse(att.answers || '[]'), questions: quizQs(spec).map(({ it, q }) => ({ sec: it.sec, ...publicQ(q) })) };
  });
  route('POST', '/api/quiz/:id/save', 'student', async ({ user, p, body }) => {
    const att = await one('SELECT * FROM gf.attempts WHERE quiz_id=? AND user_id=?', +p.id || 0, user.id); if (!att || att.finished) throw http400('That quiz is not open.', 409);
    if (att.ends_at && now() > att.ends_at + GRACE) { await markExpired('AND a.id=?', att.id); throw http400('Time is up. Your saved answers have been marked.', 409); }
    if (!Array.isArray(body.answers) || body.answers.length > 80) throw http400('Bad request');
    await run('UPDATE gf.attempts SET answers=? WHERE id=?', JSON.stringify(body.answers.map(a => a == null ? null : typeof a === 'number' ? a : String(a).slice(0, 60))), att.id);
    return { ok: true, savedAt: now() };
  });
  route('POST', '/api/quiz/:id/finish', 'student', async ({ user, p, body }) => {
    const quiz = await myQuiz(user, p.id), att = quiz && await one('SELECT * FROM gf.attempts WHERE quiz_id=? AND user_id=?', quiz.id, user.id);
    if (!quiz || !att) throw http400('That quiz is not open.');
    const spec = specFor(quiz, { spec: quiz.uspec });
    if (att.finished) return { review: reviewOf(quiz, att, spec) };
    const late = att.ends_at && now() > att.ends_at + GRACE; // after the time limit only what was saved in time counts
    const answers = !late && Array.isArray(body.answers) ? body.answers.slice(0, 80) : JSON.parse(att.answers || '[]');
    return { review: reviewOf(quiz, await finishAttempt(user, quiz, att, answers, spec), spec), late: !!late };
  });
  const noteRow = n => ({ ...n, title: C.TMAP[n.topic] ? C.TMAP[n.topic].title : 'General' });
  route('GET', '/api/notes', 'student', async ({ user }) => ({ notes: (await all('SELECT id,topic,context,text,image,ts FROM gf.notes WHERE user_id=? ORDER BY ts DESC', user.id)).map(noteRow) }));
  route('POST', '/api/notes', 'student', async ({ user, body }) => {
    const text = String(body.text || '').slice(0, 4000), image = String(body.image || ''), topic = C.TMAP[body.topic] ? body.topic : '', context = String(body.context || '').slice(0, 200);
    if (image && (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(image) || image.length > 700000)) throw http400('That drawing is too big to save. Clear some of it and try again.');
    if (!text.trim() && !image) throw http400('There is nothing to save yet.');
    if ((await one('SELECT COUNT(*) AS n FROM gf.notes WHERE user_id=?', user.id)).n >= 200) throw http400('You have 200 saved notes. Delete some old ones first.');
    const r = await one('INSERT INTO gf.notes(user_id,topic,context,text,image,ts) VALUES(?,?,?,?,?,?) RETURNING id', user.id, topic, context, text, image, now()); return { id: r.id };
  });
  route('DELETE', '/api/notes/:id', 'student', async ({ user, p }) => { await run('DELETE FROM gf.notes WHERE id=? AND user_id=?', +p.id || 0, user.id); });

  /* ================= staff ================= */
  const student = async id => { const u = await one("SELECT * FROM gf.users WHERE id=? AND role='student'", +id || 0); if (!u) throw http400('Student not found.', 404); return u; };
  async function summary(u, pm) {
    const rows = await topicRows(u, pm), c = { secure: 0, checked: 0, mid: 0, low: 0, none: 0 }; rows.forEach(r => c[r.status]++);
    return { id: u.id, name: u.name, username: u.username, level: u.level, grp: u.grp, block: u.block, active: u.active, extra_time: u.extra_time || 0, last_seen: u.last_seen, readiness: readiness(rows), counts: c, catchup: catchUp(u, rows).length, total: rows.length };
  }
  /* one query for everyone's progress instead of one per student */
  const intArr = ids => '{' + ids.map(Number).filter(Number.isFinite).join(',') + '}';
  async function allProgress(ids) { const m = {}; if (!ids.length) return m; for (const p of await all('SELECT * FROM gf.progress WHERE user_id = ANY(?::int[])', intArr(ids))) (m[p.user_id] = m[p.user_id] || {})[p.topic] = p; return m; }
  async function allAssigned(ids) { const m = {}; if (!ids.length) return m; for (const a of await all('SELECT user_id,topic FROM gf.assigned WHERE user_id = ANY(?::int[])', intArr(ids))) (m[a.user_id] = m[a.user_id] || new Set()).add(a.topic); return m; }
  async function summaries(users) {
    const ids = users.map(u => u.id), pm = await allProgress(ids), am = await allAssigned(ids);
    return users.map(u => {
      const as = am[u.id] || new Set(), pmu = pm[u.id] || {};
      const rows = TOP(u.level).map(t => { const p = pmu[t.id]; return { id: t.id, b: t.b, s: t.s, status: status(p), mastery: mastery(p), assigned: as.has(t.id) }; });
      const c = { secure: 0, checked: 0, mid: 0, low: 0, none: 0 }; rows.forEach(r => c[r.status]++);
      return { id: u.id, name: u.name, username: u.username, level: u.level, grp: u.grp, block: u.block, active: u.active, extra_time: u.extra_time || 0, last_seen: u.last_seen, readiness: readiness(rows), counts: c, catchup: catchUp(u, rows).length, total: rows.length, rows };
    });
  }
  route('GET', '/api/admin/students', 'admin', async () => {
    const us = await all("SELECT * FROM gf.users WHERE role='student' ORDER BY active DESC,lower(name)");
    return { students: (await summaries(us)).map(({ rows, ...s }) => s), groups: (await all("SELECT DISTINCT grp FROM gf.users WHERE role='student' AND grp<>'' ORDER BY grp")).map(r => r.grp) };
  });
  route('POST', '/api/admin/students', 'admin', async ({ body }) => {
    const list = Array.isArray(body.students) ? body.students.slice(0, 100) : [], made = [];
    for (const s of list) { if (s.password != null && s.password !== '' && String(s.password).length < 4) throw http400('Passwords need at least 4 characters.'); }
    for (const s of list) {
      const name = String(s.name || '').trim().slice(0, 60); if (!name) continue;
      const level = C.LEVELS[s.level] ? s.level : 'e3', block = clamp(s.block, 1, 6, 1), pw = String(s.password || '') || genPw();
      let username = s.username ? cleanUser(s.username) : '';
      if (s.username && (!username || await one('SELECT 1 FROM gf.users WHERE username=?', username))) throw http400(`The username "${username}" is already taken.`);
      if (!username) { const base = cleanUser(name.split(/\s+/)[0]) || 'student'; username = base; let i = 1; while (await one('SELECT 1 FROM gf.users WHERE username=?', username)) username = base + (++i); }
      const r = await one("INSERT INTO gf.users(username,name,role,pass,level,grp,block,created) VALUES(?,?,'student',?,?,?,?,?) RETURNING id", username, name, hashPw(pw), level, String(s.grp || '').trim().slice(0, 40), block, now());
      made.push({ id: r.id, name, username, password: pw, level });
    }
    if (!made.length) throw http400('Enter at least one name.'); return { created: made };
  });
  route('GET', '/api/admin/students/:id', 'admin', async ({ p }) => {
    const u = await student(p.id); await markExpired('AND a.user_id=?', u.id);
    const rows = await topicRows(u);
    const quizzes = (await all('SELECT a.*,q.title,q.kind FROM gf.attempts a JOIN gf.quizzes q ON q.id=a.quiz_id WHERE a.user_id=? ORDER BY a.started DESC', u.id)).map(a => ({ quiz_id: a.quiz_id, title: a.title, kind: a.kind, started: a.started, finished: a.finished, score: a.score, total: a.total }));
    const activity = await all('SELECT gf.gf_day(ts) AS day,COUNT(*) AS n,SUM(ok) AS ok FROM gf.answers WHERE user_id=? AND ts>? GROUP BY day ORDER BY day', u.id, now() - 29 * 864e5);
    const notes = (await all('SELECT id,topic,context,text,image,ts FROM gf.notes WHERE user_id=? ORDER BY ts DESC LIMIT 60', u.id)).map(noteRow);
    const recentAnswers = (await all("SELECT topic,ok,src,given,ts FROM gf.answers WHERE user_id=? AND src<>'check' ORDER BY ts DESC,id DESC LIMIT 30", u.id)).map(a => ({ ...a, title: C.TMAP[a.topic] ? C.TMAP[a.topic].title : a.topic }));
    return { student: await summary(u), topics: rows, catchup: catchUp(u, rows).map(r => r.id), quizzes, activity, notes, recentAnswers };
  });
  route('PATCH', '/api/admin/students/:id', 'admin', async ({ p, body }) => {
    const u = await student(p.id);
    if (body.name != null) { const n = String(body.name).trim().slice(0, 60); if (n) await run('UPDATE gf.users SET name=? WHERE id=?', n, u.id); }
    if (body.level != null && C.LEVELS[body.level]) await run('UPDATE gf.users SET level=? WHERE id=?', body.level, u.id);
    if (body.grp != null) await run('UPDATE gf.users SET grp=? WHERE id=?', String(body.grp).trim().slice(0, 40), u.id);
    if (body.block != null) await run('UPDATE gf.users SET block=? WHERE id=?', clamp(body.block, 1, 6, 1), u.id);
    if (body.extra_time != null) await run('UPDATE gf.users SET extra_time=? WHERE id=?', clamp(body.extra_time, 0, 200, 0), u.id);
    if (body.active != null) { await run('UPDATE gf.users SET active=? WHERE id=?', body.active ? 1 : 0, u.id); if (!body.active) await run('DELETE FROM gf.sessions WHERE user_id=?', u.id); }
    let password; if (body.resetPassword) { password = String(body.password || '') || genPw(); if (password.length < 4) throw http400('Passwords need at least 4 characters.'); await run('UPDATE gf.users SET pass=? WHERE id=?', hashPw(password), u.id); await run('DELETE FROM gf.sessions WHERE user_id=?', u.id); await clearFails('u:' + u.username); }
    return { student: await summary(await student(u.id)), password };
  });
  route('DELETE', '/api/admin/students/:id', 'admin', async ({ p }) => {
    const u = await student(p.id);
    if (u.active) throw http400('Deactivate the student first. Deleting removes everything about them and cannot be undone.');
    for (const t of ['sessions', 'progress', 'answers', 'open_q', 'assigned', 'quiz_users', 'attempts', 'notes']) await run(`DELETE FROM gf.${t} WHERE user_id=?`, u.id);
    await run('DELETE FROM gf.users WHERE id=?', u.id);
    return { ok: true, _audit: `${u.name} (${u.username})` };
  });
  route('POST', '/api/admin/assign', 'admin', async ({ body }) => {
    const ids = (body.userIds || []).map(Number), topics = (body.topics || []).filter(t => C.TMAP[t]);
    for (const id of ids) { const u = await student(id); for (const t of topics) { if (C.TMAP[t].level !== u.level) continue; if (body.on === false) await run('DELETE FROM gf.assigned WHERE user_id=? AND topic=?', id, t); else await run('INSERT INTO gf.assigned VALUES(?,?,?) ON CONFLICT DO NOTHING', id, t, now()); } }
  });
  route('POST', '/api/admin/block', 'admin', async ({ body }) => { const b = clamp(body.block, 1, 6, 1); for (const id of (body.userIds || []).map(Number)) await run("UPDATE gf.users SET block=? WHERE id=? AND role='student'", b, id); });
  route('GET', '/api/admin/overview', 'admin', async ({ query }) => {
    const level = C.LEVELS[query.get('level')] ? query.get('level') : 'e1', grp = query.get('group') || '';
    const us = (await all("SELECT * FROM gf.users WHERE role='student' AND active=1 AND level=? ORDER BY lower(name)", level)).filter(u => !grp || u.grp === grp);
    return { level, topics: TOP(level).map(t => ({ id: t.id, b: t.b, s: t.s, title: t.title })), students: (await summaries(us)).map(s => ({ id: s.id, name: s.name, block: s.block, readiness: s.readiness, cells: s.rows.map(r => r.status) })) };
  });
  route('GET', '/api/admin/curriculum', 'admin', async ({ query }) => {
    const level = C.LEVELS[query.get('level')] ? query.get('level') : 'e1', vids = {}; for (const v of await all('SELECT * FROM gf.videos')) vids[v.topic] = v.url;
    return { level, blocks: C.LEVELS[level].blocks, topics: TOP(level).map(t => ({ id: t.id, b: t.b, s: t.s, title: t.title, area: t.area, dfe: t.dfe, types: t.gens.length, video: vids[t.id] || '' })) };
  });
  route('GET', '/api/admin/preview/:topic', 'admin', async ({ p }) => { const t = C.TMAP[p.topic]; if (!t) throw http400('Unknown topic', 404); const q = C.makeQ(t.id, randSeed()); return { q: C.publicQ(q), solution: C.solutionOf(q), lesson: t.lesson }; });
  route('POST', '/api/admin/video', 'admin', async ({ body }) => {
    const t = C.TMAP[body.topic]; if (!t) throw http400('Unknown topic');
    if (!String(body.url || '').trim()) { await run('DELETE FROM gf.videos WHERE topic=?', t.id); return { url: '' }; }
    const e = embedUrl(body.url); if (!e) throw http400('Paste a YouTube or Vimeo link, like https://youtu.be/abc123XYZ_0');
    await run('INSERT INTO gf.videos VALUES(?,?) ON CONFLICT(topic) DO UPDATE SET url=excluded.url', t.id, e); return { url: e };
  });
  route('GET', '/api/admin/quizzes', 'admin', async () => {
    await markExpired();
    const qs = await all('SELECT * FROM gf.quizzes ORDER BY id DESC'), out = [];
    const stats = {}; for (const a of await all('SELECT quiz_id,COUNT(*) AS n,COUNT(finished) AS d,AVG(CASE WHEN finished IS NOT NULL AND total>0 THEN score*100.0/total END) AS avg FROM gf.attempts GROUP BY quiz_id')) stats[a.quiz_id] = a;
    const counts = {}; for (const c of await all('SELECT quiz_id,COUNT(*) AS n FROM gf.quiz_users GROUP BY quiz_id')) counts[c.quiz_id] = c.n;
    for (const q of qs) { const s = JSON.parse(q.spec), a = stats[q.id] || {}; out.push({ id: q.id, title: q.title, level: q.level, kind: q.kind, minutes: q.minutes, n: s.items.length, created: q.created, assigned: counts[q.id] || 0, done: a.d || 0, avg: a.avg == null ? null : Math.round(a.avg) }); }
    return { quizzes: out };
  });
  const LEVELSHORT = l => C.LEVELS[l].short;
  route('POST', '/api/admin/quizzes', 'admin', async ({ user, body }) => {
    const level = body.level; if (!C.LEVELS[level]) throw http400('Choose a level.');
    const kind = KINDS.includes(body.kind) ? body.kind : 'halfterm';
    const params = { block: clamp(body.block, 1, 6, 1), term: clamp(body.term, 1, 3, 1), n: +body.n || 0, topics: Array.isArray(body.topics) ? body.topics.filter(t => C.TMAP[t] && C.TMAP[t].level === level) : [] };
    const spec = buildQuiz(level, kind, params);
    const ct = params.topics.map(t => C.TMAP[t].title);
    const def = { halfterm: `${LEVELSHORT(level)} ${C.BLOCK_NAMES[params.block - 1]} quiz`, term: `${LEVELSHORT(level)} ${TERMS[params.term - 1]} term assessment`, mock: `${LEVELSHORT(level)} mock exam`, check: `${LEVELSHORT(level)} starting-point check`,
      custom: `${LEVELSHORT(level)} quiz: ${ct.slice(0, 2).join(', ')}${ct.length > 2 ? ` and ${ct.length - 2} more` : ''}` }[kind];
    const title = (String(body.title || '').trim().slice(0, 80) || def).slice(0, 120);
    const r = await one('INSERT INTO gf.quizzes(title,level,kind,spec,params,minutes,created,created_by) VALUES(?,?,?,?,?,?,?,?) RETURNING id', title, level, kind, JSON.stringify(spec), JSON.stringify(params), clamp(body.minutes, 0, 240, 0), now(), user.id);
    const id = r.id; let ids = [];
    if (body.assign === 'level') ids = (await all("SELECT id FROM gf.users WHERE role='student' AND active=1 AND level=?", level)).map(x => x.id);
    else if (body.assign === 'group') ids = (await all("SELECT id FROM gf.users WHERE role='student' AND active=1 AND level=? AND grp=?", level, String(body.group || ''))).map(x => x.id);
    else for (const x of (body.userIds || []).map(Number)) if (await one("SELECT 1 FROM gf.users WHERE id=? AND role='student' AND level=?", x, level)) ids.push(x);
    for (const uid of ids) await run('INSERT INTO gf.quiz_users(quiz_id,user_id) VALUES(?,?) ON CONFLICT DO NOTHING', id, uid);
    return { id, assigned: ids.length, _audit: title };
  });
  const quizById = async id => { const q = await one('SELECT * FROM gf.quizzes WHERE id=?', +id || 0); if (!q) throw http400('Quiz not found.', 404); return q; };
  route('GET', '/api/admin/quizzes/:id', 'admin', async ({ p }) => {
    const q = await quizById(p.id); await markExpired('AND a.quiz_id=?', q.id); const spec = JSON.parse(q.spec);
    const rows = await all('SELECT u.id,u.name,u.extra_time,qu.spec AS uspec,a.started,a.ends_at,a.finished,a.score,a.total,a.detail FROM gf.quiz_users qu JOIN gf.users u ON u.id=qu.user_id LEFT JOIN gf.attempts a ON a.quiz_id=qu.quiz_id AND a.user_id=u.id WHERE qu.quiz_id=? ORDER BY lower(u.name)', q.id);
    const per = spec.items.map(it => ({ t: it.t, title: C.TMAP[it.t].title, sec: it.sec, right: 0, tried: 0 }));
    rows.forEach(r => { if (r.finished && !r.uspec) JSON.parse(r.detail || '[]').forEach((d, i) => { if (per[i]) { per[i].tried++; if (d.ok) per[i].right++; } }); });
    const cand = (await all("SELECT id,name,grp FROM gf.users WHERE role='student' AND active=1 AND level=? ORDER BY lower(name)", q.level)).filter(u => !rows.some(r => r.id === u.id));
    return { quiz: { id: q.id, title: q.title, level: q.level, kind: q.kind, minutes: q.minutes, n: spec.items.length, sections: spec.sections, created: q.created },
      students: rows.map(r => ({ id: r.id, name: r.name, extra_time: r.extra_time || 0, retake: !!r.uspec, started: r.started, ends_at: r.ends_at, finished: r.finished, score: r.score, total: r.total })), questions: per, canAdd: cand, serverNow: now() };
  });
  route('POST', '/api/admin/quizzes/:id/assign', 'admin', async ({ p, body }) => {
    const q = await quizById(p.id);
    for (const uid of (body.userIds || []).map(Number)) {
      if (body.on === false) { await run('DELETE FROM gf.quiz_users WHERE quiz_id=? AND user_id=?', q.id, uid); await run('DELETE FROM gf.attempts WHERE quiz_id=? AND user_id=? AND finished IS NULL', q.id, uid); }
      else if (await one("SELECT 1 FROM gf.users WHERE id=? AND role='student' AND level=?", uid, q.level)) await run('INSERT INTO gf.quiz_users(quiz_id,user_id) VALUES(?,?) ON CONFLICT DO NOTHING', q.id, uid);
    }
  });
  /* "Let them retake": removes the first attempt from their progress and gives them new questions of the same kind */
  route('POST', '/api/admin/quizzes/:id/reset', 'admin', async ({ p, body }) => {
    const q = await quizById(p.id), u = await student(body.userId);
    const topics = (await all('SELECT DISTINCT topic FROM gf.answers WHERE user_id=? AND quiz_id=?', u.id, q.id)).map(r => r.topic);
    await run('DELETE FROM gf.answers WHERE user_id=? AND quiz_id=?', u.id, q.id); await rebuild(u.id, topics);
    await run('DELETE FROM gf.attempts WHERE quiz_id=? AND user_id=?', q.id, u.id);
    let params = {}; try { params = JSON.parse(q.params || '{}'); } catch (e) { }
    let fresh = null; try { fresh = buildQuiz(q.level, q.kind, params); } catch (e) { }
    await run('UPDATE gf.quiz_users SET spec=? WHERE quiz_id=? AND user_id=?', fresh ? JSON.stringify(fresh) : null, q.id, u.id);
    return { ok: true, _audit: `${q.title} for ${u.name}` };
  });
  /* mark an attempt now with whatever the student had saved (for a student who closed the tab) */
  route('POST', '/api/admin/quizzes/:id/mark', 'admin', async ({ p, body }) => {
    const q = await quizById(p.id), u = await student(body.userId);
    const att = await one('SELECT * FROM gf.attempts WHERE quiz_id=? AND user_id=? AND finished IS NULL', q.id, u.id); if (!att) throw http400('There is no unfinished attempt to mark.');
    const qu = await one('SELECT spec FROM gf.quiz_users WHERE quiz_id=? AND user_id=?', q.id, u.id);
    const r = await finishAttempt(u, q, att, JSON.parse(att.answers || '[]'), specFor(q, qu));
    return { score: r.score, total: r.total, _audit: `${q.title} for ${u.name}` };
  });
  route('GET', '/api/admin/quizzes/:id/paper', 'admin', async ({ p }) => {
    const q = await quizById(p.id), spec = JSON.parse(q.spec);
    return { title: q.title, level: C.LEVELS[q.level].name, minutes: q.minutes, sections: spec.sections, items: quizQs(spec).map(({ it, q: qq }) => ({ sec: it.sec, q: C.publicQ(qq), solution: C.solutionOf(qq) })) };
  });
  route('GET', '/api/admin/quizzes/:id/review/:uid', 'admin', async ({ p }) => {
    const q = await quizById(p.id), a = await one('SELECT * FROM gf.attempts WHERE quiz_id=? AND user_id=?', q.id, +p.uid || 0); if (!a || !a.finished) throw http400('No finished attempt.', 404);
    const qu = await one('SELECT spec FROM gf.quiz_users WHERE quiz_id=? AND user_id=?', q.id, a.user_id);
    return { review: reviewOf(q, a, specFor(q, qu)), name: (await student(p.uid)).name };
  });
  /* deleting a quiz also takes its answers out of everyone's progress */
  route('DELETE', '/api/admin/quizzes/:id', 'admin', async ({ p }) => {
    const q = await quizById(p.id), hit = await all('SELECT DISTINCT user_id,topic FROM gf.answers WHERE quiz_id=?', q.id);
    await run('DELETE FROM gf.answers WHERE quiz_id=?', q.id);
    const byUser = {}; hit.forEach(h => (byUser[h.user_id] = byUser[h.user_id] || []).push(h.topic));
    for (const [uid, ts] of Object.entries(byUser)) await rebuild(+uid, ts);
    for (const t of ['quiz_users', 'attempts']) await run(`DELETE FROM gf.${t} WHERE quiz_id=?`, q.id);
    await run('DELETE FROM gf.quizzes WHERE id=?', q.id); return { ok: true, _audit: q.title };
  });
  route('GET', '/api/admin/notes', 'admin', async ({ user }) => {
    const seenKey = 'notes_seen_' + user.id, seen = (await getSetting(seenKey, null)) || 0;
    const notes = (await all("SELECT n.id,n.topic,n.context,n.text,n.image,n.ts,u.id AS uid,u.name FROM gf.notes n JOIN gf.users u ON u.id=n.user_id ORDER BY n.ts DESC LIMIT 150")).map(noteRow);
    await setSetting(seenKey, now());
    return { notes, seen };
  });
  route('GET', '/api/admin/notes/unread', 'admin', async ({ user }) => { const seen = (await getSetting('notes_seen_' + user.id, null)) || 0; return { n: (await one('SELECT COUNT(*) AS n FROM gf.notes WHERE ts>?', seen)).n }; });
  route('GET', '/api/admin/settings', 'admin', async ({ user }) => ({ brand: await brand(), options: await options(), privacy: await getSetting('privacy', PRIVACY_DEFAULT),
    staff: await all("SELECT id,name,username,active,last_seen FROM gf.users WHERE role='admin' ORDER BY name"), me: user.id, canRecover: !!E('SETUP_CODE') }));
  route('POST', '/api/admin/settings', 'admin', async ({ body }) => {
    const out = {};
    if (body.brand) {
      const b = body.brand, hex = v => /^#[0-9a-fA-F]{6}$/.test(v || '') ? v : null, cur = await brand();
      const logo = b.logo === '' ? '' : (/^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(b.logo || '') && b.logo.length < 400000 ? b.logo : cur.logo);
      if (b.logo && logo !== b.logo) throw http400('Use a PNG, JPG, WebP or SVG logo under 300 KB.');
      const nb = { name: String(b.name || cur.name).trim().slice(0, 60), product: String(b.product || cur.product).trim().slice(0, 30), primary: hex(b.primary) || cur.primary, accent: hex(b.accent) || cur.accent, logo };
      await setSetting('brand', nb); out.brand = nb;
    }
    if (body.options) { const o = body.options, cur = await options(); const no = { youtubeSearch: o.youtubeSearch != null ? !!o.youtubeSearch : cur.youtubeSearch, idleStudent: clamp(o.idleStudent ?? cur.idleStudent, 5, 240, 20), idleStaff: clamp(o.idleStaff ?? cur.idleStaff, 5, 480, 60) }; await setSetting('options', no); out.options = no; }
    if (body.privacy != null) { const t = String(body.privacy).slice(0, 20000); await setSetting('privacy', t || PRIVACY_DEFAULT); out.privacy = t; }
    return out;
  });
  route('POST', '/api/admin/staff', 'admin', async ({ body }) => {
    const username = cleanUser(body.username), name = String(body.name || '').trim().slice(0, 60);
    if (!username || !name) throw http400('Enter a name and a username.'); if (String(body.password || '').length < 8) throw http400('Use a password of at least 8 characters.');
    if (await one('SELECT 1 FROM gf.users WHERE username=?', username)) throw http400('That username is already taken.');
    await run("INSERT INTO gf.users(username,name,role,pass,created) VALUES(?,?,'admin',?,?)", username, name, hashPw(body.password), now()); return { ok: true, _audit: username };
  });
  /* staff can reset another staff member's password */
  route('PATCH', '/api/admin/staff/:id', 'admin', async ({ user, p, body }) => {
    const s = await one("SELECT * FROM gf.users WHERE id=? AND role='admin'", +p.id || 0); if (!s) throw http400('Staff account not found.', 404);
    if (s.id === user.id) throw http400('Use Account to change your own password.');
    if (!body.resetPassword) throw http400('Bad request');
    const password = genStaffPw(); await run('UPDATE gf.users SET pass=?,active=1 WHERE id=?', hashPw(password), s.id); await run('DELETE FROM gf.sessions WHERE user_id=?', s.id); await clearFails('u:' + s.username);
    return { password, _audit: s.username };
  });
  route('DELETE', '/api/admin/staff/:id', 'admin', async ({ user, p }) => {
    if (+p.id === user.id) throw http400('You cannot remove your own account.');
    if ((await one("SELECT COUNT(*) AS n FROM gf.users WHERE role='admin'")).n <= 1) throw http400('You cannot remove the last staff account.');
    await run('DELETE FROM gf.sessions WHERE user_id=?', +p.id || 0); await run("DELETE FROM gf.users WHERE id=? AND role='admin'", +p.id || 0); return { ok: true };
  });
  route('GET', '/api/admin/audit', 'admin', async () => ({ entries: await all('SELECT ts,who,action,detail FROM gf.audit ORDER BY ts DESC,id DESC LIMIT 300') }));
  route('GET', '/api/admin/export.csv', 'admin', async () => {
    const esc = v => '"' + String(v ?? '').replace(/"/g, '""') + '"', lines = [['Name', 'Username', 'Level', 'Group', 'Current half term', 'Extra time %', 'Block', 'Session', 'Topic', 'Status', 'Questions answered', 'Right first time', 'Last 10'].map(esc).join(',')];
    const us = await all("SELECT * FROM gf.users WHERE role='student' ORDER BY lower(name)"), pm = await allProgress(us.map(u => u.id));
    for (const u of us) for (const t of TOP(u.level)) { const p = (pm[u.id] || {})[t.id], st = status(p);
      lines.push([u.name, u.username, C.LEVELS[u.level].name, u.grp, C.BLOCK_NAMES[u.block - 1], u.extra_time || 0, t.b, t.s, t.title, { secure: 'Secure', checked: 'Passed starting check', mid: 'Getting there', low: 'Needs work', none: 'Not started' }[st], p ? p.attempts : 0, p ? p.correct : 0, p ? p.recent : ''].map(esc).join(',')); }
    return new Response('﻿' + lines.join('\r\n'), { status: 200, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="maths-progress.csv"' } });
  });
  /* a copy of everything, for your own backups (passwords stay scrambled) */
  route('GET', '/api/admin/backup.json', 'admin', async () => {
    const out = { app: 'growing-futures-maths', made: new Date().toISOString(), tables: {} };
    for (const t of ['users', 'progress', 'answers', 'assigned', 'quizzes', 'quiz_users', 'attempts', 'notes', 'settings', 'videos', 'audit']) out.tables[t] = await all(`SELECT * FROM gf.${t}`);
    return new Response(JSON.stringify(out), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="maths-backup-${new Date().toISOString().slice(0, 10)}.json"` } });
  });

  /* ---------- the request handler ---------- */
  const cors = req => ({ 'Access-Control-Allow-Origin': ALLOW_ORIGIN === '*' ? '*' : (ALLOW_ORIGIN.split(',').map(s => s.trim()).includes(req.headers.get('origin')) ? req.headers.get('origin') : ALLOW_ORIGIN.split(',')[0].trim()),
    'Access-Control-Allow-Headers': 'content-type, x-gf-session, authorization, apikey, x-client-info', 'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS', 'Access-Control-Expose-Headers': 'content-disposition', 'Vary': 'Origin' });
  const SEC = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store' };
  const json = (req, code, body) => new Response(JSON.stringify(body), { status: code, headers: { 'Content-Type': 'application/json; charset=utf-8', ...SEC, ...cors(req) } });

  return async function handle(req, info = {}) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) });
    const url = new URL(req.url);
    /* Supabase passes /api/...; some set-ups keep the /functions/v1 prefix */
    const path = url.pathname.replace(/^\/functions\/v1/, '');
    const ip = info.ip || (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
    try {
      await init(); tidy().catch(() => { });
      for (const r of routes) {
        if (r.method !== req.method) continue; const m = r.re.exec(path); if (!m) continue;
        let user = null;
        try { user = await userFromReq(req); } catch (e) { if (r.role !== 'public') throw e; } // public pages still work after an idle log-out
        if (r.role !== 'public') { if (!user) throw http400('Please log in.', 401); if (r.role === 'admin' && user.role !== 'admin') throw http400('Staff only.', 403); if (r.role === 'student' && user.role !== 'student') throw http400('Students only.', 403); }
        let body = {};
        if (req.method !== 'GET') { const t = await req.text(); if (t.length > 1.5e6) throw http400('That is too big to save.', 413); if (t) { try { body = JSON.parse(t); } catch (e) { throw http400('Bad request'); } } if (!body || typeof body !== 'object') body = {}; }
        let out = await r.fn({ req, user, body, p: m.groups || {}, query: url.searchParams, ip });
        if (out instanceof Response) { const h = new Headers(out.headers); for (const [k, v] of Object.entries({ ...SEC, ...cors(req) })) h.set(k, v); return new Response(out.body, { status: out.status, headers: h }); }
        if (user && user.role === 'admin' && req.method !== 'GET') await audit(user, ACTION_NAMES[req.method + ' ' + r.pattern] || (req.method + ' ' + r.pattern),[Object.values(m.groups || {}).join('/'), out && out._audit].filter(Boolean).join(' · '));
        if (out && typeof out === 'object') delete out._audit;
        return json(req, 200, out === undefined ? { ok: true } : out);
      }
      return json(req, 404, { error: 'Not found' });
    } catch (e) {
      if (!e.status) console.error(e);
      return json(req, e.status || 500, { error: e.status ? e.message : 'Something went wrong on the server.' });
    }
  };
}

/* used by the tests */
export const _internal = { mark, quizOk, publicQ, hashPw, checkPw };
