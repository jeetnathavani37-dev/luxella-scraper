(function(){
if(window.__inboxLoaded)return;window.__inboxLoaded=1;
const $=id=>document.getElementById(id);
const isOwner=()=>{try{return !!photos.canEdit;}catch(e){return false;}};
let mode='ai',msgs=[],rec=null,recChunks=[],recTimer=null,pending=[],voiceBlob=null;
function init(){
 const box=$('chat'),form=$('chat-form'),list=$('chat-msgs'),sug=$('chat-sug'),head=box&&box.querySelector('.ch');
 if(!box||!form||!list||box._inbox||isOwner())return;box._inbox=1;
 const tg=document.createElement('button');tg.type='button';tg.className='chip';tg.id='chat-mode-t';tg.textContent='Message Luxella';tg.style.marginLeft='auto';
 const nw=$('chat-new');if(nw){nw.style.marginLeft='0';head.insertBefore(tg,nw);}else head.appendChild(tg);
 const th=document.createElement('div');th.className='ci2';th.hidden=true;
 th.innerHTML='<div class="ci2-p" id="ib-prev"></div><div class="ci2-r"><textarea id="ib-t" rows="1" placeholder="Write to Luxella…"></textarea></div><div class="ci2-r"><label class="chip" title="Add photo">Photo<input id="ib-f" type="file" accept="image/*" multiple hidden></label><button class="chip" id="ib-mic" type="button">Voice</button><a class="chip" id="ib-wa" target="_blank" rel="noopener">WhatsApp</a><button class="btn" id="ib-send" type="button" style="margin-left:auto">Send</button></div>';
 form.parentNode.insertBefore(th,form.nextSibling);
 const wa=()=>{const p=(photos.contact&&photos.contact.phone?String(photos.contact.phone):'7896697800').replace(/[^0-9]/g,'');const ph=p.length===10?'91'+p:p;$('ib-wa').href='https://wa.me/'+ph+'?text='+encodeURIComponent('Hi Luxella, '+($('ib-t').value||''));};
 $('ib-t').addEventListener('input',wa);wa();
 function prev(){const p=$('ib-prev');p.textContent='';pending.forEach((f,i)=>{const s=document.createElement('span');s.className='chip';s.textContent=f.name.slice(0,16)+' ✕';s.onclick=()=>{pending.splice(i,1);prev();};p.appendChild(s);});if(voiceBlob){const s=document.createElement('span');s.className='chip';s.textContent='Voice note ✕';s.onclick=()=>{voiceBlob=null;prev();};p.appendChild(s);}}
 $('ib-f').addEventListener('change',e=>{[...e.target.files].forEach(f=>{if(pending.length<4)pending.push(f);});e.target.value='';prev();});
 $('ib-mic').addEventListener('click',async()=>{const b=$('ib-mic');
  if(rec){rec.stop();return;}
  try{const st=await navigator.mediaDevices.getUserMedia({audio:true});const mt=MediaRecorder.isTypeSupported('audio/webm')?'audio/webm':(MediaRecorder.isTypeSupported('audio/mp4')?'audio/mp4':'');rec=new MediaRecorder(st,mt?{mimeType:mt}:undefined);recChunks=[];let t0=Date.now();
   rec.ondataavailable=e=>{if(e.data.size)recChunks.push(e.data);};
   rec.onstop=()=>{clearInterval(recTimer);st.getTracks().forEach(t=>t.stop());const type=rec.mimeType||mt||'audio/webm';voiceBlob=new Blob(recChunks,{type});voiceBlob._ext=type.indexOf('mp4')>-1?'m4a':'webm';rec=null;b.textContent='Voice';b.classList.remove('rec');prev();};
   rec.start();b.classList.add('rec');recTimer=setInterval(()=>{const s=Math.floor((Date.now()-t0)/1000);b.textContent='Stop '+s+'s';if(s>=120)rec&&rec.stop();},500);
  }catch(e){alert('Microphone permission needed for voice notes.');}});
 $('ib-send').addEventListener('click',async()=>{const t=$('ib-t').value.trim();if(!t&&!pending.length&&!voiceBlob)return;const sb=$('ib-send');sb.disabled=true;sb.textContent='Sending…';
  try{const files=[];for(const f of pending){const a=await photos.assets.upload(f);files.push(a.url);}let voice='';if(voiceBlob){const f=new File([voiceBlob],'voice_'+Date.now()+'.'+voiceBlob._ext,{type:voiceBlob.type});const a=await photos.assets.upload(f);voice=a.url;}
   await photos.db.collection('case_msgs').add({case:'inbox',ref:'',text:t,files,voice,from:'client',at:new Date().toISOString()});
   $('ib-t').value='';pending=[];voiceBlob=null;prev();wa();
  }catch(e){alert('Could not send. Please try again.');}
  sb.disabled=false;sb.textContent='Send';});
 function render(){if(mode!=='msg')return;list.textContent='';if(!msgs.length){const m=document.createElement('div');m.className='m a';m.textContent='Message Luxella directly here. Add photos or a voice note. Luxella gets a notification and replies here.';list.appendChild(m);}
  msgs.forEach(x=>{const m=document.createElement('div');m.className='m '+(x.from==='client'?'u':'a');if(x.text){const p=document.createElement('div');p.textContent=x.text;m.appendChild(p);}(x.files||[]).forEach(u=>{const im=document.createElement('img');im.src=u;im.className='ibimg';im.onclick=()=>window.open(u,'_blank');m.appendChild(im);});if(x.voice){const a=document.createElement('audio');a.controls=true;a.src=x.voice;a.className='ibaud';m.appendChild(a);}const tm=document.createElement('div');tm.className='ibt';try{tm.textContent=new Date(x.at).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});}catch(e){}m.appendChild(tm);list.appendChild(m);});list.scrollTop=list.scrollHeight;}
 function setMode(m){mode=m;const msg=m==='msg';th.hidden=!msg;form.hidden=msg;sug.hidden=msg;tg.textContent=msg?'Ask assistant':'Message Luxella';const lb=$('chat-mode');if(msg){lb.textContent='Direct to Luxella';render();}else{lb.textContent=lb.dataset.v||'';list.textContent='';if(typeof chat!=='undefined'&&chat.msgs){const r=chat.msgs.slice();chat.msgs=[];r.forEach(x=>{});}}}
 tg.addEventListener('click',()=>{if(mode==='ai'){const lb=$('chat-mode');lb.dataset.v=lb.textContent;setMode('msg');}else{setMode('ai');const n=$('chat-new');if(n)n.click();}});
 photos.db.collection('case_msgs').onSnapshot(s=>{msgs=s.docs.filter(d=>d.exists).map(d=>d.data()).filter(x=>x&&x.at&&x.case==='inbox').sort((a,b)=>a.at<b.at?-1:1);render();},()=>{});
}
const iv=setInterval(()=>{try{if(photos&&photos.db&&$('chat-form')){clearInterval(iv);init();}}catch(e){}},500);

(function(){let t=setInterval(()=>{const p=document.getElementById('pane-help');if(!p)return;clearInterval(t);if(p.querySelector('.lx-guide'))return;const d=document.createElement('div');d.className='lx-guide';d.innerHTML='<span>New here? A 3-minute guide to your page.</span><a href="guide.html" target="_blank" rel="noopener">Open guide</a>';p.insertBefore(d,p.firstChild);},700);setTimeout(()=>clearInterval(t),30000);})();
})();
