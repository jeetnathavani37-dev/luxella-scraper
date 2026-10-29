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
const STOP = new Set(["and", "the", "for", "with", "small", "signature", "logo", "set", "in", "of", "new", "one"]);
function find(q: string, rows: any[]) {
  q = q.toLowerCase().replace(/bracelet/g, "wristlet").replace(/purse/g, "bag").replace(/ghadi|ghari/g, "watch").replace(/chappal|slipper/g, "sandal");
  let best: any = null, score = 0;
  for (const r of rows) { const words = (r.item + " " + (r.brand || "") + " " + (r.order_no || "")).toLowerCase().split(/[^a-z0-9#]+/).filter((w: string) => w.length > 2 && !STOP.has(w)); let s = 0; for (const w of words) if (new RegExp("\\b" + w.replace(/[^a-z0-9#]/g, "") + "s?\\b").test(q)) s += w.length; if (s > score) { score = s; best = r; } }
  return score >= 4 ? best : null;
}
const stage = (r: any) => Number(r.stage || 1);
function line(r: any) {
  const st = stage(r); let t = short(r.item) + ": " + (STAGES[st - 1] || r.status || "in progress");
  if (st >= 9) return t + ".";
  if (r.eta_date) t += String(r.eta_date).slice(0, 10) < new Date().toISOString().slice(0, 10) ? ", running a little late; Luxella will update you" : ", expected around " + fd(r.eta_date);
  return t + ".";
}

async function getAI() { const { data } = await db.from("lx_km_vault").select("data").eq("id", "ai").maybeSingle(); const a = data?.data || null; return a && a.key ? a : (Deno.env.get("GEMINI_API_KEY") ? { provider: "gemini", key: Deno.env.get("GEMINI_API_KEY") } : null); }
function facts(rows: any[], hasPop: Set<string>) {
  return rows.map((r: any) => ({ item: r.item, brand: r.brand || "", order_no: r.order_no || "", stage: STAGES[stage(r) - 1] || r.status || "", eta: r.eta_date || "", eta_passed: !!(r.eta_date && String(r.eta_date).slice(0, 10) < new Date().toISOString().slice(0, 10) && stage(r) < 9), ordered: r.order_date || "", india_tracking: r.local_tracking || "", courier: r.local_courier || "", amount_inr: Number(r.payout || 0), payment: r.payout_status === "Pending" ? "due" : "paid", proof_of_purchase: hasPop.has(pslug(r.item)) }));
}
async function aiAnswer(ai: any, first: string, rows: any[], hasPop: Set<string>, q: string, audio: string, mime: string, hist: any[]) {
  const sys = `You are Aanya, the personal concierge at Luxella (a luxury personal-shopping service: Luxella buys from official US/UK stores and delivers to India, all-inclusive). You are on a live voice call with your client ${first}. Sound like a real, warm, sharp human concierge — never robotic, never like a script.
How you talk:
- Mirror the client's language: English → polished English; Hindi/Hinglish → natural spoken Hinglish in Roman script ("Ji Himanshu, aapka Coach tote warehouse se nikal chuka hai, bas raste mein hai").
- Keep it short and conversational: usually one or two sentences, like a phone call. Vary your phrasing; use small natural touches ("Sure", "Ji", "Good news —", "Just checked —"). Use the client's name only now and then.
- No lists, emojis or markdown. Say money as "14,000 rupees". Shorten product names naturally ("your Coach tote", "the MK wallet set").
- Be genuinely helpful: answer the exact question, then add one useful detail if it helps (tracking number, that it is paid, that proof of purchase is available). Understand follow-ups ("aur uska?", "and the other one?") from the conversation.
- Facts come ONLY from ORDERS below. Never invent dates, delivery windows, prices or tracking. No ETA → say you will share it as soon as it is confirmed. ETA passed and not delivered → it is running a little late and you are on it.
- Service facts you can use: prices are all-inclusive (shipping, customs, delivery); stores confirm within about a week; if a store cancels, Luxella re-sources or refunds in full; the courier may ask for an OTP at delivery.
- Proof of purchase / bill / invoice requested and available → set act="proof" and item to that exact order item, and say you are opening it.
- Anything you cannot answer from the data (new purchases, discounts, complaints, changes) → say warmly you will get the team to reply on chat, and set act="wa".
- Greetings / thanks / small talk → respond naturally and briefly, then offer help.
Output JSON only: {"heard": "<exactly what the client said, cleaned, Roman script>", "reply": "<what you say out loud>", "item": "<exact order item this is about, or empty>", "items": [<exact item names of every order your reply is about, max 4; for 'where are my orders' the open ones>], "act": "<proof|wa|empty>"}
Today is ${new Date().toISOString().slice(0, 10)}.
ORDERS: ${JSON.stringify(facts(rows, hasPop))}`;
  const parts: any[] = [];
  if (audio) parts.push({ inline_data: { mime_type: (mime || "audio/webm").split(";")[0], data: audio } }, { text: "The client's voice message is attached. First transcribe it accurately (English, Hindi or Hinglish; brand names like Coach, Michael Kors, Tissot, Marc Jacobs are common). Put the transcript in heard (Roman script), then answer it." });
  else parts.push({ text: q });
  const contents = [...(hist || []).slice(-6).map((h: any) => ({ role: h.role === "a" ? "model" : "user", parts: [{ text: String(h.text || "").slice(0, 500) }] })), { role: "user", parts }];
  const ms = [ai.model && /gemini/.test(ai.model) ? ai.model : "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-flash-lite-latest"].filter((x, i, a) => a.indexOf(x) === i);
  let err = "";
  for (const m of ms) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${ai.key}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ systemInstruction: { parts: [{ text: sys }] }, contents, generationConfig: { responseMimeType: "application/json", temperature: 0.7, maxOutputTokens: 600, thinkingConfig: { thinkingBudget: 0 } } }), signal: AbortSignal.timeout(12000) });
      const j = await r.json(); const txt = j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "";
      if (txt) return JSON.parse(txt.replace(/^```(json)?|```$/g, "").trim());
      err = m + ": " + JSON.stringify(j).slice(0, 200);
    } catch (e) { err = m + ": " + String(e); }
  }
  throw new Error("ai: " + err);
}

async function tts(ai: any, text: string) {
  let d: any = null, err = "";
  for (const m of [ai.tts || "gemini-3.8-flash-tts", "gemini-3.8-flash-lite-tts", "gemini-3.1-flash-tts-preview"].filter((x, i, a) => a.indexOf(x) === i)) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${ai.key}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: text }] }], generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: ai.voice && ai.voice !== "Kore" ? ai.voice : "Sulafat" } } } } }), signal: AbortSignal.timeout(15000) });
      const j = await r.json(); d = j?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData; if (d) break; err = JSON.stringify(j).slice(0, 200);
    } catch (e) { err = String(e); }
  }
  if (!d) throw new Error("tts: " + err);
  let b64 = d.data, mime = d.mimeType || "audio/wav";
  if (/pcm|L16/i.test(mime)) { const pcm = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)); const rate = Number((mime.match(/rate=(\d+)/) || [])[1] || 24000); const h = new ArrayBuffer(44); const v = new DataView(h); const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); }; w(0, "RIFF"); v.setUint32(4, 36 + pcm.length, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, pcm.length, true); const all = new Uint8Array(44 + pcm.length); all.set(new Uint8Array(h), 0); all.set(pcm, 44); let s = ""; for (let i = 0; i < all.length; i += 32768) s += String.fromCharCode(...all.subarray(i, i + 32768)); b64 = btoa(s); mime = "audio/wav"; }
  return { audio: b64, mime };
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const u = new URL(req.url); let t = u.searchParams.get("t") || "", q = u.searchParams.get("q") || "", fmt = u.searchParams.get("fmt") || "", last = u.searchParams.get("last") || ""; let audio = "", mime = "", hist: any[] = [], say = "", speak = false; const cap = u.searchParams.get("cap");
  if (req.method === "POST") { try { const b = await req.json(); t = b.t || t; q = b.q || q; fmt = b.fmt || fmt; last = b.last || last; audio = b.audio || ""; mime = b.mime || ""; hist = Array.isArray(b.hist) ? b.hist : []; say = String(b.say || ""); speak = !!b.speak; } catch (_) { /* ignore */ } }
  let cur = ""; const out = (text: string, url = "", act = "") => fmt === "json" ? new Response(JSON.stringify({ text, url, item: cur, act, cards: cur ? cardsFor([cur]) : [] }), { headers: { ...CORS, "Content-Type": "application/json" } }) : new Response(text, { headers: { ...CORS, "Content-Type": "text/plain; charset=utf-8" } });
  if (!/^[a-f0-9]{24,64}$/.test(t)) return out("This Luxella voice link is not set up. Open your Luxella page and tap the gold mic to set it up again.");
  const { data: tok } = await db.from("lx_docs").select("client_id").eq("collection", "meta").eq("doc_id", "voice_token").eq("data->>token", t).maybeSingle();
  if (!tok) return out("This Luxella voice link has expired. Open your Luxella page and tap the gold mic to get a new one.");
  const cid = tok.client_id;
  const [{ data: cl }, { data: o }, { data: pops }] = await Promise.all([
    db.from("lx_clients").select("slug,name").eq("id", cid).maybeSingle(),
    db.from("lx_orders").select("item,data").eq("client_id", cid),
    db.from("lx_docs").select("doc_id").eq("client_id", cid).eq("collection", "pop"),
  ]);
  const { data: phs } = await db.from("lx_docs").select("doc_id,data").eq("client_id", cid).eq("collection", "photos");
  const PH: Record<string, string> = {}; for (const p of phs || []) { const u = (p as any).data?.url; if (u && !String(u).startsWith("lxp:")) PH[(p as any).doc_id] = u; }
  const page = PORTAL + (cl?.slug || "");
  const rows = (o || []).map((x: any) => ({ item: x.item, ...x.data })).filter((r: any) => !/cancel/i.test(String(r.status || "")));
  const hasPop = new Set((pops || []).map((p: any) => p.doc_id));
  const first = String(cl?.name || "").split(" ")[0] || "there";
  const today = new Date().toISOString().slice(0, 10);
  const card = (r: any) => r ? { item: r.item, brand: r.brand || "", order_no: r.order_no || "", n: stage(r), stage: STAGES[stage(r) - 1] || r.status || "", eta: r.eta_date ? fd(r.eta_date) : "", late: !!(r.eta_date && String(r.eta_date).slice(0, 10) < today && stage(r) < 9), ordered: r.order_date ? fd(r.order_date) : "", tracking: r.local_tracking || "", courier: r.local_courier || "", track_url: r.track_url || "", amount: Number(r.payout || 0), paid: r.payout_status !== "Pending", img: r.photo_url || PH[pslug(r.item)] || "", proof: hasPop.has(pslug(r.item)) } : null;
  const cardsFor = (items: string[]) => items.map((it) => card(rows.find((x: any) => x.item === it))).filter(Boolean).slice(0, 4);
  if (say) { const ai = await getAI(); if (!ai) return new Response(JSON.stringify({}), { headers: { ...CORS, "Content-Type": "application/json" } }); try { return new Response(JSON.stringify(await tts(ai, say.slice(0, 600))), { headers: { ...CORS, "Content-Type": "application/json" } }); } catch (e) { console.error(String(e)); return new Response(JSON.stringify({}), { headers: { ...CORS, "Content-Type": "application/json" } }); } }
  if (cap) { const ai = await getAI(); return new Response(JSON.stringify({ ai: !!ai, tts: !!ai, name: first }), { headers: { ...CORS, "Content-Type": "application/json" } }); }
  if (audio || q.trim()) { const ai = await getAI(); if (ai) { try { const a = await aiAnswer(ai, first, rows, hasPop, q, audio, mime, hist); const it = rows.find((x: any) => x.item === a.item); const url = a.act === "proof" && it ? page + "?ask=" + encodeURIComponent("show proof of purchase for " + it.item) : ""; if (fmt !== "json") return new Response(String(a.reply || ""), { headers: { ...CORS, "Content-Type": "text/plain; charset=utf-8" } }); const its = (Array.isArray(a.items) ? a.items : []).concat(it ? [it.item] : []).filter((x: any, i: number, arr: any[]) => x && arr.indexOf(x) === i); let au: any = null; if (speak && a.reply) { try { au = await tts(ai, String(a.reply).slice(0, 600)); } catch (e) { console.error(String(e)); } } return new Response(JSON.stringify({ text: a.reply || "", heard: a.heard || q, url, item: it ? it.item : "", act: a.act || "", ai: true, cards: cardsFor(its), audio: au?.audio || "", amime: au?.mime || "" }), { headers: { ...CORS, "Content-Type": "application/json" } }); } catch (e) { console.error(String(e)); if (audio) return new Response(JSON.stringify({ text: "Sorry, I could not catch that. Please try again.", heard: "", act: "retry" }), { headers: { ...CORS, "Content-Type": "application/json" } }); } } else if (audio) return new Response(JSON.stringify({ text: "", act: "noai" }), { headers: { ...CORS, "Content-Type": "application/json" } }); }
  const ql = " " + q.toLowerCase().replace(/[?!.,]/g, " ").replace(/\s+/g, " ").trim() + " ";
  let r = ql.trim() ? find(ql, rows) : null;
  if (!r && last && /\b(it|its|that|this|uska|uski|iska|iski|woh|wo|vo|ye|yeh|usme|same|aur|and|what about|kab|when|track|proof|kitna)\b/.test(ql)) r = rows.find((x: any) => x.item === last) || null;
  if (r) cur = r.item;
  if (/^\s*(hi|hello|hey|hii|namaste|good (morning|evening|afternoon))\s*(luxella)?\s*$/.test(ql)) return out("Hi " + first + "! Ask me where an order is, when it will arrive, what is due, or for a proof of purchase.");
  if (/\b(thank|thanks|thx|dhanyavad|shukriya|ok|okay|great|cool)\b/.test(ql) && ql.trim().split(" ").length <= 4) return out("Anytime, " + first + ". Luxella is here whenever you need.");
  const open = rows.filter((x: any) => stage(x) < 9);
  // proof of purchase
  if (/proof|receipt|invoice|\bbill\b|purchase|parchi|rasid|raseed|bill dikhao/.test(ql)) {
    if (r) return hasPop.has(pslug(r.item)) ? out("Here is the proof of purchase for your " + short(r.item) + ".", page + "?ask=" + encodeURIComponent("show proof of purchase for " + r.item), "proof") : out("The proof of purchase for your " + short(r.item) + " is not uploaded yet. Luxella adds it once the store confirms.");
    const w = rows.filter((x: any) => hasPop.has(pslug(x.item)));
    if (!w.length) return out("No proof of purchase has been uploaded yet.");
    if (w.length === 1) return (cur = w[0].item, out("Here is the proof of purchase for your " + short(w[0].item) + ".", page + "?ask=" + encodeURIComponent("show proof of purchase for " + w[0].item), "proof"));
    return out("Proof of purchase is ready for " + w.length + " orders: " + w.map((x: any) => short(x.item)).join(", ") + ". They are on your Luxella page, under each order.", page + "?ask=" + encodeURIComponent("show my proof of purchase"));
  }
  // money
  if (/\b(pay|paid|payment|due|owe|pending|balance|baki|baaki|bakaya|paisa|paise|amount|kitna dena|dena hai|outstanding)\b/.test(ql)) {
    const due = rows.filter((x: any) => x.payout_status === "Pending");
    if (!due.length) return out("Nothing is due, " + first + ". All your orders are paid.");
    const tot = due.reduce((s: number, x: any) => s + Number(x.payout || 0), 0);
    return out(inr(tot) + " is due on " + due.length + " order" + (due.length > 1 ? "s" : "") + ": " + due.map((x: any) => short(x.item) + " " + inr(Number(x.payout || 0))).join(", ") + ".");
  }
  // tracking
  if (/track|tracking|courier|awb|consignment/.test(ql)) {
    const list = (r ? [r] : open).filter((x: any) => x.local_tracking);
    if (!list.length) return out(r ? "No India tracking number yet for your " + short(r.item) + ". " + line(r) : "No India tracking numbers yet. They come once an order leaves the Indian warehouse.");
    return out(list.map((x: any) => short(x.item) + ": " + (x.local_courier ? x.local_courier + " " : "") + x.local_tracking).join(". ") + ".");
  }
  // address
  if (/address|\bpata\b|\bpatta\b/.test(ql)) {
    const need = rows.filter((x: any) => stage(x) === 7);
    return out(need.length ? "Yes, Luxella needs your delivery address for " + need.map((x: any) => short(x.item)).join(", ") + ". Add it in the Address tab on your Luxella page." : "No address needed right now.", need.length ? page + "#ad" : "");
  }
  // one order
  if (r) return out(line(r) + (r.local_tracking && stage(r) < 9 ? " Tracking " + r.local_tracking + "." : ""));
  // next arrival
  if (/next|\bkab\b|when|arriv|eta|soon|aayega|ayega|aaega|milega|deliver/.test(ql)) {
    const nx = open.filter((x: any) => x.eta_date).sort((a: any, b: any) => String(a.eta_date).localeCompare(String(b.eta_date)))[0];
    if (nx) return out("Next to arrive is your " + short(nx.item) + (String(nx.eta_date).slice(0, 10) < new Date().toISOString().slice(0, 10) ? ". It is running a little late; Luxella will update you." : ", around " + fd(nx.eta_date) + "."));
  }
  // unknown topic
  if (ql.trim() && !/\b(order|orders|status|where|kahan|kaha|kidhar|update|parcel|package|saman|samaan|sab|all|mere|my)\b/.test(ql)) return out("I can help with your orders, delivery dates, payments, tracking and proof of purchase. For anything else, message Luxella on WhatsApp and you will get a reply.", "", "wa");
  // summary
  if (!open.length) return out("All your orders are delivered, " + first + ". Nothing is on the way right now.");
  const head = "You have " + open.length + " order" + (open.length > 1 ? "s" : "") + " on the way. ";
  return out(head + open.slice(0, 5).map(line).join(" ") + (open.length > 5 ? " And " + (open.length - 5) + " more on your Luxella page." : ""));
});
