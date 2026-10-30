# Backlog (Product Chief keeps this ordered)
_Re-ordered by chief 2026-10-30 22:45 IST. Context: Jeet locked The Edit/Boutique for clients ("Opening soon", 341c52a), so client-facing work focuses on Overview/Tracker/Payments/Collection/login until it opens._

## Now (max 3)
1. (frontend) Forever-polling on every page: anim.js deco 1.5s / deck 1.2s / clamp 1s / prep 0.8s, deals.js scan2 1.2s / scan 1.5s — full-document querySelectorAll forever on iPhone. Replace with one shared debounced MutationObserver (or dash.onData hook), pause when document.hidden. One file per commit, QA green each step. — reliability/battery
2. (panel/frontend) Client login shows an "ADMIN PANEL" link — hide it for clients (owner keeps a faint route). Reads like a template to buyers (panel 2026-10-30, Priya). — trust
3. (design/frontend) iPhone clipping polish: tab strip edge fade so half-cut labels read as swipeable ("W", "ESS", "TE >"); "SHOW ALL 1" label clipped on Updates strip (webkit-client-home.png); policy search placeholder → "Search the policy". — trust/ease

## Next
- (frontend) Owner Edit "Post today's deals" form overflows the card on 390px — Markup/1 USD inputs and checkbox label cut (chromium-owner-boutique.png, run 41040217315).
- (frontend) Edit 🔎 search ("Coach nolita") returns nothing while the Collection has 5 Nolita 19 pieces → fall through to Collection results. Do before The Edit reopens for clients.
- (watchdog/frontend) If lx_deals is ever empty, deals.js render() returns before drawing the Edit/Boutique switch — keep the switch outside the empty-state early return.
- (frontend) Empty Private Edit state should offer a next step (last drop / Ask for a quote) — 6/10 buyers. Relevant once The Edit reopens.
- First Boutique open makes ~58 catalogue requests (~16 s on slow networks) — bundle/prefetch. (Boutique locked for clients now, so moved out of Now.)
- Product photos with coloured/grey backgrounds show a rectangle on the studio panel.
- (frontend) Dead CSS loops nothing renders: .cl-spot-st img / .cl-eg2 figure img spotBob, .ft-bag ftBob (style.css ~3220, 3427, 3599) — safe to delete.

## Later
- (frontend) style.css 503 KB, 815 !important, selectors up to .sw.sw.sw.sw.sw — consolidation pass, file by file, never one big rewrite. Design's override blocks at file end add to this; next design run should fold them into the base rules.
- (panel) Gulf/NRI ideas: named advisor card, gift-to-another-address + note, Arabic labels later.

## Needs Jeet (guarded / protected paths)
- 🔴 VERCEL_TOKEN secret missing — every CI deploy step prints "skipping deploy" and stays green. Prod matches HEAD tonight (file hashes checked 22:45 IST), so a manual deploy happened; future agent fixes won't auto-ship. Add the secret and make the step fail instead of warn (protected .github/).
- 🔴 9 client requests since 28 Oct all still `Submitted` (anshul: open ₹1.12L look, one piece went inactive). Replies/status are guarded. Also: show request status to the client (Seen / Sourcing / Quoted) — needs Jeet's flow.
- Trust block wording: "Authentic · sourced from the brand · invoice in your Document vault" + returns/duties line; Terms tab still says "Terms will be published here."; legal entity + GSTIN in footer; domain email instead of luxella.in@gmail.com (5/10 buyers).
- Catalogue: ~7.8k of 62.6k live pieces stale — ks 2057, mk 1696, fu 1436, vb(val) 1312, co ~1.4k, plus Sephora/Macy's — GitHub datacenter IPs blocked (403). Needs a residential proxy or a local runner.
- Add `val` (Valentino Bicester, 1312 rows) to outlet_scrape args in catalog-sync.yml (protected .github/).
- Retire pieces not seen for 7 days: `update lx_catalog set active=false where active and src_kind='outlet' and seen_at < now()-interval '7 days'` daily — 22k+ not seen in 36h.
- Furla duplicates: 670 pieces live twice; hide old no-underscore twins: `update lx_catalog b set active=false from lx_catalog a where b.id='fu_'||replace(substr(a.id,4),'_','') and b.id<>a.id and a.active and b.active and a.id like 'fu\\_%\\_%'` (ok?).
- Disable the old `outlet` / `drip` scheduled tasks (they fail trying to run scrapers in the sandbox; CI does this now).
- Security: 9 SECURITY DEFINER fns executable by anon (lx_check_order, lx_exc_put, lx_client_sync, lx_write_guard, lx_visit…) + jeetos_* "allow all for anon" policies — revoke where not needed (schema). Security agent's first run is 01:23 IST 31 Oct.
- View tracking: product views + Edit/Boutique opens (rpc like lx_visit writing a `views` doc) — schema/RPC change; today the funnel stops at "visits".
- Value anchor on Collection: "India retail ₹X" (coach.in Teri ₹39,999 vs our ₹27,900; lx_catalog.mrp null for Coach) — wording + source are pricing decisions.
- QA: committed deals sample in tools/qa/fixtures so Boutique/product/swipe steps actually run (galleryScrolls=None today); log LCP/long-task total instead of the fixed 4.5 s wait in check.py:144 (protected tools/qa).
- Hourly QA cron is sparse: 3 schedule runs in ~18 h (02:30, 09:51, 16:39 UTC) — GitHub drops `:07` crons; try another minute or an external trigger (protected .github/).

## Inbox
_(empty — chief triaged everything into the sections above on 2026-10-30)_

## Done
- (design 2026-10-30) LIVE + contact coins → 46px dark-glass buttons stacked right, no glow/ring/pulse, tuck away on scroll-down (1a4687c, 4d952d7; QA 41037506581 green). Live on prod.
- (frontend 2026-10-30) oneGold 1.2 s class churn stopped (diff-only), dead product-levitation observers removed (9b93c28; CI 41046801189 green). Live.
- (panel 2026-10-30) "1 order" not "1 orders" (459ff74); Paid badge tick aligned (0b34bf3); warmer contact note (00ab434). Live.
- (backend 2026-10-30) Shopify brands into CI more_scrape (4b939df); 429/5xx retry (a98f7dc) — sm_/vb2_ fresh after sync run 41032989924.
- (Jeet 2026-10-30) Velvet curtain removed on tab/page open (0e46775); The Edit locked for clients with "Opening soon" (341c52a).
