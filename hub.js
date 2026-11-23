(()=>{'use strict';
const menu=document.querySelector('.mobile-menu'),drawer=document.querySelector('#hubDrawer'),backdrop=document.querySelector('#hubDrawerBackdrop'),close=drawer?.querySelector('.hub-drawer-close');
if(menu&&drawer&&backdrop&&close){
 menu.setAttribute('aria-controls','hubDrawer');drawer.setAttribute('role','dialog');drawer.setAttribute('aria-modal','true');drawer.setAttribute('tabindex','-1');
 let returnFocus=menu;
 const focusable=()=>Array.from(drawer.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(el=>!el.hasAttribute('hidden'));
 const setOpen=open=>{
  menu.setAttribute('aria-expanded',String(open));drawer.classList.toggle('is-open',open);drawer.setAttribute('aria-hidden',String(!open));drawer.inert=!open;backdrop.hidden=!open;document.body.classList.toggle('hub-menu-lock',open);
  if(open){returnFocus=document.activeElement instanceof HTMLElement?document.activeElement:menu;requestAnimationFrame(()=>{backdrop.classList.add('is-visible');close.focus()})}
  else{backdrop.classList.remove('is-visible');returnFocus?.focus?.()}
 };
 menu.addEventListener('click',()=>setOpen(menu.getAttribute('aria-expanded')!=='true'));close.addEventListener('click',()=>setOpen(false));backdrop.addEventListener('click',()=>setOpen(false));
 drawer.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>setOpen(false)));
 document.addEventListener('keydown',e=>{if(!drawer.classList.contains('is-open'))return;if(e.key==='Escape'){e.preventDefault();setOpen(false);return}if(e.key==='Tab'){const items=focusable();if(!items.length){e.preventDefault();drawer.focus();return}const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
}
const year=document.querySelector('#year');if(year)year.textContent=new Date().getFullYear();
const root=document.querySelector('#popularGames');
if(root){
 const games=[{id:'blockhunt',name:'Block Hunt',icon:'🧩',url:'block-hunt.html'},{id:'prism',name:'Prism Garden',icon:'💎',url:'prism-garden.html'},{id:'orbit',name:'Orbit Relay',icon:'🪐',url:'orbit-relay.html'},{id:'keystorm',name:'KeyStorm',icon:'⌨️',url:'keystorm.html'},{id:'literary',name:'Литературный знаток',icon:'📚',url:'literary-expert.html'},{id:'cosmic',name:'Космический выживальщик',icon:'🚀',url:'cosmic-survivor.html'},{id:'shawarma',name:'Shawarma Master',icon:'🌯',url:'shawarma-master.html'},{id:'tictactoe',name:'Крестики-нолики',icon:'❎',url:'classics.html'},{id:'reaction',name:'Реакция!',icon:'⚡',url:'reaction.html'},{id:'duet',name:'ДУЭТ',icon:'🌓',url:'duet.html'},{id:'coloring',name:'Разукрасить',icon:'🎨',url:'coloring.html'},{id:'yard1989',name:'Жаркий двор — 1989',icon:'⚽',url:'hot-yard-1989.html'}],key='n1kmelGameVisitsV2';
 let visits={};try{visits=JSON.parse(localStorage.getItem(key)||'{}')||{};if(visits.tictactoe==null&&visits.classics!=null)visits.tictactoe=visits.classics;delete visits.classics;localStorage.setItem(key,JSON.stringify(visits))}catch{}
 const paint=()=>{const ranked=games.map((g,i)=>({...g,count:Math.max(0,Number(visits[g.id])||0),order:i})).sort((a,b)=>b.count-a.count||a.order-b.order);root.innerHTML=ranked.map((g,i)=>'<li><span class="popular-place">'+String(i+1).padStart(2,'0')+'</span><span class="popular-game-icon">'+g.icon+'</span><span class="popular-game-name">'+g.name+'</span><b>'+g.count+'</b></li>').join('')};
 document.querySelectorAll('a[href]').forEach(a=>{const href=(a.getAttribute('href')||'').split('?')[0],game=games.find(g=>href===g.url||href.endsWith('/'+g.url));if(game)a.addEventListener('click',()=>{visits[game.id]=(Number(visits[game.id])||0)+1;try{localStorage.setItem(key,JSON.stringify(visits))}catch{}paint()})});paint();
}

const motionSections=document.querySelectorAll('.hero,.games-section,.about-section');
if('IntersectionObserver' in window && motionSections.length){
 const motionObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>entry.target.classList.toggle('is-offscreen',!entry.isIntersecting));
 },{rootMargin:'120px 0px'});
 motionSections.forEach(section=>motionObserver.observe(section));
}
const syncPageVisibility=()=>document.body.classList.toggle('page-hidden',document.hidden);
document.addEventListener('visibilitychange',syncPageVisibility,{passive:true});
syncPageVisibility();

})();