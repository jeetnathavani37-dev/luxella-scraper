// lx-catalog: pulls the partner luxury catalogue (Shopify JSON), prices it at a set discount and stores client-safe rows in lx_catalog.
// Source details (handle, source prices) go to lx_catalog_src, which clients can never read.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const OWNERS = ["jeetnathavani37@gmail.com", "jeetnatb@gmail.com"];
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info, x-lx-key", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const J = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const SRC = "https://www.kicksmachine.com";
async function cfg() { const { data } = await db.from("lx_km_vault").select("data").eq("id", "catalogcfg").maybeSingle(); return data?.data || {}; }
async function allowed(req: Request, c: any) {
  const k = req.headers.get("x-lx-key") || ""; if (c.key && k === c.key) return true;
  const a = req.headers.get("authorization") || ""; if (!a.startsWith("Bearer ")) return false;
  const { data } = await db.auth.getUser(a.slice(7)); return OWNERS.includes(String(data?.user?.email || "").toLowerCase());
}
const CAT1 = (s: string) => {
  if (/watch/.test(s)) return "Watches"; if (/sunglass|eyewear/.test(s)) return "Eyewear";
  if (/wallet|card holder|cardholder|card case|pouch|key ?ring|keychain/.test(s)) return "Small leather goods";
  if (/\bbag|tote|clutch|backpack|crossbody|shoulder|hobo|satchel|hourglass|shopper|duffle|messenger/.test(s)) return "Bags";
  if (/loafer|boot|sandal|slide|heel|pump|mule|espadrille|ballet|flat|derby|oxford|moccasin|slipper/.test(s)) return "Shoes";
  if (/sneaker|trainer|runner|\bshoe/.test(s)) return "Sneakers";
  if (/belt|scarf|muffler|\bcap\b|hat|\btie\b|jewel|bracelet|necklace|\bring\b|earring|perfume|fragrance|glove/.test(s)) return "Accessories";
  if (/shirt|tee|t-shirt|hoodie|sweat|jacket|coat|dress|trouser|pant|jean|short|skirt|knit|polo|blazer|suit|\btop\b|cardigan|jumper|vest|gilet/.test(s)) return "Clothing";
  return "";
};
const CAT = (t: string, tags: string[], title: string) => CAT1((t + " " + title).toLowerCase()) || CAT1(tags.join(" ").toLowerCase()) || t || "Other";
function mapProduct(p: any, disc: number, seg = "luxury", vend = "", on = true) {
  if (vend && !String(p.vendor || "").toLowerCase().includes(vend.toLowerCase())) return null;
  const tags: string[] = Array.isArray(p.tags) ? p.tags : String(p.tags || "").split(",").map((x: string) => x.trim());
  const av = (p.variants || []).filter((v: any) => v.available && Number(v.price) > 0);
  if (!av.length) return null;
  const rnd = (x: number) => Math.round(x * (1 - disc / 100) / 100) * 100;
  const sizes = av.map((v: any) => ({ s: String(v.title || "").replace(/^Default Title$/, "One size").slice(0, 40), p: rnd(Number(v.price)) }));
  const price = Math.min(...sizes.map((x: any) => x.p));
  const cmp = Math.max(0, ...av.map((v: any) => Number(v.compare_at_price) || 0));
  const minSrc = Math.min(...av.map((v: any) => Number(v.price)));
  const mrp = cmp > minSrc ? Math.round(cmp / 100) * 100 : null;
  const gender = tags.some((t) => /^women$/i.test(t)) && tags.some((t) => /^men$/i.test(t)) ? "Unisex" : tags.some((t) => /^women$/i.test(t)) ? "Women" : tags.some((t) => /^men$/i.test(t)) ? "Men" : "";
  const ship = av.some((v: any) => /instant/i.test(v.title)) ? "ready" : tags.some((t) => /^eta$/i.test(t)) ? "eta" : "";
  const brand = canonBrand(String(p.vendor || "").replace(/kicks ?machine/ig, "").trim(), String(p.title || "")).slice(0, 60);
  const title = String(p.title || "").replace(/kicks ?machine/ig, "").replace(/\s+/g, " ").trim().slice(0, 160);
  const images = (p.images || []).slice(0, 6).map((i: any) => String(i.src || "").split("?")[0]).filter(Boolean);
  if (!images.length) return null;
  return { row: { id: "c" + p.id, brand, title, category: CAT(String(p.product_type || ""), tags, title), gender, price, mrp: null && mrp, sizes, images, ship, segment: seg, active: on && !OUTLET_BRANDS.has(brand), seen_at: new Date().toISOString() }, src: { id: "c" + p.id, src_handle: String(p.handle || ""), src_prices: av.map((v: any) => [v.title, Number(v.price)]), updated_at: new Date().toISOString() } };
}
const BR = ["Hermès","Louis Vuitton","Chanel","Dior","Gucci","Prada","Miu Miu","Bottega Veneta","Saint Laurent","Celine","Fendi","Loewe","Balenciaga","Valentino Garavani","Valentino","Givenchy","Versace","Burberry","Ferragamo","Tod's","Loro Piana","Brunello Cucinelli","Zegna","Moncler","Alexander McQueen","Alexander Wang","Balmain","Lanvin","Chloé","Jacquemus","Jil Sander","Maison Margiela","Marni","Off-White","Amiri","Rick Owens","Golden Goose","Christian Louboutin","Jimmy Choo","Goyard","MCM","Mulberry","Longchamp","Tory Burch","Coach","Michael Kors","Kate Spade","Karl Lagerfeld","Marc Jacobs","Polo Ralph Lauren","Ralph Lauren","Ted Baker","Emporio Armani","Giorgio Armani","Armani Exchange","EA7","Armani","Kenzo","Ami Paris","Alaïa","Dolce & Gabbana","Philipp Plein","Tom Ford","Rimowa","Montblanc","Bvlgari","Cartier","Rolex","Omega","Tag Heuer","Rado","Hamilton","Citizen","Tissot","Longines","Swatch","Gentle Monster","Ganni","RM Williams","Maison Mihara Yasuhiro","Denim Tears","Sp5der","KAWS","Hellstar","Supreme","Rhude","A.P.C.","Mastermind","Godspeed","On","Lululemon","UGG","Dr. Martens","JW Pei","Converse","Salomon","Autry","Sprayground","New Era","Matin Kim","Diesel","Hugo Boss","Calvin Klein","Tommy Hilfiger"];
const fold = (x: string) => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9&]+/g, " ").trim();
const BRF = BR.map((b) => [fold(b), b] as [string, string]).sort((a, b) => b[0].length - a[0].length);
const FIX: Record<string, string> = { "hermes": "Hermès", "louisvuitton": "Louis Vuitton", "blalenciaga": "Balenciaga", "chloe": "Chloé", "off white": "Off-White", "offwhite": "Off-White", "dr martens": "Dr. Martens", "maison mihara yasuhio": "Maison Mihara Yasuhiro", "alaia": "Alaïa", "bulgari": "Bvlgari" };
const OUTLET_BRANDS = new Set(["Michael Kors", "Coach", "Kate Spade"]);
function canonBrand(vendor: string, title: string) {
  for (const s of [vendor, title]) { const f = fold(s); if (FIX[f]) return FIX[f]; for (const [k, v] of BRF) if (f === k || f.startsWith(k + " ")) return v; for (const [k, v] of Object.entries(FIX)) if (f.startsWith(k + " ")) return v; }
  const ft = fold(vendor) + " " + fold(title); for (const [k, v] of BRF) if (k.length > 2 && (" " + ft + " ").includes(" " + k + " ")) return v;
  return vendor && !/^(slides|loafers|stockx|myntra|pink|trader joe|speed|track|christian|b22|bait|revenge|ftp|yeti|nnormal|kiprun|gymshark|wellipets|hebru)/i.test(vendor) ? vendor : "Other";
}
const kgFor = (cat: string, t: string) => { const s = (cat + " " + t).toLowerCase();
  if (/wallet|card case|card holder|pouch|wristlet|key ?(fob|ring)|charm|coin/.test(s)) return 0.3; if (/watch/.test(s)) return 0.4; if (/necklace|bracelet|earring|\bring\b|jewel/.test(s)) return 0.3;
  if (/boot/.test(s)) return 1.8; if (/sneaker|trainer|shoe|sandal|loafer|heel|pump|flat|mule|slide|espadrille/.test(s)) return 1.2;
  if (/tote|satchel|carryall|backpack|duffle|weekender|large|briefcase/.test(s)) return 1.2; if (/crossbody|mini|small|camera|belt bag|phone/.test(s)) return 0.6;
  if (/bag|shoulder|hobo|bucket|clutch/.test(s)) return 0.9; if (/jacket|coat|dress|sweater|shirt|top|pant|skirt|hoodie|scarf/.test(s)) return 0.5; return 0.6; };
const quoteUsd = (usd: number, kg: number, fx = 95.5) => { const k = Math.max(0.5, Math.ceil(kg * 2) / 2); const landed = usd * fx + k * 1250 + 150; return { landed: Math.round(landed), price: Math.ceil(landed * 1.25 / 100) * 100, kg: k }; };
const ent = (x: any) => typeof x === "string" ? { h: x, v: "", seg: "luxury" } : { h: String(x.h), v: String(x.v || ""), seg: String(x.seg || "luxury") };
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const c: any = await cfg(); if (!(await allowed(req, c))) return J({ ok: false, error: "not allowed" }, 403);
    const body: any = await req.json().catch(() => ({}));
    const disc = Number(body.discount ?? c.discount ?? 15);
    if (body.action === "sync") {
      const col = String(body.collection || (body.entry && body.entry.h) || "shop-luxury").replace(/[^a-z0-9-]/g, ""); const page = Math.max(1, Number(body.page) || 1);
      const r = await fetch(`${SRC}/collections/${col}/products.json?limit=250&page=${page}`, { headers: { "User-Agent": "Mozilla/5.0 (compatible; LuxellaCatalog/1.0)", "Accept": "application/json" } });
      if (!r.ok) return J({ ok: false, error: "source " + r.status });
      const j: any = await r.json(); const P = j.products || [];
      const rows: any[] = [], srcs: any[] = []; const E1 = ent(body.entry || col); const on1 = E1.seg !== "lifestyle" || !!c.lifestyleOn; for (const p of P) { const m = mapProduct(p, disc, E1.seg, E1.v, on1); if (m) { rows.push(m.row); srcs.push(m.src); } }
      for (let i = 0; i < rows.length; i += 200) { const e = await db.from("lx_catalog").upsert(rows.slice(i, i + 200), { onConflict: "id", ignoreDuplicates: false }); if (e.error) return J({ ok: false, error: e.error.message }); await db.from("lx_catalog_src").upsert(srcs.slice(i, i + 200)); }
      return J({ ok: true, fetched: P.length, saved: rows.length, more: P.length === 250 });
    }
    if (body.action === "ingest") {
      const items: any[] = Array.isArray(body.items) ? body.items.slice(0, 500) : []; const fx = Number(c.fx || 95.5);
      const rows: any[] = [], srcs: any[] = [];
      for (const it of items) {
        const usd = Number(it.usd); if (!usd || !it.id || !it.title || !(it.images || []).length) continue;
        const cat = CAT1((String(it.category || "") + " " + it.title).toLowerCase()) || String(it.category || "Other");
        const q = quoteUsd(usd, kgFor(cat, it.title), fx);
        const sizes = (it.sizes && it.sizes.length ? it.sizes : ["One size"]).slice(0, 30).map((sz: string) => ({ s: String(sz).slice(0, 30), p: q.price }));
        rows.push({ id: String(it.id).slice(0, 80), brand: canonBrand(String(it.brand || ""), String(it.title)), title: String(it.title).slice(0, 160), category: cat, gender: String(it.gender || ""), price: q.price, mrp: null, sizes, images: (it.images || []).slice(0, 8), ship: "eta", eta: String(it.eta || "2–3 weeks"), descr: String(it.descr || "").slice(0, 1200), colours: (it.colours || []).slice(0, 12), sku: String(it.sku || "").slice(0, 60), src_kind: "outlet", segment: "luxury", active: true, seen_at: new Date().toISOString() });
        srcs.push({ id: String(it.id).slice(0, 80), src_handle: String(it.url || "").slice(0, 400), src_prices: [["usd", usd], ["regular_usd", Number(it.regular_usd) || null], ["store", String(it.store || "")]], chk: { at: new Date().toISOString(), store: it.store, url: it.url, usd, kg: q.kg, landed: q.landed, our_price: q.price, margin: Math.round((q.price - q.landed) / q.landed * 1000) / 10, verdict: "ok" }, checked_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      }
      for (let i = 0; i < rows.length; i += 200) { const e = await db.from("lx_catalog").upsert(rows.slice(i, i + 200), { onConflict: "id" }); if (e.error) return J({ ok: false, error: e.error.message }); await db.from("lx_catalog_src").upsert(srcs.slice(i, i + 200)); }
      return J({ ok: true, saved: rows.length });
    }
    if (body.action === "retire") { const cut = String(body.before || ""); const store = String(body.prefix || ""); if (!cut || !store) return J({ ok: false }); const { count } = await db.from("lx_catalog").update({ active: false }, { count: "exact" }).like("id", store + "%").lt("seen_at", cut).eq("active", true); return J({ ok: true, retired: count }); }
    if (body.action === "tick") {
      const day = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10); const cols: any[] = (c.collections || ["shop-luxury"]).map(ent);
      let cur: any = c.cursor || {}; if (cur.day !== day) cur = { day, ci: 0, page: 1, done: false, saved: 0 };
      if (cur.done) return J({ ok: true, done: true, cursor: cur });
      const log: any[] = [];
      for (let n = 0; n < 4 && !cur.done; n++) {
        const E2 = cols[cur.ci]; const col = E2.h; const r = await fetch(`${SRC}/collections/${col}/products.json?limit=250&page=${cur.page}`, { headers: { "User-Agent": "Mozilla/5.0 (compatible; LuxellaCatalog/1.0)", "Accept": "application/json" } });
        let P: any[] = []; if (r.ok) { const j: any = await r.json(); P = j.products || []; }
        const rows: any[] = [], srcs: any[] = []; for (const p of P) { const m = mapProduct(p, disc, E2.seg, E2.v, E2.seg !== "lifestyle" || !!c.lifestyleOn); if (m) { rows.push(m.row); srcs.push(m.src); } }
        for (let i = 0; i < rows.length; i += 200) { await db.from("lx_catalog").upsert(rows.slice(i, i + 200), { onConflict: "id" }); await db.from("lx_catalog_src").upsert(srcs.slice(i, i + 200)); }
        cur.saved += rows.length; log.push([col, cur.page, rows.length]);
        if (P.length === 250) cur.page++; else { cur.ci++; cur.page = 1; if (cur.ci >= cols.length) cur.done = true; }
      }
      if (cur.done) { const cut = new Date(Date.now() - 2 * 864e5).toISOString(); await db.from("lx_catalog").update({ active: false }).lt("seen_at", cut).eq("active", true).eq("src_kind", "partner"); }
      await db.from("lx_km_vault").update({ data: { ...c, cursor: cur } }).eq("id", "catalogcfg");
      return J({ ok: true, cursor: cur, log });
    }
    if (body.action === "sweep") { const cut = new Date(Date.now() - (Number(body.days) || 3) * 864e5).toISOString(); const { error, count } = await db.from("lx_catalog").update({ active: false }, { count: "exact" }).lt("seen_at", cut).eq("active", true).eq("src_kind", "partner"); return J({ ok: !error, deactivated: count, error: error?.message }); }
    if (body.action === "stats") { const { count } = await db.from("lx_catalog").select("id", { count: "exact", head: true }).eq("active", true); return J({ ok: true, active: count }); }
    return J({ ok: false, error: "unknown action" }, 400);
  } catch (e) { return J({ ok: false, error: String((e as Error).message || e) }); }
});
