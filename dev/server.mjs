/* Runs the whole platform on your own computer, with no Supabase account needed:
   the same API code the Edge Function runs, an in-memory Postgres (PGlite), and the website from web/.
     npm run dev        then open http://localhost:3000
     npm run demo       the same, with made-up students (staff login demo / demo-staff-1, students alex, bryn, ... / demo1234)
   Everything is forgotten when you stop it, unless you set DATA_DIR to a folder. */
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, normalize, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { createApi } from '../supabase/functions/_shared/core.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..'), WEB = join(root, 'web');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json' };

export async function makeDb(dataDir) {
  const pg = new PGlite(dataDir || undefined, { parsers: { 20: Number, 1700: Number } });
  await pg.waitReady;
  return { pg, query: async (text, params) => (await pg.query(text, params || [])).rows, exec: text => pg.exec(text) };
}

export async function startServer({ port = 3000, env = {}, dataDir } = {}) {
  const db = await makeDb(dataDir);
  const handle = createApi({ db, env: { ALLOW_OPEN_SETUP: '1', ...env } });
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/')) {
        const chunks = []; for await (const c of req) chunks.push(c);
        const body = chunks.length ? Buffer.concat(chunks) : undefined;
        const r = await handle(new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body }), { ip: req.socket.remoteAddress });
        res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer())); return;
      }
      if (url.pathname === '/config.js') { res.writeHead(200, { 'Content-Type': MIME['.js'], 'Cache-Control': 'no-store' }); res.end("window.GF_API='';"); return; }
      let p = decodeURIComponent(url.pathname); if (p === '/') p = '/index.html';
      const file = normalize(join(WEB, p));
      if (!file.startsWith(WEB) || !(await stat(file).catch(() => null))?.isFile()) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(await readFile(file));
    } catch (e) { console.error(e); res.writeHead(500); res.end('Server error'); }
  });
  await new Promise(r => server.listen(port, r));
  return { server, db, handle, port: server.address().port };
}

/* made-up students with made-up progress, so you can see the staff screens working */
async function demo(base) {
  const call = async (method, path, body, token) => (await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { 'x-gf-session': token } : {}) }, body: body ? JSON.stringify(body) : undefined })).json();
  const s = await call('POST', '/api/setup', { name: 'Demo Staff', username: 'demo', password: 'demo-staff-1' });
  if (!s.token) return console.log('Demo data not added:', s.error);
  const people = [['Alex T', 'e1', 3], ['Bryn K', 'e2', 3], ['Casey M', 'e3', 4], ['Devon R', 'e3', 2], ['Elowen P', 'l1', 3], ['Finn J', 'l1', 5], ['Gwen S', 'l2', 4], ['Harri L', 'l2', 2]];
  for (const [i, [name, level, block]] of people.entries()) {
    const r = await call('POST', '/api/admin/students', { students: [{ name, level, block, grp: i % 2 ? 'Tuesday group' : 'Thursday group', username: name.split(' ')[0].toLowerCase(), password: 'demo1234' }] }, s.token);
    const st = await call('POST', '/api/login', { username: r.created[0].username, password: 'demo1234' });
    for (let k = 0; k < 25; k++) { const q = await call('POST', '/api/q/new', { mode: 'mixed' }, st.token); await call('POST', '/api/q/answer', { qid: q.qid, answer: q.q.kind === 'choice' ? 0 : '1' }, st.token); }
  }
  console.log('Demo data added. Staff login: demo / demo-staff-1   Student logins: alex, bryn, casey ... / demo1234');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === normalize(process.argv[1])) {
  const { port } = await startServer({ port: +process.env.PORT || 3000, dataDir: process.env.DATA_DIR });
  console.log(`Growing Futures Maths is running: http://localhost:${port}`);
  if (process.argv.includes('--demo')) await demo(`http://localhost:${port}`);
}
