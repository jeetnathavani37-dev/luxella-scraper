/* Luxella client portal — runtime shim over Supabase.
   Provides the same `dash` and `window.claude.use` surface the page was written against. */
(function(){
const SUPABASE_URL='https://qzripzgbstvxkfobzhyv.supabase.co';
const SUPABASE_KEY='sb_publishable_-EA-q_dacUuWovbrCW5XVw_pPZ2vK_O';
const KEEP_KEY='lx_keep';const keep=()=>{try{return localStorage.getItem(KEEP_KEY)!=='0';}catch(e){return true;}};
const store={getItem:k=>{try{return localStorage.getItem(k)??sessionStorage.getItem(k);}catch(e){return null;}},setItem:(k,v)=>{try{if(keep()){localStorage.setItem(k,v);sessionStorage.removeItem(k);}else{sessionStorage.setItem(k,v);localStorage.removeItem(k);}}catch(e){}},removeItem:k=>{try{localStorage.removeItem(k);sessionStorage.removeItem(k);}catch(e){}}};
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:store}});
window.sb=sb;

/* ---- tiny d3 stand-in (only what the page uses) ---- */
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONL=['January','February','March','April','May','June','July','August','September','October','November','December'];
window.d3={max:(a,f)=>a.length?Math.max(...a.map(f)):undefined,
 utcFormat:(spec)=>(d)=>{const t=d instanceof Date?d:new Date(d);if(isNaN(t))return '—';return spec.replace('%-d',String(t.getUTCDate())).replace('%d',String(t.getUTCDate()).padStart(2,'0')).replace('%B',MONL[t.getUTCMonth()]).replace('%b',MON[t.getUTCMonth()]).replace('%Y',String(t.getUTCFullYear())).replace('%y',String(t.getUTCFullYear()).slice(2));},
 format:()=>v=>new Intl.NumberFormat('en-IN').format(Math.round(Number(v)||0))};

/* ---- state ---- */
const S={session:null,email:'',owner:false,client:null,orders:[],docs:{},listeners:{coll:{},doc:{}},onData:[],calcs:{},channel:null,ready:false};
const g=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s);

/* ---- auth gate ---- */
function gate(html){const w=g('gate');w.hidden=false;w.innerHTML='<div class="box">'+html+'</div>';g('dash-root').hidden=true;g('top').hidden=true;}
function gateLogin(msg){gate('<img class="logo" src="assets/luxella_logo.png" alt="Luxella"><p>Private client access. Sign in with the email and password Luxella gave you.</p><input id="lg-email" type="email" placeholder="Email" autocomplete="username"><input id="lg-pass" type="password" placeholder="Password" autocomplete="current-password"><label class="keep"><input type="checkbox" id="lg-keep" checked><span>Keep me signed in on this device</span></label><button id="lg-go">Sign in</button><div class="m" id="lg-m">'+esc(msg||'')+'</div>');
 const em=g('lg-email'),pw=g('lg-pass'),m=g('lg-m');
 g('lg-go').onclick=async()=>{const email=em.value.trim().toLowerCase(),password=pw.value;if(!email||!password){m.textContent='Enter your email and password.';return;}m.textContent='Signing in…';try{localStorage.setItem(KEEP_KEY,g('lg-keep').checked?'1':'0');}catch(e){}const {error}=await sb.auth.signInWithPassword({email,password});if(error){m.textContent=/invalid/i.test(error.message)?'Email or password is incorrect. Message Luxella if you need a reset.':error.message;return;}m.textContent='';};
 [em,pw].forEach(x=>x.addEventListener('keydown',e=>{if(e.key==='Enter')g('lg-go').click();}));}
function gateNoAccess(){gate('<img class="logo" src="assets/luxella_logo.png" alt="Luxella"><p>This email ('+esc(S.email)+') is not linked to a client page yet. Ask Luxella to add it.</p><button class="out" id="lg-out">Sign out</button>');g('lg-out').onclick=()=>sb.auth.signOut().then(()=>location.reload());}
async function gatePick(){const {data,error}=await sb.from('lx_clients').select('id,slug,name,biz').order('name');if(error){gate('<img class="logo" src="assets/luxella_logo.png" alt="Luxella"><p>'+esc(error.message)+'</p>');return;}
 gate('<img class="logo" src="assets/luxella_logo.png" alt="Luxella"><p>Choose a client page to open.</p><div class="pick">'+(data||[]).map(c=>'<button data-s="'+esc(c.slug)+'">'+esc(c.name)+(c.biz?' · '+esc(c.biz):'')+'</button>').join('')+'</div><div class="pick" style="margin-top:18px"><input id="nc-name" placeholder="New client name"><input id="nc-slug" placeholder="slug (e.g. himanshu)"><input id="nc-email" placeholder="client email"><button id="nc-go">Create client</button></div><button class="out" id="lg-out">Sign out</button>');
 document.querySelectorAll('#gate .pick [data-s]').forEach(b=>b.onclick=()=>{location.href=new URL(b.getAttribute('data-s'),document.baseURI).href;});
 g('lg-out').onclick=()=>sb.auth.signOut().then(()=>location.reload());
 g('nc-go').onclick=async()=>{const name=g('nc-name').value.trim(),slug=g('nc-slug').value.trim().toLowerCase().replace(/[^a-z0-9-]/g,''),email=g('nc-email').value.trim().toLowerCase();if(!name||!slug)return;const r=await sb.from('lx_clients').insert({slug,name}).select().single();if(r.error){alert(r.error.message);return;}if(email)await sb.from('lx_client_users').insert({client_id:r.data.id,email});location.href=new URL(slug,document.baseURI).href;};}

/* ---- data layer ---- */
function parsePath(p){const parts=String(p).split('/').filter(Boolean);return {coll:parts.slice(0,-1).join('/'),id:parts[parts.length-1],collOnly:parts.join('/')};}
function emitColl(coll){const ls=S.listeners.coll[coll]||[];const docs=Object.entries(S.docs[coll]||{}).map(([id,data])=>({id,exists:true,data:()=>data}));ls.forEach(f=>{try{f({docs,size:docs.length,empty:!docs.length,docChanges:()=>[],metadata:{}});}catch(e){console.error(e);}});}
function emitDoc(coll,id){const ls=S.listeners.doc[coll+'/'+id]||[];const data=(S.docs[coll]||{})[id];ls.forEach(f=>{try{f({id,exists:data!==undefined,data:()=>data,metadata:{}});}catch(e){console.error(e);}});}
async function loadAll(){const cid=S.client.id;const [o,d]=await Promise.all([sb.from('lx_orders').select('item,data').eq('client_id',cid),sb.from('lx_docs').select('collection,doc_id,data').eq('client_id',cid)]);
 S.orders=(o.data||[]).map(r=>Object.assign({item:r.item},r.data));S.docs={};(d.data||[]).forEach(r=>{(S.docs[r.collection]=S.docs[r.collection]||{})[r.doc_id]=r.data;});S.ready=true;}
function subscribe(){if(S.channel)return;const cid=S.client.id;S.channel=sb.channel('lx-'+cid)
 .on('postgres_changes',{event:'*',schema:'public',table:'lx_docs',filter:'client_id=eq.'+cid},p=>{const r=p.new&&p.new.collection?p.new:p.old;if(!r)return;if(p.eventType==='DELETE'){if(S.docs[r.collection])delete S.docs[r.collection][r.doc_id];}else{(S.docs[r.collection]=S.docs[r.collection]||{})[r.doc_id]=p.new.data;}emitColl(r.collection);emitDoc(r.collection,r.doc_id);fire();})
 .on('postgres_changes',{event:'*',schema:'public',table:'lx_orders',filter:'client_id=eq.'+cid},async()=>{const o=await sb.from('lx_orders').select('item,data').eq('client_id',cid);S.orders=(o.data||[]).map(r=>Object.assign({item:r.item},r.data));fire();})
 .subscribe();}
let fireT=null;function fire(){clearTimeout(fireT);fireT=setTimeout(()=>S.onData.forEach(f=>{try{f();}catch(e){console.error(e);}}),30);}

const db={
 collection(path){const coll=parsePath(path).collOnly;return {path,
  onSnapshot(next,err){(S.listeners.coll[coll]=S.listeners.coll[coll]||[]).push(next);if(S.ready)emitColl(coll);return()=>{S.listeners.coll[coll]=(S.listeners.coll[coll]||[]).filter(f=>f!==next);};},
  doc(id){return db.doc(coll+'/'+(id||('d'+Date.now().toString(36)+Math.random().toString(36).slice(2,7))));},
  async add(data){const ref=this.doc();await ref.set(data);return ref;},
  async get(){const docs=Object.entries(S.docs[coll]||{}).map(([id,data])=>({id,exists:true,data:()=>data}));return {docs,size:docs.length,empty:!docs.length};}};},
 doc(path){const {coll,id}=parsePath(path);return {id,path,
  onSnapshot(next,err){(S.listeners.doc[coll+'/'+id]=S.listeners.doc[coll+'/'+id]||[]).push(next);if(S.ready)emitDoc(coll,id);return()=>{};},
  async get(){const data=(S.docs[coll]||{})[id];return {id,exists:data!==undefined,data:()=>data,metadata:{}};},
  async set(data){const r=await sb.from('lx_docs').upsert({client_id:S.client.id,collection:coll,doc_id:id,data,updated_at:new Date().toISOString()},{onConflict:'client_id,collection,doc_id'});if(r.error)throw Object.assign(new Error(r.error.message),{code:'invalid_argument'});(S.docs[coll]=S.docs[coll]||{})[id]=data;emitColl(coll);emitDoc(coll,id);fire();},
  async update(data){const cur=(S.docs[coll]||{})[id];if(cur===undefined)throw Object.assign(new Error('missing'),{code:'invalid_argument'});return this.set(Object.assign({},cur,data));},
  async delete(){const r=await sb.from('lx_docs').delete().match({client_id:S.client.id,collection:coll,doc_id:id});if(r.error)throw Object.assign(new Error(r.error.message),{code:'invalid_argument'});if(S.docs[coll])delete S.docs[coll][id];emitColl(coll);emitDoc(coll,id);fire();},
  collection(sub){return db.collection(coll+'/'+id+'/'+sub);}};}};
const assets={async upload(file){const safe=(file.name||'file').replace(/[^a-zA-Z0-9._-]/g,'_');const path=(S.owner?S.client.slug:'client-uploads/'+S.client.slug)+'/'+Date.now()+'_'+safe;const r=await sb.storage.from('lx-assets').upload(path,file,{upsert:false,contentType:file.type||undefined});if(r.error)throw Object.assign(new Error(r.error.message),{code:'invalid_argument'});const {data}=sb.storage.from('lx-assets').getPublicUrl(path);return {id:path,url:data.publicUrl,sizeBytes:file.size,contentType:file.type};},
 async list(){return {assets:[],usage:{}};},async delete(id){await sb.storage.from('lx-assets').remove([id]);}};
const user={async canEdit(){return S.owner;},async isOwner(){return S.owner;},async can(){return S.owner;},async id(){return S.session?S.session.user.id:null;},async me(){return {id:S.session?S.session.user.id:'',name:S.email};},async profiles(){return {};}};
window.claude={use:async(name)=>{if(name==='db')return db;if(name==='assets')return S.owner?assets:assets;if(name==='user')return user;return null;}};

window.dash={
 data(id){if(id==='orders')return {status:S.ready?'ok':'loading',data:S.orders,columns:[],meta:[]};const c=S.calcs[id];if(!c)return {status:'missing',data:[]};if(!S.ready)return {status:'loading',data:[]};try{const inputs=c.inputs.map(i=>i==='orders'?S.orders:(window.dash.data(i).data||[]));return {status:'ok',data:c.fn(...inputs)};}catch(e){console.error(e);return {status:'error',data:[],message:String(e)};}},
 calc(id,o){S.calcs[id]=o;},
 onData(fn){S.onData.push(fn);if(S.ready)fn();},
 loader(){},colors:['#C9A227','#E3C565','#8C6E16','#A39C90','#D9BD6A','#6B5A24','#F0DFA4','#B59A45'],
 refresh(){},params(){return {};},setParams(){},resetParams(){},setLink(name){try{history.replaceState(null,'','#'+name);}catch(e){}}};


/* ---- owner admin API (RLS allows owner only; passwords via lx-admin edge function) ---- */
const FN_URL=SUPABASE_URL+'/functions/v1/lx-admin';
async function adminCall(body){const {data:{session}}=await sb.auth.getSession();const r=await fetch(FN_URL,{method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY,'Authorization':'Bearer '+(session?session.access_token:'')},body:JSON.stringify(body)});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||('HTTP '+r.status));return j;}
window.lx={
 isOwner:()=>S.owner,client:()=>S.client,
 async saveOrder(item,data){const r=await sb.from('lx_orders').upsert({client_id:S.client.id,item,data,updated_at:new Date().toISOString()},{onConflict:'client_id,item'});if(r.error)throw new Error(r.error.message);const i=S.orders.findIndex(o=>o.item===item);const row=Object.assign({item},data);if(i>=0)S.orders[i]=row;else S.orders.push(row);fire();},
 async renameOrder(oldItem,newItem,data){if(oldItem===newItem)return this.saveOrder(newItem,data);await this.saveOrder(newItem,data);await this.deleteOrder(oldItem);},
 async deleteOrder(item){const r=await sb.from('lx_orders').delete().match({client_id:S.client.id,item});if(r.error)throw new Error(r.error.message);S.orders=S.orders.filter(o=>o.item!==item);fire();},
 async listClients(){const r=await sb.from('lx_clients').select('id,slug,name,biz').order('name');if(r.error)throw new Error(r.error.message);return r.data;},
 async updateClient(patch){const r=await sb.from('lx_clients').update(patch).eq('id',S.client.id).select().single();if(r.error)throw new Error(r.error.message);S.client=r.data;window.LX_CLIENT={name:S.client.name,biz:S.client.biz||''};fire();return r.data;},
 async listUsers(){const r=await sb.from('lx_client_users').select('id,email').eq('client_id',S.client.id).order('email');if(r.error)throw new Error(r.error.message);return r.data;},
 async addUser(email){const r=await sb.from('lx_client_users').insert({client_id:S.client.id,email:email.toLowerCase()});if(r.error)throw new Error(r.error.message);},
 async removeUser(id){const r=await sb.from('lx_client_users').delete().eq('id',id);if(r.error)throw new Error(r.error.message);},
 setPassword:(email,password)=>adminCall({action:'set_password',email,password}),
 deleteLogin:(email)=>adminCall({action:'delete_user',email})
};

/* ---- boot ---- */
function topbar(){const t=g('top');t.hidden=false;t.innerHTML='<img class="tlogo" src="assets/luxella_logo.png" alt="Luxella"><span class="who">'+esc(S.email)+'</span>'+(S.owner?'<button id="tb-switch">Switch client</button>':'')+'<button id="tb-out">Sign out</button>';if(S.owner)g('tb-switch').onclick=()=>{location.href=new URL('./',document.baseURI).href;};g('tb-out').onclick=()=>sb.auth.signOut().then(()=>{location.href=new URL('./',document.baseURI).href;});}
async function start(){const {data:{session}}=await sb.auth.getSession();S.session=session;if(!session){gateLogin();return;}S.email=(session.user.email||'').toLowerCase();S.owner=['jeetnathavani37@gmail.com','jeetnatb@gmail.com'].includes(S.email);
 const basePath=new URL(document.baseURI).pathname;const rel=location.pathname.startsWith(basePath)?location.pathname.slice(basePath.length):'';const seg=rel.split('/').filter(Boolean)[0]||'';const slug=new URLSearchParams(location.search).get('c')||(seg==='index.html'?'':seg);
 let q=sb.from('lx_clients').select('id,slug,name,biz');q=slug?q.eq('slug',slug):q;const {data:clients,error}=await q;
 if(error){gate('<img class="logo" src="assets/luxella_logo.png" alt="Luxella"><p>'+esc(error.message)+'</p>');return;}
 if(!clients||!clients.length){if(S.owner){gatePick();return;}gateNoAccess();return;}
 if(!slug&&S.owner){gatePick();return;}
 S.client=clients[0];window.LX_CLIENT={name:S.client.name,biz:S.client.biz||''};document.title=S.client.name.split(' ')[0]+' · Luxella';
 await loadAll();subscribe();g('gate').hidden=true;topbar();g('dash-root').hidden=false;
 if(!window.__pageLoaded){window.__pageLoaded=true;const s=document.createElement('script');s.src='app.js';s.onload=()=>{fire();if(S.owner){const m=document.createElement('script');m.src='manage.js';document.body.appendChild(m);}};document.body.appendChild(s);}else fire();}
sb.auth.onAuthStateChange((ev)=>{if(ev==='SIGNED_IN'||ev==='TOKEN_REFRESHED'){if(!S.client)start();}if(ev==='SIGNED_OUT'){location.reload();}});
start();
})();
