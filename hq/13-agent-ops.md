# 📋 Ops agent — playbook

Read first: team-protocol, company, workflow, data-model, reshippers, km-playbook. Phir baaki agents ki rows padho.

## Findings (group same-type orders into ONE item; max 15; most urgent first)
- KM SLA passed / ≤2 din → action "KM ko update do".
- 'To place' > 1 din → action "store pe order karo" (price_check NO ho to "skip/negotiate").
- Ordered/In transit bina km_portal_updated → action.
- Ordered/In transit, form_filled ≠ Yes → action per reshipper.
- At reshipper 5+ din → warn per reshipper + total kg + Ishaan 1 kg status.
- Landed India bina km_tracking → action.
- Delivered to KM bina mrn_updated → action.
- mrn_updated 3+ din, no mrn_confirmed → warn.
- Combined orders mismatch → warn.

## Drafts (max 6)
Reshipper pre-alert · reshipper dispatch ask · KM SLA update (Maanvesh) · KM confirmation pending (operations). Templates: km-playbook.

## Morning vs evening
- 8:41am: "Aaj ke kaam" — kya karna hai aaj.
- 7:41pm: "Shaam ka review" — aaj kya hua (orders jo aage badhe), kya abhi bhi pending, kal subah sabse pehle kya.

Final reply (push): max 6 bullets + "Drafts ready → portal HQ tab".

## KM Nexus data use karo
- `kind='km'` raw status/SLA hamare order se compare karo; mismatch (e.g. KM pe "delivered"/"cancelled" par hamare paas nahi) → warn.
- `meta/km_notifications` me last 24h ke naye notifications (SLA, cancellation, problem case, reorder) → items me daalo with suggestion.

## To-dos tab = tumhari reminder list (Oct 2026)
Portal me "To-dos" tab (Overview ke baad) ye sections dikhata hai — har run me **same rules** se count nikaalo aur push/summary me section-wise bhejo (urgent pehle). `snooze.<key>` > aaj ho to us order ko us section me mat gino.
| key | Section | Rule (KM orders, not cancelled) | Urgent |
|---|---|---|---|
| place | Order place karna hai | status To place | accept-by aaj/nikal gaya |
| soid | Store order no. update | placed, no retailer_order_id, before At reshipper | — |
| kmid | KM portal pe retailer ID | retailer_order_id hai, km_portal_store_order & km_portal_updated khaali, not delivered | — |
| trk | Tracking update | Ordered, no tracking, 2+ din | 5+ din |
| kmtrk | KM portal pe tracking | tracking hai, km_portal_tracking & km_portal_trk_done khaali, before Landed India | — |
| form | Reshipper form | In transit/At reshipper with tracking, form_filled ≠ Yes | At reshipper |
| wh | Store parcel late | In transit 7+ din ya eta_reshipper nikal gaya | hamesha |
| disp | Dispatch chase | At reshipper 5+ din (reshipper-wise group) | 10+ din |
| land | India kab? | Shipped from hub 10+ din ya eta_india nikal gaya | 15+ din |
| dom | KM courier tracking | Landed India, no km_tracking | 3+ din |
| mrn | MRN update (sirf Jeet sheet me) | Delivered to KM, no mrn_updated, no confirmation | 2+ din |
| conf | Confirmation chase | mrn_updated 3+ din, no confirmation | 5+ din |
| pay | Payout chase | confirmation 7+ din, payout not received | hamesha |
| sla | SLA cross | sla_deadline < aaj, not delivered | hamesha |
| sx | Sourcex payout verify | client Sourcex, payout_status Unverified | — |
Push format (max 6 lines): "🔴 3 urgent · 12 total — 📦 Dispatch: Ishaan 18 (10+ din) · 💸 Payout chase 3 (₹27,400) · …" + portal link https://luxella-b2b.vercel.app
