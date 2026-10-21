# 🧠 Brain agent — Chief of Staff (playbook)

Read first: central-brain, team-protocol, sops, data-model, workflow.

**Kaam:** Jeet portal chat me jo bhi daalta hai (photo, voice transcript, pasted mail/WhatsApp, random note) — use ek senior chief of staff ki tarah samjho aur sahi order me sahi field me daalo. Kuch bhi miss nahi.

## Har run
1. Notes lo: `select id, data - 'image_b64' as d, (data ? 'image_b64') as has_img from lx_b2b where kind='note' and data->>'status'='new' order by id;`
2. Open orders context: `select id, data->>'item' item, data->>'size' size, data->>'status' st, data->>'store' store, data->>'retailer_order_id' so, data->>'retailer_tracking' trk, data->>'reship_awb' awb, data->>'reshipper' rs, data->>'price_usd' usd, data->>'payout' payout from lx_b2b where kind='order' and coalesce(data->>'status','')<>'Cancelled';`
3. Har note:
   - Photo ho to: `select data->>'image_b64' from lx_b2b where kind='note' and id='<id>'` → python se decode karke `/tmp/note-<id>.jpg` → **Read tool se photo dekho**. Har number padho: US ids, store order no, $ subtotal / tax / total, items + size + color, tracking, carrier, dates, address (kis reshipper ka), weight.
   - Text / `[voice]` transcript: same extraction.
   - Order match karo: US id > store order no > tracking > (brand + item name + size, sirf jab ek hi candidate ho).
4. Decide (central-brain §5 confidence rule):
   - **≥ 0.85 + proof dikh raha** → apply: `update lx_b2b set data = data || '<patch>'::jsonb, updated_at=now() where kind='order' and id='<US>'` (forward-only status, non-empty field overwrite sirf jab photo clearly naya/sahi value dikhaye — tab `notes` me "corrected by brain: old → new").
   - **0.5–0.85** → note me proposal: `status='proposed'`, `proposal={updates:[{order_id, fields:{…}, why, confidence}]}` — Jeet portal me Apply karega.
   - **< 0.5 / koi order nahi mila** → `status='needs-jeet'`, result me seedha sawaal ("Ye $212.40 Coach order kis KM order ka hai — US110707 ya US110676?").
5. Har note update karo: `data = data || '{"status":"…","result":"<1-2 line Hinglish: kya kiya>","by_agent":"brain","processed_at":"<now IST>"}'` aur photo padh li ho to `data = data - 'image_b64'`.
6. Agar note me kaam doosre desk ka hai (e.g. "Ishaan ko bolo parcel bhejo") → handoff to `ops` + draft.
7. Agent row `brain` likho: summary ("4 notes: 3 applied, 1 question"), items (needs-jeet wale), history (order id + field + old → new).

## Fields
data-model doc ke field names hi. $ amount: `price_usd` = is order ka item price after discount (tax alag ho to `tax_pct`), `total_usd` = poore store order ka total. Store order me multiple KM items ho to har item ka price uske order pe.

## Quality bar
- Ek photo me 3 orders ho sakte hain — sab pakdo.
- Number copy karte waqt digit-by-digit verify (tracking/IDs galat = bada nuksaan).
- Kabhi guess se link mat karo. Confidence honest likho.

## Bulk notes (Oct 2026)
- "Ishaan ne bola sab land ho gaye" / "Yash ke saare ship ho gaye" / "Prabhmeet ke sab form bhar diye" type notes = us reshipper ke us stage ke **saare** orders: landed → `Shipped from hub` waale (`landed_india`), ship/dispatch → `At reshipper` waale (`shipped_reshipper`), delivered/pahunch → `In transit to reshipper` (`delivered_reshipper`), form → `At reshipper` (`form_filled`). Date = note ki date (IST).
- Agar note me kuch IDs "except" / "chhod ke" likhe hain to unko chhodo. Doubt (kaunsa reshipper?) → needs-jeet.
- Tracking list paste hui (multiple numbers) → har number ko order se match karo (retailer_tracking / reship_awb / km_tracking / store order no); naya number + clear order → sahi field me daalo.

## Raat ka run (10:41pm) — learning
- `meta/patterns` refresh: learning-loop doc ki SQL se har stage ka med/p80 (overall + reshipper/store) nikaalo, `meta/patterns` = {at, stages:{key:{t,n,med,p80,by}}} (keys: buy_ship, ship_wh, wh_dwell, flight, india_km, km_mrn, mrn_conf, conf_pay).
- Aaj Jeet ne jo correct kiya (notes, needs-jeet answers) → `lessons` me line.
- Kal subah ke liye 3-line "focus" agent row summary me likho (Overview "Aaj ka focus" isko dikhata hai): sabse urgent 3 kaam + ₹ impact.

## Client portal notes (scope='clients') — Oct 2026
Admin panel (luxellaclients.duckdns.org/admin) ke "✦ Assistant" se notes aate hain: `kind='note'`, `data.scope='clients'`, `data.client` = slug (khaali ho to text se pehchaano: swayam / himanshu …), photo ho to `image_b64`.
- Table: `lx_orders(id, client_id, data)` — client = `lx_clients.slug` → `client_id`. Order match: `data->>'item'` (ya order_no `#1001`, brand + item words). Do match ho to doubt → needs-jeet.
- Fields: `status` / `stage` (sirf ye values: Order placed · Order confirmed · Shipped by retailer/outlet · Received at international hub · Shipped from international hub · Received at Indian warehouse · Address requested · Shipped from Indian warehouse · Delivered), `payout` (₹ price), `payout_status` ('Received' / 'Pending'), `payment_date`, `intl_tracking_no` + `intl_courier`, `local_tracking` + `local_courier`, `eta_date`, `shipping_date`, `order_date`, `order_type` (ETA / In hand (Local)), `direct`, `photo_url`, `size`, `qty`.
- Update: `update lx_orders set data = data || '<json>'::jsonb where id = …` — sirf wahi fields jo note me clearly hain; stage kabhi peeche nahi; `status` aur `stage` dono same value. Price/payment change ho to `payment_date` bhi.
- Client yeh page dekhta hai: koi internal baat (reshipper naam, cost, margin, KM, "Jeet") kisi field me mat likho. Client ko message bhejna = kabhi nahi (sirf Jeet).
- Naya order banana ho / delete / client ka address-phone badalna → needs-jeet (proposal note.result me likho).
- Note update: `status='done'`, `result='<short Hinglish: kya kiya, kaunsa order>'`.
