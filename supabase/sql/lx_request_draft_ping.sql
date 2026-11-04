-- lx_request_draft_ping: when the Concierge adds a draft to a client request that is still 'Submitted',
-- tell Jeet once (phone push via lx-msg-push digest, quiet hours respected): "🛎️ Draft ready: <client> · <item> · ₹price".
-- He sends it from The Edit → Requests (existing "Send answer" button, which replies + pushes the client).
create or replace function public.lx_request_draft_ping() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_name text; v_item text; v_price text;
begin
  if new.collection <> 'requests' or not (new.data ? 'draft') or coalesce(new.data->>'status', 'Submitted') <> 'Submitted' then return new; end if;
  if tg_op = 'UPDATE' and (old.data ? 'draft') then return new; end if; -- ping only when the draft first appears
  select name into v_name from lx_clients where id = new.client_id;
  if coalesce(v_name, '') ~* '^(zz|test)' then return new; end if;
  v_item := coalesce(nullif(btrim(concat_ws(' ', new.data->>'brand', new.data->>'product')), ''), 'a request');
  v_price := case when (new.data#>>'{draft,price}') ~ '^[0-9.]+$' then ' · ₹' || to_char((new.data#>>'{draft,price}')::numeric, 'FM99,99,99,999') else '' end;
  perform lx_report('clientdesk', '🛎️ Draft ready: ' || coalesce(v_name, 'Client') || ' · ' || left(v_item, 80) || v_price || chr(10) || 'The Edit → Requests → check & Send answer',
    '[]'::jsonb, true, false, 'clients');
  return new;
exception when others then return new; -- never block the Concierge's write
end $$;
drop trigger if exists lx_request_draft_ping_t on public.lx_docs;
create trigger lx_request_draft_ping_t after insert or update on public.lx_docs
  for each row when (new.collection = 'requests') execute function public.lx_request_draft_ping();
revoke execute on function public.lx_request_draft_ping() from public, anon, authenticated;
