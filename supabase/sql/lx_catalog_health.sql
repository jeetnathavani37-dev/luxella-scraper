-- lx_catalog_health: daily catalogue hygiene (cron 01:00 UTC = 06:30 IST, after the night sync).
-- 1. Hides live pieces not seen for 7 days (price/stock too old to sell). Ingest sets active=true again when a piece is seen.
--    Safety lock: if more than 25% of live pieces would go at once, nothing is hidden and a critical exception is raised.
-- 2. Raises `catalog_store_stale` per store (id prefix) that scraped 100+ pieces in 30 days but 0 in the last 48 h.
--    It auto-resolves when the store is fresh again.
-- select lx_catalog_health();       -- dry run: counts only, writes nothing
-- select lx_catalog_health(false);  -- real run (what cron does)
create or replace function public.lx_catalog_health(p_dry boolean default true) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_active int; v_old int; v_hidden int := 0; v_blocked boolean; r record; v_stale text[] := '{}';
begin
  select count(*) filter (where active), count(*) filter (where active and seen_at < now() - interval '7 days')
    into v_active, v_old from lx_catalog;
  v_blocked := v_old > v_active * 0.25;
  if not p_dry then
    if v_blocked then
      perform lx_exc_put('catalog_hide_blocked', 'catalog', null, 'critical', 'qa',
        format('Auto-hide skipped: %s of %s live pieces are older than 7 days (over 25%%)', v_old, v_active),
        'Check Catalogue sync, then hide by hand if right');
    else
      update lx_catalog set active = false where active and seen_at < now() - interval '7 days';
      get diagnostics v_hidden = row_count;
      update lx_exceptions set status = 'resolved', resolved_at = now(), resolved_by = 'auto'
        where status = 'open' and rule = 'catalog_hide_blocked';
    end if;
  end if;
  for r in
    select substring(id from '^[a-z]{1,6}') store, count(*) n30, max(seen_at) last_seen
    from lx_catalog where seen_at > now() - interval '30 days'
    group by 1 having count(*) >= 100 and max(seen_at) < now() - interval '48 hours'
  loop
    v_stale := v_stale || r.store;
    if not p_dry then
      perform lx_exc_put('catalog_store_stale', 'store:' || r.store, null, 'medium', 'qa',
        format('Store %s: 0 pieces scraped in 48 h (last %s, %s pieces in 30 days)', r.store,
          to_char(r.last_seen at time zone 'Asia/Kolkata', 'DD Mon HH24:MI'), r.n30),
        'Check the Catalogue sync log for this store');
    end if;
  end loop;
  if not p_dry then
    update lx_exceptions set status = 'resolved', resolved_at = now(), resolved_by = 'auto'
      where status = 'open' and rule = 'catalog_store_stale' and not (ref = any (select 'store:' || s from unnest(v_stale) s));
  end if;
  return jsonb_build_object('dry', p_dry, 'active', v_active, 'older_7d', v_old, 'blocked', v_blocked, 'hidden', v_hidden, 'stale_stores', to_jsonb(v_stale));
end $$;
revoke execute on function public.lx_catalog_health(boolean) from public, anon, authenticated;
select cron.schedule('lx-catalog-health', '0 1 * * *', 'select public.lx_catalog_health(false)');
