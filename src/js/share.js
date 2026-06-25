import { fotos } from './fotos.js'
import { getCurrentIndex } from './lightbox.js'
import { showToast } from './toast.js'

function getShareUrl() {
  return window.location.origin + window.location.pathname + '?foto=' + fotos[getCurrentIndex()].n
}

export function openShare() {
  const btn = document.getElementById('share-copy-btn')
  btn.style.opacity = '1'
  btn.style.transition = ''
  document.getElementById('share-overlay').classList.add('open')
}

export function closeShare() {
  document.getElementById('share-overlay').classList.remove('open')
}

export function closeShareOutside(e) {
  if (e.target === document.getElementById('share-overlay')) closeShare()
}

export function copyLink() {
  const url = getShareUrl()
  const doAfter = () => {
    const btn = document.getElementById('share-copy-btn')
    btn.style.transition = 'opacity 0.3s'
    btn.style.opacity = '0'
    setTimeout(() => {
      closeShare()
      btn.style.opacity = '1'
      showToast('LINK COPIADO')
    }, 300)
  }
  navigator.clipboard.writeText(url).then(doAfter).catch(() => {
    try {
      const ta = document.createElement('textarea')
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    } catch {}
    doAfter()
  })
}

export function shareWhatsapp() {
  window.open('https://wa.me/?text=' + encodeURIComponent(getShareUrl()), '_blank')
  closeShare()
}

export function shareInstagram() {
  window.open('https://instagram.com/gabrielrpoubel', '_blank')
  closeShare()
}
