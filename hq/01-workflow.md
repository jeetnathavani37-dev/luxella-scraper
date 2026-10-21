# Workflow A–Z (har KM order ka safar)

Har step: **kya hota hai → kaunsa field → kaun dekhta hai → kab late maana jaaye**.

| # | Step | Field(s) set | Owner | Late if |
|---|---|---|---|---|
| 1 | Bid won (mail) | bid row + order `status='To place'`, `order_date`, `payout` | Mail agent | — |
| 2 | Price check | `price_check{…}`, `landed`, `est_weight` | Pricing agent | bid ke 2h baad bhi nahi |
| 3 | Accept + buy at store | `retailer_date`, `store`, `retailer_order_id` → `Ordered` | **Jeet** | accept window (24h) khatam hone se 4h pehle tak nahi |
| 4 | KM portal update (order + retailer ID) | `km_portal_updated` | **Jeet** | order ke 1 din baad bhi nahi |
| 5 | Reshipper receiver form | `form_filled='Yes'`, `form_date`, `reshipper` | **Jeet** | store ship hone tak nahi |
| 6 | Store shipped | `retailer_tracking`, `retailer_carrier`, `retailer_ship_date` → `In transit to reshipper` | Mail / Tracking agent | order ke 3 din baad tracking nahi |
| 7 | Reached reshipper | `delivered_reshipper`, `actual_weight` → `At reshipper` | Tracking / Mail agent | ship ke 10 din baad bhi nahi |
| 8 | Reshipper → India | `reship_awb`, `shipped_reshipper` → `Shipped from hub` | **Jeet** (reshipper bolta hai) | hub pe 5+ din (Ishaan: 1 kg stack ho gaya to turant) |
| 9 | Landed India | `landed_india` → `Landed India` | Tracking agent | AWB ke 8 din baad bhi nahi |
| 10 | Courier to KM | `km_courier`, `km_tracking`, `shipped_km` → `Shipped to KM` | **Jeet** | land ke 1 din baad bhi nahi |
| 11 | KM received | `delivered_km` → `Delivered to KM` | Tracking / Mail agent | ship ke 4 din baad bhi nahi |
| 12 | MRN update (KM portal) | `mrn_updated` | **Jeet** | deliver ke 1 din baad bhi nahi |
| 13 | KM receiving confirmation mail | `mrn_confirmed`, `payout_timer` (7-day timer start) | Mail agent | MRN ke 3 din baad bhi nahi → KM operations ko poochna |
| 14 | Payout | `payout_status='Received'`, `payout_date` | Payout agent / Jeet | confirmation + 7 din |
| — | Chase | `payout_chased` (Jeet tick karta hai) | Payout agent drafts | overdue |

## Status ladder (sirf aage)
`To place → Ordered → In transit to reshipper → At reshipper → Shipped from hub → Landed India → Shipped to KM → Delivered to KM` ( + `Cancelled` kabhi bhi).
Status = sabse aage wali date: retailer_date→Ordered, retailer_ship_date/retailer_tracking→In transit to reshipper, delivered_reshipper→At reshipper, shipped_reshipper→Shipped from hub, landed_india→Landed India, shipped_km→Shipped to KM, delivered_km→Delivered to KM.

## Combined orders
Ek store order / ek tracking me kai KM orders ho sakte hain (same `retailer_order_id` ya `retailer_tracking`). Unhe **ek parcel** maano: tracking/delivered update sab pe ek saath; reshipper same hona chahiye.

## KM SLA
`sla_deadline` (KM export se). KM dashboard: Day 0 processing → Day 8 "Check cancellation" (normal, pass) → Day 12 on track → Day 15 awaiting update → Day 17 delay risk → Day 22 delayed. SLA cross ho ya 2 din bache → KM ko proactive update.

## Portal tabs = stages (Oct 2026)
| Tab | Orders (status) | Next action | Kaun |
|---|---|---|---|
| Orders placed | To place → Ordered | store pe order + store order no. | Jeet (Pricing agent GO/NO deta hai) |
| Intl transit | Ordered, In transit to reshipper | tracking daalo → warehouse pahuncha | Mail/Tracking agent + AfterShip auto |
| Warehouse | At reshipper | form fill (Copy form) → dispatch bolo → "Warehouse se nikla" (+AWB) | Jeet + Ops drafts |
| Reshippers | sab | rate card, kitna dena baaki, paid mark | CFO + Jeet |
| Landed India | Shipped from hub | "India landed" (single / bulk / "sab Ishaan landed") | Brain (notes) + AfterShip auto |
| To KicksMachine | Landed India, Shipped to KM | courier tracking → KM pahuncha | Tracking + KM sync (KM delivered = delivered_km) |
| MRN | Delivered to KM, no confirmation | MRN updated (Jeet sheet me) → confirmation aaya | Jeet + Payout/Reconciler |
| Confirmation / Payouts / Money | … | 7-day timer, chase, CFO | Payout + CFO |
| Alerts | kuch bhi atka | SLA crossed, KM problem/cancel, tracking exception, X din se atka, payout overdue | Auditor/QA dekhte hain |
