/* Luxella admin — B2B portal (KicksMachine + order costing). Owner only. */
(function(){
'use strict';
const ST=['To place','Ordered','In transit to reshipper','At reshipper','Shipped from hub','Landed India','Shipped to KM','Out for delivery','Delivered to KM','Delivered to client'];
const DONE=s=>s==='Delivered to KM'||s==='Delivered to client';
const RS=['Ishaan-USA','Ishaan-Canada','Ishaan-UK','Prabhmeet','Yash','Dev Gandhi','Direct'];
const inr=n=>n==null||isNaN(n)?'—':'₹'+new Intl.NumberFormat('en-IN').format(Math.round(Number(n)));
const pct=x=>x==null||isNaN(x)||x===0?'—':Math.round(x*100)+'%';
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;};
const today=()=>new Date().toISOString().slice(0,10);
const days=d=>d?Math.floor((Date.now()-new Date(d+'T00:00:00'))/864e5):null;
const KMT=[[0,'Order processing'],[8,'Check cancellation passed'],[12,'On track'],[15,'Awaiting update'],[17,'Delay risk'],[22,'Delayed']];
const kmStage=d=>{const n=days(d);if(n==null)return '';let s=KMT[0][1];KMT.forEach(([k,t])=>{if(n>=k)s=t;});return 'Day '+n+' · '+s;};
const css=document.createElement('style');css.textContent=`
.bb{padding:16px 20px;max-width:1400px;margin:0 auto}
.bb h2{font:500 11px 'Jost',sans-serif;letter-spacing:.24em;text-transform:uppercase;color:#A39C90;margin:0 0 12px}
.bb-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:14px}
.bb-k{background:#121214;border:1px solid #232120;padding:12px 14px;cursor:pointer}.bb-k .v{font-size:22px;color:#E3C565;margin:4px 0 2px}.bb-k small{color:#A39C90;font-size:11.5px}
.bb-tabs{display:flex;gap:2px;border-bottom:1px solid #2A2724;margin:0 0 14px;overflow-x:auto;scrollbar-width:none}.bb-tab{background:none;border:0;border-bottom:2px solid transparent;color:#A39C90;padding:10px 14px;font:500 11px 'Jost',sans-serif;letter-spacing:.2em;text-transform:uppercase;cursor:pointer;white-space:nowrap}.bb-tab.on{color:#E3C565;border-bottom-color:#E3C565}
.bb-card{background:#121214;border:1px solid #232120;padding:16px 18px;margin-bottom:14px}
.bb-bar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}.bb-bar input,.bb-bar select,.bb-f input,.bb-f select,.bb-f textarea{background:#0A0A0A;border:1px solid #2A2724;color:#F3EEE6;padding:8px 10px;font:inherit}
.bb-bar input{flex:1 1 220px}
.bb-chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}.bb-chip{background:#0E0E0F;border:1px solid #2A2724;color:#A39C90;padding:6px 10px;font:inherit;font-size:12px;cursor:pointer}.bb-chip.on{border-color:#C9A227;color:#E3C565}.bb-chip b{color:#F3EEE6;font-weight:500;margin-left:4px}
.bb-row{border-top:1px solid #232120}
.bb-row>summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:1fr 2.4fr 1.6fr 1fr .8fr .8fr .6fr;gap:10px;align-items:center;padding:10px 0;font-size:13px}
.bb-row>summary::-webkit-details-marker{display:none}
.bb-row .id{color:#E3C565;font-size:12px}.bb-row .it b{font-weight:400;color:#F3EEE6}.bb-row .it small{display:block;color:#8C857A;font-size:11.5px}
.bb-st{display:inline-block;font-size:10px;letter-spacing:.1em;text-transform:uppercase;border:1px solid #3A3222;color:#E3C565;padding:3px 6px}
.bb-st.s0{color:#d9a3a3;border-color:#5a2a2a}.bb-st.s5{color:#7fc79c;border-color:#2c5a40}
.bb-p.bad{color:#d98a7f}.bb-p.ok{color:#7fc79c}
.bb-th{display:grid;grid-template-columns:1fr 2.4fr 1.6fr 1fr .8fr .8fr .6fr;gap:10px;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:#8C857A;padding:4px 0 8px}
.bb-f{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;padding:6px 0 14px}.bb-f label{display:flex;flex-direction:column;gap:4px;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#A39C90}.bb-f textarea{grid-column:1/-1;min-height:60px}
.bb-b{background:#C9A227;color:#0A0A0A;border:0;padding:9px 16px;font:500 11.5px 'Jost',sans-serif;letter-spacing:.14em;text-transform:uppercase;cursor:pointer}.bb-b.g{background:transparent;color:#E3C565;border:1px solid #6B5A24}
.bb-line{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid #1E1C1A;font-size:13px;flex-wrap:wrap}.bb-line .m{color:#A39C90;font-size:12px}
.bb-calc{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px}.bb-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-top:12px}
.bb-meta{font-size:12px;color:#8C857A;margin:4px 0 0}
.bb-secs{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:12px;padding:6px 0 4px}.bb-sec{border:1px solid #232120;background:#0E0E0F;padding:10px 12px}.bb-sh{font:500 10.5px 'Jost',sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#E3C565;margin-bottom:6px}.bb-sec .bb-f{grid-template-columns:repeat(auto-fit,minmax(140px,1fr));padding:0}
.bb-stw{display:flex;flex-direction:column;gap:4px;align-items:flex-start}.bb-prog{display:flex;gap:2px}.bb-prog i{width:12px;height:3px;background:#2A2724}.bb-prog i.ok{background:#8C6E16}.bb-prog i.now{background:#F4E1A0}.bb-hint{color:#8C857A;font-size:11px}
.bb-board{display:flex;gap:10px;overflow-x:auto;padding-bottom:10px}.bb-col{flex:0 0 220px;background:#0E0E0F;border:1px solid #232120;padding:8px;max-height:70vh;overflow-y:auto}.bb-ch{display:flex;justify-content:space-between;font:500 10.5px 'Jost',sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#E3C565;padding:4px 2px 8px}.bb-mini{background:#151413;border:1px solid #2A2724;padding:8px;margin-bottom:6px;cursor:pointer;font-size:12.5px}.bb-mini:hover{border-color:#6B5A24}.bb-mini .id{color:#E3C565;font-size:11px}.bb-mini small{color:#8C857A;font-size:11px}
.bb-tbl{display:grid}.bb-tr{display:grid;grid-template-columns:1fr 2.2fr 1fr 1fr 1fr 1fr;gap:10px;padding:8px 0;border-top:1px solid #1E1C1A;font-size:12.5px;cursor:pointer}.bb-tr:hover{background:#151413}.bb-tr.th{color:#8C857A;font-size:10px;letter-spacing:.14em;text-transform:uppercase;cursor:default;border-top:0}
.bb-k.on{border-color:#C9A227}.bb-tick{display:grid;grid-template-columns:24px 1fr 2.4fr 1.2fr 1.4fr auto;gap:10px;align-items:center;padding:10px 0;border-top:1px solid #1E1C1A;font-size:13px;cursor:pointer}.bb-tick input{width:18px;height:18px;accent-color:#C9A227}.bb-tick .o{color:#E3C565;font-size:12px}.bb-tick .s,.bb-tick .d{color:#8C857A;font-size:12px}.bb-tick.late .d{color:#d98a7f}
.bb-bid{display:grid;grid-template-columns:1fr auto auto;gap:14px;align-items:center;padding:12px 0;border-top:1px solid #1E1C1A}.bb-bid .o{color:#E3C565;font-size:12px}.bb-bid .i{color:#F3EEE6;margin:2px 0}.bb-bid small{color:#8C857A;font-size:11.5px}.bb-bid b{font-weight:400;color:#F3EEE6}
.bb-row>summary.bb-buy{grid-template-columns:1.2fr 3fr 1fr .8fr 1.4fr}
.bb-tl{display:flex;gap:0;overflow-x:auto;padding:12px 0 14px;scrollbar-width:thin}.bb-tc{flex:0 0 96px;position:relative;padding-top:14px;font-size:11px}.bb-tc i{position:absolute;top:0;left:0;right:0;height:3px;background:#2A2724}.bb-tc.ok i{background:#C9A227}.bb-tc i:after{content:"";position:absolute;left:0;top:-3px;width:9px;height:9px;background:#2A2724;transform:rotate(45deg)}.bb-tc.ok i:after{background:#F4E1A0}.bb-tc b{display:block;font-weight:400;color:#A39C90;margin-top:4px}.bb-tc.ok b{color:#F3EEE6}.bb-tc small{color:#8C857A}
.bb-q{display:grid;gap:8px}.bb-qc{background:#121214;border:1px solid #232120}.bb-qc>summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:1fr auto;gap:2px 10px;padding:12px 16px}.bb-qc>summary::-webkit-details-marker{display:none}.bb-qc>summary span{color:#F3EEE6;font-size:14px}.bb-qc>summary b{color:#E3C565;font-weight:400;font-size:18px;grid-row:1/3;grid-column:2;align-self:center}.bb-qc>summary small{color:#8C857A;font-size:11.5px}
.bb-qr{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px 16px;border-top:1px solid #1E1C1A}.bb-qr .qi{flex:1 1 260px;display:flex;flex-direction:column}.bb-qr .qi .o{color:#E3C565;font-size:11.5px}.bb-qr .qi small{color:#8C857A;font-size:11px}.bb-qr input,.bb-qr select{background:#0A0A0A;border:1px solid #2A2724;color:#F3EEE6;padding:7px 9px;font:inherit;font-size:12.5px;width:150px}
.bb-maph{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.bb-maph label{display:flex;flex-direction:column;gap:4px;font-size:11px;color:#A39C90}.bb-maph select{background:#0A0A0A;border:1px solid #2A2724;color:#F3EEE6;padding:6px}
.bb-mr{display:grid;grid-template-columns:2fr 2fr 1fr;gap:10px;align-items:center;padding:6px 0;border-top:1px solid #1E1C1A;font-size:12px}.bb-mr .c{color:#A39C90;font-family:monospace;font-size:11.5px}.bb-mr select{background:#0A0A0A;border:1px solid #2A2724;color:#F3EEE6;padding:6px;font-size:12px}.bb-mr small{color:#7fc79c}
.bb-vt{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:6px}.bb-vt input,.bb-vt select{background:#0A0A0A;border:1px solid #2A2724;color:#F3EEE6;padding:7px 9px;font:inherit;font-size:12.5px}.bb-vt input[type=text],.bb-vt input:not([type]){flex:1 1 200px}.bb-vt .bb-b{padding:7px 10px;font-size:10.5px}.bb-vtc{display:flex;align-items:center;gap:5px;font-size:12px;color:#A39C90}.bb-cnt{margin:0 0 10px}
.bb-strip{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 10px}.bb-chip.dim{opacity:.45}.bb-qbulk{display:flex;gap:8px;padding:8px 16px;border-top:1px solid #1E1C1A}.bb-qr.old{box-shadow:inset 3px 0 0 #8a3a3a}.bb-qr .bb-b.g{padding:6px 9px;font-size:10px}.bb-qr input.qsel{width:16px!important;height:16px;accent-color:#C9A227}
.bb-cs{font-size:11px;color:#8C857A;margin:-4px 2px 8px}.bb-mini.amber{border-left:3px solid #B8943F}.bb-mini.red{border-left:3px solid #a33}
.bb-bulk{display:flex;gap:6px;flex-wrap:wrap;align-items:center;padding:8px;border:1px dashed #3A3222;margin-bottom:10px}.bb-bulk select{background:#0A0A0A;border:1px solid #2A2724;color:#F3EEE6;padding:7px}.bb-sel{width:16px;height:16px;accent-color:#C9A227;margin-right:6px}
.bb-exg{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.bb-ex{text-align:left;background:#0E0E0F;border:1px solid #2A2724;color:#F3EEE6;padding:14px;cursor:pointer;font:inherit}.bb-ex:hover{border-color:#C9A227}.bb-ex b{display:block;font-weight:500;color:#E3C565;margin-bottom:4px}.bb-ex small{color:#8C857A}
html.bb-compact .bb-row>summary{padding:5px 0}html.bb-compact .bb-qr{padding:5px 16px}html.bb-compact .bb-k{padding:8px 10px}html.bb-compact .bb-k .v{font-size:18px}
.bb-sum{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:1px;background:#232120;border:1px solid #232120;margin-bottom:16px}.bb-sum>div{background:#111113;padding:12px 16px;cursor:pointer}.bb-sum>div:hover{background:#151413}.bb-sum b{display:block;font-weight:400;font-size:20px;color:#E3C565}.bb-sum small{color:#8C857A;font-size:11.5px}.bb-sum>div.bad b{color:#e0897c}.bb-sum.tabs>div.on{box-shadow:inset 0 -2px 0 #C9A227;background:#161512}
.bb-b.sm{padding:7px 11px;font-size:10.5px;letter-spacing:.12em}.bb-b.g.on{border-color:#C9A227;color:#F4E1A0}.bb-lnk{background:none;border:0;color:#8C857A;font:inherit;font-size:12px;cursor:pointer;margin-top:10px;text-decoration:underline}
.bb-vp{display:flex;gap:6px;flex-wrap:wrap;align-items:center;padding:8px;margin-bottom:8px;background:#0E0E0F;border:1px solid #232120}.bb-vp select,.bb-vp input{background:#0A0A0A;border:1px solid #2A2724;color:#F3EEE6;padding:6px 8px;font:inherit;font-size:12px}
.bb-search{width:100%;background:#0E0E0F;border:1px solid #2A2724;color:#F3EEE6;padding:10px 12px;font:inherit;margin-bottom:10px}.bb-top2{display:flex;gap:8px;align-items:flex-start}.bb-top2 .bb-search{flex:1}
.bb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:12px;margin-bottom:18px}
.bb-cd{background:#121214;border:1px solid #262321;padding:14px;display:flex;flex-direction:column;gap:10px;transition:border-color .2s}.bb-cd:hover{border-color:#4a3f22}.bb-cd.late{border-color:#5a2a2a;box-shadow:inset 3px 0 0 #a33}
.cd-h{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.cd-h>div:first-child{min-width:0}.cd-h b{display:block;font-weight:400;color:#F3EEE6;font-size:14.5px;word-break:break-all}.cd-h small{display:block;color:#8C857A;font-size:11.5px;margin-top:2px}.cd-amt{color:#E3C565;font-size:17px;white-space:nowrap}
.bb-tag{font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;border:1px solid #3A3222;color:#C9A227;padding:3px 7px;white-space:nowrap;align-self:flex-start}.bb-tag.ok{color:#7fc79c;border-color:#2c5a40}.bb-tag.bad{color:#e0897c;border-color:#5a2a2a}.bb-tag.go{color:#9fc1e6;border-color:#2b4459}
.cd-ctry{display:flex;gap:4px}.cd-ctry .ct{flex:1;background:#0A0A0A;border:1px solid #2A2724;color:#8C857A;padding:6px 4px;font:inherit;font-size:11.5px;cursor:pointer}.cd-ctry .ct.on{border-color:#C9A227;color:#F4E1A0;background:#17140c}
.cd-items{font-size:12.5px;color:#C9C2B6;line-height:1.5}
.cd-sec{display:flex;flex-direction:column;gap:6px;border-top:1px solid #1E1C1A;padding-top:10px}.cd-sec>label{font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:#8C857A}
.bb-kmc{display:flex;align-items:center;gap:10px;background:#0C0C0D;border:1px solid #1F1D1B;padding:7px 9px}.bb-kmc>div{flex:1;min-width:0;display:flex;flex-direction:column}.bb-kmc b{font-weight:400;color:#E3C565;font-size:12px}.bb-kmc span{color:#C9C2B6;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bb-kmc em{font-style:normal;color:#A39C90;font-size:12px}.bb-kmc .x{background:none;border:0;color:#8C857A;font-size:16px;cursor:pointer;padding:0 2px}.bb-kmc .x:hover{color:#e0897c}
.cd-add,.cd-in input,.cd-in select,.cd-date{background:#0A0A0A;border:1px solid #2A2724;color:#A39C90;padding:7px 8px;font:inherit;font-size:12px}.cd-in{display:flex;gap:6px}.cd-in input{flex:1;min-width:0;color:#F3EEE6}
.cd-trk code{display:block;font-family:ui-monospace,monospace;color:#F3EEE6;font-size:13px;letter-spacing:.04em}.cd-trk small{color:#8C857A;font-size:11.5px}
.cd-f{display:flex;justify-content:space-between;align-items:center;gap:8px;border-top:1px solid #1E1C1A;padding-top:10px;margin-top:auto}.cd-f>b{font-weight:400;color:#E3C565}.cd-act{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.cd-prog{height:4px;background:#1E1C1A;overflow:hidden}.cd-prog i{display:block;height:100%;background:linear-gradient(90deg,#8C6E16,#E3C565)}.cd-prog.warn i{background:#d9a441}.cd-prog.bad i{background:#c0564a;width:100%!important}.bb-cd.late .cd-prog i{background:#c0564a}
.cd-timer{font-size:20px;color:#F3EEE6}.bb-cd.late .cd-timer{color:#e0897c}
.bb-sech{display:flex;justify-content:space-between;align-items:baseline;margin:6px 0 10px;padding-bottom:6px;border-bottom:1px solid #232120}.bb-sech span{font:500 11px 'Jost',sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#E3C565}.bb-sech small{color:#8C857A;font-size:12px}
.bb-act2{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.bb-qr .bb-b.g{border-color:transparent;color:#8C857A;padding:6px 7px}.bb-qr .bb-b.g:hover{color:#E3C565;border-color:#3A3222}
@media(max-width:600px){.bb{padding:12px}.bb-grid{grid-template-columns:1fr}.bb-sum{grid-template-columns:1fr 1fr}.bb-top2{flex-direction:column}.bb-top2 .bb-b{width:100%}}
.ov-flow{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-bottom:16px}.ov-st{position:relative;text-align:left;background:#121214;border:1px solid #262321;color:#F3EEE6;padding:12px 12px 10px;font:inherit;cursor:pointer;display:flex;flex-direction:column;gap:2px;min-height:96px}.ov-st:hover{border-color:#6B5A24}.ov-st i{position:absolute;top:8px;right:10px;font-style:normal;font-size:10px;color:#5d574e}.ov-st b{font-weight:400;font-size:24px;color:#E3C565}.ov-st span{font-size:12px;color:#C9C2B6;line-height:1.3}.ov-st small{color:#8C857A;font-size:11px;margin-top:auto}.ov-st.z{opacity:.45}.ov-st.z b{color:#8C857A}
.ov-cols{display:grid;grid-template-columns:1.3fr 1fr;gap:14px}.ov-att{display:grid;grid-template-columns:44px 1fr;gap:0 10px;width:100%;text-align:left;background:none;border:0;border-top:1px solid #1E1C1A;color:#F3EEE6;padding:10px 0;font:inherit;cursor:pointer}.ov-att:hover span{color:#E3C565}.ov-att b{grid-row:1/3;font-weight:400;font-size:20px;color:#e0897c;align-self:center}.ov-att span{font-size:13.5px}.ov-att small{color:#8C857A;font-size:11.5px}.ov-note{margin:0 0 14px;padding:10px 12px;border-left:2px solid #6B5A24;background:#0E0E0F}
.ph-in{width:100%;margin:8px 0;color:#A39C90;font-size:12px}.ph-act{display:flex;gap:8px;align-items:center;font-size:12.5px;color:#C9C2B6}.ph-act input{accent-color:#C9A227;width:16px;height:16px}.ph-d{margin-bottom:12px}.ph-d>summary{cursor:pointer;color:#E3C565;font-size:12.5px;padding:6px 0;list-style:none}.ph-d .bb-card{margin-top:8px}
.ck-list{display:grid;gap:8px}.ck{background:#121214;border:1px solid #262321}.ck[open]{border-color:#4a3f22}.ck>summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;gap:16px;align-items:center;padding:12px 16px}.ck>summary::-webkit-details-marker{display:none}.ck-l{min-width:0;display:flex;flex-direction:column}.ck-l b{font-weight:400;color:#E3C565;font-size:13px}.ck-l span{color:#C9C2B6;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ck-r{display:flex;align-items:center;gap:10px;flex-shrink:0}.ck-r small{color:#8C857A;font-size:11.5px;max-width:220px;text-align:right}.ck-r em{font-style:normal;color:#A39C90;font-size:12px;width:36px;text-align:right}.ck-bar{width:90px;height:4px;background:#1E1C1A}.ck-bar i{display:block;height:100%;background:#C9A227}
.ck-body{padding:4px 16px 14px;border-top:1px solid #1E1C1A}.ck-step{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:8px 0;border-bottom:1px solid #1A1917}.ck-step label{flex:1 1 240px;display:flex;gap:10px;align-items:center;font-size:13px;color:#C9C2B6;cursor:pointer}.ck-step.ok label span{color:#7fc79c}.ck-step input[type=checkbox]{width:18px;height:18px;accent-color:#C9A227}.ck-step input:not([type=checkbox]),.ck-step select{background:#0A0A0A;border:1px solid #2A2724;color:#F3EEE6;padding:6px 8px;font:inherit;font-size:12px;width:150px}.ck-body .cd-add{margin-top:10px;width:100%}
@media(max-width:820px){.ov-cols{grid-template-columns:1fr}.ck>summary{flex-direction:column;align-items:flex-start}.ck-r small{text-align:left}.ck-step input:not([type=checkbox]),.ck-step select{width:calc(50% - 6px)}.ov-flow{grid-template-columns:1fr 1fr}}
.pc{display:flex;flex-wrap:wrap;gap:6px 8px;align-items:center;font-size:12px;color:#C9C2B6;background:#0C0C0D;border:1px solid #1F1D1B;padding:7px 9px}.pc a{color:#E3C565;font-size:11.5px}.pc small{flex-basis:100%;color:#8C857A;font-size:11px}
.ag-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;margin-bottom:18px}.bb-cd.ag p{margin:0;font-size:13px;color:#C9C2B6;line-height:1.45}
.ag-it{display:flex;gap:12px;align-items:center;padding:10px 12px;border:1px solid #1F1D1B;background:#111113;margin-bottom:6px}.ag-it>i{font-style:normal;width:22px;height:22px;display:grid;place-items:center;border:1px solid #3A3222;color:#C9A227;font-size:12px;flex-shrink:0}.ag-it.action>i{border-color:#5a2a2a;color:#e0897c}.ag-it>div{flex:1;min-width:0;display:flex;flex-direction:column}.ag-it span{font-size:13px;color:#F3EEE6}.ag-it small{font-size:11px;color:#8C857A}
.ag-pre{white-space:pre-wrap;font:12.5px/1.5 'Jost',sans-serif;color:#C9C2B6;background:#0C0C0D;border:1px solid #1F1D1B;padding:10px;margin:0;max-height:220px;overflow:auto}
.md{font-size:13.5px;line-height:1.6;color:#C9C2B6}.md h3{font:500 15px 'Jost',sans-serif;color:#E3C565;margin:14px 0 6px;letter-spacing:.02em;text-transform:none}.md h4,.md h5{font:500 12px 'Jost',sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#E3C565;margin:16px 0 6px}.md p{margin:6px 0}.md ul,.md ol{margin:6px 0;padding-left:20px}.md code{background:#1A1917;padding:1px 5px;font-size:12px;color:#F4E1A0;overflow-wrap:anywhere}.md b{color:#F3EEE6;font-weight:500}.md table{width:100%;border-collapse:collapse;margin:8px 0;font-size:12.5px;display:block;overflow-x:auto}.md th,.md td{border:1px solid #2A2724;padding:6px 8px;text-align:left;vertical-align:top}.md th{color:#E3C565;font-weight:500;background:#0E0E0F}.md blockquote{border-left:2px solid #6B5A24;margin:8px 0;padding:4px 12px;color:#A39C90}
.lx-chat-fab{position:fixed;right:18px;bottom:18px;width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,#E3C565,#B8943F);color:#0A0A0A;border:0;font-size:22px;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.5);z-index:50}
.lx-chat{position:fixed;right:18px;bottom:84px;width:380px;max-width:calc(100vw - 24px);height:520px;max-height:calc(100vh - 110px);background:#0E0E0F;border:1px solid #4a3f22;display:flex;flex-direction:column;z-index:50;box-shadow:0 16px 40px rgba(0,0,0,.6)}.lx-chat[hidden]{display:none}
.lx-ch-h{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid #232120}.lx-ch-h b{font:500 11px 'Jost',sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#E3C565}.lx-ch-h button{background:none;border:0;color:#A39C90;font-size:20px;cursor:pointer}
.lx-ch-log{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}.lx-msg{max-width:90%;padding:9px 11px;font-size:13px;line-height:1.45;white-space:pre-wrap;word-break:break-word}.lx-msg.bot{background:#161512;border:1px solid #2A2724;color:#C9C2B6;align-self:flex-start}.lx-msg.me{background:#2a2410;color:#F4E1A0;align-self:flex-end}
.lx-plan{display:flex;gap:8px;align-items:flex-start;padding:6px 0;border-top:1px solid #232120;font-size:12.5px}.lx-plan input{accent-color:#C9A227;margin-top:3px}.lx-plan b{color:#E3C565;font-weight:400}.lx-msg .cd-act{margin-top:8px}
.lx-ai-tag{font-size:10.5px;letter-spacing:.04em;margin-left:6px}.lx-ai-tag.on{color:#7fc98f}.lx-ai-tag.off{color:#A39C90}
.lx-ch-tools{display:flex;flex-direction:column;gap:6px}.lx-att.rec{background:#5a1d1d;border-color:#c94f4f;animation:lxp 1s infinite}@keyframes lxp{50%{opacity:.55}}
.lx-chat.drop{outline:2px dashed #E3C565;outline-offset:-6px}.lx-thumb{display:block;max-width:180px;max-height:140px;margin-top:6px;border:1px solid #4a3f22}
.lx-diff{font-size:12px;line-height:1.5}.lx-diff .k{color:#8d867a}.lx-diff s{color:#7a5050}.lx-diff .v{color:#F3EEE6}.lx-plan>div{flex:1}
.lx-chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}.lx-chip{font-size:11px;padding:2px 7px;border:1px solid #3a3322;color:#E3C565;background:#14120d}
.cd-in select{background:#0A0A0A;border:1px solid #2A2724;color:#F3EEE6;padding:8px}
.mn-row{display:grid;grid-template-columns:130px 1fr auto;gap:12px;align-items:center;padding:8px 0;font-size:13px}.mn-bar{height:8px;background:#1d1b18;position:relative}.mn-bar i{position:absolute;left:0;top:0;bottom:0;background:#C9A227}.mn-bar i.ok{background:#5fae74}.mn-row small{color:#A39C90}
.mn-li{padding:7px 0;border-top:1px solid #1d1b18;font-size:12.5px;color:#C9C2B6}.mn-li b{color:#E3C565;font-weight:400;margin-right:6px}
.mn-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-bottom:12px}.mn-form label{display:flex;flex-direction:column;gap:4px;font-size:11px;color:#8C857A;letter-spacing:.06em}.mn-form input{background:#0A0A0A;border:1px solid #2A2724;color:#F3EEE6;padding:8px;font:inherit;font-size:13px}
.bb-meta.warn{color:#d9a54a}.bb-sum>div span{display:block;font-size:12px;color:#C9C2B6;margin-top:2px}
@media(max-width:600px){.mn-row{grid-template-columns:1fr}}
.lx-pend{font-size:11px;color:#A39C90;padding:0 12px 6px}.lx-pend:empty{display:none}
.ck,.ck-body,.ck-step,.ck-list,.bb-cd{min-width:0;max-width:100%;box-sizing:border-box}.ck-step input,.ck-step select{min-width:0;max-width:100%;box-sizing:border-box}.bb{padding-bottom:96px!important;overflow-x:clip}
@media(max-width:600px){.ck-step input:not([type=checkbox]),.ck-step select{width:100%!important;flex:1 1 100%}.ck-step label{flex:1 1 100%}.ck>summary{min-width:0}.ck-l,.ck-r{max-width:100%;min-width:0}.ck-l span{word-break:break-word}}
.lx-ch-f{display:flex;gap:6px;align-items:flex-end;padding:10px;border-top:1px solid #232120}.lx-ch-f textarea{flex:1;background:#0A0A0A;border:1px solid #2A2724;color:#F3EEE6;padding:8px;font:inherit;font-size:13px;resize:none}.lx-att{background:none;border:1px solid #2A2724;color:#E3C565;padding:8px;cursor:pointer}
@media print{.bp-top,.bb-tabs,.bb-vt,.bb-bar,.bb-bulk,button{display:none!important}#admin-root{background:#fff!important;color:#000!important}}
@media(max-width:820px){.bb-tr{grid-template-columns:1fr 1.6fr 1fr}.bb-tr>span:nth-child(n+4){display:none}.bb-tick{grid-template-columns:22px 1fr auto}.bb-tick .i{grid-column:2/4}.bb-tick .s,.bb-tick .d{display:none}.bb-bid{grid-template-columns:1fr auto}.bb-bid .r{grid-column:1/-1}}
@media(max-width:820px){.bb-row>summary,.bb-th{grid-template-columns:1fr 1fr}.bb-row>summary>:nth-child(n+5),.bb-th>:nth-child(n+3){display:none}.bb-row .it{grid-column:1/-1;order:-1}}
`;document.head.appendChild(css);

window.lxB2B=async function(root,sb,toast){
 root.textContent='';const wrap=el('div','bb');root.appendChild(wrap);
 wrap.appendChild(el('p','bb-meta','Loading…'));
 const res=await sb.from('lx_b2b').select('kind,id,data,updated_at');
 if(res.error){wrap.textContent=res.error.message;return;}
 let all=(res.data||[]).filter(x=>x.kind==='order').map(x=>Object.assign({_id:x.id,_u:x.updated_at},x.data));
 let BIDS=(res.data||[]).filter(x=>x.kind==='bid').map(x=>Object.assign({_id:x.id,_u:x.updated_at},x.data));const META={};(res.data||[]).filter(x=>x.kind==='meta').forEach(x=>{META[x.id]=x.data;});const AGENTS={};(res.data||[]).filter(x=>x.kind==='agent').forEach(x=>{AGENTS[x.id]=x.data;});const DOCS=(res.data||[]).filter(x=>x.kind==='doc').map(x=>Object.assign({_id:x.id},x.data)).sort((a,b)=>String(a.order).localeCompare(String(b.order)));let BUYS=(res.data||[]).filter(x=>x.kind==='buy').map(x=>Object.assign({_id:x.id,_u:x.updated_at},x.data));
 const saveK=async(kind,r,patch)=>{const d=Object.assign({},r,patch);['_id','_u'].forEach(k=>delete d[k]);const r2=await sb.from('lx_b2b').upsert({kind,id:r._id,data:d,updated_at:new Date().toISOString()},{onConflict:'kind,id'});if(r2.error){toast('Save nahi hua: '+r2.error.message);return false;}Object.assign(r,d);toast('Saved');return true;};
 const S={tab:'overview',who:'KicksMachine',st:'',rs:'',q:''};
 const save=async(r,patch)=>{const d=Object.assign({},r,patch);['_id','_u'].forEach(k=>delete d[k]);
  const L=Number(d.landed),P=Number(d.payout);if(L&&P){d.profit=Math.round((P-L)*100)/100;d.profit_pct=(P-L)/L;d.margin_ok=(P-L)/L>=0.2?'Yes':'No';}
  const r2=await sb.from('lx_b2b').upsert({kind:'order',id:r._id,data:d,updated_at:new Date().toISOString()},{onConflict:'kind,id'});
  if(r2.error){toast('Save nahi hua: '+r2.error.message);return false;}Object.assign(r,d,{_u:new Date().toISOString()});toast('Saved');return true;};
 const draw=()=>{wrap.textContent='';
  const km=all.filter(r=>r.client==='KicksMachine');const open=km.filter(r=>!DONE(r.status));const costed=km.filter(r=>Number(r.landed)>0);
  const atR=km.filter(r=>r.status==='At reshipper');const oldest=Math.max(0,...atR.map(r=>days(r.delivered_reshipper)||0));
  const dueP=km.filter(r=>r.status==='Delivered to KM'&&r.payout_status!=='Received');const got=km.filter(r=>r.payout_status==='Received');
  const sum=(a,k)=>a.reduce((t,r)=>t+(Number(r[k])||0),0);const low=km.filter(r=>r.margin_ok==='No');
  const TOOLS=['pipe','bulk','calc','add','export','orders','todo'];if(TOOLS.includes(S.tab)){S.tool=S.tab;S.tab='tools';}
  const T=el('div','bb-tabs');[['overview','Overview'],['bids','Bids'],['buys','Orders placed'],['transit','In transit'],['reship','Reshipper'],['tokm','To KicksMachine'],['confirm','Confirmation'],['payouts','Payouts'],['money','Money'],['checklist','Checklist'],['agents','HQ'],['tools','More']].forEach(([id,t])=>{const b=el('button','bb-tab'+(S.tab===id?' on':''),t);b.onclick=()=>{S.tab=id;draw();};T.appendChild(b);});wrap.appendChild(T);
  const P=el('div');wrap.appendChild(P);
  if(S.tab==='tools'){S.tool=S.tool||'orders';const tc=el('div','bb-chips');[['orders','All orders'],['todo','To-do lists'],['pipe','Pipeline'],['bulk','Bulk upload'],['calc','Bid calculator'],['add','Add order'],['export','Export']].forEach(([id,t])=>{const b=el('button','bb-chip'+(S.tool===id?' on':''),t);b.onclick=()=>{S.tool=id;draw();};tc.appendChild(b);});P.appendChild(tc);const P2=el('div');P.appendChild(P2);({orders:orders,todo:todo,pipe:pipe,bulk:bulk,calc:calc,add:add,export:exp})[S.tool](P2);return;}
  ({overview:overview,transit:transit,bids:bids,buys:buys,reship:reship,tokm:tokm,confirm:confirmT,payouts:payouts,money:money,checklist:checklist,agents:agentsTab})[S.tab](P);};
 function orders(P){const c=el('div','bb-card');P.appendChild(c);
  const bar=el('div','bb-bar');S.q='';
  const who=document.createElement('select');[['KicksMachine','KicksMachine'],['__wa','WhatsApp clients'],['','All']].forEach(([v,t])=>{const o=el('option',null,t);o.value=v;if(v===S.who)o.selected=true;who.appendChild(o);});
  const rs=document.createElement('select');[''].concat(RS).forEach(v=>{const o=el('option',null,v||'All reshippers');o.value=v;if(v===S.rs)o.selected=true;rs.appendChild(o);});
  const bt=el('button','bb-b g sm'+(S.bulk?' on':''),S.bulk?'Done selecting':'Select / bulk edit');bt.onclick=()=>{S.bulk=!S.bulk;if(!S.bulk)S.sel=new Set();draw();};bar.append(who,bt);c.appendChild(bar);
  const base=viewTools(P,all).filter(r=>S.who===''?true:S.who==='__wa'?r.client!=='KicksMachine':r.client===S.who);
  const ch=el('div','bb-chips');[['','All'],...ST.map(s=>[s,s]),['__unpaid','Payout pending'],['__low','<20% margin']].forEach(([v,t])=>{const n=base.filter(r=>v===''?true:v==='__unpaid'?(r.payout_status!=='Received'&&!['Cancelled','To place'].includes(r.status)):v==='__low'?r.margin_ok==='No':r.status===v).length;if(!n&&v!==''&&S.st!==v)return;const b=el('button','bb-chip'+(S.st===v?' on':''),t);b.appendChild(el('b',null,String(n)));b.onclick=()=>{S.st=v;draw();};ch.appendChild(b);});c.appendChild(ch);
  const list=el('div');c.appendChild(list);
  const th=el('div','bb-th');['KM order','Item / store','Stage · next','Reshipper · weight','Landed','Payout','Margin'].forEach(t=>th.appendChild(el('span',null,t)));list.appendChild(th);
  const render=()=>{[...list.querySelectorAll('.bb-row,.bb-meta')].forEach(x=>x.remove());const qq=S.q.toLowerCase();
   const f=base.filter(r=>S.st===''?true:S.st==='__unpaid'?(r.payout_status!=='Received'&&!['Cancelled','To place'].includes(r.status)):S.st==='__low'?r.margin_ok==='No':r.status===S.st).filter(r=>!qq||[r.order_id,r.item,r.brand,r.intl_tracking,r.local_tracking,r.client].join(' ').toLowerCase().includes(qq))
    .sort((a,b)=>ST.indexOf(a.status)-ST.indexOf(b.status)||String(b.order_date).localeCompare(String(a.order_date)));
   if(!f.length){list.appendChild(el('p','bb-meta','Koi order nahi.'));return;}
   f.forEach(r=>{const row=rowEl(r);if(!S.bulk){list.appendChild(row);return;}const cb=document.createElement('input');cb.type='checkbox';cb.className='bb-sel';cb.checked=SEL.has(r._id);cb.onclick=e=>e.stopPropagation();cb.onchange=()=>{cb.checked?SEL.add(r._id):SEL.delete(r._id);upd();};{const sm=row.querySelector('summary');(sm.firstElementChild||sm).prepend(cb);}list.appendChild(row);});};
  const SEL=S.sel=S.sel||new Set();const bk=el('div','bb-bulk');const cnt=el('span','bb-meta','0 selected');
  const stS=document.createElement('select');[['','Set status…'],...ST.map(x=>[x,x])].forEach(([v,t])=>{const o=el('option',null,t);o.value=v;stS.appendChild(o);});
  const rsS=document.createElement('select');[['','Set reshipper…'],...RS.map(x=>[x,x])].forEach(([v,t])=>{const o=el('option',null,t);o.value=v;rsS.appendChild(o);});
  const pyS=document.createElement('select');[['','Set payout…'],['Received','Received'],['Pending','Pending']].forEach(([v,t])=>{const o=el('option',null,t);o.value=v;pyS.appendChild(o);});
  const ap=el('button','bb-b','Apply');const sa=el('button','bb-b g','Select all shown');const sn=el('button','bb-b g','Clear');const cx=el('button','bb-b g','Cancel selected');const dup=el('button','bb-b g','Duplicate');const cpy=el('button','bb-b g','Copy IDs');
  const upd=()=>{cnt.textContent=SEL.size+' selected';};upd();
  sa.onclick=()=>{list.querySelectorAll('.bb-sel').forEach(x=>{x.checked=true;});base.forEach(r=>SEL.add(r._id));upd();};sn.onclick=()=>{SEL.clear();list.querySelectorAll('.bb-sel').forEach(x=>x.checked=false);upd();};
  const pick=()=>all.filter(r=>SEL.has(r._id));
  ap.onclick=async()=>{const rs2=pick();if(!rs2.length){toast('Pehle orders select karo');return;}const p={};if(stS.value)p.status=stS.value;if(rsS.value)p.reshipper=rsS.value;if(pyS.value){p.payout_status=pyS.value;if(pyS.value==='Received')p.payout_date=today();}if(!Object.keys(p).length){toast('Kuch chuno');return;}if(!confirm(rs2.length+' orders update honge. Pakka?'))return;for(const r of rs2)await save(r,Object.assign({},p));SEL.clear();draw();};
  cx.onclick=async()=>{const rs2=pick();if(!rs2.length)return;if(!confirm(rs2.length+' orders Cancelled mark honge (delete nahi). Pakka?'))return;for(const r of rs2)await save(r,{status:'Cancelled'});SEL.clear();draw();};
  dup.onclick=async()=>{const rs2=pick();if(rs2.length!==1){toast('Ek order select karo');return;}const o=rs2[0];const nid=prompt('Naya KM order ID?',(o.order_id||o._id)+'-2');if(!nid)return;const d=Object.assign({},o);['_id','_u','payout_status','payout_date'].forEach(k=>delete d[k]);d.order_id=nid;d.status='To place';d.payout_status='Pending';const r={_id:nid};if(await save(r,d)){all.push(r);SEL.clear();draw();}};
  cpy.onclick=async()=>{const t=pick().map(r=>r.order_id||r._id).join(', ');try{await navigator.clipboard.writeText(t);toast('Copied');}catch(e){}};
  bk.append(cnt,stS,rsS,pyS,ap,sa,sn,dup,cx,cpy);if(S.bulk)c.insertBefore(bk,list);
  who.onchange=()=>{S.who=who.value;S.st='';draw();};render();}
 const STORES=['Michael Kors Outlet','Michael Kors','Coach Outlet','Coach','Kate Spade Outlet','Kate Spade','Tory Burch','JW Pei','Ralph Lauren','Patagonia','Dr. Martens','Simon Premium Outlets','Nordstrom Rack','Macy\'s','Amazon US','Alo Yoga','Ted Baker','Other'];
 const CARRIERS=['UPS','FedEx','USPS','DHL','Amazon Shipping','YunExpress','OnTrac','Canada Post','Royal Mail','Other'];
 const DOM=['Tirupati','Bluedart','Delhivery','DTDC','India Post','Hand delivery'];
 /* sections: [title, fields[[key,label,type,opts]]] ; legacy keys read as fallback */
 const ALIAS={retailer_tracking:'intl_tracking',est_weight:'weight',km_tracking:'local_tracking',shipped_km:'shipped_client',delivered_km:'delivered_client'};
 const gv=(r,k)=>r[k]!=null&&r[k]!==''?r[k]:(ALIAS[k]?r[ALIAS[k]]:'');
 const SECS=[
  ['1 · KicksMachine bid',[['order_id','KM order ID'],['order_date','Bid won on','date'],['accept_by','Accept by','date'],['payout','KM payout ₹','number'],['size','Size / colour'],['km_portal_updated','Updated on KM portal','date'],['sla_deadline','KM SLA deadline','date'],['km_status','KM portal status'],['km_tracking_status','KM tracking status']]],
  ['2 · Purchase from store',[['store','Bought from (store)','list',STORES],['retailer_order_id','Store order no.'],['retailer_date','Ordered on','date'],['buy_email','Account email used'],['price_usd','Paid $ (after discount)','number'],['discount','Discount / code used'],['tax_pct','Sales tax %','number'],['cashback','Cashback $','number'],['card','Card used']]],
  ['3 · Store → reshipper',[['retailer_ship_date','Store shipped on','date'],['retailer_carrier','Carrier','list',CARRIERS],['retailer_tracking','Tracking no.'],['eta_reshipper','Expected at reshipper','date'],['delivered_reshipper','Reached reshipper','date']]],
  ['4 · Reshipper',[['reshipper','Reshipper','list',RS],['est_weight','Estimated weight kg','number'],['actual_weight','Actual weight kg','number'],['reship_cost','Reship cost ₹ (estimate/billed)','number'],['reship_billed','Billed by reshipper?','list',['','Estimate','Billed']],['form_filled','Receiver form filled?','list',['','Yes','No']],['form_date','Form filled on','date'],['shipped_reshipper','Shipped from reshipper','date'],['reship_awb','Reshipper AWB / tracking'],['parcel_with','Clubbed with (order IDs)']]],
  ['5 · India',[['eta_india','ETA India','date'],['landed_india','Landed in India','date'],['customs_note','Customs / delay note']]],
  ['6 · To KicksMachine',[['km_courier','Courier','list',DOM],['km_tracking','Courier tracking'],['shipped_km','Shipped to KM','date'],['delivered_km','Reached KM','date'],['mrn','MRN received?','list',['','Yes','No']],['mrn_updated','MRN updated on','date'],['mrn_confirmed','MRN confirmation mail on','date'],['payout_chased','Payout chased on','date']]],
  ['7 · Payout & profit',[['payout_status','Payout','list',['Pending','Received']],['payout_date','Payout received on','date'],['landed','Landed cost ₹','number'],['notes','Notes','area']]]];
 /* status from the furthest filled step */
 const derive=d=>{if(d.client!=='KicksMachine')return d.status;const has=k=>!!gv(d,k);
  if(has('delivered_km'))return 'Delivered to KM';if(has('shipped_km'))return 'Shipped to KM';if(has('landed_india'))return 'Landed India';if(has('shipped_reshipper'))return 'Shipped from hub';if(has('delivered_reshipper'))return 'At reshipper';if(has('retailer_ship_date')||has('retailer_tracking'))return 'In transit to reshipper';if(has('retailer_order_id')||has('retailer_date'))return 'Ordered';return d.status||'To place';};
 const STEP=['To place','Ordered','In transit to reshipper','At reshipper','Shipped from hub','Landed India','Shipped to KM','Delivered to KM'];
 const LBL={'In transit to reshipper':'Store shipped','Shipped from hub':'Left reshipper'};
 const nextHint=r=>{const st=r.status;const d=k=>gv(r,k);
  if(st==='To place')return 'Place order with store';if(st==='Ordered')return 'Waiting for store to ship';if(st==='In transit to reshipper')return d('eta_reshipper')?'At reshipper by '+d('eta_reshipper'):'Add ETA at reshipper';
  if(st==='At reshipper'){const n=days(d('delivered_reshipper'));return (n!=null?n+'d at reshipper · ':'')+(d('form_filled')==='Yes'?'form done':'form pending');}
  if(st==='Shipped from hub')return d('eta_india')?'India by '+d('eta_india'):'Add ETA India';if(st==='Landed India')return 'Ship to KM';if(st==='Shipped to KM')return 'Waiting for KM to receive';if(st==='Delivered to KM')return r.payout_status==='Received'?'Paid':'Payout due';return '';};
 function rowEl(r){const d=document.createElement('details');d.className='bb-row';const s=document.createElement('summary');
  s.appendChild(el('span','id',r.order_id||r._id));const it=el('span','it');it.appendChild(el('b',null,r.item||'—'));it.appendChild(el('small',null,[r.brand,gv(r,'store')&&gv(r,'store')!==r.brand?'via '+gv(r,'store'):'',r.size,r.client!=='KicksMachine'?r.client:''].filter(Boolean).join(' · ')));s.appendChild(it);
  const sw=el('span','bb-stw');const i0=STEP.indexOf(r.status);const pr=el('span','bb-prog');STEP.forEach((x,i)=>{const dot=el('i',i<i0?'ok':i===i0?'now':'');dot.title=LBL[x]||x;pr.appendChild(dot);});if(r.client==='KicksMachine')sw.appendChild(pr);
  sw.appendChild(el('span','bb-st'+(r.status==='To place'?' s0':DONE(r.status)?' s5':''),LBL[r.status]||r.status||'—'));if(r.payout_status==='Received')sw.appendChild(el('span','bb-st s5','Paid'));sw.appendChild(el('small','bb-hint',nextHint(r)));s.appendChild(sw);
  s.appendChild(el('span',null,(r.reshipper||'—')+(gv(r,'actual_weight')?' · '+gv(r,'actual_weight')+'kg':gv(r,'est_weight')?' · ~'+gv(r,'est_weight')+'kg':'')));s.appendChild(el('span',null,inr(r.landed)));s.appendChild(el('span',null,inr(r.payout)));s.appendChild(el('span','bb-p '+(r.margin_ok==='No'?'bad':r.margin_ok==='Yes'?'ok':''),pct(r.profit_pct)));d.appendChild(s);
  d.addEventListener('toggle',()=>{if(!d.open||d.querySelector('.bb-secs'))return;const F={};const wrapS=el('div','bb-secs');
   SECS.forEach(([title,fields],si)=>{const sec=el('div','bb-sec');sec.appendChild(el('div','bb-sh',title));const f=el('div','bb-f');
    fields.forEach(([k,label,type,opts])=>{const l=el('label',null,label);let i;const cur=String(gv(r,k)==null?'':gv(r,k));
     if(type==='list'){i=document.createElement('select');const op2=(opts.includes('')||k==='payout_status')?opts:['',...opts];(cur&&!op2.includes(cur)?[cur,...op2]:op2).forEach(v=>{const o=el('option',null,v||'—');o.value=v;if(cur===v)o.selected=true;i.appendChild(o);});}
     else{i=document.createElement(type==='area'?'textarea':'input');if(type&&type!=='area')i.type=type;if(type==='number')i.step='any';i.value=cur;}
     l.appendChild(i);f.appendChild(l);F[k]=i;});
    sec.appendChild(f);wrapS.appendChild(sec);});
   const auto=el('div','bb-meta','Status dates se apne aap update hota hai (jaise "Reached reshipper" bharo toh status At reshipper). Profit = payout − landed.');
   d.appendChild(timeline(r));d.appendChild(wrapS);d.appendChild(auto);
   const row=el('div','bb-bar');const sv=el('button','bb-b','Save');
   sv.onclick=async()=>{const p={};Object.entries(F).forEach(([k,i])=>{let v=i.value;if(i.type==='number')v=v===''?null:Number(v);p[k]=v;});
    Object.entries(ALIAS).forEach(([n,o])=>{if(p[n]!==undefined)p[o]=p[n];});p.weight=p.actual_weight||p.est_weight||null;p.status=derive(Object.assign({},r,p));
    sv.disabled=true;if(await save(r,p))draw();sv.disabled=false;};row.appendChild(sv);
   if(r.payout_status!=='Received'&&r.client==='KicksMachine'){const b=el('button','bb-b g','Mark payout received');b.onclick=async()=>{if(await save(r,{payout_status:'Received',payout_date:today()}))draw();};row.appendChild(b);}
   [['Store tracking',gv(r,'retailer_tracking')],['Reshipper AWB',gv(r,'reship_awb')],['Courier',gv(r,'km_tracking')]].forEach(([t,v])=>{if(!v)return;const a=el('a','bb-b g','Track: '+t);a.href='https://track.aftership.com/'+encodeURIComponent(String(v).split(' ')[0]);a.target='_blank';a.rel='noopener';a.style.textDecoration='none';row.appendChild(a);});
   d.appendChild(row);});
  return d;}
 function pipe(P){const km=viewTools(P,all.filter(r=>r.client==='KicksMachine'));const bd=el('div','bb-board');
  STEP.concat(['__paid']).forEach(st=>{const rows=st==='__paid'?km.filter(r=>r.status==='Delivered to KM'&&r.payout_status==='Received'):km.filter(r=>r.status===st&&!(st==='Delivered to KM'&&r.payout_status==='Received'));
   if(VF.pipeHide&&!rows.length)return;const col=el('div','bb-col');const h=el('div','bb-ch');h.appendChild(el('span',null,st==='__paid'?'Paid':(LBL[st]||st)));h.appendChild(el('b',null,String(rows.length)));col.appendChild(h);
   const pv=rows.reduce((t,r)=>t+(Number(r.payout)||0),0),wt=rows.reduce((t,r)=>t+(Number(gv(r,'actual_weight')||gv(r,'est_weight'))||0),0),old2=Math.max(0,...rows.map(r=>days(r.order_date)||0));col.appendChild(el('div','bb-cs',inr(pv)+(wt?' · '+wt.toFixed(1)+' kg':'')+(rows.length?' · oldest '+old2+'d':'')));
   rows.sort((a,b)=>String(a.order_date).localeCompare(String(b.order_date))).forEach(r=>{const ag=days(r.order_date)||0;const c=el('div','bb-mini'+(ag>=25?' red':ag>=15?' amber':''));c.appendChild(el('div','id',r.order_id||r._id));c.appendChild(el('div',null,r.item));c.appendChild(el('small',null,[r.reshipper,nextHint(r)].filter(Boolean).join(' · ')));c.onclick=()=>{S.tab='orders';S.st=st==='__paid'?'':st;S.q=r.order_id||'';draw();setTimeout(()=>{const x=document.querySelector('.bb-row');if(x)x.open=true;},50);};col.appendChild(c);});
   bd.appendChild(col);});
  const pb=el('div','bb-bar');const hc=el('label','bb-vtc');const hcc=document.createElement('input');hcc.type='checkbox';hcc.checked=!!VF.pipeHide;hcc.onchange=()=>{VF.pipeHide=hcc.checked;saveVF();draw();};hc.append(hcc,document.createTextNode(' Hide empty columns'));
  const lg=el('span','bb-meta','Card colour: amber = 15+ din purana, red = 25+ din.');const tot=el('span','bb-meta','Pipeline value: '+inr(km.filter(r=>r.payout_status!=='Received').reduce((t,r)=>t+(Number(r.payout)||0),0))+' payout pending');
  pb.append(hc,lg,tot);P.appendChild(pb);P.appendChild(bd);}

 /* ---------- shared view toolbar: search, filters, sort, date range, export, WhatsApp copy, print, density, overdue ---------- */
 let VF;try{VF=JSON.parse(localStorage.getItem('lxb2b_vf')||'{}');}catch(e){VF={};}
 const saveVF=()=>{try{localStorage.setItem('lxb2b_vf',JSON.stringify(VF));}catch(e){}};
 const vtxt=r=>[r.order_id,r._id,r.item,r.brand,gv(r,'store'),gv(r,'retailer_order_id'),gv(r,'retailer_tracking'),gv(r,'reship_awb'),gv(r,'km_tracking'),r.reshipper,r.notes,r.client].join(' ').toLowerCase();
 function viewTools(P,list,cfg){cfg=cfg||{};const key=S.tab;const f=VF[key]=VF[key]||{};const dk=cfg.date||'order_date';const tx=cfg.text||vtxt;
  const bar=el('div','bb-vt');const mk=(tag,ph)=>{const i=document.createElement(tag);if(ph)i.placeholder=ph;return i;};
  const q=mk('input','Search…');q.value=f.q||'';
  const sel=(name,vals,lab)=>{const x=document.createElement('select');[['',lab]].concat(vals.map(v=>[v,v])).forEach(([v,t])=>{const o=el('option',null,t);o.value=v;if((f[name]||'')===v)o.selected=true;x.appendChild(o);});x.onchange=()=>{f[name]=x.value;saveVF();draw();};return x;};
  const uniq=k=>[...new Set(list.map(r=>cfg.get?cfg.get(r,k):gv(r,k)).filter(Boolean).map(String))].sort();
  const rs=sel('rs',uniq('reshipper'),'All reshippers'),br=sel('brand',uniq(cfg.brandKey||'brand'),'All brands');
  const so=sel('sort',['Newest','Oldest','Payout high','Payout low','Margin low','Days waiting'],'Sort');
  const d1=mk('input');d1.type='date';d1.value=f.from||'';d1.title='From date';const d2=mk('input');d2.type='date';d2.value=f.to||'';d2.title='To date';
  [d1,d2].forEach((d,i)=>d.onchange=()=>{f[i?'to':'from']=d.value;saveVF();draw();});
  const od=el('label','bb-vtc');const odc=document.createElement('input');odc.type='checkbox';odc.checked=!!f.over;odc.onchange=()=>{f.over=odc.checked;saveVF();draw();};od.append(odc,document.createTextNode(' Stuck 7d+'));
  const cp=el('label','bb-vtc');const cpc=document.createElement('input');cpc.type='checkbox';cpc.checked=!!VF.compact;cpc.onchange=()=>{VF.compact=cpc.checked;saveVF();document.documentElement.classList.toggle('bb-compact',cpc.checked);};cp.append(cpc,document.createTextNode(' Compact'));document.documentElement.classList.toggle('bb-compact',!!VF.compact);
  const clr=el('button','bb-b g','Clear');clr.onclick=()=>{VF[key]={};saveVF();draw();};
  let out=list.filter(r=>!f.q||tx(r).includes(f.q.toLowerCase())).filter(r=>!f.rs||String(cfg.get?cfg.get(r,'reshipper'):gv(r,'reshipper'))===f.rs).filter(r=>!f.brand||String(cfg.get?cfg.get(r,cfg.brandKey||'brand'):gv(r,cfg.brandKey||'brand'))===f.brand)
   .filter(r=>{const d=String((cfg.get?cfg.get(r,dk):gv(r,dk))||'').slice(0,10);return (!f.from||d>=f.from)&&(!f.to||(d&&d<=f.to));})
   .filter(r=>!f.over||((days(String(r._u||'').slice(0,10))||0)>=7&&!DONE(r.status)));
  const pay=r=>Number(cfg.get?cfg.get(r,'payout'):r.payout)||0;
  const srt={'Newest':(a,b)=>String(b[dk]||'').localeCompare(String(a[dk]||'')),'Oldest':(a,b)=>String(a[dk]||'').localeCompare(String(b[dk]||'')),'Payout high':(a,b)=>pay(b)-pay(a),'Payout low':(a,b)=>pay(a)-pay(b),'Margin low':(a,b)=>(Number(a.profit_pct)||9)-(Number(b.profit_pct)||9),'Days waiting':(a,b)=>String(a._u||'').localeCompare(String(b._u||''))}[f.sort];if(srt)out=out.slice().sort(srt);
  q.oninput=()=>{f.q=q.value;saveVF();clearTimeout(q._t);q._t=setTimeout(()=>{draw();setTimeout(()=>{const n=document.querySelector('.bb-vt input');if(n){n.focus();n.setSelectionRange(n.value.length,n.value.length);}},0);},350);};
  const csv=el('button','bb-b g','CSV');csv.onclick=()=>{const rows=out.map(r=>cfg.row?cfg.row(r):[r.order_id||r._id,r.item,r.brand,r.status,r.reshipper,gv(r,'store'),gv(r,'retailer_order_id'),r.order_date,r.payout,r.landed,r.payout_status]);const head=cfg.head||['KM order','Item','Brand','Status','Reshipper','Store','Store order','Bid date','Payout','Landed','Payout status'];const qq=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([[head.map(qq).join(',')].concat(rows.map(r=>r.map(qq).join(','))).join('\n')],{type:'text/csv'}));a.download='luxella-'+key+'-'+today()+'.csv';a.click();};
  const wa=el('button','bb-b g','Copy for WhatsApp');wa.onclick=async()=>{const t=out.map((r,i)=>(i+1)+'. '+(cfg.line?cfg.line(r):((r.order_id||r._id)+' · '+r.item+(r.reshipper?' · '+r.reshipper:'')+(gv(r,'retailer_tracking')?' · '+gv(r,'retailer_tracking'):'')))).join('\n');try{await navigator.clipboard.writeText(t);toast(out.length+' lines copied');}catch(e){toast('Copy nahi hua');}};
  const pr=el('button','bb-b g','Print');pr.onclick=()=>window.print();
  const act=[f.rs,f.brand,f.sort,f.from,f.to,f.over].filter(Boolean).length;
  const fb=el('button','bb-b g sm'+(act?' on':''),'Filters'+(act?' · '+act:''));fb.onclick=()=>{f.open=!f.open;saveVF();draw();};
  const mb=el('button','bb-b g sm','⋯');mb.title='Export / print';mb.onclick=()=>{VF.more=!VF.more;saveVF();draw();};
  const cnt=el('span','bb-meta',out.length===list.length?out.length+' orders':out.length+' of '+list.length);
  bar.append(q,fb,mb,cnt);const box=el('div');box.appendChild(bar);
  if(f.open){const pn=el('div','bb-vp');pn.append(rs,br,so,d1,d2,od,clr);box.appendChild(pn);}
  if(VF.more){const pn=el('div','bb-vp');pn.append(cp,csv,wa,pr);box.appendChild(pn);}
  P.insertBefore(box,P.firstChild);
  S.view=out;return out;}
 const TL=[['order_date','Bid won'],['retailer_date','Ordered at store'],['km_portal_updated','KM portal updated'],['form_date','Receiver form'],['retailer_ship_date','Store shipped'],['delivered_reshipper','Reached hub'],['shipped_reshipper','Left hub'],['landed_india','Landed India'],['shipped_km','Shipped to KM'],['delivered_km','Reached KM'],['mrn_updated','MRN updated'],['mrn_confirmed','MRN confirmed'],['payout_chased','Payout chased'],['payout_date','Paid']];
 function timeline(r){const w=el('div','bb-tl');TL.forEach(([k,t])=>{const v=gv(r,k);const c=el('div','bb-tc'+(v?' ok':''));c.appendChild(el('i'));c.appendChild(el('b',null,t));c.appendChild(el('small',null,v?String(v).slice(0,10):'—'));w.appendChild(c);});return w;}
 /* ---------- To-do: one queue per step; an order leaves the queue when the step is done ---------- */
 function todo(P){const km=viewTools(P,all.filter(r=>r.client==='KicksMachine'&&!/cancel/i.test(String(r.status||''))));const g=k=>gv;
  const has=(r,k)=>!!gv(r,k);const id=r=>r.order_id||r._id;
  const Q=[
   ['KM SLA crossed / due in 3 days',r=>{const sl=gv(r,'sla_deadline');if(!sl||DONE(r.status)||r.status==='Cancelled')return false;const dl=-(days(sl)||0);const inf=gv(r,'km_sla_informed');return dl<=3&&(!inf||days(inf)>=3);},'KM ko update do (delay reason / ETA)',[],p=>Object.assign(p,{km_sla_informed:today()})],
   ['Place order with store',r=>r.status==='To place','Bid jeeta, store pe order karna baaki',[['store','Store','list',STORES],['retailer_order_id','Store order no.'],['price_usd','Paid $','number']],p=>Object.assign(p,{retailer_date:today()})],
   ['Update KicksMachine portal',r=>['Ordered','In transit to reshipper'].includes(r.status)&&!has(r,'km_portal_updated'),'Order ID + retailer ID KM portal pe daalo',[],p=>Object.assign(p,{km_portal_updated:today()})],
   ['Fill reshipper receiver form',r=>gv(r,'form_filled')!=='Yes'&&['Ordered','In transit to reshipper'].includes(r.status),'Reshipper ka pre-alert / receiver form',[['reshipper','Reshipper','list',RS]],p=>Object.assign(p,{form_filled:'Yes',form_date:today()})],
   ['Store tracking pending',r=>r.status==='Ordered'&&!has(r,'retailer_tracking'),'Store ne ship kiya? Tracking daalo',[['retailer_carrier','Carrier','list',CARRIERS],['retailer_tracking','Tracking no.'],['eta_reshipper','Expected at hub','date']],p=>Object.assign(p,{retailer_ship_date:today()})],
   ['Coming to hub',r=>r.status==='In transit to reshipper','Hub pe pahunchne ka wait (bulk upload se apne aap hatega)',[['actual_weight','Actual kg','number']],p=>Object.assign(p,{delivered_reshipper:today()}),'Arrived at hub'],
   ['At hub, waiting dispatch',r=>r.status==='At reshipper','Reshipper se nikalna baaki',[['reship_awb','AWB / tracking'],['eta_india','ETA India','date']],p=>Object.assign(p,{shipped_reshipper:today()}),'Left hub'],
   ['On the way to India',r=>r.status==='Shipped from hub','India me receive hona baaki',[],p=>Object.assign(p,{landed_india:today()}),'Received in India'],
   ['Add local tracking',r=>r.status==='Landed India','KM ko courier karo, local tracking daalo',[['km_courier','Courier','list',DOM],['km_tracking','Tracking']],p=>Object.assign(p,{shipped_km:today()}),'Shipped to KM'],
   ['Waiting KM to receive',r=>r.status==='Shipped to KM','KM warehouse pe pahunchna baaki',[],p=>Object.assign(p,{delivered_km:today()}),'KM received'],
   ['Update MRN',r=>r.status==='Delivered to KM'&&!has(r,'mrn_updated'),'KM MRN sheet me update',[],p=>Object.assign(p,{mrn_updated:today(),mrn:'Yes'}),'MRN updated'],
   ['Awaiting MRN confirmation mail',r=>r.status==='Delivered to KM'&&has(r,'mrn_updated')&&!has(r,'mrn_confirmed'),'KM ka MRN confirmation mail aana baaki',[],p=>Object.assign(p,{mrn_confirmed:today()}),'Mail received'],
   ['Chase payout (7+ days after MRN)',r=>r.status==='Delivered to KM'&&r.payout_status!=='Received'&&has(r,'mrn_confirmed')&&days(gv(r,'mrn_confirmed'))>=7,'Payout follow up',[],p=>Object.assign(p,{payout_chased:today()}),'Chased'],
   ['Payout pending',r=>r.status==='Delivered to KM'&&r.payout_status!=='Received','Paisa aate hi tick karo',[],p=>Object.assign(p,{payout_status:'Received',payout_date:today()}),'Payout received']];
  const wrapQ=el('div','bb-q');
  const snoozed=r=>r.snooze_until&&r.snooze_until>today();
  const tbar=el('div','bb-bar');const ea=el('button','bb-b g','Expand all');ea.onclick=()=>wrapQ.querySelectorAll('details').forEach(d=>d.open=true);const ca=el('button','bb-b g','Collapse all');ca.onclick=()=>wrapQ.querySelectorAll('details').forEach(d=>d.open=false);
  const he=el('label','bb-vtc');const hec=document.createElement('input');hec.type='checkbox';hec.checked=!!VF.hideEmpty;hec.onchange=()=>{VF.hideEmpty=hec.checked;saveVF();draw();};he.append(hec,document.createTextNode(' Hide empty lists'));
  const sz=el('label','bb-vtc');const szc=document.createElement('input');szc.type='checkbox';szc.checked=!!VF.showSnoozed;szc.onchange=()=>{VF.showSnoozed=szc.checked;saveVF();draw();};sz.append(szc,document.createTextNode(' Show snoozed'));
  const strip=el('div','bb-strip');P.appendChild(strip);let firstOpen=false;
  Q.forEach(([title,test,hint,fields,apply,btn])=>{const rows=km.filter(test).filter(r=>VF.showSnoozed||!snoozed(r));if(!rows.length)return;const oldest=Math.max(0,...rows.map(r=>days(r.order_date)||0));
   {const ch=el('button','bb-chip',title.split(' (')[0]);ch.appendChild(el('b',null,String(rows.length)));ch.onclick=()=>{const t=[...wrapQ.children].find(x=>x.dataset.t===title);if(t){t.open=true;t.scrollIntoView({behavior:'smooth',block:'start'});}};strip.appendChild(ch);}
   const c=document.createElement('details');c.className='bb-qc';c.dataset.t=title;if(S.qo?S.qo===title:!firstOpen){c.open=true;firstOpen=true;}c.addEventListener('toggle',()=>{if(c.open)S.qo=title;});
   const sm=document.createElement('summary');sm.appendChild(el('span',null,title));sm.appendChild(el('b',null,String(rows.length)));sm.appendChild(el('small',null,hint+(rows.length&&oldest?' · oldest day '+oldest:'')));c.appendChild(sm);
   const sel=new Set();if(rows.length>1&&!fields.length){const bx=el('div','bb-qbulk');const all1=el('button','bb-b g','Select all');all1.onclick=()=>{c.querySelectorAll('.bb-qr input.qsel').forEach(x=>{x.checked=true;sel.add(x.dataset.id);});};const go=el('button','bb-b',(btn||'Done')+' · selected');go.onclick=async()=>{const rs2=rows.filter(r=>sel.has(r._id));if(!rs2.length){toast('Pehle select karo');return;}if(!confirm(rs2.length+' orders: '+(btn||'Done')+'?'))return;for(const r of rs2){const p={};apply(p);p.status=derive(Object.assign({},r,p));await save(r,p);}draw();};bx.append(all1,go);c.appendChild(bx);}
   rows.sort((a,b)=>String(a.order_date).localeCompare(String(b.order_date))).forEach(r=>{const l=el('div','bb-qr'+((days(r.order_date)||0)>=20?' old':''));if(rows.length>1&&!fields.length){const cb=document.createElement('input');cb.type='checkbox';cb.className='qsel';cb.dataset.id=r._id;cb.onchange=()=>cb.checked?sel.add(r._id):sel.delete(r._id);l.appendChild(cb);}const info=el('div','qi');info.appendChild(el('span','o',id(r)));info.appendChild(el('span',null,r.item));
    const age=days(r.order_date);info.appendChild(el('small',null,[r.reshipper,gv(r,'store'),gv(r,'retailer_order_id')?'#'+gv(r,'retailer_order_id'):'',age!=null?'day '+age:''].filter(Boolean).join(' · ')));l.appendChild(info);
    const F={};fields.forEach(([k,lab,type,opts])=>{let i;if(type==='list'){i=document.createElement('select');['',...opts].forEach(v=>{const o=el('option',null,v||lab);o.value=v;if(String(gv(r,k)||'')===v)o.selected=true;i.appendChild(o);});}else{i=document.createElement('input');i.placeholder=lab;if(type)i.type=type;if(type==='number')i.step='any';i.value=gv(r,k)||'';}F[k]=i;l.appendChild(i);});
    const b=el('button','bb-b',btn||'Done');b.onclick=async()=>{const p={};Object.entries(F).forEach(([k,i])=>{let v=i.value;if(i.type==='number')v=v===''?null:Number(v);if(v!==''&&v!=null)p[k]=v;});if(p.retailer_tracking)p.intl_tracking=p.retailer_tracking;if(p.km_tracking)p.local_tracking=p.km_tracking;if(p.actual_weight)p.weight=p.actual_weight;apply(p);p.status=derive(Object.assign({},r,p));b.disabled=true;if(await save(r,p))draw();b.disabled=false;};l.appendChild(b);
    {const snz=el('button','bb-b g','Snooze');snz.title='Kal tak is list se chhupa do';snz.onclick=async()=>{const t=new Date(Date.now()+864e5).toISOString().slice(0,10);if(await save(r,{snooze_until:t}))draw();};l.appendChild(snz);
     const op=el('button','bb-b g','Open');op.onclick=()=>{S.tab='orders';S.who='';S.st='';S.q='';VF.orders={q:r.order_id||r._id};draw();setTimeout(()=>{const x=document.querySelector('.bb-row');if(x)x.open=true;},60);};l.appendChild(op);
     const cid=el('button','bb-b g','Copy');cid.onclick=async()=>{try{await navigator.clipboard.writeText(id(r)+(gv(r,'retailer_order_id')?' / '+gv(r,'retailer_order_id'):''));toast('Copied');}catch(e){}};l.appendChild(cid);
     if(/receiver form|Coming to hub|At hub/.test(title)&&r.reshipper){const a=el('a','bb-b g','WhatsApp '+r.reshipper.split('-')[0]);a.href='https://wa.me/?text='+encodeURIComponent('Hi, parcel for '+id(r)+': '+r.item+(gv(r,'retailer_tracking')?' · tracking '+gv(r,'retailer_tracking'):'')+(gv(r,'store')?' · from '+gv(r,'store'):''));a.target='_blank';a.rel='noopener';a.style.textDecoration='none';l.appendChild(a);}}
    if(title.startsWith('KM SLA')){const a=el('a','bb-b g','WhatsApp KM');a.href='https://wa.me/?text='+encodeURIComponent('Hi Maanvesh, update on '+id(r)+' ('+r.item+'): currently '+(LBL[r.status]||r.status)+(gv(r,'eta_india')?', ETA India '+gv(r,'eta_india'):'')+'. Will update as soon as it moves. Thanks!');a.target='_blank';a.rel='noopener';a.style.textDecoration='none';l.appendChild(a);l.appendChild(el('small','bb-meta','SLA '+gv(r,'sla_deadline')));}
    if(title.startsWith('Chase')||title==='Payout pending'){const a=el('a','bb-b g','WhatsApp');a.href='https://wa.me/?text='+encodeURIComponent('Hi Maanvesh, payout status for '+id(r)+' ('+r.item+', '+inr(r.payout)+')? MRN done on '+(gv(r,'mrn_confirmed')||gv(r,'delivered_km'))+'. Thanks!');a.target='_blank';a.rel='noopener';a.style.textDecoration='none';l.appendChild(a);}
    c.appendChild(l);});
   if(!rows.length)c.appendChild(el('p','bb-meta','Sab done.'));wrapQ.appendChild(c);});
  P.appendChild(wrapQ);if(!wrapQ.children.length)P.appendChild(el('p','bb-meta','Sab kaam done 🎉'));const sz2=el('button','bb-lnk',VF.showSnoozed?'Hide snoozed':'Show snoozed');sz2.onclick=()=>{VF.showSnoozed=!VF.showSnoozed;saveVF();draw();};P.appendChild(sz2);}
 /* ---------- Bulk upload: paste or upload a reshipper sheet, auto-match rows to orders ---------- */
 function bulk(P){const c=el('div','bb-card');P.appendChild(c);c.appendChild(el('h2',null,'Bulk upload · reshipper sheet'));
  c.appendChild(el('p','bb-meta','Ishaan / Yash / Prabhmeet ki sheet ka data copy karke yahan paste karo (Google Sheet / Excel se seedha), ya CSV/XLSX file daalo. Columns apne aap pehchaane jaate hain, galat ho toh har column ka type badal do. Har row tracking no. / order ID / item naam se order se match hoti hai.'));
  const top=el('div','bb-bar');const rsel=document.createElement('select');['',...RS].forEach(v=>{const o=el('option',null,v||'Reshipper (optional)');o.value=v;rsel.appendChild(o);});
  const act=document.createElement('select');[['arrived','Items reached the hub (warehouse)'],['shipped','Items shipped from hub to India'],['landed','Items received in India']].forEach(([v,t])=>{const o=el('option',null,t);o.value=v;act.appendChild(o);});
  const fi=document.createElement('input');fi.type='file';fi.accept='.csv,.tsv,.txt,.xlsx,.xls';top.append(act,rsel,fi);c.appendChild(top);
  const ta=document.createElement('textarea');ta.placeholder='Yahan paste karo…';ta.rows=7;ta.style.cssText='width:100%;background:#0A0A0A;border:1px solid #2A2724;color:#F3EEE6;padding:10px;font:12.5px monospace';c.appendChild(ta);
  const opt=el('div','bb-bar');opt.style.marginTop='8px';const ddt=document.createElement('input');ddt.type='date';ddt.value=today();ddt.title='Default date (agar sheet me date nahi)';
  const mk2=(t,on)=>{const l=el('label','bb-vtc');const x=document.createElement('input');x.type='checkbox';x.checked=on;l.append(x,document.createTextNode(t));opt.appendChild(l);return x;};
  opt.append(el('span','bb-meta','Default date'),ddt);const skipD=mk2('Skip already done',true),onlyU=mk2('Show only unmatched',false),wOnly=mk2('Only update weights',false);
  const tpl=el('button','bb-b g','Template CSV');tpl.onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['Tracking,KM order,Item,Weight kg,Date,Charge,AWB,Note\n1Z999AA10123456784,US109500,Coach Teri bag,0.8,'+today()+',1000,,\n'],{type:'text/csv'}));a.download='luxella-reshipper-template.csv';a.click();};
  const clr=el('button','bb-b g','Clear');clr.onclick=()=>{ta.value='';fi.value='';out.textContent='';};opt.append(tpl,clr);c.appendChild(opt);
  const go=el('button','bb-b','Read sheet');go.style.marginTop='8px';c.appendChild(go);const out=el('div');c.appendChild(out);
  const TYPES=[['','Ignore'],['tracking','Store tracking'],['awb','Reshipper AWB'],['order','KM order ID'],['item','Item'],['weight','Weight kg'],['date','Date'],['cost','Charge ₹'],['note','Note']];
  const guess=h=>{h=String(h||'').toLowerCase();if(/awb|outbound|ship(ped)? to india|india track|mawb|hawb/.test(h))return 'awb';if(/track|inbound|tracking|ups|fedex|usps/.test(h))return 'tracking';if(/order|ref|km/.test(h))return 'order';if(/item|product|desc|name|content/.test(h))return 'item';if(/weight|kg|wt|lbs/.test(h))return 'weight';if(/date|received|arriv|deliver/.test(h))return 'date';if(/charge|cost|amount|rs|inr|bill/.test(h))return 'cost';return '';};
  const parse=txt=>{const lines=txt.replace(/\r/g,'').split('\n').filter(x=>x.trim());if(!lines.length)return [];const sep=lines[0].includes('\t')?'\t':',';const split=l=>{if(sep==='\t')return l.split('\t');const o=[];let cur='',q=false;for(const ch of l){if(ch==='"'){q=!q;continue;}if(ch===','&&!q){o.push(cur);cur='';continue;}cur+=ch;}o.push(cur);return o;};return lines.map(split).map(r=>r.map(x=>x.trim()));};
  const toDate=v=>{if(!v)return '';const m=String(v).match(/(\d{4})-(\d{1,2})-(\d{1,2})/);if(m)return m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0');const d=new Date(v);if(!isNaN(d))return d.toISOString().slice(0,10);const m2=String(v).match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);if(m2){const y=m2[3].length===2?'20'+m2[3]:m2[3];return y+'-'+m2[2].padStart(2,'0')+'-'+m2[1].padStart(2,'0');}return '';};
  const norm=x=>String(x||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  const match=(cells,map)=>{const val=t=>cells.filter((_,i)=>map[i]===t).join(' ');const tr=norm(val('tracking')),aw=norm(val('awb')),od=norm(val('order')),it=val('item').toLowerCase(),all1=norm(cells.join(' '));
   let hit=all.find(r=>{const t=norm(String(gv(r,'retailer_tracking')||'').split(' ')[0]);return t&&t.length>=8&&(tr.includes(t)||all1.includes(t));});if(hit)return [hit,'tracking'];
   hit=all.find(r=>{const o=norm(r.order_id||r._id);return o&&o.length>=6&&(od.includes(o)||all1.includes(o));});if(hit)return [hit,'order id'];
   if(aw)hit=all.find(r=>{const t=norm(gv(r,'reship_awb'));return t&&t.length>=6&&aw.includes(t);});if(hit)return [hit,'AWB'];
   if(it){const words=it.split(/\W+/).filter(w=>w.length>3);let best=null,sc=0;all.filter(r=>!rsel.value||r.reshipper===rsel.value).forEach(r=>{const n=String(r.item||'').toLowerCase();const s=words.filter(w=>n.includes(w)).length/Math.max(1,words.length);if(s>sc){sc=s;best=r;}});if(best&&sc>=0.5)return [best,'item name ~'+Math.round(sc*100)+'%'];}
   return [null,''];};
  const run=rows=>{out.textContent='';if(rows.length<2){out.appendChild(el('p','bb-meta','Kam se kam header + 1 row chahiye.'));return;}
   const head=rows[0];const map=head.map(guess);const body=rows.slice(1);
   const mh=el('div','bb-maph');head.forEach((h,i)=>{const w=el('label',null,h||('Col '+(i+1)));const s2=document.createElement('select');TYPES.forEach(([v,t])=>{const o=el('option',null,t);o.value=v;if(map[i]===v)o.selected=true;s2.appendChild(o);});s2.onchange=()=>{map[i]=s2.value;draw2();};w.appendChild(s2);mh.appendChild(w);});out.appendChild(mh);
   const tbl=el('div');out.appendChild(tbl);const apply=el('button','bb-b','Apply to matched orders');apply.style.marginTop='10px';out.appendChild(apply);let plan=[];
   const draw2=()=>{tbl.textContent='';plan=[];const opts=all.map(r=>[r.order_id||r._id,(r.order_id||r._id)+' · '+r.item]);
    body.forEach(cells=>{const [r,how]=match(cells,map);const row=el('div','bb-mr');row.appendChild(el('span','c',cells.filter(Boolean).slice(0,5).join(' | ').slice(0,140)));
     const s3=document.createElement('select');[['','— no match —'],...opts].forEach(([v,t])=>{const o=el('option',null,t);o.value=v;if(r&&(r.order_id||r._id)===v)o.selected=true;s3.appendChild(o);});row.appendChild(s3);row.appendChild(el('small',null,how||''));
     const pl={cells,sel:s3};s3.onchange=()=>{apply.textContent='Apply to '+plan.filter(x=>x.sel.value).length+' matched orders';};plan.push(pl);if(!(onlyU.checked&&r))tbl.appendChild(row);});
    const mt=plan.filter(x=>x.sel.value).length;tbl.prepend(el('p','bb-meta','Matched '+mt+' / '+plan.length+' rows · unmatched '+(plan.length-mt)));
    apply.textContent='Apply to '+mt+' matched orders';};onlyU.onchange=()=>draw2();
   draw2();
   apply.onclick=async()=>{const todo2=plan.filter(x=>x.sel.value);if(!todo2.length)return;if(!confirm(todo2.length+' orders update honge ('+act.options[act.selectedIndex].text+'). Pakka?'))return;apply.disabled=true;let n=0;
    for(const x of todo2){const r=all.find(o=>(o.order_id||o._id)===x.sel.value);if(!r)continue;const val=t=>x.cells.filter((_,i)=>map[i]===t).join(' ').trim();const p={};
     const w=parseFloat(val('weight'));if(!isNaN(w))p.actual_weight=w;const dt=toDate(val('date'))||ddt.value||today();
     if(wOnly.checked){if(p.actual_weight){p.weight=p.actual_weight;if(await save(r,p))n++;}continue;}
     if(skipD.checked&&((act.value==='arrived'&&gv(r,'delivered_reshipper'))||(act.value==='shipped'&&gv(r,'shipped_reshipper'))||(act.value==='landed'&&gv(r,'landed_india'))))continue;const cost=parseFloat(String(val('cost')).replace(/[^0-9.]/g,''));if(!isNaN(cost)){p.reship_cost=cost;p.reship_billed='Billed';}
     if(rsel.value)p.reshipper=rsel.value;if(val('awb'))p.reship_awb=val('awb');if(val('note'))p.notes=[r.notes,val('note')].filter(Boolean).join(' | ');
     if(act.value==='arrived')p.delivered_reshipper=gv(r,'delivered_reshipper')||dt;if(act.value==='shipped'){p.shipped_reshipper=dt;if(!gv(r,'delivered_reshipper'))p.delivered_reshipper=dt;}if(act.value==='landed')p.landed_india=dt;
     if(p.actual_weight)p.weight=p.actual_weight;p.status=derive(Object.assign({},r,p));if(await save(r,p))n++;}
    toast(n+' orders updated');apply.disabled=false;S.tab='todo';draw();};};
  go.onclick=()=>run(parse(ta.value));
  fi.onchange=async()=>{const f=fi.files&&fi.files[0];if(!f)return;if(/\.xlsx?$/i.test(f.name)){const load=()=>new Promise((res,rej)=>{if(window.XLSX)return res();const sc=document.createElement('script');sc.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';sc.onload=res;sc.onerror=rej;document.head.appendChild(sc);});try{await load();const wb=XLSX.read(await f.arrayBuffer(),{type:'array',cellDates:true});const ws=wb.Sheets[wb.SheetNames[0]];const rows=XLSX.utils.sheet_to_json(ws,{header:1,raw:false,defval:''});ta.value=rows.map(r=>r.join('\t')).join('\n');run(rows.filter(r=>r.some(Boolean)).map(r=>r.map(x=>String(x).trim())));}catch(e){toast('File nahi padh paya');}}else{ta.value=await f.text();run(parse(ta.value));}};}
 function reship(P){
  const ALLV=viewTools(P,all.filter(r=>r.reshipper&&r.status!=='Cancelled'),{date:'delivered_reshipper'});const tb=el('div','bb-chips');const groups={};ALLV.forEach(r=>{(groups[r.reshipper]=groups[r.reshipper]||[]).push(r);});
  const names=Object.keys(groups).sort((a,b)=>groups[b].length-groups[a].length);if(!names.length){P.appendChild(el('p','bb-meta','Koi reshipper data nahi.'));return;}
  if(!S.rsel||!groups[S.rsel])S.rsel=names[0];
  names.forEach(n=>{const live=groups[n].filter(r=>['Ordered','In transit to reshipper','At reshipper','Shipped from hub'].includes(r.status)).length;const b=el('button','bb-chip'+(S.rsel===n?' on':''),n);b.appendChild(el('b',null,String(live)));b.onclick=()=>{S.rsel=n;draw();};tb.appendChild(b);});P.appendChild(tb);
  const rows=groups[S.rsel];const W=(a,k)=>a.reduce((t,r)=>t+(Number(gv(r,k))||0),0);
  const inc=rows.filter(r=>r.status==='In transit to reshipper'||r.status==='Ordered'),at=rows.filter(r=>r.status==='At reshipper'),out=rows.filter(r=>r.status==='Shipped from hub'),done=rows.filter(r=>['Landed India','Shipped to KM','Delivered to KM','Out for delivery','Delivered to client'].includes(r.status));
  const K=el('div','bb-kpis');const k=(t,v,sub)=>{const d=el('div','bb-k');d.style.cursor='default';d.append(el('small',null,t),el('div','v',v),el('small',null,sub||''));K.appendChild(d);};
  k('Coming to warehouse',String(inc.length),'from stores');k('At warehouse',String(at.length),'est '+W(at,'est_weight').toFixed(2)+' kg · actual '+W(at,'actual_weight').toFixed(2)+' kg');k('Shipped to India',String(out.length),'in transit');k('Reship cost (all)',inr(W(rows,'reship_cost')),rows.filter(r=>r.reship_billed==='Billed').length+' billed · '+rows.filter(r=>r.reship_billed!=='Billed').length+' estimate');
  k('Forms pending',String(at.concat(out).filter(r=>r.form_filled!=='Yes').length),'at warehouse / shipped');P.appendChild(K);
  if(/Ishaan/.test(S.rsel)&&W(at,'est_weight')<1&&at.length)P.appendChild(el('p','bb-meta','Warehouse me 1 kg se kam hai, Ishaan ka 1 kg minimum lagega. Aur items stack karo.'));
  const sec=(title,list,cols)=>{const c=el('div','bb-card');c.appendChild(el('h2',null,title+' · '+list.length));if(!list.length){c.appendChild(el('p','bb-meta','—'));P.appendChild(c);return;}
   const t=el('div','bb-tbl');const hr=el('div','bb-tr th');cols.forEach(([h])=>hr.appendChild(el('span',null,h)));t.appendChild(hr);
   list.forEach(r=>{const tr=el('div','bb-tr');cols.forEach(([h,fn])=>tr.appendChild(el('span',null,String(fn(r)??'—')||'—')));tr.onclick=()=>{S.tab='orders';S.who='';S.st='';S.q=r.order_id||r._id;draw();setTimeout(()=>{const x=document.querySelector('.bb-row');if(x)x.open=true;},50);};t.appendChild(tr);});c.appendChild(t);P.appendChild(c);};
  const id=r=>r.order_id||r._id;
  sec('Coming to warehouse',inc,[['Order',id],['Item',r=>r.item],['Store',r=>gv(r,'store')||r.brand],['Tracking',r=>gv(r,'retailer_tracking')],['Expected',r=>gv(r,'eta_reshipper')],['Est kg',r=>gv(r,'est_weight')]]);
  sec('At warehouse',at.sort((a,b)=>(days(gv(b,'delivered_reshipper'))||0)-(days(gv(a,'delivered_reshipper'))||0)),[['Order',id],['Item',r=>r.item],['Reached',r=>gv(r,'delivered_reshipper')],['Days',r=>days(gv(r,'delivered_reshipper'))],['Est / actual kg',r=>(gv(r,'est_weight')||'—')+' / '+(gv(r,'actual_weight')||'—')],['Form',r=>gv(r,'form_filled')||'pending']]);
  sec('Shipped to India',out,[['Order',id],['Item',r=>r.item],['Left on',r=>gv(r,'shipped_reshipper')],['AWB',r=>gv(r,'reship_awb')],['ETA India',r=>gv(r,'eta_india')],['Actual kg',r=>gv(r,'actual_weight')]]);
  sec('Landed / done',done,[['Order',id],['Item',r=>r.item],['Landed',r=>gv(r,'landed_india')],['Cost ₹',r=>inr(gv(r,'reship_cost'))],['Billed?',r=>gv(r,'reship_billed')||'Estimate'],['Status',r=>LBL[r.status]||r.status]]);
  {const ex=el('div','bb-card');ex.appendChild(el('h2',null,S.rsel+' · tools'));const xb=el('div','bb-bar');
   const pa=el('a','bb-b g','WhatsApp pre-alert (coming items)');pa.href='https://wa.me/?text='+encodeURIComponent('Hi, incoming parcels for Luxella:\n'+inc.map((r,i)=>(i+1)+'. '+(r.order_id||r._id)+' · '+r.item+(gv(r,'store')?' · '+gv(r,'store'):'')+(gv(r,'retailer_tracking')?' · '+gv(r,'retailer_tracking'):'')).join('\n'));pa.target='_blank';pa.rel='noopener';pa.style.textDecoration='none';
   const sh=el('a','bb-b g','WhatsApp: ship these to India');sh.href='https://wa.me/?text='+encodeURIComponent('Hi, please ship these together to India:\n'+at.map((r,i)=>(i+1)+'. '+(r.order_id||r._id)+' · '+r.item+(gv(r,'retailer_tracking')?' · '+gv(r,'retailer_tracking'):'')).join('\n')+'\nTotal est '+W(at,'est_weight').toFixed(2)+' kg');sh.target='_blank';sh.rel='noopener';sh.style.textDecoration='none';
   const fd=el('button','bb-b g','Mark all forms done');fd.onclick=async()=>{const l2=inc.concat(at).filter(r=>r.form_filled!=='Yes');if(!l2.length){toast('Sab forms done');return;}if(!confirm(l2.length+' forms done mark honge?'))return;for(const r of l2)await save(r,{form_filled:'Yes',form_date:today()});draw();};
   const ar=el('button','bb-b g','All coming → arrived today');ar.onclick=async()=>{if(!inc.length)return;if(!confirm(inc.length+' items hub pe arrived mark honge?'))return;for(const r of inc)await save(r,{delivered_reshipper:today(),status:'At reshipper'});draw();};
   xb.append(pa,sh,fd,ar);ex.appendChild(xb);
   const avgD=at.length?Math.round(at.reduce((t,r)=>t+(days(gv(r,'delivered_reshipper'))||0),0)/at.length):0;const est=W(rows,'reship_cost'),billed=rows.filter(r=>r.reship_billed==='Billed').reduce((t,r)=>t+(Number(r.reship_cost)||0),0);
   ex.appendChild(el('p','bb-meta','Avg days at hub: '+avgD+' · Billed so far '+inr(billed)+' of '+inr(est)+' total reship cost · Rate ₹1,250/kg'+(/Ishaan/.test(S.rsel)?' · 1 kg minimum, 0.5 kg rounding (USA)':'')));
   if(at.length){const sorted=at.slice().sort((a,b)=>(days(gv(b,'delivered_reshipper'))||0)-(days(gv(a,'delivered_reshipper'))||0));let g=[],w=0;sorted.forEach(r=>{if(w<1){g.push(r);w+=Number(gv(r,'actual_weight')||gv(r,'est_weight'))||0;}});ex.appendChild(el('p','bb-meta','Stacking suggestion (oldest first, ≥1 kg): '+g.map(r=>r.order_id||r._id).join(', ')+' = '+w.toFixed(2)+' kg'));}
   P.appendChild(ex);}
  if(at.length){const b=el('button','bb-b g','Mark all at warehouse as shipped to India today');b.onclick=async()=>{if(!confirm(at.length+' items "Left reshipper" mark honge. Pakka?'))return;for(const r of at)await save(r,{shipped_reshipper:today(),status:'Shipped from hub'});draw();};P.appendChild(b);}}
 /* ---------- shared card helpers ---------- */
 const byOid=i=>all.find(r=>(r.order_id||r._id)===i);
 const tag=(t,c)=>el('span','bb-tag'+(c?' '+c:''),t);
 const lnk=(t,href,cls)=>{const a=el('a',cls||'bb-b g sm',t);a.href=href;a.target='_blank';a.rel='noopener';return a;};
 const trackUrl=t=>'https://track.aftership.com/'+encodeURIComponent(String(t).split(' ')[0]);
 const btn=(t,fn,cls)=>{const b=el('button',cls||'bb-b g sm',t);b.onclick=fn;return b;};
 const copyT=async t=>{try{await navigator.clipboard.writeText(t);toast('Copied');}catch(e){}};
 const sumP=a=>a.reduce((t,r)=>t+(Number(r.payout)||0),0);
 const CTRY=[['USA','🇺🇸'],['UK','🇬🇧'],['Canada','🇨🇦']];
 const ctryOf=b=>{if(b.country)return b.country;const s=[b.store,b.ship_to,b.currency].join(' ');return /canada|CAD|mississauga|ontario/i.test(s)?'Canada':/\bUK\b|GBP|london|united kingdom/i.test(s)?'UK':'USA';};
 const flag=c=>(CTRY.find(x=>x[0]===c)||['',''])[1];
 const trkMap=()=>{const m=new Map();all.forEach(r=>{const t=String(gv(r,'retailer_tracking')||'').split(' ')[0];if(t)m.set(t,(m.get(t)||[]).concat([r]));});return m;};
 const buyKM=(bu,m)=>{const a=(bu.tracking_numbers||[]).flatMap(t=>m.get(String(t).split(' ')[0])||[]).concat((bu.km_ids||[]).map(byOid).filter(Boolean)).concat(bu.store_order_no?all.filter(r=>gv(r,'retailer_order_id')===bu.store_order_no):[]);return [...new Map(a.map(r=>[r._id,r])).values()];};
 const pushBuy=async(bu,rs)=>{for(const r of rs){const pp={store:bu.store,retailer_order_id:bu.store_order_no,retailer_date:bu.order_date,buy_email:bu.recipient};const t=(bu.tracking_numbers||[])[0];if(t){pp.retailer_tracking=pp.intl_tracking=t;}if(bu.ship_date)pp.retailer_ship_date=bu.ship_date;if(bu.carrier)pp.retailer_carrier=bu.carrier;if(bu.status==='delivered'&&bu.delivered_date&&!gv(r,'delivered_reshipper'))pp.delivered_reshipper=bu.delivered_date;Object.keys(pp).forEach(k=>{if(pp[k]==null||pp[k]==='')delete pp[k];});pp.status=derive(Object.assign({},r,pp));await save(r,pp);}};
 const kmChip=(r,onX)=>{const c=el('div','bb-kmc');const a=el('div');a.appendChild(el('b',null,r.order_id||r._id));a.appendChild(el('span',null,String(r.item||'').slice(0,46)));c.appendChild(a);c.appendChild(el('em',null,inr(r.payout)));if(onX){const x=el('button','x','×');x.title='Remove from this card';x.onclick=onX;c.appendChild(x);}return c;};
 const search=(P,key,ph)=>{const i=document.createElement('input');i.className='bb-search';i.placeholder=ph||'Search…';i.value=S[key]||'';i.oninput=()=>{S[key]=i.value;clearTimeout(i._t);i._t=setTimeout(()=>{draw();setTimeout(()=>{const n=document.querySelector('.bb-search');if(n){n.focus();n.setSelectionRange(n.value.length,n.value.length);}},0);},300);};P.appendChild(i);return (S[key]||'').toLowerCase();};
 const chipRow=(P,key,opts,def)=>{const w=el('div','bb-chips');if(S[key]==null)S[key]=def||'';opts.forEach(([v,t,n])=>{const b=el('button','bb-chip'+(S[key]===v?' on':''),t);if(n!=null)b.appendChild(el('b',null,String(n)));b.onclick=()=>{S[key]=v;draw();};w.appendChild(b);});P.appendChild(w);};

 /* ---------- Orders placed: one card = one store order (can hold many KM orders, one tracking) ---------- */
 function buys(P){const m=trkMap();
  const cnt={USA:0,UK:0,Canada:0};BUYS.forEach(b=>{cnt[ctryOf(b)]=(cnt[ctryOf(b)]||0)+1;});
  const top=el('div','bb-top2');const qv=search(top,'bq','Search store, order no, item, tracking, KM ID…');const add=btn('+ New order card',async()=>{const id='buy-'+Date.now().toString(36);const bu={_id:id};if(await saveK('buy',bu,{store:'',status:'ordered',order_date:today(),items:[],country:S.bc||'USA'})){BUYS.push(bu);S.bedit=id;draw();}},'bb-b sm');top.appendChild(add);P.appendChild(top);
  chipRow(P,'bc',[['','All countries',BUYS.length],...CTRY.map(([c,f])=>[c,f+' '+c,cnt[c]||0])]);
  const st=b=>b.status||'ordered';const nk={};BUYS.forEach(b=>{nk[st(b)]=(nk[st(b)]||0)+1;});const unl=BUYS.filter(b=>!buyKM(b,m).length).length;
  chipRow(P,'uf',[['','All'],['ordered','Ordered',nk.ordered||0],['shipped','Shipped',nk.shipped||0],['delivered','At reshipper',nk.delivered||0],['cancelled','Cancelled',nk.cancelled||0],['__un','Not linked',unl]]);
  const tp=KMO().filter(r=>r.status==='To place');if(tp.length&&!S.uf){const sc=el('div','bb-sech');sc.appendChild(el('span',null,'🛒 To place at store'));sc.appendChild(el('small',null,tp.length+' orders · '+inr(sumP(tp))));P.appendChild(sc);const g0=el('div','bb-grid');tp.forEach(r=>{const c=el('div','bb-cd');const h=el('div','cd-h');const hl=el('div');hl.appendChild(el('b',null,r.order_id||r._id));hl.appendChild(el('small',null,[r.brand,r.item,r.size].filter(Boolean).join(' · ')));h.appendChild(hl);h.appendChild(el('div','cd-amt',inr(r.payout)));c.appendChild(h);
   const sl=gv(r,'sla_deadline');if(sl)c.appendChild(el('p','bb-meta','KM SLA '+sl+' · bid day '+(days(r.order_date)||0)));
   {const pc=pcLine(r);if(pc)c.appendChild(pc);else c.appendChild(el('small','bb-meta','💰 Price check: pricing agent ka wait'));}
   const tr=el('div','cd-in');const ss=document.createElement('select');['',...STORES].forEach(v=>{const o=el('option',null,v||'Store');o.value=v;ss.appendChild(o);});const on=document.createElement('input');on.placeholder='Store order no.';tr.append(ss,on);c.appendChild(tr);
   const ct=el('div','cd-ctry');let cc='USA';const cbs=CTRY.map(([n,fl])=>{const b=el('button','ct'+(n==='USA'?' on':''),fl+' '+n);b.onclick=()=>{cc=n;cbs.forEach(x=>x.classList.toggle('on',x===b));};ct.appendChild(b);return b;});c.appendChild(ct);
   c.appendChild(btn('✓ Order placed',async()=>{if(!on.value.trim()){toast('Store order no. daalo');return;}const p={store:ss.value,retailer_order_id:on.value.trim(),retailer_date:today(),country:cc};p.status=derive(Object.assign({},r,p));if(!(await save(r,p)))return;let bu=BUYS.find(b=>b.store_order_no===p.retailer_order_id);if(bu){await saveK('buy',bu,{km_ids:[...new Set([...(bu.km_ids||[]),r.order_id||r._id])]});}else{bu={_id:'buy-'+Date.now().toString(36)};if(await saveK('buy',bu,{store:p.store,store_order_no:p.retailer_order_id,order_date:today(),status:'ordered',country:cc,items:[{name:r.item,size:r.size}],km_ids:[r.order_id||r._id]}))BUYS.push(bu);}draw();},'bb-b sm'));g0.appendChild(c);});P.appendChild(g0);const sc2=el('div','bb-sech');sc2.appendChild(el('span',null,'📦 Placed orders'));sc2.appendChild(el('small',null,BUYS.length+' store orders'));P.appendChild(sc2);}
  const f=BUYS.filter(b=>!S.bc||ctryOf(b)===S.bc).filter(b=>!S.uf?true:S.uf==='__un'?!buyKM(b,m).length:st(b)===S.uf).filter(b=>!qv||(JSON.stringify(b)+buyKM(b,m).map(r=>r.order_id).join(' ')).toLowerCase().includes(qv)).sort((a,b)=>String(b.order_date).localeCompare(String(a.order_date)));
  if(!f.length){P.appendChild(el('p','bb-meta','Kuch nahi mila.'));return;}
  const g=el('div','bb-grid');f.forEach(bu=>g.appendChild(buyCard(bu,m)));P.appendChild(g);}
 function buyCard(bu,m){const c=el('div','bb-cd');const st=bu.status||'ordered';const ks=buyKM(bu,m);
  const h=el('div','cd-h');const hl=el('div');hl.appendChild(el('b',null,bu.store||'New store order'));hl.appendChild(el('small',null,[bu.store_order_no?'#'+bu.store_order_no:'',bu.order_date].filter(Boolean).join(' · ')));h.appendChild(hl);
  h.appendChild(tag(st==='delivered'?'At reshipper':st,st==='cancelled'?'bad':st==='delivered'?'ok':st==='shipped'?'go':''));c.appendChild(h);
  const ct=el('div','cd-ctry');const cur=ctryOf(bu);CTRY.forEach(([n,fl])=>{const b=el('button','ct'+(cur===n?' on':''),(cur===n?'✓ ':'')+fl+' '+n);b.onclick=async()=>{if(await saveK('buy',bu,{country:n}))draw();};ct.appendChild(b);});c.appendChild(ct);
  if((bu.items||[]).length&&!ks.length){const it=el('div','cd-items');bu.items.forEach(x=>it.appendChild(el('div',null,'• '+[x.name,x.size].filter(Boolean).join(' · ')+(x.qty>1?' ×'+x.qty:''))));c.appendChild(it);}
  const kw=el('div','cd-sec');kw.appendChild(el('label',null,'KicksMachine orders in this parcel'+(ks.length>1?' · '+ks.length+' orders, 1 tracking':'')));
  ks.forEach(r=>kw.appendChild(kmChip(r,(bu.km_ids||[]).includes(r.order_id||r._id)?async()=>{if(await saveK('buy',bu,{km_ids:(bu.km_ids||[]).filter(x=>x!==(r.order_id||r._id))}))draw();}:null)));
  if(!ks.length)kw.appendChild(el('p','bb-meta','Abhi koi KM order linked nahi.'));
  const sel=document.createElement('select');sel.className='cd-add';[['','+ Add KM order to this card'],...all.filter(r=>r.client==='KicksMachine'&&!/cancel/i.test(r.status||'')&&!ks.includes(r)).sort((a,b)=>(a.status==='To place'?0:1)-(b.status==='To place'?0:1)).map(r=>[r.order_id||r._id,(r.order_id||r._id)+' · '+String(r.item).slice(0,34)+(r.status==='To place'?' (to place)':'')])].forEach(([v,t])=>{const o=el('option',null,t);o.value=v;sel.appendChild(o);});
  sel.onchange=async()=>{const r=byOid(sel.value);if(!r)return;const ids=[...new Set([...(bu.km_ids||[]),sel.value])];if(await saveK('buy',bu,{km_ids:ids})){await pushBuy(bu,[r]);draw();}};kw.appendChild(sel);c.appendChild(kw);
  const tw=el('div','cd-sec');tw.appendChild(el('label',null,'Tracking'));const tn=(bu.tracking_numbers||[])[0];
  if(tn){const tr=el('div','cd-trk');tr.appendChild(el('code',null,tn));tr.appendChild(el('small',null,[bu.carrier,bu.ship_date?'shipped '+bu.ship_date:''].filter(Boolean).join(' · ')));tw.appendChild(tr);const ab=el('div','cd-act');ab.append(lnk('Track',trackUrl(tn)),btn('Copy',()=>copyT(tn)));tw.appendChild(ab);}
  else{const tr=el('div','cd-in');const ti=document.createElement('input');ti.placeholder='Tracking no.';const cs=document.createElement('select');['',...CARRIERS].forEach(v=>{const o=el('option',null,v||'Carrier');o.value=v;cs.appendChild(o);});const sv=btn('Save',async()=>{const t=ti.value.trim();if(!t)return;const p={tracking_numbers:[t],carrier:cs.value,status:st==='ordered'?'shipped':st,ship_date:bu.ship_date||today()};if(await saveK('buy',bu,p)){await pushBuy(bu,ks);draw();}},'bb-b sm');tr.append(ti,cs,sv);tw.appendChild(tr);if(ks.length>1)tw.appendChild(el('p','bb-meta','Ye tracking saare '+ks.length+' KM orders me lag jaayega.'));}
  c.appendChild(tw);
  const ft=el('div','cd-f');ft.appendChild(el('b',null,bu.total_usd!=null?(cur==='Canada'?'C$':cur==='UK'?'£':'$')+Number(bu.total_usd).toFixed(2):''));const fa=el('div','cd-act');
  if(st==='ordered')fa.appendChild(btn('Mark shipped',async()=>{if(await saveK('buy',bu,{status:'shipped',ship_date:bu.ship_date||today()})){await pushBuy(bu,ks);draw();}}));
  if(st==='shipped')fa.appendChild(btn('✓ Reached reshipper',async()=>{if(await saveK('buy',bu,{status:'delivered',delivered_date:today()})){await pushBuy(bu,ks);draw();}}));
  ((bu.gmail_thread_ids||[]).slice(0,1)).forEach(gg=>fa.appendChild(lnk('Mail','https://mail.google.com/mail/?authuser=jeetnatb@gmail.com#all/'+gg)));
  fa.appendChild(btn(S.bedit===bu._id?'Close':'Edit',()=>{S.bedit=S.bedit===bu._id?'':bu._id;draw();}));ft.appendChild(fa);c.appendChild(ft);
  if(S.bedit===bu._id){const f2=el('div','bb-f');const F={};[['store','Store','list',['',...STORES,'Coach Outlet Canada','Other']],['store_order_no','Store order no.'],['order_date','Ordered on','date'],['recipient','Account email'],['total_usd','Total','number'],['ship_to','Shipped to'],['tracking','Tracking no.'],['carrier','Carrier','list',['',...CARRIERS]],['ship_date','Shipped on','date'],['status','Status','list',['ordered','shipped','delivered','cancelled']],['notes','Notes','area']].forEach(([k,lab,type,opts])=>{const l=el('label',null,lab);let i;const v=k==='tracking'?(bu.tracking_numbers||[]).join(', '):(bu[k]==null?'':String(bu[k]));if(type==='list'){i=document.createElement('select');if(v&&!opts.includes(v))opts=[v,...opts];opts.forEach(o=>{const op=el('option',null,o||'—');op.value=o;if(o===v)op.selected=true;i.appendChild(op);});}else{i=document.createElement(type==='area'?'textarea':'input');if(type&&type!=='area')i.type=type;i.value=v;}l.appendChild(i);f2.appendChild(l);F[k]=i;});
   c.appendChild(f2);const sv=btn('Save card',async()=>{const p={};Object.entries(F).forEach(([k,i])=>{let v=i.value;if(k==='tracking'){p.tracking_numbers=v.split(',').map(x=>x.trim()).filter(Boolean);return;}if(i.type==='number')v=v===''?null:Number(v);p[k]=v;});if(await saveK('buy',bu,p)){await pushBuy(bu,ks);S.bedit='';draw();}},'bb-b sm');c.appendChild(sv);}
  return c;}

 /* ---------- In transit: every moving parcel as a card (one tracking, many KM orders) ---------- */
 function transit(P){const km=all.filter(r=>r.client==='KicksMachine'&&!/cancel/i.test(r.status||''));
  const LEGS=[
   {k:'hub',t:'Store → Reshipper',ic:'🛍️',test:r=>['Ordered','In transit to reshipper'].includes(r.status)&&!!gv(r,'retailer_tracking'),key:r=>String(gv(r,'retailer_tracking')).split(' ')[0],trk:r=>String(gv(r,'retailer_tracking')).split(' ')[0],car:r=>gv(r,'retailer_carrier')||gv(r,'store'),since:r=>gv(r,'retailer_ship_date')||gv(r,'retailer_date'),eta:r=>gv(r,'eta_reshipper'),late:10,done:'✓ Reached reshipper',patch:()=>({delivered_reshipper:today()}),field:'retailer_tracking'},
   {k:'india',t:'Reshipper → India',ic:'✈️',test:r=>r.status==='Shipped from hub',key:r=>gv(r,'reship_awb')||('nr-'+(r.reshipper||'')+'-'+gv(r,'shipped_reshipper')),trk:r=>gv(r,'reship_awb'),car:r=>r.reshipper,since:r=>gv(r,'shipped_reshipper'),eta:r=>gv(r,'eta_india'),late:8,done:'✓ Landed in India',patch:()=>({landed_india:today()}),field:'reship_awb'}];
  const waiting=km.filter(r=>['Ordered','In transit to reshipper'].includes(r.status)&&!gv(r,'retailer_tracking'));
  const groups=LEGS.map(L=>{const gm=new Map();km.filter(L.test).forEach(r=>{const k=L.key(r);gm.set(k,(gm.get(k)||[]).concat([r]));});return [L,[...gm.values()]];});
  const allRows=groups.flatMap(([L,gs])=>gs.flat());
  {const pd=document.createElement('details');pd.className='ph-d';const ps=document.createElement('summary');ps.textContent='📷 Upload screenshot → tracking auto';pd.appendChild(ps);pd.appendChild(photoCard());P.appendChild(pd);}
  const sm=el('div','bb-sum');[[String(groups.reduce((t,[L,gs])=>t+gs.length,0)),'parcels moving'],[String(allRows.length),'KM orders inside'],[inr(sumP(allRows)),'payout value in transit'],[String(waiting.length),'ordered, no tracking yet']].forEach(([v,t])=>{const d=el('div');d.appendChild(el('b',null,v));d.appendChild(el('small',null,t));sm.appendChild(d);});P.appendChild(sm);
  const qv=search(P,'tq','Search tracking, KM ID, item…');
  chipRow(P,'tl',[['','All',groups.reduce((t,[L,gs])=>t+gs.length,0)],...groups.map(([L,gs])=>[L.k,L.ic+' '+L.t,gs.length]),['wait','⏳ No tracking yet',waiting.length]]);
  groups.forEach(([L,gs])=>{if(S.tl&&S.tl!==L.k)return;const f=gs.filter(rs=>!qv||rs.map(vtxt).join(' ').includes(qv));if(!f.length)return;
   const sec=el('div','bb-sech');sec.appendChild(el('span',null,L.ic+' '+L.t));sec.appendChild(el('small',null,f.length+' parcel'+(f.length>1?'s':'')+' · '+f.flat().length+' orders · '+inr(sumP(f.flat()))));P.appendChild(sec);
   const g=el('div','bb-grid');f.sort((a,b)=>String(L.since(a[0])||'').localeCompare(String(L.since(b[0])||''))).forEach(rs=>{const r0=rs[0];const tn=L.trk(r0);const d0=days(L.since(r0));const late=d0!=null&&d0>=L.late;
    const c=el('div','bb-cd'+(late?' late':''));const h=el('div','cd-h');const hl=el('div');hl.appendChild(el('b',null,tn?tn:'No tracking yet'));hl.appendChild(el('small',null,[L.car(r0),L.since(r0)?'since '+L.since(r0):''].filter(Boolean).join(' · ')));h.appendChild(hl);h.appendChild(tag(d0!=null?'Day '+d0:'—',late?'bad':'go'));c.appendChild(h);
    const pr=el('div','cd-prog');const pi=el('i');pi.style.width=Math.min(100,((d0||0)/L.late)*100)+'%';pr.appendChild(pi);c.appendChild(pr);
    c.appendChild(el('p','bb-meta',(L.eta(r0)?'ETA '+L.eta(r0)+' · ':'')+(late?'Late, follow up karo':'On the way')+(rs.length>1?' · '+rs.length+' KM orders in this parcel':'')));
    const kw=el('div','cd-sec');rs.forEach(r=>kw.appendChild(kmChip(r)));c.appendChild(kw);
    if(!tn){const tr=el('div','cd-in');const ti=document.createElement('input');ti.placeholder=L.k==='india'?'Reshipper AWB':'Courier tracking';const sv=btn('Save',async()=>{const t=ti.value.trim();if(!t)return;for(const r of rs){const p={[L.field]:t};if(L.field==='km_tracking'){p.local_tracking=t;if(!gv(r,'shipped_km'))p.shipped_km=today();}p.status=derive(Object.assign({},r,p));await save(r,p);}draw();},'bb-b sm');tr.append(ti,sv);c.appendChild(tr);}
    const ft=el('div','cd-f');ft.appendChild(el('b',null,inr(sumP(rs))));const fa=el('div','cd-act');if(tn&&!/^n[rk]-/.test(tn)){fa.appendChild(lnk('Track',trackUrl(tn)));fa.appendChild(btn('Copy',()=>copyT(tn)));}
    fa.appendChild(btn(L.done,async()=>{if(!confirm(rs.length+' order(s): '+L.done.replace('✓ ','')+' today?'))return;for(const r of rs){const p=L.patch();p.status=derive(Object.assign({},r,p));await save(r,p);}draw();},'bb-b sm'));ft.appendChild(fa);c.appendChild(ft);g.appendChild(c);});P.appendChild(g);});
  if((!S.tl||S.tl==='wait')&&waiting.length){const sec=el('div','bb-sech');sec.appendChild(el('span',null,'⏳ Ordered, store tracking pending'));sec.appendChild(el('small',null,waiting.length+' orders'));P.appendChild(sec);const g=el('div','bb-grid');waiting.filter(r=>!qv||vtxt(r).includes(qv)).forEach(r=>{const c=el('div','bb-cd');const h=el('div','cd-h');const hl=el('div');hl.appendChild(el('b',null,(r.order_id||r._id)));hl.appendChild(el('small',null,[gv(r,'store'),gv(r,'retailer_order_id')?'#'+gv(r,'retailer_order_id'):'',gv(r,'retailer_date')].filter(Boolean).join(' · ')));h.appendChild(hl);h.appendChild(tag('Day '+(days(gv(r,'retailer_date')||r.order_date)||0)));c.appendChild(h);c.appendChild(el('p',null,r.item));
    const tr=el('div','cd-in');const ti=document.createElement('input');ti.placeholder='Store tracking no.';const sv=btn('Save',async()=>{const t=ti.value.trim();if(!t)return;const p={retailer_tracking:t,intl_tracking:t,retailer_ship_date:today()};p.status=derive(Object.assign({},r,p));if(await save(r,p))draw();},'bb-b sm');tr.append(ti,sv);c.appendChild(tr);g.appendChild(c);});P.appendChild(g);}
  if(!allRows.length&&!waiting.length)P.appendChild(el('p','bb-meta','Abhi kuch transit me nahi.'));}

 /* ---------- Workflow helpers ---------- */
 const KMO=()=>all.filter(r=>r.client==='KicksMachine'&&!/cancel/i.test(r.status||''));
 const confirmedOn=r=>r.payout_timer||gv(r,'mrn_confirmed');
 const wa=(t,msg)=>lnk(t,'https://wa.me/?text='+encodeURIComponent(msg));
 const go=t=>{S.tab=t;draw();window.scrollTo(0,0);};
 const STAGES=[
  ['bids','Bids won · not ordered',()=>{const by=new Set(all.map(r=>r.order_id||r._id));return BIDS.filter(b=>!b.dismissed&&!(b.km_order_ids||[]).every(i=>by.has(i)));},'bid'],
  ['buys','To place at store',()=>KMO().filter(r=>r.status==='To place')],
  ['transit','Ordered · coming to reshipper',()=>KMO().filter(r=>['Ordered','In transit to reshipper'].includes(r.status))],
  ['reship','At reshipper',()=>KMO().filter(r=>r.status==='At reshipper')],
  ['transit','Flying to India',()=>KMO().filter(r=>r.status==='Shipped from hub')],
  ['tokm','To KicksMachine',()=>KMO().filter(r=>['Landed India','Shipped to KM','Out for delivery'].includes(r.status))],
  ['confirm','Waiting KM confirmation',()=>KMO().filter(r=>DONE(r.status)&&!confirmedOn(r)&&r.payout_status!=='Received')],
  ['payouts','Payout · 7-day timer',()=>KMO().filter(r=>confirmedOn(r)&&r.payout_status!=='Received'&&days(confirmedOn(r))<=7)],
  ['payouts','Chase payout',()=>KMO().filter(r=>confirmedOn(r)&&r.payout_status!=='Received'&&days(confirmedOn(r))>7),'chase'],
  ['payouts','Paid',()=>KMO().filter(r=>r.payout_status==='Received'),'got']];

 /* ---------- Overview ---------- */
 function overview(P){const km=KMO();
  const fl=el('div','ov-flow');STAGES.forEach(([tab,t,fn,sub],i)=>{const a=fn();const d=el('button','ov-st'+(a.length?'':' z'));d.appendChild(el('i',null,String(i+1)));d.appendChild(el('b',null,String(a.length)));d.appendChild(el('span',null,t));if(sub!=='bid'&&a.length)d.appendChild(el('small',null,inr(sumP(a))));d.onclick=()=>{if(sub==='chase')S.pf='chase';if(sub==='got')S.pf='got';go(tab);};fl.appendChild(d);});P.appendChild(fl);
  const cols=el('div','ov-cols');P.appendChild(cols);
  const att=el('div','bb-card');att.appendChild(el('h2',null,'Needs attention'));cols.appendChild(att);
  const slaX=km.filter(r=>{const s=gv(r,'sla_deadline');return s&&!DONE(r.status)&&days(s)>0;});
  const lateP=km.filter(r=>['In transit to reshipper'].includes(r.status)&&(days(gv(r,'retailer_ship_date'))||0)>=10||r.status==='Shipped from hub'&&(days(gv(r,'shipped_reshipper'))||0)>=8);
  const forms=km.filter(r=>['Ordered','In transit to reshipper'].includes(r.status)&&gv(r,'form_filled')!=='Yes');
  const kmP=km.filter(r=>['Ordered','In transit to reshipper'].includes(r.status)&&!gv(r,'km_portal_updated'));
  const mrn=km.filter(r=>DONE(r.status)&&!gv(r,'mrn_updated'));
  const cf=km.filter(r=>DONE(r.status)&&gv(r,'mrn_updated')&&!confirmedOn(r)&&(days(gv(r,'mrn_updated'))||0)>=3);
  const chase=km.filter(r=>confirmedOn(r)&&r.payout_status!=='Received'&&days(confirmedOn(r))>7);
  const items=[[slaX,'KM SLA crossed — update KM','transit'],[lateP,'Parcels late in transit','transit'],[kmP,'KM portal update pending','checklist'],[forms,'Reshipper receiver form pending','reship'],[mrn,'MRN update pending','confirm'],[cf,'KM confirmation 3+ days late','confirm'],[chase,'Payout overdue — chase KM','payouts']].filter(x=>x[0].length);
  if(!items.length)att.appendChild(el('p','bb-meta','Sab theek hai ✓'));
  items.forEach(([a,t,tab])=>{const l=el('button','ov-att');l.appendChild(el('b',null,String(a.length)));l.appendChild(el('span',null,t));l.appendChild(el('small',null,a.slice(0,3).map(r=>r.order_id||r._id).join(', ')+(a.length>3?'…':'')));l.onclick=()=>{if(tab==='payouts')S.pf='chase';go(tab);};att.appendChild(l);});
  const right=el('div');cols.appendChild(right);
  const mo=el('div','bb-card');mo.appendChild(el('h2',null,'Money'));const pend=km.filter(r=>r.payout_status!=='Received'&&!['Cancelled','To place'].includes(r.status));const costed=km.filter(r=>Number(r.landed)>0);
  [['Payout pending (all)',inr(sumP(pend))],['At KM, not yet paid',inr(sumP(pend.filter(r=>DONE(r.status))))],['Received',inr(sumP(km.filter(r=>r.payout_status==='Received')))],['Expected profit',inr(costed.reduce((t,r)=>t+(Number(r.profit)||0),0))]].forEach(([a,b])=>{const l=el('div','bb-line');l.appendChild(el('span','m',a));l.appendChild(el('b',null,b));mo.appendChild(l);});right.appendChild(mo);
  right.appendChild(photoCard());
  const ac=el('div','bb-card');ac.appendChild(el('h2',null,'🤖 Agents'));{let k=META.kmsync||{};if(k.error==='KM not connected')k={};const l=el('button','ov-att');l.style.gridTemplateColumns='34px 1fr';l.appendChild(el('b',null,'🔗'));l.querySelector('b').style.color='inherit';l.appendChild(el('span',null,'KicksMachine sync · '+(k.at?agoT(k.at):'connect karo')));l.appendChild(el('small',null,k.at?(k.ok?(k.km_orders+' KM orders read'):('error: '+(k.error||''))):'HQ tab me KM login daalo (read-only)'));l.onclick=()=>go('agents');ac.appendChild(l);}AG.forEach(([id,em,nm])=>{const x=AGENTS[id]||{};const l=el('button','ov-att');l.style.gridTemplateColumns='34px 1fr';l.appendChild(el('b',null,em));l.querySelector('b').style.color='inherit';l.appendChild(el('span',null,nm+' · '+agoT(x.last_run)));l.appendChild(el('small',null,x.summary||'—'));l.onclick=()=>go('agents');ac.appendChild(l);});right.appendChild(ac);}

 /* ---------- Photo / screenshot → tracking (OCR in browser) ---------- */
 function photoCard(){const c=el('div','bb-card');c.appendChild(el('h2',null,'📷 Upload screenshot'));c.appendChild(el('p','bb-meta','Store order mail, shipping / courier screenshot, label — order ID, store order no, tracking, $ amount sab khud nikaal ke update suggest karega (assistant me khulega).'));
  const fi=document.createElement('input');fi.type='file';fi.accept='image/*';fi.multiple=true;fi.className='ph-in';c.appendChild(fi);const out=el('div');c.appendChild(out);
  fi.onchange=async()=>{const fs=[...(fi.files||[])];if(!fs.length)return;if(window.__lxChat){fi.value='';window.__lxChat.files(fs);return;}out.textContent='';const st=el('p','bb-meta','Reading photo…');out.appendChild(st);
   try{if(!window.Tesseract)await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';s.onload=res;s.onerror=rej;document.head.appendChild(s);});
    let txt='';for(const f of fs){const r=await Tesseract.recognize(f,'eng');txt+='\n'+r.data.text;}st.remove();ocrResult(out,txt);}catch(e){st.textContent='Photo read nahi hua: '+(e&&e.message||e);}};
  return c;}
 function ocrResult(out,txt){const T=txt.replace(/[|]/g,' ');const U=T.toUpperCase();const found=new Map();const addF=(v,kind)=>{v=v.replace(/\s/g,'');if(v.length<6||found.has(v))return;found.set(v,kind);};
  (U.match(/\b1Z\s?[0-9A-Z]{3}\s?[0-9A-Z]{3}\s?[0-9A-Z]{2}\s?[0-9A-Z]{4}\s?[0-9A-Z]{4}\b/g)||[]).forEach(v=>addF(v,'UPS tracking'));
  (U.match(/\bTBA\d{12}\b/g)||[]).forEach(v=>addF(v,'Amazon tracking'));
  (U.match(/\bUS\d{6}(?:-[A-Z])?\b/g)||[]).forEach(v=>addF(v,'KM order'));
  (U.match(/\b(?:WUP|WCP|ZUP|Z0)\d{6,10}\b/g)||[]).forEach(v=>addF(v,'Store order'));
  (U.match(/\b\d{12,22}\b/g)||[]).forEach(v=>addF(v,'Tracking no.'));
  const delivered=/\bDELIVERED\b/.test(U);const shipped=/SHIPPED|ON ITS WAY|IN TRANSIT|ON THE WAY/.test(U);
  out.appendChild(el('p','bb-meta','Mila: '+(found.size?[...found].map(([v,k])=>k+' '+v).join(' · '):'kuch nahi')+(delivered?' · "Delivered" likha hai':shipped?' · "Shipped" likha hai':'')));
  const norm=x=>String(x||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  const hits=new Map();found.forEach((k,v)=>{all.forEach(r=>{const ids=[r.order_id,r._id,gv(r,'retailer_order_id'),String(gv(r,'retailer_tracking')).split(' ')[0],gv(r,'reship_awb'),gv(r,'km_tracking')].map(norm);if(ids.includes(norm(v)))hits.set(r._id,[r,v,k]);});});
  const isTrk=k=>/tracking/i.test(k);const trkV=[...found].filter(([v,k])=>isTrk(k)).map(([v])=>v)[0];
  if(!hits.size){out.appendChild(el('p','bb-meta','Koi order match nahi hua. Neeche se order chuno:'));}
  const plan=[];const g=el('div','bb-grid');
  const addRow=(r,why)=>{const c=el('div','bb-cd');const h=el('div','cd-h');const hl=el('div');hl.appendChild(el('b',null,r.order_id||r._id));hl.appendChild(el('small',null,r.item+' · '+(LBL[r.status]||r.status)));h.appendChild(hl);c.appendChild(h);c.appendChild(el('p','bb-meta','Match: '+why));
   const acts=[];const hasT=gv(r,'retailer_tracking');
   if(trkV&&!hasT&&['To place','Ordered'].includes(r.status))acts.push(['Store tracking '+trkV+' daalo (shipped)',{retailer_tracking:trkV,intl_tracking:trkV,retailer_ship_date:today()}]);
   if(delivered&&['Ordered','In transit to reshipper'].includes(r.status))acts.push(['Reached reshipper (delivered)',{delivered_reshipper:today()}]);
   if(delivered&&['Landed India','Shipped to KM','Out for delivery'].includes(r.status))acts.push(['Reached KicksMachine (delivered)',{delivered_km:today()}]);
   if(trkV&&r.status==='At reshipper')acts.push(['AWB '+trkV+' daalo (left reshipper)',{reship_awb:trkV,shipped_reshipper:today()}]);
   if(trkV&&r.status==='Landed India')acts.push(['Courier tracking '+trkV+' (shipped to KM)',{km_tracking:trkV,local_tracking:trkV,shipped_km:today()}]);
   if(!acts.length)c.appendChild(el('p','bb-meta','Is order pe update karne layak kuch naya nahi.'));
   acts.forEach(([t,p])=>{const l=el('label','ph-act');const cb=document.createElement('input');cb.type='checkbox';cb.checked=true;l.append(cb,document.createTextNode(' '+t));c.appendChild(l);plan.push({r,p,cb});});g.appendChild(c);};
  hits.forEach(([r,v,k])=>addRow(r,k+' '+v));
  if(!hits.size){const sel=document.createElement('select');sel.className='cd-add';[['','Order chuno…'],...KMO().filter(r=>!DONE(r.status)).map(r=>[r._id,(r.order_id||r._id)+' · '+String(r.item).slice(0,40)])].forEach(([v,t])=>{const o=el('option',null,t);o.value=v;sel.appendChild(o);});sel.onchange=()=>{const r=all.find(x=>x._id===sel.value);if(r){addRow(r,'manually chosen');ap.hidden=false;}};out.appendChild(sel);}
  out.appendChild(g);const ap=btn('Apply updates',async()=>{const todo2=plan.filter(x=>x.cb.checked);if(!todo2.length)return;for(const x of todo2){const p=Object.assign({},x.p);p.status=derive(Object.assign({},x.r,p));await save(x.r,p);}toast(todo2.length+' updates saved');draw();},'bb-b sm');ap.hidden=!plan.length;out.appendChild(ap);}

 /* ---------- To KicksMachine ---------- */
 function tokm(P){const km=KMO();const landed=km.filter(r=>r.status==='Landed India'&&!gv(r,'km_tracking'));const moving=km.filter(r=>['Landed India','Shipped to KM','Out for delivery'].includes(r.status)&&gv(r,'km_tracking'));
  const sec=(t,n)=>{const s=el('div','bb-sech');s.appendChild(el('span',null,t));s.appendChild(el('small',null,n));P.appendChild(s);};
  sec('🛬 Landed in India · ship to KM',landed.length+' orders · '+inr(sumP(landed)));
  if(landed.length){const g=el('div','bb-grid');landed.forEach(r=>{const c=el('div','bb-cd');const h=el('div','cd-h');const hl=el('div');hl.appendChild(el('b',null,r.order_id||r._id));hl.appendChild(el('small',null,r.item));h.appendChild(hl);h.appendChild(tag('Landed '+(gv(r,'landed_india')||''),'go'));c.appendChild(h);
   const tr=el('div','cd-in');const cs=document.createElement('select');['',...DOM].forEach(v=>{const o=el('option',null,v||'Courier');o.value=v;cs.appendChild(o);});const ti=document.createElement('input');ti.placeholder='Courier tracking';tr.append(cs,ti);c.appendChild(tr);
   c.appendChild(btn('Shipped to KicksMachine',async()=>{const p={km_courier:cs.value,km_tracking:ti.value.trim(),local_tracking:ti.value.trim(),shipped_km:today()};p.status=derive(Object.assign({},r,p));if(await save(r,p))draw();},'bb-b sm'));g.appendChild(c);});P.appendChild(g);}else P.appendChild(el('p','bb-meta','Kuch nahi.'));
  const gm=new Map();moving.forEach(r=>{const k=gv(r,'km_tracking');gm.set(k,(gm.get(k)||[]).concat([r]));});
  sec('🚚 On the way to KicksMachine',gm.size+' parcels · '+inr(sumP(moving)));
  if(gm.size){const g=el('div','bb-grid');gm.forEach((rs,k)=>{const r0=rs[0];const d0=days(gv(r0,'shipped_km'));const c=el('div','bb-cd'+(d0>=4?' late':''));const h=el('div','cd-h');const hl=el('div');hl.appendChild(el('b',null,k));hl.appendChild(el('small',null,[gv(r0,'km_courier'),gv(r0,'shipped_km')?'shipped '+gv(r0,'shipped_km'):''].filter(Boolean).join(' · ')));h.appendChild(hl);h.appendChild(tag(d0!=null?'Day '+d0:'—',d0>=4?'bad':'go'));c.appendChild(h);
   const kw=el('div','cd-sec');rs.forEach(r=>kw.appendChild(kmChip(r)));c.appendChild(kw);const ft=el('div','cd-f');ft.appendChild(el('b',null,inr(sumP(rs))));const fa=el('div','cd-act');fa.appendChild(btn('Copy',()=>copyT(k)));fa.appendChild(btn('✓ Reached KM',async()=>{for(const r of rs){const p={delivered_km:today()};p.status=derive(Object.assign({},r,p));await save(r,p);}draw();},'bb-b sm'));ft.appendChild(fa);c.appendChild(ft);g.appendChild(c);});P.appendChild(g);}else P.appendChild(el('p','bb-meta','Kuch nahi.'));}

 /* ---------- Waiting KM confirmation ---------- */
 function confirmT(P){const km=KMO().filter(r=>DONE(r.status)&&!confirmedOn(r)&&r.payout_status!=='Received');
  const a=km.filter(r=>!gv(r,'mrn_updated')),b=km.filter(r=>gv(r,'mrn_updated'));
  P.appendChild(el('p','bb-meta ov-note','Flow: KM pe pahuncha → hum KM portal pe MRN update karte hain → KM confirmation mail bhejta hai → uske 7 din baad payout.'));
  const sec=(t,n)=>{const s=el('div','bb-sech');s.appendChild(el('span',null,t));s.appendChild(el('small',null,n));P.appendChild(s);};
  const card=(r,step)=>{const w=step==='mrn'?days(gv(r,'delivered_km')):days(gv(r,'mrn_updated'));const late=step==='cf'&&w>=3;const c=el('div','bb-cd'+(late?' late':''));const h=el('div','cd-h');const hl=el('div');hl.appendChild(el('b',null,r.order_id||r._id));hl.appendChild(el('small',null,r.item));h.appendChild(hl);h.appendChild(el('div','cd-amt',inr(r.payout)));c.appendChild(h);
   c.appendChild(el('p','bb-meta',step==='mrn'?'Reached KM '+(gv(r,'delivered_km')||'—')+(w!=null?' · '+w+' days':''):'MRN updated '+gv(r,'mrn_updated')+(w!=null?' · waiting '+w+' days':'')));
   const fa=el('div','cd-act');
   if(step==='mrn')fa.appendChild(btn('✓ MRN updated on KM portal',async()=>{if(await save(r,{mrn_updated:today()}))draw();},'bb-b sm'));
   else{fa.appendChild(btn('✓ Confirmation received',async()=>{if(await save(r,{mrn_confirmed:today(),payout_timer:today()})){toast('7-day payout timer started');draw();}},'bb-b sm'));if(late)fa.appendChild(wa('WhatsApp KM','Hi Maanvesh, MRN for '+(r.order_id||r._id)+' ('+r.item+') was updated on '+gv(r,'mrn_updated')+'. Confirmation abhi tak nahi aaya, please check. Thanks!'));}
   c.appendChild(fa);return c;};
  sec('① MRN update baaki',a.length+' orders');if(a.length){const g=el('div','bb-grid');a.forEach(r=>g.appendChild(card(r,'mrn')));P.appendChild(g);}else P.appendChild(el('p','bb-meta','Kuch nahi.'));
  sec('② MRN done · KM confirmation ka wait',b.length+' orders · '+inr(sumP(b)));
  if(b.length){const all2=btn('✓ Confirmation received for all '+b.length,async()=>{if(!confirm(b.length+' orders: confirmation aaj aaya mark karein? (7-day timer start hoga)'))return;for(const r of b)await save(r,{mrn_confirmed:today(),payout_timer:today()});draw();});all2.style.marginBottom='10px';P.appendChild(all2);const g=el('div','bb-grid');b.sort((x,y)=>String(gv(x,'mrn_updated')).localeCompare(String(gv(y,'mrn_updated')))).forEach(r=>g.appendChild(card(r,'cf')));P.appendChild(g);}else P.appendChild(el('p','bb-meta','Kuch nahi.'));}

 /* ---------- Payouts (after confirmation, 7 days) ---------- */
 /* ---------- Money (CFO view): invested, received, profit, bank, receivable, monthly target ---------- */
 const FIN=()=>META.finance||{};
 const fxNow=()=>Number(FIN().fx)||95.5;
 const costOf=r=>{const l=Number(gv(r,'landed'));if(l>0)return l;const u=Number(gv(r,'price_usd'));if(u>0)return u*fxNow()*(1+(Number(gv(r,'tax_pct'))||0)/100)+(Number(gv(r,'reship_cost'))||0);return 0;};
 const placedOn=r=>gv(r,'retailer_date')||(r.status!=='To place'?gv(r,'order_date'):'');
 const saveFin=async patch=>{const d=Object.assign({},FIN(),patch,{edited_at:new Date().toISOString()});const r=await sb.from('lx_b2b').upsert({kind:'meta',id:'finance',data:d,updated_at:new Date().toISOString()},{onConflict:'kind,id'});if(r.error){toast('Save nahi hua: '+r.error.message);return false;}META.finance=d;toast('Saved');return true;};
 function money(P){const F=FIN();const M=S.mon||today().slice(0,7);const live=all.filter(r=>r.status!=='Cancelled');const placed=live.filter(r=>r.status!=='To place');const inM=d=>!!d&&String(d).slice(0,7)===M;const sumF=(a,f)=>a.reduce((t,r)=>t+(Number(f(r))||0),0);
  const mc=el('div','bb-chips');const ms=[];{let [y,m]=today().slice(0,7).split('-').map(Number);for(let i=0;i<6;i++){ms.push(y+'-'+String(m).padStart(2,'0'));m--;if(!m){m=12;y--;}}}
  ms.forEach(m=>{const b=el('button','bb-chip'+(m===M?' on':''),new Date(m+'-01T00:00:00').toLocaleDateString('en-IN',{month:'short',year:'2-digit'}));b.onclick=()=>{S.mon=m;draw();};mc.appendChild(b);});P.appendChild(mc);
  const inv=placed.filter(r=>inM(placedOn(r)));const invested=sumF(inv,costOf);const noCost=inv.filter(r=>!costOf(r));
  const payOn=r=>gv(r,'payout_date')||(r.client!=='KicksMachine'?gv(r,'order_date'):'');const rec=live.filter(r=>r.payout_status==='Received'&&inM(payOn(r)));const received=sumF(rec,r=>gv(r,'payout'));const recC=rec.filter(r=>costOf(r)>0);const realized=sumF(recC,r=>gv(r,'payout'))-sumF(recC,costOf);const recNoC=rec.length-recC.length;
  const recvList=placed.filter(r=>r.payout_status!=='Received');const receivable=sumF(recvList,r=>gv(r,'payout'));const rlC=recvList.filter(r=>costOf(r)>0);const expProfit=sumF(rlC,r=>gv(r,'payout'))-sumF(rlC,costOf);
  const conf=recvList.filter(r=>confirmedOn(r));const dueSoon=sumF(conf,r=>gv(r,'payout'));const overdue=conf.filter(r=>(days(confirmedOn(r))||0)>9);
  const toPlace=live.filter(r=>r.status==='To place');const committed=sumF(toPlace,r=>costOf(r)||Number(gv(r,'payout'))*0.8);
  const bank=F.bank&&F.bank.amount!=null?Number(F.bank.amount):null;const net=bank==null?null:bank+receivable-committed;
  const T=(F.targets||{})[M]||{};
  const tiles=[[inr(invested),'Is mahine lagaya (store + reship)',inv.length+' orders'],[inr(received),'Is mahine payout mila',rec.length+' orders'],[inr(realized),'Realized profit',recC.length?Math.round(realized/sumF(recC,r=>gv(r,'payout'))*100)+'% margin'+(recNoC?' · '+recNoC+' bina cost ke chhode':''):'—'],
   [bank==null?'—':inr(bank),'Bank me abhi',F.bank&&F.bank.at?('as of '+F.bank.at+(F.bank.source?' · '+F.bank.source:'')):'neeche daalo'],[inr(receivable),'Payout milna baaki (sab)',recvList.length+' orders · exp. profit '+inr(expProfit)],
   [inr(dueSoon),'Confirmed — 7 din me aana chahiye',conf.length+' orders'+(overdue.length?' · '+overdue.length+' overdue':'')],[inr(committed),'Abhi lagana hai (To place)',toPlace.length+' orders'],[net==null?'—':inr(net),'Net position','bank + receivable − to place']];
  const sm=el('div','bb-sum');tiles.forEach(([v,l,s])=>{const d=el('div');d.appendChild(el('b',null,v));d.appendChild(el('span',null,l));d.appendChild(el('small',null,s));sm.appendChild(d);});P.appendChild(sm);
  if(noCost.length){P.appendChild(el('p','bb-meta warn','⚠ '+noCost.length+' order(s) ka cost missing ('+noCost.map(r=>r.order_id||r._id).slice(0,8).join(', ')+') — "lagaya" total adhoora hai. Order me $ price ya landed bharo.'));}
  const tc=el('div','bb-card');tc.appendChild(el('h2',null,'🎯 Target · '+M));const bar=(lab,v,t)=>{const r=el('div','mn-row');r.appendChild(el('span',null,lab));const b=el('div','mn-bar');const f=el('i');const pct=t?Math.min(100,Math.round(v/t*100)):0;f.style.width=pct+'%';if(t&&v>=t)f.className='ok';b.appendChild(f);r.appendChild(b);r.appendChild(el('small',null,t?inr(v)+' / '+inr(t)+' · '+pct+'%':inr(v)+' · target set karo'));tc.appendChild(r);};
  bar('Invest',invested,T.invest);bar('Payout received',received,T.payout);bar('Profit',realized,T.profit);
  const dl=new Date(M+'-01T00:00:00');dl.setMonth(dl.getMonth()+1);const left=Math.max(0,Math.ceil((dl-Date.now())/864e5));if(M===today().slice(0,7)&&T.profit)tc.appendChild(el('p','bb-meta',left+' din baaki · profit target ke liye roz ~'+inr(Math.max(0,(T.profit-realized))/Math.max(1,left))+' chahiye'));P.appendChild(tc);
  const ec=el('div','bb-card');ec.appendChild(el('h2',null,'✏️ Update'));const f=el('div','mn-form');const inp=(lab,v,ph)=>{const l=el('label',null,lab);const i=document.createElement('input');i.type='number';i.step='any';i.value=v==null?'':v;i.placeholder=ph||'';l.appendChild(i);f.appendChild(l);return i;};
  const iB=inp('Bank balance ₹',bank,'abhi kitna hai');const iFx=inp('USD → INR (card rate)',F.fx||'', '95.5');const iTi=inp('Target invest ₹ ('+M+')',T.invest);const iTp=inp('Target payout ₹',T.payout);const iTr=inp('Target profit ₹',T.profit);ec.appendChild(f);
  const sv=btn('Save',async()=>{const p={};if(iB.value!==''&&Number(iB.value)!==bank)p.bank={amount:Number(iB.value),at:today(),source:'Jeet'};if(iFx.value!=='')p.fx=Number(iFx.value);const tg=Object.assign({},F.targets||{});tg[M]={invest:Number(iTi.value)||0,payout:Number(iTp.value)||0,profit:Number(iTr.value)||0};p.targets=tg;if(await saveFin(p))draw();},'bb-b sm');ec.appendChild(sv);
  ec.appendChild(el('p','bb-meta','CFO agent roz bank alert mails se balance, FX aur month summary khud update karta hai. Yahan jo daaloge wo turant dikhega.'));P.appendChild(ec);
  if(F.cfo){const cc=el('div','bb-card');cc.appendChild(el('h2',null,'📊 CFO notes'+(F.cfo.at?' · '+String(F.cfo.at).slice(0,16).replace('T',' '):'')));(F.cfo.points||[]).forEach(x=>cc.appendChild(el('div','bb-line',x)));P.appendChild(cc);}
  const lc=el('div','bb-card');lc.appendChild(el('h2',null,'Is mahine ke orders ('+inv.length+')'));inv.sort((a,b)=>String(placedOn(b)).localeCompare(placedOn(a))).forEach(r=>{const c=costOf(r),p=Number(gv(r,'payout'))||0;const ln=el('div','mn-li');ln.appendChild(el('b',null,(r.order_id||r._id)+' '));ln.appendChild(document.createTextNode((gv(r,'item')||'').slice(0,40)+' · cost '+(c?inr(c):'—')+' · payout '+inr(p)+(c?' · '+Math.round((p-c)/p*100)+'%':'')+' · '+r.status+(r.payout_status==='Received'?' ✓':'')));lc.appendChild(ln);});P.appendChild(lc);}
 function payouts(P){const km=KMO().filter(r=>r.status!=='To place');const rec=r=>r.payout_status==='Received';const T=confirmedOn;const left=r=>7-(days(T(r))||0);
  const run=km.filter(r=>!rec(r)&&T(r)&&left(r)>=0),chase=km.filter(r=>!rec(r)&&T(r)&&left(r)<0),wait=km.filter(r=>!rec(r)&&!T(r)),got=km.filter(rec);
  if(!['run','chase','wait','got'].includes(S.pf))S.pf=chase.length?'chase':'run';
  const sm=el('div','bb-sum tabs');[['run','⏱ 7-day timer',run],['chase','🔔 Chase payout',chase],['wait','⏳ Not confirmed yet',wait],['got','✓ Received',got]].forEach(([k,t,a])=>{const d=el('div',S.pf===k?'on':'');d.appendChild(el('b',null,inr(sumP(a))));d.appendChild(el('small',null,t+' · '+a.length));if(k==='chase'&&a.length)d.classList.add('bad');d.onclick=()=>{S.pf=k;draw();};sm.appendChild(d);});P.appendChild(sm);
  const qv=search(P,'pq','Search KM ID, item…');const list=({run,chase,wait,got})[S.pf].filter(r=>!qv||vtxt(r).includes(qv));
  const bar=el('div','bb-act2');if(S.pf==='chase'&&list.length)bar.appendChild(wa('WhatsApp KM · '+list.length+' overdue','Hi Maanvesh, payout pending for: '+list.map(r=>(r.order_id||r._id)+' ('+inr(r.payout)+', confirmed '+T(r)+')').join(', ')+'. Total '+inr(sumP(list))+'. Please check. Thanks!'));
  if(list.length)bar.appendChild(btn('Copy statement',()=>copyT('Luxella × KicksMachine payouts ('+today()+')\n'+list.map(r=>(r.order_id||r._id)+' · '+r.item+' · '+inr(r.payout)+' · '+(rec(r)?'PAID '+(r.payout_date||''):T(r)?'confirmed '+T(r):'not confirmed')).join('\n')+'\nTotal '+inr(sumP(list)))));
  if(bar.children.length)P.appendChild(bar);
  if(S.pf==='wait')P.appendChild(el('p','bb-meta ov-note','Ye orders abhi KM confirmation tak nahi pahunche. Confirmation aate hi 7-day timer khud chalu hota hai (Confirmation tab).'));
  if(!list.length){P.appendChild(el('p','bb-meta','Kuch nahi.'));return;}
  const g=el('div','bb-grid');list.sort((a,b)=>S.pf==='got'?String(b.payout_date).localeCompare(String(a.payout_date)):S.pf==='wait'?ST.indexOf(b.status)-ST.indexOf(a.status):left(a)-left(b)).forEach(r=>{const L=T(r)?left(r):null;const c=el('div','bb-cd'+(S.pf==='chase'?' late':''));
   const h=el('div','cd-h');const hl=el('div');hl.appendChild(el('b',null,r.order_id||r._id));hl.appendChild(el('small',null,r.item));h.appendChild(hl);h.appendChild(el('div','cd-amt',inr(r.payout)));c.appendChild(h);
   if(L!=null&&!rec(r)){const pr=el('div','cd-prog'+(L<0?' bad':L<=1?' warn':''));const pi=el('i');pi.style.width=Math.min(100,(days(T(r))/7)*100)+'%';pr.appendChild(pi);c.appendChild(pr);c.appendChild(el('div','cd-timer',L<0?'Overdue by '+(-L)+' day'+(-L>1?'s':''):L===0?'Due today':L+' day'+(L>1?'s':'')+' left'));c.appendChild(el('p','bb-meta','Confirmation '+T(r)+(gv(r,'payout_chased')?' · chased '+gv(r,'payout_chased'):'')));}
   else if(S.pf==='wait')c.appendChild(tag(LBL[r.status]||r.status,DONE(r.status)?'ok':'go'));
   else c.appendChild(el('p','bb-meta','Paid on '+(r.payout_date||'—')));
   const fa=el('div','cd-act');
   if(!rec(r)){if(S.pf==='chase'){fa.appendChild(btn('Chased today',async()=>{if(await save(r,{payout_chased:today()}))draw();}));}
    if(T(r))fa.appendChild(btn('✓ Payout received',async()=>{if(await save(r,{payout_status:'Received',payout_date:today()}))draw();},'bb-b sm'));
    else fa.appendChild(btn('Mark received',async()=>{if(await save(r,{payout_status:'Received',payout_date:today()}))draw();}));}
   else fa.appendChild(btn('Undo',async()=>{if(await save(r,{payout_status:'Pending',payout_date:''}))draw();}));
   c.appendChild(fa);g.appendChild(c);});P.appendChild(g);}

 /* ---------- Agents ---------- */
 const AG=[['mail','📬','Mail agent','Har 2 ghante · Gmail → portal'],['pricing','💰','Bid pricing agent','Har 2 ghante · naye bids ka store price + margin'],['tracking','🚚','Tracking agent','Har 4 ghante · saare tracking check'],['ops','📋','Ops agent','8:41am + 7:41pm · aaj ke kaam + drafts'],['payout','💸','Payout agent','Roz 10:52 · confirmation + 7 din, chase'],['auditor','🛡️','Auditor agent','Har 3 ghante · kuch miss to nahi'],['reconciler','🔍','KM Reconciler','9:23am + 9:23pm · KM All Orders vs portal (cancel, payout, US IDs)'],['brain','🧠','Brain (Chief of Staff)','Har ghante · chat ke photo / voice / notes → orders'],['cfo','📊','CFO agent','9:37am + 9:37pm · paisa, bank, target (Money tab)'],['qa','🧪','QA / health','Har 6 ghante · site, functions, data health']];
 const agoT=t=>{if(!t)return 'abhi tak nahi chala';const m=Math.round((Date.now()-new Date(t))/6e4);return m<60?m+' min pehle':m<1440?Math.round(m/60)+' ghante pehle':Math.round(m/1440)+' din pehle';};
 const pcLine=r=>{const p=r.price_check;if(!p)return null;const w=el('div','pc');const v=String(p.verdict||'').toUpperCase();w.appendChild(tag(v||'CHECKED',v==='GO'?'ok':v==='NO'?'bad':'go'));w.appendChild(el('span',null,[p.store,p.price_usd!=null?(p.currency==='GBP'?'£':p.currency==='CAD'?'C$':'$')+p.price_usd:'',p.landed_inr?'landed '+inr(p.landed_inr):'',p.margin_pct!=null?Math.round(p.margin_pct)+'% margin':''].filter(Boolean).join(' · ')));if(p.url){const a=el('a',null,'Open');a.href=p.url;a.target='_blank';a.rel='noopener';w.appendChild(a);}if(p.note)w.appendChild(el('small',null,p.note));return w;};
 const mdHtml=src=>{const esc=t=>t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');const inl=t=>esc(t).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>');const L=src.split('\n');let h='',i=0;
  while(i<L.length){const l=L[i];if(/^\|/.test(l)){const rows=[];while(i<L.length&&/^\|/.test(L[i])){if(!/^\|[\s|:-]+\|$/.test(L[i]))rows.push(L[i].split('|').slice(1,-1).map(c=>inl(c.trim())));i++;}h+='<table>'+rows.map((r,j)=>'<tr>'+r.map(c=>j?'<td>'+c+'</td>':'<th>'+c+'</th>').join('')+'</tr>').join('')+'</table>';continue;}
   if(/^#{1,3} /.test(l)){const n=l.match(/^#+/)[0].length;h+='<h'+(n+2)+'>'+inl(l.replace(/^#+ /,''))+'</h'+(n+2)+'>';}else if(/^\s*[-*] /.test(l)){h+='<ul>';while(i<L.length&&/^\s*[-*] /.test(L[i])){h+='<li>'+inl(L[i].replace(/^\s*[-*] /,''))+'</li>';i++;}h+='</ul>';continue;}else if(/^\d+\. /.test(l)){h+='<ol>';while(i<L.length&&/^\d+\. /.test(L[i])){h+='<li>'+inl(L[i].replace(/^\d+\. /,''))+'</li>';i++;}h+='</ol>';continue;}else if(/^> /.test(l))h+='<blockquote>'+inl(l.slice(2))+'</blockquote>';else if(l.trim())h+='<p>'+inl(l)+'</p>';i++;}
  return h;};
 function playbooks(P){const s=el('div','bb-sech');s.appendChild(el('span',null,'📚 HQ rulebook & playbooks'));s.appendChild(el('small',null,DOCS.length+' pages · agents har run pe padhte hain'));P.appendChild(s);
  const w=el('div','ck-list');DOCS.forEach(d=>{const x=document.createElement('details');x.className='ck';const sm=document.createElement('summary');const l=el('div','ck-l');l.appendChild(el('b',null,d.title||d._id));l.appendChild(el('span',null,d._id));sm.appendChild(l);x.appendChild(sm);x.addEventListener('toggle',()=>{if(x.open&&!x.querySelector('.md')){const b=el('div','md ck-body');b.innerHTML=mdHtml(d.md||'');x.appendChild(b);}});w.appendChild(x);});P.appendChild(w);}
 function kmCard(P){let k=META.kmsync||{};if(k.error==='KM not connected')k={};const c=el('div','bb-card km-card');const h=el('div','cd-h');const hl=el('div');hl.appendChild(el('b',null,'🔗 KicksMachine Nexus — read-only link'));hl.appendChild(el('small',null,'Har ghante KM portal se orders, SLA, status, bids, notifications padhta hai. Kuch edit / accept / reject nahi kar sakta.'));h.appendChild(hl);
  h.appendChild(tag(k.at?(k.ok?'connected':'error'):'not connected',k.at?(k.ok?'ok':'bad'):''));c.appendChild(h);
  if(k.at)c.appendChild(el('p','bb-meta',(k.ok?'Last sync '+agoT(k.at)+' · KM orders '+(k.km_orders??'—')+' · updated '+(k.updated??0)+' · new '+(k.created??0)+(k.cancelled?' · cancelled '+k.cancelled:''):'Error: '+(k.error||'')+' ('+agoT(k.at)+')')));
  const f=el('div','cd-in');const em=document.createElement('input');em.type='email';em.value='jeetnatb@gmail.com';em.placeholder='KM login email';const pw=document.createElement('input');pw.type='password';pw.placeholder='KM password';pw.autocomplete='off';
  const go=btn(k.at?'Update login':'Connect',async()=>{if(!pw.value){toast('Password daalo');return;}go.disabled=true;go.textContent='Checking…';const r=await sb.functions.invoke('km-sync',{body:{action:'setcred',email:em.value.trim(),password:pw.value}});pw.value='';go.disabled=false;go.textContent='Connect';const d=r.data||{};if(r.error||!d.ok){toast('Login nahi hua: '+((d&&d.error)||(r.error&&r.error.message)||''));return;}toast('KM connected ✓ '+(d.sync&&d.sync.km_orders!=null?d.sync.km_orders+' orders padhe':''));setTimeout(()=>location.reload(),900);},'bb-b sm');
  f.append(em,pw,go);c.appendChild(f);
  if(k.at){const sn=btn('Sync now',async()=>{sn.disabled=true;sn.textContent='Syncing…';const r=await sb.functions.invoke('km-sync',{body:{action:'sync'}});sn.disabled=false;const d=r.data||{};toast(d.ok?'Synced: '+d.km_orders+' KM orders':'Sync error: '+(d.error||''));setTimeout(()=>location.reload(),900);});sn.style.marginTop='8px';c.appendChild(sn);}
  const nt=(META.km_notifications||{}).list||[];if(nt.length){const d=document.createElement('details');d.className='ph-d';const s=document.createElement('summary');s.textContent='🔔 KM notifications ('+nt.length+')';d.appendChild(s);nt.slice(0,25).forEach(n=>{const t=n.title||n.message||n.text||n.body||JSON.stringify(n).slice(0,140);const l=el('div','bb-line');l.appendChild(el('span',null,String(t).slice(0,160)));l.appendChild(el('span','m',String(n.createdAt||n.created_at||'').slice(0,16).replace('T',' ')));d.appendChild(l);});c.appendChild(d);}
  P.appendChild(c);}
 function agentsTab(P){kmCard(P);aiCard(P);const ov=el('div','ag-grid');AG.forEach(([id,em,nm,sch])=>{const a=AGENTS[id]||{};const c=el('div','bb-cd ag'+(a.status==='error'?' late':''));const h=el('div','cd-h');const hl=el('div');hl.appendChild(el('b',null,em+' '+nm));hl.appendChild(el('small',null,sch));h.appendChild(hl);h.appendChild(tag(a.last_run?(a.status==='error'?'error':'active'):'waiting',a.last_run?(a.status==='error'?'bad':'ok'):''));c.appendChild(h);
   c.appendChild(el('p',null,a.summary||'Pehle run ka wait.'));c.appendChild(el('small','bb-meta','Last run: '+agoT(a.last_run)));
   const n=(a.items||[]).length,d=(a.drafts||[]).length;if(n||d)c.appendChild(el('small','bb-meta',(n?n+' findings':'')+(n&&d?' · ':'')+(d?d+' drafts ready':'')));ov.appendChild(c);});P.appendChild(ov);
  const items=AG.flatMap(([id,em,nm])=>((AGENTS[id]||{}).items||[]).map(x=>Object.assign({ag:em+' '+nm},x)));
  const sec=(t,n)=>{const s=el('div','bb-sech');s.appendChild(el('span',null,t));s.appendChild(el('small',null,n));P.appendChild(s);};
  sec('⚡ Agents ne kya pakda',items.length+' items');
  if(!items.length)P.appendChild(el('p','bb-meta','Kuch nahi.'));
  const lv={action:0,warn:1,info:2};items.sort((a,b)=>(lv[a.level]??3)-(lv[b.level]??3)).forEach(x=>{const l=el('div','ag-it '+(x.level||'info'));l.appendChild(el('i',null,x.level==='action'?'!':x.level==='warn'?'⚠':'·'));const t=el('div');t.appendChild(el('span',null,x.text));t.appendChild(el('small',null,x.ag+(x.order_id?' · '+x.order_id:'')));l.appendChild(t);
   if(x.order_id){const o=btn('Open',()=>{S.cq=String(x.order_id).toLowerCase();S.cf='';S.ckOpen='';go('checklist');});l.appendChild(o);}P.appendChild(l);});
  const drafts=AG.flatMap(([id,em,nm])=>((AGENTS[id]||{}).drafts||[]).map(x=>Object.assign({ag:em+' '+nm},x)));
  sec('✉️ Messages ready (tum bhejo)',drafts.length+' drafts');
  if(drafts.length){const g=el('div','bb-grid');drafts.forEach(x=>{const c=el('div','bb-cd');const h=el('div','cd-h');const hl=el('div');hl.appendChild(el('b',null,x.label||('To '+(x.to||''))));hl.appendChild(el('small',null,x.ag));h.appendChild(hl);c.appendChild(h);const pre=el('pre','ag-pre',x.text);c.appendChild(pre);const fa=el('div','cd-act');fa.appendChild(wa('WhatsApp',x.text));fa.appendChild(btn('Copy',()=>copyT(x.text)));c.appendChild(fa);g.appendChild(c);});P.appendChild(g);}else P.appendChild(el('p','bb-meta','Abhi koi draft nahi.'));
  const priced=all.filter(r=>r.price_check&&['To place'].includes(r.status));if(priced.length){sec('💰 Bid price checks',priced.length+' orders');const g=el('div','bb-grid');priced.forEach(r=>{const c=el('div','bb-cd');const h=el('div','cd-h');const hl=el('div');hl.appendChild(el('b',null,r.order_id||r._id));hl.appendChild(el('small',null,r.item));h.appendChild(hl);h.appendChild(el('div','cd-amt',inr(r.payout)));c.appendChild(h);c.appendChild(pcLine(r));g.appendChild(c);});P.appendChild(g);}playbooks(P);}
 /* ---------- AI brain (lx-brain edge fn): photo / voice / text → proposed updates ---------- */
 const AIST={connected:false,provider:null,checked:false};
 const brain=async(body)=>{const r=await sb.functions.invoke('lx-brain',{body});if(r.error){let m=r.error.message;try{const j=await r.error.context.json();m=j.error||m;}catch(e){}return {ok:false,error:m};}return r.data||{ok:false,error:'no reply'};};
 const aiStatus=async()=>{const s=await brain({action:'status'});AIST.checked=true;AIST.connected=!!s.connected;AIST.provider=s.provider;return AIST;};
 const fileB64=f=>new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(String(fr.result).split(',')[1]);fr.onerror=rej;fr.readAsDataURL(f);});
 const imgB64=f=>new Promise((res,rej)=>{const im=new Image();im.onload=()=>{const M=1800;let w=im.naturalWidth,h=im.naturalHeight;const k=Math.min(1,M/Math.max(w,h));w=Math.round(w*k);h=Math.round(h*k);const cv=document.createElement('canvas');cv.width=w;cv.height=h;cv.getContext('2d').drawImage(im,0,0,w,h);URL.revokeObjectURL(im.src);res(cv.toDataURL('image/jpeg',0.82).split(',')[1]);};im.onerror=rej;im.src=URL.createObjectURL(f);});
 const FLAB={retailer_order_id:'Store order',retailer_date:'Store order date',store:'Store',price_usd:'Paid $',total_usd:'Store total $',retailer_carrier:'Carrier',retailer_tracking:'Store tracking',retailer_ship_date:'Store shipped',reshipper:'Reshipper',delivered_reshipper:'Reached reshipper',actual_weight:'Weight kg',reship_cost:'Reship ₹',reship_awb:'AWB → India',shipped_reshipper:'Left reshipper',form_filled:'Form',form_date:'Form date',landed_india:'Landed India',km_tracking:'Courier → KM',shipped_km:'Sent to KM',delivered_km:'KM received',mrn_updated:'MRN updated',mrn_confirmed:'KM confirmation',payout:'Payout ₹',payout_status:'Payout status',payout_date:'Payout date',status:'Status',notes:'Note',intl_tracking:'Intl tracking',local_tracking:'Local tracking',payout_timer:'7-day timer',mrn_date:'MRN date'};
 const expandP=(r,p)=>{p=Object.assign({},p);if(p.retailer_tracking&&!p.intl_tracking)p.intl_tracking=p.retailer_tracking;if(p.km_tracking&&!p.local_tracking)p.local_tracking=p.km_tracking;if(p.mrn_confirmed&&!gv(r,'payout_timer'))p.payout_timer=p.mrn_confirmed;if(p.notes)p.notes=[gv(r,'notes'),p.notes].filter(Boolean).join(' | ');['price_usd','total_usd','actual_weight','reship_cost','payout'].forEach(k=>{if(p[k]!=null){const n=Number(String(p[k]).replace(/[^0-9.]/g,''));if(isNaN(n))delete p[k];else p[k]=n;}});return p;};
 /* ---------- Smart chat box: paste / photo / voice → it figures out where it goes ---------- */
 const ACT=[
  [/cancel/i,()=>({status:'Cancelled'}),'Cancelled'],
  [/\bmrn\b(?!.*confirm)/i,()=>({mrn_updated:today()}),'MRN updated'],
  [/confirm/i,()=>({mrn_confirmed:today(),payout_timer:today()}),'KM confirmation received (7-day timer)'],
  [/payout|paid|payment (aa|recei)|paisa aa/i,()=>({payout_status:'Received',payout_date:today()}),'Payout received'],
  [/\bform\b/i,()=>({form_filled:'Yes',form_date:today()}),'Receiver form filled'],
  [/landed|india (pahunch|aa gaya|reach)|reached india/i,()=>({landed_india:today()}),'Landed India'],
  [/km (pe|ko) (deliver|pahunch)|reached km|delivered to km/i,()=>({delivered_km:today()}),'Reached KicksMachine'],
  [/(reshipper|hub|warehouse|ishaan|yash|prabhmeet).*(deliver|pahunch|aa gaya|received)|(deliver|pahunch|received).*(reshipper|hub|warehouse|ishaan|yash|prabhmeet)/i,()=>({delivered_reshipper:today()}),'Reached reshipper'],
  [/(left|ship(ped)?|dispatch(ed)?|nikal).*(india|hub se|reshipper se)|awb/i,()=>({shipped_reshipper:today()}),'Left reshipper → India'],
  [/km portal|portal update/i,()=>({km_portal_updated:today()}),'KM portal updated']];
 const RSN=[['ishaan','Ishaan-USA'],['yash','Yash'],['prabhmeet','Prabhmeet'],['dev gandhi','Dev Gandhi'],['tanish','Tanish']];
 function smartParse(txt){const lines=txt.split(/\n+/).map(x=>x.trim()).filter(Boolean);const norm=x=>String(x||'').toUpperCase().replace(/[^A-Z0-9]/g,'');const out=new Map();let lastIds=[];
  const find=tok=>all.filter(r=>[r.order_id,r._id,gv(r,'retailer_order_id'),String(gv(r,'retailer_tracking')).split(' ')[0],gv(r,'reship_awb'),gv(r,'km_tracking')].map(norm).includes(norm(tok)));
  lines.forEach(line=>{const U=line.toUpperCase();const ids=[...new Set((U.match(/\bUS\d{6}(?:-[A-Z])?\b/g)||[]))];const codes=(U.match(/\b(?:1Z[0-9A-Z]{16}|TBA\d{12}|(?:WUP|WCP|ZUP|Z0)\d{6,10}|\d{12,22})\b/g)||[]);
   let rows=ids.flatMap(i=>all.filter(r=>(r.order_id||r._id)===i));codes.forEach(c=>find(c).forEach(r=>{if(!rows.includes(r))rows.push(r);}));
   if(!rows.length&&!ids.length&&lastIds.length)rows=lastIds;if(rows.length)lastIds=rows;
   rows.forEach(r=>{const e=out.get(r._id)||{r,p:{},why:[]};
    ACT.forEach(([re,fn,lab])=>{if(re.test(line)){Object.assign(e.p,fn());if(!e.why.includes(lab))e.why.push(lab);}});
    const trk=codes.find(c=>/^(1Z|TBA)|^\d{12,22}$/.test(c)&&!find(c).length);
    if(trk){if(/awb|india/i.test(line)||r.status==='At reshipper'){e.p.reship_awb=trk;e.p.shipped_reshipper=e.p.shipped_reshipper||today();e.why.push('AWB '+trk);}else if(['Landed India'].includes(r.status)||/courier|tirupati|delhivery|bluedart|dtdc/i.test(line)){e.p.km_tracking=trk;e.p.shipped_km=today();e.why.push('KM courier '+trk);}else{e.p.retailer_tracking=trk;e.p.retailer_ship_date=gv(r,'retailer_ship_date')||today();e.why.push('Store tracking '+trk);}}
    const so=codes.find(c=>/^(WUP|WCP|ZUP|Z0)/.test(c)&&!find(c).length);if(so){e.p.retailer_order_id=so;e.p.retailer_date=gv(r,'retailer_date')||today();e.why.push('Store order '+so);}
    const kg=line.match(/(\d+(?:\.\d+)?)\s*kg/i);if(kg){e.p.actual_weight=Number(kg[1]);e.why.push(kg[1]+' kg');}
    const usd=line.match(/(?:\$|usd\s*)([\d,]+(?:\.\d{1,2})?)|([\d,]+(?:\.\d{1,2})?)\s*(?:\$|usd|dollar)/i);if(usd){const v=(usd[1]||usd[2]).replace(/,/g,'');e.p.price_usd=Number(v);e.why.push('Paid $'+v);}
    const rs=RSN.find(([k])=>line.toLowerCase().includes(k));if(rs&&!gv(r,'reshipper')){e.p.reshipper=rs[1];e.why.push('Reshipper '+rs[1]);}
    const amt=line.match(/(?:₹|rs\.?|inr)\s*([\d,]+)/i);if(amt&&/payout|bid|price/i.test(line)&&!e.p.payout_status){e.p.payout=Number(amt[1].replace(/,/g,''));e.why.push('Payout ₹'+amt[1]);}
    out.set(r._id,e);});});
  return [...out.values()].filter(e=>Object.keys(e.p).length);}
 function chatBox(){if(document.querySelector('.lx-chat-fab'))return;const fab=el('button','lx-chat-fab','💬');fab.title='Photo / voice / kuch bhi paste karo';document.body.appendChild(fab);
  const pane=el('div','lx-chat');pane.hidden=true;document.body.appendChild(pane);const open=()=>{pane.hidden=false;};fab.onclick=()=>{pane.hidden=!pane.hidden;if(!pane.hidden)ta.focus();};
  const hd=el('div','lx-ch-h');const ht=el('div');ht.appendChild(el('b',null,'Luxella assistant'));const aiTag=el('small','lx-ai-tag','…');ht.appendChild(aiTag);hd.appendChild(ht);const x=el('button',null,'×');x.onclick=()=>pane.hidden=true;hd.appendChild(x);pane.appendChild(hd);
  const log=el('div','lx-ch-log');pane.appendChild(log);
  const bot=(node)=>{const m=el('div','lx-msg bot');if(typeof node==='string')m.textContent=node;else m.appendChild(node);log.appendChild(m);log.scrollTop=log.scrollHeight;return m;};
  const me=t=>{const m=el('div','lx-msg me',t.length>400?t.slice(0,400)+'…':t);log.appendChild(m);log.scrollTop=log.scrollHeight;return m;};
  bot('Photo 📷, voice 🎤 ya kuch bhi paste karo — store order mail, shipping screenshot, courier label, WhatsApp chat. Order ID, store order no, tracking, $ amount, weight sab nikaal ke batata hoon kis order me kya jaayega — tum Apply dabao. Photo yahan paste / drop bhi kar sakte ho.');
  const refreshTag=()=>{aiTag.textContent=AIST.connected?(' · AI on ('+AIST.provider+')'):' · instant + 🧠 Brain agent (har ghante)';aiTag.className='lx-ai-tag '+(AIST.connected?'on':'off');};
  aiStatus().then(refreshTag).catch(()=>{aiTag.textContent=' · basic mode';});
  const ft=el('div','lx-ch-f');const ta=document.createElement('textarea');ta.rows=3;ta.placeholder='Paste / type… (photo bhi paste ho jaayegi)';const fi=document.createElement('input');fi.type='file';fi.accept='image/*';fi.multiple=true;fi.hidden=true;
  const att=el('button','lx-att','📷');att.title='Photo / screenshot';att.onclick=()=>fi.click();const mic=el('button','lx-att','🎤');mic.title='Bol ke batao';const send=el('button','bb-b sm','Send');
  const tools=el('div','lx-ch-tools');tools.append(att,mic);ft.append(tools,ta,send,fi);pane.appendChild(ft);
  const saveNote=async(text,status,result,image)=>{const id='n-'+Date.now().toString(36);const data={text,created_at:new Date().toISOString(),status,result:result||'',by:'portal'};if(image)data.image_b64=image;await sb.from('lx_b2b').upsert({kind:'note',id,data,updated_at:new Date().toISOString()},{onConflict:'kind,id'});};
  /* proposal UI: list of {r, p, why, conf} */
  const propose=(items,src,image)=>{const w=el('div');w.appendChild(el('div',null,items.length+' order(s) me update — check karke Apply dabao:'));const plan=[];
   items.forEach(e=>{const p=expandP(e.r,e.p);const c=el('div','lx-plan');const cb=document.createElement('input');cb.type='checkbox';cb.checked=(e.conf==null||e.conf>=0.6);c.appendChild(cb);const t=el('div');const hh=el('div');hh.appendChild(el('b',null,(e.r.order_id||e.r._id)+' '));hh.appendChild(el('span','bb-meta',(gv(e.r,'item')||'').slice(0,38)+(gv(e.r,'size')?' · '+gv(e.r,'size'):'')+(e.conf!=null?' · '+Math.round(e.conf*100)+'%':'')));t.appendChild(hh);
    Object.entries(p).forEach(([k,v])=>{if(['intl_tracking','local_tracking'].includes(k))return;const old=gv(e.r,k);const ln=el('div','lx-diff');ln.appendChild(el('span','k',(FLAB[k]||k)+': '));if(old&&String(old)!==String(v))ln.appendChild(el('s',null,String(old).slice(0,40)+' '));ln.appendChild(el('span','v',String(v).slice(0,80)));t.appendChild(ln);});
    if(e.why&&e.why.length)t.appendChild(el('div','bb-meta',Array.isArray(e.why)?e.why.join(' · '):e.why));c.appendChild(t);w.appendChild(c);plan.push({e,p,cb});});
   const row=el('div','cd-act');const ap=btn('Apply',async()=>{ap.disabled=true;let n=0;const done=[];for(const {e,p,cb} of plan){if(!cb.checked)continue;const q=Object.assign({},p);if(q.status!=='Cancelled')q.status=derive(Object.assign({},e.r,q));if(await save(e.r,q)){n++;done.push((e.r.order_id||e.r._id)+' '+Object.keys(p).join('/'));}}await saveNote(src,'done','Portal ne apply kiya: '+done.join('; '));bot('✓ '+n+' order(s) update ho gaye.');draw();},'bb-b sm');
   const ag=btn('Agents ko bhejo',async()=>{await saveNote(src,'new','',image);bot('Agents ko bhej diya ✓');});row.append(ap,ag);w.appendChild(row);bot(w);};
  const showAI=(res,src,image)=>{const w=el('div');if(res.transcript){const q=el('div','bb-meta','🎤 "'+res.transcript+'"');w.appendChild(q);}if(res.summary)w.appendChild(el('div',null,res.summary));
   const ex=res.extracted||{};const chips=el('div','lx-chips');[['order_ids','#'],['store_orders','🧾'],['tracking','🚚'],['usd_amounts','$'],['inr_amounts','₹'],['dates','📅'],['products','👟']].forEach(([k,ic])=>(ex[k]||[]).slice(0,8).forEach(v=>chips.appendChild(el('span','lx-chip',ic+' '+v))));if(chips.childNodes.length)w.appendChild(chips);bot(w);
   const items=(res.updates||[]).map(u=>({r:all.find(r=>(r.order_id||r._id)===u.order_id||r._id===u.order_id),p:u.fields,why:u.why,conf:u.confidence})).filter(e=>e.r);
   if(items.length)propose(items,src,image);
   if(res.unmatched){const u=el('div');u.appendChild(el('div','bb-meta','Ye kisi order se match nahi hua: '+res.unmatched));const b=btn('Agents ko bhejo',async()=>{await saveNote(src+'\n\n[AI] '+res.unmatched,'new','',image);b.disabled=true;bot('Agents ko bhej diya ✓');},'bb-b sm ghost');u.appendChild(b);bot(u);}
   if(!items.length&&!res.unmatched)bot('Isme koi update nahi mila.');};
  const ocr=async f=>{if(!window.Tesseract)await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';s.onload=res;s.onerror=rej;document.head.appendChild(s);});return (await Tesseract.recognize(f,'eng')).data.text;};
  const handle=async(text,file)=>{let image=null;if(file){try{image=await imgB64(file);}catch(e){}}
   if(AIST.connected){const wait=bot(file?'Photo padh raha hoon (AI)…':'Samajh raha hoon…');const res=await brain({action:'analyze',text,image:image?{b64:image,mime:'image/jpeg'}:undefined});wait.remove();if(res.ok){showAI(res,text||'[photo]',image);return;}bot('AI error: '+res.error+' — basic mode se try kar raha hoon.');}
   let t=text||'';if(file){const wait=bot('Photo padh raha hoon…');try{t+='\n'+await ocr(file);}catch(e){}wait.remove();}
   const res=smartParse(t);
   if(res.length){propose(res.map(e=>({r:e.r,p:e.p,why:e.why})),text||'[photo]',image);if(file){await saveNote((text||'[photo]')+'\n[portal ne turant ye pakda: '+res.map(e=>(e.r.order_id||e.r._id)+' '+e.why.join('/')).join('; ')+']','new','',image);bot('🧠 Photo Brain agent ko bhi bhej di — wo poori photo padh ke baaki details ($, date, product) bhar dega (har ghante).');}return;}
   await saveNote(text||'[photo]','new','',image);bot((file?'Photo':'Message')+' seedha kisi order se match nahi hua — agents ko bhej diya ✓ (Mail agent 2 ghante me padh ke sahi jagah daalega).');};
  const doFiles=async fs=>{open();for(const f of fs){if(!/^image\//.test(f.type))continue;const m=me('📷 '+(f.name||'photo'));try{const u=URL.createObjectURL(f);const im=document.createElement('img');im.src=u;im.className='lx-thumb';m.appendChild(im);}catch(e){}await handle(ta.value.trim(),f);}ta.value='';};
  window.__lxChat={files:doFiles,open};
  /* Brain agent (Claude, runs on schedule) results for notes Jeet sent earlier */
  let brainShown=new Set();const loadBrain=async()=>{const r=await sb.from('lx_b2b').select('id,data,updated_at').eq('kind','note').order('updated_at',{ascending:false}).limit(15);if(r.error||!r.data)return;
   const fresh=r.data.filter(n=>!brainShown.has(n.id+(n.data.status||''))&&['done','needs-jeet','proposed'].includes(n.data.status)&&n.data.by_agent&&!n.data.seen_by_jeet);
   fresh.reverse().forEach(n=>{brainShown.add(n.id+n.data.status);const w=el('div');w.appendChild(el('div','bb-meta','🧠 Brain agent · '+String(n.data.processed_at||n.updated_at).slice(0,16).replace('T',' ')+' · "'+String(n.data.text||'').slice(0,60)+'"'));w.appendChild(el('div',null,n.data.result||''));bot(w);
    const ups=(n.data.proposal&&n.data.proposal.updates)||[];const items=ups.map(u=>({r:all.find(x=>(x.order_id||x._id)===u.order_id),p:u.fields||{},why:u.why,conf:u.confidence})).filter(e=>e.r);if(n.data.status==='proposed'&&items.length)propose(items,'[brain proposal '+n.id+']');
    sb.from('lx_b2b').update({data:Object.assign({},n.data,{seen_by_jeet:new Date().toISOString()})}).eq('kind','note').eq('id',n.id).then(()=>{});});
   const pend=r.data.filter(n=>n.data.status==='new').length;pendTag.textContent=pend?pend+' note Brain agent ke paas pending':'';};
  const pendTag=el('div','lx-pend');pane.insertBefore(pendTag,log.nextSibling);
  fab.addEventListener('click',()=>{if(!pane.hidden)loadBrain();});
  send.onclick=async()=>{const t=ta.value.trim();if(!t)return;me(t);ta.value='';await handle(t);};
  ta.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey))send.click();});
  ta.addEventListener('paste',e=>{const fs=[...(e.clipboardData&&e.clipboardData.files||[])].filter(f=>/^image\//.test(f.type));if(fs.length){e.preventDefault();doFiles(fs);}});
  pane.addEventListener('dragover',e=>{e.preventDefault();pane.classList.add('drop');});pane.addEventListener('dragleave',()=>pane.classList.remove('drop'));
  pane.addEventListener('drop',e=>{e.preventDefault();pane.classList.remove('drop');const fs=[...(e.dataTransfer&&e.dataTransfer.files||[])];if(fs.length)doFiles(fs);else{const t=e.dataTransfer.getData('text');if(t){ta.value=t;send.click();}}});
  fi.onchange=async()=>{const fs=[...(fi.files||[])];fi.value='';if(fs.length)doFiles(fs);};
  /* voice: Gemini hears the audio directly (best for Hinglish + codes); else browser speech-to-text */
  let rec=null,chunks=[],sr=null;const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  const stopUI=()=>{mic.classList.remove('rec');mic.textContent='🎤';};
  mic.onclick=async()=>{
   if(rec){rec.stop();return;}if(sr){sr.stop();return;}
   if(AIST.connected&&AIST.provider==='gemini'&&window.MediaRecorder&&navigator.mediaDevices){try{const st=await navigator.mediaDevices.getUserMedia({audio:true});chunks=[];const mt=MediaRecorder.isTypeSupported('audio/webm')?'audio/webm':(MediaRecorder.isTypeSupported('audio/mp4')?'audio/mp4':'');rec=new MediaRecorder(st,mt?{mimeType:mt}:undefined);
     rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};rec.onstop=async()=>{st.getTracks().forEach(t=>t.stop());const r0=rec;rec=null;stopUI();const blob=new Blob(chunks,{type:r0.mimeType||'audio/webm'});if(blob.size<2000){bot('Kuch suna nahi — dobara bolo.');return;}me('🎤 voice note');const wait=bot('Sun raha hoon…');const b64=await fileB64(blob);const res=await brain({action:'analyze',text:ta.value.trim(),audio:{b64,mime:(blob.type||'audio/webm').split(';')[0]}});wait.remove();ta.value='';if(res.ok)showAI(res,'[voice] '+(res.transcript||''));else bot('Voice error: '+res.error);};
     rec.start();mic.classList.add('rec');mic.textContent='⏹';bot('🎤 Bol raha hoon sun raha hoon… khatam ho to ⏹ dabao.');return;}catch(e){bot('Mic permission nahi mili.');rec=null;return;}}
   if(!SR){bot('Is browser me voice nahi chalega — phone keyboard ka 🎤 (voice typing) use karo, text yahan aa jaayega.');return;}
   sr=new SR();sr.lang='en-IN';sr.interimResults=true;sr.continuous=true;let fin='';const base=ta.value;
   sr.onresult=e=>{let it='';for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript;if(e.results[i].isFinal)fin+=t+' ';else it+=t;}ta.value=(base+' '+fin+it).trim();};
   sr.onend=()=>{sr=null;stopUI();if(ta.value.trim())send.click();};sr.onerror=e=>{bot('Voice error: '+e.error);};
   sr.start();mic.classList.add('rec');mic.textContent='⏹';};
 }
 function aiCard(P){const c=el('div','bb-card km-card');const h=el('div','cd-h');const hl=el('div');hl.appendChild(el('b',null,'⚡ Instant AI (optional)'));hl.appendChild(el('small',null,'Default: 🧠 Brain agent tumhare Claude Max pe chalta hai (har ghante, koi API cost nahi). Yahan key sirf tab daalo jab photo/voice ka jawab turant (seconds me) chahiye — key server pe rehti hai.'));h.appendChild(hl);const tg=tag('checking…');h.appendChild(tg);c.appendChild(h);
  const f=el('div','cd-in');const sel=document.createElement('select');[['anthropic','Claude API key (photo)'],['gemini','Google Gemini (photo + voice)']].forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;sel.appendChild(o);});const k=document.createElement('input');k.type='password';k.placeholder='API key';k.autocomplete='off';const sv=btn('Save + test',async()=>{sv.disabled=true;const r=await brain({action:'setkey',provider:sel.value,key:k.value});sv.disabled=false;k.value='';if(r.ok){toast(r.connected?'AI connected ✓':'AI disconnected');await aiStatus();upd();const t=document.querySelector('.lx-ai-tag');if(t){t.textContent=' · AI on ('+AIST.provider+')';t.className='lx-ai-tag on';}}else toast('Key fail: '+r.error);},'bb-b sm');f.append(sel,k,sv);c.appendChild(f);
  c.appendChild(el('p','bb-meta','Khaali chhodo to sab Brain agent (Claude) karega. Gemini free key ho to voice bhi seedha samjhega.'));
  const upd=()=>{tg.textContent=AIST.connected?'on · '+AIST.provider:'off';tg.className='bb-tag '+(AIST.connected?'ok':'bad');};aiStatus().then(upd);P.appendChild(c);}
 /* ---------- Checklist: one dropdown per parcel / combined order ---------- */
 const CK=[
  ['order_date','Bid won',[]],
  ['retailer_date','Ordered at store',[['store','Store','list',STORES],['retailer_order_id','Store order no.']]],
  ['km_portal_updated','KM portal updated (order + retailer ID)',[]],
  ['form_date','Reshipper receiver form filled',[['reshipper','Reshipper','list',RS]],{form_filled:'Yes'}],
  ['retailer_ship_date','Store shipped',[['retailer_tracking','Tracking no.'],['retailer_carrier','Carrier','list',CARRIERS]]],
  ['delivered_reshipper','Reached reshipper',[['actual_weight','Weight kg','number']]],
  ['shipped_reshipper','Left reshipper → India',[['reship_awb','AWB']]],
  ['landed_india','Landed in India',[]],
  ['shipped_km','Shipped to KicksMachine',[['km_courier','Courier','list',DOM],['km_tracking','Courier tracking']]],
  ['delivered_km','Reached KicksMachine',[]],
  ['mrn_updated','MRN updated on KM portal',[]],
  ['mrn_confirmed','KM confirmation received (7-day timer starts)',[],{}],
  ['payout_chased','Payout chased',[]],
  ['payout_date','Payout received',[],{payout_status:'Received'}]];
 const gkey=r=>gv(r,'retailer_order_id')?'so:'+gv(r,'retailer_order_id'):gv(r,'retailer_tracking')?'t:'+String(gv(r,'retailer_tracking')).split(' ')[0]:'o:'+r._id;
 const ST2CK={'Ordered':1,'In transit to reshipper':4,'At reshipper':5,'Shipped from hub':6,'Landed India':7,'Shipped to KM':8,'Delivered to KM':9};
 const ckReach=r=>{let m=ST2CK[r.status]||0;CK.forEach(([k],i)=>{if(i>m&&![2,3,10,12].includes(i)&&gv(r,k))m=i;});return m;};
 const ckDone=(r,i)=>!!gv(r,CK[i][0])||i<=ckReach(r)&&!(i===10&&ckReach(r)===9)&&(i!==12||!!gv(r,'payout_date'));
 function checklist(P){const km=KMO();const gm=new Map();km.forEach(r=>{const k=gkey(r);gm.set(k,(gm.get(k)||[]).concat([r]));});
  const doneN=rs=>CK.filter((c,i)=>rs.every(r=>ckDone(r,i))).length;
  let groups=[...gm.values()];const isDone=rs=>rs.every(r=>r.payout_status==='Received');
  const qv=search(P,'cq','Search KM ID, item, store order, tracking…');
  chipRow(P,'cf',[['','Open',groups.filter(g=>!isDone(g)).length],['done','Paid ✓',groups.filter(isDone).length],['multi','Combined orders',groups.filter(g=>g.length>1).length]]);
  groups=groups.filter(g=>S.cf==='done'?isDone(g):S.cf==='multi'?g.length>1:!isDone(g)).filter(g=>!qv||g.map(vtxt).join(' ').includes(qv)).sort((a,b)=>doneN(a)-doneN(b)||String(a[0].order_date).localeCompare(String(b[0].order_date)));
  if(!groups.length){P.appendChild(el('p','bb-meta','Kuch nahi.'));return;}
  const wrapC=el('div','ck-list');P.appendChild(wrapC);
  groups.forEach(rs=>{const key=gkey(rs[0]);const n=doneN(rs);const d=document.createElement('details');d.className='ck';if(S.ckOpen===key)d.open=true;d.addEventListener('toggle',()=>{if(d.open)S.ckOpen=key;});
   const sm=document.createElement('summary');const l=el('div','ck-l');l.appendChild(el('b',null,rs.map(r=>r.order_id||r._id).join(' + ')));l.appendChild(el('span',null,rs.map(r=>String(r.item||'').slice(0,40)).join(' · ')));sm.appendChild(l);
   const nx=CK.find((c,i)=>!rs.every(r=>ckDone(r,i)));const rr=el('div','ck-r');rr.appendChild(el('small',null,nx?'Next: '+nx[1]:'All done ✓'));const pb=el('div','ck-bar');const pi=el('i');pi.style.width=Math.round(n/CK.length*100)+'%';pb.appendChild(pi);rr.appendChild(pb);rr.appendChild(el('em',null,n+'/'+CK.length));sm.appendChild(rr);d.appendChild(sm);
   const body=el('div','ck-body');if(rs.length>1)body.appendChild(el('p','bb-meta','Combined: '+rs.length+' KM orders, ek store order / tracking. Tick karne se sab pe lagega.'));
   CK.forEach(([k,label,fields,extra],ci)=>{const ok=rs.every(r=>ckDone(r,ci));const row=el('div','ck-step'+(ok?' ok':''));const cb=document.createElement('input');cb.type='checkbox';cb.checked=ok;
    const lab=el('label');lab.appendChild(cb);lab.appendChild(el('span',null,label));row.appendChild(lab);const dt=document.createElement('input');dt.type='date';dt.value=String(gv(rs[0],k)||'').slice(0,10);row.appendChild(dt);
    const F={};fields.forEach(([fk,fl,type,opts])=>{let i;const v=String(gv(rs[0],fk)||'');if(type==='list'){i=document.createElement('select');[...(v&&!opts.includes(v)?[v]:[]),'',...opts].forEach(o=>{const op=el('option',null,o||fl);op.value=o;if(o===v)op.selected=true;i.appendChild(op);});}else{i=document.createElement('input');i.placeholder=fl;if(type)i.type=type;i.value=v;}F[fk]=i;row.appendChild(i);});
    const apply=async(on)=>{for(const r of rs){const p={};Object.entries(F).forEach(([fk,i])=>{let v=i.value;if(i.type==='number')v=v===''?null:Number(v);if(v!==''&&v!=null)p[fk]=v;});if(p.retailer_tracking)p.intl_tracking=p.retailer_tracking;if(p.km_tracking)p.local_tracking=p.km_tracking;
      if(on){p[k]=dt.value||today();Object.assign(p,extra||{});if(k==='mrn_confirmed'&&!r.payout_timer)p.payout_timer=p[k];if(k==='payout_date')p.payout_status='Received';}else{p[k]='';if(k==='payout_date')p.payout_status='Pending';if(k==='mrn_confirmed')p.payout_timer='';if(k==='form_date')p.form_filled='';}
      if(ALIAS[k])p[ALIAS[k]]=p[k];p.status=derive(Object.assign({},r,p));await save(r,p);}draw();};
    cb.onchange=()=>apply(cb.checked);
    if(fields.length){const sv=btn('Save',()=>apply(ok||cb.checked));row.appendChild(sv);}
    body.appendChild(row);});
   const ad=document.createElement('select');ad.className='cd-add';[['','+ Combine another KM order into this group'],...km.filter(r=>!rs.includes(r)&&!DONE(r.status)).map(r=>[r._id,(r.order_id||r._id)+' · '+String(r.item).slice(0,36)])].forEach(([v,t])=>{const o=el('option',null,t);o.value=v;ad.appendChild(o);});
   ad.onchange=async()=>{const r=all.find(x=>x._id===ad.value);if(!r)return;const src=rs[0];const p={};['store','retailer_order_id','retailer_date','retailer_tracking','intl_tracking','retailer_carrier','retailer_ship_date','reshipper'].forEach(k=>{if(src[k])p[k]=src[k];});if(!p.retailer_order_id&&!p.retailer_tracking){toast('Pehle is group me store order no. ya tracking daalo');return;}p.status=derive(Object.assign({},r,p));if(await save(r,p))draw();};body.appendChild(ad);
   d.appendChild(body);wrapC.appendChild(d);});}

 function bids(P){const byId={};all.forEach(r=>{byId[r.order_id||r._id]=r;});
  const stOf=bd=>{const ids=bd.km_order_ids||[bd._id];return ids.some(i=>byId[i])?'in':bd.dismissed?'dis':'new';};
  const list=viewTools(P,BIDS,{date:'won_at',brandKey:'brand',get:(b,k)=>k==='brand'?((b.items||[])[0]||{}).brand:k==='payout'?b.payout_inr:b[k],text:b=>JSON.stringify(b).toLowerCase(),head:['KM order','Item','Payout','Won','Accept by','State'],row:b=>[(b.km_order_ids||[]).join(' '),(b.items||[]).map(x=>x.name).join(' + '),b.payout_inr,String(b.won_at).slice(0,10),b.accept_by,stOf(b)],line:b=>(b.km_order_ids||[]).join(',')+' · '+((b.items||[])[0]||{}).name+' · '+inr(b.payout_inr)});
  const c=el('div','bb-card');c.appendChild(el('h2',null,'Bids accepted (KicksMachine)'));
  const n={in:0,new:0,dis:0},v={in:0,new:0,dis:0};list.forEach(b=>{const k=stOf(b);n[k]++;v[k]+=Number(b.payout_inr)||0;});
  const ch=el('div','bb-chips');[['','All',list.length],['new','Not in orders',n.new],['in','In orders',n.in],['dis','Not accepted / dismissed',n.dis]].forEach(([k,t,c2])=>{const b=el('button','bb-chip'+((S.bf||'')===k?' on':''),t);b.appendChild(el('b',null,String(c2)));b.onclick=()=>{S.bf=k;draw();};ch.appendChild(b);});c.appendChild(ch);
  const K=el('div','bb-kpis');[['Total won',inr(v.in+v.new+v.dis),list.length+' bids'],['In orders',inr(v.in),n.in+' bids'],['Missing',inr(v.new),n.new+' bids'],['Win rate (vs outbid mails)',BIDS.length?Math.round(BIDS.length/(BIDS.length+106)*100)+'%':'—','approx']].forEach(([t,x,y])=>{const d=el('div','bb-k');d.style.cursor='default';d.append(el('small',null,t),el('div','v',x),el('small',null,y));K.appendChild(d);});c.appendChild(K);
  const brands={};list.forEach(b=>{const br=((b.items||[])[0]||{}).brand||'Other';brands[br]=(brands[br]||0)+1;});c.appendChild(el('p','bb-meta','By brand: '+Object.entries(brands).sort((a,b)=>b[1]-a[1]).map(([b,c2])=>b+' '+c2).join(' · ')));
  const miss=list.filter(b=>stOf(b)==='new');if(miss.length){const ca=el('button','bb-b g','Create orders for all '+miss.length+' missing');ca.onclick=async()=>{if(!confirm(miss.length+' bids ke orders banane hai?'))return;for(const bd of miss)await createFrom(bd);draw();};c.appendChild(ca);}
  async function createFrom(bd){const ids=bd.km_order_ids||[bd._id];const per=Math.round((Number(bd.payout_inr)||0)/ids.length);for(let i=0;i<ids.length;i++){if(byId[ids[i]])continue;const x=(bd.items||[])[i]||(bd.items||[])[0]||{};const r={_id:ids[i]};await save(r,{client:'KicksMachine',order_id:ids[i],item:x.name||'',brand:x.brand||'',size:[x.colour,x.size].filter(Boolean).join(' / '),order_date:String(bd.won_at||'').slice(0,10),accept_by:bd.accept_by_date||'',payout:per,status:'To place',payout_status:'Pending',source:'KM email'});all.push(r);byId[ids[i]]=r;}}
  list.filter(b=>!S.bf||stOf(b)===S.bf).sort((a,b)=>String(b.won_at).localeCompare(String(a.won_at))).forEach(bd=>{const ids=bd.km_order_ids||[bd._id];const linked=ids.map(i=>byId[i]).filter(Boolean);
   const l=el('div','bb-bid');const left=el('div');left.appendChild(el('span','o',ids.join(', ')));const it=(bd.items||[]).map(x=>[x.brand,x.name,x.size||x.colour].filter(Boolean).join(' · ')).join(' + ')||'';left.appendChild(el('div','i',it));
   const hrs=bd.accept_by_date?Math.round((new Date(bd.accept_by_date+'T23:59:00')-Date.now())/36e5):null;const sm=el('small',null,'Won '+String(bd.won_at||'').slice(0,10)+(bd.accept_by?' · accept by '+bd.accept_by:''));if(!linked.length&&!bd.dismissed&&hrs!=null&&hrs>=0&&hrs<24){sm.style.color='#d98a7f';sm.textContent+=' · '+hrs+'h left';}left.appendChild(sm);l.appendChild(left);
   l.appendChild(el('b',null,inr(bd.payout_inr)));
   const st=el('div','r');
   if(linked.length)st.appendChild(el('span','bb-st s5','In orders · '+(LBL[linked[0].status]||linked[0].status)));
   else if(bd.dismissed){st.appendChild(el('span','bb-st s0','Not accepted'));const u=el('button','bb-b g','Undo');u.onclick=async()=>{if(await saveK('bid',bd,{dismissed:false}))draw();};st.appendChild(u);}
   else{const b=el('button','bb-b','Create order');b.onclick=async()=>{b.disabled=true;await createFrom(bd);draw();};st.appendChild(b);const dm=el('button','bb-b g','Not accepted');dm.onclick=async()=>{if(await saveK('bid',bd,{dismissed:true}))draw();};st.appendChild(dm);}
   const cl=el('button','bb-b g','Calc');cl.title='Bid calculator me kholo';cl.onclick=()=>{S.calcBid=bd.payout_inr;S.tab='calc';draw();};st.appendChild(cl);
   if(bd.gmail_thread_id){const gm=el('a','bb-b g','Mail');gm.href='https://mail.google.com/mail/?authuser=jeetnatb@gmail.com#all/'+bd.gmail_thread_id;gm.target='_blank';gm.rel='noopener';gm.style.textDecoration='none';st.appendChild(gm);}
   l.appendChild(st);c.appendChild(l);});P.appendChild(c);}
 function calc(P){const c=el('div','bb-card');c.appendChild(el('h2',null,'Bid calculator'));
  const PRE={'Ishaan-USA':{rate:1250,min:1,round:0.5,tax:0},'Yash':{rate:1250,min:0,round:0,tax:0},'Prabhmeet':{rate:1250,min:0,round:0,tax:7},'Ishaan-Canada':{rate:1250,min:1,round:1,tax:0},'Ishaan-UK':{rate:1250,min:1,round:0.5,tax:0}};
  const CUR={USD:95.5,GBP:129,CAD:70,EUR:104};
  const f=el('div','bb-calc bb-f');const I={};const mk=(k,label,v,opts)=>{const l=el('label',null,label);let i;if(opts){i=document.createElement('select');opts.forEach(([val,t])=>{const o=el('option',null,t);o.value=val;i.appendChild(o);});i.value=v;}else{i=document.createElement('input');i.type='number';i.step='any';i.value=v;}l.appendChild(i);f.appendChild(l);I[k]=i;i.oninput=run;i.onchange=run;};
  mk('rs','Reshipper preset','Ishaan-USA',Object.keys(PRE).map(k=>[k,k]));mk('cur','Currency','USD',Object.keys(CUR).map(k=>[k,k]));mk('usd','Retail price','');mk('qty','Qty','1');mk('disc','Discount %','10');mk('coupon','Coupon off (same currency)','0');mk('shipf','Store shipping fee','0');mk('tax','Sales tax %','0');mk('kg','Weight kg (per item)','0.6');mk('rate','FX rate ₹','95.5');mk('ship','Reshipper ₹/kg','1250');mk('dom','Domestic courier ₹','150');mk('cash','Cashback %','0');mk('target','Target margin %','22');mk('bid','KM payout / bid ₹ (total)',S.calcBid||'');
  I.rs.onchange=()=>{const p=PRE[I.rs.value];I.ship.value=p.rate;I.tax.value=p.tax;run();};I.cur.onchange=()=>{I.rate.value=CUR[I.cur.value];run();};
  c.appendChild(f);const out=el('div','bb-out');c.appendChild(out);const brk=el('div','bb-meta');c.appendChild(brk);
  const act=el('div','bb-bar');const sv=el('button','bb-b g','Save to history');const cq=el('button','bb-b g','Copy quote');const mo=el('button','bb-b g','Use for new order');const rs=el('button','bb-b g','Reset');act.append(sv,cq,mo,rs);c.appendChild(act);
  const hist=el('div');c.appendChild(hist);P.appendChild(c);let last=null;
  function run(){out.textContent='';brk.textContent='';const v=k=>Number(I[k].value)||0;if(!v('usd')){last=null;return;}const q=Math.max(1,v('qty'));const p=PRE[I.rs.value]||{min:0,round:0};
   const fx=(v('usd')*q*(1-v('disc')/100)-v('coupon')+v('shipf'))*(1+v('tax')/100)*(1-v('cash')/100);let kg=v('kg')*q;if(p.round)kg=Math.ceil(kg/p.round)*p.round;kg=Math.max(kg,p.min||0);
   const goods=fx*v('rate'),reship=kg*v('ship'),landed=goods+reship+v('dom');last={landed,goods,reship,kg,fx};
   const box=(t,val,s2,col)=>{const d=el('div','bb-k');d.style.cursor='default';d.append(el('small',null,t));const vv=el('div','v',val);if(col)vv.style.color=col;d.appendChild(vv);if(s2)d.appendChild(el('small',null,s2));out.appendChild(d);};
   box('Landed cost',inr(landed),I.cur.value+' '+fx.toFixed(2)+' after discount/tax');box('Min bid @20%',inr(landed*1.2));box('Bid @'+v('target')+'%',inr(Math.ceil(landed*(1+v('target')/100)/100)*100),'rounded up to ₹100');box('Bid @25%',inr(landed*1.25));
   if(v('bid')){const pr=v('bid')-landed,m=pr/landed;box('Profit at this bid',inr(pr),Math.round(m*100)+'% margin',m>=0.2?'#7fc79c':'#d98a7f');last.bid=v('bid');last.profit=pr;}
   brk.textContent='Breakdown: goods '+inr(goods)+' + reship '+inr(reship)+' ('+kg+' kg billed) + domestic '+inr(v('dom'))+'.';}
  const H=()=>{try{return JSON.parse(localStorage.getItem('lxb2b_calc')||'[]');}catch(e){return [];}};const drawH=()=>{hist.textContent='';const h=H();if(!h.length)return;hist.appendChild(el('h2',null,'History'));h.slice(-10).reverse().forEach(x=>hist.appendChild(el('div','bb-line',x.t+' · '+x.price+' → landed '+inr(x.landed)+(x.bid?' · bid '+inr(x.bid)+' · profit '+inr(x.profit):''))));};
  sv.onclick=()=>{if(!last)return;const h=H();h.push({t:today(),price:I.cur.value+' '+I.usd.value,landed:last.landed,bid:last.bid,profit:last.profit});try{localStorage.setItem('lxb2b_calc',JSON.stringify(h.slice(-50)));}catch(e){}drawH();};
  cq.onclick=async()=>{if(!last)return;const t='Price '+I.cur.value+' '+I.usd.value+' · landed '+inr(last.landed)+' · min bid '+inr(last.landed*1.2)+' · target '+inr(last.landed*(1+(Number(I.target.value)||22)/100));try{await navigator.clipboard.writeText(t);toast('Copied');}catch(e){}};
  mo.onclick=()=>{if(!last)return;S.prefill={price_usd:Number(I.usd.value)||null,payout:Number(I.bid.value)||null,reshipper:I.rs.value,weight:Number(I.kg.value)||null};S.tab='add';draw();};
  rs.onclick=()=>{S.calcBid='';draw();};run();drawH();}
 function add(P){const c=el('div','bb-card');c.appendChild(el('h2',null,'Add order'));const f=el('div','bb-f');const I={};const pf=S.prefill||{};
  const mk=(k,label,type,opts)=>{const l=el('label',null,label);let i;if(opts){i=document.createElement('select');opts.forEach(v=>{const o=el('option',null,v||'—');o.value=v;i.appendChild(o);});}else{i=document.createElement(type==='area'?'textarea':'input');if(type&&type!=='area')i.type=type;}if(pf[k]!=null)i.value=pf[k];l.appendChild(i);f.appendChild(l);I[k]=i;};
  mk('client','Client',null,['KicksMachine','Swayam Jumnani','Himanshu Agarwal','Other']);mk('order_id','KM order ID (e.g. US109500)');mk('item','Item');mk('brand','Brand');mk('size','Size / colour');mk('order_date','Bid won on','date');mk('accept_by','Accept by','date');mk('payout','KM payout / price ₹','number');mk('store','Store',null,['',...STORES]);mk('retailer_order_id','Store order no.');mk('price_usd','Retail price $','number');mk('reshipper','Reshipper',null,['',...RS]);mk('weight','Est weight kg','number');mk('status','Status',null,ST);mk('notes','Notes','area');
  if(!I.order_date.value)I.order_date.value=today();if(!pf.status)I.status.value='To place';
  const dup=document.createElement('select');[['','Copy details from an existing order…'],...all.map(r=>[r._id,(r.order_id||r._id)+' · '+String(r.item).slice(0,40)])].forEach(([v,t])=>{const o=el('option',null,t);o.value=v;dup.appendChild(o);});dup.onchange=()=>{const r=all.find(x=>x._id===dup.value);if(!r)return;['item','brand','size','store','reshipper'].forEach(k=>{if(I[k])I[k].value=gv(r,k)||'';});I.weight.value=gv(r,'est_weight')||'';I.price_usd.value=r.price_usd||'';};c.appendChild(dup);
  c.appendChild(f);S.prefill=null;
  const b=el('button','bb-b','Add order');b.onclick=async()=>{const id=(I.order_id.value||'').trim()||('X'+Date.now().toString(36).toUpperCase());if(!I.item.value.trim()){toast('Item daalo');return;}if(all.some(r=>r._id===id)){toast('Ye order ID pehle se hai');return;}
   const d={client:I.client.value,order_id:id,item:I.item.value.trim(),brand:I.brand.value.trim(),size:I.size.value.trim(),order_date:I.order_date.value,accept_by:I.accept_by.value,payout:Number(I.payout.value)||null,store:I.store.value,retailer_order_id:I.retailer_order_id.value.trim(),price_usd:Number(I.price_usd.value)||null,reshipper:I.reshipper.value,est_weight:Number(I.weight.value)||null,weight:Number(I.weight.value)||null,status:I.status.value,notes:I.notes.value,payout_status:'Pending',source:'Portal'};
   if(d.retailer_order_id&&!d.retailer_date)d.retailer_date=today();if(d.price_usd){const kg=d.weight||0.6;d.reship_cost=Math.round(kg*1250);d.landed=Math.round(d.price_usd*95.5+d.reship_cost+150);}d.status=derive(d);
   const r={_id:id};b.disabled=true;if(await save(r,d)){all.push(r);S.tab='orders';VF.orders={q:id};draw();setTimeout(()=>{const x=document.querySelector('.bb-row');if(x)x.open=true;},60);}b.disabled=false;};c.appendChild(b);
  c.appendChild(el('p','bb-meta','Landed apne aap estimate hota hai (retail $ × ₹95.5 + ₹1,250/kg + ₹150 domestic). Add karte hi order khul jaata hai.'));P.appendChild(c);
  const c2=el('div','bb-card');c2.appendChild(el('h2',null,'Add many at once'));c2.appendChild(el('p','bb-meta','Har line: KM order ID | item | payout ₹ | brand (optional). Excel se copy-paste bhi chalega (tab-separated).'));
  const ta=document.createElement('textarea');ta.rows=6;ta.style.cssText='width:100%;background:#0A0A0A;border:1px solid #2A2724;color:#F3EEE6;padding:10px;font:12.5px monospace';ta.placeholder='US110999 | Coach Teri Mini Crossbody | 21500 | Coach';c2.appendChild(ta);
  const b2=el('button','bb-b','Add all');b2.style.marginTop='8px';b2.onclick=async()=>{const lines=ta.value.split('\n').map(x=>x.split(/\t|\|/).map(y=>y.trim())).filter(x=>x[0]&&x[1]);if(!lines.length)return;let n=0;for(const [id,item,pay,brand] of lines){if(all.some(r=>r._id===id))continue;const r={_id:id};if(await save(r,{client:'KicksMachine',order_id:id,item,payout:Number(String(pay||'').replace(/[^0-9.]/g,''))||null,brand:brand||'',order_date:today(),status:'To place',payout_status:'Pending',source:'Portal bulk'})){all.push(r);n++;}}toast(n+' orders added');draw();};c2.appendChild(b2);P.appendChild(c2);}
 function exp(P){const c=el('div','bb-card');c.appendChild(el('h2',null,'Export & reports'));const g=el('div','bb-exg');c.appendChild(g);
  const qq=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';const dl=(name,head,rows,type)=>{const a=document.createElement('a');const body=type==='json'?JSON.stringify(rows,null,1):[head.map(qq).join(',')].concat(rows.map(r=>r.map(qq).join(','))).join('\n');a.href=URL.createObjectURL(new Blob([body],{type:type==='json'?'application/json':'text/csv'}));a.download=name+'-'+today()+(type==='json'?'.json':'.csv');a.click();};
  const COLS=['client','order_id','item','brand','size','order_date','store','retailer_order_id','retailer_date','buy_email','price_usd','retailer_ship_date','retailer_tracking','delivered_reshipper','reshipper','est_weight','actual_weight','reship_cost','form_filled','shipped_reshipper','reship_awb','eta_india','landed_india','km_courier','km_tracking','shipped_km','delivered_km','mrn_updated','mrn_confirmed','payout','payout_status','payout_date','landed','profit','profit_pct','status','notes'];
  const km=all.filter(r=>r.client==='KicksMachine');
  const btn=(t,sub,fn)=>{const d=el('button','bb-ex');d.appendChild(el('b',null,t));d.appendChild(el('small',null,sub));d.onclick=fn;g.appendChild(d);};
  btn('Full B2B sheet (CSV)','Har order, A–Z saare columns',()=>dl('luxella-b2b',COLS,all.map(r=>COLS.map(k=>gv(r,k)))));
  btn('Payout statement (CSV)','KM orders: payout, status, date',()=>dl('luxella-payouts',['KM order','Item','Payout','Status','Paid on','Reached KM'],km.map(r=>[r.order_id||r._id,r.item,r.payout,r.payout_status,r.payout_date,gv(r,'delivered_km')])));
  btn('Reshipper statement (CSV)','Per reshipper weights & cost',()=>dl('luxella-reshipper',['Reshipper','KM order','Item','Est kg','Actual kg','Cost ₹','Billed?','Reached hub','Left hub','AWB'],all.filter(r=>r.reshipper).sort((a,b)=>String(a.reshipper).localeCompare(String(b.reshipper))).map(r=>[r.reshipper,r.order_id||r._id,r.item,gv(r,'est_weight'),gv(r,'actual_weight'),gv(r,'reship_cost'),gv(r,'reship_billed'),gv(r,'delivered_reshipper'),gv(r,'shipped_reshipper'),gv(r,'reship_awb')])));
  btn('Bids (CSV)','Saare KM bids won',()=>dl('luxella-bids',['KM orders','Items','Payout','Won','Accept by','Dismissed'],BIDS.map(b=>[(b.km_order_ids||[]).join(' '),(b.items||[]).map(x=>x.name).join(' + '),b.payout_inr,String(b.won_at).slice(0,10),b.accept_by,b.dismissed?'yes':''])));
  btn('Store orders (CSV)','USA/UK/Canada purchases',()=>dl('luxella-store-orders',['Store','Order no','Date','Account','Items','Total $','Status','Tracking','KM'],BUYS.map(b=>[b.store,b.store_order_no,b.order_date,b.recipient,(b.items||[]).map(x=>x.name).join(' + '),b.total_usd,b.status,(b.tracking_numbers||[]).join(' '),(b.km_ids||[]).join(' ')])));
  btn('Profit by month (CSV)','Payout, landed, profit per month',()=>{const m={};km.forEach(r=>{const k=String(r.order_date||'').slice(0,7)||'?';m[k]=m[k]||[0,0,0,0];m[k][0]++;m[k][1]+=Number(r.payout)||0;m[k][2]+=Number(r.landed)||0;m[k][3]+=Number(r.profit)||0;});dl('luxella-profit-month',['Month','Orders','Payout ₹','Landed ₹','Profit ₹'],Object.entries(m).sort().map(([k,v])=>[k,...v.map(x=>Math.round(x))]));});
  btn('MRN-ready list (CSV)','KM pe pahunche, MRN baaki',()=>dl('luxella-mrn-pending',['KM order','Item','Reached KM','Courier','Tracking'],km.filter(r=>DONE(r.status)&&!gv(r,'mrn_updated')).map(r=>[r.order_id||r._id,r.item,gv(r,'delivered_km'),gv(r,'km_courier'),gv(r,'km_tracking')])));
  btn('Full backup (JSON)','Sab data (orders, bids, store orders)',()=>dl('luxella-b2b-backup',null,{orders:all,bids:BIDS,store_orders:BUYS,at:new Date().toISOString()},'json'));
  btn('Copy summary for WhatsApp','Aaj ka status ek message me',async()=>{const open=km.filter(r=>!DONE(r.status));const pen=km.filter(r=>r.payout_status!=='Received');const t='Luxella B2B · '+today()+'\nOpen orders: '+open.length+'\nAt hub: '+km.filter(r=>r.status==='At reshipper').length+'\nTo India: '+km.filter(r=>r.status==='Shipped from hub').length+'\nPayout pending: '+inr(pen.reduce((t2,r)=>t2+(Number(r.payout)||0),0))+' ('+pen.length+')';try{await navigator.clipboard.writeText(t);toast('Copied');}catch(e){}});
  btn('Print current view','Browser print / PDF',()=>window.print());
  P.appendChild(c);}
 draw();chatBox();
};

/* Standalone B2B portal at /b2b */
window.lxB2BApp=function(){
 const X=window.__lxAdmin;if(!X)return;const {sb,S}=X;const root=document.getElementById('admin-root');root.textContent='';
 const st=document.createElement('style');st.textContent=`#admin-root{min-height:100vh;background:#0A0A0A;color:#F3EEE6;font:300 14px 'Jost',system-ui,sans-serif}#admin-root *{box-sizing:border-box}
 .bp-top{display:flex;align-items:center;gap:14px;padding:14px 20px;border-bottom:1px solid #232120;flex-wrap:wrap;position:sticky;top:0;background:#0A0A0A;z-index:5}.bp-top img{height:26px}.bp-top .t{letter-spacing:.3em;text-transform:uppercase;font-size:12px;color:#C9A227}.bp-top .sp{flex:1}.bp-top .who{color:#A39C90;font-size:12px}
 .bp-top a,.bp-top button{background:transparent;color:#E3C565;border:1px solid #6B5A24;padding:8px 14px;font:500 11px 'Jost',sans-serif;letter-spacing:.16em;text-transform:uppercase;cursor:pointer;text-decoration:none}@media(max-width:600px){.bp-top .who{display:none}.bp-top .t{display:none}}
 .bp-toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:#C9A227;color:#0A0A0A;padding:10px 18px;font-size:13px;z-index:9}`;document.head.appendChild(st);
 const top=el('div','bp-top');const lg=document.createElement('img');lg.src='assets/luxella_logo.png';lg.alt='Luxella';top.appendChild(lg);top.appendChild(el('span','t','B2B Portal'));top.appendChild(el('span','sp'));top.appendChild(el('span','who',S.email||''));
 const ad=el('a',null,'Client admin');ad.href=new URL('admin',document.baseURI).href;top.appendChild(ad);
 const so=el('button',null,'Sign out');so.onclick=()=>sb.auth.signOut().then(()=>{location.href=new URL('b2b',document.baseURI).href;});top.appendChild(so);root.appendChild(top);
 const body=el('div');root.appendChild(body);let tt;
 const toast=t=>{let e=document.querySelector('.bp-toast');if(!e){e=el('div','bp-toast');document.body.appendChild(e);}e.textContent=t;e.hidden=false;clearTimeout(tt);tt=setTimeout(()=>{e.hidden=true;},2600);};
 window.lxB2B(body,sb,toast);
};
})();
