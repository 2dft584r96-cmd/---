const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons = {
 file:'<path d="M14 2H6v20h12V6zM14 2v5h4M9 12h6M9 16h6"/>',
 upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6"/>',
 chat:'<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
 hash:'<path d="M5 9h15M4 15h15M11 3 7 21M17 3l-4 18"/>',
 bookmark:'<path d="M6 3h12v18l-6-4-6 4V3Z"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 arrow:'<path d="m5 12 7-7 7 7M12 5v15"/>',
 users:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-3-5"/>',
 chevron:'<path d="m9 5 7 7-7 7"/>',
 close:'<path d="m6 6 12 12M18 6 6 18"/>',
 headphones:'<path d="M3 14v-2a9 9 0 0 1 18 0v2M3 13h4v8H3zM17 13h4v8h-4z"/>',
 smile:'<circle cx="12" cy="12" r="9"/><path d="M8 14s1 3 4 3 4-3 4-3M8 9h.01M16 9h.01"/>',
 logout:'<path d="M9 4H4v16h5M9 12h12m-4-4 4 4-4 4"/>',
 menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 wave:'<path d="M3 10v4M7 6v12M12 3v18M17 7v10M21 10v4"/>'
};
const icon = (name, cls='') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.chat}</svg>`;
const initials = name => name.split(' ').slice(0,2).map(s => s[0]).join('').toUpperCase();
const avatar = (name, id=1, small=false) => `<span class="avatar color-${id%6} ${small?'small':''}">${esc(initials(name))}</span>`;
const today = new Date(); today.setHours(9,0,0,0);
const stamp = mins => new Date(today.getTime()+mins*60000).toISOString();
const demoUsers = [{id:1,name:'Вы',role:'admin'}, {id:2,name:'Анна Соколова',role:'member'}, {id:3,name:'Михаил Белов',role:'member'}, {id:4,name:'Екатерина Волкова',role:'member'}, {id:5,name:'Денис Орлов',role:'member'}];
const demoRooms = [
 {id:1,name:'общий',description:'Вся команда на одной волне. Объявления и жизнь АПЕКС-РАДИО.',kind:'channel',unread:0},
 {id:2,name:'эфир',description:'Планируем эфир, передаём смену, остаёмся на связи.',kind:'channel',unread:3},
 {id:3,name:'редакция',description:'Новости, темы и материалы для эфира.',kind:'channel',unread:2},
 {id:4,name:'музыка',description:'Плейлисты, новинки и музыкальные находки.',kind:'channel',unread:0},
 {id:5,name:'идеи-и-вдохновение',description:'Место для идей, которые хочется услышать.',kind:'channel',unread:0},
 {id:6,name:'Анна Соколова',description:'Личный разговор',kind:'dm',peer:2,unread:0},
 {id:7,name:'Михаил Белов',description:'Личный разговор',kind:'dm',peer:3,unread:0}
];
const demoMessage = (id,room_id,user_id,body,mins,reactions=[],parent_id=null) => ({id,room_id,user_id,body,created:stamp(mins),name:demoUsers.find(u=>u.id===user_id).name,reactions,saved:false,parent_id,replies:0});
let demoFiles=[];
let demoMessages = [
 demoMessage(1,1,2,'Доброе утро, команда! ☀️\nНовая неделя — новые истории. Пусть сегодня всё звучит отлично!',5,[{emoji:'❤️',count:4,mine:0},{emoji:'🔥',count:3,mine:0}]),
 demoMessage(2,1,3,'Всем привет! Собрал темы для утреннего эфира. Сегодня говорим о любимых местах города — подключайтесь к обсуждению в #эфир 🎙️',12,[{emoji:'👍',count:3,mine:0}]),
 demoMessage(3,1,4,'Коллеги, давайте соберём идеи для новой рубрики. Что нашим слушателям было бы интересно узнавать о Кузбассе?\nМожно предлагать даже самые неожиданные варианты 💡',24,[{emoji:'🔥',count:2,mine:0}]),
 demoMessage(4,1,5,'Как насчёт коротких историй о людях, которые меняют наш город? Есть несколько героев на примете.',31,[],3),
 demoMessage(5,1,2,'Отличная идея! Давайте обсудим героев и формат в редакции.',35,[],3),
 demoMessage(6,1,5,'Техническая проверка завершена, студия готова к работе. Всем хорошего эфира! 🎧',48,[{emoji:'✅',count:4,mine:0}]),
 demoMessage(7,2,3,'Темы утреннего эфира: любимые места города, планы на выходные и истории наших слушателей. Дополняйте!',15),
 demoMessage(8,3,4,'Собираем истории о людях Кузбасса. Предложения героев присылайте сюда.',20),
 demoMessage(9,4,5,'Какая песня задаёт вам настроение с утра? Собираем плейлист команды 🎶',10),
 demoMessage(10,5,2,'Здесь живут будущие рубрики, смелые идеи и всё, что вдохновляет.',10),
 demoMessage(11,6,2,'Привет! Как тебе наше новое рабочее пространство?',40)
];
let demo=true, user=demoUsers[0], rooms=structuredClone(demoRooms), users=demoUsers, messages=[], active=1, view='chat', thread=null, needsSetup=true, setupProtected=false, searchQuery='', results=[], mobile=false;
let drafts={}, sending=false, lastSignature='', refreshPromise=null;
const toast = message => { $('#toast').textContent=message; $('#toast').classList.add('visible'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>$('#toast').classList.remove('visible'),3500); };
async function api(path, data) { const res=await fetch('/api'+path,{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined}); const result=await res.json(); if(!res.ok) { if(res.status===401&&!['/login','/state'].includes(path)) toast('Сессия истекла. Войдите снова.'); throw new Error(result.error); } return result; }
function enrichDemo() { return demoMessages.map(m=>({...m,replies:demoMessages.filter(r=>r.parent_id===m.id).length})); }
async function refresh(force=false) {
 if(refreshPromise){await refreshPromise;if(force)return refresh(true);return;}
 refreshPromise=(async()=>{
  try {
   if(demo) messages=enrichDemo().filter(m=>m.room_id===active);
   else {
    const state=await api('/state');user=state.user;rooms=state.rooms;users=state.users;
    if(!rooms.some(r=>r.id===active))active=rooms[0]?.id;
    const requestedRoom=active;
    const next=active?await api('/messages?room='+active):[];
    if(requestedRoom!==active)return;
    messages=next;
   }
   const sig=JSON.stringify([messages,rooms,users]);
   if(force||sig!==lastSignature){lastSignature=sig;renderSidebar();if(view==='chat')renderConversation();else if(!demo)await loadResults();}
  }catch(e){if(force)toast(e.message);}
 })();
 try{await refreshPromise;}finally{refreshPromise=null;}
}

function render() {
 $('#app').innerHTML=`<aside class="rail"><a class="brand" href="/" aria-label="АПЕКС-РАДИО"><img src="/logo.png" alt="АПЕКС-РАДИО"></a><button class="rail-item selected" data-action="home" title="Сообщения">${icon('chat')}<span>Сообщения</span></button><button class="rail-item" data-action="saved" title="Сохранённое">${icon('bookmark')}<span>Сохранённое</span></button><button class="rail-item" data-action="people" title="Команда">${icon('users')}<span>Команда</span></button><button class="rail-item" data-action="files" title="Файлы">${icon('file')}<span>Файлы</span></button><div class="rail-bottom"><span class="rail-wave">${icon('wave')}</span><button class="my-avatar" data-action="account" aria-label="Мой аккаунт">${avatar(user.name,user.id,true)}</button></div></aside>
 <div class="workspace"><header class="topbar"><div class="workspace-label">РАБОЧЕЕ ПРОСТРАНСТВО <span> / </span> КОМАНДА</div><form id="search-form" class="search-box">${icon('search')}<input id="search" autocomplete="off" placeholder="Поиск по сообщениям" aria-label="Поиск по сообщениям"><kbd>Ctrl K</kbd></form><button class="icon-button" data-action="help" aria-label="О пространстве">${icon('info')}</button></header>
 <div class="workspace-body"><aside id="sidebar" class="sidebar"></aside><main class="main"><div id="conversation-header"></div><div id="demo-banner"></div><div class="chat-layout"><section class="chat-primary"><div id="message-list" class="message-list" aria-live="polite"></div><div id="composer-slot"></div></section><aside id="thread-panel" class="thread-panel" hidden></aside></div></main></div></div>`;
 renderSidebar();renderConversation();
 $('#search-form').addEventListener('submit',async e=>{e.preventDefault();searchQuery=$('#search').value.trim();if(!searchQuery)return;view='search';thread=null;await loadResults();});
}
function renderSidebar(){
 $('#sidebar').classList.toggle('open',mobile);
 $('#sidebar').innerHTML=`<div class="team-heading"><div><span class="eyebrow">НА ОДНОЙ ВОЛНЕ</span><h2>Команда АПЕКС</h2></div><span class="workspace-dot"></span></div><div class="sidebar-caption">В ритме любимого города</div>
 <nav><button class="nav-link ${view==='chat'?'current':''}" data-action="home">${icon('chat')} Все сообщения</button><button class="nav-link ${view==='saved'?'current':''}" data-action="saved">${icon('bookmark')} Сохранённое</button><button class="nav-link ${view==='files'?'current':''}" data-action="files">${icon('file')} Файлы команды</button></nav>
 <div class="section-label">Каналы <button data-action="new-channel" class="icon-button" aria-label="Создать канал">${icon('plus')}</button></div><div class="room-list">${rooms.filter(r=>r.kind==='channel').map(roomButton).join('')}</div><button class="add-channel" data-action="new-channel">${icon('plus')} Добавить канал</button>
 <div class="section-label direct-label">Личные сообщения <button data-action="people" class="icon-button" aria-label="Написать коллеге">${icon('plus')}</button></div><div class="room-list">${rooms.filter(r=>r.kind==='dm').map(roomButton).join('') || '<p class="sidebar-hint">Начните разговор с коллегой</p>'}</div>
 <div class="sidebar-bottom"><div class="invite-card">${icon('users')}<strong>Вместе звучим лучше</strong><p>Соберите всю команду<br>в одном пространстве</p><button data-action="invite">Пригласить коллегу <span>↗</span></button></div><span class="workspace-footer">АПЕКС-РАДИО <span>•</span> КУЗБАСС</span></div>`;
}
function roomButton(r){return `<button class="room ${active===r.id&&view==='chat'?'active':''}" data-room="${r.id}">${r.kind==='channel'?icon('hash'):avatar(r.name,r.id,true)}<span>${esc(r.name)}</span>${r.unread?`<b>${r.unread}</b>`:''}</button>`;}
function renderConversation(){
 const room=rooms.find(r=>r.id===active); if(!room)return;
 $('#conversation-header').innerHTML=`<header class="conversation-header"><button class="icon-button mobile-toggle" data-action="menu" aria-label="Открыть каналы">${icon('menu')}</button><div class="channel-heading"><h1>${room.kind==='channel'?'<span>#</span>':''}${esc(room.name)}</h1><p>${esc(room.description||'Личный разговор с коллегой')}</p></div><button class="member-stack" data-action="people" aria-label="Участники команды">${users.slice(1,4).map(u=>avatar(u.name,u.id,true)).join('')}<span>${users.length}</span></button><span class="header-separator"></span><button class="icon-button" data-action="room-info" aria-label="О канале">${icon('info')}</button></header>`;
 $('#demo-banner').innerHTML=demo?`<div class="demo-banner"><span><i></i> Демонстрация <span class="demo-explainer">· Познакомьтесь с пространством команды</span></span><button data-action="auth">${needsSetup?'Создать пространство':'Войти в пространство'} ${icon('chevron')}</button></div>`:'';
 const list=$('#message-list');const nearBottom=list.scrollHeight-list.scrollTop-list.clientHeight<150;const old=list.scrollTop;
 list.innerHTML=`<div class="channel-welcome"><div class="welcome-mark">${icon(room.kind==='channel'?'hash':'chat')}</div><div><span class="eyebrow">${room.kind==='channel'?'МЕСТО, ГДЕ МЫ НА СВЯЗИ':'РАЗГОВОР С КОЛЛЕГОЙ'}</span><h2>${room.kind==='channel'?'Вся команда. Одна волна.':esc(room.name)}</h2><p>${esc(room.description||'Этот разговор виден только вам двоим.')}</p></div><div class="sound-wave" aria-hidden="true">${Array.from({length:24},(_,i)=>`<i class="bar-${i%8}"></i>`).join('')}</div></div>${renderMessages(messages.filter(m=>!m.parent_id))}${!messages.some(m=>!m.parent_id)?'<div class="empty-state">Здесь начинается разговор.<br><span>Напишите первое сообщение команде.</span></div>':''}`;
 if(nearBottom)list.scrollTop=list.scrollHeight;else list.scrollTop=old;
 if(!$('#message-form')) renderComposer();
 $('#composer-body').placeholder=`Написать ${room.kind==='channel'?'в #'+room.name:room.name}`;
 renderThread();
}
function renderMessages(list){ let date='';return list.map(m=>{const d=new Date(m.created).toLocaleDateString('ru-RU',{day:'numeric',month:'long'});const divider=d!==date?`<div class="date-divider"><span>${new Date(m.created).toDateString()===new Date().toDateString()?'Сегодня':d}</span></div>`:'';date=d;return divider+messageHtml(m);}).join(''); }
function messageHtml(m, inThread=false){return `<article class="message" id="message-${m.id}">${avatar(m.name,m.user_id)}<div class="message-content"><div class="message-meta"><strong>${esc(m.name)}</strong>${m.user_id===user.id?'<span class="you-tag">вы</span>':''}<time datetime="${esc(m.created)}">${new Date(m.created).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</time>${m.saved?`<span class="saved-indicator" title="Сохранено">${icon('bookmark')}</span>`:''}</div><div class="message-body">${esc(m.body).replace(/(^|\s)(#[\p{L}\d-]+)/gu,'$1<span class="mention">$2</span>')}</div>${m.file?`<a class="file-attachment" href="${demo?esc(demoFiles.find(f=>f.id===m.file.id)?.url||'#'):'/api/files/'+m.file.id}" download="${esc(m.file.name)}">${icon('file')}<span><strong>${esc(m.file.name)}</strong><small>${fileSize(m.file.size)} · Скачать</small></span>${icon('arrow')}</a>`:''}${m.reactions.length?`<div class="reactions">${m.reactions.map(r=>`<button class="reaction ${r.mine?'mine':''}" data-reaction="${esc(r.emoji)}" data-id="${m.id}" aria-label="Реакция ${esc(r.emoji)}, ${r.count}" aria-pressed="${!!r.mine}">${esc(r.emoji)} <span>${r.count}</span></button>`).join('')}</div>`:''}${m.replies&&!inThread?`<button class="thread-link" data-thread="${m.id}">${icon('chat')} Обсуждение · ${m.replies} <span>Открыть ответы →</span></button>`:''}${m.room_name?`<button class="result-room" data-room="${m.room_id}">Перейти в разговор →</button>`:''}</div><div class="message-actions"><button class="icon-button" data-action="react" data-id="${m.id}" title="Добавить реакцию" aria-label="Добавить реакцию">${icon('smile')}</button>${!m.parent_id?`<button class="icon-button" data-thread="${m.id}" title="Ответить в обсуждении" aria-label="Ответить в обсуждении">${icon('chat')}</button>`:''}<button class="icon-button ${m.saved?'is-saved':''}" data-save="${m.id}" title="${m.saved?'Убрать из сохранённого':'Сохранить'}" aria-label="${m.saved?'Убрать из сохранённого':'Сохранить'}">${icon('bookmark')}</button></div></article>`;}
function renderComposer(){ $('#composer-slot').innerHTML=`<form id="message-form" class="composer"><textarea id="composer-body" rows="2" maxlength="4000" aria-label="Текст сообщения"></textarea><div class="composer-tools"><button class="icon-button" type="button" data-action="upload" aria-label="Прикрепить файл" title="Прикрепить файл до 10 МБ">${icon('plus')}</button><span class="composer-label">Сообщение команде</span><button class="icon-button" type="button" data-action="composer-emoji" aria-label="Добавить эмодзи">${icon('smile')}</button><button class="send-button" type="submit" aria-label="Отправить сообщение">${icon('arrow')}</button></div></form><div class="composer-hint"><span><span class="connection-dot"></span>${demo?'Демонстрационные сообщения видны только вам':'Переписка сохраняется в пространстве команды'}</span><span>Enter — отправить · Shift + Enter — новая строка</span></div>`;$('#composer-body').value=drafts[active]||''; $('#composer-body').addEventListener('input',e=>drafts[active]=e.target.value);bindComposer($('#message-form'),$('#composer-body')); }
function bindComposer(form,input,parent=null){form.addEventListener('submit',async e=>{e.preventDefault();await sendMessage(input,parent);}); input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();form.requestSubmit();}});}
async function sendMessage(input,parent){const body=input.value.trim();if(!body||sending)return; sending=true;const room=active;try{if(demo){demoMessages.push({...demoMessage(Date.now(),room,user.id,body,0,[],parent),created:new Date().toISOString()});}else await api('/messages',{roomId:room,body,parentId:parent});input.value='';if(!parent)drafts[room]='';await refresh(true);$('#message-list').scrollTop=$('#message-list').scrollHeight;}catch(e){toast(e.message);}finally{sending=false;}}
function renderThread(){const panel=$('#thread-panel');panel.hidden=!thread;if(!thread)return;const parent=messages.find(m=>m.id===thread);if(!parent){thread=null;panel.hidden=true;return;}const draft=$('#thread-body')?.value||'';const focused=document.activeElement?.id==='thread-body';panel.innerHTML=`<div class="thread-header"><h2>Обсуждение</h2><button class="icon-button" data-action="close-thread" aria-label="Закрыть обсуждение">${icon('close')}</button></div><div class="thread-messages">${messageHtml(parent,true)}<div class="thread-count">Ответы: ${messages.filter(m=>m.parent_id===thread).length}</div>${messages.filter(m=>m.parent_id===thread).map(m=>messageHtml(m,true)).join('')}</div><form id="thread-form" class="thread-composer"><textarea id="thread-body" placeholder="Ответить в обсуждении…" aria-label="Ответ в обсуждении" maxlength="4000" rows="3"></textarea><button type="submit" class="primary">Отправить ${icon('arrow')}</button></form>`;$('#thread-body').value=draft;bindComposer($('#thread-form'),$('#thread-body'),thread);if(focused)$('#thread-body').focus();}
async function loadResults(){if(view==='files')return renderFiles();results=demo?enrichDemo().filter(m=>view==='saved'?m.saved:m.body.toLocaleLowerCase('ru').includes(searchQuery.toLocaleLowerCase('ru'))).map(m=>({...m,room_name:rooms.find(r=>r.id===m.room_id)?.name})):await api(view==='saved'?'/saved':'/search?q='+encodeURIComponent(searchQuery));$('#conversation-header').innerHTML=`<header class="conversation-header"><button class="icon-button mobile-toggle" data-action="menu" aria-label="Открыть каналы">${icon('menu')}</button><div class="channel-heading"><h1>${view==='saved'?'Сохранённое':'Результаты поиска'}</h1><p>${view==='saved'?'Важное всегда под рукой':esc('По запросу «'+searchQuery+'»')} · ${results.length}</p></div></header>`;$('#message-list').innerHTML=results.length?renderMessages(results):`<div class="empty-state">${icon(view==='saved'?'bookmark':'search')}<h2>${view==='saved'?'Сохраните самое важное':'Пока ничего не найдено'}</h2><span>${view==='saved'?'Нажмите на закладку рядом с сообщением.':'Попробуйте другое слово или часть фразы.'}</span></div>`;$('#composer-slot').innerHTML='';$('#thread-panel').hidden=true;renderSidebar();}
function modal(title,body){const dialog=$('#modal');dialog.innerHTML=`<div class="modal-header"><h2>${esc(title)}</h2><button class="icon-button" data-action="close-modal" aria-label="Закрыть">${icon('close')}</button></div>${body}`;if(!dialog.open)dialog.showModal();}
function auth(mode=needsSetup?'setup':'login'){
 const registering=mode!=='login';modal(mode==='setup'?'Добро пожаловать в команду':mode==='register'?'Присоединиться к команде':'С возвращением!',`<p class="modal-description">${mode==='setup'?'Создайте аккаунт администратора АПЕКС-РАДИО. Демонстрационная переписка не попадёт в ваше пространство.':mode==='register'?'Используйте одноразовый код приглашения от администратора.':'Войдите в рабочее пространство АПЕКС-РАДИО.'}</p><form id="auth-form">${mode==='setup'&&setupProtected?'<label>Код создания пространства<input name="setupToken" type="password" required autocomplete="off" placeholder="Код из настроек сервера"></label>':''}${registering?'<label>Имя и фамилия<input name="name" required maxlength="80" autocomplete="name" placeholder="Как к вам обращаться"></label>':''}<label>Рабочая почта<input name="email" type="email" required autocomplete="email" placeholder="name@apexradio.ru"></label><label>Пароль<input name="password" type="password" required minlength="10" maxlength="128" autocomplete="${registering?'new-password':'current-password'}" placeholder="Не менее 10 символов"></label>${mode==='register'?'<label>Код приглашения<input name="invite" required autocomplete="off" placeholder="Код от администратора"></label>':''}<div id="form-error" class="form-error" role="alert"></div><button class="primary full" type="submit">${registering?'Начать работу':'Войти'}</button></form><button class="text-button" data-auth="${registering?'login':'register'}">${registering?'Уже есть аккаунт? Войти':'Есть приглашение? Присоединиться'}</button>`);
 $('#auth-form').addEventListener('submit',async e=>{e.preventDefault();const button=e.target.querySelector('[type=submit]');button.disabled=true;try{await api('/'+mode,Object.fromEntries(new FormData(e.target)));demo=false;thread=null;view='chat';drafts={};const state=await api('/state');user=state.user;rooms=state.rooms;users=state.users;active=rooms[0].id;messages=await api('/messages?room='+active);$('#modal').close();render();await refresh(true);toast('Вы в пространстве команды!');}catch(error){$('#form-error').textContent=error.message;}finally{button.disabled=false;}});
}
async function selectRoom(id){drafts[active]=$('#composer-body')?.value||drafts[active]||'';active=id;view='chat';thread=null;mobile=false;$('#composer-slot').innerHTML='';if(demo){rooms.find(r=>r.id===id).unread=0;}else await api('/read',{roomId:id});await refresh(true);$('#composer-body')?.focus();}
async function people(){modal('Команда АПЕКС',`<p class="modal-description">${demo?'Пример состава команды. После создания пространства здесь появятся ваши коллеги.':'Выберите коллегу, чтобы начать личный разговор.'}</p><div class="people-list">${users.map(u=>`<button class="person" data-person="${u.id}" ${u.id===user.id?'disabled':''}>${avatar(u.name,u.id)}<span><strong>${esc(u.name)}</strong><small>${u.id===user.id?'Это вы':u.role==='admin'?'Администратор':'Участник команды'}</small></span>${u.id!==user.id?icon('chat'):''}</button>`).join('')}</div>`);}
const fileSize = size => size<1024?size+' Б':size<1048576?(size/1024).toFixed(1)+' КБ':(size/1048576).toFixed(1)+' МБ';
async function renderFiles(){
 const files=demo?demoFiles:await api('/files');
 $('#conversation-header').innerHTML=`<header class="conversation-header"><button class="icon-button mobile-toggle" data-action="menu" aria-label="Открыть каналы">${icon('menu')}</button><div class="channel-heading"><h1>Файлы команды</h1><p>Документы, записи и материалы · до 10 МБ на файл</p></div><button class="primary files-upload" data-action="upload">${icon('upload')} Загрузить</button></header>`;
 $('#message-list').innerHTML=`<div class="files-intro">Загрузка в ${esc(rooms.find(r=>r.id===active)?.kind==='channel'?'#':'')}${esc(rooms.find(r=>r.id===active)?.name||'разговор')}. Чтобы выбрать другой разговор, откройте его в меню.<br>Здесь показаны только файлы доступных вам разговоров.</div>`+(files.length?`<div class="files-list">${files.map(f=>`<article class="file-row">${icon('file')}<div><strong>${esc(f.name)}</strong><small>${fileSize(f.size)} · ${esc(f.author)} · ${new Date(f.created).toLocaleDateString('ru-RU')}</small><button data-room="${f.room_id}" class="result-room">${f.kind==='channel'?'# '+esc(f.room_name):'Личный разговор'} →</button></div><a class="secondary" href="${demo?esc(f.url):'/api/files/'+f.id}" download="${esc(f.name)}">Скачать</a></article>`).join('')}</div>`:'<div class="empty-state">Пока нет файлов<br><span>Прикрепите документ, изображение или аудиозапись к разговору.</span></div>');
 $('#composer-slot').innerHTML='';$('#thread-panel').hidden=true;renderSidebar();
}
async function uploadFile(){
 const roomId=active;const input=document.createElement('input');input.type='file';
 input.addEventListener('change',async()=>{const file=input.files[0];if(!file)return;if(!file.size||file.size>10*1024*1024)return toast('Выберите файл размером от 1 байта до 10 МБ.');if(file.name.length>180)return toast('Сократите имя файла до 180 символов.');
 try{toast('Загружаем файл…');if(demo){const id=Date.now();const room=rooms.find(r=>r.id===roomId);demoFiles.unshift({id,name:file.name,size:file.size,url:URL.createObjectURL(file),room_id:roomId,room_name:room.name,kind:room.kind,author:user.name,created:new Date().toISOString()});demoMessages.push({...demoMessage(id,roomId,user.id,'Файл: '+file.name,0),created:new Date().toISOString(),file:{id,name:file.name,size:file.size}});}else{const content=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=()=>reject(new Error('Не удалось прочитать файл.'));reader.readAsDataURL(file);});await api('/files',{roomId,name:file.name,content});}await refresh(true);if(view==='files')await renderFiles();toast('Файл загружен');}catch(e){toast(e.message);}
 });input.click();
}
const actions={
 files:async()=>{view='files';thread=null;await renderFiles();},upload:uploadFile,
 home:()=>selectRoom(active),saved:async()=>{view='saved';thread=null;await loadResults();},people,
 menu:()=>{mobile=!mobile;renderSidebar();},'close-modal':()=>$('#modal').close(),'close-thread':()=>{thread=null;renderThread();},
 auth:()=>auth(),account:()=>{if(demo)return auth();modal('Ваш аккаунт',`<div class="account-card">${avatar(user.name,user.id)}<h3>${esc(user.name)}</h3><p>${esc(user.email)}</p></div><button class="secondary full" data-action="logout">Выйти из пространства</button>`);},
 logout:async()=>{await api('/logout',{});location.reload();},
 help:()=>modal('На одной волне',`<div class="about-brand"><img src="/logo.png" alt="АПЕКС-РАДИО"><h3>В ритме любимого города</h3></div><p class="modal-description">Пространство команды АПЕКС-РАДИО: каналы, личные сообщения, обсуждения и важные идеи. Фирменное оформление основано на вашем медиа-ките.</p><p class="modal-description">${demo?'Сейчас открыт демонстрационный режим. Имена и сообщения вымышлены. Изменения исчезнут после перезагрузки.':'Каналы доступны всем участникам. Личные сообщения доступны только участникам разговора.'}</p>`),
 'room-info':()=>{const r=rooms.find(r=>r.id===active);modal(r.kind==='channel'?'# '+r.name:r.name,`<p class="modal-description">${esc(r.description||'Личный разговор')}</p><div class="info-note">${r.kind==='channel'?'Канал доступен всем участникам пространства.':'Разговор виден только двум его участникам.'}</div>`);},
 'new-channel':()=>{modal('Новый канал','<p class="modal-description">Объедините команду вокруг отдела, проекта или идеи. Канал будет доступен всем коллегам.</p><form id="channel-form"><label>Название<input name="name" required maxlength="40" placeholder="например, утреннее-шоу"></label><label>О чём этот канал<textarea name="description" maxlength="250" rows="3" placeholder="Краткое описание"></textarea></label><div id="form-error" class="form-error" role="alert"></div><button class="primary full">Создать канал</button></form>');$('#channel-form').addEventListener('submit',async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target));try{let id;if(demo){const name=data.name.trim().toLowerCase().replace(/\s+/g,'-');if(!name)throw new Error('Введите название канала.');if(rooms.some(r=>r.kind==='channel'&&r.name===name))throw new Error('Канал уже существует.');id=Date.now();rooms.push({id,name,description:data.description,kind:'channel',unread:0});}else id=(await api('/rooms',data)).id;$('#modal').close();await selectRoom(id);}catch(error){$('#form-error').textContent=error.message;}});},
 invite:async()=>{if(demo)return auth();if(user.role!=='admin')return toast('Попросите администратора создать приглашение.');const {invite}=await api('/invites',{});modal('Пригласить коллегу',`<p class="modal-description">Передайте коллеге этот код и адрес рабочего пространства. При входе нужно выбрать «Есть приглашение? Присоединиться».</p><label>Одноразовый код<input id="invite-code" readonly value="${esc(invite)}"></label><p class="modal-description">Код действует 24 часа и подходит для одного сотрудника.</p><button class="primary full" data-action="copy-invite">Скопировать код</button>`);},
 'copy-invite':async()=>{const input=$('#invite-code');input.select();try{await navigator.clipboard.writeText(input.value);toast('Код скопирован');}catch{toast('Выделенный код можно скопировать вручную.');}},
 react:(button)=>{modal('Добавить реакцию',`<div class="emoji-picker">${['👍','❤️','🔥','✅','🎙️','😂'].map(emoji=>`<button data-reaction="${emoji}" data-id="${button.dataset.id}" aria-label="Реакция ${emoji}">${emoji}</button>`).join('')}</div>`);},
 'composer-emoji':()=>{const input=$('#composer-body');input.setRangeText(' 🎙️ ',input.selectionStart,input.selectionEnd,'end');drafts[active]=input.value;input.focus();}
};
document.addEventListener('click',async event=>{const button=event.target.closest('button');if(!button)return;try{
 if(button.dataset.action)await actions[button.dataset.action]?.(button);
 else if(button.dataset.room)await selectRoom(Number(button.dataset.room));
 else if(button.dataset.auth)auth(button.dataset.auth);
 else if(button.dataset.thread){const id=Number(button.dataset.thread);if(view!=='chat'){const m=results.find(m=>m.id===id);await selectRoom(m.room_id);}thread=id;renderThread();$('#thread-body')?.focus();}
 else if(button.dataset.person){const peer=Number(button.dataset.person);let id;if(demo){let room=rooms.find(r=>r.peer===peer);if(!room){room={id:Date.now(),name:users.find(u=>u.id===peer).name,kind:'dm',peer,unread:0};rooms.push(room);}id=room.id;}else id=(await api('/rooms',{userId:peer})).id;$('#modal').close();await selectRoom(id);}
 else if(button.dataset.save){const id=Number(button.dataset.save);if(demo){const m=demoMessages.find(m=>m.id===id);m.saved=!m.saved;}else await api('/saved',{messageId:id});await refresh(true);if(view!=='chat'&&demo)await loadResults();}
 else if(button.dataset.reaction){const id=Number(button.dataset.id),emoji=button.dataset.reaction;if(demo){const m=demoMessages.find(m=>m.id===id);const r=m.reactions.find(r=>r.emoji===emoji);if(r){r.count+=r.mine?-1:1;r.mine=!r.mine;m.reactions=m.reactions.filter(r=>r.count);}else m.reactions.push({emoji,count:1,mine:true});}else await api('/reactions',{messageId:id,emoji});if($('#modal').open)$('#modal').close();await refresh(true);if(view!=='chat'&&demo)await loadResults();}
}catch(error){toast(error.message);}});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#search').focus();}if(e.key==='Escape'&&thread&&!$('#modal').open){thread=null;renderThread();}});
$('#modal').addEventListener('click',e=>{if(e.target===$('#modal')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
async function init(){try{const status=await api('/status');needsSetup=status.needsSetup;setupProtected=status.setupProtected;try{const state=await api('/state');demo=false;user=state.user;rooms=state.rooms;users=state.users;active=rooms[0].id;}catch{} }catch{toast('Сервер недоступен. Открыта демонстрация.');} messages=demo?enrichDemo().filter(m=>m.room_id===active):await api('/messages?room='+active);render();setInterval(()=>{if(!demo&&!document.hidden)refresh();},3000);}
init();
