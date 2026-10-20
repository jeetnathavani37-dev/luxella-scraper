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


/* ---------- push notifications ---------- */
const PUSH_FN='https://qzripzgbstvxkfobzhyv.supabase.co/functions/v1/lx-push';
const b64=(s)=>{const p='='.repeat((4-s.length%4)%4);const r=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(r,c=>c.charCodeAt(0));};
const pushSupported=()=>'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
const isIOS=/iPhone|iPad|iPod/.test(navigator.userAgent);
const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
let swReg=null;
async function swReady(){if(swReg)return swReg;if(!('serviceWorker' in navigator))return null;try{swReg=await navigator.serviceWorker.register('sw.js',{scope:'./'});await navigator.serviceWorker.ready;return swReg;}catch(e){return null;}}
async function pushState(){if(!pushSupported())return 'unsupported';if(Notification.permission==='denied')return 'denied';const r=await swReady();if(!r)return 'unsupported';const s=await r.pushManager.getSubscription();return s?'on':'off';}
async function pushOn(){const r=await swReady();if(!r)throw new Error('Not supported here');const perm=await Notification.requestPermission();if(perm!=='granted')throw new Error('Permission not given');
 const {key}=await (await fetch(PUSH_FN+'?vapid=1')).json();let sub=await r.pushManager.getSubscription();if(!sub)sub=await r.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64(key)});
 const {data:{session}}=await window.sb.auth.getSession();const email=(session&&session.user.email||'').toLowerCase();const c=window.lx&&window.lx.client();
 const row={client_id:owner?null:(c&&c.id)||null,user_email:email,endpoint:sub.endpoint,sub:sub.toJSON(),ua:navigator.userAgent.slice(0,160)};
 const res=await window.sb.from('lx_push_subs').upsert(row,{onConflict:'endpoint'});if(res.error)throw new Error(res.error.message);
 }
async function pushOff(){const r=await swReady();const sub=r&&await r.pushManager.getSubscription();if(sub){await window.sb.from('lx_push_subs').delete().eq('endpoint',sub.endpoint);await sub.unsubscribe();}}
function bellUI(){const top=document.getElementById('top');if(!top||top.querySelector('.bellb'))return;const b=el('button','bellb');b.type='button';b.title='Order notifications';b.setAttribute('aria-label','Order notifications');top.insertBefore(b,top.querySelector('#tb-switch')||top.querySelector('#tb-out'));
 const paint=async()=>{const st=await pushState();b.dataset.st=st;b.textContent=st==='on'?'Alerts on':st==='denied'?'Alerts blocked':'Alerts';};paint();
 b.addEventListener('click',async()=>{const st=await pushState();if(st==='unsupported'){say(isIOS&&!standalone()?'On iPhone: Share → Add to Home Screen, then open from there to enable alerts.':'Notifications are not supported in this browser.');return;}if(st==='denied'){say('Notifications are blocked for this site in your browser settings.');return;}try{if(st==='on'){await pushOff();say('Alerts turned off.');}else{await pushOn();say('You will be notified at every order update.');}}catch(e){say(e.message||'Could not change alerts.');}paint();});}
async function pushNudge(rows){if(owner||!rows.length)return false;const snooze=LS.get('lx_push_snooze');if(snooze&&Date.now()<snooze)return false;const st=await pushState();if(st==='on'||st==='denied')return false;
 const needHome=isIOS&&!standalone();if(st==='unsupported'&&!needHome)return false;
 const back=el('div','lx-sheet-back');const sh=el('div','lx-sheet');back.appendChild(sh);sh.appendChild(el('span','eyebrow','Turn on notifications'));sh.appendChild(el('h3',null,'Know the moment your order moves'+(first()?', '+first():'')+'.'));
 if(needHome){sh.appendChild(el('p','lxp','On iPhone, notifications work once this page is on your Home Screen: tap Share → Add to Home Screen, open Luxella from there, and tap Turn on alerts.'));}
 else sh.appendChild(el('p','lxp','One tap. A quiet notification on this device when a piece is confirmed, shipped, lands in India, is out for delivery or delivered — and when Luxella leaves you a note. Nothing promotional, ever.'));
 const row=el('div','lxrow');
 if(!needHome){const ok=el('button','btn','Turn on alerts');ok.type='button';ok.addEventListener('click',async()=>{ok.disabled=true;ok.textContent='Turning on…';try{await pushOn();say('Alerts on. You will hear about every update.');const bb=document.querySelector('.bellb');if(bb)bb.remove();bellUI();close();}catch(e){ok.disabled=false;ok.textContent='Turn on alerts';say(e.message||'Could not turn on.');if(Notification.permission==='denied')close();}});row.appendChild(ok);}
 else{const ok=el('button','btn','Got it');ok.type='button';ok.addEventListener('click',()=>{LS.set('lx_push_snooze',Date.now()+864e5);close();});row.appendChild(ok);}
 const no=el('button','btn2','Not now');no.type='button';no.addEventListener('click',()=>{LS.set('lx_push_snooze',Date.now()+3*864e5);close();});row.appendChild(no);sh.appendChild(row);
 function close(){back.classList.remove('on');setTimeout(()=>back.remove(),RMQ?0:260);}
 document.body.appendChild(back);requestAnimationFrame(()=>back.classList.add('on'));return true;}

/* ---------- boot ---------- */
let booted=false;
window.dash.onData(()=>{const o=window.dash.data('orders');if(o.status!=='ok')return;const rows=o.data||[];monogram();personalLine(rows);scheduleLinkify();if(!booted){booted=true;bellUI();shimmer();gyro();
 (async()=>{const shown=await pushNudge(rows);const afterNudge=()=>{let tries=0;const t=setInterval(()=>{tries++;if(document.querySelector('.lx-sheet-back')){if(tries>240)clearInterval(t);return;}clearInterval(t);welcome(rows);},400);};if(shown)afterNudge();else setTimeout(()=>welcome(rows),700);})();}});
new MutationObserver(()=>scheduleLinkify()).observe(document.getElementById('pane-help')||sw,{childList:true,subtree:true});
})();

/* Overview: tidy dropdown sections */
(function(){
 const pane=document.getElementById('pane-ov');if(!pane||pane.__acc)return;pane.__acc=1;
 const OPEN=['Next delivery','Your to-dos'];const FLAT=['At a glance','Featured piece','Departures'];
 pane.querySelectorAll('section.card').forEach(sec=>{
  const h=sec.querySelector(':scope > h2');if(!h)return;
  const t=h.textContent.trim();if(FLAT.includes(t))return;sec.classList.add('acc');
  h.setAttribute('role','button');h.setAttribute('tabindex','0');
  const set=o=>{sec.classList.toggle('open',o);h.setAttribute('aria-expanded',o?'true':'false');};
  set(OPEN.includes(t));
  const tog=()=>{set(!sec.classList.contains('open'));};
  h.addEventListener('click',tog);
  h.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tog();}});
 });
 pane.querySelectorAll('.grid').forEach(g=>g.classList.add('accgrid'));
})();

/* Update banner: show 15s at start, then fade away */
(function(){
 const bn=document.getElementById('banner');if(!bn||bn.__t)return;bn.__t=1;
 let tries=0;const iv=setInterval(()=>{tries++;
  if(!bn.hidden){clearInterval(iv);setTimeout(()=>{bn.classList.add('fadeout');setTimeout(()=>{bn.dataset.done='1';},700);},15000);}
  else if(tries>60)clearInterval(iv);},500);
})();
