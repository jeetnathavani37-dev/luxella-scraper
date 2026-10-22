/* Luxella portal — extras: support cases, Account tab, offline banner. Loaded after app.js. */
(function(){
'use strict';
if(window.__lxExtras)return;window.__lxExtras=1;
const sw=document.querySelector('.sw');if(!sw)return;
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;};
const $=id=>document.getElementById(id);
const say=t=>{try{if(window.alertMsg)window.alertMsg(t);else if(typeof toast==='function')toast(t);}catch(e){}};
const nowIso=()=>new Date().toISOString();
const dstr=s=>{try{return typeof fd==='function'?fd(String(s).slice(0,10)):String(s).slice(0,10);}catch(e){return String(s).slice(0,10);}};
const hm=s=>{try{return new Date(s).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});}catch(e){return '';}};
const ready=cb=>{let n=0;const t=setInterval(()=>{n++;let ok=false;try{ok=typeof photos!=='undefined'&&photos.db&&typeof dash!=='undefined';}catch(e){}if(ok){clearInterval(t);cb();}else if(n>200)clearInterval(t);},150);};
const isOwner=()=>{try{return !!photos.canEdit;}catch(e){return false;}};

/* ================= Offline / slow network ================= */
(function(){
 const bar=el('div','xoff','You are offline. Showing the last loaded information; changes will not save until you reconnect.');bar.hidden=true;bar.setAttribute('role','status');
 sw.insertBefore(bar,sw.firstChild);
 const upd=()=>{bar.hidden=navigator.onLine;};
 addEventListener('online',()=>{upd();say('Back online');});addEventListener('offline',upd);upd();
})();

/* ================= Support cases ================= */
const TYPES=['Delayed shipment','Incorrect product or size','Damaged parcel','Missing parcel or item','Payment discrepancy','Cancellation request','Other order-related question'];
const FLOW=['Submitted','Under review','Awaiting reseller','Resolution proposed','Resolved'];
const state={cases:{},msgs:{},open:null};

function chipFor(st){const c=el('span','xchip x-'+String(st).toLowerCase().replace(/\s+/g,'-'),st);return c;}

function renderSupport(){
 const host=$('support-list');if(!host)return;host.textContent='';
 const list=Object.values(state.cases).sort((a,b)=>String(b.at||'')<String(a.at||'')?-1:1);
 const needs=list.filter(c=>c.status==='Awaiting reseller'||c.status==='Resolution proposed').length;
 const hb=$('tab-help');if(hb){let b=hb.querySelector('.xbdg');if(needs){if(!b){b=el('span','bdg xbdg');hb.appendChild(b);}b.textContent=String(needs);}else if(b)b.remove();}
 if(!list.length){host.appendChild(el('p','lbl','No cases yet. If anything is not right with an order, open a case and it is tracked here from start to finish.'));return;}
 list.forEach(c=>{
  const d=el('details','xcase');if(state.open===c.ref)d.open=true;d.addEventListener('toggle',()=>{if(d.open)state.open=c.ref;else if(state.open===c.ref)state.open=null;});
  const s=el('summary');const l=el('span','xc-l');l.appendChild(el('span','xc-ref',c.ref));l.appendChild(el('span','xc-type',c.type||'Case'));s.appendChild(l);s.appendChild(chipFor(c.status||'Submitted'));d.appendChild(s);
  const body=el('div','xc-b');
  body.appendChild(el('div','lbl',(c.order?'Order: '+c.order+' · ':'')+'Opened '+dstr(c.at)+(c.updated&&c.updated!==c.at?' · Updated '+hm(c.updated):'')));
  if(c.desc)body.appendChild(el('p','xc-d',c.desc));
  if(c.files&&c.files.length){const f=el('div','xc-f');c.files.forEach(u=>{const a=el('a','xc-th');a.href=u;a.target='_blank';a.rel='noopener';const im=el('img');im.src=u;im.alt='Attachment';im.loading='lazy';a.appendChild(im);f.appendChild(a);});body.appendChild(f);}
  // status line
  const next={ 'Submitted':'Luxella will review it and reply here.','Under review':'Luxella is looking into it.','Awaiting reseller':'Luxella needs something from you. Reply below.','Resolution proposed':'Luxella has proposed a resolution. Accept it or reopen the case.','Resolved':'Closed. If this is not actually fixed, reopen it.','Reopened':'Reopened. Luxella will pick it up again.'};
  body.appendChild(el('div','xc-n',next[c.status]||''));
  // thread
  const msgs=(state.msgs[c.ref]||[]).slice().sort((a,b)=>String(a.at||'')<String(b.at||'')?-1:1);
  const th=el('div','xc-t');msgs.forEach(m=>{const mine=(m.from==='luxella')===isOwner();const b=el('div','xm '+(m.from==='luxella'?'xm-l':'xm-c')+(mine?' xm-me':''));b.appendChild(el('div','xm-w',(m.from==='luxella'?'Luxella':'You')+' · '+hm(m.at)));b.appendChild(el('div','xm-t',m.text||''));if(m.files&&m.files.length){const f=el('div','xc-f');m.files.forEach(u=>{const a=el('a','xc-th');a.href=u;a.target='_blank';a.rel='noopener';const im=el('img');im.src=u;im.alt='Attachment';im.loading='lazy';a.appendChild(im);f.appendChild(a);});b.appendChild(f);}th.appendChild(b);});
  body.appendChild(th);
  // reply
  if(c.status!=='Resolved'||isOwner()){
   const r=el('div','xc-r');const ta=el('textarea');ta.rows=2;ta.placeholder=isOwner()?'Reply as Luxella…':'Add information or a reply…';ta.id='xr-'+c.ref;
   const row=el('div','xc-act');const send=el('button','btn',isOwner()?'Reply as Luxella':'Send');send.type='button';
   let busy=false;send.addEventListener('click',async()=>{const t=ta.value.trim();if(!t||busy)return;busy=true;send.disabled=true;try{await photos.db.collection('case_msgs').add({case:c.ref,ref:c.ref,text:t,from:isOwner()?'luxella':'client',at:nowIso()});ta.value='';if(!isOwner()&&c.status==='Awaiting reseller'){/* client answered */}await touch(c,isOwner()?null:null);}catch(e){say('Could not send. Your text is kept; try again.');}busy=false;send.disabled=false;});
   row.appendChild(send);
   if(!isOwner()&&c.status==='Resolution proposed'){const ok=el('button','btn2','Accept resolution');ok.type='button';ok.addEventListener('click',()=>setStatus(c,'Resolved'));row.appendChild(ok);const ro=el('button','btn2','Not resolved, reopen');ro.type='button';ro.addEventListener('click',()=>setStatus(c,'Reopened'));row.appendChild(ro);}
   r.appendChild(ta);r.appendChild(row);body.appendChild(r);
  }else{const ro=el('button','btn2','Reopen case');ro.type='button';ro.addEventListener('click',()=>{if(confirm('Reopen this case? Luxella will be notified.'))setStatus(c,'Reopened');});body.appendChild(ro);}
  if(isOwner()){const o=el('div','xc-own owner');const sel=el('select');FLOW.concat(['Reopened']).forEach(x=>{const op=el('option',null,x);op.value=x;if(x===c.status)op.selected=true;sel.appendChild(op);});const b=el('button','btn2','Update status');b.type='button';b.addEventListener('click',()=>setStatus(c,sel.value));o.appendChild(sel);o.appendChild(b);body.appendChild(o);}
  d.appendChild(body);host.appendChild(d);});
}
async function touch(c){/* no-op: status/updated only changed on explicit status updates */}
async function setStatus(c,st){try{const next=Object.assign({},c,{status:st,updated:nowIso()});await photos.db.doc('cases/'+c.ref).set(next);say('Case '+c.ref+': '+st);}catch(e){say('Could not update the case.');}}

function nextRef(){const n=Object.keys(state.cases).length+1;let r;let k=n;do{r='LX-C'+String(k).padStart(3,'0');k++;}while(state.cases[r]);return r;}

function buildSupport(){
 const help=$('pane-help');if(!help||$('support'))return;
 const old=$('cl-order');const oldCard=old&&old.closest('section');if(oldCard)oldCard.hidden=true;
 const sec=el('section','card');sec.id='support';
 sec.innerHTML='<h2>Support</h2><p class="note">Something not right? Open a case. It is tracked here from start to finish, with every reply in one place.</p>';
 const bar=el('div','xs-bar');const nb=el('button','btn','Open a new case');nb.type='button';bar.appendChild(nb);const wa=el('a','btn2','Chat on WhatsApp');wa.href='https://wa.me/918724079056';wa.target='_blank';wa.rel='noopener';bar.appendChild(wa);sec.appendChild(bar);
 const form=el('div','xs-form');form.hidden=true;
 form.innerHTML='<div class="form"><label>Order<select id="xs-order"></select></label><label>Issue<select id="xs-type"></select></label><label class="wide">What happened<textarea id="xs-desc" rows="3" placeholder="What happened, when you noticed, and what you would like us to do"></textarea></label><label class="wide">Photos (optional, up to 3)<input id="xs-files" type="file" accept="image/*" multiple></label></div><p class="xs-act"><button class="btn" id="xs-send" type="button">Submit case</button><button class="btn2" id="xs-cancel" type="button">Cancel</button><span class="lbl" id="xs-msg"></span></p>';
 sec.appendChild(form);sec.appendChild(el('div','xs-list')).id='support-list';
 help.insertBefore(sec,help.firstChild);
 const typ=$('xs-type');TYPES.forEach(t=>{const o=el('option',null,t);o.value=t;typ.appendChild(o);});
 const fillOrders=()=>{const s=$('xs-order');const o=dash.data('orders');if(o.status!=='ok')return;const cur=s.value;s.textContent='';const g=el('option',null,'General (no specific order)');g.value='';s.appendChild(g);o.data.forEach(r=>{const op=el('option',null,(r.order_no?r.order_no+' · ':'')+r.item);op.value=r.item;s.appendChild(op);});s.value=cur;};
 let draftRef=null;
 nb.addEventListener('click',()=>{form.hidden=!form.hidden;if(!form.hidden){fillOrders();if(!draftRef)draftRef=nextRef();$('xs-desc').focus();}});
 $('xs-cancel').addEventListener('click',()=>{form.hidden=true;});
 let busy=false;
 $('xs-send').addEventListener('click',async()=>{if(busy)return;const desc=$('xs-desc').value.trim();const m=$('xs-msg');if(desc.length<8){m.textContent='Add a few words so we can help properly.';return;}
  busy=true;$('xs-send').disabled=true;m.textContent='Submitting…';
  try{const files=[...($('xs-files').files||[])].slice(0,3);const urls=[];for(const f of files){const a=await photos.assets.upload(f);urls.push(a.url);}
   const ref=draftRef||nextRef();const t=nowIso();
   await photos.db.doc('cases/'+ref).set({ref,order:$('xs-order').value,type:$('xs-type').value,desc,status:'Submitted',at:t,updated:t,files:urls});
   draftRef=null;$('xs-desc').value='';$('xs-files').value='';form.hidden=true;m.textContent='';state.open=ref;say('Case '+ref+' submitted');
  }catch(e){m.textContent='Could not submit. Your details are kept, try again.';}
  busy=false;$('xs-send').disabled=false;});
}

/* ================= Account tab ================= */
const PUSHCATS=[['orders','Order updates','Stage changes, tracking, delivery window'],['payments','Payments','Payment received and recorded'],['notes','Notes from Luxella','Pinned notes on your page'],['quotes','Quotes and requests','New quotes and updates on your requests'],['support','Support replies','Replies and status changes on your cases']];
let prefs={push:{},channel:'WhatsApp',sourcing:{}};
function buildAccount(){
 const tabs=document.querySelector('.tabs');if(!tabs||$('tab-acct'))return;
 const tb=el('button','tab','Account');tb.id='tab-acct';tb.setAttribute('role','tab');tb.setAttribute('aria-selected','false');
 const help=$('tab-help');tabs.insertBefore(tb,help||null);
 const pane=el('div');pane.id='pane-acct';pane.hidden=true;const hp=$('pane-help');hp.parentNode.insertBefore(pane,hp);
 const allTabs=()=>[...tabs.querySelectorAll('.tab')];
 tb.addEventListener('click',()=>{allTabs().forEach(t=>t.setAttribute('aria-selected',String(t===tb)));document.querySelectorAll('[id^="pane-"]').forEach(p=>{p.hidden=p!==pane;});drawAccount();});
 tabs.addEventListener('click',e=>{const t=e.target.closest&&e.target.closest('.tab');if(t&&t!==tb){tb.setAttribute('aria-selected','false');pane.hidden=true;}});
 window.__lxAcct=drawAccount;
}
function savePrefs(msg){return photos.db.doc('prefs/main').set(prefs).then(()=>{if(msg)say(msg);}).catch(()=>say('Could not save. Try again.'));}
function drawAccount(){
 const pane=$('pane-acct');if(!pane||pane.hidden)return;pane.textContent='';
 const C=window.lx&&window.lx.client?window.lx.client():{};const email=(window.lx&&window.lx.auth&&window.lx.auth.email)||'';
 const owner=isOwner();
 const card=(h,n)=>{const s=el('section','card');s.appendChild(el('h2',null,h));if(n)s.appendChild(el('p','note',n));pane.appendChild(s);return s;};
 const kv=(p,k,v)=>{const d=el('div','kv');d.appendChild(el('span','lbl',k));d.appendChild(el('span',null,v||'—'));p.appendChild(d);};
 // Profile
 const p1=card('Profile','Your details on file with Luxella');
 kv(p1,'Name',C.name);kv(p1,'Business',C.biz);{const lg=(photos&&photos.client&&photos.client.url)||'';if(lg){const d=el('div','kv');d.appendChild(el('span','lbl','Logo'));const im=document.createElement('img');im.src=lg;im.alt='';im.style.cssText='height:32px;width:auto;max-width:96px;object-fit:contain;border-radius:4px';im.onerror=()=>d.remove();d.appendChild(im);p1.appendChild(d);}}kv(p1,'Sign-in email',owner?'…':email);if(owner&&window.lx&&window.lx.listUsers){const sp=p1.lastChild.lastChild;window.lx.listUsers().then(u=>{sp.textContent=(u&&u.length)?u.map(x=>x.email).join(', '):'No login yet';}).catch(()=>{sp.textContent='—';});}kv(p1,'Reseller ID','LX-'+String(C.id||'').slice(0,8).toUpperCase());
 const o=dash.data('orders');if(o.status==='ok'&&o.data.length){const ds=o.data.map(r=>r.order_date).filter(Boolean).sort();if(ds[0])kv(p1,'Working with Luxella since',dstr(ds[0]));}
 const pr=el('p','xs-act');const ad=el('button','btn2','Manage delivery addresses');ad.type='button';ad.addEventListener('click',()=>$('tab-ad').click());pr.appendChild(ad);p1.appendChild(pr);
 // Notifications
 const p2=card('Notifications','Choose what you hear about. Alerts arrive on this device once enabled.');
 PUSHCATS.forEach(([k,t,s])=>{const row=el('label','xs-sw');const cb=el('input');cb.type='checkbox';cb.checked=prefs.push[k]!==false;cb.addEventListener('change',()=>{prefs.push[k]=cb.checked;savePrefs('Saved');});const tx=el('span');tx.appendChild(el('b',null,t));tx.appendChild(el('small',null,s));row.appendChild(cb);row.appendChild(tx);p2.appendChild(row);});
 const ch=el('label','xs-sel');ch.appendChild(el('span','lbl','Preferred way for Luxella to reach you'));const cs=el('select');['WhatsApp','Email','Both'].forEach(x=>{const op=el('option',null,x);op.value=x;if(x===prefs.channel)op.selected=true;cs.appendChild(op);});cs.addEventListener('change',()=>{prefs.channel=cs.value;savePrefs('Saved');});ch.appendChild(cs);p2.appendChild(ch);
 const bell=$('top')&&$('top').querySelector('.bellb');if(bell){const bb=el('p','xs-act');const b=el('button','btn2','Alerts on this device');b.type='button';b.addEventListener('click',()=>bell.click());bb.appendChild(b);p2.appendChild(bb);}
 // Sourcing preferences
 const p3=card('Sourcing preferences','Helps Luxella suggest and quote the right pieces faster');
 const f=el('div','form');const fld=(k,lab,ph)=>{const l=el('label');l.appendChild(el('span',null,lab));const i=el('input');i.type='text';i.placeholder=ph;i.value=(prefs.sourcing||{})[k]||'';i.dataset.k=k;l.appendChild(i);f.appendChild(l);};
 fld('brands','Preferred brands','e.g. Coach, Adidas, Burberry');fld('categories','Categories','e.g. bags, sneakers, wallets');fld('sizes','Usual sizes','e.g. UK 9, M');fld('colours','Colours','e.g. black, neutrals');p3.appendChild(f);
 const sp=el('p','xs-act');const sb=el('button','btn','Save preferences');sb.type='button';sb.addEventListener('click',()=>{prefs.sourcing={};f.querySelectorAll('input').forEach(i=>{prefs.sourcing[i.dataset.k]=i.value.trim();});savePrefs('Preferences saved');});sp.appendChild(sb);p3.appendChild(sp);
 // Security (clients only)
 if(!owner){
  const p4=card('Security','Change your password or sign out everywhere');
  const pf=el('div','form');pf.innerHTML='<label>New password<input id="ac-p1" type="password" autocomplete="new-password" placeholder="At least 10 characters"></label><label>Confirm<input id="ac-p2" type="password" autocomplete="new-password"></label>';p4.appendChild(pf);
  const pa=el('p','xs-act');const pb=el('button','btn','Update password');pb.type='button';const pm=el('span','lbl');
  pb.addEventListener('click',async()=>{const a=$('ac-p1').value,b=$('ac-p2').value;if(a.length<10){pm.textContent='Use at least 10 characters.';return;}if(a!==b){pm.textContent='The two passwords do not match.';return;}pb.disabled=true;pm.textContent='Updating…';try{await window.lx.auth.changePassword(a);$('ac-p1').value='';$('ac-p2').value='';pm.textContent='Password updated.';}catch(e){pm.textContent=(e&&e.message)||'Could not update.';}pb.disabled=false;});
  pa.appendChild(pb);pa.appendChild(pm);p4.appendChild(pa);
  const so=el('p','xs-act');const sob=el('button','btn2','Sign out of all devices');sob.type='button';sob.addEventListener('click',async()=>{if(confirm('Sign out everywhere, including this device?'))await window.lx.auth.signOutAll();});so.appendChild(sob);p4.appendChild(so);
 }
 // Data requests
 const p5=card('Your data','Luxella keeps only what is needed to serve your orders');
 const mk=(label,subject,body)=>{const a=el('a','btn2',label);a.href='mailto:luxella.in@gmail.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);return a;};
 const who='Name: '+(C.name||'')+'\nReseller ID: LX-'+String(C.id||'').slice(0,8).toUpperCase()+'\nSign-in email: '+email+'\n\n';
 const dr=el('p','xs-act');dr.appendChild(mk('Request a correction','Data correction request · '+(C.name||''),who+'Please correct the following:\n'));dr.appendChild(mk('Request deletion','Data deletion request · '+(C.name||''),who+'I would like my data deleted where Luxella is able to do so. Please confirm what can be removed and what must be retained.\n'));p5.appendChild(dr);
 p5.appendChild(el('p','lbl','Some records, such as order and payment history, may need to be retained under applicable rules. Luxella will tell you what can be removed.'));
}

/* ================= boot ================= */
ready(()=>{
 buildSupport();buildAccount();
 photos.db.collection('cases').onSnapshot(s=>{const m={};s.docs.forEach(d=>{if(d.exists)m[d.id]=d.data();});state.cases=m;renderSupport();},()=>{});
 photos.db.collection('case_msgs').onSnapshot(s=>{const m={};s.docs.forEach(d=>{if(!d.exists)return;const x=d.data();if(x&&x.case)(m[x.case]=m[x.case]||[]).push(x);});state.msgs=m;renderSupport();},()=>{});
 photos.db.collection('prefs').onSnapshot(s=>{s.docs.forEach(d=>{if(d.id==='main'&&d.exists){const x=d.data()||{};prefs={push:x.push||{},channel:x.channel||'WhatsApp',sourcing:x.sourcing||{}};drawAccount();}});},()=>{});
 renderSupport();
});

/* ================= Payments: submit -> pending verification -> verified ================= */
const psState={subs:{}};
const inr=n=>'₹'+(typeof fmt==='function'?fmt(Number(n||0)):String(n));
const slugOf=x=>(typeof pslug==='function'?pslug(x):String(x));
function hash(str){let h=5381;for(let i=0;i<str.length;i++)h=((h<<5)+h+str.charCodeAt(i))|0;return Math.abs(h).toString(36);}
function ordersData(){const o=dash.data('orders');return o.status==='ok'?o.data:[];}
function dueOf(r){return Math.max(0,Number(r.payout||0)-(typeof paidAmt==='function'?paidAmt(r):0));}
function pendingFor(item){return Object.values(psState.subs).filter(x=>x.order===item&&x.status==='Pending verification').reduce((s,x)=>s+Number(x.amount||0),0);}

async function verifySub(sub){
 try{
  const key=slugOf(sub.order);const cur=(photos.payrec[key]&&photos.payrec[key].items)||[];
  if(!cur.some(x=>x.sub===sub.id)){await photos.db.doc('payrec/'+key).set({order:sub.order,items:cur.concat([{amount:Number(sub.amount),at:new Date().toISOString().slice(0,10),method:sub.method||'UPI',ref:sub.ref||'',sub:sub.id}])});}
  await photos.db.doc('paysub/'+sub.id).set(Object.assign({},sub,{status:'Verified',verifiedAt:nowIso()}));
  const r=ordersData().find(x=>x.item===sub.order);
  if(r){const paid=cur.reduce((s,x)=>s+Number(x.amount||0),0)+(cur.some(x=>x.sub===sub.id)?0:Number(sub.amount));if(paid>=Number(r.payout||0)&&r.payout_status!=='Received'){const d=Object.assign({},r);delete d.item;d.payout_status='Received';d.payment_date=new Date().toISOString().slice(0,10);await window.lx.saveOrder(r.item,d);}}
  say('Payment verified. Balance updated.');
 }catch(e){say('Could not verify. Try again.');}
}
async function rejectSub(sub){const reason=prompt('Reason shown to the client (e.g. amount not received, wrong reference):','Not received in our account yet. Please check the reference and resubmit.');if(reason===null)return;try{await photos.db.doc('paysub/'+sub.id).set(Object.assign({},sub,{status:'Rejected',reason,reviewedAt:nowIso()}));say('Marked as rejected.');}catch(e){say('Could not update.');}}

function renderPaySub(){
 const host=$('paysub-list');if(!host)return;host.textContent='';
 const list=Object.values(psState.subs).sort((a,b)=>String(b.at||'')<String(a.at||'')?-1:1);
 const pend=list.filter(x=>x.status==='Pending verification').reduce((s,x)=>s+Number(x.amount||0),0);
 const sm=$('paysub-sum');if(sm)sm.textContent=pend?inr(pend)+' awaiting verification. It is not counted as received until Luxella confirms it.':'';
 const pb=$('tab-pay');if(pb&&isOwner()){let b=pb.querySelector('.xbdg');const n=list.filter(x=>x.status==='Pending verification').length;if(n){if(!b){b=el('span','bdg xbdg');pb.appendChild(b);}b.textContent=String(n);}else if(b)b.remove();}
 if(!list.length){host.appendChild(el('p','lbl','No submissions yet.'));return;}
 list.forEach(x=>{const row=el('div','xps');const l=el('div','xps-l');l.appendChild(el('div','xps-t',inr(x.amount)+' · '+x.order));l.appendChild(el('div','lbl',(x.method||'')+(x.ref?' · ref '+x.ref:'')+' · '+hm(x.at)));if(x.status==='Rejected'&&x.reason)l.appendChild(el('div','xc-n',x.reason));if(x.proof){const a=el('a','xc-th');a.href=x.proof;a.target='_blank';a.rel='noopener';const im=el('img');im.src=x.proof;im.alt='Proof';im.loading='lazy';a.appendChild(im);l.appendChild(a);}row.appendChild(l);
  const c=el('span','xchip '+(x.status==='Verified'?'x-resolved':x.status==='Rejected'?'x-reopened':''),x.status);row.appendChild(c);
  if(isOwner()&&x.status==='Pending verification'){const o=el('div','xc-own owner');const v=el('button','btn','Verify');v.type='button';v.addEventListener('click',()=>verifySub(x));const r=el('button','btn2','Reject');r.type='button';r.addEventListener('click',()=>rejectSub(x));o.appendChild(v);o.appendChild(r);row.appendChild(o);}
  host.appendChild(row);});
}

function buildPaySub(){
 const pane=$('pane-pay');if(!pane||$('paysub'))return;
 const sec=el('section','card');sec.id='paysub';
 sec.innerHTML='<h2>Submit a payment</h2><p class="note">Paid already? Tell us the details. Luxella checks it against the account and confirms here. Until then it is shown as pending, never as received.</p><p class="lbl" id="paysub-sum"></p>';
 const form=el('div','xs-form');form.style.borderTop='0';
 form.innerHTML='<div class="form"><label>Order<select id="ps-order"></select></label><label>Amount ₹<input id="ps-amt" type="number" inputmode="numeric" min="1"></label><label>Paid by<select id="ps-method"><option>UPI</option><option>Bank transfer</option><option>Other</option></select></label><label>Reference / UTR<input id="ps-ref" type="text" placeholder="Transaction ID" autocomplete="off"></label><label class="wide">Screenshot (optional)<input id="ps-file" type="file" accept="image/*"></label></div><p class="xs-act"><button class="btn" id="ps-send" type="button">Submit payment</button><span class="lbl" id="ps-msg"></span></p>';
 if(!isOwner())sec.appendChild(form);
 sec.appendChild(el('h2',null,'Submitted payments')).style.marginTop='18px';sec.appendChild(el('div','xs-list')).id='paysub-list';
 pane.insertBefore(sec,pane.firstChild);
 const fill=()=>{const s=$('ps-order');if(!s)return;const cur=s.value;s.textContent='';ordersData().filter(r=>dueOf(r)>0).forEach(r=>{const o=el('option',null,(r.order_no?r.order_no+' · ':'')+r.item+' · '+inr(dueOf(r))+' due');o.value=r.item;s.appendChild(o);});if(cur)s.value=cur;const r0=ordersData().find(r=>r.item===s.value);if(r0&&!$('ps-amt').value)$('ps-amt').value=Math.max(0,dueOf(r0)-pendingFor(r0.item))||'';};
 fill();dash.onData(()=>{fill();});
 if($('ps-order'))$('ps-order').addEventListener('change',()=>{const r0=ordersData().find(r=>r.item===$('ps-order').value);$('ps-amt').value=r0?Math.max(0,dueOf(r0)-pendingFor(r0.item)):'';});
 let busy=false;
 if($('ps-send'))$('ps-send').addEventListener('click',async()=>{if(busy)return;const m=$('ps-msg');const item=$('ps-order').value;const amt=Number($('ps-amt').value);const ref=$('ps-ref').value.trim();
  if(!item){m.textContent='No order has a balance due.';return;}if(!(amt>0)){m.textContent='Enter the amount you paid.';return;}
  const r0=ordersData().find(r=>r.item===item);if(r0&&amt>dueOf(r0)+0.5){m.textContent='That is more than the balance due ('+inr(dueOf(r0))+'). Check the amount.';return;}
  if($('ps-method').value!=='Other'&&ref.length<6){m.textContent='Add the transaction reference (at least 6 characters). It helps us confirm faster.';return;}
  const id='ps-'+hash(item+'|'+amt+'|'+ref.toLowerCase());if(psState.subs[id]){m.textContent='You already submitted this payment.';return;}
  busy=true;$('ps-send').disabled=true;m.textContent='Submitting…';
  try{let proof='';const f=$('ps-file').files&&$('ps-file').files[0];if(f){if(f.size>8*1024*1024)throw new Error('big');const a=await photos.assets.upload(f);proof=a.url;}
   await photos.db.doc('paysub/'+id).set({id,order:item,amount:amt,method:$('ps-method').value,ref,proof,status:'Pending verification',at:nowIso()});
   $('ps-ref').value='';$('ps-file').value='';m.textContent='Submitted. Luxella will confirm it here.';say('Payment submitted');
  }catch(e){m.textContent='Could not submit. Your details are kept, try again.';}
  busy=false;$('ps-send').disabled=false;});
}

/* ================= Product requests (Overview) ================= */
const RQ_FLOW=['Submitted','Under review','Availability checking','Quote ready','Approved','Order created','Unavailable / closed'];
const rqState={items:{}};
function renderRequests(){
 const host=$('rq-list');if(!host)return;host.textContent='';
 const list=Object.entries(rqState.items).map(([id,v])=>Object.assign({id},v)).sort((a,b)=>String(b.at||'')<String(a.at||'')?-1:1);
 if(!list.length){host.appendChild(el('p','lbl','No requests yet.'));return;}
 list.forEach(x=>{const row=el('div','xps');const l=el('div','xps-l');l.appendChild(el('div','xps-t',[x.brand,x.product].filter(Boolean).join(' ')+(x.qty>1?' × '+x.qty:'')));l.appendChild(el('div','lbl',[x.spec,x.budget?'Budget '+inr(x.budget):'',x.needBy?'Need by '+dstr(x.needBy):'',x.urgent?'Urgent':'','Sent '+dstr(x.at)].filter(Boolean).join(' · ')));if(x.link){const a=el('a','lbl','View product link');a.href=x.link;a.target='_blank';a.rel='noopener';l.appendChild(a);}if(x.note)l.appendChild(el('div','xc-n',x.note));if(x.photo){const a=el('a','xc-th');a.href=x.photo;a.target='_blank';a.rel='noopener';const im=el('img');im.src=x.photo;im.alt='Reference';im.loading='lazy';a.appendChild(im);l.appendChild(a);}row.appendChild(l);
  row.appendChild(el('span','xchip '+(x.status==='Unavailable / closed'?'x-reopened':x.status==='Order created'?'x-resolved':''),x.status||'Submitted'));
  if(isOwner()){const o=el('div','xc-own owner');const sel=el('select');RQ_FLOW.forEach(s=>{const op=el('option',null,s);op.value=s;if(s===x.status)op.selected=true;sel.appendChild(op);});const b=el('button','btn2','Update');b.type='button';b.addEventListener('click',async()=>{try{await photos.db.doc('requests/'+x.id).set(Object.assign({},x,{id:undefined,status:sel.value,updated:nowIso()}));say('Request updated');}catch(e){say('Could not update');}});o.appendChild(sel);o.appendChild(b);
   const q=el('button','btn2','Create quote');q.type='button';q.addEventListener('click',async()=>{const p=prompt('Selling price ₹ for '+[x.brand,x.product].join(' ')+':');if(!p||!(Number(p)>0))return;try{await photos.db.collection('quotes').add({item:[x.brand,x.product].filter(Boolean).join(' '),price:Number(p),shipping:0,total:Number(p),advance:'50%',window:'',valid:'',note:x.spec||'',request:x.id,status:'Quoted',at:new Date().toISOString().slice(0,10)});await photos.db.doc('requests/'+x.id).set(Object.assign({},x,{id:undefined,status:'Quote ready',updated:nowIso()}));say('Quote posted');}catch(e){say('Could not create quote');}});o.appendChild(q);row.appendChild(o);}
  host.appendChild(row);});
}
function buildRequests(){
 const q=$('quotes');const qs=q&&q.closest('section');if(!qs||$('rq'))return;
 const sec=el('section','card acc');sec.id='rq';const h=el('h2',null,'Request a product');h.setAttribute('role','button');h.tabIndex=0;sec.appendChild(h);
 sec.appendChild(el('p','note','Tell us what you want sourced. We check availability and send you a quote to approve.'));
 const body=el('div');
 body.innerHTML='<div class="form"><label>Brand<input id="rq-brand" type="text"></label><label>Product<input id="rq-prod" type="text" placeholder="e.g. Coach Tabby 26"></label><label>Size / colour<input id="rq-spec" type="text"></label><label>Qty<input id="rq-qty" type="number" value="1" min="1"></label><label>Budget ₹ (optional)<input id="rq-budget" type="number" inputmode="numeric"></label><label>Need it by (optional)<input id="rq-need" type="date"></label><label class="wide">Product link (optional)<input id="rq-link" type="url" placeholder="https://"></label><label class="wide">Reference photo (optional)<input id="rq-photo" type="file" accept="image/*"></label><label class="wide">Notes<textarea id="rq-note" rows="2"></textarea></label><label class="xs-sw" style="grid-column:1/-1"><input id="rq-urgent" type="checkbox"><span><b>Urgent</b><small>Only if it genuinely cannot wait</small></span></label></div><p class="xs-act"><button class="btn" id="rq-send" type="button">Send request</button><span class="lbl" id="rq-msg"></span></p><h2 style="margin-top:18px">Your requests</h2><div id="rq-list" class="xs-list"></div>';
 if(isOwner()){body.innerHTML='<h2>Client requests</h2><div id="rq-list" class="xs-list"></div>';}
 sec.appendChild(body);qs.parentNode.insertBefore(sec,qs.nextSibling);
 const set=o=>{sec.classList.toggle('open',o);h.setAttribute('aria-expanded',String(o));};set(false);h.addEventListener('click',()=>set(!sec.classList.contains('open')));h.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();set(!sec.classList.contains('open'));}});
 let draft=null,busy=false;
 const send=$('rq-send');if(send)send.addEventListener('click',async()=>{if(busy)return;const m=$('rq-msg');const brand=$('rq-brand').value.trim(),prod=$('rq-prod').value.trim();if(!prod){m.textContent='Tell us which product you want.';return;}
  busy=true;send.disabled=true;m.textContent='Sending…';draft=draft||'rq-'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
  try{let photo='';const f=$('rq-photo').files&&$('rq-photo').files[0];if(f){const a=await photos.assets.upload(f);photo=a.url;}
   await photos.db.doc('requests/'+draft).set({brand,product:prod,spec:$('rq-spec').value.trim(),qty:Number($('rq-qty').value||1),budget:Number($('rq-budget').value||0)||0,needBy:$('rq-need').value,link:$('rq-link').value.trim(),photo,note:$('rq-note').value.trim(),urgent:$('rq-urgent').checked,status:'Submitted',at:nowIso()});
   draft=null;['rq-brand','rq-prod','rq-spec','rq-budget','rq-need','rq-link','rq-note'].forEach(i=>$(i).value='');$('rq-photo').value='';$('rq-urgent').checked=false;$('rq-qty').value=1;m.textContent='Sent. We will review it and reply with availability or a quote.';say('Request sent');
  }catch(e){m.textContent='Could not send. Your details are kept, try again.';}
  busy=false;send.disabled=false;});
}

/* ================= Quote approval ================= */
const qrState={};window.__lxQR=qrState;
function quoteExpired(q){return !!q.valid&&q.valid<new Date().toISOString().slice(0,10);}
function openQuote(q){
 const old=document.querySelector('.sw .drawer');if(old)old.remove();
 const dr=el('div','drawer');dr.addEventListener('click',e=>{if(e.target===dr)dr.remove();});const pan=el('div','pan');
 const x=el('button','x','×');x.type='button';x.setAttribute('aria-label','Close');x.addEventListener('click',()=>dr.remove());pan.appendChild(x);
 pan.appendChild(el('h3',null,'Review your quote'));pan.appendChild(el('div','spec',q.item));
 const kv=(k,v)=>{const d=el('div','kv');d.appendChild(el('span','lbl',k));d.appendChild(el('span',null,v));pan.appendChild(d);};
 const price=Number(q.price||0),ship=Number(q.shipping||0),total=Number(q.total||price+ship);
 if(q.note)kv('Details',q.note);kv('Availability',q.avail||'Confirmed by Luxella at the time of quoting');kv('Price',inr(price));kv('Other charges',ship?inr(ship):'None, all-inclusive');kv('Total payable',inr(total));
 kv('Advance to confirm',q.advance?(String(q.advance).includes('%')?q.advance+' of total':inr(String(q.advance).replace(/[^0-9.]/g,''))):'50% of total');
 kv('Delivery window',q.window||'Quoted separately. It starts once the piece reaches our international hub.');
 kv('Quote valid till',q.valid?dstr(q.valid):'No expiry set');
 const resp=qrState['qr-'+q.id];
 if(resp){pan.appendChild(el('p','xc-n','You '+(resp.decision==='approved'?'approved':'declined')+' this quote on '+dstr(resp.at)+'.'));}
 else if(quoteExpired(q)){pan.appendChild(el('p','xc-n','This quote has expired. Ask Luxella to revalidate it before approving.'));const a=el('a','btn','Ask Luxella to revalidate');a.href='https://wa.me/918724079056?text='+encodeURIComponent('Hi Luxella, please revalidate the quote for '+q.item+'.');a.target='_blank';a.rel='noopener';pan.appendChild(a);}
 else if(!isOwner()){
  const lab=el('label','xs-sw');const cb=el('input');cb.type='checkbox';const tx=el('span');tx.appendChild(el('b',null,'I have read the order terms'));const sm=el('small');sm.textContent='Including cancellation and sourcing terms. ';const rd=el('a',null,'Read the terms');rd.href='#';rd.style.textDecoration='underline';rd.addEventListener('click',e=>{e.preventDefault();dr.remove();goTab('pol');});sm.appendChild(rd);tx.appendChild(sm);lab.appendChild(cb);lab.appendChild(tx);pan.appendChild(lab);
  const row=el('p','xs-act');const ok=el('button','btn','Approve this quote');ok.type='button';ok.disabled=true;cb.addEventListener('change',()=>{ok.disabled=!cb.checked;});
  const no=el('button','btn2','Decline');no.type='button';const msg=el('span','lbl');
  const decide=async dec=>{ok.disabled=no.disabled=true;msg.textContent='Saving…';try{await photos.db.doc('quote_resp/qr-'+q.id).set({id:'qr-'+q.id,quote:q.id,item:q.item,total,decision:dec});msg.textContent=dec==='approved'?'Approved. Luxella will confirm the order and the advance.':'Declined.';say(dec==='approved'?'Quote approved':'Quote declined');setTimeout(()=>dr.remove(),900);}catch(e){msg.textContent='Could not save. It may already be decided or have expired.';ok.disabled=!cb.checked;no.disabled=false;}};
  ok.addEventListener('click',()=>decide('approved'));no.addEventListener('click',()=>{if(confirm('Decline this quote?'))decide('declined');});
  row.appendChild(ok);row.appendChild(no);row.appendChild(msg);pan.appendChild(row);}
 dr.appendChild(pan);sw.appendChild(dr);
}
window.openQuote=openQuote;
window.__lxQuoteRow=function(q,row,t){
 const resp=qrState['qr-'+q.id];const st=q.status||'Quoted';
 if(resp&&st==='Quoted'){const b=el('div','lbl',resp.decision==='approved'?(isOwner()?'Client approved this quote on '+dstr(resp.at):'You approved this quote. Awaiting order confirmation.'):'Declined '+dstr(resp.at));b.style.color=resp.decision==='approved'?'var(--gold-2)':'var(--muted)';t.appendChild(b);}
 if(st==='Quoted'||resp){const b=el('button',isOwner()?'btn2':'btn2',st==='Quoted'&&!resp&&!isOwner()?'Review & approve':'View');b.type='button';b.addEventListener('click',()=>openQuote(q));row.appendChild(b);}
 if(isOwner()&&resp&&resp.decision==='approved'&&st==='Quoted'){const c=el('button','btn owner','Create order');c.type='button';c.addEventListener('click',async()=>{try{const rows=ordersData();const m=String(new Date().getMonth()+1).padStart(2,'0');const nums=rows.map(r=>String(r.order_no||'')).filter(n=>n.startsWith('#'+m)).map(n=>Number(n.slice(3))||0);const no='#'+m+String((nums.length?Math.max(...nums):0)+1).padStart(2,'0');
  await window.lx.saveOrder(q.item,{item:q.item,order_no:no,order_date:new Date().toISOString().slice(0,10),brand:'',order_type:'ETA',direct:'Direct to client',payout:Number(q.total||q.price||0),payout_status:'Pending',stage:1,status:'Ordered',eta_date:'',shipping_date:'',intl_tracking_no:'',intl_courier:'',intl_courier_slug:'',local_tracking:'',local_courier:'',local_courier_slug:'',payment_date:''});
  await photos.db.doc('quotes/'+q.id).set(Object.assign({},q,{id:undefined,status:'Ordered'}));if(q.request)try{const rq=rqState.items[q.request];if(rq)await photos.db.doc('requests/'+q.request).set(Object.assign({},rq,{status:'Order created',updated:nowIso()}));}catch(e){}
  say('Order '+no+' created');}catch(e){say('Could not create the order');}});row.appendChild(c);}
};

/* ================= Order extras: delay + revised ETA, parcels, reorder, feedback ================= */
const PARCEL_ST=['In transit','Arrived in India','Domestic shipping','Delivered'];
const fbState={items:{}};
const oslug=t=>String(t).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60);
async function saveOrd(r,patch){const d=Object.assign({},r,patch);delete d.item;await window.lx.saveOrder(r.item,d);try{const n=ordersData().find(x=>x.item===r.item);if(n&&typeof openDrawer==='function')openDrawer(n);}catch(e){}}
function isDone(r){return r.status==='Delivered'||Number(r.stage||1)>=9;}
function box(title){const b=el('div','xo-box');b.appendChild(el('div','lbl',title));return b;}
function field(ph,type){const i=el('input');i.type=type||'text';i.placeholder=ph;i.className='xo-in';return i;}
window.__lxDrawer=function(r,pan){
 const done=isDone(r),own=isOwner();
 /* delay notice */
 if(r.delay_reason&&!done){const b=box('Delay update');b.classList.add('xo-delay');b.appendChild(el('p',null,r.delay_reason));
  if(r.eta_date){const e=el('p','xo-eta','Revised ETA: '+dstr(r.eta_date)+(r.eta_prev?' (earlier '+dstr(r.eta_prev)+')':''));b.appendChild(e);}pan.appendChild(b);}
 /* parcels */
 const parcels=Array.isArray(r.parcels)?r.parcels:[];
 if(parcels.length||own){const b=box('Parcels'+(parcels.length>1?' ('+parcels.length+')':''));if(!parcels.length)b.classList.add('owner');
  parcels.forEach((p,i)=>{const row=el('div','xo-row');row.appendChild(el('b',null,p.label||('Parcel '+(i+1))));row.appendChild(chipFor(p.status||'In transit'));
   if(p.tracking){try{row.appendChild(trackLink(p.tracking,p.courier||''));}catch(e){row.appendChild(el('span',null,p.tracking));}}
   if(own){const x=el('button','xo-x owner','×');x.type='button';x.title='Remove parcel';x.addEventListener('click',async()=>{if(!confirm('Remove this parcel?'))return;try{await saveOrd(r,{parcels:parcels.filter((_,j)=>j!==i)});say('Parcel removed');}catch(e){say('Could not save');}});row.appendChild(x);
    const sel=el('select','xo-in owner');PARCEL_ST.forEach(t=>{const o=el('option',null,t);o.value=t;if(t===(p.status||'In transit'))o.selected=true;sel.appendChild(o);});sel.addEventListener('change',async()=>{try{await saveOrd(r,{parcels:parcels.map((q,j)=>j===i?Object.assign({},q,{status:sel.value,at:nowIso()}):q)});say('Parcel updated');}catch(e){say('Could not save');}});row.appendChild(sel);}
   b.appendChild(row);});
  if(own){const f=el('div','xo-form owner');const l=field('Label (e.g. Parcel 2: shoes)'),t=field('Tracking no.');const add=el('button','btn2','Add parcel');add.type='button';add.addEventListener('click',async()=>{if(!l.value.trim()&&!t.value.trim())return;try{await saveOrd(r,{parcels:parcels.concat([{label:l.value.trim(),tracking:t.value.trim(),status:'In transit',at:nowIso()}])});say('Parcel added');}catch(e){say('Could not save');}});f.appendChild(l);f.appendChild(t);f.appendChild(add);b.appendChild(f);}
  pan.appendChild(b);}
 /* owner: delay form */
 if(own&&!done){const b=box('Set delay / revised ETA');b.classList.add('owner');const why=field('Reason (shown to client)'),dt=field('New ETA','date');why.value=r.delay_reason||'';dt.value=r.eta_date||'';
  const save=el('button','btn2','Save');save.type='button';save.addEventListener('click',async()=>{try{const patch={delay_reason:why.value.trim(),delay_at:nowIso()};if(dt.value&&dt.value!==r.eta_date){patch.eta_prev=r.eta_date||'';patch.eta_date=dt.value;}await saveOrd(r,patch);say('Delay update saved');}catch(e){say('Could not save');}});
  const clr=el('button','btn2','Clear');clr.type='button';clr.addEventListener('click',async()=>{try{await saveOrd(r,{delay_reason:'',eta_prev:''});say('Cleared');}catch(e){say('Could not save');}});
  const f=el('div','xo-form');f.appendChild(why);f.appendChild(dt);f.appendChild(save);f.appendChild(clr);b.appendChild(f);pan.appendChild(b);}
 /* reorder + feedback (client) */
 if(!own&&done){
  const b=box('After delivery');const fb=fbState.items['fb-'+oslug(r.item)];
  if(fb){b.appendChild(el('p',null,'Your feedback: '+'★'.repeat(fb.rating||0)+'☆'.repeat(5-(fb.rating||0))+(fb.note?' · '+fb.note:'')));}
  else{const stars=el('div','xo-stars');let val=0;const btns=[1,2,3,4,5].map(n=>{const x=el('button','xo-star','☆');x.type='button';x.addEventListener('click',()=>{val=n;btns.forEach((y,k)=>y.textContent=k<n?'★':'☆');});stars.appendChild(x);return x;});
   const note=field('Anything we should know? (private, optional)');const send=el('button','btn2','Send feedback');send.type='button';
   send.addEventListener('click',async()=>{if(!val){say('Pick a rating first');return;}send.disabled=true;try{const fo={id:'fb-'+oslug(r.item),order:r.item,rating:val,note:note.value.trim(),at:nowIso()};await photos.db.doc('feedback/fb-'+oslug(r.item)).set(fo);fbState.items[fo.id]=fo;say('Thank you for the feedback');try{openDrawer(r);}catch(e){}}catch(e){say('Could not send');send.disabled=false;}});
   b.appendChild(el('p',null,'How was this order?'));b.appendChild(stars);b.appendChild(note);b.appendChild(send);}
  const re=el('button','btn2','Reorder this');re.type='button';re.style.marginTop='8px';re.addEventListener('click',async()=>{if(!confirm('Send Luxella a request to source this again?'))return;re.disabled=true;try{const id='rq-'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);await photos.db.doc('requests/'+id).set({brand:r.brand||'',product:r.item,spec:'',qty:1,budget:0,needBy:'',link:'',photo:'',note:'Reorder of '+(r.order_no||r.item),urgent:false,status:'Submitted',at:nowIso()});say('Reorder request sent. Track it under Request a product.');}catch(e){say('Could not send');re.disabled=false;}});b.appendChild(re);
  pan.appendChild(b);}
 if(own&&done){const fb=fbState.items['fb-'+oslug(r.item)];if(fb){const b=box('Client feedback');b.appendChild(el('p',null,'★'.repeat(fb.rating||0)+'☆'.repeat(5-(fb.rating||0))+(fb.note?' · '+fb.note:'')));pan.appendChild(b);}}
};

/* ================= Owner: Operations (action queue + profit). Costs live in owner-only lx_costs, never in client-readable tables. ================= */
const opsState={costs:{},client:{},audit:[]};
const todayS=()=>new Date().toISOString().slice(0,10);
const isCancelled=r=>/cancel/i.test(String(r.status||''));
function costTotal(c){return ['product','intl','dom','other'].reduce((s,k)=>s+Number((c||{})[k]||0),0);}
function profitOf(r){const c=opsState.costs[r.item];if(!c)return null;const rev=Number(r.payout||0),cost=costTotal(c);return {rev,cost,profit:rev-cost,margin:rev?(rev-cost)/rev*100:0,final:!!c.final};}
function openOrder(item){const r=ordersData().find(x=>x.item===item);if(r&&typeof openDrawer==='function')openDrawer(r);}
function queueItems(){
 const q=[],t=todayS(),rows=ordersData().filter(r=>!isCancelled(r));
 rows.forEach(r=>{const open=!isDone(r);
  if(open&&r.eta_date&&r.eta_date<t)q.push({k:'Overdue',t:(r.order_no||'')+' '+r.item+' · ETA '+dstr(r.eta_date),go:()=>openOrder(r.item)});
  if(open&&Number(r.stage||1)>=4&&!r.intl_tracking_no&&!(r.parcels&&r.parcels.length))q.push({k:'Tracking missing',t:(r.order_no||'')+' '+r.item,go:()=>openOrder(r.item)});
  if(open&&r.eta_date&&r.eta_date>=t&&!costTotal(opsState.costs[r.item]))q.push({k:'Cost not entered',t:(r.order_no||'')+' '+r.item,go:()=>openOrder(r.item),low:1});});
 rows.forEach(r=>{try{if(!isDone(r)&&typeof attention==='function'){const a=attention(r);if(a&&a[0]==='High'&&!(r.eta_date&&r.eta_date<todayS()))q.push({k:'Stuck?',t:(r.order_no||'')+' '+r.item+' · '+(a[2]||''),go:()=>openOrder(r.item)});}}catch(e){}});
 ordersData().filter(isCancelled).forEach(r=>{const paid=typeof paidAmt==='function'?paidAmt(r):0;if(paid>0)q.push({k:'Refund review',t:(r.order_no||'')+' '+r.item+' · '+inr(paid)+' paid, cancelled',go:()=>openOrder(r.item)});});
 (opsState.client.followups||[]).forEach((f,i)=>{if(!f.done&&f.due&&f.due<=todayS())q.push({k:'Follow-up',t:f.text+' · '+dstr(f.due),go:()=>{const e=$('ops-crm');if(e)e.scrollIntoView({behavior:'smooth'});}});});
 Object.values(psState.subs).filter(x=>x.status==='Pending verification').forEach(x=>q.push({k:'Verify payment',t:inr(x.amount)+' · '+x.order+' · '+(x.ref||''),go:()=>goTab('pay')}));
 Object.values(photos.quotes||{}).forEach(x=>{const st=x.status||'Quoted';if(st==='Quoted'&&x.valid){const d=Math.round((new Date(x.valid)-Date.now())/864e5);if(d<=3&&d>=0)q.push({k:'Quote expiring',t:x.item+' · '+dstr(x.valid),go:()=>goTab('ov')});}});
 Object.entries(qrState).forEach(([id,x])=>{if(x.decision==='approved'){const qt=(photos.quotes||{})[x.quote];if(qt&&(qt.status||'Quoted')==='Quoted')q.push({k:'Approved quote',t:x.item+' · create order',go:()=>goTab('ov')});}});
 Object.values(rqState.items).forEach(x=>{if(x.status==='Submitted')q.push({k:'New request',t:(x.brand?x.brand+' ':'')+x.product,go:()=>goTab('ov')});});
 Object.values(state.cases).forEach(c=>{if(c.status==='Submitted'||c.status==='Reopened')q.push({k:'Support case',t:c.ref+' · '+(c.type||''),go:()=>goTab('help')});});
 return q.sort((a,b)=>(a.low?1:0)-(b.low?1:0));
}
function renderOps(){
 const sec=$('ops');if(!sec)return;const body=$('ops-body');body.textContent='';
 const rows=ordersData().filter(r=>!isCancelled(r));
 const sales=rows.reduce((s,r)=>s+Number(r.payout||0),0),cash=rows.reduce((s,r)=>s+(typeof paidAmt==='function'?paidAmt(r):0),0);
 let realized=0,est=0,estN=0,noCost=0;rows.forEach(r=>{const p=profitOf(r);if(!p){noCost++;return;}if(isDone(r)&&p.final)realized+=p.profit;else{est+=p.profit;estN++;}});
 const tiles=el('div','xo-tiles');
 [['Sales (agreed)',inr(sales),'Order value, not cash'],['Cash received',inr(cash),'Verified payments'],['Outstanding',inr(Math.max(0,sales-cash)),'Sales minus cash'],['Realized profit',inr(realized),'Delivered, costs final'],['Pending profit (est.)',inr(est),estN+' order'+(estN===1?'':'s')+(noCost?' · '+noCost+' without cost':'')]].forEach(a=>{const d=el('div','xo-tile');d.appendChild(el('div','lbl',a[0]));d.appendChild(el('b',null,a[1]));d.appendChild(el('small',null,a[2]));tiles.appendChild(d);});
 body.appendChild(tiles);
 const qi=queueItems();body.appendChild(el('h3',null,'Action queue'+(qi.length?' ('+qi.length+')':'')));
 if(!qi.length)body.appendChild(el('p','note','Nothing needs action right now.'));
 qi.slice(0,25).forEach(i=>{const b=el('button','xo-q');b.type='button';b.appendChild(el('span','xchip',i.k));b.appendChild(el('span',null,i.t));b.addEventListener('click',i.go);body.appendChild(b);});
 body.appendChild(el('h3',null,'Profit per order'));
 const tb=el('div','xo-ptable');let any=false;
 rows.slice().sort((a,b)=>String(b.order_date||'')<String(a.order_date||'')?-1:1).forEach(r=>{const p=profitOf(r);if(!p)return;any=true;const row=el('button','xo-prow');row.type='button';row.appendChild(el('span',null,(r.order_no||'')+' '+r.item));row.appendChild(el('span',null,inr(p.rev)+' − '+inr(p.cost)));const pf=el('b',null,inr(p.profit)+' · '+p.margin.toFixed(0)+'%');pf.style.color=p.profit<0?'var(--wine)':'inherit';row.appendChild(pf);row.appendChild(el('em',null,p.final?'Final':'Estimated'));row.addEventListener('click',()=>openOrder(r.item));tb.appendChild(row);});
 body.appendChild(any?tb:el('p','note','Open an order and add its costs to see profit here.'));
 renderBulk(body,rows);renderCrm(body);renderAudit(body);
}
const openIn={};
function fold(body,id,title,fn){const d=el('details','xo-fold');d.id=id;if(openIn[id])d.open=true;d.addEventListener('toggle',()=>{openIn[id]=d.open;});d.appendChild(el('summary',null,title));const w=el('div');d.appendChild(w);fn(w);body.appendChild(d);return d;}
function renderBulk(body,rows){
 fold(body,'ops-bulk','Bulk update orders',w=>{
  const open=rows.filter(r=>!isDone(r));if(!open.length){w.appendChild(el('p','note','No open orders.'));return;}
  const sel={};open.forEach(r=>{const l=el('label','xo-chk');const c=el('input');c.type='checkbox';c.addEventListener('change',()=>{sel[r.item]=c.checked;});l.appendChild(c);l.appendChild(document.createTextNode(' '+(r.order_no||'')+' '+r.item+' · '+(STAGES[Number(r.stage||1)-1]||'')));w.appendChild(l);});
  const st=el('select','xo-in');STAGES.forEach((n,i)=>{const o=el('option',null,(i+1)+' · '+n);o.value=String(i+1);st.appendChild(o);});
  const go=el('button','btn2','Apply to selected');go.type='button';
  go.addEventListener('click',async()=>{const items=Object.keys(sel).filter(k=>sel[k]);if(!items.length){say('Select orders first');return;}const k=Number(st.value);if(!confirm('Move '+items.length+' order(s) to stage '+k+' · '+STAGES[k-1]+'?'))return;go.disabled=true;
   try{for(const it of items){const r=ordersData().find(x=>x.item===it);if(!r)continue;const d=Object.assign({},r,{stage:k});delete d.item;await window.lx.saveOrder(it,d);
     const key=slugOf(it),cur=photos.notes[key]||{};const s2=Object.assign({},cur.stages||{});if(!s2[k])s2[k]=todayS();await photos.db.doc('notes/'+key).set(Object.assign({},cur,{order:it,items:cur.items||[],stages:s2,stageOverride:Math.max(k,Number(cur.stageOverride||0))}));}
    say(items.length+' order(s) updated');}catch(e){say('Stopped part-way. Check orders.');}go.disabled=false;});
  const f=el('div','xo-form');f.appendChild(st);f.appendChild(go);w.appendChild(f);});
}
function renderCrm(body){
 fold(body,'ops-crm','Client notes and follow-ups (private)',w=>{
  const c=opsState.client;const ta=el('textarea','xo-in');ta.rows=4;ta.placeholder='Relationship notes, preferences, anything only you should see';ta.value=c.notes||'';
  const save=async patch=>{const nx=Object.assign({},opsState.client,patch);try{await window.lx.costSave('__client__',nx);opsState.client=nx;renderOps();say('Saved');}catch(e){say('Could not save');}};
  const sb=el('button','btn2','Save notes');sb.type='button';sb.addEventListener('click',()=>save({notes:ta.value}));w.appendChild(ta);w.appendChild(sb);
  w.appendChild(el('h3',null,'Follow-ups'));
  (c.followups||[]).forEach((f,i)=>{const row=el('div','xo-row');row.appendChild(el('span',null,(f.done?'✓ ':'')+f.text+(f.due?' · '+dstr(f.due):'')));const d=el('button','btn2',f.done?'Reopen':'Done');d.type='button';d.addEventListener('click',()=>save({followups:c.followups.map((x,j)=>j===i?Object.assign({},x,{done:!x.done}):x)}));const x=el('button','xo-x','×');x.type='button';x.addEventListener('click',()=>save({followups:c.followups.filter((_,j)=>j!==i)}));row.appendChild(d);row.appendChild(x);w.appendChild(row);});
  const t=field('Follow up on…'),dt=field('Due','date');const add=el('button','btn2','Add');add.type='button';add.addEventListener('click',()=>{if(!t.value.trim())return;save({followups:(c.followups||[]).concat([{text:t.value.trim(),due:dt.value||'',done:false}])});});
  const f=el('div','xo-form');f.appendChild(t);f.appendChild(dt);f.appendChild(add);w.appendChild(f);});
 const d=$('ops-crm');if(d)d.id='ops-crm';
}
function diffKeys(a,b){const un=x=>x&&x.data&&typeof x.data==='object'?x.data:x;a=un(a);b=un(b);const k=new Set([...Object.keys(a||{}),...Object.keys(b||{})]);return [...k].filter(x=>x!=='updated_at'&&JSON.stringify((a||{})[x])!==JSON.stringify((b||{})[x]));}
function renderAudit(body){
 fold(body,'ops-audit','Activity log (who changed what)',w=>{
  const btn=el('button','btn2','Load latest');btn.type='button';const list=el('div');
  const draw=()=>{list.textContent='';if(!opsState.audit.length){list.appendChild(el('p','note','Tap Load latest.'));return;}opsState.audit.forEach(a=>{const keys=a.op==='UPDATE'?diffKeys(a.old_data,a.new_data):[];const what=a.tbl+' '+String(a.op||'').toLowerCase()+' · '+(a.ref||'')+(keys.length?' · '+keys.slice(0,5).join(', '):'');const r=el('div','xo-row');r.appendChild(el('small',null,hm(a.at)));r.appendChild(el('span',null,what));r.appendChild(el('small',null,String(a.actor||'').split('@')[0]));if(a.tbl==='lx_orders'&&a.op==='UPDATE'&&a.old_data&&a.old_data.data&&a.ref){const rv=el('button','btn2','Revert');rv.type='button';rv.addEventListener('click',async()=>{if(!confirm('Restore "'+a.ref+'" to how it was before this change?'))return;const r0=curOrder(a.ref);if(r0)await applyChange(a.ref,a.old_data.data,null,'Reverted '+a.ref);else say('Order not found');});r.appendChild(rv);}list.appendChild(r);});};
  btn.addEventListener('click',async()=>{btn.disabled=true;try{const cid=window.lx.client().id;const r=await window.lx.auditList(cid);opsState.audit=r;draw();}catch(e){say('Could not load log');}btn.disabled=false;});
  w.appendChild(btn);w.appendChild(list);draw();});
}
function buildOps(n){
 n=n||0;const pane=$('pane-mg');if(!pane){if(n<60)setTimeout(()=>buildOps(n+1),250);return;}if($('ops'))return;
 const sec=el('section','card mgc');sec.id='ops';sec.appendChild(el('h2',null,'Operations'));sec.appendChild(el('p','note','Only you see the Admin tab. Costs are stored separately from anything clients can read.'));
 const b=el('div');b.id='ops-body';sec.appendChild(b);pane.insertBefore(sec,pane.firstChild);
 const load=async()=>{try{opsState.costs=await window.lx.costsList();opsState.client=opsState.costs['__client__']||{};delete opsState.costs['__client__'];}catch(e){}renderOps();};load();setInterval(()=>{if(!document.querySelector('#ops-body details[open]'))renderOps();},5000);opsState.reload=load;
}
const _drawer=window.__lxDrawer;
window.__lxDrawer=function(r,pan){
 _drawer(r,pan);
 if(!isOwner())return;
 const c=opsState.costs[r.item]||{};const b=box('Costs (private, ₹)');b.classList.add('owner');
 const f=el('div','xo-form');const mk=(k,ph)=>{const i=field(ph,'number');i.inputMode='decimal';i.value=c[k]!=null?c[k]:'';i.dataset.k=k;f.appendChild(i);return i;};
 const ins=[mk('product','Product cost'),mk('intl','Intl shipping'),mk('dom','India shipping'),mk('other','Fees / other')];
 const lab=el('label','xo-fin');const cb=el('input');cb.type='checkbox';cb.checked=!!c.final;lab.appendChild(cb);lab.appendChild(document.createTextNode(' All costs final'));
 const sv=el('button','btn2','Save costs');sv.type='button';const out=el('p','note');
 const show=()=>{const d={};ins.forEach(i=>d[i.dataset.k]=Number(i.value||0));const t=costTotal(d),rev=Number(r.payout||0);out.textContent='Cost '+inr(t)+' · Profit '+inr(rev-t)+(rev?' · '+((rev-t)/rev*100).toFixed(0)+'%':'')+(cb.checked?'':' (estimated)');};
 ins.forEach(i=>i.addEventListener('input',show));cb.addEventListener('change',show);show();
 sv.addEventListener('click',async()=>{const d={final:cb.checked,at:nowIso(),supplier:sup.value.trim(),pref:pref.value.trim()};ins.forEach(i=>d[i.dataset.k]=Number(i.value||0));try{await window.lx.costSave(r.item,d);opsState.costs[r.item]=d;renderOps();say('Costs saved');show();}catch(e){say('Could not save costs');}});
 const sup=field('Supplier / source','text'),pref=field('Purchase ref','text');sup.value=c.supplier||'';pref.value=c.pref||'';f.insertBefore(pref,f.firstChild);f.insertBefore(sup,f.firstChild);
 f.appendChild(lab);f.appendChild(sv);b.appendChild(f);b.appendChild(out);pan.appendChild(b);
 sv.addEventListener('click',async()=>{try{const cur=Object.assign({},opsState.costs[r.item]||{},{supplier:sup.value.trim(),pref:pref.value.trim()});await window.lx.costSave(r.item,cur);opsState.costs[r.item]=cur;}catch(e){}});
 /* adjustment / refund + cancel */
 const ab=box('Adjustments and cancellation');ab.classList.add('owner');
 const amt=field('Amount (negative = refund)','number'),note=field('Note');const ar=el('button','btn2','Record adjustment');ar.type='button';
 ar.addEventListener('click',async()=>{const v=Number(amt.value);if(!v){say('Enter an amount');return;}try{const key=slugOf(r.item);const cur=(photos.payrec[key]&&photos.payrec[key].items)||[];await photos.db.doc('payrec/'+key).set({order:r.item,items:cur.concat([{amount:v,at:todayS(),method:v<0?'Refund':'Adjustment',ref:note.value.trim(),adj:true}])});say('Recorded');}catch(e){say('Could not record');}});
 const f2=el('div','xo-form');f2.appendChild(amt);f2.appendChild(note);f2.appendChild(ar);ab.appendChild(f2);
 const cx=el('button','btn2',isCancelled(r)?'Reinstate order':'Cancel order');cx.type='button';cx.style.marginTop='8px';
 cx.addEventListener('click',async()=>{if(isCancelled(r)){if(!confirm('Reinstate this order?'))return;await saveOrd(r,{status:STAGES[Number(r.stage||1)-1]||'Ordered'});return;}const why=prompt('Reason for cancelling (kept internally):');if(why===null)return;const paid=typeof paidAmt==='function'?paidAmt(r):0;if(!confirm('Cancel '+r.item+'?'+(paid>0?' '+inr(paid)+' was paid: a refund review will be added to the queue.':'')))return;try{const cur=Object.assign({},opsState.costs[r.item]||{},{cancel_reason:why,cancelled_at:nowIso()});await window.lx.costSave(r.item,cur);opsState.costs[r.item]=cur;}catch(e){}await saveOrd(r,{status:'Cancelled'});});
 ab.appendChild(cx);pan.appendChild(ab);
};

/* ================= Owner: tracker controls with undo ================= */
const COURIERS=[['','—'],['fedex','FedEx'],['ups','UPS'],['dhl','DHL Express'],['usps','USPS'],['delhivery','Delhivery'],['bluedart','Blue Dart'],['dtdc','DTDC'],['ekart','Ekart'],['xpressbees','XpressBees'],['india-post','India Post'],['tirupati-courier','Tirupati Courier']];
const CNAME=Object.fromEntries(COURIERS);
const undoStack=[];let toastEl=null,toastT=null;
const curOrder=item=>ordersData().find(x=>x.item===item);
const clone=v=>JSON.parse(JSON.stringify(v));
function showUndo(desc){
 if(!toastEl){toastEl=el('div','xo-toast');document.body.appendChild(toastEl);}
 toastEl.textContent='';toastEl.appendChild(el('span',null,desc));const b=el('button',null,'Undo');b.type='button';b.addEventListener('click',()=>{toastEl.hidden=true;undoLast();});toastEl.appendChild(b);toastEl.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{toastEl.hidden=true;},10000);
}
async function applyChange(item,patch,notesFn,desc){
 const r=curOrder(item);if(!r)return false;const key=slugOf(item);const n=photos.notes[key];
 const snap={item,order:clone(r),notes:n?clone(n):null,key,desc};
 try{
  const d=Object.assign({},r,patch);delete d.item;await window.lx.saveOrder(item,d);
  if(notesFn){const cur=n?clone(n):{order:item,items:[]};await photos.db.doc('notes/'+key).set(notesFn(cur));}
  undoStack.push(snap);if(undoStack.length>30)undoStack.shift();showUndo(desc);renderUndoBar();return true;
 }catch(e){say('Could not save. Nothing changed.');return false;}
}
async function undoLast(){
 const s=undoStack.pop();if(!s)return;
 if(s.created){try{await window.lx.deleteOrder(s.item);say('Undone: '+s.desc);}catch(e){undoStack.push(s);say('Could not undo.');}renderUndoBar();return;}
 try{const d=clone(s.order);delete d.item;await window.lx.saveOrder(s.item,d);
  if(s.notes)await photos.db.doc('notes/'+s.key).set(s.notes);else{try{await photos.db.doc('notes/'+s.key).delete();}catch(e){}}
  say('Undone: '+s.desc);}catch(e){undoStack.push(s);say('Could not undo.');}
 renderUndoBar();
}
function renderUndoBar(){
 const bar=$('xo-undobar');if(!bar)return;bar.textContent='';
 const b=el('button','btn2','Undo last change');b.type='button';b.disabled=!undoStack.length;b.addEventListener('click',undoLast);bar.appendChild(b);
 bar.appendChild(el('span','note',undoStack.length?(' '+undoStack[undoStack.length-1].desc):' Nothing to undo yet. Every change you make here can be undone.'));
}
function buildUndoBar(){const pane=$('pane-tr');if(!pane||$('xo-undobar'))return;const bar=el('div','xo-undobar owner');bar.id='xo-undobar';pane.insertBefore(bar,pane.firstChild);renderUndoBar();}
/* isLocalO comes from app.js */
const nextStage=r=>{let s=Number(r.stage||1)+1;if(isLocalO(r)&&s>=4&&s<=6)s=7;return Math.min(9,s);};
const prevStage=r=>{let s=Number(r.stage||1)-1;if(isLocalO(r)&&s>=4&&s<=6)s=3;return Math.max(1,s);};
window.__lxSetStage=async function(r0,k){
 const r=curOrder(r0.item)||r0;const cur=Number(r.stage||1);if(k===cur)return;
 const name=(window.stName?window.stName(r,k):STAGES[k-1]);
 const ok=await applyChange(r.item,{stage:k,status:name},n=>{const st=Object.assign({},n.stages||{});if(k<cur){Object.keys(st).forEach(x=>{if(Number(x)>k)delete st[x];});}else{for(let x=cur+1;x<=k;x++){if(x!==k&&isLocalO(r)&&x>=4&&x<=6)continue;if(!st[x])st[x]=todayS();}}if(!st[k])st[k]=todayS();const out=Object.assign(n,{order:r.item,items:n.items||[],stages:st});if(Number(out.stageOverride||0)>k)out.stageOverride=k;return out;},(r.order_no||r.item)+' → '+name);
 if(ok)say(name);
};
function detectIntl(n){n=String(n).replace(/\s+/g,'');if(/^1Z[0-9A-Z]{16}$/i.test(n))return 'ups';if(/^(92|93|94|95)\d{18,20}$/.test(n)||/^[A-Z]{2}\d{9}US$/i.test(n))return 'usps';if(/^\d{10}$/.test(n))return 'dhl';if(/^\d{12}$|^\d{15}$|^\d{20}$|^\d{22}$/.test(n))return 'fedex';return '';}
function detectLocal(n){n=String(n).replace(/\s+/g,'');if(/^\d{11}$/.test(n))return 'bluedart';if(/^\d{13,14}$/.test(n))return 'delhivery';if(/^[A-Z]\d{8,10}$/i.test(n))return 'dtdc';if(/^[A-Z]{2}\d{9}IN$/i.test(n))return 'india-post';return '';}
window.__lxTrk=function(r,card){
 if(!isOwner())return;
 const item=r.item,stage=Number(r.stage||1),local=String(r.order_type).indexOf('Local')>=0;
 const box2=el('div','xo-trk owner');
 /* row 1: big stage buttons + paid */
 const row=el('div','xo-row xo-big');
 const back=el('button','btn2','◀');back.type='button';back.title='Go back one step';back.disabled=stage<=1;back.addEventListener('click',()=>window.__lxSetStage(r,prevStage(r)));
 const nxs=nextStage(r);const nx=el('button','btn',stage>=9?'Delivered ✓':'Next: '+(window.stName?window.stName(r,nxs):STAGES[nxs-1])+' ▶');nx.type='button';nx.disabled=stage>=9;nx.addEventListener('click',()=>window.__lxSetStage(r,nxs));
 const paid=r.payout_status==='Received';
 const pb=el('button','btn2',paid?'✓ Paid':'Mark paid');pb.type='button';pb.addEventListener('click',()=>applyChange(item,paid?{payout_status:'Pending',payment_date:''}:{payout_status:'Received',payment_date:todayS()},null,(r.order_no||item)+(paid?': marked unpaid':': marked paid')));
 row.appendChild(back);row.appendChild(nx);row.appendChild(pb);box2.appendChild(row);
 /* row 1b: confirmations for the current stage */
 {const cr=el('div','xo-row xo-conf');const cur=(window.stName?window.stName(r,stage):STAGES[stage-1]);
  cr.appendChild(el('span','xo-cl','Confirm "'+cur+'" to client'));
  const em=el('button','btn','Send email');em.type='button';
  em.addEventListener('click',async()=>{if(!confirm('Email "'+cur+'" update for '+(r.order_no||item)+' to the client?'))return;em.disabled=true;em.textContent='Sending…';try{const tok=await window.lx.authToken();const cid=window.lx.client().id;const res=await fetch('https://qzripzgbstvxkfobzhyv.supabase.co/functions/v1/lx-push',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok},body:JSON.stringify({manual_stage:{client_id:cid,item}})});const j=await res.json();if(j.sent>0){em.textContent='Email sent ✓';say('Email sent: '+(j.subject||cur));}else{em.textContent='Send email';em.disabled=false;say('Email not sent'+(j.err?': '+j.err:j.error?': '+j.error:''));}}catch(e){em.textContent='Send email';em.disabled=false;say('Could not send email');}});
  const wn=el('button','btn2','Notify on website');wn.type='button';
  wn.addEventListener('click',async()=>{wn.disabled=true;wn.textContent='Posting…';try{const desc=(typeof stepDesc==='function')?stepDesc(r,stage):'';await photos.db.collection('notices').add({title:cur,body:(r.order_no?r.order_no+' · ':'')+item+(desc?' — '+desc:''),item,stage,order_no:r.order_no||'',url:stage===7?'ad':'tr',at:nowIso(),seen:false});wn.textContent='Notified ✓';say('Client will see a popup: '+cur);}catch(e){wn.textContent='Notify on website';wn.disabled=false;say('Could not post the notification');}});
  const pv=el('button','btn2','Preview popup');pv.type='button';pv.addEventListener('click',()=>{const desc=(typeof stepDesc==='function')?stepDesc(r,stage):'';if(window.lxShowNotices)window.lxShowNotices([{id:'preview',preview:true,d:{title:cur,body:(r.order_no?r.order_no+' · ':'')+item+(desc?' — '+desc:''),item,stage,url:stage===7?'ad':'tr',at:nowIso()}}]);});
  cr.appendChild(em);cr.appendChild(wn);cr.appendChild(pv);box2.appendChild(cr);}
 /* row 2: tap-to-edit fields, auto-save */
 const f=el('div','xo-form');
 const lab=(t,i)=>{const l=el('label','xo-lbl');l.appendChild(el('span',null,t));l.appendChild(i);return l;};
 const sdv=((photos.notes[slugOf(item)]||{}).stages||{})[stage]||'';const sdi=field('Date','date');sdi.value=sdv;
 sdi.addEventListener('change',()=>{if(!sdi.value)return;applyChange(item,{},n=>{const st=Object.assign({},n.stages||{});st[stage]=sdi.value;return Object.assign(n,{order:item,items:n.items||[],stages:st});},(r.order_no||item)+': "'+STAGES[stage-1]+'" date set to '+dstr(sdi.value));});
 f.appendChild(lab('Current step done on',sdi));
 const eta=field('ETA','date');eta.value=r.eta_date||'';
 eta.addEventListener('change',()=>{const p={eta_date:eta.value};if(r.eta_date&&eta.value&&eta.value!==r.eta_date)p.eta_prev=r.eta_date;applyChange(item,p,null,(r.order_no||item)+': ETA '+(eta.value?dstr(eta.value):'cleared'));});
 f.appendChild(lab('ETA',eta));
 const trk=(label,key,ckey,cname,det)=>{
  const inp=field('Paste tracking no.');inp.value=r[key]||'';
  const sel=el('select','xo-in xo-cour');COURIERS.forEach(([v,n])=>{const o=el('option',null,n);o.value=v;if(v===(r[ckey]||''))o.selected=true;sel.appendChild(o);});
  inp.addEventListener('change',()=>{const v=inp.value.trim();const c=det(v)||(r[ckey]||'');const p={};p[key]=v;p[ckey]=c;p[cname]=CNAME[c]||'';applyChange(item,p,null,(r.order_no||item)+': '+label.toLowerCase()+' tracking '+(v?'set':'cleared')+(c&&v?' ('+CNAME[c]+')':''));});
  sel.addEventListener('change',()=>{const p={};p[ckey]=sel.value;p[cname]=CNAME[sel.value]||'';applyChange(item,p,null,(r.order_no||item)+': '+label.toLowerCase()+' courier '+(CNAME[sel.value]||'cleared'));});
  const w=el('div','xo-lbl xo-trkw');w.appendChild(el('span',null,label));const g=el('div','xo-row');g.appendChild(inp);g.appendChild(sel);w.appendChild(g);return w;};
 if(!local)f.appendChild(trk('International','intl_tracking_no','intl_courier_slug','intl_courier',detectIntl));
 if(local||stage>=6||r.local_tracking)f.appendChild(trk('India','local_tracking','local_courier_slug','local_courier',detectLocal));
 {const tu=field('Paste AfterShip / tracking page link (optional)');tu.value=r.track_url||'';tu.addEventListener('change',()=>{const v=tu.value.trim();if(v&&!/^https:\/\//.test(v)){alert('Link https:// se start hona chahiye');return;}applyChange(item,{track_url:v},null,(r.order_no||item)+': tracking link '+(v?'set':'cleared'));});f.appendChild(lab('AfterShip link',tu));}
 box2.appendChild(f);
 const fr=el('div','xo-row');const more=el('button','xo-link','More: delay, parcels, costs, cancel →');more.type='button';more.addEventListener('click',()=>{if(typeof openDrawer==='function')openDrawer(curOrder(item)||r);});fr.appendChild(more);
 box2.appendChild(fr);card.appendChild(box2);
};

/* quick add order */
function buildQuickAdd(){
 const bar=$('xo-undobar');if(!bar||$('xo-qa'))return;
 const d=el('details','xo-fold');d.id='xo-qa';d.appendChild(el('summary',null,'+ Add new order'));
 const f=el('div','xo-form');
 const it=field('Item (e.g. Coach Tabby 26, Black)'),br=field('Brand'),pr=field('Price ₹','number');pr.inputMode='numeric';
 const ty=el('select','xo-in');[['ETA','ETA (sourced)'],['In hand (Local)','In hand (Local)']].forEach(([v,n])=>{const o=el('option',null,n);o.value=v;ty.appendChild(o);});
 const ro=el('select','xo-in');[['Direct to client','Direct to client'],['Indirect (via me)','Via reseller']].forEach(([v,n])=>{const o=el('option',null,n);o.value=v;ro.appendChild(o);});
 const go=el('button','btn','Add order');go.type='button';
 go.addEventListener('click',async()=>{const name=it.value.trim();if(!name){say('Enter the item name');return;}if(curOrder(name)){say('An order with this name already exists');return;}
  const rows=ordersData();const m=String(new Date().getMonth()+1).padStart(2,'0');const nums=rows.map(r=>String(r.order_no||'')).filter(n=>n.startsWith('#'+m)).map(n=>Number(n.slice(3))||0);const no='#'+m+String((nums.length?Math.max(...nums):0)+1).padStart(2,'0');
  go.disabled=true;try{await window.lx.saveOrder(name,{item:name,order_no:no,order_date:todayS(),brand:br.value.trim(),order_type:ty.value,direct:ro.value,payout:pr.value===''?null:Number(pr.value),payout_status:'Pending',stage:1,status:STAGES[0],eta_date:'',shipping_date:'',intl_tracking_no:'',intl_courier:'',intl_courier_slug:'',local_tracking:'',local_courier:'',local_courier_slug:''});
   undoStack.push({created:true,item:name,desc:'Added '+no+' '+name});showUndo('Added '+no+' '+name);renderUndoBar();it.value=br.value=pr.value='';d.open=false;}catch(e){say('Could not add the order');}go.disabled=false;});
 [it,br,pr,ty,ro,go].forEach(x=>f.appendChild(x));d.appendChild(f);bar.parentNode.insertBefore(d,bar.nextSibling);
}

/* boot for the flows */
ready(()=>{
 buildPaySub();buildRequests();if(isOwner()){buildOps();buildUndoBar();buildQuickAdd();try{render();}catch(e){}}
 photos.db.collection('paysub').onSnapshot(s=>{const m={};s.docs.forEach(d=>{if(d.exists)m[d.id]=Object.assign({id:d.id},d.data());});psState.subs=m;renderPaySub();},()=>{});
 photos.db.collection('requests').onSnapshot(s=>{const m={};s.docs.forEach(d=>{if(d.exists)m[d.id]=d.data();});rqState.items=m;renderRequests();},()=>{});
 photos.db.collection('quote_resp').onSnapshot(s=>{Object.keys(qrState).forEach(k=>delete qrState[k]);s.docs.forEach(d=>{if(d.exists)qrState[d.id]=d.data();});if(typeof renderQuotes==='function')renderQuotes();},()=>{});
 photos.db.collection('feedback').onSnapshot(sn=>{const m={};sn.docs.forEach(d=>{if(d.exists)m[d.id]=d.data();});fbState.items=m;},()=>{});
 renderPaySub();renderRequests();
});
})();

/* tab bar: show a clear 'more tabs' arrow when the bar scrolls */
(function(){try{const tabs=document.querySelector('.sw .tabs');if(!tabs||tabs.querySelector('.tabs-next'))return;
const b=document.createElement('button');b.type='button';b.className='tabs-next';b.setAttribute('aria-label','More tabs');b.textContent='›';tabs.appendChild(b);
const upd=()=>{b.hidden=tabs.scrollWidth-tabs.clientWidth-tabs.scrollLeft<=6;};
b.addEventListener('click',()=>tabs.scrollBy({left:Math.max(160,tabs.clientWidth*0.6),behavior:'smooth'}));
tabs.addEventListener('scroll',upd,{passive:true});window.addEventListener('resize',upd);setTimeout(upd,300);setTimeout(upd,1500);}catch(e){}})();

/* Good to know -> open the Terms tab */
document.addEventListener('click',function(ev){var b=ev.target.closest&&ev.target.closest('#gtk-terms');if(!b)return;var t=document.getElementById('tab-pol');if(t){t.click();try{t.scrollIntoView({block:'start'});}catch(_e){}window.scrollTo(0,0);}});

/* Owner: adjust every tracker date by hand (order date, each step's date, ETA). Client sees the saved dates. Self-contained (extras helpers live in a closure). */
(function(){const _t=window.__lxTrk;
 const E=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;};
 const own=()=>{try{return !!photos.canEdit;}catch(e){return false;}};
 const key=x=>(typeof pslug==='function'?pslug(x):String(x));
 const msg=t=>{try{if(window.alertMsg)window.alertMsg(t);}catch(e){}};
 const NAMES=['Order placed','Order confirmed','Shipped by retailer/outlet','Received at international hub','Shipped from international hub','Received at Indian warehouse','Address requested','Shipped from Indian warehouse','Delivered'];
 window.__lxTrk=function(r,card){try{if(_t)_t(r,card);}catch(e){}if(!own()||!card)return;
 try{const local=String(r.order_type||'').indexOf('Local')>=0;const k0=key(r.item);const n=(photos.notes||{})[k0]||{};const st=n.stages||{};
 const box=E('details','xo-dates owner');box.appendChild(E('summary',null,'📅 Dates adjust karo (client ko yahi dates dikhengi)'));
 const grid=E('div','xo-dg');const ins={};
 const add=(lab,val,k,hint)=>{const w=E('label','xo-dl');w.appendChild(E('span',null,lab));const i=document.createElement('input');i.type='date';i.value=val?String(val).slice(0,10):'';w.appendChild(i);if(hint)w.appendChild(E('small',null,hint));grid.appendChild(w);ins[k]=i;};
 add('Order date',r.order_date,'order_date');
 NAMES.forEach((t,i)=>{const k=i+1;if(local&&k>=4&&k<=6)return;add((window.stName?window.stName(r,k):t),st[k],'s'+k,k===Number(r.stage||1)?'current step':'');});
 add('Expected delivery (ETA)',r.eta_date,'eta_date','client ko yahi ETA dikhega');
 box.appendChild(grid);
 const row=E('div','xo-dr');const sv=E('button','btn','Save dates');sv.type='button';
 sv.addEventListener('click',async()=>{sv.disabled=true;try{
   const patch={};['order_date','eta_date'].forEach(k=>{const v=ins[k].value;if(v!==(r[k]?String(r[k]).slice(0,10):''))patch[k]=v;});
   if(Object.keys(patch).length){const cur=((typeof dash!=='undefined'&&dash.data('orders').data)||[]).find(x=>x.item===r.item)||r;const d=Object.assign({},cur,patch);delete d.item;await window.lx.saveOrder(r.item,d);}
   const cn=Object.assign({order:r.item,items:[]},JSON.parse(JSON.stringify((photos.notes||{})[k0]||{})));const s2=Object.assign({},cn.stages||{});
   Object.keys(ins).filter(k=>k[0]==='s').forEach(k=>{const kk=k.slice(1);const v=ins[k].value;if(v)s2[kk]=v;else delete s2[kk];});
   cn.stages=s2;cn.order=r.item;cn.items=cn.items||[];await photos.db.doc('notes/'+k0).set(cn);msg('Dates saved ✓');
  }catch(e){msg('Dates save nahi hui: '+(e&&e.message||e));}sv.disabled=false;});
 row.appendChild(sv);row.appendChild(E('small',null,'Khaali chhodoge to us step ki date hat jayegi.'));box.appendChild(row);card.appendChild(box);
 if(!document.getElementById('xo-dates-css')){const s=document.createElement('style');s.id='xo-dates-css';s.textContent='.xo-dates{margin:14px 0;border:1px solid rgba(201,162,39,.35);padding:10px 12px}.xo-dates>summary{cursor:pointer;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold,#C9A227)}.xo-dg{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:12px 0}.xo-dl{display:flex;flex-direction:column;gap:4px;font-size:12px}.xo-dl input{background:transparent;border:1px solid rgba(255,255,255,.18);color:inherit;padding:7px 8px;font:inherit;color-scheme:dark}.xo-dl small{opacity:.6;font-size:10.5px}.xo-dr{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.xo-dr small{opacity:.65;font-size:11px}';document.head.appendChild(s);}
 }catch(e){console.error('xo-dates',e&&e.message);}};})();
