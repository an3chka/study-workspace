// Раздел «Языки → Теория»: встроенный справочник грамматики с примерами и тренировками.
// Работает без интернета. Нейросеть нужна только для кнопок «Спросить» и «Ещё упражнения».
(function () {
  'use strict';

  const App = window.App = window.App || {};
  App.views = App.views || {};

  const LEVEL_TXT = { A1: 'начальный', A2: 'элементарный', B1: 'средний', B2: 'выше среднего', C1: 'продвинутый' };
  let root = null;

  function S() { return Store.state; }
  function topicId() { return decodeURIComponent((location.hash.split('/')[2] || '')); }
  function topic(id) { return (window.GRAMMAR || []).find((t) => t.id === id); }
  App.grammarTopic = topic;

  // Простая разметка: **жирный** и `код`
  // Формулы LaTeX через KaTeX (если библиотека ещё не загрузилась — показываем исходник)
  App.tex = function (src, display) {
    if (window.katex) {
      try { return katex.renderToString(src, { displayMode: !!display, throwOnError: false, strict: false }); } catch (e) { /* ниже — запасной вариант */ }
    }
    return '<code class="tex-raw">' + U.esc(src) + '</code>';
  };
  function mdText(s) {
    return U.esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/~~(.+?)~~/g, '<s>$1</s>').replace(/`(.+?)`/g, '<code>$1</code>').replace(/\n/g, '<br>');
  }
  // Markdown-лайт: **жирный**, `код`, $формула$ и $$формула$$
  App.md = function (text) {
    return String(text == null ? '' : text).split(/(\$\$[^$]+\$\$|\$[^$\n]+\$)/g).map((p, i) => {
      if (i % 2 === 0) return mdText(p);
      return p.startsWith('$$') ? App.tex(p.slice(2, -2), true) : App.tex(p.slice(1, -1), false);
    }).join('');
  };

  function done() { const p = S().lessons; p.theoryDone = p.theoryDone || {}; return p.theoryDone; }

  function render(el) {
    root = el;
    const t = topic(topicId());
    if (t) return renderTopic(el, t);
    renderList(el);
  }

  function renderList(el) {
    const level = S().lessons.level;
    const d = done();
    const groups = ['A1', 'A2', 'B1', 'B2', 'C1'];
    const lt = S().lessons.levelTests || {};
    el.innerHTML =
      '<header class="page-head"><div><h1>Языки</h1><p class="muted">Справочник грамматики: коротко, с примерами и тренировкой</p></div></header>' + App.langTabs('theory') +
      (level ? '<p class="muted">Твой уровень: <b>' + level + '</b>. Начни с тем своего уровня и тех, где были ошибки в тесте.</p>' :
        '<p class="muted">Не знаешь свой уровень? Пройди <a href="#/lessons">тест на уровень</a> — он подскажет, какие темы подтянуть.</p>') +
      (S().lessons.weakTopics && S().lessons.weakTopics.length ? '<section class="card weak-topics"><h2 class="h-ic">' + I('target') + ' Подтянуть по результатам теста</h2><div class="topic-chips">' +
        S().lessons.weakTopics.map((id) => topic(id)).filter(Boolean).map((t) => '<a class="chip" href="#/theory/' + t.id + '">' + U.esc(t.title) + '</a>').join('') + '</div></section>' : '') +
      groups.map((lv) => {
        const list = (window.GRAMMAR || []).filter((t) => t.level === lv);
        return '<section class="card"><div class="card-head"><h2><span class="lvl-badge">' + lv + '</span> ' + LEVEL_TXT[lv] + '</h2>' +
          '<span class="muted small">' + list.filter((t) => d[t.id]).length + ' из ' + list.length + ' потренировано' +
          (lt[lv] != null ? ' · тест уровня: ' + lt[lv] + '%' : '') + '</span>' +
          '<button class="btn small ai-btn" data-th="level-test" data-lv="' + lv + '">' + I('target') + ' Тест по уровню ' + lv + '</button></div>' +
          '<div class="topic-grid">' + list.map((t) =>
            '<a class="topic-card' + (d[t.id] ? ' done' : '') + '" href="#/theory/' + t.id + '"><b>' + U.esc(t.title) + '</b><small>' + U.esc(t.summary) + '</small>' +
            (d[t.id] ? '<span class="topic-done">' + I('check') + ' ' + d[t.id] + '%</span>' : '') + '</a>').join('') + '</div></section>';
      }).join('');
  }

  function renderTopic(el, t) {
    const d = done()[t.id];
    el.innerHTML =
      '<header class="page-head"><div><a class="link-btn" href="#/theory">' + I('chevron-left') + ' Вся теория</a><h1>' + U.esc(t.title) + '</h1>' +
      '<p class="muted"><span class="lvl-badge">' + t.level + '</span> ' + U.esc(t.summary) + '</p></div></header>' +
      '<div class="theory">' +
        '<section class="card theory-main">' + t.theory.map((p) => '<p>' + App.md(p) + '</p>').join('') +
          (t.formula ? '<div class="formula">' + t.formula.map((f) => '<div>' + App.md(f) + '</div>').join('') + '</div>' : '') +
        '</section>' +
        (t.table ? '<section class="card"><div class="card-head"><h2>Таблица</h2><button class="btn small ai-btn" data-th="table-deck">' + I('cards') + ' Сделать колоду из таблицы</button></div>' +
          '<input class="search" id="table-search" placeholder="Найти глагол…" aria-label="Поиск по таблице">' +
          '<div class="verb-table"><div class="vt-row vt-head"><span>V1</span><span>V2</span><span>V3</span><span>перевод</span></div>' +
          t.table.map((r) => '<div class="vt-row" data-q="' + U.esc(r.join(' ').toLowerCase()) + '"><span><button class="icon-btn small" data-th="speak" data-t="' + U.esc(r[0] + ', ' + r[1] + ', ' + r[2]) + '" aria-label="Произнести">' + I('volume') + '</button><b>' + U.esc(r[0]) + '</b></span><span>' + U.esc(r[1]) + '</span><span>' + U.esc(r[2]) + '</span><span class="muted">' + U.esc(r[3]) + '</span></div>').join('') +
          '</div></section>' : '') +
        '<section class="card"><h2>Примеры</h2><ul class="examples">' + t.examples.map(([en, ru]) =>
          '<li><button class="icon-btn small" data-th="speak" data-t="' + U.esc(en) + '" aria-label="Произнести">' + I('volume') + '</button><div><b>' + U.esc(en) + '</b><span class="muted">' + U.esc(ru) + '</span></div></li>').join('') + '</ul></section>' +
        (t.mistakes && t.mistakes.length ? '<section class="card"><h2>Частые ошибки</h2><ul class="mistake-list">' + t.mistakes.map(([bad, good, why]) =>
          '<li><span class="bad">' + I('x') + ' ' + U.esc(bad) + '</span><span class="good">' + I('check') + ' ' + U.esc(good) + '</span><small class="muted">' + U.esc(why) + '</small></li>').join('') + '</ul></section>' : '') +
        '<section class="card theory-actions"><h2>Потренироваться</h2>' +
          '<div class="row-btns"><button class="btn primary big" data-th="drill">' + I('play') + ' Тренировка (' + t.drill.length + ' задания)</button>' +
          '<button class="btn ai-btn" data-th="ai-lesson">' + I('sparkles') + ' Ещё урок по теме от нейросети</button></div>' +
          (d ? '<p class="muted small">Лучший результат: ' + d + '%</p>' : '') +
        '</section>' +
        App.askBoxHTML('theory-' + t.id, 'Спросить про эту тему', 'Например: «а чем это отличается от Past Simple?»') +
      '</div>';
    const ts = el.querySelector('#table-search');
    if (ts) ts.addEventListener('input', () => { const q = ts.value.trim().toLowerCase(); el.querySelectorAll('.vt-row[data-q]').forEach((r) => { r.hidden = q && !r.dataset.q.includes(q); }); });
    App.bindAskBox(el, 'theory-' + t.id, () => 'Тема грамматики: «' + t.title + '» (уровень ' + t.level + ').\nКраткая теория из справочника:\n' + t.theory.join('\n'));
  }

  document.addEventListener('click', (e) => {
    if (!root || !root.contains(e.target)) return;
    const b = e.target.closest('[data-th]');
    if (!b) return;
    const t = topic(topicId());
    if (b.dataset.th === 'speak') App.speak(b.dataset.t, 'en-US');
    if (b.dataset.th === 'drill' && t) App.startDrill(t);
    if (b.dataset.th === 'ai-lesson' && t) App.startTopicLesson(b, t);
    if (b.dataset.th === 'level-test') levelTest(b.dataset.lv);
    if (b.dataset.th === 'table-deck' && t && t.table) {
      if (S().decks.some((d) => d.setId === 'tbl-' + t.id)) { U.toast('Такая колода уже есть в «Карточках»'); return; }
      S().decks.push({ id: U.uid(), setId: 'tbl-' + t.id, name: t.title.replace(/:.*$/, ''), lang: 'en-US', direction: 'fb', created: Date.now(),
        cards: t.table.map((r) => ({ id: U.uid(), front: r[0], back: r[1] + ' — ' + r[2] + ' (' + r[3] + ')', note: '', created: Date.now() })) });
      Store.save();
      U.toast('Колода готова: ' + t.table.length + ' глаголов — в «Карточках»');
    }
  });

  // Проверочный тест по уровню: случайные задания из всех тем уровня (без нейросети)
  function levelTest(lv) {
    const pool = [];
    (window.GRAMMAR || []).filter((t) => t.level === lv).forEach((t) => t.drill.forEach((x) => pool.push(Object.assign({ topic: t.id }, x))));
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    App.startQuiz('Тест по уровню ' + lv, pool.slice(0, 12), (pct) => {
      const p = S().lessons;
      p.levelTests = p.levelTests || {};
      p.levelTests[lv] = Math.max(p.levelTests[lv] || 0, pct);
      Store.save();
    }, '#/theory');
  }

  App.views.theory = { render, group: 'cards', leave() { root = null; } };
})();
