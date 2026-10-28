/* Deals tab: daily deals + deal-sheet PDFs (owner posts, every client sees) */
(function(){
 const $=id=>document.getElementById(id);
 const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;};
 const inr=n=>n===''||n==null||isNaN(Number(n))?'':'₹'+Number(n).toLocaleString('en-IN');
 const WA='918724079056';
 const today=()=>{const d=new Date(Date.now()+5.5*3600e3);return d.toISOString().slice(0,10);};
 const own=()=>{try{return !!(window.lx&&window.lx.isOwner&&window.lx.isOwner());}catch(e){return false;}};
 const logo=b=>{try{return staticLogo(b);}catch(e){return '';}};
 const dayLabel=d=>{const t=today();if(d===t)return 'Today';const y=new Date(Date.parse(t)-864e5).toISOString().slice(0,10);if(d===y)return 'Yesterday';try{return new Date(d+'T00:00:00Z').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'});}catch(e){return d;}};
 let rows=[],busy=false;
 async function load(){if(busy||!window.lx||!window.lx.deals)return;busy=true;try{rows=await window.lx.deals.list();render();badge();}catch(e){const l=$('deals-list');if(l&&!rows.length)l.textContent='Deals could not load. Pull to refresh.';}busy=false;}
 function badge(){const t=$('tab-deals');if(!t)return;let b=t.querySelector('span');const n=rows.filter(r=>r.kind==='deal'&&r.day===today()).length;if(!n){if(b)b.remove();return;}if(!b){b=el('span','bdg');t.appendChild(b);}b.textContent=n;}
 function ask(d){const m='Hi Luxella, I am interested in this deal: '+[d.brand,d.title].filter(Boolean).join(' ')+(d.price?' at '+inr(d.price):'')+'.';window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(m),'_blank','noopener');}
 function card(r){const d=r.data||{};const c=el('article','dl-c');
  const ph=el('div','dl-ph');if(d.img){const im=el('img');im.src=d.img;im.alt=d.title||'';im.loading='lazy';ph.appendChild(im);}else{ph.classList.add('none');ph.textContent=(d.brand||'L').charAt(0);}
  if(d.mrp&&d.price&&Number(d.mrp)>Number(d.price)){ph.appendChild(el('span','dl-off',Math.round((1-Number(d.price)/Number(d.mrp))*100)+'% off'));}
  c.appendChild(ph);
  const bd=el('div','dl-bd');const br=el('div','dl-br');const lg=logo(d.brand);if(lg){const im=el('img');im.src=lg;im.alt=d.brand;br.appendChild(im);}br.appendChild(el('span',null,d.brand||'Luxella pick'));bd.appendChild(br);
  bd.appendChild(el('div','dl-t',d.title||''));
  if(d.note)bd.appendChild(el('div','dl-n',d.note));
  const pr=el('div','dl-pr');if(d.price)pr.appendChild(el('b',null,inr(d.price)));if(d.mrp&&Number(d.mrp)>Number(d.price||0))pr.appendChild(el('s',null,inr(d.mrp)));if(d.sizes)pr.appendChild(el('i',null,d.sizes));bd.appendChild(pr);
  const ac=el('div','dl-ac');const a=el('button','btn dl-ask','Ask Luxella');a.type='button';a.addEventListener('click',()=>ask(d));ac.appendChild(a);
  if(d.link){const v=el('a','btn2 dl-view','View piece');v.href=d.link;v.target='_blank';v.rel='noopener';ac.appendChild(v);}
  if(own()){const x=el('button','btn2 dl-del','Remove');x.type='button';x.addEventListener('click',async()=>{if(!confirm('Remove this deal?'))return;try{await window.lx.deals.remove(r.id);load();}catch(e){alert('Could not remove.');}});ac.appendChild(x);}
  bd.appendChild(ac);c.appendChild(bd);return c;}
 function pdfRow(r){const d=r.data||{};const a=el('a','dl-pdf');a.href=d.url;a.target='_blank';a.rel='noopener';
  const ic=el('span','dl-pi','PDF');a.appendChild(ic);const t=el('span','dl-pt');t.appendChild(el('b',null,d.title||'Deal sheet'));t.appendChild(el('small',null,dayLabel(r.day)+(d.size?' · '+d.size:'')));a.appendChild(t);a.appendChild(el('span','dl-pa','Open'));
  if(own()){const x=el('button','dl-px','×');x.type='button';x.title='Remove';x.addEventListener('click',async e=>{e.preventDefault();e.stopPropagation();if(!confirm('Remove this PDF?'))return;try{await window.lx.deals.remove(r.id);load();}catch(er){alert('Could not remove.');}});a.appendChild(x);}
  return a;}
 function render(){const l=$('deals-list');if(!l)return;l.textContent='';
  const deals=rows.filter(r=>r.kind==='deal'),pdfs=rows.filter(r=>r.kind==='pdf');
  if(!deals.length&&!pdfs.length){const e=el('div','dl-empty');e.appendChild(el('b',null,'Fresh deals land here every day.'));e.appendChild(el('span',null,'Check back this evening, or message Luxella for a specific piece.'));l.appendChild(e);return;}
  const days=[...new Set(deals.map(r=>r.day))];
  days.forEach((d,i)=>{const sec=el('section','dl-day'+(i===0?' first':''));const h=el('div','dl-dh');h.appendChild(el('span',null,dayLabel(d)));h.appendChild(el('small',null,deals.filter(r=>r.day===d).length+' pieces'));sec.appendChild(h);const g=el('div','dl-g');deals.filter(r=>r.day===d).forEach(r=>g.appendChild(card(r)));sec.appendChild(g);l.appendChild(sec);});
  if(pdfs.length){const sec=el('section','dl-day dl-pdfs');const h=el('div','dl-dh');h.appendChild(el('span',null,'Deal sheets'));h.appendChild(el('small',null,pdfs.length+' PDFs'));sec.appendChild(h);pdfs.forEach(r=>sec.appendChild(pdfRow(r)));l.appendChild(sec);}
 }
 function ownerPanel(){const w=$('deals-owner');if(!w||w.dataset.b||!own())return;w.dataset.b=1;
  const f=el('details','dl-own');const s=el('summary',null,'Post a deal or PDF');f.appendChild(s);
  const body=el('div','dl-ob');const mode=el('div','dl-mode');let m='deal';const b1=el('button','chip','Deal');b1.type='button';const b2=el('button','chip','PDF');b2.type='button';[b1,b2].forEach(b=>b.setAttribute('aria-pressed','false'));b1.setAttribute('aria-pressed','true');mode.appendChild(b1);mode.appendChild(b2);body.appendChild(mode);
  const inp=(ph,type)=>{const i=el('input','dl-in');i.placeholder=ph;if(type)i.type=type;return i;};
  const fd=el('div','dl-form');const file=inp('','file');file.accept='image/*';const brand=inp('Brand (e.g. Coach)');const title=inp('Piece name');const price=inp('Deal price ₹','number');const mrp=inp('Usual price ₹ (optional)','number');const sizes=inp('Sizes / colour (optional)');const note=inp('One-line note (optional)');const link=inp('Link (optional)');const day=inp('','date');day.value=today();
  const lab=(t,x)=>{const l=el('label','dl-l');l.appendChild(el('span',null,t));l.appendChild(x);return l;};
  const pf=el('div','dl-form');pf.hidden=true;const pfile=inp('','file');pfile.accept='application/pdf';const ptitle=inp('Title (e.g. Coach outlet sheet, 28 Oct)');const pday=inp('','date');pday.value=today();
  [lab('Photo',file),lab('Brand',brand),lab('Piece',title),lab('Deal price',price),lab('Usual price',mrp),lab('Sizes / colour',sizes),lab('Note',note),lab('Link',link),lab('Date',day)].forEach(x=>fd.appendChild(x));
  [lab('PDF file',pfile),lab('Title',ptitle),lab('Date',pday)].forEach(x=>pf.appendChild(x));
  body.appendChild(fd);body.appendChild(pf);
  const go=el('button','btn dl-go','Post deal');go.type='button';const msg=el('div','dl-msg');body.appendChild(go);body.appendChild(msg);
  b1.addEventListener('click',()=>{m='deal';b1.setAttribute('aria-pressed','true');b2.setAttribute('aria-pressed','false');fd.hidden=false;pf.hidden=true;go.textContent='Post deal';});
  b2.addEventListener('click',()=>{m='pdf';b2.setAttribute('aria-pressed','true');b1.setAttribute('aria-pressed','false');fd.hidden=true;pf.hidden=false;go.textContent='Upload PDF';});
  go.addEventListener('click',async()=>{msg.textContent='';go.disabled=true;try{
    if(m==='deal'){if(!title.value.trim()){msg.textContent='Add the piece name.';return;}let img='';if(file.files[0]){msg.textContent='Uploading photo…';img=(await window.lx.deals.upload(file.files[0])).url;}
     await window.lx.deals.add('deal',{brand:brand.value.trim(),title:title.value.trim(),price:price.value?Number(price.value):null,mrp:mrp.value?Number(mrp.value):null,sizes:sizes.value.trim(),note:note.value.trim(),link:link.value.trim(),img},day.value||today());
     [file,brand,title,price,mrp,sizes,note,link].forEach(i=>i.value='');msg.textContent='Posted.';}
    else{const pfl=pfile.files[0];if(!pfl){msg.textContent='Choose a PDF.';return;}msg.textContent='Uploading PDF…';const up=await window.lx.deals.upload(pfl);const kb=pfl.size>1048576?(pfl.size/1048576).toFixed(1)+' MB':Math.round(pfl.size/1024)+' KB';
     await window.lx.deals.add('pdf',{title:ptitle.value.trim()||pfl.name.replace(/\.pdf$/i,''),url:up.url,size:kb},pday.value||today());pfile.value='';ptitle.value='';msg.textContent='Uploaded.';}
    load();}catch(e){msg.textContent='Could not save: '+(e.message||e);}finally{go.disabled=false;}});
  f.appendChild(body);w.appendChild(f);}
 function boot(){if(!$('pane-deals'))return;ownerPanel();load();}
 let n=0;const t=setInterval(()=>{n++;if(window.lx&&window.lx.deals&&document.getElementById('pane-deals')){clearInterval(t);boot();}else if(n>200)clearInterval(t);},150);
 document.addEventListener('click',e=>{if(e.target&&e.target.id==='tab-deals')setTimeout(()=>{ownerPanel();load();},50);});
})();
