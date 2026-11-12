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
  App.md = function (text) {
    return U.esc(text).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>').replace(/\n/g, '<br>');
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
    el.innerHTML =
      '<header class="page-head"><div><h1>Языки</h1><p class="muted">Справочник грамматики: коротко, с примерами и тренировкой</p></div></header>' + App.langTabs('theory') +
      (level ? '<p class="muted">Твой уровень: <b>' + level + '</b>. Начни с тем своего уровня и тех, где были ошибки в тесте.</p>' :
        '<p class="muted">Не знаешь свой уровень? Пройди <a href="#/lessons">тест на уровень</a> — он подскажет, какие темы подтянуть.</p>') +
      (S().lessons.weakTopics && S().lessons.weakTopics.length ? '<section class="card weak-topics"><h2 class="h-ic">' + I('target') + ' Подтянуть по результатам теста</h2><div class="topic-chips">' +
        S().lessons.weakTopics.map((id) => topic(id)).filter(Boolean).map((t) => '<a class="chip" href="#/theory/' + t.id + '">' + U.esc(t.title) + '</a>').join('') + '</div></section>' : '') +
      groups.map((lv) => {
        const list = (window.GRAMMAR || []).filter((t) => t.level === lv);
        return '<section class="card"><div class="card-head"><h2><span class="lvl-badge">' + lv + '</span> ' + LEVEL_TXT[lv] + '</h2>' +
          '<span class="muted small">' + list.filter((t) => d[t.id]).length + ' из ' + list.length + ' потренировано</span></div>' +
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
  });

  App.views.theory = { render, group: 'cards', leave() { root = null; } };
})();
