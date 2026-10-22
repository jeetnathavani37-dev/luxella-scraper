# Team protocol — agents ek doosre se kaise jude hain

Sab agents ek hi office (table `lx_b2b`) me kaam karte hain. **Har run ki shuruaat me:**
0. **Central brain + SOPs padho (zaroori, har agent):** `select id, data->>'md' from lx_b2b where kind='doc' and id in ('central-brain','sops','operating-principles','brand') order by data->>'order';` — operating bar, confidence rule, SOP done-definitions, aur drafts ke liye brand voice yahin se.
1. Apna handbook padho (prompt me diya SQL).
2. **Baaki sab agents ki rows padho**: `select id, data->>'summary', data->'items', data->'handoffs', data->>'last_run' from lx_b2b where kind='agent';` — dusron ne kya pakda, kya tumhare liye chhoda (`handoffs` jisme `to` = tumhara id).
3. KM link status padho: `meta/kmsync` (+ `kind='km'` rows jab zaroorat ho).
4. Portal notes padho: `kind='note'` jinka `data->>'status'='new'` (Jeet ne chat box me jo daala) — Brain agent process karta hai (Mail = backup jab 3h+ pending), baaki sirf context ke liye.

**Handoffs (ek agent → doosre agent):** apni agent row me `handoffs: [{to:'tracking'|'pricing'|'ops'|'payout'|'mail'|'auditor'|'reconciler'|'brain'|'cfo'|'qa', order_id, text}]` likho jab koi kaam doosre desk ka ho. Jis agent ke liye hai wo agle run me usse handle kare aur apni items me "handoff done: …" likhe.

**Ek hi baat do baar mat bolo:** agar doosra agent same order ka same issue already report kar chuka hai (uski items me), to sirf tab repeat karo jab tumhare paas naya info ho.

**Source of truth order:** KM Nexus (`kind='km'`) for KM-side status/SLA/payout/cancel → KM receiving-confirmation **mails** for confirmation → MRN Google Sheet (read-only) for MRN/received → store/courier mails & AfterShip for movement → Jeet ki entries.

**Ignore list:** KM ka "Awaiting pickup" / pickup / Shiprocket wala status — ye hamare liye meaningless hai (hum khud courier karte hain). Isko kabhi issue ya action mat banao.

**Push discipline:** final reply = Jeet ke phone pe push. Sirf naya/urgent. Pichhle run jaisa same → ek line.

**Operating bar:** central-brain §2 (ownership, truth, no silent failures) aur §5 (confidence rule) har decision pe lagu. SOPs (`sops` doc) = har step ka done-definition.


## Step 0b (har agent, har run — Oct 2026)
- Docs `system-handbook`, `learning-loop`, `lessons` bhi padho: `select id, data->>'md' from lx_b2b where kind='doc' and id in ('system-handbook','learning-loop','lessons');`
- `meta/patterns` padho — "late" decide karne ke liye p80 use karo.
- Run ke end me: kuch naya seekha / galti pakdi → `lessons` doc ke end me ek dated line append karo (update lx_b2b set data=jsonb_set(data,'{md}',to_jsonb((data->>'md')||E'\n- <date> · <agent> · <lesson>')) where kind='doc' and id='lessons').
- World-class bar: har output me "so what?" — sirf data nahi, next action + kaun + kab. Har number SQL se. Har claim ka proof (mail id / km row / photo).

## 💬 Inbox — sab baat portal ke andar (Oct 2026)
Jeet ko report / sawaal / alert **sirf B2B portal ke Inbox** me jaata hai (https://luxella-b2b.vercel.app → Inbox). Scheduled run ka final reply sirf ek line: `✓ <agent>: Inbox me post kiya` (koi detail nahi — wo Claude app me notification banta hai, Jeet wahan nahi chahta).

**Table:** `lx_b2b` kind='msg', id = `'m-'||to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS')||'-'||<agent>` (sort ke liye time-based).
`data = {thread, from, text, at, items?, go?, notify?, urgent?, status?, read:false}`
- `thread`: `'<tumhara id>'` = Jeet ke saath tumhara personal DM · `'group'` = HQ Room (saare agents + Jeet).
- `from`: tumhara agent id (brain, mail, pricing, tracking, ops, payout, cfo, reconciler, auditor, qa). Jeet ke messages me `from='jeet'`.
- `text`: Hinglish, max ~8 lines, "kya hua → kya karna hai → kab tak". `items`: `[{order_id, level:'action'|'warn'|'info', text}]` (order IDs tap karke khulte hain). `go`: portal tab id (todos, wh, payouts, money, alerts…) agar seedha wahan bhejna ho.
- `notify:true` → Jeet ke phone pe push (har ghante :07 pe jaata hai). Sirf: subah/shaam ki briefing (Ops), payout/paisa ka important (Payout/CFO), system down (QA), aur Jeet ke sawaal ka jawab. `urgent:true` → 🔴 push — sirf jab aaj action nahi liya to paisa/order ka nuksaan (SLA aaj, accept-by aaj, payout 10+ din, site down).

**Har run:**
1. **Pehle padho:** `select id,data from lx_b2b where kind='msg' and data->>'from'='jeet' and coalesce(data->>'status','new')='new' and (data->>'thread'='<tumhara id>' or (data->>'thread'='group' and (data->>'text' ilike '%@<tumhara id>%' or <tumhara kaam se related>)))` → kaam karo, phir usi thread me jawab post karo, aur Jeet ke msg pe `status='done'` (data || '{"status":"done"}').
2. **End me post karo:** apne DM me run ka report (sirf jab kuch naya/badla — "kuch naya nahi" wale runs me post mat karo, spam nahi). Jo baat doosre agent ya poori team ke kaam ki hai → `group` me (@agent mention karke). Handoff = group me @agent + `handoffs` field dono.
3. Group me roz: Ops subah 8:41 "Aaj ka plan" + shaam 7:41 "Din ka wrap" (notify:true). CFO 9:37pm paisa summary (notify:true). Baaki sirf zaroorat pe.
4. Kabhi bhi Jeet ko kisi aur jagah (mail/WhatsApp/Claude app) message mat bhejo.

## 🤝 Agent-to-agent coordination (team ki tarah kaam)
Agents ek doosre se **Inbox ke HQ Room (`thread='group'`)** me baat karte hain — Jeet sab dekh sakta hai.
- **Kaam dena / sawaal poochna:** group me post karo with `to:['<agent id>',…]` + text me `@<agent>`. Example: Tracking → `{"thread":"group","from":"tracking","to":["ops","clientdesk"],"text":"@ops @clientdesk US108749 Ishaan se landed — client ko update bhejna hai"}`.
- **Har run ke shuru me padho (Jeet ke msgs ke saath):**
  `select id,data from lx_b2b where kind='msg' and data->>'from'<>'<tumhara id>' and (data->'to' ? '<tumhara id>' or data->>'text' ilike '%@<tumhara id>%') and not coalesce(data->'seen_by','[]'::jsonb) ? '<tumhara id>' and (data->>'at')::timestamptz > now()-interval '3 days' order by data->>'at';`
  Handle karo, phir mark: `update lx_b2b set data = jsonb_set(data,'{seen_by}', coalesce(data->'seen_by','[]'::jsonb) || '["<tumhara id>"]') where kind='msg' and id='<id>';`
  Jawab chahiye to group me hi reply (`to:[sender]`, `reply_to:'<msg id>'`).
- **Kaun kiska kaam:** naya bid/price → pricing · mail/order data → mail · parcel/landed/AfterShip → tracking · MRN/confirmation/payout → payout · KM vs portal mismatch → reconciler · paisa/bank → cfo · client portal (end clients) → clientdesk · notes/photos/naye client orders → brain · aaj ki priority → ops · galti/missing → auditor · system → qa.
- **Ek kaam ek owner:** handoff ke baad wahi agent us order ko finish karega; doosra sirf follow-up. Duplicate kaam mat karo — pehle group padho ki koi aur already kar raha hai.
- **Ops = team lead:** briefing me open handoffs (jo 6h+ se kisi ne seen nahi kiya) list karo aur owner ko @mention karo. Auditor: 24h+ purane unseen handoffs = finding.
- Jeet ke messages ka mark `status='done'` hi rahega (Jeet ke liye). Agent-to-agent msgs me `seen_by` use karo.

## 👥 End clients (client portal) — sab agents ko pata ho
Client portal (luxellaclients.duckdns.org/<slug>) pe clients khud kaam karte hain: naya order place (`lx_orders.data.placed_by='client'`), cancel request (`data.cancel_request='pending'`), payment proof (`lx_docs` collection `paysub`), support chat (`case_msgs` from client / `cases`), address (`addresses`), photos/notes.
**Client Desk agent** ye sab har ghante padhta hai aur Inbox thread `clients` + group me summary daalta hai. Agar kisi client order ka kaam B2B side pe hai (place karna, tracking) to wo group me @ops/@tracking ko handoff karta hai. Client ko kuch bhi bhejna = sirf draft (Jeet admin se bhejega). Client-facing text me hamesha "Luxella", kabhi "Jeet"/reshipper/KM/cost/margin nahi.
