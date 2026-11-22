/* Luxella · Black Friday Edit — mounts inside The Edit pane (owner view). */
(function(){
 if(window.__lxBF)return;window.__lxBF=1;
 var WA='918724079056',PAGE=48,SB='https://qzripzgbstvxkfobzhyv.supabase.co',AK='sb_publishable_-EA-q_dacUuWovbrCW5XVw_pPZ2vK_O',BIN='https://raw.githubusercontent.com/jeetnathavani37-dev/luxella-scraper/main/bf/bf.bin';
 var CSS='#bf{margin-bottom:18px}#bf h2{margin-bottom:4px}.bf-row{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.bf-chip{border:1px solid rgba(198,166,100,.35);background:transparent;color:#cfc5b2;border-radius:999px;padding:7px 14px;font:500 12px/1 inherit;letter-spacing:.06em;cursor:pointer}.bf-chip.on{background:#C6A664;color:#0a0a0a;border-color:#C6A664}.bf-q{width:100%;box-sizing:border-box;background:rgba(255,255,255,.04);border:1px solid rgba(198,166,100,.25);border-radius:10px;color:#f3eee6;padding:10px 12px;font-size:14px}.bf-g{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:6px}@media(min-width:720px){.bf-g{grid-template-columns:repeat(4,1fr)}}.bf-c{display:flex;flex-direction:column;text-decoration:none;color:inherit;border:1px solid rgba(198,166,100,.18);border-radius:12px;overflow:hidden;background:rgba(255,255,255,.02)}.bf-im{aspect-ratio:1/1;background:#f1f1f1;display:flex;align-items:center;justify-content:center}.bf-im img{width:100%;height:100%;object-fit:contain}.bf-b{padding:9px 10px 11px}.bf-n{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#d8d1c3;line-height:1.4;min-height:31px}.bf-p{display:flex;gap:6px;align-items:baseline;margin-top:5px;flex-wrap:wrap}.bf-p b{font-size:16px;color:#E2BE6A;font-weight:600}.bf-p span{font-size:10px;letter-spacing:.06em;color:#a79f90;text-transform:uppercase}.bf-r{font-size:9px;letter-spacing:.14em;color:#6f685d;margin-top:5px}.bf-m{margin:16px auto 0;display:block}.bf-cnt{font-size:12px;color:#8f877a;margin:2px 0 8px}';
 var CATS={};var D=null,st={b:'c',g:'w',c:0,q:'',n:PAGE};
 function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;}
 function inr(n){return '\u20b9'+Number(n).toLocaleString('en-IN');}
 function img(i){var p=i.split('~');if(p.length==1)return 'https://images.coach.com/is/image/Coach/'+i+'_a0?wid=420&hei=420&fmt=jpeg';return 'https://assets.michaelkors.com/transform/ECOM_Image_Medium/'+p[1]+'/'+p[0]+'-'+p[2]+'_1-tif';}
 function own(){try{return !!(window.lx&&window.lx.isOwner&&window.lx.isOwner());}catch(e){return false;}}
 function hex(h){var u=new Uint8Array(h.length/2);for(var i=0;i<u.length;i++)u[i]=parseInt(h.substr(i*2,2),16);return u;}
 function decode(){return window.lx.authToken().then(function(tok){
   return fetch(SB+'/rest/v1/lx_bf_key?select=k&limit=1',{headers:{apikey:AK,Authorization:'Bearer '+tok}}).then(function(r){return r.json();}).then(function(j){
    var kh=j&&j[0]&&j[0].k;if(!kh)throw 0;
    return fetch(BIN).then(function(r){return r.arrayBuffer();}).then(function(buf){var u=new Uint8Array(buf);
     return crypto.subtle.importKey('raw',hex(kh),'AES-GCM',false,['decrypt']).then(function(key){
      return crypto.subtle.decrypt({name:'AES-GCM',iv:u.slice(0,12)},key,u.slice(12));}).then(function(pt){
      return new Response(new Blob([pt]).stream().pipeThrough(new DecompressionStream('gzip'))).json();});});});});}
 function mount(){
  var pane=document.getElementById('pane-deals');if(!pane||document.getElementById('bf'))return;
  var s=document.createElement('style');s.textContent=CSS;document.head.appendChild(s);
  var sec=el('section','card');sec.id='bf';
  sec.appendChild(el('h2',null,'Black Friday Edit'));
  sec.appendChild(el('p','note','Curated Black Friday pieces. Prices in Indian Rupees, valid until 30 November 2026. Tap a piece to enquire.'));
  var br=el('div','bf-row'),gr=el('div','bf-row'),cr=el('div','bf-row'),qi=el('input','bf-q');qi.placeholder='Search pieces';qi.type='search';
  var cnt=el('div','bf-cnt'),grid=el('div','bf-g'),more=el('button','bf-chip bf-m','Show more');
  sec.appendChild(br);sec.appendChild(gr);sec.appendChild(qi);sec.appendChild(cr);sec.appendChild(cnt);sec.appendChild(grid);sec.appendChild(more);
  pane.insertBefore(sec,pane.firstChild);
  D.forEach(function(r){CATS[r[0]+r[1]+r[2]]=r[3];});
  function chip(p,t,on,f){var b=el('button','bf-chip'+(on?' on':''),t);b.onclick=f;p.appendChild(b);}
  function render(full){
   br.innerHTML='';gr.innerHTML='';cr.innerHTML='';
   chip(br,'Coach',st.b=='c',function(){st.b='c';st.c=0;st.n=PAGE;render();});chip(br,'Michael Kors',st.b=='m',function(){st.b='m';st.c=0;st.n=PAGE;render();});
   chip(gr,'Women',st.g=='w',function(){st.g='w';st.c=0;st.n=PAGE;render();});chip(gr,'Men',st.g=='m',function(){st.g='m';st.c=0;st.n=PAGE;render();});
   var base=D.filter(function(r){return r[0]==st.b&&r[1]==st.g;});var cs={};base.forEach(function(r){cs[r[2]]=r[3];});
   chip(cr,'All',!st.c,function(){st.c=0;st.n=PAGE;render();});Object.keys(cs).forEach(function(k){chip(cr,cs[k],st.c==k,function(){st.c=+k;st.n=PAGE;render();});});
   var q=st.q.toLowerCase();var list=base.filter(function(r){return(!st.c||r[2]==st.c)&&(!q||(r[5]+' '+r[4]).toLowerCase().indexOf(q)>-1);});
   cnt.textContent=list.length+' pieces';grid.innerHTML='';
   list.slice(0,st.n).forEach(function(r){
    var a=el('a','bf-c');a.target='_blank';a.rel='noopener';
    var pr=r[7]?r[7].map(function(t){return t[0]+' '+t[1];}).join(' | '):inr(r[6]);
    a.href='https://wa.me/'+WA+'?text='+encodeURIComponent('Hi Luxella, I would like to enquire about '+r[5]+' ('+r[4]+') from the Black Friday Edit.');
    var im=el('div','bf-im'),i=document.createElement('img');i.loading='lazy';i.referrerPolicy='no-referrer';i.alt=r[5];i.src=img(r[8]);im.appendChild(i);a.appendChild(im);
    var b=el('div','bf-b');b.appendChild(el('div','bf-n',r[5]));
    if(r[7]){r[7].forEach(function(t){var p=el('div','bf-p');p.appendChild(el('b',null,inr(t[0])));p.appendChild(el('span',null,t[1]));b.appendChild(p);});}
    else{var p=el('div','bf-p');p.appendChild(el('b',null,inr(r[6])));b.appendChild(p);}
    b.appendChild(el('div','bf-r',r[4]));a.appendChild(b);grid.appendChild(a);});
   more.style.display=list.length>st.n?'block':'none';
  }
  more.onclick=function(){st.n+=PAGE;render();};
  var t;qi.oninput=function(){clearTimeout(t);t=setTimeout(function(){st.q=qi.value;st.n=PAGE;render();},200);};
  render();
 }
 var tries=0;(function tick(){
  if(own()){if(!D){try{decode().then(function(d){D=d;mount();}).catch(function(){});}catch(e){}D=D||null;}return;}
  if(++tries<240)setTimeout(tick,1000);
 })();
})();
