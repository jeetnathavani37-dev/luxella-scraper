# Reshippers — kaun kitna leta hai, system kya hai

| Reshipper | Location | Rate | Min / rounding | Notes |
|---|---|---|---|---|
| Ishaan-USA | Wilmington, Delaware (AWG) — Tanish address | ₹1,250/kg | 1 kg min per box · 0.5 kg round-up | 0% sales tax. Stack parcels ≥1 kg before dispatch. Faster ETA. |
| Ishaan-USA (Delaware warehouse plan) | same | ₹1,450/kg general · ₹2,150/pair footwear | 1 kg min | 30 kg/month commitment wala plan — **Jeet confirm kare kaunsa rate chal raha hai**; portal me Reshippers tab → "Rate edit". |
| Ishaan-Canada | Mississauga ON (Westwood Square Mall) | ₹1,250/kg | 1 kg min · 1 kg round-up | Coach Outlet Canada etc. |
| Ishaan-UK | UK | ₹1,250/kg | 1 kg min | |
| Yash | Delaware (same address as Ishaan-USA) | ₹1,400/kg | actual weight, no min, no per-pair charge | no monthly volume |
| Prabhmeet | Princeton NJ (King Exim / RAMEZ USVS) | ₹1,250/kg | actual weight, no min, no rounding | 7% NJ sales tax on store order. ETA 12–14 din. Watches (Seiko/Tissot) via Japan/US. |
| Dev Gandhi | Pooler GA (friend) | ~$28.50 per parcel GA → reshipper | — | Stores jo forwarder ko ship nahi karte (Patagonia, Lululemon) |

**Rules**
- Rates portal me `meta/reshippers.rates` me (Reshippers tab → Rate edit). Estimate per order = weight (actual, warna estimate) × rate, unke rounding se. Min (1 kg) **per box** lagta hai — isliye stack karke bhejo.
- Customs + India me KM tak domestic courier reshipper ke rate me included hai.
- **Payment:** parcel India pahunchne ke baad. Reshippers tab → "✓ Paid" → landed orders pe `reship_paid='Yes'`, `reship_paid_date`; ledger `meta/reshippers.ledger` me entry (amount, orders).
- `reship_cost` = billed amount (reshipper ka bill aaye to bharo); khaali ho to estimate count hota hai.

**Form (receiver / pre-alert)**
- Store order ship hote hi (ya warehouse pahunchne pe) form bharna hai. Warehouse tab → "Copy form" ek ya selected orders ka ready text deta hai (item, KM ref, store + order no, inbound tracking, value $, qty, weight).
- Format `meta/reshippers.form_template` me save hota hai — Reshippers tab me apne form ke fields ke hisaab se badlo ({{items}}, {{ids}}, {{count}}, {{value}}, {{date}}).
- Form bharne ke baad "✓ Form filled" → `form_filled='Yes'`, `form_date`.

**Dispatch**
- Warehouse me 5+ din ya 1 kg+ stack → Warehouse tab ka "WhatsApp: dispatch bolo" (draft text). Ship hote hi "✈ Warehouse se nikla" (+AWB) → `shipped_reshipper`, `reship_awb`.
- Reshipper bole "sab land ho gaye" → chat me likho "Ishaan ke sab landed" → us reshipper ke saare "Shipped from hub" orders ka proposal; Apply → `landed_india`.
