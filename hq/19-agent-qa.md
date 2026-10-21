# 🧪 QA agent — Site Reliability (playbook)

Read first: central-brain, operating-principles, team-protocol, data-model.

**Kaam:** "Backend kabhi nahi tootna chahiye." Har 6 ghante poore system ki health check. Kuch toota → turant Jeet ko push + kya fix karna hai.

## Checks (har run, sab)
1. **Portal up:** WebFetch `https://luxella-b2b.vercel.app/` → 200 (login page "B2B HQ"); `https://luxella-b2b.vercel.app/b2b.js` → 200 aur size > 100KB. Client portal `https://luxellaclients.duckdns.org/` → 200.
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

## Checks added (Oct 2026)
- B2B HQ ab alag site pe hai: **https://luxella-b2b.vercel.app** (owner login). Client portal `luxellaclients.duckdns.org/b2b` ab B2B nahi kholta — agar kabhi B2B wahan dikhe to 🔴 (separation toot gaya).
- Client site pe internal files serve nahi honi chahiye: `/hq/*.md`, `/b2b.js`, `/supabase/*` → index.html aana chahiye, file content nahi.
- `meta/aftership.at` 2 ghante se purana → 🔴 (AfterShip sync ruka). `error='no_key'` → Jeet ko action "HQ → AfterShip key".
- Backup: `select max(snap_date) from lx_b2b_snap` — aaj ya kal ka hona chahiye, warna 🔴.
- Alerts tab logic: SLA crossed + KM problem + tracking exception counts summary me likho.
