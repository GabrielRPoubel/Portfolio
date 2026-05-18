import os
import re

PASTA_FOTOS = "fotos"
INDEX = "index.html"

# Lê todos os arquivos .jpg da pasta fotos/, extrai os números e ordena
arquivos = []
for f in os.listdir(PASTA_FOTOS):
    if f.lower().endswith(".jpg"):
        nome = os.path.splitext(f)[0]
        if nome.isdigit():
            arquivos.append(int(nome))

arquivos.sort()

if not arquivos:
    print("Nenhuma foto encontrada na pasta fotos/")
    exit()

# Gera a lista de fotos no formato esperado pelo index.html
linhas = []
for n in arquivos:
    linhas.append(f"    {n},")

lista = "\n".join(linhas)

bloco = f"""  // ─── FOTOS ───────────────────────────────────────────────────────────────
  // Gerado automaticamente por gerar.py — não edite manualmente
  const fotos = [
{lista}
  ].map(n => ({{ src: `fotos/${{n}}.jpg`, alt: `${{n}}` }}));
  // ─────────────────────────────────────────────────────────────────────────"""

# Substitui o bloco no index.html
with open(INDEX, "r", encoding="utf-8") as f:
    conteudo = f.read()

novo = re.sub(
    r"// ─── FOTOS ─+.*?// ─+",
    bloco,
    conteudo,
    flags=re.DOTALL
)

with open(INDEX, "w", encoding="utf-8") as f:
    f.write(novo)

print(f"{len(arquivos)} fotos encontradas: {arquivos[0]}.jpg → {arquivos[-1]}.jpg")
print("index.html atualizado com sucesso.")
