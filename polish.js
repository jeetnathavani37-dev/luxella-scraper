/* Luxella portal — polish layer: personalised welcome, tappable details, motion, device tilt. Loaded after app.js. */
(function(){
const RMQ=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;};
const sw=document.querySelector('.sw'); if(!sw) return;
const say=t=>{if(window.toast)window.toast(t);};
const LS={get(k){try{return JSON.parse(localStorage.getItem(k));}catch(e){return null;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
const client=()=>(window.LX_CLIENT&&window.LX_CLIENT.name)||'';
const first=()=>client().split(' ')[0]||'';
const owner=!!(window.lx&&window.lx.isOwner&&window.lx.isOwner());
const STAGES=['Order placed','Order confirmed','Shipped by retailer/outlet','Received at international hub','Shipped from international hub','Received at Indian warehouse','Address requested','Shipped from Indian warehouse','Delivered'];
const inr=v=>'₹'+new Intl.NumberFormat('en-IN').format(Math.round(Number(v)||0));
const slugKey=()=>'lx_seen_'+((window.lx&&window.lx.client()&&window.lx.client().slug)||'x');

/* ---------- scroll progress hairline ---------- */
const prog=el('div','lx-prog');document.body.appendChild(prog);
const onScroll=()=>{const h=document.documentElement;const max=h.scrollHeight-h.clientHeight;prog.style.transform='scaleX('+(max>0?h.scrollTop/max:0)+')';};
addEventListener('scroll',onScroll,{passive:true});onScroll();

/* ---------- monogram in top bar ---------- */
function monogram(){const top=document.getElementById('top');if(!top||top.querySelector('.mono'))return;const n=client();if(!n)return;const m=el('span','mono',n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase());m.title=n;const who=top.querySelector('.who');if(who)top.insertBefore(m,who);else top.appendChild(m);}

/* ---------- personal line under hero ---------- */
function personalLine(rows){let p=document.getElementById('lx-since');const sub=sw.querySelector('.hero .sub');if(!sub)return;if(!p){p=el('p','sub lx-since');p.id='lx-since';sub.parentNode.insertBefore(p,sub.nextSibling);}
 const dates=rows.map(r=>r.order_date).filter(Boolean).sort();const brands=new Set(rows.map(r=>r.brand).filter(Boolean));const delivered=rows.filter(r=>Number(r.stage)>=9).length;
 const since=dates[0]?new Date(dates[0]).toLocaleString('en-GB',{month:'long',year:'numeric'}):null;
 p.textContent='';if(since)p.appendChild(el('span',null,'With Luxella since '+since));
 p.appendChild(el('span','sep','·'));p.appendChild(el('span',null,rows.length+(rows.length===1?' piece':' pieces')+' · '+brands.size+(brands.size===1?' house':' houses')));
 if(delivered){p.appendChild(el('span','sep','·'));p.appendChild(el('span',null,delivered+' delivered'));}}

/* ---------- tappable numbers / emails anywhere in the page ---------- */
function linkify(root){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{if(!n.nodeValue||n.nodeValue.length<8)return NodeFilter.FILTER_REJECT;const p=n.parentNode;if(!p||/^(A|BUTTON|INPUT|TEXTAREA|SCRIPT|STYLE|SELECT|OPTION)$/.test(p.tagName)||p.closest('a,button,[contenteditable]'))return NodeFilter.FILTER_REJECT;return /(\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}|[\w.+-]+@[\w-]+\.[\w.]+/.test(n.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;}});
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 nodes.forEach(n=>{const re=/((?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5})|([\w.+-]+@[\w-]+\.[\w.]+)/g;const frag=document.createDocumentFragment();let last=0,m;const s=n.nodeValue;while((m=re.exec(s))){frag.appendChild(document.createTextNode(s.slice(last,m.index)));const a=el('a','tapl',m[0]);if(m[1]){const d=m[1].replace(/\D/g,'').replace(/^91/,'');a.href='https://wa.me/91'+d;a.target='_blank';a.rel='noopener';a.title='Open in WhatsApp';}else{a.href='mailto:'+m[2];}frag.appendChild(a);last=m.index+m[0].length;}frag.appendChild(document.createTextNode(s.slice(last)));n.parentNode.replaceChild(frag,n);});}
let linkT=null;const scheduleLinkify=()=>{clearTimeout(linkT);linkT=setTimeout(()=>{try{linkify(document.getElementById('pane-help')||sw);linkify(sw.querySelector('.hero')||sw);}catch(e){}},400);};

/* ---------- welcome-back sheet (what changed since your last visit) ---------- */
let sheetShown=false;
function welcome(rows){if(sheetShown||owner||!rows.length)return;sheetShown=true;
 const key=slugKey();const prev=LS.get(key);const now={at:Date.now(),stages:Object.fromEntries(rows.map(r=>[r.item,Number(r.stage)||1]))};
 const changes=[];if(prev&&prev.stages){rows.forEach(r=>{const was=prev.stages[r.item];const st=Number(r.stage)||1;if(was===undefined)changes.push({t:'New order added',d:r.item});else if(st>was)changes.push({t:STAGES[st-1],d:r.item});});}
 LS.set(key,now);
 const due=rows.filter(r=>r.payout_status==='Pending').reduce((s,r)=>s+(Number(r.payout)||0),0);
 const nextEta=rows.filter(r=>r.eta_date&&Number(r.stage)<9).map(r=>r).sort((a,b)=>a.eta_date<b.eta_date?-1:1)[0];
 const firstVisit=!prev;
 if(!firstVisit&&!changes.length&&!due)return; // nothing worth interrupting for
 const hour=new Date().getHours();const greet=hour<12?'Good morning':hour<17?'Good afternoon':'Good evening';
 const back=el('div','lx-sheet-back');const sh=el('div','lx-sheet');back.appendChild(sh);
 sh.appendChild(el('span','eyebrow',firstVisit?'Welcome to your private page':'Since your last visit'));
 sh.appendChild(el('h3',null,greet+(first()?', '+first():'')+'.'));
 if(firstVisit){sh.appendChild(el('p','lxp','Every Luxella order of yours lives here — tracking, payments, photos and the policy, updated as the piece moves. Keep the link private.'));}
 else if(changes.length){const ul=el('ul','lxul');changes.slice(0,5).forEach(c=>{const li=el('li');li.appendChild(el('b',null,c.t));li.appendChild(el('span',null,c.d));ul.appendChild(li);});sh.appendChild(ul);if(changes.length>5)sh.appendChild(el('p','lbl','+'+(changes.length-5)+' more on the Tracker'));}
 else sh.appendChild(el('p','lxp','No movement on your orders since you were last here.'));
 const row=el('div','lxrow');
 if(due){const b=el('button','btn','Pay '+inr(due));b.type='button';b.addEventListener('click',()=>{close();if(window.openPay)window.openPay();else document.getElementById('tab-pay').click();});row.appendChild(b);}
 if(nextEta){const b=el('button','btn2','Next arrival · '+new Date(nextEta.eta_date).toLocaleString('en-GB',{day:'numeric',month:'short'}));b.type='button';b.addEventListener('click',()=>{close();document.getElementById('tab-tr').click();});row.appendChild(b);}
 const x=el('button','btn2',changes.length?'See tracker':'Close');x.type='button';x.addEventListener('click',()=>{close();if(changes.length)document.getElementById('tab-tr').click();});row.appendChild(x);
 sh.appendChild(row);
 function close(){back.classList.remove('on');setTimeout(()=>back.remove(),RMQ?0:260);}
 back.addEventListener('click',e=>{if(e.target===back)close();});
 document.body.appendChild(back);requestAnimationFrame(()=>back.classList.add('on'));
 if(changes.length)document.title='('+changes.length+') '+document.title.replace(/^\(\d+\) /,'');}

/* ---------- device tilt (3D parallax on phones) ---------- */
function gyro(){if(RMQ||!('DeviceOrientationEvent' in window))return;let armed=false;const arm=()=>{if(armed)return;armed=true;const go=()=>addEventListener('deviceorientation',onTilt,{passive:true});if(typeof DeviceOrientationEvent.requestPermission==='function'){DeviceOrientationEvent.requestPermission().then(s=>{if(s==='granted')go();}).catch(()=>{});}else go();};
 addEventListener('touchstart',arm,{once:true,passive:true});
 let raf=null,g=0,b=0;function onTilt(e){g=e.gamma||0;b=e.beta||0;if(raf)return;raf=requestAnimationFrame(()=>{raf=null;const rx=Math.max(-6,Math.min(6,(b-45)/8)),ry=Math.max(-6,Math.min(6,g/8));sw.querySelectorAll('img.ph,.hlogo,.brandlogo,#clogo img').forEach(n=>{n.style.transform='perspective(700px) rotateX('+(-rx)+'deg) rotateY('+ry+'deg)';});});}}

/* ---------- press feedback + one-time wordmark shimmer ---------- */
function shimmer(){const l=sw.querySelector('.hlogo');if(!l||RMQ)return;l.classList.add('shine');setTimeout(()=>l.classList.remove('shine'),2600);}

/* ---------- boot ---------- */
let booted=false;
window.dash.onData(()=>{const o=window.dash.data('orders');if(o.status!=='ok')return;const rows=o.data||[];monogram();personalLine(rows);scheduleLinkify();if(!booted){booted=true;setTimeout(()=>welcome(rows),900);shimmer();gyro();}});
new MutationObserver(()=>scheduleLinkify()).observe(document.getElementById('pane-help')||sw,{childList:true,subtree:true});
})();
