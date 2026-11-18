(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const toast = $('#toast');
  let toastTimer;
  function notify(text) {
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }
  const dialog = $('#dialog');
  function showDialog(title, text) {
    $('#dialogTitle').textContent = title;
    $('#dialogText').textContent = text;
    dialog.hidden = false;
  }
  function hideDialog() { dialog.hidden = true; }
  $('#dialogClose').addEventListener('click', hideDialog);
  $('#dialogOk').addEventListener('click', hideDialog);
  dialog.addEventListener('click', e => { if (e.target === dialog) hideDialog(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hideDialog(); });

  $('#closePromo').addEventListener('click', () => $('.promo').remove());

  const search = $('#searchInput');
  const cards = $$('.product-card');
  let activeFilter = 'all';
  let favoritesOnly = false;
  function filterCards() {
    const query = search.value.trim().toLocaleLowerCase('ru');
    let shown = 0;
    cards.forEach(card => {
      const name = card.dataset.name.toLocaleLowerCase('ru');
      const favorite = $('.favorite', card).classList.contains('is-favorite');
      const matches = name.includes(query) &&
        (activeFilter === 'all' || card.dataset.kind === activeFilter) &&
        (!favoritesOnly || favorite);
      card.hidden = !matches;
      if (matches) shown++;
    });
    $('#resultCount').textContent = shown + ' ' + (shown === 1 ? 'коллекция' : 'коллекций');
    $('#emptyState').hidden = shown !== 0;
  }
  search.addEventListener('input', filterCards);
  $('#clearSearch').addEventListener('click', () => { search.value=''; filterCards(); search.focus(); });
  $$('.filter-chip').forEach(btn => btn.addEventListener('click', () => {
    $$('.filter-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    favoritesOnly = false;
    filterCards();
  }));
  $$('.favorite').forEach(btn => btn.addEventListener('click', () => {
    btn.classList.toggle('is-favorite');
    btn.textContent = btn.classList.contains('is-favorite') ? '♥' : '♡';
    notify(btn.classList.contains('is-favorite') ? 'Добавлено в избранное' : 'Удалено из избранного');
    filterCards();
  }));
  $$('.game-shortcut').forEach(btn => btn.addEventListener('click', () => {
    $$('.game-shortcut').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    $('#catalogTitle').textContent = btn.dataset.game + ' · Каталог';
    notify('Выбрана игра: ' + btn.dataset.game);
  }));
  $$('.detail-button').forEach(btn => btn.addEventListener('click', () => {
    showDialog(btn.dataset.item, 'Это демонстрационная карточка N1kmeL. Здесь можно будет посмотреть описание и характеристики коллекционного образа. Реальные покупки и обмены не выполняются.');
  }));
  $('#filterButton').addEventListener('click', () => showDialog('Фильтры каталога', 'Сейчас доступны быстрый поиск, популярные позиции и новинки. Дополнительные фильтры появятся позже.'));
  $('#sortButton').addEventListener('click', () => {
    const label = $('#sortLabel');
    label.textContent = label.textContent.startsWith('Сначала популярные') ? 'Сначала новые⌄' : 'Сначала популярные⌄';
    notify(label.textContent.replace('⌄',''));
  });
  $('#cartTop').addEventListener('click', () => showDialog('Твоя подборка', 'Это макет корзины. Реальные платежи и оформление заказов в N1kmeL отключены.'));
  $('#profileTop').addEventListener('click', () => showDialog('Профиль N1kmeL', 'Личный кабинет пока находится в разработке. Не вводи здесь пароль от Roblox или других игровых аккаунтов.'));
  $$('.bottom-item').forEach(btn => btn.addEventListener('click', () => {
    $$('.bottom-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    if (tab === 'Купить') {
      favoritesOnly = false;
      search.value = '';
      activeFilter = 'all';
      $('.filter-chip').forEach(b => b.classList.toggle('active', b.dataset.filter === 'all'));
      filterCards();
      $('#catalog').scrollIntoView({behavior:'smooth'});
    } else if (tab === 'Продать') {
      showDialog('Продать', 'Этот раздел пока не поддерживает выставление предметов на продажу. В N1kmeL нет реальных сделок или передачи игровых аккаунтов.');
    } else if (tab === 'Swap') {
      showDialog('Swap', 'Раздел обмена пока демонстрационный. Никакие предметы не передаются.');
    } else if (tab === 'Предметы') {
      showDialog('Инвентарь', 'Личная коллекция предметов появится в следующем обновлении.');
    } else {
      showDialog('Профиль', 'Личный кабинет игрока появится в следующем обновлении. Не вводи здесь пароли от игровых аккаунтов.');
    }
  }));
  filterCards();
})();