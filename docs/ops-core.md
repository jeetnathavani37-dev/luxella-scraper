# Luxella ops core (Supabase project qzripzgbstvxkfobzhyv)

Objects added 23 Oct 2026. All live in `public`. Nothing is ever deleted; status only moves forward.

| Object | Kind | Purpose |
|---|---|---|
| `lx_apply(order, patch, source, overwrite=false)` | function | The only safe way to update an order: forward-only status, filled fields protected, log row |
| `lx_b2b_touch_t` | trigger | Sets `updated_at` on every write (needed for delta sync) |
| `lx_payout_guard_t` | trigger | `payout_status=Received` needs `payout_utr` or `received_ok`; otherwise held + Jeet asked |
| `lx_events` | table | Event bus: order.created / status / payout / tracking / field, jeet.message, ticket.created, ext.* |
| `lx_emit_t`, `lx_run_flows_t` | triggers | Emit events; run `kind='flow'` rules (ticket / msg / webhook / apply), dedupe per event |
| `lx-hook` | edge function | Inbound webhook for n8n / Zapier (header `x-lx-secret`) |
| `lx_exceptions` | table | Problems register: rule × record, severity, owner, action, open / resolved / waived |
| `lx_rules_for`, `lx_check_order`, `lx_check_all` | functions | Rules engine; runs on every order write and hourly (`lx-check-all`) |
| `lx_auto_archive(45)` | function, nightly | Asks Jeet before closing orders that pass every check |
| `lx_selftest()` / `lx_selftest_run()` | functions, daily | 11 safety tests inside a rolled-back block; result in `meta/selftest`, failure = critical problem |
| `lx_v_patterns`, `lx_v_pattern_flags`, `lx_v_dupes` | views | Learned medians (n≥3), out-of-pattern orders, cross-channel duplicates |
| `lx_channel_stats()` | function | Server totals per channel (archived included) |

Run the safety tests any time: `select lx_selftest();`

## Added 23 Oct (intelligence & control layer)

| Object | Purpose |
|---|---|
| `lx_approval_guard_t` | Only Jeet's login can set `received_ok` or close (`archived`) an order; agents are stripped and logged (`approval_blocked`) |
| `lx_waive_guard_t` | Only Jeet can waive a problem |
| `lx_v_problems` | Open problems ranked by severity + ₹ at stake + age, with "if ignored" and basis (verified rule vs learned pattern) |
| `order.field` events | Before/after/who for price, payout, reship, profit, UTR, payout date, store order no, client, reshipper |
| `doc.version` events | Previous text of every playbook / rule doc on each change (agent instructions are versioned) |
| `price_stale` rule | To-place order whose store price check is older than 3 days |
| Portal: All → Approvals, What-if, Problems "Do these first", order History | Approvals apply as Jeet; What-if never saves |

Safety tests: 13 (`select lx_selftest();`).

## Release safety (release/)

`release/release.sh` is the only way to ship the B2B portal.

1. Syntax check of b2b.js (`node --check`).
2. Local smoke: the staged files are served on localhost and `release/smoke.js` runs login, every workspace (no JS errors, non-empty render), and a write+read on `meta/smoke`. A failure stops here; production is untouched.
3. Deploy with `autoAssignCustomDomains:false`, so the live domain does not move.
4. Point luxella-b2b.vercel.app at the new deployment; verify the live b2b.js hash.
5. Live smoke. A failure rolls the domain back automatically to the previous deployment.

Every run is logged in `lx_b2b` meta/releases (last 30: time, commit, b2b.js hash, deployment, previous deployment, smoke result).
`release.sh rollback [dpl_id]` points the domain back in about 1 second.
Secrets: VT/TEAM (Vercel) and LX_SMOKE_EM/LX_SMOKE_PW come from env only. The smoke test never touches orders.
Verified 2026-10-23: a syntax error and a runtime error in a workspace were both blocked at step 1/2; rollback took 1.4 s.
