/* Deals tab: daily deals, deal-sheet PDFs, photo→PDF builder, branded PDF generator, client requests, reseller margin quotes */
(function(){
 const $=id=>document.getElementById(id);
 const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;};
 const num=v=>v===''||v==null||isNaN(Number(v))?null:Number(v);
 const inr=n=>num(n)==null?'':'₹'+Math.round(Number(n)).toLocaleString('en-IN');
 const WA='918724079056';
 const today=()=>new Date(Date.now()+5.5*3600e3).toISOString().slice(0,10);
 const addD=(d,k)=>new Date(Date.parse(d+'T00:00:00Z')+k*864e5).toISOString().slice(0,10);
 const own=()=>{try{return !!(window.lx&&window.lx.isOwner&&window.lx.isOwner());}catch(e){return false;}};
 const cli=()=>{try{return (window.lx&&window.lx.client&&window.lx.client())||{};}catch(e){return {};}};
 const logo=b=>{try{return staticLogo(b);}catch(e){return '';}};
 const dayLabel=d=>{const t=today();if(d===t)return 'Today';if(d===addD(t,-1))return 'Yesterday';try{return new Date(d+'T00:00:00Z').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'});}catch(e){return d;}};
 const say=t=>{try{const w=el('div','lx-toast');w.appendChild(el('b',null,'Luxella'));w.appendChild(el('span',null,t));document.body.appendChild(w);requestAnimationFrame(()=>w.classList.add('in'));setTimeout(()=>{w.classList.remove('in');setTimeout(()=>w.remove(),500);},3200);}catch(e){alert(t);}};
 let rows=[],busy=false;
 const F={day:'all',brand:'',saved:false,q:''};
 let M={on:false,mode:'pct',val:15,round:true};let SAVED=new Set();let prefsHooked=false;

 /* ---------- data ---------- */
 async function load(){if(busy||!window.lx||!window.lx.deals)return;busy=true;try{rows=await window.lx.deals.list();render();badge();}catch(e){const l=$('deals-list');if(l&&!rows.length)l.textContent='Deals could not load. Pull to refresh.';}busy=false;}
 function badge(){const t=$('tab-deals');if(!t)return;let b=t.querySelector('span');const n=rows.filter(r=>r.kind==='deal'&&r.day===today()).length;if(!n){if(b)b.remove();return;}if(!b){b=el('span','bdg');t.appendChild(b);}b.textContent=n;}
 function hookPrefs(){if(prefsHooked||own())return;try{photos.db.collection('prefs').onSnapshot(s=>{s.docs.forEach(d=>{if(!d.exists)return;const x=d.data()||{};if(d.id==='deal_margin')M=Object.assign(M,x);if(d.id==='deal_saved')SAVED=new Set(x.ids||[]);if(d.id==='pdf_studio')ST=Object.assign({},ST,x);});marginPanel(true);render();},()=>{});prefsHooked=true;}catch(e){}}
 async function savePref(id,data){try{await photos.db.doc('prefs/'+id).set(data);}catch(e){}}

 /* ---------- margin ---------- */
 const suggestPct=p=>p==null?15:(p<10000?20:(p<25000?15:(p<60000?12:10)));
 function mgOf(k){k=k?String(k):'';const it=(M.item||{})[k];if(it)return Object.assign({scope:'piece'},it);const pp=(M.post||{})[k.split(':')[0]];if(pp)return Object.assign({scope:'drop'},pp);return {mode:M.mode,val:M.val,scope:'all'};}
 function quote(p,k){if(num(p)==null)return null;const g=mgOf(k);let q=g.mode==='amt'?Number(p)+Number(g.val||0):Number(p)*(1+Number(g.val||0)/100);if(M.round)q=Math.ceil(q/100)*100;return q;}
 function marginPanel(refresh){const w=$('deals-margin');if(!w||own())return;if(w.dataset.b&&!refresh)return;w.dataset.b=1;w.textContent='';
  const d=el('details','dl-mg');const s=el('summary');s.appendChild(el('span','dl-mg-t','Your resale quote'));s.appendChild(el('span','dl-mg-s',M.on?(M.mode==='amt'?'+'+inr(M.val):'+'+M.val+'%')+' on every deal':'Off · set your margin'));d.appendChild(s);
  const b=el('div','dl-mgb');b.appendChild(el('p','dl-mg-n','Add your margin once. Every deal then shows your selling price, and you can share quote cards and PDFs in your own brand.'));
  const tg=el('div','dl-mode');const bp=el('button','chip','By %');bp.type='button';const ba=el('button','chip','By ₹ amount');ba.type='button';tg.appendChild(bp);tg.appendChild(ba);b.appendChild(tg);
  const row=el('div','dl-mg-row');const inp=el('input','dl-in');inp.type='number';inp.min='0';inp.value=M.val;const unit=el('span','dl-mg-u');row.appendChild(inp);row.appendChild(unit);b.appendChild(row);
  const sug=el('div','dl-mg-sug');b.appendChild(sug);
  const rl=el('label','dl-chk');const rc=el('input');rc.type='checkbox';rc.checked=!!M.round;rl.appendChild(rc);rl.appendChild(el('span',null,'Round up to the nearest ₹100'));b.appendChild(rl);
  const ex=el('div','dl-mg-ex');b.appendChild(ex);
  const act=el('div','dl-ac');const sv=el('button','btn dl-ask','Save margin');sv.type='button';const off=el('button','btn2','Turn off');off.type='button';act.appendChild(sv);if(M.on)act.appendChild(off);b.appendChild(act);
  let mode=M.mode;
  const paint=()=>{bp.setAttribute('aria-pressed',String(mode==='pct'));ba.setAttribute('aria-pressed',String(mode==='amt'));unit.textContent=mode==='pct'?'%':'₹ per piece';sug.textContent='';
   (mode==='pct'?[10,12,15,20,25]:[500,1000,1500,2000,3000]).forEach(v=>{const c=el('button','chip',mode==='pct'?v+'%':inr(v));c.type='button';c.setAttribute('aria-pressed',String(Number(inp.value)===v));c.addEventListener('click',()=>{inp.value=v;paint();});sug.appendChild(c);});
   const ps=rows.filter(r=>r.kind==='deal'&&num((r.data||{}).price)!=null).map(r=>Number(r.data.price));const avg=ps.length?ps.reduce((a,x)=>a+x,0)/ps.length:15000;const sp=suggestPct(avg);
   const keep=M;M=Object.assign({},M,{mode,val:Number(inp.value||0),round:rc.checked});const ex1=quote(avg);M=keep;
   ex.textContent='Suggested for these deals: '+sp+'% · e.g. '+inr(avg)+' → '+inr(ex1)+' your price';};
  bp.addEventListener('click',()=>{mode='pct';if(Number(inp.value)>100)inp.value=15;paint();});ba.addEventListener('click',()=>{mode='amt';if(Number(inp.value)<=100)inp.value=1000;paint();});inp.addEventListener('input',paint);rc.addEventListener('change',paint);
  sv.addEventListener('click',async()=>{M=Object.assign({},M,{on:true,mode,val:Number(inp.value||0),round:rc.checked});await savePref('deal_margin',M);say('Margin saved. Your prices now show on every deal.');marginPanel(true);render();});
  off.addEventListener('click',async()=>{M=Object.assign({},M,{on:false});await savePref('deal_margin',M);marginPanel(true);render();});
  paint();d.appendChild(b);w.appendChild(d);}

 /* ---------- requests ---------- */
 const ASK={price:'Price request',size:'Size check',availability:'Availability check',buy:'Wants this piece',similar:'Find something similar'};
 function request(r,kind){const d=r.data||{};const sh=sheet();sh.box.appendChild(el('div','dl-sh-eb',ASK[kind]));sh.box.appendChild(el('div','dl-sh-t',[d.brand,d.title].filter(Boolean).join(' · ')));
  const sz=el('input','dl-in');sz.placeholder=kind==='size'?'Your size (e.g. UK 8, M)':'Size / colour (optional)';const nt=el('textarea','dl-in dl-ta');nt.rows=3;nt.placeholder='Anything else? (optional)';sh.box.appendChild(sz);sh.box.appendChild(nt);
  const go=el('button','btn dl-ask','Send request');go.type='button';sh.box.appendChild(go);
  go.addEventListener('click',async()=>{if(kind==='size'&&!sz.value.trim()){sz.focus();return;}go.disabled=true;
   const id='deal-'+Date.now().toString(36);const spec=[ASK[kind],'Key '+dealKey(),sz.value.trim()&&('Size: '+sz.value.trim()),d.sizes&&('Listed: '+d.sizes)].filter(Boolean).join(' · ');
   try{await photos.db.doc('requests/'+id).set({brand:d.brand||'',product:d.title||'',spec,qty:1,budget:num(d.price)||0,needBy:'',link:d.link||'',photo:d.img||'',note:nt.value.trim(),urgent:false,status:'Submitted',at:new Date().toISOString(),source:'deal',deal_id:r.id,ask:kind});
    markReq(r.id,kind);sh.close();say('Request sent. Luxella will reply here and on WhatsApp.');render();}
   catch(e){const m='Hi Luxella, '+ASK[kind].toLowerCase()+' for '+[d.brand,d.title].filter(Boolean).join(' ')+(sz.value?' · size '+sz.value:'')+'.';window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(m),'_blank','noopener');sh.close();}});}
 function sheet(){const ov=el('div','dl-sh');const box=el('div','dl-sh-b');const x=el('button','x','×');x.type='button';x.setAttribute('aria-label','Close');box.appendChild(x);ov.appendChild(box);const close=()=>{ov.classList.remove('in');setTimeout(()=>ov.remove(),300);};x.addEventListener('click',close);ov.addEventListener('click',e=>{if(e.target===ov)close();});(document.querySelector('.sw')||document.body).appendChild(ov);requestAnimationFrame(()=>ov.classList.add('in'));return {box,close};}

 /* ---------- quote card (client's own style) ---------- */
 function loadImg(src){return new Promise(res=>{if(!src)return res(null);const i=new Image();i.crossOrigin='anonymous';i.onload=()=>res(i);i.onerror=()=>res(null);i.src=src;});}
 async function quoteCanvas(d,q){const W=1080,H=1350;const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#141210');g.addColorStop(1,'#070605');x.fillStyle=g;x.fillRect(0,0,W,H);
  const cl=cli();let lg=null;try{lg=photos.client&&photos.client.url?await loadImg(photos.client.url):null;}catch(e){}
  if(lg){const h=110,w=Math.min(420,lg.width*h/lg.height);x.fillStyle='#fff';x.fillRect((W-w)/2-16,56,w+32,h+20);x.drawImage(lg,(W-w)/2,66,w,h);}
  else{x.fillStyle='#EDE6DA';x.font='500 54px Georgia, serif';x.textAlign='center';x.fillText(cl.biz||cl.name||'',W/2,130);}
  x.fillStyle='#fff';const px=90,py=230,pw=W-180,ph=700;x.fillRect(px,py,pw,ph);
  const im=await loadImg(d.img);if(im){const sc=Math.min((pw-80)/im.width,(ph-80)/im.height);const iw=im.width*sc,ih=im.height*sc;x.drawImage(im,px+(pw-iw)/2,py+(ph-ih)/2,iw,ih);}
  x.textAlign='center';x.fillStyle='#C9A35E';x.font='500 30px Helvetica, Arial, sans-serif';x.fillText(String(d.brand||'').toUpperCase(),W/2,1000);
  x.fillStyle='#F3ECDD';x.font='400 38px Helvetica, Arial, sans-serif';const words=String(d.title||'').split(' ');let line='',y=1055;words.forEach(w0=>{const t=line?line+' '+w0:w0;if(x.measureText(t).width>W-200){x.fillText(line,W/2,y);y+=48;line=w0;}else line=t;});if(line)x.fillText(line,W/2,y);
  if(d.sizes){x.fillStyle='#9a917f';x.font='400 28px Helvetica, Arial, sans-serif';x.fillText(d.sizes,W/2,y+48);}
  const pg=x.createLinearGradient(0,1170,0,1240);pg.addColorStop(0,'#FFF3C4');pg.addColorStop(.6,'#E3B85A');pg.addColorStop(1,'#B8913F');x.fillStyle=pg;x.font='600 84px Helvetica, Arial, sans-serif';x.fillText(inr(q),W/2,1235);
  x.fillStyle='#6f685d';x.font='400 24px Helvetica, Arial, sans-serif';x.fillText('Price valid today · DM to order'+(cl.biz?' · '+cl.biz:''),W/2,1300);
  return c;}
 async function shareQuote(r){const d=r.data||{};const q=quote(d.price);if(q==null)return;const sh=sheet();sh.box.classList.add('dl-q');sh.box.appendChild(el('div','dl-sh-eb','Your quote card'));
  const pv=el('div','dl-qpv','Preparing…');sh.box.appendChild(pv);
  const txt=[d.brand,d.title].filter(Boolean).join(' ')+'\n'+(d.sizes?'Size/colour: '+d.sizes+'\n':'')+'Price: '+inr(q)+'\n'+(d.note?d.note+'\n':'')+'DM to order';
  const tb=el('div','dl-msgbox');tb.textContent=txt;
  const ac=el('div','dl-ac');const dlb=el('button','btn dl-ask','Download image');dlb.type='button';const shb=el('button','btn2','Share');shb.type='button';const cpb=el('button','btn2','Copy text');cpb.type='button';ac.appendChild(dlb);ac.appendChild(shb);ac.appendChild(cpb);
  let cv=null;try{cv=await quoteCanvas(d,q);const im=el('img');im.alt='Quote';im.src=cv.toDataURL('image/jpeg',.9);pv.textContent='';pv.appendChild(im);}catch(e){pv.textContent='Image could not be made here. Use Copy text.';}
  sh.box.appendChild(tb);sh.box.appendChild(ac);
  const fname=(String(d.title||'quote').replace(/[^\w\- ]+/g,'').trim()||'quote')+'.jpg';
  dlb.addEventListener('click',()=>{if(!cv)return;cv.toBlob(b=>{const u=URL.createObjectURL(b);const a=el('a');a.href=u;a.download=fname;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);},'image/jpeg',.92);});
  shb.addEventListener('click',()=>{if(cv&&navigator.canShare){cv.toBlob(async b=>{const f=new File([b],fname,{type:'image/jpeg'});try{if(navigator.canShare({files:[f]}))await navigator.share({files:[f],text:txt});else await navigator.share({text:txt});}catch(e){}},'image/jpeg',.92);}else if(navigator.share){navigator.share({text:txt}).catch(()=>{});}else copyTxt(txt,shb);});
  cpb.addEventListener('click',()=>copyTxt(txt,cpb));}

 /* ---------- helpers ---------- */
 async function dl(url,name){try{const r=await fetch(url);const b=await r.blob();const u=URL.createObjectURL(b);const a=el('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);}catch(e){window.open(url,'_blank','noopener');}}
 function copyTxt(t,btn){const done=()=>{const o=btn.textContent;btn.textContent='Copied ✓';setTimeout(()=>btn.textContent=o,1600);};const fb=()=>{const ta=el('textarea');ta.value=t;ta.style.cssText='position:fixed;opacity:0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');done();}catch(e){}ta.remove();};if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(done,fb);else fb();}
 async function toggleSave(id){if(SAVED.has(id))SAVED.delete(id);else SAVED.add(id);render();await savePref('deal_saved',{ids:[...SAVED]});}

 /* ---------- browse: categories, sorting, search, detail, PDF pieces ---------- */
 const LS={get(k,d){try{const v=localStorage.getItem('lxd:'+k);return v==null?d:JSON.parse(v);}catch(e){return d;}},set(k,v){try{localStorage.setItem('lxd:'+k,JSON.stringify(v));}catch(e){}}};
 const CATS=[['Bags',/\b(bag|tote|satchel|crossbody|shoulder|clutch|hobo|backpack|duffle|duffel|pouch|messenger|purse|handbag|bucket|baguette|sling)\b/i],['Shoes',/\b(shoe|sneaker|trainer|slide|sandal|boot|loafer|heel|pump|flat|mule|runner|espadrille|clog|slipper|speedcat|adizero)\b/i],['Watches',/\b(watch|chronograph|automatic|tissot|seiko|rolex|omega)\b/i],['Wallets',/\b(wallet|card ?case|card ?holder|billfold|coin|key ?case|wristlet|zip ?around)\b/i],['Clothing',/\b(shirt|t-shirt|tee|hoodie|jacket|coat|dress|polo|jeans|pant|trouser|short|sweater|cardigan|blazer|top|skirt|jumper|sweatshirt)\b/i],['Eyewear',/\b(sunglass|eyewear|glasses|frame)\b/i],['Fragrance',/\b(perfume|fragrance|eau de|edp|edt|cologne|parfum)\b/i],['Accessories',/\b(belt|cap|hat|scarf|bracelet|necklace|earring|ring|charm|keychain|key ?ring|strap|tie|socks|gloves)\b/i]];
 const catOf=d=>{if(d.cat)return d.cat;const s=[d.title,d.note].join(' ');for(const [c,re] of CATS)if(re.test(s))return c;return 'Other';};
 const PB=[['u10','Under ₹10k',0,10000],['10-25','₹10k – 25k',10000,25000],['25-50','₹25k – 50k',25000,50000],['50+','₹50k +',50000,1e12]];
 Object.assign(F,LS.get('f',{}),{q:''});F.cat=F.cat||'';F.sort=F.sort||'new';F.pb=F.pb||'';F.flags=F.flags||[];F.view=F.view||'grid';
 let VIEW=LS.get('view','deals');let ST={tpl:'noir',font:'serif',logo:'',name:'',channel:'',wa:'',auto:false,delay:1,done:{}};let RQN=null;let PAGE=24,SEEN=new Set(LS.get('seen',[])),REQ=LS.get('req',{}),RECENT=LS.get('recent',[]);const LASTV=LS.get('lastv',null);
 const saveF=()=>LS.set('f',{day:F.day,brand:F.brand,cat:F.cat,sort:F.sort,pb:F.pb,flags:F.flags,view:F.view});
 const DISC='Prices, sizes and availability are as on the day of posting and can change after that. Tap Check before you order and Luxella will confirm.';
 const isNew=r=>!own()&&LASTV&&r.created_at>LASTV;
 const disc=d=>num(d.mrp)&&num(d.price)&&Number(d.mrp)>Number(d.price)?Math.round((1-Number(d.price)/Number(d.mrp))*100):0;
 const qOk=r=>{const q=String(F.q||'').toLowerCase().trim();if(!q)return true;const d=r.data||{};const hay=[d.brand,d.title,d.sizes,d.note,catOf(d)].join(' ').toLowerCase();return q.split(/\s+/).every(w=>hay.includes(w));};
 function inRange(day){const t=today();if(F.day==='today')return day===t;if(F.day==='yday')return day===addD(t,-1);if(F.day==='week')return day>=addD(t,-6);return true;}
 function flagOk(r){const d=r.data||{};const t=today();for(const f of F.flags){if(f==='new'&&!isNew(r))return false;if(f==='ending'&&!(d.ends&&d.ends<=addD(t,1)&&d.ends>=t))return false;if(f==='few'&&!(num(d.stock)!=null&&Number(d.stock)<=3))return false;if(f==='off'&&!disc(d))return false;if(f==='avail'&&d.sold)return false;}return true;}
 function pbOk(d){if(!F.pb)return true;const b=PB.find(x=>x[0]===F.pb);const p=num(d.price);return p!=null&&p>=b[2]&&p<b[3];}
 function matches(r){const d=r.data||{};return r.kind==='deal'&&qOk(r)&&inRange(r.day)&&(!F.brand||d.brand===F.brand)&&(!F.cat||catOf(d)===F.cat)&&pbOk(d)&&flagOk(r)&&(!F.saved||SAVED.has(r.id));}
 function sorted(list){const L=list.slice();const P=r=>num((r.data||{}).price);
  if(F.sort==='lo')L.sort((a,b)=>(P(a)??1e12)-(P(b)??1e12));else if(F.sort==='hi')L.sort((a,b)=>(P(b)??-1)-(P(a)??-1));else if(F.sort==='off')L.sort((a,b)=>disc(b.data||{})-disc(a.data||{}));else if(F.sort==='end')L.sort((a,b)=>String((a.data||{}).ends||'9')<String((b.data||{}).ends||'9')?-1:1);else L.sort((a,b)=>a.day===b.day?(a.created_at<b.created_at?1:-1):(a.day<b.day?1:-1));
  return L.sort((a,b)=>((a.data||{}).sold?1:0)-((b.data||{}).sold?1:0));}
 function visibleDeals(){return sorted(rows.filter(r=>matches(r)&&!(r.data||{}).sold));}
 function hl(text){const q=String(F.q||'').trim();const s=String(text||'');if(!q)return document.createTextNode(s);const f=document.createDocumentFragment();const words=q.split(/\s+/).filter(Boolean).map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));const re=new RegExp('('+words.join('|')+')','ig');s.split(re).forEach((p,i)=>{if(i%2)f.appendChild(el('mark',null,p));else if(p)f.appendChild(document.createTextNode(p));});return f;}
 function dealText(d,withLink){const p=num(d.price);return [[d.brand,d.title].filter(Boolean).join(' '),d.sizes?'Size/colour: '+d.sizes:'',p!=null?'Price: '+inr(p)+(disc(d)?' ('+disc(d)+'% off)':''):'Price on request',d.note||'',withLink?'Luxella deals · '+location.origin+location.pathname:''].filter(Boolean).join('\n');}
 function waShare(text){window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank','noopener');}
 function markReq(id,kind){REQ[id]=REQ[id]||[];if(!REQ[id].includes(kind))REQ[id].push(kind);LS.set('req',REQ);}
 function addRecent(id){RECENT=[id,...RECENT.filter(x=>x!==id)].slice(0,12);LS.set('recent',RECENT);}
 function gallery(ph,d,lazy){const L=(Array.isArray(d.imgs)&&d.imgs.length?d.imgs:(d.img?[d.img]:[]));if(!L.length){ph.classList.add('none');ph.textContent=(d.brand||'L').charAt(0);return;}
  if(L.length===1){const im=el('img');im.src=L[0];im.alt=d.title||'';if(lazy)im.loading='lazy';ph.appendChild(im);return;}
  ph.classList.add('multi');const tr=el('div','dl-gal');L.forEach(u=>{const s=el('div','dl-gal-s');const im=el('img');im.src=u;im.alt=d.title||'';if(lazy)im.loading='lazy';s.appendChild(im);tr.appendChild(s);});ph.appendChild(tr);
  const dots=el('div','dl-gal-d');L.forEach((u,i)=>{const b=el('i');if(!i)b.className='on';dots.appendChild(b);});ph.appendChild(dots);const n=el('span','dl-gal-n','1/'+L.length);ph.appendChild(n);
  tr.addEventListener('click',e=>e.stopPropagation(),true);
  tr.addEventListener('scroll',()=>{const i=Math.round(tr.scrollLeft/Math.max(1,tr.clientWidth));[...dots.children].forEach((b,j)=>b.className=j===i?'on':'');n.textContent=(i+1)+'/'+L.length;},{passive:true});}
 /* card */
 function card(r){const d=r.data||{};const c=el('article','dl-c'+(d.sold?' sold':'')+(F.view==='list'?' row':''));const t=today();
  const ph=el('div','dl-ph');gallery(ph,d,true);
  const tags=el('div','dl-tags');if(isNew(r)&&!SEEN.has(r.id))tags.appendChild(el('span','dl-tag new','New'));
  if(d.sold)tags.appendChild(el('span','dl-tag sold','Sold out'));else{if(disc(d))tags.appendChild(el('span','dl-tag off',disc(d)+'% off'));if(d.ends&&d.ends===t)tags.appendChild(el('span','dl-tag hot','Ends today'));if(num(d.stock)!=null&&Number(d.stock)<=3)tags.appendChild(el('span','dl-tag hot','Only '+d.stock+' left'));}
  ph.appendChild(tags);
  if(!own()){const hv=el('button','dl-save'+(SAVED.has(r.id)?' on':''),SAVED.has(r.id)?'♥':'♡');hv.type='button';hv.setAttribute('aria-label','Save');hv.addEventListener('click',e=>{e.stopPropagation();toggleSave(r.id);});ph.appendChild(hv);}
  ph.addEventListener('click',()=>detail(r));c.appendChild(ph);
  const bd=el('div','dl-bd');const br=el('div','dl-br');const lg=logo(d.brand);if(lg){const im=el('img');im.src=lg;im.alt=d.brand;br.appendChild(im);}const bn=el('span');bn.appendChild(hl(d.brand||'Luxella pick'));br.appendChild(bn);br.appendChild(el('small','dl-cat',catOf(d)));bd.appendChild(br);
  const tt=el('div','dl-t');tt.appendChild(hl(d.title||''));tt.addEventListener('click',()=>detail(r));bd.appendChild(tt);
  const pr=el('div','dl-pr');if(num(d.price)!=null){pr.appendChild(el('b',null,inr(d.price)));if(disc(d))pr.appendChild(el('s',null,inr(d.mrp)));}else pr.appendChild(el('em',null,'Price on request'));if(d.sizes){const i=el('i');i.appendChild(hl(d.sizes));pr.appendChild(i);}bd.appendChild(pr);
  if(!own()&&M.on&&num(d.price)!=null){bd.appendChild(profitBox(d.price,r.id,[d.brand,d.title].filter(Boolean).join(' '),true));}
  {const vl=validity(r);bd.appendChild(el('div','dl-val'+(/ended|Sold/.test(vl)?' off':(/today only/.test(vl)?' hot':'')),vl));}
  if(REQ[r.id]&&REQ[r.id].length)bd.appendChild(el('div','dl-rq','✓ Asked: '+REQ[r.id].map(k=>({buy:'want it',price:'price',size:'size',availability:'availability'})[k]||k).join(', ')));
  bd.appendChild(actions(r,true));c.appendChild(bd);return c;}
 function actions(r,compact){const d=r.data||{};const ac=el('div','dl-ac');
  if(own()){
   const ep=el('button','btn2','Edit price');ep.type='button';ep.addEventListener('click',async()=>{const v=prompt('Deal price ₹ (leave empty for "price on request")',d.price??'');if(v===null)return;const m=prompt('Usual price ₹ (optional)',d.mrp??'');const nd=Object.assign({},d,{price:num(v),mrp:m===null?d.mrp:num(m)});try{await window.lx.deals.update(r.id,nd);load();}catch(e){alert('Could not save.');}});ac.appendChild(ep);
   const so=el('button','btn2',d.sold?'Mark available':'Mark sold out');so.type='button';so.addEventListener('click',async()=>{try{await window.lx.deals.update(r.id,Object.assign({},d,{sold:!d.sold}));load();}catch(e){alert('Could not save.');}});ac.appendChild(so);
   const nb=el('button','btn2','Notify');nb.type='button';nb.addEventListener('click',()=>notifySheet(r));ac.appendChild(nb);
   const x=el('button','btn2 dl-del','Remove');x.type='button';x.addEventListener('click',async()=>{if(!confirm('Remove this deal?'))return;try{await window.lx.deals.remove(r.id);load();}catch(e){alert('Could not remove.');}});ac.appendChild(x);return ac;}
  if(d.sold){const s=el('button','btn2','Ask for something similar');s.type='button';s.addEventListener('click',()=>request(r,'similar'));ac.appendChild(s);return ac;}
  const main=el('button','btn dl-ask',num(d.price)==null?'Check price':'I want this');main.type='button';main.addEventListener('click',()=>request(r,num(d.price)==null?'price':'buy'));ac.appendChild(main);
  const av=el('button','btn2','Availability');av.type='button';av.addEventListener('click',()=>request(r,'availability'));ac.appendChild(av);
  const sz=el('button','btn2','Size');sz.type='button';sz.addEventListener('click',()=>request(r,'size'));ac.appendChild(sz);
  const wa=el('button','btn2 dl-wa','Share');wa.type='button';wa.addEventListener('click',()=>{const p=M.on&&num(d.price)!=null?Object.assign({},d,{price:quote(d.price),mrp:null}):d;waShare(dealText(p,!M.on));});ac.appendChild(wa);
  if(!compact){if(num(d.price)!=null&&!num(d.price)){}const cp=el('button','btn2','Copy');cp.type='button';cp.addEventListener('click',()=>copyTxt(dealText(d,false),cp));ac.appendChild(cp);if(M.on&&num(d.price)!=null){const qb=el('button','btn2','Quote card');qb.type='button';qb.addEventListener('click',()=>shareQuote(r));ac.appendChild(qb);}}
  return ac;}
 /* detail */
 function detail(r){const d=r.data||{};SEEN.add(r.id);LS.set('seen',[...SEEN].slice(-3000));addRecent(r.id);
  const sh=sheet();sh.box.classList.add('dl-dt');
  const ph=el('div','dl-dt-ph');gallery(ph,d,false);sh.box.appendChild(ph);
  const br=el('div','dl-br');const lg=logo(d.brand);if(lg){const im=el('img');im.src=lg;br.appendChild(im);}br.appendChild(el('span',null,d.brand||'Luxella pick'));br.appendChild(el('small','dl-cat',catOf(d)));sh.box.appendChild(br);
  sh.box.appendChild(el('div','dl-sh-t',d.title||''));
  const pr=el('div','dl-pr');if(num(d.price)!=null){pr.appendChild(el('b',null,inr(d.price)));if(disc(d)){pr.appendChild(el('s',null,inr(d.mrp)));pr.appendChild(el('i',null,disc(d)+'% off'));}}else pr.appendChild(el('em',null,'Price on request'));sh.box.appendChild(pr);
  if(!own()&&M.on&&num(d.price)!=null){sh.box.appendChild(profitBox(d.price,r.id,[d.brand,d.title].filter(Boolean).join(' ')));}
  const facts=el('div','dl-facts');const fa=(k,v)=>{if(!v)return;const x=el('div');x.appendChild(el('small',null,k));x.appendChild(el('b',null,v));facts.appendChild(x);};fa('Sizes / colours',d.sizes);fa('Pieces left',num(d.stock)!=null?String(d.stock):'');fa('Posted',dayLabel(r.day));fa('Offer',validity(r));sh.box.appendChild(facts);
  if(d.note)sh.box.appendChild(el('p','dl-n',d.note));
  sh.box.appendChild(el('p','dl-disc',DISC));
  sh.box.appendChild(actions(r,false));
  commentsBox(r,sh.box);
  if(d.link){const v=el('a','dl-lnk','View on store ↗');v.href=d.link;v.target='_blank';v.rel='noopener';sh.box.appendChild(v);}
  const sim=rows.filter(x=>x.kind==='deal'&&x.id!==r.id&&!(x.data||{}).sold&&((x.data||{}).brand===d.brand||catOf(x.data||{})===catOf(d))).slice(0,8);
  if(sim.length){sh.box.appendChild(el('div','dl-sh-eb','Similar deals'));const s=el('div','dl-strip');sim.forEach(x=>s.appendChild(mini(x,()=>{sh.close();setTimeout(()=>detail(x),320);})));sh.box.appendChild(s);}
  render();}
 function mini(r,onclick){const d=r.data||{};const m=el('button','dl-mini');m.type='button';const ph=el('div','dl-mini-ph');if(d.img){const im=el('img');im.src=d.img;im.loading='lazy';ph.appendChild(im);}else ph.textContent=(d.brand||'L').charAt(0);m.appendChild(ph);m.appendChild(el('b',null,d.brand||''));m.appendChild(el('small',null,num(d.price)!=null?inr(d.price):'On request'));m.addEventListener('click',onclick||(()=>detail(r)));return m;}
 /* PDF sheets with pieces */
 function loadPdfJs(){return new Promise((res,rej)=>{if(window.pdfjsLib)return res(window.pdfjsLib);const s=el('script');s.src='vendor/pdf.min.js';s.onload=()=>{window.pdfjsLib.GlobalWorkerOptions.workerSrc='vendor/pdf.worker.min.js';res(window.pdfjsLib);};s.onerror=rej;document.head.appendChild(s);});}
 const PDFC={};
 async function pdfDoc(url){if(!PDFC[url]){const lib=await loadPdfJs();PDFC[url]=lib.getDocument({url}).promise;}return PDFC[url];}
 async function pageImg(doc,n,w){const pg=await doc.getPage(n);const vp0=pg.getViewport({scale:1});const vp=pg.getViewport({scale:w/vp0.width});const c=document.createElement('canvas');c.width=Math.round(vp.width);c.height=Math.round(vp.height);await pg.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;return c;}
 function pdfRequest(r,n,kind,canvas){const d=r.data||{};const sh=sheet();sh.box.appendChild(el('div','dl-sh-eb',({price:'Check price',availability:'Availability check',size:'Size check',buy:'I want this'})[kind]));sh.box.appendChild(el('div','dl-sh-t',(d.title||'Deal sheet')+' · piece '+n));
  if(canvas){const im=el('img','dl-rq-img');im.src=canvas.toDataURL('image/jpeg',.8);sh.box.appendChild(im);}
  const sz=el('input','dl-in');sz.placeholder=kind==='size'?'Your size (e.g. UK 8, M)':'Size / colour (optional)';const nt=el('textarea','dl-in dl-ta');nt.rows=2;nt.placeholder='Anything else? (optional)';sh.box.appendChild(sizePick(sz,(capOf(r,n-1)||{}).size));sh.box.appendChild(sz);sh.box.appendChild(nt);
  const go=el('button','btn dl-ask','Send request');go.type='button';sh.box.appendChild(go);
  go.addEventListener('click',async()=>{if(kind==='size'&&!sz.value.trim()){sz.focus();return;}go.disabled=true;const id='deal-'+Date.now().toString(36);
   const spec=[({price:'Price request',availability:'Availability check',size:'Size check',buy:'Wants this piece'})[kind],'Key '+dealKey(),'Sheet: '+(d.title||'')+' · piece '+n,sz.value.trim()&&('Size: '+sz.value.trim())].filter(Boolean).join(' · ');
   try{await photos.db.doc('requests/'+id).set({brand:'',product:(d.title||'Deal sheet')+' · piece '+n,spec,qty:1,budget:0,needBy:'',link:d.url+'#page='+n,photo:'',note:nt.value.trim(),urgent:false,status:'Submitted',at:new Date().toISOString(),source:'deal_pdf',deal_id:r.id,page:n,ask:kind});markReq(r.id+':'+n,kind);sh.close();say('Request sent. Luxella will reply here and on WhatsApp.');render();}
   catch(e){window.open('https://wa.me/'+WA+'?text='+encodeURIComponent('Hi Luxella, '+spec),'_blank','noopener');sh.close();}});}
 function pdfRow(r){const d=r.data||{};const c=el('div','dl-pc');
  const top=el('a','dl-pdf');top.href=d.url;top.target='_blank';top.rel='noopener';
  top.appendChild(el('span','dl-pi','PDF'));const t=el('span','dl-pt');t.appendChild(el('b',null,d.title||'Deal sheet'));t.appendChild(el('small',null,dayLabel(r.day)+(d.pages?' · '+d.pages+' pages':'')+(d.size?' · '+d.size:'')));top.appendChild(t);top.appendChild(el('span','dl-pa','Open'));
  if(own()){const x=el('button','dl-px','×');x.type='button';x.title='Remove';x.addEventListener('click',async e=>{e.preventDefault();e.stopPropagation();if(!confirm('Remove this PDF?'))return;try{await window.lx.deals.remove(r.id);load();}catch(er){alert('Could not remove.');}});top.appendChild(x);}
  c.appendChild(top);if(d.msg){const m=el('div','dl-msgbox');m.textContent=d.msg;c.appendChild(m);}
  const pcs=el('details','dl-pcs');const sm=el('summary');sm.appendChild(el('span',null,'View pieces one by one'));sm.appendChild(el('small',null,'Ask price, availability or size for any piece'));pcs.appendChild(sm);const grid=el('div','dl-pgrid');pcs.appendChild(grid);
  let built=false;pcs.addEventListener('toggle',async()=>{if(!pcs.open||built)return;built=true;grid.textContent='Loading pieces…';try{const doc=await pdfDoc(d.url);grid.textContent='';sm.firstChild.textContent=doc.numPages+' pieces';
    for(let n=1;n<=doc.numPages;n++){const it=el('div','dl-pg');const ph=el('div','dl-pg-ph');ph.textContent='…';it.appendChild(ph);it.appendChild(el('small','dl-pg-n','Piece '+n));const asked=REQ[r.id+':'+n];if(asked)it.appendChild(el('div','dl-rq','✓ Asked'));
     const ac=el('div','dl-pg-ac');let cv=null;
     const b=(t,k,cls)=>{const x=el('button',cls||'btn2',t);x.type='button';x.addEventListener('click',()=>{if(k==='share'){waShare((d.title||'Luxella deals')+' · piece '+n+'\n'+d.url+'#page='+n);return;}if(k==='save'){if(!cv)return;cv.toBlob(bl=>{const u=URL.createObjectURL(bl);const a=el('a');a.href=u;a.download=(d.title||'deal').replace(/[^\w\- ]+/g,'').trim()+'_'+n+'.jpg';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);},'image/jpeg',.9);return;}pdfRequest(r,n,k,cv);});ac.appendChild(x);};
     if(!own()){b('Check price','price','btn dl-ask');b('Availability','availability');b('Size','size');b('Share','share');}b('Save image','save');
     it.appendChild(ac);grid.appendChild(it);
     const io=new IntersectionObserver(async es=>{if(!es[0].isIntersecting)return;io.disconnect();try{cv=await pageImg(doc,n,520);const im=el('img');im.src=cv.toDataURL('image/jpeg',.82);ph.textContent='';ph.appendChild(im);ph.addEventListener('click',()=>{const z=sheet();z.box.classList.add('dl-zoom');const zi=el('img');zi.src=im.src;z.box.appendChild(zi);});}catch(e){ph.textContent='—';}},{rootMargin:'300px'});io.observe(it);}
   if(own()){const pp=el('button','btn2 dl-pp','Post all pieces as deals');pp.type='button';pp.addEventListener('click',()=>postPieces(r,doc,pp));grid.appendChild(pp);}
   }catch(e){grid.textContent='Could not open this PDF here. Use Open or Download.';}});
  c.appendChild(pcs);
  const ac=el('div','dl-ac');const dbtn=el('button','btn dl-dlb','Download PDF');dbtn.type='button';dbtn.addEventListener('click',()=>dl(d.url,(d.title||'Luxella deals').replace(/[^\w\- ]+/g,'').trim()+'.pdf'));ac.appendChild(dbtn);
  if(d.msg){const cb=el('button','btn2 dl-cp','Copy message');cb.type='button';cb.addEventListener('click',()=>copyTxt(d.msg,cb));ac.appendChild(cb);}
  if(!own()){const ws=el('button','btn2','Share');ws.type='button';ws.addEventListener('click',()=>waShare((d.title||'Luxella deals')+(d.msg?'\n'+d.msg:'')+'\n'+d.url));ac.appendChild(ws);}
  c.appendChild(ac);return c;}
 async function postPieces(r,doc,btn){const d=r.data||{};const brand=prompt('Brand for these pieces (leave empty to fill later)',(d.title||'').split(/ and | & |,/)[0].trim());if(brand===null)return;btn.disabled=true;
  for(let n=1;n<=doc.numPages;n++){btn.textContent='Posting '+n+' / '+doc.numPages+'…';try{const cv=await pageImg(doc,n,1100);const bl=await new Promise(res=>cv.toBlob(res,'image/jpeg',.86));const up=await window.lx.deals.upload(new File([bl],'piece_'+n+'.jpg',{type:'image/jpeg'}));await window.lx.deals.add('deal',{brand:brand.trim(),title:(d.title||'Deal sheet')+' · piece '+n,price:null,mrp:null,sizes:'',note:'',img:up.url,sold:false,sheet:r.id,page:n},r.day);}catch(e){}}
  btn.textContent='Posted ✓';load();}
 /* ---------- daily drops: numbered posts (photo albums or PDFs) with swipe, message, actions ---------- */
 const tmOf=r=>{try{return new Date(r.created_at).toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'Asia/Kolkata'});}catch(e){return '';}};
 const longDay=d=>{try{return new Date(d+'T00:00:00Z').toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'});}catch(e){return d;}};
 function slideImgUrl(sl){return sl.img||(sl.canvas?sl.canvas.toDataURL('image/jpeg',.85):'');}
 function slidesOf(r){const d=r.data||{};const photos=Array.isArray(d.photos)?d.photos:[];return photos.length?Promise.resolve({n:photos.length,get:async i=>({img:photos[i]})}):pdfDoc(d.url).then(doc=>({n:doc.numPages,get:async i=>{const cv=await pageImg(doc,i+1,900);return {img:cv.toDataURL('image/jpeg',.84),canvas:cv};}}));}
 function capOf(r,i){const d=r.data||{};const c=(d.caps||{})[i+1];return c||null;}
 function postCard(r,idx){const d=r.data||{};const isPdf=r.kind==='pdf';const photos=Array.isArray(d.photos)?d.photos:[];
  const c=el('article','dl-post');const hd=el('div','dl-post-h');hd.appendChild(el('span','dl-post-no',String(idx).padStart(2,'0')));const ht=el('div','dl-post-ht');ht.appendChild(el('b',null,d.title||(isPdf?'Deal sheet':'New pieces')));const cntTxt=photos.length?photos.length+' photos':(d.pages?d.pages+' pieces':'PDF');ht.appendChild(el('small',null,tmOf(r)+' · '+cntTxt));hd.appendChild(ht);
  if(own()){const x=el('button','dl-px','×');x.type='button';x.title='Remove post';x.addEventListener('click',async e=>{e.stopPropagation();if(!confirm('Remove this post?'))return;try{await window.lx.deals.remove(r.id);load();}catch(er){alert('Could not remove.');}});hd.appendChild(x);}
  c.appendChild(hd);
  const deck=el('div','dl-deck');c.appendChild(deck);const MAXC=40;
  const cardAt=(i,n)=>{const k=el('button','dl-deck-c');k.type='button';k.style.animationDelay=Math.min(i,8)*60+'ms';const ph=el('div','dl-deck-ph');ph.appendChild(el('span','dl-deck-sk'));k.appendChild(ph);k.appendChild(el('span','dl-deck-n',String(i+1).padStart(2,'0')));if(REQ[r.id+':'+(i+1)])k.appendChild(el('span','dl-deck-q','✓ Asked'));k.addEventListener('click',()=>viewer(r,i));deck.appendChild(k);return ph;};
  const setImg=(ph,u)=>{ph.textContent='';const im=el('img');im.src=u;im.loading='lazy';im.alt='';ph.appendChild(im);};
  const more=(n)=>{if(n<=MAXC)return;const k=el('button','dl-deck-c dl-deck-more');k.type='button';k.appendChild(el('b',null,'+'+(n-MAXC)));k.appendChild(el('small',null,'View all'));k.addEventListener('click',()=>viewer(r,MAXC));deck.appendChild(k);};
  if(photos.length){photos.slice(0,MAXC).forEach((u,i)=>setImg(cardAt(i,photos.length),u));more(photos.length);}
  else{const n0=Math.max(1,Math.min(MAXC,d.pages||4));const P=[];for(let i=0;i<n0;i++)P.push(cardAt(i));
   const io=new IntersectionObserver(async es=>{if(!es[0].isIntersecting)return;io.disconnect();try{const doc=await pdfDoc(d.url);const n=doc.numPages;for(let i=P.length;i<Math.min(n,MAXC);i++)P.push(cardAt(i));while(P.length>n){const x=P.pop();x.parentNode.remove();}more(n);
     for(let i=0;i<P.length;i++){try{setImg(P[i],(await pageImg(doc,i+1,320)).toDataURL('image/jpeg',.72));}catch(e){}}}catch(e){deck.textContent='';const t=el('button','dl-deck-c');t.type='button';t.appendChild(el('b',null,'PDF'));t.addEventListener('click',()=>viewer(r,0));deck.appendChild(t);}},{rootMargin:'300px'});io.observe(c);}
  c.appendChild(el('div','dl-deck-hint','Swipe the cards · tap one to open'));
  const row=el('div','dl-ac dl-post-ac');
  if(d.msg){const cb=el('button','btn2','Copy message');cb.type='button';cb.addEventListener('click',()=>copyTxt(d.msg,cb));row.appendChild(cb);}
  const wa=el('button','btn2','WhatsApp');wa.type='button';wa.addEventListener('click',()=>waShare((d.title||'Luxella deals')+(d.msg?'\n'+d.msg:'')+(isPdf?'\n'+d.url:'')));row.appendChild(wa);
  if(isPdf){const db=el('button','btn2','Download');db.type='button';db.addEventListener('click',()=>dl(d.url,(d.title||'Luxella deals').replace(/[^\w\- ]+/g,'').trim()+'.pdf'));row.appendChild(db);}
  else{const db=el('button','btn2','Download');db.type='button';db.addEventListener('click',async()=>{for(let i=0;i<photos.length;i++){await dl(photos[i],(d.title||'luxella').replace(/[^\w\- ]+/g,'').trim()+'_'+(i+1)+'.jpg');await new Promise(z=>setTimeout(z,350));}});row.appendChild(db);}
  c.appendChild(row);
  if(d.msg){const m=el('div','dl-post-msg');m.textContent=d.msg;c.appendChild(m);}
  if(!own()&&M.on){const dp=dropProfit(r);if(dp)c.appendChild(dp);}
  if(!own()){const mb=el('button','btn dl-ask dl-ntb','✦ Make my PDF');mb.type='button';mb.addEventListener('click',()=>studio(r));c.appendChild(mb);}
  if(own()){const nb=el('button','btn dl-ask dl-ntb','🔔 Notify clients');nb.type='button';nb.addEventListener('click',()=>notifySheet(r));c.appendChild(nb);}
  if(own()&&isPdf){const pp=el('button','btn2 dl-pp','Post pages as single deals');pp.type='button';pp.addEventListener('click',async()=>{const doc=await pdfDoc(d.url);postPieces(r,doc,pp);});c.appendChild(pp);}
  return c;}
 function genCaption(r,i){const d=r.data||{};const cp=capOf(r,i)||{};const res=!own()&&M.on;const p=num(cp.price);const shown=res&&p!=null?quote(p,r.id+':'+(i+1)):p;
  return [cp.title||d.title||'New arrival',cp.brand?cp.brand:'',cp.size?'Size: '+cp.size:'',shown!=null?'Price: '+inr(shown):(res?'DM for price':'Price on request'),dayLabel(r.day)==='Today'?'Today’s deal · limited stock':'Ask to confirm availability',res?'DM to order':'Reply to order · Luxella'].filter(Boolean).join('\n');}
 function viewer(r,start){const d=r.data||{};const ov=el('div','dl-vw');const top=el('div','dl-vw-top');const back=el('button','dl-vw-x','‹ Back');back.type='button';top.appendChild(back);const tt=el('div','dl-vw-tt');tt.appendChild(el('b',null,d.title||'Deals'));const nn=el('small',null,'');tt.appendChild(nn);top.appendChild(tt);ov.appendChild(top);
  const track=el('div','dl-vw-t');ov.appendChild(track);const info=el('div','dl-vw-info');ov.appendChild(info);
  const acts=el('div','dl-vw-ac');ov.appendChild(acts);
  (document.querySelector('.sw')||document.body).appendChild(ov);document.documentElement.style.overflow='hidden';requestAnimationFrame(()=>ov.classList.add('in'));
  const close=()=>{ov.classList.remove('in');document.documentElement.style.overflow='';setTimeout(()=>ov.remove(),300);document.removeEventListener('keydown',kd);};back.addEventListener('click',close);
  const S=[];let src=null;
  const cur=()=>Math.round(track.scrollLeft/Math.max(1,track.clientWidth));
  const go=i=>track.scrollTo({left:Math.max(0,Math.min(S.length-1,i))*track.clientWidth,behavior:'smooth'});
  const kd=e=>{if(e.key==='ArrowRight')go(cur()+1);if(e.key==='ArrowLeft')go(cur()-1);if(e.key==='Escape')close();};document.addEventListener('keydown',kd);
  const paintInfo=()=>{const i=cur();nn.textContent=(i+1)+' / '+S.length+' · '+tmOf(r);info.textContent='';const cp=capOf(r,i);
   if(cp){if(cp.brand||cp.title)info.appendChild(el('b',null,[cp.brand,cp.title].filter(Boolean).join(' · ')));const ln=el('div','dl-vw-pr');if(num(cp.price)!=null){ln.appendChild(el('span','p',inr(cp.price)));if(!own()&&M.on)ln.appendChild(el('span','y','Your price '+inr(quote(cp.price,r.id+':'+(i+1)))));}if(cp.size)ln.appendChild(el('span','s',cp.size));if(ln.childNodes.length)info.appendChild(ln);}
   if(REQ[r.id+':'+(i+1)])info.appendChild(el('div','dl-rq','✓ You asked about this piece'));};
  track.addEventListener('scroll',()=>requestAnimationFrame(paintInfo),{passive:true});
  const B=(t,fn,cls)=>{const x=el('button',cls||'dl-vb',t);x.type='button';x.addEventListener('click',fn);acts.appendChild(x);};
  const o=()=>S[cur()];
  if(!own()){B('Check price',()=>postRequest(r,cur()+1,'price',o()),'dl-vb gold');B('Availability',()=>postRequest(r,cur()+1,'availability',o()));B('Size',()=>postRequest(r,cur()+1,'size',o()));}
  B('WhatsApp',()=>{const i=cur();waShare(genCaption(r,i)+(r.kind==='pdf'?'\n'+d.url+'#page='+(i+1):(S[i]&&S[i].img?'\n'+S[i].img:'')));});
  B('Caption',()=>{const i=cur();const sh=sheet();sh.box.appendChild(el('div','dl-sh-eb','Caption for piece '+String(i+1).padStart(2,'0')));const ta=el('textarea','dl-in dl-ta');ta.rows=7;ta.value=genCaption(r,i);sh.box.appendChild(ta);const ac=el('div','dl-ac');const c1=el('button','btn dl-ask','Copy caption');c1.type='button';c1.addEventListener('click',()=>copyTxt(ta.value,c1));const c2=el('button','btn2','Share');c2.type='button';c2.addEventListener('click',async()=>{const s0=S[i];try{if(s0&&navigator.canShare){const bl=await (await fetch(s0.img)).blob();const f=new File([bl],'luxella_'+(i+1)+'.jpg',{type:'image/jpeg'});if(navigator.canShare({files:[f]})){await navigator.share({files:[f],text:ta.value});return;}}}catch(e){}waShare(ta.value);});ac.appendChild(c1);ac.appendChild(c2);sh.box.appendChild(ac);});
  B('Save',()=>{const s0=o();if(s0&&s0.img)dl(s0.img,(d.title||'luxella').replace(/[^\w\- ]+/g,'').trim()+'_'+(cur()+1)+'.jpg');});
  if(own())B('Edit price / size',async()=>{const i=cur();const cp=Object.assign({},capOf(r,i)||{});const br=prompt('Brand',cp.brand||'');if(br===null)return;const ti=prompt('Piece name',cp.title||'');if(ti===null)return;const MK=LS.get('supmk',{pct:25});const pr=prompt('Supplier price ₹ — Luxella adds '+MK.pct+'% and rounds to ₹100 (type =24500 to set the final price yourself; empty = on request)',cp.sup??cp.price??'');if(pr===null)return;const fin=String(pr).trim().startsWith('=')?num(String(pr).trim().slice(1)):(num(pr)==null?null:Math.round(num(pr)*(1+MK.pct/100)/100)*100);const sz=prompt('Sizes / colours',cp.size||'');if(sz===null)return;const caps=Object.assign({},d.caps||{});caps[i+1]={brand:br.trim(),title:ti.trim(),price:fin,sup:String(pr).trim().startsWith('=')?null:num(pr),size:sz.trim()};d.caps=caps;try{await window.lx.deals.update(r.id,d);say('Saved for piece '+(i+1));paintInfo();}catch(e){alert('Could not save.');}});
  slidesOf(r).then(sr=>{src=sr;for(let i=0;i<sr.n;i++){const sl=el('div','dl-vw-s');const ph=el('div','dl-vw-ph');ph.textContent='…';sl.appendChild(ph);track.appendChild(sl);const it={img:'',canvas:null};S.push(it);
    const io=new IntersectionObserver(async es=>{if(!es.some(e=>e.isIntersecting))return;io.disconnect();try{const g=await sr.get(i);Object.assign(it,g);const im=el('img');im.src=g.img;ph.textContent='';ph.appendChild(im);}catch(e){ph.textContent='—';}},{root:track,rootMargin:'0px 200% 0px 200%'});io.observe(sl);}
   requestAnimationFrame(()=>{track.scrollLeft=start*track.clientWidth;paintInfo();});}).catch(()=>{info.textContent='Preview not available. Use Download.';});}
 function postRequest(r,n,kind,o){const d=r.data||{};const sh=sheet();sh.box.appendChild(el('div','dl-sh-eb',({price:'Check price',availability:'Availability check',size:'Size check',buy:'Buy this piece'})[kind]));sh.box.appendChild(el('div','dl-sh-t',(d.title||'Deal post')+' · piece '+String(n).padStart(2,'0')));
  const u=o&&slideImgUrl(o);if(u){const im=el('img','dl-rq-img');im.src=u;sh.box.appendChild(im);}
  const sz=el('input','dl-in');sz.placeholder=kind==='size'?'Your size (e.g. UK 8, M)':'Size / colour (optional)';const nt=el('textarea','dl-in dl-ta');nt.rows=2;nt.placeholder='Anything else? (optional)';sh.box.appendChild(sz);sh.box.appendChild(nt);
  const go=el('button','btn dl-ask','Send request');go.type='button';sh.box.appendChild(go);
  go.addEventListener('click',async()=>{if(kind==='size'&&!sz.value.trim()){sz.focus();return;}go.disabled=true;const id='deal-'+Date.now().toString(36);
   const spec=[({price:'Price request',availability:'Availability check',size:'Size check',buy:'Wants to buy'})[kind],'Key '+dealKey(),(d.title||'Post')+' · piece '+n+' · '+dayLabel(r.day)+' '+tmOf(r),sz.value.trim()&&('Size: '+sz.value.trim())].filter(Boolean).join(' · ');
   let photo=(o&&o.img&&/^https:/.test(o.img))?o.img:'';if(!photo&&o){try{go.textContent='Sending…';let bl=null;if(o.canvas)bl=await new Promise(z=>o.canvas.toBlob(z,'image/jpeg',.85));else if(o.img)bl=await (await fetch(o.img)).blob();if(bl)photo=await window.lx.deals.reqImage(bl);}catch(e){}}
   try{await photos.db.doc('requests/'+id).set({brand:'',product:(d.title||'Deal post')+' · piece '+n,spec,qty:1,budget:0,needBy:'',link:d.url?d.url+'#page='+n:'',photo,note:nt.value.trim(),urgent:false,status:'Submitted',at:new Date().toISOString(),source:'deal_post',deal_id:r.id,page:n,ask:kind});markReq(r.id+':'+n,kind);sh.close();say('Request sent. Luxella will reply here and on WhatsApp.');}
   catch(e){window.open('https://wa.me/'+WA+'?text='+encodeURIComponent('Hi Luxella, '+spec),'_blank','noopener');sh.close();}});}
 function drops(list){const w=el('section','dl-drops');const days=[...new Set(list.map(r=>r.day))].sort().reverse();
  days.forEach(dy=>{const L=list.filter(r=>r.day===dy).sort((a,b)=>a.created_at<b.created_at?-1:1);const sec=el('div','dl-dday');const h=el('div','dl-dday-h');h.appendChild(el('span','dl-dday-d',dayLabel(dy)==='Today'||dayLabel(dy)==='Yesterday'?dayLabel(dy):longDay(dy)));h.appendChild(el('small',null,(dayLabel(dy)==='Today'||dayLabel(dy)==='Yesterday'?longDay(dy)+' · ':'')+L.length+(L.length>1?' drops':' drop')));sec.appendChild(h);
   sec.appendChild(el('p','dl-disc',dy===today()?'Prices, sizes and availability are as of today and may change.':'Posted '+longDay(dy)+'. Prices, sizes and availability may have changed since. Tap Check to confirm.'));
   L.forEach((r,i)=>sec.appendChild(postCard(r,i+1)));w.appendChild(sec);});return w;}

 /* ---------- notify clients: popup · email · WhatsApp ---------- */
 const SITE='https://luxellaclients.duckdns.org/';
 async function notifySheet(r){const d=r?r.data||{}:{};const sh=sheet();sh.box.classList.add('dl-nt');sh.box.appendChild(el('div','dl-sh-eb','Tell your clients'));
  const isPost=r&&(r.kind==='post'||r.kind==='pdf');const n0=isPost?((d.photos||[]).length||d.pages||0):0;
  const ti=el('input','dl-in');ti.value=r?(isPost?'New deals just dropped: '+(d.title||'today’s picks'):'New deal: '+[d.brand,d.title].filter(Boolean).join(' ')):'Today’s deals are live';sh.box.appendChild(ti);
  const tx=el('textarea','dl-in dl-ta');tx.rows=5;tx.value=(d.msg||(r&&r.kind==='deal'?dealText(d,false):''))||((n0?n0+' fresh pieces':'Fresh pieces')+' are on your Luxella page. Tap to view, swipe through and ask for price, size or availability on any piece.');sh.box.appendChild(tx);
  const img=r?((d.photos&&d.photos[0])||d.img||''):'';
  const ch=el('div','dl-nt-ch');const mk=(k,t,s0,on)=>{const l=el('label','dl-nt-o');const c=el('input');c.type='checkbox';c.checked=on;c.dataset.k=k;l.appendChild(c);const tt=el('span');tt.appendChild(el('b',null,t));tt.appendChild(el('small',null,s0));l.appendChild(tt);ch.appendChild(l);return c;};
  const cP=mk('popup','Popup on their page','Shows once when they open the page, with a phone notification if they enabled alerts',true);
  const cE=mk('email','Email','Luxella-styled email with a View deals button',false);
  const cW=mk('wa','WhatsApp','One tap per client below, or share to a group / broadcast',true);sh.box.appendChild(ch);
  sh.box.appendChild(el('div','dl-sh-eb','Clients'));const list=el('div','dl-nt-cl');list.textContent='Loading…';sh.box.appendChild(list);
  let CL=[];try{CL=(await window.lx.deals.clients()).filter(c=>!/^zz/i.test(c.slug)||own());}catch(e){list.textContent='Could not load clients.';return;}
  list.textContent='';const sel=new Set(CL.filter(c=>!/^zz/i.test(c.slug)).map(c=>c.id));
  const allb=el('button','chip','Select all');allb.type='button';allb.addEventListener('click',()=>{const all=sel.size<CL.length;CL.forEach(c=>all?sel.add(c.id):sel.delete(c.id));paint();});list.appendChild(allb);
  const rowsEl=el('div','dl-nt-rows');list.appendChild(rowsEl);
  const waText=()=>ti.value.trim()+'\n\n'+tx.value.trim();
  const paint=()=>{rowsEl.textContent='';CL.forEach(c=>{const rw=el('div','dl-nt-r');const cb=el('input');cb.type='checkbox';cb.checked=sel.has(c.id);cb.addEventListener('change',()=>{cb.checked?sel.add(c.id):sel.delete(c.id);});rw.appendChild(cb);const nm=el('div','dl-nt-nm');nm.appendChild(el('b',null,c.name));nm.appendChild(el('small',null,c.biz||c.slug));rw.appendChild(nm);
    const ph=el('input','dl-in dl-nt-ph');ph.placeholder='WhatsApp no.';ph.value=c.phone||'';ph.inputMode='tel';ph.addEventListener('change',async()=>{c.phone=ph.value.replace(/[^\d]/g,'');try{await window.lx.deals.setPhone(c.id,c.phone);}catch(e){}});rw.appendChild(ph);
    const wb=el('button','btn2 dl-nt-wa','WhatsApp');wb.type='button';wb.addEventListener('click',()=>{let p=String(ph.value||'').replace(/[^\d]/g,'');if(!p){ph.focus();return;}if(p.length===10)p='91'+p;window.open('https://wa.me/'+p+'?text='+encodeURIComponent(waText()+'\n'+SITE+c.slug+'#deals'),'_blank','noopener');wb.textContent='Sent ✓';});rw.appendChild(wb);rowsEl.appendChild(rw);});};
  paint();
  const st=el('div','dl-msg');const ac=el('div','dl-ac');const go=el('button','btn dl-ask','Send popup / email');go.type='button';const grp=el('button','btn2','Share to group');grp.type='button';const cp=el('button','btn2','Copy text');cp.type='button';ac.appendChild(go);ac.appendChild(grp);ac.appendChild(cp);sh.box.appendChild(ac);sh.box.appendChild(st);
  grp.addEventListener('click',()=>waShare(waText()+'\nOpen your Luxella page → Deals'));cp.addEventListener('click',()=>copyTxt(waText(),cp));
  go.addEventListener('click',async()=>{const ids=[...sel];if(!ids.length){st.textContent='Pick at least one client.';return;}if(!cP.checked&&!cE.checked){st.textContent='Tick Popup or Email (WhatsApp is sent with the buttons above).';return;}go.disabled=true;const out=[];
   try{if(cP.checked){st.textContent='Sending popups…';const n=await window.lx.deals.popup(ids,{title:ti.value.trim().slice(0,80),body:tx.value.trim().slice(0,300),img});out.push(n+' popups');}
    if(cE.checked){let ok=0;for(let i=0;i<ids.length;i++){st.textContent='Emailing '+(i+1)+' / '+ids.length+'…';try{const j=await window.lx.deals.email(ids[i],{subject:ti.value.trim().slice(0,110),headline:ti.value.trim().slice(0,70),text:tx.value.trim()});ok+=j.sent||0;}catch(e){}}out.push(ok+' emails');}
    st.textContent='Sent: '+out.join(' · ')+'.';}catch(e){st.textContent='Could not send: '+(e.message||e);}finally{go.disabled=false;}});}



 /* ---------- profit view + per-drop / per-piece margin ---------- */
 function profitBox(cost,k,label,compact,postId){const g=mgOf(k);const sell=quote(cost,k);const pf=sell-Number(cost);const w=el('div','dl-pf'+(compact?' sm':''));
  const cell=(t,v,c)=>{const x=el('div',c||'');x.appendChild(el('small',null,t));x.appendChild(el('b',null,v));w.appendChild(x);};
  cell('Your cost',inr(cost));cell('You sell',inr(sell),'s');cell('Profit',inr(pf)+' · '+Math.round(pf/Number(cost)*100)+'%','p');
  const e=el('button','dl-pf-e',(g.scope==='piece'?'Own margin':g.scope==='drop'?'Drop margin':'Default margin')+' · '+(g.mode==='amt'?'+'+inr(g.val):'+'+g.val+'%')+' ✎');e.type='button';e.addEventListener('click',ev=>{ev.stopPropagation();marginSheet(k,label,postId||(String(k).includes(':')?String(k).split(':')[0]:''),cost);});w.appendChild(e);return w;}
 function marginSheet(k,label,postId,cost){const sh=sheet();sh.box.appendChild(el('div','dl-sh-eb','Your margin'));sh.box.appendChild(el('div','dl-sh-t',label||'This piece'));
  const g=mgOf(k);let scope=String(k).endsWith(':*')?'drop':(g.scope==='all'?'piece':g.scope),mode=g.mode||'pct';const SC0=String(k).endsWith(':*');
  const sc=el('div','dl-mode');const SC=SC0?[]:[['piece','This piece']];if(postId)SC.push(['drop','Whole drop']);SC.push(['all','All pieces (default)']);const sbs=SC.map(([v,t])=>{const b=el('button','chip',t);b.type='button';b.addEventListener('click',()=>{scope=v;paint();});sc.appendChild(b);return [v,b];});sh.box.appendChild(sc);
  const md=el('div','dl-mode');const bp=el('button','chip','By %');bp.type='button';const ba=el('button','chip','By ₹');ba.type='button';md.appendChild(bp);md.appendChild(ba);sh.box.appendChild(md);bp.addEventListener('click',()=>{mode='pct';paint();});ba.addEventListener('click',()=>{mode='amt';paint();});
  const inp=el('input','dl-in');inp.type='number';inp.min='0';inp.value=g.val||0;sh.box.appendChild(inp);const pv=el('div');sh.box.appendChild(pv);inp.addEventListener('input',()=>paint());
  const paint=()=>{sbs.forEach(([v,b])=>b.setAttribute('aria-pressed',String(scope===v)));bp.setAttribute('aria-pressed',String(mode==='pct'));ba.setAttribute('aria-pressed',String(mode==='amt'));pv.textContent='';
   if(num(cost)!=null){const keep=M;M=Object.assign({},M,{item:{},post:{},mode,val:Number(inp.value||0)});pv.appendChild(profitBox(cost,'x','',true));M=keep;pv.querySelector('.dl-pf-e').remove();}};
  paint();const ac=el('div','dl-ac');const sv=el('button','btn dl-ask','Save margin');sv.type='button';const rs=el('button','btn2','Use default');rs.type='button';ac.appendChild(sv);if(g.scope!=='all')ac.appendChild(rs);sh.box.appendChild(ac);
  const save=async(clear)=>{const n=Object.assign({},M,{on:true,item:Object.assign({},M.item||{}),post:Object.assign({},M.post||{})});const v={mode,val:Number(inp.value||0)};
   if(clear){delete n.item[k];if(postId&&g.scope==='drop')delete n.post[postId];}
   else if(scope==='piece')n.item[k]=v;else if(scope==='drop'){n.post[postId]=v;Object.keys(n.item).forEach(x=>{if(x.startsWith(postId+':'))delete n.item[x];});}else{n.mode=v.mode;n.val=v.val;delete n.item[k];}
   M=n;try{await savePref('deal_margin',M);}catch(e){}sh.close();say('Margin saved.');marginPanel(true);render();};
  sv.addEventListener('click',()=>save(false));rs.addEventListener('click',()=>save(true));}
 /* drop-level profit summary (reseller) */
 function dropProfit(r){const d=r.data||{};const caps=d.caps||{};const ks=Object.keys(caps).filter(n=>num(caps[n].price)!=null);if(!ks.length)return null;let c=0,s=0;ks.forEach(n=>{c+=Number(caps[n].price);s+=quote(caps[n].price,r.id+':'+n);});
  const w=el('div','dl-pf dl-pf-drop');const cell=(t,v,cl)=>{const x=el('div',cl||'');x.appendChild(el('small',null,t));x.appendChild(el('b',null,v));w.appendChild(x);};cell(ks.length+' priced · cost',inr(c));cell('You sell',inr(s),'s');cell('Drop profit',inr(s-c),'p');
  const e=el('button','dl-pf-e','Margin for this drop ✎');e.type='button';e.addEventListener('click',()=>marginSheet(r.id+':*',d.title||'This drop',r.id,null));w.appendChild(e);return w;}

 /* quick size picker: shoe numbers + S/M/L, or the sizes posted for that piece */
 function sizePick(inp,known){const w=el('div','dl-szp');const sel=new Set(String(inp.value||'').split(/,\s*/).filter(Boolean));
  const row=(t,arr)=>{if(!arr.length)return;const r=el('div','dl-szp-r');r.appendChild(el('small',null,t));const g=el('div','dl-szp-g');arr.forEach(v=>{const b=el('button','chip',v);b.type='button';b.setAttribute('aria-pressed',String(sel.has(v)));b.addEventListener('click',()=>{sel.has(v)?sel.delete(v):sel.add(v);b.setAttribute('aria-pressed',String(sel.has(v)));inp.value=[...sel].join(', ');});g.appendChild(b);});r.appendChild(g);w.appendChild(r);};
  const kn=String(known||'').split(/[,/·|]+/).map(x=>x.trim()).filter(x=>x&&x.length<14);
  if(kn.length)row('Posted sizes',kn);
  row('Shoes · UK',['5','6','7','8','9','10','11','12'].map(x=>'UK '+x));row('Clothing',['XS','S','M','L','XL','XXL']);row('Other',['One size','EU size','Any']);return w;}

 /* ---------- Catalogue studio (clients): 3 templates · own logo · fonts · share to channel / WhatsApp · auto-ready ---------- */
 const TPL=[['noir','Noir','Black & gold, one piece per page'],['ivory','Ivory','Cream editorial, one piece per page'],['grid','Grid','Clean white, 4 pieces per page']];
 const FONTS=[['serif','Classic serif','times'],['sans','Modern sans','helvetica'],['mono','Atelier mono','courier']];
 async function dropItems(r,prog){const d=r.data||{};const ph=Array.isArray(d.photos)?d.photos:[];const out=[];let n=ph.length,doc=null;if(!n&&d.url){doc=await pdfDoc(d.url);n=doc.numPages;}
  for(let i=0;i<n;i++){if(prog)prog(i+1,n);const cp=capOf(r,i)||{};if(cp.sold)continue;let img=ph[i]||'';if(!img&&doc){try{img=(await pageImg(doc,i+1,1000)).toDataURL('image/jpeg',.86);}catch(e){}}
   out.push({img,brand:cp.brand||guessBrand(d.title)||'',title:cp.title||'',size:cp.size||'',cost:num(cp.price),k:r.id+':'+(i+1)});}return out;}
 function shopItems(){return rows.filter(r=>r.kind==='deal'&&!(r.data||{}).sold&&inRange(r.day)).map(r=>{const d=r.data||{};return {img:d.img||'',brand:d.brand||'',title:d.title||'',size:d.sizes||'',cost:num(d.price),k:r.id};});}
 async function studioPdf(items,o,prog){const {jsPDF}=await loadJsPDF();const doc=new jsPDF({unit:'pt',format:'a4'});const W=595,H=842;const F0=(FONTS.find(f=>f[0]===o.font)||FONTS[0])[2];
  const dark=o.tpl==='noir';const BG=dark?INK:o.tpl==='ivory'?[247,243,236]:[255,255,255];const TX=dark?IVORY:[24,20,14];const SUB=dark?MUTE:[120,110,96];const ACC=dark?GOLD:[150,112,40];
  const logo=o.logo?await rasterUrl(o.logo,700):null;const name=(o.name||'').trim();const dateTxt=new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
  const bg=()=>{doc.setFillColor(...BG);doc.rect(0,0,W,H,'F');};
  const mark=(y,h)=>{if(logo){const w=Math.min(W-120,logo.w*h/logo.h);doc.addImage(logo.data,'PNG',W/2-w/2,y,w,h);return;}doc.setTextColor(...TX);doc.setFont(F0,'bold');doc.setFontSize(h*.55);doc.text(name.toUpperCase()||'MY STORE',W/2,y+h*.7,{align:'center',charSpace:2});};
  const priceOf=it=>it.cost==null?null:(M.on?quote(it.cost,it.k):it.cost);
  const foot=()=>{doc.setTextColor(...SUB);doc.setFont(F0,'normal');doc.setFontSize(8);doc.text(((name?name.toUpperCase()+'  ·  ':'')+(o.wa?'WHATSAPP '+o.wa+'  ·  ':'')+'PRICES VALID TODAY'),W/2,H-30,{align:'center',charSpace:1});};
  /* cover */
  bg();if(dark){doc.setDrawColor(...ACC);doc.setLineWidth(.6);doc.rect(22,22,W-44,H-44);}else{doc.setDrawColor(...ACC);doc.setLineWidth(.4);doc.line(60,70,W-60,70);doc.line(60,H-70,W-60,H-70);}
  mark(220,logo?110:60);doc.setTextColor(...TX);doc.setFont(F0,F0==='times'?'italic':'normal');doc.setFontSize(38);doc.text(o.title||"Today's Edit",W/2,450,{align:'center'});
  doc.setTextColor(...SUB);doc.setFont(F0,'normal');doc.setFontSize(10);doc.text(dateTxt.toUpperCase()+'  ·  '+items.length+(items.length>1?' PIECES':' PIECE'),W/2,480,{align:'center',charSpace:2});foot();
  const cap=(it,x,y,w,big)=>{doc.setTextColor(...ACC);doc.setFont(F0,'normal');doc.setFontSize(big?11:8.5);if(it.brand)doc.text(String(it.brand).toUpperCase(),x,y,{align:'center',charSpace:2});y+=big?24:15;
   if(it.title){doc.setTextColor(...TX);doc.setFont(F0,F0==='times'?'italic':'normal');doc.setFontSize(big?20:11);const tl=doc.splitTextToSize(it.title,w);doc.text(tl.slice(0,2),x,y,{align:'center'});y+=Math.min(2,tl.length)*(big?22:13);}
   if(it.size){doc.setTextColor(...SUB);doc.setFont(F0,'normal');doc.setFontSize(big?10:8);doc.text(doc.splitTextToSize(it.size,w)[0],x,y,{align:'center'});y+=big?18:12;}
   const p=priceOf(it);doc.setTextColor(...TX);doc.setFont(F0,'bold');doc.setFontSize(big?26:13);doc.text(p!=null?'Rs '+Number(p).toLocaleString('en-IN'):'Price on request',x,y+(big?14:6),{align:'center'});};
  if(o.tpl==='grid'){for(let i=0;i<items.length;i+=4){doc.addPage();bg();mark(28,logo?34:26);doc.setDrawColor(...ACC);doc.setLineWidth(.4);doc.line(40,76,W-40,76);
    for(let j=0;j<4&&i+j<items.length;j++){if(prog)prog(i+j+1,items.length);const it=items[i+j];const cx=j%2?W*3/4-5:W/4+5,cy=j<2?92:92+(H-150)/2;const bw=W/2-60,bh=230;const bx=cx-bw/2;
     doc.setFillColor(250,248,244);doc.rect(bx,cy,bw,bh,'F');const im=await photoData(it.img);if(im){const sc=Math.min((bw-16)/im.w,(bh-16)/im.h);doc.addImage(im.data,'JPEG',cx-im.w*sc/2,cy+bh/2-im.h*sc/2,im.w*sc,im.h*sc);}
     cap(it,cx,cy+bh+20,bw,false);}foot();}}
  else{for(let i=0;i<items.length;i++){if(prog)prog(i+1,items.length);const it=items[i];doc.addPage();bg();mark(36,logo?40:28);doc.setTextColor(...SUB);doc.setFont(F0,'normal');doc.setFontSize(8);doc.text(String(i+1).padStart(2,'0')+' / '+String(items.length).padStart(2,'0'),W-48,60,{align:'right'});
    const bx=48,by=100,bw=W-96,bh=460;doc.setFillColor(...(dark?[255,255,255]:[255,255,255]));doc.rect(bx,by,bw,bh,'F');if(!dark){doc.setDrawColor(...ACC);doc.setLineWidth(.4);doc.rect(bx,by,bw,bh);}
    const im=await photoData(it.img);if(im){const sc=Math.min((bw-40)/im.w,(bh-40)/im.h);doc.addImage(im.data,'JPEG',W/2-im.w*sc/2,by+bh/2-im.h*sc/2,im.w*sc,im.h*sc);}
    cap(it,W/2,by+bh+44,W-140,true);foot();}}
  return doc.output('blob');}
 async function studioShare(blob,fname,text,how){const file=new File([blob],fname,{type:'application/pdf'});
  if(how==='download'){const u=URL.createObjectURL(blob);dl(u,fname);setTimeout(()=>URL.revokeObjectURL(u),60000);return;}
  if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],text});return 'shared';}catch(e){if(e&&e.name==='AbortError')return;}}
  const u=URL.createObjectURL(blob);dl(u,fname);if(how==='channel'&&ST.channel)window.open(ST.channel,'_blank','noopener');else waShare(text);}
 function studio(src){const sh=sheet();sh.box.classList.add('dl-stu');sh.box.appendChild(el('div','dl-sh-eb','Catalogue studio'));sh.box.appendChild(el('div','dl-sh-t','Make your own PDF'));
  const o=Object.assign({},ST,{name:ST.name||(cli().biz||cli().name||'')});const drops=rows.filter(r=>r.kind==='post'||r.kind==='pdf').sort((a,b)=>a.created_at<b.created_at?1:-1);
  const lab=t=>sh.box.appendChild(el('div','dl-stu-l',t));
  lab('1 · Pieces');const ss=el('select','dl-in');const shopN=shopItems().length;drops.forEach(r=>{const op=el('option',null,(r.data||{}).title||'Drop');op.value=r.id;ss.appendChild(op);});if(shopN){const op=el('option',null,'Single pieces in the Shop ('+shopN+')');op.value='shop';ss.appendChild(op);}ss.value=src&&src.id?src.id:(drops[0]?drops[0].id:'shop');sh.box.appendChild(ss);
  lab('2 · Template');const tg=el('div','dl-stu-tpl');TPL.forEach(([k,t,dsc])=>{const b=el('button','dl-stu-t t-'+k);b.type='button';const pv=el('div','dl-stu-pv');pv.appendChild(el('i'));pv.appendChild(el('i'));if(k==='grid'){pv.appendChild(el('i'));pv.appendChild(el('i'));}b.appendChild(pv);b.appendChild(el('b',null,t));b.appendChild(el('small',null,dsc));b.addEventListener('click',()=>{o.tpl=k;paint();});tg.appendChild(b);});sh.box.appendChild(tg);
  lab('3 · Your logo & name');const lr=el('div','dl-stu-lg');const lp=el('div','dl-stu-lp');const lf=el('input');lf.type='file';lf.accept='image/*';lf.hidden=true;const lb=el('button','btn2','Upload logo');lb.type='button';lb.addEventListener('click',()=>lf.click());const lx=el('button','btn2','Remove');lx.type='button';lx.addEventListener('click',()=>{o.logo='';paint();});
  lf.addEventListener('change',()=>{const f=lf.files[0];if(!f)return;const im=new Image();im.onload=()=>{const sc=Math.min(1,600/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*sc);c.height=Math.round(im.height*sc);c.getContext('2d').drawImage(im,0,0,c.width,c.height);o.logo=c.toDataURL('image/png');paint();};im.src=URL.createObjectURL(f);});
  lr.appendChild(lp);lr.appendChild(lb);lr.appendChild(lx);lr.appendChild(lf);sh.box.appendChild(lr);const nm=el('input','dl-in');nm.placeholder='Store name on the PDF';nm.value=o.name;nm.addEventListener('input',()=>o.name=nm.value);sh.box.appendChild(nm);
  const tt=el('input','dl-in');tt.placeholder='Cover title';tt.value="Today's Edit";sh.box.appendChild(tt);
  lab('4 · Font');const fg=el('div','dl-mode');const fbs=FONTS.map(([k,t])=>{const b=el('button','chip f-'+k,t);b.type='button';b.addEventListener('click',()=>{o.font=k;paint();});fg.appendChild(b);return [k,b];});sh.box.appendChild(fg);
  sh.box.appendChild(el('p','dl-n',M.on?'Prices include your margin ('+(M.mode==='amt'?'+'+inr(M.val):'+'+M.val+'%')+'; drop and piece margins apply). Luxella’s name never appears.':'Prices are Luxella’s. Set your margin in “Your resale quote” to print your own prices.'));
  lab('5 · Where you post');const ch=el('input','dl-in');ch.placeholder='Your WhatsApp Channel link (whatsapp.com/channel/…)';ch.value=o.channel||'';sh.box.appendChild(ch);const wn=el('input','dl-in');wn.placeholder='Your WhatsApp number (printed on the PDF)';wn.inputMode='tel';wn.value=o.wa||'';sh.box.appendChild(wn);
  const al=el('label','dl-chk');const ac=el('input');ac.type='checkbox';ac.checked=!!o.auto;al.appendChild(ac);al.appendChild(el('span',null,'Auto-ready: prepare my PDF after every new drop'));sh.box.appendChild(al);
  const dly=el('select','dl-in');[[0.5,'30 minutes after the drop'],[1,'1 hour after the drop'],[2,'2 hours after the drop'],[3,'3 hours after the drop']].forEach(([v,t])=>{const op=el('option',null,t);op.value=v;dly.appendChild(op);});dly.value=String(o.delay||1);sh.box.appendChild(dly);
  const paint=()=>{[...tg.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(TPL[i][0]===o.tpl)));fbs.forEach(([k,b])=>b.setAttribute('aria-pressed',String(k===o.font)));lp.textContent='';if(o.logo){const im=el('img');im.src=o.logo;lp.appendChild(im);}else lp.appendChild(el('span',null,'No logo'));lx.style.display=o.logo?'':'none';dly.style.display=ac.checked?'':'none';};ac.addEventListener('change',paint);paint();
  const st=el('div','dl-msg');const go=el('button','btn dl-ask','Generate my PDF');go.type='button';sh.box.appendChild(go);sh.box.appendChild(st);const out=el('div','dl-stu-out');sh.box.appendChild(out);
  go.addEventListener('click',async()=>{o.channel=ch.value.trim();o.wa=wn.value.trim();o.auto=ac.checked;o.delay=Number(dly.value)||1;ST=Object.assign({},ST,o);savePref('pdf_studio',ST);go.disabled=true;out.textContent='';
   try{const r=rows.find(x=>x.id===ss.value);st.textContent='Collecting pieces…';const items=r?await dropItems(r,(i,n)=>st.textContent='Reading piece '+i+' / '+n+'…'):shopItems();if(!items.length){st.textContent='No pieces to add.';return;}
    const blob=await studioPdf(items,Object.assign({},o,{title:tt.value.trim()}),(i,n)=>st.textContent='Designing page '+i+' / '+n+'…');const fname=((o.name||'Catalogue').replace(/[^\w\- ]+/g,'').trim()||'Catalogue')+' · '+(r&&(r.data||{}).title||'Edit').replace(/[^\w\- ]+/g,'').trim()+'.pdf';
    st.textContent='Ready · '+items.length+' pieces · '+Math.round(blob.size/1024)+' KB';if(r){ST.done=Object.assign({},ST.done||{},{[r.id]:true});savePref('pdf_studio',ST);}
    const text=(tt.value.trim()||"Today's Edit")+(o.name?' · '+o.name:'')+(o.wa?'\nOrder on WhatsApp: '+o.wa:'');
    const B=(t,how,cls)=>{const b=el('button',cls||'btn2',t);b.type='button';b.addEventListener('click',()=>studioShare(blob,fname,text,how));out.appendChild(b);};
    B('Share to my WhatsApp Channel','channel','btn dl-ask');B('Share on WhatsApp','wa');B('Download PDF','download');
    const cp=el('button','btn2','Copy caption');cp.type='button';cp.addEventListener('click',()=>copyTxt(text,cp));out.appendChild(cp);
    out.appendChild(el('p','dl-n','On your phone, “Share to my WhatsApp Channel” opens the share sheet: pick WhatsApp, then your channel.'+(o.channel?' Your channel link opens too, if sharing files is not supported.':'')));}
   catch(e){st.textContent='Could not make the PDF: '+(e.message||e);}finally{go.disabled=false;}});}
 function autoReady(l){if(own()||!ST.auto)return;const now=Date.now();const due=rows.filter(r=>(r.kind==='post'||r.kind==='pdf')&&!(ST.done||{})[r.id]&&now-new Date(r.created_at)>=(ST.delay||1)*36e5&&now-new Date(r.created_at)<36*36e5);if(!due.length)return;
  const w=el('div','dl-auto');w.appendChild(el('span','dl-auto-k','Auto-ready'));w.appendChild(el('b',null,due.length>1?due.length+' drops are ready for your channel':'“'+((due[0].data||{}).title||'New drop')+'” is ready for your channel'));
  const b=el('button','btn dl-ask','Make & share my PDF');b.type='button';b.addEventListener('click',()=>studio(due[0]));w.appendChild(b);const x=el('button','btn2','Skip');x.type='button';x.addEventListener('click',()=>{ST.done=Object.assign({},ST.done||{});due.forEach(r=>ST.done[r.id]=true);savePref('pdf_studio',ST);w.remove();});w.appendChild(x);l.appendChild(w);}
 /* ---------- requests tab: open requests + Luxella's answers ---------- */
 const AKL={price:'Price request',availability:'Availability',size:'Size check',buy:'Wants to buy',similar:'Find similar',comment:'Comment'};
 async function requestsView(l){const box=el('div','dl-rqv');box.textContent='Loading requests…';l.appendChild(box);let L=[];try{L=await window.lx.deals.myReqs();}catch(e){box.textContent='Could not load requests.';return;}
  let names={};if(own()){try{(await window.lx.deals.clients()).forEach(c=>names[c.id]=c.name);}catch(e){}}
  box.textContent='';const open=L.filter(x=>!(x.data||{}).reply),done=L.filter(x=>(x.data||{}).reply);
  if(!L.length){const e=el('div','dl-empty');e.appendChild(el('b',null,own()?'No deal requests yet.':'No requests yet.'));e.appendChild(el('span',null,own()?'Price, size, availability and buy requests from every client land here.':'Tap Buy now, Ask price or Availability on any piece. Your requests and Luxella’s answers stay here.'));box.appendChild(e);return;}
  const sec=(t,A)=>{if(!A.length)return;const h=el('div','dl-sec-h');h.appendChild(el('span',null,t+' · '+A.length));box.appendChild(h);A.forEach(x=>box.appendChild(reqCard(x,names)));};
  sec(own()?'Waiting for your answer':'Open requests',open);sec('Answered',done);}
 function reqCard(x,names){const c=x.data||{};const w=el('article','dl-rqc'+(c.reply?' ok':''));const top=el('div','dl-rqc-t');
  if(c.photo){const im=el('img');im.src=c.photo;im.alt='';im.loading='lazy';top.appendChild(im);}
  const tx=el('div','dl-rqc-x');tx.appendChild(el('span','dl-rqc-k',(AKL[c.ask]||'Request')+(own()?' · '+(names[x.client_id]||'Client'):'')));tx.appendChild(el('b',null,String(c.product||'').replace(/^💬 Comment · /,'')));
  const sub=[c.spec&&String(c.spec).split(' · ').filter(t=>/^Size:/.test(t)).join(' '),ago(c.at)].filter(Boolean).join(' · ');tx.appendChild(el('small',null,sub));top.appendChild(tx);
  top.appendChild(el('span','dl-rqc-st',c.reply?'Answered':'Open'));w.appendChild(top);
  if(c.note)w.appendChild(el('p','dl-rqc-n','“'+c.note+'”'));
  if(c.reply){const a=el('div','dl-cm-r');const h=el('div','dl-cm-h');h.appendChild(el('b',null,'Luxella'));h.appendChild(el('small',null,ago(c.replied_at)));a.appendChild(h);if(num(c.price)!=null){const pp=el('div','dl-rqc-p');pp.appendChild(el('b',null,inr(c.price)));if(!own()&&M.on){pp.appendChild(el('small',null,'You sell '+inr(quote(c.price,c.deal_id&&c.page?c.deal_id+':'+c.page:c.deal_id))));}a.appendChild(pp);}if(c.avail)a.appendChild(el('span','dl-rqc-av',c.avail));a.appendChild(el('p',null,c.reply));w.appendChild(a);
   if(!own()&&num(c.price)!=null){const b=el('button','btn dl-ask','Confirm & buy on WhatsApp');b.type='button';b.addEventListener('click',()=>window.open('https://wa.me/'+WA+'?text='+encodeURIComponent('Hi Luxella, I confirm: '+c.product+' at '+inr(c.price)+(c.spec?' ('+c.spec+')':'')),'_blank','noopener'));w.appendChild(b);}}
  if(own()){const f=el('div','dl-rqc-f');const pr=el('input','dl-in');pr.type='number';pr.placeholder='Price ₹';pr.value=c.price??'';const av=el('select','dl-in');['','In stock','Limited stock','Only on order','Sold out'].forEach(o=>{const op=el('option',null,o||'Availability');op.value=o;av.appendChild(op);});av.value=c.avail||'';
   const ta=el('input','dl-in');ta.placeholder='Your answer…';ta.value=c.reply||'';const sb=el('button','btn dl-ask',c.reply?'Update answer':'Send answer');sb.type='button';
   sb.addEventListener('click',async()=>{const t=ta.value.trim()||[pr.value?'Price '+inr(pr.value):'',av.value].filter(Boolean).join(' · ');if(!t){ta.focus();return;}sb.disabled=true;
    try{await window.lx.deals.reply(x.client_id,x.doc_id,t,{price:num(pr.value),avail:av.value});try{await window.lx.deals.popup([x.client_id],{title:'Luxella answered · '+String(c.product||'').slice(0,50),body:[pr.value?inr(pr.value):'',av.value,t].filter(Boolean).join(' · ').slice(0,300),img:c.photo||''});}catch(e){}say('Answer sent.');render();}catch(e){sb.disabled=false;alert('Could not send.');}});
   const r1=el('div','dl-rqc-r');r1.appendChild(pr);r1.appendChild(av);f.appendChild(r1);f.appendChild(ta);f.appendChild(sb);w.appendChild(f);}
  return w;}
 /* ---------- Shop pieces from drops (every PDF page / photo becomes a product card) ---------- */
 const BRANDS=['Philipp Plein','Burberry','Coach','Michael Kors','Kate Spade','Tory Burch','Marc Jacobs','Puma','Adidas','Nike','Jordan','New Balance','Gucci','Prada','Versace','Calvin Klein','Tommy Hilfiger','Ralph Lauren','Hugo Boss','Armani','Guess','Steve Madden','Lacoste','Hoka','Balenciaga','Givenchy','Valentino','Moncler','Off-White','Fendi','Dior','Saint Laurent','Bottega Veneta','Loewe','Miu Miu','Chloé','Furla','Longchamp'];
 const guessBrand=t=>{t=String(t||'').toLowerCase().replace(/phi?l+i?p+\s*plein/g,'philipp plein');const f=BRANDS.filter(b=>t.includes(b.toLowerCase()));return f.length===1?f[0]:'';};
 const PCNT={};
 function dropPieces(){const out=[];rows.filter(r=>r.kind==='post'||r.kind==='pdf').forEach(r=>{const d=r.data||{};const ph=Array.isArray(d.photos)?d.photos:[];let n=ph.length||PCNT[r.id]||d.pages||0;
   if(!n&&d.url&&PCNT[r.id]==null){PCNT[r.id]=0;pdfDoc(d.url).then(doc=>{PCNT[r.id]=doc.numPages;if(VIEW==='shop')render();}).catch(()=>{});}
   for(let i=0;i<n;i++){const cp=capOf(r,i)||{};if(cp.sold)continue;out.push({r,i,cp,img:ph[i]||'',brand:cp.brand||guessBrand(d.title)||(d.title||'New arrivals'),title:cp.title||((d.title||'Piece')+' · '+String(i+1).padStart(2,'0'))});}});return out;}
 function pieceOk(p){if(!inRange(p.r.day))return false;if(F.brand&&p.brand!==F.brand)return false;if(F.saved||(F.flags||[]).length)return false;if(F.cat&&catOf({brand:p.brand,title:p.title})!==F.cat)return false;if(F.pb&&!pbOk({price:p.cp.price}))return false;if(F.q){const q=String(F.q).toLowerCase();if(![p.brand,p.title,p.cp.size,(p.r.data||{}).title,(p.r.data||{}).msg].join(' ').toLowerCase().includes(q))return false;}return true;}
 function pieceCard(p){const r=p.r,d=r.data||{},cp=p.cp;const c=el('article','dl-c dl-pc');const ph=el('div','dl-pc-ph');ph.appendChild(el('span','dl-deck-sk'));c.appendChild(ph);const o={img:p.img};
  const show=u=>{ph.textContent='';const im=el('img');im.src=u;im.alt=p.title;im.loading='lazy';ph.appendChild(im);};
  if(p.img)show(p.img);else{const io=new IntersectionObserver(async es=>{if(!es[0].isIntersecting)return;io.disconnect();try{const doc=await pdfDoc(d.url);const cv=await pageImg(doc,p.i+1,520);o.img=cv.toDataURL('image/jpeg',.82);o.canvas=cv;show(o.img);}catch(e){ph.textContent='';}},{rootMargin:'300px'});io.observe(c);}
  ph.addEventListener('click',()=>viewer(r,p.i));
  if(isNew(r)&&!SEEN.has(r.id+':'+p.i))c.appendChild(el('span','dl-pc-new','New'));
  const b=el('div','dl-pc-b');const br=el('div','dl-br');const lg=logo(p.brand);if(lg){const im=el('img');im.src=lg;br.appendChild(im);}br.appendChild(el('span',null,p.brand));b.appendChild(br);
  b.appendChild(el('div','dl-t',p.title));const pv=num(cp.price);const pr=el('div','dl-pr');if(pv!=null){pr.appendChild(el('b',null,inr(pv)));}else pr.appendChild(el('em',null,'Price on request'));b.appendChild(pr);if(!own()&&M.on&&pv!=null)b.appendChild(profitBox(pv,r.id+':'+(p.i+1),p.title,true,r.id));
  if(cp.size)b.appendChild(el('small','dl-pc-sz',cp.size));
  const ac=el('div','dl-pc-ac');const B=(t,k,cls)=>{const x=el('button',cls||'btn2',t);x.type='button';x.addEventListener('click',()=>postRequest(r,p.i+1,k,o));ac.appendChild(x);return x;};
  if(!own()){B('Buy now','buy','btn dl-ask');B(pv!=null?'Confirm price':'Ask price','price');B('Availability','availability');}
  else{const e=el('button','btn2','Open & edit');e.type='button';e.addEventListener('click',()=>viewer(r,p.i));ac.appendChild(e);}
  b.appendChild(ac);if(REQ[r.id+':'+(p.i+1)])b.appendChild(el('small','dl-pc-q','✓ You asked about this'));c.appendChild(b);return c;}
 /* ---------- Shop: brand storefronts + comments ---------- */
 function viewSwitch(nD,nS){const w=el('div','dl-vs');const mk=(k,t,n)=>{const b=el('button','dl-vs-b'+(VIEW===k?' on':''));b.type='button';b.setAttribute('aria-pressed',VIEW===k);b.appendChild(el('span',null,t));b.appendChild(el('small',null,String(n)));b.addEventListener('click',()=>{if(VIEW===k)return;VIEW=k;LS.set('view',k);PAGE=24;render();try{$('deals').scrollIntoView({behavior:'smooth',block:'start'});}catch(e){}});w.appendChild(b);};mk('deals','Deals',nD);mk('shop','Shop',nS);mk('reqs',own()?'Requests':'My requests',RQN==null?'·':RQN);if(RQN==null&&!window.__rqn){window.__rqn=1;window.lx.deals.myReqs().then(L=>{RQN=L.filter(x=>!(x.data||{}).reply).length;render();}).catch(()=>{});}return w;}
 function fromPrice(L){const p=L.map(r=>r.r?num(r.cp.price):num((r.data||{}).price)).filter(x=>x!=null);return p.length?Math.min(...p):null;}
 function shelf(b,L){const sec=el('section','dl-shelf');const h=el('button','dl-shelf-h');h.type='button';const lg=logo(b);const mk=el('span','dl-shelf-m');if(lg){const im=el('img');im.src=lg;im.alt=b;mk.appendChild(im);}else mk.textContent=b.charAt(0);h.appendChild(mk);const tt=el('span','dl-shelf-t');tt.appendChild(el('b',null,b));const fp=fromPrice(L);tt.appendChild(el('small',null,L.length+(L.length>1?' pieces':' piece')+(fp!=null?' · from '+inr(fp):'')));h.appendChild(tt);h.appendChild(el('span','dl-shelf-go','View all ›'));h.addEventListener('click',()=>{F.brand=b;PAGE=24;saveF();render();try{$('deals').scrollIntoView({behavior:'smooth',block:'start'});}catch(e){}});sec.appendChild(h);
  const s=el('div','dl-shelf-s');L.slice(0,16).forEach(r=>s.appendChild(r.r?pieceCard(r):card(r)));sec.appendChild(s);return sec;}
 function storeHead(b,L){const w=el('div','dl-store');const bk=el('button','dl-store-bk','‹ All houses');bk.type='button';bk.addEventListener('click',()=>{F.brand='';PAGE=24;saveF();render();});w.appendChild(bk);const lg=logo(b);const m=el('div','dl-store-m');if(lg){const im=el('img');im.src=lg;im.alt=b;m.appendChild(im);}else m.textContent=b;w.appendChild(m);w.appendChild(el('div','dl-store-t',b));const fp=fromPrice(L);w.appendChild(el('small',null,L.length+(L.length>1?' pieces':' piece')+(fp!=null?' · from '+inr(fp):'')+' · curated by Luxella'));return w;}
 function shopView(l,all){const PP=dropPieces();
  if(!all.length&&!PP.length){const e=el('div','dl-empty');e.appendChild(el('b',null,'The shop opens with the next pieces.'));e.appendChild(el('span',null,'Each piece will sit under its house with price, sizes and comments.'));l.appendChild(e);return;}
  const fake=PP.map(p=>({id:'p:'+p.r.id+':'+p.i,kind:'deal',day:p.r.day,created_at:p.r.created_at,data:{brand:p.brand,title:p.title,price:p.cp.price}}));
  if(all.length)l.appendChild(summary(all));l.appendChild(filters(all.concat(fake)));
  const list=sorted(all.filter(matches));const pl=PP.filter(pieceOk);const plain=!F.brand&&!F.q&&!F.cat&&!F.pb&&!(F.flags||[]).length&&!F.saved&&F.day==='all';
  if(F.brand)l.appendChild(storeHead(F.brand,all.filter(r=>(r.data||{}).brand===F.brand).concat(PP.filter(p=>p.brand===F.brand))));
  if(plain){const by={};list.concat(pl).forEach(r=>{const b=r.r?r.brand:((r.data||{}).brand||'Luxella picks');(by[b]=by[b]||[]).push(r);});Object.keys(by).sort((a,b)=>by[b].length-by[a].length||a.localeCompare(b)).forEach(b=>l.appendChild(shelf(b,by[b])));l.appendChild(el('p','dl-disc foot',DISC+' Your deal key: '+dealKey()+'.'));return;}
  const tot=list.length+pl.length;const cnt=el('div','dl-cnt');cnt.textContent=tot+' of '+(all.length+PP.length)+' pieces'+(F.q?' for “'+F.q+'”':'');l.appendChild(cnt);
  if(!tot)l.appendChild(el('p','dl-none',F.saved?'No saved pieces yet. Tap ♡ on a piece to keep it here.':'Nothing matches. Try fewer filters, or ask Luxella to find it.'));
  const g=el('div','dl-g'+(F.view==='list'?' list':''));list.concat(pl).slice(0,PAGE).forEach(r=>g.appendChild(r.r?pieceCard(r):card(r)));l.appendChild(g);
  if(tot>PAGE){const mo=el('button','btn2 dl-loadmore','Show more · '+(tot-PAGE)+' left');mo.type='button';mo.addEventListener('click',()=>{PAGE+=24;render();});l.appendChild(mo);}
  l.appendChild(el('p','dl-disc foot',DISC+' Your deal key: '+dealKey()+'.'));}
 const ago=t=>{try{const m=(Date.now()-new Date(t))/6e4;return m<1?'just now':m<60?Math.round(m)+'m ago':m<1440?Math.round(m/60)+'h ago':new Date(t).toLocaleDateString('en-IN',{day:'numeric',month:'short'});}catch(e){return '';}};
 async function commentsBox(r,box){const d=r.data||{};const w=el('div','dl-cm');w.appendChild(el('div','dl-sh-eb','Comments'));const th=el('div','dl-cm-th');th.textContent='Loading…';w.appendChild(th);box.appendChild(w);
  let names={};if(own()){try{(await window.lx.deals.clients()).forEach(c=>names[c.id]=c.name);}catch(e){}}
  const paint=async()=>{let L=[];try{L=await window.lx.deals.comments(r.id);}catch(e){}th.textContent='';
   if(!L.length)th.appendChild(el('p','dl-cm-e',own()?'No comments on this piece yet.':'Ask anything about this piece: colour, condition, fit, delivery. Only you and Luxella see this.'));
   L.forEach(x=>{const c=x.data||{};const m=el('div','dl-cm-m');const hd=el('div','dl-cm-h');hd.appendChild(el('b',null,own()?(names[x.client_id]||'Client'):'You'));hd.appendChild(el('small',null,ago(c.at)));m.appendChild(hd);m.appendChild(el('p',null,c.note||''));
    if(c.reply){const rp=el('div','dl-cm-r');const rh=el('div','dl-cm-h');rh.appendChild(el('b',null,'Luxella'));rh.appendChild(el('small',null,ago(c.replied_at)));rp.appendChild(rh);rp.appendChild(el('p',null,c.reply));m.appendChild(rp);}
    else if(own()){const rr=el('div','dl-cm-rr');const ti=el('input','dl-in');ti.placeholder='Reply to '+(names[x.client_id]||'client')+'…';const sb2=el('button','btn2','Reply');sb2.type='button';sb2.addEventListener('click',async()=>{const t=ti.value.trim();if(!t)return;sb2.disabled=true;try{await window.lx.deals.reply(x.client_id,x.doc_id,t);try{await window.lx.deals.popup([x.client_id],{title:'Luxella replied · '+[d.brand,d.title].filter(Boolean).join(' ').slice(0,50),body:t.slice(0,300),img:d.img||''});}catch(e){}paint();}catch(e){sb2.disabled=false;alert('Could not reply.');}});rr.appendChild(ti);rr.appendChild(sb2);m.appendChild(rr);}
    else m.appendChild(el('small','dl-cm-wait','Luxella will reply here'));
    th.appendChild(m);});};
  await paint();
  if(!own()){const f=el('div','dl-cm-f');const ta=el('textarea','dl-in dl-ta');ta.rows=2;ta.placeholder='Write a comment…';const go=el('button','btn dl-ask','Post comment');go.type='button';f.appendChild(ta);f.appendChild(go);w.appendChild(f);
   go.addEventListener('click',async()=>{const t=ta.value.trim();if(!t){ta.focus();return;}go.disabled=true;const id='cm-'+Date.now().toString(36);
    try{await photos.db.doc('requests/'+id).set({brand:d.brand||'',product:'💬 Comment · '+[d.brand,d.title].filter(Boolean).join(' '),spec:'Comment · Key '+dealKey()+' · '+dayLabel(r.day),qty:1,budget:0,needBy:'',link:d.link||'',photo:d.img||'',note:t,urgent:false,status:'Submitted',at:new Date().toISOString(),source:'deal_comment',deal_id:r.id,ask:'comment'});ta.value='';await paint();}
    catch(e){alert('Could not post. Please try again.');}finally{go.disabled=false;}});}}
 /* filters bar */
 function chip(label,on,fn,cls){const b=el('button','chip'+(cls?' '+cls:''),label);b.type='button';b.setAttribute('aria-pressed',String(!!on));b.addEventListener('click',fn);return b;}
 function filters(all){const wrap=el('div','dl-flw');
  const sr=el('div','dl-search');const si=el('input','dl-in');si.type='search';si.placeholder='Search brand, piece, size, colour…';si.value=F.q||'';sr.appendChild(si);let tm;si.addEventListener('input',()=>{clearTimeout(tm);tm=setTimeout(()=>{F.q=si.value;PAGE=24;render();const n=document.querySelector('.dl-search input');if(n){n.focus();n.setSelectionRange(n.value.length,n.value.length);}},180);});wrap.appendChild(sr);
  const brands=[...new Set(all.map(r=>(r.data||{}).brand).filter(Boolean))].sort();
  if(brands.length>1){const bs=el('div','dl-brands');bs.appendChild(chip('All houses',!F.brand,()=>{F.brand='';PAGE=24;saveF();render();}));brands.forEach(b=>{const n=all.filter(r=>(r.data||{}).brand===b).length;const c=chip('',F.brand===b,()=>{F.brand=F.brand===b?'':b;PAGE=24;saveF();render();},'dl-bchip');const lg=logo(b);if(lg){const im=el('img');im.src=lg;im.alt=b;c.appendChild(im);}c.appendChild(el('span',null,b));c.appendChild(el('small',null,String(n)));bs.appendChild(c);});wrap.appendChild(bs);}
  const cats=[...new Set(all.map(r=>catOf(r.data||{})))];if(cats.length>1){const cs=el('div','dl-fl');cs.appendChild(chip('All',!F.cat,()=>{F.cat='';PAGE=24;saveF();render();}));CATS.map(x=>x[0]).concat(['Other']).filter(c=>cats.includes(c)).forEach(c=>cs.appendChild(chip(c+' · '+all.filter(r=>catOf(r.data||{})===c).length,F.cat===c,()=>{F.cat=F.cat===c?'':c;PAGE=24;saveF();render();})));wrap.appendChild(cs);}
  const more=el('details','dl-more');const nAct=(F.day!=='all'?1:0)+(F.pb?1:0)+F.flags.length+(F.saved?1:0);const ms=el('summary');ms.appendChild(el('span',null,'Filter & sort'+(nAct?' · '+nAct:'')));const sel=el('select','dl-sel');[['new','Newest first'],['lo','Price: low to high'],['hi','Price: high to low'],['off','Biggest discount'],['end','Ending soonest']].forEach(([v,t])=>{const o=el('option',null,t);o.value=v;if(F.sort===v)o.selected=true;sel.appendChild(o);});sel.addEventListener('click',e=>e.stopPropagation());sel.addEventListener('change',()=>{F.sort=sel.value;saveF();render();});ms.appendChild(sel);more.appendChild(ms);more.open=!!LS.get('moreOpen',false);more.addEventListener('toggle',()=>LS.set('moreOpen',more.open));
  const mb=el('div','dl-moreb');
  const r1=el('div','dl-fl');[['all','All days'],['today','Today'],['yday','Yesterday'],['week','This week']].forEach(([k,l])=>r1.appendChild(chip(l,F.day===k,()=>{F.day=k;PAGE=24;saveF();render();})));mb.appendChild(r1);
  const r2=el('div','dl-fl');PB.forEach(([k,l])=>r2.appendChild(chip(l,F.pb===k,()=>{F.pb=F.pb===k?'':k;PAGE=24;saveF();render();})));mb.appendChild(r2);
  const r3=el('div','dl-fl');const FL=[['new','New for you'],['off','On discount'],['ending','Ending soon'],['few','Few left'],['avail','Available only']];FL.forEach(([k,l])=>r3.appendChild(chip(l,F.flags.includes(k),()=>{F.flags=F.flags.includes(k)?F.flags.filter(x=>x!==k):F.flags.concat(k);PAGE=24;saveF();render();})));if(!own())r3.appendChild(chip('♥ Saved'+(SAVED.size?' · '+SAVED.size:''),F.saved,()=>{F.saved=!F.saved;PAGE=24;render();}));mb.appendChild(r3);
  const r4=el('div','dl-fl');r4.appendChild(chip('▦ Grid',F.view==='grid',()=>{F.view='grid';saveF();render();}));r4.appendChild(chip('☰ List',F.view==='list',()=>{F.view='list';saveF();render();}));if(nAct||F.brand||F.cat||F.q)r4.appendChild(chip('Clear all',false,()=>{Object.assign(F,{day:'all',brand:'',cat:'',pb:'',flags:[],saved:false,q:''});PAGE=24;saveF();render();},'dl-clr'));mb.appendChild(r4);
  more.appendChild(mb);wrap.appendChild(more);
  const tools=el('div','dl-tools');const cpa=el('button','btn2 dl-cpa','Copy deals');cpa.type='button';cpa.addEventListener('click',()=>copyAll(cpa));tools.appendChild(cpa);const gp=el('button','btn dl-genb','✦ Make PDF');gp.type='button';gp.addEventListener('click',genSheet);tools.appendChild(gp);wrap.appendChild(tools);
  return wrap;}
 function summary(all){const t=today();const td=all.filter(r=>r.day===t);const nw=all.filter(r=>isNew(r)&&!SEEN.has(r.id)).length;const end=all.filter(r=>(r.data||{}).ends===t&&!(r.data||{}).sold).length;const brands=new Set(td.map(r=>(r.data||{}).brand).filter(Boolean)).size;
  const s=el('div','dl-sum');const it=(v,k)=>{const x=el('div');x.appendChild(el('b',null,String(v)));x.appendChild(el('small',null,k));s.appendChild(x);};it(td.length,'Today');if(!own())it(nw,'New for you');it(brands,'Houses today');it(end,'Ending today');return s;}
 function render(){const l=$('deals-list');if(!l)return;const keepScroll=document.activeElement&&document.activeElement.closest&&document.activeElement.closest('.dl-search');l.textContent='';
  const all=rows.filter(r=>r.kind==='deal'),pdfs=rows.filter(r=>r.kind==='pdf'||r.kind==='post');
  if(!all.length&&!pdfs.length){const e=el('div','dl-empty');e.appendChild(el('b',null,'Fresh deals land here every day.'));e.appendChild(el('span',null,'Check back this evening, or message Luxella for a specific piece.'));l.appendChild(e);return;}
  l.appendChild(viewSwitch(pdfs.length,all.length+dropPieces().length));
  if(!own()){autoReady(l);const sb=el('button','btn2 dl-stu-b','✦ Catalogue studio · make my PDF');sb.type='button';sb.addEventListener('click',()=>studio());l.appendChild(sb);}
  if(VIEW==='shop'){shopView(l,all);return;}
  if(VIEW==='reqs'){requestsView(l);return;}
  const dl0=pdfs.filter(r=>inRange(r.day)&&(!F.q||[(r.data||{}).title,(r.data||{}).msg].join(' ').toLowerCase().includes(String(F.q).toLowerCase())));
  if(!dl0.length){const e=el('div','dl-empty');e.appendChild(el('b',null,'Today’s drops land here.'));e.appendChild(el('span',null,'Meanwhile, browse every piece by house in the Shop.'));const sb3=el('button','btn2','Open the Shop');sb3.type='button';sb3.addEventListener('click',()=>{VIEW='shop';LS.set('view','shop');render();});e.appendChild(sb3);l.appendChild(e);}
  if(dl0.length){const tg=el('div','dl-sec-h');tg.appendChild(el('span',null,'Daily drops'));tg.appendChild(el('small',null,'Swipe through every post · copy the message · ask about any piece'));l.appendChild(tg);l.appendChild(drops(dl0));}
  l.appendChild(el('p','dl-disc foot',DISC+' Your deal key: '+dealKey()+'.'));
  if(!own()){try{const mx=rows.reduce((m,r)=>r.created_at>m?r.created_at:m,'');if(mx&&!window.__lxdv){window.__lxdv=1;setTimeout(()=>LS.set('lastv',mx),4000);}}catch(e){}}
 }

 /* ---------- photos → PDF ---------- */
 function loadJsPDF(){return new Promise((res,rej)=>{if(window.jspdf)return res(window.jspdf);const s=el('script');s.src='vendor/jspdf.umd.min.js';s.onload=()=>res(window.jspdf);s.onerror=rej;document.head.appendChild(s);});}
 function fileImg(f){return new Promise((res,rej)=>{const u=URL.createObjectURL(f);const i=new Image();i.onload=()=>{const mx=1600,sc=Math.min(1,mx/Math.max(i.width,i.height));const c=document.createElement('canvas');c.width=Math.round(i.width*sc);c.height=Math.round(i.height*sc);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(i,0,0,c.width,c.height);URL.revokeObjectURL(u);res({data:c.toDataURL('image/jpeg',.85),w:c.width,h:c.height});};i.onerror=rej;i.src=u;});}
 async function buildPdf(files,title,day,captions){const {jsPDF}=await loadJsPDF();const doc=new jsPDF({unit:'pt',format:'a4'});const W=595,H=842;const n=files.length;
  const lux=await rasterUrl('assets/luxella_wordmark.svg',1000);
  const dateTxt=(()=>{try{return new Date(day+'T00:00:00Z').toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});}catch(e){return day;}})();
  for(let i=0;i<n;i++){if(i)doc.addPage();doc.setFillColor(10,9,7);doc.rect(0,0,W,H,'F');
   if(lux){const w=130,h=lux.h*w/lux.w;doc.addImage(lux.data,'PNG',W/2-w/2,40,w,h);}
   doc.setDrawColor(201,163,94);doc.setLineWidth(.6);doc.line(W/2-90,76,W/2+90,76);
   doc.setTextColor(237,230,218);doc.setFont('helvetica','normal');doc.setFontSize(11);doc.text((title||"Today's deals").toUpperCase(),W/2,96,{align:'center',charSpace:1.5});
   doc.setTextColor(150,140,125);doc.setFontSize(8.5);doc.text(dateTxt,W/2,112,{align:'center'});
   const im=await fileImg(files[i]);const bx=46,by=130,bw=W-92,bh=H-130-(captions[i]?120:90);doc.setFillColor(255,255,255);doc.rect(bx,by,bw,bh,'F');
   const sc=Math.min((bw-40)/im.w,(bh-40)/im.h);const iw=im.w*sc,ih=im.h*sc;doc.addImage(im.data,'JPEG',bx+(bw-iw)/2,by+(bh-ih)/2,iw,ih);
   if(captions[i]){doc.setTextColor(237,230,218);doc.setFontSize(12);doc.text(doc.splitTextToSize(captions[i].replace(/₹/g,'Rs. '),W-120),W/2,by+bh+28,{align:'center'});}
   doc.setTextColor(120,112,100);doc.setFontSize(8);doc.text('ASK LUXELLA TO ORDER  ·  '+(i+1)+' / '+n,W/2,H-30,{align:'center',charSpace:.6});}
  return new File([doc.output('blob')],(title||'Luxella deals').replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'_')+'.pdf',{type:'application/pdf'});}

 /* ---------- branded PDF generator (Luxella → client, or reseller-branded) ---------- */
 function rasterUrl(url,w){return new Promise(res=>{if(!url)return res(null);const i=new Image();i.crossOrigin='anonymous';i.onload=()=>{const sc=w/i.width;const c=document.createElement('canvas');c.width=Math.round(w);c.height=Math.round(i.height*sc);c.getContext('2d').drawImage(i,0,0,c.width,c.height);try{res({data:c.toDataURL('image/png'),w:c.width,h:c.height});}catch(e){res(null);}};i.onerror=()=>res(null);i.src=url;});}
 function photoData(url){return new Promise(res=>{if(!url)return res(null);const i=new Image();i.crossOrigin='anonymous';i.onload=()=>{const mx=1400,sc=Math.min(1,mx/Math.max(i.width,i.height));const c=document.createElement('canvas');c.width=Math.round(i.width*sc);c.height=Math.round(i.height*sc);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(i,0,0,c.width,c.height);try{res({data:c.toDataURL('image/jpeg',.86),w:c.width,h:c.height});}catch(e){res(null);}};i.onerror=()=>res(null);i.src=url;});}
 const GOLD=[227,192,106],IVORY=[243,236,221],MUTE=[150,140,125],INK=[10,9,7];
 async function brandedPdf(list,opt){const {jsPDF}=await loadJsPDF();const doc=new jsPDF({unit:'pt',format:'a4'});const W=595,H=842;const res=!!opt.reseller;const cl=cli();
  const biz=(cl.biz||cl.name||'').trim();
  const lux=res?null:await rasterUrl('assets/luxella_wordmark.svg',1400);
  let clogo=null;if(res){try{clogo=photos.client&&photos.client.url?await rasterUrl(photos.client.url,700):null;}catch(e){}}
  const dateTxt=new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const bg=()=>{doc.setFillColor(...INK);doc.rect(0,0,W,H,'F');};
  const rule=(y,w)=>{doc.setDrawColor(201,163,94);doc.setLineWidth(.5);doc.line(W/2-w/2,y,W/2+w/2,y);doc.setFillColor(...GOLD);const s=2.6;doc.triangle(W/2,y-s,W/2+s,y,W/2,y+s,'F');doc.triangle(W/2,y-s,W/2-s,y,W/2,y+s,'F');};
  const markTop=y=>{if(res){if(clogo){const h=34,w=Math.min(200,clogo.w*h/clogo.h);doc.setFillColor(255,255,255);doc.rect(W/2-w/2-8,y-6,w+16,h+12,'F');doc.addImage(clogo.data,'PNG',W/2-w/2,y,w,h);}else{doc.setTextColor(...IVORY);doc.setFont('helvetica','bold');doc.setFontSize(16);doc.text(biz.toUpperCase(),W/2,y+22,{align:'center',charSpace:2});}}
   else if(lux){const w=150,h=lux.h*w/lux.w;doc.addImage(lux.data,'PNG',W/2-w/2,y,w,h);}};
  /* cover */
  bg();doc.setDrawColor(201,163,94);doc.setLineWidth(.6);doc.rect(22,22,W-44,H-44);doc.setLineWidth(.3);doc.rect(28,28,W-56,H-56);
  if(res){if(clogo){const h=110,w=Math.min(360,clogo.w*h/clogo.h);doc.setFillColor(255,255,255);doc.rect(W/2-w/2-16,230-16,w+32,h+32,'F');doc.addImage(clogo.data,'PNG',W/2-w/2,230,w,h);}else{doc.setTextColor(...IVORY);doc.setFont('helvetica','bold');doc.setFontSize(34);doc.text(biz.toUpperCase(),W/2,300,{align:'center',charSpace:4});}}
  else if(lux){const w=360,h=lux.h*w/lux.w;doc.addImage(lux.data,'PNG',W/2-w/2,250,w,h);doc.setTextColor(207,196,176);doc.setFont('helvetica','normal');doc.setFontSize(9);doc.text('THE STANDARD FOR RARE',W/2,250+h+26,{align:'center',charSpace:4});}
  rule(410,220);
  doc.setTextColor(...IVORY);doc.setFont('times','italic');doc.setFontSize(40);doc.text(opt.title||"Today's Deals",W/2,480,{align:'center'});
  doc.setTextColor(...MUTE);doc.setFont('helvetica','normal');doc.setFontSize(10);doc.text(dateTxt.toUpperCase(),W/2,510,{align:'center',charSpace:2});
  doc.setTextColor(...GOLD);doc.setFontSize(10);doc.text(list.length+(list.length>1?' PIECES':' PIECE')+(res?'  ·  CURATED BY '+biz.toUpperCase():'  ·  HAND-PICKED BY LUXELLA'),W/2,540,{align:'center',charSpace:2});
  rule(H-140,120);doc.setTextColor(...MUTE);doc.setFontSize(8.5);doc.text(res?('PRICES VALID TODAY  ·  DM '+biz.toUpperCase()+' TO ORDER'):'ALL-INCLUSIVE PRICES  ·  NO CUSTOMS ON DELIVERY  ·  WHATSAPP +91 87240 79056',W/2,H-110,{align:'center',charSpace:1.2});
  /* pieces: one per page */
  for(let i=0;i<list.length;i++){const r=list[i],d=r.data||{};doc.addPage();bg();markTop(40);
   doc.setTextColor(...MUTE);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text((i+1)+' / '+list.length,W-48,58,{align:'right',charSpace:1});doc.text(dayLabel(r.day).toUpperCase(),48,58,{charSpace:1});
   const bx=48,by=100,bw=W-96,bh=430;doc.setFillColor(255,255,255);doc.rect(bx,by,bw,bh,'F');
   const im=await photoData(d.img);if(im){const sc=Math.min((bw-60)/im.w,(bh-60)/im.h);const iw=im.w*sc,ih=im.h*sc;doc.addImage(im.data,'JPEG',bx+(bw-iw)/2,by+(bh-ih)/2,iw,ih);}else{doc.setTextColor(200,190,170);doc.setFont('times','italic');doc.setFontSize(120);doc.text((d.brand||'L').charAt(0),W/2,by+bh/2+40,{align:'center'});}
   const pr=num(d.price);const off=!res&&num(d.mrp)&&pr&&Number(d.mrp)>pr?Math.round((1-pr/Number(d.mrp))*100):0;
   if(off){doc.setFillColor(...GOLD);doc.roundedRect(bx+14,by+14,74,22,11,11,'F');doc.setTextColor(...INK);doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text(off+'% OFF',bx+51,by+29,{align:'center'});}
   if(d.sold){doc.setFillColor(...INK);doc.roundedRect(bx+bw-104,by+14,90,22,11,11,'F');doc.setTextColor(...IVORY);doc.setFont('helvetica','bold');doc.setFontSize(9);doc.text('SOLD OUT',bx+bw-59,by+29,{align:'center'});}
   let y=by+bh+42;doc.setTextColor(...GOLD);doc.setFont('helvetica','normal');doc.setFontSize(11);doc.text(String(d.brand||'').toUpperCase(),W/2,y,{align:'center',charSpace:3});
   y+=30;doc.setTextColor(...IVORY);doc.setFont('times','italic');doc.setFontSize(24);const tl=doc.splitTextToSize(d.title||'',W-140);doc.text(tl.slice(0,2),W/2,y,{align:'center'});y+=Math.min(2,tl.length)*26;
   if(d.sizes){doc.setTextColor(...MUTE);doc.setFont('helvetica','normal');doc.setFontSize(10);doc.text(d.sizes,W/2,y,{align:'center',charSpace:.6});y+=18;}
   if(d.note){doc.setTextColor(185,176,161);doc.setFontSize(10);doc.text(doc.splitTextToSize(d.note,W-160).slice(0,2),W/2,y+4,{align:'center'});y+=26;}
   rule(y+14,90);y+=54;
   const shown=res?(pr!=null?quote(pr):null):pr;
   if(shown!=null){doc.setTextColor(...GOLD);doc.setFont('helvetica','bold');doc.setFontSize(30);doc.text(inr(shown).replace('₹','Rs. '),W/2,y,{align:'center'});
    if(!res&&num(d.mrp)&&Number(d.mrp)>pr){doc.setTextColor(...MUTE);doc.setFont('helvetica','normal');doc.setFontSize(11);const s=inr(d.mrp).replace('₹','Rs. ');doc.text(s,W/2,y+20,{align:'center'});const tw=doc.getTextWidth(s);doc.setDrawColor(...MUTE);doc.line(W/2-tw/2,y+16.5,W/2+tw/2,y+16.5);}}
   else{doc.setTextColor(...GOLD);doc.setFont('times','italic');doc.setFontSize(22);doc.text(res?'DM for price':'Price on request',W/2,y,{align:'center'});}
   const tags=[];if(d.ends&&d.ends===today())tags.push('ENDS TODAY');if(num(d.stock)!=null&&Number(d.stock)<=3)tags.push('ONLY '+d.stock+' LEFT');if(tags.length){doc.setTextColor(224,144,122);doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.text(tags.join('  ·  '),W/2,y+40,{align:'center',charSpace:1.4});}
   doc.setTextColor(...MUTE);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text(res?('DM '+biz.toUpperCase()+' TO ORDER'):'ASK LUXELLA TO ORDER  ·  WHATSAPP +91 87240 79056',W/2,H-34,{align:'center',charSpace:1.2});}
  const fn=((res?biz:'Luxella')+' '+(opt.title||'Deals')+' '+today()).replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'_')+'.pdf';
  return new File([doc.output('blob')],fn,{type:'application/pdf'});}
 function genSheet(){if(!own())return studio({id:'shop'});const list=visibleDeals();const sh=sheet();sh.box.classList.add('dl-gen');sh.box.appendChild(el('div','dl-sh-eb','Generate deals PDF'));
  sh.box.appendChild(el('div','dl-sh-t',list.length?list.length+(list.length>1?' pieces':' piece')+' · '+({all:'all days',today:'today',yday:'yesterday',week:'this week'})[F.day]+(F.brand?' · '+F.brand:''):'No deals in this filter'));
  if(!list.length){return;}
  const ti=el('input','dl-in');ti.value=F.day==='today'||F.day==='all'?"Today's Deals":({yday:"Yesterday's Deals",week:'This Week\'s Deals'})[F.day];sh.box.appendChild(ti);
  const opts=el('div','dl-gopts');let res=false;
  const mk=(k,t,s)=>{const b=el('button','dl-gopt');b.type='button';b.appendChild(el('b',null,t));b.appendChild(el('small',null,s));b.addEventListener('click',()=>{res=k;[...opts.children].forEach(x=>x.classList.toggle('on',x===b));});opts.appendChild(b);return b;};
  if(own())mk(false,'Luxella edition','Gold Luxella cover, Luxella prices — for clients').classList.add('on');
  else{const a=mk(false,'Luxella edition','Luxella cover and prices');if(M.on){const b=mk(true,'My brand edition','Your logo, your prices with margin — for your customers');b.classList.add('on');res=true;}else{a.classList.add('on');opts.appendChild(el('p','dl-n','Set your margin above to make a PDF in your own brand with your prices.'));}}
  sh.box.appendChild(opts);
  const st=el('div','dl-msg');const ac=el('div','dl-ac');const go=el('button','btn dl-ask','Generate PDF');go.type='button';ac.appendChild(go);sh.box.appendChild(ac);sh.box.appendChild(st);
  go.addEventListener('click',async()=>{go.disabled=true;st.textContent='Designing your PDF…';try{const f=await brandedPdf(list,{reseller:res,title:ti.value.trim()});st.textContent='Ready · '+list.length+' pieces';ac.textContent='';
    const d1=el('button','btn dl-ask','Download PDF');d1.type='button';d1.addEventListener('click',()=>{const u=URL.createObjectURL(f);const a=el('a');a.href=u;a.download=f.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5000);});ac.appendChild(d1);
    if(navigator.canShare&&navigator.canShare({files:[f]})){const s1=el('button','btn2','Share');s1.type='button';s1.addEventListener('click',()=>navigator.share({files:[f]}).catch(()=>{}));ac.appendChild(s1);}
    if(own()){const p1=el('button','btn2','Post as deal sheet');p1.type='button';p1.addEventListener('click',async()=>{p1.disabled=true;st.textContent='Posting…';try{const up=await window.lx.deals.upload(f);await window.lx.deals.add('pdf',{title:ti.value.trim()||"Today's Deals",url:up.url,size:(f.size/1048576).toFixed(1)+' MB',pages:list.length+1,msg:''},today());st.textContent='Posted to Deal sheets.';load();}catch(e){st.textContent='Could not post: '+(e.message||e);p1.disabled=false;}});ac.appendChild(p1);}
   }catch(e){st.textContent='Could not make the PDF: '+(e.message||e);go.disabled=false;}});}
 /* ---------- client deal key ---------- */
 function dealKey(){const c=cli();const s=String(c.id||c.slug||'luxella');let h=7;for(const ch of s)h=(h*131+ch.charCodeAt(0))%1679616;return 'LX-'+String(c.slug||'LUX').replace(/[^a-z]/gi,'').slice(0,4).toUpperCase()+'-'+h.toString(36).toUpperCase().padStart(4,'0');}
 function keyBar(){const w=$('deals-key');if(!w)return;w.textContent='';const k=dealKey();const b=el('div','dl-key');const ic=el('span','dl-key-ic');ic.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="8" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 12h9M18 12v3M21 12v2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';b.appendChild(ic);const t=el('div','dl-key-t');t.appendChild(el('small',null,own()?'Deal key for '+(cli().name||'this client'):'Your private deal key'));t.appendChild(el('b',null,k));b.appendChild(t);const cp=el('button','dl-key-cp','Copy');cp.type='button';cp.addEventListener('click',()=>copyTxt(k,cp));b.appendChild(cp);b.title='Quote this key when you order a deal, so Luxella holds it for you.';w.appendChild(b);}
 /* ---------- intro (chest + key), once per session ---------- */
 function intro(){if(own())return;try{if(sessionStorage.getItem('lxdi'))return;sessionStorage.setItem('lxdi','1');}catch(e){}if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const ov=el('div','dl-intro dl-anim');const st=el('div','dl-st');const IMG='assets/deals_intro_first.jpg';
  const lay=(cls,img)=>{const x=el('div',cls);if(img){const im=el('img');im.src=IMG;im.alt='';x.appendChild(im);}st.appendChild(x);return x;};
  lay('dl-st-bg',true);lay('dl-st-patch');lay('dl-st-in');const rays=lay('dl-st-rays');lay('dl-st-lid',true);lay('dl-st-key',true);lay('dl-st-flash');
  const rec=[...rows].sort((a,b)=>a.created_at<b.created_at?1:-1);const src=[];rec.forEach(r=>{const d=r.data||{};if(d.img)src.push(d.img);(d.photos||[]).slice(0,3).forEach(u=>src.push(u));if(r.kind==='pdf'&&d.url)for(let p=1;p<=3;p++)src.push({pdf:d.url,p});});
  const cw=el('div','dl-st-cards');const CN=5;const cards=[];for(let i=0;i<CN;i++){const c=el('div','dl-st-card c'+i);const sk=el('span','dl-st-sh');c.appendChild(sk);cw.appendChild(c);cards.push(c);}st.appendChild(cw);
  (async()=>{for(let i=0;i<CN&&i<src.length;i++){let u=src[i];try{if(u&&u.pdf){const doc=await pdfDoc(u.pdf);if(u.p>doc.numPages)continue;u=(await pageImg(doc,u.p,360)).toDataURL('image/jpeg',.8);}const im=el('img');im.src=u;im.alt='';cards[i].insertBefore(im,cards[i].firstChild);cards[i].classList.add('has');}catch(e){}}})();
  for(let i=0;i<16;i++){const p=el('i','dl-st-sp');p.style.left=(40+Math.random()*20)+'%';p.style.setProperty('--dx',(Math.random()*60-30)+'vw');p.style.animationDelay=(2.1+Math.random()*1.2)+'s';p.style.width=p.style.height=(2+Math.random()*4)+'px';st.appendChild(p);}
  ov.appendChild(st);
  const sh=el('div','dl-in-shade');ov.appendChild(sh);
  const tx=el('div','dl-in-tx');tx.appendChild(el('div','dl-in-a',"Curating today's"));tx.appendChild(el('div','dl-in-b','Best Deals'));const ln=el('i','dl-in-ln');tx.appendChild(ln);tx.appendChild(el('div','dl-in-c','Rare finds. Exceptional value.'));ov.appendChild(tx);
  const kb=el('div','dl-in-key');kb.appendChild(el('small',null,'Your key'));kb.appendChild(el('b',null,dealKey()));ov.appendChild(kb);
  document.body.appendChild(ov);requestAnimationFrame(()=>ov.classList.add('in'));
  let done=false;const end=()=>{if(done)return;done=true;ov.classList.add('out');setTimeout(()=>ov.remove(),800);};
  setTimeout(end,5200);ov.addEventListener('click',end);}
 /* ---------- copy all ---------- */
 function copyAll(btn){const list=visibleDeals();if(!list.length)return;const res=!own()&&M.on;const k=dealKey();
  const lines=[(res?((cli().biz||cli().name||'')+' · '):'Luxella · ')+"Today's deals",''];
  list.forEach((r,i)=>{const d=r.data||{};const p=num(d.price);const shown=res&&p!=null?quote(p):p;lines.push((i+1)+'. '+[d.brand,d.title].filter(Boolean).join(' '));if(d.sizes)lines.push('   '+d.sizes);lines.push('   '+(shown!=null?inr(shown):(res?'DM for price':'Price on request'))+(!res&&num(d.mrp)&&p&&Number(d.mrp)>p?' (was '+inr(d.mrp)+')':''));lines.push('   '+validity(r).replace(/^Valid/,'valid'));});
  lines.push('');lines.push(res?'DM to order.':'Reply with the number to order · Key '+k);copyTxt(lines.join('\n'),btn);}
 function validity(r){const d=r.data||{};const t=today();if(d.sold)return 'Sold out';if(d.ends){if(d.ends<t)return 'Offer ended '+dayLabel(d.ends);if(d.ends===t)return 'Valid today only';return 'Valid till '+dayLabel(d.ends);}if(r.day===t)return 'Valid today · price may change tomorrow';return 'Posted '+dayLabel(r.day)+' · ask to re-confirm price';}
 /* ---------- AI: PDF / screenshot → deals ---------- */
 function b64File(f,maxPx){return new Promise((res,rej)=>{if(f.type==='application/pdf'){const r=new FileReader();r.onload=()=>res({b64:String(r.result).split(',')[1],mime:'application/pdf'});r.onerror=rej;r.readAsDataURL(f);return;}
  const u=URL.createObjectURL(f);const i=new Image();i.onload=()=>{const sc=Math.min(1,maxPx/Math.max(i.width,i.height));const c=document.createElement('canvas');c.width=Math.round(i.width*sc);c.height=Math.round(i.height*sc);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(i,0,0,c.width,c.height);URL.revokeObjectURL(u);res({b64:c.toDataURL('image/jpeg',.88).split(',')[1],mime:'image/jpeg',canvas:c});};i.onerror=rej;i.src=u;});}
 function crop(c,box){if(!c||!box)return null;const [y0,x0,y1,x1]=box;const W=c.width,H=c.height;let sx=x0/1000*W,sy=y0/1000*H,sw=(x1-x0)/1000*W,sh=(y1-y0)/1000*H;if(sw<20||sh<20)return null;const pad=.04;sx=Math.max(0,sx-sw*pad);sy=Math.max(0,sy-sh*pad);sw=Math.min(W-sx,sw*(1+2*pad));sh=Math.min(H-sy,sh*(1+2*pad));const o=document.createElement('canvas');o.width=Math.round(sw);o.height=Math.round(sh);o.getContext('2d').drawImage(c,sx,sy,sw,sh,0,0,o.width,o.height);return o;}
 async function aiExtract(files,st){const tok=await window.lx.authToken();const out=[];for(let i=0;i<files.length;i++){const f=files[i];st.textContent='Reading '+(i+1)+' / '+files.length+' with AI…';const enc=await b64File(f,2000);
   const r=await fetch('https://qzripzgbstvxkfobzhyv.supabase.co/functions/v1/lx-brain',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok},body:JSON.stringify({action:'deals_extract',image:{b64:enc.b64,mime:enc.mime}})});const j=await r.json().catch(()=>({}));
   if(!j.ok){const er=new Error(j.error==='no_ai'?'AI is not connected yet.':(j.error||'AI failed'));er.noai=j.error==='no_ai';throw er;}
   (j.items||[]).forEach(it=>{it._src=f;it._crop=enc.canvas?crop(enc.canvas,it.box):null;out.push(it);});}
  return out;}

 function aiConnect(host,st){host.textContent='';st.textContent='Connect AI once, then tap Read with AI again.';
  const b=el('div','dl-aic');b.appendChild(el('div','dl-sh-eb','Connect AI (one time)'));
  b.appendChild(el('p','dl-n','Free option: open aistudio.google.com/apikey, tap "Create API key", copy it and paste below. Claude keys work too.'));
  const pv=el('select','dl-sel');[['gemini','Google Gemini (free)'],['anthropic','Anthropic Claude']].forEach(([v,t])=>{const o=el('option',null,t);o.value=v;pv.appendChild(o);});
  const k=el('input','dl-in');k.placeholder='Paste API key';k.autocomplete='off';
  const go=el('button','btn dl-ask','Connect');go.type='button';const lk=el('a','dl-lnk','Get a free Gemini key ↗');lk.href='https://aistudio.google.com/apikey';lk.target='_blank';lk.rel='noopener';
  [pv,k,go,lk].forEach(x=>b.appendChild(x));host.appendChild(b);
  go.addEventListener('click',async()=>{if(!k.value.trim()){k.focus();return;}go.disabled=true;go.textContent='Checking…';try{const tok=await window.lx.authToken();const r=await fetch('https://qzripzgbstvxkfobzhyv.supabase.co/functions/v1/lx-brain',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok},body:JSON.stringify({action:'setkey',provider:pv.value,key:k.value.trim()})});const j=await r.json();
   if(j.ok&&j.connected){host.textContent='';st.textContent='AI connected ✓  Choose the file again and tap Read with AI.';}else{go.disabled=false;go.textContent='Connect';st.textContent='Key did not work: '+(j.error||'try again');}}catch(e){go.disabled=false;go.textContent='Connect';st.textContent='Could not connect.';}});}
 function aiReview(items,host,st){host.textContent='';if(!items.length){st.textContent='No products found. Try a clearer screenshot.';return;}
  const cfg=el('div','dl-ai-cfg');const rate=el('input','dl-in');rate.type='number';rate.value='95.5';const extra=el('input','dl-in');extra.type='number';extra.value='0';const pct=el('input','dl-in');pct.type='number';pct.value='0';
  const lab=(t,x)=>{const l=el('label','dl-l');l.appendChild(el('span',null,t));l.appendChild(x);return l;};cfg.appendChild(lab('₹ per $',rate));cfg.appendChild(lab('+ ₹ per piece',extra));cfg.appendChild(lab('+ % margin',pct));host.appendChild(cfg);
  const conv=(v,cur)=>{if(num(v)==null)return null;let x=Number(v);if(cur&&cur!=='INR'){const fx={USD:Number(rate.value)||95.5,CAD:(Number(rate.value)||95.5)*0.73,EUR:(Number(rate.value)||95.5)*1.08,GBP:(Number(rate.value)||95.5)*1.27}[cur]||Number(rate.value)||95.5;x=x*fx;}x=x*(1+(Number(pct.value)||0)/100)+(Number(extra.value)||0);return Math.ceil(x/100)*100;};
  const rowsEl=el('div','dl-ai-rows');host.appendChild(rowsEl);const R=[];
  items.forEach(it=>{const r=el('div','dl-ai-r');const cb=el('input');cb.type='checkbox';cb.checked=true;const th=el('div','dl-ai-th');if(it._crop){const im=el('img');im.src=it._crop.toDataURL('image/jpeg',.85);th.appendChild(im);}else th.textContent=it.page?'p.'+it.page:'—';
   const f=el('div','dl-ai-f');const br=el('input','dl-in');br.value=it.brand||'';br.placeholder='Brand';const ti=el('input','dl-in');ti.value=it.title||'';ti.placeholder='Piece';const sz=el('input','dl-in');sz.value=it.sizes||'';sz.placeholder='Sizes / colours';const pr=el('input','dl-in');pr.type='number';pr.placeholder='Your price ₹';const mr=el('input','dl-in');mr.type='number';mr.placeholder='Usual ₹';
   const src=el('small','dl-ai-src',(it.price!=null?(it.currency||'')+' '+it.price:'no price')+(it.mrp?' · was '+it.mrp:'')+(it.note?' · '+it.note:''));
   [br,ti,sz,pr,mr].forEach(x=>f.appendChild(x));f.appendChild(src);r.appendChild(cb);r.appendChild(th);r.appendChild(f);rowsEl.appendChild(r);R.push({it,cb,br,ti,sz,pr,mr});});
  const fill=()=>R.forEach(x=>{x.pr.value=conv(x.it.price,x.it.currency)??'';x.mr.value=x.it.mrp?(conv(x.it.mrp,x.it.currency)??''):'';});[rate,extra,pct].forEach(i=>i.addEventListener('input',fill));fill();
  const ac=el('div','dl-ac');const post=el('button','btn dl-ask','Post selected deals');post.type='button';const day=el('input','dl-in');day.type='date';day.value=today();ac.appendChild(day);ac.appendChild(post);host.appendChild(ac);
  st.textContent=items.length+' products found. Check, fix and post.';
  post.addEventListener('click',async()=>{post.disabled=true;let n=0;const sel=R.filter(x=>x.cb.checked&&x.ti.value.trim());for(const x of sel){st.textContent='Posting '+(++n)+' / '+sel.length+'…';let img='';try{if(x.it._crop){const b=await new Promise(r=>x.it._crop.toBlob(r,'image/jpeg',.88));img=(await window.lx.deals.upload(new File([b],'deal_'+Date.now()+'.jpg',{type:'image/jpeg'}))).url;}}catch(e){}
    await window.lx.deals.add('deal',{brand:x.br.value.trim(),title:x.ti.value.trim(),sizes:x.sz.value.trim(),price:num(x.pr.value),mrp:num(x.mr.value),note:x.it.note||'',img,sold:false,src_price:x.it.price,src_cur:x.it.currency},day.value||today());}
   st.textContent=sel.length+' deals posted.';host.textContent='';load();});}
 /* ---------- owner panel ---------- */
 function ownerPanel(){const w=$('deals-owner');if(!w||w.dataset.b||!own())return;w.dataset.b=1;{const mk=el('button','btn2 dl-mkb');mk.type='button';const lbl=()=>mk.textContent='Supplier markup: +'+LS.get('supmk',{pct:25}).pct+'% · rounded to ₹100 ✎';lbl();mk.addEventListener('click',()=>{const v=prompt('Markup % added to supplier prices',LS.get('supmk',{pct:25}).pct);if(v===null||isNaN(Number(v)))return;LS.set('supmk',{pct:Number(v)});lbl();});w.appendChild(mk);}
  const f=el('details','dl-own');f.appendChild(el('summary',null,'Post today’s deals'));f.open=true;
  const body=el('div','dl-ob');const mode=el('div','dl-mode');const MB=[['post','✦ New drop'],['ai','AI read'],['deal','Shop item'],['photos','Photos→PDF']].map(([k,l])=>{const b=el('button','chip',l);b.type='button';b.dataset.k=k;mode.appendChild(b);return b;});body.appendChild(mode);
  const inp=(ph,type)=>{const i=el('input','dl-in');i.placeholder=ph;if(type)i.type=type;return i;};
  const lab=(t,x,full)=>{const l=el('label','dl-l'+(full?' full':''));l.appendChild(el('span',null,t));l.appendChild(x);return l;};
  const fd=el('div','dl-form');const file=inp('','file');file.accept='image/*';file.multiple=true;const brand=inp('Brand (e.g. Coach)');const title=inp('Piece name');const price=inp('Empty = price on request','number');const mrp=inp('Usual price ₹','number');const sizes=inp('Sizes / colours');const stock=inp('Pieces left','number');const ends=inp('','date');const note=inp('One-line note');const link=inp('Link');const day=inp('','date');day.value=today();
  [lab('Photo',file,1),lab('Brand',brand),lab('Pieces left',stock),lab('Piece',title,1),lab('Deal price ₹',price),lab('Usual price ₹',mrp),lab('Sizes / colours',sizes,1),lab('Note',note,1),lab('Link',link,1),lab('Deal ends',ends),lab('Post date',day)].forEach(x=>fd.appendChild(x));
  const pf=el('div','dl-form');const pfile=inp('','file');pfile.accept='application/pdf';const ptitle=inp('Title (e.g. Coach outlet sheet)');const pmsg=el('textarea','dl-in dl-ta');pmsg.rows=5;pmsg.placeholder='Message for clients to copy (optional)';const pday=inp('','date');pday.value=today();
  [lab('PDF file',pfile,1),lab('Title',ptitle,1),lab('Message',pmsg,1),lab('Date',pday)].forEach(x=>pf.appendChild(x));
  const hf=el('div','dl-form');const hfile=inp('','file');hfile.accept='image/*';hfile.multiple=true;const htitle=inp('Sheet title (e.g. Michael Kors outlet finds)');const hcap=el('textarea','dl-in dl-ta');hcap.rows=4;hcap.placeholder='Captions, one line per photo (optional)\ne.g. MK Jet Set tote · ₹14,500';const hmsg=el('textarea','dl-in dl-ta');hmsg.rows=4;hmsg.placeholder='Message for clients to copy (optional)';const hday=inp('','date');hday.value=today();const hcount=el('div','dl-msg full');
  hfile.addEventListener('change',()=>{hcount.textContent=hfile.files.length?hfile.files.length+' photos → '+hfile.files.length+'-page PDF':'';});
  [lab('Photos (select many)',hfile,1),hcount,lab('Title',htitle,1),lab('Captions',hcap,1),lab('Message',hmsg,1),lab('Date',hday)].forEach(x=>hf.appendChild(x));
  const of=el('div','dl-form');const ofile=inp('','file');ofile.accept='image/*,application/pdf';ofile.multiple=true;const otitle=inp('Title (e.g. Coach outlet · new arrivals)');const omsg=el('textarea','dl-in dl-ta');omsg.rows=6;omsg.placeholder='Message for clients to copy and forward';const oday=inp('','date');oday.value=today();const ocount=el('div','dl-msg full');
  ofile.addEventListener('change',()=>{const fs=[...ofile.files];const p=fs.filter(x=>x.type==='application/pdf').length,i=fs.length-p;ocount.textContent=fs.length?[i?i+' photos → one drop':'',p?p+' PDF'+(p>1?'s':'')+' → '+(p>1?'separate drops':'one drop'):''].filter(Boolean).join(' · '):'';});
  [lab('Photos and/or PDF (select many)',ofile,1),ocount,lab('Title',otitle,1),lab('Message',omsg,1),lab('Date',oday)].forEach(x=>of.appendChild(x));
  body.appendChild(of);
  const af=el('div','dl-form');const afile=inp('','file');afile.accept='image/*,application/pdf';afile.multiple=true;const apdf=el('label','dl-chk full');const apc=el('input');apc.type='checkbox';apc.checked=true;apdf.appendChild(apc);apdf.appendChild(el('span',null,'Also post uploaded PDFs as deal sheets'));const ahost=el('div','dl-ai full');
  [lab('Screenshots or PDF',afile,1),el('p','dl-n full','AI reads every product: brand, piece, size and price. You check the list, set your ₹ price and post in one tap.'),apdf,ahost].forEach(x=>af.appendChild(x));
  body.appendChild(af);body.appendChild(fd);body.appendChild(pf);body.appendChild(hf);
  const go=el('button','btn dl-ask','Post deal');go.type='button';const msg=el('div','dl-msg');body.appendChild(go);body.appendChild(msg);
  let m='deal';const set=k=>{m=k;MB.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.k===k)));of.hidden=k!=='post';af.hidden=k!=='ai';fd.hidden=k!=='deal';pf.hidden=k!=='pdf';hf.hidden=k!=='photos';go.textContent=k==='post'?'Post drop':k==='ai'?'Read with AI':(k==='deal'?'Post deal':(k==='pdf'?'Upload PDF':'Make PDF & post'));msg.textContent='';};MB.forEach(b=>b.addEventListener('click',()=>set(b.dataset.k)));set('post');
  const size=f0=>f0.size>1048576?(f0.size/1048576).toFixed(1)+' MB':Math.round(f0.size/1024)+' KB';
  go.addEventListener('click',async()=>{msg.textContent='';go.disabled=true;try{
    if(m==='post'){const fs=[...ofile.files];if(!fs.length){msg.textContent='Choose photos or a PDF.';return;}const dy=oday.value||today();const ims=fs.filter(x=>x.type!=='application/pdf'),pdfs=fs.filter(x=>x.type==='application/pdf');
     if(ims.length){const urls=[];for(let i=0;i<ims.length;i++){msg.textContent='Uploading photo '+(i+1)+' / '+ims.length+'…';const im=await fileImg(ims[i]);const bl=await (await fetch(im.data)).blob();urls.push((await window.lx.deals.upload(new File([bl],'drop_'+(i+1)+'.jpg',{type:'image/jpeg'}))).url);}
      await window.lx.deals.add('post',{title:otitle.value.trim(),msg:omsg.value.trim(),photos:urls},dy);}
     for(const p of pdfs){msg.textContent='Uploading '+p.name+'…';let pages=null;try{pages=(await pdfDoc(URL.createObjectURL(p))).numPages;}catch(e){}const up=await window.lx.deals.upload(p);await window.lx.deals.add('pdf',{title:otitle.value.trim()||p.name.replace(/\.pdf$/i,''),url:up.url,size:size(p),pages,msg:omsg.value.trim()},dy);}
     ofile.value='';otitle.value='';omsg.value='';ocount.textContent='';msg.textContent='Drop posted.';await load();try{const nr=rows.filter(x=>x.kind==='post'||x.kind==='pdf').sort((a,b)=>a.created_at<b.created_at?1:-1)[0];if(nr)notifySheet(nr);}catch(e){}return;}
    if(m==='ai'){const fs=[...afile.files];if(!fs.length){msg.textContent='Choose screenshots or a PDF.';return;}let items;try{items=await aiExtract(fs,msg);}catch(er){if(er.noai){aiConnect(ahost,msg);return;}throw er;}if(apc.checked){for(const p of fs.filter(x=>x.type==='application/pdf')){const up=await window.lx.deals.upload(p);await window.lx.deals.add('pdf',{title:p.name.replace(/\.pdf$/i,''),url:up.url,size:size(p),msg:''},today());}}aiReview(items,ahost,msg);afile.value='';return;}
    if(m==='deal'){if(!title.value.trim()){msg.textContent='Add the piece name.';return;}let img='';const imgs=[];const fl=[...file.files];for(let i=0;i<fl.length;i++){msg.textContent='Uploading photo '+(i+1)+' / '+fl.length+'…';const im0=await fileImg(fl[i]);const bl=await (await fetch(im0.data)).blob();imgs.push((await window.lx.deals.upload(new File([bl],'deal_'+(i+1)+'.jpg',{type:'image/jpeg'}))).url);}img=imgs[0]||'';
     await window.lx.deals.add('deal',{brand:brand.value.trim(),title:title.value.trim(),price:num(price.value),mrp:num(mrp.value),sizes:sizes.value.trim(),stock:num(stock.value),ends:ends.value||'',note:note.value.trim(),link:link.value.trim(),img,imgs,sold:false},day.value||today());
     [file,brand,title,price,mrp,sizes,stock,ends,note,link].forEach(i=>i.value='');msg.textContent='Posted.';}
    else if(m==='pdf'){const pfl=pfile.files[0];if(!pfl){msg.textContent='Choose a PDF.';return;}msg.textContent='Uploading PDF…';const up=await window.lx.deals.upload(pfl);
     await window.lx.deals.add('pdf',{title:ptitle.value.trim()||pfl.name.replace(/\.pdf$/i,''),url:up.url,size:size(pfl),msg:pmsg.value.trim()},pday.value||today());pfile.value='';ptitle.value='';pmsg.value='';msg.textContent='Uploaded.';}
    else{const fs=[...hfile.files];if(!fs.length){msg.textContent='Choose photos.';return;}msg.textContent='Building a '+fs.length+'-page PDF…';const caps=hcap.value.split('\n').map(s=>s.trim());const pdf=await buildPdf(fs,htitle.value.trim(),hday.value||today(),caps);msg.textContent='Uploading PDF…';const up=await window.lx.deals.upload(pdf);
     await window.lx.deals.add('pdf',{title:htitle.value.trim()||'Deal sheet',url:up.url,size:size(pdf),pages:fs.length,msg:hmsg.value.trim()},hday.value||today());hfile.value='';htitle.value='';hcap.value='';hmsg.value='';hcount.textContent='';msg.textContent='PDF made and posted.';}
    load();}catch(e){msg.textContent='Could not save: '+(e.message||e);}finally{go.disabled=false;}});
  f.appendChild(body);w.appendChild(f);}

 function boot(){if(!$('pane-deals'))return;if(!$('deals-key')){const kk=el('div');kk.id='deals-key';const o=$('deals-owner');o.parentNode.insertBefore(kk,o);}keyBar();if(!$('deals-margin')){const mg=el('div');mg.id='deals-margin';const o=$('deals-owner');o.parentNode.insertBefore(mg,o.nextSibling);}ownerPanel();hookPrefs();marginPanel();load();}
 let n=0;const t=setInterval(()=>{n++;if(window.lx&&window.lx.deals&&document.getElementById('pane-deals')&&typeof photos!=='undefined'){clearInterval(t);boot();}else if(n>200)clearInterval(t);},150);
 document.addEventListener('click',e=>{if(e.target&&e.target.closest&&e.target.closest('#tab-deals')){intro();setTimeout(()=>{keyBar();ownerPanel();marginPanel();load();},50);}});
})();
