// ── Feed: lazy load + spinner + fade in ──────────────────────────────────────
const feed = document.getElementById('feed');

const feedObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const div = entry.target;
    const img = div.querySelector('img');

    if (!img.src || img.src === window.location.href) {
      img.src = img.dataset.src;
    }
    if (img.complete && img.naturalWidth > 0) {
      div.classList.add('loaded');
    } else {
      img.onload = () => div.classList.add('loaded');
    }
    feedObserver.unobserve(div);

    // Preload próxima
    const next = div.nextElementSibling;
    if (next) {
      const ni = next.querySelector('img');
      if (ni && ni.dataset.src) { const pre = new Image(); pre.src = ni.dataset.src; }
    }
  });
}, { rootMargin: '300px 0px' });

function buildFeed(fotos) {
  fotos.forEach((p, i) => {
    const fdiv = document.createElement('div');
    fdiv.className = 'feed-item';
    fdiv.onclick = () => openLB(i);

    const fsp = document.createElement('div');
    fsp.className = 'feed-spinner';
    fsp.innerHTML = `<svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="16"/><circle class="arc" cx="18" cy="18" r="16" pathLength="100"/></svg>`;

    const fimg = document.createElement('img');
    fimg.dataset.src = p.src;
    fimg.alt = String(p.n);
    if (i === 0) {
      fimg.src = p.src;
      if (fimg.complete && fimg.naturalWidth > 0) {
        fdiv.classList.add('loaded');
      } else {
        fimg.onload = () => fdiv.classList.add('loaded');
      }
    }

    fdiv.appendChild(fsp);
    fdiv.appendChild(fimg);
    feed.appendChild(fdiv);
    feedObserver.observe(fdiv);
  });
}
