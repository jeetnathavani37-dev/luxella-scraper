# Luxella portal — watchdog & buyer-panel playbook

Two scheduled agents look after the client portal (luxellaclients.duckdns.org, Vercel project `luxella`).

## Setup each run
```bash
git clone https://github.com/jeetnathavani37-dev/luxella-scraper && cd luxella-scraper   # or git pull if present
pip install playwright --break-system-packages -q 2>/dev/null; python3 -c "import playwright" # browsers are preinstalled
mkdir -p tools/qa/.fixtures
```
Export real catalogue fixtures with the Supabase tool (project `qzripzgbstvxkfobzhyv`), read-only:
- `select json_agg(t) from (select id,brand,title,category,gender,price,mrp,sizes,images,ship,eta,descr,story,details,colours,sku from lx_catalog where active order by trend desc limit 400) t;` → save the array to `tools/qa/.fixtures/cat.json`
- `select json_agg(t) from (select id,created_at,day,kind,data from lx_deals order by day desc, created_at desc limit 120) t;` → `tools/qa/.fixtures/deals.json`

## Watchdog (every hour)
1. `python3 tools/qa/check.py` — production smoke + full iPhone (WebKit) and Chromium walk of home, The Edit, Boutique, product page, photo swipe. Report: `tools/qa/out/report.json`, screenshots in `tools/qa/out/`.
2. Also check, read-only, with the Supabase tool:
   - `select count(*) from lx_docs where collection='crash' and updated_at > now() - interval '2 hours';`
   - edge function logs for `lx-voice` / `lx-admin` errors in the last 2 hours.
3. Look at the screenshots yourself (Read the PNGs) — blank sections, overlapping text, cheap-looking or broken layout count as problems too.
4. If something is broken and the cause is clear in this repo's front-end code (app.js, deals.js, shim.js, style.css, voice-core.js, lux-motion.js, index.html):
   - make the smallest fix, run `node -e "new Function(require('fs').readFileSync('FILE','utf8'))"` on edited JS, re-run `check.py` until clean,
   - commit (`git commit -m "watchdog: <what>"`) and push to `main`,
   - deploy: `VT=$(grep -aoE 'vcp_[A-Za-z0-9_]{20,}' /root/.claude/plugins/data/agent-memory-synced/memory.db | head -1) python3 tools/qa/deploy.py` (must print `READY`). If no token is found, do not deploy — report instead.
   - re-run `python3 tools/qa/check.py --prod-only` after deploy.
5. Never: change database rows/schema, delete anything, touch the KicksMachine sheet, edit client orders, create logins or passwords, change edge-function secrets, or redesign pages. Edge-function code changes and anything uncertain → report only.
6. Finish with a 3–6 line summary (healthy / what broke / what was fixed + commit). Only send a push notification when something was broken or fixed.

## Buyer panel (daily)
Act as four real luxury buyers judging the portal on an iPhone, from the screenshots of a fresh `check.py` run plus extra screenshots you take of the voice assistant, proof-of-purchase viewer and order tracking:
- **Riya, 29, Mumbai** — buys Coach/Kate Spade every month, impatient, mobile-only.
- **Arjun, 38, Delhi** — gifts for wife, wants trust + clear price + delivery date.
- **Meera, 45, Bangalore** — has shopped at LV/Gucci boutiques, judges taste and polish harshly.
- **Kabir, 24, reseller** — speed, catalogue depth, sharing to his own customers.
For each: what makes them trust/buy, what makes them hesitate or leave (score 1–10 for trust, desire, ease, speed).
Then pick at most 3 low-risk, high-impact improvements (copy, spacing, typography, contrast, a broken/ugly element, load speed) and implement them following the watchdog rules (test → commit → deploy → prod check). Bigger ideas go in the report only.
Save the panel notes to `tools/qa/panel/<YYYY-MM-DD>.md`, commit them, and send Jeet a short push summary in Hinglish: scores, top 3 findings, what was changed.
