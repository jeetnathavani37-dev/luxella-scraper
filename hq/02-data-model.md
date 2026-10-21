# Data model — table `lx_b2b`
`lx_b2b(kind text, id text, data jsonb, updated_at timestamptz)`, primary key `(kind, id)`. Supabase project `qzripzgbstvxkfobzhyv`.

## kind='order' (id = KM order no., e.g. `US110930`, `US109141-A`)
client (`'KicksMachine'` = B2B; other values are WhatsApp clients — B2B agents skip them), order_id, item, brand, size, payout (INR number), order_date, status, payout_status (`Pending`/`Received`), source,
store, retailer_order_id, retailer_date, country (USA/UK/Canada), km_portal_updated, reshipper, form_filled (`Yes`), form_date,
retailer_tracking (+ mirror `intl_tracking`), retailer_carrier, retailer_ship_date, eta_reshipper, delivered_reshipper, actual_weight, est_weight, reship_cost, reship_awb, shipped_reshipper, eta_india, landed_india,
km_courier, km_tracking (+ mirror `local_tracking`), shipped_km, delivered_km, mrn_updated, mrn_confirmed, km_received_date, km_mrn_date, payout_timer, payout_chased, payout_date,
sla_deadline, km_status, km_tracking_status, image, km_sku,
price_check `{checked_at, store, url, price_usd, currency, sale_note, est_kg, landed_inr, margin_pct, verdict GO|TIGHT|NO|CHECK, note}`, landed, profit, profit_pct, notes, snooze_until.

## kind='bid' (id = first KM order no.)
km_order_ids[], items[{name,brand,size,colour,qty}], payout_inr, won_at, accept_by, accept_by_date, gmail_thread_id, dismissed.

## kind='buy' (store order; id = `<Store_With_Underscores>-<order no>`)
store, store_order_no, order_date, recipient, ship_to, items[{name,size,colour,qty,price_usd}], total_usd, currency, status (`ordered`/`shipped`/`delivered`/`cancelled`), carrier, tracking_numbers[], ship_date, delivered_date, km_ids[], country, gmail_thread_ids[].

## kind='agent' (id = mail | pricing | tracking | ops | payout | auditor)
`{name, last_run (ISO), status ok|error, summary, items[{order_id, level action|warn|info, text}], drafts[{to, label, text}], history[{at, summary}] (last 10)}` — replaced fully every run.

## kind='doc' (id = handbook page)
`{title, md, updated}` — yeh handbook. Agents read; sirf founder/Claude edit.

## kind='meta'
`mailsync {at, summary, seen[] (last 500 Gmail message ids)}`.

## SQL patterns
- Read: `select id, data from lx_b2b where kind='order' and data->>'client'='KicksMachine';`
- Merge: `update lx_b2b set data = data || '{"x":"y"}'::jsonb, updated_at=now() where kind='order' and id='US…';`
- Agent row (last_run hamesha DB clock se, khud time mat likho):
  `insert into lx_b2b(kind,id,data,updated_at) values('agent','<id>', jsonb_set('<json>'::jsonb,'{last_run}',to_jsonb(now())), now()) on conflict (kind,id) do update set data=excluded.data, updated_at=now();`
- Aaj ki date / time: `select now() at time zone 'Asia/Kolkata';` — hamesha isse lo, andaza mat lagao.
- JSON me single quote `'` ko `''` likho.
