/* Luxella voice mode — push-to-talk (Gemini transcription), spoken replies, order cards, team chat.
   LxVoice.open({token, name, ask, onProof(item,url), onWa(text), onTeam(), onSetup(), setupLabel}) */
(function(){
if(window.LxVoice)return;
var API='https://qzripzgbstvxkfobzhyv.supabase.co/functions/v1/lx-voice';
var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
var SIL='data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';
var css=[
"@font-face{font-family:'Lx Playfair';font-style:normal;font-display:swap;src:url(/vendor/fonts/Playfair-Regular.ttf) format('truetype')}@font-face{font-family:'Lx Playfair';font-style:italic;font-display:swap;src:url(/vendor/fonts/Playfair-Italic.ttf) format('truetype')}",
'.lv-ov{position:fixed;inset:0;z-index:9998;display:flex;flex-direction:column;overflow:hidden;background:#050403;color:#F3ECDD;font-family:"Lux Text",system-ui,-apple-system,sans-serif;animation:lvIn .3s ease}',
'@keyframes lvIn{from{opacity:0}}',
'.lv-aur{position:absolute;left:-20%;right:-20%;bottom:-30%;height:75%;pointer-events:none;z-index:0;filter:blur(48px);opacity:calc(.55 + (var(--lv,1) - 1) * .9);transform:scaleY(calc(.8 + (var(--lv,1) - 1) * 1.2));transform-origin:50% 100%;transition:opacity .2s,transform .2s}',
'.lv-aur i{position:absolute;border-radius:50%;mix-blend-mode:screen;animation:lvDrift 9s ease-in-out infinite alternate}',
'.lv-aur i:nth-child(1){left:10%;bottom:0;width:55%;height:70%;background:radial-gradient(circle,#b8892b,transparent 65%)}',
'.lv-aur i:nth-child(2){left:40%;bottom:10%;width:50%;height:60%;background:radial-gradient(circle,#f1d58e,transparent 65%);animation-duration:11s;animation-delay:-3s}',
'.lv-aur i:nth-child(3){left:25%;bottom:-10%;width:60%;height:55%;background:radial-gradient(circle,#7a4a12,transparent 65%);animation-duration:13s;animation-delay:-6s}',
'@keyframes lvDrift{to{transform:translate(12%,-8%) scale(1.15)}}',
'.lv-ov.listen .lv-aur{--lvb:1}.lv-ov.idle .lv-aur{opacity:.42}.lv-ov.speak .lv-aur i{animation-duration:3.5s}',
'.lv-top,.lv-log,.lv-bot{position:relative;z-index:1}',
'.lv-state{font:600 9px "Lux Label",system-ui,sans-serif;letter-spacing:.3em;text-transform:uppercase;color:#C9A35E;display:inline-flex;align-items:center;gap:7px}.lv-state::before{content:"";width:6px;height:6px;border-radius:50%;background:#C9A35E;box-shadow:0 0 8px #e9c98a}.lv-ov.listen .lv-state::before{background:#ff6b5b;box-shadow:0 0 10px #ff6b5b}',
'.lv-top{display:flex;align-items:center;gap:10px;padding:calc(12px + env(safe-area-inset-top,0px)) 14px 8px}',
'.lv-ey{font:600 10px "Lux Label",system-ui,sans-serif;letter-spacing:.3em;color:#C9A35E;flex:1}',
'.lv-tabs{display:flex;padding:3px;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid rgba(233,201,138,.25)}',
'.lv-tab{border:0;background:none;color:#bfa978;border-radius:999px;padding:7px 12px;font:600 9.5px "Lux Label",system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase}',
'.lv-tab.on{background:linear-gradient(100deg,#b8892b,#f7e2a6 50%,#b8892b);color:#1a1208}',
'.lv-x{flex:none;width:36px;height:36px;border-radius:50%;border:1px solid rgba(233,201,138,.4);background:rgba(255,255,255,.03);color:#E9C98A;font:300 22px/1 sans-serif}',
'.lv-log{flex:1;overflow-y:auto;padding:8px 16px 12px;display:flex;flex-direction:column;gap:10px;-webkit-overflow-scrolling:touch}',
'.lv-m{max-width:92%;animation:lvUp .35s ease;white-space:pre-wrap}',
'@keyframes lvUp{from{opacity:0;transform:translateY(8px)}}',
'.lv-m.u{align-self:flex-end;text-align:right;font:400 14px/1.45 "Lux Text",system-ui,sans-serif;color:#bfa978;padding:4px 2px}.lv-m.u::before{content:"You";display:block;font:600 8.5px "Lux Label",system-ui,sans-serif;letter-spacing:.24em;text-transform:uppercase;color:#7d6c50;margin-bottom:3px}',
'.lv-m.a{align-self:flex-start;font:400 22px/1.4 "Lx Playfair",Georgia,serif;color:#F6EEDC;padding:2px 2px 6px}.lv-m.a::before{content:"Luxella";display:block;font:600 8.5px "Lux Label",system-ui,sans-serif;letter-spacing:.24em;text-transform:uppercase;color:#C9A35E;margin-bottom:6px}.lv-m.a .w{opacity:.18;transition:opacity .25s}.lv-m.a .w.on{opacity:1}.lv-log .lv-m.old{opacity:.45;font-size:16px}',
'.lv-m.dots{font-size:28px;color:#C9A35E;letter-spacing:.2em;animation:lvBlink 1.2s ease-in-out infinite}@keyframes lvBlink{50%{opacity:.35}}',
'.lv-act{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}',
'.lv-b{border:0;border-radius:999px;padding:9px 14px;background:linear-gradient(100deg,#b8892b,#f7e2a6 50%,#b8892b);color:#1a1208;font:600 10.5px "Lux Label",system-ui,sans-serif;letter-spacing:.08em;text-decoration:none;cursor:pointer}',
'.lv-cards.old{opacity:.45}.lv-cards{align-self:stretch;display:flex;gap:10px;overflow-x:auto;padding:2px 2px 6px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch}',
'.lv-card{flex:0 0 min(320px,88%);scroll-snap-align:start;border-radius:18px;padding:14px;background:linear-gradient(160deg,rgba(233,201,138,.13),rgba(255,255,255,.02) 55%),#100c07;border:1px solid rgba(233,201,138,.4);box-shadow:0 12px 26px rgba(0,0,0,.45);animation:lvUp .4s ease}',
'.lv-ch{display:flex;gap:12px;align-items:center}',
'.lv-ph{flex:none;width:64px;height:64px;border-radius:12px;overflow:hidden;background:radial-gradient(90% 70% at 50% 35%,#fbf5e8,#e6dac0);display:grid;place-items:center;font:italic 26px "Lx Playfair",Georgia,serif;color:#9a7330}',
'.lv-ph img{width:100%;height:100%;object-fit:contain;padding:4px;box-sizing:border-box}',
'.lv-br{font:600 8px "Lux Label",system-ui,sans-serif;letter-spacing:.22em;text-transform:uppercase;color:#C9A35E}',
'.lv-nm{margin-top:3px;font:italic 400 16px/1.25 "Lx Playfair",Georgia,serif;color:#F3ECDD;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
'.lv-prog{display:flex;gap:3px;margin:14px 0 6px}.lv-prog i{flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,.1)}.lv-prog i.d{background:linear-gradient(90deg,#b8892b,#f1d58e)}.lv-prog i.c{background:#f7e2a6;box-shadow:0 0 8px #e9c98a}',
'.lv-stg{display:flex;justify-content:space-between;gap:8px;font-size:12.5px;color:#EADBB8}.lv-stg b{font-weight:500}.lv-stg span{color:#bfa978;white-space:nowrap}.lv-stg span.late{color:#e8a27a}',
'.lv-kv{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}',
'.lv-pill{display:inline-flex;align-items:center;gap:5px;padding:6px 10px;border-radius:999px;border:1px solid rgba(233,201,138,.28);background:rgba(255,255,255,.03);font-size:11.5px;color:#d9cbb0}',
'.lv-pill.ok{border-color:rgba(120,200,140,.4);color:#9fdcb0}.lv-pill.due{border-color:rgba(232,162,122,.5);color:#e8a27a}',
'.lv-q{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;padding-top:10px;border-top:1px solid rgba(233,201,138,.14)}',
'.lv-qc{border:1px solid rgba(233,201,138,.35);background:rgba(233,201,138,.06);color:#EADBB8;border-radius:999px;padding:7px 11px;font-size:12px}',
'.lv-qc.g{border:0;background:linear-gradient(100deg,#b8892b,#f7e2a6 50%,#b8892b);color:#1a1208;font-weight:600}',
'.lv-hello{margin:auto 0;text-align:center;padding:0 6px}.lv-hello h2{margin:0 0 8px;font:italic 400 27px "Lx Playfair",Georgia,serif;color:#F1D58E}.lv-hello p{margin:0;color:#bfa978;font-size:14px}',
'.lv-sg{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:16px}.lv-c{border:1px solid rgba(233,201,138,.35);background:rgba(255,255,255,.04);color:#EADBB8;border-radius:999px;padding:9px 13px;font-size:13px}',
'.lv-bot{padding:4px 16px calc(14px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;align-items:center}',
'.lv-st{min-height:20px;margin-bottom:12px;text-align:center}',
'.lv-live{min-height:18px;margin:-4px 0 8px;color:#F1D58E;font-size:13.5px;text-align:center;max-width:90%}',
'.lv-row{display:flex;align-items:center;gap:22px}.lv-side{width:44px;height:44px;border-radius:50%;border:1px solid rgba(233,201,138,.35);background:rgba(255,255,255,.04);color:#E9C98A;font-size:17px;display:grid;place-items:center}',
'.lv-orb{position:relative;width:96px;height:96px;border-radius:50%;border:0;display:grid;place-items:center;color:#1a1208;background:radial-gradient(circle at 35% 30%,#fff3cf,#e9c98a 45%,#a8792a);box-shadow:0 18px 40px rgba(0,0,0,.6);touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;transition:transform .15s}',
'.lv-orb::before{content:"";position:absolute;inset:-12px;border-radius:50%;border:2px solid rgba(233,201,138,.35);transform:scale(var(--lv,1));transition:transform .08s}',
'.lv-orb::after{content:"";position:absolute;inset:-26px;border-radius:50%;background:radial-gradient(circle,rgba(233,201,138,.18),transparent 70%);transform:scale(var(--lv,1));transition:transform .08s;pointer-events:none}',
'.lv-orb.rec{transform:scale(1.08);background:radial-gradient(circle at 35% 30%,#fff7e0,#f1d58e 45%,#b8892b)}.lv-orb.think{animation:lvThink 1s ease-in-out infinite}.lv-orb.talk::before{animation:lvTalk .9s ease-in-out infinite}',
'@keyframes lvThink{50%{filter:brightness(.75)}}@keyframes lvTalk{50%{transform:scale(1.18)}}',
'.lv-hint{margin-top:22px;font:500 9.5px "Lux Label",system-ui,sans-serif;letter-spacing:.2em;color:#a8987e;text-transform:uppercase}',
'.lv-f{display:none;gap:8px;width:100%;max-width:520px;margin-top:12px}.lv-f.on{display:flex}.lv-f input{flex:1;min-width:0;border-radius:999px;border:1px solid rgba(233,201,138,.4);background:rgba(255,255,255,.05);color:#F3ECDD;padding:12px 16px;font-size:16px;outline:0}',
'.lv-setup{margin-top:8px;border:0;background:none;color:#C9A35E;font:600 9.5px "Lux Label",system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase}'
].join('');
function mk(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;}
var st0=document.createElement('style');st0.textContent=css;document.head.appendChild(st0);
var MIC='<svg viewBox="0 0 24 24" width="38" height="38"><rect x="9" y="3" width="6" height="11.5" rx="3" fill="currentColor"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
var STOPI='<svg viewBox="0 0 24 24" width="30" height="30"><rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor"/></svg>';
function inr(n){return '₹'+Math.round(Number(n)||0).toLocaleString('en-IN');}

function open(o){
 o=o||{};var token=o.token||'';
 var ov=mk('div','lv-ov idle'),aur=mk('div','lv-aur');aur.innerHTML='<i></i><i></i><i></i>';ov.appendChild(aur);var top=mk('div','lv-top');top.appendChild(mk('span','lv-ey','LUXELLA  ·  LIVE'));
 if(o.onTeam){var tabs=mk('div','lv-tabs'),t1=mk('button','lv-tab on','Ask AI'),t2=mk('button','lv-tab','Message team');t1.type=t2.type='button';tabs.appendChild(t1);tabs.appendChild(t2);top.appendChild(tabs);t2.onclick=function(){close();o.onTeam();};}
 var x=mk('button','lv-x','×');x.type='button';x.setAttribute('aria-label','Close');top.appendChild(x);ov.appendChild(top);
 var log=mk('div','lv-log');ov.appendChild(log);
 var hello=mk('div','lv-hello');hello.appendChild(mk('h2',null,'Hi'+(o.name?' '+o.name:'')+', ask me anything'));hello.appendChild(mk('p',null,'Hold the gold button and talk — English, Hindi or Hinglish.'));var sg=mk('div','lv-sg');
 ['Where are my orders?','Show my proof of purchase','What do I owe?','Mera Coach bag kab aayega?'].forEach(function(s){var b=mk('button','lv-c',s);b.type='button';b.onclick=function(){unlock();send({q:s});};sg.appendChild(b);});hello.appendChild(sg);log.appendChild(hello);
 var bot=mk('div','lv-bot'),st=mk('div','lv-st'),stl=mk('span','lv-state','Hold to talk'),live=mk('div','lv-live');st.appendChild(stl);bot.appendChild(st);bot.appendChild(live);
 var row=mk('div','lv-row'),kb=mk('button','lv-side','⌨');kb.type='button';kb.setAttribute('aria-label','Type instead');var orb=mk('button','lv-orb');orb.type='button';orb.innerHTML=MIC;orb.setAttribute('aria-label','Hold to talk');var mute=mk('button','lv-side','🔊');mute.type='button';mute.setAttribute('aria-label','Sound on or off');
 row.appendChild(kb);row.appendChild(orb);row.appendChild(mute);bot.appendChild(row);var hint=mk('div','lv-hint','Hold to talk · or tap, speak, tap again');bot.appendChild(hint);
 var f=mk('form','lv-f'),inp=mk('input');inp.placeholder='Type your question…';inp.setAttribute('enterkeyhint','send');var go=mk('button','lv-b','Send');go.type='submit';f.appendChild(inp);f.appendChild(go);bot.appendChild(f);
 if(o.onSetup){var su=mk('button','lv-setup',o.setupLabel||'Use with Siri / Bixby ›');su.type='button';su.onclick=function(){close();o.onSetup();};bot.appendChild(su);}
 ov.appendChild(bot);document.body.appendChild(ov);

 var canRec=!!(window.MediaRecorder&&navigator.mediaDevices&&navigator.mediaDevices.getUserMedia);
 var AI=canRec,TTS=true,busy=false,muted=false,last='',hist=[];
 var state='idle',stream=null,mr=null,chunks=[],sr=null,heard='',recStart=0,stopAsked=false,raf=0,actx=null,an=null;
 try{muted=localStorage.getItem('lv_mute')==='1';}catch(e){}mute.textContent=muted?'🔇':'🔊';
 mute.onclick=function(){muted=!muted;mute.textContent=muted?'🔇':'🔊';try{localStorage.setItem('lv_mute',muted?'1':'0');}catch(e){}if(muted)stopVoice();};
 kb.onclick=function(){f.classList.toggle('on');if(f.classList.contains('on'))inp.focus();};
 f.onsubmit=function(e){e.preventDefault();unlock();var v=inp.value.trim();inp.value='';inp.blur();if(v)send({q:v});};
 function close(){cancel();stopVoice();if(stream){stream.getTracks().forEach(function(t){t.stop();});stream=null;}if(actx)try{actx.close();}catch(e){}ov.remove();}
 x.onclick=close;
 // audio out
 var player=new Audio(),unlocked=false,sayN=0;player.setAttribute('playsinline','');
 function unlock(){if(unlocked)return;unlocked=true;try{player.src=SIL;var pp=player.play();if(pp&&pp.catch)pp.catch(function(){});}catch(e){}try{var u=new SpeechSynthesisUtterance(' ');u.volume=0;speechSynthesis.speak(u);}catch(e){}}
 function stopVoice(){sayN++;try{player.pause();}catch(e){}try{speechSynthesis.cancel();}catch(e){}orb.classList.remove('talk');}
 function pickVoice(){try{var vs=speechSynthesis.getVoices();return vs.find(function(v){return /en[-_]IN/i.test(v.lang);})||vs.find(function(v){return /hi[-_]IN/i.test(v.lang);})||null;}catch(e){return null;}}
 function say2(t){if(muted||!t||!window.speechSynthesis)return;try{speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(String(t).replace(/₹\s?([\d,]+)/g,'$1 rupees'));var v=pickVoice();if(v){u.voice=v;u.lang=v.lang;}else u.lang='en-IN';u.onstart=function(){orb.classList.add('talk');};u.onend=u.onerror=function(){orb.classList.remove('talk');};speechSynthesis.speak(u);}catch(e){}}
 function say(t){if(muted||!t)return;var my=++sayN;if(!TTS){say2(t);return;}var done=false;orb.classList.add('talk');
  var fb=setTimeout(function(){if(!done&&my===sayN){done=true;orb.classList.remove('talk');say2(t);}},10000);
  fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({t:token,say:t})}).then(function(r){return r.json();}).then(function(d){if(done||my!==sayN)return;done=true;clearTimeout(fb);if(!d||!d.audio){orb.classList.remove('talk');say2(t);return;}
   player.src='data:'+(d.mime||'audio/wav')+';base64,'+d.audio;player.onended=function(){orb.classList.remove('talk');};player.onerror=function(){orb.classList.remove('talk');};var pp=player.play();if(pp&&pp.catch)pp.catch(function(){orb.classList.remove('talk');say2(t);});
  }).catch(function(){if(!done&&my===sayN){done=true;clearTimeout(fb);orb.classList.remove('talk');say2(t);}});}
 // UI helpers
 function scroll(){log.scrollTop=log.scrollHeight;}
 function bubble(role,text){if(hello.parentNode)hello.remove();var m=mk('div','lv-m '+role,text);log.appendChild(m);scroll();return m;}
 function cardEl(c){var w=mk('div','lv-card'),h=mk('div','lv-ch'),ph=mk('div','lv-ph');if(c.img){var im=mk('img');im.src=c.img;im.alt='';im.onerror=function(){ph.textContent=(c.brand||'L').charAt(0);im.remove();};ph.appendChild(im);}else ph.textContent=(c.brand||'L').charAt(0);
  var tt=mk('div');tt.appendChild(mk('div','lv-br',(c.brand||'Luxella')+(c.order_no?'  ·  '+c.order_no:'')));tt.appendChild(mk('div','lv-nm',c.item));h.appendChild(ph);h.appendChild(tt);w.appendChild(h);
  var pg=mk('div','lv-prog');for(var i=1;i<=9;i++)pg.appendChild(mk('i',i<c.n?'d':(i===c.n?'c':'')));w.appendChild(pg);
  var sl=mk('div','lv-stg');sl.appendChild(mk('b',null,c.stage));var es=mk('span',c.late?'late':'',c.n>=9?'Delivered ✓':(c.late?'Running a little late':(c.eta?'ETA '+c.eta:'')));sl.appendChild(es);w.appendChild(sl);
  var kv=mk('div','lv-kv');if(c.amount)kv.appendChild(mk('span','lv-pill '+(c.paid?'ok':'due'),inr(c.amount)+(c.paid?' · Paid':' · Due')));if(c.ordered)kv.appendChild(mk('span','lv-pill','Ordered '+c.ordered));
  if(c.tracking){var tp=mk('button','lv-pill','📦 '+(c.courier?c.courier+' ':'')+c.tracking);tp.type='button';tp.onclick=function(){try{navigator.clipboard.writeText(c.tracking);tp.textContent='Copied ✓';}catch(e){}if(c.track_url)window.open(c.track_url,'_blank');};kv.appendChild(tp);}
  w.appendChild(kv);
  var q=mk('div','lv-q');var ask=function(lbl,qq,g){var b=mk('button','lv-qc'+(g?' g':''),lbl);b.type='button';b.onclick=function(){unlock();last=c.item;send({q:qq});};q.appendChild(b);};
  if(c.proof){var pb=mk('button','lv-qc g','◈ Proof of purchase');pb.type='button';pb.onclick=function(){if(o.onProof){if(o.onProof(c.item,'')!==false)close();}else send({q:'show proof of purchase for '+c.item});};q.appendChild(pb);}
  if(c.n<9)ask('When will it arrive?','When will my '+c.item+' arrive?');
  ask('Tracking','What is the tracking for my '+c.item+'?');
  if(!c.paid)ask('Pay','How much do I owe for '+c.item+'?');
  ask('Ask about this…','',false);q.lastChild.onclick=function(){last=c.item;f.classList.add('on');inp.placeholder='Ask about '+c.item.split(' ').slice(0,3).join(' ')+'…';inp.focus();};
  w.appendChild(q);return w;}

 function reveal(el,text,ms,done){el.textContent='';var ws=String(text).split(/(\s+)/),spans=[];ws.forEach(function(w){if(/^\s+$/.test(w)){el.appendChild(document.createTextNode(w));return;}var sp=mk('span','w',w);el.appendChild(sp);spans.push(sp);});var n=spans.length||1,step=Math.max(60,Math.min(420,ms/n)),i=0;(function tick(){if(i<spans.length){spans[i++].classList.add('on');scroll();setTimeout(tick,step);}else if(done)done();})();}
 function speakAndShow(el,text,d,after){var n=String(text).split(/\s+/).length;
  if(!muted&&d.audio){var my=++sayN;player.src='data:'+(d.amime||'audio/wav')+';base64,'+d.audio;var started=false;
   var go=function(){if(started)return;started=true;setSt('Speaking');orb.classList.add('talk');var dur=(isFinite(player.duration)&&player.duration>0?player.duration*1000:n*330);reveal(el,text,dur*0.92,after);};
   player.onplaying=go;player.onended=function(){orb.classList.remove('talk');if(my===sayN)setSt('Hold to talk · ask a follow-up');};player.onerror=function(){orb.classList.remove('talk');if(!started){started=true;reveal(el,text,n*260,after);say2(text);}};
   var pp=player.play();if(pp&&pp.catch)pp.catch(function(){if(!started){started=true;reveal(el,text,n*260,after);say2(text);}});setTimeout(function(){if(!started)go();},2500);return;}
  if(!muted&&TTS&&!d.audio){reveal(el,text,n*300,after);say2(text);return;}
  if(!muted)say2(text);reveal(el,text,n*170,after);}
 function cards(cs){if(!cs||!cs.length)return;var w=mk('div','lv-cards');cs.forEach(function(c){w.appendChild(cardEl(c));});log.appendChild(w);scroll();}
 function setSt(t){stl.textContent=t;var m=/Listening/i.test(t)?'listen':/Thinking|Starting/i.test(t)?'think':/Speaking/i.test(t)?'speak':'idle';ov.className='lv-ov '+m;}
 fetch(API+'?cap=1&t='+encodeURIComponent(token)).then(function(r){return r.json();}).then(function(d){TTS=!!(d&&d.tts);AI=!!(d&&d.ai)&&canRec;if(!AI&&!SR){hint.textContent='Type your question';f.classList.add('on');}}).catch(function(){});
 // recording
 function level(){if(!an)return;var a=new Uint8Array(an.fftSize);an.getByteTimeDomainData(a);var m=0;for(var i=0;i<a.length;i++){var d=Math.abs(a[i]-128);if(d>m)m=d;}var L=String(1+Math.min(.6,m/80));orb.style.setProperty('--lv',L);ov.style.setProperty('--lv',L);raf=requestAnimationFrame(level);}
 function getStream(){if(stream&&stream.active)return Promise.resolve(stream);return navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}}).then(function(s){stream=s;try{actx=new (window.AudioContext||window.webkitAudioContext)();var src=actx.createMediaStreamSource(s);an=actx.createAnalyser();an.fftSize=512;src.connect(an);}catch(e){}return s;});}
 function begin(){if(state!=='idle'||busy)return;stopVoice();heard='';live.textContent='';stopAsked=false;
  if(AI){state='arming';setSt('Starting mic…');getStream().then(function(s){if(state!=='arming')return;var mt=['audio/mp4','audio/webm;codecs=opus','audio/webm','audio/aac'].find(function(m){return MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(m);})||'';chunks=[];try{mr=new MediaRecorder(s,mt?{mimeType:mt}:undefined);}catch(e){mr=new MediaRecorder(s);}
     mr.ondataavailable=function(e){if(e.data&&e.data.size)chunks.push(e.data);};mr.onstop=onRecStop;mr.start(250);recStart=Date.now();state='rec';orb.classList.add('rec');orb.innerHTML=STOPI;setSt('Listening…');try{if(actx&&actx.state==='suspended')actx.resume();}catch(e){}level();if(stopAsked)finish();})
    .catch(function(){state='idle';setSt('Allow the microphone, then try again');});return;}
  if(SR){try{sr=new SR();}catch(e){return;}sr.lang='en-IN';sr.interimResults=true;sr.continuous=false;
   sr.onresult=function(e){var s='';for(var i=0;i<e.results.length;i++)s=e.results[i][0].transcript;var all='';for(var j=0;j<e.results.length;j++)all+=(e.results[j].isFinal?e.results[j][0].transcript+' ':'');heard=(all||s).trim()||s;live.textContent=heard;};
   sr.onerror=function(e){if(e&&e.error==='not-allowed')setSt('Allow the microphone to talk');};
   sr.onend=function(){var qq=(heard||'').trim();state='idle';sr=null;orb.classList.remove('rec');orb.innerHTML=MIC;live.textContent='';if(qq)send({q:qq});else setSt('Hold to talk');};
   try{sr.start();state='rec';recStart=Date.now();orb.classList.add('rec');orb.innerHTML=STOPI;setSt('Listening…');}catch(e){}}}
 function finish(){if(state==='arming'){stopAsked=true;return;}if(state!=='rec')return;state='stopping';cancelAnimationFrame(raf);orb.style.setProperty('--lv','1');ov.style.setProperty('--lv','1');orb.classList.remove('rec');orb.innerHTML=MIC;
  if(mr&&mr.state!=='inactive'){try{mr.requestData();}catch(e){}try{mr.stop();}catch(e){state='idle';}}else if(sr){try{sr.stop();}catch(e){}}else state='idle';}
 function cancel(){cancelAnimationFrame(raf);if(mr&&mr.state!=='inactive'){mr.onstop=null;try{mr.stop();}catch(e){}}if(sr){try{sr.abort();}catch(e){}}state='idle';}
 function onRecStop(){state='idle';var type=(mr&&mr.mimeType)||'audio/mp4';var blob=new Blob(chunks,{type:type});var dur=Date.now()-recStart;
  if(blob.size<600||dur<350){setSt('Hold the button while you speak');return;}
  var fr=new FileReader();fr.onload=function(){var b64=String(fr.result).split(',')[1]||'';send({audio:b64,mime:type});};fr.readAsDataURL(blob);}
 function send(p){if(busy)return;busy=true;[].forEach.call(log.querySelectorAll('.lv-m,.lv-cards'),function(m){m.classList.add('old');});var ub=bubble('u',p.q||'…');var th=bubble('a','• • •');th.classList.add('dots');setSt('Thinking…');orb.classList.add('think');
  var body={t:token,fmt:'json',last:last,hist:hist.slice(-6),speak:!muted&&TTS};for(var k in p)body[k]=p[k];
  var ctl=window.AbortController?new AbortController():null;var to=setTimeout(function(){if(ctl)ctl.abort();},30000);
  fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:ctl?ctl.signal:undefined}).then(function(r){return r.json();}).then(function(d){clearTimeout(to);busy=false;orb.classList.remove('think');th.remove();
   if(d.act==='noai'){AI=false;ub.remove();setSt('Hold to talk');return;}
   if(!p.q){if(d.heard)ub.textContent=d.heard;else ub.remove();}
   [].forEach.call(log.querySelectorAll('.lv-m'),function(m){m.classList.add('old');});var a=bubble('a','');if(d.item)last=d.item;hist.push({role:'u',text:p.q||d.heard||''},{role:'a',text:d.text||''});
   var acts=mk('div','lv-act');
   if(d.act==='proof'&&d.item){var pb=mk('button','lv-b','◈ View proof of purchase');pb.type='button';pb.onclick=function(){if(o.onProof){if(o.onProof(d.item,d.url)!==false)close();}else if(d.url)location.href=d.url;};acts.appendChild(pb);}
   if(d.act==='wa'){var wb=mk('button','lv-b',o.onTeam?'Message the Luxella team':'Message Luxella on WhatsApp');wb.type='button';wb.onclick=function(){if(o.onTeam){close();o.onTeam(p.q||d.heard||'');}else if(o.onWa)o.onWa(p.q||d.heard||'');};acts.appendChild(wb);}
   var txt=d.text||'Sorry, please try again.';speakAndShow(a,txt,d,function(){if(acts.childNodes.length)a.appendChild(acts);cards(d.cards);if(!(d.audio&&!muted))setSt('Hold to talk · ask a follow-up');});
   if(d.act==='proof'&&d.item&&o.onProof&&o.autoProof)setTimeout(function(){if(ov.isConnected){if(o.onProof(d.item,d.url)!==false)close();}},3500);
  }).catch(function(){clearTimeout(to);busy=false;orb.classList.remove('think');th.remove();if(!p.q)ub.remove();setSt('Connection slow — please try again');});}
 // press & hold, or tap to toggle
 var downAt=0,holding=false;
 orb.addEventListener('pointerdown',function(e){e.preventDefault();unlock();if(busy)return;
  if(state==='rec'||state==='arming'){finish();return;}
  downAt=Date.now();holding=true;begin();try{orb.setPointerCapture(e.pointerId);}catch(_){}});
 function up(){if(!holding)return;holding=false;if(Date.now()-downAt<400){if(state==='rec'||state==='arming')setSt('Listening… tap to send');return;}finish();}
 orb.addEventListener('pointerup',up);orb.addEventListener('pointercancel',up);orb.addEventListener('contextmenu',function(e){e.preventDefault();});
 if(o.ask){unlock();send({q:o.ask});}
 return {close:close,send:function(q){send({q:q});}};
}
window.LxVoice={open:open};
})();
