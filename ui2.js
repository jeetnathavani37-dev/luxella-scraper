/* Luxella client portal — UI v2: sticky fix, payment cards, compact orders. Loaded after app.js on client pages. */
(function(){
if(window.__ui2)return;window.__ui2=1;
const $=s=>document.querySelector(s);
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;};
const money=v=>'₹'+new Intl.NumberFormat('en-IN').format(Math.round(Number(v)||0));
const fdate=s=>{if(!s)return '';const d=new Date(String(s).slice(0,10)+'T00:00:00');return isNaN(d)?'':d.toLocaleDateString('en-IN',{day:'numeric',month:'short'});};

/* 1 · sticky tabs: no gap between top bar, tabs and the mini strip */
const setH=()=>{const t=$('.sw .tabs');if(t)document.documentElement.style.setProperty('--tabsH',Math.round(t.getBoundingClientRect().height)+'px');};
setH();window.addEventListener('resize',setH);try{const ro=new ResizeObserver(setH);const t=$('.sw .tabs');if(t)ro.observe(t);}catch(e){}
setInterval(setH,2000);
const glue=()=>{const t=$('.sw .tabs'),m=$('.sw .mini');if(!t||!m)return;const r=t.getBoundingClientRect();const tt=parseFloat(getComputedStyle(t).top)||0;if(r.top<=tt+80){m.style.setProperty('top',Math.round(r.bottom-1)+'px','important');}};
window.addEventListener('scroll',glue,{passive:true});window.addEventListener('resize',glue);setTimeout(glue,500);

/* 2 · Payments as cards (Paid = green, Due = red, Part = amber); tap → full order with photos */
const ORD=()=>{try{const o=dash.data('orders');return o&&o.status==='ok'?o.data:[];}catch(e){return [];}};
const paid=r=>{try{return paidAmt(r);}catch(e){return r.payout_status==='Received'?Number(r.payout||0):0;}};
const pic=r=>{try{return photoUrl(r);}catch(e){return r.photo_url||'';}};
const openR=r=>{try{openDrawer(r);}catch(e){}};
let PF='all';
function payCards(){const pane=$('#pane-pay');if(!pane)return;let w=$('#pc2');if(!w){w=el('section','card pc2-wrap');w.id='pc2';pane.insertBefore(w,pane.firstChild);
  const st=$('#ledger');const sec=st&&st.closest('section');if(sec&&!sec.closest('details')){const d=el('details','st2');const sm=el('summary',null,'Statement (table view)');d.appendChild(sm);sec.parentNode.insertBefore(d,sec);d.appendChild(sec);}}
 const rows=ORD().filter(r=>Number(r.payout||0)>0||r.item);const tot=rows.reduce((t,r)=>t+Number(r.payout||0),0);const pd=rows.reduce((t,r)=>t+Math.min(paid(r),Number(r.payout||0)||paid(r)),0);const due=Math.max(0,tot-pd);
 w.textContent='';const h=el('div','pc2-h');h.appendChild(el('h2',null,'Your payments'));w.appendChild(h);
 const sum=el('div','pc2-sum');[['Paid',money(pd),'ok'],['Due',money(due),due>0?'bad':'ok'],['Total',money(tot),'']].forEach(([a,b,c])=>{const d=el('div','pc2-s '+c);d.appendChild(el('span',null,a));d.appendChild(el('b',null,b));sum.appendChild(d);});w.appendChild(sum);
 const bar=el('div','pc2-bar');const fi=el('i');fi.style.width=(tot?Math.round(pd/tot*100):0)+'%';bar.appendChild(fi);w.appendChild(bar);
 const ch=el('div','pc2-ch');[['all','All'],['due','Due'],['paid','Paid']].forEach(([k,t])=>{const n=rows.filter(r=>k==='all'||(k==='due'?paid(r)<Number(r.payout||0):paid(r)>=Number(r.payout||0)&&Number(r.payout||0)>0)).length;const b=el('button','pc2-c'+(PF===k?' on':''),t+' · '+n);b.type='button';b.onclick=()=>{PF=k;payCards();};ch.appendChild(b);});w.appendChild(ch);
 const list=rows.filter(r=>PF==='all'||(PF==='due'?paid(r)<Number(r.payout||0):paid(r)>=Number(r.payout||0)&&Number(r.payout||0)>0)).sort((a,b)=>{const da=paid(a)<Number(a.payout||0)?0:1,db=paid(b)<Number(b.payout||0)?0:1;return da-db||String(b.order_date||'').localeCompare(String(a.order_date||''));});
 const g=el('div','pc2-g');if(!list.length)g.appendChild(el('p','note','Kuch nahi.'));
 list.forEach(r=>{const amt=Number(r.payout||0),p=paid(r);const st=amt&&p>=amt?'paid':p>0?'part':'due';const c=el('button','pc2-i '+st);c.type='button';
  const ph=el('div','pc2-ph');const u=pic(r);if(u){const im=el('img');im.src=u;im.alt='';im.loading='lazy';ph.appendChild(im);}else ph.textContent='—';c.appendChild(ph);
  const mid=el('div','pc2-m');mid.appendChild(el('b',null,r.item||'Order'));mid.appendChild(el('small',null,[r.order_no,fdate(r.order_date),r.status].filter(Boolean).join(' · ')));
  const tg=el('span','pc2-t '+st,st==='paid'?'✓ Paid'+(r.payment_date?' · '+fdate(r.payment_date):''):st==='part'?'Part paid · '+money(p):'Due');mid.appendChild(tg);c.appendChild(mid);
  const rt=el('div','pc2-a');rt.appendChild(el('b',null,money(amt)));if(st!=='paid'&&amt)rt.appendChild(el('small',null,money(amt-p)+' due'));c.appendChild(rt);
  c.onclick=()=>openR(r);g.appendChild(c);});w.appendChild(g);}
if(typeof window.renderLedger==='function'){const orig=window.renderLedger;window.renderLedger=function(o){orig.apply(this,arguments);try{payCards();}catch(e){}};}
setTimeout(()=>{try{payCards();}catch(e){}},600);

/* 3 · Orders: compact cards — empty fields hidden, whole card opens the full order */

const SVG_SHARE='<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="M8.3 10.8l7.4-4.4M8.3 13.2l7.4 4.4"/></svg>';
const SVG_WA='<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2s.2-1.1.1-1.2-.2-.2-.4-.3z"/></svg>';
function orderText(r){const L=['Luxella · Order '+(r.order_no||''),r.item||''];if(r.status)L.push('Status: '+r.status);if(r.eta_date)L.push('ETA: '+fdate(r.eta_date));if(r.payout)L.push('Amount: '+money(r.payout)+(r.payout_status==='Received'?' (paid)':' (due)'));const it=r.intl_tracking_no,lt=r.local_tracking;if(lt)L.push('Tracking: https://track.aftership.com/'+encodeURIComponent(String(lt).split(' ')[0]));else if(it)L.push('Tracking: https://track.aftership.com/'+encodeURIComponent(String(it).split(' ')[0]));L.push(location.origin+location.pathname);return L.filter(Boolean).join('\\n');}
function addIcons(tr){if(tr.querySelector('.oc2-ic'))return;const name=(tr.children[2]&&tr.children[2].textContent||'').trim();const r=ORD().find(x=>String(x.item||'').trim()===name)||{item:name};
 const box=el('div','oc2-ic');const sh=el('button','oc2-b');sh.type='button';sh.title='Share';sh.setAttribute('aria-label','Share order');sh.innerHTML=SVG_SHARE;
 sh.onclick=async e=>{e.stopPropagation();const t=orderText(r);try{if(navigator.share){await navigator.share({title:'Luxella · '+(r.item||'Order'),text:t});return;}}catch(x){return;}try{await navigator.clipboard.writeText(t);sh.classList.add('ok');setTimeout(()=>sh.classList.remove('ok'),1200);}catch(x){}};
 const wa=el('a','oc2-b wa');wa.target='_blank';wa.rel='noopener';wa.title='WhatsApp';wa.setAttribute('aria-label','WhatsApp');wa.innerHTML=SVG_WA;const ex=tr.querySelector('a.chip.wal');wa.href=ex?ex.href:'https://wa.me/?text='+encodeURIComponent(orderText(r));wa.onclick=e=>e.stopPropagation();
 box.append(sh,wa);tr.appendChild(box);}
function tidyOrders(){const tb=$('#ordT tbody');if(!tb)return;[...tb.querySelectorAll('tr:not(.grp)')].forEach(tr=>{if(tr.dataset.ui2)return;tr.dataset.ui2=1;tr.classList.add('oc2');
  [...tr.children].forEach((td,i)=>{const t=(td.textContent||'').trim();if((t===''||t==='—'||t==='-')&&i>3&&i!==7&&i!==14)td.classList.add('e2');if(i===10||i===13)td.style.setProperty('grid-column','1 / -1','important');});
  addIcons(tr);tr.addEventListener('click',e=>{if(e.target.closest('a,button,input,select,label,.brand,.oc2-ic'))return;const name=(tr.children[2]&&tr.children[2].textContent||'').trim();const r=ORD().find(x=>String(x.item||'').trim()===name);if(r)openR(r);});});}
try{new MutationObserver(()=>tidyOrders()).observe(document.body,{childList:true,subtree:true});}catch(e){}
tidyOrders();
})();
