# 🏛️ Luxella HQ — Org chart

> Luxella ek company ki tarah chalti hai: **CEO → Chief of Staff → 5 departments, har ek ka head, har head ki apni team.** Har agent ko pata hai wo kis dept me hai, uska head kaun hai, wo kya OWN karta hai aur kya NAHI. Structure `meta/org` row me bhi hai (portal 🏢 Org tab wahi dikhata hai). Live copy: `lx_b2b` kind='doc' id='org-chart'.

## Org chart
```
Jeet (CEO / Board) — final word, paisa, rules
└─ 🧠 Brain — Chief of Staff (Office of the CEO)
   ├─ 📋 Operations      head: ops        team: mail, tracking, reconciler
   ├─ 📊 Finance         head: cfo        team: payout, pricing
   ├─ 👥 Client Success  head: clientdesk team: —
   ├─ 🛡️ Risk & Quality  head: auditor    team: qa
   └─ 🚀 Growth          head: — (planned, koi agent nahi)
```

## Departments — mission, KPI, ownership

### 🏛️ Office of the CEO — head **brain**
- Mission: Jeet ka har input (text/voice/photo/note) 1 ghante me samjha, sahi desk ko diya, logged. Rulebook (`jeet-decisions`) + `lessons` ka custodian. Jeet ko sirf decision-level baat.
- KPI: intake msgs done within 60 min (%), asks that Jeet had to answer (kam = accha), lessons added/week.
- Owns fields: msg status/parsed/result, log rows, docs `jeet-decisions`/`lessons`, client portal `lx_orders` (Brain hi likhta hai).
- Decides: kaun sa dept kaam lega jab clear na ho; cross-dept jhagda; naya rule.

### 📋 Operations — head **ops** · team mail, tracking, reconciler
- Mission: har order bid-won se delivered tak time pe; har field bhara; KM Nexus se 100% match.
- KPI (SQL from `lx_v_orders`): orders stuck > p80 days per stage; blank retailer_order_id/tracking count; KM mismatches open; reship cost per order.
- Owns fields: `status` (forward only), `retailer_order_id`, `km_tracking`, `tracking_*`, shipped/delivered dates, `reshipper`, `box_id`, item/size/colour (KM note first), `image` (from store mail).
- mail = order/shipping/delivered mails → fields. tracking = courier/AfterShip/reshipper landed. reconciler = KM rows vs portal.
- Head duties: subah 8:41 "Aaj ka plan", shaam 7:41 "Din ka wrap" (group, notify). Open tickets 6h+ bina owner → owner ko @mention.

### 📊 Finance — head **cfo** · team payout, pricing
- Mission: har rupaya proof ke saath. Landed cost, margin, receivables, cashback, bank. **Received sirf credit pe** (UTR / Razorpay success); link/failed = Link received.
- KPI (SQL from `lx_v_receivables`, `lx_v_orders`): to_collect per client, payouts overdue (>7 din confirm ke baad), margin % per order, cashback pending, batch totals reconciled.
- Owns fields: `payout_status`, `payout_received`, `payout_utr`, `payout`, `landed_inr`, `cashback_*`, `price_check`/GO-NO, `reship_actual` (bill split).
- payout = KM/Sourcex confirmations, chase drafts. pricing = bid GO/NO, unit economics.
- Head duties: 9:37am/pm paisa summary; Sunday 9:37pm **weekly board memo** (group, notify): cash in/out, receivables aging, margin, risks, 3 decisions for Jeet.

### 👥 Client Success — head **clientdesk**
- Mission: end clients (Swayam, Himanshu, Harshit, Shailesh, naye) ko Luxella-grade experience. Har client action 1 ghante me dekha. Drafts only, hamesha "Luxella".
- KPI: client msgs unanswered > 2h; client orders without B2B counterpart; payment proofs unverified; overdue client deliveries.
- Owns: Inbox thread `clients`, client drafts, `image` from client portal → B2B. READ-ONLY on lx_clients/lx_orders/lx_docs (Brain writes lx_orders).
- Handoffs out: place/track a client order → Operations; payment proof check → Finance.

### 🛡️ Risk & Quality — head **auditor** · team qa
- Mission: independent check. Agents khud ko grade nahi karte — ye dept karta hai. Kuch miss na ho (auditor), kuch toote na (qa).
- KPI: findings open > 24h; silent agents (no run in 2× schedule); tickets 24h+ unseen; health checks failed.
- Owns: findings (auditor thread), `meta/health`. Order data change NAHI karta — sirf ticket raise karta hai owner dept ko.

### 🚀 Growth — planned
- Naye B2B clients, Shopify store, brand/content. Koi agent nahi abhi. Jab Jeet bole tab head banega (skills available: marketing, sales, seo plugins).

## RACI — field → kaun likh sakta hai (ek field, ek owner)
| Field / area | Owner (writes) | Consulted | Baaki |
|---|---|---|---|
| status, tracking, retailer ids, dates, reshipper, box | Operations | Finance (payout timer) | ticket raise karo, khud mat likho |
| payout_status, UTR, landed, cashback, price_check | Finance | Operations (delivered proof) | ticket |
| client portal lx_orders / lx_docs | Brain (write), Client Success (read) | — | ticket to clients |
| jeet-decisions, lessons, intake msgs | Brain | sab (lessons append allowed) | — |
| meta/health, findings | Risk & Quality | — | — |
| Email send, WhatsApp, payment links, Google Sheets edit, KM Nexus edit, DELETE | **koi nahi** | — | Jeet manually |

## Tools / connectors / skills per dept
| Dept | Connectors (read unless noted) | Skills (Skill tool se load) |
|---|---|---|
| Office of CEO | Supabase (write lx_b2b, lx_orders), Gmail read | intake-pipeline, smart-intake docs; `productivity:update` for exec brief style |
| Operations | Gmail read, AfterShip read, Google Drive read (MRN sheets), Supabase | `operations:status-report`, `operations:runbook` (SOP format) |
| Finance | Gmail read (Razorpay/KM), Supabase views, Google Drive read | `finance:reconciliation`, `finance:variance-analysis`, `data:sql-queries` |
| Client Success | Supabase read lx_clients/lx_orders/lx_docs | `customer-support:draft-response`, `customer-support:ticket-triage`, brand doc |
| Risk & Quality | Supabase advisors/logs/functions (read), Vercel | `engineering:incident-response`, `operations:risk-assessment` |
| Growth (later) | Shopify, Klaviyo, Semrush, Apollo | `marketing:*`, `sales:*`, `searchfit-seo:*` |
Rule: skill ka format lo, par data hamesha SQL views se; skill kabhi safety rules ko override nahi karta.

## Threads
`group` = HQ Room (sab + Jeet) · `<agent id>` = DM · dept thread = head ka thread (ops / cfo / clients / auditor / brain) · tickets = `kind='ticket'` rows (coordination-protocol dekho).

## Data
- `meta/org` — depts, heads, members (portal reads this).
- agent rows: `data.dept`, `data.role` (head|member), `data.standup {at,done,blocked,need}`, `data.kpi {...}`.
- `kind='ticket'` rows + views `lx_v_tickets`, `lx_v_dept_health` (migration `lx_org_tickets`).
