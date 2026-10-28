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

async function identifyGemini(ai: any, prompt: string, image: any) {
  const parts: any[] = [{ text: prompt }];
  if (image?.b64) parts.push({ inline_data: { mime_type: image.mime || "image/jpeg", data: image.b64 } });
  const tried = [ai.model, "gemini-flash-latest", "gemini-3.8-flash", "gemini-3-flash", "gemini-2.5-flash"].filter((x, i, a) => x && a.indexOf(x) === i);
  let last = "";
  for (const m of tried) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": ai.key }, body: JSON.stringify({ contents: [{ role: "user", parts }], tools: [{ google_search: {} }], generationConfig: { temperature: 0.1 } }) });
    const j: any = await r.json().catch(() => ({}));
    if (r.ok) { const c = j?.candidates?.[0]; const txt = c?.content?.parts?.map((p: any) => p.text || "").join("") || ""; const src = (c?.groundingMetadata?.groundingChunks || []).map((g: any) => g?.web?.uri).filter(Boolean).slice(0, 6); return { txt, src }; }
    last = "Gemini " + r.status + ": " + String(j?.error?.message || "").slice(0, 160);
    if (r.status !== 404 && r.status !== 400) break;
  }
  throw new Error(last);
}
async function identifyClaude(ai: any, prompt: string, image: any) {
  const content: any[] = [];
  if (image?.b64) content.push({ type: "image", source: { type: "base64", media_type: image.mime || "image/jpeg", data: image.b64 } });
  content.push({ type: "text", text: prompt });
  const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": ai.key, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: ai.model || "claude-haiku-5-5", max_tokens: 3000, tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 6 }], messages: [{ role: "user", content }] }) });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error("Claude " + r.status + ": " + String(j?.error?.message || "").slice(0, 160));
  const txt = (j?.content || []).filter((c: any) => c.type === "text").map((c: any) => c.text || "").join("");
  return { txt, src: [] as string[] };
}
async function mirrorImage(url: string) {
  try {
    if (!/^https:\/\//i.test(url)) return "";
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1", "Accept": "image/avif,image/webp,image/jpeg,image/*,*/*;q=0.8" } });
    const ct = r.headers.get("content-type") || "";
    if (!r.ok || !ct.startsWith("image/")) return "";
    const b = new Uint8Array(await r.arrayBuffer()); if (b.length < 3000 || b.length > 8e6) return "";
    const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg";
    const path = `deals/official_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const up = await db.storage.from("lx-assets").upload(path, b, { contentType: ct, upsert: false });
    if (up.error) return "";
    return db.storage.from("lx-assets").getPublicUrl(path).data.publicUrl;
  } catch (_) { return ""; }
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
    if (body.action === "video_start") {
      const ai = await getAI(); if (!ai?.key) return J({ ok: false, error: "no_ai" });
      if (ai.provider !== "gemini") return J({ ok: false, error: "AI video needs a Gemini key" });
      const T: Record<string, string> = {
        unboxing: "Close-up vertical video: elegant hands with neat manicure slowly untie a satin ribbon and lift the lid of a luxury gift box, revealing the exact product from the reference image nestled in tissue paper; soft warm window light, shallow depth of field, slow cinematic push-in, premium ASMR feel.",
        handheld: "Vertical video in a luxury boutique: a hand holds the exact product from the reference image and slowly turns it to show front, side and details; marble and brass interior softly blurred behind, warm golden light, smooth handheld motion.",
        model: "Vertical fashion video: an elegant model walks towards camera on a Parisian street at golden hour carrying or wearing the exact product from the reference image, slow motion, editorial film look, the product stays clearly visible.",
        spin: "Vertical studio video: the exact product from the reference image rotates slowly on a round plinth, seamless ivory backdrop, soft studio lighting, subtle reflections, smooth 360° turn.",
        flatlay: "Vertical top-down video: a styled flat lay on cream linen with dried flowers and a perfume bottle; the exact product from the reference image is gently placed in the centre by a hand; soft daylight, calm editorial mood."
      };
      const prompt = (T[String(body.tpl)] || T.handheld) + " Keep the product 100% identical to the reference — same shape, colour, material, logos and hardware. No text, no captions, no watermark." + (body.hint ? " Product: " + String(body.hint).slice(0, 120) + "." : "");
      const models = [ai.videoModel, "veo-3.1-fast-generate-preview", "veo-3.0-fast-generate-001", "veo-3.1-generate-preview", "veo-3.0-generate-001", "veo-2.0-generate-001"].filter((x, i, a) => x && a.indexOf(x) === i);
      let last = "";
      for (const m of models) {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:predictLongRunning`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": ai.key }, body: JSON.stringify({ instances: [{ prompt, image: { bytesBase64Encoded: body.image?.b64 || "", mimeType: body.image?.mime || "image/jpeg" } }], parameters: { aspectRatio: "9:16" } }) });
        const j: any = await r.json().catch(() => ({}));
        if (r.ok && j?.name) return J({ ok: true, op: j.name, model: m });
        last = "Veo " + r.status + ": " + String(j?.error?.message || "").slice(0, 200);
        if (r.status === 404 || r.status === 400) continue; break;
      }
      return J({ ok: false, error: last || "Video model unavailable" });
    }
    if (body.action === "video_status") {
      const ai = await getAI(); if (!ai?.key) return J({ ok: false, error: "no_ai" });
      const op = String(body.op || ""); if (!/^models\/[\w.-]+\/operations\/[\w-]+$/.test(op)) return J({ ok: false, error: "bad op" });
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/${op}`, { headers: { "x-goog-api-key": ai.key } });
      const j: any = await r.json().catch(() => ({}));
      if (!r.ok) return J({ ok: false, error: "Veo " + r.status + ": " + String(j?.error?.message || "").slice(0, 200) });
      if (!j.done) return J({ ok: true, done: false });
      if (j.error) return J({ ok: false, error: String(j.error.message || "Video failed").slice(0, 200) });
      const uri = j?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri || j?.response?.generatedVideos?.[0]?.video?.uri;
      if (!uri) return J({ ok: false, error: "No video returned (it may have been blocked by safety filters)" });
      const v = await fetch(uri, { headers: { "x-goog-api-key": ai.key } }); if (!v.ok) return J({ ok: false, error: "Download failed " + v.status });
      const bin = new Uint8Array(await v.arrayBuffer());
      const path = `deals/aivideo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.mp4`;
      const up = await db.storage.from("lx-assets").upload(path, bin, { contentType: "video/mp4", upsert: false });
      if (up.error) return J({ ok: false, error: up.error.message });
      return J({ ok: true, done: true, url: db.storage.from("lx-assets").getPublicUrl(path).data.publicUrl });
    }
    if (body.action === "model_shot") {
      const ai = await getAI(); if (!ai?.key) return J({ ok: false, error: "no_ai" });
      if (ai.provider !== "gemini") return J({ ok: false, error: "Model shots need a Gemini key" });
      const style = String(body.style || "editorial").slice(0, 40);
      const looks: Record<string, string> = { editorial: "high-fashion editorial, soft directional light, neutral warm studio backdrop, Vogue-style composition", street: "luxury street-style photo in a European city at golden hour, candid walking pose", studio: "clean premium e-commerce studio shot on a model, seamless ivory background, soft shadows", night: "glamorous evening scene, warm bokeh city lights, cinematic" };
      const prompt = `Create a photorealistic ${looks[style] || looks.editorial} of an elegant model naturally wearing or carrying the EXACT product shown in the reference image. Keep the product 100% identical: same shape, colour, material, logo placement, hardware and proportions — do not redesign it. The product must be clearly visible and in sharp focus. Vertical 4:5 framing. No text, no watermark, no extra logos.${body.hint ? " Product: " + String(body.hint).slice(0, 120) + "." : ""}`;
      const models = [ai.imageModel, "gemini-2.5-flash-image", "gemini-3-pro-image-preview", "gemini-2.5-flash-image-preview", "gemini-flash-image-latest"].filter((x, i, a) => x && a.indexOf(x) === i);
      let last = "";
      for (const m of models) {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": ai.key }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, { inline_data: { mime_type: body.image?.mime || "image/jpeg", data: body.image?.b64 || "" } }] }], generationConfig: { responseModalities: ["IMAGE", "TEXT"] } }) });
        const j: any = await r.json().catch(() => ({}));
        if (!r.ok) { last = "Gemini " + r.status + ": " + String(j?.error?.message || "").slice(0, 160); if (r.status === 404 || r.status === 400) continue; break; }
        const part = (j?.candidates?.[0]?.content?.parts || []).find((p: any) => p.inline_data?.data || p.inlineData?.data);
        const data = part?.inline_data?.data || part?.inlineData?.data; const mime = part?.inline_data?.mime_type || part?.inlineData?.mimeType || "image/png";
        if (!data) { last = "No image returned"; continue; }
        const bin = Uint8Array.from(atob(data), (ch) => ch.charCodeAt(0));
        const path = `deals/model_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${mime.includes("jpeg") ? "jpg" : "png"}`;
        const up = await db.storage.from("lx-assets").upload(path, bin, { contentType: mime, upsert: false });
        if (up.error) return J({ ok: false, error: up.error.message });
        return J({ ok: true, url: db.storage.from("lx-assets").getPublicUrl(path).data.publicUrl, model: m });
      }
      return J({ ok: false, error: last || "Image model unavailable" });
    }
    if (body.action === "deals_identify") {
      const ai = await getAI(); if (!ai?.key) return J({ ok: false, error: "no_ai" });
      const hint = String(body.hint || "").slice(0, 300);
      const prompt = `You are a luxury retail product identifier. Look at the photo (a store / outlet / reseller photo or screenshot).${hint ? " Extra hint from the seller: " + hint + "." : ""}
1) Identify the brand and the exact product (model name, colourway/material, style code if visible).
2) Use web search to find this exact product on the brand's OFFICIAL website first (e.g. burberry.com, coach.com, us.puma.com, philipp-plein.com). If not on the official site, use a major authorised retailer (Farfetch, Nordstrom, Saks, Mytheresa, NAP, SSENSE).
3) Return ONLY JSON, no markdown:
{"brand":"","title":"clean product name in Title Case, no brand","colour":"","style_code":"","url":"product page URL","retail_price":number|null,"currency":"USD|INR|EUR|GBP|...","image_url":"direct URL of the main product image on that page (jpg/png/webp) or empty","category":"bags|shoes|clothing|wallets|accessories|watches|eyewear|fragrance","match":"exact|similar|guess","confidence":0-1,"note":"one short line"}
Never invent a URL or price. If unsure, set match to "guess" and leave unknown fields empty.`;
      const out = ai.provider === "gemini" ? await identifyGemini(ai, prompt, body.image) : await identifyClaude(ai, prompt, body.image);
      let it: any = {}; try { it = parseJSON(out.txt); } catch (_) { return J({ ok: false, error: "AI could not identify this piece" }); }
      const res: any = { brand: String(it.brand || "").slice(0, 60), title: String(it.title || "").slice(0, 160), colour: String(it.colour || "").slice(0, 60), style_code: String(it.style_code || "").slice(0, 40), url: /^https?:\/\//.test(it.url || "") ? String(it.url).slice(0, 500) : "", retail_price: Number(it.retail_price) || null, currency: String(it.currency || "").toUpperCase().slice(0, 3) || null, category: String(it.category || "").slice(0, 20), match: ["exact", "similar", "guess"].includes(it.match) ? it.match : "guess", confidence: Number(it.confidence) || 0, note: String(it.note || "").slice(0, 160), sources: out.src };
      res.image = it.image_url ? await mirrorImage(String(it.image_url)) : "";
      return J({ ok: true, provider: ai.provider, item: res });
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
