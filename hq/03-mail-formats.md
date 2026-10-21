# Mail formats (exact patterns)

## KicksMachine — no-reply@nexus.kicksmachine.com
- **"You won the bid - order US110930"** (ya "…order US109141-A, US109141-B"). Body: `Order Number: US…[, US…]`, `Your payout: ₹N` (sab items ka total), `Accept by: 22 Oct 2026, 11:56 am IST (24-hour window)`, `Order Items: 1. <brand item colour> …`. → bid + order rows (status To place).
- **"Admin placed an order for you - US…"** — same format; treat like a won bid.
- **"Reminder: about 4 hours left to accept order US…"** — order abhi To place hai to ACTION.
- **"You have been outbid"**, "Your Login Credentials" — ignore.

## KicksMachine operations — operations@kicksmachine.com (cc finance@, apoorvkand@, AMAN@)
- Subject **"JEET NATHAVANI ORDER RECEIVING CONFIRMATION WITH MRN"** — naye batches **usi purane thread me reply** ki tarah aate hain (`Re: …`). Hamesha get_thread se har message alag padho.
  Body: `RECEIVED DATE: [12-10-2026] MRN DATE: [08-10-2026]` + rows `#US108830 <item> RECEIVED 262100203233` (last = domestic tracking).
  → har listed order: mrn_confirmed = us message ki date, payout_timer, km_received_date, km_mrn_date, km_tracking (if empty), delivered_km (if empty), status Delivered to KM.
- Known batches: 2026-10-07 (US108851, US108797, US108749) · 2026-10-15 (US108830, US108772, US108960, US109072).

## Razorpay — no-reply@razorpay.com, "Metacircles Technologies Pvt Ltd"
- "Requesting details for … payout", "payout has failed - Please retry", "payout is Successful". Body has `Payment For SX…` → **Sourcex**, KM nahi. Fail = Jeet ko warn (retry link se details).

## Stores (order confirmation / shipped / delivered)
- Michael Kors: order `Z0…` (e.g. Z018019616); ships UPS (`1Z…`) or Amazon (`TBA…`).
- Coach / Coach Outlet: order `WUP…`; Coach Outlet Canada `WCP…`.
- Kate Spade Outlet: `ZUP…`.
- Dr. Martens: 8-digit; Ralph Lauren: 10-digit; Patagonia: `US…` (store order, not KM!); Lululemon: `c…`.
- Recipient (To:) = which account email bought it — `buy.recipient`.
- Ship-to names: "Jeet CGO AWG Wilmington DE" / "Tanish AWG Wilmington DE" = Ishaan/Yash Delaware; "RAMEZ USVS … Princeton NJ" = Prabhmeet NJ; "Dev Gandhi Pooler GA"; "Mississauga ON" = Canada.

## Carriers
UPS `1Z` + 16; Amazon `TBA` + 12 digits; FedEx 12–15 digits; USPS 20–22 digits (92…/94…); India domestic (Tirupati etc.) ~12 digits starting 2621….
