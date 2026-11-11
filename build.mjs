// index.html is a body fragment (the same file is published as a Claude artifact).
// This wraps it into a standalone page at docs/index.html, which GitHub Pages serves,
// and copies assets/ next to it.
import { readFile, writeFile, mkdir, readdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const head = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Sling squishy numbered blobs up at the ceiling. Matching numbers merge and chain.">
<meta name="theme-color" content="#0c0c0f">
<link rel="icon" type="image/png" sizes="32x32" href="assets/icon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="assets/icon-192.png">
<link rel="apple-touch-icon" href="assets/icon-180.png">
<link rel="manifest" href="assets/manifest.webmanifest">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Blob Blitz">
<style>html,body{margin:0}[hidden]{display:none!important}</style>
</head>
<body>
`;
const body = await readFile(join(dir, 'index.html'), 'utf8');
await mkdir(join(dir, 'docs', 'assets'), { recursive: true });
await writeFile(join(dir, 'docs', 'index.html'), head + body + '</body>\n</html>\n');
for (const f of await readdir(join(dir, 'assets'))) await copyFile(join(dir, 'assets', f), join(dir, 'docs', 'assets', f));
console.log('built docs/index.html + assets');
