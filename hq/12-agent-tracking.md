# 🚚 Tracking agent — playbook

Read first: team-protocol, company, workflow, data-model, mail-formats, reshippers.

1. Load KM orders (not Cancelled) in these stages and their tracking numbers: 'Ordered'/'In transit to reshipper' → retailer_tracking; 'Shipped from hub' → reship_awb; 'Landed India'/'Shipped to KM'/'Out for delivery' → km_tracking.
2. AfterShip connector: list_shipments (all pages) and get_shipment for numbers that match. Map tags: Delivered → set the next date (retailer leg: delivered_reshipper; AWB leg: landed_india; KM leg: delivered_km) to the delivered checkpoint date, status forward. InTransit/OutForDelivery → update eta fields if the shipment has an expected delivery (eta_reshipper / eta_india). Exception/AttemptFail/Expired → action item.
   If AfterShip errors or a number isn't in AfterShip, check Gmail for the latest carrier mail about that number (UPS/FedEx/USPS/Amazon/DHL/Tirupati/Delhivery) and use it. Don't fetch carrier websites repeatedly.
3. Also scan for missing data and add items: 'Ordered' for 3+ days with no store tracking ("store ne ship nahi kiya?"), store leg moving 10+ days, AWB leg 8+ days, KM leg 4+ days, 'Landed India' without km_tracking.
4. Items list numbers that are NOT in AfterShip as one info item: "AfterShip me add karo: <numbers>" (Jeet adds them in the AfterShip dashboard).
5. Write the agent row. Summary like "18 parcels check: 2 delivered, 1 exception, 15 on the way".
Final reply: Hinglish bullets for changes/exceptions only, or "Tracking agent: sab on track."

## Smart checks
- Combined parcel: ek tracking ke saare orders same stage pe hone chahiye; nahi hain to sabko aage le aao (forward only) aur info item.
- AfterShip "Delivered" lekin portal me abhi bhi pichla stage → update (yahi sabse common miss hai).
- ETA nikal gaya aur delivered nahi → warn.

## AfterShip (Oct 2026)
- Server function `lx-aftership` har ghante saare open tracking numbers AfterShip me daalta hai aur status `r.trk[no]` me likhta hai; delivered/India checkpoint pe dates khud bharta hai (forward-only, sirf khaali field). Tum **dobara same kaam mat karo**.
- Tumhara kaam: `meta/aftership` padho (errors? key missing? → Jeet ke liye action item "HQ → AfterShip key daalo"), `trk` me `Exception/AttemptFail/Expired` → warn item, aur jo numbers AfterShip pe "Pending" 4+ din se hain unko mails se cross-check karo.
- AfterShip connector (read-only) se bhi detail dekh sakte ho; create/delete mat karo.
