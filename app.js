(() => {
 const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
 const toast=$('#toast');let toastTimer;
 function notify(msg){toast.textContent=msg;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2300)}
 let cart=0,game='Adopt Me',favorites=new Set();
 const icons={'Adopt Me':'🐻','MM2 Market':'🔪','MM2 Swap':'🔫','Steal a Brainrot':'🧊','Grow a Garden':'🐼','Blox Fruits':'🔥'};
 function selectGame(name){
  game=name;$('#headGameName').textContent=name;$('#headGameIcon').textContent=icons[name]||'🎮';
  $$('.game-short').forEach(b=>b.classList.toggle('active',b.dataset.game===name));
  $('#catalogTitle').textContent=name==='Adopt Me'?'Предметы на продаже':name+' — демо-предметы';
  $('#search').value='';render();$('#gameSheet').hidden=true;notify('Выбрана игра: '+name+' · демо-каталог');
 }
 $('#gameOpen').addEventListener('click',()=>$('#gameSheet').hidden=false);
 $('#gameClose').addEventListener('click',()=>$('#gameSheet').hidden=true);
 $('#gameSheet').addEventListener('click',e=>{if(e.target===$('#gameSheet'))$('#gameSheet').hidden=true});
 $$('.game-options button').forEach(b=>b.addEventListener('click',()=>selectGame(b.dataset.game)));
 $$('.game-short').forEach(b=>b.addEventListener('click',()=>selectGame(b.dataset.game)));
 $('#languageBtn').addEventListener('click',()=>notify('В демо доступен русский язык.'));
 $('#noticeBtn').addEventListener('click',()=>notify('Уведомлений пока нет.'));
 $('#promoClose').addEventListener('click',()=>$('.promo').remove());
 $('#promoAction').addEventListener('click',()=>$('#catalog').scrollIntoView({behavior:'smooth'}));
 function changePage(name){
  $$('.page').forEach(p=>p.classList.toggle('active',p.id==='page-'+name));
  $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===name));
  window.scrollTo({top:0,behavior:'smooth'});
 }
 $$('.nav-item').forEach(b=>b.addEventListener('click',()=>changePage(b.dataset.page)));
 function addToCart(name){cart++;$('#cartCount').textContent=cart;notify(name+' добавлен в демо-корзину');}
 $$('.add').forEach(b=>b.addEventListener('click',()=>addToCart(b.dataset.item)));
 $('#cartBtn').addEventListener('click',()=>notify('В демо-корзине предметов: '+cart+'. Оформление заказа отключено.'));
 $$('.heart').forEach((b,i)=>b.addEventListener('click',()=>{
  const card=b.closest('.product'),name=card.dataset.name;
  if(favorites.has(name)){favorites.delete(name);b.classList.remove('is-favorite');b.textContent='♡';notify('Удалено из избранного')}
  else{favorites.add(name);b.classList.add('is-favorite');b.textContent='♥';notify('Добавлено в избранное')}
 }));
 const cards=$$('.product');let sortAsc=false,filter='all';
 function render(){
  const q=$('#search').value.trim().toLowerCase();let visible=0;
  cards.forEach(card=>{
   const fav=favorites.has(card.dataset.name);
   const ok=card.dataset.name.toLowerCase().includes(q)&&(filter==='all'||(filter==='favorites'&&fav)||(filter===card.dataset.kind));
   card.hidden=!ok;if(ok)visible++;
  });
  $('#resultCount').textContent=visible+' предметов';
  $('#empty').hidden=visible!==0;
 }
 $('#search').addEventListener('input',render);
 $('#clearSearch').addEventListener('click',()=>{$('#search').value='';render();$('#search').focus()});
 $('#showFavorites').addEventListener('click',()=>{changePage('buy');filter='favorites';render();notify('Показано избранное')});
 $('#sortBtn').addEventListener('click',()=>{sortAsc=!sortAsc;const grid=$('#products');cards.sort((a,b)=>sortAsc?+a.dataset.price- +b.dataset.price:+b.dataset.price- +a.dataset.price).forEach(c=>grid.appendChild(c));notify(sortAsc?'Сначала дешевле':'Сначала дороже')});
 function quickFilter(kind,label){filter=kind;render();notify(label)}
 $('#filterBtn').addEventListener('click',()=>quickFilter('favorites','Фильтр избранного включён'));
 $('#priceBtn').addEventListener('click',()=>{$('#sortBtn').click()});
 $('#transportBtn').addEventListener('click',()=>notify('В этом демо доступны только примеры питомцев и предметов.'));
 $('#petBtn').addEventListener('click',()=>{filter='pet';render();notify('Показаны питомцы')});
 $$('.demo-action').forEach(b=>b.addEventListener('click',()=>notify('Это демонстрационная функция — реальные действия отключены.')));
 $$('.currency button').forEach(b=>b.addEventListener('click',()=>{$$('.currency button').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');notify('В демо выбран формат валюты: '+b.textContent)}));
 $('#filterBadge').textContent='0';
 render();
})();