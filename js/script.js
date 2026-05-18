// --- Otimizações Aplicadas ---
// Cache de seletores DOM
const lbWrap = lbWrap;

// Função de Throttle para eventos contínuos
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

    // ─── FOTOS ───────────────────────────────────────────────────────────────
  // Gerado automaticamente por gerar.py — não edite manualmente
  const fotos = [
    1,
    2,
    3,
  ].map(n => ({ src: `fotos/${n}.jpg`, alt: `${n}` }));
  // ─────────────────────────────────────────────────────────────────────────

  const feed = document.getElementById('feed');
  const grid = document.getElementById('grid');

  fotos.forEach((p, i) => {
    const fdiv = document.createElement('div');
    fdiv.className = 'feed-item'; fdiv.onclick = () => openLB(i);
    const fimg = document.createElement('img');
    fimg.src = p.src; fimg.alt = p.alt; fimg.loading = 'lazy';
    fdiv.appendChild(fimg); feed.appendChild(fdiv);

    const gdiv = document.createElement('div');
    gdiv.className = 'grid-item'; gdiv.onclick = () => openLB(i);
    const gimg = document.createElement('img');
    gimg.src = p.src; gimg.alt = p.alt; gimg.loading = 'lazy';
    gdiv.appendChild(gimg); grid.appendChild(gdiv);
  });

  function showPage(id, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.nav-links a:not(.ig-link), .drawer a').forEach(a => a.classList.remove('active'));
    if (el) el.classList.add('active');
    window.scrollTo(0, 0);
  }

  // Scroll fade
  window.addEventListener('scroll', () => {
    const gone = window.scrollY > 80;
    document.getElementById('nav').classList.toggle('scrolled', gone);
    document.getElementById('mobile-nav').classList.toggle('scrolled', gone);
  }, { passive: true });

  // Drawer
  function openDrawer() {
    document.getElementById('drawer').classList.add('open');
    document.getElementById('drawer-overlay').classList.add('open');
  }
  function closeDrawer() {
    document.getElementById('drawer').classList.remove('open');
    document.getElementById('drawer-overlay').classList.remove('open');
  }

  // Lightbox
  let lbIndex = 0;
  let lbRotation = 0;
  let uiTimeout = null;

  const lb       = document.getElementById('lightbox');
  const lbImg    = document.getElementById('lb-img');
  const lbCnt    = document.getElementById('lb-counter');
  const fsIcon   = document.getElementById('fs-icon');

  function openLB(i) {
    lbIndex = i; lbRotation = 0;
    updateLB();
    lb.classList.add('active');
    lb.classList.remove('fullscreen-mode', 'ui-hidden');
  }

  function closeLB() {
    lb.classList.remove('active', 'fullscreen-mode', 'ui-hidden');
    if (document.fullscreenElement) document.exitFullscreen();
    clearTimeout(uiTimeout);
  }

  function lbNav(d) {
    lbIndex = (lbIndex + d + fotos.length) % fotos.length;
    lbRotation = 0;
    updateLB();
    showUI();
  }

  function updateLB() {
    lbImg.src = fotos[lbIndex].src;
    lbImg.style.transform = '';
    lbCnt.textContent = (lbIndex + 1) + ' / ' + fotos.length;
  }

  function rotateLB() {
    lbRotation = (lbRotation + 90) % 360;
    lbImg.style.transform = 'rotate(' + lbRotation + 'deg)';
  }

  // Fullscreen: entra no modo CSS + tenta API nativa
  function toggleFS() {
    const isFS = lb.classList.contains('fullscreen-mode');
    if (!isFS) {
      lb.classList.add('fullscreen-mode');
      updateFSIcon(true);
      // tenta tela cheia nativa
      const req = lb.requestFullscreen || lb.webkitRequestFullscreen || lb.mozRequestFullScreen;
      if (req) req.call(lb).catch(() => {});
      // esconde UI após 2s de inatividade
      scheduleHideUI();
    } else {
      exitFS();
    }
  }

  function exitFS() {
    lb.classList.remove('fullscreen-mode', 'ui-hidden');
    updateFSIcon(false);
    clearTimeout(uiTimeout);
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      const ex = document.exitFullscreen || document.webkitExitFullscreen;
      if (ex) ex.call(document).catch(() => {});
    }
  }

  function updateFSIcon(full) {
    if (full) {
      fsIcon.innerHTML = '<path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>';
    } else {
      fsIcon.innerHTML = '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>';
    }
  }

  // Esconder/mostrar UI no fullscreen
  function scheduleHideUI() {
    clearTimeout(uiTimeout);
    uiTimeout = setTimeout(() => {
      if (lb.classList.contains('fullscreen-mode')) lb.classList.add('ui-hidden');
    }, 2500);
  }

  function showUI() {
    lb.classList.remove('ui-hidden');
    if (lb.classList.contains('fullscreen-mode')) scheduleHideUI();
  }

  lb.addEventListener('mousemove', throttle(showUI, 100));
  lb.addEventListener('touchstart', showUI, { passive: true });

  // Sai do fullscreen CSS se API nativa sair
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && lb.classList.contains('fullscreen-mode')) {
      exitFS();
    }
  });
  document.addEventListener('webkitfullscreenchange', () => {
    if (!document.webkitFullscreenElement && lb.classList.contains('fullscreen-mode')) {
      exitFS();
    }
  });

  // Clique no fundo fecha
  lb.addEventListener('click', e => {
    if (e.target === lb || e.target === lbWrap) closeLB();
  });

  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('active')) return;
    if (e.key === 'ArrowRight') lbNav(1);
    if (e.key === 'ArrowLeft')  lbNav(-1);
    if (e.key === 'Escape')     { if (lb.classList.contains('fullscreen-mode')) exitFS(); else closeLB(); }
    if (e.key === 'f' || e.key === 'F') toggleFS();
  });