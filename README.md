# Portfolio — Gabriel Poubel

## Estrutura

```
index.html          ← HTML limpo (sem CSS/JS inline)
src/
  css/main.css      ← todo o CSS em um arquivo
  js/
    main.js         ← entry point: inicializa tudo e expõe funções ao HTML
    fotos.js        ← lista de fotos (gerado pelo gerar.py)
    nav.js          ← nav, drawer, troca de páginas
    lightbox.js     ← lightbox, EXIF, fullscreen, swipe, teclado
    feed.js         ← feed vertical com lazy load
    galeria.js      ← grid com thumbs e lazy load
    share.js        ← compartilhar, copiar link, toast
    toast.js        ← toast utilitário
public/
  fotos.json        ← metadados EXIF (gerado pelo gerar.py)
  favicon.png
  Classyvogueregular.ttf
  Nexa-Heavy.ttf
fotos/              ← fotos originais (não versionadas no git)
  thumbs/           ← miniaturas
dist/               ← build final (gerado pelo Vite, não editar)
```

## Desenvolvimento

```bash
npm install
npm run dev      # servidor local com hot reload em http://localhost:5173
```

## Publicar

Basta rodar o `publicar.bat`. Ele:
1. Roda o `gerar.py` (processa fotos e atualiza `fotos.js` + `fotos.json`)
2. Instala dependências se necessário
3. Gera o build otimizado em `dist/` via Vite
4. Faz commit e push para o GitHub
5. O Vercel detecta o push e publica automaticamente

## Adicionar fotos

1. Copie os `.jpg` para a pasta `fotos/`
2. Rode o `publicar.bat`

O `gerar.py` detecta os arquivos novos, gera as miniaturas, extrai o EXIF
e atualiza `src/js/fotos.js` e `public/fotos.json` automaticamente.
