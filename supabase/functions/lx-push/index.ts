import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
import nodemailer from "npm:nodemailer@6.9.14";
import { Buffer } from "node:buffer";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const OWNERS = ["jeetnathavani37@gmail.com", "jeetnatb@gmail.com"];
const SITE = "https://luxellaclients.duckdns.org/";
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-lx-hook", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const STAGES = ["Order placed", "Order confirmed", "Shipped by retailer/outlet", "Received at international hub", "Shipped from international hub", "Received at Indian warehouse", "Address requested", "Shipped from Indian warehouse", "Delivered"];
const LST = ["Order placed", "Order confirmed", "Item secured from store", "", "", "", "Address requested", "Dispatched to you", "Delivered"];
const isL = (d: any) => String((d && d.order_type) || "").includes("Local");
const stN = (d: any, s: number) => (isL(d) && LST[s - 1]) || STAGES[s - 1] || "";
const ksOf = (d: any) => (isL(d) ? [1, 2, 3, 7, 8, 9] : [1, 2, 3, 4, 5, 6, 7, 8, 9]);
const stepTxt = (d: any, s: number) => { const ks = ksOf(d); const i = ks.indexOf(s); return "step " + (i >= 0 ? i + 1 : ks.filter((x) => x <= s).length) + " of " + ks.length; };
const slugify = (s: unknown) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
const CLIENT_MSG: Record<number, string> = { 2: "Your piece has been confirmed and bought in your name.", 3: "The outlet has shipped it to our hub.", 4: "It has arrived at our international hub and is being checked.", 5: "It has left for India.", 6: "Landed in India — clearing and being prepared for dispatch.", 7: "We need your delivery address. Open the Address tab.", 8: "Local pickup initiated — the courier is collecting it from our warehouse. Please record your unboxing.", 9: "Delivered. Thank you for choosing Luxella." };
const LCLIENT_MSG: Record<number, string> = { 2: "Your order is confirmed.", 3: "Secured from the store and now with Luxella.", 7: "We need your delivery address. Open the Address tab.", 8: "Dispatched to you. Please record your unboxing.", 9: "Delivered. Thank you for choosing Luxella." };
const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });

// --- vault sealing (24 Oct 2026): secrets in lx_km_vault are AES-GCM encrypted with a key derived from the service-role key.
// That key exists only in edge-function env; SQL sessions (agents) cannot read it, so they see only ciphertext. ---
const VK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
let _VKC: CryptoKey | null = null;
const _b64 = (a: Uint8Array) => btoa(String.fromCharCode(...a));
const _ub64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function _vkey() { if (_VKC) return _VKC; const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("lx-vault-v1:" + VK)); _VKC = await crypto.subtle.importKey("raw", h, "AES-GCM", false, ["encrypt", "decrypt"]); return _VKC; }
async function seal(o: any) { if (!VK) return o; const iv = crypto.getRandomValues(new Uint8Array(12)); const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await _vkey(), new TextEncoder().encode(JSON.stringify(o)))); return { enc: "v1", iv: _b64(iv), ct: _b64(ct) }; }
async function unseal(d: any) { if (!d || !d.enc) return d; const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: _ub64(d.iv) }, await _vkey(), _ub64(d.ct)); return JSON.parse(new TextDecoder().decode(pt)); }
// SMTP login: a non-empty smtp_pass in lx_secrets is sealed into lx_km_vault/smtp (so it can then be blanked); otherwise the sealed copy is used.
async function smtpFill(db: any, m: Record<string, string>) {
  try {
    if (m.smtp_user && m.smtp_pass) { await db.from("lx_km_vault").upsert({ id: "smtp", data: await seal({ user: m.smtp_user, pass: m.smtp_pass }), updated_at: new Date().toISOString() }); return; }
    const { data: v } = await db.from("lx_km_vault").select("data").eq("id", "smtp").maybeSingle();
    if (v?.data?.enc) { const s = await unseal(v.data); if (s?.user) m.smtp_user = s.user; if (s?.pass) m.smtp_pass = s.pass; }
  } catch (e) { console.error("smtp vault", String((e as any)?.message || e)); }
}
async function secrets() { const { data } = await admin.from("lx_secrets").select("k,v"); const m: Record<string, string> = {}; (data || []).forEach((r: any) => (m[r.k] = r.v)); await smtpFill(admin, m); return m; }

const EM: Record<number, { h: string; t: string; n: string; cta?: [string, string] }> = {
  1: { h: "Order received", t: "We have your request for {item}. Luxella is now placing it with the store on your behalf.", n: "Nothing is needed from you. Stores usually confirm within about a week, and we will email you the moment it is accepted. If a store cancels in that window, we re-source the piece or refund you in full." },
  2: { h: "Order confirmed", t: "Good news. The store has accepted your order for {item}. It is now locked in and bought in your name.", n: "Nothing is needed from you. Next, the store ships it to our hub abroad, and we will tell you as soon as it is on its way." },
  3: { h: "Shipped by the store", t: "The store has handed {item} to a courier. It is on its way to our hub abroad.", n: "You can follow it with the tracking number below. We will inspect it the moment it reaches our hub." },
  4: { h: "Reached our international hub", t: "{item} has arrived at our hub abroad and is being checked by our team.", n: "Our delivery estimate to India starts from today. We will confirm once it leaves for India." },
  5: { h: "On its way to India", t: "{item} has been packed and is now flying to India.", n: "This is the longest leg, so there is nothing to do but wait. We will email you when it lands." },
  6: { h: "Landed in India", t: "{item} has landed in India and is clearing customs. After that, it is prepared for dispatch to you.", n: "Please keep your delivery address ready. We will ask for it in the next update.", cta: ["Open your page", "tr"] },
  7: { h: "We need your delivery address", t: "{item} is ready to be dispatched to you. We just need to know where to send it.", n: "Tap the button below — it opens this order's address card on your page. Add or pick an address, check the pin code and phone number, and save. We ship within 24 hours of receiving it.", cta: ["Share your address", "ad"] },
  8: { h: "Local pickup initiated", t: "{item} is packed at our Indian warehouse and the courier pickup has been booked.", n: "The courier will collect it shortly. Follow it with the tracking number below once the courier scans it. Please keep your phone reachable, and record a continuous unboxing video before you open the parcel. It protects you if anything is wrong." },
  9: { h: "Delivered", t: "{item} has been delivered. Thank you for choosing Luxella.", n: "We would love to know how it went. Tap the button below and rate your order. It takes a few seconds and helps us a lot. If anything is not right, open the Help tab on your page and share your unboxing video, and we will take care of it.", cta: ["Rate your order", "tr"] },
};
const LEM: Record<number, { h: string; t: string; n: string; cta?: [string, string] }> = {
  1: { h: "Order received", t: "We have your order for {item}. Luxella is now securing it from the store in India.", n: "Nothing is needed from you. We will confirm within 24–48 hours, by email and in your Orders tab." },
  2: { h: "Order confirmed", t: "Your order for {item} is confirmed.", n: "Nothing is needed from you. Next, we secure the piece from the store and prepare it for dispatch." },
  3: { h: "Item secured", t: "{item} has been secured from the store and is now with Luxella.", n: "Please keep your delivery address ready. If we do not have it yet, we will ask for it next." },
  8: { h: "Dispatched to you", t: "{item} has been dispatched and is on its way to you.", n: "Please keep your phone reachable for the courier, and record a continuous unboxing video before you open the parcel. It protects you if anything is wrong." },
};
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
const fmtDate = (s: string) => { try { return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }); } catch { return s; } };

type Em = { subject: string; headline: string; text: string; next?: string; rows?: [string, string][]; stage?: number; cta?: [string, string]; ks?: number[]; stLabel?: string };
type Msg = { audience: "client" | "owner"; title: string; body: string; url: string; cat: string; em?: Em; noEmail?: boolean; alsoOwner?: { title: string; body: string; url: string } };

function orderEmail(d: any, item: string, stage: number): Em {
  const L = isL(d);
  const e = (L && LEM[stage]) || EM[stage] || EM[1];
  const useLocal = stage >= 8 || L;
  const no = useLocal ? (d.local_tracking || (L ? "" : d.intl_tracking_no)) : d.intl_tracking_no;
  const cr = useLocal ? d.local_courier : d.intl_courier;
  const rows: [string, string][] = [["Item", item]];
  if (d.brand) rows.push(["Brand", d.brand]);
  if (d.order_no) rows.push(["Order number", d.order_no]);
  if (L) rows.push(["Order type", "Local (India)"]);
  rows.push(["Status", stN(d, stage) + " (" + stepTxt(d, stage) + ")"]);
  if (stage < 9 && d.eta_date) rows.push(["Expected by", fmtDate(d.eta_date)]);
  if (no && stage >= 3 && stage <= 8) rows.push([(cr ? cr + " tracking" : "Tracking number"), String(no)]);
  const ks = ksOf(d); const stLabel = stN(d, stage);
  if (stage === 1 && d.placed_by === "client") {
    if (d.payout) rows.push(["Price", "₹" + Number(d.payout).toLocaleString("en-IN")]);
    rows.push(["Confirmation", "Within 24–48 hours"]);
    return { subject: "Order received: " + item, headline: "Order received", text: "Thank you. We have received your order for " + item + ". Luxella will now verify your payment and check availability.", next: "You will receive a confirmation within 24–48 hours, by email and in your Orders tab. Nothing else is needed from you. If we cannot source the piece, we will tell you straight away and refund you in full.", rows, stage, cta: ["Track your order", "tr"], ks, stLabel };
  }
  // stage 7: deep link straight to THIS order's address card (#ad:<order-slug>)
  const rateNo = String(d.order_no || "").replace(/^#/, "");
  const cta: [string, string] = stage === 7 ? ["Share your address", "ad:" + slugify(item)] : (stage === 9 && /^\d{1,8}$/.test(rateNo)) ? ["Rate your order", "rate:" + rateNo] : (e.cta || ["Track your order", "tr"]);
  return { subject: e.h + ": " + item, headline: e.h, text: e.t.replace("{item}", item), next: e.n, rows, stage, cta, ks, stLabel };
}

function stageBody(d: any, s: number) { const m = isL(d) ? LCLIENT_MSG[s] : CLIENT_MSG[s]; return stN(d, s) + (m ? " — " + m : ""); }

function compose(p: any): Msg | null {
  const n = p.new || {}; const o = p.old || {};
  if (p.table === "lx_orders") {
    const d = n.data || {}; const od = o.data || {};
    const item = d.item || n.item || "Your order";
    if (p.op === "INSERT") { const st = Number(d.stage) || 1; return { audience: "client", cat: "orders", title: "New order on your Luxella page", body: item + (d.order_no ? " · " + d.order_no : ""), url: "tr", em: orderEmail(d, item, st) }; }
    const s = Number(d.stage) || 1, os = Number(od.stage) || 1;
    // owner moved the stage from the portal and will choose how to tell the client (email / popup / WhatsApp) -> no automatic send. The hold expires after 2 minutes.
    if (s !== os && d.notify_hold && Date.now() - Date.parse(String(d.notify_hold)) < 120000) return null;
    if (s !== os) return { audience: "client", cat: "orders", title: item, body: stageBody(d, s), url: s === 7 ? "ad:" + slugify(item) : "tr", em: s > os ? orderEmail(d, item, s) : undefined, noEmail: !(s > os) };
    if (d.payout_status === "Received" && od.payout_status !== "Received") return { audience: "client", cat: "payments", title: "Payment received", body: item + " — thank you.", url: "pay", em: { subject: "Payment received: " + item, headline: "Payment received", text: "We have received your payment for {item}. Thank you.".replace("{item}", item), next: "Nothing more is needed for this order. You can see the receipt and your running balance in the Payments tab.", rows: [["Item", item], ...(d.order_no ? [["Order number", d.order_no] as [string, string]] : []), ...(d.payout ? [["Amount", "₹" + Number(d.payout).toLocaleString("en-IN")] as [string, string]] : [])], cta: ["View payments", "pay"] } };
    if ((d.intl_tracking_no && !od.intl_tracking_no) || (d.local_tracking && !od.local_tracking)) { const st = Number(d.stage) || 1; const isLocal = d.local_tracking && !od.local_tracking; const no = isLocal ? d.local_tracking : d.intl_tracking_no; const cr = isLocal ? d.local_courier : d.intl_courier; return { audience: "client", cat: "orders", title: "Tracking number added", body: item + " — tap to track.", url: "tr", em: { subject: "Tracking added: " + item, headline: "Tracking number added", text: "We have added a tracking number for {item}, so you can follow it with the courier.".replace("{item}", item), next: "Tap Track your order to open the live tracking link, or copy the number below.", rows: [["Item", item], ...(d.order_no ? [["Order number", d.order_no] as [string, string]] : []), [(cr ? cr + " tracking" : "Tracking number"), String(no)], ["Status", stN(d, st) + " (" + stepTxt(d, st) + ")"]], cta: ["Track your order", "tr"] } }; }
    if (d.eta_date && d.eta_date !== od.eta_date) return { audience: "client", cat: "orders", title: "Delivery window updated", body: item + " — expected by " + d.eta_date, url: "tr", em: { subject: "New delivery date: " + item, headline: "Delivery window updated", text: "The expected delivery date for {item} has been updated.".replace("{item}", item), next: "We will keep you posted if anything changes again.", rows: [["Item", item], ["Expected by", fmtDate(d.eta_date)]], cta: ["Track your order", "tr"] } };
    return null;
  }
  if (p.table === "lx_docs") {
    const c = n.collection; const d = n.data || {}; const od = o.data || {};
    if (c === "notes") { const s = Number(d.stageOverride), os = Number(od.stageOverride); if (s && s !== os) return { audience: "client", cat: "orders", title: d.item || n.doc_id || "Order update", body: STAGES[s - 1] + (CLIENT_MSG[s] ? " — " + CLIENT_MSG[s] : ""), url: s === 7 ? "ad" : "tr", noEmail: true }; return null; }
    if (c === "notices" && p.op === "INSERT") return { audience: "client", cat: "orders", title: String(d.title || "Update from Luxella").slice(0, 80), body: String(d.body || "").slice(0, 160), url: d.url || "tr", noEmail: true };
    if (c === "received" && p.op === "INSERT") return { audience: "owner", cat: "owner", title: "Received successfully", body: (d.order_no ? d.order_no + " \u00b7 " : "") + (d.order || "Order") + " \u2014 client confirmed delivery", url: "al" };
    if (c === "photos" && p.op === "INSERT") return { audience: "client", cat: "photos", title: "Photo added", body: (d.order || "Your order") + " — see it on the Orders tab.", url: "al" };
    if (c === "pod" && p.op === "INSERT") return { audience: "client", cat: "photos", title: "Proof of delivery added", body: d.order || "Your order", url: "al", em: { subject: "Proof of delivery added", headline: "Proof of delivery added", text: "We have added the proof of delivery for " + (d.order || "your order") + " to your page.", next: "Open the Orders tab to see it.", cta: ["Open Orders", "al"] } };
    if (c === "qc" && p.op === "INSERT") return { audience: "client", cat: "photos", title: "Quality check photos added", body: d.order || "Your order", url: "al", em: { subject: "Quality check photos added", headline: "Quality check photos added", text: "Our team has inspected " + (d.order || "your order") + " and added the quality check photos to your page.", next: "Open the Orders tab to see them.", cta: ["Open Orders", "al"] } };
    if (c === "payrec" && p.op === "INSERT") return { audience: "client", cat: "payments", title: "Payment recorded", body: (d.order || "") + (d.amount ? " · ₹" + d.amount : ""), url: "pay", em: { subject: "Payment recorded" + (d.order ? ": " + d.order : ""), headline: "Payment recorded", text: "We have recorded your payment" + (d.order ? " for " + d.order : "") + (d.amount ? " of ₹" + d.amount : "") + ". Thank you.", next: "You can see it in the Payments tab, under your statement of account.", cta: ["View payments", "pay"] } };
    if (c === "meta" && n.doc_id === "pinned" && d.text && d.text !== od.text) return { audience: "client", cat: "notes", title: "Note from Luxella", body: String(d.text).slice(0, 140), url: "ov", em: { subject: "A note from Luxella", headline: "A note from Luxella", text: String(d.text).slice(0, 800), cta: ["Open your page", "ov"] } };
    if (c === "addresses" && (p.op === "INSERT" || (p.op === "UPDATE" && (d.address !== od.address || d.phone !== od.phone)))) {
      const order = String(d.order || "your order");
      const rows: [string, string][] = [["Item", order]];
      if (d.address) rows.push(["Deliver to", String(d.address)]);
      if (d.phone) rows.push(["Phone", String(d.phone)]);
      if (d.pref) rows.push(["Preferences", String(d.pref)]);
      rows.push(["Dispatch", "Within 24 hours"]);
      return {
        audience: "client", cat: "orders", title: "Address received", body: order + " — ships within 24 hours.", url: "tr",
        em: { subject: "Address received: " + order + " ships within 24 hours", headline: "Address received", text: "Thank you. We have your delivery address for " + order + ". Your order will be shipped within 24 hours.", next: "We will email you the tracking number as soon as it is dispatched, and it will appear on your Tracker. Nothing else is needed from you. If the address needs a change, update it on your page before dispatch.", rows, cta: ["Track your order", "tr"] },
        alsoOwner: { title: "Address received", body: order + " — " + String(d.address || "").slice(0, 100) + (d.phone ? " · " + d.phone : ""), url: "ad" },
      };
    }
    if (c === "payments" && p.op === "INSERT") return { audience: "owner", cat: "owner", title: "Payment screenshot uploaded", body: d.order || "Order", url: "pay" };
    if (c === "paysub" && p.op === "INSERT") return { audience: "owner", cat: "owner", title: "Payment submitted, verify it", body: (d.order || "Order") + " · ₹" + (d.amount || "") + (d.ref ? " · ref " + d.ref : ""), url: "pay" };
    if (c === "paysub" && p.op === "UPDATE" && d.status !== od.status) {
      if (d.status === "Verified") return { audience: "client", cat: "payments", title: "Payment verified", body: "₹" + (d.amount || "") + " for " + (d.order || "your order") + " is confirmed. Thank you.", url: "pay", em: { subject: "Payment verified" + (d.order ? ": " + d.order : ""), headline: "Payment verified", text: "Your payment of ₹" + (d.amount || "") + " for " + (d.order || "your order") + " has been verified. Thank you.", next: "Nothing more is needed for this payment.", cta: ["View payments", "pay"] } };
      if (d.status === "Rejected") return { audience: "client", cat: "payments", title: "Payment could not be verified", body: String(d.reason || "Please check the details and resubmit, or contact Luxella.").slice(0, 140), url: "pay", em: { subject: "Action needed: payment could not be verified", headline: "Payment could not be verified", text: "We could not verify your payment of ₹" + (d.amount || "") + " for " + (d.order || "your order") + ".", next: String(d.reason || "Please open the Payments tab, check the reference or screenshot, and submit it again. If you need help, message Luxella from your page."), cta: ["Fix payment", "pay"] } };
      return null;
    }
    if (c === "quotes" && p.op === "INSERT") return { audience: "client", cat: "quotes", title: "New quote ready", body: (d.item || "Your piece") + (d.price ? " · ₹" + d.price : "") + " — review and approve it.", url: "ov", em: { subject: "Your quote is ready: " + (d.item || "your piece"), headline: "Your quote is ready", text: "We have prepared a quote for " + (d.item || "your piece") + (d.price ? " at ₹" + d.price : "") + ".", next: "Open your page, review the details and approve or decline it. We place the order only after you approve.", cta: ["Review quote", "ov"] } };
    if (c === "quote_resp" && p.op === "INSERT") return { audience: "owner", cat: "owner", title: "Quote " + (d.decision === "approved" ? "approved" : "declined"), body: (d.item || "Quote") + (d.total ? " · ₹" + d.total : ""), url: "ov" };
    if (c === "requests" && p.op === "INSERT") return { audience: "owner", cat: "owner", title: "New product request", body: [d.brand, d.product].filter(Boolean).join(" ") + (d.urgent ? " · URGENT" : ""), url: "ov" };
    if (c === "requests" && p.op === "UPDATE" && d.status !== od.status) return { audience: "client", cat: "quotes", title: "Request update", body: [d.brand, d.product].filter(Boolean).join(" ") + ": " + d.status, url: "ov", em: { subject: "Update on your request: " + [d.brand, d.product].filter(Boolean).join(" "), headline: "Update on your request", text: "Your request for " + [d.brand, d.product].filter(Boolean).join(" ") + " is now: " + d.status + ".", next: "Open your page to see the details.", cta: ["Open your page", "ov"] } };
    if (c === "cases" && p.op === "INSERT") return { audience: "owner", cat: "owner", title: "New support case " + (d.ref || ""), body: (d.type || "Issue") + (d.order ? " · " + d.order : ""), url: "help" };
    if (c === "cases" && p.op === "UPDATE" && d.status !== od.status) {
      if (d.status === "Reopened") return { audience: "owner", cat: "owner", title: "Case reopened " + (d.ref || ""), body: d.type || "Support case", url: "help" };
      if (["Under review", "Awaiting reseller", "Resolution proposed", "Resolved"].includes(d.status)) return { audience: "client", cat: "support", title: "Case " + (d.ref || "") + ": " + d.status, body: d.type || "Your support case", url: "help", em: { subject: "Support case " + (d.ref || "") + ": " + d.status, headline: "Support case: " + d.status, text: "Your support case " + (d.ref || "") + (d.type ? " (" + d.type + ")" : "") + " is now " + d.status + ".", next: d.status === "Resolution proposed" ? "Open the Help tab to review the proposed resolution and accept it or reply." : "You can follow every update in the Help tab.", cta: ["Open Help", "help"] } };
      return null;
    }
    if (c === "case_msgs" && p.op === "INSERT") {
      const att = (d.voice ? " 🎤 voice note" : "") + ((d.files || []).length ? " 📷 " + d.files.length + " photo" : "");
      const body = (String(d.text || "").slice(0, 140) + att).trim() || "New message";
      if (d.case === "inbox") {
        if (d.from === "luxella") return { audience: "client", cat: "support", title: "Message from Luxella", body, url: "ov", em: { subject: "A message from Luxella", headline: "A message from Luxella", text: (String(d.text || "").slice(0, 800) + att).trim() || "You have a new message.", next: "Open your page and tap Message Luxella in the chat bubble to reply.", cta: ["Reply", "ov"] } };
        return { audience: "owner", cat: "owner", title: "Message", body, url: "ov" };
      }
      if (d.from === "luxella") return { audience: "client", cat: "support", title: "Luxella replied" + (d.ref ? " on " + d.ref : ""), body, url: "help", em: { subject: "Luxella replied" + (d.ref ? " on " + d.ref : ""), headline: "Luxella replied", text: (String(d.text || "").slice(0, 800) + att).trim() || "You have a new reply.", next: "Open the Help tab to read the full conversation and reply.", cta: ["Open Help", "help"] } };
      return { audience: "owner", cat: "owner", title: "Client reply" + (d.ref ? " on " + d.ref : ""), body, url: "help" };
    }
  }
  return null;
}

// ---- email rendering: logo + golden button as cid images (multipart/related, inline, NO filename so Gmail shows no attachment chip) ----
const BLACK = "#000000", GOLD = "#E3C06A", GOLD_HI = "#F4E1A0", GOLD_LO = "#B8943F", LINE = "#4A4132", MUTED = "#E3DCCB", SOFT = "#EDE8DB", TXT = "#F1EBDD";
const SERIF = "'Cormorant Garamond','Didot','Bodoni MT','Playfair Display',Georgia,'Times New Roman',serif";
const SANS = "'Jost','Futura','Helvetica Neue',Helvetica,Arial,sans-serif";
const BG = `background:${BLACK};background-image:linear-gradient(${BLACK},${BLACK})`;
const GBG = `background:${GOLD};background-image:linear-gradient(${GOLD},${GOLD})`;
const F = (c: string, h: string) => `<font color="${c}">${h}</font>`;
const IMG: Record<string, Uint8Array> = {};
async function getImg(path: string) { if (IMG[path]) return IMG[path]; try { const r = await fetch(SITE + path); if (r.ok && (r.headers.get("content-type") || "").includes("image")) IMG[path] = new Uint8Array(await r.arrayBuffer()); } catch (_e) { /* ignore */ } return IMG[path] || null; }
const btnPath = (label: string) => "assets/btn/" + label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".png";
type Urls = { logo: string; btn: string | null };
function emailHtml(first: string, slug: string, em: Em, u: Urls) {
  const link = SITE + slug + "#" + (em.cta ? em.cta[1] : "ov");
  const eyebrow = em.stage ? "ORDER UPDATE" : "LUXELLA CLIENT SERVICE";
  const logoUrl = u.logo;
  const ks = em.ks || [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const si = em.stage ? (ks.indexOf(em.stage) >= 0 ? ks.indexOf(em.stage) + 1 : ks.filter((x) => x <= em.stage!).length) : 0;
  const prog = em.stage ? `<table role="presentation" align="center" width="86%" cellspacing="4" cellpadding="0" bgcolor="${BLACK}" style="margin:26px auto 10px;${BG}"><tr>${ks.map((i) => `<td height="3" bgcolor="${i < em.stage! ? GOLD_LO : i === em.stage ? GOLD_HI : LINE}" style="background:${i < em.stage! ? GOLD_LO : i === em.stage ? GOLD_HI : LINE};font-size:0;line-height:0">&nbsp;</td>`).join("")}</tr></table><div style="font-family:${SANS};font-weight:400;font-size:11px;letter-spacing:.26em;color:${GOLD_HI};text-align:center">${F(GOLD_HI, "STEP " + si + " OF " + ks.length + " &nbsp;·&nbsp; " + esc(em.stLabel || STAGES[em.stage - 1]).toUpperCase())}</div>` : "";
  const rows = (em.rows || []).map(([k, v]) => `<div style="${BG};border-top:1px solid ${LINE};padding:14px 0 14px;text-align:center"><div style="font-family:${SANS};font-weight:400;font-size:11px;letter-spacing:.24em;color:${GOLD};margin:0 0 6px">${F(GOLD, esc(k).toUpperCase())}</div><div style="font-family:${SANS};font-weight:500;font-size:16px;line-height:1.5;color:${GOLD_HI}">${F(GOLD_HI, esc(v))}</div></div>`).join("");
  const table = rows ? `<div style="margin:34px 0 0;${BG};border-bottom:1px solid ${LINE}">${rows}</div>` : "";
  const next = em.next ? `<div style="margin:38px 0 10px;font-family:${SANS};font-weight:500;font-size:11px;letter-spacing:.34em;color:${GOLD};text-align:center">${F(GOLD, "WHAT HAPPENS NEXT")}</div><p style="margin:0;font-family:${SANS};font-weight:400;font-size:14px;line-height:1.85;color:${SOFT};text-align:center">${F(SOFT, esc(em.next))}</p>` : "";
  const ctaLabel = em.cta ? em.cta[0] : "Open your page";
  const cta = esc(ctaLabel.toUpperCase());
  const textBtn = `<table role="presentation" align="center" cellspacing="0" cellpadding="0" style="margin:40px auto 10px"><tr><td align="center" bgcolor="${GOLD}" style="${GBG};border:1px solid ${GOLD_HI}"><a href="${link}" style="display:block;${GBG};padding:17px 42px;font-family:${SANS};font-weight:700;font-size:12px;letter-spacing:.3em;color:#000000;text-decoration:none">${F("#000000", "<b>" + cta + "</b>")}</a></td></tr></table>`;
  const button = u.btn
    ? `<table role="presentation" align="center" cellspacing="0" cellpadding="0" style="margin:40px auto 10px"><tr><td align="center" bgcolor="${GOLD}" style="${GBG}"><a href="${link}" style="display:block;text-decoration:none;${GBG}"><img src="${u.btn}" width="300" height="54" alt="${cta}" style="display:block;width:300px;max-width:100%;height:auto;border:0;${GBG};color:#000000;font-family:${SANS};font-weight:700;font-size:13px;letter-spacing:.2em;text-align:center"></a></td></tr></table>`
    : textBtn;
  return `<!doctype html><html style="${BG}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="color-scheme" content="dark only"><meta name="supported-color-schemes" content="dark only"><style>:root{color-scheme:dark only;supported-color-schemes:dark only}html,body{background:${BLACK}!important}</style></head><body bgcolor="${BLACK}" text="${TXT}" style="margin:0;padding:0;${BG}"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${BLACK}" style="${BG}"><tr><td align="center" bgcolor="${BLACK}" style="${BG};padding:36px 12px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" bgcolor="${BLACK}" style="width:100%;max-width:600px;${BG}"><tr><td align="center" bgcolor="${BLACK}" style="${BG};padding:0 0 22px"><img src="${logoUrl}" width="210" alt="LUXELLA" style="display:block;margin:0 auto;width:210px;max-width:60%;height:auto;border:0;background:${BLACK};color:${GOLD};font-family:${SERIF};font-size:24px"></td></tr><tr><td height="1" bgcolor="${LINE}" style="background:${LINE};font-size:0;line-height:0">&nbsp;</td></tr><tr><td bgcolor="${BLACK}" style="${BG};padding:44px 30px 12px"><div style="font-family:${SANS};font-weight:500;font-size:11px;letter-spacing:.4em;color:${GOLD};text-align:center">${F(GOLD, eyebrow)}</div><h1 style="margin:18px 0 0;font-family:${SERIF};font-weight:400;font-size:34px;line-height:1.2;letter-spacing:.02em;color:${GOLD_HI};text-align:center">${F(GOLD_HI, esc(em.headline))}</h1>${prog}<p style="margin:34px 0 0;font-family:${SANS};font-weight:400;font-size:15px;line-height:1.9;color:${GOLD_HI};text-align:center">${F(GOLD_HI, "Dear " + esc(first) + ",")}</p><p style="margin:6px 0 0;font-family:${SANS};font-weight:400;font-size:15px;line-height:1.9;color:${SOFT};text-align:center">${F(SOFT, esc(em.text).replace(/\n/g, "<br>"))}</p>${table}${next}${button}</td></tr><tr><td bgcolor="${BLACK}" style="${BG};padding:30px 30px 0"><div style="border-top:1px solid ${LINE};padding-top:26px;font-family:${SANS};font-weight:400;font-size:12px;line-height:1.8;color:${MUTED};text-align:center">${F(MUTED, "Questions? Reply to this email, or tap Message Luxella on your page.<br>Switch these alerts off any time in Account, under Notifications.")}</div></td></tr><tr><td align="center" bgcolor="${BLACK}" style="${BG};padding:24px 0 6px"><img src="${logoUrl}" width="110" alt="LUXELLA" style="display:block;margin:0 auto;width:110px;height:auto;border:0;background:${BLACK}"></td></tr></table></td></tr></table></body></html>`;
}
function emailText(first: string, slug: string, em: Em) {
  const link = SITE + slug + "#" + (em.cta ? em.cta[1] : "ov");
  return ["Dear " + first + ",", "", em.headline.toUpperCase(), em.text, "", ...(em.rows || []).map(([k, v]) => k + ": " + v), ...(em.next ? ["", "What happens next: " + em.next] : []), "", (em.cta ? em.cta[0] : "Open your page") + ": " + link, "", "Luxella - The Standard for Rare"].join("\n");
}
async function sendMail(sec: Record<string, string>, to: string[], first: string, slug: string, em: Em) {
  const logo = await getImg("assets/email_logo2.png");
  const ctaLabel = em.cta ? em.cta[0] : "Open your page";
  const btn = await getImg(btnPath(ctaLabel));
  const html = emailHtml(first, slug, em, { logo: logo ? "cid:luxlogo@luxella" : SITE + "assets/email_logo2.png", btn: btn ? "cid:luxbtn@luxella" : (SITE + btnPath(ctaLabel)) });
  const attachments: any[] = [];
  if (logo) attachments.push({ content: Buffer.from(logo), cid: "luxlogo@luxella", contentType: "image/png", contentDisposition: "inline", headers: { "Content-Disposition": "inline", "X-Attachment-Id": "luxlogo" } });
  if (btn) attachments.push({ content: Buffer.from(btn), cid: "luxbtn@luxella", contentType: "image/png", contentDisposition: "inline", headers: { "Content-Disposition": "inline", "X-Attachment-Id": "luxbtn" } });
  const tr = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: sec.smtp_user, pass: sec.smtp_pass } });
  let sent = 0; let err = "";
  for (const addr of to) { try { await tr.sendMail({ from: "Luxella <" + sec.smtp_user + ">", replyTo: sec.smtp_user, to: addr, subject: em.subject, text: emailText(first, slug, em), html, attachments }); sent++; } catch (e) { err = String((e as any)?.message || e); } }
  try { tr.close(); } catch (_e) { /* ignore */ }
  return { sent, err, logo: !!logo, btn: !!btn };
}
async function emailClient(sec: Record<string, string>, clientId: string, slug: string, clientName: string, em: Em) {
  if (!sec.smtp_user || !sec.smtp_pass) return { sent: 0, err: "no smtp" };
  const { data: us } = await admin.from("lx_client_users").select("email").eq("client_id", clientId);
  const to = (us || []).map((u: any) => u.email).filter(Boolean);
  if (!to.length) return { sent: 0, err: "no client email" };
  const first = String(clientName || "there").split(" ")[0];
  const r = await sendMail(sec, to, first, slug, em);
  if (r.err) console.error("email error", r.err);
  return r;
}

async function ownerFrom(req: Request) {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const asUser = createClient(URL_, ANON, { global: { headers: { Authorization: "Bearer " + token } } });
  const { data: { user } } = await asUser.auth.getUser(token);
  const em = (user?.email || "").toLowerCase();
  return OWNERS.includes(em) ? em : null;
}

async function pushTo(sec: Record<string, string>, audience: "client" | "owner", clientId: string | null, title: string, body: string, url: string) {
  let q = admin.from("lx_push_subs").select("id,endpoint,sub,user_email,client_id");
  q = audience === "client" ? q.eq("client_id", clientId) : q.is("client_id", null);
  const { data: subs } = await q;
  if (!subs || !subs.length) return { sent: 0, removed: 0 };
  webpush.setVapidDetails("mailto:luxella.in@gmail.com", sec.vapid_public, sec.vapid_private);
  const payload = JSON.stringify({ title, body, url, tag: "lx-" + (clientId || "x") + "-" + url });
  let sent = 0; const dead: string[] = [];
  await Promise.all(subs.map(async (s: any) => { try { await webpush.sendNotification(s.sub, payload, { TTL: 86400 }); sent++; } catch (e: any) { if (e && (e.statusCode === 404 || e.statusCode === 410)) dead.push(s.id); } }));
  if (dead.length) await admin.from("lx_push_subs").delete().in("id", dead);
  return { sent, removed: dead.length };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  const sec = await secrets();
  const u = new URL(req.url);
  if (req.method === "GET" && u.searchParams.get("vapid")) return json({ key: sec.vapid_public || "" });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  let p: any; try { p = await req.json(); } catch { return json({ error: "Bad JSON" }, 400); }
  if (p.manual_stage) {
    const who = await ownerFrom(req); if (!who) return json({ error: "Owner only" }, 403);
    const { client_id, item, order_no } = p.manual_stage;
    const q0 = admin.from("lx_orders").select("data,item").eq("client_id", client_id);
    const { data: row } = await (order_no ? q0.eq("data->>order_no", String(order_no)) : q0.eq("item", item)).maybeSingle();
    if (!row) return json({ error: "Order not found" }, 404);
    const d: any = row.data || {}; const st = Number(p.manual_stage.stage) || Number(d.stage) || 1;
    const { data: client } = await admin.from("lx_clients").select("slug,name").eq("id", client_id).maybeSingle();
    const em = orderEmail(d, d.item || item || (row as any).item, st);
    const r = await emailClient(sec, client_id, client?.slug || "", client?.name || "", em);
    return json({ sent: (r as any).sent || 0, err: (r as any).err || "", subject: em.subject });
  }
  if (p.received) {
    // client taps "Received successfully": moves their own shipped order to Delivered. No automatic mail (notify_hold); owner gets a push.
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Sign in required" }, 401);
    const asUser = createClient(URL_, ANON, { global: { headers: { Authorization: "Bearer " + token } } });
    const { data: { user } } = await asUser.auth.getUser(token);
    const email = (user?.email || "").toLowerCase(); if (!email) return json({ error: "Sign in required" }, 401);
    const { data: cu } = await admin.from("lx_client_users").select("client_id,email");
    const mine = (cu || []).filter((x: any) => String(x.email || "").toLowerCase() === email).map((x: any) => x.client_id);
    if (!mine.length) return json({ error: "Not a client" }, 403);
    const no = String(p.received.order_no || ""); const itm = String(p.received.item || "");
    const q = admin.from("lx_orders").select("client_id,item,data").in("client_id", mine);
    const { data: rows } = await (no ? q.eq("data->>order_no", no) : q.eq("item", itm));
    const row: any = (rows || [])[0]; if (!row) return json({ error: "Order not found" }, 404);
    const d: any = row.data || {}; const st = Number(d.stage) || 1;
    if (st >= 9) return json({ ok: true, already: true });
    if (st < 8) return json({ error: "This order has not shipped yet" }, 400);
    const now = new Date().toISOString(); const today = now.slice(0, 10);
    const next = { ...d, stage: 9, status: stN(d, 9), notify_hold: now, received_by: "client", received_at: now };
    const u = await admin.from("lx_orders").update({ data: next, updated_at: now }).eq("client_id", row.client_id).eq("item", row.item);
    if (u.error) return json({ error: u.error.message }, 500);
    const key = slugify(row.item);
    const { data: nr } = await admin.from("lx_docs").select("data").eq("client_id", row.client_id).eq("collection", "notes").eq("doc_id", key).maybeSingle();
    const n: any = (nr as any)?.data || { order: row.item, items: [] }; const stg: any = { ...(n.stages || {}) }; if (!stg[9]) stg[9] = today;
    await admin.from("lx_docs").upsert({ client_id: row.client_id, collection: "notes", doc_id: key, data: { ...n, order: row.item, items: n.items || [], stages: stg } }, { onConflict: "client_id,collection,doc_id" });
    await admin.from("lx_docs").insert({ client_id: row.client_id, collection: "received", doc_id: "rc-" + Date.now().toString(36), data: { order: row.item, order_no: d.order_no || "", at: now } });
    return json({ ok: true });
  }
  if (p.manual_msg) {
    // owner-edited message from the B2B portal: Jeet clicked Send, so this is an explicit owner action
    const who = await ownerFrom(req); if (!who) return json({ error: "Owner only" }, 403);
    const m = p.manual_msg; const client_id = String(m.client_id || "");
    const { data: client } = await admin.from("lx_clients").select("slug,name").eq("id", client_id).maybeSingle();
    if (!client) return json({ error: "Client not found" }, 404);
    const clean = (t: unknown) => String(t || "").replace(/^Dear [^\n]*,\s*/i, "").replace(/\s*Warm regards,\s*Luxella\s*$/i, "").trim().slice(0, 3000);
    const text = clean(m.text); if (!text) return json({ error: "Empty message" }, 400);
    const cta = Array.isArray(m.cta) && m.cta[0] && /^[a-z]{1,8}(:[a-z0-9-]{1,60})?$/i.test(String(m.cta[1] || "")) ? [String(m.cta[0]).slice(0, 40), String(m.cta[1])] as [string, string] : ["Open your page", "ov"] as [string, string];
    const em: Em = { subject: String(m.subject || "A message from Luxella").slice(0, 120), headline: String(m.headline || "A message from Luxella").slice(0, 80), text, cta };
    const r = await emailClient(sec, client_id, client.slug || "", client.name || "", em);
    return json({ sent: (r as any).sent || 0, err: (r as any).err || "", subject: em.subject });
  }
  if (req.headers.get("x-lx-hook") !== sec.hook_secret) return json({ error: "Forbidden" }, 403);
  // 24 Oct 2026: test mails to an arbitrary address need Jeet's login, never just the hook secret
  if ((p.test_email || p.test_order) && !(await ownerFrom(req))) return json({ error: "Owner only" }, 403);
  if (p.test_email) { const em: Em = { subject: "Luxella email test", headline: "Email alerts are working", text: "If you can read this, email alerts are working.", cta: ["Open your page", "ov"] }; return json(await sendMail(sec, [String(p.test_email)], "there", "", em)); }
  if (p.test_order) { const d = p.test_order; const em = orderEmail(d, d.item || "Test piece", Number(d.stage) || 1); return json(await sendMail(sec, [String(p.to)], "there", "", em)); }
  if (p.table === "lx_orders" && p.op === "INSERT" && ((p.new || {}).data || {}).placed_by === "client") { const oj = fetch(URL_ + "/functions/v1/lx-order-alert", { method: "POST", headers: { "Content-Type": "application/json", "x-lx-hook": sec.hook_secret }, body: JSON.stringify(p) }).catch((e) => console.error("order-alert", e)); try { (globalThis as any).EdgeRuntime.waitUntil(oj); } catch (_e) { /* fall through */ } }
  const msg = compose(p); if (!msg) return json({ skipped: true });
  const clientId = (p.new || {}).client_id;
  const { data: client } = await admin.from("lx_clients").select("slug,name").eq("id", clientId).maybeSingle();
  const slug = client?.slug || "";
  // owner copy (e.g. address received) — independent of client prefs
  let ownerSent = 0;
  if (msg.alsoOwner) { try { ownerSent = (await pushTo(sec, "owner", null, (client ? client.name + ": " : "") + msg.alsoOwner.title, msg.alsoOwner.body, slug + "#" + msg.alsoOwner.url)).sent; } catch (_e) { /* ignore */ } }
  if (msg.audience === "client") {
    const { data: pr } = await admin.from("lx_docs").select("data").eq("client_id", clientId).eq("collection", "prefs").eq("doc_id", "main").maybeSingle();
    const push = (pr?.data as any)?.push || {};
    if (push.all === false || push[msg.cat] === false) return json({ skipped: "prefs", ownerSent });
  }
  // owner-side mute: lx_docs collection 'meta' doc 'mute' { email: true } → no client emails (push/page still work)
  let muted = false;
  if (msg.audience === "client") { const { data: mu } = await admin.from("lx_docs").select("data").eq("client_id", clientId).eq("collection", "meta").eq("doc_id", "mute").maybeSingle(); muted = !!(mu?.data as any)?.email; }
  if (msg.audience === "client" && !msg.noEmail && !muted) { const em: Em = msg.em || { subject: msg.title, headline: msg.title, text: msg.body, cta: ["Open your page", msg.url] }; const job = emailClient(sec, clientId, slug, client?.name || "", em).catch((e) => console.error("email", e)); try { (globalThis as any).EdgeRuntime.waitUntil(job); } catch (_e) { /* fall through */ } }
  const title = msg.audience === "owner" && client ? client.name + ": " + msg.title : msg.title;
  const r = await pushTo(sec, msg.audience, clientId, title, msg.body, slug + "#" + msg.url);
  return json({ sent: r.sent, removed: r.removed, ownerSent });
});
