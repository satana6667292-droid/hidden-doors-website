
(function(){
'use strict';
var API='https://lk.hidden-doors.ru/api/site/lead';
var POLICY_VERSION='2026-09-29';
var root=new URL('.',document.currentScript&&document.currentScript.src?document.currentScript.src:location.href);
var avatar=new URL('assets/hd-architect-widget.svg?v=20261007-mvp1',root).toString();
var logo=new URL('assets/logo.png',root).toString();
var introSpeech='Если вы выбираете скрытую дверь, не начинайте с модели. Ошибка в проёме может стоить намного дороже самой двери. Отправьте мне размеры проёма — за минуту я подскажу, какая система Hidden Doors вам подходит и что важно предусмотреть до монтажа.';
var state={height:'',width:'',task:'hidden',finish:'paint',recommendation:null};
function id(){return globalThis.crypto&&crypto.randomUUID?crypto.randomUUID():'hdai-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10)}
function goal(name,params){window.dataLayer=window.dataLayer||[];window.dataLayer.push(Object.assign({event:name,page_path:location.pathname},params||{}));if(typeof window.ym==='function')try{window.ym(95250042,'reachGoal',name,params||{})}catch(e){}}
function phoneDigits(value){var d=String(value||'').replace(/\D/g,'');if(d.charAt(0)==='7'||d.charAt(0)==='8')d=d.slice(1);return d.slice(0,10)}
function formatPhone(value){var d=phoneDigits(value),o='+7';if(d.length)o+=' ('+d.slice(0,3);if(d.length>=3)o+=')';if(d.length>3)o+=' '+d.slice(3,6);if(d.length>6)o+='-'+d.slice(6,8);if(d.length>8)o+='-'+d.slice(8,10);return o}
function recommend(h,task){
  h=Number(h)||0;
  if(h>2950)return{system:'Индивидуальный проект',title:'Нужен индивидуальный расчёт',text:'Высота выше 2950 мм выходит за стандартный диапазон систем на сайте. Передадим параметры специалисту и проверим возможное исполнение.'};
  if(task==='interior'&&h<=2000)return{system:'36 мм',title:'Предварительно: система 36 мм',text:'Для межкомнатной двери стандартной высоты можно рассматривать систему 36 мм. Точную комплектацию проверим по ширине, отделке и проёму.'};
  if(task==='high'||h>2500)return{system:'59 мм',title:'Предварительно: система 59 мм',text:'Для высокого проёма в этом диапазоне логично начинать с системы 59 мм с алюминиевым каркасом. Проверим отделку, открывание и ограничения проекта.'};
  if(h>2200)return{system:'42 / 59 мм',title:'Предварительно: 42 или 59 мм',text:'При такой высоте выбор зависит от исполнения, каркаса и отделки. Система 42 мм в алюминиевом исполнении может быть вариантом, а 59 мм даёт больший запас по высоте.'};
  if(task==='hidden')return{system:'42 мм',title:'Предварительно: система 42 мм',text:'Для скрытого монтажа при такой высоте система 42 мм — базовая отправная точка. Дальше важны ширина, открывание, отделка и конструкция стены.'};
  return{system:'36 / 42 / 59 мм',title:'Подходят несколько систем',text:'По одной высоте выбор делать рано. Уточним тип монтажа, отделку и задачу интерьера — после этого подберём систему без лишнего запаса и переплаты.'};
}
function speak(){
  if(!('speechSynthesis' in window))return;
  try{
    speechSynthesis.cancel();
    var u=new SpeechSynthesisUtterance(introSpeech);
    u.lang='ru-RU';u.rate=1.02;u.pitch=.94;
    var voices=speechSynthesis.getVoices();
    var ru=voices.find(function(v){return /^ru/i.test(v.lang)});
    if(ru)u.voice=ru;
    speechSynthesis.speak(u);
    goal('ai_architect_voice');
  }catch(e){}
}
var wrap=document.createElement('div');
wrap.className='hdai-widget';
wrap.innerHTML=[
'<button class="hdai-launcher" type="button" aria-label="Открыть HD Architect">',
'<img class="hdai-launcher-avatar" src="'+avatar+'" alt="">',
'<span class="hdai-launcher-copy"><strong><i class="hdai-online"></i>HD Architect</strong><span>Проверю ваш проём бесплатно</span></span>',
'</button>',
'<aside class="hdai-panel" role="dialog" aria-modal="false" aria-label="HD Architect — подбор двери">',
'<div class="hdai-head"><div class="hdai-head-brand"><img src="'+logo+'" alt="Hidden Doors"><span class="hdai-status"><i class="hdai-online"></i>AI-архитектор онлайн</span></div><button class="hdai-close" type="button" aria-label="Закрыть">×</button></div>',
'<div class="hdai-media"><img src="'+avatar+'" alt="HD Architect — виртуальный эксперт Hidden Doors"><div class="hdai-bubble">Не знаете, 36, 42 или 59 мм?<br>Отправьте размеры проёма — помогу начать с правильной системы.</div><button class="hdai-sound" type="button" title="Послушать" aria-label="Послушать приглашение">🔊</button></div>',
'<div class="hdai-body">',
'<section class="hdai-view" data-view="intro">',
'<div class="hdai-kicker">HD ARCHITECT / HIDDEN DOORS</div>',
'<h2 class="hdai-title">Проверьте проём<br>до заказа двери</h2>',
'<p class="hdai-text">За 1 минуту предварительно подберу систему 36 / 42 / 59 мм и покажу, что важно проверить до оформления заказа.</p>',
'<div class="hdai-benefits"><div class="hdai-benefit">По вашим<br>размерам</div><div class="hdai-benefit">Без звонка<br>на первом шаге</div><div class="hdai-benefit">Бесплатный<br>предварительный подбор</div></div>',
'<button class="hdai-primary" type="button" data-action="start">Проверить проём бесплатно <span>→</span></button>',
'<div class="hdai-trust"><span>✓ 36 / 42 / 59 мм</span><span>✓ открывание</span><span>✓ отделка</span></div>',
'</section>',
'<section class="hdai-view" data-view="quiz" hidden>',
'<button class="hdai-back" type="button" data-action="back-intro">← Назад</button>',
'<div class="hdai-kicker">ШАГ 1 ИЗ 2</div><h2 class="hdai-title">Размеры и задача</h2>',
'<p class="hdai-text">Укажите чистовые размеры проёма. Подбор предварительный — финальное решение подтверждает специалист Hidden Doors.</p>',
'<form class="hdai-form" id="hdai-quiz">',
'<div class="hdai-row"><label class="hdai-field"><span>Высота, мм *</span><input name="height" type="number" min="1500" max="4000" inputmode="numeric" placeholder="2400" required></label><label class="hdai-field"><span>Ширина, мм *</span><input name="width" type="number" min="400" max="2000" inputmode="numeric" placeholder="900" required></label></div>',
'<label class="hdai-field"><span>Что хотите получить?</span><select name="task"><option value="hidden">Скрытая дверь в плоскости стены</option><option value="high">Высокая дверь / почти до потолка</option><option value="interior">Межкомнатная дверь</option><option value="unknown">Пока не знаю</option></select></label>',
'<label class="hdai-field"><span>Предпочтительная отделка</span><select name="finish"><option value="paint">Под покраску / грунт</option><option value="veneer">Шпон / HPL / декоративный материал</option><option value="mirror">Зеркало / стекло</option><option value="unknown">Пока не выбрал</option></select></label>',
'<button class="hdai-primary" type="submit">Получить предварительный подбор <span>→</span></button>',
'</form></section>',
'<section class="hdai-view" data-view="result" hidden>',
'<button class="hdai-back" type="button" data-action="back-quiz">← Изменить параметры</button>',
'<div class="hdai-kicker">ПРЕДВАРИТЕЛЬНЫЙ РЕЗУЛЬТАТ</div><h2 class="hdai-title">Есть отправная точка</h2>',
'<div class="hdai-result"><strong id="hdai-result-title"></strong><p id="hdai-result-text"></p></div>',
'<p class="hdai-text" id="hdai-result-meta"></p>',
'<button class="hdai-primary" type="button" data-action="lead">Получить точную комплектацию <span>→</span></button>',
'<button class="hdai-secondary" type="button" data-action="back-quiz">Изменить размеры</button>',
'<p class="hdai-note">Это предварительная рекомендация, а не техническое заключение. Для нестандартных проектов параметры проверяет специалист Hidden Doors.</p>',
'</section>',
'<section class="hdai-view" data-view="lead" hidden>',
'<button class="hdai-back" type="button" data-action="back-result">← К результату</button>',
'<div class="hdai-kicker">ШАГ 2 ИЗ 2</div><h2 class="hdai-title">Отправить подбор</h2>',
'<p class="hdai-text">Оставьте контакт — передадим ваши размеры и предварительный подбор менеджеру. Повторно объяснять задачу не придётся.</p>',
'<form class="hdai-form" id="hdai-lead">',
'<label class="hdai-field"><span>Ваше имя *</span><input name="name" autocomplete="given-name" maxlength="80" required placeholder="Александр"></label>',
'<label class="hdai-field"><span>Телефон *</span><input name="phone" autocomplete="tel" inputmode="tel" maxlength="18" required value="+7"></label>',
'<label class="hdai-consent"><input type="checkbox" name="privacy_consent" value="yes" checked required><span>Я даю <a href="'+new URL('consent/',root).toString()+'" target="_blank" rel="noopener">согласие на обработку персональных данных</a> и ознакомлен(а) с <a href="'+new URL('privacy/',root).toString()+'" target="_blank" rel="noopener">Политикой обработки персональных данных</a>.</span></label>',
'<button class="hdai-primary" type="submit">Отправить мой подбор <span>→</span></button><p class="hdai-status-text" aria-live="polite"></p>',
'</form></section>',
'<section class="hdai-view hdai-success" data-view="success" hidden><div class="hdai-success-mark">✓</div><div class="hdai-kicker">ГОТОВО</div><h2 class="hdai-title">Подбор отправлен</h2><p class="hdai-text">Менеджер Hidden Doors получит ваши размеры и предварительный результат HD Architect и свяжется с вами.</p><button class="hdai-secondary" type="button" data-action="close">Закрыть</button></section>',
'</div></aside>'
].join('');
document.body.append(wrap);
var panel=wrap.querySelector('.hdai-panel'),launcher=wrap.querySelector('.hdai-launcher'),close=wrap.querySelector('.hdai-close'),sound=wrap.querySelector('.hdai-sound');
function view(name){wrap.querySelectorAll('.hdai-view').forEach(function(v){v.hidden=v.getAttribute('data-view')!==name});panel.scrollTop=0}
function open(auto){wrap.classList.add('is-open');goal('ai_architect_open',{auto:auto?'yes':'no'});if(auto){setTimeout(function(){try{speak()}catch(e){}},650)}}
function shut(){wrap.classList.remove('is-open');if('speechSynthesis' in window)try{speechSynthesis.cancel()}catch(e){}}
setTimeout(function(){wrap.classList.add('is-visible');goal('ai_architect_impression')},1200);
setTimeout(function(){if(!sessionStorage.getItem('hdai_auto_seen')){sessionStorage.setItem('hdai_auto_seen','1');open(true)}},4200);
launcher.addEventListener('click',function(){open(false)});
close.addEventListener('click',shut);
sound.addEventListener('click',speak);
wrap.addEventListener('click',function(e){
  var b=e.target.closest('[data-action]');if(!b)return;
  var a=b.getAttribute('data-action');
  if(a==='start'){view('quiz');goal('ai_architect_start')}
  if(a==='lead'){view('lead');goal('ai_architect_lead_step',{door_system:state.recommendation&&state.recommendation.system||''})}
  if(a==='back-intro')view('intro');
  if(a==='back-quiz')view('quiz');
  if(a==='back-result')view('result');
  if(a==='close')shut();
});
var quiz=wrap.querySelector('#hdai-quiz');
quiz.addEventListener('submit',function(e){
  e.preventDefault();
  var fd=new FormData(quiz);
  state.height=fd.get('height');state.width=fd.get('width');state.task=fd.get('task');state.finish=fd.get('finish');
  state.recommendation=recommend(state.height,state.task);
  wrap.querySelector('#hdai-result-title').textContent=state.recommendation.title;
  wrap.querySelector('#hdai-result-text').textContent=state.recommendation.text;
  wrap.querySelector('#hdai-result-meta').textContent='Проём: '+state.height+' × '+state.width+' мм. Следующий шаг — проверить открывание, стену, отделку и комплектацию.';
  view('result');goal('ai_architect_result',{door_system:state.recommendation.system,height:state.height,width:state.width});
});
var lead=wrap.querySelector('#hdai-lead'),phone=lead.elements.phone,status=lead.querySelector('.hdai-status-text');
phone.addEventListener('input',function(){phone.value=formatPhone(phone.value);phone.setCustomValidity('')});
phone.addEventListener('focus',function(){if(!phone.value)phone.value='+7'});
lead.addEventListener('submit',async function(e){
  e.preventDefault();
  var name=lead.elements.name;name.value=name.value.trim();
  if(!name.value){name.setCustomValidity('Укажите имя.');name.reportValidity();return}name.setCustomValidity('');
  var digits=phoneDigits(phone.value);if(digits.length!==10){phone.setCustomValidity('Введите 10 цифр после +7.');phone.reportValidity();return}
  phone.value=formatPhone(phone.value);
  var q=new URLSearchParams(location.search);
  var taskLabels={hidden:'скрытая дверь',high:'высокая дверь',interior:'межкомнатная дверь',unknown:'не определился'};
  var finishLabels={paint:'под покраску / грунт',veneer:'шпон / HPL / декоративный материал',mirror:'зеркало / стекло',unknown:'не выбрал'};
  var payload={
    name:name.value,phone:phone.value,city:'',construction:state.recommendation?state.recommendation.system:'Не определился',
    comment:'HD Architect / сайт. Проём: '+state.height+' × '+state.width+' мм. Задача: '+taskLabels[state.task]+'. Отделка: '+finishLabels[state.finish]+'. Предварительный подбор: '+(state.recommendation?state.recommendation.title:'не определён')+'.',
    privacy_consent:'yes',privacy_policy_version:POLICY_VERSION,request_id:id(),website:'',
    page_url:location.href,page_title:document.title,form_type:'ai_architect_widget',door_system:state.recommendation?state.recommendation.system:'',model:state.recommendation?state.recommendation.system:'',
    referrer:document.referrer,utm_source:q.get('utm_source')||'',utm_medium:q.get('utm_medium')||'',utm_campaign:q.get('utm_campaign')||'',utm_content:q.get('utm_content')||'',utm_term:q.get('utm_term')||''
  };
  var submit=lead.querySelector('[type=submit]'),old=submit.innerHTML;submit.disabled=true;submit.textContent='Отправляем…';status.textContent='';goal('ai_architect_lead_ready',{door_system:payload.door_system});
  try{
    var res=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload)});
    var data={};try{data=await res.json()}catch(ignore){}
    if(!res.ok||data.status!=='ready')throw new Error(data.error||('HTTP '+res.status));
    goal('ai_architect_lead_success',{door_system:payload.door_system,lead_id:data.leadId||''});view('success');
  }catch(err){
    console.error('HD Architect lead submit:',err);status.textContent='Не удалось отправить. Попробуйте ещё раз или позвоните: +7 932 022-11-22.';submit.disabled=false;submit.innerHTML=old;
  }
});
goal('ai_architect_loaded');
})();
