// lx-drop: iPhone Shortcut inbox. Share photos/PDFs from WhatsApp → this function → one drop in The Edit.
// Auth: secret key stored in lx_km_vault id 'dropcfg' (data.key). Each file is POSTed (multipart) with key+batch; a final call with done=1 builds the drop.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const T = (s: string, st = 200) => new Response(s, { status: st, headers: { ...CORS, "Content-Type": "text/plain; charset=utf-8" } });
const BUCKET = "lx-assets";

async function cfg() { const { data } = await db.from("lx_km_vault").select("data").eq("id", "dropcfg").maybeSingle(); return data?.data || null; }
async function getAI() { const { data } = await db.from("lx_km_vault").select("data").eq("id", "ai").maybeSingle(); return data?.data || null; }
const istDay = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
const b64 = (u8: Uint8Array) => { let s = ""; for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode(...u8.subarray(i, i + 32768)); return btoa(s); };

async function readPiece(ai: any, bytes: Uint8Array, mime: string) {
  const prompt = `Luxury fashion photo or screenshot from a supplier group (India). Identify the main product. Reply ONLY JSON: {"brand":"","title":"clean product name, Title Case, no brand","sizes":"sizes or colours visible, short","price":number|null,"currency":"INR|USD|EUR|GBP|AED"}. Price = the selling price written on the image/caption if any, else null. Never invent.`;
  if (ai.provider === "gemini") {
    const tried = [ai.model, "gemini-flash-latest", "gemini-3.8-flash", "gemini-3-flash", "gemini-2.5-flash"].filter((x: any, i: number, a: any[]) => x && a.indexOf(x) === i);
    for (const m of tried) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": ai.key }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: b64(bytes) } }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.1 } }) });
      const j: any = await r.json().catch(() => ({}));
      if (r.ok) { const t = j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || ""; return JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1)); }
      if (r.status !== 404 && r.status !== 400) break;
    }
    return null;
  }
  const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": ai.key, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: ai.model || "claude-haiku-5-5", max_tokens: 600, messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: mime, data: b64(bytes) } }, { type: "text", text: prompt }] }] }) });
  const j: any = await r.json().catch(() => ({})); if (!r.ok) return null;
  const t = (j?.content || []).map((c: any) => c.text || "").join(""); return JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const c = await cfg(); if (!c?.key) return T("Shortcut not set up yet.", 403);
    const ct = req.headers.get("content-type") || "";
    let key = "", batch = "", done = false, file: File | null = null, note = "";
    if (ct.includes("multipart/form-data") || ct.includes("application/x-www-form-urlencoded")) {
      const f = await req.formData(); key = String(f.get("key") || ""); batch = String(f.get("batch") || ""); done = String(f.get("done") || "") === "1"; note = String(f.get("note") || "");
      const v = f.get("file"); if (v && typeof v !== "string") file = v as File;
    } else { const j: any = await req.json().catch(() => ({})); key = String(j.key || ""); batch = String(j.batch || ""); done = String(j.done || "") === "1"; note = String(j.note || ""); }
    if (key !== c.key) return T("Wrong key.", 403);
    batch = batch.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "b" + Date.now();
    const dir = `inbox/${batch}`;
    if (file) {
      const bytes = new Uint8Array(await file.arrayBuffer()); if (bytes.length > 25e6) return T("File too big.", 413);
      const mime = file.type || (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg");
      const ext = mime.includes("pdf") ? "pdf" : mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : mime.includes("heic") ? "heic" : mime.startsWith("video/") ? "mp4" : "jpg";
      const path = `${dir}/${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
      const up = await db.storage.from(BUCKET).upload(path, bytes, { contentType: mime, upsert: false }); if (up.error) return T("Upload failed: " + up.error.message, 500);
      if (!done) return T("ok");
    }
    if (!done) return T("Nothing to do.", 400);
    const { data: list } = await db.storage.from(BUCKET).list(dir, { limit: 200, sortBy: { column: "name", order: "asc" } });
    const files = (list || []).filter((x: any) => x.name && !x.name.startsWith("."));
    if (!files.length) return T("No files received.", 400);
    const pub = (n: string) => db.storage.from(BUCKET).getPublicUrl(`${dir}/${n}`).data.publicUrl;
    const imgs = files.filter((x: any) => /\.(jpg|png|webp)$/i.test(x.name)), pdfs = files.filter((x: any) => /\.pdf$/i.test(x.name));
    const mk = Number(c.markup ?? 25), fx = Number(c.fx ?? 90); const RATE: any = { INR: 1, USD: fx, EUR: fx * 1.08, GBP: fx * 1.27, AED: fx * 0.272, CAD: fx * 0.73 };
    const draft = c.mode !== "live"; const day = istDay(); const made: string[] = [];
    if (imgs.length) {
      const ai = await getAI(); const caps: any = {}; const brands: string[] = [];
      if (ai?.key) {
        for (let i = 0; i < imgs.length && i < 30; i++) {
          try {
            const r = await fetch(pub(imgs[i].name)); const bytes = new Uint8Array(await r.arrayBuffer());
            const a: any = await readPiece(ai, bytes, imgs[i].name.endsWith(".png") ? "image/png" : imgs[i].name.endsWith(".webp") ? "image/webp" : "image/jpeg");
            if (!a) continue; const cur = String(a.currency || "INR").toUpperCase(); const sup = Number(a.price) ? Math.round(Number(a.price) * (RATE[cur] || 1)) : null;
            caps[i + 1] = { brand: String(a.brand || "").slice(0, 60), title: String(a.title || "").slice(0, 120), size: String(a.sizes || "").slice(0, 80), sup, price: sup != null ? Math.round(sup * (1 + mk / 100) / 100) * 100 : null };
            if (a.brand && !brands.includes(a.brand)) brands.push(a.brand);
          } catch (_) { /* skip piece */ }
        }
      }
      const title = note.trim() || (brands.length ? brands.slice(0, 2).join(" & ") + " Finds" : "New Arrivals");
      const lines = Object.entries(caps).map(([n, v]: any) => String(n).padStart(2, "0") + " · " + [v.brand, v.title].filter(Boolean).join(" ") + (v.size ? " · " + v.size : "") + " · " + (v.price != null ? "₹" + Number(v.price).toLocaleString("en-IN") : "Price upon request"));
      const msg = "✦ " + title + "\n\n" + (lines.length ? lines.join("\n") + "\n\n" : "") + "Reply with the number to reserve. Prices as of today.";
      const ins = await db.from("lx_deals").insert({ kind: "post", day, data: { title, msg, photos: imgs.map((x: any) => pub(x.name)), caps, draft, source: "shortcut" } }).select("id").single();
      if (ins.error) return T("Could not create the drop: " + ins.error.message, 500);
      made.push(imgs.length + " photos" + (Object.keys(caps).length ? ` (${Object.keys(caps).length} read by AI, +${mk}%)` : ""));
    }
    for (const p of pdfs) {
      const ins = await db.from("lx_deals").insert({ kind: "pdf", day, data: { title: note.trim() || "New Arrivals", url: pub(p.name), msg: "", draft, source: "shortcut" } });
      if (!ins.error) made.push("1 PDF");
    }
    return T(`Luxella · drop ${draft ? "saved as draft — review & publish in The Edit" : "is live"}: ${made.join(" + ")}.`);
  } catch (e) { return T("Error: " + String((e as Error).message || e), 500); }
});
