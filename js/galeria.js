// ── Galeria: grid com thumbs + spinner ───────────────────────────────────────
const grid = document.getElementById('grid');

const gridObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const div = entry.target;
    const img = div.querySelector('img');

    if (!img.src || img.src === window.location.href) {
      img.src = img.dataset.src;
    }
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('loaded');
      div.classList.add('loaded');
    } else {
      img.onload = () => { img.classList.add('loaded'); div.classList.add('loaded'); };
    }
    gridObserver.unobserve(div);
  });
}, { rootMargin: '200px 0px' });

function buildGrid(fotos) {
  fotos.forEach((p, i) => {
    const gdiv = document.createElement('div');
    gdiv.className = 'grid-item';
    gdiv.onclick = () => openLB(i);

    const gsp = document.createElement('div');
    gsp.className = 'grid-spinner';
    gsp.innerHTML = `<svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="16"/><circle class="arc" cx="18" cy="18" r="16" pathLength="100"/></svg>`;

    const gimg = document.createElement('img');
    gimg.dataset.src = p.thumb;
    gimg.alt = String(p.n);

    gdiv.appendChild(gsp);
    gdiv.appendChild(gimg);
    grid.appendChild(gdiv);
    gridObserver.observe(gdiv);
  });
}
