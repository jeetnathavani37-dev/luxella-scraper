# frontend notebook

- 2026-10-30: first run. QA metrics: nav load 100–190 ms (the 4.6 s "settle" is a fixed wait), DOM ~2.4k client / 2.9k owner, endless anims ≤5 (no deals fixture → boutique never really tested). gh CLI not authed: use github MCP actions_* + artifact download URL.
- 2026-10-30: fixed anim.js oneGold class churn (remove-all/re-add every 1.2 s) and removed lux-motion levitation observers (dead, CSS forced off). Biggest remaining: 6 forever setInterval DOM scans (backlog). Always bump ?v= in index.html+shim.js when changing assets.
- 2026-10-30: run 41046801189 green, QA metrics unchanged (0 diffs), but deploy step had empty VERCEL_TOKEN → nothing reaches prod yet.
- 2026-10-31: anim.js 5 setIntervals → window.__lxTick(fn) shared throttled MO scheduler (≥250 ms after change, ≤1/s, 5 s beat, skips hidden). Reuse __lxTick for any new DOM-decoration pass instead of setInterval. deals.js scans were already MO.
- 2026-10-31: Hey Luxella (.hv-x) now aria-label=Close + Escape → QA voice-close actually closes (nodes 2478→2459). CI 41195827831 green, deploy still VT empty (not live). Next: ui2.js setH 2 s interval, off-screen carousel timers.
