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

const GPROMPT = (n: number) => `You are cataloguing a luxury reseller's drop (India). You get ${n} media items numbered 1..${n} in order (photos, screenshots, short videos). Several items can show the SAME physical product (different angles, close-ups, a box/tag shot, a video of it). Group them so each group = one distinct product. Reply ONLY JSON: {"groups":[{"items":[1,3,4],"brand":"","title":"clean product name in Title Case without brand","colour":"","sizes":"sizes visible, short","price":number|null,"currency":"INR|USD|EUR|GBP|AED","query":"best web search query to find this exact product on the brand's official site"}]}. Every item number must appear in exactly one group. Put the clearest full-product shot first in "items". price = selling price written on the image/caption, else null. Never invent.`;
const b64s = (u8: Uint8Array) => b64(u8);
async function aiJSON(ai: any, parts: any[], prompt: string) {
  if (ai.provider === "gemini") {
    const tried = [ai.model, "gemini-flash-latest", "gemini-3.8-flash", "gemini-3-flash", "gemini-2.5-flash"].filter((x: any, i: number, a: any[]) => x && a.indexOf(x) === i);
    for (const m of tried) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": ai.key }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }, ...parts.map((p) => ({ inline_data: { mime_type: p.mime, data: p.data } }))] }], generationConfig: { responseMimeType: "application/json", temperature: 0.1 } }) });
      const j: any = await r.json().catch(() => ({}));
      if (r.ok) { const t = j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || ""; return JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1)); }
      if (r.status !== 404 && r.status !== 400) break;
    }
    return null;
  }
  const content: any[] = parts.filter((p) => p.mime.startsWith("image/") || p.mime === "application/pdf").map((p) => p.mime === "application/pdf" ? { type: "document", source: { type: "base64", media_type: p.mime, data: p.data } } : { type: "image", source: { type: "base64", media_type: p.mime, data: p.data } });
  content.push({ type: "text", text: prompt });
  const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": ai.key, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: ai.model || "claude-haiku-5-5", max_tokens: 4000, messages: [{ role: "user", content }] }) });
  const j: any = await r.json().catch(() => ({})); if (!r.ok) return null;
  const t = (j?.content || []).map((c: any) => c.text || "").join(""); return JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1));
}
// look the piece up on the brand's own site (Gemini + Google Search grounding)
async function brandSite(ai: any, g: any) {
  if (ai.provider !== "gemini" || !g.query) return null;
  const prompt = `Search the web for this exact product on the brand's OFFICIAL website (not resellers): "${g.query}". Reply ONLY JSON: {"name":"official product name","retail":number|null,"currency":"","url":"official product page or empty"}. If not found, use nulls.`;
  for (const m of [ai.model, "gemini-flash-latest", "gemini-2.5-flash"].filter(Boolean)) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": ai.key }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], tools: [{ google_search: {} }], generationConfig: { temperature: 0.1 } }) });
    const j: any = await r.json().catch(() => ({}));
    if (r.ok) { try { const t = j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || ""; return JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1)); } catch (_) { return null; } }
    if (r.status !== 404 && r.status !== 400) break;
  }
  return null;
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
    const isImg = (n: string) => /\.(jpg|png|webp)$/i.test(n), isVid = (n: string) => /\.mp4$/i.test(n);
    const media = files.filter((x: any) => isImg(x.name) || isVid(x.name)), pdfs = files.filter((x: any) => /\.pdf$/i.test(x.name));
    const mk = Number(c.markup ?? 25), fx = Number(c.fx ?? 90); const RATE: any = { INR: 1, USD: fx, EUR: fx * 1.08, GBP: fx * 1.27, AED: fx * 0.272, CAD: fx * 0.73 };
    const sell = (price: any, cur: any) => { const sup = Number(price) ? Math.round(Number(price) * (RATE[String(cur || "INR").toUpperCase()] || 1)) : null; return { sup, price: sup != null ? Math.round(sup * (1 + mk / 100) / 100) * 100 : null }; };
    const draft = c.mode !== "live"; const day = istDay(); const made: string[] = []; const ai = await getAI(); let bsN = 0;
    const capFrom = async (g: any) => { const s2 = sell(g.price, g.currency); const cap: any = { brand: String(g.brand || "").slice(0, 60), title: String(g.title || "").slice(0, 120), size: String(g.sizes || "").slice(0, 80), colour: String(g.colour || "").slice(0, 40), sup: s2.sup, price: s2.price };
      if (ai?.key && bsN++ < 12) { const o = await brandSite(ai, g).catch(() => null); if (o && (o.name || o.url)) { if (o.name) cap.title = String(o.name).replace(new RegExp("^" + (cap.brand || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*", "i"), "").slice(0, 120); if (o.url) cap.link = String(o.url).slice(0, 400); const rt = sell(o.retail, o.currency).sup; if (rt) cap.mrp = rt; } }
      return cap; };
    if (media.length) {
      const photos = media.filter((x: any) => isImg(x.name)).map((x: any) => pub(x.name)); const vids = media.filter((x: any) => isVid(x.name)).map((x: any) => pub(x.name));
      let groups: number[][] = [], caps: any = {}; const brands: string[] = [];
      if (ai?.key) {
        const parts: any[] = []; const order: string[] = [];
        for (const x of media.slice(0, 30)) { try { const r = await fetch(pub(x.name)); const u8 = new Uint8Array(await r.arrayBuffer()); if (isVid(x.name) && (u8.length > 14e6 || ai.provider !== "gemini")) continue; parts.push({ mime: isVid(x.name) ? "video/mp4" : x.name.endsWith(".png") ? "image/png" : x.name.endsWith(".webp") ? "image/webp" : "image/jpeg", data: b64s(u8) }); order.push(pub(x.name)); } catch (_) { /* skip */ } }
        const res: any = parts.length ? await aiJSON(ai, parts, GPROMPT(parts.length)).catch(() => null) : null;
        if (res?.groups?.length) {
          const seen = new Set<number>(); const ordered: string[] = []; const vmap: Record<number, string> = {};
          for (const g of res.groups.slice(0, 40)) {
            const items = (g.items || []).map(Number).filter((n: number) => n >= 1 && n <= order.length && !seen.has(n)); if (!items.length) continue; items.forEach((n: number) => seen.add(n));
            const ph = items.map((n: number) => order[n - 1]).filter((u: string) => !/\.mp4$/i.test(u)); const vv = items.map((n: number) => order[n - 1]).filter((u: string) => /\.mp4$/i.test(u));
            if (!ph.length) continue; const start = ordered.length + 1; ordered.push(...ph); const grp = ph.map((_: any, k: number) => start + k); groups.push(grp);
            const cap = await capFrom(g); if (vv.length) cap.video = vv[0]; caps[start] = cap; if (cap.brand && !brands.includes(cap.brand)) brands.push(cap.brand);
          }
          order.forEach((u, i) => { if (!seen.has(i + 1) && !/\.mp4$/i.test(u)) { ordered.push(u); groups.push([ordered.length]); } });
          photos.splice(0, photos.length, ...ordered);
        }
      }
      if (!photos.length) return T("No photos received.", 400);
      const title = note.trim() || (brands.length ? brands.slice(0, 2).join(" & ") + " Finds" : "New Arrivals");
      const leads = groups.length ? groups.map((g) => g[0]) : photos.map((_: any, i: number) => i + 1);
      const lines = leads.map((n, i) => { const v = caps[n] || {}; return String(i + 1).padStart(2, "0") + " · " + ([v.brand, v.title].filter(Boolean).join(" ") || "Piece") + (v.size ? " · " + v.size : "") + " · " + (v.price != null ? "₹" + Number(v.price).toLocaleString("en-IN") : "Price upon request"); });
      const msg = "✦ " + title + "\n\n" + lines.join("\n") + "\n\nReply with the number to reserve. Prices as of today.";
      const data: any = { title, msg, photos, caps, draft, source: "shortcut" }; if (groups.length && groups.some((g) => g.length > 1)) data.groups = groups; if (!ai?.key && vids.length) data.videos = vids;
      const ins = await db.from("lx_deals").insert({ kind: "post", day, data }).select("id").single();
      if (ins.error) return T("Could not create the drop: " + ins.error.message, 500);
      made.push(media.length + " files → " + leads.length + " pieces" + (ai?.key ? ` (AI grouped, brand-site checked, +${mk}%)` : " (connect AI to auto-group)"));
    }
    for (const p of pdfs) {
      const data: any = { title: note.trim() || "New Arrivals", url: pub(p.name), msg: "", draft, source: "shortcut" };
      if (ai?.key) { try { const r = await fetch(pub(p.name)); const u8 = new Uint8Array(await r.arrayBuffer()); if (u8.length < 18e6) { const res: any = await aiJSON(ai, [{ mime: "application/pdf", data: b64s(u8) }], GPROMPT(0).replace(/You get 0 media items numbered 1\.\.0 in order \(photos, screenshots, short videos\)/, "You get a PDF catalogue; item numbers are PDF PAGE numbers") ); if (res?.groups?.length) { const caps: any = {}, groups: number[][] = [], brands: string[] = []; for (const g of res.groups.slice(0, 80)) { const items = (g.items || []).map(Number).filter((n: number) => n >= 1); if (!items.length) continue; groups.push(items); caps[items[0]] = await capFrom(g); if (g.brand && !brands.includes(g.brand)) brands.push(g.brand); } data.caps = caps; if (groups.some((g) => g.length > 1)) data.groups = groups; if (!note.trim() && brands.length) data.title = brands.slice(0, 2).join(" & ") + " Finds"; } } } catch (_) { /* keep plain pdf */ } }
      const ins = await db.from("lx_deals").insert({ kind: "pdf", day, data }); if (!ins.error) made.push("1 PDF" + (data.caps ? " (AI read " + Object.keys(data.caps).length + " pieces)" : ""));
    }
    return T(`Luxella · drop ${draft ? "saved as draft — review & publish in The Edit" : "is live"}: ${made.join(" + ")}.`);
  } catch (e) { return T("Error: " + String((e as Error).message || e), 500); }
});
