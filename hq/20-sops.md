# 📘 Luxella SOPs — Standard Operating Procedures (B2B / KicksMachine)

> Har step ka owner, trigger, done-definition aur SLA. Agents isko checklist ki tarah use karte hain. "Done" ka matlab = DB me field bhara hua.

## SOP-01 · Bid aaya → accept decision
- **Trigger:** KM "You won the bid" / "Admin placed an order" mail, ya KM mirror me naya assigned order.
- **Owner:** Pricing agent (analysis) → Jeet (accept).
- **Steps:** item + size se store dhundho (official outlet / brand site / Simon) → $ price + tax (NJ 7%, DE 0%) + reshipper (weight) + FX → landed ₹ → margin vs payout.
- **Rule:** margin ≥ 20% = GO · 12–20% = Jeet decide · < 12% = NO.
- **Done:** `price_check` filled on bid/order; Jeet ne KM pe accept kiya → order status `To place`.
- **SLA:** accept deadline (`km_accept_by`) se 4 ghante pehle decision.

## SOP-02 · Store pe order place
- **Owner:** Jeet. Agents: reminder + store link + cheapest route.
- **Steps:** naya email account (welcome discount) → Niyo DCB card → ship-to = chosen reshipper → confirmation mail.
- **Done:** `retailer_order_id`, `store`, `price_usd`, `retailer_date`, `reshipper` → status `Ordered`.
- **SLA:** accept ke 24 ghante ke andar. Order-photo bhejo to Brain agent fields bhar dega.

## SOP-03 · KM portal update (store order + tracking)
- **Owner:** Jeet (KM portal). Agents verify via mirror (`km_portal_store_order`, `km_portal_tracking`).
- **Done:** KM mirror me store order + tracking dikh raha. Galat ho to Reconciler ACTION.

## SOP-04 · Store → reshipper
- **Owner:** Tracking agent.
- **Steps:** shipped mail → `retailer_tracking`, `retailer_carrier`, `retailer_ship_date` → delivered mail / AfterShip → `delivered_reshipper`.
- **Done:** status `At reshipper`. **SLA:** ship ke 10 din me delivered warna warn.

## SOP-05 · Reshipper → India
- **Owner:** Ops (drafts) + Jeet (payment, form).
- **Steps:** 1 kg+ stack karo (Ishaan min billing) → receiver form fill (`form_filled`) → reshipper AWB (`reship_awb`, `actual_weight`, `reship_cost`) → `shipped_reshipper`.
- **Done:** status `Flying to India`. **SLA:** reshipper pe 5 din se zyada parcel = warn.

## SOP-06 · India → KicksMachine
- **Steps:** `landed_india` → reshipper domestic leg (all-inclusive) / Tirupati / Delhivery → `km_tracking`, `shipped_km` → `delivered_km`.
- **Done:** status `Delivered to KM`.

## SOP-07 · MRN + confirmation
- **Steps:** Jeet MRN update karta hai (`mrn_updated`) → KM operations ka "ORDER RECEIVING CONFIRMATION WITH MRN" mail → `mrn_confirmed` + `payout_timer`.
- **MRN sheet = READ ONLY.** **SLA:** delivered ke 3 din me confirmation nahi → Payout agent chase draft.

## SOP-08 · Payout
- **Steps:** confirmation + 7 din = due → finance@ se payment → `payout_status=Received`, `payout_date` (sirf proof ke saath).
- **SLA:** due + 2 din → chase draft (Jeet bhejega). Overdue list har subah.

## SOP-09 · Cancellation / problem
- KM cancel (mirror / mail) → status `Cancelled` + note. Store order already placed → ACTION: "store cancel / return / relist (WhatsApp / KM / in-hand stock)".
- KM problem sheet active → ACTION same din.

## SOP-10 · Photo / voice / note intake
- Jeet portal chat me kuch bhi daale → instant basic parse (portal) → baaki Brain agent (har ghante) → apply (≥0.85) / proposal / question. Note ka `result` me hamesha likho kya kiya.

## SOP-11 · Month close (CFO)
- Har mahine 1 tarikh: pichhle mahine ka invested, payouts received, realized profit, avg margin, avg cycle days, overdue → `meta/finance.months[YYYY-MM]` + Jeet ko summary.

## SOP-12 · Incident (kuch toota)
- QA agent detect → `meta/health.status='down'` + push alert → kya toota, kab se, impact, suggested fix.
- Data galat mila → kabhi delete nahi; correct value likho + `notes` me "corrected by <agent> <date>: old → new".
