/* Luxella admin hub — /admin. Owner only. Loaded by shim.js; never loaded on client pages. */
(function(){
const X=window.__lxAdmin; if(!X||!X.S.owner) return;
const {sb,S,esc,adminCall}=X;
const STAGES=['Order placed','Order confirmed','Shipped by retailer/outlet','Received at international hub','Shipped from international hub','Received at Indian warehouse','Address requested','Shipped from Indian warehouse','Delivered'];
const root=document.getElementById('admin-root');
const inr=n=>'₹'+new Intl.NumberFormat('en-IN').format(Number(n)||0);
const base=p=>new URL(p,document.baseURI).href;
let clients=[],counts={},sel=null,toastT;

const css=document.createElement('style');css.textContent=`
#admin-root{min-height:100vh;background:#0A0A0A;color:#F3EEE6;font:300 14px 'Jost',system-ui,sans-serif}
#admin-root *{box-sizing:border-box}
.ad-top{display:flex;align-items:center;gap:14px;padding:14px 22px;border-bottom:1px solid #232120;flex-wrap:wrap}
.ad-top img{height:26px}.ad-top .t{letter-spacing:.3em;text-transform:uppercase;font-size:12px;color:#C9A227}
.ad-top .sp{flex:1}.ad-top .who{color:#A39C90;font-size:12px}
.ad-wrap{display:grid;grid-template-columns:300px 1fr;gap:0;min-height:calc(100vh - 56px)}
.ad-side{border-right:1px solid #232120;padding:18px;overflow:auto}
.ad-main{padding:22px;max-width:980px}
.ad-side h3,.ad-main h2{font:500 11px 'Jost',sans-serif;letter-spacing:.24em;text-transform:uppercase;color:#A39C90;margin:0 0 12px}
.ad-main h2{margin-top:0}
.ad-c{display:block;width:100%;text-align:left;background:#121214;border:1px solid #232120;color:inherit;padding:12px 14px;margin-bottom:8px;cursor:pointer;font:inherit}
.ad-c:hover{border-color:#6B5A24}.ad-c.on{border-color:#C9A227;background:#17150f}
.ad-c b{display:block;font-weight:500;font-size:15px}.ad-c small{color:#A39C90;font-size:11.5px;letter-spacing:.04em}
.ad-card{background:#121214;border:1px solid #232120;padding:18px 20px;margin-bottom:16px}
.ad-card .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:10px}
.ad-card label{display:block;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#A39C90;margin:0 0 10px}
.ad-card input,.ad-card select,.ad-side input{width:100%;background:#0A0A0A;border:1px solid #2A2724;color:#F3EEE6;padding:9px 10px;font:inherit;margin-top:4px}
.ad-side input{margin:0 0 8px}
.ad-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0 14px}
.ad-b{background:#C9A227;color:#0A0A0A;border:0;padding:9px 16px;font:500 12px 'Jost',sans-serif;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;text-decoration:none;display:inline-block}
.ad-b.g{background:transparent;color:#E3C565;border:1px solid #6B5A24}
.ad-b.d{background:transparent;color:#D96C5F;border:1px solid #5a2e29}
.ad-b:disabled{opacity:.5}
.ad-u{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:10px 0;border-top:1px solid #232120}
.ad-u b{font-weight:400;min-width:12rem}.ad-u input{width:11rem;margin:0}
.ad-o{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;padding:10px 0;border-top:1px solid #232120}
.ad-o small{color:#A39C90;display:block;font-size:11.5px}.ad-o select{width:auto;max-width:15rem;margin:0}
.ad-mut{color:#A39C90;font-size:12.5px}
.ad-toast{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:#C9A227;color:#0A0A0A;padding:10px 18px;font-size:13px;z-index:9}
@media(max-width:760px){.ad-wrap{grid-template-columns:1fr}.ad-side{border-right:0;border-bottom:1px solid #232120}.ad-o{grid-template-columns:1fr}}
`;document.head.appendChild(css);

function toast(t){let e=document.querySelector('.ad-toast');if(!e){e=document.createElement('div');e.className='ad-toast';document.body.appendChild(e);}e.textContent=t;e.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{e.hidden=true;},2600);}
function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;}

async function loadClients(){
  const [c,o,u]=await Promise.all([
    sb.from('lx_clients').select('id,slug,name,biz').order('name'),
    sb.from('lx_orders').select('client_id'),
    sb.from('lx_client_users').select('client_id')]);
  if(c.error)throw new Error(c.error.message);
  clients=c.data||[];counts={};
  clients.forEach(x=>counts[x.id]={o:0,u:0});
  (o.data||[]).forEach(r=>{if(counts[r.client_id])counts[r.client_id].o++;});
  (u.data||[]).forEach(r=>{if(counts[r.client_id])counts[r.client_id].u++;});
}

function shell(){
  root.innerHTML='<div class="ad-top"><img src="assets/luxella_logo.png" alt="Luxella"><span class="t">Admin</span><span class="sp"></span><span class="who">'+esc(S.email)+'</span><button class="ad-b g" id="ad-out">Sign out</button></div>'+
  '<div class="ad-wrap"><aside class="ad-side"><h3>Clients</h3><div id="ad-list"></div><h3 style="margin-top:22px">New client</h3><input id="nc-name" placeholder="Client name"><input id="nc-biz" placeholder="Business (optional)"><input id="nc-slug" placeholder="page link, e.g. himanshu"><input id="nc-email" placeholder="client email (optional)"><button class="ad-b" id="nc-go">Create client</button></aside><main class="ad-main" id="ad-main"></main></div>';
  document.getElementById('ad-out').onclick=()=>sb.auth.signOut().then(()=>{location.href=base('./');});
  document.getElementById('nc-go').onclick=createClient;
}

function renderList(){
  const w=document.getElementById('ad-list');w.textContent='';
  const db=el('button','ad-c'+(!sel?' on':''));db.type='button';db.appendChild(el('b',null,'Dashboard'));db.appendChild(el('small',null,'All clients overview'));db.onclick=()=>{sel=null;history.replaceState(null,'','#');renderList();renderClient();};w.appendChild(db);
  if(!clients.length)w.appendChild(el('p','ad-mut','No clients yet.'));
  clients.forEach(c=>{
    const b=el('button','ad-c'+(sel&&sel.id===c.id?' on':''));b.type='button';
    b.appendChild(el('b',null,c.name));
    const n=counts[c.id]||{o:0,u:0};
    b.appendChild(el('small',null,(c.biz?c.biz+' · ':'')+n.o+' orders · '+n.u+' login'+(n.u===1?'':'s')));
    b.onclick=()=>{sel=c;history.replaceState(null,'','#'+c.slug);renderList();renderClient();};
    w.appendChild(b);
  });
}

async function createClient(){
  const name=document.getElementById('nc-name').value.trim(),biz=document.getElementById('nc-biz').value.trim();
  const slug=document.getElementById('nc-slug').value.trim().toLowerCase().replace(/[^a-z0-9-]/g,''),email=document.getElementById('nc-email').value.trim().toLowerCase();
  if(!name||!slug){toast('Name and page link are required.');return;}
  if(['admin','index','assets','vendor','api'].includes(slug)){toast('That page link is reserved.');return;}
  const r=await sb.from('lx_clients').insert({slug,name,biz:biz||null}).select().single();
  if(r.error){toast(r.error.message);return;}
  if(email){const u=await sb.from('lx_client_users').insert({client_id:r.data.id,email});if(u.error)toast('Client created, login failed: '+u.error.message);}
  await loadClients();sel=clients.find(c=>c.id===r.data.id)||null;
  ['nc-name','nc-biz','nc-slug','nc-email'].forEach(i=>document.getElementById(i).value='');
  renderList();renderClient();toast('Client created.');
}

async function renderClient(){
  const m=document.getElementById('ad-main');m.textContent='';
  if(!sel){return renderDash(m);}
  const c=sel;
  const head=el('div','ad-card');
  head.innerHTML='<h2>'+esc(c.name)+'</h2><p class="ad-mut">'+esc(base(c.slug))+'</p>';
  const hr=el('div','row');
  const open=el('a','ad-b','Open client page / edit orders');open.href=base(c.slug);open.target='_blank';open.rel='noopener';hr.appendChild(open);
  const copy=el('button','ad-b g','Copy link');copy.type='button';copy.onclick=()=>{navigator.clipboard&&navigator.clipboard.writeText(base(c.slug)).then(()=>toast('Link copied'));};hr.appendChild(copy);
  head.appendChild(hr);m.appendChild(head);

  /* details */
  const d=el('div','ad-card');d.innerHTML='<h2>Details</h2><div class="ad-g"><label>Client name<input id="cd-name"></label><label>Business<input id="cd-biz"></label></div>';
  const ds=el('button','ad-b','Save');ds.type='button';
  d.appendChild(Object.assign(el('div','row'),{})).appendChild(ds);m.appendChild(d);
  d.querySelector('#cd-name').value=c.name||'';d.querySelector('#cd-biz').value=c.biz||'';
  ds.onclick=async()=>{const r=await sb.from('lx_clients').update({name:d.querySelector('#cd-name').value.trim(),biz:d.querySelector('#cd-biz').value.trim()||null}).eq('id',c.id).select().single();if(r.error){toast(r.error.message);return;}Object.assign(c,r.data);renderList();toast('Saved');};

  /* logins */
  const lg=el('div','ad-card');lg.appendChild(el('h2',null,'Logins'));
  const ul=el('div');lg.appendChild(ul);
  const af=el('div','ad-g');af.style.marginTop='12px';
  af.innerHTML='<label>Add email<input id="lu-email" type="email" placeholder="client@email.com"></label><label>Password (min 8)<input id="lu-pass" placeholder="e.g. Luxella@2026"></label>';
  lg.appendChild(af);
  const ar=el('div','row');const gen=el('button','ad-b g','Generate');gen.type='button';const add=el('button','ad-b','Add login');add.type='button';ar.append(gen,add);lg.appendChild(ar);m.appendChild(lg);
  async function users(){ul.textContent='';const r=await sb.from('lx_client_users').select('email').eq('client_id',c.id).order('email');
    if(r.error){ul.appendChild(el('p','ad-mut',r.error.message));return;}
    if(!(r.data||[]).length){ul.appendChild(el('p','ad-mut','No login yet.'));return;}
    r.data.forEach(u=>{const row=el('div','ad-u');row.appendChild(el('b',null,u.email));
      const pw=document.createElement('input');pw.placeholder='New password';row.appendChild(pw);
      const set=el('button','ad-b g','Set password');set.type='button';set.onclick=async()=>{if(pw.value.length<8){toast('Min 8 characters');return;}set.disabled=true;try{await adminCall({action:'set_password',email:u.email,password:pw.value});toast('Password set');pw.value='';}catch(e){toast(e.message);}set.disabled=false;};row.appendChild(set);
      const rm=el('button','ad-b d','Remove');rm.type='button';rm.onclick=async()=>{if(!confirm('Remove '+u.email+'? They will not be able to sign in.'))return;const x=await sb.from('lx_client_users').delete().match({client_id:c.id,email:u.email});if(x.error){toast(x.error.message);return;}try{await adminCall({action:'delete_user',email:u.email});}catch(e){}counts[c.id].u=Math.max(0,counts[c.id].u-1);renderList();users();toast('Removed');};row.appendChild(rm);
      ul.appendChild(row);});}
  gen.onclick=()=>{const w=['Luxella','Rare','Gold','Prime','Atelier','Maison'];lg.querySelector('#lu-pass').value=w[Math.floor(Math.random()*w.length)]+'@'+(1000+Math.floor(Math.random()*9000));};
  add.onclick=async()=>{const em=lg.querySelector('#lu-email').value.trim().toLowerCase(),pw=lg.querySelector('#lu-pass').value;if(!em){toast('Enter an email');return;}if(pw&&pw.length<8){toast('Password min 8 characters');return;}add.disabled=true;
    try{const r=await sb.from('lx_client_users').insert({client_id:c.id,email:em});if(r.error)throw new Error(r.error.message);if(pw)await adminCall({action:'set_password',email:em,password:pw});counts[c.id].u++;renderList();lg.querySelector('#lu-email').value='';lg.querySelector('#lu-pass').value='';users();toast(pw?'Login added — share email + password':'Login added');}catch(e){toast(e.message);}add.disabled=false;};
  users();

  /* orders */
  const oc=el('div','ad-card');oc.appendChild(el('h2',null,'Orders'));const ol=el('div');oc.appendChild(ol);m.appendChild(oc);
  const r=await sb.from('lx_orders').select('item,data').eq('client_id',c.id);
  if(r.error){ol.appendChild(el('p','ad-mut',r.error.message));return;}
  const rows=(r.data||[]).map(x=>Object.assign({item:x.item},x.data)).sort((a,b)=>String(b.order_no||'').localeCompare(String(a.order_no||'')));
  if(!rows.length)ol.appendChild(el('p','ad-mut','No orders yet. Client page kholke order daalo; stage wahi se badlo.'));
  const tot=rows.reduce((s,x)=>s+(Number(x.payout)||0),0);
  if(rows.length)oc.appendChild(el('p','ad-mut',rows.length+' orders · '+inr(tot)+' total'));
  rows.forEach(o=>{
    const row=el('div','ad-o');const l=el('div');l.appendChild(el('span',null,o.item));l.appendChild(el('small',null,(o.order_no||'')+' · '+inr(o.payout)+' · '+(o.payout_status||'')));row.appendChild(l);
    row.appendChild(el('span','ad-mut','Stage '+(Number(o.stage)||1)+' · '+STAGES[(Number(o.stage)||1)-1]));
    const del=el('button','ad-b d','Delete');del.type='button';del.onclick=async()=>{if(!confirm('Delete "'+o.item+'"? Cannot be undone.'))return;const x=await sb.from('lx_orders').delete().match({client_id:c.id,item:o.item});if(x.error){toast(x.error.message);return;}counts[c.id].o=Math.max(0,counts[c.id].o-1);renderList();row.remove();toast('Deleted');};
    row.appendChild(del);ol.appendChild(row);});
  /* data (raw docs: notes, payinfo, terms, etc.) */
  const dc=el('div','ad-card');dc.appendChild(el('h2',null,'Page data'));dc.appendChild(el('p','ad-mut','Is client page ka saara stored data (notes, payment details, addresses, quotes…). Edit karke Save dabao.'));
  const dl=el('div');dc.appendChild(dl);m.appendChild(dc);
  const dr=await sb.from('lx_docs').select('collection,doc_id,data').eq('client_id',c.id).order('collection');
  if(dr.error)dl.appendChild(el('p','ad-mut',dr.error.message));
  else if(!(dr.data||[]).length)dl.appendChild(el('p','ad-mut','No data yet.'));
  (dr.data||[]).forEach(x=>{
    const det=document.createElement('details');det.style.cssText='border-top:1px solid #232120;padding:8px 0';
    const sm=document.createElement('summary');sm.style.cursor='pointer';sm.textContent=x.collection+' / '+x.doc_id;det.appendChild(sm);
    const ta=document.createElement('textarea');ta.style.cssText='width:100%;min-height:160px;background:#0A0A0A;color:#F3EEE6;border:1px solid #2A2724;font:12px ui-monospace,monospace;padding:8px;margin-top:8px';ta.value=JSON.stringify(x.data,null,2);det.appendChild(ta);
    const rw=el('div','row');const sv=el('button','ad-b','Save');sv.type='button';const dd=el('button','ad-b d','Delete');dd.type='button';rw.append(sv,dd);det.appendChild(rw);
    sv.onclick=async()=>{let j;try{j=JSON.parse(ta.value);}catch(e){toast('Invalid JSON');return;}const u=await sb.from('lx_docs').update({data:j}).match({client_id:c.id,collection:x.collection,doc_id:x.doc_id});toast(u.error?u.error.message:'Saved');};
    dd.onclick=async()=>{if(!confirm('Delete '+x.collection+'/'+x.doc_id+'?'))return;const u=await sb.from('lx_docs').delete().match({client_id:c.id,collection:x.collection,doc_id:x.doc_id});if(u.error){toast(u.error.message);return;}det.remove();toast('Deleted');};
    dl.appendChild(det);});

  /* audit */
  const ac=el('div','ad-card');ac.appendChild(el('h2',null,'Recent changes'));m.appendChild(ac);
  const au=await sb.from('lx_audit').select('at,actor,tbl,op,ref').eq('client_id',c.id).order('at',{ascending:false}).limit(25);
  if(au.error)ac.appendChild(el('p','ad-mut',au.error.message));
  else if(!(au.data||[]).length)ac.appendChild(el('p','ad-mut','Nothing yet.'));
  (au.data||[]).forEach(a=>ac.appendChild(el('div','ad-mut',new Date(a.at).toLocaleString('en-IN')+' · '+(a.actor||'')+' · '+a.op+' '+a.tbl+' '+(a.ref||''))));
}

async function renderDash(m){
  m.appendChild(el('h2',null,'Dashboard'));
  const [o,a]=await Promise.all([sb.from('lx_orders').select('client_id,item,data'),sb.from('lx_audit').select('at,actor,tbl,op,ref,client_id').order('at',{ascending:false}).limit(15)]);
  if(o.error){m.appendChild(el('p','ad-mut',o.error.message));return;}
  const name=id=>(clients.find(c=>c.id===id)||{}).name||'?';
  const rows=(o.data||[]).map(x=>Object.assign({_c:x.client_id,item:x.item},x.data));
  const today=new Date().toISOString().slice(0,10);
  const val=r=>Number(r.payout)||0,del=r=>Number(r.stage)>=9||/deliver/i.test(r.status||'');
  const open=rows.filter(r=>!del(r)),pend=rows.filter(r=>r.payout_status!=='Received');
  const sum=a=>a.reduce((t,r)=>t+val(r),0);
  const late=open.filter(r=>r.eta_date&&r.eta_date<today);
  const kpi=(k,v,sub)=>{const d=el('div','ad-card');d.style.margin='0';d.appendChild(el('div','ad-mut',k));const b=el('div',null,v);b.style.cssText='font-size:26px;margin-top:4px;color:#E3C565';d.appendChild(b);if(sub)d.appendChild(el('div','ad-mut',sub));return d;};
  const g=el('div');g.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:16px';
  g.append(kpi('Clients',String(clients.length)),kpi('Orders',String(rows.length),open.length+' open · '+(rows.length-open.length)+' delivered'),kpi('Total value',inr(sum(rows))),kpi('Payment pending',inr(sum(pend)),pend.length+' orders'),kpi('Late vs ETA',String(late.length),'open orders past ETA'));
  m.appendChild(g);
  // per client
  const pc=el('div','ad-card');pc.appendChild(el('h2',null,'By client'));
  clients.forEach(c=>{const r=rows.filter(x=>x._c===c.id);const row=el('div','ad-o');row.style.gridTemplateColumns='1fr auto auto';
    const l=el('div');l.appendChild(el('span',null,c.name));l.appendChild(el('small',null,r.length+' orders · '+r.filter(x=>!del(x)).length+' open · '+inr(sum(r))));row.appendChild(l);
    row.appendChild(el('span','ad-mut','Pending '+inr(sum(r.filter(x=>x.payout_status!=='Received')))));
    const b=el('button','ad-b g','Open');b.type='button';b.onclick=()=>{sel=c;renderList();renderClient();};row.appendChild(b);pc.appendChild(row);});
  m.appendChild(pc);
  // stages
  const sc=el('div','ad-card');sc.appendChild(el('h2',null,'Open orders by stage'));
  const mx=Math.max(1,...STAGES.map((_,i)=>open.filter(r=>(Number(r.stage)||1)===i+1).length));
  STAGES.forEach((st,i)=>{const n=open.filter(r=>(Number(r.stage)||1)===i+1).length;if(!n)return;const row=el('div');row.style.cssText='display:grid;grid-template-columns:15rem 1fr 2rem;gap:10px;align-items:center;margin:6px 0;font-size:12.5px';row.appendChild(el('span','ad-mut',(i+1)+' · '+st));const bar=el('div');bar.style.cssText='height:8px;background:#C9A227;width:'+Math.round(n/mx*100)+'%';row.appendChild(bar);row.appendChild(el('span',null,String(n)));sc.appendChild(row);});
  if(!open.length)sc.appendChild(el('p','ad-mut','No open orders.'));m.appendChild(sc);
  // attention
  const at=el('div','ad-card');at.appendChild(el('h2',null,'Needs attention'));
  late.sort((x,y)=>x.eta_date.localeCompare(y.eta_date)).forEach(r=>at.appendChild(el('div','ad-mut','Late · '+name(r._c)+' · '+(r.order_no||'')+' '+r.item+' · ETA '+r.eta_date+' · stage '+(r.stage||1))));
  const dn=rows.filter(r=>del(r)&&r.payout_status!=='Received');
  dn.forEach(r=>at.appendChild(el('div','ad-mut','Delivered, payment pending · '+name(r._c)+' · '+(r.order_no||'')+' '+r.item+' · '+inr(r.payout))));
  if(!late.length&&!dn.length)at.appendChild(el('p','ad-mut','All clear.'));m.appendChild(at);
  // activity
  const ac=el('div','ad-card');ac.appendChild(el('h2',null,'Recent activity'));
  (a.data||[]).forEach(x=>ac.appendChild(el('div','ad-mut',new Date(x.at).toLocaleString('en-IN')+' · '+name(x.client_id)+' · '+(x.actor||'')+' · '+x.op+' '+x.tbl+' '+(x.ref||''))));
  if(!(a.data||[]).length)ac.appendChild(el('p','ad-mut','Nothing yet.'));m.appendChild(ac);
}

(async function init(){
  shell();
  try{await loadClients();}catch(e){root.querySelector('#ad-main').textContent=e.message;return;}
  const h=decodeURIComponent((location.hash||'').slice(1));sel=clients.find(c=>c.slug===h)||null;
  renderList();renderClient();
})();
})();
