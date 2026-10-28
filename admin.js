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
.ad-addr{margin-top:12px;padding:10px 12px;border:1px dashed #3A3222;border-radius:10px;font-size:13.5px;line-height:1.45;color:#E6E0D4;display:flex;flex-direction:column;gap:6px;align-items:flex-start}.ad-addr.hot{border-color:#C9A227;background:#1a160d;animation:adfade .25s ease both}.ad-addr b{color:#E3C565}.ad-wa{margin-top:10px;display:flex;flex-direction:column;gap:6px}.ad-wa-p{white-space:pre-wrap;font-size:12.5px;color:#A39C90;background:#0b0b0c;border:1px solid #232120;border-radius:8px;padding:8px 10px;line-height:1.45}@keyframes adfade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}.ad-card{background:#121214;border:1px solid #232120;padding:18px 20px;margin-bottom:16px}
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
.ad-nav{display:flex;gap:4px}.ad-nb{background:transparent;border:1px solid #2A2724;color:#A39C90;padding:8px 16px;font:500 11px 'Jost',sans-serif;letter-spacing:.2em;text-transform:uppercase;cursor:pointer}.ad-nb.on{background:linear-gradient(180deg,#F4E1A0,#E3C06A 50%,#B8943F);color:#0A0A0A;border-color:#E3C06A}
.ad-cv{padding:14px 18px}.ad-cv[hidden],.ad-bb[hidden]{display:none}.ad-cvbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px}.ad-cc{background:#121214;border:1px solid #232120;color:#F3EEE6;padding:9px 14px;font:inherit;cursor:pointer}.ad-cc.on{border-color:#C9A227;background:#17150f;color:#E3C565}.ad-cvbar .ad-b{margin-left:auto}
.ad-fr{display:block;width:100%;max-width:480px;height:calc(100vh - 170px);min-height:600px;border:1px solid #3A3222;background:#0B0B0C;margin:10px auto 0}
.ad-wrap[hidden]{display:none!important}
.dz-hd{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}.dz-hd h2{margin:0!important;flex:0 0 auto}.dz-search{flex:1 1 260px;background:#0A0A0A;border:1px solid #2A2724;color:#F3EEE6;padding:10px 12px;font:inherit}.dz-auto{font-size:12px;color:#A39C90;display:flex;align-items:center;gap:6px}
.dz-sres{margin:-4px 0 12px}.dz-hit{display:grid;grid-template-columns:1fr auto;gap:2px 10px;align-items:center;padding:8px 10px;border:1px solid #232120;margin-bottom:6px;background:#121214}.dz-hit .ad-mut{grid-column:1}.dz-hit a{grid-row:1/3;grid-column:2}
.dz-chips{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}.dz-chip{display:flex;align-items:baseline;gap:8px;background:#121214;border:1px solid #232120;color:#A39C90;padding:9px 14px;cursor:pointer;font:inherit;font-size:12px}.dz-chip b{font-size:18px;color:#F3EEE6;font-weight:400}.dz-chip.warn{border-color:#6B5A24}.dz-chip.warn b{color:#E3C565}
.dz-tabs{display:flex;gap:2px;border-bottom:1px solid #2A2724;margin-bottom:16px;overflow-x:auto;scrollbar-width:none}.dz-tab{background:transparent;border:0;border-bottom:2px solid transparent;color:#A39C90;padding:10px 14px;font:500 11px 'Jost',sans-serif;letter-spacing:.2em;text-transform:uppercase;cursor:pointer;white-space:nowrap}.dz-tab.on{color:#E3C565;border-bottom-color:#E3C565}
.dz-tab .nb{display:inline-block;min-width:18px;padding:1px 6px;margin-left:6px;border-radius:10px;background:#E3C565;color:#000;font-size:10px;letter-spacing:0;text-align:center;vertical-align:1px}
.ib-hd{display:flex;align-items:center;gap:10px;margin-bottom:10px}.ib-hd .sp{flex:1}.ib-f{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}.ib-f button{background:#121214;border:1px solid #232120;color:#A39C90;padding:5px 11px;font:inherit;font-size:11.5px;cursor:pointer;letter-spacing:.04em}.ib-f button.on{color:#E3C565;border-color:#6B5A24}
.ib-it{display:grid;grid-template-columns:34px 1fr auto;gap:4px 12px;align-items:start;padding:12px 12px;border:1px solid #232120;background:#121214;margin-bottom:8px;transition:border-color .25s,background .25s;animation:ibin .35s ease both}.ib-it.new{border-left:3px solid #E3C565;background:#15130F}.ib-it .ic{font-size:20px;line-height:1.1;grid-row:1/4}.ib-it .t{font-size:14px;color:#F3EEE6}.ib-it .t b{color:#E3C565;font-weight:500}.ib-it .m{font-size:12px;color:#A39C90;grid-column:2}.ib-it .s{grid-column:2;font-size:13px;color:#C9C2B6;white-space:pre-wrap;word-break:break-word;margin-top:2px}.ib-it .a{grid-column:3;grid-row:1/4;display:flex;flex-direction:column;gap:6px;align-items:stretch;min-width:120px}.ib-it .a .ad-b{padding:7px 10px;font-size:11px;text-align:center}
@keyframes ibin{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}@media(max-width:640px){.ib-it{grid-template-columns:28px 1fr}.ib-it .a{grid-column:1/3;grid-row:auto;flex-direction:row;flex-wrap:wrap}}
.ib-eyes{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:-2px 0 12px;font-size:12px;color:#A39C90}.ib-eyes>b{font-weight:500;color:#C9C2B6;margin-right:4px}.ib-eye{border:1px solid #232120;background:#0F0F11;padding:5px 10px;color:#A39C90}.ib-eye b{color:#F3EEE6;font-weight:500}.ib-eye.hot{border-color:#6B5A24;color:#E3C565}.ib-eye.hot b{color:#E3C565}
.dz-pane[hidden]{display:none}.dz-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:16px}.dz-kpi{background:#121214;border:1px solid #232120;padding:14px 16px}.dz-kpi .v{font-size:24px;color:#E3C565;margin:4px 0}
.dz-bar{display:grid;grid-template-columns:16rem 1fr 2rem;gap:10px;align-items:center;margin:6px 0;font-size:12.5px}.dz-bar .b{height:8px;background:#1C1A17}.dz-bar .b i{display:block;height:100%;background:linear-gradient(90deg,#B8943F,#F4E1A0)}
.dz-chart{display:flex;gap:14px;align-items:flex-end;height:160px;margin-top:12px;padding-top:6px;border-bottom:1px solid #2A2724}.dz-chart .c{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%}.dz-chart .bars{flex:1;width:100%;display:flex;gap:4px;align-items:flex-end;justify-content:center}.dz-chart i{display:block;width:40%;max-width:22px;min-height:2px}.dz-chart .b1{background:#C9A227}.dz-chart .b2{background:#3E7D5A}
.dz-stk{display:grid;grid-template-columns:56px 1fr auto auto;gap:12px;align-items:center;padding:10px 0;border-top:1px solid #232120}.dz-stk img{width:56px;height:56px;object-fit:cover;background:#fff}.dz-noimg{width:56px;height:56px;display:flex;align-items:center;justify-content:center;border:1px solid #232120;color:#555}.dz-pr{color:#E3C565}.dz-act{display:flex;gap:6px}
.dz-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin-top:8px}.dz-form input,.dz-form select,.dz-form textarea{background:#0A0A0A;border:1px solid #2A2724;color:#F3EEE6;padding:9px 10px;font:inherit;width:100%}.dz-form textarea{grid-column:1/-1}.dz-form label{font-size:12.5px;color:#A39C90;display:flex;align-items:center;gap:6px}
.dz-cl{display:flex;gap:14px;flex-wrap:wrap;margin:8px 0;font-size:13px}
.dz-tbl{display:grid;gap:0}.dz-tr{display:grid;grid-template-columns:2fr .6fr .6fr 1fr 1fr 1fr .9fr .9fr auto;gap:10px;align-items:center;padding:10px 0;border-top:1px solid #232120;font-size:13px}.dz-tr.th{color:#A39C90;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;border-top:0}
.dz-act-row{font-size:12.5px;color:#A39C90;padding:6px 0;border-top:1px solid #1A1917}
@media(max-width:760px){.dz-tr{grid-template-columns:1.6fr .6fr 1fr 1fr auto}.dz-tr>span:nth-child(3),.dz-tr>span:nth-child(5),.dz-tr>span:nth-child(6),.dz-tr>span:nth-child(7){display:none}.dz-stk{grid-template-columns:48px 1fr}.dz-stk .dz-pr,.dz-stk .dz-act{grid-column:2}.dz-bar{grid-template-columns:9rem 1fr 1.5rem}}
.dz-cl label,.dz-form label{display:flex!important;align-items:center;gap:6px;text-transform:none!important;letter-spacing:0!important;margin:0!important;font-size:13px!important;color:#F3EEE6!important}.dz-cl input,.dz-form label input{width:auto!important;margin:0!important}
.ad-nc{margin-top:18px;border-top:1px solid #232120;padding-top:14px}.ad-nc>summary{cursor:pointer;list-style:none;font:500 11px 'Jost',sans-serif;letter-spacing:.24em;text-transform:uppercase;color:#E3C565;margin-bottom:10px}.ad-nc>summary::-webkit-details-marker{display:none}
@media(max-width:760px){.ad-wrap{grid-template-columns:1fr}.ad-side{border-right:0;border-bottom:1px solid #232120}.ad-o{grid-template-columns:1fr}}
`;document.head.appendChild(css);

function toast(t){let e=document.querySelector('.ad-toast');if(!e){e=document.createElement('div');e.className='ad-toast';document.body.appendChild(e);}e.textContent=t;e.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{e.hidden=true;},2600);}
function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;}

async function loadClients(){
  const [c,o,u,v]=await Promise.all([
    sb.from('lx_clients').select('id,slug,name,biz').order('name'),
    sb.from('lx_orders').select('client_id'),
    sb.from('lx_client_users').select('client_id'),
    sb.from('lx_docs').select('client_id,doc_id,data').eq('collection','visits')]);
  if(c.error)throw new Error(c.error.message);
  clients=c.data||[];counts={};
  clients.forEach(x=>counts[x.id]={o:0,u:0,v:0,v7:0,vt:0,last:'',ua:''});
  const wk=new Date(Date.now()-7*864e5).toISOString().slice(0,10),td=new Date(Date.now()+5.5*3600e3).toISOString().slice(0,10);
  (v.data||[]).forEach(r=>{const k=counts[r.client_id];if(!k)return;const d=r.data||{};const n=Number(d.n)||0;k.v+=n;if(r.doc_id>=wk)k.v7+=n;if(r.doc_id===td)k.vt+=n;if(d.last_at>k.last){k.last=d.last_at;k.ua=d.ua||'';}});
  (o.data||[]).forEach(r=>{if(counts[r.client_id])counts[r.client_id].o++;});
  (u.data||[]).forEach(r=>{if(counts[r.client_id])counts[r.client_id].u++;});
}

function shell(){
  root.innerHTML='<div class="ad-top"><img src="assets/luxella_logo.png" alt="Luxella"><span class="t">Admin</span><span class="sp"></span><span class="who">'+esc(S.email)+'</span><button class="ad-b g" id="ad-out">Sign out</button></div>'+
  '<div class="ad-wrap"><aside class="ad-side"><h3>Clients</h3><div id="ad-list"></div><details class="ad-nc"><summary>+ New client</summary><input id="nc-name" placeholder="Client name"><input id="nc-biz" placeholder="Business (optional)"><input id="nc-slug" placeholder="page link, e.g. himanshu"><input id="nc-email" placeholder="client email (optional)"><button class="ad-b" id="nc-go">Create client</button></details></aside><main class="ad-main" id="ad-main"></main></div>';
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
    b.appendChild(el('small',null,n.v?'👁 '+n.v+'× opened · '+n.v7+' this week · last '+agoA(n.last)+(n.ua?' · '+n.ua:''):'👁 not opened yet'));
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
  try{const tm=await sb.from('lx_docs').select('data').eq('collection','meta').eq('doc_id','terms').limit(1).maybeSingle();if(tm.data&&tm.data.data)await sb.from('lx_docs').insert({client_id:r.data.id,collection:'meta',doc_id:'terms',data:tm.data.data});}catch(_e){}
  /* shared defaults for a new client: Ready-to-ship stock + Luxella contact + pay info, copied from an existing client */
  try{const src=clients.find(c=>c.id!==r.data.id&&!/^zz/.test(c.slug||''));if(src){const sd=await sb.from('lx_docs').select('collection,doc_id,data').eq('client_id',src.id).or('collection.eq.stock,and(collection.eq.meta,doc_id.in.(contact,payinfo))');const rows=(sd.data||[]).map(x=>({client_id:r.data.id,collection:x.collection,doc_id:x.doc_id,data:x.data}));if(rows.length)await sb.from('lx_docs').upsert(rows,{onConflict:'client_id,collection,doc_id',ignoreDuplicates:true});}}catch(_e){}
  if(email){const u=await sb.from('lx_client_users').insert({client_id:r.data.id,email});if(u.error)toast('Client created, login failed: '+u.error.message);}
  /* auto welcome: one-time popup on their page + one-time branded welcome email (personalised per account) */
  try{const first=String(name).split(' ')[0];await sb.from('lx_docs').upsert({client_id:r.data.id,collection:'notices',doc_id:'welcome',data:{title:'Welcome to Luxella, '+first,body:'Your private client page is ready. Browse pieces ready to ship, place new orders, track every order step by step, see your payments and message Luxella — all in one place.',url:'rts',at:new Date().toISOString(),seen:false}},{onConflict:'client_id,collection,doc_id',ignoreDuplicates:true});}catch(_e){}
  if(email){try{const ss=(await sb.auth.getSession()).data.session;const wr=await fetch(sb.supabaseUrl+'/functions/v1/lx-welcome',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+(ss&&ss.access_token||''),apikey:sb.supabaseKey},body:JSON.stringify({client_id:r.data.id})});const w={};const d=await wr.json().catch(()=>({}));toast(d.sent?'Welcome email sent to '+email:(d.skipped?'Welcome email already sent':'Welcome email nahi gaya: '+(d.err||(w.error&&w.error.message)||'')));}catch(e){toast('Welcome email error');}}
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

  /* inbox */
  const ib=el('div','ad-card');ib.appendChild(el('h2',null,'Inbox (client messages)'));m.appendChild(ib);
  const th=el('div');th.style.cssText='max-height:340px;overflow:auto;display:flex;flex-direction:column;gap:8px;margin:8px 0';ib.appendChild(th);
  const sg=async u=>{if(!u)return '';if(u.indexOf('lxp:')!==0)return u;const r=await sb.storage.from('lx-private').createSignedUrl(u.slice(4),3600);return r.data?r.data.signedUrl:'';};
  async function loadInbox(){const r=await sb.from('lx_docs').select('data').eq('client_id',c.id).eq('collection','case_msgs').eq('data->>case','inbox');th.textContent='';const L=(r.data||[]).map(x=>x.data).filter(x=>x&&x.at).sort((a,b)=>a.at<b.at?-1:1);if(!L.length)th.appendChild(el('p','ad-mut','No messages yet.'));
   for(const x of L){const b=el('div');b.style.cssText='padding:8px 10px;max-width:85%;font-size:13px;border:1px solid #2A2724;'+(x.from==='luxella'?'align-self:flex-end;background:#1C1A17':'align-self:flex-start');if(x.text)b.appendChild(el('div',null,x.text));for(const f of (x.files||[])){const u=await sg(f);if(u){const im=document.createElement('img');im.src=u;im.style.cssText='display:block;max-width:100%;max-height:200px;margin-top:6px';b.appendChild(im);}}if(x.voice){const u=await sg(x.voice);if(u){const a=document.createElement('audio');a.controls=true;a.src=u;a.style.cssText='display:block;margin-top:6px;max-width:240px';b.appendChild(a);}}b.appendChild(el('div','ad-mut',(x.from==='luxella'?'You':'Client')+' · '+new Date(x.at).toLocaleString('en-IN')));th.appendChild(b);}th.scrollTop=th.scrollHeight;}
  loadInbox();
  const rt=document.createElement('textarea');rt.placeholder='Reply to client…';rt.style.cssText='width:100%;min-height:56px;background:#0A0A0A;color:#F3EEE6;border:1px solid #2A2724;padding:8px';ib.appendChild(rt);
  const rr=el('div','row');const rs=el('button','ad-b','Send reply');rs.type='button';const rf=el('button','ad-b','Refresh');rf.type='button';rr.append(rs,rf);ib.appendChild(rr);
  rf.onclick=loadInbox;
  rs.onclick=async()=>{const t=rt.value.trim();if(!t)return;const id='m'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);const w=await sb.from('lx_docs').insert({client_id:c.id,collection:'case_msgs',doc_id:id,data:{case:'inbox',ref:'',text:t,files:[],voice:'',from:'luxella',at:new Date().toISOString()}});if(w.error){toast(w.error.message);return;}rt.value='';toast('Sent');loadInbox();};
  /* audit */
  const ac=el('div','ad-card');ac.appendChild(el('h2',null,'Recent changes'));m.appendChild(ac);
  const au=await sb.from('lx_audit').select('at,actor,tbl,op,ref').eq('client_id',c.id).order('at',{ascending:false}).limit(25);
  if(au.error)ac.appendChild(el('p','ad-mut',au.error.message));
  else if(!(au.data||[]).length)ac.appendChild(el('p','ad-mut','Nothing yet.'));
  (au.data||[]).forEach(a=>ac.appendChild(el('div','ad-mut',new Date(a.at).toLocaleString('en-IN')+' · '+(a.actor||'')+' · '+a.op+' '+a.tbl+' '+(a.ref||''))));
}


/* ---- order control board: change stage / tracking / ETA / payment for any client's order ---- */
const pslugA=x=>String(x).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60);
const todayA=()=>new Date().toISOString().slice(0,10);
const slugA=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60);
let ADDRS=[];const loadAddrs=async()=>{try{const r=await sb.from('lx_docs').select('client_id,doc_id,data').eq('collection','addresses');ADDRS=r.data||[];}catch(e){}return ADDRS;};
const addrOf=r=>{const d=ADDRS.find(x=>x.client_id===r._c&&(x.doc_id===slugA(r.item)||String((x.data||{}).order||'')===r.item||(r.order_no&&String((x.data||{}).order||'').includes(r.order_no))));return d?Object.assign({_id:d.doc_id},d.data):null;};
const agoA=t=>{if(!t)return '—';const d=Date.now()-new Date(t);if(d<60e3)return 'just now';if(d<3600e3)return Math.round(d/60e3)+' min ago';if(d<86400e3)return Math.round(d/3600e3)+' h ago';if(d<7*86400e3)return Math.round(d/86400e3)+' d ago';return new Date(t).toLocaleDateString('en-IN',{day:'numeric',month:'short'});};
const inrA=n=>'₹'+Number(n||0).toLocaleString('en-IN');
/* Per-stage WhatsApp message (Luxella voice). c = client row, r = order */
function waMsg(r,c,st){st=Number(st||r.stage)||1;const first=String((c&&c.name)||'').split(' ')[0]||'there';const no=r.order_no?r.order_no+' ':'';const item=r.item||'your item';const link=base((c&&c.slug)||'');const eta=r.eta_date?' Expected by '+new Date(r.eta_date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})+'.':'';const bal=r.payout_status!=='Received'&&Number(r.payout)?' Balance '+inrA(r.payout)+' — pay from your page: '+link+'#pay':'';
 const T={
  1:`Hi ${first}! Your Luxella order ${no}(${item}) is placed. Track it anytime here: ${link}#tr`,
  2:`Hi ${first}, good news — ${no}${item} is confirmed with the store.${eta} Live tracking: ${link}#tr`,
  3:`Hi ${first}, ${no}${item} has been shipped by the store and is on its way to our international hub.${eta} Track: ${link}#tr`,
  4:`Hi ${first}, ${no}${item} has reached our international hub. Next stop: India ✈️ ${link}#tr`,
  5:`Hi ${first}, ${no}${item} has left for India. Usually 7–10 days from here.${eta} ${link}#tr`,
  6:`Hi ${first}, ${no}${item} has landed in India 🇮🇳 and is being prepared for dispatch. ${link}#tr`,
  7:`Hi ${first}, ${no}${item} is ready to dispatch! Please add your delivery address + phone here (30 sec): ${link}#ad:${slugA(item)} — we ship within 24 hours of receiving it.`,
  8:`Hi ${first}, ${no}${item} is dispatched${r.local_courier?' via '+r.local_courier:''}${r.local_tracking?' · tracking: '+r.local_tracking:''}.${eta} Live status: ${link}#tr`,
  9:`Hi ${first}, ${no}${item} is delivered 🎉 Hope you love it!${bal} — Luxella`};
 return (T[st]||T[1]).replace(/\s+—\s+Luxella$/,'')+(st===9?'':'\n— Luxella');}
const waHref=(phone,text)=>'https://wa.me/'+String(phone||'').replace(/[^0-9]/g,'').replace(/^(\d{10})$/,'91$1')+'?text='+encodeURIComponent(text);

async function saveOrderPatch(clientId,item,patch,stageTo){
  const cur=await sb.from('lx_orders').select('data').match({client_id:clientId,item}).single();
  if(cur.error)throw new Error(cur.error.message);
  const old=cur.data.data||{};const next=Object.assign({},old,patch);
  const u=await sb.from('lx_orders').update({data:next,updated_at:new Date().toISOString()}).match({client_id:clientId,item});
  if(u.error)throw new Error(u.error.message);
  if(stageTo){
    const key=pslugA(item);
    const nr=await sb.from('lx_docs').select('data').match({client_id:clientId,collection:'notes',doc_id:key}).maybeSingle();
    const n=(nr.data&&nr.data.data)||{order:item,items:[]};const st=Object.assign({},n.stages||{});const prev=Number(old.stage)||1;
    if(stageTo<prev){Object.keys(st).forEach(x=>{if(Number(x)>stageTo)delete st[x];});}
    else{for(let x=prev+1;x<=stageTo;x++){if(!st[x])st[x]=todayA();}}
    if(!st[stageTo])st[stageTo]=todayA();
    const out=Object.assign({},n,{order:item,items:n.items||[],stages:st});
    if(Number(out.stageOverride||0)>stageTo)out.stageOverride=stageTo;
    const w=await sb.from('lx_docs').upsert({client_id:clientId,collection:'notes',doc_id:key,data:out},{onConflict:'client_id,collection,doc_id'});
    if(w.error)throw new Error(w.error.message);
  }
  return next;
}
function orderBoard(m,rows,name){
  const card=el('div','ad-card');card.appendChild(el('h2',null,'Order control'));
  card.appendChild(el('p','ad-mut','Kisi bhi client ka order yahin se badlo: stage, tracking, ETA, payment. Stage badalte hi client ko push jaata hai. Mail ke liye har order me Send email dabao.'));
  const bar=el('div','row');bar.style.margin='0 0 12px';
  const fc=document.createElement('select');fc.innerHTML='<option value="">All clients</option>';clients.forEach(c=>{const o=document.createElement('option');o.value=c.id;o.textContent=c.name;fc.appendChild(o);});
  const fs=document.createElement('select');[['open','Open orders'],['all','All orders'],['late','Late vs ETA'],['unpaid','Payment pending'],['done','Delivered']].forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;fs.appendChild(o);});
  const fq=document.createElement('input');fq.placeholder='Search item / order no.';fq.style.minWidth='180px';
  [fc,fs,fq].forEach(x=>{x.style.cssText+=';background:#0A0A0A;color:#F3EEE6;border:1px solid #2A2724;padding:8px 10px;font:inherit;width:auto;flex:1 1 170px';});
  bar.append(fc,fs,fq);card.appendChild(bar);
  const picked=new Set();const pk=r=>r._c+'|'+r.item;
  const bulk=el('div','row');bulk.style.cssText='margin:0 0 12px;padding:10px;border:1px dashed #3A3222;align-items:center;gap:8px';
  const bcount=el('span','ad-mut','0 selected');
  const bst=document.createElement('select');bst.innerHTML='<option value="">Stage: no change</option>'+STAGES.map((t,i)=>'<option value="'+(i+1)+'">Set stage '+(i+1)+' · '+t+'</option>').join('');
  const bpay=document.createElement('select');bpay.innerHTML='<option value="">Payment: no change</option><option value="Received">Mark payment Received</option><option value="Pending">Mark payment Pending</option>';
  [bst,bpay].forEach(x=>{x.style.cssText='background:#0A0A0A;color:#F3EEE6;border:1px solid #2A2724;padding:8px 10px;font:inherit;width:auto;flex:1 1 170px';});
  const bgo=el('button','ad-b','Apply to selected');bgo.type='button';const ball=el('button','ad-b g','Select all shown');ball.type='button';const bnone=el('button','ad-b g','Clear');bnone.type='button';
  bulk.append(bcount,bst,bpay,bgo,ball,bnone);card.appendChild(bulk);
  const list=el('div');card.appendChild(list);
  let shown=[];
  const upd=()=>{bcount.textContent=picked.size+' selected';};
  ball.onclick=()=>{shown.forEach(r=>picked.add(pk(r)));draw();};bnone.onclick=()=>{picked.clear();draw();};
  bgo.onclick=async()=>{
    const sel=rows.filter(r=>picked.has(pk(r)));if(!sel.length){toast('Pehle orders tick karo.');return;}
    const st=Number(bst.value)||0,pay=bpay.value;if(!st&&!pay){toast('Stage ya payment chuno.');return;}
    if(!confirm(sel.length+' orders update honge'+(st?' · stage → '+st+' ('+STAGES[st-1]+')':'')+(pay?' · payment → '+pay:'')+'. Har client ko push jaayega. Pakka?'))return;
    bgo.disabled=true;let ok=0,fail=[];
    for(const r of sel){const patch={};
      if(st&&st!==(Number(r.stage)||1)){patch.stage=st;patch.status=STAGES[st-1];}
      if(pay&&pay!==(r.payout_status||'Pending')){patch.payout_status=pay;if(pay==='Received'&&!r.payment_date)patch.payment_date=todayA();}
      if(!Object.keys(patch).length)continue;
      try{const next=await saveOrderPatch(r._c,r.item,patch,patch.stage);Object.assign(r,next);ok++;}catch(e){fail.push((r.order_no||r.item)+': '+e.message);}
    }
    picked.clear();bgo.disabled=false;draw();toast(ok+' updated'+(fail.length?' · '+fail.length+' failed: '+fail[0]:'.'));
  };
  const today=todayA();const isDone=r=>Number(r.stage)>=9;loadAddrs().then(()=>draw());
  const inp=(label,val,type)=>{const l=document.createElement('label');l.textContent=label;l.style.cssText='display:flex;flex-direction:column;gap:4px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#A39C90';const i=document.createElement('input');i.type=type||'text';i.value=val||'';i.style.cssText='background:#0A0A0A;color:#F3EEE6;border:1px solid #2A2724;padding:8px 10px;font:14px Jost,system-ui,sans-serif;text-transform:none;letter-spacing:0';l.appendChild(i);return [l,i];};
  function draw(){
    list.textContent='';
    let f=rows.slice();
    if(fc.value)f=f.filter(r=>r._c===fc.value);
    const v=fs.value;
    if(v==='open')f=f.filter(r=>!isDone(r));else if(v==='done')f=f.filter(isDone);else if(v==='late')f=f.filter(r=>!isDone(r)&&r.eta_date&&r.eta_date<today);else if(v==='unpaid')f=f.filter(r=>r.payout_status!=='Received');
    const q=fq.value.trim().toLowerCase();if(q)f=f.filter(r=>((r.item||'')+' '+(r.order_no||'')+' '+(r.brand||'')).toLowerCase().includes(q));
    f.sort((a,b)=>(Number(a.stage)||1)-(Number(b.stage)||1)||String(b.order_no||'').localeCompare(String(a.order_no||'')));
    shown=f;upd();
    if(!f.length){list.appendChild(el('p','ad-mut','Koi order nahi mila.'));return;}
    f.forEach(r=>{
      const det=document.createElement('details');det.style.cssText='border-top:1px solid #232120;padding:10px 0';
      const sm=document.createElement('summary');sm.style.cssText='cursor:pointer;display:flex;gap:10px;flex-wrap:wrap;align-items:baseline';
      const st0=Number(r.stage)||1;
      const cb=document.createElement('input');cb.type='checkbox';cb.checked=picked.has(pk(r));cb.onclick=e=>e.stopPropagation();cb.onchange=()=>{cb.checked?picked.add(pk(r)):picked.delete(pk(r));upd();};sm.appendChild(cb);
      const t1=el('b',null,(r.order_no||'')+' '+(r.item||''));const t2=el('span','ad-mut',name(r._c)+' · Stage '+st0+' · '+STAGES[st0-1]);sm.append(t1,t2);det.appendChild(sm);
      const body=el('div');body.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:12px';
      const sl=document.createElement('label');sl.textContent='Stage';sl.style.cssText='display:flex;flex-direction:column;gap:4px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#A39C90';
      const ss=document.createElement('select');ss.style.cssText='background:#0A0A0A;color:#F3EEE6;border:1px solid #2A2724;padding:8px 10px;font:14px Jost,system-ui,sans-serif';
      STAGES.forEach((t,i)=>{const o=document.createElement('option');o.value=String(i+1);o.textContent=(i+1)+' · '+t;if(i+1===st0)o.selected=true;ss.appendChild(o);});sl.appendChild(ss);
      const [l2,iCour]=inp('Intl courier',r.intl_courier&&r.intl_courier!=='—'?r.intl_courier:'');
      const [l3,iTrk]=inp('Intl tracking no. / link',r.intl_tracking_no);
      const [l4,iLc]=inp('India courier',r.local_courier);
      const [l5,iLt]=inp('India tracking no. / link',r.local_tracking);
      const [l6,iEta]=inp('ETA (delivery date)',r.eta_date,'date');
      const pl=document.createElement('label');pl.textContent='Payment';pl.style.cssText=sl.style.cssText;
      const ps=document.createElement('select');ps.style.cssText=ss.style.cssText;['Pending','Received'].forEach(x=>{const o=document.createElement('option');o.value=x;o.textContent=x;if((r.payout_status||'Pending')===x)o.selected=true;ps.appendChild(o);});pl.appendChild(ps);
      body.append(sl,l2,l3,l4,l5,l6,pl);det.appendChild(body);
      {const ad=addrOf(r);const cl=clients.find(c=>c.id===r._c)||{};const ab=el('div','ad-addr'+(ad&&!r.local_tracking&&st0>=7?' hot':''));
       if(ad){ab.appendChild(el('b',null,(!r.local_tracking&&st0>=7?'📍 Address aaya — India tracking daalo':'📍 Delivery address')));ab.appendChild(el('div',null,ad.address||''));ab.appendChild(el('small','ad-mut',(ad.phone?'📞 '+ad.phone:'')+(ad.pref?' · '+ad.pref:'')+(ad.savedAt?' · filled '+ad.savedAt:'')));
        const cp=el('button','ad-b g','Copy address');cp.type='button';cp.onclick=()=>navigator.clipboard.writeText((ad.address||'')+(ad.phone?'\n'+ad.phone:'')).then(()=>toast('Address copied'));ab.appendChild(cp);
        if(!r.local_tracking&&st0>=7){const fo=el('button','ad-b','+ India tracking');fo.type='button';fo.onclick=()=>{det.open=true;iLt.focus();iLt.scrollIntoView({behavior:'smooth',block:'center'});};ab.appendChild(fo);}
        if(st0===7&&r.local_tracking)ab.appendChild(el('small','ad-mut','Tracking hai → stage 8 (Dispatched) karo, client ko msg jaayega.'));}
       else if(st0===7){ab.appendChild(el('b',null,'⏳ Address abhi tak nahi aaya'));ab.appendChild(el('small','ad-mut','Neeche WhatsApp msg bhejo — client apne page pe #ad me bharega, yahan apne aap dikh jaayega.'));}
       if(ab.childNodes.length)det.appendChild(ab);
       const wr=el('div','ad-wa');const ws=document.createElement('select');ws.style.cssText='background:#0A0A0A;color:#F3EEE6;border:1px solid #2A2724;padding:7px 9px;font:inherit;width:auto';STAGES.forEach((t,i)=>{const o=document.createElement('option');o.value=String(i+1);o.textContent='Msg · '+(i+1)+' '+t;if(i+1===st0)o.selected=true;ws.appendChild(o);});
       const prev=el('div','ad-wa-p');const upd=()=>{prev.textContent=waMsg(r,cl,ws.value);};upd();ws.onchange=upd;
       const go=el('a','ad-b','💬 WhatsApp');go.target='_blank';go.rel='noopener';go.onclick=()=>{go.href=waHref(ad&&ad.phone,waMsg(r,cl,ws.value));};go.href='#';
       const cpy=el('button','ad-b g','Copy msg');cpy.type='button';cpy.onclick=()=>navigator.clipboard.writeText(waMsg(r,cl,ws.value)).then(()=>toast('Message copied'));
       const both=el('button','ad-b','📧 + 💬 Dono bhejo');both.type='button';both.title='Stage ka email + WhatsApp dono';both.onclick=()=>{window.open(waHref(ad&&ad.phone,waMsg(r,cl,ws.value)),'_blank','noopener');me.click();};
       const hd=el('div','row');hd.append(ws,go,cpy,both);wr.append(hd,prev);det.appendChild(wr);}
      const rw=el('div','row');rw.style.marginTop='12px';
      const sv=el('button','ad-b','Save changes');sv.type='button';rw.appendChild(sv);
      const op=el('a','ad-b g','Open client page');op.href=base((clients.find(c=>c.id===r._c)||{}).slug||'');op.target='_blank';op.rel='noopener';rw.appendChild(op);
      const me=el('button','ad-b g','Send email');me.type='button';me.onclick=async()=>{if(!confirm('"'+STAGES[(Number(r.stage)||1)-1]+'" mail '+name(r._c)+' ko bhejein?'))return;me.disabled=true;try{const {data:{session}}=await sb.auth.getSession();const res=await fetch('https://qzripzgbstvxkfobzhyv.supabase.co/functions/v1/lx-push',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+(session&&session.access_token)},body:JSON.stringify({manual_stage:{client_id:r._c,item:r.item}})});const j=await res.json();toast(j.sent>0?'Email sent':'Email nahi gaya: '+(j.err||j.error||''));me.textContent=j.sent>0?'Email sent ✓':'Send email';}catch(e){toast('Email error');}me.disabled=false;};rw.appendChild(me);
      const mn=el('button','ad-b g','Notify popup');mn.type='button';mn.onclick=async()=>{const st=Number(r.stage)||1;const res=await sb.from('lx_docs').insert({client_id:r._c,collection:'notices',doc_id:'n-'+Date.now().toString(36),data:{title:STAGES[st-1],body:(r.order_no?r.order_no+' · ':'')+r.item,item:r.item,stage:st,url:st===7?'ad':'tr',at:new Date().toISOString(),seen:false}});toast(res.error?'Error: '+res.error.message:'Client ko popup chala gaya');if(!res.error)mn.textContent='Notified ✓';};rw.appendChild(mn);
      if(st0>=9){const rv=el('button','ad-b','⭐ Ask for review');rv.type='button';rv.onclick=async()=>{const cl2=clients.find(c=>c.id===r._c)||{};if(!window.lxStagePrompt)await new Promise(res=>{const x=document.createElement('script');x.src='stageprompt.js?v=1';x.onload=res;x.onerror=res;document.body.appendChild(x);});if(window.lxStagePrompt)window.lxStagePrompt({client:{id:cl2.id||r._c,slug:cl2.slug||'',name:cl2.name||name(r._c)},order:Object.assign({},r,{stage:9}),to:9,phone:(addrOf(r)||{}).phone||'',addNotice:async d=>{const q=await sb.from('lx_docs').insert({client_id:r._c,collection:'notices',doc_id:'n-'+Date.now().toString(36),data:d});if(q.error)throw q.error;},token:async()=>{const {data:{session}}=await sb.auth.getSession();return session&&session.access_token;}});};rw.appendChild(rv);}
      det.appendChild(rw);
      sv.onclick=async()=>{
        const to=Number(ss.value);const patch={};
        if(to!==st0){
          if(to<st0&&!confirm('Stage peeche ('+st0+' → '+to+') jaa raha hai. Client ko push jaa sakta hai. Pakka?'))return;
          if(to>=st0+3&&!confirm('Stage '+st0+' se seedha '+to+' par jaa raha hai. Beech ke steps skip honge. Pakka?'))return;
          patch.stage=to;patch.status=STAGES[to-1];patch.notify_hold=new Date().toISOString();
        }
        const cmp=(k,val)=>{if(String(val||'')!==String(r[k]||''))patch[k]=val;};
        cmp('intl_courier',iCour.value.trim());cmp('intl_tracking_no',iTrk.value.trim());cmp('local_courier',iLc.value.trim());cmp('local_tracking',iLt.value.trim());
        if(iEta.value!==(r.eta_date||'')){patch.eta_prev=r.eta_date||'';patch.eta_date=iEta.value;}
        if(ps.value!==(r.payout_status||'Pending')){patch.payout_status=ps.value;if(ps.value==='Received'&&!r.payment_date)patch.payment_date=todayA();}
        if(!Object.keys(patch).length){toast('Kuch badla nahi.');return;}
        sv.disabled=true;
        try{const next=await saveOrderPatch(r._c,r.item,patch,patch.stage);Object.assign(r,next);const fwd=patch.stage&&patch.stage>st0;toast(fwd?'Saved. Ab client ko kaise batana hai chuno.':'Saved. Client ko update chala gaya.');draw();
          if(fwd){const cl2=clients.find(c=>c.id===r._c)||{};const ld=()=>window.lxStagePrompt?Promise.resolve():new Promise(res=>{const x=document.createElement('script');x.src='stageprompt.js?v=1';x.onload=res;x.onerror=res;document.body.appendChild(x);});await ld();
           if(window.lxStagePrompt)window.lxStagePrompt({client:{id:cl2.id||r._c,slug:cl2.slug||'',name:cl2.name||name(r._c)},order:Object.assign({},r,{stage:patch.stage}),to:patch.stage,phone:(addrOf(r)||{}).phone||'',addNotice:async d=>{const q=await sb.from('lx_docs').insert({client_id:r._c,collection:'notices',doc_id:'n-'+Date.now().toString(36),data:d});if(q.error)throw q.error;},token:async()=>{const {data:{session}}=await sb.auth.getSession();return session&&session.access_token;}});}}
        catch(e){toast('Save nahi hua: '+e.message);sv.disabled=false;}
      };
      list.appendChild(det);
    });
  }
  [fc,fs].forEach(x=>x.onchange=draw);fq.oninput=draw;draw();
  m.appendChild(card);
}

/* ---- new order from admin ---- */
function newOrderCard(m,rows){
  const card=el('div','ad-card');card.appendChild(el('h2',null,'Naya order add karo'));
  const g=el('div','ad-g');
  const mk=(lab,node)=>{const l=document.createElement('label');l.textContent=lab;l.appendChild(node);return l;};
  const sty='background:#0A0A0A;color:#F3EEE6;border:1px solid #2A2724;padding:8px 10px;font:14px Jost,system-ui,sans-serif;width:100%';
  const cs=document.createElement('select');cs.style.cssText=sty;clients.forEach(c=>{const o=document.createElement('option');o.value=c.id;o.textContent=c.name;cs.appendChild(o);});
  const it=document.createElement('input'),br=document.createElement('input'),pr=document.createElement('input'),eta=document.createElement('input');
  it.placeholder='Item (e.g. Coach Tabby 26, Black)';br.placeholder='Brand';pr.type='number';pr.placeholder='Price ₹';eta.type='date';
  [it,br,pr,eta].forEach(x=>x.style.cssText=sty);
  const ty=document.createElement('select');ty.style.cssText=sty;[['ETA','International (ETA)'],['Local','Local (sourced in India)'],['In hand (Local)','In hand (Local stock)']].forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;ty.appendChild(o);});
  const ro=document.createElement('select');ro.style.cssText=sty;[['Direct to client','Direct to client'],['Indirect (via me)','Via reseller']].forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;ro.appendChild(o);});
  const ph=document.createElement('input');ph.type='file';ph.accept='image/*';ph.style.cssText=sty;
  const sz=document.createElement('input'),qt=document.createElement('input'),lk=document.createElement('input'),nt=document.createElement('input');
  sz.placeholder='Size / colour';qt.type='number';qt.value='1';qt.min='1';lk.placeholder='Product link (optional)';nt.placeholder='Notes (optional)';[sz,qt,lk,nt].forEach(x=>x.style.cssText=sty);
  g.append(mk('Client',cs),mk('Item',it),mk('Brand',br),mk('Size / colour',sz),mk('Qty',qt),mk('Price ₹',pr),mk('Type',ty),mk('Route',ro),mk('ETA (optional)',eta),mk('Product link',lk),mk('Notes',nt),mk('Photo (optional)',ph));card.appendChild(g);
  const rw=el('div','row');const go=el('button','ad-b','Add order');go.type='button';const sl=el('button','ad-b g','Copy order link');sl.type='button';rw.append(go,sl);card.appendChild(rw);
  sl.onclick=async()=>{const q=new URLSearchParams();if(it.value.trim())q.set('item',it.value.trim());if(br.value.trim())q.set('brand',br.value.trim());if(sz.value.trim())q.set('size',sz.value.trim());if(qt.value&&qt.value!=='1')q.set('qty',qt.value);if(lk.value.trim())q.set('link',lk.value.trim());if(nt.value.trim())q.set('notes',nt.value.trim());if(pr.value)q.set('price',pr.value);const c=clients.find(x=>x.id===cs.value)||{};const u=location.origin+'/'+(c.slug||'')+(q.toString()?'?'+q:'')+'#new';try{await navigator.clipboard.writeText(u);toast('Client link copied.');}catch(e){toast(u);}};
  go.onclick=async()=>{
    const item=it.value.trim();if(!item){toast('Item ka naam daalo.');return;}
    if(rows.some(r=>r._c===cs.value&&r.item===item)){toast('Is client ke paas yahi item pehle se hai.');return;}
    const mo=String(new Date().getMonth()+1).padStart(2,'0');
    const nums=rows.map(r=>String(r.order_no||'')).filter(n=>n.startsWith('#'+mo)).map(n=>Number(n.slice(3))||0);
    const no='#'+mo+String((nums.length?Math.max(...nums):0)+1).padStart(2,'0');
    const cn=(clients.find(c=>c.id===cs.value)||{}).name;
    if(!confirm(cn+' ke liye '+no+' '+item+' add hoga. Client ko "New order" mail/push jaayega. Pakka?'))return;
    go.disabled=true;
    const data={order_no:no,order_date:todayA(),placed_by:'owner',size:sz.value.trim(),qty:Number(qt.value||1),product_link:lk.value.trim(),client_notes:nt.value.trim(),brand:br.value.trim(),order_type:ty.value,direct:ro.value,payout:pr.value===''?null:Number(pr.value),payout_status:'Pending',stage:1,status:STAGES[0],eta_date:eta.value||'',shipping_date:'',intl_tracking_no:'',intl_courier:'',intl_courier_slug:'',local_tracking:'',local_courier:'',local_courier_slug:''};
    const r=await sb.from('lx_orders').insert({client_id:cs.value,item,data});
    go.disabled=false;
    if(r.error){toast('Add nahi hua: '+r.error.message);return;}
    const pf=ph.files&&ph.files[0];if(pf){try{const sl2=(clients.find(c=>c.id===cs.value)||{}).slug||'x';const path=sl2+'/'+Date.now()+'_'+(pf.name||'photo').replace(/[^a-zA-Z0-9._-]/g,'_');const up=await sb.storage.from('lx-assets').upload(path,pf,{upsert:false,contentType:pf.type||undefined});if(up.error)throw up.error;const pu=sb.storage.from('lx-assets').getPublicUrl(path).data.publicUrl;await sb.from('lx_docs').upsert({client_id:cs.value,collection:'photos',doc_id:pslugA(item),data:{order:item,id:path,url:pu,at:todayA()}},{onConflict:'client_id,collection,doc_id'});}catch(e){toast('Order add hua, photo upload nahi hua.');}}
    ph.value='';sz.value=lk.value=nt.value='';
    rows.push(Object.assign({_c:cs.value,item},data));it.value=br.value=pr.value=eta.value='';toast('Added '+no+'. Order control me dikhega (refresh karo).');
  };
  m.appendChild(card);
}

/* ---- payments + help queue ---- */
async function signedUrl(u){if(!u)return '';if(String(u).indexOf('lxp:')!==0)return u;const r=await sb.storage.from('lx-private').createSignedUrl(String(u).slice(4),3600);return r.data?r.data.signedUrl:'';}
async function queueCard(m,name,rows){
  const card=el('div','ad-card');card.appendChild(el('h2',null,'Payments + Help queue'));m.appendChild(card);
  const [ps,cs,ao]=await Promise.all([
    sb.from('lx_docs').select('client_id,doc_id,data').eq('collection','paysub').eq('data->>status','Pending verification'),
    sb.from('lx_docs').select('client_id,doc_id,data').eq('collection','cases').neq('data->>status','Resolved'),
    sb.from('lx_orders').select('client_id,item,data').eq('data->>placed_by','client').eq('data->>stage','1')]);
  {const h=el('h3',null,'Orders awaiting your approval');h.style.cssText='font:500 11px Jost,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#E3C565;margin:14px 0 8px';card.appendChild(h);
   const ol=el('div');card.appendChild(ol);const list=(ao&&ao.data)||[];
   if(!list.length)ol.appendChild(el('p','ad-mut','Koi order approval ke liye pending nahi.'));
   list.forEach(x=>{const d=x.data||{};const row=el('div','ad-o');row.style.gridTemplateColumns='1fr auto';const l=el('div');l.appendChild(el('span',null,(d.order_no||'')+' · '+x.item+(d.payout?' · '+inr(d.payout):'')));l.appendChild(el('small',null,name(x.client_id)+(d.delivery_later?' · address baad me':'')+(d.size?' · '+d.size:'')+(d.qty>1?' · qty '+d.qty:'')));row.appendChild(l);
    const b=el('button','ad-b','Approve');b.type='button';b.onclick=async()=>{if(!confirm(name(x.client_id)+': '+x.item+' approve karun? Client ko "Order confirmed" mail jaayega.'))return;b.disabled=true;try{await saveOrderPatch(x.client_id,x.item,{stage:2,status:STAGES[1],confirmed_at:new Date().toISOString()},2);toast('Approved.');row.remove();}catch(e){b.disabled=false;toast('Approve nahi hua: '+(e.message||e));}};row.appendChild(b);ol.appendChild(row);});}
  card.appendChild(el('h3',null,'Payments to verify'));card.lastChild.style.cssText='font:500 11px Jost,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#A39C90;margin:14px 0 8px';
  const pl=el('div');card.appendChild(pl);
  if(ps.error)pl.appendChild(el('p','ad-mut',ps.error.message));
  else if(!(ps.data||[]).length)pl.appendChild(el('p','ad-mut','Koi payment pending nahi.'));
  (ps.data||[]).forEach(x=>{const d=x.data;const row=el('div','ad-o');row.style.gridTemplateColumns='1fr auto';
    const l=el('div');l.appendChild(el('span',null,inr(d.amount)+' · '+(d.order||'')));l.appendChild(el('small',null,name(x.client_id)+' · '+(d.method||'')+(d.ref?' · ref '+d.ref:'')+(d.at?' · '+new Date(d.at).toLocaleString('en-IN'):'')));
    if(d.proof){signedUrl(d.proof).then(u=>{if(!u)return;const a=el('a',null,'  View proof');a.href=u;a.target='_blank';a.rel='noopener';a.style.color='#E3C565';l.firstChild.appendChild(a);});}
    row.appendChild(l);const bt=el('div','row');const ok=el('button','ad-b','Verify');ok.type='button';const no=el('button','ad-b d','Reject');no.type='button';bt.append(ok,no);row.appendChild(bt);pl.appendChild(row);
    ok.onclick=async()=>{if(!confirm('Verify '+inr(d.amount)+' for '+d.order+'? Client ko mail jaayega.'))return;ok.disabled=no.disabled=true;
      try{
        const key=pslugA(d.order);const pr=await sb.from('lx_docs').select('data').match({client_id:x.client_id,collection:'payrec',doc_id:key}).maybeSingle();
        const cur=(pr.data&&pr.data.data&&pr.data.data.items)||[];
        if(!cur.some(i=>i.sub===x.doc_id)){const w=await sb.from('lx_docs').upsert({client_id:x.client_id,collection:'payrec',doc_id:key,data:{order:d.order,items:cur.concat([{amount:Number(d.amount),at:todayA(),method:d.method||'UPI',ref:d.ref||'',sub:x.doc_id}])}},{onConflict:'client_id,collection,doc_id'});if(w.error)throw new Error(w.error.message);}
        const u=await sb.from('lx_docs').update({data:Object.assign({},d,{status:'Verified',verifiedAt:new Date().toISOString()})}).match({client_id:x.client_id,collection:'paysub',doc_id:x.doc_id});if(u.error)throw new Error(u.error.message);
        const ord=rows.find(r=>r._c===x.client_id&&r.item===d.order);
        if(ord){const paid=cur.reduce((t,i)=>t+Number(i.amount||0),0)+(cur.some(i=>i.sub===x.doc_id)?0:Number(d.amount));if(paid>=Number(ord.payout||0)&&ord.payout_status!=='Received'){const nx=await saveOrderPatch(x.client_id,ord.item,{payout_status:'Received',payment_date:todayA()});Object.assign(ord,nx);}}
        row.remove();toast('Payment verified.');
      }catch(e){toast('Verify nahi hua: '+e.message);ok.disabled=no.disabled=false;}};
    no.onclick=async()=>{const why=prompt('Client ko kya reason dikhana hai?','Not received in our account yet. Please check the reference and resubmit.');if(why===null)return;no.disabled=ok.disabled=true;
      const u=await sb.from('lx_docs').update({data:Object.assign({},d,{status:'Rejected',reason:why,reviewedAt:new Date().toISOString()})}).match({client_id:x.client_id,collection:'paysub',doc_id:x.doc_id});
      if(u.error){toast(u.error.message);no.disabled=ok.disabled=false;return;}row.remove();toast('Rejected.');};
  });
  const h2=el('h3',null,'Open support cases');h2.style.cssText='font:500 11px Jost,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#A39C90;margin:22px 0 8px';card.appendChild(h2);
  const cl=el('div');card.appendChild(cl);
  if(cs.error)cl.appendChild(el('p','ad-mut',cs.error.message));
  else if(!(cs.data||[]).length)cl.appendChild(el('p','ad-mut','Koi open case nahi.'));
  (cs.data||[]).forEach(x=>{const d=x.data;const det=document.createElement('details');det.style.cssText='border-top:1px solid #232120;padding:10px 0';
    const sm=document.createElement('summary');sm.style.cursor='pointer';sm.textContent=(d.ref||x.doc_id)+' · '+name(x.client_id)+' · '+(d.type||'Issue')+' · '+(d.status||'');det.appendChild(sm);
    det.appendChild(el('p','ad-mut',(d.order?d.order+' · ':'')+(d.desc||'')));
    const msgBox=el('div');msgBox.style.cssText='max-height:220px;overflow:auto;display:flex;flex-direction:column;gap:6px;margin:8px 0';det.appendChild(msgBox);
    (async()=>{const r=await sb.from('lx_docs').select('data').eq('client_id',x.client_id).eq('collection','case_msgs').eq('data->>case',d.ref||x.doc_id);const L=(r.data||[]).map(q=>q.data).filter(q=>q&&q.at).sort((a,b)=>a.at<b.at?-1:1);
      L.forEach(q=>{const b=el('div',null,(q.from==='luxella'?'You: ':'Client: ')+(q.text||''));b.style.cssText='padding:6px 9px;font-size:13px;border:1px solid #2A2724;'+(q.from==='luxella'?'background:#1C1A17;align-self:flex-end':'align-self:flex-start');msgBox.appendChild(b);});})();
    const ta=document.createElement('textarea');ta.placeholder='Reply as Luxella…';ta.style.cssText='width:100%;min-height:56px;background:#0A0A0A;color:#F3EEE6;border:1px solid #2A2724;padding:8px';det.appendChild(ta);
    const rw=el('div','row');rw.style.marginTop='8px';const send=el('button','ad-b','Send reply');send.type='button';
    const ss=document.createElement('select');ss.style.cssText='background:#0A0A0A;color:#F3EEE6;border:1px solid #2A2724;padding:8px 10px;font:inherit;width:auto';['Submitted','Under review','Awaiting reseller','Resolution proposed','Resolved','Reopened'].forEach(t=>{const o=document.createElement('option');o.value=t;o.textContent=t;if(t===d.status)o.selected=true;ss.appendChild(o);});
    const su=el('button','ad-b g','Update status');su.type='button';rw.append(send,ss,su);det.appendChild(rw);
    send.onclick=async()=>{const t=ta.value.trim();if(!t)return;send.disabled=true;const id='m'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
      const w=await sb.from('lx_docs').insert({client_id:x.client_id,collection:'case_msgs',doc_id:id,data:{case:d.ref||x.doc_id,ref:d.ref||x.doc_id,text:t,from:'luxella',at:new Date().toISOString()}});
      send.disabled=false;if(w.error){toast(w.error.message);return;}const b=el('div','','You: '+t);b.style.cssText='padding:6px 9px;font-size:13px;border:1px solid #2A2724;background:#1C1A17;align-self:flex-end';msgBox.appendChild(b);ta.value='';toast('Reply sent.');};
    su.onclick=async()=>{su.disabled=true;const u=await sb.from('lx_docs').update({data:Object.assign({},d,{status:ss.value,updated:new Date().toISOString()})}).match({client_id:x.client_id,collection:'cases',doc_id:x.doc_id});su.disabled=false;if(u.error){toast(u.error.message);return;}d.status=ss.value;sm.textContent=(d.ref||x.doc_id)+' · '+name(x.client_id)+' · '+(d.type||'Issue')+' · '+d.status;toast('Status updated.');};
    cl.appendChild(det);});
}

/* ---- message / pinned note to a client ---- */
function linkCard(m){
  const card=el('div','ad-card');card.appendChild(el('h2',null,'Order link (client ko bhejo)'));
  card.appendChild(el('p','ad-mut','Item/price bharo, link copy karke client ko WhatsApp karo. Client login karke seedha order page pe aayega: upar order card, neeche form, details prefilled. Price daalne par wo lock rehta hai.'));
  const sty='background:#0A0A0A;color:#F3EEE6;border:1px solid #2A2724;padding:8px 10px;font:14px Jost,system-ui,sans-serif;width:100%;margin-bottom:8px';
  const cs=document.createElement('select');cs.style.cssText=sty;clients.forEach(c=>{const o=document.createElement('option');o.value=c.slug;o.textContent=c.name;cs.appendChild(o);});
  const mk=(ph,t)=>{const i=document.createElement('input');i.type=t||'text';i.placeholder=ph;i.style.cssText=sty;return i;};
  const it=mk('Item (optional)'),br=mk('Brand (optional)'),sz=mk('Size / colour (optional)'),pr=mk('Price ₹ (optional, lock hoga)','number');
  const tp=document.createElement('select');tp.style.cssText=sty;[['','International (ETA)'],['local','Local (India)']].forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;tp.appendChild(o);});const lk=mk('Product link (optional)','url'),im=mk('Photo URL https:// (optional, card me dikhega)','url');
  const out=document.createElement('textarea');out.readOnly=true;out.style.cssText=sty+';min-height:70px';
  const gen=()=>{const q=new URLSearchParams();if(it.value.trim())q.set('item',it.value.trim());if(br.value.trim())q.set('brand',br.value.trim());if(sz.value.trim())q.set('size',sz.value.trim());if(pr.value)q.set('price',pr.value);if(tp.value)q.set('type',tp.value);if(lk.value.trim())q.set('link',lk.value.trim());if(/^https:\/\//.test(im.value.trim()))q.set('img',im.value.trim());const qs=q.toString();out.value=location.origin+'/'+cs.value+(qs?'?'+qs:'')+'#new';};
  [cs,it,br,sz,pr,tp,lk,im].forEach(x=>{x.addEventListener('input',gen);x.addEventListener('change',gen);});
  const cp=el('button','ad-b g','Copy link');cp.type='button';cp.onclick=async()=>{try{await navigator.clipboard.writeText(out.value);toast('Link copied.');}catch(e){out.select();toast('Select + copy karo.');}};
  const wa=el('button','ad-b','WhatsApp pe bhejo');wa.type='button';wa.onclick=()=>window.open('https://wa.me/?text='+encodeURIComponent('Your Luxella order is ready to place: '+out.value),'_blank');
  card.append(cs,tp,it,br,sz,pr,lk,im,out,cp,wa);gen();return card;}
function composeCard(m){
  const card=el('div','ad-card');card.appendChild(el('h2',null,'Client ko message / note'));
  card.appendChild(el('p','ad-mut','Message client ke chat inbox me jaata hai (mail + push ke saath). Pinned note unke page ke upar dikhta hai, aur naya note aate hi mail jaata hai.'));
  const sty='background:#0A0A0A;color:#F3EEE6;border:1px solid #2A2724;padding:8px 10px;font:14px Jost,system-ui,sans-serif;width:100%;margin-bottom:8px';
  const cs=document.createElement('select');cs.style.cssText=sty;clients.forEach(c=>{const o=document.createElement('option');o.value=c.id;o.textContent=c.name;cs.appendChild(o);});
  const ta=document.createElement('textarea');ta.placeholder='Likho…';ta.style.cssText=sty+';min-height:80px';
  card.append(cs,ta);
  const rw=el('div','row');const sm=el('button','ad-b','Send message');sm.type='button';const pn=el('button','ad-b g','Set as pinned note');pn.type='button';rw.append(sm,pn);card.appendChild(rw);
  sm.onclick=async()=>{const t=ta.value.trim();if(!t){toast('Kuch likho.');return;}const cn=(clients.find(c=>c.id===cs.value)||{}).name;if(!confirm(cn+' ko message + mail jaayega. Bhejun?'))return;sm.disabled=true;
    const id='m'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
    const w=await sb.from('lx_docs').insert({client_id:cs.value,collection:'case_msgs',doc_id:id,data:{case:'inbox',ref:'',text:t,files:[],voice:'',from:'luxella',at:new Date().toISOString()}});
    sm.disabled=false;if(w.error){toast(w.error.message);return;}ta.value='';toast('Message sent.');};
  pn.onclick=async()=>{const t=ta.value.trim();if(!t){toast('Kuch likho.');return;}const cn=(clients.find(c=>c.id===cs.value)||{}).name;if(!confirm(cn+' ke page par pinned note lagega + mail jaayega. Pakka?'))return;pn.disabled=true;
    const ex=await sb.from('lx_docs').select('data').match({client_id:cs.value,collection:'meta',doc_id:'pinned'}).maybeSingle();
    const w=await sb.from('lx_docs').upsert({client_id:cs.value,collection:'meta',doc_id:'pinned',data:Object.assign({},(ex.data&&ex.data.data)||{},{text:t,at:new Date().toISOString()})},{onConflict:'client_id,collection,doc_id'});
    pn.disabled=false;if(w.error){toast(w.error.message);return;}ta.value='';toast('Pinned note set.');};
  m.appendChild(card);
}

/* ---- unified client inbox: har client action ek jagah ---- */
const IBF={cur:'all'};const hx=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function inboxCard(P,name,rows,go,setBadge){
  const card=el('div','ad-card');P.appendChild(card);
  const hd=el('div','ib-hd');hd.appendChild(el('h2',null,'Inbox'));hd.appendChild(el('span','ad-mut','Client ne jo bhi kiya — address, message, payment, request, order'));hd.appendChild(el('span','sp'));
  const mall=el('button','ad-b g','Mark all read');mall.type='button';hd.appendChild(mall);card.appendChild(hd);
  {const op=clients.filter(c=>!/^zz/.test(c.slug||'')&&counts[c.id]&&counts[c.id].v).sort((a,b)=>String(counts[b.id].last).localeCompare(String(counts[a.id].last)));
   const st=el('div','ib-eyes');st.appendChild(el('b',null,'👁 Kaun kab khola'));if(!op.length)st.appendChild(el('span','ad-mut','Abhi tak kisi ne page nahi khola.'));
   op.forEach(c=>{const k=counts[c.id];const ch=el('span','ib-eye'+(k.vt?' hot':''));ch.innerHTML='<b>'+hx(c.name.split(' ')[0])+'</b> '+(k.vt?k.vt+'× today':k.v7+'× this week')+' · '+hx(agoA(k.last))+(k.ua?' · '+hx(k.ua):'');ch.title=k.v+' total opens';st.appendChild(ch);});card.appendChild(st);}
  const fl=el('div','ib-f');card.appendChild(fl);const list=el('div');card.appendChild(list);
  const [d,ao,sn]=await Promise.all([
    sb.from('lx_docs').select('client_id,collection,doc_id,data,updated_at').in('collection',['addresses','addressbook','case_msgs','cases','paysub','requests','quote_resp']).order('updated_at',{ascending:false}).limit(200),
    sb.from('lx_orders').select('client_id,item,data,updated_at').eq('data->>placed_by','client').order('updated_at',{ascending:false}).limit(40),
    sb.from('lx_docs').select('client_id,data').eq('collection','meta').eq('doc_id','adseen')]);
  if(d.error){card.appendChild(el('p','ad-mut',d.error.message));return;}
  const seen={};(sn.data||[]).forEach(x=>{seen[x.client_id]=new Set(((x.data||{}).keys)||[]);});
  const isSeen=it=>!!(seen[it.c]&&seen[it.c].has(it.key));
  const markSeen=async arr=>{const by={};arr.forEach(it=>{(seen[it.c]=seen[it.c]||new Set()).add(it.key);by[it.c]=1;});
    for(const cid of Object.keys(by)){const keys=[...seen[cid]].slice(-400);await sb.from('lx_docs').upsert({client_id:cid,collection:'meta',doc_id:'adseen',data:{keys,at:new Date().toISOString()}},{onConflict:'client_id,collection,doc_id'});}};
  const fmt=t=>{const x=new Date(t);const dd=Date.now()-x;if(dd<3600e3)return Math.max(1,Math.round(dd/60e3))+' min ago';if(dd<86400e3)return Math.round(dd/3600e3)+' h ago';return x.toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});};
  const ordOf=(cid,o)=>rows.find(r=>r._c===cid&&(r.item===o||r.order_no===o||(o&&r.item&&String(o).toLowerCase()===String(r.item).toLowerCase())));
  const items=[];
  (d.data||[]).forEach(x=>{const dd=x.data||{};const bs={c:x.client_id,at:x.updated_at,key:x.collection+'/'+x.doc_id+'@'+x.updated_at,col:x.collection,doc:x.doc_id,d:dd};
    if(x.collection==='case_msgs'){if(dd.from==='luxella')return;const att=(dd.voice?' 🎤 voice note':'')+((dd.files||[]).length?' 📷 '+dd.files.length+' photo':'');items.push(Object.assign(bs,{k:'msg',ic:'💬',t:dd.case==='inbox'?'Message':'Reply on case '+(dd.ref||dd.case),s:((dd.text||'')+att).trim()||'(empty)',reply:dd.case==='inbox'?'inbox':(dd.ref||dd.case)}));return;}
    if(x.collection==='cases'){if(!/submitted|reopened/i.test(String(dd.status||'')))return;items.push(Object.assign(bs,{k:'case',ic:'🛟',t:(/reopen/i.test(dd.status)?'Case reopened ':'New support case ')+(dd.ref||x.doc_id),s:(dd.type||'Issue')+(dd.order?' · '+dd.order:'')+(dd.desc?'\n'+dd.desc:''),queue:1}));return;}
    if(x.collection==='paysub'){if(!/pending/i.test(String(dd.status||'')))return;items.push(Object.assign(bs,{k:'pay',ic:'💳',t:'Payment submitted · '+inr(dd.amount),s:(dd.order||'')+(dd.method?' · '+dd.method:'')+(dd.ref?' · ref '+dd.ref:''),queue:1}));return;}
    if(x.collection==='addresses'){const r=ordOf(x.client_id,dd.order);items.push(Object.assign(bs,{k:'addr',ic:'📍',t:'Address submitted',s:(dd.order||'')+'\n'+(dd.address||'')+(dd.phone?'\n📞 '+dd.phone:'')+(dd.pref?'\n'+dd.pref:''),r,done:!!(r&&r.local_tracking)}));return;}
    if(x.collection==='addressbook'){items.push(Object.assign(bs,{k:'addr',ic:'📒',t:'Saved an address'+(dd.label?' · '+dd.label:''),s:(dd.address||'')+(dd.phone?' · 📞 '+dd.phone:''),info:1}));return;}
    if(x.collection==='requests'){const AK={price:'💰 Price request',size:'📏 Size check',availability:'📦 Availability check',buy:'🛍️ Wants this piece',similar:'🔎 Find similar',comment:'💬 Comment'};items.push(Object.assign(bs,{k:'ord',ic:'🛍️',img:dd.photo||'',t:((dd.ask&&AK[dd.ask])||'Product request')+(dd.urgent?' · URGENT':''),s:[dd.brand,dd.product].filter(Boolean).join(' ')+(dd.qty>1?' · qty '+dd.qty:'')+(dd.budget?' · budget '+inr(dd.budget):'')+(dd.needBy?' · by '+dd.needBy:'')+(dd.status?'\nStatus: '+dd.status:''),page:'ov'}));return;}
    if(x.collection==='quote_resp'){items.push(Object.assign(bs,{k:'ord',ic:dd.decision==='approved'?'✅':'❌',t:'Quote '+(dd.decision||''),s:(dd.item||'')+(dd.total?' · '+inr(dd.total):''),page:'ov'}));return;}});
  (ao.data||[]).forEach(x=>{const dd=x.data||{};if((Number(dd.stage)||1)>1)return;items.push({c:x.client_id,at:x.updated_at,key:'order/'+x.item+'@'+x.updated_at,k:'ord',ic:'🆕',t:'New order placed',s:(dd.order_no?dd.order_no+' · ':'')+x.item+(dd.payout?' · '+inr(dd.payout):'')+(dd.size?' · '+dd.size:'')+(dd.delivery_later?' · address baad me':''),queue:1,d:dd});});
  const zz=new Set(clients.filter(c=>/^zz/.test(c.slug||'')).map(c=>c.id));for(let i=items.length-1;i>=0;i--)if(zz.has(items[i].c))items.splice(i,1);
  items.sort((a,b)=>a.at<b.at?1:-1);
  const unread=()=>items.filter(it=>!isSeen(it)).length;
  const FILT=[['all','All'],['new','Unread'],['addr','📍 Address'],['msg','💬 Messages'],['pay','💳 Payments'],['ord','🛍️ Orders'],['case','🛟 Cases']];
  FILT.forEach(([k,t])=>{const b=el('button',null,t);b.type='button';b.dataset.k=k;b.onclick=()=>{IBF.cur=k;draw();};fl.appendChild(b);});
  function draw(){
    [...fl.children].forEach(b=>b.classList.toggle('on',b.dataset.k===IBF.cur));setBadge(unread());
    list.textContent='';const L=items.filter(it=>IBF.cur==='all'||(IBF.cur==='new'?!isSeen(it):it.k===IBF.cur));
    if(!L.length){list.appendChild(el('p','ad-mut',IBF.cur==='new'?'Sab padh liya. 🎉':'Kuch nahi.'));return;}
    L.slice(0,80).forEach((it,i)=>{const c=clients.find(z=>z.id===it.c)||{};const row=el('div','ib-it'+(isSeen(it)?'':' new'));row.style.animationDelay=Math.min(i,12)*25+'ms';
      row.appendChild(el('div','ic',it.ic));const t=el('div','t');t.innerHTML='<b>'+hx(name(it.c))+'</b> · '+hx(it.t)+(it.done?' <span style="color:#7FB07F">· tracking daal diya</span>':'');row.appendChild(t);
      row.appendChild(el('div','m',fmt(it.at)));row.appendChild(el('div','s',it.s||''));
      if(it.img){const im=document.createElement('img');im.src=it.img;im.alt='';im.style.cssText='display:block;width:100%;max-width:280px;max-height:280px;object-fit:contain;background:#fff;margin:8px 0;border:1px solid #3a3322;cursor:zoom-in';im.addEventListener('click',()=>window.open(it.img,'_blank'));row.appendChild(im);}
      const a=el('div','a');row.appendChild(a);
      const seenBtn=el('button','ad-b g',isSeen(it)?'Seen':'✓ Mark read');seenBtn.type='button';seenBtn.onclick=async()=>{await markSeen([it]);draw();};
      if(it.k==='addr'&&it.r&&!it.done){const tb=el('button','ad-b','+ India tracking');tb.type='button';tb.onclick=async()=>{const v=prompt('India tracking no. / link for '+(it.r.order_no||'')+' '+it.r.item+':');if(!v||!v.trim())return;const st=Math.max(Number(it.r.stage)||1,8);if(!confirm('Tracking save + "Out for delivery" stage set karun? (client ko update jaayega)'))return;tb.disabled=true;try{await saveOrderPatch(it.c,it.r.item,{local_tracking:v.trim(),stage:st,status:STAGES[st-1]},st);it.r.local_tracking=v.trim();it.done=true;await markSeen([it]);toast('Tracking saved.');draw();}catch(e){tb.disabled=false;toast(e.message||String(e));}};a.appendChild(tb);
        const cp=el('button','ad-b g','Copy address');cp.type='button';cp.onclick=()=>navigator.clipboard.writeText([it.d.address,it.d.phone].filter(Boolean).join(' · ')).then(()=>toast('Address copied'));a.appendChild(cp);}
      if(it.reply){const rb=el('button','ad-b','Reply');rb.type='button';rb.onclick=()=>{if(row.querySelector('textarea'))return;const ta=document.createElement('textarea');ta.placeholder='Reply as Luxella…';ta.style.cssText='grid-column:2;width:100%;min-height:56px;background:#0A0A0A;color:#F3EEE6;border:1px solid #2A2724;padding:8px;margin-top:6px;font:inherit';const sd=el('button','ad-b','Send');sd.type='button';sd.style.cssText='grid-column:2;justify-self:start';row.append(ta,sd);ta.focus();
          sd.onclick=async()=>{const tx=ta.value.trim();if(!tx)return;sd.disabled=true;const id='m'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);const w=await sb.from('lx_docs').insert({client_id:it.c,collection:'case_msgs',doc_id:id,data:{case:it.reply,ref:it.reply==='inbox'?'':it.reply,text:tx,files:[],voice:'',from:'luxella',at:new Date().toISOString()}});if(w.error){sd.disabled=false;toast(w.error.message);return;}await markSeen([it]);toast('Reply sent (mail + push).');draw();};};a.appendChild(rb);}
      if(it.queue){const q=el('button','ad-b',it.k==='pay'?'Verify':it.k==='case'?'Open case':'Approve');q.type='button';q.onclick=()=>go('today');a.appendChild(q);}
      if(it.page){const op=el('a','ad-b g','Open page');op.href=base(c.slug||'')+'#'+it.page;op.target='_blank';op.rel='noopener';a.appendChild(op);}
      const oc=el('button','ad-b g','Client →');oc.type='button';oc.onclick=()=>{sel=c;renderList();renderClient();};a.appendChild(oc);
      a.appendChild(seenBtn);list.appendChild(row);});}
  mall.onclick=async()=>{await markSeen(items.filter(it=>!isSeen(it)));toast('Sab read mark ho gaya');draw();};
  draw();
}
const DSEC={cur:'inbox'};let autoT=null;
async function renderDash(m){
  const [o,a,pq,cs,stk]=await Promise.all([
    sb.from('lx_orders').select('client_id,item,data,updated_at'),
    sb.from('lx_audit').select('at,actor,tbl,op,ref,client_id').order('at',{ascending:false}).limit(60),
    sb.from('lx_docs').select('client_id,doc_id,data').eq('collection','paysub'),
    sb.from('lx_docs').select('client_id,doc_id,data').eq('collection','cases'),
    sb.from('lx_docs').select('client_id,doc_id,data').eq('collection','stock'),loadAddrs()]);
  if(o.error){m.appendChild(el('p','ad-mut',o.error.message));return;}
  const name=id=>(clients.find(c=>c.id===id)||{}).name||'?';const slugOf=id=>(clients.find(c=>c.id===id)||{}).slug||'';
  const rows=(o.data||[]).map(x=>Object.assign({_c:x.client_id,item:x.item,_u:x.updated_at},x.data)).filter(r=>!/cancel/i.test(String(r.status||'')));
  const today=todayA();const val=r=>Number(r.payout)||0,del=r=>Number(r.stage)>=9||/deliver/i.test(r.status||'');
  const open=rows.filter(r=>!del(r)),pend=rows.filter(r=>r.payout_status!=='Received');const sum=a=>a.reduce((t,r)=>t+val(r),0);
  const late=open.filter(r=>r.eta_date&&r.eta_date<today);
  const awaitAp=rows.filter(r=>r.placed_by==='client'&&(Number(r.stage)||1)<=1);
  const toVerify=(pq.data||[]).filter(x=>/pending/i.test(String((x.data||{}).status||'')));
  const openCases=(cs.data||[]).filter(x=>!/resolved|closed/i.test(String((x.data||{}).status||'')));
  const needAddr=open.filter(r=>(Number(r.stage)||1)===7&&!addrOf(r));const addrReady=open.filter(r=>(Number(r.stage)||1)>=7&&addrOf(r)&&!r.local_tracking);
  const delUnpaid=rows.filter(r=>del(r)&&r.payout_status!=='Received');
  const stale=open.filter(r=>r._u&&(Date.now()-new Date(r._u))>7*864e5).sort((x,y)=>String(x._u).localeCompare(String(y._u)));
  /* header */
  const hd=el('div','dz-hd');hd.appendChild(el('h2',null,'Dashboard'));
  const gs=document.createElement('input');gs.className='dz-search';gs.placeholder='Search any order, item, brand, #no, client…';hd.appendChild(gs);
  const rf=el('button','ad-b g','Refresh');rf.type='button';rf.onclick=()=>renderClient();hd.appendChild(rf);
  const ar=el('label','dz-auto');const arc=document.createElement('input');arc.type='checkbox';arc.checked=!!autoT;ar.append(arc,document.createTextNode(' Auto-refresh'));hd.appendChild(ar);
  arc.onchange=()=>{if(arc.checked){autoT=setInterval(()=>{if(!sel&&!document.hidden)renderClient();},60000);toast('Har 1 minute me refresh hoga');}else{clearInterval(autoT);autoT=null;}};
  m.appendChild(hd);
  const sres=el('div','dz-sres');m.appendChild(sres);
  gs.oninput=()=>{const q=gs.value.trim().toLowerCase();sres.textContent='';if(q.length<2)return;const hits=rows.filter(r=>((r.item||'')+' '+(r.order_no||'')+' '+(r.brand||'')+' '+name(r._c)).toLowerCase().includes(q)).slice(0,8);
    if(!hits.length){sres.appendChild(el('div','ad-mut','Kuch nahi mila.'));return;}
    hits.forEach(r=>{const h=el('div','dz-hit');h.appendChild(el('b',null,(r.order_no||'')+' '+r.item));h.appendChild(el('span','ad-mut',name(r._c)+' · '+(STAGES[(Number(r.stage)||1)-1]||'')+' · '+inr(r.payout)+' · '+(r.payout_status||'Pending')));const op=el('a','ad-b g','Open');op.href=base(slugOf(r._c))+'#tr';op.target='_blank';op.rel='noopener';h.appendChild(op);sres.appendChild(h);});};
  /* today chips */
  const chips=el('div','dz-chips');
  const chip=(t,n,sec,warn)=>{const c=el('button','dz-chip'+(n&&warn?' warn':''));c.type='button';c.appendChild(el('b',null,String(n)));c.appendChild(el('span',null,t));c.onclick=()=>go(sec);chips.appendChild(c);};
  chip('Awaiting approval',awaitAp.length,'today',1);chip('Payments to verify',toVerify.length,'today',1);chip('Open cases',openCases.length,'today',1);chip('Late vs ETA',late.length,'orders',1);chip('Address needed',needAddr.length,'orders',1);chip('📍 Address aaya · tracking daalo',addrReady.length,'orders',1);chip('Delivered, unpaid',delUnpaid.length,'money',1);
  m.appendChild(chips);
  /* section tabs */
  const SECS=[['inbox','📥 Inbox'],['today','Today'],['orders','Orders'],['money','Money'],['rts','Ready to ship'],['clients','Clients'],['tools','Tools'],['activity','Activity']];
  const tb=el('div','dz-tabs');const panes={};
  SECS.forEach(([k,t])=>{const b=el('button','dz-tab',t);b.type='button';b.dataset.k=k;b.onclick=()=>go(k);tb.appendChild(b);const p=el('div','dz-pane');p.dataset.k=k;panes[k]=p;});
  m.appendChild(tb);SECS.forEach(([k])=>m.appendChild(panes[k]));
  function go(k){DSEC.cur=k;[...tb.children].forEach(b=>b.classList.toggle('on',b.dataset.k===k));Object.entries(panes).forEach(([kk,p])=>p.hidden=kk!==k);}
  go(DSEC.cur);
  /* INBOX */
  {const P=panes.inbox;const ibtab=tb.querySelector('[data-k="inbox"]');const ibchip=el('button','dz-chip');ibchip.type='button';ibchip.appendChild(el('b',null,'…'));ibchip.appendChild(el('span',null,'📥 Unread'));ibchip.onclick=()=>{IBF.cur='new';go('inbox');};chips.insertBefore(ibchip,chips.firstChild);
   const setBadge=n=>{let b=ibtab.querySelector('.nb');if(n){if(!b){b=el('span','nb');ibtab.appendChild(b);}b.textContent=String(n);}else if(b)b.remove();ibchip.firstChild.textContent=String(n);ibchip.classList.toggle('warn',n>0);document.title=(n?'('+n+') ':'')+'Luxella Admin';};
   inboxCard(P,name,rows,go,setBadge).catch(e=>P.appendChild(el('p','ad-mut',e.message||String(e))));}
  /* TODAY */
  {const P=panes.today;
   const kpi=(k,v,sub)=>{const d=el('div','dz-kpi');d.appendChild(el('div','ad-mut',k));d.appendChild(el('div','v',v));if(sub)d.appendChild(el('div','ad-mut',sub));return d;};
   const g=el('div','dz-kpis');g.append(kpi('Open orders',String(open.length),rows.length+' total'),kpi('Book value',inr(sum(rows))),kpi('To collect',inr(sum(pend)),pend.length+' orders'),kpi('Late vs ETA',String(late.length)));P.appendChild(g);
   await queueCard(P,name,rows);
   const at=el('div','ad-card');at.appendChild(el('h2',null,'Needs attention'));
   late.sort((x,y)=>x.eta_date.localeCompare(y.eta_date)).forEach(r=>at.appendChild(el('div','ad-mut','Late · '+name(r._c)+' · '+(r.order_no||'')+' '+r.item+' · ETA '+r.eta_date)));
   addrReady.forEach(r=>{const ad=addrOf(r);const d=el('div','ad-mut');d.innerHTML='<b style="color:#E3C565">📍 Address aaya</b> · '+name(r._c)+' · '+(r.order_no||'')+' '+r.item+' → India tracking daalo<br><span style="color:#C9C2B6">'+String(ad.address||'').replace(/</g,'&lt;')+(ad.phone?' · 📞 '+ad.phone:'')+'</span>';at.appendChild(d);});
   needAddr.forEach(r=>{const c=clients.find(x=>x.id===r._c)||{};const d=el('div','ad-mut');d.appendChild(document.createTextNode('Address needed · '+name(r._c)+' · '+(r.order_no||'')+' '+r.item+' '));const a=el('a','ad-b g','💬 Address maango');a.href=waHref('',waMsg(r,c,7));a.target='_blank';a.rel='noopener';d.appendChild(a);at.appendChild(d);});
   delUnpaid.forEach(r=>at.appendChild(el('div','ad-mut','Delivered, payment pending · '+name(r._c)+' · '+(r.order_no||'')+' '+r.item+' · '+inr(r.payout))));
   if(!late.length&&!needAddr.length&&!addrReady.length&&!delUnpaid.length)at.appendChild(el('p','ad-mut','All clear.'));P.appendChild(at);
   const sc=el('div','ad-card');sc.appendChild(el('h2',null,'Not updated in 7+ days'));
   stale.slice(0,12).forEach(r=>{const d=Math.round((Date.now()-new Date(r._u))/864e5);sc.appendChild(el('div','ad-mut',d+' days · '+name(r._c)+' · '+(r.order_no||'')+' '+r.item+' · '+(STAGES[(Number(r.stage)||1)-1]||'')));});
   if(!stale.length)sc.appendChild(el('p','ad-mut','Sab orders recently update hue hain.'));P.appendChild(sc);}
  /* ORDERS */
  {const P=panes.orders;orderBoard(P,rows,name);newOrderCard(P,rows);
   const fc=el('div','ad-card');fc.appendChild(el('h2',null,'Pipeline by stage'));const mx=Math.max(1,...STAGES.map((_,i)=>open.filter(r=>(Number(r.stage)||1)===i+1).length));
   STAGES.forEach((st,i)=>{const n=open.filter(r=>(Number(r.stage)||1)===i+1).length;if(!n)return;const row=el('div','dz-bar');row.appendChild(el('span','ad-mut',(i+1)+' · '+st));const bw=el('div','b');const bi=el('i');bi.style.width=Math.round(n/mx*100)+'%';bw.appendChild(bi);row.appendChild(bw);row.appendChild(el('b',null,String(n)));fc.appendChild(row);});
   if(!open.length)fc.appendChild(el('p','ad-mut','No open orders.'));P.appendChild(fc);}
  /* MONEY */
  {const P=panes.money;const ym=d=>String(d||'').slice(0,7);const now=new Date();const mk=k=>{const d=new Date(now.getFullYear(),now.getMonth()-k,1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');};const MN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
   const months=[5,4,3,2,1,0].map(mk);const billed=months.map(mm=>sum(rows.filter(r=>ym(r.order_date)===mm)));const coll=months.map(mm=>sum(rows.filter(r=>r.payout_status==='Received'&&ym(r.payment_date||r.order_date)===mm)));
   const mc=el('div','ad-card');mc.appendChild(el('h2',null,'This month'));const g=el('div','dz-kpis');
   const dlt=(a,b)=>b?(a>=b?'+':'')+Math.round((a-b)/b*100)+'% vs last month':'';
   g.append(Object.assign(el('div','dz-kpi'),{}),Object.assign(el('div','dz-kpi'),{}));g.textContent='';
   const k1=el('div','dz-kpi');k1.append(el('div','ad-mut','Billed'),el('div','v',inr(billed[5])),el('div','ad-mut',dlt(billed[5],billed[4])));
   const k2=el('div','dz-kpi');k2.append(el('div','ad-mut','Collected'),el('div','v',inr(coll[5])),el('div','ad-mut',dlt(coll[5],coll[4])));
   const k3=el('div','dz-kpi');k3.append(el('div','ad-mut','Outstanding'),el('div','v',inr(sum(pend))),el('div','ad-mut',pend.length+' orders'));
   const k4=el('div','dz-kpi');k4.append(el('div','ad-mut','Avg order'),el('div','v',inr(rows.length?Math.round(sum(rows)/rows.length):0)));
   g.append(k1,k2,k3,k4);mc.appendChild(g);
   const ch=el('div','dz-chart');const mxv=Math.max(1,...billed,...coll);months.forEach((mm,i)=>{const col=el('div','c');const bb=el('div','bars');const b1=el('i','b1');b1.style.height=Math.round(billed[i]/mxv*100)+'%';b1.title='Billed '+inr(billed[i]);const b2=el('i','b2');b2.style.height=Math.round(coll[i]/mxv*100)+'%';b2.title='Collected '+inr(coll[i]);bb.append(b1,b2);col.append(bb,el('span','ad-mut',MN[Number(mm.slice(5,7))-1]));ch.appendChild(col);});
   mc.appendChild(el('div','ad-mut','Last 6 months · gold = billed, green = collected'));mc.appendChild(ch);P.appendChild(mc);
   const dc=el('div','ad-card');dc.appendChild(el('h2',null,'Dues by client · send reminder'));
   clients.forEach(c=>{const r=pend.filter(x=>x._c===c.id);if(!r.length)return;const amt=sum(r);const row=el('div','ad-o');row.style.gridTemplateColumns='1fr auto auto';
     const l=el('div');l.appendChild(el('span',null,c.name+' · '+inr(amt)));l.appendChild(el('small',null,r.map(x=>(x.order_no||'')+' '+x.item+' '+inr(x.payout)).join(' · ')));row.appendChild(l);
     const msg='Hi '+String(c.name).split(' ')[0]+', a gentle reminder from Luxella. Pending: '+r.map(x=>(x.order_no||'')+' '+x.item+' '+inr(x.payout)).join(', ')+'. Total '+inr(amt)+'. You can pay from your page: '+base(c.slug)+'#pay';
     const wa=el('a','ad-b','WhatsApp reminder');wa.href='https://wa.me/?text='+encodeURIComponent(msg);wa.target='_blank';wa.rel='noopener';row.appendChild(wa);
     const cp=el('button','ad-b g','Copy');cp.type='button';cp.onclick=()=>{navigator.clipboard.writeText(msg).then(()=>toast('Reminder copied'));};row.appendChild(cp);dc.appendChild(row);});
   if(!pend.length)dc.appendChild(el('p','ad-mut','Koi due nahi.'));P.appendChild(dc);
   const bc=el('div','ad-card');bc.appendChild(el('h2',null,'Top brands'));const by={};rows.forEach(r=>{const k=r.brand||'Other';by[k]=by[k]||{n:0,v:0};by[k].n++;by[k].v+=val(r);});
   Object.entries(by).sort((x,y)=>y[1].v-x[1].v).slice(0,8).forEach(([k,v])=>bc.appendChild(el('div','ad-mut',k+' · '+v.n+' orders · '+inr(v.v))));P.appendChild(bc);}
  /* READY TO SHIP */
  {const P=panes.rts;const card=el('div','ad-card');card.appendChild(el('h2',null,'Ready to ship · all clients'));card.appendChild(el('p','ad-mut','Yahan se badlo toh sab clients ke page pe ek saath update hota hai.'));
   const grp={};(stk.data||[]).forEach(x=>{(grp[x.doc_id]=grp[x.doc_id]||[]).push(x);});
   const updAll=async(id,fn)=>{let n=0;for(const x of grp[id]){const d=fn(Object.assign({},x.data||{}));const r=await sb.from('lx_docs').update({data:d}).eq('client_id',x.client_id).eq('collection','stock').eq('doc_id',id);if(!r.error)n++;}return n;};
   Object.entries(grp).sort((x,y)=>String((x[1][0].data||{}).cat).localeCompare(String((y[1][0].data||{}).cat))).forEach(([id,arr])=>{const d=arr[0].data||{};const row=el('div','dz-stk');
     if(d.img){const im=document.createElement('img');im.src=d.img.indexOf('http')===0?d.img:base(d.img);row.appendChild(im);}else row.appendChild(el('span','dz-noimg','—'));
     const l=el('div');l.appendChild(el('b',null,(d.brand?d.brand+' · ':'')+d.item));l.appendChild(el('div','ad-mut',[d.cat,d.size,d.colour].filter(Boolean).join(' · ')+' · '+arr.length+' clients'+(d.hidden?' · HIDDEN':Number(d.qty||0)>0?'':' · SOLD')));row.appendChild(l);
     row.appendChild(el('span','dz-pr',Number(d.price)>0?inr(d.price):'On request'));
     const act=el('div','dz-act');
     const ep=el('button','ad-b g','Price');ep.type='button';ep.onclick=async()=>{const v=prompt('Naya price ₹ (0 = on request)',d.price||0);if(v===null)return;const n=await updAll(id,x=>Object.assign(x,{price:Number(v)||0}));toast('Price updated on '+n+' pages');renderClient();};
     const sold=Number(d.qty||0)>0&&!d.hidden;const sb2=el('button','ad-b '+(sold?'d':'g'),sold?'Mark sold':'Make available');sb2.type='button';sb2.onclick=async()=>{const n=await updAll(id,x=>Object.assign(x,sold?{qty:0}:{qty:1,hidden:false}));toast((sold?'Sold':'Available')+' on '+n+' pages');renderClient();};
     act.append(ep,sb2);row.appendChild(act);card.appendChild(row);});
   if(!Object.keys(grp).length)card.appendChild(el('p','ad-mut','Abhi koi item nahi.'));P.appendChild(card);
   const ad=el('div','ad-card');ad.appendChild(el('h2',null,'Add item to all clients'));const f=el('div','dz-form');
   const mi=(ph,t)=>{const i=document.createElement('input');i.placeholder=ph;if(t)i.type=t;f.appendChild(i);return i;};
   const br=mi('Brand'),it=mi('Item name'),sz=mi('Size'),co=mi('Colour'),pr=mi('Price ₹ (0 = on request)','number'),im=mi('Photo URL (https://… or assets/stock/…)');const ct=document.createElement('select');['Footwear','Bags','Apparel','Accessories'].forEach(v=>{const op=document.createElement('option');op.textContent=v;ct.appendChild(op);});f.appendChild(ct);
   const go2=el('button','ad-b','Add to all clients');go2.type='button';go2.onclick=async()=>{if(!it.value.trim()){toast('Item name daalo');return;}const id=pslugA((br.value+' '+it.value+' '+sz.value).trim());const data={brand:br.value.trim(),item:it.value.trim(),size:sz.value.trim(),colour:co.value.trim(),price:Number(pr.value)||0,qty:1,img:im.value.trim(),cat:ct.value,at:todayA()};let n=0;for(const c of clients){const r=await sb.from('lx_docs').upsert({client_id:c.id,collection:'stock',doc_id:id,data},{onConflict:'client_id,collection,doc_id'});if(!r.error)n++;else toast(r.error.message);}toast('Added on '+n+' pages');renderClient();};
   f.appendChild(go2);ad.appendChild(f);P.appendChild(ad);}
  /* CLIENTS */
  {const P=panes.clients;const pc=el('div','ad-card');pc.appendChild(el('h2',null,'Clients'));
   const t=el('div','dz-tbl');t.appendChild(Object.assign(el('div','dz-tr th'),{innerHTML:'<span>Client</span><span>Orders</span><span>Open</span><span>Value</span><span>Due</span><span>Last order</span><span>Opens 7d / all</span><span>Last open</span><span></span>'}));
   clients.map(c=>{const r=rows.filter(x=>x._c===c.id);return {c,r,v:sum(r)};}).sort((x,y)=>y.v-x.v).forEach(({c,r,v})=>{const tr=el('div','dz-tr');const last=r.map(x=>x.order_date||'').sort().pop()||'—';
     tr.append(el('span',null,c.name),el('span',null,String(r.length)),el('span',null,String(r.filter(x=>!del(x)).length)),el('span',null,inr(v)),el('span',null,inr(sum(r.filter(x=>x.payout_status!=='Received')))),el('span',null,last),el('span',null,(counts[c.id]||{}).v7+' / '+(counts[c.id]||{}).v),el('span',null,agoA((counts[c.id]||{}).last)));
     const b=el('button','ad-b g','Manage');b.type='button';b.onclick=()=>{sel=c;renderList();renderClient();};tr.appendChild(b);t.appendChild(tr);});
   pc.appendChild(t);P.appendChild(pc);}
  /* TOOLS */
  {const P=panes.tools;P.appendChild(linkCard(P));composeCard(P);
   const bc=el('div','ad-card');bc.appendChild(el('h2',null,'Broadcast to clients'));bc.appendChild(el('p','ad-mut','Sab ya chune hue clients ko ek saath update bhejo. Popup unke app me dikhega.'));
   const box=el('div','dz-cl');const pick={};clients.forEach(c=>{const l=document.createElement('label');const cb=document.createElement('input');cb.type='checkbox';cb.checked=!/^zz/.test(c.slug);pick[c.id]=cb;l.append(cb,document.createTextNode(' '+c.name));box.appendChild(l);});bc.appendChild(box);
   const ti=document.createElement('input');ti.placeholder='Title (e.g. Diwali dispatch schedule)';const bi=document.createElement('textarea');bi.placeholder='Message';bi.rows=3;const pin=document.createElement('label');const pc2=document.createElement('input');pc2.type='checkbox';pin.append(pc2,document.createTextNode(' Also pin on their page + send email'));
   const f=el('div','dz-form');f.append(ti,bi,pin);bc.appendChild(f);
   const send=el('button','ad-b','Send broadcast');send.type='button';send.onclick=async()=>{const ids=clients.filter(c=>pick[c.id].checked);if(!ti.value.trim()||!ids.length){toast('Title aur clients chuno');return;}if(!confirm(ids.length+' clients ko bhejna hai'+(pc2.checked?' (email bhi jayegi)':'')+'. Pakka?'))return;send.disabled=true;let n=0;const at=new Date().toISOString();
     for(const c of ids){const r=await sb.from('lx_docs').insert({client_id:c.id,collection:'notices',doc_id:'b-'+Date.now().toString(36)+'-'+c.slug,data:{title:ti.value.trim(),body:bi.value.trim(),url:'ov',at,seen:false,broadcast:true}});if(!r.error)n++;
       if(pc2.checked){await sb.from('lx_docs').upsert({client_id:c.id,collection:'meta',doc_id:'pinned',data:{text:ti.value.trim()+(bi.value.trim()?' — '+bi.value.trim():''),at}},{onConflict:'client_id,collection,doc_id'});}}
     send.disabled=false;toast('Sent to '+n+' clients');ti.value='';bi.value='';};
   bc.appendChild(send);P.appendChild(bc);
   const ex=el('div','ad-card');ex.appendChild(el('h2',null,'Export'));const eb=el('button','ad-b g','Download all orders (CSV)');eb.type='button';eb.onclick=()=>{const cols=['client','order_no','order_date','brand','item','size','qty','order_type','stage','status','payout','payout_status','payment_date','eta_date','intl_tracking_no','local_tracking','delivery_address'];const q=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';const lines=[cols.join(',')].concat(rows.map(r=>cols.map(k=>q(k==='client'?name(r._c):r[k])).join(',')));const blob=new Blob([lines.join('\n')],{type:'text/csv'});const a2=document.createElement('a');a2.href=URL.createObjectURL(blob);a2.download='luxella-orders-'+todayA()+'.csv';a2.click();};ex.appendChild(eb);P.appendChild(ex);}
  /* ACTIVITY */
  {const P=panes.activity;const ac=el('div','ad-card');ac.appendChild(el('h2',null,'Recent activity'));const fsel=document.createElement('select');fsel.innerHTML='<option value="">All clients</option>'+clients.map(c=>'<option value="'+c.id+'">'+esc(c.name)+'</option>').join('');ac.appendChild(fsel);const lst=el('div');ac.appendChild(lst);
   const dr=()=>{lst.textContent='';(a.data||[]).filter(x=>!fsel.value||x.client_id===fsel.value).forEach(x=>lst.appendChild(el('div','dz-act-row',new Date(x.at).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})+' · '+name(x.client_id)+' · '+x.op+' '+x.tbl+' '+(x.ref||''))));if(!lst.childNodes.length)lst.appendChild(el('p','ad-mut','Nothing yet.'));};fsel.onchange=dr;dr();P.appendChild(ac);}
}

(async function init(){
  shell();
  try{await loadClients();}catch(e){root.querySelector('#ad-main').textContent=e.message;return;}
  const h=decodeURIComponent((location.hash||'').slice(1));sel=clients.find(c=>c.slug===h)||null;
  renderList();renderClient();
  clientsView();
})();
function clientsView(){
  const top=root.querySelector('.ad-top');const wrap=root.querySelector('.ad-wrap');
  const nav=el('div','ad-nav');const b1=el('button','ad-nb on','Admin');const b2=el('button','ad-nb','Clients');const b3=el('button','ad-nb','B2B');b3.hidden=true;nav.append(b1,b2);top.insertBefore(nav,top.querySelector('.sp'));
  const cv=el('div','ad-cv');cv.hidden=true;root.appendChild(cv);
  const bar=el('div','ad-cvbar');const fr=document.createElement('iframe');fr.className='ad-fr';fr.title='Client view';
  const note=el('span','ad-mut','View only. Exactly what the client sees. Nothing can be changed here.');
  let cur=null;
  const pick=c=>{cur=c;[...bar.querySelectorAll('.ad-cc')].forEach(x=>x.classList.toggle('on',x.dataset.s===c.slug));fr.src=base('./')+c.slug+'?asclient=1#ov';try{history.replaceState(null,'',location.pathname+'#clients:'+c.slug);}catch(e){}};
  clients.forEach(c=>{const b=el('button','ad-cc',c.name);b.dataset.s=c.slug;b.onclick=()=>pick(c);bar.appendChild(b);});
  const open=el('a','ad-b g','Open in new tab');open.target='_blank';open.rel='noopener';open.onclick=()=>{if(cur)open.href=base('./')+cur.slug+'?asclient=1#ov';};
  bar.appendChild(open);cv.append(bar,note,fr);
  const bbp=el('div','ad-bb');bbp.hidden=true;root.appendChild(bbp);let bbLoaded=false;
  const showB=()=>{[b1,b2].forEach(x=>x.classList.remove('on'));b3.classList.add('on');wrap.hidden=true;cv.hidden=true;bbp.hidden=false;try{history.replaceState(null,'',location.pathname+'#b2b');}catch(e){}
    const go=()=>window.lxB2B(bbp,sb,toast);if(window.lxB2B){if(!bbLoaded){bbLoaded=true;go();}return;}const sc=document.createElement('script');sc.src=base('./')+'b2b.js?v='+Date.now();sc.onload=()=>{bbLoaded=true;go();};document.head.appendChild(sc);};
  b3.onclick=()=>{};
  const show=v=>{b3.classList.remove('on');bbp.hidden=true;b1.classList.toggle('on',!v);b2.classList.toggle('on',v);wrap.hidden=v;cv.hidden=!v;if(v&&!cur&&clients.length){const h=(location.hash||'').match(/^#clients:(.+)$/);pick(clients.find(c=>h&&c.slug===decodeURIComponent(h[1]))||clients.find(c=>!/^zz/.test(c.slug))||clients[0]);}};
  b1.onclick=()=>{show(false);try{history.replaceState(null,'',location.pathname+(sel?'#'+sel.slug:''));}catch(e){}};b2.onclick=()=>show(true);
  if(/^#clients/.test(location.hash))show(true);
}
})();

/* ===== Admin assistant (Oct 2026): type / photo → Brain agent updates the right client & order ===== */
(function(){
const X=window.__lxAdmin;if(!X||!X.S.owner)return;const sb=X.sb;
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;};
const imgB64=f=>new Promise((res,rej)=>{const im=new Image();im.onload=()=>{const M=1600;let w=im.naturalWidth,h=im.naturalHeight;const k=Math.min(1,M/Math.max(w,h));w=Math.round(w*k);h=Math.round(h*k);const cv=document.createElement('canvas');cv.width=w;cv.height=h;cv.getContext('2d').drawImage(im,0,0,w,h);res(cv.toDataURL('image/jpeg',0.8).split(',')[1]);};im.onerror=rej;im.src=URL.createObjectURL(f);});
let clients=[];
async function mount(){const root=document.getElementById('admin-root');if(!root||!root.firstChild){setTimeout(mount,500);return;}if(document.getElementById('adm-ai'))return;
 try{const r=await sb.from('lx_clients').select('slug,name');clients=(r.data||[]).filter(c=>!/^zz/.test(c.slug));}catch(e){}
 const c=el('section','adm-ai');c.id='adm-ai';const h=el('div','adm-ai-h');h.appendChild(el('b',null,'✦ Assistant'));h.appendChild(el('small',null,'Naya order ya purane ka update — likho ya photo daalo. Jaise: "Swayam ka naya order: Coach Tabby 26 black, ₹32,000, ETA 15 Nov" · "Himanshu #1004 delivered, payment aa gaya" · "Swayam Bay Slides FedEx 8775… shipped". Brain agent sahi client + order me bana / update kar deta hai (har ghante, 8am–11pm). Client ko sirf "Luxella" dikhega.'));c.appendChild(h);
 const row=el('div','adm-ai-f');const sel=document.createElement('select');[['','Client (auto)'],...clients.map(x=>[x.slug,x.name])].forEach(([v,t])=>{const o=el('option',null,t);o.value=v;sel.appendChild(o);});
 const ta=document.createElement('textarea');ta.rows=2;ta.placeholder='Kya update karna hai…';const fi=document.createElement('input');fi.type='file';fi.accept='image/*';fi.hidden=true;const att=el('button','adm-ai-b','📷');att.type='button';att.onclick=()=>fi.click();
 const send=el('button','adm-ai-go','Send');send.type='button';row.append(sel,ta,att,send,fi);c.appendChild(row);const fn=el('small','adm-ai-file','');c.appendChild(fn);fi.onchange=()=>{fn.textContent=fi.files[0]?'📷 '+fi.files[0].name:'';};
 const log=el('div','adm-ai-log');c.appendChild(log);
 const load=async()=>{const r=await sb.from('lx_b2b').select('id,data').eq('kind','note').order('id',{ascending:false}).limit(30);const L=(r.data||[]).filter(x=>x.data&&x.data.scope==='clients').slice(0,6);log.textContent='';L.forEach(x=>{const d=el('div','adm-ai-i '+(x.data.status||''));d.appendChild(el('span','s',x.data.status==='done'?'✓':x.data.status==='needs-jeet'?'?':'…'));const t=el('div');t.appendChild(el('b',null,(x.data.client?x.data.client+' · ':'')+String(x.data.text||'[photo]').slice(0,120)));if(x.data.result)t.appendChild(el('small',null,x.data.result));else t.appendChild(el('small',null,'Brain agent agle run me karega'));d.appendChild(t);log.appendChild(d);});};
 send.onclick=async()=>{const text=ta.value.trim();const f=fi.files&&fi.files[0];if(!text&&!f)return;send.disabled=true;let client=sel.value;if(!client){const lt=text.toLowerCase();const m=clients.find(x=>lt.includes(x.slug)||lt.includes(String(x.name).toLowerCase().split(' ')[0]));if(m)client=m.slug;}
  const data={scope:'clients',client:client||'',text,created_at:new Date().toISOString(),status:'new',by:'admin'};if(f){try{data.image_b64=await imgB64(f);}catch(e){}}
  const r=await sb.from('lx_b2b').upsert({kind:'note',id:'c-'+Date.now().toString(36),data,updated_at:new Date().toISOString()},{onConflict:'kind,id'});send.disabled=false;if(r.error){alert('Save nahi hua: '+r.error.message);return;}ta.value='';fi.value='';fn.textContent='';load();};
 const st=document.createElement('style');st.textContent=`.adm-ai{border:1px solid #4a3f22;background:linear-gradient(180deg,#14120d,#0E0E0F);padding:14px 16px;margin:14px 0}.adm-ai-h{display:grid;gap:4px;margin-bottom:10px}.adm-ai-h b{font:500 11px 'Jost',sans-serif;letter-spacing:.24em;text-transform:uppercase;color:#E3C565}.adm-ai-h small{color:#8d867a;font-size:12px;line-height:1.5}
 .adm-ai-f{display:grid;grid-template-columns:150px 1fr auto auto;gap:6px}.adm-ai-f select,.adm-ai-f textarea{background:#0A0A0A;border:1px solid #2A2724;color:#F3EEE6;padding:9px;font:inherit;font-size:13px;resize:vertical}.adm-ai-b{background:none;border:1px solid #2A2724;color:#E3C565;padding:0 12px;cursor:pointer}.adm-ai-go{background:linear-gradient(135deg,#E3C565,#B8943F);color:#0A0A0A;border:0;padding:0 16px;font:500 11px 'Jost',sans-serif;letter-spacing:.18em;text-transform:uppercase;cursor:pointer}
 .adm-ai-file{color:#8d867a;font-size:11.5px}.adm-ai-log{display:grid;gap:6px;margin-top:10px}.adm-ai-i{display:flex;gap:10px;font-size:12.5px;color:#C9C2B6;border-top:1px solid #1e1c19;padding-top:6px}.adm-ai-i .s{color:#C9A227;width:14px}.adm-ai-i.done .s{color:#86d39a}.adm-ai-i.needs-jeet .s{color:#f08f7c}.adm-ai-i b{display:block;font-weight:400}.adm-ai-i small{color:#8d867a}
 @media(max-width:600px){.adm-ai-f{grid-template-columns:1fr auto auto}.adm-ai-f select{grid-column:1/-1}}`;document.head.appendChild(st);
 const top=root.querySelector('.ad-top,header,.top');if(top&&top.nextSibling)root.insertBefore(c,top.nextSibling);else root.insertBefore(c,root.children[1]||null);load();setInterval(load,60000);}
setTimeout(mount,800);
})();
