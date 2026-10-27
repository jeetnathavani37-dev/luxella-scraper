/* Unboxing reveal + Luxella Vault */
(function(){
 const $=id=>document.getElementById(id);
 const inr=n=>'₹'+Math.round(Number(n)||0).toLocaleString('en-IN');
 const pu=r=>{try{return photoUrl(r);}catch(e){return r.photo_url||'';}};
 /* 1. Unboxing reveal */
 window.lxUnbox=function(r,done){
  const ov=document.createElement('div');ov.className='lxub';
  const st=document.createElement('div');st.className='ub-stage';
  const box=document.createElement('div');box.className='ub-box';
  const lid=document.createElement('div');lid.className='ub-lid';const base=document.createElement('div');base.className='ub-base';
  const mono=document.createElement('div');mono.className='ub-mono';mono.textContent='L';lid.appendChild(mono);
  const item=document.createElement('div');item.className='ub-item';const u=pu(r);if(u){const im=document.createElement('img');im.src=u;im.alt=r.item||'';item.appendChild(im);}else{item.textContent='✦';}
  box.appendChild(item);box.appendChild(base);box.appendChild(lid);st.appendChild(box);
  const tx=document.createElement('div');tx.className='ub-tx';
  const eb=document.createElement('div');eb.className='ub-eb';eb.textContent='Welcome to the collection';
  const h=document.createElement('div');h.className='ub-h';const it0=r.item||'Your piece';h.textContent=(r.brand&&it0.toLowerCase().indexOf(String(r.brand).toLowerCase())!==0)?(r.brand+' · '+it0):it0;
  const p=document.createElement('p');p.textContent='Delivered and confirmed. Thank you for choosing Luxella.';
  const go=document.createElement('button');go.type='button';go.className='ub-go';go.textContent='Rate your experience';
  tx.appendChild(eb);tx.appendChild(h);tx.appendChild(p);tx.appendChild(go);st.appendChild(tx);ov.appendChild(st);
  const cf=document.createElement('div');cf.className='ub-cf';for(let i=0;i<46;i++){const s=document.createElement('i');s.style.left=Math.random()*100+'%';s.style.animationDelay=(0.9+Math.random()*0.9)+'s';s.style.animationDuration=(2.2+Math.random()*1.8)+'s';s.style.transform='rotate('+Math.random()*360+'deg)';if(i%3===0)s.className='w';cf.appendChild(s);}ov.appendChild(cf);
  document.body.appendChild(ov);requestAnimationFrame(()=>ov.classList.add('in'));setTimeout(()=>ov.classList.add('open'),650);
  let fin=false;const end=()=>{if(fin)return;fin=true;done&&done();};
  go.addEventListener('click',end);setTimeout(()=>{if(!fin)go.focus();},2500);
 };
 /* 5. Luxella Vault */
 const TIERS=[['Silver',0],['Gold',100000],['Black',300000]];
 function vault(){
  const pane=$('pane-ov');if(!pane||typeof dash==='undefined')return;const o=dash.data('orders');if(o.status!=='ok')return;
  const live=o.data.filter(r=>!/cancel/i.test(String(r.status||'')));
  const got=live.filter(r=>Number(r.stage||1)>=9||r.status==='Delivered').sort((a,b)=>String(b.order_date||'')<String(a.order_date||'')?-1:1);
  let w=$('lxvault');if(!live.length){if(w)w.remove();return;}
  const key=got.map(r=>r.item+pu(r)).join('|')+'|'+live.length;if(w&&w.dataset.k===key)return;
  if(!w){w=document.createElement('section');w.id='lxvault';w.className='card vault';pane.appendChild(w);}w.dataset.k=key;w.textContent='';
  const spend=live.reduce((s,r)=>s+Number(r.payout||0),0);let ti=0;TIERS.forEach((t,i)=>{if(spend>=t[1])ti=i;});
  const hd=document.createElement('div');hd.className='v-hd';
  const l=document.createElement('div');const eb=document.createElement('div');eb.className='v-eb';eb.textContent='Your Luxella Vault';const h=document.createElement('div');h.className='v-h';h.textContent=got.length?(got.length+' piece'+(got.length>1?'s':'')+' in your collection'):'Your collection begins here';l.appendChild(eb);l.appendChild(h);
  const tg=document.createElement('div');tg.className='v-tier t'+ti;const tl=document.createElement('small');tl.textContent='Collector tier';const tn=document.createElement('b');tn.textContent=TIERS[ti][0];tg.appendChild(tl);tg.appendChild(tn);
  hd.appendChild(l);hd.appendChild(tg);w.appendChild(hd);
  const brands=new Set(got.map(r=>String(r.brand||'').trim()).filter(Boolean));
  const ss=document.createElement('div');ss.className='v-stats';[['Collection value',inr(got.reduce((s,r)=>s+Number(r.payout||0),0))],['Brands',String(brands.size)],['Lifetime with Luxella',inr(spend)]].forEach(([k,v])=>{const d=document.createElement('div');const a=document.createElement('small');a.textContent=k;const b=document.createElement('b');b.textContent=v;d.appendChild(a);d.appendChild(b);ss.appendChild(d);});w.appendChild(ss);
  if(ti<TIERS.length-1){const nx=TIERS[ti+1];const pct=Math.min(100,Math.round((spend-TIERS[ti][1])/(nx[1]-TIERS[ti][1])*100));const pb=document.createElement('div');pb.className='v-prog';const bar=document.createElement('div');bar.className='v-bar';const f=document.createElement('i');bar.appendChild(f);const pt=document.createElement('span');pt.textContent=inr(nx[1]-spend)+' to '+nx[0];pb.appendChild(bar);pb.appendChild(pt);w.appendChild(pb);requestAnimationFrame(()=>requestAnimationFrame(()=>{f.style.width=pct+'%';}));}
  if(got.length){const g=document.createElement('div');g.className='v-grid';got.forEach(r=>{const c=document.createElement('button');c.type='button';c.className='v-it';const u=pu(r);if(u){const im=document.createElement('img');im.src=u;im.alt=r.item;im.loading='lazy';c.appendChild(im);}else{const ph=document.createElement('div');ph.className='v-ph';ph.textContent=(r.brand||r.item||'L').trim().charAt(0).toUpperCase();c.appendChild(ph);}const cap=document.createElement('div');cap.className='v-cap';const b=document.createElement('b');b.textContent=r.brand||'';const s=document.createElement('span');s.textContent=r.item;cap.appendChild(b);cap.appendChild(s);c.appendChild(cap);c.addEventListener('click',()=>{try{openDrawer(r);}catch(e){}});g.appendChild(c);});w.appendChild(g);}
 }
 try{vault();dash.onData(vault);}catch(e){}
})();
