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
function tidyOrders(){const tb=$('#ordT tbody');if(!tb)return;[...tb.querySelectorAll('tr:not(.grp)')].forEach(tr=>{if(tr.dataset.ui2)return;tr.dataset.ui2=1;tr.classList.add('oc2');
  [...tr.children].forEach((td,i)=>{const t=(td.textContent||'').trim();if((t===''||t==='—'||t==='-')&&i>3&&i!==7&&i!==14)td.classList.add('e2');if(i===10||i===13)td.style.setProperty('grid-column','1 / -1','important');});
  tr.addEventListener('click',e=>{if(e.target.closest('a,button,input,select,label,.brand'))return;const name=(tr.children[2]&&tr.children[2].textContent||'').trim();const r=ORD().find(x=>String(x.item||'').trim()===name);if(r)openR(r);});});}
try{new MutationObserver(()=>tidyOrders()).observe(document.body,{childList:true,subtree:true});}catch(e){}
tidyOrders();
})();
