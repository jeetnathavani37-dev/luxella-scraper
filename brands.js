/* Overview: brand showcase carousel (one card per brand) */
(function(){
 const $=id=>document.getElementById(id);
 const RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 const pu=r=>{try{return photoUrl(r);}catch(e){return r.photo_url||'';}};
 const nm=(r,k)=>{try{return stName(r,k);}catch(e){return r.status||'';}};
 let timer=null,lastKey='';
 const inr=n=>'₹'+Math.round(Number(n)||0).toLocaleString('en-IN');
 function openBrand(g){
  const old=document.getElementById('lxbs');if(old)old.remove();
  const ov=document.createElement('div');ov.id='lxbs';ov.className='lxbs';
  const pnl=document.createElement('div');pnl.className='lxbs-p';ov.appendChild(pnl);
  const x=document.createElement('button');x.type='button';x.className='lxbs-x';x.setAttribute('aria-label','Close');x.textContent='×';pnl.appendChild(x);
  const hd=document.createElement('div');hd.className='lxbs-hd';const lg=(()=>{try{return staticLogo(g.b);}catch(e){return '';}})();
  if(lg){const im=document.createElement('img');im.src=lg;im.alt=g.b;hd.appendChild(im);}else{const t=document.createElement('div');t.className='lxbs-nm';t.textContent=g.b;hd.appendChild(t);}
  const tot=g.rows.reduce((s,r)=>s+Number(r.payout||0),0);const del=g.rows.length-g.open;
  const st=document.createElement('div');st.className='lxbs-st';[[String(g.rows.length),g.rows.length>1?'Pieces':'Piece'],[String(g.open),'On the way'],[String(del),'Delivered'],[inr(tot),'Total']].forEach(([v,k])=>{const d=document.createElement('div');const b=document.createElement('b');b.textContent=v;const sm=document.createElement('small');sm.textContent=k;d.appendChild(b);d.appendChild(sm);st.appendChild(d);});
  hd.appendChild(st);pnl.appendChild(hd);
  const list=document.createElement('div');list.className='lxbs-l';
  g.rows.forEach((r,i)=>{const k=Number(r.stage||1);const done=k>=9||r.status==='Delivered';
   const it=document.createElement('button');it.type='button';it.className='lxbs-i';it.style.animationDelay=(i*60)+'ms';
   const ph=document.createElement('div');ph.className='lxbs-ph';const u=pu(r);if(u){const im=document.createElement('img');im.src=u;im.alt=r.item;im.loading='lazy';ph.appendChild(im);}else{ph.classList.add('none');ph.textContent='No photo';}
   const tx=document.createElement('div');tx.className='lxbs-tx';const no=document.createElement('small');no.textContent=(r.order_no||'')+(r.order_date?' · '+(()=>{try{return fd(r.order_date);}catch(e){return r.order_date;}})():'');const nmx=document.createElement('b');nmx.textContent=r.item;const sg=document.createElement('span');sg.className='lxbs-sg'+(done?' ok':'');sg.textContent=done?'Delivered':nm(r,k);
   const bar=document.createElement('i');bar.className='lxbs-bar';const ks=(()=>{try{return stKs(r);}catch(e){return [1,2,3,4,5,6,7,8,9];}})();const pos=Math.max(1,ks.indexOf(k)+1);bar.style.setProperty('--p',(done?100:Math.round(pos/ks.length*100))+'%');
   tx.appendChild(no);tx.appendChild(nmx);tx.appendChild(sg);tx.appendChild(bar);
   const am=document.createElement('div');am.className='lxbs-am';am.textContent=inr(r.payout);
   it.appendChild(ph);it.appendChild(tx);it.appendChild(am);
   it.addEventListener('click',()=>{close();setTimeout(()=>{try{openDrawer(r);}catch(e){}},260);});
   list.appendChild(it);});
  pnl.appendChild(list);
  const close=()=>{ov.classList.remove('in');document.documentElement.style.overflow='';setTimeout(()=>ov.remove(),380);document.removeEventListener('keydown',esc);};
  const esc=e=>{if(e.key==='Escape')close();};
  x.addEventListener('click',close);ov.addEventListener('click',e=>{if(e.target===ov)close();});document.addEventListener('keydown',esc);
  (document.querySelector('.sw')||document.body).appendChild(ov);document.documentElement.style.overflow='hidden';requestAnimationFrame(()=>ov.classList.add('in'));
 }

 function render(){
  const pane=$('pane-ov');if(!pane||typeof dash==='undefined')return;const o=dash.data('orders');if(o.status!=='ok')return;
  const rows=o.data.filter(r=>!/cancel/i.test(String(r.status||''))&&String(r.brand||'').trim());
  const map=new Map();rows.forEach(r=>{const b=String(r.brand).trim();const k=b.toLowerCase();if(!map.has(k))map.set(k,{b,rows:[]});map.get(k).rows.push(r);});
  const groups=[...map.values()].map(g=>{g.rows.sort((a,b)=>String(b.order_date||'')<String(a.order_date||'')?-1:1);g.hero=g.rows.find(r=>pu(r))||g.rows[0];g.open=g.rows.filter(r=>Number(r.stage||1)<9&&r.status!=='Delivered').length;return g;}).sort((a,b)=>b.rows.length-a.rows.length||(String(b.rows[0].order_date)>String(a.rows[0].order_date)?1:-1));
  let w=$('lxbrands');
  if(groups.length<1){if(w)w.remove();return;}
  const key=groups.map(g=>g.b+g.rows.length+g.open+pu(g.hero)).join('|');if(w&&key===lastKey)return;lastKey=key;
  if(!w){w=document.createElement('section');w.id='lxbrands';w.className='lxbr';}{const no=$('neworder');if(no&&no.parentNode){if(no.nextSibling!==w)no.after(w);}else if(!w.parentNode)pane.appendChild(w);}
  w.textContent='';
  const hd=document.createElement('div');hd.className='lxbr-h';hd.innerHTML='<span>Explore your houses</span>';w.appendChild(hd);
  const track=document.createElement('div');track.className='lxbr-t';w.appendChild(track);
  groups.forEach(g=>{
   const c=document.createElement('article');c.className='lxbr-c';
   const top=document.createElement('div');top.className='lxbr-logo';const lg=(()=>{try{return staticLogo(g.b);}catch(e){return '';}})();
   if(lg){const im=document.createElement('img');im.src=lg;im.alt=g.b;top.appendChild(im);}else{const t=document.createElement('span');t.textContent=g.b;top.appendChild(t);}
   c.appendChild(top);
   const ph=document.createElement('div');ph.className='lxbr-ph';const u=pu(g.hero);if(u){const im=document.createElement('img');im.src=u;im.alt=g.hero.item;im.loading='lazy';ph.appendChild(im);}else{const s=document.createElement('span');s.textContent=g.b.charAt(0).toUpperCase();ph.classList.add('none');ph.appendChild(s);}
   c.appendChild(ph);
   const bt=document.createElement('div');bt.className='lxbr-b';
   const chip=document.createElement('span');chip.className='lxbr-chip';chip.textContent=g.rows.length+(g.rows.length>1?' pieces':' piece')+(g.open?' · '+g.open+' on the way':' · all delivered');bt.appendChild(chip);
   const d=document.createElement('p');d.className='lxbr-d';const h=g.rows[0];d.textContent=h.item+' · '+(Number(h.stage||1)>=9?'Delivered':nm(h,Number(h.stage||1)));bt.appendChild(d);
   const go=document.createElement('button');go.type='button';go.className='lxbr-go';go.textContent='Explore';go.addEventListener('click',()=>openBrand(g));bt.appendChild(go);
   c.appendChild(bt);track.appendChild(c);
  });
  if(groups.length>1){
   const nav=document.createElement('div');nav.className='lxbr-nav';const dots=document.createElement('div');dots.className='lxbr-dots';
   groups.forEach((g,i)=>{const dt=document.createElement('button');dt.type='button';dt.setAttribute('aria-label',g.b);dt.addEventListener('click',()=>{stop();go(i);});dots.appendChild(dt);});
   const pl=document.createElement('button');pl.type='button';pl.className='lxbr-play';pl.setAttribute('aria-label','Play');nav.appendChild(dots);nav.appendChild(pl);w.appendChild(nav);
   const cards=[...track.children];
   const cur=()=>{const x=track.scrollLeft+track.clientWidth/2;let best=0,bd=1e9;cards.forEach((c,i)=>{const m=c.offsetLeft+c.offsetWidth/2;const dd=Math.abs(m-x);if(dd<bd){bd=dd;best=i;}});return best;};
   const mark=()=>{const i=cur();[...dots.children].forEach((d,j)=>d.classList.toggle('on',i===j));cards.forEach((c,j)=>c.classList.toggle('on',i===j));};
   const go=i=>{const c=cards[(i+cards.length)%cards.length];track.scrollTo({left:c.offsetLeft-(track.clientWidth-c.offsetWidth)/2,behavior:RM?'auto':'smooth'});};
   const stop=()=>{clearInterval(timer);timer=null;pl.classList.remove('on');};
   const start=()=>{if(RM)return;stop();timer=setInterval(()=>go(cur()+1),4200);pl.classList.add('on');};
   pl.addEventListener('click',()=>timer?stop():start());
   track.addEventListener('scroll',()=>requestAnimationFrame(mark),{passive:true});
   track.addEventListener('pointerdown',stop,{passive:true});
   setTimeout(()=>{mark();start();},300);
  }else{track.firstChild&&track.firstChild.classList.add('on');}
 }
 try{render();dash.onData(render);}catch(e){}
})();
