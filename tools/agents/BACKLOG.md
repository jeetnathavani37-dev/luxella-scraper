# Backlog (Product Chief keeps this ordered)
_Re-ordered by chief 2026-11-04 22:45 IST. Fleet healthy: all due agents ran ok in 26h (watchdog 9, backend 5, growth 2, panel/frontend/security 1; design not due Wed). QA 6 runs green (1 push run 41819393715 = qa ok, deploy job never started → re-dispatched 41820776935 READY), sync 2/2 green. Prod live with today's fixes. Panel buy 0/10 (maybe 3), trust 3.9 flat. 1 client open in 24h (himanshu), 5/5 requests drafted + unsent, Edit 41 draft / 1 live._

## Now (max 3)
1. (frontend, owner UI only) Owner Ops top card "Requests waiting": every `Submitted` request with age badge (amber >12h, red >24h), the stored `data.draft` text + a "Drafted, not sent" count, "price moved ±x% since asked" (current lx_catalog price vs asked), "piece last seen Nd ago" when seen_at > 48h. One "Open WhatsApp" link Jeet taps himself. READ-ONLY: no status writes, no auto-send, nothing shown to clients (guarded §4). — conversion (day 2 in Now; growth 11-04 confirms reply step is THE blocker)
2. (design/panel) Calm, readable first screen on iPhone: home welcome sheet must not cover half the first screen (Lakshmi + Dalal 11-04, panel 11-03); one logo + one greeting at top, aligned pill row (Carmen 11-04, 3 buyers 11-01); remaining helper caps (PRIVATE CLIENT ~9px .3em) → ≥11px, contrast ≥4.5; corner LIVE/contact row must not cover the last card (Payments TOTAL, Address Submit) — bottom padding ≥64px on the last card of each pane. — trust
3. (frontend) Motion standard + Edit readiness, one file per commit: (a) scroll reveal style.css:1269-1271 animates blur(6px)+clip-path 1–1.4 s on every card → opacity+transform only, 500–600 ms ease-out; (b) Edit 🔎 search ("Coach nolita") falls through to Collection results — must land before The Edit reopens; (c) remaining forever timers: neworder.js:236/249 intervals (dash.onData covers them), extras.js renderOps pause when hidden, deals.js:1594 carousel off-screen (reuse __lxTick). — reliability/calm

## Next
- (frontend) Chat mic uses emoji 🎙 as label (app.js:317) — §5 no emoji in client UI; reuse hv-fab SVG mic.
- (design) Owner home topbar 'QC' avatar clipped at left edge (watchdog 11-04, chromium-owner-home.png).
- (watchdog/frontend) If lx_deals is ever empty, deals.js render() returns before drawing the Edit/Boutique switch — keep the switch outside the empty-state early return (re-check after Jeet's PR #1 "single LOCKED switch").
- (design) Tab strip edge fade so half-cut labels read swipeable; "SHOW ALL 1" clipped on Updates; email chip hidden ≤430px.
- (frontend) Empty Private Edit state should offer a next step (last drop / Ask for a quote) — relevant once The Edit reopens.
- First Boutique open makes ~58 catalogue requests (~16 s on slow networks) — bundle/prefetch.
- Product photos with coloured/grey backgrounds show a rectangle on the studio panel.
- (frontend) Dead CSS loops: .cl-spot-st img / .cl-eg2 figure img spotBob, .ft-bag ftBob (style.css ~3220, 3427, 3599) — safe to delete.

## Later
- (frontend) style.css 503 KB, 815 !important, 55 infinite keyframe uses, selectors up to .sw.sw.sw.sw.sw — consolidation pass, file by file, never one big rewrite. Design's override blocks at file end should be folded into base rules.
- (panel) Gulf/NRI ideas: gift-to-another-address + note, Arabic labels later; share button per piece + pay-in-parts (Lin 11-04).

## Needs Jeet (guarded / protected paths)
- 🔴 (chief 2026-11-04, day 7) 5/5 real requests still `Submitted`, ALL 5 have a drafted reply in data.draft, 0 sent. himanshu opened once 3 Nov 22:20 IST and found nothing; his 2 MK orders were marked Delivered today = natural follow-up moment (re-check Coach City Tote price first, co_* scrape from 28–29 Oct). anshul look ₹1,20,600 vs his ₹1,12,400 budget — swap Alo Mat Bag (₹16,600→₹23,000) and send. Send/re-quote is guarded.
- 🟠 (chief 2026-11-04, day 6 locked) The Edit: 41 of 42 deals in draft (7 added today), clients see "Opening soon" on 6 screens (8/10 panel buyers). Nykaa marking down MK/KS (Arden gap gone, others narrowed 3–5 pts) — waiting costs advantage. Recommended drop: MK Jet Set Travel Medium ₹9,600 vs Nykaa ₹15,690, Jet Set Large Camera ₹8,400 vs ₹11,690+, KS Dumpling ₹15,600 vs ₹25,990, Coach Medium City Tote ₹23,900 vs ₹43,990; skip Arden. Growth: Edit pieces 28–63% below Nykaa/coach.in. Decide: small private drop for himanshu, anshul, swayam (lead Kira ₹32,400 vs Nykaa ₹55,990, MK Jet Set ₹9,600 vs ₹16,490) before full reopen.
- (panel 11-04: Named advisor + 'See it on a video call' — Hamad, Carmen, Lakshmi; who is the advisor, when are calls offered?)
- (panel 11-01 + 11-03 + 11-04, business promise) One delivery/gift line: "India delivery · usually X–Y days · gifts to another address with a note · overseas on request" (7 buyers over 2 panels); instalments asked by MX/TR/TH buyers.
- (backend 11-01, schema) India sneaker step posts to `rpc/lx_snk_ingest` → 404 every sync since 31 Oct (RPC, `lx_snk_market`, `lx_v_snk_gap` never created). Add migration or drop the step from catalog-sync.yml.
- (backend 10-31, RLS perf) Recreate lx_catalog_owner_all, lx_catalog_src_owner, lx_cu_self, lx_push_member_rw with `(select auth.uid())` / `(select lx_is_owner())`.
- Stale tails (merged backend 10-31/11-03): retire a store's rows unseen 72h *only after that store's run succeeded* — covers Rack bot wall (nr 87/1,240 fresh), fl/ss 1,500-per-run cap (fl 1,500/3,975, ss 1,500/2,006), fl/nr delisted tails. Hides ~1–2k pieces; or raise CAP / residential proxy.
- Trust block wording: "Authentic · sourced from the brand · invoice in your Document vault" + returns/duties line; Terms tab still says "Terms will be published here." directly under the 5-clause Short Version (app.js:470, reads contradictory — 4 buyers 11-04); legal entity + GSTIN in footer; domain email instead of luxella.in@gmail.com (5/10 buyers).
- Catalogue: ~7.8k of 62.6k live pieces stale — ks 2057, mk 1696, fu 1436, vb(val) 1312, co ~1.4k, plus Sephora/Macy's — GitHub datacenter IPs blocked (403). Needs a residential proxy or a local runner.
- Add `val` (Valentino Bicester, 1312 rows) to outlet_scrape args in catalog-sync.yml (protected .github/).
- Retire pieces not seen for 7 days: `update lx_catalog set active=false where active and src_kind='outlet' and seen_at < now()-interval '7 days'` daily — 22k+ not seen in 36h.
- Furla duplicates: 670 pieces live twice; hide old no-underscore twins: `update lx_catalog b set active=false from lx_catalog a where b.id='fu_'||replace(substr(a.id,4),'_','') and b.id<>a.id and a.active and b.active and a.id like 'fu\\_%\\_%'` (ok?).
- Disable the old `outlet` / `drip` scheduled tasks (they fail trying to run scrapers in the sandbox; CI does this now).
- 🔴 (security 2026-10-31, re-checked 11-04) Khata data still open to anyone with the public site key (in shim.js): khata_state (~24 KB of finance state) and khata_telegram_chat return rows with no login; all 5 khata_* tables allow anon UPDATE (khata_state, sms_inbox, broker_sessions, telegram_chat) + INSERT. khata_broker_sessions has an `access_token` column readable/writable by anon (0 rows today — any broker token saved there is public). JeetOS part is FIXED (jeetos_* now owner-only). Fix (keep anon INSERT on sms_inbox/sms_transactions only if the SMS phone app needs it):
  `do $$ declare r record; begin for r in select tablename,policyname from pg_policies where schemaname='public' and tablename like 'khata\_%' and 'anon'=any(roles) and (cmd in ('SELECT','UPDATE','ALL') or tablename in ('khata_state','khata_broker_sessions','khata_telegram_chat')) loop execute format('drop policy %I on public.%I',r.policyname,r.tablename); end loop; end $$;` — then give the Khata app a login (owner-only policies like jeetos_is_owner()) before running, or it stops reading.
- (security 11-04 verified) lx-assets listing closed: lx_assets_read dropped, only lx_assets_owner_read (authenticated + lx_is_owner) remains; anon list returns []. Later still: move owner order photos (admin.js:396 uploads to lx-assets/<slug>/) and client pdfLink/reqImage (shim.js:131-132) to lx-private + signed URLs (public URLs are guessable-by-path only).
- 🟡 (security) Turn on Auth → Leaked password protection (advisor still WARN 2026-11-04).
- 🟡 (security 11-04) 3 jeetos_* functions have mutable search_path (jeetos_append_only, jeetos_commitments_guard, jeetos_logs_seen): `alter function public.jeetos_append_only() set search_path=public; alter function public.jeetos_commitments_guard() set search_path=public; alter function public.jeetos_logs_seen() set search_path=public;` (check arg lists first).
- 🟡 (security) lx-media `link_import` fetches any http(s) URL for any signed-in user (40/day) — restrict to owner or to an allow-list of retailer domains (edge-function code).
- (security) Vendor: pdf.js 3.11.174 has CVE-2024-4367 (JS in a crafted PDF) — mitigated in deals.js with isEvalSupported:false (security commit 2026-10-31); upgrade vendor/pdf*.js to ≥4.2.67 when convenient. jsPDF 2.5.1 has DoS CVEs (fixed 3.0.2) — low.
- View tracking: product views + Edit/Boutique opens + 0-result search terms (rpc like lx_visit writing a `views` doc) — schema/RPC change; growth asked 3 runs running; funnel stops at "visits".
- (growth 11-04) Daily India-price watch for live Edit pieces (Nykaa markdowns) so a deal never goes live costlier than India — needs price-rule sign-off.
- Value anchor on Collection: "India retail ₹X" (coach.in Teri ₹39,999 vs our ₹27,900; lx_catalog.mrp null for Coach) — wording + source are pricing decisions.
- QA: search-type + chat-close screenshots (fixed chat-close via a7b1e12, verify search shot now captured); committed deals sample in tools/qa/fixtures so Boutique/product/swipe steps actually run (galleryScrolls=None today); log LCP/long-task total instead of the fixed 4.5 s wait in check.py:144 (protected tools/qa).
- Hourly QA cron is sparse: 3 schedule runs in ~18 h (02:30, 09:51, 16:39 UTC) — GitHub drops `:07` crons; try another minute or an external trigger (protected .github/).

## Inbox
- (backend 2026-11-05 02:50 IST) New sync summary flags 5 stores saved 0 (run #19): telfar fixed (feed lives on shop.telfar.net, backend commit). skims / vuori / sweatybetty are headless sites — /products.json 404 since they were added 28 Oct, never saved a piece. Needs Jeet: drop them from SHOPS in outlet_scrape.js (brand choice) or build per-site scrapers. rack = known bot wall.
- (backend 2026-11-05, schema/perf) New `lx_catalog_hide_log` has no primary key (advisor INFO) — add `id bigserial primary key` in supabase/sql/lx_catalog_health.sql (protected path).

## Done
- (security 2026-11-04 verified) JeetOS RLS fixed (jeetos_* owner-only, anon returns []), lx-assets anon listing closed, luxella_catalog PUBLIC-true policy removed.
- (frontend 2026-11-04) Ask Luxella chat: Escape, labelled Close, dialog role, focus return (a7b1e12); scroll-reveal + tabs-height forever intervals → __lxTick (de094a9). Push run deploy never started → dispatch 41820776935 green + READY. Live. Chief audit: compliant.
- (panel 2026-11-04) LIVE corner inside Edit overlay + hidden with chat open (6c6d87e); footer colophon 11px 5.4:1 (779db00); Address sticky bar solid (cd87ce6). QA 41784639687 green, READY. Live. Chief audit 6c6d87e: compliant (position/opacity only).
- (chief 2026-11-04) Security + Frontend scheduled tasks back: security 03 Nov 19:54 UTC, frontend 04 Nov 11:10 UTC (removed from Needs Jeet).
- (security 2026-11-03 verified) RPC revokes applied: lx_exc_put, lx_check_all, lx_check_order, lx_agent_health_check, lx_selftest(_run) no longer executable by anon/authenticated.
- (Jeet 2026-11-03, PR #1 a384c04) The Edit motion polish: calm ease-out, no transition:all, full reduced-motion; single LOCKED switch; owner deals form fits 390px; owner price/remove use in-app sheet. QA 41649099808 green, deploy READY.
- (Jeet 2026-11-03) VERCEL_TOKEN set — deploy READY since run 41636741965 (12:33 UTC); all 30 Oct–3 Nov fixes now live (prod deals.js md5 == HEAD).
- (backend 2026-11-03) 2 GOAT pieces with blank photo (gt_15817, gt_752185) hidden; goat_scrape.js skips items without http image (8cfb6ee).
- (panel 2026-11-01) Header nowrap / SIGN OUT one line (6af06ff), chat header (16df88d), "Ask for a specific piece" on locked card (940913c).
- (design 2026-11-03) LIVE + contact buttons: right-edge stack (52–158px up) → one 46px row on the bottom line (contact in corner, LIVE left; step left when back-to-top shows). Help 'Open guide' + Stats '₹45,000' now clear (0bcc354; QA 41614238912 green, deploy skipped — VERCEL_TOKEN). Trade-off: in the 664px CI view the row now sits on Payments 'Total' at the screen bottom until you scroll. Still open from that panel note: home welcome sheet covers half the first screen.
- (panel 2026-11-03) Hero "Updated on …" hidden when >7 days/missing (d65894c); Paid tick CSS-centred (59b6cab); quote form "Send on WhatsApp" prefilled (7d654aa). On main; prod still old until VERCEL_TOKEN.
- (backend 2026-10-31) Alo Yoga Shopify pager: only an empty page ends the loop (520f26a); sync 41188255065 green → sh_alo 4,011/4,165 fresh.
- (chief audit 2026-10-31) 8b0c370 + 517e9bb reviewed: compliant (no guarded areas, calm, no banned motion; __lxTick self-mutations throttled ≤1/s via takeRecords).
- (frontend 2026-10-31) anim.js five forever setInterval scans (≈4.6 full-document scans/s) → one throttled MutationObserver pass, paused when hidden (8b0c370); Hey Luxella sheet: Close aria-label, Escape, dialog role (8eac41b). CI 41195827831 green, screenshots identical; not live (VT empty).
- (panel 2026-10-31) Quote/"Order again" signed with client's own name not "Swayam" (97fcc78); login "Admin panel" link hidden, faint owner route (517e9bb); policy search placeholder (59eb53d). CI 41175935699 green; NOT live (VERCEL_TOKEN).
- (design 2026-10-30) LIVE + contact coins → 46px dark-glass buttons stacked right, no glow/ring/pulse, tuck away on scroll-down (1a4687c, 4d952d7; QA 41037506581 green). Live on prod.
- (frontend 2026-10-30) oneGold 1.2 s class churn stopped (diff-only), dead product-levitation observers removed (9b93c28; CI 41046801189 green). Live.
- (panel 2026-10-30) "1 order" not "1 orders" (459ff74); Paid badge tick aligned (0b34bf3); warmer contact note (00ab434). Live.
- (backend 2026-10-30) Shopify brands into CI more_scrape (4b939df); 429/5xx retry (a98f7dc) — sm_/vb2_ fresh after sync run 41032989924.
- (Jeet 2026-10-30) Velvet curtain removed on tab/page open (0e46775); The Edit locked for clients with "Opening soon" (341c52a).
