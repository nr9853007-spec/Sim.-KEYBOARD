(() => {
 const $=s=>document.querySelector(s);
 const toast=$('#toast');let toastTimer;
 function notify(message){toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2800)}
 const nav=$('.nav');
 const tabs=[...document.querySelectorAll('[data-tab]')];
 const panels=[...document.querySelectorAll('[data-view]')];
 function showTab(name,updateHash=true){
  tabs.forEach(tab=>{const active=tab.dataset.tab===name;tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active));});
  panels.forEach(panel=>{const visible=panel.dataset.view===name;panel.hidden=!visible;});
  nav.classList.remove('open');
  document.body.dataset.activeTab=name;
  if(updateHash){const url=new URL(location.href);url.hash=name==='home'?'':name;history.replaceState(null,'',url);}
  window.scrollTo({top:0,behavior:'smooth'});
  panels.filter(p=>p.dataset.view===name).forEach(p=>p.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible')));
 }
 tabs.forEach(tab=>tab.addEventListener('click',()=>showTab(tab.dataset.tab)));
 $('#menuBtn').addEventListener('click',()=>nav.classList.toggle('open'));
 const initial=location.hash.slice(1);
 showTab(['how','request','reviews','faq'].includes(initial)?initial:'home',false);
 const revealItems=document.querySelectorAll('.reveal');
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.12});
  revealItems.forEach(item=>{if(!item.closest('[hidden]'))observer.observe(item)});
 }else revealItems.forEach(item=>item.classList.add('visible'));
 const telegram='https://t.me/N1kmeL';
 function openTelegram(message){
  const url=telegram+'?text='+encodeURIComponent(message);
  const opened=window.open(url,'_blank');
  if(opened) opened.opener=null; else window.location.href=url;
 }
 $('#requestForm').addEventListener('submit',event=>{
  event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;
  const data=new FormData(form);
  const message=['🛡️ ЗАЯВКА НА ГАРАНТА — N1kmeL','','👤 Никнейм: '+data.get('nickname').trim(),'📨 Контакт: '+data.get('contact').trim(),'🎮 Roblox Place: '+data.get('place').trim(),'📝 Описание сделки: '+data.get('details').trim(),'💎 Тариф: Бесплатный (0 ₽)','','Заявка отправлена с сайта N1kmeL.'].join('\n');
  $('#formSuccess').classList.add('show');$('#formSuccess').textContent='Telegram откроется с заполненной заявкой. Проверь текст и нажми «Отправить».';
  notify('Открываем Telegram с твоей заявкой…');openTelegram(message);
 });
 const reviewForm=$('#reviewForm');
 $('#reviewOpen').addEventListener('click',()=>{reviewForm.hidden=false;reviewForm.scrollIntoView({behavior:'smooth',block:'center'})});
 $('#reviewClose').addEventListener('click',()=>{reviewForm.hidden=true});
 let rating=5;const ratingButtons=[...document.querySelectorAll('[data-rating]')];
 function paintRating(){ratingButtons.forEach(button=>button.classList.toggle('active',Number(button.dataset.rating)<=rating));}
 ratingButtons.forEach(button=>button.addEventListener('click',()=>{rating=Number(button.dataset.rating);paintRating();}));paintRating();
 reviewForm.addEventListener('submit',event=>{
  event.preventDefault();if(!reviewForm.reportValidity())return;const data=new FormData(reviewForm);
  const message=['⭐ ОТЗЫВ НА МОДЕРАЦИЮ — N1kmeL','','👤 Автор: '+data.get('reviewName').trim(),'Оценка: '+rating+'/5','💬 Отзыв: '+data.get('reviewText').trim(),'','Пожалуйста, проверь отзыв перед публикацией.'].join('\n');
  const mailUrl='https://mail.google.com/mail/?view=cm&fs=1&to=nr9853007%40gmail.com&su='+encodeURIComponent('Отзыв для сайта N1kmeL')+'&body='+encodeURIComponent(message);
  notify('Открываем Gmail с готовым отзывом…');window.open(mailUrl,'_blank','noopener');
 });
 document.querySelectorAll('.faq-list details').forEach(detail=>detail.addEventListener('toggle',()=>{if(detail.open)document.querySelectorAll('.faq-list details').forEach(other=>{if(other!==detail)other.open=false;});}));
 document.querySelectorAll('a[href^="#"]').forEach(anchor=>anchor.addEventListener('click',event=>{
  const id=anchor.getAttribute('href').slice(1);
  if(['home','how','request','reviews','faq'].includes(id)){event.preventDefault();showTab(id);}
 }));
})();
