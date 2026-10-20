/* Luxella portal — owner Manage tab (orders, client, logins). Loaded only for the owner. */
(function(){
const lx=window.lx; if(!lx||!lx.isOwner()) return;
const $=id=>document.getElementById(id);
const el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;};
const STAGES=['Order placed','Order confirmed','Shipped by retailer/outlet','Received at international hub','Shipped from international hub','Received at Indian warehouse','Address requested','Shipped from Indian warehouse','Delivered'];
const COURIERS=[['','—'],['fedex','FedEx'],['ups','UPS'],['dhl','DHL Express'],['usps','USPS'],['delhivery','Delhivery'],['bluedart','Blue Dart'],['dtdc','DTDC'],['ekart','Ekart'],['xpressbees','XpressBees'],['india-post','India Post'],['tirupati-courier','Tirupati Courier']];
const msg=t=>{if(window.alertMsg)window.alertMsg(t);else alert(t);};
const today=()=>new Date().toISOString().slice(0,10);

/* ---------- tab + pane ---------- */
const tabs=document.querySelector('.tabs'); if(!tabs) return;
const tb=el('button','tab','Manage'); tb.id='tab-mg'; tb.setAttribute('role','tab'); tb.setAttribute('aria-selected','false'); tabs.appendChild(tb);
const pane=el('div'); pane.id='pane-mg'; pane.hidden=true;
const helpPane=$('pane-help'); helpPane.parentNode.insertBefore(pane,helpPane.nextSibling);
const allIds=()=>[...tabs.querySelectorAll('.tab')].map(b=>b.id.replace('tab-',''));
tb.addEventListener('click',()=>{allIds().forEach(k=>{const t=$('tab-'+k),p=$('pane-'+k);if(t)t.setAttribute('aria-selected',String(k==='mg'));if(p)p.hidden=k!=='mg';});render();});
tabs.querySelectorAll('.tab:not(#tab-mg)').forEach(b=>b.addEventListener('click',()=>{tb.setAttribute('aria-selected','false');pane.hidden=true;}));

pane.innerHTML='<section class="card mgc"><div class="mgh"><h2>Orders</h2><button class="btn" id="mg-new" type="button">+ New order</button></div><p class="note">Every field here is what the client sees. Changes go live the moment you save.</p><div id="mg-orders"></div></section>'+
'<section class="card mgc"><h2>Client</h2><p class="note">Name and business shown on this page</p><div class="form"><label>Client name<input id="mc-name" type="text"></label><label>Business<input id="mc-biz" type="text" placeholder="e.g. Clinkicks"></label><label>Page link<input id="mc-slug" type="text" readonly></label></div><p class="mgrow"><button class="btn" id="mc-save" type="button">Save client</button></p></section>'+
'<section class="card mgc"><h2>Logins</h2><p class="note">Who can open this page. Set a password and share it with them on WhatsApp.</p><div id="mg-users"></div><div class="form" style="margin-top:12px"><label>Add email<input id="mu-email" type="email" placeholder="client@email.com"></label><label>Password (min 8)<input id="mu-pass" type="text" placeholder="e.g. Luxella@2026"></label></div><p class="mgrow"><button class="btn" id="mu-add" type="button">Add login</button><button class="btn2" id="mu-gen" type="button">Suggest password</button></p></section>'+
'<section class="card mgc"><h2>Page content</h2><p class="note">Edit from the tab where each item appears, with Manage mode on</p><div class="act"><div class="it"><span class="dot"></span><span>Payment details (UPI, bank, QR)<small>Payments tab → Pay Luxella panel</small></span></div><div class="it"><span class="dot"></span><span>Client logo, pinned note, contact line<small>Overview tab, Manage mode</small></span></div><div class="it"><span class="dot"></span><span>Order photos, stage ticks, notes<small>Tracker / Orders tabs, Manage mode</small></span></div><div class="it"><span class="dot"></span><span>Terms of service<small>Send Luxella the new text; it is published as structured sections</small></span></div></div></section>';

/* ---------- orders ---------- */
const FIELDS=[
 ['item','Item (as shown to client)','text'],['brand','Brand','text'],['order_no','Order no (e.g. #1011)','text'],['order_date','Order date','date'],
 ['order_type','Order type','select',[['ETA','ETA (sourced)'],['In hand (Local)','In hand (Local)']]],
 ['direct','Route','select',[['Direct to client','Direct to client'],['Indirect (via me)','Indirect (via reseller)']]],
 ['payout','Price (₹)','number'],['payout_status','Payment','select',[['Pending','Pending'],['Received','Received']]],['payment_date','Payment date','date'],
 ['stage','Stage','select',STAGES.map((s,i)=>[String(i+1),(i+1)+' · '+s])],['status','Status line (optional)','text'],['eta_date','ETA date','date'],['shipping_date','Shipping date','date'],
 ['intl_tracking_no','International tracking no','text'],['intl_courier_slug','International courier','select',COURIERS],
 ['local_tracking','India tracking no','text'],['local_courier_slug','India courier','select',COURIERS]
];
const CNAME=Object.fromEntries(COURIERS);
function form(o){const f=el('div','form');const refs={};FIELDS.forEach(([k,label,type,opts])=>{const l=el('label',null,label);let i;if(type==='select'){i=el('select');opts.forEach(([v,t])=>{const op=el('option',null,t);op.value=v;i.appendChild(op);});i.value=o[k]!=null&&o[k]!==''?String(o[k]):opts[0][0];}else{i=el('input');i.type=type;i.value=o[k]==null?'':String(o[k]);}l.appendChild(i);f.appendChild(l);refs[k]=i;});return {f,refs};}
function collect(refs,base){const d=Object.assign({},base);FIELDS.forEach(([k,,type])=>{let v=refs[k].value.trim();if(k==='payout')v=v===''?null:Number(v);if(k==='stage')v=Number(v)||1;d[k]=v;});d.intl_courier=CNAME[d.intl_courier_slug]||'';d.local_courier=CNAME[d.local_courier_slug]||'';if(!d.status){d.status=d.stage>=9?'Delivered':d.stage===1?'Ordered':'In Transit';}if(d.payout_status==='Received'&&!d.payment_date)d.payment_date=today();return d;}
let editing=null; // item being edited, or '__new__'
function render(){
 const list=$('mg-orders'); if(!list) return; list.textContent='';
 const o=window.dash.data('orders'); const rows=(o.data||[]).slice().sort((a,b)=>String(b.order_no||'').localeCompare(String(a.order_no||'')));
 if(editing==='__new__'){list.appendChild(editor({order_date:today(),order_type:'ETA',direct:'Direct to client',payout_status:'Pending',stage:1,order_no:nextNo(rows)},true));}
 if(!rows.length&&editing!=='__new__')list.appendChild(el('p','lbl','No orders yet. Tap + New order.'));
 rows.forEach(r=>{if(editing===r.item){list.appendChild(editor(r,false));return;}
  const card=el('div','mgo');const hd=el('div','hd');hd.appendChild(el('b',null,r.item));hd.appendChild(el('span','lbl',(r.order_no||'')+' · '+(STAGES[(Number(r.stage)||1)-1])+' · ₹'+new Intl.NumberFormat('en-IN').format(Number(r.payout)||0)+' · '+(r.payout_status||'')));card.appendChild(hd);
  const act=el('div','mgrow');const e=el('button','btn2','Edit');e.type='button';e.addEventListener('click',()=>{editing=r.item;render();});act.appendChild(e);
  const quick=el('select');quick.className='inp qstage';STAGES.forEach((s,i)=>{const op=el('option',null,'Stage '+(i+1)+' · '+s);op.value=String(i+1);quick.appendChild(op);});quick.value=String(Number(r.stage)||1);quick.addEventListener('change',async()=>{const d=Object.assign({},r,{stage:Number(quick.value)});delete d.item;if(d.stage>=9)d.status='Delivered';else if(d.status==='Delivered')d.status='In Transit';try{await lx.saveOrder(r.item,d);msg('Stage updated.');}catch(err){msg('Could not save: '+err.message);}});act.appendChild(quick);
  card.appendChild(act);list.appendChild(card);});
}
function nextNo(rows){const m=String(new Date().getMonth()+1).padStart(2,'0');const nums=rows.map(r=>String(r.order_no||'')).filter(n=>n.startsWith('#'+m)).map(n=>Number(n.slice(3))||0);return '#'+m+String((nums.length?Math.max(...nums):0)+1).padStart(2,'0');}
function editor(o,isNew){const card=el('div','mgo editing');card.appendChild(el('div','eyebrow',isNew?'New order':'Edit order'));const {f,refs}=form(o);card.appendChild(f);
 const act=el('div','mgrow');const save=el('button','btn',isNew?'Create order':'Save changes');save.type='button';save.addEventListener('click',async()=>{const d=collect(refs,o);const item=d.item;if(!item){msg('Item name is required.');return;}delete d.item;save.disabled=true;try{if(isNew){await lx.saveOrder(item,d);}else{await lx.renameOrder(o.item,item,d);}editing=null;msg(isNew?'Order created.':'Saved.');render();}catch(err){msg('Could not save: '+err.message);}save.disabled=false;});act.appendChild(save);
 const cancel=el('button','btn2','Cancel');cancel.type='button';cancel.addEventListener('click',()=>{editing=null;render();});act.appendChild(cancel);
 if(!isNew){const del=el('button','btn2 danger','Delete order');del.type='button';del.addEventListener('click',async()=>{if(!confirm('Delete "'+o.item+'" from this client page? This cannot be undone.'))return;try{await lx.deleteOrder(o.item);editing=null;msg('Deleted.');render();}catch(err){msg('Could not delete: '+err.message);}});act.appendChild(del);}
 card.appendChild(act);return card;}
$('mg-new').addEventListener('click',()=>{editing='__new__';render();tb.click();window.scrollTo({top:pane.offsetTop-20,behavior:'smooth'});});

/* ---------- client ---------- */
function fillClient(){const c=lx.client();if(!c)return;$('mc-name').value=c.name||'';$('mc-biz').value=c.biz||'';$('mc-slug').value=new URL(c.slug,document.baseURI).href;}
$('mc-save').addEventListener('click',async()=>{try{await lx.updateClient({name:$('mc-name').value.trim(),biz:$('mc-biz').value.trim()});msg('Client saved.');}catch(err){msg('Could not save: '+err.message);}});

/* ---------- logins ---------- */
async function renderUsers(){const w=$('mg-users');w.textContent='';let users=[];try{users=await lx.listUsers();}catch(e){w.appendChild(el('p','lbl','Could not load logins: '+e.message));return;}
 if(!users.length){w.appendChild(el('p','lbl','No client login yet. Add an email and password below.'));return;}
 users.forEach(u=>{const row=el('div','mgu');row.appendChild(el('b',null,u.email));const act=el('div','mgrow');
  const pw=el('input');pw.className='inp';pw.type='text';pw.placeholder='New password';act.appendChild(pw);
  const set=el('button','btn2','Set password');set.type='button';set.addEventListener('click',async()=>{if(pw.value.length<8){msg('Password must be at least 8 characters.');return;}set.disabled=true;try{await lx.setPassword(u.email,pw.value);msg('Password set for '+u.email);pw.value='';}catch(err){msg('Could not set: '+err.message);}set.disabled=false;});act.appendChild(set);
  const rm=el('button','btn2 danger','Remove');rm.type='button';rm.addEventListener('click',async()=>{if(!confirm('Remove '+u.email+' from this page? They will no longer be able to sign in.'))return;try{await lx.removeUser(u.id);try{await lx.deleteLogin(u.email);}catch(e){}msg('Removed.');renderUsers();}catch(err){msg('Could not remove: '+err.message);}});act.appendChild(rm);
  row.appendChild(act);w.appendChild(row);});}
$('mu-gen').addEventListener('click',()=>{const words=['Luxella','Rare','Gold','Prime','Atelier','Maison'];const w=words[Math.floor(Math.random()*words.length)];$('mu-pass').value=w+'@'+(1000+Math.floor(Math.random()*9000));});
$('mu-add').addEventListener('click',async()=>{const email=$('mu-email').value.trim().toLowerCase(),pass=$('mu-pass').value;if(!email){msg('Enter an email.');return;}if(pass&&pass.length<8){msg('Password must be at least 8 characters.');return;}const b=$('mu-add');b.disabled=true;try{await lx.addUser(email);if(pass)await lx.setPassword(email,pass);msg(pass?'Login added. Share the email + password with them.':'Email added. Set a password to let them sign in.');$('mu-email').value='';$('mu-pass').value='';renderUsers();}catch(err){msg('Could not add: '+err.message);}b.disabled=false;});

window.dash.onData(()=>{render();fillClient();});
renderUsers();
})();
