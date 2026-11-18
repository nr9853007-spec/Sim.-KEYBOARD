(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.textContent = open ? '×' : '☰';
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.textContent = '☰';
    }));
  }

  const modal = document.getElementById('gameModal');
  const zone = document.getElementById('reactionZone');
  const start = document.getElementById('startGame');
  const close = document.getElementById('closeModal');
  const message = document.getElementById('gameMessage');
  const result = document.getElementById('gameResult');
  let phase = 'idle';
  let timer = null;
  let startedAt = 0;
  let timeoutId = null;

  function resetGame() {
    clearTimeout(timeoutId);
    phase = 'idle';
    zone.className = 'reaction-zone';
    zone.textContent = 'ГОТОВ?';
    start.disabled = false;
    start.textContent = 'Старт';
  }
  function openGame() {
    modal.hidden = false;
    message.textContent = 'Нажми «Старт», дождись синего сигнала и нажми на поле как можно быстрее.';
    result.textContent = '';
    resetGame();
    close.focus();
  }
  function closeGame() {
    modal.hidden = true;
    resetGame();
  }
  document.querySelectorAll('[data-game="reaction"]').forEach(button => button.addEventListener('click', openGame));
  close.addEventListener('click', closeGame);
  modal.addEventListener('click', event => { if (event.target === modal) closeGame(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !modal.hidden) closeGame(); });

  start.addEventListener('click', () => {
    if (phase !== 'idle') return;
    phase = 'waiting';
    result.textContent = '';
    zone.className = 'reaction-zone waiting';
    zone.textContent = 'ЖДИ СИГНАЛА…';
    start.disabled = true;
    start.textContent = 'Ожидание';
    const delay = 1400 + Math.random() * 2600;
    timeoutId = setTimeout(() => {
      if (phase !== 'waiting') return;
      phase = 'go';
      startedAt = performance.now();
      zone.className = 'reaction-zone go';
      zone.textContent = 'ЖМИ!';
      start.disabled = false;
      start.textContent = 'Я нажал!';
    }, delay);
  });

  zone.addEventListener('click', () => {
    if (phase === 'waiting') {
      clearTimeout(timeoutId);
      phase = 'idle';
      zone.className = 'reaction-zone';
      zone.textContent = 'РАНО!';
      message.textContent = 'Нужно дождаться синего сигнала. Попробуй ещё раз.';
      start.disabled = false;
      start.textContent = 'Повторить';
      result.textContent = '';
      return;
    }
    if (phase === 'go') {
      const ms = Math.round(performance.now() - startedAt);
      phase = 'done';
      zone.className = 'reaction-zone';
      zone.textContent = ms + ' МС';
      message.textContent = 'Твой результат в этом раунде:';
      result.textContent = ms < 220 ? 'Молниеносно! Отличная реакция.' : ms < 350 ? 'Хороший результат! Попробуй улучшить.' : 'Практика делает быстрее. Попробуй ещё раз!';
      start.disabled = false;
      start.textContent = 'Ещё раунд';
    }
  });
  start.addEventListener('click', () => {
    if (phase === 'done') {
      message.textContent = 'Нажми «Старт», дождись синего сигнала и нажми на поле как можно быстрее.';
      result.textContent = '';
      resetGame();
    }
  });
  document.getElementById('profileAction').addEventListener('click', () => {
    alert('Регистрация и сохранение профилей появятся в следующем этапе разработки.');
  });
})();