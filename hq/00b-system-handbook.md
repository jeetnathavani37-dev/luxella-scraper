# 📘 Luxella System Handbook — poora system ek jagah

> Har agent ye padhta hai taaki pata rahe **hum kya karte hain, kaise karte hain, kahan kya hai**. Central brain = values & rules; ye = poora nakshaa.

## 1. Business lines
| Line | Kya | Status | Kahan track |
|---|---|---|---|
| **KicksMachine (KM) B2B** | KM bid jeeto → US/UK/CA store se kharido → reshipper → India → KM warehouse → MRN → confirmation → payout (~7 din) | **Main engine, ~5 orders/din** | B2B HQ portal (sab tabs) |
| **Sourcex / Culture Circle** | Same model, Sourcex customers | **Paused** (payout delays) — sirf purane orders ka hisaab | B2B HQ → Sourcex tab |
| **WhatsApp clients** (Swayam, Himanshu, …) | Direct HNI / resellers — 50% advance (resellers 100%) | Active | Client portal (har client ka apna page) + B2B "More → All orders" |
| **In-hand inventory** | RTO + old stock — naya bid match ho to yahin se do | chhota | `kind='inv'` |

## 2. Do portals — bilkul alag
- **B2B HQ (sirf Jeet):** https://luxella-b2b.vercel.app — Supabase `lx_b2b`. Owner login only.
- **Client portal:** https://luxellaclients.duckdns.org/<client> — client sirf apna order dekhta hai. Wahan B2B / KM / Sourcex ka koi zikr nahi. Client-facing text me hamesha "Luxella", kabhi "Jeet" nahi.

## 3. B2B HQ navigation (groups → tabs)
- **Today:** Overview (✦ Aaj ka focus, flow tiles, money, agents) · **To-dos** (15 reminder sections — see agent-ops).
- **Buying:** Bids · **Not placed yet** (To place, GO/TIGHT/NO price check) · **Orders placed** (store order cards, ek card = ek store order / ek tracking, multiple KM IDs).
- **Shipping:** Intl transit (store → warehouse) · Warehouse (form, dispatch) · Reshippers (rates, dena baaki, paid, form format) · Landed India · To KicksMachine.
- **KM & payouts:** MRN · Confirmation · Payouts (7-day timer, chase).
- **Sourcex** · **Money** (invested, received, profit, bank, receivable, targets) · **Alerts** · **HQ** (patterns, KM link, AfterShip, AI, agents, playbooks) · Checklist · More tools.
- Har quick/bulk action ke baad **Undo** (9 sec). ⌘K = search anything. 💬 assistant = paste / photo / voice → proposals.

## 4. Order lifecycle (status → kaun aage badhata hai)
To place → Ordered (store order no.) → In transit to reshipper (tracking) → At reshipper (warehouse delivered) → Shipped from hub (AWB) → Landed India → Shipped to KM (courier) → Delivered to KM → MRN updated → KM confirmation (`mrn_confirmed`, `payout_timer`) → payout Received.
- Status hamesha dates se derive hota hai, sirf **aage**. Cancelled = KM/Sourcex ne cancel kiya (proof ke saath).
- Auto-movers: KM sync (har ghante: cancel, SLA, store order/tracking from KM, delivered→`delivered_km`), AfterShip sync (key ho to), Mail agent (store/courier/KM mails), Brain (Jeet ke notes/photos), Jeet (portal buttons).

## 5. Data (Supabase `qzripzgbstvxkfobzhyv`)
- `lx_b2b(kind,id,data)`: order · bid · buy (store order card) · km (KM mirror) · meta (kmsync, km_bids, km_notifications, km_stats, finance, reshippers, aftership, patterns, health, mailsync) · agent · doc · note · inv.
- `lx_b2b_snap` — roz raat 3 baje backup (30 din). `lx_km_vault` (KM login + cron key — kabhi print nahi). `lx_secrets` (aftership_key etc. — kabhi print nahi).
- Client portal: `lx_clients`, `lx_orders`, `lx_docs`.

## 6. Server jobs
- `km-sync-hourly` (:07 har ghante) → KM Nexus read-only sync → AfterShip sync → (3 baje) backup.
- Edge functions: km-sync, lx-aftership, lx-brain (optional instant AI), lx-push (push), lx-track (client tracking), portal, lx-admin, lx-order-alert.

## 7. The AI office (scheduled Claude agents, Asia/Kolkata)
| Agent | Kab | Kaam |
|---|---|---|
| 🧠 Brain (Chief of Staff) | 8am–11pm har ghante :41 | Notes/photos/voice → orders; bulk notes; patterns + lessons (raat ka run) |
| 📬 Mail | har 2 ghante | Gmail → bids, store orders, shipping, KM confirmations; inbox suggestions |
| 💰 Pricing | har 2 ghante | Naye bids ka store price + landed + margin → GO / TIGHT / NO |
| 🚚 Tracking | har 4 ghante | Saare tracking, late parcels, AfterShip health |
| 📋 Ops (COO) | 8:41am, 7:41pm | To-dos push (section-wise), WhatsApp/mail **drafts** |
| 💸 Payout | 10:52am | Confirmation + 7 din, chase list |
| 📊 CFO | 9:37am, 9:37pm | Money: invested, received, profit, bank, receivable, reshipper dues |
| 🔍 Reconciler | 9:23am, 9:23pm | KM All Orders vs portal line-by-line (cancel, payout, IDs) |
| 🛡️ Auditor | har 3 ghante | Sabki galtiyan, data quality, weekly lessons distill |
| 🧪 QA / SRE | 2:53, 8:53, 14:53, 20:53 | Sites, functions, sync freshness, backup, separation checks |

## 8. Hard rules (sab agents, hamesha)
1. **KicksMachine MRN Google Sheets aur KicksMachine Nexus portal kabhi edit nahi** — sirf padhna.
2. Koi mail/message **bhejna nahi** — sirf drafts. Paisa, order place/accept/reject = sirf Jeet.
3. Secrets kabhi print nahi. Client-facing = "Luxella".
4. Data me sirf proof wali baat, status sirf aage, khaali field bharna > bhare hue ko badalna (conflict = item for Jeet).
5. Har run: agent row (last_run, status, summary, items, history). Galti pakdi → `lessons` doc me line (learning-loop).

## 9. Ek bhi order miss na ho — coverage checks
- KM mirror (`kind='km'`) ka har non-cancelled order portal me hona chahiye (Reconciler + QA).
- Har bid mail (won / admin placed) ka order row (Mail).
- Har store order mail ka buy card + linked KM order (Mail; doubt → Jeet).
- Har order jiska stage threshold (patterns p80) se zyada ho → To-dos me (portal) + Ops push.
- Har confirmed order → 7 din → payout chase (Payout).
