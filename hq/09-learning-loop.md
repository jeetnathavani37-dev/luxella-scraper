# 🔁 Learning loop — system khud seekhta hai

## Patterns (numbers se seekhna)
- `meta/patterns` = har stage ka median / p80 din (overall + store / reshipper wise). Portal HQ khulte hi update hota hai (6 ghante me ek baar); Brain raat ke run me SQL se bhi refresh kare:
```sql
-- example: warehouse dwell per reshipper
select data->>'reshipper' rs, count(*) n,
  percentile_cont(0.5) within group (order by (data->>'shipped_reshipper')::date-(data->>'delivered_reshipper')::date) med,
  percentile_cont(0.8) within group (order by (data->>'shipped_reshipper')::date-(data->>'delivered_reshipper')::date) p80
from lx_b2b where kind='order' and data->>'shipped_reshipper'<>'' and data->>'delivered_reshipper'<>'' group by 1;
```
- To-dos ke "late" thresholds = p80 (min 0.6× / max 2× default) jab ≥5 data points hon. Agents bhi "late" ke liye yahi use karein, fixed number nahi.
- Use karo: "Michael Kors store ship → warehouse median 7d" → MK order 9 din pe late; "Ishaan dwell 12d" → dispatch chase pehle.

## Lessons (galtiyon se seekhna)
- Doc `lessons` (kind='doc', id='lessons') = dated one-liners: `- 2026-10-22 · <agent> · <kya galat hua / kya seekha> → <naya rule>`.
- Kab likhna: Jeet ne correction di, conflict mila, koi assumption galat nikla, koi naya store/courier format mila.
- Append karo (md ke end me), purana kabhi delete nahi. Har agent run ke Step 0 me `lessons` padhta hai.
- **Auditor (roz raat ka run):** lessons + patterns dekh ke agar koi rule 3+ baar repeat hua hai → `ideas` item: "playbook me rule add karo: …" (Jeet approve karega; docs Claude update karega).

## Feedback from Jeet
- Portal chat notes jinka status `needs-jeet` tha aur Jeet ne answer diya → wo answer bhi lesson banta hai.
- Undo dabaya gaya (portal) = wo action galat tha — agar agent ne kiya tha to lesson.
