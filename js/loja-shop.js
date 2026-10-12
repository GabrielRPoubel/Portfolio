// Loja shop: detalhe do produto, frete (CEP/ViaCEP), carrinho,
// checkout e acompanhamento. Usa window.Loja (js/loja.js).
// Sem produtos no catálogo, as páginas mostram estado vazio.
(function () {
  var CART_KEY = 'gp_cart_v1';
  var ORDER_KEY = 'gp_last_order_v1';

  function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function load(k, fb) {
    try {
      var v = JSON.parse(localStorage.getItem(k));
      return v === null || v === undefined ? fb : v;
    } catch (e) { return fb; }
  }
  function getCart() {
    var c = load(CART_KEY, []);
    return Array.isArray(c) ? c : [];
  }
  function setCart(c) { store(CART_KEY, c); updateBadge(); }
  function isSrc(s) {
    return typeof s === 'string' && /^(?!.*\.\.)[A-Za-z0-9_\-./]+\.(jpg|jpeg|png|webp)$/i.test(s);
  }

  // ── Badge do carrinho ───────────────────────────────────────────────
  window.updateBadge = function () {
    var n = getCart().reduce(function (a, it) { return a + (Number(it.qty) || 0); }, 0);
    var spans = document.querySelectorAll('.cart-count');
    for (var i = 0; i < spans.length; i++) {
      spans[i].textContent = n;
      spans[i].style.display = n ? '' : 'none';
    }
  };

  // ── Detalhe do produto ──────────────────────────────────────────────
  var detId = null, detFoto = 1;
  function detProduto() {
    return (window.Loja && window.Loja.byId(detId)) || null;
  }
  function detImagens(p) {
    var imgs = (Array.isArray(p.imagens) ? p.imagens : []).filter(isSrc);
    if (!imgs.length && isSrc(p.thumb)) imgs = [p.thumb];
    return imgs;
  }
  window.openDetail = function (id) {
    if (!window.Loja) return;
    var p = window.Loja.byId(id);
    if (!p) return;
    detId = id;
    detFoto = 1;
    renderDetail();
    showPage('produto');
  };
  function renderDetail() {
    var p = detProduto();
    if (!p) return;
    var L = window.Loja;
    document.getElementById('pd-cat').textContent = p.categoria || '';
    var t = document.getElementById('pd-title');
    t.textContent = p.titulo || 'Sem título';
    document.getElementById('pd-price').textContent = L.brl(p.preco);
    document.getElementById('pd-desc').textContent = p.descricao || '';
    document.getElementById('pd-cep').value = '';
    document.getElementById('pd-frete-result').textContent = '';
    var imgs = detImagens(p);
    if (detFoto < 1 || detFoto > imgs.length) detFoto = 1;
    var main = document.getElementById('pd-img');
    main.src = imgs.length ? imgs[detFoto - 1] : '';
    main.alt = p.titulo || 'Peça';
    document.getElementById('pd-count').textContent = imgs.length ? ('FOTO ' + detFoto + ' DE ' + imgs.length) : '';
    var th = document.getElementById('pd-thumbs');
    th.textContent = '';
    imgs.forEach(function (src, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pd-thumb' + (i + 1 === detFoto ? ' active' : '');
      b.setAttribute('aria-label', 'Foto ' + (i + 1));
      var im = document.createElement('img');
      im.src = src;
      im.alt = 'Foto ' + (i + 1);
      im.loading = 'lazy';
      var num = document.createElement('span');
      num.className = 'pd-num';
      num.textContent = i + 1;
      b.appendChild(im);
      b.appendChild(num);
      b.onclick = function () { detFoto = i + 1; renderDetail(); };
      th.appendChild(b);
    });
  }
  window.selectFotoDetalhe = function (n) {
    detFoto = n;
    renderDetail();
  };

  // ── Frete: valida CEP (ViaCEP) + estimativa pelo peso da ferramenta ──
  function cepNums(v) { return String(v || '').replace(/\D/g, ''); }
  window.calcFreteDetalhe = function () {
    var p = detProduto();
    if (!p || !window.Loja) return;
    var out = document.getElementById('pd-frete-result');
    var cep = cepNums(document.getElementById('pd-cep').value);
    if (cep.length !== 8) {
      out.textContent = 'Digite um CEP com 8 dígitos.';
      return;
    }
    var L = window.Loja;
    var valor = L.freteValor(p);
    var txt = valor === 0 ? 'Frete grátis' : L.brl(valor);
    out.textContent = 'Calculando…';
    fetch('https://viacep.com.br/ws/' + cep + '/json/')
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && !j.erro && j.localidade) {
          out.textContent = 'Para ' + j.localidade + '/' + j.uf + ': ' + txt + ' (simulação Correios pelo peso)';
        } else {
          out.textContent = 'CEP não encontrado. Estimativa: ' + txt + ' (simulação)';
        }
      })
      .catch(function () {
        out.textContent = 'Sem conexão para validar o CEP. Estimativa: ' + txt + ' (simulação)';
      });
  };

  // ── Comprar / carrinho ────────────────────────────────────────────────
  window.comprarDetalhe = function () {
    var p = detProduto();
    if (!p) return;
    var cart = getCart();
    var found = null;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === p.id && Number(cart[i].foto) === detFoto) { found = cart[i]; break; }
    }
    if (found) found.qty = (Number(found.qty) || 0) + 1;
    else cart.push({ id: p.id, foto: detFoto, qty: 1 });
    setCart(cart);
    showToast('ADICIONADO AO CARRINHO');
  };
  function cartItems() {
    if (!window.Loja) return [];
    var cart = getCart();
    var valid = [];
    cart.forEach(function (it) {
      var p = window.Loja.byId(it.id);
      if (!p) return;
      var imgs = (Array.isArray(p.imagens) ? p.imagens : []).filter(isSrc);
      if (!imgs.length && isSrc(p.thumb)) imgs = [p.thumb];
      var foto = Number(it.foto);
      if (!foto || foto < 1 || foto > imgs.length) foto = 1;
      valid.push({ p: p, foto: foto, qty: Math.max(1, Number(it.qty) || 1), img: imgs[foto - 1] || '' });
    });
    return valid;
  }
  function cartTotais(items) {
    var L = window.Loja;
    var sub = items.reduce(function (a, it) { return a + Number(it.p.preco || 0) * it.qty; }, 0);
    var f = (L.data && L.data.frete) || {};
    var gratis = Number(f.gratis_acima);
    var frete = 0;
    if (!(isFinite(gratis) && gratis > 0 && sub >= gratis)) {
      frete = items.reduce(function (a, it) { return a + L.freteValor(it.p) * it.qty; }, 0);
    }
    return { sub: sub, frete: frete, total: sub + frete };
  }
  window.renderCarrinho = function () {
    if (!window.Loja) return;
    var L = window.Loja;
    var items = cartItems();
    setCart(items.map(function (it) { return { id: it.p.id, foto: it.foto, qty: it.qty }; }));
    var list = document.getElementById('cart-list');
    list.textContent = '';
    var empty = document.getElementById('cart-empty');
    var foot = document.getElementById('cart-foot');
    if (!items.length) {
      empty.style.display = '';
      foot.style.display = 'none';
      return;
    }
    empty.style.display = 'none';
    foot.style.display = '';
    items.forEach(function (it) {
      var row = document.createElement('div');
      row.className = 'cart-row';
      var im = document.createElement('img');
      im.className = 'cart-thumb';
      im.src = it.img;
      im.alt = it.p.titulo || 'Peça';
      var mid = document.createElement('div');
      mid.className = 'cart-mid';
      var nm = document.createElement('div');
      nm.className = 'cart-name';
      nm.textContent = it.p.titulo || 'Sem título';
      var fn = document.createElement('div');
      fn.className = 'cart-foto';
      fn.textContent = 'Foto nº ' + it.foto;
      var q = document.createElement('div');
      q.className = 'cart-qty';
      var minus = document.createElement('button');
      minus.type = 'button';
      minus.textContent = '−';
      minus.onclick = function () { changeQty(it.p.id, it.foto, -1); };
      var qv = document.createElement('span');
      qv.textContent = it.qty;
      var plus = document.createElement('button');
      plus.type = 'button';
      plus.textContent = '+';
      plus.onclick = function () { changeQty(it.p.id, it.foto, 1); };
      q.appendChild(minus);
      q.appendChild(qv);
      q.appendChild(plus);
      mid.appendChild(nm);
      mid.appendChild(fn);
      mid.appendChild(q);
      var right = document.createElement('div');
      right.className = 'cart-right';
      var val = document.createElement('div');
      val.className = 'cart-val';
      val.textContent = L.brl(Number(it.p.preco || 0) * it.qty);
      var rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'cart-rm';
      rm.textContent = '× remover';
      rm.onclick = function () { removeItem(it.p.id, it.foto); };
      right.appendChild(val);
      right.appendChild(rm);
      row.appendChild(im);
      row.appendChild(mid);
      row.appendChild(right);
      list.appendChild(row);
    });
    var t = cartTotais(items);
    document.getElementById('cart-subtotal').textContent = L.brl(t.sub);
    document.getElementById('cart-frete').textContent = t.frete === 0 ? 'Grátis' : L.brl(t.frete);
    document.getElementById('cart-total').textContent = L.brl(t.total);
  };
  function changeQty(id, foto, d) {
    var cart = getCart();
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === id && Number(cart[i].foto) === foto) {
        cart[i].qty = Math.max(1, (Number(cart[i].qty) || 1) + d);
      }
    }
    setCart(cart);
    renderCarrinho();
  }
  function removeItem(id, foto) {
    setCart(getCart().filter(function (it) { return !(it.id === id && Number(it.foto) === foto); }));
    renderCarrinho();
  }

  // ── Checkout ──────────────────────────────────────────────────────────
  window.renderCheckout = function () {
    if (!window.Loja) return;
    var items = cartItems();
    var box = document.getElementById('co-resumo');
    box.textContent = '';
    document.getElementById('co-erro').textContent = '';
    if (!items.length) {
      box.textContent = 'Carrinho vazio.';
      return;
    }
    var t = cartTotais(items);
    var L = window.Loja;
    items.forEach(function (it) {
      var d = document.createElement('div');
      d.className = 'co-item';
      d.textContent = (it.p.titulo || 'Peça') + ' (foto nº ' + it.foto + ') × ' + it.qty + ' — ' + L.brl(Number(it.p.preco || 0) * it.qty);
      box.appendChild(d);
    });
    var tot = document.createElement('div');
    tot.className = 'co-total';
    tot.textContent = 'Total ' + L.brl(t.total) + (t.frete === 0 ? ' (frete grátis)' : ' (inclui ' + L.brl(t.frete) + ' de frete)');
    box.appendChild(tot);
  };
  window.buscarCepCheckout = function () {
    var cep = cepNums(document.getElementById('co-cep').value);
    var addr = document.getElementById('co-addr');
    if (cep.length !== 8) {
      addr.textContent = 'CEP inválido (8 dígitos).';
      return;
    }
    addr.textContent = 'Buscando…';
    fetch('https://viacep.com.br/ws/' + cep + '/json/')
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && !j.erro) {
          document.getElementById('co-log').value = j.logradouro || '';
          document.getElementById('co-bairro').value = j.bairro || '';
          document.getElementById('co-cid').value = j.localidade || '';
          document.getElementById('co-uf').value = j.uf || '';
          addr.textContent = j.localidade + '/' + j.uf + ' ✓';
        } else {
          addr.textContent = 'CEP não encontrado. Preencha manual.';
        }
      })
      .catch(function () {
        addr.textContent = 'Sem conexão. Preencha manual.';
      });
  };
  window.confirmarPedido = function (e) {
    if (e) e.preventDefault();
    var items = cartItems();
    var err = document.getElementById('co-erro');
    if (!items.length) {
      err.textContent = 'Carrinho vazio.';
      return false;
    }
    function v(id) { return document.getElementById(id).value.trim(); }
    var nome = v('co-nome'), email = v('co-email'), fone = v('co-fone');
    var cep = cepNums(v('co-cep'));
    var log = v('co-log'), num = v('co-num'), comp = v('co-comp');
    var bairro = v('co-bairro'), cid = v('co-cid'), uf = v('co-uf').toUpperCase();
    if (!nome) { err.textContent = 'Informe seu nome.'; return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = 'E-mail inválido.'; return false; }
    if (cepNums(fone).length < 10) { err.textContent = 'Telefone inválido (com DDD).'; return false; }
    if (cep.length !== 8) { err.textContent = 'CEP inválido (8 dígitos).'; return false; }
    if (!log || !num || !bairro || !cid || uf.length !== 2) { err.textContent = 'Endereço incompleto.'; return false; }
    var t = cartTotais(items);
    var now = new Date();
    var code = 'GP-' + now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') + '-' +
      Math.random().toString(36).slice(2, 6).toUpperCase();
    var order = {
      code: code,
      data: now.toISOString(),
      items: items.map(function (it) {
        return { id: it.p.id, titulo: it.p.titulo, foto: it.foto, qty: it.qty, preco: Number(it.p.preco || 0), img: it.img };
      }),
      subtotal: t.sub, frete: t.frete, total: t.total,
      cliente: { nome: nome, email: email, fone: fone },
      entrega: { cep: cep, log: log, num: num, comp: comp, bairro: bairro, cid: cid, uf: uf },
      status: 'em progresso'
    };
    store(ORDER_KEY, order);
    setCart([]);
    renderCarrinho();
    showPage('andamento');
    renderAndamento();
    return false;
  };

  // ── Aba em progresso ──────────────────────────────────────────────────
  window.renderAndamento = function () {
    var box = document.getElementById('and-wrap');
    box.textContent = '';
    var o = load(ORDER_KEY, null);
    if (!o) {
      var p = document.createElement('p');
      p.className = 'and-vazio';
      p.textContent = 'Nenhum pedido em andamento.';
      box.appendChild(p);
      return;
    }
    function line(k, val) {
      var d = document.createElement('div');
      d.className = 'and-line';
      var a = document.createElement('span');
      a.textContent = k;
      var b = document.createElement('span');
      b.textContent = val;
      d.appendChild(a);
      d.appendChild(b);
      box.appendChild(d);
    }
    var code = document.createElement('div');
    code.className = 'and-code';
    code.textContent = o.code;
    box.appendChild(code);
    line('Status', 'EM PROGRESSO — pagamento em breve');
    line('Itens', o.items.map(function (it) { return it.titulo + ' (foto nº ' + it.foto + ') × ' + it.qty; }).join('; '));
    line('Total', (window.Loja ? window.Loja.brl(o.total) : o.total));
    line('Entrega', o.entrega.log + ', ' + o.entrega.num + ' — ' + o.entrega.bairro + ', ' + o.entrega.cid + '/' + o.entrega.uf + ' — CEP ' + o.entrega.cep);
    var back = document.createElement('button');
    back.className = 'loja-cta loja-cta-sm';
    back.textContent = 'VOLTAR À LOJA';
    back.onclick = function () { showPage('loja'); };
    box.appendChild(back);
  };

  updateBadge();
})();
