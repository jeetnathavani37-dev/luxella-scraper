// Official-store scraper → The Collection. Runs a real browser (sites block plain HTTP), reads each store's own listing
// and product data, and sends items to the lx-catalog edge function (action "ingest"), which prices them with the Luxella
// formula (currency + tax aware) and hides anything above the price cap.
// Every item carries: title, brand, category, gender, price + currency, images, colours, IN-STOCK sizes, story (paragraph),
// details (bullets), SKU, product URL, ETA and a trend score (0–100) from the store's own popularity order + reviews.
// Usage: LX_CAT_KEY=... node scripts/outlet_scrape.js [coach,ks,mk,tb,shopify]   (SHOPS=alo,polene to limit Shopify brands)
const { chromium } = require('playwright');
const KEY = process.env.LX_CAT_KEY || (process.env.LX_CAT_KEY_FILE ? require('fs').readFileSync(process.env.LX_CAT_KEY_FILE, 'utf8').trim() : ''); const FN = 'https://qzripzgbstvxkfobzhyv.supabase.co/functions/v1/lx-catalog';
const EXE = process.env.CHROME || undefined;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
const unesc = s => String(s || '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&rsquo;|&#8217;/g, '’').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const strip = h => clean(unesc(String(h || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ')));
const bullets = h => { const s = String(h || ''); let L = [...s.matchAll(/<li[^>]*>([\s\S]*?)(?=<li|<\/li>|<\/ul>|$)/gi)].map(m => strip(m[1])); if (!L.length) L = s.split(/<br\s*\/?>|\n/i).map(strip); return [...new Set(L.map(x => x.replace(/^[•·\-–\s]+/, '').trim()).filter(x => x && x.length < 200 && !/^style no\.?/i.test(x)))].slice(0, 16); };
const paras = h => { const s = String(h || ''); const P = [...s.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(m => strip(m[1])).filter(Boolean); return (P.length ? P : [strip(s.replace(/<ul[\s\S]*?<\/ul>/gi, ''))]).filter(x => x && !/net proceeds|foundation|leather working group/i.test(x)).slice(0, 2).join('\n\n').slice(0, 1400); };
const trendOf = (pos, total, reviews, best) => Math.round((70 * (1 - pos / Math.max(1, total)) + 30 * Math.min(1, Math.log10(1 + (Number(reviews) || 0)) / 3.5) + (best ? 8 : 0)) * 10) / 10;
async function pool(arr, n, fn) { let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < arr.length) { const k = i++; try { await fn(arr[k], k); } catch (e) {} } })); }
async function send(items) { if (!items.length) return 0; let saved = 0; for (let i = 0; i < items.length; i += 200) { for (let t = 0; t < 3; t++) { try { const r = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-lx-key': KEY }, body: JSON.stringify({ action: 'ingest', items: items.slice(i, i + 200) }) }); const j = await r.json().catch(() => ({})); saved += j.saved || 0; if (!j.ok) console.log('ingest error', j.error); break; } catch (e) { await sleep(3000); } } } return saved; }
async function newCtx(b) { return b.newContext({ viewport: { width: 1280, height: 900 }, userAgent: UA, locale: 'en-US' }); }

// ---------- Tapestry (Coach Outlet, Kate Spade Outlet) ----------
async function tapestry(b, o) {
  const ctx = await newCtx(b); const p = await ctx.newPage(); await p.goto(o.landing, { timeout: 90000, waitUntil: 'domcontentloaded' }); await sleep(7000);
  const all = new Map();
  for (const path of o.paths) {
    let page = 1, pages = 1, pos = 0, total = 0; const list = [];
    do {
      const j = await p.evaluate(async u => { try { const r = await fetch(u, { headers: { accept: 'application/json' } }); if (!r.ok) return { err: r.status }; return await r.json(); } catch (e) { return { err: String(e) }; } }, `${o.api}${path}?page=${page}`);
      if (!j || j.err || !j.pageData) { console.log(o.store, path, page, 'err', j && j.err); break; }
      pages = j.pageData.totalPages || 1; total = j.pageData.total || total;
      for (const x of j.pageData.products || []) list.push([x, pos++]);
      page++; await sleep(300);
    } while (page <= pages && page <= (o.maxPages || 200));
    for (const [x, ps] of list) {
      const pr = x.prices || {}; const usd = Number(pr.currentPrice); if (!usd || all.has(x.masterId)) continue;
      const imgs = ((x.media && x.media.full) || []).map(m => m.src).filter(Boolean).map(u => u.split('?')[0]);
      const cs = (x.colors || []).filter(c => c.orderable !== false).map(c => ({ n: c.text, img: c.image && c.image.src ? c.image.src.split('?')[0] + '?wid=80' : undefined }));
      const cu = x.custom || {};
      all.set(x.masterId, { id: o.prefix + x.masterId, sku: x.masterId, brand: o.brand, title: clean(x.name), category: cu.c_classification || o.cat || '', gender: o.gender || (/\/men\//.test(path) ? 'Men' : 'Women'), usd, regular_usd: pr.regularPrice, images: imgs.slice(0, 8), colours: cs, sizes: [], details: [], descr: cu.c_material ? 'Material: ' + cu.c_material : '', url: o.site + '/products/' + encodeURIComponent(clean(x.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')) + '/' + x.masterId + '.html', store: o.store, eta: '2–3 weeks', trend: trendOf(ps, total || list.length, cu.c_revCountEmplifi, x.activeProductData && x.activeProductData.bestseller), _vg: x.masterId + '-' + ((x.variationValues && x.variationValues.color) || '') });
    }
    console.log(new Date().toISOString().slice(11, 19), o.store, path, 'listed', list.length);
  }
  const items = [...all.values()]; let done = 0, total = 0; const batch = [];
  await pool(items, 6, async it => {
    const d = await p.evaluate(async ([inv, pdp]) => {
      const out = { sizes: [], bl: '' };
      try { const j = await (await fetch(inv)).json(); const V = (j.inventory && j.inventory.variantInventoryData) || []; const S = []; for (const v of V) { const t = String(v.id || '').trim().split(/\s+/); if (t.length >= 3 && v.orderable && (v.ats == null || v.ats > 0)) S.push(t[2]); } out.sizes = [...new Set(S)]; out.hasVar = V.some(v => String(v.id || '').trim().split(/\s+/).length >= 3); } catch (e) {}
      try { const r = await fetch(pdp); const rd = r.body.getReader(); const dec = new TextDecoder(); let s = ''; while (s.length < 600000) { const { value, done } = await rd.read(); if (done) break; s += dec.decode(value, { stream: true }); const k = s.indexOf('"@type":"WebPage"'); if (k > 0 && s.indexOf('</script>', k) > 0) { s = s.slice(k, s.indexOf('</script>', k)); break; } } try { rd.cancel(); } catch (e) {} const m = s.match(/"description":"((?:[^"\\]|\\.)*)"/); if (m) out.bl = JSON.parse('"' + m[1] + '"'); } catch (e) {}
      return out;
    }, [o.invBase + '/api/inventory?vgId=' + encodeURIComponent(it._vg), o.pdpBase + '/products/x/' + it.sku + '.html']);
    if (d.hasVar && !d.sizes.length) it.active = false; // every size sold out
    it.sizes = d.sizes; it.details = bullets(d.bl); it.detail_ok = true; delete it._vg;
    batch.push(it); done++;
    if (batch.length >= 150) { const s = await send(batch.splice(0)); total += s; console.log(new Date().toISOString().slice(11, 19), o.store, 'details', done, '/', items.length, 'saved', total); }
  });
  total += await send(batch.splice(0)); console.log(o.store, 'saved', total);
  await ctx.close(); return total;
}

// ---------- Michael Kors Outlet (SFCC tiles + Product-Variation JSON) ----------
async function mk(b, cats) {
  let total = 0; const seen = new Set();
  for (const [cat, g] of cats || [['handbags', 'Women'], ['wallets', 'Women'], ['shoes', ''], ['watches', ''], ['accessories', ''], ['clothing', '']]) {
    let ctx = await newCtx(b); let p = await ctx.newPage(); let start = 0, fails = 0; const list = [];
    try { await p.goto('https://www.michaelkors.com/outlet/', { timeout: 90000, waitUntil: 'domcontentloaded' }); await sleep(5000); } catch (e) {}
    while (start < 3000) {
      const u = `https://www.michaelkors.com/outlet/${cat}/?start=${start}&sz=96&srule=customer-favorites`; let items = [];
      try {
        await p.goto(u, { timeout: 90000, waitUntil: 'domcontentloaded' }); await sleep(4000 + Math.random() * 3000);
        items = await p.evaluate(() => [...document.querySelectorAll('[data-pid].product-tile-show')].map(t => {
          const a = t.querySelector('a.product-tile-image-link') || t.querySelector('a[href*=".html"]');
          const name = (a && a.getAttribute('aria-label')) || (t.querySelector('.pdp-link a, .link') || {}).textContent || '';
          const val = s => { const e = t.querySelector(s); return e ? (e.getAttribute('content') || e.textContent || '').replace(/[^0-9.]/g, '') : ''; };
          const imgs = [...t.querySelectorAll('img')].map(i => i.getAttribute('data-src') || i.getAttribute('src') || '').filter(x => /^https:\/\/assets\.michaelkors/.test(x) && !/swatch/i.test(x));
          return { pid: t.getAttribute('data-pid'), name: name.trim(), sale: val('.sales .value'), list: val('.strike-through .value, .list .value'), imgs, href: a ? a.href.split('?')[0] : '' };
        }));
      } catch (e) { items = null; }
      if (items === null || (!items.length && start === 0)) {
        if (++fails > 3) { console.log('mk give up', cat, start); break; }
        console.log('mk retry', cat, start, 'fail', fails); await ctx.close().catch(() => {}); await sleep(20000 * fails);
        ctx = await newCtx(b); p = await ctx.newPage(); continue;
      }
      fails = 0; if (!items.length) break;
      for (const x of items) if (!seen.has(x.pid)) { seen.add(x.pid); list.push(x); }
      if (items.length < 96) break; start += 96;
    }
    console.log(new Date().toISOString().slice(11, 19), 'mk', cat, 'listed', list.length);
    const batch = []; let done = 0;
    await pool(list, 3, async (x, ps) => {
      const usd = Number(x.sale || x.list); if (!usd || !x.name) return;
      const it = { id: 'mk_' + x.pid, sku: x.pid, brand: 'Michael Kors', title: x.name, category: cat, gender: g || (/\bmen'?s\b|\bmens\b/i.test(x.name + ' ' + x.href) ? 'Men' : 'Women'), usd, regular_usd: Number(x.list) || null, images: [...new Set(x.imgs.map(s => s.replace('ECOM_Image_Medium', 'ECOM_Image_Large')))].slice(0, 8), colours: [], descr: '', url: x.href, store: 'michaelkors.com/outlet', eta: '2–3 weeks', trend: trendOf(ps, list.length, 0, false) };
      await sleep(400 + Math.random() * 800);
      const d = await p.evaluate(async pid => { try { const r = await fetch('/on/demandware.store/Sites-mk_us-Site/en_US/Product-Variation?pid=' + encodeURIComponent(pid)); if (!r.ok) return null; const j = await r.json(); const P = j.product || {}; const va = P.variationAttributes || []; const col = va.find(a => /colou?r/i.test(a.attributeId || a.id || '')); const sz = va.find(a => /size/i.test(a.attributeId || a.id || ''));
        return { story: P.shortDescription || '', long: P.longDescription || '', rev: P.bvReviewCount, imgs: ((P.images && P.images.large) || []).map(i => i.absURL || i.url).filter(u => u && !/swatch/i.test(u)), cols: col ? (col.values || []).filter(v => v.selectable !== false).map(v => ({ n: v.displayValue, img: v.images && v.images.swatch && v.images.swatch[0] ? v.images.swatch[0].url : undefined })) : [], sizes: sz ? (sz.values || []).filter(v => v.selectable).map(v => v.displayValue) : null, avail: P.available !== false }; } catch (e) { return null; } }, x.pid);
      if (d) { it.story = strip(d.story); it.details = bullets(d.long); if (d.imgs.length) it.images = [...new Set(d.imgs)].slice(0, 8); it.colours = d.cols.slice(0, 12); if (d.sizes) { it.sizes = d.sizes; if (!d.sizes.length) it.active = false; } it.detail_ok = true; it.trend = trendOf(ps, list.length, d.rev, false); if (!d.avail) it.active = false; }
      batch.push(it); done++;
      if (batch.length >= 100) { const s = await send(batch.splice(0)); total += s; console.log(new Date().toISOString().slice(11, 19), 'mk', cat, 'details', done, '/', list.length, 'saved', s); }
    });
    total += await send(batch.splice(0));
    await ctx.close().catch(() => {}); await sleep(15000);
  }
  return total;
}

// ---------- Tory Burch (site's own product API, headers captured from the page) ----------
async function tb(b) {
  const ctx = await newCtx(b); const p = await ctx.newPage(); let H = null, total = 0;
  p.on('request', r => { if (/\/categories\/.*\/products/.test(r.url())) H = r.headers(); });
  await p.goto('https://www.toryburch.com/en-us/sale/', { timeout: 90000, waitUntil: 'domcontentloaded' }); await sleep(10000);
  if (!H) { console.log('tb: no api headers'); await ctx.close(); return 0; }
  const hh = {}; for (const k of ['authorization', 'x-api-key', 'accept']) if (H[k]) hh[k] = H[k];
  const img = c => `https://s7.toryburch.com/is/image/ToryBurch/${c}.pdp-767x872.jpg`;
  const api = (u) => p.evaluate(async ([u, h]) => { try { const r = await fetch(u, { headers: h }); if (!r.ok) return { err: r.status }; return await r.json(); } catch (e) { return { err: String(e) }; } }, [u, hh]);
  const all = new Map();
  for (const cat of ['sale-view-all', 'handbags-view-all', 'shoes-view-all', 'accessories-view-all', 'clothing-view-all', 'watches']) {
    let off = 0, tot = 1;
    while (off < tot && off < 3000) {
      const j = await api(`/api/prod-r2/v12/categories/${cat}/products?site=ToryBurch_US&locale=en-us&pip=true&limit=50&offset=${off}&layout=flex&sort=most-popular`);
      if (!j || j.err || !Array.isArray(j.products)) { console.log('tb', cat, off, 'err', j && j.err); break; }
      tot = j.total || 0;
      j.products.forEach((x, i) => { const sc = trendOf(off + i, tot, x.reviewCount, false); const e = all.get(x.id); if (e) { e.trend = Math.max(e.trend, sc); return; }
        const sw = (x.swatches || []).filter(s => !s.soldOut); if (!sw.length) return; const usd = Number((sw[0].price || x.price || {}).min); if (!usd) return;
        const cls = x.productClassName || x.productDepartmentName || '';
        all.set(x.id, { id: 'tb_' + x.id, sku: x.styleId || x.id, brand: 'Tory Burch', title: String(x.name || '').trim(), category: (x.productDepartmentName || '') + ' ' + cls, gender: 'Women', usd, regular_usd: null, images: [...new Set(sw.flatMap((s, k) => (s.images || []).slice(0, k ? 1 : 6)))].slice(0, 8).map(img), colours: sw.slice(0, 12).map(s => ({ n: s.colorName, img: s.imageCode ? `https://s7.toryburch.com/is/image/ToryBurch/${s.imageCode}_SLANG?wid=80` : undefined })), sizes: [], descr: cls, url: 'https://www.toryburch.com/en-us/' + (x.staticURL || '') + '/' + x.id + '.html', store: 'toryburch.com', eta: '2–3 weeks', trend: sc, oneSize: !!x.oneSize }); });
      off += 50; await sleep(500);
    }
    console.log(new Date().toISOString().slice(11, 19), 'tb', cat, 'listed', all.size);
  }
  const items = [...all.values()]; const batch = []; let done = 0;
  await pool(items, 4, async it => {
    const j = await api(`/api/prod-r2/v12/products/${it.id.slice(3)}?site=ToryBurch_US&locale=en-us&pip=true`);
    const P = j && j.product;
    if (P) {
      it.story = paras(P.shortDescription); it.details = bullets(P.longDescription); if (P.material) it.descr = 'Material: ' + strip(P.material);
      if (!it.oneSize) { const S = []; for (const v of P.variations || []) if (!v.soldOut && v.values && v.values.size) S.push(String(v.values.size)); const order = (P.sizes || []).map(s => String(s.value)); it.sizes = [...new Set(S)].sort((a, c) => order.indexOf(a) - order.indexOf(c)); if (!it.sizes.length && (P.variations || []).some(v => v.values && v.values.size)) it.active = false; }
      it.detail_ok = true;
    }
    delete it.oneSize; batch.push(it); done++;
    if (batch.length >= 150) { const s = await send(batch.splice(0)); total += s; console.log(new Date().toISOString().slice(11, 19), 'tb details', done, '/', items.length, 'saved', total); }
  });
  total += await send(batch.splice(0)); await ctx.close(); return total;
}


// ---------- Valentino · Bicester Village boutique (UK, price on request) ----------
async function val(b) {
  const ctx = await newCtx(b); const p = await ctx.newPage(); let H = null, total = 0;
  p.on('request', r => { if (/vxp-api.*selections/.test(r.url())) H = r.headers(); });
  await p.goto('https://myv-experience.valentino.com/0040000542/OUTLET%20BICESTER/VAL', { timeout: 90000, waitUntil: 'domcontentloaded' }); await sleep(9000);
  if (!H) { console.log('val: no token'); await ctx.close(); return 0; }
  const hh = { authorization: H.authorization, 'content-type': 'application/json', accept: 'application/json' };
  const api = (u, body) => p.evaluate(async ([u, h, bd]) => { try { const r = await fetch(u, { method: bd ? 'POST' : 'GET', headers: h, body: bd ? JSON.stringify(bd) : undefined }); if (!r.ok) return { err: r.status }; return await r.json(); } catch (e) { return { err: String(e) }; } }, [u, hh, body]);
  const hier = await api('https://vxp-api.valentino.ws/hierarchies/all'); const LBL = {}; const walk = n => { for (const x of n || []) { LBL[x.id] = x.label; walk(x.children); } }; walk(hier);
  const tc = s => String(s || '').toLowerCase().replace(/\b\w/g, m => m.toUpperCase());
  const img = g => `https://valentino-cdn.thron.com/delivery/public/image/valentino/${g.id}/${g.pkey}/std/1000x1000/valentino.jpg`;
  for (const brand of ['VAL', 'VMA']) for (const lb of ['L', 'S', 'T', 'E', 'B', 'A']) {
    const j = await api('https://vxp-api.valentino.ws/catalog/search/products', { brand, level1b: lb });
    const P = (j && j.products) || []; if (j && j.err) { console.log('val', brand, lb, 'err', j.err); continue; }
    const by = new Map(); for (const x of P) { const k = x.sapid; if (!by.has(k)) by.set(k, []); by.get(k).push(x); }
    const items = []; let pos = 0;
    for (const [sap, V] of by) {
      const x = V[0]; const inStock = V.some(v => (v.sizes || []).some(z => z.quantity > 0)); if (!inStock) continue;
      const imgs = [...new Set(V.flatMap(v => (v.galleryIdsPkeys || []).map(img)))].slice(0, 8); if (!imgs.length) continue;
      const kind = LBL[x.level4] || LBL[x.level3] || LBL[x.level1b] || '';
      const title = (tc(x.family) + ' ' + tc(kind)).replace(/\s+/g, ' ').trim();
      const sizes = [...new Set(V.flatMap(v => (v.sizes || []).filter(z => z.quantity > 0).map(z => String(z.size).replace(/\/+$/, '').trim())).filter(z => z && z !== 'UNI'))];
      const men = brand === 'VMA';
      items.push({ id: 'vb_' + sap, sku: sap, brand: 'Valentino Garavani', title, category: tc(LBL[x.level1b] || '') + ' ' + kind, gender: men ? 'Men' : 'Women', por: true, cur: 'GBP', tax: 0, images: imgs, colours: V.map(v => ({ n: tc(v.description), img: (v.galleryIdsPkeys && v.galleryIdsPkeys[0]) ? img(v.galleryIdsPkeys[0]).replace('1000x1000', '120x120') : undefined })).slice(0, 10), sizes, story: '', details: [x.composition ? 'Composition: ' + String(x.composition).replace(/%/g, '% ').trim() : '', x.collection ? 'Collection: ' + tc(x.collection) : '', 'Style ' + sap].filter(Boolean), url: 'https://myv-experience.valentino.com/0040000542/OUTLET%20BICESTER/VAL', store: 'Valentino Bicester', eta: '3–4 weeks', segment: 'luxury', detail_ok: true, trend: Math.round(60 * (1 - pos++ / Math.max(1, by.size)) * 10) / 10 });
    }
    const s2 = await send(items); total += s2; console.log(new Date().toISOString().slice(11, 19), 'val', brand, LBL[lb] || lb, 'products', P.length, 'saved', s2);
  }
  await ctx.close(); return total;
}

// ---------- Shopify brand stores (official sites; /products.json) ----------
// [key, Brand, domain, currency, segment, eta]
const SHOPS = [
  ['alo', 'Alo Yoga', 'https://www.aloyoga.com', 'USD', 'lifestyle', '2–3 weeks'],
  ['polene', 'Polène', 'https://uk.polene-paris.com', 'GBP', 'luxury', '3–4 weeks'],
  ['karl', 'Karl Lagerfeld', 'https://www.karllagerfeldparis.com', 'USD', 'luxury', '2–3 weeks'],
  ['jwpei', 'JW Pei', 'https://www.jwpei.com', 'USD', 'lifestyle', '2–3 weeks'],
  ['mansur', 'Mansur Gavriel', 'https://www.mansurgavriel.com', 'USD', 'luxury', '2–3 weeks'],
  ['staud', 'Staud', 'https://staud.clothing', 'USD', 'luxury', '2–3 weeks'],
  ['demellier', 'DeMellier', 'https://www.demellierlondon.com', 'USD', 'luxury', '2–3 weeks'],
  ['cultgaia', 'Cult Gaia', 'https://cultgaia.com', 'USD', 'luxury', '2–3 weeks'],
  ['wandler', 'Wandler', 'https://www.wandler.com', 'USD', 'luxury', '2–3 weeks'],
  ['telfar', 'Telfar', 'https://telfar.net', 'USD', 'lifestyle', '2–3 weeks'],
  ['songmont', 'Songmont', 'https://songmontofficial.com', 'USD', 'lifestyle', '2–3 weeks'],
  ['cambridge', 'Cambridge Satchel', 'https://us.cambridgesatchel.com', 'USD', 'lifestyle', '2–3 weeks'],
  ['simonmiller', 'Simon Miller', 'https://www.simonmillerusa.com', 'USD', 'luxury', '2–3 weeks'],
  ['liffner', 'Little Liffner', 'https://www.liffner.co', 'USD', 'luxury', '2–3 weeks'],
  ['loeffler', 'Loeffler Randall', 'https://loefflerrandall.com', 'USD', 'luxury', '2–3 weeks'],
  ['nodaleto', 'Nodaleto', 'https://www.nodaleto.com', 'USD', 'luxury', '2–3 weeks'],
  ['vb', 'Victoria Beckham', 'https://www.victoriabeckham.com', 'USD', 'luxury', '2–3 weeks'],
  ['skims', 'Skims', 'https://skims.com', 'USD', 'lifestyle', '2–3 weeks'],
  ['goodamerican', 'Good American', 'https://www.goodamerican.com', 'USD', 'lifestyle', '2–3 weeks'],
  ['vuori', 'Vuori', 'https://vuoriclothing.com', 'USD', 'lifestyle', '2–3 weeks'],
  ['varley', 'Varley', 'https://varley.com', 'USD', 'lifestyle', '2–3 weeks'],
  ['sweatybetty', 'Sweaty Betty', 'https://www.sweatybetty.com', 'USD', 'lifestyle', '2–3 weeks'],
  ['adanola', 'Adanola', 'https://www.adanola.com', 'GBP', 'lifestyle', '3–4 weeks'],
  ['penation', 'P.E Nation', 'https://pe-nation.com', 'USD', 'lifestyle', '2–3 weeks'],
  ['dooney', 'Dooney & Bourke', 'https://www.ilovedooney.com', 'USD', 'lifestyle', '2–3 weeks'],
];
const WOMEN_ONLY = /^(polene|staud|cultgaia|loeffler|nodaleto|wandler|demellier|liffner|simonmiller|vb|skims|goodamerican|sweatybetty|adanola|dooney|mansur)$/;
async function shopify(only) {
  let total = 0; const res = {};
  for (const [key, brand, dom, cur, seg, eta] of SHOPS) {
    if (only && !only.includes(key)) continue;
    const P = [];
    for (let page = 1; page <= 40; page++) {
      let j = null; for (let t = 0; t < 2 && !j; t++) { try { const r = await fetch(`${dom}/products.json?limit=250&page=${page}`, { headers: { 'User-Agent': UA, accept: 'application/json' } }); if (r.ok) j = await r.json(); else { console.log(key, 'http', r.status); break; } } catch (e) { await sleep(2000); } }
      if (!j || !Array.isArray(j.products) || !j.products.length) break; P.push(...j.products); if (j.products.length < 250) break; await sleep(700);
    }
    if (!P.length) { console.log('shop', key, 'no products'); res[key] = 0; continue; }
    const items = [];
    P.forEach((p, pos) => {
      const opts = (p.options || []).map(o => String(o.name || '').toLowerCase()); const si = opts.findIndex(n => /size|taille/.test(n)); const ci = opts.findIndex(n => /colou?r|couleur/.test(n));
      const V = (p.variants || []).filter(v => Number(v.price) > 0); const av = V.filter(v => v.available); if (!av.length) return;
      if (/gift ?card|e-?gift|sample|swatch|insurance|shipping protection|route package/i.test(p.title + ' ' + p.product_type)) return;
      const tags = Array.isArray(p.tags) ? p.tags : String(p.tags || '').split(',');
      const opt = (v, i) => v['option' + (i + 1)];
      const price = Math.min(...av.map(v => Number(v.price))); const cmp = Math.max(0, ...V.map(v => Number(v.compare_at_price) || 0));
      const imgs = (p.images || []).map(i => String(i.src || '').split('?')[0]).filter(Boolean);
      const colours = ci >= 0 ? [...new Map(av.map(v => [opt(v, ci), { n: opt(v, ci), img: v.featured_image && v.featured_image.src ? v.featured_image.src.split('?')[0] + '?width=80' : undefined }])).values()].slice(0, 12) : [];
      const sizes = si >= 0 ? [...new Set(av.map(v => String(opt(v, si))))] : [];
      const tg = (tags.join(' ') + ' ' + p.product_type).toLowerCase();
      const gender = WOMEN_ONLY.test(key) ? 'Women' : /\bwomen|womens|\bher\b/.test(tg) ? 'Women' : /\bmen\b|\bmens\b|\bhim\b/.test(tg) ? 'Men' : '';
      items.push({ id: 'sh_' + key + '_' + p.id, sku: String((V[0] && V[0].sku) || p.handle).slice(0, 60), brand, title: clean(p.title), category: clean(p.product_type) || '', gender, price, cur, tax: 0, regular: cmp > price ? cmp : null, images: imgs.slice(0, 8), colours, sizes, story: paras(p.body_html), details: bullets(p.body_html), url: dom + '/products/' + p.handle, store: dom.replace(/^https?:\/\/(www\.)?/, ''), eta, segment: seg, detail_ok: true, trend: Math.round(50 * (1 - pos / P.length) * 10) / 10 });
    });
    const s = await send(items); res[key] = s; total += s; console.log(new Date().toISOString().slice(11, 19), 'shop', key, 'products', P.length, 'saved', s);
  }
  console.log('shopify', JSON.stringify(res)); return total;
}

(async () => {
  if (!KEY) { console.log('LX_CAT_KEY missing'); process.exit(1); }
  const which = (process.argv[2] || 'shopify,coach,ks,tb,mk').split(',');
  const started = new Date().toISOString(); const res = {};
  if (which.includes('shopify')) res.shopify = await shopify(process.env.SHOPS ? process.env.SHOPS.split(',') : null).catch(e => (console.log('shopify fail', e.message), 0));
  const needB = which.some(w => ['coach', 'ks', 'mk', 'tb', 'val'].includes(w));
  const b = needB ? await chromium.launch({ executablePath: EXE, args: ['--no-sandbox', '--headless=new', '--disable-blink-features=AutomationControlled'] }) : null;
  if (which.includes('coach')) res.coach = await tapestry(b, { store: 'coachoutlet.com', brand: 'Coach', prefix: 'co_', landing: 'https://www.coachoutlet.com/shop/women/view-all', api: 'https://www.coach.com/api/get-shop/', invBase: 'https://www.coach.com', pdpBase: 'https://www.coach.com', site: 'https://www.coachoutlet.com', paths: ['outlet/women/view-all', 'outlet/men/view-all'] }).catch(e => (console.log('coach fail', e.message), 0));
  if (which.includes('ks')) res.ks = await tapestry(b, { store: 'katespadeoutlet.com', brand: 'Kate Spade', prefix: 'ks_', gender: 'Women', landing: 'https://www.katespadeoutlet.com/shop/handbags/view-all', api: 'https://www.katespadeoutlet.com/api/get-shop/', invBase: 'https://www.katespadeoutlet.com', pdpBase: 'https://www.katespadeoutlet.com', site: 'https://www.katespadeoutlet.com', paths: ['handbags/view-all', 'wallets/view-all', 'shoes/view-all', 'jewelry/view-all', 'clothing/view-all', 'accessories/view-all'] }).catch(e => (console.log('ks fail', e.message), 0));
  if (which.includes('tb')) res.tb = await tb(b).catch(e => (console.log('tb fail', e.message), 0));
  if (which.includes('val')) res.val = await val(b).catch(e => (console.log('val fail', e.message), 0));
  if (which.includes('mk')) res.mk = await mk(b, process.env.MK_CATS ? process.env.MK_CATS.split(',').map(c => [c, '']) : null).catch(e => (console.log('mk fail', e.message), 0));
  console.log('DONE', JSON.stringify(res), 'started', started);
  if (b) await b.close();
})();
