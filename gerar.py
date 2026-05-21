import os
import re
import json
import hashlib

PASTA_FOTOS  = "fotos"
PASTA_THUMBS = os.path.join(PASTA_FOTOS, "thumbs")
CACHE_FILE   = os.path.join(PASTA_THUMBS, ".cache.json")
INDEX        = "index.html"
JSON_OUT     = "fotos.json"
THUMB_WIDTH  = 600  # largura máxima das miniaturas

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

# ── Hash MD5 ──────────────────────────────────────────────────────────────────
def md5(path):
    h = hashlib.md5()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b''):
            h.update(chunk)
    return h.hexdigest()

# ── Cache de hashes ───────────────────────────────────────────────────────────
def load_cache():
    try:
        with open(CACHE_FILE, 'r') as f:
            return json.load(f)
    except:
        return {}

def save_cache(cache):
    with open(CACHE_FILE, 'w') as f:
        json.dump(cache, f, indent=2)

# ── EXIF ──────────────────────────────────────────────────────────────────────
def frac(val):
    try:
        n = val.numerator if hasattr(val, 'numerator') else val[0]
        d = val.denominator if hasattr(val, 'denominator') else val[1]
        return (n, d) if d != 0 else None
    except:
        return None

def get_exif(path):
    try:
        img = Image.open(path)
        raw = img._getexif()
        if not raw:
            return {}
        lookup = {TAGS.get(k, k): v for k, v in raw.items()}
        data = {}

        def safe(v):
            return v.decode('utf-8', errors='ignore').strip('\x00') if isinstance(v, bytes) else str(v).strip()

        if 'Model'  in lookup: data['camera']  = safe(lookup['Model'])
        if 'Make'   in lookup: data['make']     = safe(lookup['Make'])

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
            if f: data['exposure'] = f"{f[0]}/{f[1]}s" if f[1] != 1 else f"{f[0]}s"

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

# ── Processa fotos ────────────────────────────────────────────────────────────
cache      = load_cache()
fotos_data = []
gerados    = 0
ignorados  = 0

for n in arquivos:
    src   = os.path.join(PASTA_FOTOS, f"{n}.jpg")
    thumb = os.path.join(PASTA_THUMBS, f"{n}.jpg")
    key   = str(n)

    current_hash = md5(src)
    cached_hash  = cache.get(key)

    if cached_hash == current_hash and os.path.exists(thumb):
        print(f"  {n}.jpg — sem alteração, thumb mantido")
        ignorados += 1
    else:
        motivo = "novo" if not os.path.exists(thumb) else "modificado"
        try:
            img = Image.open(src)
            img.thumbnail((THUMB_WIDTH, THUMB_WIDTH * 2), Image.LANCZOS)
            img.save(thumb, "JPEG", quality=75, optimize=True)
            cache[key] = current_hash
            print(f"  {n}.jpg — {motivo}, thumb regerado")
            gerados += 1
        except Exception as e:
            print(f"  {n}.jpg — erro ao gerar thumb: {e}")

    exif = get_exif(src)
    fotos_data.append({"n": n, "exif": exif})

save_cache(cache)

print(f"\nThumbs: {gerados} regerados, {ignorados} sem alteração.")

# ── Salva fotos.json ──────────────────────────────────────────────────────────
with open(JSON_OUT, "w", encoding="utf-8") as f:
    json.dump(fotos_data, f, ensure_ascii=False, indent=2)
print(f"fotos.json salvo com {len(fotos_data)} entradas.")

# ── Atualiza index.html ───────────────────────────────────────────────────────
linhas = []
for i in range(0, len(arquivos), 10):
    chunk = arquivos[i:i+10]
    linhas.append("    " + ",".join(str(n) for n in chunk) + ",")

lista  = "\n".join(linhas)
bloco  = f"""  // ─── FOTOS ───────────────────────────────────────────────────────────────
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
