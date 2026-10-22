// lx-msg-push v2: SMART phone push to Jeet for agent messages in the B2B Inbox.
// - urgent → immediately, any hour (one push per message)
// - notify → batched into ONE digest per sweep; held during quiet hours (23:00–07:59 IST) and released at the 8am sweep
// - dedupe: same agent + same thread + same first 60 chars already pushed in the last 24h → not pushed again
// Called by a DB trigger on lx_b2b (kind='msg') and by the hourly sweep from km-sync, both with the cron key.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import webpush from "npm:web-push@3.6.7";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const NAMES: Record<string, string> = { brain: "🧠 Brain", ops: "📋 Ops", mail: "📬 Mail", pricing: "💰 Pricing", tracking: "🚚 Tracking", payout: "💸 Payout", cfo: "📊 CFO", reconciler: "🔍 Reconciler", auditor: "🛡️ Auditor", qa: "🧪 QA", clientdesk: "👥 Client Desk", council: "🌙 Night Council" };
const istHour = () => (new Date(Date.now() + 5.5 * 3600e3)).getUTCHours();
const quiet = () => { const h = istHour(); return h >= 23 || h < 8; };
const sig = (m: any) => (m.from || "") + "|" + (m.thread || "") + "|" + String(m.text || "").replace(/\s+/g, " ").slice(0, 60).toLowerCase();

Deno.serve(async (req) => {
  try {
    const key = req.headers.get("x-sync-key");
    const { data: v } = await db.from("lx_km_vault").select("data").eq("id", "cron").maybeSingle();
    if (!key || !v?.data?.key || v.data.key !== key) return new Response("forbidden", { status: 403 });
    const p: any = await req.json().catch(() => ({}));
    const since = new Date(Date.now() - 24 * 3600e3).toISOString();
    const { data: recent } = await db.from("lx_b2b").select("id,data").eq("kind", "msg").gte("updated_at", since).order("id", { ascending: false }).limit(200);
    const rows = (recent || []).filter((r: any) => r.data && r.data.from !== "jeet");
    const pushedSigs = new Set(rows.filter((r: any) => r.data.pushed).map((r: any) => sig(r.data)));
    const mark = async (r: any, extra: any = {}) => { await db.from("lx_b2b").update({ data: { ...r.data, pushed: true, ...extra } }).eq("kind", "msg").eq("id", r.id); };

    let urgent: any[] = []; let digest: any[] = [];
    if (p.action === "sweep") {
      const cand = rows.filter((r: any) => (r.data.notify || r.data.urgent) && !r.data.pushed);
      for (const r of cand) {
        if (pushedSigs.has(sig(r.data))) { await mark(r, { push_skipped: "dup" }); continue; }
        if (r.data.urgent) { urgent.push(r); pushedSigs.add(sig(r.data)); continue; }
        if (quiet()) continue; // hold until morning
        digest.push(r); pushedSigs.add(sig(r.data));
      }
      for (const r of urgent.concat(digest)) await mark(r);
    } else {
      const m = p.msg || {}; if (!m.from || m.from === "jeet" || !(m.notify || m.urgent)) return Response.json({ skipped: true });
      if (!m.urgent) return Response.json({ deferred: "sweep" }); // non-urgent waits for the hourly digest
      if (pushedSigs.has(sig(m))) return Response.json({ skipped: "dup" });
      urgent = [{ id: m.id, data: m }];
    }
    if (!urgent.length && !digest.length) return Response.json({ swept: 0, quiet: quiet() });

    const { data: sec } = await db.from("lx_secrets").select("k,v").in("k", ["vapid_public", "vapid_private"]);
    const s: Record<string, string> = {}; (sec || []).forEach((r: any) => (s[r.k] = r.v));
    const { data: subs } = await db.from("lx_push_subs").select("id,sub").is("client_id", null);
    if (!subs?.length || !s.vapid_public) return Response.json({ sent: 0 });
    webpush.setVapidDetails("mailto:luxella.in@gmail.com", s.vapid_public, s.vapid_private);
    let sent = 0; const dead: string[] = [];
    const send = async (payload: string) => { await Promise.all(subs.map(async (x: any) => { try { await webpush.sendNotification(x.sub, payload, { TTL: 43200 }); sent++; } catch (e: any) { if ((e?.statusCode === 404 || e?.statusCode === 410) && !dead.includes(x.id)) dead.push(x.id); } })); };
    const line = (m: any) => (NAMES[m.from] || m.from) + ": " + String(m.text || "").replace(/\s+/g, " ").slice(0, 90);
    for (const r of urgent) { const m = r.data; await send(JSON.stringify({ title: "🔴 " + (NAMES[m.from] || m.from) + (m.thread === "group" ? " · HQ Room" : ""), body: String(m.text || "").replace(/\s+/g, " ").slice(0, 180), url: "https://luxella-b2b.vercel.app/#inbox:" + (m.thread || "group"), tag: "lxb2b-u-" + r.id })); }
    if (digest.length === 1) { const m = digest[0].data; await send(JSON.stringify({ title: (NAMES[m.from] || m.from) + (m.thread === "group" ? " · HQ Room" : ""), body: String(m.text || "").replace(/\s+/g, " ").slice(0, 180), url: "https://luxella-b2b.vercel.app/#inbox:" + (m.thread || "group"), tag: "lxb2b-digest" })); }
    else if (digest.length > 1) { const ms = digest.map((r: any) => r.data); await send(JSON.stringify({ title: "Luxella HQ · " + ms.length + " updates", body: ms.slice(0, 4).map(line).join(" · ").slice(0, 230), url: "https://luxella-b2b.vercel.app/#inbox:group", tag: "lxb2b-digest" })); }
    if (dead.length) await db.from("lx_push_subs").delete().in("id", dead);
    return Response.json({ sent, urgent: urgent.length, digest: digest.length, quiet: quiet() });
  } catch (e) { return Response.json({ error: String((e as Error).message || e) }); }
});
