/* GLØD Nordisk Skønhedsklinik – interaktion og animation (kræver GSAP + ScrollTrigger, indlæst i index.html) */
(function(){
  var BOOK='https://gloed-nordisk-skoenhedsklinik.planway.com/';
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var G=window.gsap&&!reduce?window.gsap:null;
  if(G&&window.ScrollTrigger)G.registerPlugin(ScrollTrigger);
  var $=function(s,c){return (c||document).querySelector(s)},$$=function(s,c){return [].slice.call((c||document).querySelectorAll(s))};

  // Billeder der ikke kan hentes, skjules (fladen bagved bliver stående)
  $$('.ph img').forEach(function(i){function h(){i.style.visibility='hidden'}if(i.complete&&!i.naturalWidth)h();i.addEventListener('error',h)});

  // ---------- Header: skjul ved scroll ned, vis ved scroll op ----------
  var top=$('#top'),dock=$('#dock'),fab=$('#fab'),lastY=0;
  function onScroll(){var y=scrollY;top.classList.toggle('solid',y>20);top.classList.toggle('hide',y>lastY&&y>400);
    fab.classList.toggle('show',y>innerHeight*.8);
    var c=$('#kontakt').getBoundingClientRect();dock.classList.toggle('away',c.top<innerHeight*.6&&c.bottom>0);lastY=y;}
  addEventListener('scroll',onScroll,{passive:true});onScroll();

  // ---------- Menu ----------
  var d=$('#drawer'),mb=$('#menuBtn');
  function setMenu(o){d.classList.toggle('open',o);d.setAttribute('aria-hidden',!o);mb.setAttribute('aria-expanded',o);document.body.style.overflow=o?'hidden':'';
    if(o&&G)G.from($$('nav a',d),{y:40,opacity:0,stagger:.07,duration:.7,delay:.2,ease:'power3.out'});}
  mb.addEventListener('click',function(){setMenu(true)});$('#closeBtn').addEventListener('click',function(){setMenu(false)});
  $$('a',d).forEach(function(a){a.addEventListener('click',function(){setMenu(false)})});
  addEventListener('keydown',function(e){if(e.key==='Escape')setMenu(false)});

  // ---------- Glød-markør og magnetiske knapper (PC) ----------
  var cur=$('#cursor');
  if(matchMedia('(hover:hover) and (pointer:fine)').matches&&!reduce){
    var cx=innerWidth/2,cy=innerHeight/2,tx=cx,ty=cy;
    addEventListener('pointermove',function(e){tx=e.clientX;ty=e.clientY});
    (function loop(){cx+=(tx-cx)*.12;cy+=(ty-cy)*.12;cur.style.transform='translate('+cx+'px,'+cy+'px)';requestAnimationFrame(loop)})();
    $$('.magnetic').forEach(function(b){
      b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;b.style.transform='translate('+x*.25+'px,'+y*.35+'px)';b.style.setProperty('--bx',(e.clientX-r.left)+'px');b.style.setProperty('--by',(e.clientY-r.top)+'px')});
      b.addEventListener('pointerleave',function(){b.style.transform=''});
    });
  }
  $$('.card').forEach(function(c){c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();c.style.setProperty('--cx',(e.clientX-r.left)+'px');c.style.setProperty('--cy',(e.clientY-r.top)+'px')})});

  // ---------- Faner (starter på Hår) ----------
  var tabs=$$('.tab'),ind=$('#tabInd');
  function moveInd(t){ind.style.width=t.offsetWidth+'px';ind.style.transform='translateX('+t.offsetLeft+'px)';}
  function select(key,scroll){
    var t=$('#t-'+key);if(!t)return;
    tabs.forEach(function(x){var on=x===t;x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1;$('#'+x.getAttribute('aria-controls')).hidden=!on});
    moveInd(t);t.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});
    var p=$('#p-'+key);buildDots(p);
    if(scroll){var y=p.getBoundingClientRect().top+scrollY-150;scrollTo({top:y,behavior:reduce?'auto':'smooth'})}
    if(G){G.fromTo($('.panel-head .ph',p),{clipPath:'inset(100% 0 0 0)'},{clipPath:'inset(0% 0 0 0)',duration:1.1,ease:'power4.out'});
      G.fromTo($('.panel-head h3',p),{y:40,opacity:0},{y:0,opacity:1,duration:.9,ease:'power3.out',delay:.1});
      G.fromTo($$('.card',p),{y:50,opacity:0},{y:0,opacity:1,duration:.8,stagger:.08,ease:'power3.out',delay:.2});}
    if(window.ScrollTrigger)ScrollTrigger.refresh();
  }
  tabs.forEach(function(t,i){t.addEventListener('click',function(){select(t.id.slice(2))});
    t.addEventListener('keydown',function(e){var k=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(k){var n=tabs[(i+k+tabs.length)%tabs.length];n.focus();select(n.id.slice(2))}})});
  $$('[data-next]').forEach(function(b){b.addEventListener('click',function(){select(b.dataset.next,true)})});
  addEventListener('resize',function(){moveInd($('.tab[aria-selected="true"]'))});
  if(document.fonts)document.fonts.ready.then(function(){moveInd($('.tab[aria-selected="true"]'))});
  moveInd(tabs[0]);

  // Swipe-prikker
  function buildDots(p){var g=$('.cards',p),dots=$('.sdots',p);if(!g||!dots)return;var n=g.children.length;dots.innerHTML=new Array(n+1).join('<i></i>');
    function upd(){var w=(g.children[0].offsetWidth+12)||1,i=Math.min(n-1,Math.round(g.scrollLeft/w));[].forEach.call(dots.children,function(dd,k){dd.classList.toggle('on',k===i)})}
    if(!g._b){g.addEventListener('scroll',upd,{passive:true});g._b=1}upd();}
  buildDots($('#p-haar'));

  // ---------- Behandlingsguide ----------
  var IMG='https://images.unsplash.com/photo-';
  var LOCAL={"1508978644997-53cc5bfb8a03": "forside-portraet", "1706795033849-7ca391f007c5": "ritual-haandklaeder", "1522337360788-8b13dee7a37e": "haar-bagfra", "1602549179763-ce6c9df961b7": "haar-glans", "1734111719430-fe4a3973f8af": "haar-rundboerste", "1560264641-1b5191cc63e2": "haar-kroeller", "1639629509821-c54cdd984227": "vipper-1", "1683719312734-e31de63957ab": "vipper-2", "1516220362602-dba5272034e7": "bryn-1", "1696236537686-214907dfcd9a": "bryn-2", "1570172619644-dfd03ed5d881": "ansigtsbehandling", "1683138767595-7e2a46dfde54": "plante-lys", "1546387903-6d82d96ccca6": "eukalyptus", "1695527081827-fdbc4e77be9b": "behandlingsrum", "1580618672591-eb180b1a973f": "frisoer", "1672719699796-ef70ba746ca8": "portraet-langt-haar"};
  var R={botox:['Organic Botox Repair','fra 1.295 kr.','Holder 2–3 mdr.','Dybdevirkende reparation, der genopbygger håret og giver intens glans.','c-botox','haar','1602549179763-ce6c9df961b7'],
    protein:['Nordic Protein Strength','fra 1.395 kr.','Holder 5–8 mdr.','Proteinbaseret styrke og fugt, der reducerer knæk.','c-protein','haar','1734111719430-fe4a3973f8af'],
    nano:['Nutrient Nanoplastia','fra 1.495 kr.','Holder 6–12 mdr.','Plejende, varig udglatning. Silkeblødt og medgørligt hår.','c-nano','haar','1560264641-1b5191cc63e2'],
    llc:['Lash Lift Complete','549 kr.','Inkl. farve og keratinkur','Løftede, fyldige vipper med hybrid tint-farve.','c-llc','vipper','1683719312734-e31de63957ab'],
    lln:['Lash Lift Natural','499 kr.','Inkl. keratinkur','Løftede, sunde vipper uden farve.','c-lln','vipper','1639629509821-c54cdd984227'],
    blc:['Brow Lamination Complete','599 kr.','Inkl. farve og keratinkur','Mapping, lamination, farve og afblegning med halal brows-teknikken.','c-blc','vipper','1516220362602-dba5272034e7'],
    bln:['Brow Lamination Natural','499 kr.','Inkl. keratinkur','Velformede, plejede bryn uden farve.','c-bln','vipper','1696236537686-214907dfcd9a'],
    pc:['Lash og Brow Complete','999 kr.','Spar 149 kr.','Lash Lift Complete og Brow Lamination Complete i én behandling.','c-pc','vipper','1683719312734-e31de63957ab'],
    pn:['Lash og Brow Natural','899 kr.','Spar 99 kr.','Lash Lift Natural og Brow Lamination Natural i én behandling.','c-pn','vipper','1639629509821-c54cdd984227']};
  var Q={start:['Hvad vil du gerne pleje?',[['Mit hår','Fra 1.295 kr.','haar'],['Mine vipper','Fra 499 kr.','vip'],['Mine bryn','Fra 499 kr.','bryn'],['Vipper og bryn','Fra 899 kr.','begge']]],
    haar:['Hvad drømmer du om?',[['Glans og reparation','Efter farve eller skader','=botox'],['Styrke og fugt','Til tørt hår','=protein'],['Glat og medgørligt','Til kruset hår','=nano']]],
    vip:['Med eller uden farve?',[['Med farve','Mørkere og mere markerede','=llc'],['Helt naturligt','Kun løft og pleje','=lln']]],
    bryn:['Med eller uden farve?',[['Med farve og afblegning','Halal brows','=blc'],['Helt naturligt','Kun lamination og pleje','=bln']]],
    begge:['Med eller uden farve?',[['Med farve','Complete-pakken','=pc'],['Helt naturligt','Natural-pakken','=pn']]]};
  var gb=$('#gBody'),gd=$('#gDots');
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
  function dots(n){[].forEach.call(gd.children,function(x,i){x.classList.toggle('on',i<=n)})}
  function anim(){if(G)G.from(gb.firstChild.children,{y:24,opacity:0,stagger:.06,duration:.6,ease:'power3.out'})}
  function step(k,depth){var s=Q[k];dots(depth);
    gb.innerHTML='<div class="gstep"><h3>'+esc(s[0])+'</h3><div class="opts">'+s[1].map(function(o){return '<button class="opt" type="button" data-go="'+o[2]+'"><span>'+esc(o[0])+'</span><small>'+esc(o[1])+'</small></button>'}).join('')+'</div>'+(depth?'<button class="linkbtn" type="button" data-go="start">Start forfra</button>':'')+'</div>';anim();}
  function result(k){var r=R[k];dots(2);
    gb.innerHTML='<div class="gstep"><p class="caps">Vi anbefaler</p><div class="result"><div class="ph rimg"><img src="img/fotos/'+LOCAL[r[6]]+'.jpg" data-fallback="'+IMG+r[6]+'?auto=format&fit=crop&w=300&h=380&q=70" onerror="if(this.src.indexOf(\'unsplash\')<0)this.src=this.dataset.fallback" alt=""></div><h4>'+esc(r[0])+'</h4><p>'+esc(r[3])+'</p><p class="rp">'+esc(r[1])+' <span class="caps" style="font-size:.66rem;color:inherit;opacity:.8">· '+esc(r[2])+'</span></p><div class="row"><a class="btn btn-primary" href="'+BOOK+'" target="_blank" rel="noopener">Book nu</a><button class="btn btn-ghost" type="button" data-show="'+r[4]+'" data-tab="'+r[5]+'">Se detaljer</button></div></div><button class="linkbtn" type="button" data-go="start">Start forfra</button></div>';anim();}
  gb.addEventListener('click',function(e){var b=e.target.closest('[data-go],[data-show]');if(!b)return;
    if(b.dataset.show){select(b.dataset.tab);var c=$('#'+b.dataset.show);setTimeout(function(){c.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center',inline:'center'});c.classList.remove('flash');void c.offsetWidth;c.classList.add('flash')},120);return;}
    var g=b.dataset.go;if(g.charAt(0)==='=')result(g.slice(1));else step(g,g==='start'?0:1);});
  step('start',0);

  // "Få besked" udfylder emnet
  $$('[data-interest]').forEach(function(a){a.addEventListener('click',function(){var s=$('#f-emne');[].forEach.call(s.options,function(o){if(o.text===a.dataset.interest)s.value=o.text});$('#f-news').checked=true})});

  // ---------- Åbningstider ----------
  try{var now=new Date(new Date().toLocaleString('en-US',{timeZone:'Europe/Copenhagen'})),day=now.getDay(),h=now.getHours()+now.getMinutes()/60,H={0:null,1:[9,14],2:[9,20],3:[9,20],4:[9,20],5:[9,20],6:[9,16]};
    $$('.hours tr').forEach(function(r){if(r.dataset.d.split(' ').indexOf(String(day))>-1)r.classList.add('today')});
    var t=H[day],el=$('#openNow');if(t&&h>=t[0]&&h<t[1]){el.classList.add('on');el.lastChild.textContent='Åbent nu · lukker kl. '+t[1]+'.00'}else el.lastChild.textContent='Lukket lige nu';}catch(e){}

  // ---------- Kopiér mail og formular ----------
  $('#copyMail').addEventListener('click',function(){var b=this;try{navigator.clipboard.writeText('info@glodnordic.dk').then(function(){b.textContent='Kopieret'},function(){})}catch(e){}});
  $('#kontaktForm').addEventListener('submit',function(e){e.preventDefault();var f=e.target,m=$('#formMsg'),miss=[];
    if(!f.navn.value.trim())miss.push('navn');if(!/^\S+@\S+\.\S+$/.test(f.email.value))miss.push('en gyldig e-mail');if(!f.besked.value.trim())miss.push('en besked');
    m.hidden=false;if(miss.length){m.textContent='Udfyld venligst '+miss.join(', ')+'.';return}
    var body=f.besked.value+'\n\n'+f.navn.value+' ('+f.email.value+')'+(f.nyheder.checked?'\nJa tak til nyheder.':'');
    m.textContent='Tak, '+f.navn.value.trim().split(' ')[0]+'. Din mailapp åbner nu med beskeden klar til at sende. Åbner den ikke, så skriv til info@glodnordic.dk.';
    try{location.href='mailto:info@glodnordic.dk?subject='+encodeURIComponent('GLØD: '+f.emne.value)+'&body='+encodeURIComponent(body)}catch(err){}});

  // ---------- GSAP: indlæsning, parallax, ticker, ritual, citat ----------
  var track=$('#tick');
  if(!G){track.style.animation='none';return;}
  // Indlæsning
  var tl=G.timeline({defaults:{ease:'power4.out'}});
  tl.from('.hero-media .main',{clipPath:'inset(100% 0 0 0 round 999px 999px 6px 6px)',duration:1.5})
    .from('.hero-media .main img',{scale:1.35,duration:2},0)
    .from('.hero h1 .line > span',{yPercent:110,duration:1.2,stagger:.09},.25)
    .from('[data-hero]',{y:24,opacity:0,duration:.9,stagger:.1},.7)
    .from('.hero-media .ring',{scale:0,rotate:-40,duration:1.2,ease:'back.out(1.6)'},.9);
  // Parallax
  $$('[data-parallax]').forEach(function(el){var a=parseFloat(el.dataset.parallax);var img=$('img',el)||el;
    G.fromTo(img,{yPercent:-a},{yPercent:a,ease:'none',scrollTrigger:{trigger:el,start:'top bottom',end:'bottom top',scrub:true}})});
  // Ticker der reagerer på scroll-hastighed
  var x=0,dir=1,speed=.6,w=0;function tw(){w=track.scrollWidth/2}tw();addEventListener('resize',tw);
  ScrollTrigger.create({onUpdate:function(s){dir=s.direction;speed=.6+Math.min(6,Math.abs(s.getVelocity())/400)}});
  G.ticker.add(function(){x-=speed*dir;speed+=(.6-speed)*.04;if(x<-w)x+=w;if(x>0)x-=w;track.style.transform='translateX('+x+'px)'});
  // Overskrifter ord for ord
  $$('.split-words').forEach(function(h){var html=h.innerHTML;h.innerHTML=html.replace(/(<em>.*?<\/em>|[^\s<]+)/g,'<span class="w" style="display:inline-block">$1</span>');
    G.from($$('.w',h),{yPercent:60,opacity:0,rotate:3,stagger:.06,duration:1,ease:'power3.out',scrollTrigger:{trigger:h,start:'top 85%'}})});
  // Bløde ind-toninger
  G.utils.toArray('.sec-head p, .guide, .rstep, .about .text > *, .info > div, form').forEach(function(el){G.from(el,{y:40,opacity:0,duration:1,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 88%'}})});
  G.utils.toArray('.panel:not([hidden]) .card, .panel-head .ph').forEach(function(el,i){G.from(el,{y:60,opacity:0,duration:1,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 90%'}})});
  G.utils.toArray('.rstep .ph, .about .imgs .a').forEach(function(el){G.from(el,{clipPath:'inset(100% 0 0 0)',duration:1.4,ease:'power4.out',scrollTrigger:{trigger:el,start:'top 85%'}})});
  // Citat lyser op ord for ord
  var q=$('#quote');q.innerHTML=q.textContent.split(' ').map(function(t){return '<span class="w">'+t+'</span>'}).join(' ');
  G.fromTo($$('.w',q),{opacity:.15},{opacity:1,stagger:.1,ease:'none',scrollTrigger:{trigger:q,start:'top 80%',end:'bottom 45%',scrub:true}});
  G.from('.band .mark',{rotate:-90,scale:.4,opacity:0,duration:1.4,ease:'back.out(1.4)',scrollTrigger:{trigger:'.band',start:'top 75%'}});
  // Ritual: vandret scroll på PC
  ScrollTrigger.matchMedia({'(min-width: 960px)':function(){var sec=$('#ritual'),tr=$('#rtrack');sec.classList.add('pin');
      var tween=G.to(tr,{x:function(){return -(tr.scrollWidth-innerWidth+parseFloat(getComputedStyle(sec.querySelector('.wrap')).paddingLeft)*2)},ease:'none',scrollTrigger:{trigger:sec,start:'top top',end:function(){return '+='+(tr.scrollWidth-innerWidth*.6)},pin:true,scrub:1,invalidateOnRefresh:true}});
      return function(){sec.classList.remove('pin');G.set(tr,{x:0})}}});
  // Stor CTA
  G.from('.cta-big .btn',{scale:.6,opacity:0,duration:1.2,ease:'elastic.out(1,.6)',scrollTrigger:{trigger:'.cta-big',start:'top 65%'}});
  addEventListener('load',function(){ScrollTrigger.refresh()});
})();
