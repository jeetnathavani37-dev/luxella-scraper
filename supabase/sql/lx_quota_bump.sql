-- Atomic per-day AI quota for lx-media (service role only). Returns true when the call is allowed, null when the limit is reached.
create or replace function public.lx_quota_bump(p_id text, p_action text, p_limit int) returns boolean
language sql security definer set search_path = public as $$
  insert into lx_km_vault(id, data) values (p_id, jsonb_build_object(p_action, 1))
  on conflict (id) do update set data = lx_km_vault.data || jsonb_build_object(p_action, coalesce((lx_km_vault.data->>p_action)::int, 0) + 1), updated_at = now()
  where coalesce((lx_km_vault.data->>p_action)::int, 0) < p_limit
  returning true
$$;
revoke execute on function public.lx_quota_bump(text, text, int) from public, anon, authenticated;
grant execute on function public.lx_quota_bump(text, text, int) to service_role;
