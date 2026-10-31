// More official stores → The Collection (Sephora, Karl Lagerfeld Paris EU, Macy's, and the founder's earlier brand list).
// Same item format as scripts/outlet_scrape.js; the lx-catalog edge function prices each item (currency/tax aware) and caps at ₹1L.
// Usage: LX_CAT_KEY=... CHROME=... node scripts/more_scrape.js [shopify,sephora,macys,strath,furla]   (SHOPS=karlparis,dkny to limit Shopify brands)
const { chromium } = require('playwright');
const KEY = process.env.LX_CAT_KEY || (process.env.LX_CAT_KEY_FILE ? require('fs').readFileSync(process.env.LX_CAT_KEY_FILE, 'utf8').trim() : ''); const FN = 'https://qzripzgbstvxkfobzhyv.supabase.co/functions/v1/lx-catalog';
const EXE = process.env.CHROME || undefined;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
const unesc = s => String(s || '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&rsquo;|&#8217;/g, '’').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const strip = h => clean(unesc(String(h || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ')));
const bullets = h => { const s = String(h || ''); let L = [...s.matchAll(/<li[^>]*>([\s\S]*?)(?=<li|<\/li>|<\/ul>|$)/gi)].map(m => strip(m[1])); if (!L.length) L = s.split(/<br\s*\/?>|\n/i).map(strip).filter(x => x.length < 120); return [...new Set(L.map(x => x.replace(/^[•·\-–\s]+/, '').trim()).filter(x => x && x.length < 200 && !/^style no\.?/i.test(x)))].slice(0, 16); };
const paras = h => { const s = String(h || ''); const P = [...s.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(m => strip(m[1])).filter(Boolean); return (P.length ? P : [strip(s.replace(/<ul[\s\S]*?<\/ul>/gi, ''))]).filter(x => x && x.length > 20).slice(0, 2).join('\n\n').slice(0, 1400); };
const trendOf = (pos, total, reviews, best) => Math.round((70 * (1 - pos / Math.max(1, total)) + 30 * Math.min(1, Math.log10(1 + (Number(reviews) || 0)) / 3.5) + (best ? 8 : 0)) * 10) / 10;
async function send(items) { if (!items.length) return 0; let saved = 0; for (let i = 0; i < items.length; i += 200) { for (let t = 0; t < 3; t++) { try { const r = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-lx-key': KEY }, body: JSON.stringify({ action: 'ingest', items: items.slice(i, i + 200) }) }); const j = await r.json().catch(() => ({})); saved += j.saved || 0; if (!j.ok) console.log('ingest error', j.error); break; } catch (e) { await sleep(3000); } } } return saved; }
async function newCtx(b) { return b.newContext({ viewport: { width: 1280, height: 900 }, userAgent: UA, locale: 'en-US' }); }

// ---------- Shopify official stores (/products.json) ----------
// [key, prefix, Brand, domain, currency, segment, eta, womenOnly]
const SHOPS = [
  ['karlparis', 'kp_', 'Karl Lagerfeld', 'https://www.karl.com', 'EUR', 'luxury', '3–4 weeks', false],
  ['dkny', 'dk_', 'DKNY', 'https://www.dkny.com', 'USD', 'lifestyle', '2–3 weeks', false],
  ['verabradley', 'vb2_', 'Vera Bradley', 'https://www.verabradley.com', 'USD', 'lifestyle', '2–3 weeks', true],
  ['stevemadden', 'sm_', 'Steve Madden', 'https://www.stevemadden.com', 'USD', 'lifestyle', '2–3 weeks', false],
  ['frye', 'fr_', 'Frye', 'https://www.thefryecompany.com', 'USD', 'lifestyle', '2–3 weeks', false],
  ['vincecamuto', 'vc_', 'Vince Camuto', 'https://www.vincecamuto.com', 'USD', 'lifestyle', '2–3 weeks', true],
  ['calpak', 'cp_', 'Calpak', 'https://www.calpaktravel.com', 'USD', 'lifestyle', '2–3 weeks', false],
  ['stanley', 'st_', 'Stanley 1913', 'https://www.stanley1913.com', 'USD', 'lifestyle', '2–3 weeks', false],
];
async function shopify(only) {
  let total = 0; const res = {};
  for (const [key, prefix, brand, dom, cur, seg, eta, womenOnly] of SHOPS) {
    if (only && !only.includes(key)) continue;
    const P = [];
    for (let page = 1; page <= 40; page++) {
      let j = null; for (let t = 0; t < 4 && !j; t++) { try { const r = await fetch(`${dom}/products.json?limit=250&page=${page}`, { headers: { 'User-Agent': UA, accept: 'application/json' } }); if (r.ok) j = await r.json(); else { console.log(key, 'http', r.status, 'try', t); if (r.status !== 429 && r.status < 500) break; await sleep(10000 * (t + 1)); } } catch (e) { await sleep(2000); } }
      if (!j || !Array.isArray(j.products) || !j.products.length) break; P.push(...j.products); await sleep(700); // no "<250 = last page" shortcut: Alo etc. return 240–249 on full pages (hidden items filtered), so only an empty page ends the loop
    }
    if (!P.length) { console.log('shop', key, 'no products'); res[key] = 0; continue; }
    const items = [];
    P.forEach((p, pos) => {
      const opts = (p.options || []).map(o => String(o.name || '').toLowerCase()); const si = opts.findIndex(n => /size|taille|maat/.test(n)); const ci = opts.findIndex(n => /colou?r|couleur|kleur/.test(n));
      const V = (p.variants || []).filter(v => Number(v.price) > 0); const av = V.filter(v => v.available); if (!av.length) return;
      if (/gift ?card|e-?gift|sample|swatch|insurance|shipping protection|route package|replacement part|lid only/i.test(p.title + ' ' + p.product_type)) return;
      const tags = Array.isArray(p.tags) ? p.tags : String(p.tags || '').split(',');
      const opt = (v, i) => v['option' + (i + 1)];
      const price = Math.min(...av.map(v => Number(v.price))); const cmp = Math.max(0, ...V.map(v => Number(v.compare_at_price) || 0));
      const imgs = (p.images || []).map(i => String(i.src || '').split('?')[0]).filter(Boolean);
      const colours = ci >= 0 ? [...new Map(av.map(v => [opt(v, ci), { n: opt(v, ci), img: v.featured_image && v.featured_image.src ? v.featured_image.src.split('?')[0] + '?width=80' : undefined }])).values()].slice(0, 12) : [];
      const sizes = si >= 0 ? [...new Set(av.map(v => String(opt(v, si))))] : [];
      const tg = (tags.join(' ') + ' ' + p.product_type + ' ' + p.title).toLowerCase();
      const gender = womenOnly ? 'Women' : /\bwomen|womens|\bher\b|ladies|dames/.test(tg) ? 'Women' : /\bmen\b|\bmens\b|\bhim\b|heren/.test(tg) ? 'Men' : '';
      items.push({ id: prefix + p.id, sku: String((V[0] && V[0].sku) || p.handle).slice(0, 60), brand, title: clean(p.title), category: clean(p.product_type) || '', gender, price, cur, tax: 0, regular: cmp > price ? cmp : null, images: imgs.slice(0, 8), colours, sizes, story: paras(p.body_html), details: bullets(p.body_html), url: dom + '/products/' + p.handle, store: dom.replace(/^https?:\/\/(www\.)?/, ''), eta, segment: seg, detail_ok: true, trend: Math.round(50 * (1 - pos / P.length) * 10) / 10 });
    });
    const s = await send(items); res[key] = s; total += s; console.log(new Date().toISOString().slice(11, 19), 'shop', key, 'products', P.length, 'saved', s);
  }
  console.log('shopify', JSON.stringify(res)); return total;
}

// ---------- Sephora US (site's own catalog API; best-selling order) ----------
// Images: www.sephora.com/productimages load for real browsers (any referer) but Akamai blocks the default 'HeadlessChrome' user agent — test with a real UA.
const SEPH_CATS = [['cat140006', 'Makeup'], ['cat150006', 'Skincare'], ['cat160006', 'Fragrance'], ['cat130038', 'Hair'], ['cat130042', 'Tools & Brushes']];
const SEPH_BRANDS = /^(dior|chanel|yves saint laurent|ysl|tom ford|charlotte tilbury|rare beauty|fenty beauty|fenty skin|drunk elephant|sol de janeiro|rhode|summer fridays|glow recipe|laneige|k[ée]rastase|dyson|armani beauty|valentino|prada|gucci|givenchy|guerlain|lanc[oô]me|est[ée]e lauder|la mer|sisley|nars|hourglass|pat mcgrath labs|natasha denona|huda beauty|benefit cosmetics|too faced|anastasia beverly hills|tatcha|sunday riley|the ordinary|paula's choice|olaplex|ouai|briogeo|moroccanoil|gisou|kayali|maison margiela|jo malone london|byredo|le labo|creed|tom ford beauty|burberry|versace|dolce&gabbana|dolce & gabbana|mugler|viktor&rolf|carolina herrera|jean paul gaultier|marc jacobs fragrances|kiehl's since 1851|clinique|shiseido|caudalie|supergoop!|tower 28 beauty|makeup by mario|danessa myricks beauty|ilia|kosas|merit|westman atelier|t3|ghd|drybar|amika|k18 biotech|living proof|bumble and bumble)$/i;
async function sephora(b) {
  let total = 0, ctx = null, p = null;
  for (let t = 0; t < 2 && !p; t++) { ctx = await newCtx(b); const pg = await ctx.newPage(); const r = await pg.goto('https://www.sephora.com/', { timeout: 90000, waitUntil: 'domcontentloaded' }).catch(() => null); await sleep(8000); if (r && r.status() < 400) p = pg; else { console.log('sephora blocked try', t, r && r.status()); await ctx.close(); await sleep(15000); } }
  if (!p) return 0;
  const all = new Map();
  for (const [cat, label] of SEPH_CATS) {
    for (const sort of ['P_BEST_SELLING%3A1', 'P_NEW%3A1']) {
      let page = 1, tot = 1, pos = 0;
      while ((page - 1) * 60 < tot && page <= 15) {
        const j = await p.evaluate(async u => { try { const r = await fetch(u, { headers: { accept: 'application/json' } }); if (!r.ok) return { err: r.status }; return await r.json(); } catch (e) { return { err: String(e) }; } }, `/api/v2/catalog/categories/${cat}/products?currentPage=${page}&pageSize=60&content=true&includeRegionsMap=true&sortBy=${sort}&loc=en-US&ch=rwd`);
        if (!j || j.err || !Array.isArray(j.products)) { console.log('sephora', cat, page, 'err', j && j.err); break; }
        tot = Number(j.totalProducts) || 0;
        for (const x of j.products) {
          const ps = pos++; if (!SEPH_BRANDS.test(clean(x.brandName))) continue;
          const sc = Math.round(trendOf(ps, tot, x.reviews, x.currentSku && x.currentSku.isBestseller) * (sort.startsWith('P_NEW') ? 0.85 : 1) * 0.45 * 10) / 10; // beauty must not dominate the store
          const e = all.get(x.productId); if (e) { e.trend = Math.max(e.trend, sc); continue; }
          const pm = String((x.currentSku && (x.currentSku.salePrice || x.currentSku.listPrice)) || '').replace(/,/g, '').match(/\d+(\.\d+)?/); const price = pm ? Number(pm[0]) : 0; if (!price) continue;
          const img = u => String(u || '').split('?')[0];
          const hero = img(x.heroImage); const imgs = [hero, img(x.altImage)].filter(Boolean);
          const cols = (x.swatchSelectors || []).slice(0, 12).map(s => ({ n: s.variationValue || s.colorName || '', img: s.swatch })).filter(c => c.img);
          all.set(x.productId, { id: 'sp_' + x.productId, sku: x.productId, brand: clean(x.brandName).replace(/^ysl$/i, 'Yves Saint Laurent'), title: clean(x.displayName), category: 'Beauty', gender: '', price, cur: 'USD', tax: 0, images: [...new Set(imgs.map(u => u + '?imwidth=900'))].slice(0, 8), colours: cols, sizes: [], story: '', details: [label, x.variationType && x.numberOfVariants > 1 ? x.numberOfVariants + ' ' + String(x.variationType).toLowerCase() + ' options' : '', x.rating ? 'Rated ' + Number(x.rating).toFixed(1) + ' / 5 by ' + Number(x.reviews || 0).toLocaleString('en-US') + ' clients' : ''].filter(Boolean), url: 'https://www.sephora.com' + String(x.targetUrl || '').split('?')[0], store: 'sephora.com', eta: '2–3 weeks', segment: 'lifestyle', detail_ok: true, trend: sc });
        }
        page++; await sleep(600);
      }
      console.log(new Date().toISOString().slice(11, 19), 'sephora', label, sort.slice(2, 6), 'kept', all.size);
      if (all.size >= 1500) break;
    }
    if (all.size >= 1500) break;
  }
  const items = [...all.values()].slice(0, 1500);
  total = await send(items); console.log('sephora saved', total); await ctx.close(); return total;
}

// ---------- Macy's (xapi search, best sellers; official brand stock only) ----------
const MACYS_OK = /^(coach|michael kors|michael michael kors|kate spade new york|kate spade|calvin klein|tommy hilfiger|polo ralph lauren|lauren ralph lauren|ralph lauren|hugo boss|boss|hugo|tory burch|marc jacobs|karl lagerfeld paris|karl lagerfeld|longchamp|ugg|dr\. martens|citizen|tissot|hamilton|movado|versace|emporio armani|armani exchange|a\|x armani exchange|ted baker|steve madden|vince camuto|dkny|guess|furla|mcm|salvatore ferragamo|ferragamo|burberry|gucci|prada|tom ford|ray-ban|oakley|on|hoka|new balance|converse|sam edelman|stuart weitzman|kurt geiger london|cole haan|frye)$/i;
const MACYS_Q = ['coach handbags', 'michael kors handbags', 'kate spade handbags', 'tory burch', 'marc jacobs bag', 'longchamp', 'karl lagerfeld paris', 'furla', 'mcm bag', 'calvin klein women', 'calvin klein men', 'tommy hilfiger men', 'tommy hilfiger women', 'polo ralph lauren men', 'lauren ralph lauren women', 'hugo boss men', 'michael kors watch', 'citizen watch', 'tissot watch', 'hamilton watch', 'movado watch', 'ugg boots', 'dr martens', 'coach shoes', 'michael kors shoes', 'steve madden', 'sam edelman', 'stuart weitzman', 'kurt geiger', 'cole haan', 'versace', 'armani exchange', 'burberry', 'ray-ban sunglasses'];
async function macys(b) {
  let ctx = null, p = null;
  for (let t = 0; t < 2 && !p; t++) { ctx = await newCtx(b); const pg = await ctx.newPage(); await pg.goto('https://www.macys.com/', { timeout: 90000, waitUntil: 'domcontentloaded' }).catch(() => null); await sleep(6000); const ok = await pg.evaluate(async () => { try { const r = await fetch('/xapi/navigate/v1/header-footer/switches'); return r.ok; } catch (e) { return false; } }); if (ok) p = pg; else { console.log('macys blocked try', t); await ctx.close(); await sleep(15000); } }
  if (!p) return 0;
  const IMG = f => 'https://slimages.macysassets.com/is/image/MCY/products/' + f + '?wid=1000&hei=1000&fmt=jpeg&qlt=85';
  const api = q => p.evaluate(async q => { try { const r = await fetch('/xapi/discover/v1/page?' + q + '&_shoppingMode=SITE&sortBy=BEST_SELLERS&productsPerPage=60&_application=SITE&_regionCode=US&currencyCode=USD&_deviceType=DESKTOP', { headers: { accept: 'application/json' } }); if (!r.ok) return { err: r.status }; return await r.json(); } catch (e) { return { err: String(e) }; } }, q);
  const grab = d => { const out = []; const walk = o => { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) { o.forEach(walk); return; } if (o.product && o.product.identifier && o.product.detail) { out.push(o.product); return; } for (const k in o) walk(o[k]); }; walk(d); let pc = 0; const m = JSON.stringify(d.meta || {}).match(/"productCount":(\d+)/) || JSON.stringify(d).match(/"productCount":(\d+)/); if (m) pc = Number(m[1]); return [out, pc]; };
  const all = new Map(); const gOf = (q, nm) => /\bmen\b|\bmen's\b/i.test(q + ' ' + nm) && !/women/i.test(q + ' ' + nm) ? 'Men' : /women|handbag|bag|wallet|tote|crossbody/i.test(q + ' ' + nm) ? 'Women' : '';
  for (const kw of MACYS_Q) {
    let base = 'pathname=/shop/search&_navigationType=SEARCH&keyword=' + encodeURIComponent(kw);
    let pos = 0;
    for (let page = 1; page <= 4; page++) {
      let d = await api(base + '&pageIndex=' + page);
      if (d && d.redirect && d.redirect.url) { const u = new URL(d.redirect.url, 'https://www.macys.com'); base = 'pathname=' + u.pathname + '&id=' + (u.searchParams.get('id') || '') + '&_navigationType=BROWSE'; d = await api(base + '&pageIndex=' + page); }
      if (!d || d.err) { console.log('macys', kw, page, 'err', d && d.err); break; }
      const [prods, pc] = grab(d); if (!prods.length) break;
      for (const x of prods) {
        const ps = pos++; const det = x.detail || {}; const br = clean(det.brand); if (!MACYS_OK.test(br)) continue; if (x.availability && x.availability.available === false) continue;
        const vals = []; ((x.pricing && x.pricing.price && x.pricing.price.tieredPrice) || []).forEach(tp => (tp.values || []).forEach(v => { if (v.type !== 'discount' && Number(v.value) > 0) vals.push(Number(v.value)); }));
        if (!vals.length) continue; const price = Math.min(...vals); const reg = Math.max(...vals);
        const id = String(x.id); const sc = trendOf(ps, pc || 240, det.reviewStatistics && det.reviewStatistics.aggregate && det.reviewStatistics.aggregate.count, false);
        const e = all.get(id); if (e) { e.trend = Math.max(e.trend, sc); continue; }
        const im = x.imagery || {}; const files = [im.primaryImage && im.primaryImage.filePath].concat((im.additionalImageSource || []).map(a => a.filePath)).filter(Boolean);
        const tr = x.traits || {}; const cols = ((tr.colors && tr.colors.colorMap) || []).slice(0, 12).map(c => ({ n: c.name, img: c.swatchImage && c.swatchImage.filePath ? IMG(c.swatchImage.filePath).replace('wid=1000&hei=1000', 'wid=80&hei=80') : undefined }));
        const sizes = ((tr.sizes && tr.sizes.sizeMap) || []).map(s => clean(s.displayName || s.name)).filter(s => s && !/^one size$/i.test(s)).slice(0, 30);
        const brandName = /^michael michael kors$/i.test(br) ? 'Michael Kors' : /^(lauren ralph lauren|polo ralph lauren)$/i.test(br) ? br.replace(/\b\w/g, m => m.toUpperCase()).replace('Lauren Ralph Lauren', 'Ralph Lauren') : /^(boss|hugo)$/i.test(br) ? 'Hugo Boss' : br.replace(/\b\w+/g, w => w.length > 3 || /^(mcm|dkny|ugg)$/i.test(w) ? (w.length <= 4 && /^(mcm|dkny|ugg)$/i.test(w) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()) : w.toLowerCase());
        all.set(id, { id: 'my_' + id, sku: id, brand: brandName, title: clean(det.name), category: clean(det.typeName || kw), gender: gOf(kw, det.name), price, cur: 'USD', tax: 0, regular: reg > price ? reg : null, images: [...new Set(files.map(IMG))].slice(0, 8), colours: cols, sizes, story: '', details: det.reviewStatistics && det.reviewStatistics.aggregate && det.reviewStatistics.aggregate.count ? ['Rated ' + Number(det.reviewStatistics.aggregate.rating).toFixed(1) + ' / 5 by ' + det.reviewStatistics.aggregate.count + ' clients'] : [], url: 'https://www.macys.com' + ((x.identifier && x.identifier.productUrl) || ''), store: 'macys.com', eta: '2–3 weeks', segment: 'luxury', detail_ok: true, trend: sc });
      }
      if (page * 60 >= (pc || 0)) break; await sleep(700);
    }
    console.log(new Date().toISOString().slice(11, 19), 'macys', kw, 'kept', all.size);
    if (all.size >= 2000) break;
  }
  const items = [...all.values()].slice(0, 2000); const total = await send(items); console.log('macys saved', total); await ctx.close(); return total;
}

// ---------- Strathberry (UK house; site's own collection API, best-sellers order, GBP) ----------
async function strathberry(b) {
  const ctx = await newCtx(b); const p = await ctx.newPage(); await p.goto('https://www.strathberry.com/', { timeout: 90000, waitUntil: 'domcontentloaded' }).catch(() => null); await sleep(6000);
  const all = new Map();
  for (const col of ['the-strathberry-designer-collection', 'small-leather-goods', 'accessories']) {
    let after = '', pos = 0;
    for (let k = 0; k < 20; k++) {
      const j = await p.evaluate(async u => { try { const r = await fetch(u); if (!r.ok) return { err: r.status }; return await r.json(); } catch (e) { return { err: String(e) }; } }, `/api/collections/${col}/products?count=48&sortKey=bestsellers-asc&available=true` + (after ? '&next=' + encodeURIComponent(after) : ''));
      const D = j && j.data; if (!D || !Array.isArray(D.products)) { console.log('strath', col, k, 'err', j && j.err); break; }
      for (const x of D.products) {
        const ps = pos++; const V = ((x.variants && x.variants.edges) || []).map(e => e.node).filter(v => v.availableForSale && !v.currentlyNotInStock); if (!V.length || all.has(x.id)) continue;
        const price = Math.min(...V.map(v => Number(v.price && v.price.amount) || 1e9)); if (!(price < 1e9)) continue; const cur = (V[0].price && V[0].price.currencyCode) || 'GBP';
        const reg = Math.max(...V.map(v => Number(v.compareAtPrice && v.compareAtPrice.amount) || 0));
        const imgs = ((x.media && x.media.nodes) || []).map(m => m.previewImage && m.previewImage.url).filter(Boolean).map(u => u.split('?')[0]);
        const sizes = V.map(v => v.title).filter(t => t && !/default title/i.test(t));
        const tags = (x.tags || []).map(String);
        all.set(x.id, { id: 'sb_' + String(x.id).split('/').pop(), sku: (V[0].sku || x.handle).slice(0, 60), brand: 'Strathberry', title: clean(x.title), category: (x.category && x.category.name) || x.productType || 'Bags', gender: 'Women', price, cur, tax: 0, regular: reg > price ? reg : null, images: (imgs.length ? imgs : [x.featuredImage && x.featuredImage.url].filter(Boolean)).slice(0, 8), colours: x.swatch ? [{ n: x.swatch }] : [], sizes, story: paras(x.descriptionHtml), details: [x.metafields && x.metafields.family ? 'From the ' + x.metafields.family + ' family' : '', x.metafields && x.metafields.size ? 'Size: ' + x.metafields.size : '', tags.includes('grain-leather') ? 'Grain leather' : '', tags.includes('gold-hardware') ? 'Gold hardware' : '', 'Handmade in Spain'].filter(Boolean), url: 'https://www.strathberry.com/products/' + x.handle, store: 'strathberry.com', eta: '3–4 weeks', segment: 'luxury', detail_ok: true, trend: trendOf(ps, 220, 0, tags.includes('bestseller')) });
      }
      const pi = D.pageInfo || {}; if (!pi.hasNextPage || !pi.endCursor) break; after = pi.endCursor; await sleep(600);
    }
    console.log(new Date().toISOString().slice(11, 19), 'strath', col, 'kept', all.size);
  }
  const total = await send([...all.values()]); console.log('strath saved', total); await ctx.close(); return total;
}

// ---------- Furla (SFCC tiles + Product-Variation JSON) ----------
async function furla(b) {
  let total = 0; const seen = new Set();
  for (const [path, g] of [['women/bags/', 'Women'], ['women/small-leather-goods/', 'Women'], ['women/shoes/', 'Women'], ['women/accessories/', 'Women'], ['men/bags/', 'Men'], ['men/small-leather-goods/', 'Men']]) {
    let ctx = await newCtx(b); let p = await ctx.newPage(); const list = []; let fails = 0;
    for (let start = 0; start < 1500;) {
      let pids = null;
      try { await p.goto(`https://www.furla.com/us/en/eshop/${path}?start=${start}&sz=48`, { timeout: 90000, waitUntil: 'domcontentloaded' }); await sleep(4000 + Math.random() * 2000); pids = await p.evaluate(() => [...new Set([...document.querySelectorAll('[data-pid]')].map(e => e.getAttribute('data-pid')))]); } catch (e) { pids = null; }
      if (pids === null || (!pids.length && start === 0)) { if (++fails > 2) { console.log('furla give up', path); break; } await ctx.close().catch(() => {}); await sleep(15000); ctx = await newCtx(b); p = await ctx.newPage(); continue; }
      const fresh = pids.filter(x => !seen.has(x)); fresh.forEach(x => { seen.add(x); list.push(x); }); if (pids.length < 48 || !fresh.length) break; start += 48;
    }
    const items = [];
    for (let i = 0; i < list.length; i++) {
      const pid = list[i]; await sleep(300 + Math.random() * 500);
      const d = await p.evaluate(async pid => { try { const r = await fetch('/on/demandware.store/Sites-furla-us-Site/en_US/Product-Variation?pid=' + encodeURIComponent(pid)); if (!r.ok) return null; const P = (await r.json()).product || {}; const va = P.variationAttributes || []; const col = va.find(a => /colou?r/i.test(a.attributeId || a.id || '')); const sz = va.find(a => /size/i.test(a.attributeId || a.id || ''));
        return { name: P.productName, id: P.id, price: P.price && (P.price.sales || {}).value, list: P.price && P.price.list && P.price.list.value, story: P.shortDescription || '', long: P.longDescription || '', imgs: ((P.images && P.images.large) || []).map(x => x.absURL || x.url), cols: col ? (col.values || []).filter(v => v.selectable !== false).map(v => ({ n: v.displayValue, img: v.images && v.images.swatch && v.images.swatch[0] ? v.images.swatch[0].url : undefined })) : [], sizes: sz ? (sz.values || []).filter(v => v.selectable).map(v => v.displayValue) : null, avail: P.available !== false, url: P.selectedProductUrl || '' }; } catch (e) { return null; } }, pid);
      if (!d || !d.price || !d.avail || (d.sizes && !d.sizes.length)) continue;
      items.push({ id: 'fu_' + pid, sku: d.id || pid, brand: 'Furla', title: clean(d.name), category: path.split('/')[1].replace(/-/g, ' '), gender: g, price: Number(d.price), cur: 'USD', tax: 0, regular: d.list && d.list > d.price ? d.list : null, images: [...new Set(d.imgs.map(u => String(u).split('?')[0] + '?quality=high&im=Resize%3D%281000%2C1000%29'))].slice(0, 8), colours: d.cols.slice(0, 12), sizes: d.sizes || [], story: strip(d.story), details: bullets(d.long), url: d.url ? 'https://www.furla.com' + d.url.replace(/^https?:\/\/[^/]+/, '') : 'https://www.furla.com/us/en/eshop/' + path, store: 'furla.com', eta: '2–3 weeks', segment: 'luxury', detail_ok: true, trend: trendOf(i, list.length, 0, false) });
    }
    const s2 = await send(items); total += s2; console.log(new Date().toISOString().slice(11, 19), 'furla', path, 'listed', list.length, 'saved', s2);
    await ctx.close().catch(() => {}); await sleep(8000);
  }
  return total;
}

(async () => {
  if (!KEY) { console.log('LX_CAT_KEY missing'); process.exit(1); }
  const which = (process.argv[2] || 'shopify,sephora,macys,strath,furla').split(',');
  // CI (catalog-sync.yml) passes an explicit list without 'shopify', so Karl Paris/DKNY/Steve Madden/Frye/Vince Camuto/Calpak/Stanley/Vera Bradley never refreshed (stale since 28 Oct). Shopify is plain fetch, no browser — always include it on CI unless MORE_SHOPIFY=0.
  if (process.env.GITHUB_ACTIONS === 'true' && process.env.MORE_SHOPIFY !== '0' && !which.includes('shopify')) which.unshift('shopify');
  const started = new Date().toISOString(); const res = {};
  if (which.includes('shopify')) res.shopify = await shopify(process.env.SHOPS ? process.env.SHOPS.split(',') : null).catch(e => (console.log('shopify fail', e.message), 0));
  const needB = which.some(w => ['sephora', 'macys', 'strath', 'furla'].includes(w));
  const b = needB ? await chromium.launch({ executablePath: EXE, args: ['--no-sandbox', '--headless=new', '--disable-blink-features=AutomationControlled'] }) : null;
  if (which.includes('sephora')) res.sephora = await sephora(b).catch(e => (console.log('sephora fail', e.message), 0));
  if (which.includes('macys')) res.macys = await macys(b).catch(e => (console.log('macys fail', e.message), 0));
  if (which.includes('strath')) res.strath = await strathberry(b).catch(e => (console.log('strath fail', e.message), 0));
  if (which.includes('furla')) res.furla = await furla(b).catch(e => (console.log('furla fail', e.message), 0));
  console.log('DONE', JSON.stringify(res), 'started', started);
  if (b) await b.close();
})();
