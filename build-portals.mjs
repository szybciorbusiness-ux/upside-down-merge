// The portal uploads. Each is one self-contained page (the game file wrapped in a document that sets the portal's
// flag and loads its SDK before the game code) in its own folder, with a zip beside it.
//   crazygames/index.html + crazygames.zip        youtube/index.html + youtube-playables.zip
// Run: node build-portals.mjs
import { readFile, writeFile, mkdir, rm, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const dir = dirname(fileURLToPath(import.meta.url));
const page = sdk => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Blob Blitz 2</title>
<style>html,body{margin:0}[hidden]{display:none!important}</style>
${sdk}
</head>
<body>
`;
const PORTALS = [
  { name: 'crazygames', zip: 'crazygames.zip', sdk: '<script>window.__CG=1</script>\n<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>' },
  // YouTube: their SDK must be the first script on the page
  { name: 'youtube', zip: 'youtube-playables.zip', sdk: '<script src="https://www.youtube.com/game_api/v1"></script>\n<script>window.__YT=1</script>' },
];
let body = await readFile(join(dir, 'index.html'), 'utf8');
body = body.replace(/^<title>[^\n]*\n/, '').replace(/\s*<img id="bezel"[^>]*>/, '');   // the wrapper has the title; the desktop phone frame is not part of these builds
if (/(src|href)="assets\//.test(body)) throw new Error('the page still refers to assets/ (those files are not in the upload)');
if (/https?:\/\/(?!www\.w3\.org)/.test(body.replace(/<script>[\s\S]*<\/script>/, ''))) console.warn('warning: the markup contains an outside address');
const kb = n => Math.round(n / 1024) + ' KB';
for (const p of PORTALS) {
  const out = join(dir, p.name);
  await rm(out, { recursive: true, force: true }); await mkdir(out, { recursive: true });
  await writeFile(join(out, 'index.html'), page(p.sdk) + body + '</body>\n</html>\n');
  const zip = join(dir, p.zip);
  await rm(zip, { force: true });
  execFileSync('powershell', ['-NoProfile', '-Command', `Compress-Archive -Path '${join(out, 'index.html')}' -DestinationPath '${zip}'`], { stdio: 'inherit' });
  if (p.name === 'youtube') {   // the same build, public on the site at /play/ (the link given to YouTube: no phone frame, exactly what would be uploaded)
    await mkdir(join(dir, 'docs', 'play'), { recursive: true });
    await writeFile(join(dir, 'docs', 'play', 'index.html'), page(p.sdk) + body + '</body>\n</html>\n');
  }
  console.log('built ' + p.name + '/index.html (' + kb((await stat(join(out, 'index.html'))).size) + ') and ' + p.zip + ' (' + kb((await stat(zip)).size) + ')');
}
