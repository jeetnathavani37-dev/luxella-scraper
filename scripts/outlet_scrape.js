// Outlet scraper → The Collection. Runs a real browser (sites block plain HTTP), reads each store's own listing data,
// and sends items to the lx-catalog edge function (action "ingest"), which prices them with the Luxella formula.
// Usage: LX_CAT_KEY=... node scripts/outlet_scrape.js [coach,ks,mk,tb]
const { chromium } = require('playwright');
const KEY = process.env.LX_CAT_KEY; const FN = 'https://qzripzgbstvxkfobzhyv.supabase.co/functions/v1/lx-catalog';
const EXE = process.env.CHROME || undefined;
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function send(items) { if (!items.length) return 0; let saved = 0; for (let i = 0; i < items.length; i += 200) { const r = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-lx-key': KEY }, body: JSON.stringify({ action: 'ingest', items: items.slice(i, i + 200) }) }); const j = await r.json().catch(() => ({})); saved += j.saved || 0; if (!j.ok) console.log('ingest error', j.error); } return saved; }
const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
// ---------- Tapestry (Coach Outlet, Kate Spade Outlet) ----------
async function tapestry(ctx, o) {
  const p = await ctx.newPage(); await p.goto(o.landing, { timeout: 90000, waitUntil: 'domcontentloaded' }); await sleep(7000); let total = 0;
  for (const path of o.paths) {
    let page = 1, pages = 1; const batch = [];
    do {
      const j = await p.evaluate(async u => { try { const r = await fetch(u, { headers: { accept: 'application/json' } }); if (!r.ok) return { err: r.status }; return await r.json(); } catch (e) { return { err: String(e) }; } }, `${o.api}${path}?page=${page}`);
      if (!j || j.err || !j.pageData) { console.log(o.store, path, page, 'err', j && j.err); break; }
      pages = j.pageData.totalPages || 1;
      for (const x of j.pageData.products || []) {
        const pr = x.prices || {}; const usd = Number(pr.currentPrice); if (!usd) continue;
        const imgs = ((x.media && x.media.full) || []).map(m => m.src).filter(Boolean);
        const alt = ((x.media && x.media.full && x.media.full[0]) || {}).alt || '';
        const attrs = [...new Set(alt.split(',').map(clean).filter(a => a && !/^(coach|kate spade)(®)?$/i.test(a) && !/(front|back|side|detail|angle|inside|alternate) view|^image \d|®/i.test(a) && a.toLowerCase() !== clean(x.name).toLowerCase()))].slice(0, 8);
        const cs = (x.colors || []).filter(c => c.orderable !== false).map(c => ({ n: c.text, img: c.image && c.image.src }));
        const sizes = (x.variationValues && x.variationValues.size) ? [] : [];
        batch.push({ id: o.prefix + x.masterId, sku: x.masterId, brand: o.brand, title: clean(x.name), category: (x.custom && x.custom.c_classification) || o.cat || '', gender: o.gender || '', usd, regular_usd: pr.regularPrice, images: imgs.slice(0, 8), colours: cs, sizes, descr: [attrs.join(' · '), (x.custom && x.custom.c_material) ? 'Material: ' + x.custom.c_material : ''].filter(Boolean).join('. '), url: o.site + '/products/' + encodeURIComponent(clean(x.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')) + '/' + x.masterId + '.html', store: o.store, eta: '2–3 weeks' });
      }
      if (page % 6 === 0 || page >= pages) { const seen = new Set(); const uniq = batch.splice(0).filter(b => !seen.has(b.id) && seen.add(b.id)); const s = await send(uniq); total += s; console.log(new Date().toISOString().slice(11,19), o.store, path, 'page', page, '/', pages, 'saved', s); }
      page++; await sleep(400);
    } while (page <= pages && page <= (o.maxPages || 200));
  }
  await p.close(); return total;
}
// ---------- Michael Kors Outlet (SFCC HTML tiles) — fresh browser context per category, retries with backoff ----------
async function mkCtx(b) { return b.newContext({ viewport: { width: 1280, height: 900 }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36', locale: 'en-US' }); }
async function mk(b, cats) {
  let total = 0;
  for (const [cat, g] of cats || [['handbags', 'Women'], ['wallets', 'Women'], ['shoes', ''], ['watches', ''], ['accessories', ''], ['clothing', '']]) {
    let ctx = await mkCtx(b); let p = await ctx.newPage(); let start = 0, fails = 0;
    try { await p.goto('https://www.michaelkors.com/outlet/', { timeout: 90000, waitUntil: 'domcontentloaded' }); await sleep(5000); } catch (e) {}
    while (start < 3000) {
      const u = `https://www.michaelkors.com/outlet/${cat}/?start=${start}&sz=96`; let items = [];
      try {
        await p.goto(u, { timeout: 90000, waitUntil: 'domcontentloaded' }); await sleep(4000 + Math.random() * 3000);
        items = await p.evaluate(() => [...document.querySelectorAll('[data-pid].product-tile-show')].map(t => {
          const a = t.querySelector('a.product-tile-image-link') || t.querySelector('a[href*=".html"]');
          const name = (a && a.getAttribute('aria-label')) || (t.querySelector('.pdp-link a, .link') || {}).textContent || '';
          const val = s => { const e = t.querySelector(s); return e ? (e.getAttribute('content') || e.textContent || '').replace(/[^0-9.]/g, '') : ''; };
          const imgs = [...t.querySelectorAll('img')].map(i => i.getAttribute('data-src') || i.getAttribute('src') || '').filter(x => /^https:\/\/assets\.michaelkors/.test(x));
          const sw = [...t.querySelectorAll('[data-attr-value], .swatch-circle, button[aria-label*="olor"]')].map(e => e.getAttribute('aria-label') || e.getAttribute('title') || e.getAttribute('data-attr-value')).filter(Boolean);
          return { pid: t.getAttribute('data-pid'), name: name.trim(), sale: val('.sales .value'), list: val('.strike-through .value, .list .value'), imgs, href: a ? a.href.split('?')[0] : '', sw };
        }));
      } catch (e) { items = null; }
      if (items === null || (!items.length && start === 0)) {
        if (++fails > 3) { console.log('mk give up', cat, start); break; }
        console.log('mk retry', cat, start, 'fail', fails); await ctx.close().catch(() => {}); await sleep(20000 * fails);
        ctx = await mkCtx(b); p = await ctx.newPage(); continue;
      }
      fails = 0; if (!items.length) break;
      const batch = [];
      for (const x of items) { const usd = Number(x.sale || x.list); if (!usd || !x.name) continue; const gg = g || (/\bmen'?s\b|\bmens\b/i.test(x.name + ' ' + x.href) ? 'Men' : 'Women'); batch.push({ id: 'mk_' + x.pid, sku: x.pid, brand: 'Michael Kors', title: x.name, category: cat, gender: gg, usd, regular_usd: Number(x.list) || null, images: [...new Set(x.imgs.map(s => s.replace('ECOM_Image_Medium', 'ECOM_Image_Large')))].slice(0, 8), colours: [...new Set(x.sw)].slice(0, 12).map(n => ({ n })), descr: '', url: x.href, store: 'michaelkors.com/outlet', eta: '2–3 weeks' }); }
      const seen = new Set(); const uniq = batch.filter(b2 => !seen.has(b2.id) && seen.add(b2.id)); const s2 = await send(uniq); total += s2;
      console.log(new Date().toISOString().slice(11, 19), 'mk', cat, 'start', start, 'items', items.length, 'saved', s2);
      if (items.length < 96) break; start += 96;
    }
    await ctx.close().catch(() => {}); await sleep(15000);
  }
  return total;
}
// ---------- Tory Burch (site's own product API, headers captured from the page) ----------
async function tb(b) {
  const ctx = await mkCtx(b); const p = await ctx.newPage(); let H = null, total = 0;
  p.on('request', r => { if (/\/categories\/.*\/products/.test(r.url())) H = r.headers(); });
  await p.goto('https://www.toryburch.com/en-us/sale/', { timeout: 90000, waitUntil: 'domcontentloaded' }); await sleep(10000);
  if (!H) { console.log('tb: no api headers'); await ctx.close(); return 0; }
  const hh = {}; for (const k of ['authorization', 'x-api-key', 'accept']) if (H[k]) hh[k] = H[k];
  const img = c => `https://s7.toryburch.com/is/image/ToryBurch/${c}.pdp-767x872.jpg`;
  const seenAll = new Set();
  for (const cat of ['sale-view-all', 'handbags-view-all', 'shoes-view-all', 'wallets-small-accessories', 'accessories-view-all', 'jewelry-view-all', 'clothing-view-all', 'watches']) {
    let off = 0, tot = 1;
    while (off < tot && off < 3000) {
      const j = await p.evaluate(async ([u, h]) => { try { const r = await fetch(u, { headers: h }); if (!r.ok) return { err: r.status }; return await r.json(); } catch (e) { return { err: String(e) }; } }, [`/api/prod-r2/v12/categories/${cat}/products?site=ToryBurch_US&locale=en-us&pip=true&limit=50&offset=${off}&layout=flex`, hh]);
      if (!j || j.err || !Array.isArray(j.products)) { console.log('tb', cat, off, 'err', j && j.err); break; }
      tot = j.total || 0; const batch = [];
      for (const x of j.products) {
        if (!x.id || seenAll.has(x.id)) continue; seenAll.add(x.id);
        const sw = (x.swatches || []).filter(s => !s.soldOut); if (!sw.length) continue;
        const usd = Number((sw[0].price || x.price || {}).min); if (!usd) continue;
        const images = [...new Set(sw.flatMap((s, i) => (s.images || []).slice(0, i ? 1 : 6)))].slice(0, 8).map(img);
        const cls = x.productClassName || x.productDepartmentName || '';
        batch.push({ id: 'tb_' + x.id, sku: x.styleId || x.id, brand: 'Tory Burch', title: String(x.name || '').trim(), category: (x.productDepartmentName || '') + ' ' + cls, gender: /men/i.test(x.productDepartmentId || '') && !/women/i.test(x.productDepartmentId || '') ? 'Men' : 'Women', usd, regular_usd: null, images, colours: sw.slice(0, 12).map(s => ({ n: s.colorName, img: s.imageCode ? img(s.imageCode + '_SLANG') : undefined })), sizes: x.oneSize ? [] : (x.sizes || []).map(z => z.name).slice(0, 20), descr: [cls, x.productFamilyId ? 'From the ' + x.productFamilyId.replace(/-/g, ' ').replace(/\b\w/g, m => m.toUpperCase()) + ' collection' : ''].filter(Boolean).join('. '), url: 'https://www.toryburch.com/en-us/' + (x.staticURL || '') + '/' + x.id + '.html', store: 'toryburch.com', eta: '2–3 weeks' });
      }
      const s2 = await send(batch); total += s2; console.log(new Date().toISOString().slice(11, 19), 'tb', cat, 'offset', off, '/', tot, 'saved', s2);
      off += 50; await sleep(800);
    }
  }
  await ctx.close(); return total;
}
(async () => {
  if (!KEY) { console.log('LX_CAT_KEY missing'); process.exit(1); }
  const which = (process.argv[2] || 'coach,ks,mk').split(',');
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox', '--headless=new', '--disable-blink-features=AutomationControlled'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36', locale: 'en-US' });
  const started = new Date().toISOString(); const res = {};
  if (which.includes('coach')) res.coach = await tapestry(ctx, { store: 'coachoutlet.com', brand: 'Coach', prefix: 'co_', landing: 'https://www.coachoutlet.com/shop/women/view-all', api: 'https://www.coach.com/api/get-shop/', site: 'https://www.coachoutlet.com', paths: ['outlet/women/view-all', 'outlet/men/view-all'] }).catch(e => (console.log('coach fail', e.message), 0));
  if (which.includes('ks')) res.ks = await tapestry(ctx, { store: 'katespadeoutlet.com', brand: 'Kate Spade', prefix: 'ks_', gender: 'Women', landing: 'https://www.katespadeoutlet.com/shop/handbags/view-all', api: 'https://www.katespadeoutlet.com/api/get-shop/', site: 'https://www.katespadeoutlet.com', paths: ['handbags/view-all', 'wallets/view-all', 'shoes/view-all', 'jewelry/view-all', 'clothing/view-all', 'accessories/view-all'] }).catch(e => (console.log('ks fail', e.message), 0));
  if (which.includes('mk')) res.mk = await mk(b, process.env.MK_CATS ? process.env.MK_CATS.split(',').map(c => [c, '']) : null).catch(e => (console.log('mk fail', e.message), 0));
  if (which.includes('tb')) res.tb = await tb(b).catch(e => (console.log('tb fail', e.message), 0));
  console.log('DONE', JSON.stringify(res), 'started', started);
  await b.close();
})();
