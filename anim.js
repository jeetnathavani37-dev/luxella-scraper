/* Luxella motion layer: shimmer, stagger, count-up, stage moments, ripple, tab transitions, payment success */
(function(){
 const RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;if(RM)return;
 const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
 const store={get(k){try{return JSON.parse(localStorage.getItem(k)||'null');}catch(e){return null;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
 const client=()=>{try{return (window.lx&&window.lx.client&&window.lx.client().slug)||location.pathname.split('/')[1]||'x';}catch(e){return 'x';}};
 document.documentElement.classList.add('lxm');
 /* 1. headline shimmer once per session */
 try{if(!sessionStorage.getItem('lxsh')){sessionStorage.setItem('lxsh','1');const h=$('#h1');if(h){h.classList.add('lx-sheen');setTimeout(()=>h.classList.remove('lx-sheen'),2600);}}}catch(e){}
 /* 2 + 6. pane transitions with staggered children */
 const ITEMS='.ord,.oc2,.pc2-i,.ab-r,.dpill,.card,.rts-i,#ordT tbody tr';
 function enter(p){if(!p||p.hidden)return;p.classList.remove('lx-pin');void p.offsetWidth;p.classList.add('lx-pin');
  let i=0;p.querySelectorAll(ITEMS).forEach(el=>{const r=el.getBoundingClientRect();if(r.top>innerHeight*1.2||r.height===0)return;el.classList.remove('lx-st');void el.offsetWidth;el.style.animationDelay=Math.min(i++,10)*55+'ms';el.classList.add('lx-st');});}
 $$('[id^="pane-"]').forEach(p=>{new MutationObserver(m=>{if(m.some(x=>x.attributeName==='hidden')&&!p.hidden)enter(p);}).observe(p,{attributes:true,attributeFilter:['hidden']});});
 setTimeout(()=>enter($('[id^="pane-"]:not([hidden])')),300);
 /* 3. count-up for the action banner and payment totals */
 const CT=new Set();function count(el){if(el.dataset.lxc)return;if(CT.has(el.textContent)){el.dataset.lxc='1';return;}CT.add(el.textContent);const m=/^(.*?₹)([\d,]+)(.*)$/.exec(el.textContent||'');if(!m)return;el.dataset.lxc='1';const to=Number(m[2].replace(/,/g,''));if(!to)return;const t0=performance.now(),d=1100;const f=t=>{const k=Math.min(1,(t-t0)/d),e=1-Math.pow(1-k,3);el.textContent=m[1]+Math.round(to*e).toLocaleString('en-IN')+m[3];if(k<1)requestAnimationFrame(f);};requestAnimationFrame(f);}
 /* 5. ripple + press */
 document.addEventListener('pointerdown',e=>{const b=e.target.closest&&e.target.closest('button,.btn,.btn2,a.chip,.ab-b,.stbtn');if(!b||b.disabled)return;const r=b.getBoundingClientRect();const s=document.createElement('span');s.className='lx-rip';const d=Math.max(r.width,r.height)*2;s.style.cssText='width:'+d+'px;height:'+d+'px;left:'+(e.clientX-r.left-d/2)+'px;top:'+(e.clientY-r.top-d/2)+'px';if(getComputedStyle(b).position==='static')b.style.position='relative';b.style.overflow='hidden';b.appendChild(s);setTimeout(()=>s.remove(),650);},{passive:true});
 /* toast */
 function toast(t,sub){const w=document.createElement('div');w.className='lx-toast';const b=document.createElement('b');b.textContent=t;w.appendChild(b);if(sub){const s=document.createElement('span');s.textContent=sub;w.appendChild(s);}document.body.appendChild(w);requestAnimationFrame(()=>w.classList.add('in'));setTimeout(()=>{w.classList.remove('in');setTimeout(()=>w.remove(),500);},4200);}
 /* 4 + 7. stage moments and payment success (compared with this device's last visit) */
 let done=false;
 function moments(){if(done||typeof dash==='undefined')return;const o=dash.data('orders');if(o.status!=='ok')return;done=true;
  const own=(()=>{try{return !!photos.canEdit;}catch(e){return false;}})();const key='lxmo:'+client();const prev=store.get(key);const now={};
  const name=(r,k)=>{try{return stName(r,k);}catch(e){return '';}};
  const paidOf=r=>{try{return paidAmt(r)>=Number(r.payout||0)&&Number(r.payout||0)>0;}catch(e){return r.payout_status==='Received';}};
  o.data.forEach(r=>{now[r.item]={s:Number(r.stage||1),p:paidOf(r)};});store.set(key,now);
  if(!prev||own)return;
  const moved=o.data.filter(r=>prev[r.item]&&Number(r.stage||1)>prev[r.item].s&&Number(r.stage||1)<9);
  const paid=o.data.filter(r=>prev[r.item]&&!prev[r.item].p&&now[r.item].p);
  if(moved.length){const r=moved[0];setTimeout(()=>toast((r.order_no?r.order_no+' · ':'')+'Your order moved forward',(Number(r.stage)===5?'✈ ':'')+name(r,Number(r.stage||1))+(moved.length>1?' · and '+(moved.length-1)+' more':'')),1600);
   window.__lxMoved=new Set(moved.map(r=>r.item));}
  if(paid.length){window.__lxPaid=new Set(paid.map(r=>r.item));setTimeout(()=>toast('Payment received ✓',paid.map(r=>r.order_no||r.item).join(', ')+' marked as paid. Thank you.'),moved.length?6000:1600);}
 }
 /* decorate rendered DOM repeatedly (renders are frequent) */
 function deco(){
  $$('.ab-l span').forEach(count);
  if(window.__lxMoved)$$('#tracker .ord').forEach(c=>{const t=c.querySelector('.otitle');if(t&&window.__lxMoved.has(t.textContent)&&!c.classList.contains('lx-moved')){c.classList.add('lx-moved');}});
  if(window.__lxPaid)$$('.pc2-i,.stbtn').forEach(x=>{});
  $$('.stbtn:not(.due)').forEach(b=>{if(b.dataset.lxp)return;b.dataset.lxp='1';b.classList.add('lx-paid');});
 }
 try{dash.onData(()=>{moments();setTimeout(deco,60);});}catch(e){}
 setInterval(deco,1500);setTimeout(()=>{moments();deco();},400);
})();
