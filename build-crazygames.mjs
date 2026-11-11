// The CrazyGames upload: crazygames/index.html, one self-contained page (the game file wrapped in a document that
// loads their SDK and sets window.__CG), and crazygames.zip beside it. Run: node build-crazygames.mjs
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const dir = dirname(fileURLToPath(import.meta.url));
const head = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<style>html,body{margin:0}[hidden]{display:none!important}</style>
<script>window.__CG=1</script>
<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>
</head>
<body>
`;
let body = await readFile(join(dir, 'index.html'), 'utf8');
body = body.replace(/\s*<img id="bezel"[^>]*>/, '');   // the desktop phone frame is not part of this build
if (/assets\//.test(body.replace(/<script>[\s\S]*<\/script>/, ''))) console.warn('warning: the page still refers to assets/ (those files are not in the upload)');
const out = join(dir, 'crazygames');
await rm(out, { recursive: true, force: true }); await mkdir(out, { recursive: true });
await writeFile(join(out, 'index.html'), head + body + '</body>\n</html>\n');
const zip = join(dir, 'crazygames.zip');
await rm(zip, { force: true });
execFileSync('powershell', ['-NoProfile', '-Command', `Compress-Archive -Path '${join(out, 'index.html')}' -DestinationPath '${zip}'`], { stdio: 'inherit' });
const kb = n => Math.round(n / 1024) + ' KB';
const { size } = await (await import('node:fs/promises')).stat(join(out, 'index.html'));
const z = await (await import('node:fs/promises')).stat(zip);
console.log('built crazygames/index.html (' + kb(size) + ') and crazygames.zip (' + kb(z.size) + ')');
