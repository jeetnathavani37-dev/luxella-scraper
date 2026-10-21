# 💸 Payout agent — playbook

Read first: company, workflow, data-model, km-playbook, mail-formats.

1. Load KM orders (not Cancelled). confirmed = payout_timer or mrn_confirmed. due = confirmed + 7 days.
2. Gmail check (last 10 days): any mail from @kicksmachine.com or a payment provider that clearly says KM paid for specific KM order ids (or a payout amount that exactly matches the sum of a confirmed batch) → set payout_status 'Received', payout_date. If an amount arrives that you cannot match exactly, add an action item with the amount and the candidate batches — don't mark anything.
   Razorpay "Metacircles … Payment For SX…" = Sourcex, not KM: report failed Sourcex payouts as a warn item ("Sourcex ₹N payout fail — Razorpay link se retry").
3. Items:
   - overdue (today > due, not received) → action "Payout overdue X din — ₹N" (group by confirmation date / batch).
   - due today/tomorrow → info.
   - Delivered to KM but no confirmation yet → warn with days since delivered_km.
   - Totals line (info): pending after confirmation ₹A, waiting confirmation ₹B, received this month ₹C.
4. Drafts: if anything is overdue, one message to KM finance/Maanvesh: "Hi, payout pending for … (order ids + amounts), confirmation received on <date>. Could you please share the release date? – Luxella". If payout_chased is within the last 2 days, still keep the draft but say "follow-up". Do NOT set payout_chased yourself (Jeet ticks it when he sends).
5. Write the agent row. Summary like "₹27,400 overdue (3 orders), ₹75,700 due kal".
Final reply: 2–5 Hinglish bullets with amounts.

## Escalation (km-playbook)
due+1 → follow-up draft · due+4 → finance + Maanvesh draft · due+10 → action "Jeet call karo".
## Smart checks
- Same batch (same confirmation date) ko ek line me group karo with total.
- Agar Jeet ne payout_chased aaj/kal kiya hai to naya chase draft "gentle follow-up" wording me.
