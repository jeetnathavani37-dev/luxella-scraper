# Backlog (Product Chief keeps this ordered)

## Now
- First Boutique open makes ~58 catalogue requests (~16 s on slow networks) — bundle/prefetch.

## Next
- Product photos with coloured/grey backgrounds show a rectangle on the studio panel.

## Inbox
- (panel) Trust block on Edit/product: "Authentic · sourced from the brand · invoice in your Document vault" + returns/duties line; Terms tab shows "Terms will be published here." — needs Jeet's real wording/legal entity/GSTIN (5/10 buyers, 2026-10-30).
- (panel) Contact email is a Gmail address (luxella.in@gmail.com) — a domain email would lift trust (Jeet).
- (panel) Empty Private Edit state should offer a next step (last drop / Ask for a quote), not only "every evening" (6/10 buyers).
- (panel) Prod login shows "ADMIN PANEL" link to clients — hide or make it a faint owner-only route.
- (panel) Policy search placeholder truncates on iPhone ("Search the policy (paymer") — shorten to "Search the policy".
- (panel) Tab strip shows half-cut labels at both edges ("W", "ESS", "TE >") — add edge fade so it reads as swipeable.
- (panel) Gulf/NRI ideas: named advisor card, gift-to-another-address + note, Arabic labels later.
- (watchdog) CI deploy step should fail, not warn, when VERCEL_TOKEN is missing — otherwise green runs ship nothing.
- (watchdog) Updates strip "SHOW ALL 1" button label is clipped on iPhone (webkit-client-home.png).
- (watchdog) QA never reaches the Boutique: no deals fixture → Edit shows empty state, boutique/product/swipe steps no-op (galleryScrolls=None). Needs a committed deals sample in tools/qa/fixtures (Jeet — protected path).
- (watchdog) If lx_deals is ever empty, deals.js render() returns before drawing the Edit/Boutique switch — the 61k-piece Boutique becomes unreachable. Keep the switch outside the empty-state early return.
- (backend) Catalogue sync silently 0 for 6 stores on GitHub runners (run 40985673309): Coach/Kate Spade outlet 403, Sephora 403, Macy's blocked, Michael Kors listed 0, Furla give-up. Datacenter IPs blocked — needs a residential proxy or a local runner (Jeet). ~6.5k live pieces now stale since 28–29 Oct.
- (backend) Valentino Bicester (`val`, 1312 vb_ rows) is not in outlet_scrape's default list, so CI never refreshes it — add `val` to the workflow args (protected .github/, Jeet).
- (backend) Nothing retires pieces that stop appearing: 22k+ live rows not seen in 36h. Proposal (Jeet decides rule): `update lx_catalog set active=false where active and src_kind='outlet' and seen_at < now()-interval '7 days'` daily.
- (backend) Furla duplicates: 670 pieces live twice (ids `fu_WP00310_ARE000_1007_O6000` and `fu_WP00310ARE0001007O6000`). Hide the old no-underscore twins: `update lx_catalog b set active=false from lx_catalog a where b.id='fu_'||replace(substr(a.id,4),'_','') and b.id<>a.id and a.active and b.active and a.id like 'fu\\_%\\_%'` (Jeet ok?).
- (backend) Old `outlet`/`drip` scheduled agents keep failing (3+2 errors/24h) trying to run scrapers in the sandbox — CI does this now; disable those two scheduled tasks (Jeet).
- (backend) Advisors: 9 SECURITY DEFINER fns executable by anon (lx_check_order, lx_exc_put, lx_client_sync, lx_write_guard, lx_visit…) and jeetos_* tables have "allow all for anon" policies — review with security agent; revoke anon EXECUTE where not needed (Jeet, schema).
- (backend) 2026-10-30 14:50 IST: Steve Madden (sm_, 2499) + Vera Bradley (vb2_, 1831) got http 503 on CI run 40996911185 and the Shopify loop gave up on first non-200 → still 0 fresh. Fixed: retry 429/5xx up to 4× with backoff (more_scrape + outlet_scrape). Same stores return 200 from a non-GitHub IP, so if 503 repeats it's IP blocking → same proxy/local-runner ask as the Coach/KS item.

## Done
- (design 2026-10-30) LIVE + contact coins → 46px dark-glass buttons stacked on the right, no glow/ring/pulse, tuck away on scroll-down; left headings clear (1a4687c, 4d952d7; QA run 41037506581 green). Not live until VERCEL_TOKEN is set.
