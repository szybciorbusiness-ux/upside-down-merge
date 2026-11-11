// Tiny static server for local play-testing. index.html is written as a body fragment
// (the same file is published as an artifact), so wrap it in a document skeleton here.
// Files under assets/ are served as they are.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, normalize } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const port = Number(process.argv[2] || 4630);
const head = '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
  '<link rel="icon" type="image/png" href="assets/icon-192.png"><link rel="apple-touch-icon" href="assets/icon-180.png">' +
  '<style>html,body{margin:0}[hidden]{display:none!important}</style></head><body>';
const types = { '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.webp': 'image/webp' };

// A stand-in for YouTube's ytgame SDK, for /ytmock: every call is logged to window.__ytlog, the save is kept in
// sessionStorage so a reload reads it back, and the test can drive pause, resume and the audio switch through
// window.__ytcb. Set window.__ytreward = false to make the rewarded ad earn nothing.
const YT_MOCK = [
  "window.__ytlog=[];window.__ytcb={};",
  "window.ytgame={IN_PLAYABLES_ENV:true,SDK_VERSION:'mock',",
  "game:{firstFrameReady(){__ytlog.push('firstFrameReady')},gameReady(){__ytlog.push('gameReady')},",
  "loadData(){__ytlog.push('loadData');return Promise.resolve(sessionStorage.getItem('ytsave')||'')},",
  "saveData(d){__ytlog.push('saveData '+d.length);sessionStorage.setItem('ytsave',d);return Promise.resolve()}},",
  "system:{isAudioEnabled(){return window.__ytaudio!==false},onAudioEnabledChange(c){__ytcb.audio=c;return function(){}},",
  "onPause(c){__ytcb.pause=c;return function(){}},onResume(c){__ytcb.resume=c;return function(){}},getLanguage(){return Promise.resolve('en-US')}},",
  "engagement:{sendScore(s){__ytlog.push('sendScore '+s.value);return Promise.resolve()}},",
  "health:{logError(){__ytlog.push('logError')},logWarning(){__ytlog.push('logWarning')}},",
  "ads:{requestInterstitialAd(){__ytlog.push('interstitial');return new Promise(function(r){setTimeout(r,800)})},",
  "requestRewardedAd(id){__ytlog.push('rewarded '+id);return new Promise(function(r){setTimeout(function(){r(window.__ytreward!==false)},800)})}}};"
].join('');
// The portal builds, for local testing.
//   /cg      CrazyGames (their SDK runs in its local mode on localhost)
//   /yt      YouTube Playables as it will be uploaded (outside their test suite their SDK does nothing)
//   /ytmock  the same with the stand-in above, to test the adapter
const PORTAL = {
  '/cg': '<script>window.__CG=1</script><script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>',
  '/yt': '<script src="https://www.youtube.com/game_api/v1"></script><script>window.__YT=1</script>',
  '/ytmock': '<script>' + YT_MOCK + '</script><script>window.__YT=1</script>'
};

createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path.startsWith('/assets/')) {
      const rel = normalize(path).replace(/^[\/]+/, '');
      if (rel.includes('..')) { res.writeHead(403); return res.end(); }
      const data = await readFile(join(dir, rel));
      res.writeHead(200, { 'content-type': types[extname(rel)] || 'application/octet-stream', 'cache-control': 'no-store' });
      return res.end(data);
    }
    const html = await readFile(join(dir, 'index.html'), 'utf8');
    const portal = PORTAL[path.replace(/\/$/, '')];
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    if (portal) return res.end(head.replace('</head>', portal + '</head>') + html.replace(/\s*<img id="bezel"[^>]*>/, '') + '</body></html>');
    res.end(head + html + '</body></html>');
  } catch (e) {
    res.writeHead(e.code === 'ENOENT' ? 404 : 500); res.end(String(e));
  }
}).listen(port, () => console.log(`Blob Blitz on http://localhost:${port}`));
