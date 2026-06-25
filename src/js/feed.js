import { openLB } from './lightbox.js'

const SPINNER_SVG = `<svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="16"/><circle class="arc" cx="18" cy="18" r="16" pathLength="100"/></svg>`

const feedObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return
    const div = entry.target
    const img = div.querySelector('img')

    if (!img.src || img.src === window.location.href) img.src = img.dataset.src

    if (img.complete && img.naturalWidth > 0) {
      div.classList.add('loaded')
    } else {
      img.onload = () => div.classList.add('loaded')
    }
    feedObserver.unobserve(div)

    const next = div.nextElementSibling
    if (next) {
      const ni = next.querySelector('img')
      if (ni?.dataset.src) { const pre = new Image(); pre.src = ni.dataset.src }
    }
  })
}, { rootMargin: '300px 0px' })

export function buildFeed(fotos) {
  const feed = document.getElementById('feed')
  fotos.forEach((p, i) => {
    const div = document.createElement('div')
    div.className = 'feed-item'
    div.onclick = () => openLB(i)

    const spinner = document.createElement('div')
    spinner.className = 'feed-spinner'
    spinner.innerHTML = SPINNER_SVG

    const img = document.createElement('img')
    img.dataset.src = p.src
    img.alt = String(p.n)

    if (i === 0) {
      img.src = p.src
      if (img.complete && img.naturalWidth > 0) div.classList.add('loaded')
      else img.onload = () => div.classList.add('loaded')
    }

    div.append(spinner, img)
    feed.appendChild(div)
    feedObserver.observe(div)
  })
}
