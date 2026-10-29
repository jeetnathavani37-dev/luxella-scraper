/* Luxella voice mode — push-to-talk, spoken replies, live conversation.
   LxVoice.open({token, name, onProof(item,url), onWa(text), onSetup(), setupLabel}) */
(function(){
if(window.LxVoice)return;
var API='https://qzripzgbstvxkfobzhyv.supabase.co/functions/v1/lx-voice';
var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
var css='.lv-ov{position:fixed;inset:0;z-index:9998;display:flex;flex-direction:column;background:radial-gradient(120% 60% at 50% 100%,#2a1f0e 0%,#0b0906 55%,#060504 100%);color:#F3ECDD;font-family:"Lux Text",system-ui,-apple-system,sans-serif;animation:lvIn .3s ease}'+
'@keyframes lvIn{from{opacity:0}}'+
'.lv-top{display:flex;align-items:center;justify-content:space-between;padding:calc(14px + env(safe-area-inset-top,0px)) 16px 6px}'+
'.lv-ey{font:600 10px "Lux Label",system-ui,sans-serif;letter-spacing:.34em;color:#C9A35E}'+
'.lv-x{width:38px;height:38px;border-radius:50%;border:1px solid rgba(233,201,138,.4);background:rgba(255,255,255,.03);color:#E9C98A;font:300 24px/1 sans-serif}'+
'.lv-log{flex:1;overflow-y:auto;padding:8px 18px 12px;display:flex;flex-direction:column;gap:10px;-webkit-overflow-scrolling:touch}'+
'.lv-m{max-width:86%;padding:11px 14px;border-radius:18px;font-size:15.5px;line-height:1.45;animation:lvUp .3s ease}'+
'@keyframes lvUp{from{opacity:0;transform:translateY(8px)}}'+
'.lv-m.u{align-self:flex-end;background:rgba(233,201,138,.14);border:1px solid rgba(233,201,138,.3);color:#F1D58E;border-bottom-right-radius:6px}'+
'.lv-m.a{align-self:flex-start;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-bottom-left-radius:6px}'+
'.lv-m .lv-act{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}'+
'.lv-b{border:0;border-radius:999px;padding:9px 14px;background:linear-gradient(100deg,#b8892b,#f7e2a6 50%,#b8892b);color:#1a1208;font:600 11px "Lux Label",system-ui,sans-serif;letter-spacing:.08em;text-decoration:none;cursor:pointer}'+
'.lv-hello{margin:auto 0;text-align:center;padding:0 10px}.lv-hello h2{margin:0 0 8px;font:italic 400 28px "Lx Playfair",Georgia,serif;color:#F1D58E}.lv-hello p{margin:0;color:#bfa978;font-size:14px}'+
'.lv-sg{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:16px}.lv-c{border:1px solid rgba(233,201,138,.35);background:rgba(255,255,255,.04);color:#EADBB8;border-radius:999px;padding:9px 13px;font-size:13px}'+
'.lv-bot{padding:6px 16px calc(18px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;align-items:center}'+
'.lv-st{min-height:22px;margin-bottom:12px;font:italic 400 16px "Lx Playfair",Georgia,serif;color:#EADBB8;text-align:center}'+
'.lv-live{min-height:20px;margin:-6px 0 10px;color:#F1D58E;font-size:14px;text-align:center;max-width:90%}'+
'.lv-orb{position:relative;width:104px;height:104px;border-radius:50%;border:0;display:grid;place-items:center;color:#1a1208;background:radial-gradient(circle at 35% 30%,#fff3cf,#e9c98a 45%,#a8792a);box-shadow:0 18px 40px rgba(0,0,0,.6);touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;transition:transform .15s}'+
'.lv-orb::before{content:"";position:absolute;inset:-12px;border-radius:50%;border:2px solid rgba(233,201,138,.35);transform:scale(var(--lv,1));transition:transform .08s;opacity:.9}'+
'.lv-orb::after{content:"";position:absolute;inset:-26px;border-radius:50%;background:radial-gradient(circle,rgba(233,201,138,.18),transparent 70%);transform:scale(var(--lv,1));transition:transform .08s}'+
'.lv-orb.rec{transform:scale(1.08)}.lv-orb.think{animation:lvSpin 1.2s linear infinite}.lv-orb.talk::before{animation:lvTalk .9s ease-in-out infinite}'+
'@keyframes lvSpin{50%{filter:brightness(.8)}}@keyframes lvTalk{50%{transform:scale(1.18)}}'+
'.lv-row{display:flex;align-items:center;gap:22px}.lv-side{width:44px;height:44px;border-radius:50%;border:1px solid rgba(233,201,138,.35);background:rgba(255,255,255,.04);color:#E9C98A;font-size:17px;display:grid;place-items:center}'+
'.lv-hint{margin-top:26px;font:500 10px "Lux Label",system-ui,sans-serif;letter-spacing:.2em;color:#a8987e;text-transform:uppercase}'+
'.lv-f{display:none;gap:8px;width:100%;max-width:520px;margin-top:12px}.lv-f.on{display:flex}.lv-f input{flex:1;min-width:0;border-radius:999px;border:1px solid rgba(233,201,138,.4);background:rgba(255,255,255,.05);color:#F3ECDD;padding:12px 16px;font-size:15px;outline:0}'+
'.lv-setup{margin-top:10px;border:0;background:none;color:#C9A35E;font:600 10px "Lux Label",system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase}';
function mk(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;}
var st0=document.createElement('style');st0.textContent=css;document.head.appendChild(st0);
var MIC='<svg viewBox="0 0 24 24" width="40" height="40"><rect x="9" y="3" width="6" height="11.5" rx="3" fill="currentColor"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';

function open(o){
 o=o||{};var token=o.token||'';var ov=mk('div','lv-ov'),top=mk('div','lv-top'),x=mk('button','lv-x','×');x.type='button';top.appendChild(mk('span','lv-ey','HEY LUXELLA'));top.appendChild(x);ov.appendChild(top);
 var log=mk('div','lv-log');ov.appendChild(log);
 var hello=mk('div','lv-hello');hello.appendChild(mk('h2',null,'Hi'+(o.name?' '+o.name:'')+', ask me anything'));hello.appendChild(mk('p',null,'Hold the gold button and talk. Let go to send.'));var sg=mk('div','lv-sg');
 ['Where are my orders?','Show my proof of purchase','What do I owe?','Mera Coach bag kab aayega?'].forEach(function(s){var b=mk('button','lv-c',s);b.type='button';b.onclick=function(){unlock();send({q:s});};sg.appendChild(b);});hello.appendChild(sg);log.appendChild(hello);
 var bot=mk('div','lv-bot'),st=mk('div','lv-st','Hold to talk'),live=mk('div','lv-live');bot.appendChild(st);bot.appendChild(live);
 var row=mk('div','lv-row'),kb=mk('button','lv-side','⌨');kb.type='button';kb.setAttribute('aria-label','Type instead');var orb=mk('button','lv-orb');orb.type='button';orb.innerHTML=MIC;orb.setAttribute('aria-label','Hold to talk');var mute=mk('button','lv-side','🔊');mute.type='button';mute.setAttribute('aria-label','Sound on or off');
 row.appendChild(kb);row.appendChild(orb);row.appendChild(mute);bot.appendChild(row);var hint=mk('div','lv-hint','Hold to talk · tap to start / stop');bot.appendChild(hint);
 var f=mk('form','lv-f'),inp=mk('input');inp.placeholder='Type your question…';inp.setAttribute('enterkeyhint','send');var go=mk('button','lv-b','Ask');go.type='submit';f.appendChild(inp);f.appendChild(go);bot.appendChild(f);
 if(o.onSetup){var su=mk('button','lv-setup',o.setupLabel||'Use with Siri / Bixby ›');su.type='button';su.onclick=function(){close();o.onSetup();};bot.appendChild(su);}
 ov.appendChild(bot);document.body.appendChild(ov);
 var AI=false,busy=false,rec=null,stream=null,mr=null,chunks=[],sr=null,heard='',t0=0,mode='',muted=false,last='',hist=[],raf=0,actx=null,an=null;
 try{muted=localStorage.getItem('lv_mute')==='1';}catch(e){}mute.textContent=muted?'🔇':'🔊';
 mute.onclick=function(){muted=!muted;mute.textContent=muted?'🔇':'🔊';try{localStorage.setItem('lv_mute',muted?'1':'0');}catch(e){}if(muted)stopVoice();};
 kb.onclick=function(){f.classList.toggle('on');if(f.classList.contains('on'))inp.focus();};
 f.onsubmit=function(e){e.preventDefault();unlock();var v=inp.value.trim();inp.value='';if(v)send({q:v});};
 function close(){stopAll(true);stopVoice();if(stream){stream.getTracks().forEach(function(t){t.stop();});stream=null;}if(actx)try{actx.close();}catch(e){}ov.remove();}
 x.onclick=close;
 var unlocked=false,player=new Audio(),TTS=false,sayN=0;player.playsInline=true;var SIL='data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';function unlock(){if(unlocked)return;unlocked=true;try{player.src=SIL;var pp=player.play();if(pp&&pp.catch)pp.catch(function(){});}catch(e){}try{var u=new SpeechSynthesisUtterance(' ');u.volume=0;speechSynthesis.speak(u);}catch(e){}}
 function bubble(role,text){if(hello.parentNode)hello.remove();var m=mk('div','lv-m '+role,text);log.appendChild(m);log.scrollTop=log.scrollHeight;return m;}
 function pickVoice(){try{var vs=speechSynthesis.getVoices();return vs.find(function(v){return /en[-_]IN/i.test(v.lang)&&/female|Veena|Rishi|Isha|Neel|Google/i.test(v.name);})||vs.find(function(v){return /en[-_]IN/i.test(v.lang);})||vs.find(function(v){return /hi[-_]IN/i.test(v.lang);})||null;}catch(e){return null;}}
 function stopVoice(){sayN++;try{player.pause();}catch(e){}try{speechSynthesis.cancel();}catch(e){}orb.classList.remove('talk');}
 function say(t){if(muted||!t)return;var my=++sayN;if(TTS){var done=false;var fb=setTimeout(function(){if(!done&&my===sayN){done=true;say2(t);}},9000);orb.classList.add('talk');
   fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({t:token,say:t})}).then(function(r){return r.json();}).then(function(d){if(done||my!==sayN)return;done=true;clearTimeout(fb);if(!d||!d.audio){say2(t);return;}player.src='data:'+(d.mime||'audio/wav')+';base64,'+d.audio;player.onended=player.onerror=function(){orb.classList.remove('talk');};var pp=player.play();if(pp&&pp.catch)pp.catch(function(){orb.classList.remove('talk');say2(t);});}).catch(function(){if(!done&&my===sayN){done=true;clearTimeout(fb);say2(t);}});return;}
  say2(t);}
 function say2(t){if(muted||!t||!window.speechSynthesis)return;try{speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(String(t).replace(/₹\s?([\d,]+)/g,'$1 rupees'));var v=pickVoice();if(v){u.voice=v;u.lang=v.lang;}else u.lang='en-IN';u.rate=1.02;u.onstart=function(){orb.classList.add('talk');};u.onend=u.onerror=function(){orb.classList.remove('talk');};speechSynthesis.speak(u);}catch(e){}}
 function level(){if(!an)return;var a=new Uint8Array(an.fftSize);an.getByteTimeDomainData(a);var m=0;for(var i=0;i<a.length;i++){var d=Math.abs(a[i]-128);if(d>m)m=d;}orb.style.setProperty('--lv',String(1+Math.min(.6,m/90)));raf=requestAnimationFrame(level);}
 function setSt(t){st.textContent=t;}
 // capability: AI transcription available?
 fetch(API+'?cap=1&t='+encodeURIComponent(token)).then(function(r){return r.json();}).then(function(d){TTS=!!(d&&d.tts);AI=!!(d&&d.ai)&&!!window.MediaRecorder&&!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia);if(!AI&&!SR){hint.textContent='Type your question';f.classList.add('on');}}).catch(function(){});
 function startRec(){if(busy)return;stopVoice();heard='';live.textContent='';
  if(AI){mode='ai';var begin=function(s){stream=s;try{if(!actx){actx=new (window.AudioContext||window.webkitAudioContext)();var src=actx.createMediaStreamSource(s);an=actx.createAnalyser();an.fftSize=512;src.connect(an);}}catch(e){}
    var mt=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/aac'].find(function(m){return MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(m);})||'';chunks=[];mr=new MediaRecorder(s,mt?{mimeType:mt}:undefined);mr.ondataavailable=function(e){if(e.data&&e.data.size)chunks.push(e.data);};mr.onstop=onRecStop;mr.start();rec=true;orb.classList.add('rec');setSt('Listening…');level();};
   if(stream&&stream.active)begin(stream);else navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}}).then(begin).catch(function(){setSt('Allow the microphone to talk');});return;}
  if(SR){mode='sr';try{sr=new SR();}catch(e){return;}sr.lang='en-IN';sr.interimResults=true;sr.continuous=true;var fin='';
   sr.onresult=function(e){var s='';fin='';for(var i=0;i<e.results.length;i++){s+=e.results[i][0].transcript;if(e.results[i].isFinal)fin+=e.results[i][0].transcript;}heard=s;live.textContent=s;};
   sr.onerror=function(e){if(e&&e.error==='not-allowed')setSt('Allow the microphone to talk');};
   sr.onend=function(){orb.classList.remove('rec');var q=(heard||fin).trim();sr=null;rec=null;live.textContent='';if(q&&!busy)send({q:q});else if(!busy)setSt('Hold to talk');};
   try{sr.start();rec=true;orb.classList.add('rec');setSt('Listening…');}catch(e){}}}
 function stopRec(){if(!rec)return;cancelAnimationFrame(raf);orb.style.setProperty('--lv','1');orb.classList.remove('rec');if(mode==='ai'&&mr&&mr.state!=='inactive'){try{mr.stop();}catch(e){}}else if(sr){try{sr.stop();}catch(e){}}rec=null;}
 function stopAll(abort){cancelAnimationFrame(raf);if(mr&&mr.state!=='inactive'){mr.onstop=null;try{mr.stop();}catch(e){}}if(sr){try{sr.abort();}catch(e){}}rec=null;}
 function onRecStop(){var type=(mr&&mr.mimeType)||'audio/webm';var blob=new Blob(chunks,{type:type});if(blob.size<1500||Date.now()-t0<450){setSt('Hold a little longer and speak');return;}
  var fr=new FileReader();fr.onload=function(){var b64=String(fr.result).split(',')[1]||'';send({audio:b64,mime:type});};fr.readAsDataURL(blob);}
 function send(p){if(busy)return;busy=true;var ub=null;if(p.q)ub=bubble('u',p.q);else ub=bubble('u','…');setSt('Thinking…');orb.classList.add('think');
  var body={t:token,fmt:'json',last:last,hist:hist.slice(-6)};for(var k in p)body[k]=p[k];
  fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json();}).then(function(d){busy=false;orb.classList.remove('think');
   if(d.act==='noai'){AI=false;ub.remove();setSt('Hold to talk');return;}
   if(!p.q){if(d.heard)ub.textContent=d.heard;else ub.remove();}
   var a=bubble('a',d.text||'Sorry, please try again.');if(d.item)last=d.item;hist.push({role:'u',text:p.q||d.heard||''},{role:'a',text:d.text||''});
   var acts=mk('div','lv-act');
   if(d.act==='proof'&&(d.url||d.item)){var pb=mk('button','lv-b','◈ View proof of purchase');pb.type='button';pb.onclick=function(){if(o.onProof){if(o.onProof(d.item,d.url)!==false)close();}else location.href=d.url;};acts.appendChild(pb);if(o.onProof&&o.autoProof)setTimeout(function(){if(ov.isConnected){if(o.onProof(d.item,d.url)!==false)close();}},1800);}
   if(d.act==='wa'){var wb=mk('button','lv-b','Message Luxella on WhatsApp');wb.type='button';wb.onclick=function(){if(o.onWa)o.onWa(p.q||d.heard||'');};acts.appendChild(wb);}
   if(acts.childNodes.length)a.appendChild(acts);
   setSt('Hold to talk');say(d.text||'');
  }).catch(function(){busy=false;orb.classList.remove('think');ub.remove();setSt('No connection, try again');});}
 // press & hold, or tap to toggle
 var downAt=0,holding=false,toggled=false;
 orb.addEventListener('pointerdown',function(e){e.preventDefault();unlock();if(busy)return;if(rec&&toggled){toggled=false;stopRec();return;}downAt=Date.now();t0=downAt;holding=true;startRec();try{orb.setPointerCapture(e.pointerId);}catch(_){}});
 var up=function(){if(!holding)return;holding=false;if(Date.now()-downAt<350){toggled=true;setSt('Listening… tap to send');return;}stopRec();};
 orb.addEventListener('pointerup',up);orb.addEventListener('pointercancel',up);orb.addEventListener('contextmenu',function(e){e.preventDefault();});
 if(o.ask){unlock();send({q:o.ask});}
 return {close:close,send:function(q){send({q:q});}};
}
window.LxVoice={open:open};
})();
