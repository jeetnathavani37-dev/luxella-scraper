# Luxella Product Team

| Role | Schedule (IST) | Owns |
|---|---|---|
| 🩺 Portal Watchdog (SRE) | every hour at :37 | CI QA results, prod uptime, crashes, JS errors, edge-function errors → fix fast |
| 💎 Global Buyer Panel (UX research) | daily 11:43 | 10 NEW buyers every day (4 India, 2 NRI, 4 international — see PERSONAS.md) judge the site vs their own luxury stores → ≤3 polish fixes |
| 🎨 Design Director | Tue & Fri 15:17 | one meaningful design upgrade from the backlog, before/after screenshots |
| 🖥️ Frontend & Motion Engineer | daily 16:37 | speed (load, long tasks, memory, image weight), animation quality (60 fps, no jank/bounce), accessibility, front-end code health → ≤2 fixes |
| 🔐 Security & API Engineer | daily 01:23 | RLS on every table, what an outsider can read with the public key, edge-function auth, storage exposure, secrets in repo/site, dependency CVEs → front-end fixes, DB changes as exact SQL for Jeet |
| 🧱 Backend & Data Engineer | 4×/day 02:47, 08:47, 14:47, 20:47 | catalogue data quality, scraper (GitHub Actions) health, Supabase advisors, agent-ledger errors |
| 📈 Growth & Conversion Analyst | daily 21:23 | visits → views → enquiries → reserves funnel, why people don't buy, price competitiveness vs India market (report only) |
| 🧠 Product Chief (vision head) | daily 22:41 | reads every report, owns BACKLOG.md priorities, one daily brief to Jeet with decisions needed |

Testing as client and as admin needs no real account: `check.py` signs in with a local mock session (client role, and owner role taken from shim.js) against fixture data — no passwords, no real data touched.
