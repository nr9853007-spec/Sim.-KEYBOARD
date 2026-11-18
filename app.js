(() => {
 'use strict';
 const $=(s,root=document)=>root.querySelector(s);
 const $$=(s,root=document)=>[...root.querySelectorAll(s)];
 const toast=$('#toast');
 let toastTimer=0;
 function notify(message){
  if(!toast)return;
  toast.textContent=message;toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toast.classList.remove('show'),2400);
 }
 const games={
  'Adopt Me':{icon:'adopt-me.svg',title:'Предметы на продаже'},
  'MM2 Market':{icon:'mm2.svg',title:'MM2 Market — демо-каталог'},
  'MM2 Swap':{icon:'mm2-swap.svg',title:'MM2 Swap — демо-каталог'},
  'Steal a Brainrot':{icon:'brainrot.svg',title:'Steal a Brainrot — демо-каталог'},
  'Grow a Garden':{icon:'garden.svg',title:'Grow a Garden — демо-каталог'},
  'Blox Fruits':{icon:'blox.svg',title:'Blox Fruits — демо-каталог'}
 };
 const pages=['buy','sell','swap','items','profile'];
 let currentGame='Adopt Me',currentPage='buy',filterMode='all',sortAscending=false;
 const favorites=new Set(),grid=$('#products'),cards=grid?$$('.product',grid):[];
 const sheet=$('#gameSheet'),gameOpen=$('#gameOpen');
 function changePage(name){
  if(!pages.includes(name))return;
  const target=$('#page-'+name);
  if(!target)return;
  $$('.page').forEach(p=>p.classList.toggle('active',p===target));
  $$('.nav-item[data-page]').forEach(b=>{
   const active=b.dataset.page===name;
   b.classList.toggle('active',active);
   if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
  });
  currentPage=name;
  window.scrollTo({top:0,behavior:'smooth'});
 }
 function closeSheet(){
  if(!sheet)return;
  sheet.hidden=true;document.body.classList.remove('modal-open');
  gameOpen?.setAttribute('aria-expanded','false');
  gameOpen?.focus();
 }
 function openSheet(){
  if(!sheet)return;
  sheet.hidden=false;document.body.classList.add('modal-open');
  gameOpen?.setAttribute('aria-expanded','true');
  $('#gameClose')?.focus();
 }
 function selectGame(name){
  const data=games[name];if(!data)return;
  currentGame=name;
  const art=$('#headerGameArt');if(art){art.src='assets/games/'+data.icon;art.alt=name;}
  const nameNode=$('#headGameName');if(nameNode)nameNode.textContent=name;
  $$('.game-short[data-game]').forEach(b=>{
   const active=b.dataset.game===name;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));
  });
  $$('.game-options [data-game]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.game===name)));
  const title=$('#catalogTitle');if(title)title.textContent=data.title;
  const search=$('#search');if(search)search.value='';
  filterMode='all';renderCatalog();closeSheet();
  notify('Выбрана игра: '+name+' · демо-каталог');
 }
 gameOpen?.addEventListener('click',openSheet);
 $('#gameClose')?.addEventListener('click',closeSheet);
 sheet?.addEventListener('click',e=>{if(e.target===sheet)closeSheet();});
 $$('.game-options [data-game],.game-short[data-game]').forEach(b=>b.addEventListener('click',()=>selectGame(b.dataset.game)));
 $$('.nav-item[data-page]').forEach(b=>b.addEventListener('click',()=>changePage(b.dataset.page)));
 $('#languageBtn')?.addEventListener('click',()=>notify('В демо доступен русский язык.'));
 $('#noticeBtn')?.addEventListener('click',()=>notify('Демонстрационных уведомлений пока нет.'));
 $('#promoClose')?.addEventListener('click',()=>$('.promo')?.remove());
 $('#promoAction')?.addEventListener('click',()=>$('#catalog')?.scrollIntoView({behavior:'smooth',block:'start'}));
 $('#cartBtn')?.addEventListener('click',()=>notify('Корзина декоративная. Заказы и платежи отключены.'));
 function renderCatalog(){
  const query=($('#search')?.value||'').trim().toLocaleLowerCase('ru');
  let visibleCount=0;
  cards.forEach(card=>{
   const name=(card.dataset.name||'').toLocaleLowerCase('ru');
   const isFavorite=favorites.has(card.dataset.name);
   const gameMatches=currentGame==='Adopt Me';
   const queryMatches=name.includes(query);
   const filterMatches=filterMode==='all'||(filterMode==='favorites'&&isFavorite)||(filterMode==='pet'&&card.dataset.kind==='pet');
   const visible=gameMatches&&queryMatches&&filterMatches;
   card.hidden=!visible;if(visible)visibleCount++;
   const heart=$('.heart',card);
   if(heart){heart.classList.toggle('is-favorite',isFavorite);heart.textContent=isFavorite?'♥':'♡';heart.setAttribute('aria-pressed',String(isFavorite));}
  });
  const count=$('#resultCount');if(count)count.textContent=visibleCount+' предметов';
  const empty=$('#empty');
  if(empty){
   empty.hidden=visibleCount>0;
   empty.textContent=currentGame!=='Adopt Me'?'Для этой игры демонстрационный каталог пока не подготовлен.':filterMode==='favorites'?'В избранном пока пусто. Отметь карточки сердечком.':'Ничего не найдено. Измени запрос или фильтр.';
  }
  const badge=$('#filterBadge');if(badge)badge.textContent=filterMode==='all'?'0':'1';
  $('#filterBtn')?.classList.toggle('filter-selected',filterMode!=='all');
 }
 cards.forEach(card=>{
  $('.heart',card)?.addEventListener('click',()=>{
   const name=card.dataset.name;
   if(favorites.has(name)){favorites.delete(name);notify('Удалено из избранного');}
   else{favorites.add(name);notify('Добавлено в избранное');}
   renderCatalog();
  });
  $('.add',card)?.addEventListener('click',()=>notify('Демонстрационная карточка: покупка и добавление отключены.'));
 });
 $('#search')?.addEventListener('input',renderCatalog);
 $('#clearSearch')?.addEventListener('click',()=>{const field=$('#search');if(field){field.value='';renderCatalog();field.focus();}});
 $('#sortBtn')?.addEventListener('click',()=>{
  sortAscending=!sortAscending;
  [...cards].sort((a,b)=>sortAscending?Number(a.dataset.price)-Number(b.dataset.price):Number(b.dataset.price)-Number(a.dataset.price)).forEach(card=>grid?.appendChild(card));
  notify(sortAscending?'Сначала дешевле':'Сначала дороже');
 });
 $('#filterBtn')?.addEventListener('click',()=>{
  filterMode=filterMode==='favorites'?'all':'favorites';renderCatalog();
  notify(filterMode==='favorites'?'Показано избранное':'Все предметы');
 });
 $('#showFavorites')?.addEventListener('click',()=>{filterMode='favorites';changePage('buy');renderCatalog();});
 $('#priceBtn')?.addEventListener('click',()=>$('#sortBtn')?.click());
 $('#transportBtn')?.addEventListener('click',()=>notify('В этом демо транспорт пока не добавлен.'));
 $('#petBtn')?.addEventListener('click',()=>{
  filterMode=filterMode==='pet'?'all':'pet';renderCatalog();
  notify(filterMode==='pet'?'Показаны питомцы':'Фильтр питомцев снят');
 });
 $$('.demo-action').forEach(b=>b.addEventListener('click',()=>notify('Демо-режим: реальные операции недоступны.')));
 $$('.currency button').forEach(button=>button.addEventListener('click',()=>{
  $$('.currency button').forEach(item=>{const active=item===button;item.classList.toggle('selected',active);item.setAttribute('aria-pressed',String(active));});
  notify('Выбрана валюта интерфейса: '+button.textContent.trim());
 }));
 $$('.tabs button').forEach((button,index)=>button.addEventListener('click',()=>{
  $$('.tabs button').forEach((item,i)=>{item.classList.toggle('selected',i===index);item.setAttribute('aria-pressed',String(i===index));});
  const note=$('.notice-box');
  if(note)note.textContent=index===0?'Это демонстрационный экран. Подключение игрового инвентаря недоступно.':'Раздел объявлений — пример интерфейса. Публикация и продажа отключены.';
 }));
 const terms=$('#termsOverlay');
 function openTerms(){if(!terms)return;terms.hidden=false;document.body.classList.add('modal-open');$('#termsClose')?.focus();}
 function closeTerms(){if(!terms)return;terms.hidden=true;document.body.classList.remove('modal-open');}
 $('#termsClose')?.addEventListener('click',closeTerms);
 terms?.addEventListener('click',e=>{if(e.target===terms)closeTerms();});
 $('#aboutDemo')?.addEventListener('click',openTerms);
 const footer=document.createElement('button');
 footer.type='button';footer.className='terms-link';footer.textContent='Соглашение и отказ от ответственности';footer.addEventListener('click',openTerms);
 $('main')?.appendChild(footer);
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){if(sheet&&!sheet.hidden)closeSheet();if(terms&&!terms.hidden)closeTerms();}
 });
 renderCatalog();
})();