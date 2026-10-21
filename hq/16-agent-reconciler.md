# 🔍 KM Reconciler agent — playbook (roz ka full verification)

Read first: company, team-protocol, workflow, data-model, km-playbook, mail-formats.
Kaam: **KM ke All Orders** ko hamare portal se line-by-line verify karna — kuch bhi galat / miss na rahe. Roz 9:23am aur 9:23pm.

## 1. Fresh data
- `meta/kmsync.at` 2 ghante se purana ya ok=false → item ACTION "KM sync ruka/error" (aur jo data hai usi se kaam karo).
- KM orders: `select id, data->'raw' from lx_b2b where kind='km';` (fields: orderNumber, status, payoutPrice, items[].productTitle/variantTitle, slaDeadlineAt, etaStage, etaInfo.originOrderId, etaInfo.vendorTrackingId, acceptedAt, acceptanceDeadlineAt, cancellationRequest, problemSheet, milestones).
- Hamare orders: `kind='order'` client='KicksMachine'.

## 2. Line-by-line checks (har KM order)
| Check | Agar galat | Auto-fix? |
|---|---|---|
| US ID dono taraf hai | KM pe hai, hamare paas nahi → create (status To place, source 'Reconciler'); hamare paas hai, KM pe nahi → warn | create ✅ |
| KM status cancelled/rejected | hamara Cancelled nahi → status Cancelled + note | ✅ |
| Payout (KM payoutPrice) | hamara payout alag → KM wala likho, old value note me | ✅ |
| Item / size | alag → warn (auto mat badlo) | ❌ |
| Store order no. (etaInfo.originOrderId) | hamara retailer_order_id khaali → bharo; alag → warn | khaali ho to ✅ |
| Tracking (etaInfo.vendorTrackingId) | hamara retailer_tracking khaali → bharo; alag → warn | khaali ho to ✅ |
| KM portal update | Ordered/In transit par KM pe originOrderId khaali → ACTION "KM portal pe store order + tracking daalo" | ❌ |
| Accept | acceptedAt khaali aur acceptanceDeadlineAt aage hai → ACTION "KM pe accept karo (deadline …)" | ❌ |
| SLA | slaDeadlineAt nikal gaya / 2 din bache aur hum Delivered nahi → ACTION | ❌ |
| Problem / cancellation request | active → ACTION with note | ❌ |
| "Awaiting pickup" | **ignore** (team-protocol) | — |

## 3. Confirmations (mail + MRN sheet, dono READ-ONLY)
- Gmail: `from:operations@kicksmachine.com subject:"RECEIVING CONFIRMATION"` — har thread **get_thread** se poora padho (naye batches purane thread me reply hote hain). Har listed `#US…` → mrn_confirmed = us message ki date (agar khaali), payout_timer bhi.
- MRN Google Sheets (Google Drive connector se sirf READ — **kabhi edit nahi**): `1Ws2jkWfUn1CCXMyBMsxoXgBGx0GLDlZBStBsh0PQXhs`, `1DsFFwTxyIKXPDeTXsQViyNF4hn4Q7pQEapkZKjA-Nug` (aur confirmation mails me jo naya sheet link aaye). Isse dekho kaunse US IDs received / MRN wale hain → mrn_updated khaali ho to fill + info item.
- Output list: **"Confirmation aa gaya"** (ids + date) vs **"Delivered/MRN ho gaya par confirmation nahi aaya"** (ids + kitne din) → ye dusri list ACTION + draft to operations@ (km-playbook template).

## 4. Payout cross-check
Confirmed + 7 din nikal gaye aur payout_status Pending → handoff to 'payout' (wo chase draft banata hai).

## 5. Output
Agent row id 'reconciler', name "🔍 KM Reconciler". Summary e.g. "64 KM orders verify: 2 fixed (payout), 1 cancelled, 3 confirmation pending, 0 missing". Items max 20 (most urgent first), drafts max 3, handoffs as needed. Har auto-fix ki list summary/items me ("fixed: US… payout 19000→26000").
Final reply (push): max 6 bullets — sirf jo badla ya jo Jeet ko karna hai.
