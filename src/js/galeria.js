import { openLB } from './lightbox.js'

const SPINNER_SVG = `<svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="16"/><circle class="arc" cx="18" cy="18" r="16" pathLength="100"/></svg>`

const gridObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return
    const div = entry.target
    const img = div.querySelector('img')

    if (!img.src || img.src === window.location.href) img.src = img.dataset.src

    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('loaded')
      div.classList.add('loaded')
    } else {
      img.onload = () => { img.classList.add('loaded'); div.classList.add('loaded') }
    }
    gridObserver.unobserve(div)
  })
}, { rootMargin: '200px 0px' })

export function buildGrid(fotos) {
  const grid = document.getElementById('grid')
  fotos.forEach((p, i) => {
    const div = document.createElement('div')
    div.className = 'grid-item'
    div.onclick = () => openLB(i)

    const spinner = document.createElement('div')
    spinner.className = 'grid-spinner'
    spinner.innerHTML = SPINNER_SVG

    const img = document.createElement('img')
    img.dataset.src = p.thumb
    img.alt = String(p.n)

    div.append(spinner, img)
    grid.appendChild(div)
    gridObserver.observe(div)
  })
}
