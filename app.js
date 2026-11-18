(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const splash = $('#demoSplash');
  $('#startDemo').addEventListener('click', () => {
    splash.classList.add('is-hidden');
    document.body.classList.remove('intro-active');
    window.setTimeout(() => splash.remove(), 600);
  });

  const toast = $('#toast');
  let toastTimer;
  function notify(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }
  const modal = $('#modal');
  let selectedItem = null;
  function openItem(card) {
    selectedItem = card;
    const name = card.dataset.name;
    const emoji = $('.pet-art', card).textContent;
    const price = card.dataset.price;
    $('#modalTitle').textContent = name;
    $('#modalArt').textContent = emoji;
    $('#modalValue').textContent = price + ' ✦';
    $('#modalText').textContent = 'Коллекционный предмет из демо-вселенной N1kmeL. Здесь показаны примерная редкость, описание и условная ценность. Все данные вымышлены.';
    modal.hidden = false;
  }
  function closeModal(){ modal.hidden = true; }
  $('#modalClose').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if(e.target === modal) closeModal(); });
  $('#modalAction').addEventListener('click', () => {
    if(selectedItem) {
      notify('«' + selectedItem.dataset.name + '» добавлен в демо-подборку');
      $('#cartCount').textContent = String(Number($('#cartCount').textContent) + 1);
    }
    closeModal();
  });
  $('#cartTop').addEventListener('click', () => {
    notify('Демо-подборка: ' + $('#cartCount').textContent + ' предмет(а). Оформление отключено.');
  });
  function showFavorites() {
    $('#searchInput').value = '';
    setCategory('favorites');
    $('#catalog').scrollIntoView({behavior:'smooth'});
  }
  $('#favoriteTop').addEventListener('click', showFavorites);
  $('#mobileFavorites').addEventListener('click', showFavorites);
  $('#profileTop').addEventListener('click', () => notify('Профиль доступен только как визуальный макет.'));
  $('#mobileProfile').addEventListener('click', () => notify('Демо-профиль: вход и личные данные отключены.'));

  const cards = $$('.product-card');
  const search = $('#searchInput');
  let category = 'all';
  let extraLegendary = false;
  let extraNew = false;
  let sortMode = 'popular';
  function setCategory(next) {
    category = next;
    $('.category-chip').forEach(btn => btn.classList.toggle('active', btn.dataset.filter === next));
    $('.side-filter').forEach(btn => btn.classList.toggle('active', btn.dataset.filter === next));
    render();
  }
  function render() {
    const query = search.value.trim().toLocaleLowerCase('ru');
    let visible = 0;
    let list = cards.slice();
    if(sortMode === 'popular') list.sort((a,b) => Number(b.dataset.score)-Number(a.dataset.score));
    if(sortMode === 'price') list.sort((a,b) => Number(a.dataset.price)-Number(b.dataset.price));
    if(sortMode === 'new') list.sort((a,b) => (b.dataset.kind.includes('new')?1:0)-(a.dataset.kind.includes('new')?1:0));
    list.forEach(card => {
      const nameMatch = card.dataset.name.toLocaleLowerCase('ru').includes(query);
      const kinds = card.dataset.kind.split(' ');
      const favorite = $('.favorite', card).classList.contains('is-favorite');
      const categoryMatch = category === 'all' || (category === 'favorites' ? favorite : kinds.includes(category));
      const extraMatch = (!extraLegendary || kinds.includes('legendary')) && (!extraNew || kinds.includes('new'));
      const game = $('#catalogGame')?.value;
      const match = nameMatch && categoryMatch && extraMatch;
      card.hidden = !match;
      if(match) visible++;
      $('#productGrid').appendChild(card);
    });
    $('#resultCount').textContent = String(visible).padStart(2,'0');
    $('#emptyState').hidden = visible !== 0;
    $('#filterCount').textContent = String(Number(extraLegendary)+Number(extraNew));
    if($('#sideLegendary')) $('#sideLegendary').checked = extraLegendary;
    if($('#sideNew')) $('#sideNew').checked = extraNew;
  }
  search.addEventListener('input', render);
  $('#clearSearch').addEventListener('click', () => {search.value='';render();search.focus();});
  $('.category-chip').forEach(btn => btn.addEventListener('click', () => setCategory(btn.dataset.filter)));
  $('.side-filter').forEach(btn => btn.addEventListener('click', () => setCategory(btn.dataset.filter)));
  $('#sidebarReset')?.addEventListener('click', () => {search.value='';extraLegendary=false;extraNew=false;setCategory('all');render();});
  $('#sideLegendary')?.addEventListener('change', e => {extraLegendary=e.target.checked;render();});
  $('#sideNew')?.addEventListener('change', e => {extraNew=e.target.checked;render();});
  $$('.favorite').forEach(btn => btn.addEventListener('click', () => {
    btn.classList.toggle('is-favorite');
    btn.textContent = btn.classList.contains('is-favorite') ? '♥' : '♡';
    notify(btn.classList.contains('is-favorite') ? 'Добавлено в избранное' : 'Удалено из избранного');
    render();
  }));
  $$('.view-item').forEach(btn => btn.addEventListener('click', () => openItem(btn.closest('.product-card'))));
  $$('.game-tile').forEach(btn => btn.addEventListener('click', () => {
    $$('.game-tile').forEach(tile => tile.classList.remove('selected'));
    btn.classList.add('selected');
    const game = btn.dataset.game;
    notify(game === 'Другие игры' ? 'Новые игровые миры скоро появятся.' : 'Выбран мир: ' + game + '. Витрина показывает общий демо-набор.');
  }));
  $('#sortButton').addEventListener('click', () => {
    const modes = ['popular','new','price'];
    sortMode = modes[(modes.indexOf(sortMode)+1)%modes.length];
    $('#sortButton').innerHTML = (sortMode==='popular'?'Сначала популярные':sortMode==='new'?'Сначала новые':'Сначала дешевле') + ' <span>⌄</span>';
    render();
  });
  const filterModal = $('#filterModal');
  $('#filterButton').addEventListener('click', () => {
    $('#legendaryCheck').checked = extraLegendary;
    $('#newCheck').checked = extraNew;
    filterModal.hidden = false;
  });
  function closeFilters(){filterModal.hidden=true;}
  $('#filterClose').addEventListener('click', closeFilters);
  filterModal.addEventListener('click', e => {if(e.target===filterModal)closeFilters();});
  $('#filterApply').addEventListener('click', () => {
    extraLegendary=$('#legendaryCheck').checked;
    extraNew=$('#newCheck').checked;
    render();
    closeFilters();
  });
  $('#filterReset').addEventListener('click', () => {
    $('#legendaryCheck').checked=false;$('#newCheck').checked=false;
    extraLegendary=false;extraNew=false;render();
  });
  $('#resetFilters').addEventListener('click', () => {
    search.value='';extraLegendary=false;extraNew=false;setCategory('all');render();
  });
  document.addEventListener('keydown', e => {
    if(e.key==='Escape'){closeModal();closeFilters();}
  });
  render();
})();