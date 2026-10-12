// POST /api/mp-preference — cria preferência do Mercado Pago (Checkout Pro).
// Os totais são RECALCULADOS no servidor a partir de produtos.json
// (mesma fórmula do site); o total enviado pelo navegador é só conferência.
// Env: MERCADOPAGO_ACCESS_TOKEN (use um token TEST- para sandbox),
//      SITE_URL (opcional; padrão https://www.gabrielpoubel.com.br).
var CATALOGO = require('../produtos.json');

function num(v, fb) {
  v = Number(v);
  return isFinite(v) ? v : fb;
}
// Espelho exato de pesoCobrado() em js/loja.js.
function pesoCobrado(p) {
  var real = Number(p.peso_g) / 1000;
  if (!isFinite(real) || real < 0) real = 0;
  var c = Number(p.comp_cm), l = Number(p.larg_cm), a = Number(p.alt_cm);
  var cub = (isFinite(c) && isFinite(l) && isFinite(a) && c > 0 && l > 0 && a > 0)
    ? (c * l * a) / 6000 : 0;
  return Math.max(real, cub);
}
// Espelho exato de freteValorNum() em js/loja.js (por produto, com margem).
function freteValorNum(p, f) {
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
function round2(v) { return Math.round(v * 100) / 100; }

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'metodo' });
    return;
  }
  var token = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
  if (!token) {
    // Sem token: o site usa o link de pagamento manual (reserva).
    res.status(501).json({ error: 'nao_configurado' });
    return;
  }
  var body = req.body || {};
  var items = Array.isArray(body.items) ? body.items : [];
  if (!items.length || items.length > 50) {
    res.status(400).json({ error: 'carrinho' });
    return;
  }
  var cli = body.cliente || {};
  var email = String(cli.email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'email' });
    return;
  }
  var prods = {};
  (CATALOGO.produtos || []).forEach(function (p) {
    if (p && p.id && p.ativo !== false) prods[String(p.id)] = p;
  });
  var f = CATALOGO.frete || {};
  var mpItems = [];
  var sub = 0;
  for (var i = 0; i < items.length; i++) {
    var p = prods[String(items[i].id || '')];
    var qty = Math.floor(num(items[i].qty, 0));
    if (!p || qty < 1 || qty > 99) {
      res.status(400).json({ error: 'item' });
      return;
    }
    var preco = round2(num(p.preco, 0));
    if (!(preco > 0)) {
      res.status(400).json({ error: 'item' });
      return;
    }
    sub = round2(sub + preco * qty);
    mpItems.push({
      id: String(p.id).slice(0, 30),
      title: String(p.titulo || 'Peça').slice(0, 100),
      quantity: qty,
      unit_price: preco,
      currency_id: 'BRL'
    });
  }
  // Mesma regra do carrinho: grátis pelo subtotal; senão frete por produto.
  var gratis = num(f.gratis_acima, 0);
  var frete = 0;
  if (!(gratis > 0 && sub >= gratis)) {
    for (var j = 0; j < items.length; j++) {
      frete = frete + freteValorNum(prods[String(items[j].id)], f) * Math.floor(num(items[j].qty, 0));
    }
    frete = round2(frete);
  }
  var total = round2(sub + frete);
  if (Math.abs(total - num(body.total, NaN)) > 0.02) {
    res.status(400).json({ error: 'total' });
    return;
  }
  if (frete > 0) {
    mpItems.push({ id: 'frete', title: 'Frete', quantity: 1, unit_price: frete, currency_id: 'BRL' });
  }
  var base = String(process.env.SITE_URL || 'https://www.gabrielpoubel.com.br').replace(/\/$/, '');
  var code = String(body.code || ('GP-' + Date.now())).slice(0, 40);
  var MercadoPago;
  try {
    MercadoPago = require('mercadopago');
  } catch (e) {
    res.status(500).json({ error: 'sdk' });
    return;
  }
  var result;
  try {
    var client = new MercadoPago.MercadoPagoConfig({ accessToken: token });
    var pref = new MercadoPago.Preference(client);
    result = await pref.create({
      body: {
        items: mpItems,
        payer: { name: String(cli.nome || '').slice(0, 60), email: email },
        back_urls: {
          success: base + '/#/andamento',
          failure: base + '/#/checkout',
          pending: base + '/#/andamento'
        },
        auto_return: 'approved',
        external_reference: code,
        statement_descriptor: 'GPOUBEL'
      }
    });
  } catch (e) {
    res.status(502).json({ error: 'mp', detalhe: String((e && e.message) || e).slice(0, 200) });
    return;
  }
  var url = token.indexOf('TEST-') === 0 ? result.sandbox_init_point : result.init_point;
  res.status(200).json({ init_point: url || result.init_point });
};
