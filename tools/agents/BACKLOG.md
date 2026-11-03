# Backlog (Product Chief keeps this ordered)
_Re-ordered by chief 2026-11-03 22:45 IST. Context: VERCEL_TOKEN now set — deploys READY since run 41636741965, main is live (prod deals.js == HEAD). The Edit still locked ("Opening soon", 34 draft / 1 live). Panel buy 0/10 (3 maybe), trust 3.9. 0 client opens in 24h; 9/9 requests `Submitted` with 2 replies already drafted but unsent. Security + Frontend agents have not run since 1 Nov / 31 Oct._

## Now (max 3)
1. (frontend, owner UI only) Owner Ops top card "Requests waiting": every `Submitted` request with age badge (amber >12h, red >24h), the stored `data.draft` text if any, "price moved ±x% since asked" (current lx_catalog price vs asked), and "piece last seen Nd ago" when seen_at > 48h. One "Open WhatsApp" link Jeet taps himself. READ-ONLY: no status writes, no auto-send, nothing shown to clients (guarded §4). — conversion (merges growth 10-31 SLA badge + price-moved flag, growth 11-03 draft-ready + freshness)
2. (design/panel) Readability + calm top on iPhone: helper caps (PRIVATE CLIENT, footer L U X E L L A, ~9px .3em) → min 11px, contrast ≥4.5; one logo + one greeting at top, aligned pill row (3 buyers 11-01); home welcome sheet must not cover half the first screen (panel 11-03). — trust
3. (frontend) Edit 🔎 search ("Coach nolita") falls through to Collection results (5 Nolita 19 in stock) — must land before The Edit reopens; then the forever-timer cleanup: ui2.js:12 setInterval(setH,2000) → drop (ResizeObserver covers it); extras.js renderOps 5 s pause when hidden; deals.js carousel timers off-screen (IntersectionObserver + document.hidden; reuse window.__lxTick). One file per commit. — conversion/reliability

## Next
- (watchdog/frontend) If lx_deals is ever empty, deals.js render() returns before drawing the Edit/Boutique switch — keep the switch outside the empty-state early return (re-check after Jeet's PR #1 "single LOCKED switch").
- (design) Tab strip edge fade so half-cut labels read swipeable; "SHOW ALL 1" clipped on Updates; email chip hidden ≤430px.
- (design) Corner-button row (0bcc354) sits on the bottom card (Payments 'Total') in a 664px view until scroll — add bottom padding to the last card of each pane.
- (frontend) Empty Private Edit state should offer a next step (last drop / Ask for a quote) — relevant once The Edit reopens.
- First Boutique open makes ~58 catalogue requests (~16 s on slow networks) — bundle/prefetch.
- Product photos with coloured/grey backgrounds show a rectangle on the studio panel.
- (frontend) Dead CSS loops: .cl-spot-st img / .cl-eg2 figure img spotBob, .ft-bag ftBob (style.css ~3220, 3427, 3599) — safe to delete.
- (panel 11-01) Address tab top shows "Submit address for this order" over a faded intro note — likely mid-reveal; check.

## Later
- (frontend) style.css 503 KB, 815 !important, 55 infinite keyframe uses, selectors up to .sw.sw.sw.sw.sw — consolidation pass, file by file, never one big rewrite. Design's override blocks at file end should be folded into base rules.
- (panel) Gulf/NRI ideas: named advisor card, gift-to-another-address + note, Arabic labels later.

## Needs Jeet (guarded / protected paths)
- 🔴 (chief 2026-11-03) Scheduled tasks NOT running: **Security** (last ledger run 1 Nov; missed 2 + 3 Nov) and **Frontend** (last 31 Oct; missed 1, 2, 3 Nov). Chief also missed 1–2 Nov; whole fleet was silent 01 Nov 08:11 → 03 Nov 02:38 UTC. Growth/panel/design/backend/watchdog are back. Open the scheduled tasks list and re-enable Security + Frontend (agents can't edit scheduled tasks).
- 🔴 (chief 2026-11-03) 9/9 client requests still `Submitted` (himanshu 4 since 28 Oct, anshul look since 29/30 Oct). Replies already DRAFTED in data.draft: himanshu City Tote ₹25,100 (Coach price unverified since 29 Oct), anshul look ₹1,20,600 vs his ₹1,12,400 budget (Alo Mat Bag ₹16,600→₹23,000). 0 client opens in 24h; himanshu (87 of 135 weekly opens) quiet since 30 Oct. Send/re-quote is guarded. Also later: show request status to the client (Seen / Sourcing / Quoted).
- 🟠 (chief 2026-11-03) The Edit: 34 of 35 deals in draft (8 added today), clients see "Opening soon". Growth: Edit pieces 28–63% below Nykaa/coach.in. Decide: small private drop for himanshu, anshul, swayam (lead Kira ₹32,400 vs Nykaa ₹55,990, MK Jet Set ₹9,600 vs ₹16,490) before full reopen.
- (panel 11-01 + 11-03, business promise) One delivery/gift line: "India delivery · usually X–Y days · gifts to another address with a note · overseas on request" (7 buyers over 2 panels); instalments asked by MX/TR/TH buyers.
- (backend 11-01, schema) India sneaker step posts to `rpc/lx_snk_ingest` → 404 every sync since 31 Oct (RPC, `lx_snk_market`, `lx_v_snk_gap` never created). Add migration or drop the step from catalog-sync.yml.
- (backend 10-31, RLS perf) Recreate lx_catalog_owner_all, lx_catalog_src_owner, lx_cu_self, lx_push_member_rw with `(select auth.uid())` / `(select lx_is_owner())`.
- Stale tails (merged backend 10-31/11-03): retire a store's rows unseen 72h *only after that store's run succeeded* — covers Rack bot wall (nr 87/1,240 fresh), fl/ss 1,500-per-run cap (fl 1,500/3,975, ss 1,500/2,006), fl/nr delisted tails. Hides ~1–2k pieces; or raise CAP / residential proxy.
- Trust block wording: "Authentic · sourced from the brand · invoice in your Document vault" + returns/duties line; Terms tab still says "Terms will be published here."; legal entity + GSTIN in footer; domain email instead of luxella.in@gmail.com (5/10 buyers).
- Catalogue: ~7.8k of 62.6k live pieces stale — ks 2057, mk 1696, fu 1436, vb(val) 1312, co ~1.4k, plus Sephora/Macy's — GitHub datacenter IPs blocked (403). Needs a residential proxy or a local runner.
- Add `val` (Valentino Bicester, 1312 rows) to outlet_scrape args in catalog-sync.yml (protected .github/).
- Retire pieces not seen for 7 days: `update lx_catalog set active=false where active and src_kind='outlet' and seen_at < now()-interval '7 days'` daily — 22k+ not seen in 36h.
- Furla duplicates: 670 pieces live twice; hide old no-underscore twins: `update lx_catalog b set active=false from lx_catalog a where b.id='fu_'||replace(substr(a.id,4),'_','') and b.id<>a.id and a.active and b.active and a.id like 'fu\\_%\\_%'` (ok?).
- Disable the old `outlet` / `drip` scheduled tasks (they fail trying to run scrapers in the sandbox; CI does this now).
- 🔴 (security 2026-10-31) JeetOS + Khata private data is open to anyone with the public site key (it is in shim.js): jeetos_profile, jeetos_coach_notes, jeetos_logs, khata_state, khata_telegram_chat return rows with no login, and 20 jeetos_* tables + khata_* allow anon INSERT/UPDATE. Not client data, but Jeet's own. Fix (keep khata anon INSERT only if the SMS phone app needs it):
  `do $$ declare r record; begin for r in select tablename,policyname from pg_policies where schemaname='public' and tablename like 'jeetos\_%' and policyname='allow all for anon' loop execute format('drop policy %I on public.%I',r.policyname,r.tablename); end loop; for r in select tablename,policyname from pg_policies where schemaname='public' and tablename like 'khata\_%' and 'anon'=any(roles) and cmd in ('SELECT','UPDATE') loop execute format('drop policy %I on public.%I',r.policyname,r.tablename); end loop; end $$;` — first check the JeetOS/Khata apps sign in (they break if they read with the anon key).
- 🟠 (security 2026-10-31) Storage: bucket lx-assets is public AND policy lx_assets_read lets anyone LIST it — per-client order photos (himanshu/ 11, swayam/ 2) and client-uploads/ (8 images + 1 PDF) can be listed and downloaded with the public key. Public file URLs keep working without a SELECT policy, so restrict listing:
  `drop policy lx_assets_read on storage.objects; create policy lx_assets_read on storage.objects for select using (bucket_id='lx-assets' and (lx_is_owner() or (storage.foldername(name))[1] in ('deals','site')));`
  Later: move owner order photos (admin.js:396 uploads to lx-assets/<slug>/) and client pdfLink/reqImage (shim.js:131-132) to lx-private + signed URLs.
- 🟡 (security) SECURITY DEFINER RPCs callable without login: lx_exc_put (anyone can inject/re-open fake exceptions in the ops queue), lx_check_all, lx_check_order. No front-end calls them (grep rpc(). Fix: `revoke execute on function public.lx_exc_put(text,text,text,text,text,text,text), public.lx_check_all(), public.lx_check_order(text) from public, anon, authenticated;` Trigger fns (lx_client_sync, lx_write_guard) can't be called via RPC — harmless. Also turn on Auth → Leaked password protection.
- 🟡 (security 2026-11-01) `luxella_catalog` (empty legacy table) has policy "service role full access" for role PUBLIC using true — anyone with the site key can INSERT/UPDATE/DELETE it (junk-fill / storage abuse). Service role bypasses RLS anyway, so: `drop policy "service role full access" on public.luxella_catalog;` (or drop the table if unused).
- 🟡 (security 2026-11-01) Any signed-in client can run owner maintenance RPCs that write the ops queue: lx_agent_health_check, lx_selftest, lx_selftest_run (no lx_is_owner check). Add to the revoke above: `revoke execute on function public.lx_agent_health_check(), public.lx_selftest(), public.lx_selftest_run() from public, anon, authenticated;` (cron/service role keeps access).
- 🟡 (security) lx-media `link_import` fetches any http(s) URL for any signed-in user (40/day) — restrict to owner or to an allow-list of retailer domains (edge-function code).
- (security) Vendor: pdf.js 3.11.174 has CVE-2024-4367 (JS in a crafted PDF) — mitigated in deals.js with isEvalSupported:false (security commit 2026-10-31); upgrade vendor/pdf*.js to ≥4.2.67 when convenient. jsPDF 2.5.1 has DoS CVEs (fixed 3.0.2) — low.
- View tracking: product views + Edit/Boutique opens (rpc like lx_visit writing a `views` doc) — schema/RPC change; today the funnel stops at "visits".
- Value anchor on Collection: "India retail ₹X" (coach.in Teri ₹39,999 vs our ₹27,900; lx_catalog.mrp null for Coach) — wording + source are pricing decisions.
- QA: committed deals sample in tools/qa/fixtures so Boutique/product/swipe steps actually run (galleryScrolls=None today); log LCP/long-task total instead of the fixed 4.5 s wait in check.py:144 (protected tools/qa).
- Hourly QA cron is sparse: 3 schedule runs in ~18 h (02:30, 09:51, 16:39 UTC) — GitHub drops `:07` crons; try another minute or an external trigger (protected .github/).

## Inbox
_(empty — chief 2026-11-03 merged all items into Now/Next/Needs Jeet)_

## Done
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
