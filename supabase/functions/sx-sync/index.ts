// sx-sync: READ-ONLY bridge to SourceX (Culture Circle) seller account.
// Only the Login (obtainToken) mutation and allow-listed read queries are ever sent.
// No accept / reject / bid / tracking / edit operations exist in this file.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SR = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(SB_URL, SR, { auth: { persistSession: false } });
const API = "https://api.culture-circle.com/graphql";
const OWNERS = ["jeetnathavani37@gmail.com", "jeetnatb@gmail.com"];
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type, x-sync-key, apikey, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const J = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const UA = { "Content-Type": "application/json", Accept: "application/json", Origin: "https://sourcex.app", Referer: "https://sourcex.app/", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36" };

const LOGIN = `mutation Login($email: String!, $password: String!) { obtainToken(input: { email: $email, password: $password }) { message success token refreshToken } }`;
const ORDERS = `query GetMySxOrders($after: String, $first: Int!) { mySxOrders(after: $after, first: $first) { edges { node {
  id status total currency isPpcod market orderPlatfrom paymentDone resellerPayout trackingId trackingProvider trackingLink
  dateShipped dateDelivered shippingStatus slaBreachDate expectedPickup createdAt updatedAt marketplaceOrderId
  checkcheckStatus checkcheckResult logisticsStatus { label code updatedAt }
  inventory { variant { title product { title skuId brandName images(first: 1) { edges { node { image } } } } } }
} } pageInfo { hasNextPage endCursor } } }`;
const PORTFOLIO = `query Portfolio { portfolio { totalSales salesLastWeek salesLastMonth totalProfit profitLastWeek profitLastMonth ordersLastWeek ordersLastMonth pendingOrdersCount waitingForPickupOrdersCount intransitOrdersCount } }`;
const ALLOWED = new Set([LOGIN, ORDERS, PORTFOLIO]);

async function gql(query: string, variables: Record<string, unknown>, token?: string) {
  if (!ALLOWED.has(query)) throw new Error("blocked: not an allowed read-only operation");
  const h: Record<string, string> = { ...UA };
  if (token) h.Authorization = "Bearer " + token;
  const r = await fetch(API, { method: "POST", headers: h, body: JSON.stringify({ query, variables }) });
  const j: any = await r.json().catch(() => ({}));
  if (j?.errors?.length) throw new Error("SX " + r.status + ": " + String(j.errors[0]?.message || "").slice(0, 160));
  return j?.data;
}

// --- vault sealing (24 Oct 2026): secrets in lx_km_vault are AES-GCM encrypted with LX_VAULT_KEY (edge secret, not readable from SQL) ---
const VK = Deno.env.get("LX_VAULT_KEY") || "";
const _b64 = (a: Uint8Array) => btoa(String.fromCharCode(...a));
const _ub64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function _vkey() { return await crypto.subtle.importKey("raw", _ub64(VK), "AES-GCM", false, ["encrypt", "decrypt"]); }
async function seal(o: any) { if (!VK) return o; const iv = crypto.getRandomValues(new Uint8Array(12)); const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await _vkey(), new TextEncoder().encode(JSON.stringify(o)))); return { enc: "v1", iv: _b64(iv), ct: _b64(ct) }; }
async function unseal(d: any) { if (!d || !d.enc) return d; const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: _ub64(d.iv) }, await _vkey(), _ub64(d.ct)); return JSON.parse(new TextDecoder().decode(pt)); }
async function run() {
  const { data: v } = await db.from("lx_km_vault").select("data").eq("id", "sx").maybeSingle();
  let c: any = v?.data || {};
  if (c.enc) c = await unseal(c); else if (VK && c.email) await db.from("lx_km_vault").upsert({ id: "sx", data: await seal(c), updated_at: new Date().toISOString() });
  if (!c.email || !c.password) throw new Error("no SX credentials in vault");
  const lg = await gql(LOGIN, { email: c.email, password: c.password });
  const token = lg?.obtainToken?.token;
  if (!token) throw new Error("SX login failed: " + String(lg?.obtainToken?.message || "no token").slice(0, 120));

  const orders: any[] = [];
  let after: string | null = null;
  for (let i = 0; i < 20; i++) {
    const d = await gql(ORDERS, { first: 50, after }, token);
    const con = d?.mySxOrders;
    (con?.edges || []).forEach((e: any) => e?.node && orders.push(e.node));
    if (!con?.pageInfo?.hasNextPage) break;
    after = con.pageInfo.endCursor;
  }
  let portfolio: any = null;
  try { portfolio = (await gql(PORTFOLIO, {}, token))?.portfolio || null; } catch (_) { /* optional */ }

  const now = new Date().toISOString();
  const sxNo = (o: any) => { try { const t = atob(String(o.id)); const n = t.split(":").pop(); return n && /^\d+$/.test(n) ? "SX" + n : String(o.id); } catch (_) { return String(o.id); } };
  const rows = orders.map((o) => ({ kind: "sx", id: sxNo(o), data: { raw: o, synced: now }, updated_at: now }));
  for (let i = 0; i < rows.length; i += 100) {
    const { error } = await db.from("lx_b2b").upsert(rows.slice(i, i + 100), { onConflict: "kind,id" });
    if (error) throw new Error("db: " + error.message);
  }

  // Fill blanks on matching B2B orders (never overwrite filled fields, never change status here).
  const { data: mine } = await db.from("lx_b2b").select("id,data").eq("kind", "order").like("id", "SX%");
  let filled = 0;
  const byId = new Map(orders.map((o) => [sxNo(o), o]));
  for (const r of mine || []) {
    const o: any = byId.get(String(r.id));
    if (!o) continue;
    const d: any = r.data || {};
    const p: Record<string, unknown> = {};
    const img = o?.inventory?.variant?.product?.images?.edges?.[0]?.node?.image;
    const blank = (k: string) => d[k] == null || d[k] === "" || d[k] === "—";
    if (img && blank("image")) { p.image = img; p.image_src = "sourcex"; }
    if (o.trackingId && blank("km_tracking")) p.km_tracking = o.trackingId;
    if (o.resellerPayout != null && blank("sx_payout")) p.sx_payout = o.resellerPayout;
    p.sx_status = o.status; p.sx_shipping = o.shippingStatus || o?.logisticsStatus?.label || null;
    p.sx_cod = !!o.isPpcod; p.sx_synced = now;
    if (o.dateDelivered && blank("sx_delivered")) p.sx_delivered = String(o.dateDelivered).slice(0, 10);
    const nd = { ...d, ...p };
    const { error } = await db.from("lx_b2b").update({ data: nd, updated_at: now }).eq("kind", "order").eq("id", r.id);
    if (!error) filled++;
  }
  // New SourceX orders that the portal does not have yet -> add them (once).
  const have = new Set((mine || []).map((m: any) => m.id));
  const add = [...byId.entries()].filter(([k]) => /^SX\d+$/.test(k) && !have.has(k)).map(([k, o]: [string, any]) => ({ kind: "order", id: k, updated_at: now, data: {
    order_id: k, client: "Sourcex", source: "Sourcex sync", item: o?.inventory?.variant?.product?.title || "", brand: o?.inventory?.variant?.product?.brandName || "",
    size: o?.inventory?.variant?.title || "", order_date: String(o.createdAt || "").slice(0, 10), payout: o.resellerPayout ?? null, sx_payout: o.resellerPayout ?? null,
    status: o.status === "cancelled" ? "Cancelled" : o.status === "completed" ? "Delivered to client" : "To place",
    payout_status: o.status === "cancelled" ? "N/A" : "Unverified", sx_status: o.status, sx_cod: !!o.isPpcod, km_tracking: o.trackingId || null,
    image: o?.inventory?.variant?.product?.images?.edges?.[0]?.node?.image || "", image_src: "sourcex", sx_synced: now } }));
  if (add.length) { await db.from("lx_b2b").insert(add); await db.from("lx_b2b").insert({ kind: "msg", id: "m-sx-" + Date.now(), updated_at: now, data: { thread: "ops", from: "ops", at: now, read: false, notify: true, text: "🆕 Sourcex pe " + add.length + " naya order aaya: " + add.map((a) => a.id + " " + String(a.data.item).slice(0, 40)).join(", "), items: add.map((a) => ({ order_id: a.id, text: String(a.data.item) + " · payout ₹" + a.data.payout + (a.data.sx_cod ? " · COD" : ""), level: "warn" })) } }); }
  await db.from("lx_b2b").upsert({ kind: "meta", id: "sxsync", data: { at: now, ok: true, orders: orders.length, matched: filled, missing: [...byId.keys()].filter((k) => !(mine || []).some((m: any) => m.id === k)), portfolio }, updated_at: now }, { onConflict: "kind,id" });
  return { ok: true, orders: orders.length, matched: filled };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const auth = req.headers.get("authorization") || "";
    let owner = false;
    if (auth.startsWith("Bearer ")) { const { data } = await db.auth.getUser(auth.slice(7)); owner = OWNERS.includes(String(data?.user?.email || "").toLowerCase()); }
    const key = req.headers.get("x-sync-key");
    let cronOk = false;
    if (key) { const { data } = await db.from("lx_km_vault").select("data").eq("id", "cron").maybeSingle(); cronOk = !!data?.data?.key && data.data.key === key; }
    if (!owner && !cronOk) return J({ ok: false, error: "unauthorized" }, 401);
    return J(await run());
  } catch (e) {
    const msg = String((e as Error)?.message || e).slice(0, 300);
    try { await db.from("lx_b2b").upsert({ kind: "meta", id: "sxsync", data: { at: new Date().toISOString(), ok: false, error: msg }, updated_at: new Date().toISOString() }, { onConflict: "kind,id" }); } catch (_) { /* ignore */ }
    return J({ ok: false, error: msg }, 500);
  }
});
