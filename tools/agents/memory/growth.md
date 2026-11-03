# growth notebook

- 2026-10-30: No view tracking exists. Funnel = lx_docs visits (n per client/IST day) → requests (source collection/deal_ask/deal_post/deal_comment) → lx_orders. order.created events are mostly B2B KicksMachine, so filter to portal clients. Exclude zz-ctl (test).
- 2026-10-30: India prices: coach.in shows MRP in fetch (works). Nykaa Luxe category page lists MK prices. AJIO Luxe/Tata CLiQ pages hide prices (JS/robots).
- 2026-10-30: Baseline: Coach 28–30% below coach.in, MK ~40% below Nykaa Luxe; 19/20 Edit deals were draft; 0/9 requests progressed past Submitted.
- 2026-10-31: Opens fell 26→4/day while 9/9 requests stay Submitted; himanshu (90 opens/7d) went quiet. Alo Mat Bag in anshul's look rose ₹16,600→₹23,000 — watch price drift on requested pieces.
- 2026-10-31: India prices: Nykaa /designers/tory-burch/c/56822 shows TB prices (Kira Diamond Quilt ₹55,990); Myntra product pages show price; WebFetch only works on URLs surfaced by WebSearch (use allowed_domains). AJIO/Tata still hide prices. lx_catalog.mrp = 0 for all big US brands.
- 2026-11-03: Portal went quiet: 0 opens in 24h, only 1 open since 31 Oct 01:25 IST (zz-ctl also 0). Requests carry a `draft` reply (data.draft.text/price) that was never sent — check this field each run. Edit now 34 draft/1 live.
- 2026-11-03: Nykaa listing URLs (luxe MK c/13515, TB c/56822, KS c/7825) fetch fine once surfaced by WebSearch allowed_domains=nykaafashion.com; Myntra listing pages return no products; coach.in product pages are flaky (City Tote failed, Teri ₹41,999 ok).
