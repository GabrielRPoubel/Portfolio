import '../css/main.css'
import { fotos } from './fotos.js'
import { showPage, openDrawer, closeDrawer } from './nav.js'
import { openLB, closeLB, lbNav, toggleFS, toggleExif, openFromUrl } from './lightbox.js'
import { openShare, closeShare, closeShareOutside, copyLink, shareWhatsapp, shareInstagram } from './share.js'
import { buildFeed } from './feed.js'
import { buildGrid } from './galeria.js'

// ── Proteção de download ──────────────────────────────────────────────────────
document.addEventListener('contextmenu', e => {
  if (e.target.tagName === 'IMG') e.preventDefault()
})
document.addEventListener('dragstart', e => {
  if (e.target.tagName === 'IMG') e.preventDefault()
})
document.addEventListener('keydown', e => {
  if (document.getElementById('lightbox').classList.contains('active')) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'u')) e.preventDefault()
  }
}, true)

// Tecla espaço volta ao topo (fora do lightbox)
window.addEventListener('keydown', e => {
  if (e.key === ' ' && !document.getElementById('lightbox').classList.contains('active')) {
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
})

// Back to top button
document.getElementById('back-top').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

// ── Init ──────────────────────────────────────────────────────────────────────
buildFeed(fotos)
buildGrid(fotos)
openFromUrl()

// ── Expõe funções para o HTML (onclick="...") ─────────────────────────────────
// Necessário porque o Vite não expõe módulos ao escopo global por padrão
Object.assign(window, {
  showPage, openDrawer, closeDrawer,
  openLB, closeLB, lbNav, toggleFS, toggleExif,
  openShare, closeShare, closeShareOutside, copyLink, shareWhatsapp, shareInstagram,
})
