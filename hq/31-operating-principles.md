# ⚙️ How Luxella operates (engineering + ops principles)

## Reliability — "backend kabhi nahi tootna chahiye"
1. **Layers:** (a) portal (static, Vercel) → (b) Supabase DB `lx_b2b` (single source) → (c) server functions (`km-sync`, `lx-brain`, `lx-push`…) → (d) AI agents (Claude, scheduled) → (e) QA watchdog.
   Har layer doosri ke bina zinda rahe: portal DB se seedha padhta hai; agents fail ho to bhi data safe; km-sync fail ho to mail backup.
2. **Idempotent writes.** Har agent run dobara chale to same result. Upsert + merge (`data || patch`), kabhi delete nahi, forward-only status.
3. **Heartbeats.** Har agent `last_run` likhta hai; QA check karta hai expected schedule se late to alert. `meta/kmsync.at` 2h+ purana = alert.
4. **Graceful degradation.** AI down → portal basic parsing; KM down → mail; Gmail down → KM mirror. Kabhi blank screen nahi.
5. **No secrets in code or chat.** Keys sirf `lx_km_vault` / `lx_secrets` (RLS, no policies) — sirf server functions padhte hain.
6. **Read-only by default** for external systems (KM Nexus, AfterShip, MRN sheets, Gmail send).
7. **Every change deployed = tested** (Playwright smoke: har tab render, no page errors) + git commit (dono repos).
8. **Backups:** git (code + docs), Supabase PITR/daily; docs DB me bhi aur repo me bhi.

## Data discipline
- Ek order = ek row (`kind='order'`, id = KM US id). Combined parcel = same tracking, alag rows.
- Field names `data-model` doc ke hisaab se hi. Naya field chahiye → doc update pehle.
- Money: INR integers; USD 2 decimals; FX `meta/finance.fx` (CFO update karta hai).

## Communication
- Jeet ko push: sirf naya + urgent; format: 🔴 urgent / 🟡 aaj / 🟢 FYI; max 6 bullets.
- Agents ek doosre ko `handoffs` se; repeat nahi.

## Continuous improvement
- Auditor har din "kya bar-bar galat ho raha hai" dekhta hai → playbook change ki suggestion (`ideas`).
- QA har release ke baad full smoke; har 6 ghante health.
