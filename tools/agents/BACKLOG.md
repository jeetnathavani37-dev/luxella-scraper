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
- 🔴 (security 2026-10-31) JeetOS + Khata private data is open to anyone with the public site key (it is in shim.js): jeetos_profile, jeetos_coach_notes, jeetos_logs, khata_state, khata_telegram_chat return rows with no login, and 20 jeetos_* tables + khata_* allow anon INSERT/UPDATE. Not client data, but Jeet's own. Fix (keep khata anon INSERT only if the SMS phone app needs it):
  `do $$ declare r record; begin for r in select tablename,policyname from pg_policies where schemaname='public' and tablename like 'jeetos\_%' and policyname='allow all for anon' loop execute format('drop policy %I on public.%I',r.policyname,r.tablename); end loop; for r in select tablename,policyname from pg_policies where schemaname='public' and tablename like 'khata\_%' and 'anon'=any(roles) and cmd in ('SELECT','UPDATE') loop execute format('drop policy %I on public.%I',r.policyname,r.tablename); end loop; end $$;` — first check the JeetOS/Khata apps sign in (they break if they read with the anon key).
- 🟠 (security 2026-10-31) Storage: bucket lx-assets is public AND policy lx_assets_read lets anyone LIST it — per-client order photos (himanshu/ 11, swayam/ 2) and client-uploads/ (8 images + 1 PDF) can be listed and downloaded with the public key. Public file URLs keep working without a SELECT policy, so restrict listing:
  `drop policy lx_assets_read on storage.objects; create policy lx_assets_read on storage.objects for select using (bucket_id='lx-assets' and (lx_is_owner() or (storage.foldername(name))[1] in ('deals','site')));`
  Later: move owner order photos (admin.js:396 uploads to lx-assets/<slug>/) and client pdfLink/reqImage (shim.js:131-132) to lx-private + signed URLs.
- 🟡 (security) SECURITY DEFINER RPCs callable without login: lx_exc_put (anyone can inject/re-open fake exceptions in the ops queue), lx_check_all, lx_check_order. No front-end calls them (grep rpc(). Fix: `revoke execute on function public.lx_exc_put(text,text,text,text,text,text,text), public.lx_check_all(), public.lx_check_order(text) from public, anon, authenticated;` Trigger fns (lx_client_sync, lx_write_guard) can't be called via RPC — harmless. Also turn on Auth → Leaked password protection.
- 🟡 (security) lx-media `link_import` fetches any http(s) URL for any signed-in user (40/day) — restrict to owner or to an allow-list of retailer domains (edge-function code).
- (security) Vendor: pdf.js 3.11.174 has CVE-2024-4367 (JS in a crafted PDF) — mitigated in deals.js with isEvalSupported:false (security commit 2026-10-31); upgrade vendor/pdf*.js to ≥4.2.67 when convenient. jsPDF 2.5.1 has DoS CVEs (fixed 3.0.2) — low.
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
