# Client quote formula + US outlet sourcing (har agent ke liye)

Read with: pricing (04), reshippers (05), brand (30).

## 1. Landed cost (INR) — same as bid pricing
**landed = price × (1 − discount) × (1 + tax) × FX + reship + ₹150 domestic**
- FX: USD 95.5 · CAD 70 · GBP 129 (card markup included).
- discount: Michael Kors first-order 10% only if a new account is used; sale price on the page = use it, discount 0. Coupon codes NEVER counted.
- tax: 0 via Delaware (Ishaan / Yash). Prabhmeet NJ = 7%.
- reship: est kg × ₹1,250. Client quotes assume stacking → kg rounded UP to 0.5, minimum 0.5 kg.
- Weight guide (kg): wallet/belt/cap 0.3 · small crossbody 0.6 · medium bag 0.9 · large tote 1.2 · sneakers/sandals 1.2 · boots 1.8 · clothing 0.5 · watch 0.4.

## 2. Client price (what the client sees)
- **quote = round UP to ₹100 of (landed × 1.25)**, so target margin is 25%.
- **Hard floor: margin ≥ 20% after reshipping.** margin % = (quote − landed) / landed × 100.
- Reseller clients see their own margin on top (portal does this automatically). Never show landed, FX, reshipper, store name or the word "outlet" to a client.

## 3. Where to search (official / outlet only)
michaelkors.com (+ outlet section), coachoutlet.com, coach.com, katespadeoutlet.com, katespade.com, toryburch.com, ralphlauren.com, marcjacobs.com, karl.com, tedbaker.com, armani.com, drmartens.com, ugg.com, jwpei.com, lululemon.com, shop.simon.com (Simon Premium Outlets).
Never: eBay, Poshmark, Mercari, Amazon 3rd-party, Farfetch resellers, StockX.
Exact match only: brand + model + colour + size. Note stock / sale end.

## 4. The Collection (lx_catalog) — margin guard
- Collection price = partner source price − 15%. That is only safe if we can source the piece cheaper.
- Guard agent checks outlet-brand pieces: find the official/outlet USD price → landed → margin vs the Collection price.
  - margin ≥ 20% → keep (save check).
  - margin < 20% → set `active=false` (hide). Note it in the run summary.
  - not found → keep, mark `unverified`. When a client reserves an unverified piece, Client Desk confirms price first and tells the client politely if it changes ("the price for this piece has been updated to ₹X").
- Checks are saved privately in `lx_catalog_src.chk` = {at, store, url, usd, kg, landed, our_price, margin, verdict}.

## 5. Live search for clients
- Portal "Search US boutiques" → edge function `lx-source` → results with quote (needs the AI key for live Google search).
- No AI key / nothing found → a job is queued (`lx_b2b` kind `srcjob`) and the Sourcing Desk agent answers within the hour with a draft post.

## 6. Michael Kors — hamesha MK Outlet se compare (Jeet, 2026-10-28)
- Har Michael Kors piece ka price PEHLE https://www.michaelkors.com/outlet/ pe dhoondho (exact model + colour). Wahi landed ka base hai.
- Outlet pe na mile tabhi michaelkors.com (full price / sale) dekho, aur note me likho "not on outlet".
- Tracking/affiliate parameters wale links kabhi save mat karo — sirf clean product URL.
