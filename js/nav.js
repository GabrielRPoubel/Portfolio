// ── Referências ──────────────────────────────────────────────────────────────
const backTop    = document.getElementById('back-top');
const navEl      = document.getElementById('nav');
const mobileNavEl = document.getElementById('mobile-nav');
const progressFill = document.getElementById('progress-fill');

let lastScrollY  = window.scrollY;
let navHideTimer = null;

// ── Progress bar ──────────────────────────────────────────────────────────────
function updateProgress() {
  const docH = document.documentElement.scrollHeight - window.innerHeight;
  progressFill.style.width = (docH > 0 ? (window.scrollY / docH) * 100 : 0) + '%';
}

// ── Nav fade ──────────────────────────────────────────────────────────────────
function showNav() {
  navEl.classList.remove('scrolled');
  mobileNavEl.classList.remove('scrolled');
  clearTimeout(navHideTimer);
  navHideTimer = setTimeout(() => {
    navEl.classList.add('scrolled');
    mobileNavEl.classList.add('scrolled');
  }, 2000);
}

window.addEventListener('scroll', () => {
  const currentY = window.scrollY;
  const delta    = currentY - lastScrollY;
  lastScrollY    = currentY;

  backTop.classList.toggle('visible', currentY > 80);
  updateProgress();

  if (currentY <= 80) {
    clearTimeout(navHideTimer);
    navEl.classList.remove('scrolled');
    mobileNavEl.classList.remove('scrolled');
  } else if (delta < 0) {
    showNav();
  } else if (delta > 0) {
    clearTimeout(navHideTimer);
    navEl.classList.add('scrolled');
    mobileNavEl.classList.add('scrolled');
  }
}, { passive: true });

// ── Drawer mobile ─────────────────────────────────────────────────────────────
function openDrawer() {
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawer-overlay').classList.add('open');
}
function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawer-overlay').classList.remove('open');
}

// ── Navegação entre páginas ───────────────────────────────────────────────────
function showPage(id, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav-links a:not(.ig-link), .drawer a').forEach(a => a.classList.remove('active'));
  if (el) el.classList.add('active');
  window.scrollTo(0, 0);
}

// ── Tecla espaço volta ao topo ────────────────────────────────────────────────
window.addEventListener('keydown', e => {
  if (e.key === ' ' && !document.getElementById('lightbox').classList.contains('active')) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});
