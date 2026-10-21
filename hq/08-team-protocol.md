# Team protocol — agents ek doosre se kaise jude hain

Sab agents ek hi office (table `lx_b2b`) me kaam karte hain. **Har run ki shuruaat me:**
1. Apna handbook padho (prompt me diya SQL).
2. **Baaki sab agents ki rows padho**: `select id, data->>'summary', data->'items', data->'handoffs', data->>'last_run' from lx_b2b where kind='agent';` — dusron ne kya pakda, kya tumhare liye chhoda (`handoffs` jisme `to` = tumhara id).
3. KM link status padho: `meta/kmsync` (+ `kind='km'` rows jab zaroorat ho).
4. Portal notes padho: `kind='note'` jinka `data->>'status'='new'` (Jeet ne chat box me jo daala) — sirf Mail agent process karta hai, baaki sirf context ke liye.

**Handoffs (ek agent → doosre agent):** apni agent row me `handoffs: [{to:'tracking'|'pricing'|'ops'|'payout'|'mail'|'auditor'|'reconciler', order_id, text}]` likho jab koi kaam doosre desk ka ho. Jis agent ke liye hai wo agle run me usse handle kare aur apni items me "handoff done: …" likhe.

**Ek hi baat do baar mat bolo:** agar doosra agent same order ka same issue already report kar chuka hai (uski items me), to sirf tab repeat karo jab tumhare paas naya info ho.

**Source of truth order:** KM Nexus (`kind='km'`) for KM-side status/SLA/payout/cancel → KM receiving-confirmation **mails** for confirmation → MRN Google Sheet (read-only) for MRN/received → store/courier mails & AfterShip for movement → Jeet ki entries.

**Ignore list:** KM ka "Awaiting pickup" / pickup / Shiprocket wala status — ye hamare liye meaningless hai (hum khud courier karte hain). Isko kabhi issue ya action mat banao.

**Push discipline:** final reply = Jeet ke phone pe push. Sirf naya/urgent. Pichhle run jaisa same → ek line.
