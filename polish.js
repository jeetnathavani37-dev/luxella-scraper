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
 if(needHome){sh.appendChild(el('p','lxp','Apple only allows alerts for pages saved on the Home Screen. It takes 20 seconds:'));const ol=document.createElement('ol');ol.style.cssText='margin:0 0 12px;padding-left:20px;line-height:1.7';['Tap the Share icon at the bottom of Safari (square with an arrow).','Scroll and tap "Add to Home Screen", then Add.','Open Luxella from your Home Screen and tap Turn on alerts.'].forEach(t=>{const li=document.createElement('li');li.textContent=t;ol.appendChild(li);});sh.appendChild(ol);sh.appendChild(el('p','lxp','Do not want to? You will still get an email for every update.'));}
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

/* One speed-dial: Chat / WhatsApp / GPay inside a single button */
(function(){
 const fab=document.getElementById('chatfab');if(!fab||document.getElementById('qc-main'))return;
 const ios=/iPhone|iPad|iPod/i.test(navigator.userAgent);
 const par=fab.parentNode;
 const IC={
  chat:'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.4c-.6.5-1.3 0-1.3-.7V16A2.5 2.5 0 0 1 4 13.5v-8Z"/></svg>',
  wa:'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.2A9.8 9.8 0 0 0 3.6 17l-1.4 4.8 4.9-1.3A9.8 9.8 0 1 0 12 2.2Zm0 17.9c-1.5 0-2.9-.4-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3a8.1 8.1 0 1 1 6.7 3.6Zm4.5-6c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-1.5-.7-2.4-1.3-3.4-2.9-.1-.2 0-.4.1-.5l.4-.5c.1-.1.2-.3.2-.4.1-.1 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1.1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.7 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3Z"/></svg>',
  pay:'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5v-9ZM5 8v2h14V8a.5.5 0 0 0-.5-.5h-13A.5.5 0 0 0 5 8Zm14 4H5v4.5a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5V12Zm-4 1.5h2.5V15H15v-1.5Z"/></svg>',
  plus:'<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M12 5v14M5 12h14"/></svg>'};
 const main=document.createElement('button');main.id='qc-main';main.type='button';main.className='qcm';main.setAttribute('aria-label','Contact and pay');main.setAttribute('aria-expanded','false');main.innerHTML='<span class="qcc"><i class="c1">'+IC.chat+'</i><i class="c2">'+IC.wa+'</i><i class="c3">'+IC.pay+'</i></span><span class="qcx">'+IC.plus+'</span>';
 const menu=document.createElement('div');menu.id='qc-menu';menu.className='qcmenu';menu.hidden=true;
 const upiBase=()=>{const p=(window.photos&&window.photos.payinfo)||{};return p.upi||'jeetnathavani37-1@okaxis';};
 const item=(label,svg,fn,href)=>{const e=document.createElement(href?'a':'button');e.className='qci';if(href){e.href=href;if(/^https/.test(href)){e.target='_blank';e.rel='noopener';}}else e.type='button';e.innerHTML='<span class="ql">'+label+'</span><span class="qb">'+svg+'</span>';e.addEventListener('click',()=>{close();if(fn)fn();});menu.appendChild(e);};
 const open=()=>{menu.hidden=false;requestAnimationFrame(()=>main.classList.add('on'));main.setAttribute('aria-expanded','true');};
 const close=()=>{main.classList.remove('on');main.setAttribute('aria-expanded','false');setTimeout(()=>{if(!main.classList.contains('on'))menu.hidden=true;},200);};
 item('Chat with Luxella',IC.chat,()=>fab.click());
 item('WhatsApp',IC.wa,null,'https://wa.me/918724079056?text='+encodeURIComponent('Hi Luxella'));
 item('Pay with GPay',IC.pay,()=>{if(window.openPay)window.openPay();else location.href=(ios?'gpay://upi/pay?':'tez://upi/pay?')+'pa='+encodeURIComponent(upiBase())+'&pn=Luxella&cu=INR';});
 par.appendChild(menu);par.appendChild(main);
 main.addEventListener('click',()=>{menu.hidden?open():close();});
 document.addEventListener('click',e=>{if(!menu.hidden&&!menu.contains(e.target)&&e.target!==main&&!main.contains(e.target))close();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
 const sync=()=>{const h=fab.hidden;main.style.display=h?'none':'flex';if(h)close();};
 new MutationObserver(sync).observe(fab,{attributes:true,attributeFilter:['hidden']});sync();
})();

/* Command palette: search or jump anywhere (Ctrl/Cmd+K, "/", or the search icon) */
(function(){
 const sw=document.querySelector('.sw');if(!sw||window.__cmdk)return;window.__cmdk=1;
 const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;};
 const TABS=[['ov','Overview'],['tr','Tracker'],['al','Orders'],['pay','Payments'],['ad','Address'],['msg','Messages'],['st','Stats'],['pol','Terms & order procedure'],['help','Help']];
 const openPolicy=n=>{goTab('pol');setTimeout(()=>{const d=[...document.querySelectorAll('#terms details.tsec')].find(x=>{const k=x.querySelector('.tnum');return k&&k.textContent===String(n);});if(d){let p=d.parentElement;while(p&&p.id!=='terms'){if(p.tagName==='DETAILS')p.open=true;p=p.parentElement;}d.open=true;d.scrollIntoView({behavior:'smooth',block:'center'});}},150);};
 const build=()=>{const items=[];const o=window.dash.data('orders');const rows=o.status==='ok'?o.data:[];
  const due=rows.filter(r=>paidAmt(r)<Number(r.payout||0));
  if(due.length)items.push({g:'Actions',t:'Pay now',s:'₹'+fmt(due.reduce((s,r)=>s+Number(r.payout||0)-paidAmt(r),0))+' due · opens GPay',k:'pay gpay due paid payment',go:()=>openPay()});
  items.push({g:'Actions',t:'Share delivery address',s:'Address tab',k:'address pata deliver',go:()=>goTab('ad')});
  items.push({g:'Actions',t:'Track latest order',s:'Tracker',k:'track tracking where kahan status',go:()=>goTab('tr')});
  items.push({g:'Actions',t:'WhatsApp Luxella',s:'+91 87240 79056',k:'whatsapp chat message contact',go:()=>window.open('https://wa.me/918724079056','_blank')});
  items.push({g:'Actions',t:'Instagram @luxella.in',s:'Opens Instagram',k:'instagram insta social',go:()=>window.open('https://www.instagram.com/luxella.in/','_blank')});
  items.push({g:'Actions',t:'Email Luxella',s:'luxella.in@gmail.com',k:'email mail gmail',go:()=>{location.href='mailto:luxella.in@gmail.com';}});
  rows.forEach(r=>{const st=Number(r.stage||1);items.push({g:'Orders',t:r.item,s:(r.order_no||'')+' · '+(STAGES[st-1]||r.status)+(r.eta_date&&st<9?' · ETA '+fd(r.eta_date):''),k:(r.order_no||'')+' '+(r.brand||'')+' '+(r.status||''),go:()=>openDrawer(r)});});
  TABS.forEach(([id,n])=>items.push({g:'Go to',t:n,s:'Tab',k:'',go:()=>document.getElementById('tab-'+id).click()}));
  if(typeof polSections==='function')polSections().forEach(s=>{if(s.n==='00')return;items.push({g:'Terms',t:s.title,s:'Section '+s.n+' · '+(s.lead||s.body[0]||'').slice(0,70),k:(s.lead||'')+' '+s.body.join(' '),go:()=>openPolicy(s.n)});});
  return items;};
 const score=(it,q)=>{if(!q)return it.g==='Actions'||it.g==='Orders'?1:0;const T=(it.t+' '+it.s).toLowerCase(),K=(it.k||'').toLowerCase();let sc=0;for(const w of q.split(/\s+/)){if(!w)continue;if(it.t.toLowerCase().startsWith(w))sc+=6;else if(T.includes(w))sc+=4;else if(K.includes(w))sc+=1.5;else return 0;}return sc;};
 let back=null,sel=0,list=[];
 const close=()=>{if(back){back.remove();back=null;}};
 const draw=(q)=>{const all=build();list=all.map(it=>({it,sc:score(it,q.trim().toLowerCase())})).filter(x=>x.sc>0).sort((a,b)=>b.sc-a.sc).slice(0,q?9:8).map(x=>x.it);sel=0;const ul=back.querySelector('.cm-list');ul.textContent='';
  if(!list.length){ul.appendChild(el('div','cm-empty','Nothing matches. Try the chat bubble, or WhatsApp Luxella.'));return;}
  let lastG='';list.forEach((it,i)=>{if(it.g!==lastG){lastG=it.g;ul.appendChild(el('div','cm-g',it.g));}const r=el('button','cm-i');r.type='button';r.dataset.i=i;r.appendChild(el('span','cm-t',it.t));r.appendChild(el('span','cm-s',it.s));r.addEventListener('click',()=>run(i));r.addEventListener('mousemove',()=>{sel=i;mark();});ul.appendChild(r);});mark();};
 const mark=()=>{back.querySelectorAll('.cm-i').forEach(b=>b.classList.toggle('on',Number(b.dataset.i)===sel));const a=back.querySelector('.cm-i.on');if(a&&a.scrollIntoView)a.scrollIntoView({block:'nearest'});};
 const run=i=>{const it=list[i];close();if(it)setTimeout(it.go,60);};
 const open=()=>{if(back)return;document.querySelectorAll('.lx-sheet-back').forEach(e=>{});back=el('div','cm-back');back.innerHTML='<div class="cm" role="dialog" aria-label="Search"><div class="cm-top"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m16 16 4.5 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg><input class="cm-in" type="text" placeholder="Search orders, terms, or jump to…" autocomplete="off" spellcheck="false"><kbd>esc</kbd></div><div class="cm-list"></div><div class="cm-foot"><span>↑↓ move</span><span>↵ open</span><span>Ctrl K anywhere</span></div></div>';
  sw.appendChild(back);const inp=back.querySelector('.cm-in');draw('');inp.focus();inp.addEventListener('input',()=>draw(inp.value));
  inp.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();sel=Math.min(list.length-1,sel+1);mark();}else if(e.key==='ArrowUp'){e.preventDefault();sel=Math.max(0,sel-1);mark();}else if(e.key==='Enter'){e.preventDefault();run(sel);}});
  back.addEventListener('click',e=>{if(e.target===back)close();});};
 addEventListener('keydown',e=>{if(e.key==='Escape'){close();return;}if((e.key==='k'||e.key==='K')&&(e.ctrlKey||e.metaKey)){e.preventDefault();back?close():open();return;}if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||'')&&!back){e.preventDefault();open();}});
 const place=()=>{const top=document.getElementById('top');if(!top||top.querySelector('.srchb'))return;const b=el('button','srchb');b.type='button';b.setAttribute('aria-label','Search');b.title='Search (Ctrl K)';b.innerHTML='<svg viewBox="0 0 24 24" width="14" height="14"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m16 16 4.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><span>Search</span>';b.addEventListener('click',open);const who=top.querySelector('.who');top.insertBefore(b,who||null);};
 place();new MutationObserver(place).observe(document.body,{childList:true,subtree:true});
})();

/* Empty state: no outstanding balance reads as words, not a buried ₹0 */
(function(){
 const t=document.querySelector('[data-source="totals"][data-field="pending"]');if(!t)return;
 let busy=false;const fix=()=>{if(busy)return;busy=true;const v=t.textContent.replace(/[^0-9]/g,'');if(t.textContent.trim()!=='—'&&Number(v||'1')===0&&!/None/.test(t.textContent)){t.textContent='None';t.title='No outstanding balance';t.classList.remove('bad');t.classList.add('ok');}busy=false;};
 new MutationObserver(fix).observe(t,{childList:true,characterData:true,subtree:true});fix();
})();
