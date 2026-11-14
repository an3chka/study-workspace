// Подсчёты для статистики: суммы по дням, задачам, категориям, серия дней.
(function () {
  'use strict';

  const App = window.App = window.App || {};
  const Stats = {};

  // Все записи + «живая» запись от запущенного таймера (чтобы прогресс рос на глазах).
  Stats.sessions = function () {
    const st = Store.state;
    const list = st.sessions.slice();
    const a = st.active;
    if (a && !a.waiting && (a.mode === 'watch' || a.phase === 'work')) {
      const sec = (Date.now() - a.start) / 1000;
      if (sec > 0) list.push({ id: 'live', taskId: a.taskId, start: a.start, end: Date.now(), sec, live: true });
    }
    return list;
  };

  Stats.inRange = function (from, to, list) {
    return (list || Stats.sessions()).filter((s) => s.start >= from && s.start < to);
  };

  Stats.sum = (list) => list.reduce((a, s) => a + s.sec, 0);

  // Цель задачи: t.goalMin минут в день (goalPeriod: 'day') или в неделю ('week').
  // Возвращает, сколько уже сделано в этот день/неделю и сколько осталось.
  Stats.taskGoal = function (t) {
    if (!t || !t.goalMin) return null;
    const week = t.goalPeriod === 'week';
    const from = week ? U.startOfWeek(Date.now()) : U.startOfDay(Date.now());
    const done = Stats.sum(Stats.inRange(from, U.addDays(from, week ? 7 : 1)).filter((s) => s.taskId === t.id));
    const goal = t.goalMin * 60;
    return { week, goal, done, left: Math.max(0, goal - done), frac: Math.min(1, done / goal), per: week ? 'в неделю' : 'в день', when: week ? 'на этой неделе' : 'сегодня' };
  };

  // Карточка «Цели по времени»: задачи с целью, прогресс и кнопка таймера
  App.goalRowsHTML = function (opts) {
    opts = opts || {};
    const st = Store.state;
    const tasks = st.tasks.filter((t) => !t.archived && t.goalMin);
    if (!tasks.length) return '';
    const day = tasks.filter((t) => t.goalPeriod !== 'week'), week = tasks.filter((t) => t.goalPeriod === 'week');
    const row = (t) => {
      const g = Stats.taskGoal(t);
      const c = Store.category(t.categoryId);
      const running = st.active && st.active.taskId === t.id;
      return '<li class="goal-row' + (g.left === 0 ? ' done' : '') + '" style="--c:' + c.color + '">' +
        '<button class="play small-play" data-goal="' + (running ? 'stop' : 'start') + '" data-id="' + t.id + '" aria-label="' + (running ? 'Остановить' : 'Запустить таймер') + ' ' + U.esc(t.name) + '">' + I(running ? 'stop' : 'play') + '</button>' +
        '<div class="goal-main"><div class="goal-top"><b>' + U.esc(t.name) + '</b><span class="muted small">' +
          (g.left === 0 ? I('check') + ' цель выполнена' : 'осталось ' + U.human(g.left)) + '</span></div>' +
          '<div class="mini-bar"><span style="width:' + Math.round(g.frac * 100) + '%;background:' + c.color + '"></span></div>' +
          '<span class="muted small">' + U.human(g.done) + ' из ' + U.human(g.goal) + ' ' + g.when + '</span></div></li>';
    };
    return (day.length ? (opts.titles ? '<h3 class="goal-h">На день</h3>' : '') + '<ul class="goal-list">' + day.map(row).join('') + '</ul>' : '') +
      (week.length ? '<h3 class="goal-h">На неделю</h3><ul class="goal-list">' + week.map(row).join('') + '</ul>' : '');
  };

  // Кнопка таймера у цели (на главной и в «Плане»)
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-goal]');
    if (!b) return;
    if (b.dataset.goal === 'stop') { Timer.stop(); return; }
    Store.state.settings.lastTask = b.dataset.id;
    Timer.start(b.dataset.id, Store.state.settings.lastMode || 'watch');
  });

  Stats.byDay = function (list) {
    const m = {};
    (list || Stats.sessions()).forEach((s) => { const k = U.dayKey(s.start); m[k] = (m[k] || 0) + s.sec; });
    return m;
  };

  Stats.byTask = function (list) {
    const m = {};
    list.forEach((s) => { m[s.taskId] = (m[s.taskId] || 0) + s.sec; });
    return Object.keys(m).map((id) => {
      const t = Store.task(id);
      const c = Store.category(t && t.categoryId);
      return { id, name: t ? t.name : 'Удалённая задача', color: c.color, cat: c.name, sec: m[id] };
    }).sort((a, b) => b.sec - a.sec);
  };

  Stats.byCategory = function (list) {
    const m = {};
    list.forEach((s) => {
      const t = Store.task(s.taskId);
      const cid = t ? t.categoryId : 'none';
      m[cid] = (m[cid] || 0) + s.sec;
    });
    return Object.keys(m).map((id) => {
      const c = Store.category(id);
      return { id, name: c.name, color: c.color, sec: m[id] };
    }).sort((a, b) => b.sec - a.sec);
  };

  Stats.goalSec = () => Math.max(0, Store.state.settings.dailyGoalMin) * 60;

  // День «засчитан», если набрана дневная цель (или хоть что-то, если цель = 0).
  function dayOk(sec, goal) { return goal > 0 ? sec >= goal : sec >= 60; }

  Stats.streak = function () {
    const byDay = Stats.byDay();
    const goal = Stats.goalSec();
    const today = U.startOfDay(Date.now());
    let cur = 0;
    let d = today;
    // Сегодняшний день не обрывает серию, если цель ещё не набрана.
    if (!dayOk(byDay[U.dayKey(d)] || 0, goal)) d = U.addDays(d, -1);
    while (dayOk(byDay[U.dayKey(d)] || 0, goal)) { cur++; d = U.addDays(d, -1); }

    // Лучшая серия за всё время
    const keys = Object.keys(byDay).filter((k) => dayOk(byDay[k], goal)).sort();
    let best = 0, run = 0, prev = null;
    keys.forEach((k) => {
      const ts = new Date(k + 'T12:00:00').getTime();
      run = prev !== null && U.dayKey(U.addDays(prev, 1)) === k ? run + 1 : 1;
      best = Math.max(best, run);
      prev = ts;
    });
    const todayDone = dayOk(byDay[U.dayKey(today)] || 0, goal);
    return { current: cur, best: Math.max(best, cur), todayDone };
  };

  window.Stats = Stats;
})();
