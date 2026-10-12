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

// Abre a aba direto pelo hash (#/galeria, #/loja, #/carrinho…).
(function () {
  var h = String(window.location.hash || '').replace('#/', '');
  if (['galeria', 'novas', 'loja', 'carrinho', 'checkout', 'andamento'].indexOf(h) < 0) return;
  showPage(h);
  if (h === 'carrinho' && typeof renderCarrinho === 'function') renderCarrinho();
  if (h === 'checkout' && typeof renderCheckout === 'function') renderCheckout();
  if (h === 'andamento' && typeof renderAndamento === 'function') renderAndamento();
})();
