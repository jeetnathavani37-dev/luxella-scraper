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
 const card=$('neworder');if(card.dataset.b)return;card.dataset.b=1;const root=el('div','nwo-body');const fold=el('details','nwo-fold');const fs=el('summary');const ft=el('div','nwo-ft');ft.appendChild(el('h2',null,'Place a new order'));ft.appendChild(el('p','note','Share the piece, delivery and payment in 4 quick steps. We confirm by email.'));fs.appendChild(ft);fs.appendChild(el('span','nwo-chev','+'));fold.appendChild(fs);fold.appendChild(root);card.textContent='';card.appendChild(fold);
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
 panes[0].appendChild(f1);
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
 const mrf=mk('Reference / UTR','input',{type:'text',placeholder:'Transaction ID',autocomplete:'off'},0);F.ref=mrf.i;f3.appendChild(mrf.l);
 const msc=mk('Payment screenshot (optional)','input',{type:'file',accept:'image/*'},1);F.file=msc.i;f3.appendChild(msc.l);
 panes[2].appendChild(f3);
 const pi=el('div','payinline');panes[2].appendChild(pi);
 const payNote=el('p','note','Pay first using the details above, then enter the amount and reference. Luxella verifies it against the account and confirms here. Until then it shows as pending.');panes[2].appendChild(payNote);
 /* 4 review */
 const rv=el('div','nwo-rev');panes[3].appendChild(rv);
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
  if(s===2){const pr=Number(val('price'));if(!(pr>0))return 'Enter the agreed price.';if(paidMode()){const pd=Number(val('paid'));if(!(pd>0))return 'Enter the amount you paid, or choose "Pay after confirmation".';if(pd>pr)return 'Paid amount is more than the price.';if(val('ref').length<6)return 'Add the transaction reference (at least 6 characters).';}}
  return '';};
 const later=()=>F.addr.value==='__later';const addrText=()=>later()?'To be shared later':(F.addr.value==='__new'?val('newaddr'):F.addr.value);
 const review=()=>{rv.textContent='';const row=(k,v)=>{const r=el('div','nwo-r');r.appendChild(el('span','k',k));r.appendChild(el('span','v',v));rv.appendChild(r);};
  const pr=Number(val('price')),pd=paidMode()?Number(val('paid')||0):0;
  row('Piece',val('item')+(val('brand')?' ('+val('brand')+')':''));row('Size / colour',val('size')||'—');row('Qty',val('qty')||'1');if(val('link'))row('Link',val('link'));if(val('notes'))row('Notes',val('notes'));
  row('Deliver to',later()?'Decide later (we will ask before dispatch)':addrText()+' · '+val('phone'));row('Price',inr(pr));row('Paying by',F.pay.value);
  if(pd){row('Paid now',inr(pd)+' · ref '+val('ref'));row('Balance',inr(Math.max(0,pr-pd)));}else row('Balance',inr(pr)+' (to pay after confirmation)');};
 const render=()=>{panes.forEach((p,i)=>p.hidden=i!==S.step);[...prog.children].forEach((s,i)=>{s.className=i===S.step?'on':i<S.step?'ok':'';});back.hidden=S.step===0;next.textContent=S.step===3?'Place order':'Continue';if(S.step===3)review();msg.textContent='';};
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
   await window.lx.saveOrder(name,{item:name,order_no:no,order_date:today,brand:val('brand'),size:val('size'),qty:Number(val('qty')||1),product_link:val('link'),client_notes:val('notes'),delivery_address:address,delivery_phone:later()?'':val('phone'),delivery_later:later(),order_type:'ETA',direct:'Direct to client',payout:price,payout_status:'Pending',placed_by:(window.lx&&window.lx.isOwner&&window.lx.isOwner()?'owner':'client'),stage:1,status:'Order placed',eta_date:'',shipping_date:'',intl_tracking_no:'',intl_courier:'',intl_courier_slug:'',local_tracking:'',local_courier:'',local_courier_slug:''});
   if(!later())try{await photos.db.doc('addresses/'+pslug(name)).set({order:name,address,phone:val('phone'),pref:'',savedAt:today});}catch(e){}
   if(F.addr.value==='__new'){try{await photos.db.collection('addressbook').add({label:'Address '+(addrList().length+1),phone:val('phone'),address,isDefault:!addrList().length,at:today});}catch(e){}}
   if(paid){const id='ps-'+hash(name+'|'+paid+'|'+val('ref').toLowerCase());try{await photos.db.doc('paysub/'+id).set({id,order:name,amount:paid,method:F.pay.value,ref:val('ref'),proof,status:'Pending verification',at:new Date().toISOString()});}catch(e){say('Order placed, but the payment note did not save. Please submit it in Payments.');}}
   const pf=F.photo.files&&F.photo.files[0];if(pf){try{if(pf.size>8*1024*1024)throw new Error('big');const a=await photos.assets.upload(pf);await photos.db.doc('photos/'+pslug(name)).set({order:name,id:a.id,url:a.url,at:today});}catch(e){say('Order placed, but the photo did not upload. Add it from the order.');}}
   S.done={no,name,paid,price};
   panes.forEach(p=>p.hidden=true);prog.hidden=nav.hidden=true;intro.hidden=true;
   doneBox.hidden=false;doneBox.textContent='';
   doneBox.appendChild(el('div','nwo-tick','✓'));doneBox.appendChild(el('h3',null,'Order placed · '+no));
   doneBox.appendChild(el('p','note',name+' · '+inr(price)+(paid?' · '+inr(paid)+' payment submitted, pending verification':' · payment pending')+'. A confirmation email is on its way to you.'));
   const row=el('p','nwo-nav');const v=el('button','btn','View in Orders');v.type='button';v.addEventListener('click',()=>{const t=$('tab-al');if(t)t.click();window.scrollTo(0,0);});const again=el('button','btn2','Place another order');again.type='button';again.addEventListener('click',()=>{Object.keys(F).forEach(k=>{if(F[k].type==='file')F[k].value='';else if(F[k].tagName!=='SELECT')F[k].value='';});F.qty.value='1';tc.checked=false;S.step=0;S.done=null;doneBox.hidden=true;prog.hidden=nav.hidden=intro.hidden=false;next.disabled=false;S.busy=false;render();});row.appendChild(v);row.appendChild(again);doneBox.appendChild(row);
   S.busy=false;
  }catch(e){msg.textContent='Could not place the order. Your details are kept, try again.';S.busy=false;next.disabled=false;}
 };
 const owner=window.lx&&window.lx.isOwner&&window.lx.isOwner();
 if(owner){const sh=el('button','btn2','Copy client link');sh.type='button';sh.addEventListener('click',async()=>{const q=new URLSearchParams();[['item','item'],['brand','brand'],['size','size'],['qty','qty'],['link','link'],['notes','notes'],['price','price']].forEach(([k,f])=>{const v=val(f);if(v&&!(k==='qty'&&v==='1'))q.set(k,v);});const u=location.origin+location.pathname+(q.toString()?'?'+q:'')+'#new';try{await navigator.clipboard.writeText(u);msg.textContent='Client link copied.';}catch(e){msg.textContent=u;}});nav.insertBefore(sh,msg);}
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
   const s=el('summary');const l=el('div','dl');l.appendChild(el('span','dno',r.order_no||'—'));l.appendChild(el('span','dit',r.item));
   const rt=el('div','dr');rt.appendChild(el('span','dpr',r.payout?inr(r.payout):''));rt.appendChild(el('span','dst',STAGES[st-1]||r.status||''));
   s.appendChild(l);s.appendChild(rt);d.appendChild(s);
   const b=el('div','db');const row=(k,v)=>{const x=el('div','dx');x.appendChild(el('span','k',k));x.appendChild(el('span','v',v));b.appendChild(x);};
   row('Step',st+' of 9');if(r.brand)row('Brand',r.brand);row('Origin',st>=3?'Shipped':'Pending');if(!local)row('Hub',st>=5?'Departed':(st>=4?'Received':'Awaiting'));row('India',st>=8?'Out for delivery':(st>=6?'Landed':'In transit'));row('ETA',r.eta_date&&typeof fd==='function'?fd(r.eta_date):'—');
   const bt=el('button','btn2','Open order');bt.type='button';bt.addEventListener('click',()=>{try{openDrawer(r);}catch(e){}});b.appendChild(bt);d.appendChild(b);box.appendChild(d);});};
 render();dash.onData(render);
}
})();
