# Repositório feito para manter meu site de fotografia

Site estático (HTML + CSS + JS vanilla) — https://portfolio-gules-five-16.vercel.app

## Rodar localmente

1. Duplo clique em `rodar-local.bat` (ou `python -m http.server 8000` na raiz)
2. Abre `http://localhost:8000/index.html`

Não abra por duplo clique no `index.html`: `file://` bloqueia o `fetch('fotos.json')`
(EXIF vazio) e `dist/index.html` direto resolve `fotos/` para o lugar errado.
Clone parcial sem `fotos/` também mostra página vazia: `git sparse-checkout add fotos`.

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
