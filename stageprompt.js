/* After the owner moves an order to a new stage: ask how to tell the client.
   Email / Popup / WhatsApp, each with an editable message, tracking and order link. Nothing is sent until a button is pressed.
   window.lxStagePrompt({client:{id,slug,name}, order:{...order data...}, to:<stage>, phone, addNotice(data), token()}) */
(function(){
 const STAGES=['Order placed','Order confirmed','Shipped by retailer/outlet','Received at international hub','Shipped from international hub','Received at Indian warehouse','Address requested','Shipped from Indian warehouse','Delivered'];
 const LST=['Order placed','Order confirmed','Item secured from store','','','','Address requested','Dispatched to you','Delivered'];
 const isL=o=>String((o&&o.order_type)||'').includes('Local');
 const stN=(o,s)=>(isL(o)&&LST[s-1])||STAGES[s-1]||'';
 const slugify=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60);
 const FN='https://qzripzgbstvxkfobzhyv.supabase.co/functions/v1/lx-push';
 function hostBase(slug){return 'https://luxellaclients.duckdns.org/'+slug;}
 function build(o,c,s){
  const first=String(c.name||'').split(' ')[0]||'there';const no=String(o.order_no||'').replace(/^#/,'');const item=o.item||'your order';
  const ref=item+(no?' (Order #'+no+')':'');const page=hostBase(c.slug);const lk=h=>page+'#'+h;const local=isL(o);
  const useLocal=s>=8||local;const trk=useLocal?(o.local_tracking||(local?'':o.intl_tracking_no)):o.intl_tracking_no;const cour=useLocal?o.local_courier:o.intl_courier;
  const trkTxt=trk&&s>=3&&s<=8?'\n'+(cour&&cour!=='—'?cour+' ':'')+'tracking number: '+trk:'';
  const follow='\n\nTrack your order here: '+lk('tr');
  const M={
   1:'Thank you for your order. We have received your request for '+ref+' and are now placing it with the store on your behalf.'+follow,
   2:'Good news. Your order for '+ref+' is confirmed'+(local?'.':' and bought in your name. Next, the store will ship it to our hub abroad.')+follow,
   3:local?ref+' has been secured from the store and is now with Luxella. Please keep your delivery address ready.'+follow:'The store has shipped '+ref+' to our hub abroad.'+trkTxt+follow,
   4:ref+' has reached our international hub and is being quality checked by our team.'+follow,
   5:ref+' has left our hub and is on its way to India.'+follow,
   6:ref+' has landed in India and is clearing customs. It will then be prepared for dispatch to you. Please keep your delivery address ready.'+follow,
   7:'Your order, '+ref+', is ready to be dispatched. Kindly share your delivery address, with pin code and a reachable phone number:\n'+lk('ad:'+slugify(item))+'\nWe ship within 24 hours of receiving it.',
   8:ref+' has been dispatched with our courier partner.'+trkTxt+'\nPlease keep your phone reachable and record a continuous unboxing video before opening the parcel.'+follow+(/^\d{1,8}$/.test(no)?'\n\nOnce it reaches you, please confirm here: '+lk('recv:'+no):''),
   9:ref+' has been delivered. Thank you for choosing Luxella. We would be grateful if you could rate your experience:\n'+lk(/^\d{1,8}$/.test(no)?'rate:'+no:'tr')
  };
  const hash=s===7?'ad:'+slugify(item):(s===9&&/^\d{1,8}$/.test(no))?'rate:'+no:'tr';
  const cta=s===7?['Share your address',hash]:s===9?['Rate your order',hash]:(s===8&&/^\d{1,8}$/.test(no))?['Received successfully','recv:'+no]:['Track your order','tr'];
  return {text:'Dear '+first+',\n\n'+(M[s]||M[1])+'\n\nWarm regards,\nLuxella',link:lk(hash),track:trk?((cour&&cour!=='—'?cour+' ':'')+trk):'',cta,url:s===7?'ad':'tr',subject:stN(o,s)+': '+item};
 }
 const strip=t=>String(t||'').replace(/^Dear [^\n]*,\s*/i,'').replace(/\s*Warm regards,\s*Luxella\s*$/i,'').replace(/^.*https?:\/\/\S+.*$/gm,m=>m.replace(/\s*https?:\/\/\S+/g,'').trim()).replace(/^(?:Track your order here|You can follow every update here|Once it reaches you, please confirm here):?\.?\s*$/gm,'').replace(/[:][ \t]*$/gm,'.').replace(/\n{3,}/g,'\n\n').trim();
 window.lxStagePrompt=function(P){try{
  const o=P.order||{},c=P.client||{},s=Number(P.to)||Number(o.stage)||1;if(!c.id)return;
  const old=document.getElementById('lx-sp');if(old)old.remove();
  const B=build(o,c,s);const sn=stN(o,s);
  const ov=document.createElement('div');ov.id='lx-sp';ov.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.72);display:flex;align-items:flex-end;justify-content:center;padding:0;font-family:inherit';
  const pn=document.createElement('div');pn.style.cssText='background:#0b0b0b;color:#eee;border:1px solid #3a3322;border-radius:14px 14px 0 0;width:100%;max-width:560px;max-height:92vh;overflow:auto;padding:16px 16px 20px;box-sizing:border-box';
  const h=(t,css)=>{const d=document.createElement('div');d.textContent=t;if(css)d.style.cssText=css;return d;};
  pn.appendChild(h('STAGE UPDATED','font-size:11px;letter-spacing:.3em;color:#E3C06A'));
  pn.appendChild(h((o.order_no?o.order_no+' · ':'')+(o.item||''),'font-size:16px;margin:6px 0 2px;color:#F4E1A0'));
  pn.appendChild(h('→ '+sn+' · '+(c.name||''),'font-size:13px;opacity:.85'));
  const info=document.createElement('div');info.style.cssText='margin:10px 0;padding:10px;border:1px solid #2b2619;border-radius:8px;font-size:12.5px;line-height:1.7';
  const row=(k,v,href)=>{const d=document.createElement('div');d.appendChild(Object.assign(document.createElement('span'),{textContent:k+': ',style:'opacity:.65'}));if(href){const a=document.createElement('a');a.href=href;a.target='_blank';a.rel='noopener';a.textContent=v;a.style.cssText='color:#E3C06A;word-break:break-all';d.appendChild(a);}else d.appendChild(document.createTextNode(v));info.appendChild(d);};
  if(B.track)row('Tracking',B.track);else if(s>=3&&s<=8)row('Tracking','abhi add nahi hua');
  if(o.eta_date&&s<9)row('Expected by',o.eta_date);
  row('Order link',B.link,B.link);
  pn.appendChild(info);
  const ta=document.createElement('textarea');ta.rows=8;ta.value=B.text;ta.style.cssText='width:100%;box-sizing:border-box;font:inherit;font-size:13px;padding:8px;background:#0c0c0c;color:#eee;border:1px solid #3a3322;border-radius:6px';pn.appendChild(ta);
  const edited=()=>ta.value!==B.text;
  const bar=document.createElement('div');bar.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:10px';
  const mk=(t,fn,gold)=>{const b=document.createElement('button');b.type='button';b.textContent=t;b.style.cssText='padding:10px 14px;border-radius:8px;font:inherit;font-size:12px;letter-spacing:.08em;cursor:pointer;border:1px solid #E3C06A;'+(gold?'background:#E3C06A;color:#000;font-weight:700':'background:transparent;color:#E3C06A');b.onclick=()=>fn(b);bar.appendChild(b);return b;};
  const say=t=>{try{if(window.alertMsg)window.alertMsg(t);else if(typeof toast==='function')toast(t);}catch(e){}};
  mk('✉️ Send email',async b=>{if(!ta.value.trim())return;b.disabled=true;const prev=b.textContent;b.textContent='Sending…';
   try{const tok=await P.token();const body=(edited()||(s===8&&/^\d{1,8}$/.test(String(o.order_no||'').replace(/^#/,''))))?{manual_msg:{client_id:c.id,subject:B.subject,headline:sn,text:strip(ta.value),cta:B.cta}}:{manual_stage:{client_id:c.id,item:o.item,order_no:o.order_no||undefined,stage:s}};
    const r=await fetch(FN,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok},body:JSON.stringify(body)});const j=await r.json();
    if(j.sent>0){b.textContent='Email sent ✓';say('Email sent: '+(j.subject||sn));}else{b.textContent=prev;b.disabled=false;say('Email nahi gaya'+(j.err?': '+j.err:j.error?': '+j.error:''));}}
   catch(e){b.textContent=prev;b.disabled=false;say('Email nahi gaya');}},true);
  mk('🔔 Send popup',async b=>{if(!ta.value.trim())return;b.disabled=true;
   try{await P.addNotice({title:s>=9?'How was your order?':sn,body:(o.order_no?o.order_no+' · ':'')+(o.item||'')+' — '+strip(ta.value).replace(/\s+/g,' ').slice(0,260),item:o.item,stage:s,order_no:o.order_no||'',url:B.url,rate:s>=9,at:new Date().toISOString(),seen:false});b.textContent='Popup sent ✓';say('Client ko popup chala gaya');}
   catch(e){b.disabled=false;say('Popup nahi gaya');}});
  mk('💬 WhatsApp',()=>{const ph=String(P.phone||'').replace(/[^0-9]/g,'').replace(/^(\d{10})$/,'91$1');window.open('https://wa.me/'+ph+'?text='+encodeURIComponent(ta.value),'_blank','noopener');});
  mk('Copy',async()=>{try{await navigator.clipboard.writeText(ta.value);say('Copied');}catch(e){ta.select();}});
  mk('Skip',()=>ov.remove());
  pn.appendChild(bar);
  pn.appendChild(h('Kuch bhi tab tak nahi jaata jab tak tum button na dabao.','font-size:11px;opacity:.55;margin-top:10px'));
  ov.appendChild(pn);ov.onclick=e=>{if(e.target===ov)ov.remove();};document.body.appendChild(ov);
 }catch(e){console.error('stage prompt',e);}};
})();
