# Repositório feito para manter meu site de fotografia

Site estático (HTML + CSS + JS vanilla) — https://portfolio-gules-five-16.vercel.app

## Como publicar

1. Coloque as fotos numeradas em `fotos/` (`1.jpg`, `2.jpg`, … aceita `.jpg`/`.jpeg`)
2. Rode `publicar.bat` (ou manual abaixo)
3. Vercel publica `dist/index.html`; `fotos/`, `fotos.json` e `favicon.png` são servidos como estáticos

## Manual

```bat
python gerar.py
node js/build.js
```

- `python gerar.py` → gera `fotos/thumbs/`, `fotos.json` (EXIF) e atualiza o bloco `// ─── FOTOS` no `index.html`
- `node js/build.js` (`npm run build`) → gera `dist/index.html` inline (CSS+JS, sem dependências)

Requer Python 3 + Pillow (`pip install Pillow`) e Node 18+.

`node_modules/` não vai para o git (`.gitignore`). Para remover do remoto uma vez:
`git rm -r --cached node_modules && git commit -m "remove node_modules" && git push`
