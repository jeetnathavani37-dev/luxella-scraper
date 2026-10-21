// lx-aftership: pushes every B2B tracking number (store→warehouse, warehouse→India, India→KicksMachine) into AfterShip
// and pulls status back into the order rows (r.trk[number]) hourly. Auto-advances dates only forward, only into empty fields.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const OWNERS = ["jeetnathavani37@gmail.com", "jeetnatb@gmail.com"];
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type, x-sync-key, apikey, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const J = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const LABEL: Record<string, string> = { Pending: "Waiting scan", InfoReceived: "Label created", InTransit: "In transit", OutForDelivery: "Out for delivery", AttemptFail: "Attempt failed", Delivered: "Delivered", AvailableForPickup: "Pickup ready", Exception: "Exception", Expired: "Expired" };
const ist = (t?: string | null) => { if (!t) return null; const d = new Date(t); if (isNaN(+d)) return String(t).slice(0, 10); return new Date(+d + 5.5 * 3600e3).toISOString().slice(0, 10); };
const first = (v: unknown) => String(v || "").trim().split(/[\s,]+/)[0];

async function getKey() { const { data } = await db.from("lx_secrets").select("v").eq("k", "aftership_key").maybeSingle(); return data?.v || null; }
// AfterShip: legacy v4 first, versioned API as fallback
async function as(key: string, method: string, path: string, body?: unknown) {
  const v4 = await fetch("https://api.aftership.com/v4" + path, { method, headers: { "aftership-api-key": key, "Content-Type": "application/json" }, body: body ? JSON.stringify({ tracking: body }) : undefined });
  if (v4.status !== 404 && v4.status !== 410 && v4.status !== 426) return { status: v4.status, j: await v4.json().catch(() => ({})) };
  const r = await fetch("https://api.aftership.com/tracking/2024-04" + path, { method, headers: { "as-api-key": key, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, j: await r.json().catch(() => ({})) };
}
function summarize(t: any) {
  const cps: any[] = t.checkpoints || []; const last = cps[cps.length - 1] || {};
  const ind = cps.find((c) => /^(IND|IN)$/i.test(String(c.country_iso3 || c.country_region || c.country_name || "")) || /india/i.test(String(c.country_name || c.location || "")));
  const eta = t.expected_delivery || t.aftership_estimated_delivery_date?.estimated_delivery_date || t.latest_estimated_delivery?.datetime || t.courier_estimated_delivery_date?.estimated_delivery_date || null;
  return { tag: t.tag || "", label: LABEL[t.tag] || t.subtag_message || t.tag || "", slug: t.slug || "", eta: eta ? String(eta).slice(0, 10) : null,
    last: [last.message, [last.city, last.state, last.country_iso3].filter(Boolean).join(", ") || last.location].filter(Boolean).join(" · ").slice(0, 160),
    at: last.checkpoint_time || null, delivered: t.tag === "Delivered" ? ist(t.shipment_delivery_date || last.checkpoint_time) : null, india: ind ? ist(ind.checkpoint_time) : null, synced: new Date().toISOString() };
}
const ORDER = ["To place", "Ordered", "In transit to reshipper", "At reshipper", "Shipped from hub", "Landed India", "Shipped to KM", "Out for delivery", "Delivered to KM"];
function derive(d: any) { const h = (k: string) => d[k] != null && d[k] !== ""; if (d.status === "Cancelled") return d.status;
  if (h("delivered_km")) return "Delivered to KM"; if (h("shipped_km")) return "Shipped to KM"; if (h("landed_india")) return "Landed India"; if (h("shipped_reshipper")) return "Shipped from hub";
  if (h("delivered_reshipper")) return "At reshipper"; if (h("retailer_ship_date") || h("retailer_tracking")) return "In transit to reshipper"; if (h("retailer_order_id") || h("retailer_date")) return "Ordered"; return d.status || "To place"; }

async function sync() {
  const key = await getKey(); if (!key) { const s = { at: new Date().toISOString(), ok: false, error: "no_key" }; await db.from("lx_b2b").upsert({ kind: "meta", id: "aftership", data: s, updated_at: s.at }, { onConflict: "kind,id" }); return s; }
  const { data: rows } = await db.from("lx_b2b").select("id,data").eq("kind", "order");
  const { data: mrow } = await db.from("lx_b2b").select("data").eq("kind", "meta").eq("id", "aftership").maybeSingle();
  const meta: any = mrow?.data || {}; const created = new Set<string>(meta.created || []);
  const open = (rows || []).filter((r: any) => r.data?.client === "KicksMachine" && r.data?.status !== "Cancelled" && r.data?.status !== "Delivered to KM" && r.data?.payout_status !== "Received");
  const legs = new Map<string, { leg: string; ids: string[] }>();
  for (const r of open) { const d = r.data; for (const [f, leg] of [["retailer_tracking", "store"], ["intl_tracking", "store"], ["reship_awb", "intl"], ["km_tracking", "dom"], ["local_tracking", "dom"]] as const) { const n = first(d[f]); if (!n || n.length < 8 || !/^[A-Za-z0-9-]+$/.test(n)) continue; const e = legs.get(n) || { leg, ids: [] }; if (!e.ids.includes(r.id)) e.ids.push(r.id); legs.set(n, e); } }
  let made = 0, errs = 0; const errors: string[] = [];
  for (const [n, e] of legs) { if (created.has(n) || made >= 40) continue;
    const res = await as(key, "POST", "/trackings", { tracking_number: n, title: e.ids.join(", "), order_id: e.ids[0], note: "Luxella B2B · " + e.leg });
    const code = res.j?.meta?.code; if (res.status < 300 || code === 4003 || res.status === 409) { created.add(n); made++; } else { errs++; if (errors.length < 5) errors.push(n + ": " + (res.j?.meta?.message || res.status)); } }
  // pull all trackings (paged)
  const info = new Map<string, any>();
  for (let page = 1; page <= 5; page++) { const res = await as(key, "GET", "/trackings?limit=200&page=" + page); const list = res.j?.data?.trackings || []; for (const t of list) info.set(String(t.tracking_number).toUpperCase(), summarize(t)); if (list.length < 200) break; }
  let updated = 0, advanced = 0;
  for (const r of open) { const d = r.data; const trk: any = Object.assign({}, d.trk || {}); const p: any = {}; let touched = false;
    for (const [f, leg] of [["retailer_tracking", "store"], ["reship_awb", "intl"], ["km_tracking", "dom"]] as const) { const n = first(d[f] || (f === "retailer_tracking" ? d.intl_tracking : f === "km_tracking" ? d.local_tracking : "")); if (!n) continue; const s = info.get(n.toUpperCase()); if (!s) continue;
      if (JSON.stringify(trk[n]) !== JSON.stringify({ ...s, synced: trk[n]?.synced })) { trk[n] = { ...s, leg }; touched = true; }
      if (leg === "store" && s.delivered && !d.delivered_reshipper) { p.delivered_reshipper = s.delivered; }
      if (leg === "intl" && s.india && !d.landed_india) { p.landed_india = s.india; }
      if (leg === "dom" && s.delivered && !d.delivered_km) { p.delivered_km = s.delivered; } }
    if (Object.keys(p).length) { const nd = { ...d, ...p }; const ns = derive(nd); if (ORDER.indexOf(ns) > ORDER.indexOf(d.status)) p.status = ns; else delete p.status; p.notes = [d.notes, "Auto (AfterShip " + new Date().toISOString().slice(0, 10) + "): " + Object.keys(p).filter((k) => k !== "status").join(", ")].filter(Boolean).join(" | "); advanced++; touched = true; }
    if (touched) { await db.from("lx_b2b").update({ data: { ...d, ...p, trk }, updated_at: new Date().toISOString() }).eq("kind", "order").eq("id", r.id); updated++; } }
  const s = { at: new Date().toISOString(), ok: errs === 0, numbers: legs.size, created_now: made, known: info.size, updated, advanced, errors, created: [...created].slice(-800) };
  await db.from("lx_b2b").upsert({ kind: "meta", id: "aftership", data: s, updated_at: s.at }, { onConflict: "kind,id" });
  return { ...s, created: undefined };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const body: any = await req.json().catch(() => ({}));
    const auth = req.headers.get("authorization") || ""; let owner = false;
    if (auth.startsWith("Bearer ")) { const { data } = await db.auth.getUser(auth.slice(7)); owner = OWNERS.includes(String(data?.user?.email || "").toLowerCase()); }
    const k = req.headers.get("x-sync-key"); let cronOk = false;
    if (k) { const { data } = await db.from("lx_km_vault").select("data").eq("id", "cron").maybeSingle(); cronOk = !!data?.data?.key && data.data.key === k; }
    if (!owner && !cronOk) return J({ ok: false, error: "unauthorized" }, 401);
    if (body.action === "status") { const key = await getKey(); const { data } = await db.from("lx_b2b").select("data").eq("kind", "meta").eq("id", "aftership").maybeSingle(); const m: any = data?.data || {}; delete m.created; return J({ ok: true, connected: !!key, last: m }); }
    if (body.action === "setkey") { if (!owner) return J({ ok: false }, 403); const key = String(body.key || "").trim(); if (!key) return J({ ok: false, error: "key chahiye" });
      const t = await as(key, "GET", "/trackings?limit=1"); if (t.status === 401 || t.status === 403) return J({ ok: false, error: "AfterShip ne key reject ki (" + t.status + ")" });
      await db.from("lx_secrets").upsert({ k: "aftership_key", v: key }, { onConflict: "k" }); return J({ ok: true, connected: true, sync: await sync().catch((e) => ({ ok: false, error: String(e) })) }); }
    if (body.action === "sync") return J(await sync());
    return J({ ok: false, error: "unknown action" }, 400);
  } catch (e) { return J({ ok: false, error: String((e as Error).message || e) }, 200); }
});
