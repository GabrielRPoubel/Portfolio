// ── Proteção de download ──────────────────────────────────────────────────────
document.addEventListener('contextmenu', e => {
  if (e.target.tagName === 'IMG') e.preventDefault();
});
document.addEventListener('dragstart', e => {
  if (e.target.tagName === 'IMG') e.preventDefault();
});
document.addEventListener('keydown', e => {
  if (document.getElementById('lightbox').classList.contains('active')) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'u')) e.preventDefault();
  }
}, true);

// ── Init ──────────────────────────────────────────────────────────────────────
buildFeed(fotos);
buildGrid(fotos);
buildNovas(novasFotos);
openFromUrl();

// file:// bloqueia fetch('fotos.json') — EXIF só funciona via http(s).
if (window.location.protocol === 'file:') {
  showToast('ABRA VIA RODAR-LOCAL.BAT PARA O EXIF FUNCIONAR');
}
