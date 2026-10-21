# 💰 Bid pricing agent — playbook

Read first: team-protocol, company, workflow, data-model, pricing, reshippers.

1. Select KM orders with status 'To place' (and not Cancelled) whose price_check is missing or older than 24h. Max 8 per run (oldest first).
2. For each: use web search (and fetch where possible) to find the exact item (brand + name + colour + size) on official / outlet stores: Michael Kors (michaelkors.com, Michael Kors outlet), Coach Outlet (coachoutlet.com), Coach, Kate Spade Outlet (katespadeoutlet.com), Tory Burch, Dr. Martens, Ralph Lauren, Patagonia, JW Pei, Lululemon, Simon Premium Outlets (shop.simon.com). Prefer the cheapest legit in-stock listing in the right size/colour. Note stock if visible. Never use marketplaces/resellers (eBay, Poshmark, Amazon 3rd party).
3. Compute landed cost (INR): price_usd × (1 − discount) × (1 + tax) × FX + reship + ₹150 domestic.
   - discount: Michael Kors new-account first order ~10%; otherwise 0 unless the page shows a sale price (then use the sale price, discount 0). Coupon codes are NOT counted.
   - tax: 0 (ships to Ishaan/Yash Delaware). FX: USD 95.5, CAD 70, GBP 129.
   - reship = billed kg × ₹1,250 with Ishaan rules (1 kg minimum, round up to 0.5 kg). Weight guess if unknown: wallet/belt/cap 0.3, small crossbody 0.6, medium bag 0.9, large tote/carryall 1.2, sandals/sneakers 1.2, boots 1.8, clothing 0.5. Note: if the order can be stacked with others going to the same reshipper, mention it.
   - margin_pct = (payout − landed) / landed × 100. verdict: GO if ≥20, TIGHT if 12–20, NO if <12 or not found / out of stock.
4. Save on the order: price_check = {checked_at, store, url, price_usd, currency, sale_note, est_kg, landed_inr, margin_pct, verdict, note (one short line: size availability, sale end, alternative store)}. Also set landed (number) and est_weight if empty.
5. Items: action for NO/TIGHT ("US… margin 9% — price ₹X pe negotiate / skip"), info for GO. If the accept-by window (bid accept_by_date / order_date+1 day) is still open and verdict is NO, draft a polite message to KM (Maanvesh) asking for a better payout with the landed cost reasoning (no internal costs, just "costs went up / item at full price").
6. Write the agent row. Summary like "5 bids check kiye: 3 GO, 1 TIGHT, 1 NO".
Final reply: Hinglish bullets per order (order · store price · margin · verdict).

## Smart checks
- Size/colour exactly match hona chahiye; galat size ka price mat lo.
- Same item ke purane orders (same brand+item) ka `price_check` / `landed` dekho — reference ke liye note me likho ("pichli baar $X me liya").
- Combined bid (ek mail me 2 orders) → dono ka total margin bhi note me.
- Accept window 4h se kam bacha aur verdict GO → ACTION "abhi order karo".

## KM data
`meta/km_bids.raw` aur `kind='km'` rows me KM ka exact item/size/payout ho sakta hai — mail se zyada reliable; mismatch ho to note karo.
