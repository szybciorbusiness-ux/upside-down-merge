// Tiny static server for local play-testing. index.html is written as a body fragment
// (the same file is published as an artifact), so wrap it in a document skeleton here.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const port = Number(process.argv[2] || 4630);
const head = '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
  '<style>html,body{margin:0}[hidden]{display:none!important}</style></head><body>';

createServer(async (req, res) => {
  try {
    const html = await readFile(join(dir, 'index.html'), 'utf8');
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    res.end(head + html + '</body></html>');
  } catch (e) {
    res.writeHead(500); res.end(String(e));
  }
}).listen(port, () => console.log(`Upside Down Merge on http://localhost:${port}`));
