// Раздел «Календарь»: месяц целиком — время, план, настроение и задания по каждому дню.
(function () {
  'use strict';

  const App = window.App = window.App || {};
  App.views = App.views || {};

  let root = null;
  let monthOffset = 0;
  let selected = U.dayKey(Date.now());

  function S() { return Store.state; }
  const FACES = ['', 'face1', 'face2', 'face3', 'face4', 'face5'];

  function render(el) {
    root = el;
    const first = U.addMonths(U.startOfMonth(Date.now()), monthOffset);
    const d0 = new Date(first);
    const start = U.startOfWeek(first);
    const nextMonth = U.addMonths(first, 1);
    const byDay = Stats.byDay();
    const goal = Stats.goalSec() || 3600;
    const today = U.dayKey(Date.now());
    let cells = '';
    for (let ts = start; ts < nextMonth || new Date(ts).getDay() !== 1; ts = U.addDays(ts, 1)) {
      const k = U.dayKey(ts);
      const inMonth = new Date(ts).getMonth() === d0.getMonth();
      const sec = byDay[k] || 0;
      const plan = S().plan.filter((b) => b.day === k);
      const moods = S().mood.filter((m) => m.day === k);
      const avg = moods.length ? Math.round(moods.reduce((a, m) => a + m.mood, 0) / moods.length) : 0;
      const lvl = sec <= 0 ? 0 : sec < goal * 0.34 ? 1 : sec < goal * 0.67 ? 2 : sec < goal ? 3 : 4;
      cells += '<button class="cal-cell l' + lvl + (inMonth ? '' : ' out') + (k === today ? ' today' : '') + (k === selected ? ' sel' : '') + '" data-cal="day" data-k="' + k + '">' +
        '<span class="cal-num">' + new Date(ts).getDate() + '</span>' +
        (sec ? '<span class="cal-time">' + U.human(sec).replace(' мин', 'м').replace(' ч', 'ч') + '</span>' : '') +
        '<span class="cal-icons">' + (avg ? '<span class="cal-mood">' + I(FACES[avg]) + '</span>' : '') +
        (plan.length ? '<span class="cal-plan' + (plan.every((b) => b.done) ? ' all' : '') + '">' + plan.filter((b) => b.done).length + '/' + plan.length + '</span>' : '') + '</span>' +
        '</button>';
    }
    el.innerHTML =
      '<header class="page-head"><div><h1>Календарь</h1><p class="muted">Время, план и настроение по дням — нажми на день, чтобы увидеть подробности</p></div></header>' +
      '<div class="cal-layout">' +
        '<section class="card cal-card">' +
          '<div class="card-head"><div class="period-nav"><button class="icon-btn" data-cal="prev" aria-label="Предыдущий месяц">' + I('chevron-left') + '</button>' +
          '<b>' + U.MONTHS_NOM[d0.getMonth()] + ' ' + d0.getFullYear() + '</b>' +
          '<button class="icon-btn" data-cal="next" aria-label="Следующий месяц">' + I('chevron-right') + '</button></div>' +
          (monthOffset ? '<button class="btn small" data-cal="today">Сегодня</button>' : '') + '</div>' +
          '<div class="cal-grid">' + U.WD.map((w) => '<span class="cal-wd">' + w + '</span>').join('') + cells + '</div>' +
          '<div class="cal-legend muted small"><span class="cal-dot l1"></span><span class="cal-dot l2"></span><span class="cal-dot l3"></span><span class="cal-dot l4"></span> время до цели · ' +
          I('face4') + ' настроение · 2/3 план</div>' +
        '</section>' +
        '<section class="card cal-day">' + dayHTML(selected) + '</section>' +
      '</div>';
  }

  function dayHTML(k) {
    const ts = new Date(k + 'T12:00:00').getTime();
    const from = U.startOfDay(ts);
    const list = Stats.inRange(from, U.addDays(from, 1));
    const tasks = Stats.byTask(list);
    const plan = S().plan.filter((b) => b.day === k).sort((a, b) => a.start.localeCompare(b.start));
    const moods = S().mood.filter((m) => m.day === k).sort((a, b) => a.ts - b.ts);
    const journal = S().journal.filter((j) => U.dayKey(j.ts) === k);
    const refl = (S().reflections || []).filter((r) => r.day === k);
    const quests = S().game && S().game.quests && S().game.quests[k];
    const isFuture = k > U.dayKey(Date.now());
    return '<h2>' + U.weekday(ts) + ', ' + U.dateLabel(ts) + '</h2>' +
      (isFuture ? '<p class="muted">Этот день ещё впереди — можно спланировать его заранее.</p>' :
        '<p class="cal-total"><b>' + U.human(Stats.sum(list)) + '</b> <span class="muted">с таймером</span>' + (quests && quests.done ? ' · заданий дня: ' + quests.done.length + '/3' : '') + '</p>') +
      (tasks.length ? '<ul class="breakdown">' + tasks.map((t) => '<li><div class="bd-top"><span><i style="background:' + t.color + '"></i>' + U.esc(t.name) + '</span><b>' + U.human(t.sec) + '</b></div></li>').join('') + '</ul>' : '') +
      '<h3>План' + (plan.length ? ' (' + plan.filter((b) => b.done).length + '/' + plan.length + ')' : '') + '</h3>' +
      (plan.length ? '<ul class="cal-plan-list">' + plan.map((b) => '<li class="' + (b.done ? 'done' : '') + '">' + (b.done ? I('check') : '<span class="q-dot"></span>') + ' <span class="muted small">' + b.start + '</span> ' + U.esc(b.title) + '</li>').join('') + '</ul>' : '<p class="muted small">Плана не было.</p>') +
      '<button class="btn small" data-cal="plan" data-k="' + k + '">' + I('calendar') + ' ' + (plan.length ? 'Открыть план дня' : 'Спланировать этот день') + '</button>' +
      (moods.length ? '<h3>Самочувствие</h3><ul class="cal-moods">' + moods.map((m) => '<li><span class="mood-emoji">' + I(FACES[m.mood]) + '</span><span class="muted small">' + U.timeLabel(m.ts) + '</span>' +
        '<span class="small">энергия ' + m.energy + ' · стресс ' + m.stress + '</span>' + (m.note ? '<span class="small mood-note">' + U.esc(m.note) + '</span>' : '') + '</li>').join('') + '</ul>' : '') +
      (refl.length ? '<h3>Вопрос дня</h3>' + refl.map((r) => '<p class="small"><b>' + U.esc(r.q) + '</b><br>' + U.esc(r.a) + '</p>').join('') : '') +
      (journal.length ? '<h3>Дневник</h3>' + journal.map((j) => '<p class="small">' + U.esc(j.text).replace(/\n/g, '<br>') + '</p>').join('') : '');
  }

  document.addEventListener('click', (e) => {
    if (!root || !root.contains(e.target)) return;
    const b = e.target.closest('[data-cal]');
    if (!b) return;
    if (b.dataset.cal === 'prev') monthOffset--;
    if (b.dataset.cal === 'next') monthOffset++;
    if (b.dataset.cal === 'today') { monthOffset = 0; selected = U.dayKey(Date.now()); }
    if (b.dataset.cal === 'day') selected = b.dataset.k;
    if (b.dataset.cal === 'plan') { App.openPlanDay(b.dataset.k); return; }
    App.render();
  });

  App.views.calendar = {
    render,
    leave() { root = null; },
    key(e) {
      if (e.key === 'ArrowLeft') { monthOffset--; App.render(); return true; }
      if (e.key === 'ArrowRight') { monthOffset++; App.render(); return true; }
    },
  };
})();
