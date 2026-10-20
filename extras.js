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
const PUSHCATS=[['orders','Order updates','Stage changes, tracking, delivery window'],['payments','Payments','Payment received and recorded'],['photos','Photos and proofs','Quality check, delivery proof, photos'],['notes','Notes from Luxella','Pinned notes on your page'],['support','Support replies','Replies and status changes on your cases']];
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
 kv(p1,'Name',C.name);kv(p1,'Business',C.biz);kv(p1,'Sign-in email',email);kv(p1,'Reseller ID','LX-'+String(C.id||'').slice(0,8).toUpperCase());
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
})();
