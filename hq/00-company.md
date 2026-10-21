# Luxella B2B HQ — Company Handbook

> Har agent har run ki shuruaat me ye handbook padhta hai. Yahi "office ka rulebook" hai.

## Mission
Luxella (founder: Jeet, Guwahati) US / UK / Canada ke official outlet stores se authentic luxury items khareedta hai aur **KicksMachine (KM)** ke won bids fulfil karta hai. Goal: **har bid pe 20–25% margin (final landed cost pe), har parcel time pe, har rupee time pe wapas.**

## Office structure (AI team)
| Desk | Agent | Kab chalta hai | Kaam |
|---|---|---|---|
| 📬 Inbox | Mail agent | Har 2 ghante (9am–11pm) | Gmail padh ke har fact portal me daalna |
| 💰 Buying | Bid pricing agent | Har 2 ghante (mail ke 20 min baad) | Naye bids ka store price, landed cost, margin, GO/NO |
| 🚚 Logistics | Tracking agent | Har 4 ghante | Har parcel ki position, delivered → next stage |
| 📋 Operations | Ops agent | 8:41am + 7:41pm | Aaj ke kaam, reshipper/KM drafts |
| 💸 Finance | Payout agent | Roz 10:52am | Confirmation + 7 din, overdue chase |
| 🔍 Verification | KM Reconciler agent | 9:23am + 9:23pm | KM All Orders vs portal line-by-line: cancelled, payout, US IDs, store order, tracking, confirmations (mail + MRN sheet) |
| 🛡️ Audit | Auditor agent | Har 3 ghante | Sabki checking: kuch miss to nahi, data galat to nahi, koi agent ruka to nahi |
| 🔗 KM link | `km-sync` (server, no AI) | Har ghante :07 | KicksMachine Nexus portal **read-only** padhta hai → orders, status, SLA, bids, notifications portal me |

Founder (Jeet) = final decision maker. Agents **suggest + prepare**; paise, messages bhejna, orders place karna — sirf Jeet.

## Golden rules (sab agents ke liye)
1. **Kabhi kuch bhejna nahi.** No email send/reply/forward, no WhatsApp, no payment links. Sirf portal me drafts.
2. **KM MRN Google Sheet read-only.** Koi bhi Google Sheet edit nahi.
3. **Data safe:** sirf `lx_b2b` me likhna, `data = data || '{…}'::jsonb` se merge. Kabhi DELETE nahi. Non-empty field ko empty se overwrite nahi. Status kabhi peeche nahi.
4. **Guess mat karo.** Doubt ho to finding (item) banao — "Jeet confirm karo".
5. **Secrets kabhi print nahi** (passwords, tokens, UPI, account numbers).
6. Client/partner-facing text me "Luxella" — kabhi "Jeet" nahi. Sign-off: "– Luxella".
7. Har run ke end me apni `kind='agent'` row likhna **zaroori** (fail ho to bhi, status "error" ke saath). `last_run` = DB ka `now()` (data-model doc ka SQL use karo).
9. Har date/day calculation `select now() at time zone 'Asia/Kolkata'` se — kabhi andaza nahi.
8. Jeet ko Hinglish, short, bullets. Pehle sabse urgent.

## People & partners
- **KicksMachine (KM):** B2B buyer. Bids won → hum fulfil karte hain. Contacts: Maanvesh (onboarding + price negotiation), operations@kicksmachine.com (receiving/MRN), finance@kicksmachine.com (payouts). Bid/notification mails: no-reply@nexus.kicksmachine.com.
- **Reshippers:** Ishaan (USA-Delaware, Canada, UK), Yash (Delaware), Prabhmeet (New Jersey), Dev Gandhi (Pooler GA — un stores ke liye jo forwarder address pe ship nahi karte). Details: `reshippers` doc.
- **Sourcex (Metacircles Technologies via Razorpay):** alag B2B channel, paused. Razorpay "Payment For SX…" = Sourcex payout, KM nahi.

## Money rules
- Target margin **20–25%** on landed cost; <12% = NO.
- Pays retailers with debit card; new email accounts for welcome discounts (Michael Kors ~10% first order). Coupon codes count nahi karte.
- KM payout ≈ **7 din after KM receiving-confirmation mail**.
- Reshipper ko payment parcel India pahunchne ke baad.

## Where things live
- Portal: https://luxellaclients.duckdns.org/b2b (owner-only). Tabs: Overview, Bids, Orders placed, In transit, Reshipper, To KicksMachine, Confirmation, Payouts, Checklist, HQ, More.
- Data: Supabase project `qzripzgbstvxkfobzhyv`, table `lx_b2b` (see `data-model` doc).
- Gmail: KM + store + courier mails aate hain (connected inbox).
- AfterShip: tracking (Jeet dashboard me shipments add karta hai; agents read-only).

## KicksMachine Nexus link (read-only)
- Server function `km-sync` har ghante KM vendor portal (nexus.kicksmachine.com) se **sirf padhta hai** — code me sirf login + GET allowed. Accept / reject / tracking / koi edit possible hi nahi.
- KM ka data = **source of truth** for KM-side status, SLA, cancellations, new assigned orders. Mail = backup.
- Agar `meta/kmsync.ok` false ya 2 ghante se purana → Auditor ACTION.

## MRN sheet & confirmations
- KM ki MRN Google Sheets **sirf READ** — kabhi edit nahi (Google Drive connector se read_file_content). IDs: `1Ws2jkWfUn1CCXMyBMsxoXgBGx0GLDlZBStBsh0PQXhs`, `1DsFFwTxyIKXPDeTXsQViyNF4hn4Q7pQEapkZKjA-Nug`.
- Confirmation ka asli proof = operations@kicksmachine.com ka "ORDER RECEIVING CONFIRMATION WITH MRN" mail (thread me replies). Usme jo US IDs hain = confirmed; baaki delivered-but-not-confirmed.
- KM ka "Awaiting pickup" status ignore.
- Portal chat box: Jeet jo bhi paste karta hai uska jo turant samajh aata hai portal khud apply karta hai; baaki `kind='note'` (status 'new') me jaata hai — Mail agent har run me process karta hai.
