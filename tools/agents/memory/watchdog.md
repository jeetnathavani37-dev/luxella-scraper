# watchdog notebook
- 2026-10-29: CI deploy job prints "VERCEL_TOKEN secret not set — skipping deploy" and still goes green; check the deploy log for READY, not just the job conclusion.
- 2026-10-29: lx_docs collection='crash' rows can be unfinished-session breadcrumbs (done:false, steps list) with no error text — not a JS crash by themselves.
- 2026-10-29: edge logs: query_logs source function_edge_logs (response.status_code) + function_logs (level) works for lx-voice/lx-admin health.
