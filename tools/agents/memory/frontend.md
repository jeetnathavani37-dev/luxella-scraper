# frontend notebook

- 2026-10-30: first run. QA metrics: nav load 100–190 ms (the 4.6 s "settle" is a fixed wait), DOM ~2.4k client / 2.9k owner, endless anims ≤5 (no deals fixture → boutique never really tested). gh CLI not authed: use github MCP actions_* + artifact download URL.
- 2026-10-30: fixed anim.js oneGold class churn (remove-all/re-add every 1.2 s) and removed lux-motion levitation observers (dead, CSS forced off). Biggest remaining: 6 forever setInterval DOM scans (backlog). Always bump ?v= in index.html+shim.js when changing assets.
- 2026-10-30: run 41046801189 green, QA metrics unchanged (0 diffs), but deploy step had empty VERCEL_TOKEN → nothing reaches prod yet.
