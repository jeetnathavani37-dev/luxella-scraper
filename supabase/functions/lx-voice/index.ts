// lx-voice: answers a client's spoken question for Siri / Bixby / Google shortcuts.
// GET /lx-voice?t=<personal voice token>&q=<question>  ->  plain text answer (spoken by the shortcut).
// Add &fmt=json for {text,url}. Token lives in lx_docs (collection meta, doc voice_token) per client.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };
const PORTAL = "https://luxellaclients.duckdns.org/";
const STAGES = ["Order placed", "Order confirmed", "Shipped by the store", "At the international hub", "Shipped from the international hub", "At the Indian warehouse", "Waiting for your address", "Out from the Indian warehouse", "Delivered"];
const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const fd = (s?: string) => { if (!s) return ""; const d = new Date(String(s).slice(0, 10) + "T00:00:00Z"); return isNaN(+d) ? "" : d.getUTCDate() + " " + MON[d.getUTCMonth()]; };
const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
const pslug = (s: string) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
const short = (t: string) => t.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\b(in signature canvas|signature logo|small signature logo)\b/gi, "").replace(/\s+/g, " ").trim();
function find(q: string, rows: any[]) {
  q = q.toLowerCase().replace(/bracelet/g, "wristlet").replace(/purse/g, "bag").replace(/ghadi|ghari/g, "watch").replace(/chappal|slipper/g, "sandal");
  let best: any = null, score = 0;
  for (const r of rows) { const words = (r.item + " " + (r.brand || "") + " " + (r.order_no || "")).toLowerCase().split(/[^a-z0-9#]+/).filter((w: string) => w.length > 2); let s = 0; for (const w of words) if (q.includes(w)) s += w.length; if (s > score) { score = s; best = r; } }
  return score >= 4 ? best : null;
}
const stage = (r: any) => Number(r.stage || 1);
function line(r: any) {
  const st = stage(r); let t = short(r.item) + ": " + (STAGES[st - 1] || r.status || "in progress");
  if (st >= 9) return t + ".";
  if (r.eta_date) t += String(r.eta_date).slice(0, 10) < new Date().toISOString().slice(0, 10) ? ", running a little late; Luxella will update you" : ", expected around " + fd(r.eta_date);
  return t + ".";
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const u = new URL(req.url); let t = u.searchParams.get("t") || "", q = u.searchParams.get("q") || "", fmt = u.searchParams.get("fmt") || "";
  if (req.method === "POST") { try { const b = await req.json(); t = b.t || t; q = b.q || q; fmt = b.fmt || fmt; } catch (_) { /* ignore */ } }
  const out = (text: string, url = "") => fmt === "json" ? new Response(JSON.stringify({ text, url }), { headers: { ...CORS, "Content-Type": "application/json" } }) : new Response(text, { headers: { ...CORS, "Content-Type": "text/plain; charset=utf-8" } });
  if (!/^[a-f0-9]{24,64}$/.test(t)) return out("This Luxella voice link is not set up. Open your Luxella page and tap the gold mic to set it up again.");
  const { data: tok } = await db.from("lx_docs").select("client_id").eq("collection", "meta").eq("doc_id", "voice_token").eq("data->>token", t).maybeSingle();
  if (!tok) return out("This Luxella voice link has expired. Open your Luxella page and tap the gold mic to get a new one.");
  const cid = tok.client_id;
  const [{ data: cl }, { data: o }, { data: pops }] = await Promise.all([
    db.from("lx_clients").select("slug,name").eq("id", cid).maybeSingle(),
    db.from("lx_orders").select("item,data").eq("client_id", cid),
    db.from("lx_docs").select("doc_id").eq("client_id", cid).eq("collection", "pop"),
  ]);
  const page = PORTAL + (cl?.slug || "");
  const rows = (o || []).map((x: any) => ({ item: x.item, ...x.data })).filter((r: any) => !/cancel/i.test(String(r.status || "")));
  const hasPop = new Set((pops || []).map((p: any) => p.doc_id));
  const first = String(cl?.name || "").split(" ")[0] || "there";
  const ql = q.toLowerCase().trim();
  const r = ql ? find(ql, rows) : null;
  const open = rows.filter((x: any) => stage(x) < 9);
  // proof of purchase
  if (/proof|receipt|invoice|bill\b|purchase|parchi|rasid|raseed/.test(ql)) {
    if (r) return hasPop.has(pslug(r.item)) ? out("Your proof of purchase for the " + short(r.item) + " is ready. It is on your Luxella page, under that order.", page + "?ask=" + encodeURIComponent("show proof of purchase for " + r.item)) : out("The proof of purchase for your " + short(r.item) + " is not uploaded yet. Luxella adds it once the store confirms.");
    const w = rows.filter((x: any) => hasPop.has(pslug(x.item)));
    if (!w.length) return out("No proof of purchase has been uploaded yet.");
    if (w.length === 1) return out("Your proof of purchase for the " + short(w[0].item) + " is ready on your Luxella page.", page + "?ask=" + encodeURIComponent("show proof of purchase for " + w[0].item));
    return out("Proof of purchase is ready for " + w.length + " orders: " + w.map((x: any) => short(x.item)).join(", ") + ". They are on your Luxella page, under each order.", page + "?ask=" + encodeURIComponent("show my proof of purchase"));
  }
  // money
  if (/\b(pay|paid|due|owe|pending|balance|baki|baaki|paisa|amount)\b/.test(ql)) {
    const due = rows.filter((x: any) => x.payout_status === "Pending");
    if (!due.length) return out("Nothing is due, " + first + ". All your orders are paid.");
    const tot = due.reduce((s: number, x: any) => s + Number(x.payout || 0), 0);
    return out(inr(tot) + " is due on " + due.length + " order" + (due.length > 1 ? "s" : "") + ": " + due.map((x: any) => short(x.item) + " " + inr(Number(x.payout || 0))).join(", ") + ".");
  }
  // tracking
  if (/track|tracking|courier|awb/.test(ql)) {
    const list = (r ? [r] : open).filter((x: any) => x.local_tracking);
    if (!list.length) return out(r ? "No India tracking number yet for your " + short(r.item) + ". " + line(r) : "No India tracking numbers yet. They come once an order leaves the Indian warehouse.");
    return out(list.map((x: any) => short(x.item) + ": " + (x.local_courier ? x.local_courier + " " : "") + x.local_tracking).join(". ") + ".");
  }
  // address
  if (/address|pata/.test(ql)) {
    const need = rows.filter((x: any) => stage(x) === 7);
    return out(need.length ? "Yes, Luxella needs your delivery address for " + need.map((x: any) => short(x.item)).join(", ") + ". Add it in the Address tab on your Luxella page." : "No address needed right now.", need.length ? page + "#ad" : "");
  }
  // one order
  if (r) return out(line(r) + (r.local_tracking && stage(r) < 9 ? " Tracking " + r.local_tracking + "." : ""));
  // next arrival
  if (/next|kab|when|arriv|eta|soon/.test(ql)) {
    const nx = open.filter((x: any) => x.eta_date).sort((a: any, b: any) => String(a.eta_date).localeCompare(String(b.eta_date)))[0];
    if (nx) return out("Next to arrive is your " + short(nx.item) + (String(nx.eta_date).slice(0, 10) < new Date().toISOString().slice(0, 10) ? ". It is running a little late; Luxella will update you." : ", around " + fd(nx.eta_date) + "."));
  }
  // summary
  if (!open.length) return out("All your orders are delivered, " + first + ". Nothing is on the way right now.");
  const head = "You have " + open.length + " order" + (open.length > 1 ? "s" : "") + " on the way. ";
  return out(head + open.slice(0, 5).map(line).join(" ") + (open.length > 5 ? " And " + (open.length - 5) + " more on your Luxella page." : ""));
});
