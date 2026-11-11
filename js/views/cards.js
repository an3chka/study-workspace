// Раздел «Языки»: колоды карточек и интервальное повторение (упрощённый SM-2).
//
// Как работает повторение: после каждого ответа карточка получает интервал —
// через сколько дней показать её снова. «Не помню» — показать ещё раз сегодня,
// «Трудно» — интервал растёт чуть-чуть, «Хорошо» — заметно, «Легко» — сильно.
// Так знакомые слова появляются всё реже, а трудные — чаще.
(function () {
  'use strict';

  const App = window.App = window.App || {};
  App.views = App.views || {};

  const DAY = 86400000;
  const LANGS = [
    ['en-US', 'Английский'], ['de-DE', 'Немецкий'], ['fr-FR', 'Французский'], ['es-ES', 'Испанский'],
    ['it-IT', 'Итальянский'], ['zh-CN', 'Китайский'], ['ja-JP', 'Японский'], ['ko-KR', 'Корейский'],
    ['tr-TR', 'Турецкий'], ['pt-PT', 'Португальский'], ['ru-RU', 'Русский'], ['', 'Другой'],
  ];

  let root = null;
  let screen = { name: 'list' }; // list | deck | study
  let study = null;

  function S() { return Store.state; }
  function deck(id) { return S().decks.find((d) => d.id === id); }
  function langName(code) { const l = LANGS.find((x) => x[0] === code); return l ? l[1] : 'Другой'; }
  App.LANGS = LANGS;
  App.langName = langName;

  function isNew(c) { return !c.reps && !c.lapses && !c.seenAt; }
  function isDue(c) { return !isNew(c) && c.due <= Date.now(); }
  function isLearned(c) { return (c.interval || 0) >= 21; }

  function newLeft(d) {
    const today = U.dayKey(Date.now());
    const used = d.newLog && d.newLog.day === today ? d.newLog.n : 0;
    return Math.max(0, S().settings.newCardsPerDay - used);
  }

  function counts(d) {
    const due = d.cards.filter(isDue).length;
    const fresh = d.cards.filter(isNew).length;
    return { all: d.cards.length, due, fresh, toStudy: due + Math.min(fresh, newLeft(d)), learned: d.cards.filter(isLearned).length };
  }

  function nextLabel(c) {
    if (isNew(c)) return 'новая';
    const days = Math.round((c.due - U.startOfDay(Date.now())) / DAY);
    if (c.due <= Date.now()) return 'сегодня';
    if (days <= 0) return 'сегодня';
    if (days === 1) return 'завтра';
    return 'через ' + days + ' ' + U.plural(days, ['день', 'дня', 'дней']);
  }

  // Применить оценку: 0 — не помню, 1 — трудно, 2 — хорошо, 3 — легко.
  function grade(c, g) {
    const now = Date.now();
    c.ease = c.ease || 2.5;
    c.interval = c.interval || 0;
    c.reps = c.reps || 0;
    c.seenAt = now;
    if (g === 0) {
      c.lapses = (c.lapses || 0) + 1;
      c.reps = 0;
      c.ease = Math.max(1.3, c.ease - 0.2);
      c.interval = 0;
      c.due = now + 60000;
      return;
    }
    if (g === 1) {
      c.interval = c.reps === 0 ? 1 : Math.max(c.interval + 1, Math.round(c.interval * 1.2));
      c.ease = Math.max(1.3, c.ease - 0.15);
    } else if (g === 2) {
      c.interval = c.reps === 0 ? 1 : c.reps === 1 ? 3 : Math.round(c.interval * c.ease);
    } else {
      c.interval = c.reps === 0 ? 3 : Math.round(Math.max(c.interval, 1) * c.ease * 1.3);
      c.ease += 0.15;
    }
    c.interval = Math.min(c.interval, 365);
    c.reps++;
    c.due = U.addDays(U.startOfDay(now), c.interval) + 3 * 3600000; // в 3 часа ночи нужного дня
  }

  // Подсказка, через сколько покажется карточка при каждой оценке.
  function preview(c, g) {
    const copy = Object.assign({}, c);
    grade(copy, g);
    if (g === 0) return '<1 мин';
    return copy.interval + ' дн';
  }

  function speak(text, lang) {
    if (!('speechSynthesis' in window) || !lang) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.9;
    speechSynthesis.speak(u);
  }

  // ---------- Экраны ----------

  function render(el) {
    root = el;
    if (screen.name === 'deck' && deck(screen.id)) return renderDeck(el, deck(screen.id));
    if (screen.name === 'study' && study) return renderStudy(el);
    screen = { name: 'list' };
    renderList(el);
  }

  function renderList(el) {
    const decks = S().decks;
    const totalDue = decks.reduce((a, d) => a + counts(d).toStudy, 0);
    el.innerHTML =
      '<header class="page-head"><div><h1>Языки</h1><p class="muted">Карточки «слово — перевод» с интервальным повторением</p></div>' +
      '<div class="row-btns"><button class="btn ai-btn" data-c="gen-deck">' + I('sparkles') + ' Сгенерировать</button><button class="btn primary" data-c="new-deck">+ Колода</button></div></header>' + App.langTabs('cards') +
      (decks.length ? '<p class="muted">' + (totalDue ? 'Сегодня к повторению: <b>' + totalDue + '</b> ' + U.plural(totalDue, ['карточка', 'карточки', 'карточек']) : 'На сегодня всё повторено') + '</p>' : '') +
      '<div class="deck-grid">' + (decks.length ? decks.map((d) => {
        const c = counts(d);
        const pct = c.all ? Math.round(c.learned / c.all * 100) : 0;
        return '<article class="card deck">' +
          '<div class="deck-head"><h2>' + U.esc(d.name) + '</h2><span class="tag">' + U.esc(langName(d.lang)) + '</span></div>' +
          '<div class="deck-nums"><span><b>' + c.all + '</b> всего</span><span><b class="c-due">' + c.due + '</b> повторить</span><span><b class="c-new">' + c.fresh + '</b> новых</span></div>' +
          '<div class="progress" title="Выучено (интервал от 21 дня): ' + c.learned + '"><span style="width:' + pct + '%"></span></div>' +
          '<div class="muted small">выучено ' + pct + '%</div>' +
          '<div class="deck-actions">' +
            '<button class="btn primary" data-c="study" data-id="' + d.id + '"' + (c.toStudy ? '' : ' disabled') + '>' + (c.toStudy ? 'Учить (' + c.toStudy + ')' : 'Всё повторено') + '</button>' +
            '<button class="btn" data-c="open" data-id="' + d.id + '">Карточки</button>' +
          '</div></article>';
      }).join('') :
        '<div class="card empty-state"><p>Колод пока нет.</p><p class="muted">Создай свою или начни с примера — 15 английских слов.</p>' +
        '<div class="row-btns"><button class="btn primary" data-c="new-deck">Создать колоду</button><button class="btn" data-c="sample">Добавить пример</button></div></div>') +
      '</div>' +
      '<details class="card help"><summary>Как работает интервальное повторение?</summary>' +
      '<p>После ответа выбирай, насколько легко вспомнилось слово. «Не помню» — карточка вернётся через минуту. ' +
      '«Трудно», «Хорошо», «Легко» — она появится через 1, 3, 7, 20… дней: каждый раз интервал растёт. ' +
      'Так ты тратишь время на трудные слова, а не на уже выученные. Новых карточек в день: ' + S().settings.newCardsPerDay + ' (меняется в настройках).</p></details>';
  }

  function renderDeck(el, d) {
    const c = counts(d);
    el.innerHTML =
      '<header class="page-head"><div><button class="link-btn" data-c="back">‹ Все колоды</button><h1>' + U.esc(d.name) + '</h1>' +
      '<p class="muted">' + U.esc(langName(d.lang)) + ' · ' + c.all + ' ' + U.plural(c.all, ['карточка', 'карточки', 'карточек']) + ' · выучено ' + c.learned + '</p></div>' +
      '<div class="row-btns"><button class="btn" data-c="edit-deck" data-id="' + d.id + '">Настройки колоды</button>' +
      '<button class="btn primary" data-c="study" data-id="' + d.id + '"' + (c.toStudy ? '' : ' disabled') + '>Учить (' + c.toStudy + ')</button></div></header>' +

      '<section class="card"><h2>Добавить карточку</h2>' +
      '<form class="add-card" id="add-card">' +
        '<input name="front" placeholder="Слово (например, journey)" required maxlength="200" aria-label="Слово">' +
        '<input name="back" placeholder="Перевод (путешествие)" required maxlength="300" aria-label="Перевод">' +
        '<input name="note" placeholder="Пример или заметка (необязательно)" maxlength="300" aria-label="Пример">' +
        '<button class="btn primary">Добавить</button>' +
      '</form>' +
      '<details class="bulk"><summary>Добавить много сразу</summary>' +
        '<form id="bulk-add"><p class="muted small">Одна строка — одна карточка. Слово и перевод раздели дефисом, тире, «;» или табуляцией (можно вставить из Excel/Google Таблиц).</p>' +
        '<textarea name="text" rows="6" placeholder="apple - яблоко&#10;journey — путешествие&#10;to borrow; одалживать"></textarea>' +
        '<button class="btn">Добавить все</button></form></details>' +
      '</section>' +

      '<section class="card"><div class="card-head"><h2>Карточки</h2>' +
        (d.cards.length > 8 ? '<input class="search" id="card-search" placeholder="Поиск…" aria-label="Поиск по карточкам">' : '') + '</div>' +
      (d.cards.length ? '<ul class="card-list" id="card-list">' + d.cards.slice().reverse().map((cd) =>
        '<li data-q="' + U.esc((cd.front + ' ' + cd.back).toLowerCase()) + '">' +
        '<div class="cl-text"><b>' + U.esc(cd.front) + '</b><span>' + U.esc(cd.back) + '</span>' + (cd.note ? '<small class="muted">' + U.esc(cd.note) + '</small>' : '') + '</div>' +
        '<span class="tag ' + (isNew(cd) ? 'new' : isLearned(cd) ? 'ok' : '') + '">' + nextLabel(cd) + '</span>' +
        (d.lang ? '<button class="icon-btn small" data-c="speak" data-text="' + U.esc(cd.front) + '" aria-label="Произнести">' + I('volume') + '</button>' : '') +
        '<button class="icon-btn small" data-c="edit-card" data-id="' + cd.id + '" aria-label="Изменить">' + I('pencil') + '</button></li>'
      ).join('') + '</ul>' : '<p class="empty">Добавь первые слова выше.</p>') +
      '</section>';

    const search = el.querySelector('#card-search');
    if (search) search.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      el.querySelectorAll('#card-list li').forEach((li) => { li.hidden = q && !li.dataset.q.includes(q); });
    });
  }

  function startStudy(id) {
    const d = deck(id);
    if (!d) return;
    const due = d.cards.filter(isDue).sort((a, b) => a.due - b.due);
    const fresh = d.cards.filter(isNew).slice(0, newLeft(d));
    // Новые карточки перемешиваем с повторением
    const queue = due.slice();
    fresh.forEach((c, i) => queue.splice(Math.min(queue.length, i * 3 + 2), 0, c));
    if (!queue.length) { U.toast('На сегодня всё повторено'); return; }
    study = { deckId: id, queue: queue.map((c) => c.id), done: 0, flipped: false, again: 0, total: queue.length, reverse: false };
    screen = { name: 'study' };
    pickSide();
    App.render();
  }

  function pickSide() {
    const d = deck(study.deckId);
    study.reverse = d.direction === 'bf' ? true : d.direction === 'mix' ? Math.random() < 0.5 : false;
  }

  function renderStudy(el) {
    const d = deck(study.deckId);
    const id = study.queue[0];
    const card = d && d.cards.find((c) => c.id === id);
    if (!card) {
      el.innerHTML =
        '<div class="study-done card"><div class="big-emoji">' + I('trophy') + '</div><h1>Готово!</h1>' +
        '<p>Повторено карточек: <b>' + study.done + '</b>' + (study.again ? ', ошибок: ' + study.again : '') + '.</p>' +
        '<p class="muted">Следующие карточки появятся, когда подойдёт их время.</p>' +
        '<div class="row-btns"><button class="btn primary" data-c="back">К колодам</button></div></div>';
      return;
    }
    const front = study.reverse ? card.back : card.front;
    const back = study.reverse ? card.front : card.back;
    const left = study.queue.length;
    el.innerHTML =
      '<div class="study">' +
      '<div class="study-top"><button class="link-btn" data-c="back">' + I('x') + ' Закончить</button>' +
      '<span class="muted">' + U.esc(d.name) + '</span><span class="muted">осталось ' + left + '</span></div>' +
      '<div class="progress"><span style="width:' + (study.done / (study.done + left) * 100) + '%"></span></div>' +
      '<div class="flash' + (study.flipped ? ' flipped' : '') + '" data-c="flip">' +
        (isNew(card) ? '<span class="tag new">новая</span>' : '') +
        '<div class="flash-front">' + U.esc(front) +
          (d.lang && !study.reverse ? ' <button class="icon-btn small" data-c="speak" data-text="' + U.esc(card.front) + '" aria-label="Произнести">' + I('volume') + '</button>' : '') + '</div>' +
        (study.flipped ? '<div class="flash-back">' + U.esc(back) +
          (d.lang && study.reverse ? ' <button class="icon-btn small" data-c="speak" data-text="' + U.esc(card.front) + '" aria-label="Произнести">' + I('volume') + '</button>' : '') + '</div>' +
          (card.note ? '<div class="flash-note muted">' + U.esc(card.note) + '</div>' : '') : '<div class="flash-hint muted">нажми или <kbd>Пробел</kbd>, чтобы увидеть ответ</div>') +
      '</div>' +
      (study.flipped ?
        '<div class="grades">' +
          [[0, 'Не помню', 'again'], [1, 'Трудно', 'hard'], [2, 'Хорошо', 'good'], [3, 'Легко', 'easy']].map(([g, n, cls]) =>
            '<button class="grade ' + cls + '" data-c="grade" data-g="' + g + '"><b>' + n + '</b><small>' + preview(card, g) + ' · ' + (g + 1) + '</small></button>').join('') +
        '</div>' :
        '<div class="grades"><button class="btn primary big wide" data-c="flip">Показать ответ</button></div>') +
      '</div>';
  }

  function answer(g) {
    const d = deck(study.deckId);
    const id = study.queue.shift();
    const card = d.cards.find((c) => c.id === id);
    if (!card) return;
    if (isNew(card)) {
      const today = U.dayKey(Date.now());
      if (!d.newLog || d.newLog.day !== today) d.newLog = { day: today, n: 0 };
      d.newLog.n++;
    }
    grade(card, g);
    if (g === 0) {
      study.again++;
      study.queue.splice(Math.min(study.queue.length, 3), 0, id); // вернётся через пару карточек
    } else {
      study.done++;
    }
    study.flipped = false;
    pickSide();
    Store.save();
    App.render();
  }

  // ---------- Окна ----------

  function deckModal(d) {
    const isNew = !d;
    d = d || { name: '', lang: 'en-US', direction: 'fb' };
    App.modal({
      title: isNew ? 'Новая колода' : 'Настройки колоды',
      body:
        '<label>Название<input name="name" required maxlength="60" value="' + U.esc(d.name) + '" placeholder="например, Английский: путешествия"></label>' +
        '<label>Язык (для озвучки)<select name="lang">' + LANGS.map(([c, n]) => '<option value="' + c + '"' + (c === d.lang ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></label>' +
        '<label>Что показывать первым<select name="direction">' +
          [['fb', 'Слово → перевод'], ['bf', 'Перевод → слово'], ['mix', 'Вперемешку']].map(([v, n]) => '<option value="' + v + '"' + (v === d.direction ? ' selected' : '') + '>' + n + '</option>').join('') +
        '</select></label>',
      extra: isNew ? '' : '<button type="button" class="btn ghost danger-text" data-x="del">Удалить колоду</button>',
      onOpen(form, close) {
        const del = form.querySelector('[data-x=del]');
        if (del) del.addEventListener('click', async () => {
          close();
          if (await App.confirm('Удалить колоду «' + d.name + '» и все её карточки (' + d.cards.length + ')?')) {
            S().decks = S().decks.filter((x) => x.id !== d.id);
            screen = { name: 'list' };
            Store.save(); App.render();
          }
        });
      },
      onSubmit(data) {
        if (isNew) { d = { id: U.uid(), cards: [], created: Date.now() }; S().decks.push(d); }
        d.name = data.name; d.lang = data.lang; d.direction = data.direction;
        Store.save();
        if (isNew) screen = { name: 'deck', id: d.id };
        App.render();
      },
    });
  }

  function cardModal(d, c) {
    App.modal({
      title: 'Карточка',
      body:
        '<label>Слово<input name="front" required maxlength="200" value="' + U.esc(c.front) + '"></label>' +
        '<label>Перевод<input name="back" required maxlength="300" value="' + U.esc(c.back) + '"></label>' +
        '<label>Пример или заметка<input name="note" maxlength="300" value="' + U.esc(c.note || '') + '"></label>',
      extra: '<button type="button" class="btn ghost danger-text" data-x="del">Удалить</button><button type="button" class="btn ghost" data-x="reset">Учить заново</button>',
      onOpen(form, close) {
        form.querySelector('[data-x=del]').addEventListener('click', () => {
          d.cards = d.cards.filter((x) => x.id !== c.id); Store.save(); close(); App.render();
        });
        form.querySelector('[data-x=reset]').addEventListener('click', () => {
          ['reps', 'lapses', 'seenAt', 'interval', 'due', 'ease'].forEach((k) => delete c[k]);
          Store.save(); close(); App.render(); U.toast('Карточка снова новая');
        });
      },
      onSubmit(data) {
        c.front = data.front; c.back = data.back; c.note = data.note;
        Store.save(); App.render();
      },
    });
  }

  // ---------- Генерация колоды нейросетью ----------

  const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
  App.LEVELS = LEVELS;

  function genDeckModal() {
    if (!AI.ready() && !AI._mock) { U.toast('Подключи нейросеть: Настройки → «Нейросеть»'); location.hash = '#/settings'; return; }
    const prof = S().lessons;
    App.modal({
      title: 'Сгенерировать колоду',
      body:
        '<label>Тема<input name="topic" required maxlength="120" placeholder="например, путешествия, собеседование, эмоции, IT"></label>' +
        '<div class="row"><label>Язык<select name="lang">' + LANGS.filter((l) => l[0] && l[0] !== 'ru-RU').map(([c, n]) => '<option value="' + c + '"' + (c === (prof.lang || 'en-US') ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></label>' +
        '<label>Уровень<select name="level">' + LEVELS.map((l) => '<option' + (l === (prof.level || 'A2') ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></label></div>' +
        '<label>Сколько слов<select name="count"><option>10</option><option selected>15</option><option>25</option></select></label>' +
        '<label class="check"><input type="checkbox" name="phrases"> Добавить полезные фразы, а не только слова</label>',
      submit: 'Сгенерировать',
      onSubmit(d) {
        const existing = new Set(S().decks.flatMap((x) => x.cards.map((c) => c.front.toLowerCase())));
        U.toast('Генерирую колоду… это займёт 5–20 секунд');
        AI.ask({
          json: true, temperature: 0.8,
          system: 'Ты — методист по иностранным языкам. Составляешь карточки для русскоязычной студентки.',
          prompt: 'Составь ' + d.count + ' карточек. Язык: ' + langName(d.lang) + ', уровень ' + d.level + ', тема: «' + d.topic + '».' +
            (d.phrases ? ' Примерно треть — полезные фразы и выражения.' : '') +
            ' Выбирай частотные, полезные слова этого уровня. Для английских глаголов пиши с "to".' +
            ' Верни JSON: {"deck_name": "короткое название колоды по-русски", "cards": [{"front": "слово на изучаемом языке", "back": "перевод на русский (1-3 варианта через запятую)", "example": "короткий пример на изучаемом языке"}]}',
        }).then((r) => {
          const cards = (r && Array.isArray(r.cards) ? r.cards : []).filter((c) => c && c.front && c.back);
          if (!cards.length) { U.toast('Нейросеть не прислала карточки. Попробуй ещё раз.'); return; }
          previewModal(r.deck_name || d.topic, d.lang, cards, existing);
        }).catch((e) => U.toast(e.message));
      },
    });
  }

  function previewModal(name, lang, cards, existing) {
    App.modal({
      title: 'Проверь карточки',
      body:
        '<label>Название колоды<input name="name" value="' + U.esc(name) + '" maxlength="60" required></label>' +
        '<p class="muted small">Сними галочки со слов, которые не нужны или уже знаешь.</p>' +
        '<ul class="gen-list">' + cards.map((c, i) => {
          const dup = existing.has(String(c.front).toLowerCase());
          return '<li><label class="check"><input type="checkbox" name="c' + i + '"' + (dup ? '' : ' checked') + '>' +
            '<span><b>' + U.esc(c.front) + '</b> — ' + U.esc(c.back) + (dup ? ' <span class="tag">уже есть</span>' : '') +
            (c.example ? '<br><small class="muted">' + U.esc(c.example) + '</small>' : '') + '</span></label></li>';
        }).join('') + '</ul>',
      submit: 'Создать колоду',
      onSubmit(d, form) {
        const chosen = cards.filter((c, i) => form.querySelector('[name=c' + i + ']').checked);
        if (!chosen.length) { U.toast('Выбери хотя бы одно слово'); return false; }
        const deck = { id: U.uid(), name: d.name || name, lang, direction: 'fb', created: Date.now(),
          cards: chosen.map((c) => ({ id: U.uid(), front: String(c.front).trim(), back: String(c.back).trim(), note: String(c.example || '').trim(), created: Date.now() })) };
        S().decks.push(deck);
        Store.save();
        screen = { name: 'deck', id: deck.id };
        App.render();
        U.toast('Колода готова: ' + chosen.length + ' ' + U.plural(chosen.length, ['карточка', 'карточки', 'карточек']));
      },
    });
  }

  function addSample() {
    const words = [
      ['journey', 'путешествие, поездка', 'Life is a journey.'], ['to borrow', 'брать взаймы', 'Can I borrow your pen?'],
      ['reliable', 'надёжный', 'She is a reliable friend.'], ['to achieve', 'достигать', 'You can achieve your goals.'],
      ['curious', 'любопытный', 'Cats are curious animals.'], ['to improve', 'улучшать', 'I want to improve my English.'],
      ['schedule', 'расписание', 'My schedule is busy today.'], ['to suggest', 'предлагать', 'I suggest we take a break.'],
      ['enough', 'достаточно', 'Is that enough time?'], ['to avoid', 'избегать', 'Try to avoid stress.'],
      ['although', 'хотя', 'Although it rained, we went out.'], ['opportunity', 'возможность', 'It is a great opportunity.'],
      ['to remind', 'напоминать', 'Remind me to call her.'], ['grateful', 'благодарный', 'I am grateful for your help.'],
      ['to rely on', 'полагаться на', 'You can rely on me.'],
    ];
    const d = { id: U.uid(), name: 'Английский: полезные слова', lang: 'en-US', direction: 'fb', created: Date.now(),
      cards: words.map(([f, b, n]) => ({ id: U.uid(), front: f, back: b, note: n, created: Date.now() })) };
    S().decks.push(d);
    Store.save();
    App.render();
    U.toast('Добавлена колода из ' + words.length + ' слов');
  }

  // ---------- События ----------

  document.addEventListener('click', (e) => {
    if (!root || !root.contains(e.target)) return;
    const b = e.target.closest('[data-c]');
    if (!b) return;
    const id = b.dataset.id;
    switch (b.dataset.c) {
      case 'new-deck': deckModal(); break;
      case 'gen-deck': genDeckModal(); break;
      case 'sample': addSample(); break;
      case 'open': screen = { name: 'deck', id }; App.render(); break;
      case 'back': screen = study && screen.name === 'study' ? { name: 'deck', id: study.deckId } : { name: 'list' }; if (screen.name === 'deck' && b.closest('.study-done')) screen = { name: 'list' }; study = null; App.render(); break;
      case 'edit-deck': deckModal(deck(id)); break;
      case 'study': startStudy(id); break;
      case 'speak': {
        e.stopPropagation();
        const dd = screen.name === 'study' ? deck(study.deckId) : deck(screen.id);
        speak(b.dataset.text, dd && dd.lang);
        break;
      }
      case 'edit-card': { const d = deck(screen.id); const c = d && d.cards.find((x) => x.id === id); if (c) cardModal(d, c); break; }
      case 'flip': if (study && !study.flipped) { study.flipped = true; App.render(); } break;
      case 'grade': answer(Number(b.dataset.g)); break;
    }
  });

  document.addEventListener('submit', (e) => {
    if (!root || !root.contains(e.target)) return;
    const d = deck(screen.id);
    if (!d) return;
    if (e.target.id === 'add-card') {
      e.preventDefault();
      const f = U.formData(e.target);
      if (!f.front || !f.back) return;
      d.cards.push({ id: U.uid(), front: f.front, back: f.back, note: f.note, created: Date.now() });
      Store.save(); App.render();
      const inp = root.querySelector('#add-card input[name=front]');
      if (inp) inp.focus();
    }
    if (e.target.id === 'bulk-add') {
      e.preventDefault();
      const lines = String(new FormData(e.target).get('text') || '').split(/\r?\n/);
      let n = 0, bad = 0;
      lines.forEach((line) => {
        line = line.trim();
        if (!line) return;
        const m = line.split(/\t|\s+[-–—]\s+|\s*;\s*|\s*[–—]\s*/);
        if (m.length >= 2 && m[0].trim() && m[1].trim()) {
          d.cards.push({ id: U.uid(), front: m[0].trim(), back: m[1].trim(), note: (m[2] || '').trim(), created: Date.now() });
          n++;
        } else bad++;
      });
      Store.save(); App.render();
      U.toast('Добавлено карточек: ' + n + (bad ? '. Не поняла строк: ' + bad : ''));
    }
  });

  App.views.cards = {
    render,
    leave() { root = null; if ('speechSynthesis' in window) speechSynthesis.cancel(); },
    key(e) {
      if (screen.name !== 'study' || !study) return;
      if (e.key === ' ' || e.key === 'Enter') {
        if (!study.flipped && study.queue.length) { study.flipped = true; App.render(); return true; }
      }
      if (study.flipped && ['1', '2', '3', '4'].includes(e.key)) { answer(Number(e.key) - 1); return true; }
    },
  };
})();
