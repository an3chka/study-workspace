// Раздел «Чтение»: вставляешь текст, нажимаешь на слово — переводишь и добавляешь в карточки.
// Подсветка: жёлтым — слова, которые ты учишь (они есть в колодах),
// зелёным подчёркиванием — уже выученные, синим (по желанию) — ещё не отмеченные слова.
(function () {
  'use strict';

  const App = window.App = window.App || {};
  App.views = App.views || {};

  const WORD_RE = /([\p{L}\p{M}\p{N}]+(?:['’\-][\p{L}\p{M}\p{N}]+)*)/u;
  let root = null;
  let openId = null;
  let pop = null;

  function S() { return Store.state; }
  // Текст: свой — из данных, библиотечный — из встроенной библиотеки (если его не правили)
  // ---------- Слушать текст (озвучка браузером) ----------
  const listen = { playing: false, idx: 0, rate: 0.9, hidden: false, textId: null };

  function stopListen() {
    listen.playing = false;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    document.querySelectorAll('#reader p.reading').forEach((p) => p.classList.remove('reading'));
  }

  function playFrom(idx) {
    const t = openId && text(openId);
    const ps = document.querySelectorAll('#reader p');
    if (!t || !ps.length || !('speechSynthesis' in window)) { if (!('speechSynthesis' in window)) U.toast('Браузер не умеет читать вслух'); return; }
    if (idx >= ps.length) { stopListen(); listen.idx = 0; App.render(); if (listen.hidden) U.toast('Дослушала! Теперь ответь на вопросы на понимание внизу.'); return; }
    listen.idx = idx;
    ps.forEach((p, i) => p.classList.toggle('reading', i === idx));
    if (!listen.hidden) ps[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
    const u = new SpeechSynthesisUtterance(ps[idx].textContent);
    u.lang = t.lang || 'en-US'; u.rate = listen.rate;
    const v = App.bestVoice && App.bestVoice(u.lang);
    if (v) u.voice = v;
    u.onend = () => { if (listen.playing && openId === t.id) playFrom(idx + 1); };
    speechSynthesis.speak(u);
  }

  function bodyOf(t) {
    if (t.body) return t.body;
    const x = t.libId && (window.LIBRARY || []).find((l) => l.id === t.libId);
    return x ? x.body : '';
  }
  function text(id) { return S().texts.find((t) => t.id === id); }
  function norm(w) { return String(w).toLowerCase().replace(/’/g, "'").trim(); }

  function knownSet(lang) {
    const k = S().known[lang || '_'] || [];
    return new Set(k);
  }

  // Словарь: слово → карточка (из колод того же языка).
  function dictFor(lang) {
    const map = new Map();
    S().decks.forEach((d) => {
      if (lang && d.lang && d.lang !== lang) return;
      d.cards.forEach((c) => {
        const f = norm(c.front);
        const entry = { deck: d, card: c };
        map.set(f, entry);
        if (f.startsWith('to ')) map.set(f.slice(3), entry);   // to borrow → borrow
        f.split(/[,/]/).forEach((part) => { if (part.trim() && !map.has(part.trim())) map.set(part.trim(), entry); });
      });
    });
    return map;
  }

  function status(w, dict, known) {
    const e = dict.get(w);
    if (e) return (e.card.interval || 0) >= 21 ? 'learned' : 'learning';
    if (known.has(w)) return 'known';
    return 'unknown';
  }

  function paragraphs(body) {
    return String(body || '').split(/\n+/).map((p) => p.trim()).filter(Boolean);
  }

  function wordsOf(body) {
    const out = [];
    String(body || '').split(WORD_RE).forEach((tok, i) => { if (i % 2 === 1) out.push(norm(tok)); });
    return out;
  }

  function textStats(t) {
    const dict = dictFor(t.lang);
    const known = knownSet(t.lang);
    const uniq = Array.from(new Set(wordsOf(bodyOf(t)).filter((w) => !/^\d+$/.test(w))));
    const c = { total: uniq.length, learning: 0, learned: 0, known: 0, unknown: 0 };
    uniq.forEach((w) => { c[status(w, dict, known)]++; });
    return c;
  }

  function tabs(active) {
    return '<div class="seg lang-tabs" role="tablist">' +
      '<a role="tab" class="' + (active === 'cards' ? 'on' : '') + '" href="#/cards">' + I('cards') + ' Карточки</a>' +
      '<a role="tab" class="' + (active === 'read' ? 'on' : '') + '" href="#/read">' + I('book') + ' Чтение</a>' +
      '<a role="tab" class="' + (active === 'lessons' ? 'on' : '') + '" href="#/lessons">' + I('sparkles') + ' Уроки</a>' +
      '<a role="tab" class="' + (active === 'practice' ? 'on' : '') + '" href="#/practice">' + I('pen') + ' Практика</a>' +
      '<a role="tab" class="' + (active === 'theory' ? 'on' : '') + '" href="#/theory">' + I('cards') + ' Теория</a></div>';
  }
  App.langTabs = tabs;

  // ---------- Экраны ----------

  function render(el) {
    root = el;
    closePop();
    const t = openId && text(openId);
    if (t) renderReader(el, t); else { openId = null; renderList(el); }
  }

  function renderList(el) {
    const reading = S().texts.filter((t) => !t.read);
    const done = S().texts.filter((t) => t.read).sort((a, b) => (b.readAt || 0) - (a.readAt || 0));
    el.innerHTML =
      '<header class="page-head"><div><h1>Языки</h1><p class="muted">Читай тексты и собирай незнакомые слова в карточки</p></div>' +
      '<button class="btn primary" data-r="new">+ Текст</button></header>' + tabs('read') +
      (reading.length ? '<h2 class="sect-title">' + I('book') + ' Читаю сейчас</h2>' : '') +
      '<div class="deck-grid">' + (reading.length ? reading.slice().reverse().map((t) => {
        const s = textStats(t);
        const pctKnown = s.total ? Math.round((s.known + s.learned) / s.total * 100) : 0;
        return '<article class="card deck">' +
          '<div class="deck-head"><h2>' + U.esc(t.title) + '</h2><span class="tag">' + U.esc(App.langName(t.lang)) + '</span></div>' +
          '<p class="muted small text-preview">' + U.esc(String(bodyOf(t)).slice(0, 140)) + (bodyOf(t).length > 140 ? '…' : '') + '</p>' +
          '<div class="deck-nums"><span><b>' + s.total + '</b> слов</span><span><b class="c-due">' + s.learning + '</b> учу</span><span><b class="c-new">' + s.unknown + '</b> не отмечено</span></div>' +
          '<div class="progress" title="Знакомые слова"><span style="width:' + pctKnown + '%"></span></div>' +
          '<div class="deck-actions"><button class="btn primary" data-r="open" data-id="' + t.id + '">Читать</button>' +
          '<button class="btn" data-r="edit" data-id="' + t.id + '">Изменить</button></div></article>';
      }).join('') : (done.length ? '' :
        '<div class="card empty-state"><p>Текстов пока нет.</p><p class="muted">Выбери текст из библиотеки ниже или вставь свой: статью, главу книги, текст песни.</p>' +
        '<div class="row-btns"><button class="btn primary" data-r="new">Добавить свой текст</button></div></div>')) +
      '</div>' + libraryHTML() + doneHTML(done);
  }

  // Прочитанные тексты — свёрнутым списком
  function doneHTML(done) {
    if (!done.length) return '';
    return '<details class="card done-texts"><summary><b>' + I('check-circle') + ' Прочитано (' + done.length + ')</b></summary><ul class="done-list">' +
      done.map((t) => {
        const q = t.quiz ? ' · вопросы ' + t.quiz + '%' : '';
        return '<li><span class="dl-title">' + U.esc(t.title) + '</span><span class="muted small">' + (t.readAt ? U.dateLabel(t.readAt) : '') + q + '</span>' +
          '<button class="btn small ghost" data-r="open" data-id="' + t.id + '">Открыть</button>' +
          '<button class="btn small ghost" data-r="unread" data-id="' + t.id + '" title="Вернуть в «Читаю сейчас»">Перечитать</button></li>';
      }).join('') + '</ul></details>';
  }

  // Встроенная библиотека текстов по уровням
  function libraryHTML() {
    const lib = window.LIBRARY || [];
    if (!lib.length) return '';
    const mine = new Set(S().texts.map((t) => t.libId).filter(Boolean));
    const level = S().lessons && S().lessons.level;
    return '<section class="card"><div class="card-head"><h2 class="h-ic">' + I('book') + ' Библиотека</h2>' +
      '<span class="muted small">тексты по уровням, написаны для кабинета' + (level ? ' · твой уровень ' + level : '') + '</span></div>' +
      '<div class="lib-grid">' + (lib.every((x) => mine.has(x.id)) ? '<p class="muted">Все тексты библиотеки уже открыты — скоро добавлю новые!</p>' : '') +
      lib.filter((x) => !mine.has(x.id)).sort((a, b) => ['A1', 'A2', 'B1', 'B2', 'C1'].indexOf(a.level) - ['A1', 'A2', 'B1', 'B2', 'C1'].indexOf(b.level)).map((x) => {
        const words = x.body.split(/\s+/).length;
        return '<button class="lib-item' + (level === x.level ? ' mine-level' : '') + '" data-r="lib-open" data-id="' + x.id + '">' +
          '<span class="lvl-badge">' + x.level + '</span><b>' + U.esc(x.title) + '</b>' +
          '<small>' + U.esc(x.topic) + ' · ' + Math.max(1, Math.round(words / 150)) + ' мин чтения' + (mine.has(x.id) ? ' · ' + I('check', 'inline') + ' открыт' : '') + '</small></button>';
      }).join('') + '</div></section>';
  }

  // ---------- «После текста»: тренировки ----------

  const CREATIVE = [
    ['retell', 'Перескажи текст', 'Перескажи текст своими словами на английском в 3–5 предложениях.'],
    ['opinion', 'Твоё мнение', 'Согласна ли ты с автором или героем? Напиши 3–5 предложений на английском и объясни почему.'],
    ['continue', 'Продолжи историю', 'Придумай, что было дальше (или другой конец). Напиши 4–6 предложений на английском.'],
    ['personal', 'Из моей жизни', 'Был ли у тебя похожий опыт? Расскажи о нём в 4–6 предложениях на английском.'],
    ['words', '5 слов из текста', 'Выбери 5 интересных слов или выражений из текста и напиши с каждым своё предложение.'],
  ];
  let talkOpen = null;

  function afterTextHTML(t) {
    const ai = AI.ready() || !!AI._mock;
    return '<section class="card after-text"><div class="card-head"><h2 class="h-ic">' + I('sparkles') + ' После текста</h2>' +
      (t.quiz ? '<span class="tag ok">вопросы: ' + t.quiz + '%</span>' : '') + '</div>' +
      '<p class="muted small">Выбери тренировку — можно несколько по очереди.</p>' +
      '<div class="after-grid">' +
        '<button class="after-item" data-r="quiz">' + I('target') + '<b>Вопросы на понимание</b><small>что поняла из текста</small></button>' +
        '<button class="after-item" data-r="drill-gaps">' + I('pen') + '<b>Пропуски</b><small>вставь слово из текста</small></button>' +
        '<button class="after-item" data-r="drill-order">' + I('cards') + '<b>Собери предложение</b><small>фразы из текста по словам</small></button>' +
        '<button class="after-item" data-r="drill-listen">' + I('volume') + '<b>Диктант по тексту</b><small>слушай и записывай</small></button>' +
        '<button class="after-item ai" data-r="talk">' + I('sparkles') + '<b>Поговорить о тексте</b><small>диалог на английском с нейросетью</small></button>' +
        CREATIVE.map(([id, name, desc]) => '<button class="after-item ai" data-r="creative" data-id="' + id + '">' + I('pen') + '<b>' + name + '</b><small>' + U.esc(desc.split('.')[0].slice(0, 60)) + '</small></button>').join('') +
      '</div>' +
      (!ai ? '<p class="muted small">Диалог и творческие задания проверяет нейросеть — подключи её в Настройках. Остальное работает без неё.</p>' : '') +
      (talkOpen === t.id ? App.askBoxHTML('talk-' + t.id, 'Разговор о тексте «' + t.title + '»', 'Answer in English — mistakes are OK!') : '') +
      '</section>';
  }

  // Предложения текста для тренировок
  function sentencesOf(t, min, max) {
    return bodyOf(t).replace(/[—–]\s*/g, '').split(/(?<=[.!?])\s+|\n+/).map((x) => x.trim())
      .filter((x) => { const n = x.split(/\s+/).length; return n >= min && n <= max && !/[«»"“”]/.test(x); });
  }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const STOP = new Set(['the', 'and', 'that', 'with', 'this', 'from', 'have', 'they', 'there', 'their', 'which', 'when', 'what', 'were', 'would', 'about', 'into', 'than', 'then', 'them', 'your', 'some', 'very', 'just', 'only', 'also', 'because']);

  function startTextDrill(t, kind) {
    let ex = [];
    if (kind === 'gaps') {
      shuffle(sentencesOf(t, 6, 22)).slice(0, 6).forEach((sn) => {
        const words = sn.split(/\s+/);
        const cands = words.map((w, i) => ({ w: w.replace(/[^A-Za-z’'-]/g, ''), i })).filter((x) => x.i > 0 && x.w.length >= 4 && !STOP.has(x.w.toLowerCase()) && /^[a-z]/.test(x.w));
        if (!cands.length) return;
        const c = cands[Math.floor(Math.random() * cands.length)];
        const sentence = words.map((w, i) => (i === c.i ? w.replace(c.w, '___') : w)).join(' ');
        ex.push({ type: 'gap', sentence, answer: c.w, hint: 'первая буква: ' + c.w[0] + ', букв: ' + c.w.length, explain: 'В тексте: «' + sn + '»' });
      });
    } else if (kind === 'order') {
      ex = shuffle(sentencesOf(t, 5, 11)).slice(0, 5).map((sn) => ({ type: 'order', translation: 'Собери предложение из текста', answer: sn.replace(/[.!?]$/, '') }));
    } else if (kind === 'listen') {
      ex = shuffle(sentencesOf(t, 4, 14)).slice(0, 5).map((sn) => ({ type: 'listen', text: sn }));
    }
    if (!ex.length) { U.toast('Текст слишком короткий для этой тренировки'); return; }
    stopListen();
    App.startQuiz({ gaps: 'Пропуски', order: 'Собери предложение', listen: 'Диктант' }[kind] + ': ' + t.title, ex, null, '#/read');
  }

  function startCreative(t, id) {
    if (!AI.ready() && !AI._mock) { U.toast('Творческие задания проверяет нейросеть — подключи её в Настройках'); return; }
    const c = CREATIVE.find((x) => x[0] === id);
    stopListen();
    App.startQuiz('Творческое: ' + t.title, [{ type: 'open', kind: 'creative', task: c[2], sample: '', context: bodyOf(t) }], null, '#/read');
  }

  function bindTalk(t) {
    if (!root) return;
    const lv = (S().lessons && S().lessons.level) || 'A2';
    App.bindAskBox(root, 'talk-' + t.id, () => 'Текст «' + t.title + '»:\n' + bodyOf(t).slice(0, 3500), {
      temperature: 0.7,
      system: 'You are a friendly English conversation partner for a Russian-speaking university student (level ' + lv + '). ' +
        'You are discussing the text below. Speak English at her level, keep replies short (2-4 sentences), and always end with ONE question: about the text, her opinion, or her own experience. ' +
        'If her message has mistakes, first gently show the corrected version in one line starting with "✏️ Better:", then continue the conversation. ' +
        'If she writes in Russian, answer in English and help her say it in English.',
      opener: '[начало] Start the conversation: greet me briefly and ask your first question about the text.',
      multiline: true,
      copyIntro: 'Let’s talk in English about this text. Be my conversation partner: short replies, correct my mistakes gently, ask me questions.',
    });
    const ta = root.querySelector('[data-ask="talk-' + t.id + '"] textarea');
    if (ta) ta.focus();
  }

  function markRead(t, silent) {
    t.read = true; t.readAt = Date.now();
    Store.save();
    if (!silent) U.toast('«' + t.title + '» — прочитано! Он в разделе «Прочитано».');
  }

  // Вопросы на понимание: встроенные для библиотеки, для своих текстов — от нейросети
  async function startQuiz(btn, t) {
    let qs = t.libId && window.LIBRARY_QUIZ ? window.LIBRARY_QUIZ[t.libId] : null;
    if (!qs) {
      const prompt = 'Составь 4 вопроса на понимание текста ниже (язык вопросов — как у текста, уровень — простой). ' +
        'Один вопрос можно сделать с ловушкой (вариант, которого в тексте нет). ' +
        'Верни JSON: {"questions": [{"question": "...", "options": ["...", "...", "...", "..."], "answer": 0, "explain": "где это в тексте, по-русски"}]}\n\nТекст:\n' + bodyOf(t).slice(0, 4000);
      if (!AI.ready() && !AI._mock) {
        try { await navigator.clipboard.writeText(prompt); U.toast('Нейросеть не подключена — запрос на вопросы скопирован, вставь его в любую нейросеть'); } catch (e) { window.prompt('Скопируй:', prompt); }
        return;
      }
      const r = await AI.run(btn, () => AI.ask({ json: true, temperature: 0.4, system: 'Ты — преподавательница языка. Пишешь точные вопросы строго по тексту.', prompt }));
      if (!r) return;
      qs = (r.questions || []).map((q) => Object.assign({ type: 'choice' }, q));
    }
    if (!qs || !qs.length) { U.toast('Не получилось составить вопросы'); return; }
    App.startQuiz('Понимание: ' + t.title, qs, (pct) => {
      t.quiz = Math.max(t.quiz || 0, pct);
      if (pct >= 50 && !t.read) markRead(t, true);
      if (t.read) openId = null; // вернёмся к списку — текст уже в «Прочитано»
      Store.save();
    });
  }

  function openLibrary(id) {
    const x = (window.LIBRARY || []).find((l) => l.id === id);
    if (!x) return;
    let t = S().texts.find((y) => y.libId === id);
    if (!t) {
      t = { id: U.uid(), libId: id, created: Date.now(), title: x.title, lang: x.lang }; // текст не копируем — берём из библиотеки
      S().texts.push(t);
      Store.save();
    }
    openId = t.id;
    App.render();
    window.scrollTo(0, 0);
  }

  function renderReader(el, t) {
    const dict = dictFor(t.lang);
    const known = knownSet(t.lang);
    const showUnknown = S().settings.readHighlightUnknown;
    const s = textStats(t);
    const html = paragraphs(bodyOf(t)).map((p, pi) => {
      const parts = p.split(WORD_RE);
      return '<p data-p="' + pi + '">' + parts.map((tok, i) => {
        if (i % 2 === 0) return U.esc(tok);
        const w = norm(tok);
        if (/^\d+$/.test(w)) return U.esc(tok);
        return '<span class="w ' + status(w, dict, known) + '" data-w="' + U.esc(w) + '" data-i="' + i + '">' + U.esc(tok) + '</span>';
      }).join('') + '</p>';
    }).join('');

    el.innerHTML =
      '<header class="page-head"><div><button class="link-btn" data-r="back">‹ Все тексты</button><h1>' + U.esc(t.title) + '</h1>' +
      '<p class="muted">' + U.esc(App.langName(t.lang)) + ' · ' + s.total + ' разных слов · учу ' + s.learning + ' · выучено ' + s.learned + '</p></div>' +
      '<div class="row-btns"><button class="btn" data-r="edit" data-id="' + t.id + '">Изменить</button></div></header>' +
      '<div class="card reader-bar">' +
        '<label class="check"><input type="checkbox" data-r="toggle-unknown"' + (showUnknown ? ' checked' : '') + '> Подсвечивать неотмеченные слова</label>' +
        '<div class="reader-legend small"><span class="w learning">учу</span><span class="w learned">выучено</span>' + (showUnknown ? '<span class="w unknown">не отмечено</span>' : '') + '</div>' +
        '<div class="listen-bar">' +
          '<button class="btn small' + (listen.playing ? ' primary' : '') + '" data-r="listen">' + I(listen.playing ? 'pause' : 'volume') + (listen.playing ? ' Пауза' : ' Слушать текст') + '</button>' +
          '<select data-r="rate" aria-label="Скорость">' + [[0.7, 'медленно'], [0.9, 'обычно'], [1.1, 'быстрее']].map(([v, n]) => '<option value="' + v + '"' + (listen.rate === v ? ' selected' : '') + '>' + n + '</option>').join('') + '</select>' +
          '<label class="check small"><input type="checkbox" data-r="hide-text"' + (listen.hidden ? ' checked' : '') + '> Аудирование: скрыть текст</label>' +
        '</div>' +
      '</div>' +
      '<article class="card reader' + (showUnknown ? ' show-unknown' : '') + (listen.hidden ? ' hidden-text' : '') + '" id="reader" lang="' + U.esc((t.lang || '').split('-')[0]) + '">' + html + '</article>' +
      '<div class="reader-foot">' +
        '<p class="muted small">Нажми на слово, чтобы перевести и добавить в карточки. Можно выделить несколько слов — добавится фраза.</p>' +
        (s.unknown ? '<button class="btn" data-r="all-known">' + I('check') + ' Я знаю все неотмеченные слова (' + s.unknown + ')</button>' : '') +
      '</div>' + afterTextHTML(t) +
      '<div class="reader-foot"><div class="row-btns finish-text">' +
        (t.read ? '<button class="btn" data-r="unread" data-id="' + t.id + '">Вернуть в «Читаю сейчас»</button>' : '<button class="btn primary" data-r="mark-read">' + I('check') + ' Прочитала</button>') +
      '</div></div>';
    if (talkOpen === t.id) bindTalk(t);

    const reader = el.querySelector('#reader');
    reader.addEventListener('mouseup', onSelect);
    reader.addEventListener('touchend', () => setTimeout(onSelect, 30));
  }

  function onSelect() {
    const sel = window.getSelection();
    const str = sel ? sel.toString().replace(/\s+/g, ' ').trim() : '';
    if (!str || !/\s/.test(str) || str.length > 120) return;
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const anc = range.commonAncestorContainer;
    const pEl = (anc.nodeType === 1 ? anc : anc.parentElement).closest('p');
    openPop({ word: str, display: str, rect, sentence: pEl ? sentenceAround(pEl.textContent, pEl.textContent.indexOf(str)) : '' });
  }

  // Предложение вокруг позиции — его кладём в заметку карточки как пример.
  function sentenceAround(str, pos) {
    if (pos < 0) return '';
    let a = pos, b = pos;
    while (a > 0 && !/[.!?…]/.test(str[a - 1])) a--;
    while (b < str.length && !/[.!?…]/.test(str[b])) b++;
    const out = str.slice(a, b + 1).trim();
    return out.length > 280 ? out.slice(0, 277) + '…' : out;
  }

  // ---------- Всплывающее окно слова ----------

  function closePop() { if (pop) { pop.remove(); pop = null; } }

  function openPop(o) {
    closePop();
    const t = text(openId);
    if (!t) return;
    const w = norm(o.word);
    const dict = dictFor(t.lang);
    const entry = dict.get(w);
    const known = knownSet(t.lang).has(w);
    const decks = S().decks.filter((d) => !t.lang || !d.lang || d.lang === t.lang);
    const preferred = t.deckId && decks.find((d) => d.id === t.deckId) ? t.deckId : decks[0] && decks[0].id;
    const sl = (t.lang || 'auto').split('-')[0] || 'auto';
    const trUrl = 'https://translate.google.com/?sl=' + encodeURIComponent(sl) + '&tl=ru&op=translate&text=' + encodeURIComponent(o.display);

    const src0 = (t.lang || '').split('-')[0];
    pop = document.createElement('div');
    pop.className = 'word-pop';
    pop.setAttribute('role', 'dialog');
    pop.innerHTML =
      '<div class="wp-head"><b>' + U.esc(o.display) + '</b>' +
      (t.lang && 'speechSynthesis' in window ? '<button class="icon-btn small" data-wp="speak" aria-label="Произнести">' + I('volume') + '</button>' : '') +
      '<span class="tag ' + (entry ? ((entry.card.interval || 0) >= 21 ? 'ok' : 'warn-soft') : known ? 'ok' : 'new') + '">' +
        (entry ? ((entry.card.interval || 0) >= 21 ? 'выучено' : 'учу · ' + U.esc(entry.deck.name)) : known ? 'знаю' : 'новое') + '</span>' +
      '<button class="icon-btn small wp-close" data-wp="close" aria-label="Закрыть">' + I('x') + '</button></div>' +
      '<form class="wp-form">' +
        '<input name="front" value="' + U.esc(entry ? entry.card.front : o.display.toLowerCase()) + '" aria-label="Слово для карточки" maxlength="200">' +
        '<input name="back" value="' + U.esc(entry ? entry.card.back : '') + '" placeholder="Перевод…" aria-label="Перевод" maxlength="1000" required>' +
        (o.sentence ? '<label class="check small wp-ex"><input type="checkbox" name="useNote" checked> <span>пример: «' + U.esc(o.sentence) + '»</span></label>' : '') +
        '<div class="wp-more">' +
          (o.sentence ? '<button type="button" class="btn small ai-btn" data-wp="ai">' + I('sparkles') + ' Объяснить в контексте</button>' : '') +
          (o.sentence && src0 && src0 !== 'ru' ? '<button type="button" class="btn small" data-wp="sent">' + I('globe') + ' Перевести предложение</button>' : '') +
          (src0 === 'en' && !/\s/.test(o.display) ? '<button type="button" class="btn small" data-wp="defs">' + I('book') + ' Значения слова</button>' : '') +
        '</div><div class="wp-info" hidden></div>' +
        (entry ? '' : decks.length ?
          '<select name="deckId" aria-label="Колода">' + decks.map((d) => '<option value="' + d.id + '"' + (d.id === preferred ? ' selected' : '') + '>в колоду: ' + U.esc(d.name) + '</option>').join('') + '<option value="__new">+ новая колода…</option></select>' :
          '<input type="hidden" name="deckId" value="__new"><p class="muted small">Колода «' + U.esc(t.title.slice(0, 30)) + '» создастся автоматически.</p>') +
        '<div class="wp-actions">' +
          '<a class="btn small ghost" href="' + trUrl + '" target="_blank" rel="noopener noreferrer">Переводчик ' + I('external') + '</a>' +
          '<span class="spacer"></span>' +
          (entry ? '' : known ? '<button type="button" class="btn small" data-wp="unknown">Не знаю</button>' : '<button type="button" class="btn small" data-wp="known">' + I('check') + ' Знаю</button>') +
          '<button class="btn small primary">' + (entry ? 'Сохранить' : '+ В карточки') + '</button>' +
        '</div>' +
      '</form>';
    document.body.appendChild(pop);

    // Позиция: под словом (на телефоне — снизу экрана, через CSS)
    const r = o.rect;
    const pw = Math.min(360, window.innerWidth - 24);
    let left = r.left + r.width / 2 - pw / 2 + window.scrollX;
    left = Math.max(12, Math.min(left, window.innerWidth - pw - 12));
    let top = r.bottom + 8 + window.scrollY;
    pop.style.width = pw + 'px';
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
    const ph = pop.offsetHeight;
    if (r.bottom + ph + 90 > window.innerHeight && r.top - ph - 8 > 0) pop.style.top = (r.top - ph - 8 + window.scrollY) + 'px';

    const form = pop.querySelector('form');
    const back = form.querySelector('[name=back]');
    setTimeout(() => back.focus(), 20);

    // Автоперевод: подставляем перевод, если его ещё нет
    const src = (t.lang || '').split('-')[0];
    if (!entry && S().settings.autoTranslate && src && src !== 'ru' && navigator.onLine !== false) {
      back.placeholder = 'перевожу…';
      const myPop = pop;
      Promise.all([translate(o.display, src), src === 'en' ? ruMeanings(o.display) : null]).then(([res, groups]) => {
        if (pop !== myPop) return;
        back.placeholder = 'Перевод…';
        // Словарь даёт несколько переводов: основной — та часть речи, что совпала с переводчиком
        if (groups) {
          const ranked = rankGroups(groups, res && res.main);
          if (!back.value) back.value = ranked[0].words.join(', ');
          o.groups = groups;
          const rest = moreLine(groups, back.value);
          if (rest) {
            const more = document.createElement('p');
            more.className = 'muted small wp-more-tr';
            more.textContent = 'ещё: ' + rest;
            back.insertAdjacentElement('afterend', more);
          }
        }
        if (!res) return;
        if (!back.value) back.value = res.main;
        // Если словарь нашёл слово, его вариантов достаточно — у переводчика они часто случайные
        if (!groups && res.alts.length) {
          const box = document.createElement('div');
          box.className = 'wp-alts';
          box.innerHTML = '<span class="muted small">варианты:</span>' + res.alts.map((a) => '<button type="button" class="chip">' + U.esc(a) + '</button>').join('');
          box.addEventListener('click', (e) => { const c = e.target.closest('.chip'); if (c) { back.value = c.textContent; back.focus(); } });
          back.insertAdjacentElement('afterend', box);
        }
      });
    }

    pop.addEventListener('click', (e) => {
      const b = e.target.closest('[data-wp]');
      if (!b) return;
      if (b.dataset.wp === 'close') closePop();
      if (b.dataset.wp === 'speak') speak(o.display, t.lang);
      if (b.dataset.wp === 'ai') {
        if (!AI.ready() && !AI._mock) { U.toast('Подключи нейросеть: Настройки → «Нейросеть»'); return; }
        const myPop = pop;
        AI.run(b, () => AI.ask({
          json: true, temperature: 0.3,
          system: 'Ты — преподаватель иностранного языка для русскоязычной студентки. Объясняй коротко и понятно, по-русски.',
          prompt: 'Язык текста: ' + (App.langName(t.lang) || 'не указан') + '.\nСлово или фраза: "' + o.display + '"\nПредложение: "' + o.sentence + '"\n\n' +
            'Объясни значение именно в этом предложении. Верни JSON: {"lemma": "начальная форма слова (для глаголов в английском с to)", ' +
            '"translation": "перевод в этом контексте, 1-3 слова", "pos": "часть речи по-русски", ' +
            '"meaning": "1-2 предложения: что значит здесь и чем отличается от других значений", ' +
            '"example": "ещё один простой пример с этим значением на языке оригинала", "example_ru": "перевод примера"}',
        })).then((r) => {
          if (!r || pop !== myPop) return;
          const info = pop.querySelector('.wp-info');
          info.hidden = false;
          info.insertAdjacentHTML('afterbegin',
            '<div class="wp-ai"><div class="wp-ai-head">' + I('sparkles') + ' <b>' + U.esc(r.translation || '') + '</b>' + (r.pos ? ' <span class="tag">' + U.esc(r.pos) + '</span>' : '') + '</div>' +
            (r.meaning ? '<p>' + U.esc(r.meaning) + '</p>' : '') +
            (r.example ? '<p class="muted"><i>' + U.esc(r.example) + '</i>' + (r.example_ru ? '<br>' + U.esc(r.example_ru) : '') + '</p>' : '') +
            '<button type="button" class="btn small" data-wp="ai-fill">' + I('check') + ' Подставить в карточку</button></div>');
          o.ai = r;
          b.remove();
        });
      }
      if (b.dataset.wp === 'ai-fill' && o.ai) {
        const f = pop.querySelector('form');
        if (o.ai.lemma) f.front.value = o.ai.lemma;
        if (o.ai.translation) f.back.value = o.ai.translation;
        if (o.ai.example) o.aiNote = o.ai.example + (o.ai.example_ru ? ' — ' + o.ai.example_ru : '');
        U.toast('Подставила. Нажми «В карточки», чтобы сохранить.');
      }
      if (b.dataset.wp === 'sent' || b.dataset.wp === 'defs') {
        const info = pop.querySelector('.wp-info');
        const myPop = pop;
        b.disabled = true;
        info.hidden = false;
        info.insertAdjacentHTML('beforeend', '<p class="muted small wp-loading">загружаю…</p>');
        const done = (html) => {
          if (pop !== myPop) return;
          const l = info.querySelector('.wp-loading'); if (l) l.remove();
          // Перевод предложения — всегда сверху, значения — ниже
          info.insertAdjacentHTML(b.dataset.wp === 'sent' ? 'afterbegin' : 'beforeend', html);
        };
        if (b.dataset.wp === 'sent') {
          translate(o.sentence, src0).then((res) => {
            if (res) o.sentenceTr = res.main;
            done(res ? '<div class="wp-sent"><span class="muted small">перевод предложения:</span><p>' + U.esc(res.main) + '</p></div>' :
              '<p class="muted small">Не получилось перевести (нет интернета или закончился дневной лимит сервиса).</p>');
          });
        } else {
          definitions(o.display).then((defs) => {
            done(defs && defs.length ? '<div class="wp-defs">' + defs.map((d) =>
              '<div><span class="tag">' + U.esc(POS[d.pos] || d.pos) + '</span>' + (d.items.length ? '<ol>' : '') + d.items.map((it) =>
                '<li>' + U.esc(it.def) + (it.ex ? '<br><i class="muted">' + U.esc(it.ex) + '</i>' : '') + '</li>').join('') + (d.items.length ? '</ol>' : '') + '</div>').join('') +
              '<p class="muted small">Значения на английском — из Викисловаря (Wiktionary).</p></div>' :
              '<p class="muted small">Словарь не нашёл это слово. Попробуй начальную форму (например, «go» вместо «went»).</p>');
          });
        }
      }
      if (b.dataset.wp === 'known' || b.dataset.wp === 'unknown') {
        setKnown(t.lang, [w], b.dataset.wp === 'known');
        App.render();
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = U.formData(form);
      if (!d.back) { back.focus(); return; }
      const note = form.querySelector('[name=useNote]') && form.querySelector('[name=useNote]').checked
        ? o.sentence + (o.sentenceTr ? ' — ' + o.sentenceTr : '') : (o.aiNote || '');
      if (entry) {
        entry.card.front = d.front || entry.card.front;
        entry.card.back = d.back;
        if (note && !entry.card.note) entry.card.note = note;
        U.toast('Карточка обновлена');
      } else {
        let deck = S().decks.find((x) => x.id === d.deckId);
        if (!deck) {
          const name = d.deckId === '__new' && decks.length ? (prompt('Название новой колоды', 'Слова из «' + t.title + '»') || '').trim() : 'Слова из «' + t.title + '»';
          if (!name) return;
          deck = { id: U.uid(), name, lang: t.lang, direction: 'fb', created: Date.now(), cards: [] };
          S().decks.push(deck);
        }
        const card = { id: U.uid(), front: d.front || o.display, back: d.back, note, created: Date.now(), source: t.id };
        if (o.groups && card.front.toLowerCase() === o.display.toLowerCase()) card.more = moreLine(o.groups, card.back);
        deck.cards.push(card);
        t.deckId = deck.id;
        setKnown(t.lang, [w], false);
        U.toast('Добавлено в «' + deck.name + '»');
      }
      Store.save();
      App.render();
    });
  }

  // Бесплатный перевод через MyMemory (без ключа). Отправляется только само слово/фраза.
  const trCache = new Map();
  function translate(str, src) {
    const key = src + '|' + str.toLowerCase();
    if (trCache.has(key)) return Promise.resolve(trCache.get(key));
    const url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(str) + '&langpair=' + encodeURIComponent(src + '|ru');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    return fetch(url, { signal: ctrl.signal }).then((r) => r.json()).then((data) => {
      clearTimeout(timer);
      const clean = (x) => String(x || '').replace(/\s+/g, ' ').trim();
      const main = clean(data && data.responseData && data.responseData.translatedText);
      if (!main || /MYMEMORY WARNING|INVALID/i.test(main)) return null;
      const seen = new Set([main.toLowerCase()]);
      const alts = [];
      ((data && data.matches) || []).forEach((m) => {
        const tr = clean(m.translation);
        const low = tr.toLowerCase();
        if (/[а-яё]/i.test(tr) && tr.length < 60 && !/[a-z]{3,}/i.test(tr) && !seen.has(low) && alts.length < 3) {
          seen.add(low);
          alts.push(str[0] === str[0].toLowerCase() ? tr.charAt(0).toLowerCase() + tr.slice(1) : tr);
        }
      });
      // Если слово в тексте с маленькой буквы — и перевод с маленькой.
      const lower = str[0] === str[0].toLowerCase();
      const res = { main: lower ? main.charAt(0).toLowerCase() + main.slice(1) : main, alts };
      trCache.set(key, res);
      return res;
    }).catch(() => { clearTimeout(timer); return null; });
  }

  // Русские переводы английского слова из Викисловаря, сгруппированные по частям речи.
  // Отправляется только само слово. Результат: [{ pos: 'предлог', words: ['кроме', 'за исключением'] }, …] или null.
  const RU_POS = { verb: 'глаг.', noun: 'сущ.', adjective: 'прил.', adverb: 'нареч.', preposition: 'предлог', conjunction: 'союз',
    pronoun: 'местоим.', interjection: 'межд.', determiner: 'определитель', numeral: 'числ.', phrase: 'выражение', idiom: 'выражение',
    'phrasal verb': 'фраз. глагол', 'prepositional phrase': 'выражение', particle: 'частица' };
  const ruCache = new Map();
  async function wikitext(page) {
    const r = await fetch('https://en.wiktionary.org/w/api.php?action=parse&format=json&origin=*&prop=wikitext&redirects=1&page=' + encodeURIComponent(page));
    if (!r.ok) return '';
    const data = await r.json();
    const all = (data && data.parse && data.parse.wikitext && data.parse.wikitext['*']) || '';
    const m = all.match(/^==\s*English\s*==\s*$([\s\S]*?)(?=^==[^=]|$(?![\s\S]))/m);
    return m ? m[1] : (/\/translations$/.test(page) ? all : '');
  }
  function parseRu(text) {
    const senses = [];
    let pos = '', gloss = '';
    text.split('\n').forEach((line) => {
      const h = line.match(/^={3,6}\s*([A-Za-z ]+?)\s*={3,6}\s*$/);
      if (h) { const p = h[1].toLowerCase(); if (RU_POS[p]) pos = p; else if (/^(etymology|pronunciation)/.test(p)) pos = ''; return; }
      const tt = line.match(/\{\{(?:trans-top|checktrans-top)(?:-also)?\|?([^}]*)\}\}/);
      if (tt) { gloss = tt[1].replace(/\b(id|column-width)=[^|]*\|?/g, '').trim(); return; }
      if (!pos || !/^\*:?\s*Russian\s*:/.test(line)) return;
      const words = [];
      line.replace(/\{\{tt?\+?\|ru\|((?:\[\[[^\]]*\]\]|[^|}])+)/g, (_, w) => {
        const clean = w.replace(/\u0301/g, '').replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1').trim();
        if (clean && /[а-яё]/i.test(clean) && !words.includes(clean)) words.push(clean);
      });
      if (words.length) senses.push({ pos, gloss, words });
    });
    return senses;
  }
  async function ruMeanings(word) {
    const key = String(word || '').trim().toLowerCase();
    if (!key || key.split(/\s+/).length > 4 || !/^[a-z' -]+$/.test(key)) return null;
    if (ruCache.has(key)) return ruCache.get(key);
    let senses = [];
    try {
      // У частых слов (go, take) переводы вынесены на отдельную страницу «слово/translations»
      const load = async (page) => {
        const text = await wikitext(page);
        let found = parseRu(text);
        if (/translation subpage|\/translations/.test(text)) found = found.concat(parseRu(await wikitext(page + '/translations')));
        return { text, found };
      };
      const first = await load(key);
      senses = first.found;
      // Форма другого слова («felt» → «feel», «drawers» → «drawer»): переводы начальной формы ставим первыми
      const lemma = (first.text.match(/\{\{[^{}|]*\bof\|en\|([^|}]+)/) || [])[1];
      if (lemma && lemma.toLowerCase() !== key) senses = (await load(lemma)).found.concat(senses);
    } catch (e) { return null; }
    // По частям речи: из главного значения до двух слов, из следующих двух — по одному.
    // Пары вроде «исключать / исключить» и «ящик / выдвижной ящик» не повторяем.
    const byPos = new Map();
    senses.forEach((s) => { if (!byPos.has(s.pos)) byPos.set(s.pos, []); byPos.get(s.pos).push(s.words); });
    const similar = (a, b) => { a = a.toLowerCase(); b = b.toLowerCase(); return a === b || a.includes(b) || b.includes(a) || (a.length > 5 && b.length > 5 && a.slice(0, 5) === b.slice(0, 5)); };
    const groups = [];
    byPos.forEach((list, p) => {
      const out = [];
      list.slice(0, 3).forEach((ws, i) => {
        let n = 0;
        ws.forEach((w) => { if (n < (i ? 1 : 2) && out.length < 4 && !out.some((x) => similar(x, w))) { out.push(w); n++; } });
      });
      if (out.length) groups.push({ pos: RU_POS[p], words: out });
    });
    // «noticed», «started» — это глагол, хотя в словаре у начальной формы первым идёт существительное
    if (/(ed|ing)$/.test(key)) groups.sort((a, b) => (b.pos === RU_POS.verb) - (a.pos === RU_POS.verb));
    const res = groups.length ? groups.slice(0, 3) : null;
    ruCache.set(key, res);
    return res;
  }
  // Ставим первой ту часть речи, где есть уже известный перевод (из контекста или из карточки)
  function rankGroups(groups, hint) {
    const h = String(hint || '').toLowerCase().split(/[,;]\s*/).map((x) => x.trim()).filter(Boolean);
    const hit = (g) => g.words.some((w) => h.includes(w.toLowerCase()));
    return groups.slice().sort((a, b) => hit(b) - hit(a));
  }
  // Строка «ещё» для карточки: всё, чего нет в основном переводе
  function moreLine(groups, back) {
    const have = String(back || '').toLowerCase().split(/[,;]\s*/).map((x) => x.trim());
    return rankGroups(groups, back).map((g) => {
      const ws = g.words.filter((w) => !have.includes(w.toLowerCase()));
      return ws.length ? g.pos + ' ' + ws.join(', ') : '';
    }).filter(Boolean).join(' · ');
  }
  App.ruMeanings = ruMeanings;
  App.ruMoreLine = moreLine;
  App.ruRank = rankGroups;
  App.mtTranslate = (str, src) => translate(str, src);
  App.sentenceAround = (str, pos) => sentenceAround(str, pos);

  // Значения английского слова по частям речи (бесплатный словарь, без ключа).
  const POS = { noun: 'сущ.', verb: 'глаг.', adjective: 'прил.', adverb: 'нареч.', pronoun: 'местоим.', preposition: 'предлог', conjunction: 'союз', interjection: 'межд.' };
  const defCache = new Map();
  function definitions(word) {
    const key = word.toLowerCase();
    if (defCache.has(key)) return Promise.resolve(defCache.get(key));
    return fromWiktionary(key)
      .catch(() => null)
      .then((r) => (r && r.length ? r : fromDictionaryApi(key)))
      .then((r) => { if (r && r.length) defCache.set(key, r); return r; })
      .catch(() => null);
  }

  // Убираем HTML-разметку из ответа Викисловаря
  function stripHtml(html) {
    const el = document.createElement('div');
    el.innerHTML = String(html || '');
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  // Основной источник — Викисловарь (английский). Для форм вроде «smells» идём к «smell».
  async function fromWiktionary(word, depth) {
    const r = await fetch('https://en.wiktionary.org/api/rest_v1/page/definition/' + encodeURIComponent(word));
    if (!r.ok) return null;
    const data = await r.json();
    const out = [];
    const lemmas = [];
    (data.en || []).forEach((entry) => {
      const items = [];
      (entry.definitions || []).forEach((d) => {
        const html = d.definition || '';
        if (/form-of-definition/.test(html)) {
          // ссылка на начальную форму: <span class="form-of-definition-link">…<a href="/wiki/life#English">
          const m = html.match(/form-of-definition-link[\s\S]*?href="\/wiki\/([^"#]+)/);
          if (m) {
            const lemma = decodeURIComponent(m[1]).replace(/_/g, ' ');
            if (!lemmas.some((x) => x.lemma === lemma)) lemmas.push({ lemma, pos: String(entry.partOfSpeech || '').toLowerCase() });
          }
          return;
        }
        const def = stripHtml(html);
        if (!def || items.length >= 3) return;
        const ex = (d.examples && d.examples[0]) ? stripHtml(d.examples[0]) : (d.parsedExamples && d.parsedExamples[0] ? stripHtml(d.parsedExamples[0].example) : '');
        items.push({ def, ex: ex.length < 160 ? ex : '' });
      });
      const pos = String(entry.partOfSpeech || '').toLowerCase();
      if (items.length && !/symbol|letter|abbreviation|initialism|proper noun|prefix|suffix/.test(pos)) out.push({ pos, items });
    });
    // Слово — форма другого слова: показываем значения начальных форм (до двух)
    if (!depth && lemmas.length) {
      const extra = [];
      for (const l of lemmas.slice(0, 2)) {
        if (l.lemma.toLowerCase() === word) continue;
        const base = await fromWiktionary(l.lemma.toLowerCase(), 1).catch(() => null);
        if (!base || !base.length) continue;
        const same = base.filter((b) => b.pos === l.pos);
        extra.push({ pos: '→ ' + l.lemma + ' (' + (POS[l.pos] || l.pos) + ')', items: [] });
        (same.length ? same : base).slice(0, 2).forEach((b) => extra.push(b));
      }
      return out.concat(extra).slice(0, 6);
    }
    return out.slice(0, 4);
  }

  // Запасной источник — dictionaryapi.dev
  function fromDictionaryApi(key) {
    return fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(key))
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const byPos = new Map();
        (Array.isArray(data) ? data : []).forEach((entry) => (entry.meanings || []).forEach((m) => {
          const list = byPos.get(m.partOfSpeech) || [];
          (m.definitions || []).forEach((d) => { if (list.length < 3 && d.definition) list.push({ def: d.definition, ex: d.example || '' }); });
          byPos.set(m.partOfSpeech, list);
        }));
        return Array.from(byPos, ([pos, items]) => ({ pos, items })).filter((x) => x.items.length).slice(0, 4);
      });
  }

  function setKnown(lang, words, isKnown) {
    const key = lang || '_';
    const set = new Set(S().known[key] || []);
    words.forEach((w) => { if (isKnown) set.add(w); else set.delete(w); });
    S().known[key] = Array.from(set);
    Store.save();
  }

  function speak(str, lang) {
    if (!('speechSynthesis' in window) || !lang) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(str);
    u.lang = lang; u.rate = 0.9;
    speechSynthesis.speak(u);
  }

  // ---------- Окно текста ----------

  function textModal(t) {
    const isNew = !t;
    t = t || { title: '', lang: 'en-US', body: '' };
    App.modal({
      title: isNew ? 'Новый текст' : 'Текст',
      body:
        '<label>Название<input name="title" required maxlength="80" value="' + U.esc(t.title) + '" placeholder="например, Глава 1"></label>' +
        '<label>Язык<select name="lang">' + App.LANGS.map(([c, n]) => '<option value="' + c + '"' + (c === t.lang ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></label>' +
        '<label>Текст<textarea name="body" rows="10" required placeholder="Вставь сюда текст на изучаемом языке">' + U.esc(bodyOf(t)) + '</textarea></label>',
      extra: isNew ? '' : '<button type="button" class="btn ghost danger-text" data-x="del">Удалить</button>',
      onOpen(form, close) {
        const del = form.querySelector('[data-x=del]');
        if (del) del.addEventListener('click', async () => {
          close();
          if (await App.confirm('Удалить текст «' + t.title + '»? Карточки, которые ты из него добавила, останутся.')) {
            S().texts = S().texts.filter((x) => x.id !== t.id);
            openId = null; Store.save(); App.render();
          }
        });
      },
      onSubmit(d) {
        const body = d.body || '';
        if (!d.title || !body) return false;
        if (isNew) { t = { id: U.uid(), created: Date.now() }; S().texts.push(t); }
        t.title = d.title; t.lang = d.lang; t.body = body;
        openId = t.id;
        Store.save(); App.render();
      },
    });
  }

  function addSample() {
    const t = {
      id: U.uid(), created: Date.now(), title: 'A quiet morning', lang: 'en-US',
      body: 'Every morning, Anna wakes up before the city gets loud. She makes a cup of tea and opens the window. The street is still empty, and the air smells of rain.\n\n' +
        'Although she has a busy schedule, she always finds twenty minutes for English. Today she is reading a short story about a journey across the mountains. ' +
        'Some words are new, so she writes them down and tries to guess their meaning from the context.\n\n' +
        'Later, at the university, she will meet her friends. They often rely on each other when exams are coming. ' +
        'Anna is grateful for that. She believes that small steps every day help you achieve big goals.',
    };
    S().texts.push(t);
    openId = t.id;
    Store.save();
    App.render();
  }

  // ---------- События ----------

  document.addEventListener('click', async (e) => {
    const selStr = window.getSelection ? window.getSelection().toString().trim() : '';
    if (pop && pop.isConnected && !pop.contains(e.target) && !e.target.closest('.w') && !/\s/.test(selStr)) closePop();
    if (!root || !root.contains(e.target)) return;
    const w = e.target.closest('.w');
    if (w && root.querySelector('#reader') && root.querySelector('#reader').contains(w)) {
      const sel = window.getSelection();
      if (sel && /\s/.test(sel.toString().trim())) return; // выделена фраза — её обработает onSelect
      const p = w.closest('p');
      const before = Array.from(p.childNodes).slice(0, Array.from(p.childNodes).indexOf(w)).map((n) => n.textContent).join('');
      openPop({ word: w.dataset.w, display: w.textContent, rect: w.getBoundingClientRect(), sentence: sentenceAround(p.textContent, before.length) });
      return;
    }
    const b = e.target.closest('[data-r]');
    if (!b) return;
    const t = openId && text(openId);
    switch (b.dataset.r) {
      case 'new': textModal(); break;
      case 'sample': addSample(); break;
      case 'lib-open': openLibrary(b.dataset.id); break;
      case 'listen':
        if (listen.playing) { listen.playing = false; speechSynthesis.cancel(); App.render(); }
        else { if (listen.textId !== openId) { listen.idx = 0; listen.textId = openId; } listen.playing = true; App.render(); playFrom(listen.idx); }
        break;
      case 'mark-read': if (t) { markRead(t); openId = null; App.render(); window.scrollTo(0, 0); } break;
      case 'unread': { const x = text(b.dataset.id); if (x) { x.read = false; x.readAt = null; Store.save(); App.render(); } break; }
      case 'quiz': if (t) startQuiz(b, t); break;
      case 'drill-gaps': if (t) startTextDrill(t, 'gaps'); break;
      case 'drill-order': if (t) startTextDrill(t, 'order'); break;
      case 'drill-listen': if (t) startTextDrill(t, 'listen'); break;
      case 'creative': if (t) startCreative(t, b.dataset.id); break;
      case 'talk':
        if (!t) break;
        if (!AI.ready() && !AI._mock) { U.toast('Для разговора нужна нейросеть — подключи её в Настройках'); break; }
        talkOpen = talkOpen === t.id ? null : t.id;
        App.render();
        if (talkOpen) setTimeout(() => { const box = root && root.querySelector('.ask-box'); if (box) box.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 50);
        break;
      case 'open': openId = b.dataset.id; App.render(); break;
      case 'back': stopListen(); openId = null; App.render(); break;
      case 'edit': textModal(text(b.dataset.id)); break;
      case 'all-known': {
        if (!t) break;
        const dict = dictFor(t.lang);
        const known = knownSet(t.lang);
        const list = Array.from(new Set(wordsOf(bodyOf(t)))).filter((x) => !/^\d+$/.test(x) && status(x, dict, known) === 'unknown');
        if (await App.confirm('Отметить ' + list.length + ' ' + U.plural(list.length, ['слово', 'слова', 'слов']) + ' как знакомые? Они перестанут подсвечиваться во всех текстах на этом языке.', 'Отметить')) {
          setKnown(t.lang, list, true); App.render();
        }
        break;
      }
    }
  });

  document.addEventListener('change', (e) => {
    if (root && root.contains(e.target) && e.target.dataset.r === 'rate') { listen.rate = Number(e.target.value); return; }
    if (root && root.contains(e.target) && e.target.dataset.r === 'hide-text') { listen.hidden = e.target.checked; const r = root.querySelector('#reader'); if (r) r.classList.toggle('hidden-text', listen.hidden); return; }
    if (!root || !root.contains(e.target) || e.target.dataset.r !== 'toggle-unknown') return;
    S().settings.readHighlightUnknown = e.target.checked;
    Store.save(); App.render();
  });

  window.addEventListener('resize', closePop);

  App.views.read = {
    render,
    group: 'cards',
    leave() { root = null; closePop(); stopListen(); },
    key(e) { if (e.key === 'Escape' && pop) { closePop(); return true; } },
  };
})();
