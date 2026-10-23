-- Founder Command Centre (24 Oct 2026). Read-only. One JSON with every number + its source and as-of time.
create or replace function public.lx_command_centre_raw() returns jsonb language sql stable as $f$
with ex as (
  select e.*, o.payout_inr, o.client from lx_exceptions e left join lx_v_orders o on o.id = e.order_id where e.status='open'
), inc as (
  select rule,
    (array_agg(severity order by case severity when 'critical' then 0 when 'high' then 1 else 2 end))[1] severity,
    count(*) n, min(created_at) since, max(last_seen) last_seen,
    (array_agg(owner order by created_at))[1] owner,
    (array_agg(action order by created_at))[1] action,
    (array_agg(reason order by created_at))[1] example,
    coalesce(sum(payout_inr),0) money,
    (array_agg(order_id order by payout_inr desc nulls last) filter (where order_id is not null))[1:8] orders,
    count(distinct client) filter (where client is not null) clients
  from ex group by rule
), ranked as (
  select *, (case severity when 'critical' then 3 when 'high' then 2 else 1 end) * 1000000 + least(money, 999999) score from inc
), o as (select * from lx_v_orders where not archived and status <> 'Cancelled'),
asks as (
  select id, data->>'from' agent, data#>>'{q,order_id}' order_id, data#>>'{q,text}' question, data->>'at' asked_at
  from lx_b2b where kind='msg' and data ? 'q' and jsonb_array_length(coalesce(data#>'{q,options}','[]'::jsonb))>0 and coalesce(data->>'status','')<>'answered'
)
select jsonb_build_object(
  'generated_at', now(),
  'incidents', coalesce((select jsonb_agg(jsonb_build_object('rule',rule,'severity',severity,'count',n,'since',since,'last_seen',last_seen,'owner',owner,'action',action,'example',example,'money_inr',money,'orders',orders,'clients',clients) order by score desc, n desc) from ranked),'[]'::jsonb),
  'problems', jsonb_build_object('open',(select count(*) from ex),'critical',(select count(*) from ex where severity='critical'),'high',(select count(*) from ex where severity='high'),'checked_at',(select max(last_seen) from lx_exceptions)),
  'orders', jsonb_build_object(
     'in_pipeline',(select count(*) from o where status not in ('Delivered to client','Delivered to KM')),
     'with_critical',(select count(distinct order_id) from ex where severity='critical' and order_id is not null),
     'by_channel',(select jsonb_object_agg(c,n) from (select case when client in ('KicksMachine','Sourcex') then client else 'Clients' end c, count(*) n from o where status not in ('Delivered to client','Delivered to KM') group by 1) t)),
  'money', jsonb_build_object(
     'to_collect_inr',(select coalesce(sum(payout_inr),0) from o where payout_status not in ('Received','N/A','—') and status<>'To place'),
     'to_collect_orders',(select count(*) from o where payout_status not in ('Received','N/A','—') and status<>'To place'),
     'to_collect_by_channel',(select jsonb_object_agg(c,v) from (select case when client in ('KicksMachine','Sourcex') then client else 'Clients' end c, sum(payout_inr) v from o where payout_status not in ('Received','N/A','—') and status<>'To place' group by 1) t),
     'not_placed_inr',(select coalesce(sum(payout_inr),0) from o where status='To place'),
     'not_placed_orders',(select count(*) from o where status='To place'),
     'link_only_inr',(select coalesce(sum(payout_inr),0) from o where payout_status='Link received'),
     'received_month_inr',(select coalesce(sum(payout_inr),0) from o where payout_status='Received' and coalesce(payout_received::text,'')>=to_char(now() at time zone 'Asia/Kolkata','YYYY-MM-01')),
     'received_month_with_utr_inr',(select coalesce(sum(payout_inr),0) from o where payout_status='Received' and coalesce(payout_received::text,'')>=to_char(now() at time zone 'Asia/Kolkata','YYYY-MM-01') and coalesce(payout_utr,'')<>''),
     'received_no_utr_orders',(select count(*) from o where payout_status='Received' and coalesce(payout_utr,'')=''),
     'unpriced_orders',(select count(*) from o where coalesce(price_usd,0)=0)),
  'decisions', jsonb_build_object('open',(select count(*) from asks),'top',coalesce((select jsonb_agg(a) from (select * from asks order by id desc limit 5) a),'[]'::jsonb)),
  'tickets', jsonb_build_object('open',(select count(*) from lx_b2b where kind='ticket' and coalesce(data->>'status','')<>'done'),'blocked',(select count(*) from ex where rule='ticket_blocked'),'overdue',(select count(*) from ex where rule='ticket_overdue')),
  'agents', jsonb_build_object('failing',(select count(*) from ex where rule like 'agent_%'),'runs_24h',(select count(*) from lx_agent_runs where started_at > now()-interval '24 hours'),
     'last_activity',(select jsonb_object_agg(id, updated_at) from lx_b2b where kind='agent')),
  'freshness', jsonb_build_object(
     'km_sync',(select jsonb_build_object('at',data->>'at','ok',data->'ok') from lx_b2b where kind='meta' and id='kmsync'),
     'sx_sync',(select jsonb_build_object('at',data->>'at','ok',data->'ok') from lx_b2b where kind='meta' and id='sxsync'),
     'checks',(select max(last_seen) from lx_exceptions),
     'recon',(select max(ingested_at) from lx_recon),
     'orders_edit',(select max(updated_at) from lx_b2b where kind='order'))
);
$f$;
revoke execute on function public.lx_command_centre_raw() from public, anon, authenticated;
-- owner-only wrapper used by the portal
create or replace function public.lx_command_centre() returns jsonb language plpgsql stable security definer set search_path=public as $w$
begin
  if not (lx_is_owner() or session_user='postgres') then raise exception 'owner only'; end if;
  return lx_command_centre_raw();
end $w$;
revoke execute on function public.lx_command_centre() from public, anon;
grant execute on function public.lx_command_centre() to authenticated;
