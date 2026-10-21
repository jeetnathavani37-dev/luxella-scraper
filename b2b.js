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
@media(max-width:820px){.bb-tr{grid-template-columns:1fr 1.6fr 1fr}.bb-tr>span:nth-child(n+4){display:none}.bb-tick{grid-template-columns:22px 1fr auto}.bb-tick .i{grid-column:2/4}.bb-tick .s,.bb-tick .d{display:none}.bb-bid{grid-template-columns:1fr auto}.bb-bid .r{grid-column:1/-1}}
@media(max-width:820px){.bb-row>summary,.bb-th{grid-template-columns:1fr 1fr}.bb-row>summary>:nth-child(n+5),.bb-th>:nth-child(n+3){display:none}.bb-row .it{grid-column:1/-1;order:-1}}
`;document.head.appendChild(css);

window.lxB2B=async function(root,sb,toast){
 root.textContent='';const wrap=el('div','bb');root.appendChild(wrap);
 wrap.appendChild(el('p','bb-meta','Loading…'));
 const res=await sb.from('lx_b2b').select('kind,id,data,updated_at');
 if(res.error){wrap.textContent=res.error.message;return;}
 let all=(res.data||[]).filter(x=>x.kind==='order').map(x=>Object.assign({_id:x.id,_u:x.updated_at},x.data));
 let BIDS=(res.data||[]).filter(x=>x.kind==='bid').map(x=>Object.assign({_id:x.id,_u:x.updated_at},x.data));let BUYS=(res.data||[]).filter(x=>x.kind==='buy').map(x=>Object.assign({_id:x.id,_u:x.updated_at},x.data));
 const saveK=async(kind,r,patch)=>{const d=Object.assign({},r,patch);['_id','_u'].forEach(k=>delete d[k]);const r2=await sb.from('lx_b2b').upsert({kind,id:r._id,data:d,updated_at:new Date().toISOString()},{onConflict:'kind,id'});if(r2.error){toast('Save nahi hua: '+r2.error.message);return false;}Object.assign(r,d);toast('Saved');return true;};
 const S={tab:'pipe',who:'KicksMachine',st:'',rs:'',q:''};
 const save=async(r,patch)=>{const d=Object.assign({},r,patch);['_id','_u'].forEach(k=>delete d[k]);
  const L=Number(d.landed),P=Number(d.payout);if(L&&P){d.profit=Math.round((P-L)*100)/100;d.profit_pct=(P-L)/L;d.margin_ok=(P-L)/L>=0.2?'Yes':'No';}
  const r2=await sb.from('lx_b2b').upsert({kind:'order',id:r._id,data:d,updated_at:new Date().toISOString()},{onConflict:'kind,id'});
  if(r2.error){toast('Save nahi hua: '+r2.error.message);return false;}Object.assign(r,d,{_u:new Date().toISOString()});toast('Saved');return true;};
 const draw=()=>{wrap.textContent='';
  const km=all.filter(r=>r.client==='KicksMachine');const open=km.filter(r=>!DONE(r.status));const costed=km.filter(r=>Number(r.landed)>0);
  const atR=km.filter(r=>r.status==='At reshipper');const oldest=Math.max(0,...atR.map(r=>days(r.delivered_reshipper)||0));
  const dueP=km.filter(r=>r.status==='Delivered to KM'&&r.payout_status!=='Received');const got=km.filter(r=>r.payout_status==='Received');
  const sum=(a,k)=>a.reduce((t,r)=>t+(Number(r[k])||0),0);const low=km.filter(r=>r.margin_ok==='No');
  const hd=el('div','bb-line');hd.style.borderTop='0';const h=el('h2',null,'B2B · KicksMachine & order costing');h.style.margin='0';hd.appendChild(h);
  const src=[...new Set(all.map(r=>r.source).filter(Boolean))];hd.appendChild(el('span','bb-meta',src.length?'Imported from: '+src.join(', ')+'. Ab yahin update karo.':''));wrap.appendChild(hd);
  const K=el('div','bb-kpis');const k=(t,v,s,fn)=>{const d=el('div','bb-k');d.append(el('small',null,t),el('div','v',v),el('small',null,s||''));if(fn)d.onclick=fn;K.appendChild(d);};
  k('Open KM orders',String(open.length),km.length+' total · '+(km.length-open.length)+' delivered',()=>{S.tab='orders';S.st='';draw();});
  k('At reshipper',String(atR.length),atR.length?'oldest '+oldest+' days':'',()=>{S.tab='reship';draw();});
  k('Payout due from KM',inr(sum(dueP,'payout')),dueP.length+' delivered, unpaid',()=>{S.tab='payouts';draw();});
  k('Payout received',inr(sum(got,'payout')),got.length+' orders');
  k('Expected profit (KM)',inr(sum(costed,'profit')),'avg '+pct(costed.length?sum(costed,'profit')/Math.max(1,sum(costed,'landed')):0)+' on '+costed.length+' costed orders');
  k('Below 20% margin',String(low.length),'orders',()=>{S.tab='orders';S.st='__low';draw();});
  wrap.appendChild(K);
  const T=el('div','bb-tabs');[['pipe','Pipeline'],['bids','Bids accepted'],['buys','Orders placed (USA)'],['orders','All orders'],['reship','Reshipper'],['payouts','Payouts'],['calc','Bid calculator'],['add','Add order'],['export','Export']].forEach(([id,t])=>{const b=el('button','bb-tab'+(S.tab===id?' on':''),t);b.onclick=()=>{S.tab=id;draw();};T.appendChild(b);});wrap.appendChild(T);
  const P=el('div');wrap.appendChild(P);
  ({pipe:pipe,bids:bids,buys:buys,orders:orders,reship:reship,payouts:payouts,calc:calc,add:add,export:exp})[S.tab](P);};
 function orders(P){const c=el('div','bb-card');P.appendChild(c);
  const bar=el('div','bb-bar');const q=document.createElement('input');q.placeholder='Search order id, item, brand, tracking…';q.value=S.q;
  const who=document.createElement('select');[['KicksMachine','KicksMachine'],['__wa','WhatsApp clients'],['','All']].forEach(([v,t])=>{const o=el('option',null,t);o.value=v;if(v===S.who)o.selected=true;who.appendChild(o);});
  const rs=document.createElement('select');[''].concat(RS).forEach(v=>{const o=el('option',null,v||'All reshippers');o.value=v;if(v===S.rs)o.selected=true;rs.appendChild(o);});
  bar.append(q,who,rs);c.appendChild(bar);
  const base=all.filter(r=>S.who===''?true:S.who==='__wa'?r.client!=='KicksMachine':r.client===S.who).filter(r=>!S.rs||r.reshipper===S.rs);
  const ch=el('div','bb-chips');[['','All'],...ST.map(s=>[s,s]),['__unpaid','Payout pending'],['__low','<20% margin']].forEach(([v,t])=>{const n=base.filter(r=>v===''?true:v==='__unpaid'?r.payout_status!=='Received':v==='__low'?r.margin_ok==='No':r.status===v).length;if(!n&&v!==''&&S.st!==v)return;const b=el('button','bb-chip'+(S.st===v?' on':''),t);b.appendChild(el('b',null,String(n)));b.onclick=()=>{S.st=v;draw();};ch.appendChild(b);});c.appendChild(ch);
  const list=el('div');c.appendChild(list);
  const th=el('div','bb-th');['KM order','Item / store','Stage · next','Reshipper · weight','Landed','Payout','Margin'].forEach(t=>th.appendChild(el('span',null,t)));list.appendChild(th);
  const render=()=>{[...list.querySelectorAll('.bb-row,.bb-meta')].forEach(x=>x.remove());const qq=S.q.toLowerCase();
   const f=base.filter(r=>S.st===''?true:S.st==='__unpaid'?r.payout_status!=='Received':S.st==='__low'?r.margin_ok==='No':r.status===S.st).filter(r=>!qq||[r.order_id,r.item,r.brand,r.intl_tracking,r.local_tracking,r.client].join(' ').toLowerCase().includes(qq))
    .sort((a,b)=>ST.indexOf(a.status)-ST.indexOf(b.status)||String(b.order_date).localeCompare(String(a.order_date)));
   if(!f.length){list.appendChild(el('p','bb-meta','Koi order nahi.'));return;}
   f.forEach(r=>list.appendChild(rowEl(r)));};
  q.oninput=()=>{S.q=q.value;render();};who.onchange=()=>{S.who=who.value;S.st='';draw();};rs.onchange=()=>{S.rs=rs.value;draw();};render();}
 const STORES=['Michael Kors Outlet','Michael Kors','Coach Outlet','Coach','Kate Spade Outlet','Kate Spade','Tory Burch','JW Pei','Ralph Lauren','Patagonia','Dr. Martens','Simon Premium Outlets','Nordstrom Rack','Macy\'s','Amazon US','Alo Yoga','Ted Baker','Other'];
 const CARRIERS=['UPS','FedEx','USPS','DHL','Amazon Shipping','YunExpress','OnTrac','Canada Post','Royal Mail','Other'];
 const DOM=['Tirupati','Bluedart','Delhivery','DTDC','India Post','Hand delivery'];
 /* sections: [title, fields[[key,label,type,opts]]] ; legacy keys read as fallback */
 const ALIAS={retailer_tracking:'intl_tracking',est_weight:'weight',km_tracking:'local_tracking',shipped_km:'shipped_client',delivered_km:'delivered_client'};
 const gv=(r,k)=>r[k]!=null&&r[k]!==''?r[k]:(ALIAS[k]?r[ALIAS[k]]:'');
 const SECS=[
  ['1 · KicksMachine bid',[['order_id','KM order ID'],['order_date','Bid won on','date'],['accept_by','Accept by','date'],['payout','KM payout ₹','number'],['size','Size / colour']]],
  ['2 · Purchase from store',[['store','Bought from (store)','list',STORES],['retailer_order_id','Store order no.'],['retailer_date','Ordered on','date'],['buy_email','Account email used'],['price_usd','Paid $ (after discount)','number'],['discount','Discount / code used'],['tax_pct','Sales tax %','number'],['cashback','Cashback $','number'],['card','Card used']]],
  ['3 · Store → reshipper',[['retailer_ship_date','Store shipped on','date'],['retailer_carrier','Carrier','list',CARRIERS],['retailer_tracking','Tracking no.'],['eta_reshipper','Expected at reshipper','date'],['delivered_reshipper','Reached reshipper','date']]],
  ['4 · Reshipper',[['reshipper','Reshipper','list',RS],['est_weight','Estimated weight kg','number'],['actual_weight','Actual weight kg','number'],['reship_cost','Reship cost ₹ (estimate/billed)','number'],['reship_billed','Billed by reshipper?','list',['','Estimate','Billed']],['form_filled','Shipping form filled?','list',['','Yes','No']],['form_date','Form filled on','date'],['shipped_reshipper','Shipped from reshipper','date'],['reship_awb','Reshipper AWB / tracking'],['parcel_with','Clubbed with (order IDs)']]],
  ['5 · India',[['eta_india','ETA India','date'],['landed_india','Landed in India','date'],['customs_note','Customs / delay note']]],
  ['6 · To KicksMachine',[['km_courier','Courier','list',DOM],['km_tracking','Courier tracking'],['shipped_km','Shipped to KM','date'],['delivered_km','Reached KM','date'],['mrn','MRN received?','list',['','Yes','No']]]],
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
   d.appendChild(wrapS);d.appendChild(auto);
   const row=el('div','bb-bar');const sv=el('button','bb-b','Save');
   sv.onclick=async()=>{const p={};Object.entries(F).forEach(([k,i])=>{let v=i.value;if(i.type==='number')v=v===''?null:Number(v);p[k]=v;});
    Object.entries(ALIAS).forEach(([n,o])=>{if(p[n]!==undefined)p[o]=p[n];});p.weight=p.actual_weight||p.est_weight||null;p.status=derive(Object.assign({},r,p));
    sv.disabled=true;if(await save(r,p))draw();sv.disabled=false;};row.appendChild(sv);
   if(r.payout_status!=='Received'&&r.client==='KicksMachine'){const b=el('button','bb-b g','Mark payout received');b.onclick=async()=>{if(await save(r,{payout_status:'Received',payout_date:today()}))draw();};row.appendChild(b);}
   [['Store tracking',gv(r,'retailer_tracking')],['Reshipper AWB',gv(r,'reship_awb')],['Courier',gv(r,'km_tracking')]].forEach(([t,v])=>{if(!v)return;const a=el('a','bb-b g','Track: '+t);a.href='https://track.aftership.com/'+encodeURIComponent(String(v).split(' ')[0]);a.target='_blank';a.rel='noopener';a.style.textDecoration='none';row.appendChild(a);});
   d.appendChild(row);});
  return d;}
 function pipe(P){const km=all.filter(r=>r.client==='KicksMachine');const bd=el('div','bb-board');
  STEP.concat(['__paid']).forEach(st=>{const rows=st==='__paid'?km.filter(r=>r.status==='Delivered to KM'&&r.payout_status==='Received'):km.filter(r=>r.status===st&&!(st==='Delivered to KM'&&r.payout_status==='Received'));
   const col=el('div','bb-col');const h=el('div','bb-ch');h.appendChild(el('span',null,st==='__paid'?'Paid':(LBL[st]||st)));h.appendChild(el('b',null,String(rows.length)));col.appendChild(h);
   rows.sort((a,b)=>String(a.order_date).localeCompare(String(b.order_date))).forEach(r=>{const c=el('div','bb-mini');c.appendChild(el('div','id',r.order_id||r._id));c.appendChild(el('div',null,r.item));c.appendChild(el('small',null,[r.reshipper,nextHint(r)].filter(Boolean).join(' · ')));c.onclick=()=>{S.tab='orders';S.st=st==='__paid'?'':st;S.q=r.order_id||'';draw();setTimeout(()=>{const x=document.querySelector('.bb-row');if(x)x.open=true;},50);};col.appendChild(c);});
   bd.appendChild(col);});P.appendChild(bd);}
 function reship(P){
  const tb=el('div','bb-chips');const groups={};all.filter(r=>r.reshipper).forEach(r=>{(groups[r.reshipper]=groups[r.reshipper]||[]).push(r);});
  const names=Object.keys(groups).sort((a,b)=>groups[b].length-groups[a].length);if(!names.length){P.appendChild(el('p','bb-meta','Koi reshipper data nahi.'));return;}
  if(!S.rsel||!groups[S.rsel])S.rsel=names[0];
  names.forEach(n=>{const live=groups[n].filter(r=>['In transit to reshipper','At reshipper','Shipped from hub'].includes(r.status)).length;const b=el('button','bb-chip'+(S.rsel===n?' on':''),n);b.appendChild(el('b',null,String(live)));b.onclick=()=>{S.rsel=n;draw();};tb.appendChild(b);});P.appendChild(tb);
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
  if(at.length){const b=el('button','bb-b g','Mark all at warehouse as shipped to India today');b.onclick=async()=>{if(!confirm(at.length+' items "Left reshipper" mark honge. Pakka?'))return;for(const r of at)await save(r,{shipped_reshipper:today(),status:'Shipped from hub'});draw();};P.appendChild(b);}}
 function payouts(P){const km=all.filter(r=>r.client==='KicksMachine'&&r.status!=='To place');S.pf=S.pf||'pending';
  const got=km.filter(r=>r.payout_status==='Received'),pen=km.filter(r=>r.payout_status!=='Received');const sum=a=>a.reduce((t,r)=>t+(Number(r.payout)||0),0);
  const K=el('div','bb-kpis');[['Received',inr(sum(got)),got.length+' orders','got'],['Pending',inr(sum(pen)),pen.length+' orders','pending'],['Pending · at KM',inr(sum(pen.filter(r=>DONE(r.status)))),pen.filter(r=>DONE(r.status)).length+' should be paid soon','due']].forEach(([t,v,s2,f])=>{const d=el('div','bb-k'+(S.pf===f?' on':''));d.append(el('small',null,t),el('div','v',v),el('small',null,s2));d.onclick=()=>{S.pf=f;draw();};K.appendChild(d);});P.appendChild(K);
  const c=el('div','bb-card');const list=S.pf==='got'?got:S.pf==='due'?pen.filter(r=>DONE(r.status)):pen;
  c.appendChild(el('h2',null,(S.pf==='got'?'Payout received':S.pf==='due'?'At KM, payout pending':'Payout pending')+' · tick when money arrives'));
  list.sort((a,b)=>String(gv(a,'delivered_km')||'9').localeCompare(String(gv(b,'delivered_km')||'9'))).forEach(r=>{const l=el('label','bb-tick');const cb=document.createElement('input');cb.type='checkbox';cb.checked=r.payout_status==='Received';
   cb.onchange=async()=>{cb.disabled=true;const ok=await save(r,cb.checked?{payout_status:'Received',payout_date:today()}:{payout_status:'Pending',payout_date:''});if(!ok)cb.checked=!cb.checked;cb.disabled=false;draw();};
   const dd=days(gv(r,'delivered_km'));l.append(cb,el('span','o',r.order_id||r._id),el('span','i',r.item),el('span','s',LBL[r.status]||r.status),el('span','d',r.payout_status==='Received'?(r.payout_date||'paid'):(dd!=null?dd+'d at KM'+(dd>=5?' · follow up':''):'not at KM yet')),el('b',null,inr(r.payout)));if(dd>=5&&r.payout_status!=='Received')l.classList.add('late');c.appendChild(l);});
  if(!list.length)c.appendChild(el('p','bb-meta','Kuch nahi.'));
  if(S.pf!=='got'){const due=pen.filter(r=>DONE(r.status));if(due.length){const msg='Hi Maanvesh, payout status please for: '+due.map(r=>(r.order_id||'')+' ('+inr(r.payout)+')').join(', ')+'. Total '+inr(sum(due))+'. Thanks!';const a=el('a','bb-b','WhatsApp follow-up to KM');a.href='https://wa.me/?text='+encodeURIComponent(msg);a.target='_blank';a.rel='noopener';a.style.cssText='display:inline-block;margin-top:12px;text-decoration:none';c.appendChild(a);}}
  P.appendChild(c);}
 function bids(P){const c=el('div','bb-card');c.appendChild(el('h2',null,'Bids accepted (KicksMachine)'));
  if(!BIDS.length){c.appendChild(el('p','bb-meta','Abhi import nahi hua.'));P.appendChild(c);return;}
  c.appendChild(el('p','bb-meta','KicksMachine ke "You won the bid" mails se. Order ban gaya hai toh "In orders" dikhega, warna ek click me order bana do.'));
  const byId={};all.forEach(r=>{byId[r.order_id||r._id]=r;});
  BIDS.sort((a,b)=>String(b.won_at).localeCompare(String(a.won_at))).forEach(bd=>{const ids=bd.km_order_ids||[bd._id];const linked=ids.map(i=>byId[i]).filter(Boolean);
   const l=el('div','bb-bid');const left=el('div');left.appendChild(el('span','o',ids.join(', ')));const it=(bd.items||[]).map(x=>[x.brand,x.name,x.size||x.colour].filter(Boolean).join(' · ')).join(' + ')||bd.item||'';left.appendChild(el('div','i',it));
   left.appendChild(el('small',null,'Won '+String(bd.won_at||'').slice(0,10)+(bd.accept_by?' · accept by '+bd.accept_by:'')));l.appendChild(left);
   l.appendChild(el('b',null,inr(bd.payout_inr)));
   const st=el('div','r');if(linked.length){st.appendChild(el('span','bb-st s5','In orders · '+(LBL[linked[0].status]||linked[0].status)));}
   else if(bd.cancelled){st.appendChild(el('span','bb-st s0','Cancelled'));}
   else{const b=el('button','bb-b g','Create order');b.onclick=async()=>{b.disabled=true;const per=Math.round((Number(bd.payout_inr)||0)/ids.length);for(let i=0;i<ids.length;i++){const x=(bd.items||[])[i]||(bd.items||[])[0]||{};const r={_id:ids[i]};await save(r,{client:'KicksMachine',order_id:ids[i],item:x.name||bd.item||'',brand:x.brand||'',size:[x.size,x.colour].filter(Boolean).join(' / '),order_date:String(bd.won_at||'').slice(0,10),accept_by:bd.accept_by_date||'',payout:per,status:'To place',payout_status:'Pending',source:'KM email'});all.push(r);}draw();};st.appendChild(b);}
   l.appendChild(st);c.appendChild(l);});P.appendChild(c);}
 function buys(P){const c=el('div','bb-card');c.appendChild(el('h2',null,'Orders placed with stores (USA / UK / Canada)'));
  const bar=el('div','bb-bar');const q=document.createElement('input');q.placeholder='Search store, order no, item, tracking…';q.value=S.bq||'';bar.appendChild(q);c.appendChild(bar);
  const list=el('div');c.appendChild(list);
  const trk=new Map();all.forEach(r=>{const t=String(gv(r,'retailer_tracking')||'').split(' ')[0];if(t)trk.set(t,(trk.get(t)||[]).concat([r]));});
  const render=()=>{list.textContent='';const qq=(S.bq||'').toLowerCase();
   const f=BUYS.filter(b=>!qq||JSON.stringify(b).toLowerCase().includes(qq)).sort((a,b)=>String(b.order_date).localeCompare(String(a.order_date)));
   if(!f.length){list.appendChild(el('p','bb-meta',BUYS.length?'Kuch nahi mila.':'Abhi import nahi hua.'));return;}
   f.forEach(bu=>{const d=document.createElement('details');d.className='bb-row';const s2=document.createElement('summary');s2.className='bb-buy';
    s2.appendChild(el('span','id',bu.store||'—'));const it=el('span','it');it.appendChild(el('b',null,(bu.items||[]).map(x=>x.name+(x.size?' ('+x.size+')':'')).join(' + ')||'—'));it.appendChild(el('small',null,['#'+(bu.store_order_no||''),bu.order_date,bu.recipient].filter(Boolean).join(' · ')));s2.appendChild(it);
    s2.appendChild(el('span','bb-st'+(bu.status==='cancelled'?' s0':bu.status==='delivered'?' s5':''),bu.status||'ordered'));
    s2.appendChild(el('span',null,bu.total_usd!=null?'$'+Number(bu.total_usd).toFixed(2):'—'));
    const links=(bu.tracking_numbers||[]).flatMap(t=>trk.get(String(t).split(' ')[0])||[]).concat((bu.km_ids||[]).map(i=>all.find(r=>(r.order_id||r._id)===i)).filter(Boolean));const uniq=[...new Set(links.map(r=>r.order_id||r._id))];
    s2.appendChild(el('span',null,uniq.length?'→ '+uniq.join(', '):'not linked'));d.appendChild(s2);
    d.addEventListener('toggle',()=>{if(!d.open||d.querySelector('.bb-f'))return;const f2=el('div','bb-f');const F={};
     [['store','Store'],['store_order_no','Store order no.'],['order_date','Ordered on','date'],['recipient','Account email'],['total_usd','Total $','number'],['tax_usd','Tax $','number'],['discount_usd','Discount $','number'],['payment','Card (last 4)'],['ship_to','Shipped to'],['status','Status','list',['ordered','shipped','delivered','cancelled']],['ship_date','Shipped on','date'],['carrier','Carrier'],['tracking','Tracking no(s) (comma)'],['delivered_date','Delivered on','date'],['km','Linked KM orders (comma)'],['notes','Notes','area']].forEach(([k,label,type,opts])=>{const l=el('label',null,label);let i;const cur=k==='tracking'?(bu.tracking_numbers||[]).join(', '):k==='km'?(bu.km_ids||uniq).join(', '):(bu[k]==null?'':String(bu[k]));
      if(type==='list'){i=document.createElement('select');opts.forEach(v=>{const o=el('option',null,v);o.value=v;if(cur===v)o.selected=true;i.appendChild(o);});}else{i=document.createElement(type==='area'?'textarea':'input');if(type&&type!=='area')i.type=type;i.value=cur;}l.appendChild(i);f2.appendChild(l);F[k]=i;});
     d.appendChild(f2);const it2=el('div','bb-meta','Items: '+(bu.items||[]).map(x=>[x.name,x.colour,x.size,x.qty?('x'+x.qty):'',x.price_usd!=null?'$'+x.price_usd:''].filter(Boolean).join(' ')).join(' | '));d.appendChild(it2);
     const row=el('div','bb-bar');const sv=el('button','bb-b','Save');sv.onclick=async()=>{const p={};Object.entries(F).forEach(([k,i])=>{let v=i.value;if(k==='tracking'){p.tracking_numbers=v.split(',').map(x=>x.trim()).filter(Boolean);return;}if(k==='km'){p.km_ids=v.split(',').map(x=>x.trim()).filter(Boolean);return;}if(i.type==='number')v=v===''?null:Number(v);p[k]=v;});
      if(await saveK('buy',bu,p)){for(const id of p.km_ids||[]){const r=all.find(x=>(x.order_id||x._id)===id);if(r){const pp={store:p.store,retailer_order_id:p.store_order_no,retailer_date:p.order_date,buy_email:p.recipient};if(p.tracking_numbers&&p.tracking_numbers[0]&&!gv(r,'retailer_tracking'))pp.retailer_tracking=pp.intl_tracking=p.tracking_numbers[0];if(p.ship_date)pp.retailer_ship_date=p.ship_date;if(p.carrier)pp.retailer_carrier=p.carrier;pp.status=derive(Object.assign({},r,pp));await save(r,pp);}}draw();}};row.appendChild(sv);d.appendChild(row);});
    list.appendChild(d);});};
  q.oninput=()=>{S.bq=q.value;render();};render();
  const ad=el('button','bb-b g','+ Add store order');ad.style.marginTop='12px';ad.onclick=async()=>{const id='buy-'+Date.now().toString(36);const bu={_id:id};if(await saveK('buy',bu,{store:'',status:'ordered',order_date:today(),items:[]})){BUYS.push(bu);draw();}};c.appendChild(ad);
  P.appendChild(c);}
 function calc(P){const c=el('div','bb-card');c.appendChild(el('h2',null,'Bid calculator'));c.appendChild(el('p','bb-meta','Retail price daalo, landed cost aur minimum bid turant dikhega. Defaults: $1 = ₹95.5, reshipper ₹1,250/kg, domestic ₹150.'));
  const f=el('div','bb-calc bb-f');const I={};const mk=(k,label,v,opts)=>{const l=el('label',null,label);let i;if(opts){i=document.createElement('select');opts.forEach(([val,t])=>{const o=el('option',null,t);o.value=val;i.appendChild(o);});i.value=v;}else{i=document.createElement('input');i.type='number';i.step='any';i.value=v;}l.appendChild(i);f.appendChild(l);I[k]=i;i.oninput=run;i.onchange=run;};
  mk('usd','Retail price $','');mk('disc','Discount %','10');mk('tax','Sales tax',0,[[0,'0% · Delaware (Ishaan/Yash)'],[7,'7% · New Jersey (Prabhmeet)']]);mk('kg','Weight kg','0.6');mk('rate','USD → INR','95.5');mk('ship','Reshipper ₹/kg','1250');mk('dom','Domestic courier ₹','150');mk('cash','Cashback %','0');mk('bid','KM bid / payout ₹','');
  c.appendChild(f);const out=el('div','bb-out');c.appendChild(out);P.appendChild(c);
  function run(){out.textContent='';const v=k=>Number(I[k].value)||0;if(!v('usd'))return;const usd=v('usd')*(1-v('disc')/100)*(1+v('tax')/100)*(1-v('cash')/100);const kg=Math.max(v('kg'),0);const landed=usd*v('rate')+kg*v('ship')+v('dom');
   const box=(t,val,s,col)=>{const d=el('div','bb-k');d.style.cursor='default';d.append(el('small',null,t));const vv=el('div','v',val);if(col)vv.style.color=col;d.appendChild(vv);if(s)d.appendChild(el('small',null,s));out.appendChild(d);};
   box('Landed cost',inr(landed),'$'+usd.toFixed(2)+' after discount/tax');box('Min bid @20%',inr(landed*1.2));box('Bid @25%',inr(landed*1.25));
   if(v('bid')){const p=v('bid')-landed,m=p/landed;box('Profit at this bid',inr(p),pct(m)+' margin',m>=0.2?'#7fc79c':'#d98a7f');}}
 }
 function add(P){const c=el('div','bb-card');c.appendChild(el('h2',null,'Add order (bid won / new client order)'));const f=el('div','bb-f');const I={};
  const mk=(k,label,type,opts)=>{const l=el('label',null,label);let i;if(opts){i=document.createElement('select');opts.forEach(v=>{const o=el('option',null,v||'—');o.value=v;i.appendChild(o);});}else{i=document.createElement('input');if(type)i.type=type;}l.appendChild(i);f.appendChild(l);I[k]=i;};
  mk('client','Client',null,['KicksMachine','Swayam Jumnani','Himanshu Agarwal','Other']);mk('order_id','Order ID (e.g. US109500)');mk('item','Item');mk('brand','Brand');mk('size','Size / colour');mk('order_date','Order date','date');mk('payout','KM payout / price ₹','number');mk('price_usd','Retail price $','number');mk('reshipper','Reshipper',null,['',...RS]);mk('weight','Weight kg','number');mk('status','Status',null,ST);
  I.order_date.value=today();I.status.value='Ordered';c.appendChild(f);
  const b=el('button','bb-b','Add order');b.onclick=async()=>{const id=(I.order_id.value||'').trim()||('X'+Date.now().toString(36).toUpperCase());if(!I.item.value.trim()){toast('Item daalo');return;}if(all.some(r=>r._id===id)){toast('Ye order ID pehle se hai');return;}
   const d={client:I.client.value,order_id:id,item:I.item.value.trim(),brand:I.brand.value.trim(),size:I.size.value.trim(),order_date:I.order_date.value,payout:Number(I.payout.value)||null,price_usd:Number(I.price_usd.value)||null,reshipper:I.reshipper.value,weight:Number(I.weight.value)||null,status:I.status.value,payout_status:'Pending',placed:'Yes',source:'Portal'};
   if(d.price_usd){const kg=d.weight||0.6;d.reship_cost=Math.round(kg*1250);d.landed=Math.round(d.price_usd*0.9*95.5+d.reship_cost+150);}
   const r={_id:id};b.disabled=true;if(await save(r,d)){all.push(r);S.tab='orders';draw();}b.disabled=false;};c.appendChild(b);
  c.appendChild(el('p','bb-meta','Landed apne aap estimate hota hai (10% discount, 0% tax, ₹1,250/kg, ₹150 domestic) agar retail $ diya. Baad me order kholke exact daal sakte ho.'));P.appendChild(c);}
 function exp(P){const c=el('div','bb-card');c.appendChild(el('h2',null,'Export'));const b=el('button','bb-b g','Download B2B sheet (CSV)');b.onclick=()=>{const cols=['client','order_id','item','brand','size','order_date','price_usd','reshipper','reship_cost','landed','payout','profit','profit_pct','margin_ok','status','payout_status','intl_tracking','local_tracking','delivered_reshipper','eta_india','landed_india','shipped_client','delivered_client','weight','notes'];const q=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';const csv=[cols.join(',')].concat(all.map(r=>cols.map(k=>q(r[k])).join(','))).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='luxella-b2b-'+today()+'.csv';a.click();};c.appendChild(b);P.appendChild(c);}
 draw();
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
