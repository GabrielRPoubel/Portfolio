import { fotos } from './fotos.js'
import { showToast } from './toast.js'

const lb      = document.getElementById('lightbox')
const lbImg   = document.getElementById('lb-img')
const lbCnt   = document.getElementById('lb-counter')
const fsIcon  = document.getElementById('fs-icon')

let lbIndex   = 0
let uiTimeout = null
let exifData  = {}
let exifVisible = false

// ── EXIF ─────────────────────────────────────────────────────────────────────
fetch('fotos.json')
  .then(r => r.json())
  .then(data => { data.forEach(f => { exifData[f.n] = f.exif || {} }) })
  .catch(() => {})

export function toggleExif() {
  exifVisible = !exifVisible
  document.getElementById('exif-panel').classList.toggle('visible', exifVisible)
}

function renderExif(n) {
  const e = exifData[n] || {}
  const set = (rowId, valId, val) => {
    document.getElementById(valId).textContent = val || ''
    document.getElementById(rowId).style.display = val ? 'flex' : 'none'
  }
  set('exif-camera-row', 'exif-camera', e.camera)
  set('exif-lens-row',   'exif-lens',   e.lens)
  set('exif-exp-row',    'exif-exp',    e.exposure)
  set('exif-ap-row',     'exif-ap',     e.aperture)
  set('exif-iso-row',    'exif-iso',    e.iso)
  set('exif-fl-row',     'exif-fl',     e.focal)
  exifVisible = false
  document.getElementById('exif-panel').classList.remove('visible')
}

// ── Abrir / fechar ────────────────────────────────────────────────────────────
export function openLB(i) {
  lbIndex = i
  updateLB()
  lb.classList.add('active')
  lb.classList.remove('fullscreen-mode', 'ui-hidden')
  document.body.classList.add('lb-open')
  history.replaceState(null, '', '?foto=' + fotos[i].n)
}

export function closeLB() {
  lb.classList.remove('active', 'fullscreen-mode', 'ui-hidden')
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
  clearTimeout(uiTimeout)
  document.body.classList.remove('lb-open')
  history.replaceState(null, '', window.location.pathname)
}

export function lbNav(d) {
  lbIndex = (lbIndex + d + fotos.length) % fotos.length
  updateLB()
  showUI()
  history.replaceState(null, '', '?foto=' + fotos[lbIndex].n)
}

function updateLB() {
  lbImg.src = fotos[lbIndex].src
  lbImg.style.transform = ''
  lbCnt.textContent = (lbIndex + 1) + ' / ' + fotos.length
  renderExif(fotos[lbIndex].n)
  ;[-1, 1].forEach(d => {
    const idx = (lbIndex + d + fotos.length) % fotos.length
    const pre = new Image(); pre.src = fotos[idx].src
  })
}

export function openFromUrl() {
  const n = new URLSearchParams(window.location.search).get('foto')
  if (n) {
    const idx = fotos.findIndex(f => String(f.n) === n)
    if (idx >= 0) openLB(idx)
  }
}

// ── Fullscreen ────────────────────────────────────────────────────────────────
export function toggleFS() {
  if (!lb.classList.contains('fullscreen-mode')) {
    lb.classList.add('fullscreen-mode')
    updateFSIcon(true)
    const req = lb.requestFullscreen || lb.webkitRequestFullscreen || lb.mozRequestFullScreen
    if (req) req.call(lb).catch(() => {})
    scheduleHideUI()
  } else {
    exitFS()
  }
}

function exitFS() {
  lb.classList.remove('fullscreen-mode', 'ui-hidden')
  updateFSIcon(false)
  clearTimeout(uiTimeout)
  if (screen.orientation?.unlock) screen.orientation.unlock()
  if (document.fullscreenElement || document.webkitFullscreenElement) {
    const ex = document.exitFullscreen || document.webkitExitFullscreen
    if (ex) ex.call(document).catch(() => {})
  }
}

function updateFSIcon(full) {
  fsIcon.innerHTML = full
    ? '<path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>'
    : '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>'
}

function scheduleHideUI() {
  clearTimeout(uiTimeout)
  uiTimeout = setTimeout(() => {
    if (lb.classList.contains('fullscreen-mode')) lb.classList.add('ui-hidden')
  }, 2500)
}

function showUI() {
  lb.classList.remove('ui-hidden')
  if (lb.classList.contains('fullscreen-mode')) scheduleHideUI()
}

lb.addEventListener('mousemove', showUI)
lb.addEventListener('touchstart', showUI, { passive: true })

document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && lb.classList.contains('fullscreen-mode')) exitFS()
})
document.addEventListener('webkitfullscreenchange', () => {
  if (!document.webkitFullscreenElement && lb.classList.contains('fullscreen-mode')) exitFS()
})

lb.addEventListener('click', e => {
  if (e.target === lb || e.target === document.getElementById('lb-wrap')) closeLB()
})

// ── Swipe ─────────────────────────────────────────────────────────────────────
let swipeX = 0, swipeY = 0
lb.addEventListener('touchstart', e => {
  swipeX = e.touches[0].clientX
  swipeY = e.touches[0].clientY
}, { passive: true })
lb.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - swipeX
  const dy = e.changedTouches[0].clientY - swipeY
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) lbNav(dx < 0 ? 1 : -1)
}, { passive: true })

// ── Teclado ───────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (!lb.classList.contains('active')) return
  if (e.key === 'ArrowRight') lbNav(1)
  if (e.key === 'ArrowLeft')  lbNav(-1)
  if (e.key === 'Escape') { lb.classList.contains('fullscreen-mode') ? exitFS() : closeLB() }
  if (e.key === 'f' || e.key === 'F') toggleFS()
  if (e.key === ' ') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }
})

// ── Share: exporta lbIndex atual para share.js ────────────────────────────────
export function getCurrentIndex() { return lbIndex }
