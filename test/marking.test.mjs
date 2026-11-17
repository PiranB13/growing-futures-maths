/* Checks the marking rules fixed in version 2 (known issues 2.1 to 2.4 and 6.5). Run: node test/marking.test.mjs */
import C from '../supabase/functions/_shared/content.js';
import { _internal as I, buildQuiz } from '../supabase/functions/_shared/core.js';
let fails = 0, checks = 0; const ok = (c, m) => { checks++; if (!c) { fails++; console.log('FAIL:', m); } };
const num = (ans, extra = {}) => ({ kind: 'num', ans, pre: '', suf: '', ...extra });

// 2.2 money needs two decimal places
const money = num(6.1, { pre: '£', text: 'How much?' });
ok(C.checkFull(money, '6.10').r === 'ok', '£6.10 right');
ok(C.checkFull(money, '6.1').r === 'nudge' && C.checkFull(money, '6.1').why === 'money', '£6.1 is a money nudge');
ok(!I.quizOk(money, I.mark(money, '6.1')), '£6.1 does not earn a quiz mark');
ok(C.checkFull(num(6, { pre: '£' }), '6').r === 'ok', '£6 whole pounds fine');
ok(C.checkFull(money, '£6.10').r === 'ok', 'pound sign typed is fine');

// 2.3 a decimal where a fraction was asked for
const frac = { kind: 'frac', ans: { n: 2, d: 5 }, simplest: false, text: 'Write two fifths as a fraction.' };
ok(C.checkFull(frac, '2/5').r === 'ok', '2/5 right');
ok(C.checkFull(frac, '0.4').r === 'nudge' && C.checkFull(frac, '0.4').why === 'fraction', '0.4 is a fraction nudge');
ok(!I.quizOk(frac, I.mark(frac, '0.4')), '0.4 does not earn a quiz mark');

// 2.1 simplest form in quizzes
const simp = { kind: 'frac', ans: { n: 1, d: 4 }, simplest: true, text: 'Give your answer in its simplest form.' };
ok(C.checkFull(simp, '2/8').why === 'simplest', '2/8 is a simplest nudge');
ok(!I.quizOk(simp, I.mark(simp, '2/8')), 'un-simplified fraction gets no quiz mark');
ok(I.quizOk(simp, I.mark(simp, '1/4')), 'simplified fraction gets the quiz mark');
const ratio = { kind: 'ratio', ans: [2, 3], text: 'Share in the ratio' };
ok(I.quizOk(ratio, I.mark(ratio, '4:6')), 'unsimplified ratio is fine when simplest form was not asked for');
ok(!I.quizOk({ ...ratio, text: 'Write the ratio in its simplest form.' }, I.mark(ratio, '4:6')), 'unsimplified ratio wrong when simplest asked');

// 2.4 words and comma decimals
ok(C.check(num(5), 'five') === 'ok', '"five" accepted');
ok(C.check(num(21), 'twenty-one') === 'ok', '"twenty-one" accepted');
ok(C.check(num(306), 'three hundred and six') === 'ok', '"three hundred and six" accepted');
ok(C.check(num(2000), 'two thousand') === 'ok', '"two thousand" accepted');
ok(C.check(num(1.5), '1,5') === 'ok', '"1,5" accepted as 1.5');
ok(C.check(num(1500), '1,500') === 'ok', '"1,500" still one thousand five hundred');
ok(C.check(num(5), 'fives') === 'empty', 'nonsense words are not marked');
ok(C.check(num(-4), 'minus four') === 'ok', '"minus four" accepted');

// 6.5 hidden labels do not give the answer away
let leaks = 0, tried = 0, hiddenBefore = 0;
for (const t of C.TOPICS) for (let g = 0; g < t.gens.length; g++) for (let k = 1; k < 6; k++) {
  const q = C.makeQ(t.id, k * 977 + g, g); if (q.kind !== 'num') continue; tried++;
  const pub = I.publicQ(q), labels = [...(pub.fig + pub.text).matchAll(/aria-label="([^"]*)"/g)].map(m => m[1].replace(/,/g, ''));
  const a = C.plain(String(C.answerText(q))).replace(/[£,]/g, '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // the answer as shown, with its unit
  if (labels.some(l => new RegExp('(^|[^0-9.])' + a + '([^0-9.]|$)', 'i').test(l))) { leaks++; if (leaks < 5) console.log('leak', t.id, g, labels); }
  const raw = [...(C.publicQ(q).fig + C.publicQ(q).text).matchAll(/aria-label="([^"]*)"/g)].map(m => m[1].replace(/,/g, ''));
  if (raw.some(l => new RegExp('(^|[^0-9.])' + a + '([^0-9.]|$)', 'i').test(l))) hiddenBefore++;
}
ok(leaks === 0, `no number answers in hidden labels (${leaks} of ${tried})`);
ok(hiddenBefore > 0, `the label check really had leaks to remove (${hiddenBefore} labels hidden)`);

// 1.5 no repeated questions in a quiz
let dupQuizzes = 0;
for (const lv of C.LEVEL_ORDER) for (const [kind, o] of [['halfterm', { block: 3 }], ['term', { term: 3 }], ['mock', {}]]) for (let i = 0; i < 40; i++) {
  const spec = buildQuiz(lv, kind, o), texts = spec.items.map(it => C.makeQ(it.t, it.seed, it.gen).text);
  if (new Set(texts).size !== texts.length) dupQuizzes++;
}
ok(dupQuizzes === 0, 'no quiz has the same question twice: ' + dupQuizzes);
// 2.19 the starting-point check covers every earlier topic
const l2 = C.TOPICS.filter(t => t.level === 'l2' && t.b < 6).length;
ok(buildQuiz('l2', 'check', { block: 6 }).items.length === l2, 'check covers all ' + l2 + ' earlier Level 2 topics');

console.log(`marking checks: ${checks} | failures: ${fails}`);
process.exit(fails ? 1 : 0);
