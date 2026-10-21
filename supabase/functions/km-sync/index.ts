// km-sync: READ-ONLY bridge to KicksMachine Nexus (vendor portal).
// Only POST /auth/login and allow-listed GET paths are ever called. No accept/reject/tracking/edit calls exist here.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SR = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(SB_URL, SR, { auth: { persistSession: false } });
const KM = "https://nexus.kicksmachine.com/api";
const OWNERS = ["jeetnathavani37@gmail.com", "jeetnatb@gmail.com"];
const READ_ONLY_GET = [
  /^\/auth\/me$/, /^\/vendor-orders$/, /^\/vendor-orders\/(stats|status-counts|analytics)$/,
  /^\/vendor-orders\/[A-Za-z0-9_-]+$/, /^\/vendor-orders\/[A-Za-z0-9_-]+\/eta-info$/,
  /^\/bids\/order-bids$/, /^\/notifications$/, /^\/vendor-profile$/, /^\/vendor-inventory\/stats$/,
];
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type, x-sync-key, apikey, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const J = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

async function kmLogin(email: string, password: string): Promise<string> {
  const r = await fetch(KM + "/auth/login", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ email, password }) });
  const j: any = await r.json().catch(() => ({}));
  const token = j?.token || j?.data?.token || j?.accessToken || j?.data?.accessToken;
  if (!r.ok || !token) throw new Error("KM login failed (" + r.status + "): " + String(j?.message || j?.error || "").slice(0, 120));
  return token;
}
async function kmGet(token: string, path: string) {
  if (!READ_ONLY_GET.some((re) => re.test(path.split("?")[0]))) throw new Error("blocked (not read-only): " + path);
  const r = await fetch(KM + path, { method: "GET", headers: { Authorization: "Bearer " + token, Accept: "application/json" } });
  const body = await r.json().catch(() => null);
  return { status: r.status, body };
}
const list = (b: any): any[] => Array.isArray(b) ? b : Array.isArray(b?.data) ? b.data : Array.isArray(b?.orders) ? b.orders : Array.isArray(b?.data?.orders) ? b.data.orders : Array.isArray(b?.items) ? b.items : Array.isArray(b?.notifications) ? b.notifications : [];
const ORD = /^US\d{5,}(-[A-Z])?$/;
function findOrderNo(o: any, depth = 0): string | null {
  if (!o || depth > 3) return null;
  for (const k of ["orderNumber", "order_number", "orderNo", "orderId", "order_id", "shopifyOrderName", "name"]) {
    const v = o?.[k]; if (typeof v === "string" && ORD.test(v.replace(/^#/, ""))) return v.replace(/^#/, "");
  }
  for (const v of Object.values(o)) {
    if (typeof v === "string" && ORD.test(v.replace(/^#/, ""))) return v.replace(/^#/, "");
    if (v && typeof v === "object") { const f = findOrderNo(v, depth + 1); if (f) return f; }
  }
  return null;
}
const pick = (o: any, keys: string[]) => { for (const k of keys) { const v = k.split(".").reduce((a: any, p) => a?.[p], o); if (v != null && v !== "") return v; } return null; };
const isoDate = (v: any) => { if (!v) return null; const d = new Date(v); return isNaN(+d) ? null : d.toISOString().slice(0, 10); };

async function getCred() { const { data } = await db.from("lx_km_vault").select("data").eq("id", "km").maybeSingle(); return data?.data || null; }
async function saveCred(d: any) { await db.from("lx_km_vault").upsert({ id: "km", data: d, updated_at: new Date().toISOString() }); }
async function upsert(kind: string, id: string, data: any) { await db.from("lx_b2b").upsert({ kind, id, data, updated_at: new Date().toISOString() }, { onConflict: "kind,id" }); }

async function token(cred: any): Promise<string> {
  if (cred.token && cred.token_at && Date.now() - cred.token_at < 6 * 3600e3) {
    const t = await kmGet(cred.token, "/auth/me"); if (t.status !== 401 && t.status !== 403) return cred.token;
  }
  const tk = await kmLogin(cred.email, cred.password); cred.token = tk; cred.token_at = Date.now(); await saveCred(cred); return tk;
}

async function sync() {
  const cred = await getCred(); if (!cred?.email || !cred?.password) throw new Error("KM not connected");
  const tk = await token(cred);
  const [vo, stats, counts, bids, notes] = await Promise.all([
    kmGet(tk, "/vendor-orders"), kmGet(tk, "/vendor-orders/stats"), kmGet(tk, "/vendor-orders/status-counts"), kmGet(tk, "/bids/order-bids"), kmGet(tk, "/notifications"),
  ]);
  const orders = list(vo.body);
  const { data: rows } = await db.from("lx_b2b").select("id,data").eq("kind", "order");
  const mine = new Map((rows || []).map((r: any) => [r.id, r.data]));
  let seen = 0, created = 0, updated = 0, cancelled = 0; const now = new Date().toISOString();
  for (const o of orders) {
    const no = findOrderNo(o); if (!no) continue; seen++;
    await upsert("km", no, { raw: o, synced_at: now });
    const st = String(pick(o, ["status", "orderStatus", "vendorStatus", "state"]) || "").toLowerCase();
    const trk = pick(o, ["trackingStatus", "tracking_status", "tracking.status"]);
    const sla = isoDate(pick(o, ["slaDeadlineAt", "slaDeadline", "sla_deadline"]));
    const payout = Number(pick(o, ["payoutPrice", "payoutAmount", "payout"])) || null;
    const cur: any = mine.get(no);
    if (cur) {
      const p: any = { km_status: st || cur.km_status, km_synced: now };
      if (trk) p.km_tracking_status = String(trk);
      if (sla) p.sla_deadline = sla;
      if (!cur.payout && payout) p.payout = payout;
      const eta = pick(o, ["etaStage"]); if (eta) p.km_eta_stage = String(eta);
      const acc = isoDate(pick(o, ["acceptedAt"])); if (acc) p.km_accepted = acc;
      const accBy = pick(o, ["acceptanceDeadlineAt"]); if (accBy) p.km_accept_by = String(accBy);
      const origin = pick(o, ["etaInfo.originOrderId"]); if (origin) { p.km_portal_store_order = String(origin); if (!cur.retailer_order_id) p.retailer_order_id = String(origin); }
      const vtrk = pick(o, ["etaInfo.vendorTrackingId"]); if (vtrk) { p.km_portal_tracking = String(vtrk); if (!cur.retailer_tracking && !cur.intl_tracking) { p.retailer_tracking = String(vtrk); p.intl_tracking = String(vtrk); } }
      if (origin || vtrk) p.km_portal_updated = cur.km_portal_updated || now.slice(0, 10);
      if (p.retailer_order_id && cur.status === "To place") p.status = "Ordered";
      if (p.retailer_tracking && ["To place", "Ordered"].includes(cur.status)) p.status = "In transit to reshipper";
      const prob = pick(o, ["problemSheet.active"]); p.km_problem = prob === true ? String(pick(o, ["problemSheet.note"]) || "problem case") : "";
      const creq = pick(o, ["cancellationRequest.status"]); if (creq) p.km_cancel_request = String(creq);
      const dtrk = pick(o, ["deliveryTracking.awb", "deliveryTracking.trackingNumber", "shiprocket.awbCode"]); if (dtrk) p.km_delivery_tracking = String(dtrk);
      if (st === "delivered" && !cur.delivered_km) { p.delivered_km = isoDate(pick(o, ["deliveredAt", "delivered_at", "milestones.deliveredAt", "updatedAt"])) || now.slice(0, 10); if (!["Delivered to KM", "Cancelled"].includes(cur.status)) p.status = "Delivered to KM"; }
      if (st === "cancelled" && cur.status !== "Cancelled") { p.status = "Cancelled"; p.notes = [cur.notes, "Cancelled on KM portal (sync " + now.slice(0, 10) + ")"].filter(Boolean).join(" | "); cancelled++; }
      await db.from("lx_b2b").update({ data: { ...cur, ...p }, updated_at: now }).eq("kind", "order").eq("id", no); updated++;
    } else if (st !== "cancelled" && st !== "rejected") {
      const item = pick(o, ["items.0.productTitle", "productName", "title"]);
      await upsert("order", no, { client: "KicksMachine", order_id: no, item: item ? String(item) : no, size: pick(o, ["items.0.variantTitle", "size"]), image: pick(o, ["items.0.productImage"]), km_accept_by: pick(o, ["acceptanceDeadlineAt"]), km_eta_stage: pick(o, ["etaStage"]), payout, order_date: isoDate(pick(o, ["createdAt", "created_at", "assignedAt"])) || now.slice(0, 10), status: "To place", payout_status: "Pending", km_status: st, sla_deadline: sla, source: "KM sync", km_synced: now });
      created++;
    }
  }
  await upsert("meta", "km_bids", { at: now, raw: bids.body });
  await upsert("meta", "km_notifications", { at: now, list: list(notes.body).slice(0, 60) });
  await upsert("meta", "km_stats", { at: now, stats: stats.body, counts: counts.body });
  const summary = { at: now, ok: true, km_orders: orders.length, matched: seen, updated, created, cancelled, http: { orders: vo.status, bids: bids.status, notifications: notes.status } };
  await upsert("meta", "kmsync", summary);
  return summary;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const body: any = await req.json().catch(() => ({}));
    const auth = req.headers.get("authorization") || "";
    let owner = false;
    if (auth.startsWith("Bearer ")) { const { data } = await db.auth.getUser(auth.slice(7)); owner = OWNERS.includes(String(data?.user?.email || "").toLowerCase()); }
    const key = req.headers.get("x-sync-key");
    let cronOk = false;
    if (key) { const { data } = await db.from("lx_km_vault").select("data").eq("id", "cron").maybeSingle(); cronOk = !!data?.data?.key && data.data.key === key; }
    if (body.action === "setcred") {
      if (!owner) return J({ ok: false, error: "owner only" }, 403);
      if (!body.email || !body.password) return J({ ok: false, error: "email + password chahiye" }, 400);
      let tk = "";
      try { tk = await kmLogin(String(body.email).trim(), String(body.password)); } catch (e) { return J({ ok: false, error: String((e as Error).message || e) }); }
      await saveCred({ email: String(body.email).trim(), password: String(body.password), token: tk, token_at: Date.now() });
      const s = await sync().catch((e) => ({ ok: false, error: String(e.message || e) }));
      return J({ ok: true, connected: true, sync: s });
    }
    if (body.action === "disconnect") { if (!owner) return J({ ok: false }, 403); await db.from("lx_km_vault").delete().eq("id", "km"); return J({ ok: true }); }
    if (body.action === "sync") {
      if (!owner && !cronOk) return J({ ok: false, error: "unauthorized" }, 401);
      // nightly backup (03:xx IST run) + AfterShip tracking sync — each isolated so one failure never blocks the other
      const istH = new Date(Date.now() + 5.5 * 3600e3).getUTCHours();
      if (cronOk && istH === 3) { try { await db.rpc("lx_b2b_snapshot"); } catch (_) { /* ignore */ } }
      if (cronOk) { try { await fetch(SB_URL + "/functions/v1/lx-aftership", { method: "POST", headers: { "Content-Type": "application/json", "x-sync-key": key! }, body: JSON.stringify({ action: "sync" }) }); } catch (_) { /* ignore */ } }
      try { return J(await sync()); } catch (e) { const s = { at: new Date().toISOString(), ok: false, error: String((e as Error).message || e) }; await upsert("meta", "kmsync", s); return J(s, 500); }
    }
    if (body.action === "status") { if (!owner) return J({ ok: false }, 403); const c = await getCred(); return J({ ok: true, connected: !!c?.email, email: c?.email || null }); }
    return J({ ok: false, error: "unknown action" }, 400);
  } catch (e) { return J({ ok: false, error: String((e as Error).message || e) }, 500); }
});
