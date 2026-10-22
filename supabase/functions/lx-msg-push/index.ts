// lx-msg-push: phone push to Jeet when an agent posts an urgent / briefing message in the B2B Inbox.
// Called by a DB trigger on lx_b2b (kind='msg') with the cron key. Uses the owner's existing web-push subscriptions.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import webpush from "npm:web-push@3.6.7";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const NAMES: Record<string, string> = { brain: "🧠 Brain", ops: "📋 Ops", mail: "📬 Mail", pricing: "💰 Pricing", tracking: "🚚 Tracking", payout: "💸 Payout", cfo: "📊 CFO", reconciler: "🔍 Reconciler", auditor: "🛡️ Auditor", qa: "🧪 QA" };
Deno.serve(async (req) => {
  try {
    const key = req.headers.get("x-sync-key");
    const { data: v } = await db.from("lx_km_vault").select("data").eq("id", "cron").maybeSingle();
    if (!key || key !== v?.data?.key) return new Response("forbidden", { status: 403 });
    const p: any = await req.json().catch(() => ({}));
    // sweep mode (called hourly by km-sync): push every agent msg with notify/urgent not yet pushed (max 6, newest first)
    let batch: any[] = [];
    if (p.action === "sweep") {
      const since = new Date(Date.now() - 6 * 3600e3).toISOString();
      const { data: rows } = await db.from("lx_b2b").select("id,data").eq("kind", "msg").gte("updated_at", since).order("id", { ascending: false }).limit(60);
      batch = (rows || []).filter((r: any) => r.data && r.data.from !== "jeet" && (r.data.notify || r.data.urgent) && !r.data.pushed);
      for (const r of batch) await db.from("lx_b2b").update({ data: { ...r.data, pushed: true } }).eq("kind", "msg").eq("id", r.id);
      batch = batch.slice(0, 6).map((r: any) => r.data);
      if (!batch.length) return Response.json({ swept: 0 });
    } else { const m = p.msg || {}; if (!m.from || m.from === "jeet" || !(m.notify || m.urgent)) return Response.json({ skipped: true }); batch = [m]; }
    const { data: sec } = await db.from("lx_secrets").select("k,v").in("k", ["vapid_public", "vapid_private"]);
    const s: Record<string, string> = {}; (sec || []).forEach((r: any) => (s[r.k] = r.v));
    const { data: subs } = await db.from("lx_push_subs").select("id,sub").is("client_id", null);
    if (!subs?.length || !s.vapid_public) return Response.json({ sent: 0 });
    webpush.setVapidDetails("mailto:luxella.in@gmail.com", s.vapid_public, s.vapid_private);
    let sent = 0; const dead: string[] = [];
    for (const m of batch) {
      const title = (m.urgent ? "🔴 " : "") + (NAMES[m.from] || m.from) + (m.thread === "group" ? " · HQ Room" : "");
      const payload = JSON.stringify({ title, body: String(m.text || "").replace(/\s+/g, " ").slice(0, 180), url: "https://luxella-b2b.vercel.app/#inbox:" + (m.thread || "group"), tag: "lxb2b-" + (m.thread || "g") });
      await Promise.all(subs.map(async (x: any) => { try { await webpush.sendNotification(x.sub, payload, { TTL: 43200 }); sent++; } catch (e: any) { if ((e?.statusCode === 404 || e?.statusCode === 410) && !dead.includes(x.id)) dead.push(x.id); } }));
    }
    if (dead.length) await db.from("lx_push_subs").delete().in("id", dead);
    return Response.json({ sent });
  } catch (e) { return Response.json({ error: String((e as Error).message || e) }); }
});
