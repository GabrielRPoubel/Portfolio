import os
import re

PASTA_FOTOS = "fotos"
JS_FILE = "js/script.js"

# Lê todos os arquivos .jpg da pasta fotos/, extrai os números e ordena
arquivos = []
if os.path.exists(PASTA_FOTOS):
    for f in os.listdir(PASTA_FOTOS):
        if f.lower().endswith(".jpg"):
            nome = os.path.splitext(f)[0]
            if nome.isdigit():
                arquivos.append(int(nome))

arquivos.sort()

if not arquivos:
    print("Nenhuma foto encontrada na pasta fotos/")
    # Don't exit, maybe they just want to clear the list, or it's empty initially.
else:
    print(f"{len(arquivos)} fotos encontradas. Atualizando js/script.js...")

# Gera a lista de fotos no formato esperado pelo script.js
linhas = []
for n in arquivos:
    linhas.append(f"    {n},")

lista = "\n".join(linhas)

bloco = f"""  // ─── FOTOS ───────────────────────────────────────────────────────────────
  // Gerado automaticamente por gerar.py — não edite manualmente
  const fotos = [
{lista}
  ].map(n => ({{ src: `fotos/${{n}}.jpg`, alt: `Fotografia ${{n}} do portfólio` }}));
  // ─────────────────────────────────────────────────────────────────────────"""

# Substitui o bloco no js/script.js
if os.path.exists(JS_FILE):
    with open(JS_FILE, "r", encoding="utf-8") as f:
        conteudo = f.read()

    novo = re.sub(
        r"// ─── FOTOS ─+.*?// ─+",
        bloco,
        conteudo,
        flags=re.DOTALL
    )

    with open(JS_FILE, "w", encoding="utf-8") as f:
        f.write(novo)
    print("Arquivo js/script.js atualizado com sucesso!")
else:
    print(f"Erro: Arquivo {JS_FILE} não encontrado. Certifique-se de estar na raiz do projeto.")
