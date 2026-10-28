// Multi-brand official stores → The Collection (lx-catalog "ingest", priced server-side with the Luxella formula).
// Stores: SSENSE (Canada, CAD + 13% tax), Flannels (UK, GBP), Nordstrom Rack (US), Ted Baker (official store).
// Gilt (DataDome captcha) and Saks Off 5th (online store closed) are not scrapeable — see notes at the bottom.
// Usage: LX_CAT_KEY=... CHROME=/path/to/chrome node scripts/market_scrape.js ssense,flannels,rack,tedbaker
const fs = require('fs'); const path = require('path');
const { chromium } = require('playwright');
const KEY = process.env.LX_CAT_KEY; const FN = 'https://qzripzgbstvxkfobzhyv.supabase.co/functions/v1/lx-catalog';
const EXE = process.env.CHROME || undefined; const CAP = Number(process.env.CAP || 1500);
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clean = s => String(s || '').replace(/&nbsp;/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

// ---------- brands: same list the edge function uses (BR) ----------
const fold = x => String(x || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9&]+/g, ' ').trim();
let BR = [];
try { const src = fs.readFileSync(path.join(__dirname, '../supabase/functions/lx-catalog/index.ts'), 'utf8'); BR = JSON.parse(src.match(/const BR = (\[[^\]]+\])/)[1]); } catch (e) { console.log('BR list not found', e.message); process.exit(1); }
const ALIAS = { 'kate spade new york': 'Kate Spade', 'boss': 'Hugo Boss', 'boss black': 'Hugo Boss', 'hugo': 'Hugo Boss', 'off white': 'Off-White', 'chloe': 'Chloé', 'lauren ralph lauren': 'Ralph Lauren', 'michael michael kors': 'Michael Kors', 'dr martens': 'Dr. Martens', 'alaia': 'Alaïa', 'bulgari': 'Bvlgari', 'emporio armani ea7': 'EA7', 'ea7 emporio armani': 'EA7', 'ugg australia': 'UGG', 'jw pei': 'JW Pei', 'ami alexandre mattiussi': 'Ami Paris', 'ami paris': 'Ami Paris', 'mm6 maison margiela': 'Maison Margiela', 'polo ralph lauren': 'Polo Ralph Lauren' };
const BRF = BR.map(b => [fold(b), b]).sort((a, b) => b[0].length - a[0].length);
// Brands we already take from their own official store/outlet — skip them here so pieces never show twice.
const SKIP = new Set(['Michael Kors', 'Coach', 'Kate Spade', 'Tory Burch']);
function brandOf(raw) { const f = fold(raw); if (!f) return null; if (ALIAS[f]) return ALIAS[f]; for (const [k, v] of BRF) if (f === k || (k.length > 2 && f.startsWith(k + ' '))) return v; return null; }
const keepBrand = raw => { const b = brandOf(raw); return b && !SKIP.has(b) ? b : null; };

// ---------- quote check (mirror of the edge function, used only to skip pieces over ₹1 lakh) ----------
const FX = { USD: 95.5, CAD: 70, GBP: 129 };
const kgFor = t => { const s = String(t).toLowerCase();
  if (/wallet|card case|card holder|cardholder|pouch|wristlet|key ?(fob|ring)|charm|coin|belt|sunglass|cap\b|hat\b/.test(s)) return 0.3; if (/watch/.test(s)) return 0.4; if (/necklace|bracelet|earring|\bring\b|jewel/.test(s)) return 0.3;
  if (/boot/.test(s)) return 1.8; if (/sneaker|trainer|shoe|sandal|loafer|heel|pump|flat|mule|slide|espadrille|footwear/.test(s)) return 1.2;
  if (/tote|satchel|carryall|backpack|duffle|weekender|large|briefcase|suitcase|luggage/.test(s)) return 1.2; if (/crossbody|mini|small|camera|belt bag|phone/.test(s)) return 0.6;
  if (/bag|shoulder|hobo|bucket|clutch/.test(s)) return 0.9; if (/jacket|coat|dress|sweater|shirt|top|pant|skirt|hoodie|scarf|knit|jean|trouser/.test(s)) return 0.5; return 0.6; };
function underCap(amount, cur, tax, text, step = 0.5) { const kg = Math.max(step, Math.ceil(kgFor(text) / step) * step); const landed = amount * FX[cur] * (1 + tax) + kg * 1250 + 150; return Math.ceil(landed * 1.25 / 100) * 100 <= 100000; }
const SZ = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', 'XXXL'];
const sortSizes = a => [...new Set(a)].filter(s => s && !/^(adults?|one size|os|o\/s|tu|uni|no size)$/i.test(s)).sort((x, y) => { const i = SZ.indexOf(String(x).toUpperCase()), j = SZ.indexOf(String(y).toUpperCase()); if (i >= 0 && j >= 0) return i - j; const nx = parseFloat(String(x).replace(/^[A-Z]+\s*/i, '')), ny = parseFloat(String(y).replace(/^[A-Z]+\s*/i, '')); if (!isNaN(nx) && !isNaN(ny)) return nx - ny; return String(x).localeCompare(String(y)); });
const trendOf = (pos, total, reviews) => { const r = 70 * (1 - Math.min(pos, total) / Math.max(1, total)); const v = reviews ? 30 * Math.min(1, Math.log10(1 + reviews) / 3.5) : 0; return Math.round((r + v) * 10) / 10; };

async function send(items) {
  if (!items.length) return 0; let saved = 0;
  for (let i = 0; i < items.length; i += 200) {
    for (let a = 0; a < 4; a++) {
      const r = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-lx-key': KEY }, body: JSON.stringify({ action: 'ingest', items: items.slice(i, i + 200) }) }).catch(e => null);
      const j = r ? await r.json().catch(() => ({})) : {};
      if (j.ok) { saved += j.saved || 0; break; }
      log('ingest error', j.error || (r && r.status)); if (/column|schema/i.test(String(j.error))) await sleep(180000); else await sleep(5000);
    }
  }
  return saved;
}
const newCtx = (b, locale = 'en-US') => b.newContext({ viewport: { width: 1280, height: 900 }, userAgent: UA, locale });

// ---------- SSENSE (Canada) — listing JSON-LD + product page for sizes/details ----------
async function ssense(b) {
  const lists = [['women', 'bags'], ['women', 'shoes'], ['women', 'accessories'], ['women', 'clothing'], ['men', 'bags'], ['men', 'shoes'], ['men', 'accessories'], ['men', 'clothing']];
  const found = []; const seen = new Set();
  for (const [g, cat] of lists) {
    let ctx = await newCtx(b), p = await ctx.newPage(), pos = 0;
    for (let page = 1; page <= 25 && found.length < CAP * 3; page++) {
      const u = `https://www.ssense.com/en-ca/${g}/${cat}?page=${page}`; let L = null;
      for (let a = 0; a < 2 && !L; a++) {
        try { await p.goto(u, { timeout: 90000, waitUntil: 'domcontentloaded' }); await sleep(2500);
          L = await p.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => { try { return JSON.parse(s.textContent); } catch (e) { return null; } }).filter(x => x && x['@type'] === 'Product'));
          if (!L.length && /moment/i.test(await p.title())) L = null; } catch (e) { L = null; }
        if (!L) { await ctx.close().catch(() => {}); await sleep(8000); ctx = await newCtx(b); p = await ctx.newPage(); }
      }
      if (!L || !L.length) break;
      let kept = 0;
      for (const x of L) { pos++; const br = keepBrand(x.brand && x.brand.name); const price = Number(x.offers && x.offers.price); if (!br || !price || seen.has(x.productID)) continue;
        if (!/InStock/i.test(String(x.offers.availability || ''))) continue; if (!underCap(price, 'CAD', 0.13, cat + ' ' + x.name, 1)) continue;
        seen.add(x.productID); kept++; found.push({ x, br, g, cat, pos, list: g + '/' + cat }); }
      log('ssense', g, cat, 'page', page, 'products', L.length, 'kept', kept); if (L.length < 60) break;
    }
    await ctx.close().catch(() => {});
  }
  // Rank within each list (its own featured order) so women/men and every category share the top, not just the first list.
  const tot = {}; for (const f of found) tot[f.list] = Math.max(tot[f.list] || 1, f.pos); for (const f of found) f.r = f.pos / tot[f.list];
  found.sort((a, b) => a.r - b.r); const total = 1;
  const pick = found.slice(0, CAP); let saved = 0, batch = [], ctx = await newCtx(b), p = await ctx.newPage(), n = 0;
  for (const f of pick) {
    const x = f.x; const img = s => String(x.image || '').replace('__IMAGE_PARAMS__', 'f_auto,c_limit,h_1100').replace(/_1(\.jpg|\/)/, '_' + s + '$1');
    const it = { id: 'ss_' + x.productID, sku: x.sku, brand: f.br, title: clean(x.name), category: f.cat, gender: f.g === 'men' ? 'Men' : 'Women', price: Number(x.offers.price), cur: 'CAD', tax: 0.13, regular: null, images: [img(1), img(2), img(3)], colours: [], sizes: [], story: '', details: [], url: x.url, store: 'ssense.com', eta: '3–4 weeks', trend: trendOf(f.r, total, 0) };
    // Product page: in-stock sizes, description bullets, real image count (fresh browser context every 20 pages to stay polite).
    if (n && n % 20 === 0) { await ctx.close().catch(() => {}); ctx = await newCtx(b); p = await ctx.newPage(); }
    n++;
    try {
      await p.goto(x.url, { timeout: 60000, waitUntil: 'domcontentloaded' }); await sleep(1200);
      const d = await p.evaluate(() => { const h = document.documentElement.innerHTML; const og = (document.querySelector('meta[property="og:description"]') || {}).content || '';
        const vm = h.match(/\\"variants\\":(\[.*?\])\s*,\\"/); let sizes = []; if (vm) { try { sizes = JSON.parse(vm[1].replace(/\\"/g, '"')).filter(v => v.stock > 0 && v.size).map(v => v.size.name); } catch (e) {} }
        const shots = [...new Set((h.match(/\/([0-9]{6}[A-Z][0-9]{6}_[0-9]{1,2})\//g) || []).map(s => s.slice(1, -1)))];
        return { og, sizes, shots, title: document.title }; });
      if (!/moment/i.test(d.title)) {
        const lines = d.og.split('\n').map(s => s.trim()).filter(Boolean);
        it.story = (lines.find(l => !/^·|supplier color|please note/i.test(l)) || '').slice(0, 600);
        it.details = lines.filter(l => /^·/.test(l)).map(l => l.replace(/^·\s*/, '')).slice(0, 14);
        const col = lines.find(l => /^supplier color/i.test(l)); if (col) it.colours = [{ n: col.replace(/^supplier color:\s*/i, '') }];
        const sizes = sortSizes(d.sizes); it.sizes = sizes; it.detail_ok = true;
        if (/shoes|clothing/.test(f.cat) && d.sizes.length && !sizes.length && !d.sizes.some(s => /^(OS|ONE SIZE|TU)$/i.test(s))) continue;
        const base = String(x.image || '').match(/(\d{6}[A-Z]\d{6})_1/); if (base) { const ok = d.shots.filter(s => s.startsWith(base[1] + '_')).map(s => s.split('_')[1]).sort((a, b) => a - b); if (ok.length) it.images = ok.slice(0, 8).map(img); }
      }
    } catch (e) {}
    batch.push(it); if (batch.length >= 50) { const s = await send(batch.splice(0)); saved += s; log('ssense saved', saved, '/', pick.length); }
  }
  saved += await send(batch); await ctx.close().catch(() => {}); return saved;
}

// ---------- Flannels (UK) — the site's own Algolia product index (public search key used by flannels.com) ----------
async function flannels() {
  const U = 'https://965lu92ybt-dsn.algolia.net/1/indexes/*/queries'; const H = { 'x-algolia-api-key': '8e6d091d67594dd5463c991c27068a81', 'x-algolia-application-id': '965LU92YBT', 'content-type': 'application/json' };
  const q = async req => { const r = await fetch(U, { method: 'POST', headers: H, body: JSON.stringify({ requests: [req] }) }); return (await r.json()).results[0]; };
  const F = 'isHidden:false AND hasInventory:true AND hideFromSearch:false AND hasDefaultPrice:true';
  const fac = await q({ indexName: 'flan_production_search', query: '', hitsPerPage: 0, filters: F, facets: ['brand'], maxValuesPerFacet: 1000 });
  const brands = Object.keys(fac.facets.brand || {}).filter(b => keepBrand(b)); log('flannels brands', brands.length);
  const all = [];
  for (const brand of brands) {
    for (let page = 0; page < 5; page++) {
      const r = await q({ indexName: 'flan_production_search', query: '', hitsPerPage: 1000, page, filters: F + ' AND brand:"' + brand.replace(/"/g, '\\"') + '"' });
      for (const h of r.hits || []) all.push(h); if (!r.hits || r.hits.length < 1000) break;
    }
  }
  const L = v => (v && (v['en-GB'] || v)) || ''; const L0 = v => { const x = L(v); return Array.isArray(x) ? x[0] || '' : x; };
  const items = [];
  for (const h of all) {
    const g1 = L0(h.gtlcat1); if (!/bags|footwear|shoes|accessories|clothing|jewel|watches/i.test(g1 + ' ' + L0(h.category)) || /fragrance|parfum|perfume|beauty|gift set|cracker|candle|homeware|cosmetic|make ?up|skin ?care/i.test(g1 + ' ' + L0(h.category) + ' ' + L0(h.gtlcat3) + ' ' + L0(h.name))) continue;
    const price = Number((h.prices && h.prices.GBP && h.prices.GBP.sellingPrice) || h.sellingPrice); if (!price) continue;
    const title = L0(h.name); const br = keepBrand(L0(h.webbrand) || h.brand); if (!br || !title) continue;
    if (!underCap(price, 'GBP', 0, g1 + ' ' + L0(h.gtlcat3) + ' ' + title)) continue;
    const desc = String(h.description || ''); const parts = desc.split(/\*\*Best For\*\*/i)[0].split(/\*\*[^*]+\*\*/);
    const story = clean(parts[0]).slice(0, 700); const details = (desc.split(/\*\*Best For\*\*/i)[0].match(/^\* .+$/gm) || []).map(s => clean(s.slice(2))).slice(0, 12);
    const sizes = sortSizes(L(h.cleansize) || []);
    const imgs = (h.alternativeImages || []).map(u => u.split('?')[0] + '?w=1100').slice(0, 8); if (!imgs.length) continue;
    const st = h.recomendationStatistics || {}; const orders = Number(st.yesterdayOrders || 0) + Number(st.todayOrders || 0);
    items.push({ orders, it: { id: 'fl_' + h.colourCode, sku: h.styleCode || h.colourCode, brand: br, title, category: [g1, L0(h.gtlcat3), L0(h.subcategory)].filter(Boolean).join(' '), gender: /women/i.test(L0(h.webgender)) ? 'Women' : /men/i.test(L0(h.webgender)) ? 'Men' : '', price, cur: 'GBP', tax: 0, regular: Number(h.ticketPrice) || null, images: imgs, colours: [{ n: L0(h.colourName) }], sizes, story, details, url: 'https://www.flannels.com/' + String(h.productLink || '').split('#')[0], store: 'flannels.com', eta: '3–4 weeks', detail_ok: true, reviews: Number(h.noOfRatings || 0) } });
  }
  items.sort((a, b) => b.orders - a.orders); const pick = items.slice(0, CAP);
  pick.forEach((x, i) => { x.it.trend = trendOf(i, pick.length, x.it.reviews); delete x.it.reviews; });
  log('flannels hits', all.length, 'eligible', items.length, 'sending', pick.length);
  return send(pick.map(x => x.it));
}

// ---------- Nordstrom Rack (US) — server state (__INITIAL_CONFIG__) of the category pages ----------
// Bags & accessories only: the listing has no size labels, and size-run items would need a product page each (bot wall).
async function rack(b) {
  const cats = [['women/handbags', 'Women', 'Bags'], ['women/accessories', 'Women', 'Accessories'], ['men/accessories', 'Men', 'Accessories'], ['men/bags', 'Men', 'Bags']];
  const items = []; const seen = new Set(); let gpos = 0;
  for (const [c, g, cat] of cats) {
    for (let page = 1; page <= 30 && items.length < CAP; page++) {
      let P = null;
      for (let a = 0; a < 2 && !P; a++) {
        const ctx = await newCtx(b); const p = await ctx.newPage();
        try { await p.goto(`https://www.nordstromrack.com/shop/${c}?top=200&page=${page}`, { timeout: 90000, waitUntil: 'domcontentloaded' });
          await p.waitForFunction(() => window.__INITIAL_CONFIG__ && window.__INITIAL_CONFIG__.productResults, null, { timeout: 30000 });
          P = await p.evaluate(() => { const o = window.__INITIAL_CONFIG__.productResults; const order = Object.values(o.productUi && o.productUi.byId || {}).filter(u => u.source === 'organic').sort((a, b) => a.sourceIndex - b.sourceIndex).map(u => u.productId); const by = o.productsById; const ids = order.length ? order : Object.keys(by); return ids.map(id => by[id]).filter(Boolean); });
        } catch (e) { P = null; }
        await ctx.close().catch(() => {}); if (!P) await sleep(10000);
      }
      if (!P || !P.length) break; let kept = 0;
      for (const x of P) {
        gpos++; const br = keepBrand(x.labelDisplayName); const pr = (x.propositions || [])[0] || {}; const price = Number(pr.sellingRetailPriceRange && pr.sellingRetailPriceRange.min);
        if (!br || !price || seen.has(x.id) || (pr.salability && pr.salability.status !== 'SELLABLE')) continue;
        const title = clean(x.copyProductTitle); if (!underCap(price, 'USD', 0, cat + ' ' + title)) continue;
        const sell = new Set((pr.coreChoiceSelections || []).filter(s => (s.sellableSkus || []).length).map(s => s.coreChoiceId));
        const choices = ((x.coreProducts || [])[0] || {}).coreChoices || []; const live = choices.filter(cc => !sell.size || sell.has(cc.coreChoiceId)); if (!live.length) continue;
        const main = live.find(cc => cc.coreChoiceId === x.defaultCoreChoice) || live[0];
        const images = (main.orderedShots || []).map(s => s.imageUrl + '?w=1100').slice(0, 8); if (!images.length) continue;
        seen.add(x.id); kept++;
        items.push({ id: 'nr_' + x.id, sku: x.id, brand: br, title, category: cat + ' ' + title, gender: g, price, cur: 'USD', tax: 0, regular: Number(pr.compareAtRetailPriceRange && pr.compareAtRetailPriceRange.max) || null, images, colours: live.slice(0, 12).map(cc => ({ n: cc.displayColorDescription, img: (cc.orderedShots && cc.orderedShots[0] && cc.orderedShots[0].imageUrl + '?w=200') || undefined })), sizes: [], story: clean(x.copyDescription).slice(0, 700), details: [], url: 'https://www.nordstromrack.com/s/' + x.webPathAlias + '/' + x.id, store: 'nordstromrack.com', eta: '2–3 weeks', _pos: gpos, _rev: (x.reviews && x.reviews.numberOfReviews) || 0 });
      }
      log('rack', c, 'page', page, 'products', P.length, 'kept', kept); if (P.length < 60) break; await sleep(2000);
    }
  }
  const total = Math.max(gpos, 1); items.forEach(it => { it.trend = trendOf(it._pos, total, it._rev); delete it._pos; delete it._rev; });
  return send(items.slice(0, CAP));
}

// ---------- Ted Baker — official Shopify store (www.tedbaker.com). Its UK market shows the same USD catalogue, so prices are USD. ----------
async function tedbaker(b) {
  const ctx = await newCtx(b, 'en-GB'); const p = await ctx.newPage();
  await p.goto('https://www.tedbaker.com/collections/womens-bags', { timeout: 90000, waitUntil: 'domcontentloaded' }); await sleep(8000);
  const cols = [['womens-bags', 'Women'], ['womens-shoes', 'Women'], ['womens-jewelry', 'Women'], ['womens-accessories-bags', 'Women'], ['womens-clothing', 'Women'], ['mens-bags', 'Men'], ['mens-wallets-cardholders', 'Men'], ['mens-belts', 'Men'], ['mens-clothing', 'Men']];
  const items = []; const seen = new Set(); let pos = 0;
  for (const [h, g] of cols) {
    for (let page = 1; page <= 10; page++) {
      const j = await p.evaluate(async u => { try { const r = await fetch(u); if (!r.ok) return { err: r.status }; return await r.json(); } catch (e) { return { err: String(e) }; } }, `/collections/${h}/products.json?limit=250&page=${page}`);
      if (!j || j.err || !Array.isArray(j.products)) { log('tedbaker', h, page, 'err', j && j.err); break; }
      let kept = 0;
      for (const x of j.products) {
        pos++; if (seen.has(x.id)) continue; const av = (x.variants || []).filter(v => v.available && Number(v.price) > 0); if (!av.length) continue;
        const opts = (x.options || []).map(o => String(o.name || o).toLowerCase()); const si = opts.findIndex(o => /size/.test(o)), ci = opts.findIndex(o => /colou?r/.test(o));
        const price = Math.min(...av.map(v => Number(v.price))); const [nm, colName] = String(x.title).split('|').map(t => clean(t)); const tc = t => String(t || '').toLowerCase().replace(/\b\w/g, m => m.toUpperCase()); const ptype = clean(x.product_type).replace(/s$/i, '').replace(/Polos Shirt/i, 'Polo Shirt'); const title = [tc(nm), ptype].filter(Boolean).join(' ');
        if (!underCap(price, 'USD', 0, x.product_type + ' ' + h + ' ' + title)) continue;
        const sizes = si >= 0 ? sortSizes(av.map(v => v['option' + (si + 1)])) : [];
        const colour = tc(colName || (ci >= 0 ? av[0]['option' + (ci + 1)] : '')); const best = (x.tags || []).some(t => /bestseller/i.test(t));
        const lis = String(x.body_html || '').match(/<li>([\s\S]*?)<\/li>/g) || [];
        seen.add(x.id); kept++;
        items.push({ id: 'tk_' + x.id, sku: (av[0].sku || '').split('-')[0] || String(x.id), brand: 'Ted Baker', title, category: (x.product_type || h.replace(/-/g, ' ')) + ' ' + title, gender: g, price, cur: 'USD', tax: 0, regular: Math.max(0, ...av.map(v => Number(v.compare_at_price) || 0)) || null, images: (x.images || []).slice(0, 8).map(i => String(i.src).split('?')[0] + '?width=1100'), colours: colour ? [{ n: colour }] : [], sizes, story: lis.length ? '' : clean(x.body_html).slice(0, 600), details: lis.map(clean).filter(Boolean).slice(0, 12), url: 'https://www.tedbaker.com/products/' + x.handle, store: 'tedbaker.com', eta: '2–3 weeks', detail_ok: true, _pos: pos, _best: best });
      }
      log('tedbaker', h, 'page', page, 'products', j.products.length, 'kept', kept); if (j.products.length < 250) break;
    }
  }
  await ctx.close().catch(() => {});
  const total = Math.max(pos, 1); items.forEach(it => { it.trend = Math.min(100, trendOf(it._pos, total, 0) + (it._best ? 25 : 0)); delete it._pos; delete it._best; });
  return send(items.slice(0, CAP));
}

(async () => {
  if (!KEY) { console.log('LX_CAT_KEY missing'); process.exit(1); }
  const which = (process.argv[2] || 'ssense,flannels,rack,tedbaker').split(',');
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox', '--headless=new', '--disable-blink-features=AutomationControlled'] });
  const res = {}; const started = new Date().toISOString();
  const run = async (k, f) => { if (!which.includes(k)) return; try { res[k] = await f(); } catch (e) { log(k, 'fail', e.message); res[k] = 0; } };
  await run('flannels', () => flannels()); await run('tedbaker', () => tedbaker(b)); await run('rack', () => rack(b)); await run('ssense', () => ssense(b));
  if (which.includes('gilt')) { log('gilt: skipped — gilt.com answers every visit with a DataDome captcha (403)'); res.gilt = 0; }
  if (which.includes('saks')) { log('saks: skipped — saksoff5th.com online store has shut down'); res.saks = 0; }
  console.log('DONE', JSON.stringify(res), 'started', started);
  await b.close();
})();
