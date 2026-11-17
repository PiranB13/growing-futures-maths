/* Supabase runs the API in Deno 2, where Node's globals (Buffer, process, require, __dirname ...) do not exist
   unless imported. The other tests run in Node, so they cannot catch this. This check reads the source instead.
   Run: node test/deno-compat.test.mjs */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'functions');
const files = [];
for (const d of readdirSync(root, { withFileTypes: true })) if (d.isDirectory()) for (const f of readdirSync(join(root, d.name))) if (/\.(m?js|ts)$/.test(f)) files.push(join(root, d.name, f));
const GLOBALS = { Buffer: /import\s*\{[^}]*\bBuffer\b[^}]*\}\s*from\s*['"]node:buffer['"]/, process: /import\s+process\s+from\s*['"]node:process['"]/, require: null, __dirname: null, __filename: null, global: null, setImmediate: null };
let fails = 0;
for (const f of files) {
  const src = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/(['"`])(?:\\.|(?!\1).)*\1/g, '""');
  for (const [name, imported] of Object.entries(GLOBALS)) {
    if (!new RegExp('(^|[^.\\w$])' + name + '\\s*[.(\\[]').test(src)) continue;
    if (imported && imported.test(readFileSync(f, 'utf8'))) continue;
    console.log(`FAIL: ${f} uses ${name}, which Deno (Supabase) does not provide${imported ? ' without an import' : ''}`); fails++;
  }
}
console.log(`deno compatibility: ${files.length} files checked | failures: ${fails}`);
process.exit(fails ? 1 : 0);
