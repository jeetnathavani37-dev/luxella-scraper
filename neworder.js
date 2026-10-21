/* Luxella portal — professional "Place a new order" checkout (Overview). Loaded after app.js. */
(function(){
'use strict';
if(window.__lxNO)return;window.__lxNO=1;
const $=id=>document.getElementById(id);
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;};
const say=t=>{try{if(window.alertMsg)window.alertMsg(t);}catch(e){}};
const inr=n=>'₹'+Number(n||0).toLocaleString('en-IN');
const hash=s=>{let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return Math.abs(h).toString(36);};
const pslug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60);
const ready=cb=>{let n=0;const t=setInterval(()=>{n++;let ok=false;try{ok=typeof photos!=='undefined'&&photos.db&&typeof dash!=='undefined'&&$('neworder');}catch(e){}if(ok){clearInterval(t);cb();}else if(n>200)clearInterval(t);},150);};
ready(()=>{
 const card=$('neworder');if(card.dataset.b)return;card.dataset.b=1;const root=el('div','nwo-body');const fold=el('details','nwo-fold');const fs=el('summary');const ft=el('div','nwo-ft');ft.appendChild(el('h2',null,'Place a new order'));ft.appendChild(el('p','note','Share the piece, delivery and payment in 4 quick steps. Confirmation within 24–48 hours.'));fs.appendChild(ft);fs.appendChild(el('span','nwo-chev','+'));fold.appendChild(fs);fold.appendChild(root);card.textContent='';card.appendChild(fold);
 const Q=new URLSearchParams(location.search);
 const S={step:0,busy:false,done:null};
 const F={};
 const mk=(label,tag,attrs,wide)=>{const l=el('label',wide?'wide':null);l.appendChild(document.createTextNode(label));const i=el(tag);Object.assign(i,attrs||{});l.appendChild(i);return {l,i};};
  const intro=el('p','note','Fill in the piece, delivery and payment. Luxella confirms by email and the order shows in your Orders tab straight away.');intro.hidden=true;root.appendChild(intro);
 const prog=el('div','nwo-prog');['The piece','Delivery','Payment','Review'].forEach((n,i)=>{const s=el('span',null,(i+1)+'  '+n);prog.appendChild(s);});root.appendChild(prog);
 const panes=[el('div','nwo-pane'),el('div','nwo-pane'),el('div','nwo-pane'),el('div','nwo-pane')];
 panes.forEach(p=>root.appendChild(p));
 /* 1 piece */
 const f1=el('div','form');
 [['item','Item *','text',{placeholder:'e.g. Coach Tabby 26, Black'},1],['brand','Brand','text',{},0],['size','Size / colour','text',{},0],['qty','Qty','number',{value:'1',min:'1'},0],['link','Product link (optional)','url',{placeholder:'https://'},1],['notes','Notes','text',{placeholder:'Deadline, gift wrap, alternatives…'},1],['photo','Photo of the piece (optional)','file',{accept:'image/*'},1]].forEach(([k,lab,type,at,w])=>{const m=mk(lab,'input',Object.assign({type},at),w);F[k]=m.i;f1.appendChild(m.l);});
 {const mt=mk('Order type','select',{},1);[['ETA','International · sourced from abroad (2–4 weeks)'],['Local','Local · sourced in India (faster)']].forEach(([v,t])=>{const o=el('option',null,t);o.value=v;mt.i.appendChild(o);});F.otype=mt.i;f1.insertBefore(mt.l,f1.firstChild);const tn=el('p','note nwo-tnote');const upd=()=>{tn.textContent=F.otype.value==='Local'?'Local order: placed → confirmed → item secured → address → dispatched → delivered.':'International order: store → international hub → India → you. ETA shared once the store confirms.';};F.otype.addEventListener('change',upd);upd();f1.parentNode?0:0;S.tnote=tn;}
 panes[0].appendChild(f1);if(S.tnote)panes[0].appendChild(S.tnote);
 /* 2 delivery */
 const f2=el('div','form');
 const ms=mk('Deliver to','select',{},1);F.addr=ms.i;f2.appendChild(ms.l);
 const mn=mk('New address (full address with pincode)','textarea',{rows:3,placeholder:'Name, address, pincode'},1);F.newaddr=mn.i;mn.i.className='inp';f2.appendChild(mn.l);
 const mp=mk('Phone for delivery','input',{type:'tel',placeholder:'10-digit mobile'},0);F.phone=mp.i;f2.appendChild(mp.l);
 panes[1].appendChild(f2);
 /* 3 payment */
 const f3=el('div','form');
 const mpr=mk('Agreed price ₹ *','input',{type:'number',inputMode:'numeric',placeholder:'as quoted'},0);F.price=mpr.i;f3.appendChild(mpr.l);
 const mpy=mk('Paying by','select',{},0);F.pay=mpy.i;['UPI','Bank transfer','Pay after confirmation'].forEach(v=>{const o=el('option',null,v);o.value=v;mpy.i.appendChild(o);});f3.appendChild(mpy.l);
 const mpd=mk('Amount paid ₹','input',{type:'number',inputMode:'numeric'},0);F.paid=mpd.i;f3.appendChild(mpd.l);
 const mrf=mk('Reference / UTR (optional)','input',{type:'text',placeholder:'Transaction ID',autocomplete:'off'},0);F.ref=mrf.i;f3.appendChild(mrf.l);
 const msc=mk('Payment screenshot (optional)','input',{type:'file',accept:'image/*'},1);F.file=msc.i;f3.appendChild(msc.l);
 panes[2].appendChild(f3);
 const pi=el('div','payinline');panes[2].appendChild(pi);
 const payNote=el('p','note','Pay using the details above, then enter the amount (reference is optional, but helps us confirm faster). Luxella verifies it against the account and confirms here. Until then it shows as pending.');panes[2].appendChild(payNote);
 /* 4 review */
 const rv=el('div','nwo-rev');panes[3].appendChild(rv);
 const trust=el('p','note','After you place the order, Luxella verifies your payment and checks availability. You will get a confirmation within 24–48 hours, by email and in your Orders tab.');panes[3].appendChild(trust);
 const terms=el('label','nwo-terms');const tc=el('input');tc.type='checkbox';terms.appendChild(tc);terms.appendChild(document.createTextNode(' I have read the terms and want to place this order.'));panes[3].appendChild(terms);
 const nav=el('div','nwo-nav');const back=el('button','btn2','Back');back.type='button';const next=el('button','btn','Continue');next.type='button';const msg=el('span','lbl');nav.appendChild(back);nav.appendChild(next);nav.appendChild(msg);root.appendChild(nav);
 const doneBox=el('div','nwo-done');doneBox.hidden=true;root.appendChild(doneBox);
 /* helpers */
 const addrList=()=>Object.values(photos.book||{});
 const fillAddr=()=>{const sel=F.addr;const book=addrList();const k=book.map(b=>b.label+b.address).join('|');if(sel.dataset.k===k)return;sel.dataset.k=k;const cur=sel.value;sel.textContent='';book.forEach(b=>{const o=el('option',null,(b.label||'Address')+(b.isDefault?' (default)':'')+' — '+String(b.address||'').slice(0,50));o.value=b.address||'';o.dataset.phone=b.phone||'';if(b.isDefault)o.selected=true;sel.appendChild(o);});const on=el('option',null,'New address…');on.value='__new';sel.appendChild(on);const ol=el('option',null,'Decide later — I will share it before dispatch');ol.value='__later';sel.appendChild(ol);if(!book.length&&!cur)sel.value='__later';else if(cur)sel.value=cur;tog();};
 const tog=()=>{const nw=F.addr.value==='__new';F.newaddr.closest('label').hidden=!nw;F.phone.closest('label').hidden=F.addr.value==='__later';if(!nw){const o=F.addr.selectedOptions[0];if(o&&o.dataset.phone&&!F.phone.value)F.phone.value=o.dataset.phone;}};
 F.addr.addEventListener('change',tog);
 const payInfo=()=>{pi.textContent='';const p=photos.payinfo||{};if(!p.upi){pi.appendChild(el('span','lbl','Payment details will appear here once published.'));return;}const im=el('img');im.src='assets/upi_qr.png';im.alt='Luxella UPI QR';pi.appendChild(im);const d=el('div');d.appendChild(el('span','k','Pay to Luxella · UPI'));const v=el('div','v',p.upi);d.appendChild(v);if(p.bank){const k2=el('span','k','Bank');k2.style.marginTop='10px';d.appendChild(k2);const b=el('div','lbl',p.bank);b.style.whiteSpace='pre-wrap';d.appendChild(b);}pi.appendChild(d);};
 const paidMode=()=>F.pay.value!=='Pay after confirmation';
 const syncPay=()=>{const on=paidMode();[F.paid,F.ref,F.file].forEach(x=>x.closest('label').hidden=!on);pi.hidden=!on&&false;};
 F.pay.addEventListener('change',syncPay);
 const val=n=>String(F[n].value||'').trim();
 const check=s=>{
  if(s===0){if(!val('item'))return 'Enter the item name.';if(!(Number(val('qty')||1)>=1))return 'Quantity must be at least 1.';if(val('link')&&!/^https?:\/\//i.test(val('link')))return 'Product link should start with https://';}
  if(s===1&&F.addr.value!=='__later'){if(F.addr.value==='__new'&&val('newaddr').length<15)return 'Enter the full delivery address with pincode.';if(F.addr.value==='__new'&&!/\b\d{6}\b/.test(val('newaddr')))return 'The address needs a 6-digit pincode.';const ph=val('phone').replace(/[\s-]/g,'');if(!/^(\+91)?[6-9]\d{9}$/.test(ph))return 'Enter a 10-digit Indian mobile number for delivery.';}
  if(s===2){const pr=Number(val('price'));if(!(pr>0))return 'Enter the agreed price.';if(paidMode()){const pd=Number(val('paid'));if(!(pd>0))return 'Enter the amount you paid, or choose "Pay after confirmation".';if(pd>pr)return 'Paid amount is more than the price.';}}
  return '';};
 const later=()=>F.addr.value==='__later';const addrText=()=>later()?'To be shared later':(F.addr.value==='__new'?val('newaddr'):F.addr.value);
 const ocard=(no,st)=>{const pr=Number(val('price')||0),pd=paidMode()?Number(val('paid')||0):0;const c=el('div','ocard');const th=el('div','oc-th');if(S.img){const im=el('img');im.src=S.img;im.alt='';th.appendChild(im);}else th.appendChild(el('span',null,(val('brand')||val('item')||'L').trim().charAt(0).toUpperCase()));c.appendChild(th);const m=el('div','oc-m');m.appendChild(el('div','oc-no',no||'Order preview'));m.appendChild(el('div','oc-it',val('item')||'—'));m.appendChild(el('div','oc-br',[val('brand'),val('size'),'Qty '+(val('qty')||'1')].filter(Boolean).join(' · ')));c.appendChild(m);const r=el('div','oc-r');r.appendChild(el('div','oc-pr',pr?inr(pr):'—'));r.appendChild(el('span','oc-st',st));c.appendChild(r);const f=el('div','oc-f');const cell=(k,v)=>{const d=el('div');d.appendChild(el('span','k',k));d.appendChild(el('span','v',v));f.appendChild(d);};cell('Delivery',later()?'Decide later':(addrText()||'—').split('\n')[0].slice(0,40));cell('Payment',pd?inr(pd)+' paid':'Pending');cell('Confirmation','24–48 hours');c.appendChild(f);return c;};
 if(F.photo)F.photo.addEventListener('change',()=>{const fl=F.photo.files&&F.photo.files[0];S.img=null;if(fl&&/^image\//.test(fl.type)){try{S.img=URL.createObjectURL(fl);}catch(e){}}});
 const review=()=>{rv.textContent='';rv.appendChild(ocard(null,'Ready to place'));const row=(k,v)=>{const r=el('div','nwo-r');r.appendChild(el('span','k',k));r.appendChild(el('span','v',v));rv.appendChild(r);};
  const pr=Number(val('price')),pd=paidMode()?Number(val('paid')||0):0;
  row('Order type',F.otype&&F.otype.value==='Local'?'Local (India)':'International');row('Piece',val('item')+(val('brand')?' ('+val('brand')+')':''));row('Size / colour',val('size')||'—');row('Qty',val('qty')||'1');if(val('link'))row('Link',val('link'));if(val('notes'))row('Notes',val('notes'));
  row('Deliver to',later()?'Decide later (we will ask before dispatch)':addrText()+' · '+val('phone'));row('Price',inr(pr));row('Paying by',F.pay.value);
  if(pd){row('Paid now',inr(pd)+(val('ref')?' · ref '+val('ref'):''));row('Balance',inr(Math.max(0,pr-pd)));}else row('Balance',inr(pr)+' (to pay after confirmation)');};
 const waNum=()=>String((photos.contact&&photos.contact.phone)||'918724079056').replace(/[^0-9]/g,'');
 const waText=(no)=>{const pr=Number(val('price')||0),pd=paidMode()?Number(val('paid')||0):0;const cn=(window.lx&&window.lx.client&&window.lx.client()&&window.lx.client().name)||'';return 'New order'+(no?' '+no:' request')+(cn?' — '+cn:'')+'\n\nItem: '+val('item')+(val('brand')?' ('+val('brand')+')':'')+'\nSize/colour: '+(val('size')||'—')+'\nQty: '+(val('qty')||'1')+(val('link')?'\nLink: '+val('link'):'')+(val('notes')?'\nNotes: '+val('notes'):'')+'\nDeliver to: '+(later()?'Will share later':addrText()+' · '+val('phone'))+'\nPrice: '+(pr?inr(pr):'—')+'\nPaying by: '+F.pay.value+(pd?'\nPaid: '+inr(pd)+(val('ref')?' (ref '+val('ref')+')':''):'')+'\n\nMy page: '+location.origin+location.pathname+'#al';};
 const waBtn=(no,cls)=>{const a=el('a',cls||'btn2','Send on WhatsApp');a.target='_blank';a.rel='noopener';a.addEventListener('click',()=>{a.href='https://wa.me/'+waNum()+'?text='+encodeURIComponent(waText(no));});a.href='https://wa.me/'+waNum()+'?text='+encodeURIComponent(waText(no));return a;};
 let render=()=>{panes.forEach((p,i)=>p.hidden=i!==S.step);[...prog.children].forEach((s,i)=>{s.className=i===S.step?'on':i<S.step?'ok':'';});back.hidden=S.step===0;next.textContent=S.step===3?'Place order':'Continue';if(S.step===3)review();msg.textContent='';};
 back.addEventListener('click',()=>{if(S.step>0){S.step--;render();}});
 const orderNo=()=>{const rows=dash.data('orders');const rs=rows.status==='ok'?rows.data:[];const m=String(new Date().getMonth()+1).padStart(2,'0');const nums=rs.map(r=>String(r.order_no||'')).filter(n=>n.startsWith('#'+m)).map(n=>Number(n.slice(3))||0);return '#'+m+String((nums.length?Math.max(...nums):0)+1).padStart(2,'0');};
 const place=async()=>{
  if(!tc.checked){msg.textContent='Please tick the box to confirm.';return;}
  for(let s=0;s<3;s++){const e=check(s);if(e){S.step=s;render();msg.textContent=e;return;}}
  if(S.busy)return;S.busy=true;next.disabled=true;msg.textContent='Placing your order…';
  try{
   const rows=dash.data('orders');const rs=rows.status==='ok'?rows.data:[];let name=val('item');if(rs.some(r=>r.item===name)){let n=2;while(rs.some(r=>r.item===name+' ('+n+')'))n++;name=name+' ('+n+')';}
   const no=orderNo(),price=Number(val('price')),paid=paidMode()?Number(val('paid')||0):0,today=new Date().toISOString().slice(0,10);
   let proof='';const f=F.file.files&&F.file.files[0];if(paid&&f){if(f.size>8*1024*1024)throw new Error('Screenshot is over 8 MB.');try{const a=await photos.assets.upload(f);proof=a.url;}catch(e){proof='';}}
   const address=addrText();
   await window.lx.saveOrder(name,{item:name,order_no:no,order_date:today,brand:val('brand'),size:val('size'),qty:Number(val('qty')||1),product_link:val('link'),client_notes:val('notes'),delivery_address:address,delivery_phone:later()?'':val('phone'),delivery_later:later(),order_type:(F.otype&&F.otype.value==='Local')?'Local':'ETA',direct:'Direct to client',payout:price,payout_status:'Pending',placed_by:(window.lx&&window.lx.isOwner&&window.lx.isOwner()?'owner':'client'),stage:1,status:'Order placed',eta_date:'',shipping_date:'',intl_tracking_no:'',intl_courier:'',intl_courier_slug:'',local_tracking:'',local_courier:'',local_courier_slug:''});
   if(!later())try{await photos.db.doc('addresses/'+pslug(name)).set({order:name,address,phone:val('phone'),pref:'',savedAt:today});}catch(e){}
   if(F.addr.value==='__new'){try{await photos.db.collection('addressbook').add({label:'Address '+(addrList().length+1),phone:val('phone'),address,isDefault:!addrList().length,at:today});}catch(e){}}
   if(paid){const id='ps-'+hash(name+'|'+paid+'|'+val('ref').toLowerCase());try{await photos.db.doc('paysub/'+id).set({id,order:name,amount:paid,method:F.pay.value,ref:val('ref'),proof,status:'Pending verification',at:new Date().toISOString()});}catch(e){say('Order placed, but the payment note did not save. Please submit it in Payments.');}}
   const pf=F.photo.files&&F.photo.files[0];if(pf){try{if(pf.size>8*1024*1024)throw new Error('big');const a=await photos.assets.upload(pf);await photos.db.doc('photos/'+pslug(name)).set({order:name,id:a.id,url:a.url,at:today});}catch(e){say('Order placed, but the photo did not upload. Add it from the order.');}}
   S.done={no,name,paid,price};
   panes.forEach(p=>p.hidden=true);prog.hidden=nav.hidden=true;intro.hidden=true;
   doneBox.hidden=false;doneBox.textContent='';
   doneBox.appendChild(el('div','nwo-tick','✓'));doneBox.appendChild(el('h3',null,'Order placed · '+no));doneBox.appendChild(ocard(no,'Awaiting confirmation'));
   doneBox.appendChild(el('p','note',name+' · '+inr(price)+(paid?' · '+inr(paid)+' payment submitted, pending verification':' · payment pending')+'. We will verify your payment and check availability, and confirm within 24–48 hours. A receipt email is on its way to you.'));
   const row=el('p','nwo-nav');const v=el('button','btn','View in Orders');v.type='button';v.addEventListener('click',()=>{const t=$('tab-al');if(t)t.click();window.scrollTo(0,0);});const again=el('button','btn2','Place another order');again.type='button';again.addEventListener('click',()=>{Object.keys(F).forEach(k=>{if(F[k].type==='file')F[k].value='';else if(F[k].tagName!=='SELECT')F[k].value='';});F.qty.value='1';tc.checked=false;S.step=0;S.done=null;doneBox.hidden=true;prog.hidden=nav.hidden=intro.hidden=false;next.disabled=false;S.busy=false;render();});row.appendChild(v);row.appendChild(waBtn(no));{const cp=el('button','btn2','Copy order link');cp.type='button';cp.addEventListener('click',async()=>{const u=location.origin+location.pathname+'#al';try{await navigator.clipboard.writeText(u);cp.textContent='Link copied';}catch(e){cp.textContent=u;}});row.appendChild(cp);}row.appendChild(again);doneBox.appendChild(row);
   S.busy=false;
  }catch(e){msg.textContent='Could not place the order. Your details are kept, try again.';S.busy=false;next.disabled=false;}
 };
 const wab=waBtn('');wab.hidden=true;nav.insertBefore(wab,msg);const _r=render;
 const owner=window.lx&&window.lx.isOwner&&window.lx.isOwner();
 {const sh=el('button','btn2','Copy order link');sh.type='button';sh.addEventListener('click',async()=>{const q=new URLSearchParams();[['item','item'],['brand','brand'],['size','size'],['qty','qty'],['link','link'],['notes','notes'],['price','price']].forEach(([k,f])=>{const v=val(f);if(v&&!(k==='qty'&&v==='1'))q.set(k,v);});const u=location.origin+location.pathname+(q.toString()?'?'+q:'')+'#new';try{await navigator.clipboard.writeText(u);msg.textContent='Client link copied.';}catch(e){msg.textContent=u;}});nav.insertBefore(sh,msg);}
 const _rend=render;render=()=>{_rend();wab.hidden=S.step!==3;wab.href='https://wa.me/'+waNum()+'?text='+encodeURIComponent(waText(''));};
 next.addEventListener('click',()=>{if(S.step===3){place();return;}const e=check(S.step);if(e){msg.textContent=e;return;}S.step++;render();});
 /* prefill from shared link */
 const pf=(k,q)=>{const v=Q.get(q||k);if(v)F[k].value=v;};
 ['item','brand','size','qty','link','notes'].forEach(k=>pf(k));
 if(Q.get('price')){F.price.value=Q.get('price');F.price.readOnly=true;F.price.title='Price fixed by Luxella for this order';}
 fillAddr();payInfo();syncPay();render();
 try{dash.onData(()=>{fillAddr();payInfo();});}catch(e){}
 const open=()=>{const t=$('tab-ov');if(t)t.click();fold.open=true;setTimeout(()=>card.scrollIntoView({behavior:'smooth',block:'start'}),250);};
 if(location.hash==='#new'||Q.get('item'))setTimeout(open,600);
});
})();

/* Departures as compact cards (tap to expand) */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;};
const inr=n=>'₹'+Number(n||0).toLocaleString('en-IN');
let n=0;const t=setInterval(()=>{n++;let ok=false;try{ok=typeof dash!=='undefined'&&$('board')&&typeof STAGES!=='undefined';}catch(e){}if(ok){clearInterval(t);init();}else if(n>200)clearInterval(t);},150);
function init(){
 const tbl=$('board'),wrap=tbl.closest('.scroll');if(!wrap||$('dep-cards'))return;
 wrap.hidden=true;const box=el('div','dep-cards');box.id='dep-cards';wrap.parentNode.insertBefore(box,wrap);
 const note=wrap.parentNode.querySelector('.note');if(note)note.textContent='Open orders at a glance. Tap one for details.';
 const open=new Set();
 const render=()=>{const o=dash.data('orders');box.textContent='';if(o.status!=='ok')return;
  const rows=o.data.filter(r=>r.status!=='Delivered'&&Number(r.stage||1)<9).sort((a,b)=>Number(b.stage||1)-Number(a.stage||1));
  if(!rows.length){box.appendChild(el('p','lbl','No open orders.'));return;}
  rows.forEach(r=>{const st=Number(r.stage||1),local=String(r.order_type||'').indexOf('Local')>=0;
   const d=el('details','dep');d.dataset.k=r.item;if(open.has(r.item))d.open=true;d.addEventListener('toggle',()=>{d.open?open.add(r.item):open.delete(r.item);});
   const s=el('summary');const th=el('div','dth');try{th.appendChild(photoEl(r,false));}catch(e){}const l=el('div','dl');l.appendChild(el('span','dno',r.order_no||'—'));l.appendChild(el('span','dit',r.item));
   const ks=local?[1,2,3,7,8,9]:[1,2,3,4,5,6,7,8,9];const bar=el('div','dbar'+(local?' local':''));ks.forEach(i=>{bar.appendChild(el('i',i<st?'ok':(i===st?'now':'')));});l.appendChild(bar);
   const rt=el('div','dr');rt.appendChild(el('span','dpr',r.payout?inr(r.payout):''));rt.appendChild(el('span','dst'+(r.placed_by==='client'&&st<=1?' wait':''),r.placed_by==='client'&&st<=1?'Awaiting confirmation':((window.stName?window.stName(r,st):STAGES[st-1])||r.status||'')));
   s.appendChild(th);s.appendChild(l);s.appendChild(rt);d.appendChild(s);
   const b=el('div','db');const row=(k,v)=>{const x=el('div','dx');x.appendChild(el('span','k',k));x.appendChild(el('span','v',v));b.appendChild(x);};
   row('Type',local?'Local order':'International');row('Step',(local?(ks.indexOf(st)+1||ks.filter(x=>x<=st).length):st)+' of '+ks.length);if(r.brand)row('Brand',r.brand);if(!local)row('Origin',st>=3?'Shipped':'Pending');if(!local)row('Hub',st>=5?'Departed':(st>=4?'Received':'Awaiting'));if(local)row('Dispatch',st>=8?'Dispatched':(st>=3?'Item secured':'Pending'));else row('India',st>=8?'Out for delivery':(st>=6?'Landed':'In transit'));row('ETA',r.eta_date&&typeof fd==='function'?fd(r.eta_date):'—');
   const bt=el('button','btn2','Open order');bt.type='button';bt.addEventListener('click',()=>{try{openDrawer(r);}catch(e){}});b.appendChild(bt);d.appendChild(b);box.appendChild(d);});};
 render();dash.onData(render);
}
})();


/* Awaiting-confirmation alert (Overview) */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;};
const inr=v=>'₹'+Number(v||0).toLocaleString('en-IN');
let k=0;const t=setInterval(()=>{k++;let ok=false;try{ok=typeof dash!=='undefined'&&$('neworder');}catch(e){}if(ok){clearInterval(t);init();}else if(k>200)clearInterval(t);},150);
function init(){
 if($('await-alert'))return;const sec=el('section','card');sec.id='await-alert';sec.hidden=true;$('neworder').parentNode.insertBefore(sec,$('neworder'));
 const render=()=>{const o=dash.data('orders');sec.textContent='';const rows=o.status==='ok'?o.data.filter(r=>r.placed_by==='client'&&Number(r.stage||1)<=1):[];sec.hidden=!rows.length;if(!rows.length)return;
  sec.appendChild(el('h2',null,'Awaiting confirmation'));sec.appendChild(el('p','note','Luxella is verifying payment and availability. Expect confirmation within 24–48 hours, and an email the moment each one is confirmed.'));
  rows.forEach(r=>{const d=el('div','awt');const l=el('div');l.appendChild(el('span','dno',r.order_no||'—'));l.appendChild(el('span','dit',r.item));d.appendChild(l);d.appendChild(el('span','awb','Awaiting confirmation'));sec.appendChild(d);});};
 render();dash.onData(render);
}
})();

/* open the right tab from mail / push links (#tr, #pay, #ad, #al, #help, #ov, #msg, #st, #pol) */
(function(){
'use strict';
const go=()=>{const h=(location.hash||'').slice(1);if(!/^(ov|tr|al|pay|ad|msg|st|pol|help)$/.test(h))return false;const t=document.getElementById('tab-'+h);if(!t)return false;t.click();window.scrollTo(0,0);return true;};
let n=0;const t=setInterval(()=>{n++;let ok=false;try{ok=typeof dash!=='undefined'&&document.getElementById('tab-tr');}catch(e){}if(ok){clearInterval(t);setTimeout(go,500);window.addEventListener('hashchange',go);}else if(n>200)clearInterval(t);},150);
})();

/* Terms quick points, Payments pay-now card, Address helpers, scroll polish */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;};
const inr=v=>'₹'+Number(v||0).toLocaleString('en-IN');
const wait=(cond,cb,max)=>{let n=0;const t=setInterval(()=>{n++;let ok=false;try{ok=cond();}catch(e){}if(ok){clearInterval(t);cb();}else if(n>(max||200))clearInterval(t);},150);};
const toastM=t=>{try{if(window.alertMsg)window.alertMsg(t);}catch(e){}};

/* ---- Terms: 4-5 tappable key points ---- */
wait(()=>$('pane-pol')&&$('terms')&&typeof dash!=='undefined',()=>{
 if($('terms-quick'))return;
 const sec=el('section','card');sec.id='terms-quick';sec.appendChild(el('h2',null,'The short version'));sec.appendChild(el('p','note','Five things to know. Tap any to read the full clause.'));
 const pts=[['Pay first, then we order','Your order is placed once payment is verified.','payment'],['Confirmation in 24–48 hours','We verify payment and availability, then confirm.','confirm'],['Cancellation & refunds','If a store cancels, we re-source the piece or refund you in full.','cancel'],['Delivery & ETA','Estimates start from hub receipt. Courier delays are out of our hands.','deliver'],['Customs & unboxing','All-inclusive price. Record an unboxing video for any claim.','unbox']];
 pts.forEach(([h,s,kw])=>{const b=el('button','tqp');b.type='button';b.appendChild(el('span','tqh',h));b.appendChild(el('span','tqs',s));b.appendChild(el('span','tqa','›'));b.addEventListener('click',()=>{const q=$('pol-q');const w=$('terms');let hit=null;w.querySelectorAll('details.tsec').forEach(d=>{const sm=d.querySelector('summary');if(!hit&&sm&&(sm.textContent+' '+d.textContent.slice(0,400)).toLowerCase().includes(kw))hit=d;});if(hit){if(q){q.value='';q.dispatchEvent(new Event('input'));}hit.hidden=false;let p=hit;while(p&&p!==w){if(p.tagName==='DETAILS')p.open=true;p=p.parentElement;}setTimeout(()=>hit.scrollIntoView({behavior:'smooth',block:'start'}),60);hit.classList.add('tflash');setTimeout(()=>hit.classList.remove('tflash'),1800);}else if(q){q.value=kw;q.dispatchEvent(new Event('input'));w.scrollIntoView({behavior:'smooth'});}});sec.appendChild(b);});
 const pane=$('pane-pol');pane.insertBefore(sec,pane.firstChild);
});

/* ---- Payments: Pay now card ---- */
wait(()=>$('pane-pay')&&typeof dash!=='undefined'&&typeof photos!=='undefined',()=>{
 if($('paynow'))return;
 const sec=el('section','card');sec.id='paynow';const pane=$('pane-pay');pane.insertBefore(sec,pane.firstChild);
 const paidOf=r=>{try{return typeof paidAmt==='function'?paidAmt(r):0;}catch(e){return 0;}};
 const render=()=>{sec.textContent='';const o=dash.data('orders');const rows=o.status==='ok'?o.data:[];const due=rows.filter(r=>Number(r.payout||0)-paidOf(r)>0);const tot=due.reduce((s,r)=>s+Number(r.payout||0)-paidOf(r),0);const p=Object.assign({},photos.payinfo||{});if(!p.upi)p.upi='jeetnathavani37-1@okaxis';
  sec.appendChild(el('h2',null,'Pay now'));
  if(!due.length){sec.appendChild(el('p','note','Nothing due right now. Thank you.'));return;}
  sec.appendChild(el('div','pn-tot',inr(tot)));sec.appendChild(el('p','note','Pay with your own GPay or any UPI app, or use the details below. Then submit the payment so we can verify it.'));
  due.slice(0,5).forEach(r=>{const x=el('div','pn-row');x.appendChild(el('span',null,(r.order_no?r.order_no+' · ':'')+r.item));x.appendChild(el('b',null,inr(Number(r.payout||0)-paidOf(r))));sec.appendChild(x);});if(due.length>5)sec.appendChild(el('div','pn-row','+ '+(due.length-5)+' more in the statement below'));
  if(p.upi){const note='Luxella payment';const am=Math.round(tot);const ios=/iPhone|iPad|iPod/i.test(navigator.userAgent);
   const q='pa='+encodeURIComponent(p.upi)+'&pn=Luxella&am='+am+'&cu=INR&tn='+encodeURIComponent(note);
   const row=el('div','pn-btns');
   const g=el('a','btn','Pay with GPay');g.href=(ios?'gpay://upi/pay?':'tez://upi/pay?')+q;row.appendChild(g);
   const u=el('a','btn2','Other UPI app');u.href='upi://pay?'+q;row.appendChild(u);sec.appendChild(row);
   sec.appendChild(el('p','note pn-hint','In GPay, choose your bank account as the paying account (not UPI Lite) so the full payment goes through.'));}
  const dt=el('details','pn-det');dt.appendChild(el('summary',null,'Payment details'));const body=el('div','pn-body');
  if(p.upi){const im=el('img');im.src='assets/upi_qr.png';im.alt='Luxella UPI QR';body.appendChild(im);const c=el('div');c.appendChild(el('span','k','UPI ID'));const v=el('div','v',p.upi);c.appendChild(v);const cb=el('button','btn2','Copy UPI ID');cb.type='button';cb.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(p.upi);toastM('UPI ID copied');}catch(e){}});c.appendChild(cb);body.appendChild(c);}
  if(p.bank){const c=el('div','pn-bank');c.appendChild(el('span','k','Bank transfer'));const v=el('div','v',p.bank);v.style.whiteSpace='pre-wrap';c.appendChild(v);const cb=el('button','btn2','Copy bank details');cb.type='button';cb.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(p.bank);toastM('Bank details copied');}catch(e){}});c.appendChild(cb);body.appendChild(c);}
  if(!p.upi&&!p.bank)body.appendChild(el('span','lbl','Payment details will appear here once published.'));
  dt.appendChild(body);sec.appendChild(dt);
  const sub=el('button','btn2','Already paid? Submit payment');sub.type='button';sub.style.marginTop='12px';sub.addEventListener('click',()=>{const s=$('paysub');if(s)s.scrollIntoView({behavior:'smooth',block:'start'});});sec.appendChild(sub);};
 let lk='';const tick=()=>{const o=dash.data('orders');const k=JSON.stringify(photos.payinfo||{})+'|'+(o.status==='ok'?o.data.map(r=>r.item+r.payout+paidOf(r)).join(','):o.status);if(k!==lk){lk=k;render();}};tick();try{dash.onData(tick);}catch(e){}setInterval(tick,2000);
});

/* ---- Address: add new / use saved, sticky save ---- */
wait(()=>$('pane-ad')&&$('a-save')&&typeof photos!=='undefined',()=>{
 if($('ad-quick'))return;
 const form=$('a-addr').closest('.form');const bar=el('div','ad-quick');bar.id='ad-quick';
 const add=el('button','btn2','+ Add a new address');add.type='button';
 const sel=el('select');sel.id='ad-saved';sel.setAttribute('aria-label','Use a saved address');
 const fill=()=>{const book=Object.values(photos.book||{});const k=book.map(b=>b.label+b.address).join('|');if(sel.dataset.k===k)return;sel.dataset.k=k;sel.textContent='';const o0=el('option',null,book.length?'Use a saved address':'No saved address yet');o0.value='';sel.appendChild(o0);book.forEach((b,i)=>{const o=el('option',null,(b.label||'Address')+(b.isDefault?' (default)':'')+' — '+String(b.address||'').slice(0,40));o.value=String(i);sel.appendChild(o);});};
 sel.addEventListener('change',()=>{const book=Object.values(photos.book||{});const b=book[Number(sel.value)];if(!b)return;$('a-addr').value=b.address||'';if(b.phone)$('a-phone').value=b.phone;});
 add.addEventListener('click',()=>{$('a-addr').value='';$('a-phone').value='';$('a-pref').value='';sel.value='';$('a-addr').focus();form.scrollIntoView({behavior:'smooth',block:'center'});});
 bar.appendChild(add);bar.appendChild(sel);form.parentNode.insertBefore(bar,form);fill();
 try{dash.onData(fill);}catch(e){}setInterval(fill,2500);
 const sv=$('a-save').parentNode;sv.classList.add('ad-sticky');
});

/* ---- Tabs: stable horizontal scroll, centre active tab ---- */
wait(()=>document.querySelector('.sw .tabs')&&$('tab-ov'),()=>{
 const tabs=document.querySelector('.sw .tabs');
 tabs.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{try{const l=t.offsetLeft-(tabs.clientWidth-t.offsetWidth)/2;tabs.scrollTo({left:Math.max(0,l),behavior:'smooth'});}catch(e){}setTimeout(()=>{try{const pn=$(t.id.replace('tab-','pane-'));if(!pn)return;const y=pn.getBoundingClientRect().top+window.scrollY-tabs.offsetHeight-12;if(window.scrollY>y+4)window.scrollTo({top:Math.max(0,y),behavior:'smooth'});}catch(e){}},40);}));
});

/* ---- Luxurious scroll reveal ---- */
(function(){
 if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 if(!('IntersectionObserver' in window))return;
 const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('rv-in');io.unobserve(e.target);}});},{threshold:0,rootMargin:'0px 0px -40px 0px'});
 const seen=new WeakSet();
 const scan=()=>{document.querySelectorAll('.sw section.card, .sw .dep, .sw .ord, .sw .tiles .card, .sw .paytiles .card').forEach(e=>{if(seen.has(e)||e.closest('[hidden]'))return;seen.add(e);const r=e.getBoundingClientRect();if((r.top<window.innerHeight*.9&&r.bottom>0)||r.height>window.innerHeight*1.2){return;}e.classList.add('rv');io.observe(e);});};
 setInterval(scan,900);setInterval(()=>{document.querySelectorAll('.sw .rv:not(.rv-in)').forEach(e=>{const r=e.getBoundingClientRect();if(r.top<window.innerHeight&&r.bottom>0||r.height>window.innerHeight*1.5)e.classList.add('rv-in');});},1200);window.addEventListener('scroll',()=>{},{passive:true});
})();
})();

/* Good to know: headings visible, text in a dropdown */
(function(){const go=()=>{const ul=document.querySelector('.sw ul.gtk');if(!ul){return setTimeout(go,300);}if(ul.__g)return;ul.__g=1;
 ul.querySelectorAll(':scope>li').forEach(li=>{const b=li.querySelector('b'),s=li.querySelector('span');if(!b||!s)return;const d=document.createElement('details');d.className='gtkd';const sm=document.createElement('summary');sm.textContent=b.textContent;const p=document.createElement('p');p.textContent=s.textContent;d.appendChild(sm);d.appendChild(p);li.textContent='';li.appendChild(d);});};go();})();
