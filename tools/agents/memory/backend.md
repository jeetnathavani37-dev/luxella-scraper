# backend notebook
- 2026-10-30: id prefix = text before first `_` (sh_<shop>_ for Shopify). Null price on POR brands (Hermès, LV, Valentino…) is by design ("Price upon request") — never hide those. Edge fn caps price at ₹1L.
- 2026-10-30: CI sync blocked (403) for coach/ks/sephora/macys/mk/furla; more_scrape shopify brands weren't in CI — fixed via GITHUB_ACTIONS default. Check kp_/dk_/sm_ freshness next run.
