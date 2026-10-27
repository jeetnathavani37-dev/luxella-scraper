/* Action needed banner (clients only) */
(function(){
 if(typeof photos==='undefined'||photos.canEdit||typeof dash==='undefined')return;
 const $=id=>document.getElementById(id);
 const paid=r=>{try{return paidAmt(r);}catch(e){return 0;}};
 const inr=n=>'₹'+Number(n).toLocaleString('en-IN');
 function build(){
  const o=dash.data('orders');if(o.status!=='ok')return [];
  const rows=o.data.filter(r=>!/cancel/i.test(String(r.status||''))&&Number(r.stage||1)<9);
  const out=[];
  const due=o.data.filter(r=>!/cancel/i.test(String(r.status||''))&&Number(r.payout||0)-paid(r)>0);
  if(due.length){const t=due.reduce((s,r)=>s+Number(r.payout||0)-paid(r),0);out.push({k:'Payment due',t:inr(t)+' across '+due.length+' order'+(due.length>1?'s':''),b:'Pay now',tab:'tab-pay'});}
  const ad=rows.filter(r=>Number(r.stage||1)===7);
  if(ad.length)out.push({k:'Delivery address needed',t:ad.length+' order'+(ad.length>1?'s':'')+' ready to dispatch once we have your address',b:'Add address',tab:'tab-tr'});
  const cf=rows.filter(r=>Number(r.stage||1)===8);
  if(cf.length)out.push({k:'Confirm your delivery',t:'Has '+(cf.length>1?'any of these':'this')+' reached you?',b:'Open tracker',tab:'tab-tr'});
  return out;
 }
 function render(){
  const pane=$('pane-ov');if(!pane)return;let w=$('actionbar');
  const items=build();
  if(!items.length){if(w)w.remove();return;}
  if(!w){w=document.createElement('section');w.id='actionbar';w.className='actionbar';pane.insertBefore(w,pane.firstChild);}
  w.textContent='';
  const h=document.createElement('div');h.className='ab-h';h.textContent='Action needed';w.appendChild(h);
  items.forEach(x=>{const row=document.createElement('div');row.className='ab-r';const l=document.createElement('div');l.className='ab-l';const a=document.createElement('b');a.textContent=x.k;const s=document.createElement('span');s.textContent=x.t;l.appendChild(a);l.appendChild(s);const bt=document.createElement('button');bt.type='button';bt.className='ab-b';bt.textContent=x.b;bt.addEventListener('click',()=>{const t=$(x.tab);if(t)t.click();window.scrollTo({top:0,behavior:'smooth'});});row.appendChild(l);row.appendChild(bt);w.appendChild(row);});
 }
 render();dash.onData(render);
})();
