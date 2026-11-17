/* Supabase Edge Function "api": every /api/... request from the website lands here.
   Supabase gives the function SUPABASE_DB_URL automatically. Secrets you set yourself (see README):
     SETUP_CODE      - needed to create the first staff account, and to recover a locked-out staff account
     ALLOWED_ORIGIN  - the website address, e.g. https://your-name.github.io (default: any)
     ADMIN_USER, ADMIN_PASS, ADMIN_NAME - optional: create the first staff account automatically */
import postgres from 'npm:postgres@3.4.5';
import { createApi } from '../_shared/core.js';

const sql = postgres(Deno.env.get('SUPABASE_DB_URL'), {
  prepare: false, max: 4, idle_timeout: 20, onnotice: () => {},
  types: {
    int8: { to: 20, from: [20], serialize: x => String(x), parse: x => Number(x) },
    numeric: { to: 1700, from: [1700], serialize: x => String(x), parse: x => Number(x) },
  },
});
const db = { query: (text, params) => sql.unsafe(text, params || []), exec: text => sql.unsafe(text) };
const env = Object.fromEntries(['SETUP_CODE', 'ALLOWED_ORIGIN', 'ADMIN_USER', 'ADMIN_PASS', 'ADMIN_NAME'].map(k => [k, Deno.env.get(k) || '']));
const handle = createApi({ db, env });

Deno.serve(req => handle(req, { ip: (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() }));
