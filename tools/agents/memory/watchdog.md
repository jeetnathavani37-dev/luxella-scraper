# watchdog notebook
- 2026-10-29: CI deploy job prints "VERCEL_TOKEN secret not set — skipping deploy" and still goes green; check the deploy log for READY, not just the job conclusion.
- 2026-10-29: lx_docs collection='crash' rows can be unfinished-session breadcrumbs (done:false, steps list) with no error text — not a JS crash by themselves.
- 2026-10-29: edge logs: query_logs source function_edge_logs (response.status_code) + function_logs (level) works for lx-voice/lx-admin health.
- 2026-10-30: hourly cron (:07) had not fired by 00:38 UTC — newest run still push #6 (22:48 UTC 29 Oct); judge freshness by run time, not just status.
- 2026-10-30: 01:38 UTC — cron '7 * * * *' still silent (missed 23:07/00:07/01:07; workflow state=active). gh CLI unauthenticated in sandbox — use GitHub MCP actions_list/get_job_logs instead.
- 2026-10-30: 02:38 UTC — hourly cron finally fired (run #7, 02:30, schedule event, deploy job skipped by design on schedule). QA green, 0 problems, 0 crashes, 0 edge 5xx.
- 2026-10-30: QA has no lx_deals fixture (DEALS=[]), so deals.js render() shows the empty state and never draws the Boutique switch — boutique/product/product-swipe steps click nothing (galleryScrolls=None). Green ≠ boutique tested. Prod has 13 deals + 18 pdfs, so prod is fine.
