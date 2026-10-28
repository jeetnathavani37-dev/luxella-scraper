// lx-media: owner-only AI media (model shots via Gemini image, product videos via Veo). Saves results to lx-assets.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const OWNERS = ["jeetnathavani37@gmail.com", "jeetnatb@gmail.com"];
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const J = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
async function owner(req: Request) { const a = req.headers.get("authorization") || ""; if (!a.startsWith("Bearer ")) return false; const { data } = await db.auth.getUser(a.slice(7)); return OWNERS.includes(String(data?.user?.email || "").toLowerCase()); }
async function getAI() { const { data } = await db.from("lx_km_vault").select("data").eq("id", "ai").maybeSingle(); return data?.data || null; }
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    if (!(await owner(req))) return J({ ok: false, error: "owner only" }, 403);
    const body: any = await req.json().catch(() => ({}));
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
    return J({ ok: false, error: "unknown action" }, 400);
  } catch (e) { return J({ ok: false, error: String((e as Error).message || e) }, 200); }
});
