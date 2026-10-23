// lx-welcome: one-time branded welcome email for a new Luxella client (owner-only). Sends once per client unless {force:true}.
import { createClient } from "jsr:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.14";
const URL_ = Deno.env.get("SUPABASE_URL")!, SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const OWNERS = ["jeetnathavani37@gmail.com", "jeetnatb@gmail.com"];
const SITE = "https://luxellaclients.duckdns.org/";
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-lx-hook", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
const GOLD = "#E3C06A", HI = "#F4E1A0", LINE = "#4A4132", SOFT = "#EDE8DB", MUTED = "#E3DCCB";
const SANS = "'Jost','Helvetica Neue',Helvetica,Arial,sans-serif", SERIF = "'Cormorant Garamond',Georgia,'Times New Roman',serif";
function html(first: string, link: string, email: string) {
  const row = (k: string, v: string) => `<div style="border-top:1px solid ${LINE};padding:14px 0;text-align:center"><div style="font-family:${SANS};font-size:11px;letter-spacing:.24em;color:${GOLD}">${esc(k).toUpperCase()}</div><div style="font-family:${SANS};font-size:16px;color:${HI};margin-top:6px">${esc(v)}</div></div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="color-scheme" content="dark only"></head><body bgcolor="#000000" style="margin:0;padding:0;background:#000"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#000000"><tr><td align="center" style="padding:36px 12px"><table role="presentation" width="600" style="width:100%;max-width:600px" cellspacing="0" cellpadding="0" bgcolor="#000000">
<tr><td align="center" style="padding:0 0 22px"><img src="${SITE}assets/email_logo2.png" width="210" alt="LUXELLA" style="display:block;width:210px;max-width:60%;height:auto;border:0"></td></tr>
<tr><td height="1" bgcolor="${LINE}" style="font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td style="padding:44px 30px 12px;text-align:center">
<div style="font-family:${SANS};font-size:11px;letter-spacing:.4em;color:${GOLD}">LUXELLA CLIENT SERVICE</div>
<h1 style="margin:18px 0 0;font-family:${SERIF};font-weight:400;font-size:34px;color:${HI}">Welcome to Luxella</h1>
<p style="margin:30px 0 0;font-family:${SANS};font-size:15px;line-height:1.9;color:${HI}">Dear ${esc(first)},</p>
<p style="margin:6px 0 0;font-family:${SANS};font-size:15px;line-height:1.9;color:${SOFT}">Your private Luxella client page is ready. It is your single place for everything you buy with us.</p>
<div style="margin:30px 0 0;border-bottom:1px solid ${LINE}">${row("Your page", link)}${row("Sign in with", email)}</div>
<div style="margin:36px 0 10px;font-family:${SANS};font-size:11px;letter-spacing:.34em;color:${GOLD}">ON YOUR PAGE</div>
<p style="margin:0;font-family:${SANS};font-size:14px;line-height:1.85;color:${SOFT}">Browse pieces that are ready to ship, place new orders, track every order step by step, see your payments and statement, and message Luxella directly. Sign in with the email above and the password Luxella shared with you.</p>
<table role="presentation" align="center" cellspacing="0" cellpadding="0" style="margin:38px auto 10px"><tr><td align="center" bgcolor="${GOLD}" style="background:${GOLD}"><a href="${link}" style="display:block;padding:17px 42px;font-family:${SANS};font-weight:700;font-size:12px;letter-spacing:.3em;color:#000;text-decoration:none">OPEN YOUR PAGE</a></td></tr></table>
</td></tr>
<tr><td style="padding:30px 30px 0"><div style="border-top:1px solid ${LINE};padding-top:26px;font-family:${SANS};font-size:12px;line-height:1.8;color:${MUTED};text-align:center">Questions? Reply to this email, or tap Message Luxella on your page.</div></td></tr>
</table></td></tr></table></body></html>`;
}
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
async function ownerFrom(req: Request) {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, ""); if (!token) return null;
  const asUser = createClient(URL_, ANON, { global: { headers: { Authorization: "Bearer " + token } } });
  const { data: { user } } = await asUser.auth.getUser(token); const em = (user?.email || "").toLowerCase();
  return OWNERS.includes(em) ? em : null;
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const { data: sr } = await admin.from("lx_secrets").select("k,v"); const sec: Record<string, string> = {}; (sr || []).forEach((r: any) => (sec[r.k] = r.v)); await smtpFill(admin, sec);
  const okHook = req.headers.get("x-lx-hook") && req.headers.get("x-lx-hook") === sec.hook_secret;
  if (!okHook && !(await ownerFrom(req))) return json({ error: "Owner only" }, 403);
  let p: any; try { p = await req.json(); } catch { return json({ error: "Bad JSON" }, 400); }
  const cid = String(p.client_id || ""); if (!cid) return json({ error: "client_id required" }, 400);
  const { data: c } = await admin.from("lx_clients").select("id,slug,name").eq("id", cid).maybeSingle(); if (!c) return json({ error: "Client not found" }, 404);
  const { data: prev } = await admin.from("lx_docs").select("data").eq("client_id", cid).eq("collection", "meta").eq("doc_id", "welcome").maybeSingle();
  if ((prev?.data as any)?.emailed_at && !p.force) return json({ skipped: "already sent", at: (prev?.data as any).emailed_at });
  const { data: us } = await admin.from("lx_client_users").select("email").eq("client_id", cid); const to = (us || []).map((u: any) => u.email).filter(Boolean);
  if (!to.length) return json({ sent: 0, err: "no client email" });
  if (!sec.smtp_user || !sec.smtp_pass) return json({ sent: 0, err: "no smtp" });
  const first = String(c.name || "there").split(" ")[0]; const link = SITE + c.slug;
  const tr = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: sec.smtp_user, pass: sec.smtp_pass } });
  let sent = 0, err = "";
  for (const addr of to) { try { await tr.sendMail({ from: "Luxella <" + sec.smtp_user + ">", replyTo: sec.smtp_user, to: addr, subject: "Welcome to Luxella — your private client page is ready", text: `Dear ${first},\n\nYour private Luxella client page is ready.\n\nYour page: ${link}\nSign in with: ${addr}\n\nSign in with this email and the password Luxella shared with you. On your page you can browse pieces ready to ship, place new orders, track every order, see your payments and message Luxella directly.\n\nLuxella - The Standard for Rare`, html: html(first, link, addr) }); sent++; } catch (e) { err = String((e as any)?.message || e); } }
  try { tr.close(); } catch (_e) { /* ignore */ }
  if (sent) await admin.from("lx_docs").upsert({ client_id: cid, collection: "meta", doc_id: "welcome", data: { emailed_at: new Date().toISOString(), to } }, { onConflict: "client_id,collection,doc_id" });
  return json({ sent, err });
});
