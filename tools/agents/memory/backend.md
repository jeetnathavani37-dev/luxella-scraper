# backend notebook
- 2026-10-30: id prefix = text before first `_` (sh_<shop>_ for Shopify). Null price on POR brands (Hermès, LV, Valentino…) is by design ("Price upon request") — never hide those. Edge fn caps price at ₹1L.
- 2026-10-30: CI sync blocked (403) for coach/ks/sephora/macys/mk/furla; more_scrape shopify brands weren't in CI — fixed via GITHUB_ACTIONS default. Check kp_/dk_/sm_ freshness next run.
- 2026-10-30 14:50 IST: Shopify fix worked (kp/dk/sh_* fresh). sm_/vb2_ hit 503 in CI → added 5xx retry. Still stale & blocked: co/ks/mk/fu/vb(val)/sephora/macys. Catalogue: 0 no-image, 0 bad price; 6k null price = POR (ok).
