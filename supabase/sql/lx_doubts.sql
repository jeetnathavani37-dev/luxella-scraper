-- Doubts & Investigations (24 Oct 2026). One row per thing the system cannot confidently verify.
-- Filled by lx_doubts_sync() from open agent questions, recon mismatches, unverified claims and duplicate tracking.
-- Never changes an order; resolution goes through the owner (portal) and is recorded with who/when/why.
create table if not exists public.lx_doubts (
  id bigserial primary key,
  source_ref text unique not null,          -- 'ask:<msg id>' | 'exc:<rule>:<ref>'
  source_kind text not null,                -- ask | exception
  category text not null,
  title text not null,
  why text,
  impact_inr numeric,
  order_ids text[] default '{}',
  clients text[] default '{}',
  evidence jsonb default '[]',              -- [{label,text,source,at}]
  conflicts jsonb default '[]',             -- [{field,a:{value,source},b:{value,source}}]
  known jsonb default '[]',
  unknown jsonb default '[]',
  explanations jsonb default '[]',          -- [{text,support}] ranked, never stated as fact
  recommendation text,
  options jsonb default '[]',               -- from the agent question, if any
  needs_approval boolean default true,
  confidence text,                          -- low | medium | high
  confidence_why text,
  priority numeric default 0,
  status text not null default 'open',      -- open | investigating | resolved | false_alarm
  owner text,
  deadline date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  resolved_at timestamptz,
  resolved_by text,
  resolution text,
  history jsonb default '[]'
);
alter table public.lx_doubts enable row level security;
create policy lx_doubts_owner on public.lx_doubts for all using (lx_is_owner()) with check (lx_is_owner());

create or replace function public.lx_doubts_sync() returns jsonb language plpgsql security definer set search_path=public as $f$
declare r record; n_new int:=0; n_upd int:=0; n_closed int:=0; seen text[]:='{}'; cat text; ttl text; ev jsonb; cf jsonb; ex jsonb; amts text[]; imp numeric; cl text[]; oids text[]; pri numeric; conf text; confw text; why text; rec text; kn jsonb; unk jsonb; opts jsonb; own text; dl date; old record;
begin
  if not (lx_is_owner() or session_user='postgres' or current_user='service_role') then raise exception 'owner only'; end if;
  -- 1) open agent questions, grouped when the same agent asks the same thing twice
  for r in
    with a as (
      select id, data, data->>'from' ag, coalesce(nullif(data->>'key',''), data#>>'{q,key}', id) k, data#>>'{q,order_id}' oid, data#>>'{q,text}' q, coalesce(data->>'text','') ctx, coalesce(data->>'at','') at
      from lx_b2b where kind='msg' and data ? 'q' and coalesce(data->>'status','')<>'answered' and coalesce(data->>'from','')<>'auditor')
    select ag, regexp_replace(lower(k),'([-:_]?(\d{4}-\d\d-\d\d|oct\d+))+$','') nk,
           (array_agg(id order by id desc))[1] latest_id, (array_agg(q order by id desc))[1] q, (array_agg(oid order by id desc))[1] oid,
           (array_agg(data#>'{q,options}' order by id desc))[1] opts,
           jsonb_agg(jsonb_build_object('label','Agent '||ag||' asked','text',ctx,'source','msg:'||id,'at',at) order by id desc) ev,
           min(at) first_at, count(*) n
    from a group by 1,2
  loop
    cat := case when (r.nk||' '||r.q) ~* 'proof|credit|utr|pay kiya|pay kar|paisa|advance' then 'Payment / reconciliation'
                when (r.nk||' '||r.q) ~* 'colour|color|\mitem\M|\msize\M|store-order|mismatch|hamilton|landon' then 'Conflicting information'
                when (r.nk||' '||r.q) ~* 'bill' then 'Supplier cost'
                when (r.nk||' '||r.q) ~* 'tracking|awb|courier|box|delivery|haath' then 'Shipment status'
                when (r.nk||' '||r.q) ~* 'retailer_order_id|order no|order number' then 'Missing details'
                when (r.nk||' '||r.q) ~* 'cancel' then 'Decision'
                else 'Unclear information' end;
    select coalesce(sum(payout_inr),0), array_remove(array_agg(distinct client),null) into imp, cl from lx_v_orders where id = r.oid;
    why := case cat when 'Payment / reconciliation' then 'Money is counted as received without bank proof; if wrong, revenue and cash are overstated.'
                    when 'Conflicting information' then 'Two records disagree; the wrong item, size or colour can reach KM or the client.'
                    when 'Supplier cost' then 'Reship cost decides exact profit; until known, profit is an estimate.'
                    when 'Shipment status' then 'Order status may not match reality; client or KM updates may be wrong.'
                    when 'Missing details' then 'Without this, the purchase cannot be proven or tracked.'
                    when 'Decision' then 'Needs your call; the agent cannot decide it.'
                    else 'The agent could not establish this from mail or the portal.' end;
    kn := jsonb_build_array('Agent '||r.ag||' checked mail and portal before asking ('||r.n||' time'||case when r.n>1 then 's' else '' end||').');
    unk := jsonb_build_array(r.q);
    opts := coalesce(r.opts,'[]'::jsonb);
    own := r.ag; dl := (select nullif(data->>'sla_deadline','')::date from lx_b2b where kind='order' and id=r.oid);
    pri := coalesce(imp,0)/1000 + case cat when 'Payment / reconciliation' then 30 when 'Conflicting information' then 25 when 'Decision' then 20 when 'Shipment status' then 15 when 'Supplier cost' then 15 else 10 end
           + greatest(0, extract(epoch from now()-coalesce(nullif(r.first_at,'')::timestamptz, now()))/86400)*2 + case when dl is not null and dl<=current_date then 20 else 0 end;
    perform lx__doubt_upsert('ask:'||r.ag||':'||r.nk,'ask',cat,r.q,why,imp,case when r.oid is null then '{}'::text[] else array[r.oid] end,cl,r.ev,'[]'::jsonb,kn,unk,'[]'::jsonb,
      'Answer the question with the fact; the agent applies it and the guard checks it.',opts,'low','The agent could not verify this from mail or the portal; no second source.',pri,own,dl,r.latest_id);
    seen := seen || ('ask:'||r.ag||':'||r.nk);
  end loop;
  -- 2) exceptions that are doubts by nature
  for r in select e.*, o.payout_inr, o.client from lx_exceptions e left join lx_v_orders o on o.id=e.order_id
           where e.status='open' and (e.rule like 'recon_%' and e.rule<>'recon_no_evidence' or e.rule in ('claim_unverified','dupe_tracking_cross_channel'))
  loop
    amts := array(select (regexp_matches(r.reason,'₹([0-9][0-9,]*[0-9])','g'))[1]);
    cf := '[]'::jsonb; ex := '[]'::jsonb; kn := '[]'::jsonb; unk := '[]'::jsonb;
    if r.rule='recon_amount' then
      cat := 'Payment / reconciliation';
      cf := jsonb_build_array(jsonb_build_object('field','payout','a',jsonb_build_object('value','₹'||amts[1],'source',case when r.ref like 'order_mail%' then 'Order mail' else 'MRN sheet '||split_part(r.ref,':',2) end),'b',jsonb_build_object('value','₹'||amts[2],'source','Portal payout')));
      ex := jsonb_build_array(jsonb_build_object('text','Typo or two rows swapped on the sheet/mail','support','Common when a batch total still matches what was paid'),
                              jsonb_build_object('text','Portal payout entered wrong','support','Check the bid won amount on KM / Sourcex'),
                              jsonb_build_object('text','Price changed after the order','support','Look for a later mail changing the payout'));
      kn := jsonb_build_array('Two sources give different amounts for the same order.');
      unk := jsonb_build_array('Which amount was actually paid or will be paid.');
      conf := 'high'; confw := 'Both amounts are read directly from their sources; only the cause is unknown.';
    elsif r.rule='recon_sum' then
      cat := 'Payment / reconciliation'; conf:='high'; confw:='Arithmetic on the sheet rows.';
      cf := jsonb_build_array(jsonb_build_object('field','batch total','a',jsonb_build_object('value','₹'||amts[1],'source','Sum of rows'),'b',jsonb_build_object('value','₹'||amts[2],'source','TOTAL line on the sheet')));
      ex := jsonb_build_array(jsonb_build_object('text','A row amount is wrong, the total is right','support','If the bank credit equals the TOTAL'),jsonb_build_object('text','The total is wrong','support','If the bank credit equals the row sum'));
      kn := jsonb_build_array('Sheet rows and TOTAL disagree.'); unk := jsonb_build_array('Which row is wrong.');
    elsif r.rule='recon_unlinked' then
      cat := 'Payment / reconciliation'; conf:='medium'; confw:='Credit is real (bank mail); the order match is a guess by amount.';
      ex := jsonb_build_array(jsonb_build_object('text','Pays the possible match named in the reason','support','Amount matches'),jsonb_build_object('text','Pays several orders together','support','Batch payouts are common'));
      kn := jsonb_build_array('A payout with this UTR reached the bank.'); unk := jsonb_build_array('Which order(s) it paid.');
    elsif r.rule='claim_unverified' then
      cat := 'Failed agent action'; conf:='medium'; confw:='Ticket says done; no matching field change in the log.';
      ex := jsonb_build_array(jsonb_build_object('text','Agent did the work but did not save the change','support','Common when a write was blocked or skipped'),jsonb_build_object('text','Agent claimed work it did not do','support','No evidence of a change'));
      kn := jsonb_build_array('The ticket was closed as done.'); unk := jsonb_build_array('Whether the order really changed.');
    else
      cat := 'Possible duplicate'; conf:='medium'; confw:='Same tracking number on orders in two channels.';
      ex := jsonb_build_array(jsonb_build_object('text','Both orders shipped in one shared box','support','Normal for clubbed parcels'),jsonb_build_object('text','Tracking pasted on the wrong order','support','Check store mails for each order'));
      kn := jsonb_build_array('Two orders carry the same tracking.'); unk := jsonb_build_array('Whether that is a shared box or a mistake.');
    end if;
    oids := case when r.order_id is null then '{}'::text[] else string_to_array(replace(r.order_id,' + ',','),',') end;
    select coalesce(sum(payout_inr),0), array_remove(array_agg(distinct client),null) into imp, cl from lx_v_orders where id = any(oids);
    if coalesce(imp,0)=0 and array_length(amts,1)>=1 then imp := replace(amts[array_length(amts,1)],',','')::numeric; end if;
    why := case cat when 'Payment / reconciliation' then 'If the wrong figure is used, payout or profit is wrong.' when 'Failed agent action' then 'The portal may say done while the order is unchanged.' else 'Could double-count an order or ship the wrong parcel.' end;
    ev := jsonb_build_array(jsonb_build_object('label','Check '||r.rule,'text',r.reason,'source','exception:'||r.id,'at',r.created_at));
    pri := coalesce(imp,0)/1000 + case cat when 'Payment / reconciliation' then 30 when 'Failed agent action' then 20 else 15 end + extract(epoch from now()-r.created_at)/86400*2;
    perform lx__doubt_upsert('exc:'||r.rule||':'||r.ref,'exception',cat,r.reason,why,imp,oids,cl,ev,cf,kn,unk,ex,r.action,'[]'::jsonb,conf,confw,pri,r.owner,null,null);
    seen := seen || ('exc:'||r.rule||':'||r.ref);
  end loop;
  -- 3) a doubt whose source closed elsewhere is resolved, with that fact recorded
  update lx_doubts set status='resolved', resolved_at=now(), resolved_by=coalesce(resolved_by,'system'),
    resolution=coalesce(resolution,'Source closed: the question was answered or the check passed.'), updated_at=now(),
    history = history || jsonb_build_array(jsonb_build_object('at',now(),'by','system','what','source closed'))
  where status in ('open','investigating') and not (source_ref = any(seen));
  get diagnostics n_closed = row_count;
  return jsonb_build_object('open',(select count(*) from lx_doubts where status in ('open','investigating')),'closed_now',n_closed,'at',now());
end $f$;

create or replace function public.lx__doubt_upsert(p_ref text,p_kind text,p_cat text,p_title text,p_why text,p_imp numeric,p_oids text[],p_cl text[],p_ev jsonb,p_cf jsonb,p_kn jsonb,p_unk jsonb,p_ex jsonb,p_rec text,p_opts jsonb,p_conf text,p_confw text,p_pri numeric,p_owner text,p_dl date,p_msg text)
returns void language plpgsql security definer set search_path=public as $f$
begin
  insert into lx_doubts(source_ref,source_kind,category,title,why,impact_inr,order_ids,clients,evidence,conflicts,known,unknown,explanations,recommendation,options,confidence,confidence_why,priority,owner,deadline,history)
  values (p_ref,p_kind,p_cat,p_title,p_why,p_imp,p_oids,coalesce(p_cl,'{}'),p_ev,p_cf,p_kn,p_unk,p_ex,p_rec,jsonb_build_object('msg',p_msg,'list',p_opts),p_conf,p_confw,p_pri,p_owner,p_dl,
          jsonb_build_array(jsonb_build_object('at',now(),'by','system','what','opened')))
  on conflict (source_ref) do update set category=excluded.category,title=excluded.title,why=excluded.why,impact_inr=excluded.impact_inr,order_ids=excluded.order_ids,clients=excluded.clients,
    evidence=excluded.evidence,conflicts=excluded.conflicts,known=excluded.known,unknown=excluded.unknown,explanations=excluded.explanations,recommendation=excluded.recommendation,
    options=excluded.options,confidence=excluded.confidence,confidence_why=excluded.confidence_why,priority=excluded.priority,owner=excluded.owner,deadline=excluded.deadline,updated_at=now(),
    status = case when lx_doubts.status='resolved' then 'open' else lx_doubts.status end,
    history = case when lx_doubts.status='resolved' then lx_doubts.history || jsonb_build_array(jsonb_build_object('at',now(),'by','system','what','reopened: source still open')) else lx_doubts.history end;
end $f$;
revoke execute on function public.lx__doubt_upsert(text,text,text,text,text,numeric,text[],text[],jsonb,jsonb,jsonb,jsonb,jsonb,text,jsonb,text,text,numeric,text,date,text) from public, anon, authenticated;
revoke execute on function public.lx_doubts_sync() from public, anon;
grant execute on function public.lx_doubts_sync() to authenticated;
-- hourly, after checks (:17), recon (:27), claim check (:37)
-- select cron.schedule('lx-doubts-sync','39 * * * *','select lx_doubts_sync()');
