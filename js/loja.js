// Loja: renderiza os produtos do LOJA embutido pelo gerar.py.
// Sem produtos ativos, mantém os fillers estáticos do HTML.
(function () {
  var grid = document.getElementById('grid-loja');
  var catsEl = document.getElementById('loja-cats');
  if (!grid || !catsEl) return;
  var data = (typeof LOJA !== 'undefined' && LOJA) ? LOJA : null;
  var produtos = [];
  var activeCat = 'TODAS';
  function setData(d) {
    data = d;
    produtos = (data && Array.isArray(data.produtos))
      ? data.produtos.filter(function (p) { return p && p.ativo !== false; })
      : [];
  }
  setData(data);

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
  // Peso cobrado: maior entre real e cúbico (C×L×A/6000, padrão Correios).
  function pesoCobrado(p) {
    var real = Number(p.peso_g) / 1000;
    if (!isFinite(real) || real < 0) real = 0;
    var c = Number(p.comp_cm), l = Number(p.larg_cm), a = Number(p.alt_cm);
    var cub = (isFinite(c) && isFinite(l) && isFinite(a) && c > 0 && l > 0 && a > 0)
      ? (c * l * a) / 6000 : 0;
    return Math.max(real, cub);
  }
  // Estimativa anti-prejuízo: base cobre o 1º kg cobrado + por_kg por kg
  // adicional, com margem de segurança; grátis acima do limite.
  function freteValorNum(p) {
    var f = (data && data.frete) || {};
    var base = Number(f.base), porKg = Number(f.por_kg), gratis = Number(f.gratis_acima);
    var margem = Number(f.margem_pct);
    if (!isFinite(base) || base < 0) return 0;
    var preco = Number(p.preco);
    if (isFinite(gratis) && gratis > 0 && isFinite(preco) && preco >= gratis) return 0;
    var extra = Math.max(0, Math.ceil(pesoCobrado(p) - 1));
    var total = base + extra * (isFinite(porKg) && porKg > 0 ? porKg : 0);
    if (isFinite(margem) && margem > 0) total = total * (1 + margem / 100);
    return Math.round(total * 100) / 100;
  }
  function frete(p) {
    var v = freteValorNum(p);
    if (v === 0) {
      var f = (data && data.frete) || {};
      var gratis = Number(f.gratis_acima), preco = Number(p.preco);
      if (isFinite(gratis) && gratis > 0 && isFinite(preco) && preco >= gratis) return 'Frete grátis';
      var base = Number(f.base);
      if (!isFinite(base) || base < 0) return null;
    }
    return 'Frete estimado ' + v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  function orderUrl(p) {
    var msg = 'Olá! Tenho interesse em "' + (p.titulo || 'peça') + '"' +
      (p.id ? ' (' + p.id + ')' : '') + ' — ' + brl(p.preco);
    return 'https://wa.me/?text=' + encodeURIComponent(msg);
  }

  function curCats() {
    return ['TODAS'].concat((((data && Array.isArray(data.categorias)) ? data.categorias : [])).filter(function (c, i, a) {
      return typeof c === 'string' && c && a.indexOf(c) === i &&
        produtos.some(function (p) { return p.categoria === c; });
    }));
  }
  function renderPills() {
    catsEl.textContent = '';
    curCats().forEach(function (c) {
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
      card.onclick = function () { openDetail(p.id); };
      grid.appendChild(card);
    });
  }
  // Compartilhado com o detalhe/carrinho/checkout (js/loja-shop.js).
  window.Loja = {
    data: data,
    produtos: produtos,
    byId: function (id) {
      for (var i = 0; i < produtos.length; i++) {
        if (produtos[i] && produtos[i].id === id) return produtos[i];
      }
      return null;
    },
    imgSrc: imgSrc,
    brl: brl,
    freteTexto: frete,
    pesoCobrado: pesoCobrado,
    freteValor: freteValorNum
  };
  if (produtos.length) {
    renderPills();
    renderGrid();
  }

  // ── Pop-up Em breve: trava a loja; só a tecla K fecha (atalho do dev) ───
  window.openSoon = function () {
    document.body.classList.add('soon-open');
    document.getElementById('soon-overlay').setAttribute('aria-hidden', 'false');
  };
  window.closeSoon = function () {
    document.body.classList.remove('soon-open');
    document.getElementById('soon-overlay').setAttribute('aria-hidden', 'true');
  };
  document.addEventListener('keydown', function (e) {
    if (!document.body.classList.contains('soon-open')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (String(e.key || '').toLowerCase() === 'k') closeSoon();
  });

  // Auto-atualização: se o HTML chegou velho, busca produtos.json fresco
  // (com timestamp anti-cache) e re-renderiza quando mudar. Offline/file://
  // mantém o embutido sem erros.
  try {
    fetch('produtos.json?ts=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (remote) {
        if (!remote || !Array.isArray(remote.produtos)) return;
        var antes = JSON.stringify((data && data.produtos) || []);
        if (JSON.stringify(remote.produtos) === antes) return;
        setData(remote);
        if (activeCat !== 'TODAS' && curCats().indexOf(activeCat) < 0) activeCat = 'TODAS';
        renderPills();
        renderGrid();
      })
      .catch(function () {});
  } catch (e) {}
})();
