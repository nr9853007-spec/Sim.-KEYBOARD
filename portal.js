(() => {
 const $=s=>document.querySelector(s);
 const state={user:null,pending:null,mode:'login'};
 const labels={pending:'На рассмотрении',accepted:'Принята',rejected:'Отклонена',answered:'Есть ответ',approved:'Опубликован',rejectedReview:'Отклонён'};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 async function api(url,options={}) {
  const res=await fetch('/api'+url,{credentials:'same-origin',headers:{'Content-Type':'application/json',...(options.headers||{})},...options});
  const data=await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error||'Не удалось выполнить запрос.');
  return data;
 }
 function note(s){const t=$('#toast');if(t){t.textContent=s;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2800)}}
 document.querySelectorAll('a[href^="mailto:"],.floating-mail,.contact-actions a[href^="mailto:"]').forEach(a=>a.remove());
 document.querySelectorAll('a[href*="gmail.com"]').forEach(a=>a.remove());
 document.querySelectorAll('.contact-actions').forEach(el=>{if(!el.children.length)el.remove()});
 document.querySelectorAll('.footer-contacts a').forEach(a=>{if(a.href.startsWith('mailto:'))a.remove()});
 const style=document.createElement('style');style.textContent=`
 .account-trigger{border:1px solid #ffffff28;background:#ffffff0b;color:#fff;border-radius:12px;padding:11px 15px;font:800 10px Manrope,Arial;cursor:pointer;white-space:nowrap}
 .account-trigger:hover{border-color:#a77aff;background:#ffffff14}
 .account-modal{position:fixed;inset:0;z-index:1000;background:#080510c9;display:grid;place-items:center;padding:16px;backdrop-filter:blur(8px)}
 .account-modal[hidden]{display:none}.account-box{width:min(520px,100%);max-height:88vh;overflow:auto;background:#f9f6ff;color:#251d32;border-radius:18px;padding:24px;box-shadow:0 24px 80px #0009}
 .account-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;font-weight:900;font-size:18px}
 .account-close{border:0;border-radius:8px;background:#eee7f6;color:#51445e;font-size:22px;width:34px;height:34px;cursor:pointer}
 .account-tabs{display:flex;gap:8px;margin-bottom:18px}.account-tabs button,.account-action{border:0;border-radius:9px;padding:10px 13px;background:#eee8f5;color:#4b4058;font-weight:800;font-size:11px;cursor:pointer}
 .account-tabs button.active,.account-action.primary{background:#ffad45;color:#291b2c}
 .account-box label{display:grid;gap:7px;margin:12px 0;font-size:11px;font-weight:800;color:#4d435b}
 .account-box input,.account-box textarea,.account-box select{width:100%;border:1px solid #e4ddeb;border-radius:9px;padding:12px;background:white;color:#251d32;font:12px Manrope,Arial}
 .account-error{color:#a12d48;font-size:11px;min-height:18px;margin:8px 0}.account-muted{font-size:11px;color:#887d96;line-height:1.6}
 .account-card{border:1px solid #e8e0ef;background:#fff;border-radius:12px;padding:13px;margin:10px 0;font-size:11px;line-height:1.6;overflow-wrap:anywhere}
 .account-card strong{font-size:12px}.account-card p{margin:7px 0;color:#62576f}.account-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}
 .account-actions button{border:0;border-radius:8px;padding:8px 10px;font-size:10px;font-weight:800;cursor:pointer;background:#eee8f5;color:#44374f}
 .account-actions button.good{background:#dff5e9;color:#206747}.account-actions button.bad{background:#fbe5e9;color:#9a3045}
 .account-status{display:inline-block;border-radius:20px;padding:4px 8px;background:#eee8f5;font-size:9px;font-weight:800}
 .review-live{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:18px}.review-live .account-card{background:#211a31;color:#f7f4ff;border-color:#ffffff18}.review-live .account-card p{color:#c6bdd4}
 @media(max-width:680px){.account-trigger{padding:9px 10px;font-size:9px}.account-box{padding:18px}.account-head{font-size:16px}}
 `;document.head.appendChild(style);
 const trigger=document.createElement('button');trigger.className='account-trigger';trigger.textContent='Войти / Регистрация';trigger.type='button';
 const headerCta=$('.header-cta');if(headerCta)headerCta.replaceWith(trigger);else $('.header')?.append(trigger);
 const modal=document.createElement('div');modal.className='account-modal';modal.hidden=true;modal.innerHTML='<section class="account-box" role="dialog" aria-modal="true" aria-label="Аккаунт"><div class="account-head"><span id="accountTitle">Вход в аккаунт</span><button class="account-close" type="button" aria-label="Закрыть">×</button></div><div id="accountContent"></div></section>';document.body.append(modal);
 const close=()=>{modal.hidden=true};modal.querySelector('.account-close').onclick=close;modal.addEventListener('click',e=>{if(e.target===modal)close()});trigger.onclick=()=>state.user?showProfile():showAuth('login');
 function showAuth(mode='login',error=''){
  state.mode=mode;$('#accountTitle').textContent=mode==='login'?'Вход в аккаунт':'Регистрация';
  $('#accountContent').innerHTML='<div class="account-tabs"><button type="button" data-mode="login" class="'+(mode==='login'?'active':'')+'">Войти</button><button type="button" data-mode="register" class="'+(mode==='register'?'active':'')+'">Регистрация</button></div><form id="authForm"><label>Логин<input name="username" required minlength="3" maxlength="20" autocomplete="username" placeholder="Твой никнейм"></label><label>Пароль<input name="password" type="password" required minlength="6" maxlength="72" autocomplete="'+(mode==='login'?'current-password':'new-password')+'" placeholder="Не менее 8 символов"></label><div class="account-error" id="authError">'+esc(error)+'</div><button class="account-action primary" style="width:100%" type="submit">'+(mode==='login'?'Войти':'Создать аккаунт')+'</button></form><p class="account-muted">Почта не нужна. Используй уникальный пароль и не передавай его другим.</p>';
  modal.hidden=false;
  modal.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>showAuth(b.dataset.mode));
  $('#authForm').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const endpoint=mode==='login'?'/login':'/register';const btn=e.currentTarget.querySelector('button[type=submit]');btn.disabled=true;try{const d=await api(endpoint,{method:'POST',body:JSON.stringify({username:fd.get('username'),password:fd.get('password')})});state.user=d.user;updateTrigger();if(state.pending){const p=state.pending;state.pending=null;close();await p()}else showProfile()}catch(err){$('#authError').textContent=err.message;btn.disabled=false}};
 }
 function updateTrigger(){trigger.textContent=state.user?state.user.username+(state.user.role==='admin'?' · Поддержка':' · Аккаунт'):'Войти / Регистрация'}
 async function requireAuth(action){if(!state.user){state.pending=action;showAuth('login','Войди или зарегистрируйся, чтобы продолжить.');return false}return true}
 const status=s=>labels[s]||s;
 async function showProfile(){
  if(!state.user){showAuth();return}
  $('#accountTitle').textContent=state.user.role==='admin'?'Панель поддержки':'Личный кабинет';
  $('#accountContent').innerHTML='<p><strong>'+esc(state.user.username)+'</strong> · '+(state.user.role==='admin'?'Администратор / поддержка':'Игрок')+'</p><div class="account-tabs"><button class="active" data-panel="tickets">Мои заявки</button><button data-panel="reviews">Мои отзывы</button>'+(state.user.role==='admin'?'<button data-panel="admin">Управление</button>':'')+'</div><div id="profilePanel">Загрузка…</div><div class="account-actions"><button id="logoutBtn">Выйти</button></div>';
  modal.hidden=false;$('#logoutBtn').onclick=async()=>{await api('/logout',{method:'POST'});state.user=null;updateTrigger();close();note('Ты вышел из аккаунта.')};
  modal.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>{modal.querySelectorAll('[data-panel]').forEach(x=>x.classList.toggle('active',x===b));if(b.dataset.panel==='admin')loadAdmin();else loadMine(b.dataset.panel)});
  await loadMine('tickets');
 }
 async function loadMine(kind){
  const panel=$('#profilePanel');panel.textContent='Загрузка…';
  try{const d=await api(kind==='tickets'?'/my/tickets':'/my/reviews');const rows=kind==='tickets'?d.tickets:d.reviews;
   panel.innerHTML=rows.length?rows.map(x=>'<article class="account-card"><strong>#'+x.id+' · '+(kind==='tickets'?'Заявка: '+esc(x.place):'Отзыв · '+x.rating+'/5')+'</strong><p>'+esc(kind==='tickets'?x.details:x.body)+'</p><span class="account-status">'+esc(status(x.status))+'</span>'+(x.reply?'<p><b>Ответ поддержки:</b> '+esc(x.reply)+'</p>':'')+'</article>').join(''):'<p class="account-muted">Пока записей нет.</p>';
  }catch(e){panel.textContent=e.message}
 }
 async function loadAdmin(){
  const panel=$('#profilePanel');panel.textContent='Загрузка панели поддержки…';
  try{const d=await api('/admin/overview');
   let html='<h3>Заявки ('+d.tickets.length+')</h3>';
   html+=d.tickets.map(t=>'<article class="account-card"><strong>#'+t.id+' · '+esc(t.username)+' · '+esc(t.place)+'</strong><p>'+esc(t.details)+'<br>Контакт: '+esc(t.contact)+'</p><label>Статус<select data-ticket-status="'+t.id+'"><option value="pending" '+(t.status==='pending'?'selected':'')+'>На рассмотрении</option><option value="accepted" '+(t.status==='accepted'?'selected':'')+'>Принята</option><option value="rejected" '+(t.status==='rejected'?'selected':'')+'>Отклонена</option><option value="answered" '+(t.status==='answered'?'selected':'')+'>Есть ответ</option></select></label><label>Ответ игроку<textarea data-ticket-reply="'+t.id+'" rows="2">'+esc(t.reply)+'</textarea></label><div class="account-actions"><button class="good" data-save-ticket="'+t.id+'">Сохранить ответ</button></div></article>').join('')||'<p class="account-muted">Заявок пока нет.</p>';
   html+='<h3>Отзывы на модерации и опубликованные ('+d.reviews.length+')</h3>';
   html+=d.reviews.map(r=>'<article class="account-card"><strong>#'+r.id+' · '+esc(r.username)+' · '+r.rating+'/5</strong><p>'+esc(r.body)+'</p><span class="account-status">'+esc(status(r.status))+'</span><div class="account-actions"><button class="good" data-review-status="'+r.id+'" data-value="approved">Опубликовать</button><button class="bad" data-review-status="'+r.id+'" data-value="rejected">Отклонить</button><button class="bad" data-delete-review="'+r.id+'">Удалить</button></div></article>').join('')||'<p class="account-muted">Отзывов пока нет.</p>';
   html+='<h3>Игроки ('+d.users.length+')</h3>';
   html+=d.users.map(u=>'<article class="account-card"><strong>'+esc(u.username)+'</strong> · '+esc(u.role)+' · '+(u.banned?'Заблокирован':'Активен')+(u.role==='admin'?'':'<div class="account-actions"><button class="'+(u.banned?'good':'bad')+'" data-ban="'+u.id+'" data-banned="'+(!u.banned)+'">'+(u.banned?'Разблокировать':'Заблокировать')+'</button></div>')+'</article>').join('');
   panel.innerHTML=html;
   panel.querySelectorAll('[data-save-ticket]').forEach(b=>b.onclick=async()=>{try{await api('/admin/tickets/'+b.dataset.saveTicket,{method:'PATCH',body:JSON.stringify({status:panel.querySelector('[data-ticket-status="'+b.dataset.saveTicket+'"]').value,reply:panel.querySelector('[data-ticket-reply="'+b.dataset.saveTicket+'"]').value})});note('Ответ по заявке сохранён.');loadAdmin()}catch(e){note(e.message)}});
   panel.querySelectorAll('[data-review-status]').forEach(b=>b.onclick=async()=>{try{await api('/admin/reviews/'+b.dataset.reviewStatus,{method:'PATCH',body:JSON.stringify({status:b.dataset.value})});note('Статус отзыва изменён.');loadAdmin()}catch(e){note(e.message)}});
   panel.querySelectorAll('[data-delete-review]').forEach(b=>b.onclick=async()=>{if(!confirm('Удалить этот отзыв?'))return;try{await api('/admin/reviews/'+b.dataset.deleteReview,{method:'DELETE'});note('Отзыв удалён.');loadAdmin()}catch(e){note(e.message)}});
   panel.querySelectorAll('[data-ban]').forEach(b=>b.onclick=async()=>{try{await api('/admin/users/'+b.dataset.ban+'/ban',{method:'PATCH',body:JSON.stringify({banned:b.dataset.banned==='true'})});note('Статус игрока изменён.');loadAdmin()}catch(e){note(e.message)}});
  }catch(e){panel.textContent=e.message}
 }
 async function refreshReviews(){
  const host=$('.reviews-empty');if(!host)return;
  try{const d=await api('/reviews');host.hidden=d.reviews.length>0;
   let list=$('#liveReviews');if(!list){list=document.createElement('div');list.id='liveReviews';list.className='review-live';host.after(list)}
   list.innerHTML=d.reviews.map(r=>'<article class="account-card"><strong>'+esc(r.username)+' · '+'★'.repeat(r.rating)+'</strong><p>'+esc(r.body)+'</p></article>').join('');
  }catch{}
 }
 document.addEventListener('submit',async e=>{
  const form=e.target;
  if(form.id!=='requestForm'&&form.id!=='reviewForm')return;
  e.preventDefault();e.stopImmediatePropagation();
  const data=new FormData(form);
  if(form.id==='requestForm'){
   const action=async()=>{try{const d=await api('/tickets',{method:'POST',body:JSON.stringify({place:data.get('place'),contact:data.get('contact'),details:data.get('details')})});$('#formSuccess').textContent=d.message+' Номер заявки: #'+d.id;$('#formSuccess').classList.add('show');note(d.message);form.reset()}catch(err){note(err.message)}};
   if(await requireAuth(action))await action();
  }else{
   const action=async()=>{try{const d=await api('/reviews',{method:'POST',body:JSON.stringify({rating:Number(form.querySelector('[name=rating]')?.value||document.querySelector('[data-rating].active')?.dataset.rating||5),body:data.get('reviewText')})});note(d.message);form.reset();form.hidden=true;await refreshReviews()}catch(err){note(err.message)}};
   if(await requireAuth(action))await action();
  }
 },true);
 const ratingField=document.createElement('input');ratingField.type='hidden';ratingField.name='rating';ratingField.value='5';$('#reviewForm')?.append(ratingField);
 document.querySelectorAll('[data-rating]').forEach(b=>b.addEventListener('click',()=>{ratingField.value=b.dataset.rating}));
 async function init(){try{const d=await api('/me');state.user=d.user;updateTrigger()}catch{}await refreshReviews()}
 init();
})();