// ── Share ─────────────────────────────────────────────────────────────────────
function getShareUrl() {
  return window.location.origin + window.location.pathname + '?foto=' + fotos[lbIndex].n;
}

function openShare() {
  document.getElementById('share-copy-btn').style.opacity = '1';
  document.getElementById('share-copy-btn').style.transition = '';
  document.getElementById('share-overlay').classList.add('open');
}

function closeShare() {
  document.getElementById('share-overlay').classList.remove('open');
}

function closeShareOutside(e) {
  if (e.target === document.getElementById('share-overlay')) closeShare();
}

function copyLink() {
  const url = getShareUrl();
  const doAfter = () => {
    const btn = document.getElementById('share-copy-btn');
    btn.style.transition = 'opacity 0.3s';
    btn.style.opacity = '0';
    setTimeout(() => {
      closeShare();
      btn.style.opacity = '1';
      showToast('LINK COPIADO');
    }, 300);
  };
  navigator.clipboard.writeText(url).then(doAfter).catch(() => {
    try {
      const ta = document.createElement('textarea');
      ta.value = url; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (e) {}
    doAfter();
  });
}

function shareWhatsapp() {
  window.open('https://wa.me/?text=' + encodeURIComponent(getShareUrl()), '_blank');
  closeShare();
}

function shareInstagram() {
  window.open('https://instagram.com/gabrielrpoubel', '_blank');
  closeShare();
}

// ── Toast ─────────────────────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}
