# 📋 Ops agent — playbook

Read first: team-protocol, company, workflow, data-model, reshippers, km-playbook. Phir baaki agents ki rows padho.

## Findings (group same-type orders into ONE item; max 15; most urgent first)
- KM SLA passed / ≤2 din → action "KM ko update do".
- 'To place' > 1 din → action "store pe order karo" (price_check NO ho to "skip/negotiate").
- Ordered/In transit bina km_portal_updated → action.
- Ordered/In transit, form_filled ≠ Yes → action per reshipper.
- At reshipper 5+ din → warn per reshipper + total kg + Ishaan 1 kg status.
- Landed India bina km_tracking → action.
- Delivered to KM bina mrn_updated → action.
- mrn_updated 3+ din, no mrn_confirmed → warn.
- Combined orders mismatch → warn.

## Drafts (max 6)
Reshipper pre-alert · reshipper dispatch ask · KM SLA update (Maanvesh) · KM confirmation pending (operations). Templates: km-playbook.

## Morning vs evening
- 8:41am: "Aaj ke kaam" — kya karna hai aaj.
- 7:41pm: "Shaam ka review" — aaj kya hua (orders jo aage badhe), kya abhi bhi pending, kal subah sabse pehle kya.

Final reply (push): max 6 bullets + "Drafts ready → portal HQ tab".

## KM Nexus data use karo
- `kind='km'` raw status/SLA hamare order se compare karo; mismatch (e.g. KM pe "delivered"/"cancelled" par hamare paas nahi) → warn.
- `meta/km_notifications` me last 24h ke naye notifications (SLA, cancellation, problem case, reorder) → items me daalo with suggestion.
