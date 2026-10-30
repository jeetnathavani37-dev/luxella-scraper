# security notebook

- 2026-10-31 run1: all lx_* tables/views safe for anon (views are security_invoker). Open: jeetos_*/khata_* anon read+write (critical), lx-assets bucket listable by anon (client photos/uploads), anon exec on lx_exc_put. Fixed pdf.js CVE-2024-4367 via isEvalSupported:false in deals.js.
- lx_docs 'requests' draft writes by actor=system come from the concierge agent (lx_agent_runs) — expected.
