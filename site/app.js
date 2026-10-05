const METRIKA_ID=95250042;
const LEAD_API_URL='https://lk.hidden-doors.ru/api/site/lead';
const ATTRIBUTION_STORAGE_KEY='hd_marketing_attribution_v1';
const ATTRIBUTION_TTL_MS=90*24*60*60*1000;

function readStoredAttribution(){
  try{
    const data=JSON.parse(localStorage.getItem(ATTRIBUTION_STORAGE_KEY)||'{}');
    const capturedAt=Date.parse(data.captured_at||'');
    if(!capturedAt||Date.now()-capturedAt>ATTRIBUTION_TTL_MS){
      localStorage.removeItem(ATTRIBUTION_STORAGE_KEY);
      return {};
    }
    return data;
  }catch{return {}}
}
function captureAttribution(){
  const q=new URLSearchParams(location.search);
  const incoming={
    utm_source:q.get('utm_source')||'',
    utm_medium:q.get('utm_medium')||'',
    utm_campaign:q.get('utm_campaign')||'',
    utm_content:q.get('utm_content')||'',
    utm_term:q.get('utm_term')||'',
    yclid:q.get('yclid')||''
  };
  const hasIncoming=Object.values(incoming).some(Boolean);
  if(!hasIncoming)return readStoredAttribution();
  const data={
    ...incoming,
    landing_page:location.href,
    landing_referrer:document.referrer||'',
    captured_at:new Date().toISOString()
  };
  try{localStorage.setItem(ATTRIBUTION_STORAGE_KEY,JSON.stringify(data))}catch{}
  return data;
}
const MARKETING_ATTRIBUTION=captureAttribution();
let METRIKA_CLIENT_ID_CACHE='';
function getMetrikaClientId(timeoutMs=5000){
  if(METRIKA_CLIENT_ID_CACHE)return Promise.resolve(METRIKA_CLIENT_ID_CACHE);
  return new Promise(resolve=>{
    let done=false;
    const finish=value=>{if(done)return;done=true;METRIKA_CLIENT_ID_CACHE=String(value||METRIKA_CLIENT_ID_CACHE||'');resolve(METRIKA_CLIENT_ID_CACHE)};
    const timer=setTimeout(()=>finish(''),timeoutMs);
    try{
      if(typeof window.ym!=='function'){clearTimeout(timer);finish('');return}
      window.ym(METRIKA_ID,'getClientID',clientId=>{clearTimeout(timer);finish(clientId)});
    }catch{clearTimeout(timer);finish('')}
  });
}
const TELEGRAM_URL='https://t.me/Door_Dealer';
const PRIVACY_POLICY_VERSION='2026-09-29';
const SITE_ROOT_URL=new URL('.',document.currentScript?.src||location.href);
(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(let j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r)return}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id='+METRIKA_ID,'ym');
ym(METRIKA_ID,'init',{ssr:true,webvisor:true,clickmap:true,accurateTrackBounce:true,trackLinks:true});
setTimeout(()=>getMetrikaClientId(10000),500);
function metricGoal(name,params={}){if(typeof window.ym==='function')window.ym(METRIKA_ID,'reachGoal',name,params)}
function telegramLink(className,label){
  const a=document.createElement('a');
  a.href=TELEGRAM_URL;
  a.target='_blank';
  a.rel='noopener noreferrer';
  a.className=className;
  a.textContent=label;
  a.addEventListener('click',()=>metricGoal('telegram_click',{placement:className.includes('footer')?'footer':className.includes('mobile')?'mobile_menu':'header',page_path:location.pathname}));
  return a;
}
function injectTelegramLinks(){
  const headerContact=document.querySelector('.header-contact');
  if(headerContact&&!headerContact.querySelector('.header-telegram'))headerContact.append(telegramLink('header-telegram','Telegram · Door Dealer ↗'));

  const navLinks=document.querySelector('.nav-links');
  if(navLinks&&!navLinks.querySelector('.mobile-telegram'))navLinks.append(telegramLink('mobile-telegram','Telegram · Door Dealer ↗'));

  const footer=document.querySelector('footer');
  if(footer&&!footer.querySelector('.footer-telegram')){
    const vk=footer.querySelector('a[href*="vk.com/hiddendoors"]');
    if(vk)vk.insertAdjacentElement('afterend',telegramLink('footer-telegram','Telegram · Door Dealer ↗'));
  }
}
injectTelegramLinks();
function applyLaunchCleanup(){
  document.querySelectorAll('.prototype-note').forEach(el=>el.remove());
  const accountDialog=document.querySelector('#account-dialog');
  if(accountDialog)accountDialog.remove();

  document.querySelectorAll('.account[data-dialog="account"]').forEach(button=>{
    const a=document.createElement('a');
    a.className=button.className;
    a.href=TELEGRAM_URL;
    a.target='_blank';
    a.rel='noopener noreferrer';
    a.innerHTML='Кабинет дилера <span aria-hidden="true">↗</span>';
    button.replaceWith(a);
  });

  document.querySelectorAll('a.account').forEach(a=>{
    a.href=TELEGRAM_URL;
    a.target='_blank';
    a.rel='noopener noreferrer';
  });

  const defaultSubmit=document.querySelector('#request-form [type="submit"]');
  if(defaultSubmit&&defaultSubmit.textContent.includes('Проверить заявку'))defaultSubmit.innerHTML='Отправить заявку <span aria-hidden="true">↗</span>';

  const footerBottom=document.querySelector('.footer-bottom');
  if(footerBottom&&!footerBottom.querySelector('.footer-legal')){
    const legal=document.createElement('span');
    legal.className='footer-legal';
    const policy=document.createElement('a');
    policy.href=new URL('privacy/',SITE_ROOT_URL).toString();
    policy.textContent='Политика ПД';
    const consent=document.createElement('a');
    consent.href=new URL('consent/',SITE_ROOT_URL).toString();
    consent.textContent='Согласие на обработку ПД';
    legal.append(policy,' · ',consent);
    const test=[...footerBottom.querySelectorAll('span')].find(el=>el.textContent.includes('формы без отправки')||el.textContent.includes('Версия 2'));
    if(test)test.replaceWith(legal);
    else{
      const top=footerBottom.querySelector('a[href="#top"]');
      if(top)footerBottom.insertBefore(legal,top);else footerBottom.append(legal);
    }
  }
}
applyLaunchCleanup();
const $=s=>document.querySelector(s);const dialogs=[...document.querySelectorAll('dialog')];
function openDialog(d){d.showModal();document.body.classList.add('modal-open')}
function closeDialog(d){d.close();if(!dialogs.some(x=>x.open))document.body.classList.remove('modal-open')}
dialogs.forEach(d=>{d.querySelector('.close').onclick=()=>closeDialog(d);d.addEventListener('close',()=>{if(!dialogs.some(x=>x.open))document.body.classList.remove('modal-open')});d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog(d)}})});
const menu=$('.menu-button');if(menu)menu.onclick=()=>{const expanded=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!expanded));menu.setAttribute('aria-label',expanded?'Открыть меню':'Закрыть меню');$('#navigation').classList.toggle('open',!expanded)};
document.querySelectorAll('#navigation a').forEach(a=>a.onclick=()=>{if(menu){menu.setAttribute('aria-expanded','false');$('#navigation').classList.remove('open')}});
const form=$('#request-form'),requestDialog=$('#request-dialog');
const copy={
calculate:{title:'Получите расчёт комплекта',description:'Оставьте имя и телефон. Размеры, город и детали можно указать дополнительно.',submit:'Получить расчёт',comment:'Размеры, покрытие, количество дверей',success:'Расчёт'},
stock:{title:'Проверим двери в наличии',description:'Оставьте имя и телефон. Менеджер уточнит детали и проверит подходящие готовые позиции.',submit:'Проверить наличие',comment:'Размер, открывание, покрытие, количество',success:'Наличие'},
dealerSearch:{title:'Найдём дилера Hidden Doors',description:'Оставьте имя и телефон. Город можно указать, чтобы быстрее подобрать партнёра.',submit:'Найти дилера',comment:'Какая дверь интересует, размеры или количество',success:'Поиск дилера'},
dealer:{title:'Получите условия сотрудничества',description:'Расскажите о компании или салоне. Обсудим формат работы и дилерские условия.',submit:'Получить условия',comment:'Сайт, формат работы, интересующая продукция',success:'Дилерская заявка'},
designer:{title:'Обсудим дизайн-проект',description:'Передайте параметры проекта — проверим систему, открывание и отделку до спецификации.',submit:'Обсудить проект',comment:'Размеры, открывание, отделка, количество дверей',success:'Проект дизайнера'},
developer:{title:'Отправьте ТЗ на расчёт',description:'Передайте параметры объекта или ТЗ — проверим типоразмеры, системы и комплектацию.',submit:'Отправить ТЗ',comment:'Количество, типоразмеры, сроки, отделка, требования ТЗ',success:'Объектный расчёт'}
};
const normalizeKind=kind=>kind==='where'||kind==='dealer-search'?'dealerSearch':kind;
function labelOf(el){return el?.closest('label')}
function setLabelText(el,text){const label=labelOf(el);if(!label)return;const node=[...label.childNodes].find(n=>n.nodeType===Node.TEXT_NODE);if(node)node.nodeValue=text}
function ensureHidden(name){let input=form.elements[name];if(!input){input=document.createElement('input');input.type='hidden';input.name=name;form.append(input)}return input}
function newRequestId(){if(globalThis.crypto&&typeof globalThis.crypto.randomUUID==='function')return globalThis.crypto.randomUUID();return 'hd-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12)}
function ensureHoneypot(){let input=form.elements.website;if(input)return input;input=document.createElement('input');input.type='text';input.name='website';input.autocomplete='off';input.tabIndex=-1;input.setAttribute('aria-hidden','true');input.style.position='absolute';input.style.left='-10000px';input.style.width='1px';input.style.height='1px';input.style.opacity='0';form.append(input);return input}
function ensureCompany(){let input=form.elements.company;if(input)return input;const label=document.createElement('label');label.id='company-label';label.textContent='Компания / салон';input=document.createElement('input');input.name='company';input.autocomplete='organization';input.placeholder='Название компании';input.maxLength=150;label.append(input);const construction=$('#construction-label');construction.parentNode.insertBefore(label,construction);return input}
function ensurePrivacyConsent(){
  let wrap=form.querySelector('.privacy-consent');
  if(wrap){
    const input=wrap.querySelector('input[type="checkbox"]');
    if(input)input.checked=true;
    return wrap;
  }
  wrap=document.createElement('label');
  wrap.className='privacy-consent';
  const input=document.createElement('input');
  input.type='checkbox';
  input.name='privacy_consent';
  input.value='yes';
  input.required=true;
  input.defaultChecked=true;
  input.checked=true;
  const copy=document.createElement('span');
  copy.append('Я даю ');
  const consent=document.createElement('a');
  consent.href=new URL('consent/',SITE_ROOT_URL).toString();
  consent.target='_blank';
  consent.rel='noopener noreferrer';
  consent.textContent='согласие на обработку персональных данных';
  copy.append(consent,' и ознакомлен(а) с ');
  const policy=document.createElement('a');
  policy.href=new URL('privacy/',SITE_ROOT_URL).toString();
  policy.target='_blank';
  policy.rel='noopener noreferrer';
  policy.textContent='Политикой обработки персональных данных';
  copy.append(policy,'.');
  wrap.append(input,copy);
  const submit=form.querySelector('[type="submit"]');
  form.insertBefore(wrap,submit);
  ensureHidden('privacy_policy_version').value=PRIVACY_POLICY_VERSION;
  return wrap;
}
function subscriberPhoneDigits(value){
  const digits=String(value||'').replace(/\D/g,'');
  return digits.startsWith('7')?digits.slice(1,11):digits.slice(0,10);
}
function formatRuPhone(value){
  const d=subscriberPhoneDigits(value);
  let out='+7';
  if(d.length)out+=' ('+d.slice(0,3);
  if(d.length>=3)out+=')';
  if(d.length>3)out+=' '+d.slice(3,6);
  if(d.length>6)out+='-'+d.slice(6,8);
  if(d.length>8)out+='-'+d.slice(8,10);
  return out;
}
function configurePhoneInput(phone){
  phone.required=true;
  phone.inputMode='numeric';
  phone.autocomplete='tel';
  phone.maxLength=18;
  phone.placeholder='+7 (___) ___-__-__';
  phone.value='+7';
}
function tracking(kind,model){
  const q=new URLSearchParams(location.search);
  const live={
    utm_source:q.get('utm_source')||'',
    utm_medium:q.get('utm_medium')||'',
    utm_campaign:q.get('utm_campaign')||'',
    utm_content:q.get('utm_content')||'',
    utm_term:q.get('utm_term')||'',
    yclid:q.get('yclid')||''
  };
  const source=Object.values(live).some(Boolean)?{...MARKETING_ATTRIBUTION,...live}:MARKETING_ATTRIBUTION;
  const values={
    page_url:location.href,
    page_title:document.title,
    form_type:kind,
    door_system:model||document.body.dataset.product||'',
    model:model||'',
    referrer:document.referrer,
    utm_source:source.utm_source||'',
    utm_medium:source.utm_medium||'',
    utm_campaign:source.utm_campaign||'',
    utm_content:source.utm_content||'',
    utm_term:source.utm_term||'',
    yclid:source.yclid||'',
    landing_page:source.landing_page||'',
    landing_referrer:source.landing_referrer||'',
    attribution_captured_at:source.captured_at||''
  };
  Object.entries(values).forEach(([k,v])=>ensureHidden(k).value=v)
}
function request(rawKind='calculate',model){const kind=normalizeKind(rawKind),cfg=copy[kind]||copy.calculate;
form.reset();ensurePrivacyConsent();$('.form-status').textContent='';$('#dialog-title').textContent=cfg.title;$('#dialog-description').textContent=cfg.description;
const note=requestDialog.querySelector('.prototype-note');if(note)note.hidden=true;
const name=form.elements.name,phone=form.elements.phone,city=form.elements.city,construction=form.elements.construction,comment=form.elements.comment,submit=form.querySelector('[type="submit"]');
const mobileForm=matchMedia('(max-width: 600px)').matches;
name.required=true;name.placeholder=kind==='developer'?'Контактное лицо':'Ваше имя';setLabelText(name,(kind==='developer'?'Контактное лицо':'Ваше имя')+' *');
configurePhoneInput(phone);setLabelText(phone,'Телефон *');city.required=false;
city.placeholder=kind==='developer'?'Город / объект':kind==='dealerSearch'?'Город покупки':'Ваш город';
setLabelText(city,kind==='developer'?'Город / объект':'Город');
comment.placeholder=cfg.comment;submit.innerHTML=cfg.submit+' <span aria-hidden="true">↗</span>';
const cityLabel=labelOf(city),commentLabel=labelOf(comment);
if(cityLabel)cityLabel.hidden=mobileForm&&(kind==='calculate'||kind==='stock');
if(commentLabel)commentLabel.hidden=mobileForm&&(kind==='calculate'||kind==='stock'||kind==='dealerSearch');
if(mobileForm&&(kind==='calculate'||kind==='stock'))$('#dialog-description').textContent='Оставьте имя и телефон — менеджер уточнит размеры и детали.';
const company=ensureCompany(),companyLabel=labelOf(company);companyLabel.hidden=kind!=='dealer';company.required=false;
const chosen=model||document.body.dataset.product||'';
construction.value=chosen?chosen+' мм':'Не определился';
const constructionLabel=$('#construction-label');constructionLabel.hidden=kind==='dealer'||Boolean(chosen);
if(kind==='dealerSearch'){setLabelText(construction,'Какая дверь интересует');constructionLabel.hidden=false}
else if(kind==='developer')setLabelText(construction,'Система');
else setLabelText(construction,'Конструкция');
tracking(kind,chosen);
ensureHidden('request_id').value=newRequestId();ensureHoneypot().value='';
form.dataset.formType=kind;form.dataset.successLabel=cfg.success;
window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:'form_open',form_type:kind,door_system:chosen,page_path:location.pathname});metricGoal('form_open',{form_type:kind,door_system:chosen,page_path:location.pathname});if(kind==='stock')metricGoal('stock_open',{page_path:location.pathname});if(kind==='dealerSearch')metricGoal('dealer_search_open',{page_path:location.pathname});if(kind==='dealer')metricGoal('dealer_open',{page_path:location.pathname});
openDialog(requestDialog)}
document.querySelectorAll('[data-dialog]').forEach(b=>b.onclick=()=>{if(b.dataset.dialog==='account')openDialog($('#account-dialog'));else request(b.dataset.dialog,b.dataset.model)});
const models={'36':{title:'36 мм — каркасно-щитовые',description:'Межкомнатная дверь с коробом и погонажем в едином оформлении.',features:['Полотно толщиной 36 мм','Подбор покрытия под интерьер','Комплектация коробом, наличниками и доборами']},'42':{title:'42 мм — скрытый монтаж',description:'Дверь для интерьеров, в которых важна чистота линий.',features:['Полотно толщиной 42 мм','Каркас из фанеры или алюминия — в зависимости от исполнения','Подбор покрытия, открывания и фурнитуры']},'59':{title:'59 мм — алюминиевый каркас',description:'Конструкция для высоких полотен и разных вариантов отделки.',features:['Полотно толщиной 59 мм','Алюминиевый каркас и алюминиевый торец','Покрытие и комплектацию подбираем под проект']}};
let selected='42';document.querySelectorAll('[data-model]').forEach(b=>b.onclick=()=>{selected=b.dataset.model;const m=models[selected];$('#model-title').textContent=m.title;$('#model-description').textContent=m.description;$('#model-features').replaceChildren(...m.features.map(f=>{const li=document.createElement('li');li.textContent=f;return li}));openDialog($('#model-dialog'))});const modelRequest=$('#model-request');if(modelRequest)modelRequest.onclick=()=>{closeDialog($('#model-dialog'));request('calculate',selected)};const accountRequest=$('#account-request');if(accountRequest)accountRequest.onclick=()=>{closeDialog($('#account-dialog'));request('dealer')};
document.querySelectorAll('a[href^="tel:"]').forEach(a=>a.addEventListener('click',()=>metricGoal('phone_click',{page_path:location.pathname,phone:a.getAttribute('href').replace('tel:','')})));document.querySelectorAll('[data-photo]').forEach(b=>b.onclick=()=>{const d=$('#photo-dialog');d.querySelector('img').src=b.dataset.photo;d.querySelector('img').alt=b.dataset.caption;d.querySelector('p').textContent=b.dataset.caption;openDialog(d)});
ensurePrivacyConsent();
form.onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,name=f.elements.name,phone=f.elements.phone,submit=f.querySelector('[type="submit"]'),status=$('.form-status');
name.value=name.value.trim();if(!name.value){name.setCustomValidity('Укажите имя.');name.reportValidity();return}name.setCustomValidity('');
const subscriberDigits=subscriberPhoneDigits(phone.value);if(subscriberDigits.length!==10){phone.setCustomValidity('Введите ровно 10 цифр после +7.');phone.reportValidity();return}phone.setCustomValidity('');phone.value=formatRuPhone(phone.value);
const metrikaClientId=await getMetrikaClientId();
ensureHidden('metrika_client_id').value=metrikaClientId;
const data=new FormData(f),payload={};for(const [key,value] of data.entries()){if(value instanceof File)continue;payload[key]=value}payload.metrika_client_id=metrikaClientId;
window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:'lead_ready',form_type:f.dataset.formType,door_system:payload.door_system||'',page_path:location.pathname});
const original=submit.innerHTML;submit.disabled=true;submit.textContent='Отправляем…';status.textContent='';
try{
  const response=await fetch(LEAD_API_URL,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload)});
  let result={};try{result=await response.json()}catch{}
  if(!response.ok||result.status!=='ready')throw new Error(result.error||('HTTP '+response.status));
  metricGoal('lead_success',{form_type:f.dataset.formType,door_system:payload.door_system||'',lead_id:result.leadId||''});
  window.dataLayer.push({event:'lead_success',form_type:f.dataset.formType,door_system:payload.door_system||'',lead_id:result.leadId||'',page_path:location.pathname});
  status.textContent='Заявка отправлена. Менеджер Hidden Doors свяжется с вами.';
  submit.innerHTML='Заявка отправлена <span aria-hidden="true">✓</span>';
  submit.disabled=true;
}catch(error){
  console.error('Hidden Doors lead submit:',error);
  status.textContent='Не удалось отправить заявку. Попробуйте ещё раз или позвоните: +7 932 022-11-22.';
  submit.innerHTML=original;submit.disabled=false;
}};form.elements.name.oninput=e=>e.target.setCustomValidity('');
form.elements.phone.addEventListener('input',e=>{e.target.value=formatRuPhone(e.target.value);e.target.setCustomValidity('')});
form.elements.phone.addEventListener('paste',e=>{e.preventDefault();let digits=(e.clipboardData?.getData('text')||'').replace(/\D/g,'');if(digits.length===11&&(digits[0]==='7'||digits[0]==='8'))digits=digits.slice(1);e.target.value=formatRuPhone('+7'+digits.slice(0,10));e.target.setCustomValidity('')});
form.elements.phone.addEventListener('focus',e=>{if(!e.target.value.startsWith('+7'))e.target.value='+7'});
const doorsToggle=$('.doors-toggle'),doorsMenu=$('#doors-submenu');
if(doorsToggle&&doorsMenu){doorsToggle.onclick=()=>{const expanded=doorsToggle.getAttribute('aria-expanded')==='true';doorsToggle.setAttribute('aria-expanded',String(!expanded));doorsMenu.hidden=expanded};document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!doorsMenu.hidden){doorsMenu.hidden=true;doorsToggle.setAttribute('aria-expanded','false');doorsToggle.focus()}});document.addEventListener('click',e=>{if(!e.target.closest('.nav-doors')){doorsMenu.hidden=true;doorsToggle.setAttribute('aria-expanded','false')}})}
const heroSlider=$('[data-hero-slider]');
if(heroSlider){
  const heroSlides=[
    {
      eyebrow:'HIDDEN DOORS / ПРОИЗВОДИТЕЛЬ ДВЕРЕЙ',
      title:'Межкомнатные и<br>скрытые двери<br><span>от производителя — под ваш интерьер.</span>',
      description:'Производим Hidden Doors в Тюмени. Подберём конструкцию, размеры, открывание и отделку под ваш проём и интерьер.',
      primary:'Подобрать дверь',dialog:'calculate',model:'',
      secondary:'Посмотреть системы',href:'#doors',
      note:'Производство Hidden Doors · Тюмень · дилерская сеть по России',
      caption:'Интерьерная визуализация'
    },
    {
      eyebrow:'HIDDEN DOORS / СКРЫТЫЕ ДВЕРИ',
      title:'Скрытые двери без наличников —<br><span>в одной плоскости со стеной.</span>',
      description:'Двери скрытого монтажа 42 и 59 мм — под покраску, панели и другие материалы интерьера. Подберём размер и открывание до подготовки проёма.',
      primary:'Подобрать скрытую дверь',dialog:'calculate',model:'',
      secondary:'Рассчитать стоимость',href:'#calculate',
      note:'Скрытый монтаж · 42 и 59 мм · под разные варианты отделки',
      caption:'Интерьерная визуализация'
    },
    {
      eyebrow:'HIDDEN DOORS / МЕЖКОМНАТНЫЕ ДВЕРИ 36 ММ',
      title:'Межкомнатная дверь,<br>короб и наличники —<br><span>в одном оформлении.</span>',
      description:'Полотно, короб, наличники и доборы подбираются как единый комплект. Выберите размеры и покрытие под ваш интерьер.',
      primary:'Рассчитать комплект',dialog:'calculate',model:'36',
      secondary:'Посмотреть двери 36 мм',href:'doors/36/',
      note:'Полотно · короб · наличники · доборы в едином оформлении',
      caption:'Интерьерная визуализация'
    },
    {
      eyebrow:'HIDDEN DOORS / ДИЛЕРАМ',
      title:'Добавьте межкомнатные и скрытые двери<br>в ассортимент вашего салона —<br><span>напрямую от производителя.</span>',
      description:'Системы 36, 42 и 59 мм, производство в Тюмени, материалы и инструменты для подбора и расчёта заказов ваших клиентов.',
      primary:'Получить дилерские условия',dialog:'dealer',model:'',
      secondary:'Получить оптовый прайс',href:'dealers/',
      note:'Для дверных салонов и профессиональных партнёров',
      caption:'Hidden Doors · офис'
    }
  ];
  const images=[...heroSlider.querySelectorAll('[data-hero-image]')];
  const pages=[...heroSlider.querySelectorAll('[data-hero-go]')];
  const eyebrow=heroSlider.querySelector('[data-hero-eyebrow]');
  const title=heroSlider.querySelector('[data-hero-title]');
  const description=heroSlider.querySelector('[data-hero-description]');
  const primary=heroSlider.querySelector('[data-hero-primary]');
  const secondary=heroSlider.querySelector('[data-hero-secondary]');
  const note=heroSlider.querySelector('[data-hero-note]');
  const captionNode=heroSlider.querySelector('[data-hero-caption]');
  const prev=heroSlider.querySelector('[data-hero-prev]');
  const next=heroSlider.querySelector('[data-hero-next]');
  const interval=15000;
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  let current=0,timer=null,remaining=interval,startedAt=0,touchX=null;
  const pauseReasons=new Set();
  const stopTimer=()=>{
    if(timer){
      remaining=Math.max(0,remaining-(performance.now()-startedAt));
      clearTimeout(timer);
      timer=null;
    }
  };
  const startTimer=()=>{
    if(pauseReasons.size||reducedMotion.matches)return;
    if(remaining<=0)remaining=interval;
    startedAt=performance.now();
    timer=setTimeout(()=>render(current+1,'auto'),remaining);
  };
  const syncPauseClass=()=>heroSlider.classList.toggle('is-paused',pauseReasons.size>0||reducedMotion.matches);
  const setPause=(reason,on)=>{
    if(on){
      if(!pauseReasons.has(reason)){pauseReasons.add(reason);stopTimer()}
    }else{
      pauseReasons.delete(reason);
      if(!pauseReasons.size){syncPauseClass();startTimer()}
    }
    syncPauseClass();
  };
  const render=(nextIndex,source='manual')=>{
    stopTimer();
    current=(nextIndex+heroSlides.length)%heroSlides.length;
    remaining=interval;
    const slide=heroSlides[current];
    heroSlider.dataset.heroIndex=String(current);
    images.forEach((img,i)=>img.classList.toggle('is-active',i===current));
    pages.forEach((button,i)=>{
      const active=i===current;
      button.classList.toggle('is-active',active);
      if(active)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');
    });
    eyebrow.textContent=slide.eyebrow;
    title.innerHTML=slide.title;
    description.textContent=slide.description;
    primary.innerHTML=slide.primary+' <span aria-hidden="true">↗</span>';
    primary.dataset.dialog=slide.dialog;
    if(slide.model)primary.dataset.model=slide.model;else delete primary.dataset.model;
    secondary.href=slide.href;
    secondary.innerHTML=slide.secondary+' <span aria-hidden="true">→</span>';
    note.textContent=slide.note;
    captionNode.textContent=slide.caption;
    if(source!=='auto')metricGoal('hero_slide_change',{slide:String(current+1),source,page_path:location.pathname});
    startTimer();
  };
  pages.forEach(button=>button.addEventListener('click',()=>render(Number(button.dataset.heroGo),'number')));
  prev.addEventListener('click',()=>render(current-1,'arrow'));
  next.addEventListener('click',()=>render(current+1,'arrow'));
  heroSlider.addEventListener('mouseenter',()=>setPause('hover',true));
  heroSlider.addEventListener('mouseleave',()=>setPause('hover',false));
  heroSlider.addEventListener('focusin',()=>setPause('focus',true));
  heroSlider.addEventListener('focusout',()=>setTimeout(()=>setPause('focus',heroSlider.contains(document.activeElement)),0));
  heroSlider.addEventListener('touchstart',e=>{touchX=e.changedTouches[0]?.clientX??null},{passive:true});
  heroSlider.addEventListener('touchend',e=>{
    if(touchX===null)return;
    const endX=e.changedTouches[0]?.clientX??touchX;
    const delta=endX-touchX;
    touchX=null;
    if(Math.abs(delta)>45)render(current+(delta<0?1:-1),'swipe');
  },{passive:true});
  document.addEventListener('visibilitychange',()=>setPause('hidden',document.hidden));
  reducedMotion.addEventListener('change',()=>{syncPauseClass();if(reducedMotion.matches)stopTimer();else startTimer()});
  syncPauseClass();
  startTimer();
}

const parallaxImages=[...document.querySelectorAll('[data-parallax="hero"]')];
if(parallaxImages.length){const reduced=matchMedia('(prefers-reduced-motion: reduce)'),desktop=matchMedia('(min-width: 901px)'),hero=parallaxImages[0].closest('.hero');let scheduled=false;const update=()=>{scheduled=false;if(reduced.matches||!desktop.matches){parallaxImages.forEach(img=>img.style.removeProperty('--parallax-y'));return}const r=hero.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;const amount=Math.max(-22,Math.min(22,-r.top*.055));parallaxImages.forEach(img=>img.style.setProperty('--parallax-y',amount+'px'))};const queue=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update)}};addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue,{passive:true});reduced.addEventListener('change',queue);desktop.addEventListener('change',queue);queue()}
const finishData=$('#finish-data');if(finishData){const finishes=JSON.parse(finishData.textContent);document.querySelectorAll('[data-finish]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-finish]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));const f=finishes[Number(b.dataset.finish)];$('#finish-content h3').textContent=f[1];$('#finish-content p').textContent=f[2]})}


