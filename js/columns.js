// ── Seletor de colunas (galeria / novas) ──────────────────────────────────────
(function () {
  const STORAGE_KEY = 'colsPref';
  const DEFAULT_COLS = window.innerWidth <= 480 ? 2 : 3;

  function getSavedCols() {
    const saved = parseInt(localStorage.getItem(STORAGE_KEY), 10);
    return [2, 3, 5].includes(saved) ? saved : DEFAULT_COLS;
  }

  function applyCols(cols, animate) {
    const grids = document.querySelectorAll('.grid-gallery');

    if (animate) {
      grids.forEach(g => g.classList.add('switching'));
      setTimeout(() => {
        document.documentElement.style.setProperty('--cols', cols);
        requestAnimationFrame(() => {
          grids.forEach(g => g.classList.remove('switching'));
        });
      }, 260);
    } else {
      document.documentElement.style.setProperty('--cols', cols);
    }

    document.querySelectorAll('.col-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.cols, 10) === cols);
    });
  }

  // Init
  applyCols(getSavedCols(), false);

  // Clique nos botões (delegação, cobre galeria e novas)
  document.querySelectorAll('.col-switch').forEach(sw => {
    sw.addEventListener('click', (e) => {
      const btn = e.target.closest('.col-btn');
      if (!btn) return;
      const cols = parseInt(btn.dataset.cols, 10);
      if (btn.classList.contains('active')) return;
      localStorage.setItem(STORAGE_KEY, cols);
      applyCols(cols, true);
    });
  });
})();
