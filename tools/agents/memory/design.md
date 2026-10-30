# design notebook

- 2026-10-30: Floating buttons live in 3 layers of !important CSS (style.css ~840, ~1201, ~2652, ~4227, ~4319); override with `html body .qcm#qc-main` / `.hv-fab#hv-fab` at file end. Now: 46px dark glass, right stack (totop 16 / contact +52 / LIVE +112). backdrop-filter doesn't show in CI WebKit shots → keep bg ≥ .95 opaque.
- 2026-10-30: CI deploy prints VT empty → nothing reaches prod until Jeet adds VERCEL_TOKEN. Next design item: tab strip edge fade (half-cut labels) / 'SHOW ALL 1' clip.
