/* Builds every question type many times and checks it against its own answer. Run: node test/content.test.mjs [count] [level] */
import E from '../supabase/functions/_shared/content.js';
const N = +process.argv[2] || 150; let bad = 0, count = 0; const samples = [];
const per = {};
for (const t of E.TOPICS) {
  per[t.level] = (per[t.level] || 0) + 1;
  const L = t.lesson; if (!L || !L.idea || !L.steps || !L.ex || !L.trap) { console.log('LESSON MISSING', t.id); bad++; }
  if (!E.LEVELS[t.level].blocks[t.b - 1]) { console.log('BAD BLOCK', t.id); bad++; }
  t.gens.forEach((g, gi) => {
    if (typeof g !== 'function') { console.log('NOT A FUNCTION', t.id, gi); bad++; return; }
    for (let k = 0; k < N; k++) {
      let q; const seed = (k * 7919 + gi * 104729 + t.id.length * 31 + 1) >>> 0;
      try { q = E.makeQ(t.id, seed, gi); } catch (e) { console.log('THROW', t.id, gi, e.stack.split('\n').slice(0, 3).join(' | ')); bad++; break; }
      count++;
      const fail = m => { if (bad < 60) console.log('FAIL', t.id, gi, m, '|', E.plain(q.text).slice(0, 150), '| ans', JSON.stringify(q.ans)); bad++; };
      const all = JSON.stringify(q);
      if (/undefined|NaN|Infinity|\[object/.test(all)) fail('bad token ' + (all.match(/.{30}(undefined|NaN|Infinity|\[object).{20}/) || [''])[0]);
      if (!Array.isArray(q.steps) || !q.steps.length || !q.hint) fail('hint/steps');
      if (q.kind === 'num') { if (!Number.isFinite(q.ans)) fail('ans not finite'); else if (Math.abs(q.ans * 1e6 - Math.round(q.ans * 1e6)) > 1e-4) fail('float noise'); }
      if (q.kind === 'frac' && (!q.ans || !(q.ans.d > 0))) fail('frac');
      if (q.kind === 'choice') { if (!(q.ans >= 0 && q.ans < q.opts.length)) fail('choice index'); if (q.opts.length < 2) fail('too few options'); if (new Set(q.opts.map(String)).size !== q.opts.length) fail('duplicate options: ' + q.opts.map(o => E.plain(String(o))).join(' / ')); }
      if (E.check(q, E.typedAnswer(q)) !== 'ok') fail('own answer rejected: ' + E.typedAnswer(q));
      if (q.kind === 'num' && E.check(q, String(q.ans + Math.max(1, Math.abs(q.ans) * 0.2, (q.tol || 0) * 3))) === 'ok') fail('accepts a wrong answer');
      const again = E.makeQ(t.id, seed, gi); if (JSON.stringify(again) !== all) fail('not repeatable from its seed');
      if (k === 0 && process.argv[3] === t.level) samples.push(`[${t.id}.${gi}] ${E.plain(q.text).replace(/\n/g, ' / ').slice(0, 200)} => ${E.plain(String(E.answerText(q))).slice(0, 50)}`);
    }
  });
}
if (samples.length) console.log(samples.join('\n'));
console.log('topics per level:', JSON.stringify(per), '| generators:', E.TOPICS.reduce((a, t) => a + t.gens.length, 0), '| questions built:', count, '| failures:', bad);
process.exit(bad ? 1 : 0);
