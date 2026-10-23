// Inbound bridge for n8n / Zapier / Make: POST JSON with header x-lx-secret.
// Body: { type: 'n8n.something', ref?: string, payload?: object, apply?: { order_id: string, patch: object } }
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const J = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } });
let SECRET: string | null = null;
Deno.serve(async (req) => {
  if (req.method !== 'POST') return J({ ok: false, error: 'POST only' }, 405);
  if (!SECRET) { const { data } = await sb.from('lx_secrets').select('v').eq('k', 'hook_secret').single(); SECRET = data?.v ?? null; }
  const given = req.headers.get('x-lx-secret') || '';
  if (!SECRET || given.length !== SECRET.length || given !== SECRET) return J({ ok: false, error: 'bad secret' }, 401);
  let b: any; try { b = await req.json(); } catch { return J({ ok: false, error: 'bad json' }, 400); }
  const type = String(b?.type || '').slice(0, 80);
  if (!/^[a-z0-9_.-]+$/i.test(type)) return J({ ok: false, error: 'type required (letters, dots)' }, 400);
  const payload = (b && typeof b.payload === 'object' && b.payload) ? b.payload : {};
  const out: any = { ok: true };
  const ev = await sb.from('lx_events').insert({ type: type.startsWith('ext.') ? type : 'ext.' + type, ref: b.ref ? String(b.ref).slice(0, 120) : null, payload, source: 'webhook' }).select('id').single();
  if (ev.error) return J({ ok: false, error: ev.error.message }, 500);
  out.event_id = ev.data.id;
  if (b.apply && b.apply.order_id && b.apply.patch && typeof b.apply.patch === 'object') {
    const r = await sb.rpc('lx_apply', { p_order: String(b.apply.order_id), p_patch: b.apply.patch, p_src: 'webhook', p_overwrite: false });
    out.apply = r.error ? { error: r.error.message } : r.data;
  }
  return J(out);
});
