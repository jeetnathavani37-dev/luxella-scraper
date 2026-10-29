# Luxella Product Team

| Role | Schedule (IST) | Owns |
|---|---|---|
| 🩺 Portal Watchdog (SRE) | every hour at :37 | CI QA results, prod uptime, crashes, JS errors, edge-function errors → fix fast |
| 💎 Luxury Buyer Panel (UX research) | daily 11:43 | 4 buyers judge the site + benchmark vs LV, Gucci, Farfetch, Tata CLiQ Luxury, Net-a-Porter → ≤3 polish fixes |
| 🎨 Design Director | Tue & Fri 15:17 | one meaningful design upgrade from the backlog, before/after screenshots |
| 🧱 Backend & Data Engineer | 4×/day 02:47, 08:47, 14:47, 20:47 | catalogue data quality, scraper (GitHub Actions) health, Supabase advisors, agent-ledger errors |
| 📈 Growth & Conversion Analyst | daily 21:23 | visits → views → enquiries → reserves funnel, why people don't buy, price competitiveness vs India market (report only) |
| 🧠 Product Chief (vision head) | daily 22:41 | reads every report, owns BACKLOG.md priorities, one daily brief to Jeet with decisions needed |

Testing as client and as admin needs no real account: `check.py` signs in with a local mock session (client role, and owner role taken from shim.js) against fixture data — no passwords, no real data touched.
