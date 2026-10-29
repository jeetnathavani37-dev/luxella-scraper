-- Run once in Supabase → SQL editor. Blocks AI agents (they connect via the management API, application_name 'mgmt-api')
-- from deleting orders, clients, logins, client documents or catalogue rows. The portal, admin panel and edge functions are not affected.
-- To delete something on purpose through the API: run  set local lx.allow_delete = 'on';  in the same transaction.
create or replace function public.lx_agent_delete_guard() returns trigger language plpgsql as $$
begin
  if current_setting('application_name', true) = 'mgmt-api' and coalesce(current_setting('lx.allow_delete', true),'') <> 'on' then
    raise exception 'Luxella guard: deleting from % via the management API (AI agents) is blocked. Ask Jeet.', TG_TABLE_NAME;
  end if;
  return OLD;
end $$;
do $$ declare t text; begin
  foreach t in array array['lx_orders','lx_clients','lx_client_users','lx_docs','lx_catalog'] loop
    execute format('drop trigger if exists lx_agent_delete_guard on public.%I', t);
    execute format('create trigger lx_agent_delete_guard before delete on public.%I for each row execute function public.lx_agent_delete_guard()', t);
  end loop;
end $$;
