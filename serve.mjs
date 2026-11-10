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
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    res.end(head + html + '</body></html>');
  } catch (e) {
    res.writeHead(e.code === 'ENOENT' ? 404 : 500); res.end(String(e));
  }
}).listen(port, () => console.log(`Upside Down Merge on http://localhost:${port}`));
