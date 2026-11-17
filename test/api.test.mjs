/* End-to-end check of the API: logins, permissions, practice marking, quizzes, notes, staff tools,
   and the version 2 fixes. Runs the real API code against an in-memory Postgres. Run: node test/api.test.mjs */
import C from '../supabase/functions/_shared/content.js';
import { startServer } from '../dev/server.mjs';

let fails = 0, checks = 0; const ok = (c, m) => { checks++; if (!c) { fails++; console.log('FAIL:', m); } };
const SETUP_CODE = 'test-setup-code-123';
const { server, db, port } = await startServer({ port: 0, env: { ALLOW_OPEN_SETUP: '', SETUP_CODE } });
const base = 'http://127.0.0.1:' + port;
const q1 = async (sql, ...p) => (await db.query(sql, p))[0];
const client = () => { let token = ''; const f = async (method, url, body, headers) => {
  const r = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', ...(token ? { 'x-gf-session': token } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  const ct = r.headers.get('content-type') || ''; const data = ct.includes('json') && !url.endsWith('.json') ? await r.json() : await r.text();
  if (data && data.token) token = data.token; return { status: r.status, data, headers: r.headers };
}; f.setToken = t => { token = t; }; f.token = () => token; return f; };
const anon = client(), admin = client(), stu = client(), stu2 = client();

let r = await anon('GET', '/api/me'); ok(r.data.setup === true && r.data.user === null && r.data.setupNeedsCode, 'fresh install asks for setup with a code'); ok(r.data.levels.length === 5, 'five levels');
r = await anon('GET', '/api/home'); ok(r.status === 401, 'home needs login');
r = await anon('GET', '/api/admin/students'); ok(r.status === 401, 'admin needs login');
r = await admin('POST', '/api/setup', { name: 'Test Admin', username: 'boss', password: 'long-enough-pw' }); ok(r.status === 403, 'setup refused without the setup code (1.2)');
r = await admin('POST', '/api/setup', { name: 'Test Admin', username: 'boss', password: 'long-enough-pw', code: 'wrong' }); ok(r.status === 403, 'setup refused with a wrong code');
r = await admin('POST', '/api/setup', { name: 'Test Admin', username: 'boss', password: 'short', code: SETUP_CODE }); ok(r.status === 400, 'short admin password refused');
r = await admin('POST', '/api/setup', { name: 'Test Admin', username: 'boss', password: 'long-enough-pw', code: SETUP_CODE }); ok(r.status === 200 && r.data.token, 'setup works with the code');
r = await anon('POST', '/api/setup', { name: 'X', username: 'evil', password: 'long-enough-pw', code: SETUP_CODE }); ok(r.status === 403, 'setup cannot be run twice');
r = await admin('GET', '/api/me'); ok(r.data.user && r.data.user.role === 'admin' && r.data.setup === false, 'admin logged in after setup');
r = await admin('POST', '/api/admin/students', { students: [{ name: 'Sam Jones', level: 'e1', block: 3, grp: 'A' }, { name: 'Sam Smith', level: 'l2', block: 2, grp: 'A' }, { name: 'Tia', level: 'e3', block: 1, username: 'tia', password: 'abcd' }] });
ok(r.status === 200 && r.data.created.length === 3, 'three students created'); const made = r.data.created; ok(made[0].username === 'sam' && made[1].username === 'sam2', 'usernames made unique: ' + made.map(m => m.username));
ok(/^[a-z]+\d\d$/.test(made[0].password), 'readable password generated');
r = await admin('POST', '/api/admin/students', { students: [{ name: 'Dup', username: 'tia' }] }); ok(r.status === 400, 'duplicate username refused');

// permissions
r = await stu('POST', '/api/login', { username: 'sam', password: 'wrong' }); ok(r.status === 401, 'wrong password refused');
r = await stu('POST', '/api/login', { username: 'SAM', password: made[0].password }); ok(r.status === 200 && r.data.user.role === 'student', 'student login (case-insensitive username)');
r = await stu('GET', '/api/admin/students'); ok(r.status === 403, 'student blocked from staff pages');
r = await stu('POST', '/api/admin/students', { students: [{ name: 'Hack' }] }); ok(r.status === 403, 'student cannot create accounts');
r = await anon('POST', '/api/q/new', { topic: 'e1-count' }, { 'x-gf-session': 'a'.repeat(64) }); ok(r.status === 401, 'a made-up session token is refused');
r = await stu('GET', '/api/topic/l2-n1'); ok(r.status === 404, 'student cannot open another level');
r = await anon('OPTIONS', '/api/me'); ok(r.status === 204 && r.headers.get('access-control-allow-origin'), 'CORS preflight answered');

// practice: every topic at every level, right and wrong paths
const answerOf = async qid => { const o = await q1('SELECT * FROM gf.open_q WHERE id=$1', qid), q = C.makeQ(o.topic, o.seed, o.gen); return { q, typed: C.typedAnswer(q) }; };
const wrongOf = q => q.kind === 'choice' ? (q.ans + 1) % q.opts.length : q.kind === 'coord' ? '99,99' : q.kind === 'ratio' ? '97:89' : q.kind === 'frac' ? '97/89' : '987654';
let practised = 0;
for (const lv of C.LEVEL_ORDER) {
  await admin('PATCH', '/api/admin/students/' + made[0].id, { level: lv });
  for (const t of C.TOPICS.filter(t => t.level === lv)) {
    r = await stu('GET', '/api/topic/' + t.id); ok(r.status === 200 && r.data.lesson && r.data.lesson.steps.length, 'topic page ' + t.id);
    for (let k = 0; k < 3; k++) {
      r = await stu('POST', '/api/q/new', { topic: t.id }); ok(r.status === 200 && r.data.q.text && !('ans' in r.data.q) && !('steps' in r.data.q), 'question has no answer in it ' + t.id);
      if (/"ans"|steps|solution/.test(JSON.stringify(r.data))) ok(false, 'answer leaked ' + t.id);
      const qid = r.data.qid, { q, typed } = await answerOf(qid); practised++;
      if (k === 0) {
        const again = await stu('POST', '/api/q/new', { topic: t.id }); ok(again.data.qid === qid && again.data.resumed, 'reloading gives the same unanswered question (1.9) ' + t.id);
        r = await stu('POST', '/api/q/answer', { qid, answer: typed }); ok(r.data.result === 'ok' && r.data.first && r.data.solution.steps.length, 'right first time ' + t.id + ' typed ' + typed);
        r = await stu('POST', '/api/q/answer', { qid, answer: typed }); ok(r.status === 400, 'cannot answer twice');
      } else if (k === 1) {
        r = await stu('POST', '/api/q/answer', { qid, answer: '' }); ok(r.data.result === 'empty', 'empty not counted');
        r = await stu('POST', '/api/q/answer', { qid, answer: wrongOf(q) }); ok(r.data.result === 'no' && !r.data.done && r.data.hint && !r.data.solution, 'first wrong gives a hint only ' + t.id);
        const again = await stu('POST', '/api/q/new', { topic: t.id }); ok(again.data.qid === qid && again.data.tries === 1 && again.data.hint, 'reload keeps the try count ' + t.id);
        r = await stu('POST', '/api/q/answer', { qid, answer: typed }); ok(r.data.result === 'ok' && r.data.first === false, 'second try right');
      } else { r = await stu('POST', '/api/q/answer', { qid, answer: wrongOf(q) }); r = await stu('POST', '/api/q/answer', { qid, answer: wrongOf(q) }); ok(r.data.result === 'no' && r.data.done && r.data.solution.answer != null, 'two wrong shows the method ' + t.id); }
    }
    const p = await q1('SELECT * FROM gf.progress WHERE user_id=$1 AND topic=$2', made[0].id, t.id); ok(p.attempts === 3 && p.correct === 1 && p.recent === '100', 'progress recorded ' + t.id + ' ' + JSON.stringify(p));
  }
}
r = await stu('POST', '/api/q/example', { topic: C.TOPICS.filter(t => t.level === 'l2')[0].id }); ok(r.status === 200 && r.data.solution.steps.length, 'worked example');
r = await stu('POST', '/api/q/new', { mode: 'mixed' }); ok(r.status === 200, 'mixed practice'); const mq = r.data.qid;
r = await stu('POST', '/api/q/new', { mode: 'mixed' }); ok(r.data.qid === mq, 'mixed practice question also survives a reload');
r = await stu('POST', '/api/q/reveal', { qid: mq }); ok(r.data.solution.steps.length, 'reveal');
r = await stu('POST', '/api/q/new', { mode: 'mixed' }); ok(r.data.qid !== mq, 'after "show me how" a new question comes');

// catch-up logic: Sam Smith is L2 on block 2 with nothing done -> block 1 topics are catch-up
r = await stu2('POST', '/api/login', { username: 'sam2', password: made[1].password });
r = await stu2('GET', '/api/home'); const b1 = C.TOPICS.filter(t => t.level === 'l2' && t.b === 1).length; ok(r.data.catchup.length === b1, 'late starter: earlier block is catch-up (' + r.data.catchup.length + ' of ' + b1 + ')');
r = await admin('POST', '/api/admin/quizzes', { level: 'l2', kind: 'check', block: 2, userIds: [made[1].id] }); ok(r.status === 200 && r.data.assigned === 1, 'starting-point check created'); const checkId = r.data.id;
r = await stu2('POST', '/api/quiz/' + checkId + '/start'); ok(!r.data.done && r.data.questions.length === b1 && !JSON.stringify(r.data).includes('"steps"'), 'check has one question per earlier topic and no answers');
const spec = async id => JSON.parse((await q1('SELECT spec FROM gf.quizzes WHERE id=$1', id)).spec).items;
let its = await spec(checkId), ans = its.map((it, i) => i < 3 ? '' : C.typedAnswer(C.makeQ(it.t, it.seed, it.gen)));
r = await stu2('POST', '/api/quiz/' + checkId + '/save', { answers: ans }); ok(r.status === 200 && r.data.savedAt, 'autosave');
r = await stu2('POST', '/api/quiz/' + checkId + '/finish', { answers: ans }); ok(r.data.review.score === b1 - 3 && r.data.review.items[5].solution.steps.length, 'check marked: ' + r.data.review.score + '/' + b1);
r = await stu2('GET', '/api/home'); ok(r.data.catchup.length === 3, 'after the check only the 3 missed topics are catch-up: ' + r.data.catchup.length);
ok(r.data.topics.filter(t => t.status === 'checked').length === b1 - 3, 'passed topics marked as checked');
const other = C.TOPICS.find(t => t.level === 'l2' && t.b === 4).id;
r = await admin('POST', '/api/admin/assign', { userIds: [made[1].id], topics: [other] }); r = await stu2('GET', '/api/home'); ok(r.data.catchup[0] === other && r.data.catchup.length === 4, 'staff-assigned topic comes first in catch-up');
r = await stu2('POST', '/api/q/new', { mode: 'catchup' }); ok(r.status === 200 && [other, ...its.slice(0, 3).map(i => i.t)].includes(r.data.q.t), 'catch-up question comes from the catch-up list');

// quizzes of every kind at every level
for (const lv of C.LEVEL_ORDER) {
  for (const [kind, extra] of [['halfterm', { block: 2 }], ['term', { term: 2 }], ['mock', {}], ['custom', { topics: C.TOPICS.filter(t => t.level === lv).slice(0, 4).map(t => t.id), n: 8 }]]) {
    r = await admin('POST', '/api/admin/quizzes', { level: lv, kind, ...extra, minutes: kind === 'mock' ? 60 : 0, assign: 'level' }); ok(r.status === 200, 'create ' + kind + ' ' + lv + ' ' + JSON.stringify(r.data));
    const items = await spec(r.data.id), lvT = C.TOPICS.filter(t => t.level === lv);
    if (kind === 'halfterm') ok(items.length === 10 && items.every(it => C.TMAP[it.t].b === 2), 'half-term quiz only uses block 2 ' + lv);
    if (kind === 'term') { ok(items.length === 20 && items.every(it => C.TMAP[it.t].b <= 4), 'term assessment stays within taught blocks ' + lv); ok(items.filter(it => C.TMAP[it.t].b >= 3).length === 15, 'three quarters from this term ' + lv); }
    if (kind === 'mock') { ok(items.length === (lv[0] === 'e' ? 20 : 30), 'mock length ' + lv); ok(items.some(it => it.sec === 'A') && items.some(it => it.sec === 'B'), 'mock has both sections ' + lv); ok(new Set(items.map(it => it.t)).size >= Math.min(items.length, lvT.length) - 1, 'mock spreads across topics ' + lv); }
    if (kind === 'custom') { const t = await q1('SELECT title FROM gf.quizzes WHERE id=$1', r.data.id); ok(t.title.includes(C.TMAP[extra.topics[0]].title), 'custom quiz named after its topics (2.17): ' + t.title); }
    ok(items.every(it => it.sec !== 'A' || !C.makeQ(it.t, it.seed, it.gen).calc), 'section A is non-calculator');
    const texts = items.map(it => C.makeQ(it.t, it.seed, it.gen).text); ok(new Set(texts).size === texts.length, 'no repeated question (1.5) ' + kind + ' ' + lv);
    r = await admin('GET', '/api/admin/quizzes/' + r.data.id + '/paper'); ok(r.data.items.length === items.length && r.data.items[0].solution.answer != null, 'printable paper with answers');
  }
}
await admin('PATCH', '/api/admin/students/' + made[0].id, { level: 'l2' });
r = await admin('POST', '/api/admin/quizzes', { level: 'l2', kind: 'mock', minutes: 60, userIds: [made[0].id, made[1].id] }); const mockId = r.data.id;
r = await stu('GET', '/api/home'); ok(r.data.quizzes.some(q => q.id === mockId && q.state === 'new'), 'student sees the quiz');
r = await stu('POST', '/api/quiz/' + mockId + '/start'); ok(r.data.questions.length === 30 && r.data.endsAt > Date.now(), 'timed mock started');
its = await spec(mockId); ans = its.map((it, i) => i % 3 === 0 ? '12345678' : C.typedAnswer(C.makeQ(it.t, it.seed, it.gen)));
const before = (await q1('SELECT COUNT(*) AS n FROM gf.answers WHERE user_id=$1', made[0].id)).n;
r = await stu('POST', '/api/quiz/' + mockId + '/finish', { answers: ans }); ok(r.data.review.score === 20 && r.data.review.total === 30, 'mock marked 20/30: ' + r.data.review.score);
ok((await q1('SELECT COUNT(*) AS n FROM gf.answers WHERE user_id=$1', made[0].id)).n === before + 30, 'quiz answers feed progress');
r = await stu('POST', '/api/quiz/' + mockId + '/finish', { answers: its.map(() => '1') }); ok(r.data.review.score === 20, 'cannot re-submit');
r = await anon('POST', '/api/quiz/' + mockId + '/start'); ok(r.status === 401, 'quiz needs login');
r = await admin('GET', '/api/admin/quizzes/' + mockId); ok(r.data.students.length === 2 && r.data.students.find(s => s.id === made[0].id).score === 20 && r.data.questions[0].tried === 1, 'staff see quiz results');
r = await admin('GET', '/api/admin/quizzes/' + mockId + '/review/' + made[0].id); ok(r.data.review.items.length === 30, 'staff can review a paper');
// 2.6 retake: new questions, first attempt taken out of progress
r = await admin('POST', '/api/admin/quizzes/' + mockId + '/reset', { userId: made[0].id }); r = await stu('GET', '/api/home'); ok(r.data.quizzes.find(q => q.id === mockId).state === 'new', 'staff can reset an attempt');
ok((await q1('SELECT COUNT(*) AS n FROM gf.answers WHERE user_id=$1', made[0].id)).n === before, 'retake removes the first attempt from progress (2.6)');
r = await stu('POST', '/api/quiz/' + mockId + '/start'); const retakeTexts = r.data.questions.map(q => q.text).join('|');
ok(retakeTexts !== its.map(it => C.makeQ(it.t, it.seed, it.gen).text).join('|'), 'retake has different questions (2.6)');
// 1.8 time limits kept by the server
await db.query('UPDATE gf.attempts SET ends_at=$1 WHERE quiz_id=$2 AND user_id=$3', [Date.now() - 120e3, mockId, made[0].id]);
r = await stu('POST', '/api/quiz/' + mockId + '/save', { answers: ['1'] }); ok(r.status === 409, 'saving after the time limit is refused (1.8)');
r = await admin('GET', '/api/admin/quizzes/' + mockId); ok(r.data.students.find(s => s.id === made[0].id).finished, 'an attempt past its time is marked by the server (1.8)');
// staff "Mark it now"
r = await stu2('POST', '/api/quiz/' + mockId + '/start'); await stu2('POST', '/api/quiz/' + mockId + '/save', { answers: [] });
r = await admin('POST', '/api/admin/quizzes/' + mockId + '/mark', { userId: made[1].id }); ok(r.status === 200 && r.data.total === 30, 'staff can mark an unfinished attempt now (1.8)');
// extra time
await admin('PATCH', '/api/admin/students/' + made[0].id, { extra_time: 25 });
r = await admin('POST', '/api/admin/quizzes', { level: 'l2', kind: 'halfterm', block: 1, minutes: 40, userIds: [made[0].id] }); const timed = r.data.id;
r = await stu('POST', '/api/quiz/' + timed + '/start'); ok(Math.abs((r.data.endsAt - r.data.serverNow) - 50 * 60e3) < 5e3, 'extra time: 40 minutes + 25% = 50 minutes');
// 2.5 quiz for another level hidden after a level change
r = await admin('POST', '/api/admin/quizzes', { level: 'l2', kind: 'halfterm', block: 1, userIds: [made[0].id] }); const oldLevel = r.data.id;
await admin('PATCH', '/api/admin/students/' + made[0].id, { level: 'l1' });
r = await stu('GET', '/api/home'); ok(!r.data.quizzes.some(q => q.id === oldLevel), 'unstarted quiz for the old level is hidden (2.5)');
r = await stu('POST', '/api/quiz/' + oldLevel + '/start'); ok(r.status === 404, 'and cannot be started');
await admin('PATCH', '/api/admin/students/' + made[0].id, { level: 'l2' });
// 2.7 deleting a quiz removes its progress
r = await admin('POST', '/api/admin/quizzes', { level: 'l2', kind: 'halfterm', block: 1, userIds: [made[0].id] }); const delId = r.data.id;
await stu('POST', '/api/quiz/' + delId + '/start'); await stu('POST', '/api/quiz/' + delId + '/finish', { answers: [] });
const withQuiz = (await q1('SELECT COUNT(*) AS n FROM gf.answers WHERE user_id=$1', made[0].id)).n;
r = await admin('DELETE', '/api/admin/quizzes/' + delId); ok((await q1('SELECT COUNT(*) AS n FROM gf.answers WHERE user_id=$1', made[0].id)).n === withQuiz - 10, 'deleting a quiz removes the progress it recorded (2.7)');

// notes and whiteboard
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
r = await stu('POST', '/api/notes', { topic: 'l2-n1', text: 'Count up to zero first <script>', image: png, context: 'Practice: negative numbers' }); ok(r.status === 200, 'note saved');
r = await stu('POST', '/api/notes', { text: '', image: 'data:text/html;base64,AAAA' }); ok(r.status === 400, 'non-image refused');
r = await stu('GET', '/api/notes'); ok(r.data.notes.length === 1 && r.data.notes[0].title && r.data.notes[0].context, 'notes listed with what they were for (2.14)');
r = await stu2('DELETE', '/api/notes/' + r.data.notes[0].id); r = await stu('GET', '/api/notes'); ok(r.data.notes.length === 1, 'another student cannot delete it');
r = await admin('GET', '/api/admin/notes/unread'); ok(r.data.n === 1, 'staff see one unread note (1.10)');
r = await admin('GET', '/api/admin/notes'); ok(r.data.notes.length === 1 && r.data.notes[0].name, 'staff notes page lists every student note');
r = await admin('GET', '/api/admin/notes/unread'); ok(r.data.n === 0, 'notes marked as read');

// staff views
r = await admin('GET', '/api/admin/students'); ok(r.data.students.length === 3 && r.data.groups.includes('A') && r.data.students[0].counts, 'student list with summaries');
r = await admin('GET', '/api/admin/students/' + made[0].id); ok(r.data.topics.length === C.TOPICS.filter(t => t.level === 'l2').length && r.data.activity.length >= 1 && r.data.notes.length === 1 && Array.isArray(r.data.quizzes) && r.data.recentAnswers.length, 'student detail with recent answers');
ok(/^\d{4}-\d\d-\d\d$/.test(r.data.activity[0].day), 'activity grouped by UK day');
r = await admin('GET', '/api/admin/overview?level=l2'); ok(r.data.students.length === 2 && r.data.students[0].cells.length === r.data.topics.length, 'class overview grid');
r = await admin('POST', '/api/admin/video', { topic: 'l2-n1', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3' }); ok(r.data.url === 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', 'YouTube link turned into a privacy-friendly embed');
r = await admin('POST', '/api/admin/video', { topic: 'l2-n1', url: 'javascript:alert(1)' }); ok(r.status === 400, 'non-video link refused');
r = await stu('GET', '/api/topic/l2-n1'); ok(r.data.video && r.data.video.includes('nocookie'), 'student sees the video');
r = await stu('GET', '/api/me'); ok(r.data.options.youtubeSearch === false && r.data.options.idleMinutes === 20, 'YouTube search link off by default (1.7), 20 minute idle log-out (1.11)');
r = await admin('GET', '/api/admin/curriculum?level=e2'); ok(r.data.topics.length === 27 && r.data.blocks.length === 6, 'curriculum listing');
r = await admin('GET', '/api/admin/preview/e1-count'); ok(r.data.q.fig.includes('<svg') && r.data.solution.steps.length, 'question preview');
r = await admin('POST', '/api/admin/settings', { brand: { name: 'Growing Futures Cornwall', primary: '#123456', accent: 'not-a-colour' } }); ok(r.data.brand.primary === '#123456' && r.data.brand.accent === '#dda23c' && r.data.brand.logo === 'brand/gf-logo.png', 'branding saved, bad colour ignored, Growing Futures logo kept');
r = await admin('POST', '/api/admin/settings', { options: { youtubeSearch: true }, privacy: 'Our notice' }); ok(r.data.options.youtubeSearch === true, 'options saved');
r = await anon('GET', '/api/privacy'); ok(r.data.text === 'Our notice', 'privacy notice readable before login (1.10)');
r = await admin('POST', '/api/admin/block', { userIds: [made[2].id], block: 4 }); r = await admin('GET', '/api/admin/students/' + made[2].id); ok(r.data.student.block === 4, 'move to another half term');
r = await admin('PATCH', '/api/admin/students/' + made[2].id, { resetPassword: true }); const npw = r.data.password; ok(npw && npw.length >= 6, 'password reset');
const t3 = client(); r = await t3('POST', '/api/login', { username: 'tia', password: 'abcd' }); ok(r.status === 401, 'old password stops working'); r = await t3('POST', '/api/login', { username: 'tia', password: npw }); ok(r.status === 200, 'new password works');
r = await t3('POST', '/api/password', { current: npw, next: 'mynewpass' }); ok(r.status === 200, 'student can change own password');
// 1.11 idle log-out
await db.query('UPDATE gf.sessions SET last_active=$1 WHERE user_id=$2', [Date.now() - 21 * 60e3, made[2].id]);
r = await t3('GET', '/api/home'); ok(r.status === 401 && /nothing happened/.test(r.data.error), 'idle student is logged out after 20 minutes (1.11)');
r = await t3('POST', '/api/login', { username: 'tia', password: 'mynewpass' });
r = await admin('PATCH', '/api/admin/students/' + made[2].id, { active: false }); r = await t3('GET', '/api/home'); ok(r.status === 401, 'deactivated student is logged out');
r = await admin('GET', '/api/admin/export.csv'); ok(r.status === 200 && r.data.split('\n').length > 50 && r.headers.get('content-disposition').includes('csv'), 'CSV export');
r = await admin('GET', '/api/admin/backup.json'); ok(r.status === 200 && JSON.parse(r.data).tables.users.length >= 4, 'full backup download');
r = await admin('POST', '/api/admin/staff', { name: 'Second Staff', username: 'staff2', password: 'another-long-pw' }); ok(r.status === 200, 'second staff account');
const staff2 = (await q1("SELECT id FROM gf.users WHERE username='staff2'")).id;
r = await admin('PATCH', '/api/admin/staff/' + staff2, { resetPassword: true }); const s2pw = r.data.password; ok(s2pw && s2pw.length >= 12, 'staff can reset another staff password (1.3)');
const s2 = client(); r = await s2('POST', '/api/login', { username: 'staff2', password: s2pw }); ok(r.status === 200, 'reset staff password works');
r = await anon('POST', '/api/recover', { code: 'nope', username: 'staff2', password: 'recovered-pw-1' }); ok(r.status === 403, 'recovery refused with a wrong code');
r = await anon('POST', '/api/recover', { code: SETUP_CODE, username: 'staff2', password: 'recovered-pw-1' }); ok(r.status === 200, 'locked-out staff recover with the setup code (1.3)');
r = await s2('GET', '/api/admin/students'); ok(r.status === 401, 'recovery logs out old sessions');
r = await admin('DELETE', '/api/admin/students/' + made[1].id); ok(r.status === 400, 'an active student cannot be deleted (6.7)');
await admin('PATCH', '/api/admin/students/' + made[1].id, { active: false });
r = await admin('DELETE', '/api/admin/students/' + made[1].id); r = await admin('GET', '/api/admin/students'); ok(r.data.students.length === 2 && !(await q1('SELECT 1 AS x FROM gf.progress WHERE user_id=$1', made[1].id)), 'delete removes the student and their data');
r = await admin('GET', '/api/admin/audit'); ok(r.data.entries.some(e => e.action === 'deleted a student' && /Sam Smith/.test(e.detail)) && r.data.entries.some(e => e.action === 'login failed'), 'staff actions and failed logins are logged (6.4)');
for (let i = 0; i < 9; i++) r = await anon('POST', '/api/login', { username: 'boss', password: 'nope' + i }); ok(r.status === 429, 'login locks after repeated wrong passwords');
ok((await q1("SELECT n FROM gf.login_fails WHERE key='u:boss'")).n >= 8, 'the lock is kept in the database, so a restart does not clear it (6.3)');
r = await admin('POST', '/api/logout'); r = await admin('GET', '/api/admin/students'); ok(r.status === 401, 'logout works');

console.log(`practice questions answered: ${practised} | checks: ${checks} | failures: ${fails}`);
server.close(); await db.pg.close(); process.exit(fails ? 1 : 0);
