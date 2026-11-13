// Раздел «Работа»: таблица откликов с датами, версии резюме (PDF), новые вакансии, история, ссылки, подготовка.
// Всё хранится только в этом браузере. PDF резюме — в отдельной базе браузера (IndexedDB).
// Новые вакансии приносит помощник на компьютере (tools/job-helper.py) — сам сайт в чужие сайты ходить не может.
// Личные дополнения (чек-лист, список компаний-партнёров, свой город, свои каналы) подключаются файлом из private/ — window.JOB_PRIVATE.
(function () {
  'use strict';

  const App = window.App = window.App || {};
  App.views = App.views || {};

  const HELPER = 'http://127.0.0.1:8766';
  const FEED_KEY = 'kabinet-job-feed-v1';

  const STATUSES = [
    ['want', 'Хочу откликнуться'], ['sent', 'Отправила'], ['reply', 'Ответили'], ['test', 'Тестовое'],
    ['interview', 'Собеседование'], ['offer', 'Оффер'], ['reject', 'Отказ'], ['silent', 'Не ответили'],
  ];
  const ST = Object.fromEntries(STATUSES);
  const CLOSED = ['offer', 'reject', 'silent'];
  const ANSWERED = ['reply', 'test', 'interview', 'offer', 'reject'];

  const DEFAULT_CHANNELS = ['datasciencejobs', 'datajobschannel', 'ml_data_science_job', 'datascienceml_jobs', 'data_science_job',
    'datajob', 'data_vacancies', 'Machinelearning_Jobs', 'foranalysts'];
  const DEFAULT_HABR = ['machine learning', 'data scientist', 'computer vision', 'nlp'];

  const DEFAULT_LINKS = [
    ['Сайты', 'hh.ru — стажировки по ML', 'https://hh.ru/search/vacancy?text=machine+learning+OR+data+scientist&experience=noExperience&order_by=publication_time', 'поиск без опыта, сначала свежие'],
    ['Сайты', 'Хабр Карьера — ML', 'https://career.habr.com/vacancies?q=machine+learning&qid=1&type=all', 'стажёры; поменяй qid=3 для junior'],
    ['Сайты', 'LinkedIn', 'https://www.linkedin.com/jobs/', 'профиль + пост о поиске работы'],
    ['Сайты', 'Хабр Карьера — профиль', 'https://career.habr.com', 'заполненный профиль тоже находят рекрутеры'],
    ['Telegram — ML и данные', 'Data Science Jobs', 'https://t.me/datasciencejobs', ''],
    ['Telegram — ML и данные', 'Data jobs feed', 'https://t.me/datajobschannel', ''],
    ['Telegram — ML и данные', 'ML / DS Jobs', 'https://t.me/ml_data_science_job', ''],
    ['Telegram — ML и данные', 'Data Science Jobs (ещё один)', 'https://t.me/datascienceml_jobs', ''],
    ['Telegram — ML и данные', 'Вакансии data science и ML', 'https://t.me/data_science_job', ''],
    ['Telegram — ML и данные', 'Data jobs (Proglib)', 'https://t.me/datajob', ''],
    ['Telegram — ML и данные', 'Data & ML jobs', 'https://t.me/data_vacancies', ''],
    ['Telegram — ML и данные', 'Machine Learning Jobs', 'https://t.me/Machinelearning_Jobs', ''],
    ['Telegram — ML и данные', 'Job for Analysts & Data Scientists', 'https://t.me/foranalysts', ''],
  ];

  const ASK_QUESTIONS = 'Как выглядит первый месяц на этой позиции?\nС какими данными и задачами я буду работать?\nКто будет моим наставником, как устроены код-ревью?\nКак оценивают, что стажировка прошла успешно? Есть ли шанс остаться в штате?\nКакой стек и как модели попадают в прод?\nСколько часов в неделю можно совмещать с учёбой?';

  let root = null;
  let filter = 'active';
  let search = '';
  let onlyPartners = false;
  let showHidden = false;
  let helperState = { ok: null, lastScan: 0, busy: false, errors: [] };
  let feedLoaded = false;

  function P() { return window.JOB_PRIVATE || {}; }
  function J() {
    const s = Store.state;
    if (!s.jobs || typeof s.jobs !== 'object') s.jobs = {};
    const j = s.jobs;
    ['apps', 'resumes', 'events', 'links'].forEach((k) => { if (!Array.isArray(j[k])) j[k] = []; });
    ['seen', 'check', 'prep'].forEach((k) => { if (!j[k] || typeof j[k] !== 'object') j[k] = {}; });
    if (!j.prefs || typeof j.prefs !== 'object') j.prefs = {};
    return j;
  }
  function prefs() {
    const p = J().prefs;
    return {
      channels: Array.isArray(p.channels) ? p.channels : DEFAULT_CHANNELS.concat(P().channels || []),
      habr: Array.isArray(p.habr) ? p.habr : DEFAULT_HABR,
      seniors: !!p.seniors,
    };
  }
  const today = () => U.dayKey(Date.now());
  const dayTs = (d) => (d ? new Date(d + 'T12:00:00').getTime() : 0);
  const daysSince = (d) => (d ? Math.floor((U.startOfDay(Date.now()) - U.startOfDay(dayTs(d))) / 86400000) : null);
  const fmtDay = (d) => (d ? d.slice(8, 10) + '.' + d.slice(5, 7) + (d.slice(0, 4) !== today().slice(0, 4) ? '.' + d.slice(2, 4) : '') : '');
  function logEvent(app, text) { J().events.push({ ts: Date.now(), appId: app ? app.id : null, text }); }

  // ---------- Компании-партнёры (список из личного файла) ----------

  const LEGAL = /^(ооо|пао|оао|зао|ао|ано|гк|нко|фгуп|ип|ооо гк|пк)\s+/;
  function norm(s) {
    return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[«»"'“”„()]/g, ' ').replace(/[.,:;!?/\\]+/g, ' ')
      .replace(/\s+/g, ' ').trim().replace(LEGAL, '').replace(LEGAL, '').trim();
  }
  let partnerIndex = null;
  function partners() {
    const fresh = J().partnersFresh;
    const list = (fresh && fresh.items && fresh.items.length ? fresh.items : P().partners) || [];
    if (partnerIndex && partnerIndex.n === list.length) return partnerIndex;
    const keys = [];
    list.forEach((p) => {
      const parts = [p.name].concat((p.name.match(/\(([^)]+)\)/g) || []).map((x) => x.slice(1, -1)), p.aliases || []);
      parts.forEach((x) => {
        const k = norm(x.replace(/\([^)]*\)/g, ''));
        if (k.length >= 2) keys.push({ k, p });
      });
    });
    Object.entries(P().partnerAliases || {}).forEach(([alias, name]) => {
      const p = list.find((x) => x.name === name);
      if (p) keys.push({ k: norm(alias), p, alias: true });
    });
    partnerIndex = { n: list.length, keys };
    return partnerIndex;
  }
  // Название компании из отклика → партнёр или null
  function partnerOf(company) {
    const c = norm(company);
    if (c.length < 2) return null;
    const hit = partners().keys.find(({ k }) => c === k || (c.length >= 4 && (k.startsWith(c + ' ') || c.startsWith(k + ' '))));
    return hit ? hit.p : null;
  }
  // Текст вакансии → партнёр (ищем только заметные названия с большой буквы, чтобы не ловить обычные слова)
  function partnerInText(text) {
    if (!text) return null;
    const t = ' ' + String(text).replace(/ё/g, 'е').replace(/[«»"“”]/g, ' ') + ' ';
    for (const { k, p, alias } of partners().keys) {
      if (k.length < (alias ? 2 : 5)) continue;
      const words = k.split(' ');
      const cap = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const re = new RegExp('[^А-Яа-яA-Za-z0-9]' + cap.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&') + '[^А-Яа-яA-Za-z0-9]', alias ? 'i' : '');
      if (re.test(t)) return p;
    }
    return null;
  }
  function partnerTag(p) {
    return p ? '<span class="tag ok" title="' + U.esc(p.name + (p.group ? ' · ' + p.group : '')) + '">' + I('check') + ' партнёр</span>' : '';
  }

  // ---------- PDF в базе браузера ----------

  let dbP = null;
  function db() {
    if (!dbP) {
      dbP = new Promise((res, rej) => {
        const r = indexedDB.open('kabinet-files', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('files');
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
    }
    return dbP;
  }
  function tx(mode, fn) {
    return db().then((d) => new Promise((res, rej) => {
      const t = d.transaction('files', mode);
      const req = fn(t.objectStore('files'));
      t.oncomplete = () => res(req && req.result);
      t.onerror = () => rej(t.error);
    }));
  }
  const fileGet = (id) => tx('readonly', (s) => s.get(id));
  const filePut = (id, rec) => tx('readwrite', (s) => s.put(rec, id));
  const fileDel = (id) => tx('readwrite', (s) => s.delete(id));

  function openFile(r, download) {
    if (!r || !r.fileId) return;
    fileGet(r.fileId).then((rec) => {
      if (!rec) { U.toast('Файл не найден в этом браузере — загрузи его заново'); return; }
      const url = URL.createObjectURL(rec.blob);
      if (download) {
        const a = document.createElement('a');
        a.href = url; a.download = rec.name || 'резюме.pdf';
        document.body.appendChild(a); a.click(); a.remove();
      } else {
        window.open(url, '_blank', 'noopener');
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }).catch(() => U.toast('Не получилось открыть файл'));
  }

  // Для экспорта/импорта в «Настройках»: PDF едут в том же файле (base64)
  App.jobFilesExport = function () {
    const ids = J().resumes.map((r) => r.fileId).filter(Boolean);
    if (!ids.length || !window.indexedDB) return Promise.resolve([]);
    return Promise.all(ids.map((id) => fileGet(id).then((rec) => rec && new Promise((res) => {
      const fr = new FileReader();
      fr.onload = () => res({ id, name: rec.name, data: fr.result });
      fr.readAsDataURL(rec.blob);
    })))).then((l) => l.filter(Boolean)).catch(() => []);
  };
  App.jobFilesImport = function (list) {
    return Promise.all((list || []).map((f) => fetch(f.data).then((r) => r.blob()).then((blob) => filePut(f.id, { blob, name: f.name })))).catch(() => {});
  };

  // ---------- Помощник и лента вакансий ----------

  function feed() { try { return JSON.parse(localStorage.getItem(FEED_KEY) || '[]'); } catch (e) { return []; } }
  function saveFeed(items) { try { localStorage.setItem(FEED_KEY, JSON.stringify(items)); } catch (e) { /* место кончилось */ } }

  const RE_ML = /(machine learning|машинн\S* обучени|(^|[^a-zа-я])(ml|mlops|llm|nlp|cv)([^a-zа-я]|$)|data scien|дата.?сайен|computer vision|компьютерн\S* зрени|deep learning|нейросет|нейронн\S* сет|pytorch|tensorflow|(^|[^a-zа-я])ai.?(engineer|research|инженер|разработ|developer|специалист)|research (engineer|scientist)|искусственн\S* интеллект)/i;
  const RE_INTERN = /(стаж[её]р|стажировк|intern|trainee|студент|выпускник)/i;
  const RE_JUNIOR = /(junior|джун|младш|начинающ|без опыта|entry.level)/i;
  const RE_SENIOR = /(senior|middle|сеньор|синьор|мидл|team ?lead|tech ?lead|(^|[^a-zа-я])lead|ведущ|старш|head of|principal|руководител)/i;
  const RE_REMOTE = /(удал[её]н|remote|из любой точки)/i;
  // свой город (из личного файла) идёт в одну группу с удалёнкой
  function home() { const h = P().homeCity; return h && h.label && h.re ? { label: h.label, re: new RegExp(h.re, 'i') } : null; }
  function isP1(text) { const h = home(); return RE_REMOTE.test(text) || !!(h && h.re.test(text)); }
  const RE_P2 = /(москв|moscow|мск|санкт|петербург|спб|питер|petersburg)/i;
  const RE_OTHER = /(новосибирск|екатеринбург|казан|нижн\S* новгород|самар|ростов|краснодар|перм[ьи]|воронеж|(^|[^а-я])уф[аеы]([^а-я]|$)|челябинск|омск|томск|тюмен|калининград|минск|алмат|астан|ташкент|тбилиси|ереван|белград|бишкек|кипр|лимассол|дубай|варшав|берлин|амстердам|лиссабон)/i;

  const RE_AD = /(курс[аыеов]?\b|скидк|вебинар|митап|подар|промокод|академи|fast track|интенсив|розыгрыш|опубликовать вакансию|подписывайтесь|разбор задачи|учиться|записывайтесь|регистрируйтесь|регистрация открыта)/i;
  const RE_JOB = /(обязанност|требовани|мы предлагаем|условия:|зарплат|оклад|откликнуться|отклик:|резюме (присылай|отправляй)|hiring|responsibilities|requirements)/i;
  // Заголовок карточки: первая содержательная строка (не одни хештеги)
  function headLine(it) {
    if (!/^(#\S+\s*)+$/.test(String(it.title || '').trim())) return it.title || '';
    const ln = clean(it.text).split('\n').map((l) => l.trim().replace(/^[-–—•*\s]+/, '')).find((l) => l.length > 5 && !/^(#\S+\s*)+$/.test(l));
    return (ln || it.title || '').slice(0, 140);
  }
  function titleOf(it, c) {
    if (c.mlLine && /подборк|дайджест|^вакансии/i.test(it.title || '')) return c.mlLine.slice(0, 140);
    return headLine(it) || 'Вакансия';
  }
  // Подвал канала («Вакансии │ Стажировки │ Удалёнка …») сбивает фильтры — выкидываем такие строки
  function clean(text) { return String(text || '').split('\n').filter((l) => (l.match(/[│|]/g) || []).length < 2).join('\n'); }

  function classify(it) {
    const body = clean(it.text);
    const all = (it.title || '') + '\n' + body + '\n' + (it.locations || []).join(' ');
    const mlLine = RE_ML.test(it.title || '') ? '' : (body.split('\n').find((l) => RE_ML.test(l)) || '').trim().replace(/^[-–—•*\s]+/, '');
    const t = headLine(it);
    const level = RE_SENIOR.test(t) && !RE_INTERN.test(t) && !RE_JUNIOR.test(t) ? 'senior' : RE_INTERN.test(t) ? 'intern' : RE_JUNIOR.test(t) ? 'junior' :
      /intern|стаж/i.test(it.level || '') || RE_INTERN.test(all) ? 'intern' : /junior|младш/i.test(it.level || '') || RE_JUNIOR.test(all) ? 'junior' : RE_SENIOR.test(all) || /senior|middle|lead/i.test(it.level || '') ? 'senior' : '';
    let prio = 3;
    if (it.remote || isP1(all)) prio = 1;
    else if (RE_P2.test(all)) prio = 2;
    else if (RE_OTHER.test(all)) prio = 0;
    const ml = RE_ML.test(all);
    const ad = RE_AD.test(all) && !RE_JOB.test(all);
    const old = it.date && Date.now() - new Date(it.date).getTime() > 31 * 86400000;
    const hide = !ml ? 'не про ML' : ad ? 'не вакансия' : old ? 'старше месяца' : prio === 0 ? 'другой город' : level === 'senior' && !prefs().seniors ? 'для опытных' : '';
    return { level, prio, ml, hide, mlLine };
  }

  function helperCall(path, body, ms) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms || (body ? 180000 : 4000));
    return fetch(HELPER + path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: ctrl.signal } : { signal: ctrl.signal })
      .then((r) => r.json().then((d) => { if (!r.ok) throw new Error(d.error || ('ошибка ' + r.status)); return d; }))
      .finally(() => clearTimeout(t));
  }

  function mergeFeed(items) {
    const keep = feed();
    const byId = new Map(keep.map((x) => [x.id, x]));
    let added = 0;
    (items || []).forEach((x) => {
      const c = classify(x);
      if (!c.ml) return;   // в браузере храним только то, что про ML
      if (!byId.has(x.id)) added += J().seen[x.id] ? 0 : 1;
      const prev = byId.get(x.id);
      byId.set(x.id, Object.assign({}, x, { text: String(x.text || '').slice(0, 1200), firstSeen: prev ? prev.firstSeen : Date.now() }));
    });
    const cutoff = Date.now() - 35 * 86400000;
    const list = Array.from(byId.values()).filter((x) => (x.firstSeen || 0) >= cutoff || J().seen[x.id] === 'added')
      .sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 400);
    saveFeed(list);
    return added;
  }

  function pingHelper() {
    return helperCall('/ping').then((d) => {
      helperState.ok = true; helperState.lastScan = d.lastScan * 1000; helperState.partners = d.partners;
      if (!J().helperSeen) { J().helperSeen = true; Store.save(); }
      if (!feedLoaded) {
        feedLoaded = true;
        return helperCall('/feed').then((f) => { helperState.errors = f.errors || []; const n = mergeFeed(f.items); if (n) U.toast('Помощник нашёл новые вакансии: ' + n); });
      }
      return null;
    }).catch(() => { helperState.ok = false; }).then(() => { if (root && isTab('new')) App.render(); });
  }

  function scanNow() {
    if (helperState.busy) return;
    helperState.busy = true; App.render();
    const p = prefs();
    helperCall('/scan', { channels: p.channels, habr: p.habr }).then((f) => {
      helperState.ok = true; helperState.lastScan = Date.now(); helperState.errors = f.errors || [];
      const n = mergeFeed(f.items);
      U.toast(n ? 'Новых вакансий: ' + n : 'Новых вакансий пока нет');
    }).catch((e) => {
      helperState.ok = false;
      U.toast('Помощник не ответил' + (e && e.message && !/abort|fetch/i.test(e.message) ? ': ' + e.message : ' — он запущен на этом компьютере?'));
    }).finally(() => { helperState.busy = false; App.render(); });
  }

  // ---------- Общие куски ----------

  function sub() { return (location.hash.split('/')[2] || '').split('?')[0]; }
  function isTab(t) { return sub() === (t === 'apps' ? '' : t); }

  function tabs() {
    const newCount = feed().filter((x) => !J().seen[x.id] && !classify(x).hide).length;
    const t = (id, href, icon, label, extra) => '<a class="' + (isTab(id) ? 'on' : '') + '" href="#/jobs' + href + '">' + I(icon) + ' ' + label + (extra || '') + '</a>';
    return '<div class="seg lang-tabs" role="tablist">' +
      t('apps', '', 'calendar', 'Отклики') +
      t('new', '/new', 'search', 'Новые вакансии', newCount ? ' <span class="tag new">' + newCount + '</span>' : '') +
      t('cv', '/cv', 'note', 'Резюме') +
      t('history', '/history', 'chart', 'История') +
      t('links', '/links', 'external', 'Ссылки') +
      t('prep', '/prep', 'sparkles', 'Подготовка') +
      ((P().checklist || []).length ? t('check', '/check', 'check-circle', 'Чек-лист') : '') + '</div>';
  }

  function head(sub2) {
    return '<header class="page-head"><div><h1>Работа</h1><p class="muted">' + sub2 + '</p></div>' +
      '<div class="row-btns"><button class="btn primary" data-j="new-app">' + I('plus') + ' Отклик</button></div></header>' + tabs();
  }

  // ---------- Отклики ----------

  function weekStats() {
    const ws = U.dayKey(U.startOfWeek(Date.now()));
    const sentThisWeek = J().apps.filter((a) => a.applied && a.applied >= ws && a.status !== 'want').length;
    return sentThisWeek;
  }

  function needsFollowUp(a) {
    if (a.status !== 'sent' || !a.applied) return false;
    const last = a.followUp && a.followUp > a.applied ? a.followUp : a.applied;
    return daysSince(last) >= 7;
  }

  function todoHTML() {
    const apps = J().apps;
    const due = apps.filter((a) => !CLOSED.includes(a.status) && a.nextDate && a.nextDate <= today());
    const fu = apps.filter((a) => needsFollowUp(a) && !due.includes(a));
    if (!due.length && !fu.length) return '';
    const row = (a, why, btn) => '<li><span><b>' + U.esc(a.company || 'Без названия') + '</b>' + (a.title ? ' — ' + U.esc(a.title) : '') + '<br><span class="small muted">' + why + '</span></span>' + btn + '</li>';
    return '<section class="card job-todo"><h2 class="h-ic">' + I('bolt') + ' Что сделать</h2><ul class="card-list">' +
      due.map((a) => row(a, (a.nextDate < today() ? '<span class="bad-text">просрочено с ' + fmtDay(a.nextDate) + '</span>' : 'сегодня') + (a.next ? ': ' + U.esc(a.next) : ''),
        '<button class="btn small" data-j="edit" data-id="' + a.id + '">Открыть</button>')).join('') +
      fu.map((a) => row(a, 'отклик ' + fmtDay(a.applied) + ', ответа нет ' + daysSince(a.followUp && a.followUp > a.applied ? a.followUp : a.applied) + ' дн. — пора написать повторно',
        '<span class="row-btns"><button class="btn small" data-j="followup" data-id="' + a.id + '">Написала</button><button class="btn small ghost" data-j="silent" data-id="' + a.id + '">Закрыть</button></span>')).join('') +
      '</ul></section>';
  }

  function resumeName(id) { const r = J().resumes.find((x) => x.id === id); return r ? r.title : ''; }

  function appsHTML() {
    let list = J().apps.slice();
    if (filter === 'active') list = list.filter((a) => !CLOSED.includes(a.status));
    else if (filter === 'closed') list = list.filter((a) => CLOSED.includes(a.status));
    else if (filter === 'want') list = list.filter((a) => a.status === 'want');
    if (onlyPartners) list = list.filter((a) => partnerOf(a.company));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) => [a.company, a.title, a.source, a.contact, a.notes, a.reply].join(' ').toLowerCase().includes(q));
    }
    list.sort((a, b) => String(b.applied || b.created || '').localeCompare(String(a.applied || a.created || '')) || (b.created || 0) - (a.created || 0));
    const week = weekStats();
    const counts = { active: J().apps.filter((a) => !CLOSED.includes(a.status)).length, want: J().apps.filter((a) => a.status === 'want').length, closed: J().apps.filter((a) => CLOSED.includes(a.status)).length };
    const f = (id, label, n) => '<button class="' + (filter === id ? 'on' : '') + '" data-j="filter" data-v="' + id + '">' + label + (n != null ? ' (' + n + ')' : '') + '</button>';
    return '<section class="card"><div class="card-head"><h2>Отклики</h2>' +
      '<span class="week-goal' + (week >= 5 ? ' ok' : '') + '" title="Ориентир — 5–10 откликов в неделю">' + I('target') + ' на этой неделе: <b>' + week + '</b> из 5–10</span></div>' +
      '<div class="jobs-tools"><div class="seg" role="group">' + f('active', 'В работе', counts.active) + f('want', 'Хочу', counts.want) + f('closed', 'Закрытые', counts.closed) + f('all', 'Все') + '</div>' +
      '<input type="search" id="job-search" placeholder="Поиск: компания, контакт, заметки…" value="' + U.esc(search) + '" aria-label="Поиск по откликам">' +
      ((P().partners || []).length ? '<label class="check small"><input type="checkbox" id="job-partners"' + (onlyPartners ? ' checked' : '') + '> только партнёры</label>' : '') +
      '<span class="spacer"></span><button class="btn small ghost" data-j="csv">' + I('download') + ' Таблица (CSV)</button></div>' +
      (list.length ? '<div class="table-wrap"><table class="jobs-table"><thead><tr>' +
        '<th>Компания</th><th>Вакансия</th><th>Где нашла</th><th>Резюме</th><th>Отклик</th><th>Статус</th><th>Ответили</th><th>Контакт</th><th>Следующий шаг</th><th>Заметки</th><th></th></tr></thead><tbody>' +
        list.map(rowHTML).join('') + '</tbody></table></div>'
        : '<div class="empty-state"><p>' + (J().apps.length ? 'Здесь пусто — попробуй другой фильтр.' : 'Откликов пока нет.') + '</p>' +
          (J().apps.length ? '' : '<p class="muted">Добавляй сюда каждый отклик: куда, какое резюме, когда. Через неделю без ответа страница напомнит написать повторно.</p><div class="row-btns"><button class="btn primary" data-j="new-app">Добавить отклик</button><a class="btn" href="#/jobs/new">Найти вакансии</a></div>') + '</div>') +
      '</section>';
  }

  function rowHTML(a) {
    const p = partnerOf(a.company);
    const overdue = a.nextDate && a.nextDate <= today() && !CLOSED.includes(a.status);
    const fu = needsFollowUp(a);
    const r = J().resumes.find((x) => x.id === a.resumeId);
    return '<tr class="' + (CLOSED.includes(a.status) ? 'closed' : '') + '">' +
      '<td><b>' + U.esc(a.company || '—') + '</b>' + (p ? '<br>' + partnerTag(p) : '') + '</td>' +
      '<td>' + (a.url ? '<a href="' + U.esc(a.url) + '" target="_blank" rel="noopener">' + U.esc(a.title || 'ссылка') + '</a>' : U.esc(a.title || '')) + (a.salary ? '<br><span class="small muted">' + U.esc(a.salary) + '</span>' : '') + '</td>' +
      '<td class="small">' + U.esc(a.source || '') + '</td>' +
      '<td class="small">' + (r ? (r.fileId ? '<button class="linkish" data-j="open-cv" data-id="' + r.id + '" title="Открыть PDF">' + I('note') + ' ' + U.esc(r.title) + '</button>' : U.esc(r.title)) : '') + '</td>' +
      '<td class="nowrap">' + fmtDay(a.applied) + (fu ? '<br><span class="tag warn">написать повторно</span>' : '') + '</td>' +
      '<td><select data-j="status" data-id="' + a.id + '" aria-label="Статус" class="st-' + a.status + '">' + STATUSES.map(([k, v]) => '<option value="' + k + '"' + (k === a.status ? ' selected' : '') + '>' + v + '</option>').join('') + '</select></td>' +
      '<td class="small">' + (a.replyDate ? '<b>' + fmtDay(a.replyDate) + '</b> ' : '') + U.esc(a.reply || '') + '</td>' +
      '<td class="small">' + linkify(a.contact) + '</td>' +
      '<td class="small' + (overdue ? ' bad-text' : '') + '">' + (a.nextDate ? '<b>' + fmtDay(a.nextDate) + '</b> ' : '') + U.esc(a.next || '') + '</td>' +
      '<td class="small notes">' + U.esc(a.notes || '') + '</td>' +
      '<td><button class="icon-btn small" data-j="edit" data-id="' + a.id + '" aria-label="Изменить отклик">' + I('pencil') + '</button></td></tr>';
  }

  // @ник → ссылка на Telegram, почта → mailto, остальное — текстом
  function linkify(s) {
    return U.esc(s || '').replace(/(^|\s)@([A-Za-z0-9_]{4,32})/g, '$1<a href="https://t.me/$2" target="_blank" rel="noopener">@$2</a>')
      .replace(/([\w.+-]+@[\w-]+\.[\w.-]+)/g, '<a href="mailto:$1">$1</a>');
  }

  function appModal(a, preset) {
    const isNew = !a;
    a = a || Object.assign({ id: U.uid(), status: 'sent', applied: today(), created: Date.now() }, preset || {});
    const res = J().resumes;
    const sources = Array.from(new Set(J().apps.map((x) => x.source).concat(['hh.ru', 'Хабр Карьера', 'LinkedIn', 'Telegram', 'Сайт компании', 'Рекомендация']).filter(Boolean)));
    const sel = (v) => STATUSES.map(([k, t]) => '<option value="' + k + '"' + (k === v ? ' selected' : '') + '>' + t + '</option>').join('');
    App.modal({
      title: isNew ? 'Новый отклик' : (a.company || 'Отклик'),
      submit: 'Сохранить',
      extra: isNew ? '' : '<button type="button" class="btn ghost danger-text" data-del>Удалить</button>',
      body:
        '<div class="row"><label>Компания<input name="company" required maxlength="100" value="' + U.esc(a.company || '') + '" placeholder="например, Яндекс"></label>' +
        '<label>Вакансия<input name="title" maxlength="140" value="' + U.esc(a.title || '') + '" placeholder="ML-стажёр"></label></div>' +
        '<div class="partner-hint small"></div>' +
        '<div class="row"><label>Где нашла<input name="source" list="job-sources" maxlength="80" value="' + U.esc(a.source || '') + '"></label>' +
        '<label>Ссылка на вакансию<input name="url" type="url" maxlength="500" value="' + U.esc(a.url || '') + '" placeholder="https://…"></label></div>' +
        '<datalist id="job-sources">' + sources.map((s) => '<option value="' + U.esc(s) + '">').join('') + '</datalist>' +
        '<div class="row"><label>Резюме<select name="resumeId"><option value="">—</option>' + res.map((r) => '<option value="' + r.id + '"' + (r.id === a.resumeId ? ' selected' : '') + '>' + U.esc(r.title) + '</option>').join('') + '</select></label>' +
        '<label>Зарплатная вилка<input name="salary" maxlength="80" value="' + U.esc(a.salary || '') + '" placeholder="если указана"></label></div>' +
        '<div class="row"><label>Дата отклика<input name="applied" type="date" value="' + U.esc(a.applied || '') + '"></label>' +
        '<label>Статус<select name="status">' + sel(a.status) + '</select></label></div>' +
        '<label>Контакт<input name="contact" maxlength="200" value="' + U.esc(a.contact || '') + '" placeholder="имя рекрутера, @telegram или почта, где познакомились"></label>' +
        '<div class="row"><label>Когда ответили<input name="replyDate" type="date" value="' + U.esc(a.replyDate || '') + '"></label>' +
        '<label>Что ответили<input name="reply" maxlength="200" value="' + U.esc(a.reply || '') + '" placeholder="позвали на собеседование"></label></div>' +
        '<div class="row"><label>Следующий шаг — к какому числу<input name="nextDate" type="date" value="' + U.esc(a.nextDate || '') + '"></label>' +
        '<label>Что сделать<input name="next" maxlength="200" value="' + U.esc(a.next || '') + '" placeholder="сделать тестовое"></label></div>' +
        '<label>Заметки<textarea name="notes" rows="3" maxlength="2000">' + U.esc(a.notes || '') + '</textarea></label>' +
        (isNew ? '' : historyOf(a)),
      onOpen(form, close) {
        const hint = form.querySelector('.partner-hint');
        const comp = form.querySelector('[name=company]');
        const upd = () => { const p = partnerOf(comp.value); hint.innerHTML = p ? partnerTag(p) + ' ' + U.esc(p.name) + (p.group ? ' · ' + U.esc(p.group) : '') : ''; };
        comp.addEventListener('input', upd); upd();
        const st = form.querySelector('[name=status]');
        st.addEventListener('change', () => {
          if (ANSWERED.includes(st.value) && !form.replyDate.value) form.replyDate.value = today();
        });
        const del = form.querySelector('[data-del]');
        if (del) del.addEventListener('click', async () => {
          close();
          if (!await App.confirm('Удалить отклик в «' + (a.company || '') + '»?')) return;
          J().apps = J().apps.filter((x) => x.id !== a.id);
          Store.save(); App.render();
        });
      },
      onSubmit(d) {
        const before = Object.assign({}, a);
        ['company', 'title', 'source', 'url', 'resumeId', 'salary', 'applied', 'status', 'contact', 'replyDate', 'reply', 'nextDate', 'next', 'notes'].forEach((k) => { a[k] = d[k] || ''; });
        if (a.url && !/^https?:\/\//i.test(a.url)) a.url = 'https://' + a.url;
        a.updated = Date.now();
        if (isNew) {
          J().apps.push(a);
          logEvent(a, a.status === 'want' ? 'добавила в «хочу откликнуться»' : 'отклик' + (resumeName(a.resumeId) ? ' с резюме «' + resumeName(a.resumeId) + '»' : ''));
        } else {
          if (before.status !== a.status) logEvent(a, 'статус: ' + ST[before.status] + ' → ' + ST[a.status]);
          if (a.reply && a.reply !== before.reply) logEvent(a, 'ответ: ' + a.reply);
          if (a.next && (a.next !== before.next || a.nextDate !== before.nextDate)) logEvent(a, 'следующий шаг' + (a.nextDate ? ' к ' + fmtDay(a.nextDate) : '') + ': ' + a.next);
        }
        Store.save(); App.render();
        U.toast(isNew ? 'Отклик добавлен' : 'Сохранено');
      },
    });
  }

  function historyOf(a) {
    const ev = J().events.filter((e) => e.appId === a.id).sort((x, y) => y.ts - x.ts);
    return ev.length ? '<details><summary>История (' + ev.length + ')</summary><ul class="hobby-log full">' +
      ev.map((e) => '<li><span class="muted">' + U.dateLabel(e.ts) + '</span> ' + U.esc(e.text) + '</li>').join('') + '</ul></details>' : '';
  }

  function csv() {
    const cell = (s) => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
    const rows = [['Компания', 'Площадка', 'Вакансия / Позиция', 'Статус', 'Дата отклика', 'Ссылка на вакансию', 'Зарплатная вилка', 'Контакты рекрутера', 'Этап / Заметки']]
      .concat(J().apps.slice().sort((a, b) => String(a.applied).localeCompare(String(b.applied))).map((a) => [
        a.company, a.source, a.title, ST[a.status], a.applied ? fmtDay(a.applied) + '.' + a.applied.slice(0, 4) : '', a.url, a.salary, a.contact,
        [a.reply && ('ответ ' + fmtDay(a.replyDate) + ': ' + a.reply), a.next && ('дальше' + (a.nextDate ? ' к ' + fmtDay(a.nextDate) : '') + ': ' + a.next), a.notes].filter(Boolean).join('; '),
      ]));
    const blob = new Blob(['﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = 'отклики-' + today() + '.csv';
    document.body.appendChild(link); link.click();
    setTimeout(() => { URL.revokeObjectURL(link.href); link.remove(); }, 1000);
    U.toast('Таблица скачана — её можно вставить в Google Таблицы');
  }

  // ---------- Новые вакансии ----------

  function newHTML() {
    const items = feed().map((x) => Object.assign({ c: classify(x) }, x)).filter((x) => J().seen[x.id] !== 'added');
    const dup = new Set();   // одна и та же вакансия в нескольких каналах — показываем один раз
    const fresh = items.filter((x) => {
      if (J().seen[x.id] || x.c.hide) return false;
      const k = titleOf(x, x.c).toLowerCase().replace(/[^a-zа-я0-9]+/g, ' ').trim();
      if (dup.has(k)) return false;
      dup.add(k); return true;
    });
    const hidden = items.filter((x) => !J().seen[x.id] && x.c.hide);
    const dismissed = items.filter((x) => J().seen[x.id] === 'hidden').length;
    const st = helperState.ok === null ? '<span class="muted">проверяю помощника…</span>'
      : helperState.ok ? '<span class="tag ok">' + I('check') + ' помощник работает</span>' + (helperState.lastScan ? ' <span class="muted small">последняя проверка: ' + U.dateLabel(helperState.lastScan) + ' ' + U.timeLabel(helperState.lastScan) + '</span>' : '')
        : '<span class="tag warn">помощник не отвечает</span>';
    const p1 = 'Удалёнка' + (home() ? ' и ' + home().label : '');
    const groups = [[1, U.esc(p1)], [2, 'Москва и Питер'], [3, 'Город не указан']];
    return '<section class="card"><div class="card-head"><h2>Новые вакансии</h2><div class="row-btns">' +
      '<button class="btn primary" data-j="scan"' + (helperState.busy ? ' disabled' : '') + '>' + I('search') + (helperState.busy ? ' Ищу… (до минуты)' : ' Найти новые вакансии') + '</button>' +
      '<button class="btn ghost" data-j="scan-settings">' + I('settings') + ' Что искать</button></div></div>' +
      '<p class="small">' + st + '</p>' +
      (helperState.ok === false ? helperHelpHTML() : '') +
      (helperState.errors && helperState.errors.length ? '<details class="small muted"><summary>Не открылось источников: ' + helperState.errors.length + '</summary><ul>' + helperState.errors.map((e) => '<li>' + U.esc(e) + '</li>').join('') + '</ul></details>' : '') +
      '<p class="muted small">Ищу ML, Data Science, CV, NLP и LLM: сначала стажировки и junior, ' + U.esc('удалёнка' + (home() ? ' и ' + home().label : '')) + ', потом Москва и Питер. Другие города и вакансии для опытных скрыты. Каждая вакансия показывается один раз — «В отклики» или «Не интересно» убирают её из списка.</p>' +
      '</section>' +
      (fresh.length ? groups.map(([pr, title]) => {
        const g = fresh.filter((x) => x.c.prio === pr);
        return g.length ? '<h2 class="jobs-group">' + title + ' <span class="muted">(' + g.length + ')</span></h2><div class="vac-grid">' + g.map(vacHTML).join('') + '</div>' : '';
      }).join('') : '<div class="card empty-state"><p>' + (feed().length ? 'Новых подходящих вакансий нет — всё просмотрено.' : 'Здесь появятся вакансии, когда помощник их найдёт.') + '</p></div>') +
      (hidden.length ? '<div class="row-btns"><button class="btn ghost small" data-j="toggle-hidden">' + (showHidden ? 'Спрятать' : 'Показать') + ' скрытые фильтром (' + hidden.length + ')</button></div>' +
        (showHidden ? '<div class="vac-grid">' + hidden.map(vacHTML).join('') + '</div>' : '') : '') +
      (dismissed ? '<p class="muted small center">«Не интересно»: ' + dismissed + ' · <button class="linkish" data-j="undismiss">вернуть всё</button></p>' : '');
  }

  function helperHelpHTML() {
    const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    const phone = /Android|iPhone|iPad/i.test(navigator.userAgent);
    return '<div class="helper-help small">' +
      (phone ? '<p>' + I('phone') + ' На телефоне поиск не работает — помощник живёт на компьютере. Найденное на компьютере видно здесь после импорта данных.</p>' :
        '<p>Помощник — маленькая программа на этом компьютере. Обычно он запускается сам при включении. Если не отвечает, запусти в терминале из папки проекта:</p>' +
        '<pre><code>python3 tools/job-helper.py</code></pre>' +
        (local ? '' : '<p>Если браузер спросит, разрешить ли сайту доступ к устройствам в локальной сети, — разреши: так сайт достучится до помощника на этом же компьютере.</p>')) +
      '</div>';
  }

  function vacHTML(x) {
    const c = x.c;
    const p = partnerOf(x.company) || partnerInText(x.title + '\n' + x.text);
    const lvl = c.level === 'intern' ? '<span class="tag new">стажировка</span>' : c.level === 'junior' ? '<span class="tag new">junior</span>' : c.level === 'senior' ? '<span class="tag">для опытных</span>' : '';
    const loc = c.prio === 1 ? (home() && home().re.test(x.text) && !RE_REMOTE.test(x.text) && !x.remote ? home().label : 'удалёнка') : c.prio === 2 ? 'Москва / Питер' : c.prio === 0 ? 'другой город' : '';
    const text = clean(x.text);
    const short = text.length > 320 ? text.slice(0, 320).replace(/\s+\S*$/, '') + '…' : text;
    const isNew = x.firstSeen && Date.now() - x.firstSeen < 36 * 3600000;
    return '<article class="card vac' + (J().seen[x.id] === 'hidden' ? ' dim' : '') + '">' +
      '<div class="vac-head"><h3>' + U.esc(titleOf(x, c)) + '</h3>' + (isNew ? '<span class="tag new">новое</span>' : '') + '</div>' +
      '<p class="small muted">' + U.esc(x.source || '') + (x.company ? ' · <b>' + U.esc(x.company) + '</b>' : '') + (x.date ? ' · ' + U.dateLabel(new Date(x.date).getTime()) : '') + (x.salary ? ' · ' + U.esc(x.salary) : '') + '</p>' +
      '<div class="vac-tags">' + lvl + (loc ? '<span class="tag">' + loc + '</span>' : '') + partnerTag(p) + (c.hide ? '<span class="tag warn">' + c.hide + '</span>' : '') + '</div>' +
      (short ? '<details class="vac-text"><summary>' + U.esc(short).replace(/\n/g, '<br>') + '</summary>' + (text.length > short.length ? '<div>' + U.esc(text).replace(/\n/g, '<br>') + '</div>' : '') + '</details>' : '') +
      '<div class="row-btns"><button class="btn small primary" data-j="vac-add" data-id="' + U.esc(x.id) + '">' + I('plus') + ' В отклики</button>' +
      '<a class="btn small" href="' + U.esc(x.url) + '" target="_blank" rel="noopener">' + I('external') + ' Открыть</a>' +
      (J().seen[x.id] ? '' : '<button class="btn small ghost" data-j="vac-hide" data-id="' + U.esc(x.id) + '">Не интересно</button>') + '</div></article>';
  }

  function scanSettings() {
    const p = prefs();
    App.modal({
      title: 'Что искать',
      body: '<label>Telegram-каналы (через запятую, без @)<textarea name="channels" rows="4">' + U.esc(p.channels.join(', ')) + '</textarea></label>' +
        '<p class="muted small">Подходят только публичные каналы: помощник читает их открытую веб-страницу t.me/s/канал, как любой человек без входа.</p>' +
        '<label>Запросы на Хабр Карьере (через запятую, до 6)<input name="habr" value="' + U.esc(p.habr.join(', ')) + '"></label>' +
        '<label class="check"><input type="checkbox" name="seniors"' + (p.seniors ? ' checked' : '') + '> показывать и вакансии для опытных (middle / senior)</label>' +
        '<p class="muted small"><button type="button" class="linkish" data-reset>Вернуть как было по умолчанию</button></p>',
      onOpen(form, close) {
        form.querySelector('[data-reset]').addEventListener('click', () => { J().prefs = {}; Store.save(); close(); App.render(); U.toast('Настройки поиска сброшены'); });
      },
      onSubmit(d) {
        const split = (s) => String(s || '').split(/[,\n]/).map((x) => x.trim().replace(/^@|^https?:\/\/t\.me\/(s\/)?/g, '')).filter(Boolean);
        const bad = split(d.channels).filter((c) => !/^[A-Za-z0-9_]{3,64}$/.test(c));
        if (bad.length) { U.toast('Не похоже на имя канала: ' + bad.join(', ')); return false; }
        J().prefs = { channels: split(d.channels), habr: split(d.habr).slice(0, 6), seniors: d.seniors === 'on' };
        Store.save(); App.render();
        return true;
      },
    });
  }

  // ---------- Резюме ----------

  function cvHTML() {
    const res = J().resumes;
    return '<section class="card"><div class="card-head"><h2>Версии резюме</h2><button class="btn primary" data-j="new-cv">' + I('plus') + ' Резюме</button></div>' +
      '<p class="muted small">Под разные роли — разные версии. PDF хранится только в этом браузере; оригиналы лучше держать и у себя в папке.</p>' +
      (res.length ? '<div class="cv-grid">' + res.map((r) => {
        const used = J().apps.filter((a) => a.resumeId === r.id);
        return '<article class="cv-card"><h3>' + I('note') + ' ' + U.esc(r.title) + '</h3>' +
          (r.role ? '<p class="small"><b>Для чего:</b> ' + U.esc(r.role) + '</p>' : '') +
          (r.changes ? '<p class="small"><b>Что поменяно:</b> ' + U.esc(r.changes) + '</p>' : '') +
          '<p class="small muted">' + (r.fileName ? U.esc(r.fileName) + ' · ' + Math.max(1, Math.round((r.fileSize || 0) / 1024)) + ' КБ · ' : '') + 'обновлено ' + U.dateLabel(r.ts) +
          ' · откликов: ' + used.length + '</p>' +
          (used.length ? '<p class="small muted">' + used.slice(0, 6).map((a) => U.esc(a.company)).join(', ') + (used.length > 6 ? '…' : '') + '</p>' : '') +
          '<div class="row-btns">' + (r.fileId ? '<button class="btn small primary" data-j="open-cv" data-id="' + r.id + '">' + I('eye') + ' Открыть PDF</button><button class="btn small" data-j="dl-cv" data-id="' + r.id + '">' + I('download') + ' Скачать</button>' : '') +
          (r.link ? '<a class="btn small" href="' + U.esc(r.link) + '" target="_blank" rel="noopener">' + I('external') + ' Ссылка</a>' : '') +
          '<button class="btn small ghost" data-j="edit-cv" data-id="' + r.id + '">' + I('pencil') + ' Изменить</button></div></article>';
      }).join('') + '</div>' : '<div class="empty-state"><p>Резюме пока нет.</p><p class="muted">Добавь PDF и подпиши, для каких вакансий эта версия: например, «ML-стажёр» или «CV / компьютерное зрение».</p></div>') +
      '</section>';
  }

  function cvModal(r) {
    const isNew = !r;
    r = r || { id: U.uid() };
    App.modal({
      title: isNew ? 'Новое резюме' : r.title,
      extra: isNew ? '' : '<button type="button" class="btn ghost danger-text" data-del>Удалить</button>',
      body: '<label>Название версии<input name="title" required maxlength="80" value="' + U.esc(r.title || '') + '" placeholder="ML-стажёр, весна"></label>' +
        '<label>Для каких вакансий<input name="role" maxlength="160" value="' + U.esc(r.role || '') + '" placeholder="стажировки ML / DS"></label>' +
        '<label>Что поменяно по сравнению с другими<textarea name="changes" rows="2" maxlength="600">' + U.esc(r.changes || '') + '</textarea></label>' +
        '<label>PDF' + (r.fileName ? ' (сейчас: ' + U.esc(r.fileName) + ' — выбери новый, чтобы заменить)' : '') + '<input name="file" type="file" accept="application/pdf,.pdf"' + (isNew ? '' : '') + '></label>' +
        '<label>Ссылка (необязательно)<input name="link" type="url" maxlength="500" value="' + U.esc(r.link || '') + '" placeholder="Google Диск, hh.ru…"></label>',
      onOpen(form, close) {
        const del = form.querySelector('[data-del]');
        if (del) del.addEventListener('click', async () => {
          close();
          if (!await App.confirm('Удалить резюме «' + r.title + '» вместе с PDF? В откликах останется пустое поле.')) return;
          if (r.fileId) fileDel(r.fileId).catch(() => {});
          J().resumes = J().resumes.filter((x) => x.id !== r.id);
          Store.save(); App.render();
        });
      },
      onSubmit(d, form) {
        const file = form.querySelector('[name=file]').files[0];
        if (file && !/pdf$/i.test(file.type || file.name)) { U.toast('Нужен файл PDF'); return false; }
        if (file && file.size > 15 * 1024 * 1024) { U.toast('Файл больше 15 МБ — сожми PDF'); return false; }
        r.title = d.title; r.role = d.role; r.changes = d.changes; r.link = d.link; r.ts = Date.now();
        const finish = () => {
          if (isNew) J().resumes.push(r);
          Store.save(); App.render();
          U.toast(isNew ? 'Резюме добавлено' : 'Сохранено');
        };
        if (!file) { finish(); return true; }
        const fileId = 'cv-' + r.id;
        filePut(fileId, { blob: file, name: file.name }).then(() => {
          r.fileId = fileId; r.fileName = file.name; r.fileSize = file.size;
          finish();
        }).catch(() => U.toast('Не получилось сохранить PDF в браузере'));
        return true;
      },
    });
  }

  // ---------- История ----------

  function historyHTML() {
    const apps = J().apps.filter((a) => a.status !== 'want');
    const answered = apps.filter((a) => ANSWERED.includes(a.status) || a.replyDate);
    const inter = apps.filter((a) => ['interview', 'offer'].includes(a.status) || /собесед|интервью/i.test(a.reply || '')).length;
    const offers = apps.filter((a) => a.status === 'offer').length;
    const pct = apps.length ? Math.round(answered.length / apps.length * 100) : 0;
    // по неделям — последние 8
    const weeks = [];
    let ws = U.startOfWeek(Date.now());
    for (let i = 0; i < 8; i++) {
      const a = U.dayKey(ws), b = U.dayKey(U.addDays(ws, 7));
      weeks.unshift({ label: fmtDay(a), n: apps.filter((x) => x.applied >= a && x.applied < b).length });
      ws = U.addDays(ws, -7);
    }
    const max = Math.max(10, ...weeks.map((w) => w.n));
    const bySrc = {};
    apps.forEach((a) => { const k = a.source || 'не указано'; const s = bySrc[k] || (bySrc[k] = { n: 0, ans: 0 }); s.n++; if (answered.includes(a)) s.ans++; });
    const ev = J().events.slice().sort((x, y) => y.ts - x.ts).slice(0, 80);
    const appName = (id) => { const a = J().apps.find((x) => x.id === id); return a ? a.company : ''; };
    let lastDay = '';
    return '<div class="stat-tiles">' +
      tile(apps.length, 'откликов всего') + tile(answered.length + ' · ' + pct + '%', 'ответили') + tile(inter, 'собеседований') + tile(offers, 'офферов') + '</div>' +
      '<section class="card"><h2>Отклики по неделям</h2><div class="week-bars">' + weeks.map((w) =>
        '<div class="wb"><span class="wb-n">' + (w.n || '') + '</span><span class="wb-bar' + (w.n >= 5 ? ' ok' : '') + '" style="height:' + Math.round(w.n / max * 100) + '%"></span><span class="wb-l">' + w.label + '</span></div>').join('') +
        '</div><p class="muted small">Зелёные — недели, где было 5 и больше откликов (ориентир 5–10 в неделю).</p></section>' +
      (Object.keys(bySrc).length ? '<section class="card"><h2>Где чаще отвечают</h2><table class="mini-table"><tr><th>Площадка</th><th>Откликов</th><th>Ответили</th></tr>' +
        Object.entries(bySrc).sort((a, b) => b[1].n - a[1].n).map(([k, s]) => '<tr><td>' + U.esc(k) + '</td><td>' + s.n + '</td><td>' + s.ans + (s.n ? ' (' + Math.round(s.ans / s.n * 100) + '%)' : '') + '</td></tr>').join('') + '</table></section>' : '') +
      '<section class="card"><h2>Лента событий</h2>' + (ev.length ? '<ul class="job-events">' + ev.map((e) => {
        const d = U.dayKey(e.ts);
        const h = d !== lastDay ? '<li class="tl-day">' + U.dateLabel(e.ts) + '</li>' : '';
        lastDay = d;
        return h + '<li><span class="muted small">' + U.timeLabel(e.ts) + '</span> <b>' + U.esc(appName(e.appId)) + '</b> ' + U.esc(e.text) + '</li>';
      }).join('') + '</ul>' : '<p class="muted">Здесь будет всё, что происходило: отклики, ответы, собеседования.</p>') + '</section>';
  }
  function tile(v, l) { return '<div class="card stat-tile"><b>' + v + '</b><span class="muted small">' + l + '</span></div>'; }

  // ---------- Ссылки ----------

  function linksHTML() {
    const all = DEFAULT_LINKS.map(([group, title, url, note]) => ({ group, title, url, note }))
      .concat((P().links || []).map((l) => Object.assign({ group: 'Личное' }, l)))
      .concat(J().links.map((l) => Object.assign({ group: 'Мои ссылки', mine: true }, l)));
    const groups = Array.from(new Set(all.map((l) => l.group)));
    return '<section class="card"><div class="card-head"><h2>Полезные ссылки</h2><button class="btn primary" data-j="new-link">' + I('plus') + ' Ссылка</button></div>' +
      groups.map((g) => '<h3>' + U.esc(g) + '</h3><ul class="card-list links-list">' + all.filter((l) => l.group === g).map((l) =>
        '<li><a href="' + U.esc(l.url) + '" target="_blank" rel="noopener">' + I('external') + ' ' + U.esc(l.title) + '</a>' +
        (l.note ? '<span class="muted small">' + U.esc(l.note) + '</span>' : '') +
        (l.mine ? '<span class="spacer"></span><button class="icon-btn small" data-j="del-link" data-id="' + l.id + '" aria-label="Удалить ссылку">' + I('x') + '</button>' : '') + '</li>').join('') + '</ul>').join('') +
      '</section>';
  }

  function linkModal() {
    App.modal({
      title: 'Новая ссылка',
      body: '<label>Название<input name="title" required maxlength="100"></label><label>Адрес<input name="url" required maxlength="500" placeholder="https://…"></label>' +
        '<label>Пометка<input name="note" maxlength="200" placeholder="зачем она"></label>',
      onSubmit(d) {
        J().links.push({ id: U.uid(), title: d.title, url: /^https?:\/\//i.test(d.url) ? d.url : 'https://' + d.url, note: d.note });
        Store.save(); App.render();
      },
    });
  }

  // ---------- Подготовка ----------

  function prepHTML() {
    const pr = J().prep;
    const words = String(pr.pitch || '').trim().split(/\s+/).filter(Boolean).length;
    return '<div class="grid-2"><section class="card"><h2>Рассказ о себе — 2 минуты</h2>' +
      '<p class="muted small">Кто ты, что умеешь, 2–3 проекта и твоя роль в них, чего хочешь от стажировки. Две минуты вслух — это примерно 250–280 слов.</p>' +
      '<textarea id="job-pitch" rows="12" placeholder="Привет! Меня зовут…">' + U.esc(pr.pitch || '') + '</textarea>' +
      '<p class="small ' + (words > 300 ? 'bad-text' : 'muted') + '" id="pitch-count">' + words + ' ' + U.plural(words, ['слово', 'слова', 'слов']) + ' · примерно ' + Math.max(0, Math.round(words / 135 * 60)) + ' сек. вслух</p></section>' +
      '<section class="card"><h2>Вопросы работодателю</h2><p class="muted small">Заранее продуманные вопросы показывают интерес. Поправь под себя.</p>' +
      '<textarea id="job-ask" rows="12">' + U.esc(pr.ask != null ? pr.ask : ASK_QUESTIONS) + '</textarea></section></div>' +
      '<section class="card"><h2>Повторить перед собеседованием</h2><ul class="card-list">' +
      '<li><a href="#/ml/interview">' + I('sparkles') + ' Вопросы с собеседований по ML</a><span class="muted small">сначала отвечаешь сама, потом сверяешь</span></li>' +
      '<li><a href="#/ml/code">' + I('code') + ' Практика с кодом</a><span class="muted small">задачи с автотестами</span></li>' +
      '<li><span>' + I('grid') + ' Алгоритмы и структуры данных</span><span class="muted small">массивы, хеш-таблицы, сортировки, деревья, графы, оценка сложности</span></li></ul></section>';
  }

  // ---------- Чек-лист (личный файл) ----------

  function checkHTML() {
    const list = P().checklist || [];
    const done = list.filter((c, i) => J().check[i]).length;
    return '<section class="card"><div class="card-head"><h2>' + U.esc(P().checklistTitle || 'Чек-лист') + '</h2><span class="muted">' + done + ' из ' + list.length + '</span></div>' +
      '<ol class="job-check">' + list.map((c, i) => '<li class="' + (J().check[i] ? 'done' : '') + '"><label class="check"><input type="checkbox" data-j="check" data-i="' + i + '"' + (J().check[i] ? ' checked' : '') + '> <b>' + U.esc(c.title) + '</b></label>' +
        '<p class="small">' + U.esc(c.text) + '</p>' + ((c.links || []).length ? '<div class="row-btns">' + c.links.map(([t, u]) => '<a class="btn small" href="' + U.esc(u) + '" target="_blank" rel="noopener">' + I('external') + ' ' + U.esc(t) + '</a>').join('') + '</div>' : '') + '</li>').join('') + '</ol>' +
      (P().checklistNote ? '<p class="muted small">' + U.esc(P().checklistNote) + '</p>' : '') + '</section>' +
      ((P().partners || []).length ? '<section class="card"><h2>' + U.esc(P().partnersTitle || 'Компании-партнёры') + '</h2><p class="small">В списке <b>' + partners().n + '</b> компаний' +
        (J().partnersFresh ? ', обновлён ' + U.dateLabel(J().partnersFresh.ts) : ' (снимок из личного файла)') + '. Они отмечаются значком «партнёр» в откликах и новых вакансиях.</p>' +
        '<div class="row-btns"><button class="btn small" data-j="partners-refresh">' + I('download') + ' Обновить список с сайта</button></div>' +
        '<p class="muted small">Обновление скачивает свежий PDF через помощника на компьютере.</p></section>' : '');
  }

  // ---------- Экран ----------

  function render(el) {
    root = el;
    J();
    const s = sub();
    if (s === 'new' && helperState.ok === null) setTimeout(pingHelper, 0);
    let body;
    if (s === 'new') body = newHTML();
    else if (s === 'cv') body = cvHTML();
    else if (s === 'history') body = historyHTML();
    else if (s === 'links') body = linksHTML();
    else if (s === 'prep') body = prepHTML();
    else if (s === 'check') body = checkHTML();
    else body = todoHTML() + appsHTML();
    el.innerHTML = head('Отклики, резюме и новые вакансии — всё в одном месте') + body;
  }

  // Помощника спрашиваем тихо раз при запуске: вдруг он нашёл что-то за день
  // (только если помощник уже когда-то отвечал в этом браузере — чтобы остальным не показывать лишних запросов)
  setTimeout(() => { if (Store.state.jobs && Store.state.jobs.helperSeen) pingHelper(); }, 3000);

  function addFromVacancy(id) {
    const x = feed().find((v) => v.id === id);
    if (!x) return;
    appModal(null, {
      company: x.company || '', title: titleOf(x, classify(x)), url: x.url, status: 'want', applied: '',
      source: x.source === 'Хабр Карьера' ? 'Хабр Карьера' : 'Telegram ' + (x.source || ''), salary: x.salary || '',
      notes: x.source !== 'Хабр Карьера' ? clean(x.text).slice(0, 600) : '',
    });
    // отметим как добавленную, когда отклик реально сохранён
    const before = J().apps.length;
    const obs = setInterval(() => {
      if (document.querySelector('#modal-root form')) return;
      clearInterval(obs);
      if (J().apps.length > before) { J().seen[id] = 'added'; Store.save(); App.render(); }
    }, 300);
  }

  document.addEventListener('click', (e) => {
    if (!root || !root.contains(e.target)) return;
    const b = e.target.closest('[data-j]');
    if (!b || b.tagName === 'SELECT' || b.type === 'checkbox') return;
    const id = b.dataset.id;
    const app = id && J().apps.find((a) => a.id === id);
    switch (b.dataset.j) {
      case 'new-app': appModal(); break;
      case 'edit': if (app) appModal(app); break;
      case 'filter': filter = b.dataset.v; App.render(); break;
      case 'csv': csv(); break;
      case 'followup':
        if (app) { app.followUp = today(); logEvent(app, 'написала повторно'); Store.save(); App.render(); U.toast('Отметила. Напомню ещё через неделю, если ответа не будет'); }
        break;
      case 'silent':
        if (app) { logEvent(app, 'статус: ' + ST[app.status] + ' → ' + ST.silent); app.status = 'silent'; Store.save(); App.render(); }
        break;
      case 'scan': scanNow(); break;
      case 'scan-settings': scanSettings(); break;
      case 'toggle-hidden': showHidden = !showHidden; App.render(); break;
      case 'vac-add': addFromVacancy(id); break;
      case 'vac-hide': J().seen[id] = 'hidden'; Store.save(); App.render(); break;
      case 'undismiss':
        Object.keys(J().seen).forEach((k) => { if (J().seen[k] === 'hidden') delete J().seen[k]; });
        Store.save(); App.render(); break;
      case 'new-cv': cvModal(); break;
      case 'edit-cv': cvModal(J().resumes.find((r) => r.id === id)); break;
      case 'open-cv': openFile(J().resumes.find((r) => r.id === id)); break;
      case 'dl-cv': openFile(J().resumes.find((r) => r.id === id), true); break;
      case 'new-link': linkModal(); break;
      case 'partners-refresh':
        b.disabled = true;
        U.toast('Скачиваю список… это до минуты');
        helperCall('/partners', null, 120000).then((d) => {
          if (!d.items || d.items.length < 20) throw new Error('в PDF не нашлось списка');
          const old = partners().n;
          J().partnersFresh = { ts: Date.now(), items: d.items };
          partnerIndex = null; Store.save(); App.render();
          U.toast('Список обновлён: ' + d.items.length + ' компаний (было ' + old + ')');
        }).catch((err) => { b.disabled = false; U.toast('Не получилось обновить: ' + (err && err.message && !/abort|fetch/i.test(err.message) ? err.message : 'помощник не отвечает')); });
        break;
      case 'del-link': J().links = J().links.filter((l) => l.id !== id); Store.save(); App.render(); break;
    }
  });

  document.addEventListener('change', (e) => {
    if (!root || !root.contains(e.target)) return;
    const t = e.target;
    if (t.dataset.j === 'status') {
      const app = J().apps.find((a) => a.id === t.dataset.id);
      if (!app) return;
      logEvent(app, 'статус: ' + ST[app.status] + ' → ' + ST[t.value]);
      if (app.status === 'want' && t.value === 'sent' && !app.applied) app.applied = today();
      app.status = t.value;
      if (ANSWERED.includes(t.value) && !app.replyDate) app.replyDate = today();
      app.updated = Date.now();
      Store.save(); App.render();
    }
    if (t.dataset.j === 'check') { J().check[t.dataset.i] = t.checked; Store.save(); App.render(); }
    if (t.id === 'job-partners') { onlyPartners = t.checked; App.render(); }
  });

  document.addEventListener('input', (e) => {
    if (!root || !root.contains(e.target)) return;
    const t = e.target;
    if (t.id === 'job-search') {
      search = t.value;
      clearTimeout(t._tm);
      t._tm = setTimeout(() => { App.render(); const s = document.getElementById('job-search'); if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); } }, 250);
    }
    if (t.id === 'job-pitch' || t.id === 'job-ask') {
      J().prep[t.id === 'job-pitch' ? 'pitch' : 'ask'] = t.value;
      Store.saveSoon();
      if (t.id === 'job-pitch') {
        const words = t.value.trim().split(/\s+/).filter(Boolean).length;
        const c = document.getElementById('pitch-count');
        if (c) { c.textContent = words + ' ' + U.plural(words, ['слово', 'слова', 'слов']) + ' · примерно ' + Math.round(words / 135 * 60) + ' сек. вслух'; c.className = 'small ' + (words > 300 ? 'bad-text' : 'muted'); }
      }
    }
  });

  App.views.jobs = { render, leave() { root = null; } };
})();
