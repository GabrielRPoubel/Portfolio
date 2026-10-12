# Repositório feito para manter meu site de fotografia

Site estático (HTML + CSS + JS vanilla) — https://portfolio-gules-five-16.vercel.app

## Rodar localmente

1. Duplo clique em `rodar-local.bat` (ou `python -m http.server 8000` na raiz)
2. Abre `http://localhost:8000/index.html`

Não abra `dist/index.html` direto: ele resolve `fotos/` para o lugar errado.
Prefira sempre o `http://localhost:8000/index.html`. Clone parcial sem
`fotos/` também mostra página vazia: `git sparse-checkout add fotos`.

## Administrar a loja

Duplo clique em `loja-admin.py` (precisa Python + Pillow):
- Produtos: novo/excluir, título, preço R$, peso em g, descrição, categoria,
  tags invisíveis (vírgula), ativo/oculto; imagens ilimitadas com preview
  (arraste a ordem, 1ª = capa)
- Categorias e tags: botões Gerenciar (criar/remover; categoria em uso não apaga)
- Frete automático: base R$ + adicional por kg + grátis acima de R$
- Salvar tudo: grava `produtos.json`, processa imagens em `loja-fotos/<id>/`
  (web 1600px + thumbs) e roda `gerar.py`, que embute tudo no site
- No site: cards com preço, estimativa de frete e pedido via WhatsApp;
  clique nas pílulas filtra por categoria

Segurança: a ferramenta é local e não fala com a internet; o site monta
os cards com `textContent` (sem HTML injetável) e só aceita caminhos de
imagem relativos simples; nenhum dado de pagamento trafega (pedido por
WhatsApp). `produtos.json` é público — não coloque segredos nele.

Para gerar o `LojaAdmin.exe` (não vai pro git): com PyInstaller instalado,
na raiz do repo: `pyinstaller --noconfirm --onefile --windowed --name LojaAdmin --icon icon.ico --distpath . --workpath .build-exe loja-admin.py`

## Como publicar

1. Coloque as fotos numeradas em `fotos/` (`1.jpg`, `2.jpg`, … aceita `.jpg`/`.jpeg`)
2. Rode `publicar.bat` (ou manual abaixo)
3. Vercel publica `dist/index.html`; `fotos/`, `fotos.json` e `favicon.png` são servidos como estáticos

## Manual

```bat
python gerar.py
node js/build.js
```

- `python gerar.py` → gera `fotos/thumbs/`, `fotos.json` (referência) e atualiza o bloco `// ─── FOTOS` no `index.html` (lista + EXIF embutido `fotosExif`, sem fetch)
- `node js/build.js` (`npm run build`) → gera `dist/index.html` inline (CSS+JS, sem dependências)

Cache (nunca ver coisa velha): `css/js` saem com `?v=<commit>`, fotos com
`?h=<md5>` (só muda se os bytes mudarem) e o HTML carrega `<!-- BUILD <commit> -->`.

## Deploy (Vercel)

Push no `main` gera deploy automático (integração GitHub em Settings → Git).
Para auditar o que está no ar: ver o fonte da página e procurar
`<!-- BUILD <commit> -->`. Nunca use commit vazio para forçar deploy —
a Vercel ignora push sem diff (Ignored Build Step).

Requer Python 3 + Pillow (`pip install Pillow`) e Node 18+.

`node_modules/` não vai para o git (`.gitignore`). Para remover do remoto uma vez:
`git rm -r --cached node_modules && git commit -m "remove node_modules" && git push`
