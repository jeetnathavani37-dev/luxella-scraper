// lx-media: AI media for owner + signed-in clients (daily quotas for clients) (model shots via Gemini image, product videos via Veo). Saves results to lx-assets.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const OWNERS = ["jeetnathavani37@gmail.com", "jeetnatb@gmail.com"];
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const J = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
async function who(req: Request) { const a = req.headers.get("authorization") || ""; if (!a.startsWith("Bearer ")) return null; const { data } = await db.auth.getUser(a.slice(7)); const u = data?.user; if (!u) return null; const email = String(u.email || "").toLowerCase(); return { id: u.id, email, owner: OWNERS.includes(email) }; }
const LIMIT: Record<string, number> = { video_start: 3, model_shot: 12, tts: 25, link_import: 40 };
async function quota(u: any, action: string) { if (u.owner || !LIMIT[action]) return true; const day = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10); const id = `quota:${u.id}:${day}`; const { data } = await db.from("lx_km_vault").select("data").eq("id", id).maybeSingle(); const q: any = data?.data || {}; if ((q[action] || 0) >= LIMIT[action]) return false; q[action] = (q[action] || 0) + 1; await db.from("lx_km_vault").upsert({ id, data: q }); return true; }
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const ent = (t: string) => t.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
async function linkImport(url: string, uid: string) {
  if (!/^https?:\/\//i.test(url)) return { ok: false, error: "Paste a full product link (https://…)" };
  const r = await fetch(url, { headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml", "Accept-Language": "en-IN,en;q=0.9" }, redirect: "follow" }).catch(() => null);
  if (!r || !r.ok) return { ok: false, error: "This site did not open for us (" + (r ? r.status : "network") + "). Add screenshots instead." };
  const html = (await r.text()).slice(0, 2_500_000);
  const meta = (p: string) => { const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${p}["'][^>]*content=["']([^"']+)["']`, "i")) || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${p}["']`, "i")); return m ? ent(m[1]) : ""; };
  let title = meta("og:title") || (html.match(/<title[^>]*>([^<]+)/i)?.[1] || "").trim(); let brand = meta("product:brand") || meta("og:site_name"); let price: number | null = Number(meta("product:price:amount") || meta("og:price:amount")) || null; let currency = meta("product:price:currency") || meta("og:price:currency") || "";
  const imgs: string[] = []; const add = (u: any) => { if (!u) return; if (typeof u === "object") u = u.url || u.contentUrl || u["@id"]; if (typeof u !== "string") return; try { const abs = new URL(ent(u), r.url).href; if (!imgs.includes(abs) && !/\.svg(\?|$)/i.test(abs) && !/logo|sprite|icon/i.test(abs)) imgs.push(abs); } catch (_) { /* skip */ } };
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { const j = JSON.parse(m[1].trim()); const L: any[] = [].concat(j["@graph"] || j); for (const n of L) { const t = [].concat(n["@type"] || []).join(","); if (!/Product/i.test(t)) continue; title = n.name || title; brand = (typeof n.brand === "string" ? n.brand : n.brand?.name) || brand; [].concat(n.image || []).forEach(add); const of: any = [].concat(n.offers || [])[0]; const o2 = of?.offers ? [].concat(of.offers)[0] : of; if (o2) { price = Number(o2.price || o2.lowPrice) || price; currency = o2.priceCurrency || currency; } } } catch (_) { /* bad json */ }
  }
  add(meta("og:image")); add(meta("og:image:secure_url")); add(meta("twitter:image"));
  if (imgs.length < 3) for (const m of html.matchAll(/<img[^>]+(?:data-src|src)=["']([^"']+\.(?:jpe?g|png|webp)[^"']*)["']/gi)) { if (imgs.length >= 10) break; if (/(product|media|image|catalog|cdn)/i.test(m[1])) add(m[1]); }
  const out: string[] = [];
  for (const u of imgs.slice(0, 8)) { try { const g = await fetch(u, { headers: { "User-Agent": UA, "Referer": r.url } }); if (!g.ok) continue; const ct = g.headers.get("content-type") || "image/jpeg"; if (!ct.startsWith("image/")) continue; const bin = new Uint8Array(await g.arrayBuffer()); if (bin.length < 6000 || bin.length > 12e6) continue; const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg"; const path = `client-uploads/link/${uid.slice(0, 8)}_${Date.now()}_${out.length}.${ext}`; const up = await db.storage.from("lx-assets").upload(path, bin, { contentType: ct, upsert: false }); if (!up.error) out.push(db.storage.from("lx-assets").getPublicUrl(path).data.publicUrl); } catch (_) { /* skip */ } }
  if (!out.length) return { ok: false, error: "Found the page but no product photos could be saved. Add screenshots instead.", title };
  return { ok: true, title: ent(String(title || "")).replace(/\s*[|–-]\s*[^|–-]*$/, "").slice(0, 140), brand: String(brand || "").slice(0, 60), price, currency, images: out, source: new URL(r.url).hostname };
}
async function getAI() { const { data } = await db.from("lx_km_vault").select("data").eq("id", "ai").maybeSingle(); return data?.data || null; }
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const u = await who(req); if (!u) return J({ ok: false, error: "Please sign in again." }, 401);
    const body: any = await req.json().catch(() => ({}));
    if (body.action === "video_status") { /* no quota */ } else if (!(await quota(u, String(body.action)))) return J({ ok: false, error: "Today's limit for this AI tool is reached. Try again tomorrow." });
    if (body.action === "link_import") return J(await linkImport(String(body.url || "").trim(), u.id));
    if (body.action === "tts") {
      const ai = await getAI(); if (!ai?.key || ai.provider !== "gemini") return J({ ok: false, error: "no_ai" });
      const text = String(body.text || "").slice(0, 900); if (!text.trim()) return J({ ok: false, error: "Write a voice-over script first." });
      const voice = String(body.voice || "Kore").replace(/[^A-Za-z]/g, "").slice(0, 20) || "Kore";
      const style = String(body.style || "calm, warm, luxurious, unhurried").slice(0, 120);
      const models = [ai.ttsModel, "gemini-2.5-flash-preview-tts", "gemini-2.5-pro-preview-tts", "gemini-flash-tts-latest"].filter((x, i, a) => x && a.indexOf(x) === i);
      let last = "";
      for (const m of models) {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": ai.key }, body: JSON.stringify({ contents: [{ parts: [{ text: `Say in a ${style} voice, like a luxury fashion advert voice-over: ${text}` }] }], generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } }) });
        const j: any = await r.json().catch(() => ({}));
        if (!r.ok) { last = "TTS " + r.status + ": " + String(j?.error?.message || "").slice(0, 160); if (r.status === 404 || r.status === 400) continue; break; }
        const p = (j?.candidates?.[0]?.content?.parts || []).find((x: any) => x.inlineData?.data || x.inline_data?.data);
        const data = p?.inlineData?.data || p?.inline_data?.data; const mime = p?.inlineData?.mimeType || p?.inline_data?.mime_type || "audio/L16;rate=24000";
        if (data) return J({ ok: true, b64: data, mime, model: m });
        last = "No audio returned";
      }
      return J({ ok: false, error: last || "Voice model unavailable" });
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
      const TAL: Record<string, string> = { hands_f: "Only elegant female hands with a nude manicure and a thin gold bracelet appear — no face.", hands_m: "Only well-groomed male hands with a classic steel watch appear — no face.", woman_in: "The person is an elegant Indian woman in her late 20s, refined styling, natural makeup.", woman_eu: "The person is an elegant European woman in her late 20s, quiet-luxury styling.", man_in: "The person is a stylish Indian man in his early 30s in a tailored outfit.", man_eu: "The person is a stylish European man in his early 30s in a tailored outfit.", none: "No people appear; product only." };
      const SC: Record<string, string> = { boutique: "Setting: a luxury boutique with marble, brass and soft spotlights.", paris: "Setting: a Parisian street at golden hour.", mumbai: "Setting: a Mumbai sea-facing terrace at sunset, Art Deco details.", studio: "Setting: a seamless ivory photo studio with soft light.", home: "Setting: a sunlit, styled luxury apartment with linen and flowers.", night: "Setting: a glamorous evening scene with warm city bokeh." };
      const extra = [TAL[String(body.talent)] || "", SC[String(body.scene)] || "", body.custom ? "Direction: " + String(body.custom).slice(0, 240) + "." : ""].filter(Boolean).join(" ");
      const prompt = (T[String(body.tpl)] || T.handheld) + (extra ? " " + extra : "") + " Keep the product 100% identical to the reference — same shape, colour, material, logos and hardware. No text, no captions, no watermark." + (body.hint ? " Product: " + String(body.hint).slice(0, 120) + "." : "");
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
      const prompt = `Create a photorealistic ${looks[style] || looks.editorial} of an elegant model naturally wearing or carrying the EXACT product shown in the reference image. Keep the product 100% identical: same shape, colour, material, logo placement, hardware and proportions — do not redesign it. The product must be clearly visible and in sharp focus. Vertical 4:5 framing. No text, no watermark, no extra logos.${body.person ? " The model: " + String(body.person).slice(0, 160) + "." : ""}${body.hint ? " Product: " + String(body.hint).slice(0, 120) + "." : ""}`;
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
    return J({ ok: false, error: "unknown action" }, 400);
  } catch (e) { return J({ ok: false, error: String((e as Error).message || e) }, 200); }
});
