import os
import re
import json

PASTA_FOTOS = "fotos"
INDEX = "index.html"
JSON_OUT = "fotos.json"

# ── Extração EXIF via Pillow ──────────────────────────────────────────────────
def exif_value(exif, tag_name):
    from PIL.ExifTags import TAGS
    for tag_id, val in exif.items():
        if TAGS.get(tag_id) == tag_name:
            return val
    return None

def frac_to_str(val):
    """Converte IFDRational ou tuple (num, den) para string legível."""
    try:
        if hasattr(val, 'numerator'):
            n, d = val.numerator, val.denominator
        elif isinstance(val, tuple):
            n, d = val
        else:
            return str(val)
        if d == 0:
            return None
        if n % d == 0:
            return str(n // d)
        return f"{n}/{d}"
    except Exception:
        return str(val)

def get_exif(path):
    try:
        from PIL import Image
        img = Image.open(path)
        raw = img._getexif()
        if not raw:
            return {}
        from PIL.ExifTags import TAGS, GPSTAGS

        def safe(val):
            if isinstance(val, bytes):
                return val.decode('utf-8', errors='ignore').strip('\x00')
            return val

        data = {}

        camera = exif_value(raw, 'Model')
        if camera:
            data['camera'] = safe(camera).strip()

        make = exif_value(raw, 'Make')
        if make:
            data['make'] = safe(make).strip()

        lens = exif_value(raw, 'LensModel')
        if not lens:
            lens = exif_value(raw, 'LensSpecification')
        if lens:
            if isinstance(lens, tuple):
                def r(v):
                    try:
                        n = v.numerator if hasattr(v,'numerator') else v[0]
                        d = v.denominator if hasattr(v,'denominator') else v[1]
                        return round(n/d, 1) if d else 0
                    except:
                        return 0
                parts = [r(x) for x in lens]
                lens = f"{parts[0]}-{parts[2]}mm f/{parts[1]}-{parts[3]}" if len(parts)==4 else str(lens)
            data['lens'] = safe(str(lens)).strip()

        exp = exif_value(raw, 'ExposureTime')
        if exp:
            data['exposure'] = frac_to_str(exp) + 's'

        fnumber = exif_value(raw, 'FNumber')
        if fnumber:
            try:
                n = fnumber.numerator if hasattr(fnumber,'numerator') else fnumber[0]
                d = fnumber.denominator if hasattr(fnumber,'denominator') else fnumber[1]
                data['aperture'] = f"f/{round(n/d, 1)}"
            except:
                data['aperture'] = str(fnumber)

        iso = exif_value(raw, 'ISOSpeedRatings')
        if iso:
            data['iso'] = f"ISO {iso}"

        fl = exif_value(raw, 'FocalLength')
        if fl:
            try:
                n = fl.numerator if hasattr(fl,'numerator') else fl[0]
                d = fl.denominator if hasattr(fl,'denominator') else fl[1]
                data['focal'] = f"{round(n/d)}mm"
            except:
                data['focal'] = str(fl)

        return data
    except Exception as e:
        print(f"  EXIF erro em {path}: {e}")
        return {}

# ── Lê arquivos ───────────────────────────────────────────────────────────────
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

# ── Extrai EXIF e gera fotos.json ─────────────────────────────────────────────
print(f"Extraindo EXIF de {len(arquivos)} fotos...")
fotos_data = []
for n in arquivos:
    path = os.path.join(PASTA_FOTOS, f"{n}.jpg")
    exif = get_exif(path)
    fotos_data.append({"n": n, "exif": exif})
    print(f"  {n}.jpg — {exif.get('camera','?')} {exif.get('lens','')}")

with open(JSON_OUT, "w", encoding="utf-8") as f:
    json.dump(fotos_data, f, ensure_ascii=False, indent=2)
print(f"fotos.json gerado com {len(fotos_data)} entradas.")

# ── Atualiza index.html ───────────────────────────────────────────────────────
linhas = [f"    {n}," for n in arquivos]
lista = "\n".join(linhas)

bloco = f"""  // ─── FOTOS ───────────────────────────────────────────────────────────────
  // Gerado automaticamente por gerar.py — não edite manualmente
  const fotos = [
{lista}
  ].map(n => ({{ src: `fotos/${{n}}.jpg`, alt: `${{n}}` }}));
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

print(f"\n{len(arquivos)} fotos: {arquivos[0]}.jpg → {arquivos[-1]}.jpg")
print("index.html e fotos.json atualizados com sucesso.")
