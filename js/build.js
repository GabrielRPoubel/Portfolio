const fs = require('fs');

// ── CSS: concatena na ordem certa, minificação segura ──
// Remove só comentários e linhas vazias; não mexe em calc()/content:" ".
function minifyCssSafe(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .join('\n');
}

function readAll(files) {
  return files.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
}

const cssFiles = [
  'css/base.css',
  'css/nav.css',
  'css/feed.css',
  'css/galeria.css',
  'css/lightbox.css',
  'css/ui.css',
  'css/loja.css',
];
const cssMin = minifyCssSafe(readAll(cssFiles));

// ── JS: bloco de fotos do index.html + módulos ──
// Remove só linhas de comentário decorativo ("// ── ..."); preserva URLs e strings.
function stripBannerComments(js) {
  return js
    .split('\n')
    .filter((l) => !/^\s*\/\/\s*──/.test(l))
    .join('\n');
}

const indexSrc = fs.readFileSync('index.html', 'utf8');
const fotosMatch = indexSrc.match(/\/\/ ─── FOTOS ─+[\s\S]*?\/\/ ─+/);
if (!fotosMatch) { console.error('Bloco de fotos não encontrado no index.html'); process.exit(1); }
const fotosBlock = fotosMatch[0];

// Bloco LOJA (produtos embutidos pelo gerar.py); ausente = loja sem produtos.
const lojaMatch = indexSrc.match(/\/\* ─── LOJA ─+[\s\S]*?\/\* FIM-LOJA \*\//);
const lojaBlock = lojaMatch ? lojaMatch[0] : 'const LOJA = null;';

const jsFiles = [
  'js/nav.js',
  'js/lightbox.js',
  'js/feed.js',
  'js/galeria.js',
  'js/novas.js',
  'js/columns.js',
  'js/share.js',
  'js/loja.js',
  'js/ui.js',
];
const jsRaw = stripBannerComments(fotosBlock + '\n' + lojaBlock + '\n' + readAll(jsFiles));

// ── Monta o index.html final (dist/) ──
const faviconMatch = indexSrc.match(/<link rel="icon"[^>]+>/);
const faviconTag = faviconMatch ? faviconMatch[0] : '';

const vercelTags = (indexSrc.match(/<script defer src="https:\/\/cdn\.vercel[^>]+><\/script>/g) || []).join('\n');

// Meta/SEO do <head> (mantém description, OG, theme-color, favicon)
const headExtra = [];
for (const m of indexSrc.matchAll(/<meta[^>]+>/g)) {
  const tag = m[0];
  if (/name="description"|name="theme-color"|property="og:|name="twitter:/.test(tag)) headExtra.push(tag);
}

const bodyMatch = indexSrc.match(/<body>([\s\S]*?)<!-- JS/);
const bodyHTML = bodyMatch ? bodyMatch[1].trim() : '';

const distHTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Gabriel Poubel — Fotografia</title>
${headExtra.join('\n')}
${faviconTag}
${vercelTags}
<style>${cssMin}</style>
</head>
<body>
${bodyHTML}
<script>${jsRaw}</script>
</body>
</html>`;

if (!fs.existsSync('dist')) fs.mkdirSync('dist');
fs.writeFileSync('dist/index.html', distHTML, 'utf8');

const kb = (distHTML.length / 1024).toFixed(1);
console.log(`Build concluído: dist/index.html (${kb} KB)`);
console.log(`CSS: ${(cssMin.length / 1024).toFixed(1)}KB | JS: ${(jsRaw.length / 1024).toFixed(1)}KB (sem ofuscação)`);
