import os
import re
import json

PASTA_FOTOS = "fotos"
PASTA_THUMBS = os.path.join(PASTA_FOTOS, "thumbs")
INDEX = "index.html"
JSON_OUT = "fotos.json"
THUMB_WIDTH = 600  # px — largura máxima das miniaturas da galeria

# ── Dependências ──────────────────────────────────────────────────────────────
try:
    from PIL import Image
    from PIL.ExifTags import TAGS
except ImportError:
    print("Instalando Pillow...")
    os.system("pip install Pillow")
    from PIL import Image
    from PIL.ExifTags import TAGS

os.makedirs(PASTA_THUMBS, exist_ok=True)

# ── EXIF ──────────────────────────────────────────────────────────────────────
def frac(val):
    try:
        n = val.numerator if hasattr(val, 'numerator') else val[0]
        d = val.denominator if hasattr(val, 'denominator') else val[1]
        if d == 0: return None
        return (n, d)
    except:
        return None

def get_exif(path):
    try:
        img = Image.open(path)
        raw = img._getexif()
        if not raw: return {}
        data = {}
        lookup = {TAGS.get(k, k): v for k, v in raw.items()}

        def safe(v):
            return v.decode('utf-8', errors='ignore').strip('\x00') if isinstance(v, bytes) else str(v).strip()

        if 'Model'  in lookup: data['camera']   = safe(lookup['Model'])
        if 'Make'   in lookup: data['make']      = safe(lookup['Make'])

        lens = lookup.get('LensModel') or lookup.get('LensSpecification')
        if lens:
            if isinstance(lens, tuple):
                def r(v):
                    f = frac(v)
                    return round(f[0]/f[1], 1) if f else 0
                p = [r(x) for x in lens]
                lens = f"{p[0]}-{p[2]}mm f/{p[1]}-{p[3]}" if len(p) == 4 else str(lens)
            data['lens'] = safe(str(lens))

        if 'ExposureTime' in lookup:
            f = frac(lookup['ExposureTime'])
            if f: data['exposure'] = (f"{f[0]}/{f[1]}s" if f[1] != 1 else f"{f[0]}s")

        if 'FNumber' in lookup:
            f = frac(lookup['FNumber'])
            if f: data['aperture'] = f"f/{round(f[0]/f[1], 1)}"

        if 'ISOSpeedRatings' in lookup:
            data['iso'] = f"ISO {lookup['ISOSpeedRatings']}"

        if 'FocalLength' in lookup:
            f = frac(lookup['FocalLength'])
            if f: data['focal'] = f"{round(f[0]/f[1])}mm"

        return data
    except Exception as e:
        print(f"  EXIF erro: {e}")
        return {}

# ── Lê arquivos ───────────────────────────────────────────────────────────────
arquivos = sorted([
    int(os.path.splitext(f)[0])
    for f in os.listdir(PASTA_FOTOS)
    if f.lower().endswith('.jpg') and os.path.splitext(f)[0].isdigit()
])

if not arquivos:
    print("Nenhuma foto encontrada em fotos/")
    exit(1)

print(f"Encontradas {len(arquivos)} fotos: {arquivos[0]}.jpg → {arquivos[-1]}.jpg")

# ── Gera thumbs + extrai EXIF ────────────────────────────────────────────────
fotos_data = []
for n in arquivos:
    src = os.path.join(PASTA_FOTOS, f"{n}.jpg")
    thumb = os.path.join(PASTA_THUMBS, f"{n}.jpg")

    # Thumb
    if not os.path.exists(thumb):
        try:
            img = Image.open(src)
            img.thumbnail((THUMB_WIDTH, THUMB_WIDTH * 2), Image.LANCZOS)
            img.save(thumb, "JPEG", quality=75, optimize=True)
            print(f"  thumb {n}.jpg gerado")
        except Exception as e:
            print(f"  Erro ao gerar thumb {n}: {e}")
    else:
        print(f"  thumb {n}.jpg já existe")

    exif = get_exif(src)
    fotos_data.append({"n": n, "exif": exif})

# ── Salva fotos.json ──────────────────────────────────────────────────────────
with open(JSON_OUT, "w", encoding="utf-8") as f:
    json.dump(fotos_data, f, ensure_ascii=False, indent=2)
print(f"\nfotos.json salvo com {len(fotos_data)} entradas.")

# ── Atualiza lista no index.html ──────────────────────────────────────────────
linhas = []
for i in range(0, len(arquivos), 10):
    chunk = arquivos[i:i+10]
    linhas.append("    " + ",".join(str(n) for n in chunk) + ",")

lista = "\n".join(linhas)
bloco = f"""  // ─── FOTOS ───────────────────────────────────────────────────────────────
  // Gerado automaticamente por gerar.py — não edite manualmente
  const fotos = [
{lista}
  ].map(n => ({{ n, src: `fotos/${{n}}.jpg`, thumb: `fotos/thumbs/${{n}}.jpg` }}));
  // ─────────────────────────────────────────────────────────────────────────"""

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

print("index.html atualizado com sucesso.")
print(f"\nEstrutura da pasta:")
print(f"  fotos/         → {len(arquivos)} fotos originais")
print(f"  fotos/thumbs/  → {len(arquivos)} miniaturas ({THUMB_WIDTH}px)")
