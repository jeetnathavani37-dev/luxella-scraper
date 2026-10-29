// Hyped sneakers & streetwear from GOAT (US). Each page load uses a fresh browser context (Cloudflare blocks a 2nd navigation).
// Search pages give the products; each product page gives per-size prices (buy_bar_data, new + good box only).
// Prices are USD + GOAT shipping, sent to lx-catalog ingest with per-size amounts. Ids: gt_<templateId>.
// Usage: LX_CAT_KEY=... node scripts/goat_scrape.js [maxProducts]
const { chromium } = require('playwright');
const KEY = process.env.LX_CAT_KEY || (process.env.LX_CAT_KEY_FILE ? require('fs').readFileSync(process.env.LX_CAT_KEY_FILE, 'utf8').trim() : ''); const FN = 'https://qzripzgbstvxkfobzhyv.supabase.co/functions/v1/lx-catalog';
const EXE = process.env.CHROME || undefined;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SHIP_USD = 15;            // GOAT US shipping to the forwarder
const MAX_USD = 800;            // keeps landed price under the ₹1L cap
const LIMIT = Number(process.argv[2]) || 900;
const Q = [
  // sneakers
  'jordan 1 high', 'jordan 1 low', 'jordan 1 mid', 'jordan 3', 'jordan 4', 'jordan 5', 'jordan 6', 'jordan 11', 'jordan 12', 'jordan 13', 'travis scott jordan',
  'nike dunk low', 'nike dunk high', 'nike sb dunk', 'nike air force 1', 'nike air max 1', 'nike air max 90', 'nike air max 95', 'nike vomero 5', 'nike p-6000', 'nike cortez', 'off-white nike', 'nike kobe', 'nike book 1',
  'adidas samba', 'adidas gazelle', 'adidas campus', 'adidas sl 72', 'adidas taekwondo', 'yeezy 350', 'yeezy slide', 'yeezy foam runner', 'adidas handball spezial',
  'new balance 550', 'new balance 990', 'new balance 2002r', 'new balance 9060', 'new balance 1906r', 'new balance 530', 'new balance 204l',
  'asics gel-kayano 14', 'asics gel-1130', 'asics gel-nyc', 'salomon xt-6', 'onitsuka tiger mexico 66', 'puma speedcat', 'converse chuck 70', 'vans old skool',
  // streetwear
  'fear of god essentials hoodie', 'essentials sweatpants', 'supreme box logo', 'supreme hoodie', 'stussy hoodie', 'stussy tee', 'bape hoodie', 'denim tears',
  'sp5der hoodie', 'hellstar', 'corteiz', 'represent hoodie', 'palm angels', 'off-white hoodie', 'travis scott cactus jack', 'chrome hearts tee', 'gallery dept', 'aime leon dore',
];
const BRAND = b => { const s = String(b || '').toLowerCase(); if (s === 'air jordan' || s === 'jordan') return 'Jordan'; if (s === 'adidas' || s === 'yeezy') return s === 'yeezy' ? 'Yeezy' : 'Adidas'; if (s === 'fear of god essentials' || s === 'essentials') return 'Essentials'; if (s === 'a bathing ape' || s === 'bape') return 'A Bathing Ape'; if (s === 'stussy' || s === 'stüssy') return 'Stüssy'; return String(b || '').replace(/\b\w/g, c => c.toUpperCase()); };
async function fresh(b) { const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, userAgent: UA, locale: 'en-US' }); await ctx.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => undefined }); }); return ctx; }
async function send(items) { let saved = 0; for (let i = 0; i < items.length; i += 150) { for (let t = 0; t < 3; t++) { try { const r = await fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-lx-key': KEY }, body: JSON.stringify({ action: 'ingest', items: items.slice(i, i + 150) }) }); const j = await r.json().catch(() => ({})); saved += j.saved || 0; if (!j.ok) console.log('ingest error', j.error); break; } catch (e) { await sleep(3000); } } } return saved; }
async function capture(b, url, re, waitMs) {
  const ctx = await fresh(b); const p = await ctx.newPage(); const out = [];
  p.on('response', async r => { if (re.test(r.url())) { try { out.push(await r.json()); } catch (e) {} } });
  let st = 0; try { const r = await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }); st = r ? r.status() : 0; } catch (e) {}
  for (let w = 0; w < waitMs / 500 && !out.length && st === 200; w++) await sleep(500);
  if (out.length && /search/.test(url)) await sleep(2500); // let pages 2–3 arrive
  await ctx.close(); return { st, out };
}
(async () => {
  if (!KEY) { console.log('LX_CAT_KEY missing'); process.exit(1); }
  const b = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox', '--headless=new', '--disable-blink-features=AutomationControlled'] });
  const all = new Map();
  for (let qi = 0; qi < Q.length; qi++) {
    const q = Q[qi]; let res = null;
    for (let t = 0; t < 2 && !(res && res.out.length); t++) { res = await capture(b, 'https://www.goat.com/search?query=' + encodeURIComponent(q), /get-product-search-results/, 14000); if (!res.out.length) await sleep(4000); }
    let pos = 0;
    for (const j of res.out) for (const x of ((j.data || {}).productsList || [])) {
      pos++; if (!x.inStock || all.has(x.id)) continue;
      const v = (x.variantsList || [])[0] || {}; const low = ((v.localizedLowestPriceCents || {}).amountCents || 0) / 100; if (!low || low > MAX_USD) continue;
      const sneaker = x.productType === 'sneakers' || x.category === 'shoes';
      all.set(x.id, { tid: x.id, slug: x.slug, title: String(x.title || '').replace(/\s+/g, ' ').trim(), brand: BRAND(x.brandName), sneaker, gender: x.gender, silhouette: x.silhouette || '', year: x.releaseDate && x.releaseDate.seconds ? new Date(x.releaseDate.seconds * 1000).getUTCFullYear() : '', retail: ((x.localizedRetailPriceCents || {}).amountCents || 0) / 100, img: x.pictureUrl, trend: Math.round((96 - qi * 0.25 - Math.min(pos, 36) * 0.9) * 10) / 10, cat: x.category });
    }
    console.log(new Date().toISOString().slice(11, 19), 'q', qi + 1, '/', Q.length, q, 'status', res.st, 'total', all.size);
    await sleep(1200);
  }
  const list = [...all.values()].sort((a, c) => c.trend - a.trend).slice(0, LIMIT); const batch = []; let saved = 0, done = 0, blocked = 0;
  for (const it of list) {
    const res = await capture(b, 'https://www.goat.com/' + (it.sneaker ? 'sneakers' : 'apparel') + '/' + it.slug, /buy_bar_data/, 12000);
    done++; const V = Array.isArray(res.out[0]) ? res.out[0] : [];
    if (res.st === 403) { blocked++; await sleep(15000); }
    const by = new Map();
    for (const v of V) { if (v.shoeCondition !== 'new_no_defects' || !/good_condition/.test(v.boxCondition || '') || v.stockStatus === 'not_in_stock') continue; const usd = ((v.lowestPriceCents || {}).amount || 0) / 100; if (!usd || usd > MAX_USD) continue; const lab = String((v.sizeOption || {}).presentation || ''); if (!lab) continue; const k = lab; const amt = usd + SHIP_USD; if (!by.has(k) || by.get(k) > amt) by.set(k, amt); }
    const sizes = [...by.entries()].sort((a, c) => (parseFloat(a[0]) || 0) - (parseFloat(c[0]) || 0)).map(([s, amt]) => ({ s: it.sneaker ? 'US ' + s : s.toUpperCase(), amt }));
    if (!sizes.length) { if (done % 25 === 0) console.log('details', done, '/', list.length, 'saved', saved, 'blocked', blocked); continue; }
    const usd = Math.min(...sizes.map(x => x.amt));
    const g = String(it.gender || '').toLowerCase(); const gender = it.sneaker ? 'Unisex' : (g === 'women' ? 'Women' : g === 'men' ? 'Men' : 'Unisex');
    batch.push({ id: 'gt_' + it.tid, sku: it.slug, brand: it.brand, title: it.title, category: it.sneaker ? 'sneakers' : 'clothing', gender, usd, regular_usd: it.retail || null, images: [it.img], sizes, colours: [],
      details: [it.silhouette && 'Silhouette: ' + it.silhouette, it.year && 'Released: ' + it.year, 'Brand new, unworn, in the original box', 'Authenticated before it is dispatched to you', 'Price shown per size — sizes move fast'].filter(Boolean),
      story: (it.sneaker ? 'One of the most wanted pairs right now. ' : 'A hyped piece from the street-culture houses. ') + 'Each size is priced on its own, because supply decides — pick yours and we lock it in.',
      descr: it.silhouette || '', url: 'https://www.goat.com/' + (it.sneaker ? 'sneakers' : 'apparel') + '/' + it.slug, store: 'goat.com', eta: '2–3 weeks', trend: it.trend, detail_ok: true, segment: 'drip' });
    if (batch.length >= 60) { saved += await send(batch.splice(0)); }
    if (done % 25 === 0) console.log(new Date().toISOString().slice(11, 19), 'details', done, '/', list.length, 'saved', saved, 'blocked', blocked);
    await sleep(700);
  }
  saved += await send(batch.splice(0));
  console.log('GOAT done · listed', all.size, '· saved', saved, '· blocked', blocked);
  await b.close();
})();
