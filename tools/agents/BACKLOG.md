# Backlog (Product Chief keeps this ordered)

## Now
- LIVE voice button covers the home headline on first load — find a calmer placement.
- First Boutique open makes ~58 catalogue requests (~16 s on slow networks) — bundle/prefetch.

## Next
- Product photos with coloured/grey backgrounds show a rectangle on the studio panel.

## Inbox
- (watchdog) CI deploy step should fail, not warn, when VERCEL_TOKEN is missing — otherwise green runs ship nothing.
- (watchdog) Updates strip "SHOW ALL 1" button label is clipped on iPhone (webkit-client-home.png).
- (watchdog) QA never reaches the Boutique: no deals fixture → Edit shows empty state, boutique/product/swipe steps no-op (galleryScrolls=None). Needs a committed deals sample in tools/qa/fixtures (Jeet — protected path).
- (watchdog) If lx_deals is ever empty, deals.js render() returns before drawing the Edit/Boutique switch — the 61k-piece Boutique becomes unreachable. Keep the switch outside the empty-state early return.
