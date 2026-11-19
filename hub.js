(()=>{'use strict';const menu=document.querySelector('.mobile-menu');const nav=document.querySelector('.main-nav');if(menu&&nav){menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}));}const year=document.querySelector('#year');if(year)year.textContent=new Date().getFullYear();}
const popularRoot=document.querySelector('#popularGames');
if(popularRoot){
 const games=[
  {id:'literary',name:'Литературный знаток',icon:'📚',url:'literary-expert.html'},
  {id:'cosmic',name:'Космический выживальщик',icon:'🚀',url:'cosmic-survivor.html'},
  {id:'shawarma',name:'Shawarma Master',icon:'🌯',url:'shawarma-master.html'}
 ];
 const key='n1kmelGameVisitsV1';
 let visits={};try{visits=JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{}
 const paint=()=>{
  const ranked=games.map((g,i)=>({...g,count:Math.max(0,Number(visits[g.id])||0),order:i})).sort((a,b)=>b.count-a.count||a.order-b.order);
  popularRoot.innerHTML=ranked.map((g,i)=>'<li><span class="popular-place">'+String(i+1).padStart(2,'0')+'</span><span class="popular-game-icon">'+g.icon+'</span><span class="popular-game-name">'+g.name+'</span><b>'+g.count+'</b></li>').join('');
 };
 document.querySelectorAll('a[href]').forEach(a=>{
  const href=a.getAttribute('href')||'';
  const game=games.find(g=>href.split('?')[0].endsWith(g.url));
  if(game)a.addEventListener('click',()=>{visits[game.id]=(Number(visits[game.id])||0)+1;try{localStorage.setItem(key,JSON.stringify(visits))}catch{}});
 });
 paint();
}
})();