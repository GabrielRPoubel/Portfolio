// Loja: renderiza os produtos do LOJA embutido pelo gerar.py.
// Sem produtos ativos, mantém os fillers estáticos do HTML.
(function () {
  var grid = document.getElementById('grid-loja');
  var catsEl = document.getElementById('loja-cats');
  if (!grid || !catsEl) return;
  var data = (typeof LOJA !== 'undefined' && LOJA) ? LOJA : null;
  var produtos = (data && Array.isArray(data.produtos))
    ? data.produtos.filter(function (p) { return p && p.ativo !== false; })
    : [];
  if (!produtos.length) return;

  // Só caminhos relativos simples (anti XSS / path traversal).
  var SAFE_SRC = /^(?!.*\.\.)[A-Za-z0-9_\-./]+\.(jpg|jpeg|png|webp)$/i;
  function imgSrc(p) {
    var cands = [];
    if (p.thumb) cands.push(p.thumb);
    if (Array.isArray(p.imagens)) cands = cands.concat(p.imagens);
    for (var i = 0; i < cands.length; i++) {
      if (typeof cands[i] === 'string' && SAFE_SRC.test(cands[i])) return cands[i];
    }
    return null;
  }
  function brl(v) {
    var n = Number(v);
    if (!isFinite(n)) return 'R$ —';
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  // Estimativa: base cobre o 1º kg + por_kg por kg adicional; grátis acima do limite.
  function frete(p) {
    var f = (data && data.frete) || {};
    var base = Number(f.base), porKg = Number(f.por_kg), gratis = Number(f.gratis_acima);
    if (!isFinite(base) || base < 0) return null;
    var preco = Number(p.preco);
    if (isFinite(gratis) && gratis > 0 && isFinite(preco) && preco >= gratis) return 'Frete grátis';
    var kg = Number(p.peso_g) / 1000;
    if (!isFinite(kg) || kg < 0) kg = 0;
    var extra = Math.max(0, Math.ceil(kg - 1));
    var total = base + extra * (isFinite(porKg) && porKg > 0 ? porKg : 0);
    return 'Frete estimado ' + total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  function orderUrl(p) {
    var msg = 'Olá! Tenho interesse em "' + (p.titulo || 'peça') + '"' +
      (p.id ? ' (' + p.id + ')' : '') + ' — ' + brl(p.preco);
    return 'https://wa.me/?text=' + encodeURIComponent(msg);
  }

  var cats = ['TODAS'].concat((((data && Array.isArray(data.categorias)) ? data.categorias : [])).filter(function (c, i, a) {
    return typeof c === 'string' && c && a.indexOf(c) === i &&
      produtos.some(function (p) { return p.categoria === c; });
  }));
  var activeCat = 'TODAS';
  function renderPills() {
    catsEl.textContent = '';
    cats.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'loja-pill' + (c === activeCat ? ' active' : '');
      b.textContent = c;
      b.style.cursor = 'pointer';
      b.setAttribute('aria-pressed', c === activeCat ? 'true' : 'false');
      b.onclick = function () { activeCat = c; renderPills(); renderGrid(); };
      catsEl.appendChild(b);
    });
  }
  function renderGrid() {
    grid.textContent = '';
    produtos.filter(function (p) { return activeCat === 'TODAS' || p.categoria === activeCat; }).forEach(function (p) {
      var card = document.createElement('article');
      card.className = 'loja-card';
      var ph = document.createElement('div');
      ph.className = 'loja-ph';
      var src = imgSrc(p);
      if (src) {
        var im = document.createElement('img');
        im.src = src;
        im.alt = String(p.titulo || 'Peça');
        im.loading = 'lazy';
        im.decoding = 'async';
        im.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
        ph.appendChild(im);
      } else {
        var em = document.createElement('span');
        em.className = 'loja-ph-em';
        em.textContent = 'Em breve';
        var ref = document.createElement('span');
        ref.className = 'loja-ph-ref';
        ref.textContent = String(p.id || '').toUpperCase();
        ph.appendChild(em);
        ph.appendChild(ref);
      }
      var info = document.createElement('div');
      info.className = 'loja-info';
      var nm = document.createElement('div');
      nm.className = 'loja-name';
      nm.textContent = p.titulo || 'Sem título';
      var pr = document.createElement('div');
      pr.className = 'loja-price';
      pr.textContent = brl(p.preco);
      info.appendChild(nm);
      info.appendChild(pr);
      var fest = frete(p);
      if (fest) {
        var fr = document.createElement('div');
        fr.className = 'loja-frete';
        fr.textContent = fest;
        info.appendChild(fr);
      }
      card.appendChild(ph);
      card.appendChild(info);
      card.style.cursor = 'pointer';
      card.onclick = function () { window.open(orderUrl(p), '_blank'); };
      grid.appendChild(card);
    });
  }
  renderPills();
  renderGrid();
})();
