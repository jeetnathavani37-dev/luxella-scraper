/* Luxella motion layer: progress hairline, FAB hide-on-scroll, momentum feel. Compositor-only (transform/opacity). */
(function(){
 if(window.__lxMotion)return;window.__lxMotion=1;
 var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
 var bar=document.createElement('div');bar.className='lxm-bar';bar.innerHTML='<i></i>';
 function mount(){if(!document.body)return setTimeout(mount,50);document.body.appendChild(bar);}mount();
 var tgt=null,last=0,raf=0,dirAcc=0,hid=false,idleT=0;
 function scroller(e){var t=e.target;if(t===document||t===document.documentElement||t===document.body)return document.scrollingElement;return t;}
 function frame(){raf=0;if(!tgt)return;var st=tgt.scrollTop,max=tgt.scrollHeight-tgt.clientHeight;
  var big=max>1200&&(tgt.id==='pane-deals'||tgt.classList.contains('cl-sc'));
  bar.classList.toggle('on',big&&st>40);
  if(big)bar.firstChild.style.transform='scaleX('+Math.min(1,Math.max(0,st/max)).toFixed(4)+')';
  var d=st-last;last=st;dirAcc=(dirAcc>0)===(d>0)?dirAcc+d:d;
  if(dirAcc>60&&st>200&&!hid){hid=true;document.body.classList.add('lxm-down');}
  else if((dirAcc<-40||st<120)&&hid){hid=false;document.body.classList.remove('lxm-down');}
  clearTimeout(idleT);idleT=setTimeout(function(){if(hid){hid=false;document.body.classList.remove('lxm-down');}},1400);}
 document.addEventListener('scroll',function(e){var s=scroller(e);if(!s||!s.scrollHeight)return;if(s!==tgt){
  if(!(s===document.scrollingElement||s.id==='pane-deals'||(s.classList&&s.classList.contains('cl-sc'))))return;tgt=s;last=s.scrollTop;}
  if(!raf)raf=requestAnimationFrame(frame);},{capture:true,passive:true});
 if(RM)return;
 /* gentle press feedback on cards */
 document.addEventListener('pointerdown',function(e){var c=e.target.closest&&e.target.closest('.cl-card,.dl-pc,.shp-c,.lk-c');if(!c)return;c.classList.add('lxm-press');var up=function(){c.classList.remove('lxm-press');removeEventListener('pointerup',up,true);removeEventListener('pointercancel',up,true);};addEventListener('pointerup',up,true);addEventListener('pointercancel',up,true);},{passive:true});
})();
