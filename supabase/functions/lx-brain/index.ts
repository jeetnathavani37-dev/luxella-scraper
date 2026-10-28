// lx-brain: owner-only AI reader for the B2B portal. Reads text / photo / voice and PROPOSES order updates.
// It never writes orders itself — the portal shows the proposal and Jeet taps Apply.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const OWNERS = ["jeetnathavani37@gmail.com", "jeetnatb@gmail.com"];
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const J = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
export const FIELDS: Record<string, string> = {
  retailer_order_id: "store order number (e.g. Z0123..., WUP..., C0...)", retailer_date: "date store order placed YYYY-MM-DD", store: "store/retailer name",
  price_usd: "what Luxella paid the store for THIS order, USD number", total_usd: "store order grand total USD (if several items)", retailer_carrier: "UPS/FedEx/USPS/OnTrac/Amazon",
  retailer_tracking: "store→reshipper tracking number", retailer_ship_date: "date store shipped", reshipper: "Ishaan-USA | Yash | Prabhmeet | Dev Gandhi | Tanish",
  delivered_reshipper: "date parcel reached reshipper", actual_weight: "kg number", reship_cost: "reshipper charge INR number", reship_awb: "reshipper→India AWB",
  shipped_reshipper: "date left reshipper for India", form_filled: "'Yes' when receiver form filled", form_date: "date form filled", landed_india: "date landed India",
  km_tracking: "India courier tracking to KicksMachine", shipped_km: "date sent to KicksMachine", delivered_km: "date KicksMachine received",
  mrn_updated: "date MRN updated on KM", mrn_confirmed: "date KM confirmation mail received", payout: "KM payout INR number",
  payout_status: "'Received' only if payout money actually received", payout_date: "date payout received", status: "ONLY the value 'Cancelled' if clearly cancelled", notes: "short extra note",
};
const SYS = (orders: unknown, today: string) => `You are the back-office brain of Luxella (B2B sneaker/luxury sourcing for KicksMachine, India). Today is ${today} (IST).
Flow: KicksMachine (KM) order US1xxxxx → Luxella buys from a US/EU store (store order no, USD price) → store ships to a reshipper (tracking) → reshipper ships to India (AWB, weight) → India courier to KM → MRN → KM confirmation mail → payout 7 days later.
Jeet will give you a pasted message, an email, a screenshot/photo (store order confirmation, shipping mail, courier label, invoice, WhatsApp chat) or a voice note in Hindi/English/Hinglish.
Read EVERYTHING carefully (all numbers, codes, dollar amounts, dates, product names, sizes) and map it to the existing orders below. Match by US id, store order no, tracking, or product name + size when no id is visible. Never invent ids. If you are not sure which order, put it in "unmatched" instead of guessing.
Allowed fields (only these): ${JSON.stringify(FIELDS)}
Open orders (JSON): ${JSON.stringify(orders)}
Reply with ONLY JSON: {"transcript": "<what the voice said, if audio>", "summary": "<1-2 lines Hinglish of what you saw>", "extracted": {"order_ids":[], "store_orders":[], "tracking":[], "usd_amounts":[], "inr_amounts":[], "dates":[], "products":[]}, "updates": [{"order_id":"US…","fields":{…},"why":"<short Hinglish reason>","confidence":0-1}], "unmatched": "<anything useful you could not place, else empty>"}`;

async function owner(req: Request) { const a = req.headers.get("authorization") || ""; if (!a.startsWith("Bearer ")) return false; const { data } = await db.auth.getUser(a.slice(7)); return OWNERS.includes(String(data?.user?.email || "").toLowerCase()); }
async function getAI() { const { data } = await db.from("lx_km_vault").select("data").eq("id", "ai").maybeSingle(); return data?.data || null; }

async function callGemini(ai: any, sys: string, text: string, image?: any, audio?: any) {
  const parts: any[] = [{ text: sys }, { text: "INPUT TEXT:\n" + (text || "(none)") }];
  if (image?.b64) parts.push({ inline_data: { mime_type: image.mime || "image/jpeg", data: image.b64 } });
  if (audio?.b64) parts.push({ inline_data: { mime_type: audio.mime || "audio/webm", data: audio.b64 } });
  const tried = [ai.model, "gemini-flash-latest", "gemini-3.8-flash", "gemini-3-flash", "gemini-2.5-flash"].filter((x, i, a) => x && a.indexOf(x) === i);
  let last = "";
  for (const m of tried) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": ai.key }, body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { responseMimeType: "application/json", temperature: 0.1 } }) });
    const j: any = await r.json().catch(() => ({}));
    if (r.ok) { ai.model = m; return j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || ""; }
    last = "Gemini " + r.status + ": " + String(j?.error?.message || "").slice(0, 160);
    if (r.status !== 404 && r.status !== 400) break;
    const sug = String(j?.error?.message || "").match(/models\/(gemini-[\w.-]+)/g);
    if (sug) for (const x of sug) { const n = x.replace("models/", ""); if (!tried.includes(n)) tried.push(n); }
  }
  throw new Error(last);
}
async function callClaude(ai: any, sys: string, text: string, image?: any) {
  const content: any[] = [];
  if (image?.b64) content.push(image.mime === "application/pdf" ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: image.b64 } } : { type: "image", source: { type: "base64", media_type: image.mime || "image/jpeg", data: image.b64 } });
  content.push({ type: "text", text: "INPUT TEXT:\n" + (text || "(none)") });
  const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": ai.key, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: ai.model || "claude-haiku-5-5", max_tokens: 6000, system: sys, messages: [{ role: "user", content }] }) });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error("Claude " + r.status + ": " + String(j?.error?.message || "").slice(0, 160));
  return (j?.content || []).map((c: any) => c.text || "").join("");
}
function parseJSON(s: string) { const a = s.indexOf("{"), b = s.lastIndexOf("}"); if (a < 0 || b < 0) throw new Error("AI ne JSON nahi diya"); return JSON.parse(s.slice(a, b + 1)); }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    if (!(await owner(req))) return J({ ok: false, error: "owner only" }, 403);
    const body: any = await req.json().catch(() => ({}));
    if (body.action === "status") { const ai = await getAI(); return J({ ok: true, connected: !!ai?.key, provider: ai?.provider || null, model: ai?.model || null }); }
    if (body.action === "setkey") {
      const provider = body.provider === "anthropic" ? "anthropic" : "gemini"; const key = String(body.key || "").trim();
      if (!key) { await db.from("lx_km_vault").delete().eq("id", "ai"); return J({ ok: true, connected: false }); }
      const ai: any = { provider, key, model: String(body.model || "").trim() || null };
      try { const t = provider === "gemini" ? await callGemini(ai, 'Reply {"ok":true}', "") : await callClaude(ai, 'Reply {"ok":true}', "ping"); parseJSON(t); } catch (e) { return J({ ok: false, error: String((e as Error).message || e) }); }
      await db.from("lx_km_vault").upsert({ id: "ai", data: ai, updated_at: new Date().toISOString() });
      return J({ ok: true, connected: true, provider });
    }
    if (body.action === "deals_extract") {
      const ai = await getAI(); if (!ai?.key) return J({ ok: false, error: "no_ai" });
      const isPdf = body.image?.mime === "application/pdf";
      const sys = `You read luxury-fashion deal material for Luxella (India): store screenshots, outlet sale pages, WhatsApp forwards, catalogue PDFs.
Extract EVERY distinct product you can see. For each product return:
brand (house name, e.g. Coach, Michael Kors, Kate Spade, Marc Jacobs, Tory Burch), title (clean product name, no brand repeated, Title Case), sizes (sizes or colours shown, short), price (the selling/sale price as a number) and currency ("USD" | "INR" | "EUR" | "GBP" | "CAD"), mrp (original/compare-at price as a number if shown, else null), note (very short, e.g. "Extra 20% off at checkout"), confidence 0-1${isPdf ? `, page (1-based page number)` : `, box: the product PHOTO bounding box as [ymin, xmin, ymax, xmax] normalised 0-1000 (photo only, not the text)`}.
Never invent prices or products. If a field is not visible use null. Reply with ONLY JSON: {"summary":"<1 line Hinglish>","items":[{...}]}`;
      const raw = ai.provider === "gemini" ? await callGemini(ai, sys, body.text || "", body.image) : await callClaude(ai, sys, body.text || "", body.image);
      const out = parseJSON(raw);
      out.items = (Array.isArray(out.items) ? out.items : []).slice(0, 60).map((it: any) => ({ brand: String(it.brand || "").slice(0, 60), title: String(it.title || "").slice(0, 160), sizes: it.sizes ? String(it.sizes).slice(0, 80) : "", price: Number(it.price) || null, currency: String(it.currency || "").toUpperCase().slice(0, 3) || null, mrp: Number(it.mrp) || null, note: it.note ? String(it.note).slice(0, 120) : "", confidence: Number(it.confidence) || 0, page: Number(it.page) || null, box: Array.isArray(it.box) && it.box.length === 4 ? it.box.map((n: any) => Math.max(0, Math.min(1000, Number(n) || 0))) : null })).filter((it: any) => it.title);
      return J({ ok: true, provider: ai.provider, summary: out.summary || "", items: out.items });
    }
    if (body.action === "analyze") {
      const ai = await getAI(); if (!ai?.key) return J({ ok: false, error: "no_ai" });
      if (body.audio && ai.provider !== "gemini") return J({ ok: false, error: "voice ke liye Gemini key chahiye" });
      const { data: rows } = await db.from("lx_b2b").select("id,data").eq("kind", "order");
      const open = (rows || []).filter((r: any) => !["Paid", "Cancelled"].includes(r.data?.status) && r.data?.payout_status !== "Received").map((r: any) => {
        const d = r.data || {}; const o: any = { id: r.id };
        ["item", "size", "status", "store", "retailer_order_id", "retailer_tracking", "reshipper", "reship_awb", "km_tracking", "price_usd", "payout", "order_date"].forEach((k) => { if (d[k] != null && d[k] !== "") o[k] = d[k]; });
        return o;
      });
      const today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
      const sys = SYS(open, today);
      const raw = ai.provider === "gemini" ? await callGemini(ai, sys, body.text || "", body.image, body.audio) : await callClaude(ai, sys, body.text || "", body.image);
      const out = parseJSON(raw);
      const ids = new Set((rows || []).map((r: any) => r.id));
      out.updates = (Array.isArray(out.updates) ? out.updates : []).filter((u: any) => ids.has(u?.order_id)).map((u: any) => {
        const f: any = {}; for (const [k, v] of Object.entries(u.fields || {})) { if (!(k in FIELDS) || v == null || v === "") continue; if (k === "status" && v !== "Cancelled") continue; f[k] = v; }
        return { order_id: u.order_id, fields: f, why: String(u.why || "").slice(0, 200), confidence: Number(u.confidence) || 0 };
      }).filter((u: any) => Object.keys(u.fields).length);
      return J({ ok: true, provider: ai.provider, ...out });
    }
    return J({ ok: false, error: "unknown action" }, 400);
  } catch (e) { return J({ ok: false, error: String((e as Error).message || e) }, 200); }
});
