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

## Revenue leakage recon (flag-only)

`lx_recon` holds facts copied from outside sources. `lx_v_recon` shows the non-stale rows. Order rows are never written by recon.

| src | batch | from |
|---|---|---|
| mrn_jeet / mrn_km | sheet tab | JeetXMRNKM / KM's JEET KM MRN (read-only) |
| payout_mail | UTR | Razorpay "Paid out Successfully" (Sourcex), KM credit mails |
| payout_link | km-cashfree-<date> | KM finance link mails (link is not proof of credit) |
| order_mail | order id | KM "You won the bid", SourceX "Order Received" |

- `lx_recon_load(src,batch,total,rows,meta,evidence)`: upserts one batch. Rows that disappear are marked stale, never deleted. Owner or service only.
- `lx_recon_check()`: hourly (cron `lx-recon-check`, minute 27). Writes to lx_exceptions; recon rules that are no longer seen auto-resolve.
- Rules:
  - recon_sum: sheet rows ≠ sheet TOTAL
  - recon_amount: MRN or order-mail amount ≠ portal payout
  - recon_missing: on MRN but not in the portal, or Delivered to KM but not on KM's sheet
  - recon_unlinked: UTR with no order; suggests a candidate order
  - recon_payout: UTR amount ≠ the orders on it
  - recon_no_evidence: KM Received with no UTR and no payout mail or link for its MRN
- Loader: scheduled task "B2B · 🔍 Recon Loader", 09:43 + 21:43 IST.
- UI: Money → 🔍 Reconcile.
- First run (24 Oct 2026): 67 source rows, 9 flags. KM 8-10 sheet ₹3,300 over its total; US108960/US109072 amounts swapped on KM's sheet; MRN 08-10 (₹75,700) marked Received with no KM payout evidence; SX342071 paid ₹128 less than the order mail; UTR 625023094972 (₹9,058) unlinked, likely SX314613. Sourcex UTRs Jul–Oct all tie out to the rupee.

## Agent ledger and health (24 Oct 2026)

- `lx_agent_runs`: one row per agent run, appended by `lx_agent_done`. The append is wrapped so a ledger error never blocks an agent.
  - Counts made since the agent's previous run, by SQL: msgs, asks, tickets_opened, tickets_closed, field_changes (kind=log by/via).
  - `duration_s` is filled only when the run began with `lx_agent_start(agent)`. Otherwise it reads "not measured".
- `lx_agent_health_check()`: hourly (cron `lx-agent-health`, minute 33). Thresholds live in meta/agent_sla.
  - agent_error: last run status is error.
  - agent_silent: no run for more than 2× the agent's schedule.
  - agent_error_streak: N errors in a row.
  - agent_stuck_ticket: tickets overdue 24h+.
  - agent_unanswered_ask: questions to Jeet unanswered 24h+.
  - Raises one problem per agent per rule. A rule that is no longer seen auto-resolves.
- UI: HQ → 📈 Agent stats. Shows runs, ok % (ok ÷ all runs), last ok, actions, tickets in, open questions, and drill-down. Tokens, cost, tool calls and retries show "not measured".
- All 13 scheduled agents (brain, ops, mail, tracking, reconciler, cfo, payout, pricing, clientdesk, auditor, qa, council, reconloader) start with `lx_agent_start` and end with `lx_agent_done` (prompts updated 24 Oct 2026, Jeet approved). Night Council now ends through `lx_agent_done` too.

## Write guard (Trust layer Phase A, 24 Oct 2026)

`lx_write_guard_t` is a BEFORE INSERT/UPDATE/DELETE trigger on `lx_b2b`. It enforces these rules on every writer that is not exempt. Agents write as `postgres`, so it applies to all of them.

- An order's status may move only forward (`lx_st_rank`), or to Cancelled.
- A filled protected field is never overwritten: price_usd, payout, payout_utr, payout_date, retailer_order_id, retailer_tracking, reshipper, client, order_id.
- A filled text or number field is never blanked.
- An order whose order_id is already live cannot be inserted again.
- No row of any kind can be deleted. The row is kept.

When a change is blocked:
- The rest of the write still applies.
- A `guard.blocked` event is written, with the agent from `lx_current_agent()`.
- A deduped ✓ Approvals card is created. Its "Haan, apply karo" button applies the change through Jeet's login.

Exempt writers:
- Jeet's owner login.
- Flows (`lx.in_flow`).
- `service_role` (edge functions such as km-sync and sx-sync).
- A session with `set_config('lx.override','<reason>',true)`. Every override is logged as `guard.override`.

Other parts of Phase A:
- Field history (`order.field.by`) now names the agent whose run is open, instead of `postgres`.
- `lx_claim_check()` runs hourly (cron `lx-claim-check`). It raises `claim_unverified` for any ticket closed as done that asked for a change, where no event or log for that order exists between open and close. Results saying "already" or "no change" are skipped.
- `lx_guard_selftest()` has 11 tests in a rolled-back sub-transaction. It runs daily (cron `lx-guard-selftest`), writes the result to meta/guard_selftest, and raises `selftest_failed` on any failure. The existing 13 tests still pass with the guard on.
- The delete-block path is not covered by an automated test: SQL containing `delete` is cancelled from this tooling.

Rollback: `drop trigger lx_write_guard_t on lx_b2b;`. Everything else is additive.

## Email facts (Trust layer Phase C, 24 Oct 2026)

`lx_mail_fact(agent, message_id, thread_id, mail_at, sender, subject, order_id, match, facts[])` is the only path for order fields that come from an email. The Mail, Payout and Tracking prompts were updated to use it.

For each fact, `{field, value, basis: stated|inferred}`, it does the following:
- **Duplicate:** the same message + order + field already processed → `duplicate`. Nothing is written.
- **Becomes a proposal** (Approvals card) when any of these is true: unknown field; match not `exact`; basis `inferred`; a payment field (UTR, date, status) from a sender that is not Razorpay, Cashfree, KM finance or Culture Circle.
- **Same value as stored** → `already`.
- **Otherwise** it writes the field and reads it back:
  - `applied` if the stored value now matches.
  - `blocked` if the write guard kept the old value. The guard has already created a proposal.
- **Unknown order** → `no_order`. Nothing is written.

Every fact is stored in `lx_mail_facts`: message and thread ids, sender, subject, stated/inferred, match, action, before and after values, agent.

`lx_mail_selftest()` covers 11 scenarios: exact fill; the same mail twice; an inferred value; a supplier price change on a priced order; a fake payment mail; a real Razorpay UTR; a fuzzy match; a malicious mail trying to set payout; an unknown order; one mail with two orders; every fact recorded.

The daily `lx_guard_selftest_run()` runs the guard and mail suites together. Result on 24 Oct: 22/22 passed.

## Mail lock and sensitive-access lockdown (24 Oct 2026)

Rule from Jeet: agents never send mail, and never edit the KM portal, reshipper forms or other sensitive systems on their own.

Live now:
- `lx_notify_push()` (trigger on `lx_orders` and `lx_docs`): when the change comes from a direct DB session (`session_user = postgres`, which is how agents and the SQL connector connect), no client email or push is sent. The data change still applies. A `mail.held` event and an Approvals card ("✉️ Mail roka") are created instead. Portal changes (owner, clients) and edge functions (service_role) work as before. `lx.override` lets an approved action through.
- `lx-push` v31: `test_email` and `test_order` need Jeet's login. The hook secret alone gets 403 (verified).

Ready in code, deploy after Jeet adds edge secrets `LX_VAULT_KEY`, `SMTP_USER`, `SMTP_PASS`:
- `km-sync` and `sx-sync` seal the KM/SX logins in `lx_km_vault` with AES-GCM, so agents reading the table see only ciphertext.
- `lx-push` and `lx-welcome` read SMTP from env; then `smtp_pass` in `lx_secrets` gets blanked.

Only Jeet can do (scheduled-task connector settings): remove Gmail send/reply/forward and browser connectors from agents. That is the only hard block on the Gmail connector, the KM portal website and reshipper Google Forms.

Known gap: an agent that reads `hook_secret` can still call `lx-push` with a crafted client-update payload. Closing it needs the hook secret moved out of SQL reach.
