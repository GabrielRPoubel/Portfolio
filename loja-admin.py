"""Administração da LOJA — ferramenta desktop (proprietário).

Cadastra produtos com imagens (preview + quantas quiser), título, preço,
peso (base do frete automático), descrição, categoria e tags invisíveis.
Gerencia categorias e tags. Salva em produtos.json, processa as imagens em
loja-fotos/<id>/ e roda gerar.py para embutir tudo no site.

Fluxo: edite aqui > Salvar tudo > confira em rodar-local.bat > publique
com publicar.bat. Nada aqui fala com a internet.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tkinter as tk
from tkinter import filedialog, messagebox, ttk
from pathlib import Path

try:
    from PIL import Image, ImageOps, ImageTk
except ImportError:
    sys.exit("Pillow não instalado. Rode: pip install Pillow")

ROOT = Path(sys.executable).resolve().parent if getattr(sys, "frozen", False) else Path(__file__).resolve().parent
PRODUTOS_JSON = ROOT / "produtos.json"
FOTOS_DIR = ROOT / "loja-fotos"
GERAR_PY = ROOT / "gerar.py"

WEB_MAX = 1600   # maior lado da imagem da loja
THUMB_MAX = 600  # maior lado da miniatura
SAFE_ID = re.compile(r"^[A-Za-z0-9_-]+$")


def default_data():
    return {
        "versao": 1,
        "frete": {"base": 14.9, "por_kg": 6.0, "gratis_acima": 299.0},
        "categorias": ["Impressões", "Digitais", "Pôsteres"],
        "tags": [],
        "produtos": [],
    }


def load_data():
    try:
        with open(PRODUTOS_JSON, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            raise ValueError("formato inválido")
    except (FileNotFoundError, ValueError, json.JSONDecodeError):
        data = default_data()
    for k, v in default_data().items():
        data.setdefault(k, v)
    if not isinstance(data.get("produtos"), list):
        data["produtos"] = []
    return data


def atomic_save(data):
    tmp = PRODUTOS_JSON.with_suffix(".json.tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, PRODUTOS_JSON)


def next_id(produtos):
    nums = []
    for p in produtos:
        m = re.match(r"^p(\d+)$", str(p.get("id", "")))
        if m:
            nums.append(int(m.group(1)))
    return f"p{(max(nums) + 1) if nums else 1:03d}"


def process_image(src, dest, max_side, quality=82):
    """Copia+redimensiona com segurança (orientação EXIF, RGB, LANCZOS)."""
    dest = Path(dest)
    dest.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src) as img:
        img = ImageOps.exif_transpose(img)
        if img.mode in ("RGBA", "P", "LA"):
            bg = Image.new("RGB", img.size, (0, 0, 0))
            bg.paste(img, mask=img.split()[-1] if img.mode.endswith("A") else None)
            img = bg
        elif img.mode != "RGB":
            img = img.convert("RGB")
        img.thumbnail((max_side, max_side * 2), Image.LANCZOS)
        img.save(dest, "JPEG", quality=quality, optimize=True)


class ManagerDialog(tk.Toplevel):
    """Gerenciador genérico de lista (categorias ou tags)."""

    def __init__(self, master, titulo, itens, on_change, em_uso=None):
        super().__init__(master)
        self.title(titulo)
        self.resizable(False, False)
        self.itens = list(itens)
        self.on_change = on_change
        self.em_uso = em_uso  # fn(item) -> lista de produtos que usam
        self.configure(padx=12, pady=12)

        self.lista = tk.Listbox(self, width=36, height=10)
        self.lista.grid(row=0, column=0, columnspan=2, pady=(0, 8))
        self.refresh()

        self.entry = ttk.Entry(self, width=30)
        self.entry.grid(row=1, column=0, sticky="ew", padx=(0, 6))
        ttk.Button(self, text="Adicionar", command=self.adicionar).grid(row=1, column=1)
        ttk.Button(self, text="Remover selecionada", command=self.remover).grid(row=2, column=0, columnspan=2, pady=(8, 0), sticky="ew")
        ttk.Button(self, text="Concluir", command=self.concluir).grid(row=3, column=0, columnspan=2, pady=(8, 0), sticky="ew")
        self.grab_set()

    def refresh(self):
        self.lista.delete(0, tk.END)
        for item in self.itens:
            self.lista.insert(tk.END, item)

    def adicionar(self):
        nome = self.entry.get().strip()
        if not nome:
            return
        if nome in self.itens:
            messagebox.showinfo("Aviso", "Já existe.")
            return
        self.itens.append(nome)
        self.entry.delete(0, tk.END)
        self.refresh()

    def remover(self):
        sel = self.lista.curselection()
        if not sel:
            return
        item = self.lista.get(sel[0])
        if self.em_uso:
            usando = self.em_uso(item)
            if usando:
                messagebox.showwarning(
                    "Em uso",
                    f"'{item}' está em: {', '.join(usando)}. Troque a categoria antes.",
                )
                return
        self.itens.remove(item)
        self.refresh()

    def concluir(self):
        self.on_change(self.itens)
        self.destroy()


class LojaAdmin(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("LOJA — Administração")
        self.geometry("1080x700")
        try:
            self.style = ttk.Style(self)
            self.style.theme_use("clam")
        except tk.TclError:
            pass

        self.data = load_data()
        self.current_id = None
        # Imagens em edição: [{"src": relativo, "externa": bool}]
        self.edit_images = []
        self.thumbs_refs = []
        self._sweep_orfaos()

        self._build_layout()
        self.refresh_list()
        self._update_cats_combo()

    # ── Layout ──────────────────────────────────────────────────────────
    def _build_layout(self):
        main = ttk.Frame(self, padding=10)
        main.pack(fill=tk.BOTH, expand=True)
        main.columnconfigure(1, weight=1)

        # Esquerda: lista de produtos
        left = ttk.LabelFrame(main, text="Produtos", padding=8)
        left.grid(row=0, column=0, sticky="ns", padx=(0, 10))
        self.prod_list = tk.Listbox(left, width=28, height=28)
        self.prod_list.pack(fill=tk.BOTH, expand=True)
        self.prod_list.bind("<<ListboxSelect>>", lambda e: self.on_select())
        btns = ttk.Frame(left)
        btns.pack(fill=tk.X, pady=(8, 0))
        ttk.Button(btns, text="Novo", command=self.new_product).pack(side=tk.LEFT, expand=True, fill=tk.X)
        ttk.Button(btns, text="Excluir", command=self.delete_product).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=(6, 0))

        # Direita: formulário
        right = ttk.Frame(main)
        right.grid(row=0, column=1, sticky="nsew")
        right.columnconfigure(1, weight=1)

        r = 0
        ttk.Label(right, text="Título:").grid(row=r, column=0, sticky="w")
        self.var_titulo = tk.StringVar()
        ttk.Entry(right, textvariable=self.var_titulo).grid(row=r, column=1, sticky="ew", pady=2)
        r += 1

        row = ttk.Frame(right)
        row.grid(row=r, column=1, sticky="ew", pady=2)
        ttk.Label(right, text="Preço R$:").grid(row=r, column=0, sticky="w")
        self.var_preco = tk.StringVar()
        ttk.Entry(row, textvariable=self.var_preco, width=12).pack(side=tk.LEFT)
        ttk.Label(row, text="  Peso (g):").pack(side=tk.LEFT)
        self.var_peso = tk.StringVar()
        ttk.Entry(row, textvariable=self.var_peso, width=12).pack(side=tk.LEFT)
        self.var_ativo = tk.BooleanVar(value=True)
        ttk.Checkbutton(row, text="Ativo no site", variable=self.var_ativo).pack(side=tk.LEFT, padx=(12, 0))
        r += 1

        ttk.Label(right, text="Categoria:").grid(row=r, column=0, sticky="w")
        catrow = ttk.Frame(right)
        catrow.grid(row=r, column=1, sticky="ew", pady=2)
        self.combo_cat = ttk.Combobox(catrow, state="readonly")
        self.combo_cat.pack(side=tk.LEFT, fill=tk.X, expand=True)
        ttk.Button(catrow, text="Gerenciar…", command=self.manage_cats).pack(side=tk.LEFT, padx=(6, 0))
        r += 1

        ttk.Label(right, text="Descrição:").grid(row=r, column=0, sticky="nw")
        self.txt_desc = tk.Text(right, height=4)
        self.txt_desc.grid(row=r, column=1, sticky="ew", pady=2)
        r += 1

        ttk.Label(right, text="Tags\n(invisíveis):").grid(row=r, column=0, sticky="nw")
        tagrow = ttk.Frame(right)
        tagrow.grid(row=r, column=1, sticky="ew", pady=2)
        self.var_tags = tk.StringVar()
        ttk.Entry(tagrow, textvariable=self.var_tags).pack(side=tk.LEFT, fill=tk.X, expand=True)
        ttk.Label(tagrow, text=" (separadas por vírgula)").pack(side=tk.LEFT)
        ttk.Button(tagrow, text="Gerenciar…", command=self.manage_tags).pack(side=tk.LEFT, padx=(6, 0))
        r += 1

        ttk.Label(right, text="Imagens\n(1ª = capa):").grid(row=r, column=0, sticky="nw")
        imgframe = ttk.Frame(right)
        imgframe.grid(row=r, column=1, sticky="ew", pady=2)
        self.img_bar = ttk.Frame(imgframe)
        self.img_bar.pack(fill=tk.X)
        imgbtns = ttk.Frame(imgframe)
        imgbtns.pack(fill=tk.X, pady=(6, 0))
        ttk.Button(imgbtns, text="Adicionar…", command=self.add_images).pack(side=tk.LEFT)
        ttk.Button(imgbtns, text="Remover", command=self.remove_image).pack(side=tk.LEFT, padx=(6, 0))
        ttk.Button(imgbtns, text="▲ Subir", command=lambda: self.move_image(-1)).pack(side=tk.LEFT, padx=(6, 0))
        ttk.Button(imgbtns, text="▼ Descer", command=lambda: self.move_image(1)).pack(side=tk.LEFT)
        self.var_sel_img = tk.IntVar(value=-1)
        r += 1

        # Frete
        frete = ttk.LabelFrame(right, text="Frete automático (vale para todos)", padding=8)
        frete.grid(row=r, column=0, columnspan=2, sticky="ew", pady=(10, 0))
        self.var_base = tk.StringVar(value=str(self.data["frete"].get("base", "")))
        self.var_porkg = tk.StringVar(value=str(self.data["frete"].get("por_kg", "")))
        self.var_gratis = tk.StringVar(value=str(self.data["frete"].get("gratis_acima", "")))
        self.var_cep_origem = tk.StringVar(value=str(self.data["frete"].get("cep_origem", "")))
        ttk.Label(frete, text="Base R$:").pack(side=tk.LEFT)
        ttk.Entry(frete, textvariable=self.var_base, width=8).pack(side=tk.LEFT, padx=(2, 10))
        ttk.Label(frete, text="+ por kg R$:").pack(side=tk.LEFT)
        ttk.Entry(frete, textvariable=self.var_porkg, width=8).pack(side=tk.LEFT, padx=(2, 10))
        ttk.Label(frete, text="Grátis acima de R$:").pack(side=tk.LEFT)
        ttk.Entry(frete, textvariable=self.var_gratis, width=8).pack(side=tk.LEFT, padx=(2, 10))
        ttk.Label(frete, text="CEP origem:").pack(side=tk.LEFT)
        ttk.Entry(frete, textvariable=self.var_cep_origem, width=10).pack(side=tk.LEFT, padx=(2, 0))
        r += 1

        # Ações
        act = ttk.Frame(right)
        act.grid(row=r, column=0, columnspan=2, sticky="ew", pady=(12, 0))
        ttk.Button(act, text="💾 Salvar tudo + atualizar site", command=self.save_all).pack(side=tk.LEFT, fill=tk.X, expand=True)
        self.status = ttk.Label(act, text="Pronto.")
        self.status.pack(side=tk.LEFT, padx=(12, 0))

    # ── Produtos ────────────────────────────────────────────────────────
    def _sweep_orfaos(self):
        """Apaga pastas loja-fotos/<id> sem produto correspondente.
        Só roda com produtos.json íntegro — nunca encosta em nada sem base."""
        try:
            with open(PRODUTOS_JSON, "r", encoding="utf-8") as f:
                json.load(f)
        except (FileNotFoundError, ValueError, json.JSONDecodeError):
            return
        if not FOTOS_DIR.exists():
            return
        ids = {str(p.get("id")) for p in self.data["produtos"]}
        for pasta in FOTOS_DIR.iterdir():
            if pasta.is_dir() and pasta.name not in ids:
                shutil.rmtree(pasta, ignore_errors=True)
    def refresh_list(self):
        sel = self.current_id
        self.prod_list.delete(0, tk.END)
        for p in self.data["produtos"]:
            marca = "" if p.get("ativo", True) else " (oculto)"
            self.prod_list.insert(tk.END, f"{p.get('id', '?')} — {p.get('titulo', '')}{marca}")
        if sel:
            for i, p in enumerate(self.data["produtos"]):
                if p.get("id") == sel:
                    self.prod_list.selection_set(i)
                    break

    def _get(self, pid):
        for p in self.data["produtos"]:
            if p.get("id") == pid:
                return p
        return None

    def new_product(self):
        pid = next_id(self.data["produtos"])
        self.data["produtos"].append({
            "id": pid, "titulo": "Nova peça", "preco": 0.0, "peso_g": 0,
            "descricao": "", "categoria": (self.data["categorias"] or [""])[0],
            "tags": [], "imagens": [], "thumb": "", "ativo": True,
        })
        self.refresh_list()
        self.current_id = pid
        self.load_form()
        self.set_status(f"{pid} criado. Complete os dados e salve.")

    def delete_product(self):
        p = self._get(self.current_id)
        if not p:
            return
        if not messagebox.askyesno("Excluir", f"Excluir {p['id']} — {p.get('titulo', '')}?\nAs imagens da pasta serão apagadas."):
            return
        shutil.rmtree(FOTOS_DIR / p["id"], ignore_errors=True)
        self.data["produtos"] = [x for x in self.data["produtos"] if x.get("id") != p["id"]]
        self.current_id = None
        self.edit_images = []
        self.refresh_list()
        self.clear_form()

    def on_select(self):
        sel = self.prod_list.curselection()
        if not sel:
            return
        self.current_id = self.data["produtos"][sel[0]].get("id")
        self.load_form()

    def clear_form(self):
        self.var_titulo.set("")
        self.var_preco.set("")
        self.var_peso.set("")
        self.var_tags.set("")
        self.txt_desc.delete("1.0", tk.END)
        self.var_ativo.set(True)
        self.edit_images = []
        self.render_img_bar()

    def load_form(self):
        p = self._get(self.current_id)
        if not p:
            self.clear_form()
            return
        self.var_titulo.set(p.get("titulo", ""))
        self.var_preco.set(str(p.get("preco", "")))
        self.var_peso.set(str(p.get("peso_g", "")))
        self.var_tags.set(", ".join(p.get("tags", [])))
        self.txt_desc.delete("1.0", tk.END)
        self.txt_desc.insert("1.0", p.get("descricao", ""))
        self.var_ativo.set(bool(p.get("ativo", True)))
        self._update_cats_combo()
        cat = p.get("categoria", "")
        self.combo_cat.set(cat if cat in self.data["categorias"] else "")
        self.edit_images = [{"src": rel, "externa": False} for rel in p.get("imagens", [])]
        # Descarta fantasmas (arquivo sumiu do disco fora da ferramenta).
        antes = len(self.edit_images)
        self.edit_images = [it for it in self.edit_images if (ROOT / it["src"]).exists()]
        perdidas = antes - len(self.edit_images)
        self.render_img_bar()
        if perdidas:
            self.set_status(f"{perdidas} imagem(ns) não encontrada(s) no disco e removida(s) da lista — confira e salve.")

    # ── Imagens ─────────────────────────────────────────────────────────
    def _thumb_tk(self, path, box=96):
        with Image.open(path) as img:
            img = ImageOps.exif_transpose(img)
            img.thumbnail((box, box), Image.LANCZOS)
            if img.mode != "RGB":
                img = img.convert("RGB")
            return ImageTk.PhotoImage(img)

    def render_img_bar(self):
        for w in self.img_bar.winfo_children():
            w.destroy()
        self.thumbs_refs = []
        for i, item in enumerate(self.edit_images):
            try:
                disk = item["src"] if item["externa"] else str(ROOT / item["src"])
                tkimg = self._thumb_tk(disk)
            except Exception:
                continue
            self.thumbs_refs.append(tkimg)
            f = ttk.Frame(self.img_bar, relief=tk.SUNKEN, borderwidth=2 if i == self.var_sel_img.get() else 0)
            f.pack(side=tk.LEFT, padx=3)
            lbl = tk.Label(f, image=tkimg)
            lbl.pack()
            lbl.bind("<Button-1>", lambda e, idx=i: (self.var_sel_img.set(idx), self.render_img_bar()))
            ttk.Label(f, text=f"{i + 1}").pack()

    def add_images(self):
        """Ingestão imediata: já grava web + thumb na pasta (sem esperar o Salvar)."""
        if not self.current_id:
            messagebox.showinfo("Aviso", "Crie ou selecione um produto antes.")
            return
        paths = filedialog.askopenfilenames(
            title="Imagens do produto",
            filetypes=[("Imagens", "*.jpg *.jpeg *.png *.webp"), ("Todos", "*.*")],
        )
        if not paths:
            return
        pasta = FOTOS_DIR / self.current_id
        thumbs = pasta / "thumbs"
        pasta.mkdir(parents=True, exist_ok=True)
        thumbs.mkdir(parents=True, exist_ok=True)
        existentes = {p.name for p in pasta.glob("*.jpg")} | {p.name for p in thumbs.glob("*.jpg")}
        k = 0
        ok, falhas = 0, []
        for path in paths:
            k += 1
            # Nome temporário único; o Salvar renumera para 1..N na ordem da lista.
            base = f"new_{len(self.edit_images) + k}"
            while f"{base}.jpg" in existentes:
                k += 1
                base = f"new_{len(self.edit_images) + k}"
            existentes.add(f"{base}.jpg")
            try:
                process_image(path, pasta / f"{base}.jpg", WEB_MAX, quality=82)
                process_image(pasta / f"{base}.jpg", thumbs / f"{base}.jpg", THUMB_MAX, quality=75)
                self.edit_images.append({"src": f"loja-fotos/{self.current_id}/{base}.jpg", "externa": False})
                ok += 1
            except Exception as e:
                falhas.append(f"{Path(path).name}: {e}")
        self.render_img_bar()
        if falhas:
            messagebox.showwarning("Algumas falharam", "\n".join(falhas))
        self.set_status(f"{ok} imagem(ns) na pasta (salve para concluir).")

    def remove_image(self):
        i = self.var_sel_img.get()
        if 0 <= i < len(self.edit_images):
            self.edit_images.pop(i)
            self.var_sel_img.set(-1)
            self.render_img_bar()

    def move_image(self, delta):
        i = self.var_sel_img.get()
        j = i + delta
        if 0 <= i < len(self.edit_images) and 0 <= j < len(self.edit_images):
            self.edit_images[i], self.edit_images[j] = self.edit_images[j], self.edit_images[i]
            self.var_sel_img.set(j)
            self.render_img_bar()

    # ── Categorias / tags ───────────────────────────────────────────────
    def _update_cats_combo(self):
        self.combo_cat["values"] = self.data["categorias"]

    def manage_cats(self):
        def em_uso(cat):
            return [p["id"] for p in self.data["produtos"] if p.get("categoria") == cat]

        def done(nova):
            self.data["categorias"] = nova
            self._update_cats_combo()

        ManagerDialog(self, "Categorias", self.data["categorias"], done, em_uso)

    def manage_tags(self):
        def done(novas):
            removidas = set(self.data["tags"]) - set(novas)
            self.data["tags"] = novas
            if removidas:
                for p in self.data["produtos"]:
                    p["tags"] = [t for t in p.get("tags", []) if t not in removidas]
                self.set_status(f"Tags removidas também dos produtos: {', '.join(sorted(removidas))}")

        ManagerDialog(self, "Tags (invisíveis no site)", self.data["tags"], done)

    # ── Salvar ──────────────────────────────────────────────────────────
    def parse_float(self, texto, campo):
        try:
            v = float(str(texto).replace(",", "."))
        except ValueError:
            raise ValueError(f"{campo} inválido: '{texto}'")
        if v < 0:
            raise ValueError(f"{campo} não pode ser negativo.")
        return v

    def collect_form(self, p):
        titulo = self.var_titulo.get().strip()
        if not titulo:
            raise ValueError("Título é obrigatório.")
        preco = self.parse_float(self.var_preco.get(), "Preço")
        peso = self.parse_float(self.var_peso.get(), "Peso")
        if not self.edit_images:
            raise ValueError("Inclua ao menos 1 imagem.")
        p["titulo"] = titulo
        p["preco"] = round(preco, 2)
        p["peso_g"] = int(round(peso))
        p["categoria"] = self.combo_cat.get().strip()
        if p["categoria"] and p["categoria"] not in self.data["categorias"]:
            self.data["categorias"].append(p["categoria"])
            self._update_cats_combo()
        tags = [t.strip() for t in self.var_tags.get().split(",") if t.strip()]
        for t in tags:
            if t not in self.data["tags"]:
                self.data["tags"].append(t)
        p["tags"] = tags
        p["descricao"] = self.txt_desc.get("1.0", "end-1c").strip()
        p["ativo"] = bool(self.var_ativo.get())

    def materialize_images(self, p):
        """Consolida loja-fotos/<id>/: renumera a lista para 1..N (1ª = capa),
        garante os thumbs e apaga sobras. Arquivos já entram prontos no Adicionar."""
        faltando = [
            item["src"] for item in self.edit_images
            if not (ROOT / item["src"]).exists()
        ]
        if faltando:
            raise ValueError(
                "Arquivo(s) sumiram do disco — anexe novamente:\n" + "\n".join(faltando)
            )
        pid = p["id"]
        pasta = FOTOS_DIR / pid
        thumbs = pasta / "thumbs"
        pasta.mkdir(parents=True, exist_ok=True)
        thumbs.mkdir(parents=True, exist_ok=True)
        finais = []
        # Renomeia via temporários para não colidir (ex: 2.jpg -> 1.jpg).
        for k, item in enumerate(self.edit_images, start=1):
            origem = ROOT / item["src"]
            temp = pasta / f"ord_{k}.jpg"
            if origem.resolve() != temp.resolve():
                if temp.exists():
                    temp.unlink()
                origem.replace(temp)
            th_origem = thumbs / origem.name
            th_temp = thumbs / f"ord_{k}.jpg"
            if th_origem.exists() and th_origem.resolve() != th_temp.resolve():
                if th_temp.exists():
                    th_temp.unlink()
                th_origem.replace(th_temp)
        for k in range(1, len(self.edit_images) + 1):
            (pasta / f"ord_{k}.jpg").replace(pasta / f"{k}.jpg")
            th = thumbs / f"ord_{k}.jpg"
            if th.exists():
                th.replace(thumbs / f"{k}.jpg")
            process_image(pasta / f"{k}.jpg", thumbs / f"{k}.jpg", THUMB_MAX, quality=75)
            finais.append(f"loja-fotos/{pid}/{k}.jpg")
        # Remove sobras (imagens excluídas da lista; thumbs acompanham as finais)
        esperados = set(finais) | {
            f"loja-fotos/{pid}/thumbs/{k}.jpg" for k in range(1, len(self.edit_images) + 1)
        }
        for arq in list(pasta.glob("*.jpg")) + list(thumbs.glob("*.jpg")):
            rel = f"loja-fotos/{pid}/" + ("thumbs/" if arq.parent == thumbs else "") + arq.name
            if rel not in esperados:
                arq.unlink(missing_ok=True)
        p["imagens"] = finais
        p["thumb"] = f"loja-fotos/{pid}/thumbs/1.jpg" if finais else ""
        self.edit_images = [{"src": r, "externa": False} for r in finais]
        self.render_img_bar()

    def save_all(self):
        try:
            if not self.data["categorias"]:
                raise ValueError("Crie ao menos 1 categoria.")
            base = self.parse_float(self.var_base.get(), "Frete base")
            porkg = self.parse_float(self.var_porkg.get(), "Frete por kg")
            gratis = self.parse_float(self.var_gratis.get(), "Frete grátis acima")
            cep_origem = re.sub(r"\D", "", self.var_cep_origem.get())
            if cep_origem and len(cep_origem) != 8:
                raise ValueError("CEP de origem deve ter 8 dígitos.")
            self.data["frete"] = {"base": base, "por_kg": porkg, "gratis_acima": gratis, "cep_origem": cep_origem}
            if self.current_id:
                p = self._get(self.current_id)
                if p:
                    self.collect_form(p)
                    self.materialize_images(p)
            atomic_save(self.data)
        except ValueError as e:
            messagebox.showerror("Verifique", str(e))
            return
        except Exception as e:
            messagebox.showerror("Erro ao salvar", str(e))
            return
        self.refresh_list()
        self.run_gerar()

    def run_gerar(self):
        """Atualiza o site: executa gerar.py no próprio processo (funciona no
        .exe, onde sys.executable é o app e não há Python separado) e depois
        o build do dist via node, igual ao publicar.bat (sem o push)."""
        import runpy
        self.set_status("Salvo. Atualizando site (gerar.py + build)…")
        self.update_idletasks()
        if not GERAR_PY.exists():
            messagebox.showerror("gerar.py", f"Não encontrado: {GERAR_PY}")
            self.set_status("gerar.py não encontrado.")
            return
        try:
            runpy.run_path(str(GERAR_PY), run_name="__main__")
        except SystemExit as e:
            if e.code not in (None, 0):
                messagebox.showerror("gerar.py falhou", f"gerar.py saiu com código {e.code}.")
                self.set_status("gerar.py falhou — veja a mensagem.")
                return
        except Exception as e:
            messagebox.showerror("gerar.py falhou", str(e)[-2000:])
            self.set_status("gerar.py falhou — veja a mensagem.")
            return
        node = shutil.which("node")
        if node:
            si = None
            if os.name == "nt":
                si = subprocess.STARTUPINFO()
                si.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            b = subprocess.run(
                [node, "js/build.js"],
                cwd=str(ROOT),
                capture_output=True, text=True, timeout=300,
                startupinfo=si,
            )
            if b.returncode != 0:
                messagebox.showerror("build falhou", (b.stderr or b.stdout)[-2000:])
                self.set_status("gerar.py ok, mas o build do dist falhou.")
                return
        else:
            messagebox.showwarning("Node ausente", "gerar.py ok, mas Node não encontrado: dist/ ficou desatualizado.")
        self.set_status("Tudo salvo e site atualizado. Confira em rodar-local.bat.")
        messagebox.showinfo("Pronto", "Salvo! Confira no rodar-local.bat e publique com publicar.bat.")

    def set_status(self, msg):
        self.status.config(text=msg)


if __name__ == "__main__":
    FOTOS_DIR.mkdir(parents=True, exist_ok=True)
    LojaAdmin().mainloop()
