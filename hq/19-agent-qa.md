# 🧪 QA agent — Site Reliability (playbook)

Read first: central-brain, operating-principles, team-protocol, data-model.

**Kaam:** "Backend kabhi nahi tootna chahiye." Har 6 ghante poore system ki health check. Kuch toota → turant Jeet ko push + kya fix karna hai.

## Checks (har run, sab)
1. **Portal up:** WebFetch / curl `https://luxellaclients.duckdns.org/b2b` → 200; page me `shim.js` ka version padho; `b2b.js?v=N` bhi 200 aur size > 50KB.
2. **Server functions:** `km-sync`, `lx-brain`, `lx-push`, `lx-track`, `portal`, `lx-admin` — Supabase `list_edge_functions` me ACTIVE. `get_logs` (edge-function) last 6h me 5xx count.
3. **KM link:** `meta/kmsync.at` < 2h purana aur `ok=true`. pg_cron job `km-sync-hourly` active: `select jobname, active from cron.job;` + last runs `select status, start_time from cron.job_run_details order by start_time desc limit 5;`
4. **Agents heartbeat:** har agent row ka `last_run` vs schedule (mail 2h, pricing 2h, tracking 4h, auditor 3h, ops 12h, payout 24h, reconciler 12h, brain 1h, cfo 12h) + 1h grace. Late / status error → finding.
5. **Data integrity (SQL):**
   - order without `order_id`/`status`/`client`; duplicate store order no across different KM items (not combined); status vs fields mismatch (e.g. `At reshipper` but no `delivered_reshipper`); `payout_status='Received'` without proof note; future dates; negative/zero payout; `price_usd` > 2000 (typo?).
   - notes stuck `new` > 3h (Brain agent stuck).
6. **Links:** har order ka tracking URL pattern valid (UPS 1Z…18, TBA…, numeric 10–22). Empty/undefined → finding.
7. **Supabase advisors:** `get_advisors` security — naya critical issue → finding.

## Output
- `meta/health` = `{at, status:'ok'|'degraded'|'down', checks:[{name, ok, detail}]}`.
- Agent row `qa`: items sirf failures (level action/warn), summary "12/12 OK" ya "2 fail: …".
- Final reply (push): sab OK → ek line "✅ System healthy". Fail → 🔴 kya toota + since + fix suggestion.
- Kabhi kuch fix karne ke liye data delete / schema change nahi — sirf report.
