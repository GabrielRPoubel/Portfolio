const fs   = require('fs');
const path = require('path');

// Garante que o script sempre roda a partir da raiz do projeto
const ROOT = path.resolve(__dirname, '..');
process.chdir(ROOT);

// ── Lê e concatena arquivos ───────────────────────────────────────────────────
function readAll(files) {
  return files.map(f => fs.readFileSync(f, 'utf8')).join('\n');
}

// ── CSS: concatena na ordem certa ─────────────────────────────────────────────
const cssFiles = [
  'css/base.css',
  'css/nav.css',
  'css/feed.css',
  'css/galeria.css',
  'css/lightbox.css',
  'css/ui.css',
];
const cssRaw = readAll(cssFiles);

// Minificação CSS simples (remove comentários e espaços desnecessários)
const cssMin = cssRaw
  .replace(/\/\*[\s\S]*?\*\//g, '')   // remove comentários
  .replace(/\s{2,}/g, ' ')            // múltiplos espaços → um
  .replace(/\n/g, '')                 // remove quebras
  .replace(/\s*([{};:,>~+])\s*/g, '$1') // espaços ao redor de símbolos
  .trim();

// ── JS: lê o bloco de fotos do index.html e concatena com os módulos ──────────
const indexSrc = fs.readFileSync('index.html', 'utf8');
const fotosMatch = indexSrc.match(/\/\/ ─── FOTOS ─+[\s\S]*?\/\/ ─+/);
if (!fotosMatch) { console.error('Bloco de fotos não encontrado no index.html'); process.exit(1); }
const fotosBlock = fotosMatch[0];

const jsFiles = [
  'js/nav.js',
  'js/lightbox.js',
  'js/feed.js',
  'js/galeria.js',
  'js/share.js',
  'js/ui.js',
];
const jsRaw = fotosBlock + '\n' + readAll(jsFiles);

// ── Ofusca o JS ───────────────────────────────────────────────────────────────
const JavaScriptObfuscator = require('javascript-obfuscator');
const jsObf = JavaScriptObfuscator.obfuscate(jsRaw, {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  renameGlobals: false,
  selfDefending: false,
  identifierNamesGenerator: 'hexadecimal',
}).getObfuscatedCode();

// ── Monta o index.html final ──────────────────────────────────────────────────
const faviconMatch = indexSrc.match(/<link rel="icon"[^>]+>/);
const faviconTag   = faviconMatch ? faviconMatch[0] : '';

const vercelTags = (indexSrc.match(/<script defer src="https:\/\/cdn\.vercel[^>]+><\/script>/g) || []).join('\n');

const bodyMatch = indexSrc.match(/<body>([\s\S]*?)<script>/);
const bodyHTML  = bodyMatch ? bodyMatch[1].trim() : '';

const distHTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Gabriel Poubel</title>
${faviconTag}
${vercelTags}
<style>${cssMin}</style>
</head>
<body>
${bodyHTML}
<script>${jsObf}</script>
</body>
</html>`;

// ── Salva direto na raiz como index.html (substitui o de desenvolvimento) ─────
fs.writeFileSync('index.html', distHTML, 'utf8');

const kb = (distHTML.length / 1024).toFixed(1);
console.log(`Build concluído: index.html (${kb} KB)`);
console.log(`CSS: ${(cssMin.length/1024).toFixed(1)}KB | JS ofuscado: ${(jsObf.length/1024).toFixed(1)}KB`);
