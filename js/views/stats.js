// Раздел «Статистика»: день / неделя / месяц, графики, серия, календарь активности.
(function () {
  'use strict';

  const App = window.App = window.App || {};
  App.views = App.views || {};

  let period = 'week';
  let offset = 0; // 0 = текущий период, -1 = предыдущий и т.д.
  let root = null;

  function range() {
    const now = Date.now();
    if (period === 'day') {
      const from = U.addDays(U.startOfDay(now), offset);
      return { from, to: U.addDays(from, 1), title: offset === 0 ? 'Сегодня' : offset === -1 ? 'Вчера' : U.weekday(from) + ', ' + U.dateLabel(from) };
    }
    if (period === 'week') {
      const from = U.addDays(U.startOfWeek(now), offset * 7);
      const to = U.addDays(from, 7);
      return { from, to, title: offset === 0 ? 'Эта неделя' : U.dateLabel(from) + ' – ' + U.dateLabel(U.addDays(to, -1)) };
    }
    const from = U.addMonths(U.startOfMonth(now), offset);
    const d = new Date(from);
    return { from, to: U.addMonths(from, 1), title: U.MONTHS_NOM[d.getMonth()] + ' ' + d.getFullYear() };
  }

  function chartItems(r, list) {
    const goal = Stats.goalSec();
    if (period === 'day') {
      // По часам
      const hours = new Array(24).fill(0);
      list.forEach((s) => { hours[new Date(s.start).getHours()] += s.sec; });
      return { items: hours.map((v, h) => ({ label: String(h), value: v, title: h + ':00 — ' + U.human(v) })), goal: 0 };
    }
    const byDay = Stats.byDay(list);
    const items = [];
    const todayKey = U.dayKey(Date.now());
    for (let d = r.from; d < r.to; d = U.addDays(d, 1)) {
      const k = U.dayKey(d);
      const v = byDay[k] || 0;
      items.push({
        label: period === 'week' ? U.weekday(d) : String(new Date(d).getDate()),
        value: v,
        color: goal && v >= goal ? 'var(--accent-2)' : 'var(--accent)',
        highlight: k === todayKey,
        title: U.weekday(d) + ', ' + U.dateLabel(d) + ' — ' + U.human(v) + (goal && v >= goal ? ' ✓ цель' : ''),
      });
    }
    return { items, goal };
  }

  function heatmap() {
    const byDay = Stats.byDay();
    const goal = Stats.goalSec() || 3600;
    const weeks = 18;
    const start = U.addDays(U.startOfWeek(Date.now()), -(weeks - 1) * 7);
    const today = U.startOfDay(Date.now());
    let cells = '';
    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < 7; d++) {
        const ts = U.addDays(start, w * 7 + d);
        if (ts > today) { cells += '<span class="hm-cell future"></span>'; continue; }
        const v = byDay[U.dayKey(ts)] || 0;
        const lvl = v <= 0 ? 0 : v < goal * 0.34 ? 1 : v < goal * 0.67 ? 2 : v < goal ? 3 : 4;
        cells += '<span class="hm-cell l' + lvl + '" title="' + U.dateLabel(ts) + ': ' + U.human(v) + '"></span>';
      }
    }
    return '<div class="heatmap-wrap"><div class="hm-days">' + U.WD.map((w, i) => '<span>' + (i % 2 === 0 ? w : '') + '</span>').join('') + '</div>' +
      '<div class="heatmap" style="grid-template-columns:repeat(' + weeks + ', minmax(0, 18px))">' + cells + '</div></div>' +
      '<div class="hm-legend muted small">меньше <span class="hm-cell l0"></span><span class="hm-cell l1"></span><span class="hm-cell l2"></span><span class="hm-cell l3"></span><span class="hm-cell l4"></span> цель</div>';
  }

  function render(el) {
    root = el;
    const r = range();
    const list = Stats.inRange(r.from, r.to);
    const total = Stats.sum(list);
    const days = Math.round((Math.min(r.to, U.addDays(U.startOfDay(Date.now()), 1)) - r.from) / 86400000);
    const byDay = Stats.byDay(list);
    const activeDays = Object.keys(byDay).filter((k) => byDay[k] >= 60).length;
    const goal = Stats.goalSec();
    const goalDays = goal ? Object.keys(byDay).filter((k) => byDay[k] >= goal).length : 0;
    const streak = Stats.streak();
    const tasks = Stats.byTask(list);
    const cats = Stats.byCategory(list);
    const ch = chartItems(r, list);

    // Сравнение с прошлым периодом
    let prevFrom, prevTo;
    if (period === 'day') { prevFrom = U.addDays(r.from, -1); prevTo = r.from; }
    else if (period === 'week') { prevFrom = U.addDays(r.from, -7); prevTo = r.from; }
    else { prevFrom = U.addMonths(r.from, -1); prevTo = r.from; }
    const prev = Stats.sum(Stats.inRange(prevFrom, prevTo));
    const diff = prev ? Math.round((total - prev) / prev * 100) : null;

    el.innerHTML =
      '<header class="page-head"><div><h1>Статистика</h1><p class="muted">Сколько времени ушло на задачи и категории</p></div></header>' +

      '<div class="card stats-bar">' +
        '<div class="seg" role="group" aria-label="Период">' +
          [['day', 'День'], ['week', 'Неделя'], ['month', 'Месяц']].map(([k, n]) => '<button class="' + (period === k ? 'on' : '') + '" data-st="period" data-p="' + k + '">' + n + '</button>').join('') +
        '</div>' +
        '<div class="period-nav">' +
          '<button class="icon-btn" data-st="prev" aria-label="Предыдущий период">‹</button>' +
          '<b>' + U.esc(r.title) + '</b>' +
          '<button class="icon-btn" data-st="next" aria-label="Следующий период"' + (offset >= 0 ? ' disabled' : '') + '>›</button>' +
        '</div>' +
      '</div>' +

      '<div class="kpis">' +
        kpi('Всего', U.human(total), diff === null ? '' : (diff >= 0 ? '▲ ' : '▼ ') + Math.abs(diff) + '% ' + (period === 'day' ? 'к прошлому дню' : period === 'week' ? 'к прошлой неделе' : 'к прошлому месяцу'), diff !== null && diff >= 0 ? 'up' : diff !== null ? 'down' : '') +
        (period === 'day'
          ? kpi('Дневная цель', goal ? Math.min(100, Math.round(total / goal * 100)) + '%' : '—', goal ? 'цель ' + U.human(goal) : 'задай в настройках')
          : kpi('В среднем за день', U.human(total / Math.max(1, days)), activeDays + ' ' + U.plural(activeDays, ['активный день', 'активных дня', 'активных дней']))) +
        (period === 'day'
          ? kpi('Записей', String(list.length), list.filter((s) => s.kind === 'pomo').length + ' 🍅')
          : kpi('Цель выполнена', goalDays + ' из ' + days, U.plural(days, ['день', 'дня', 'дней']))) +
        kpi('Серия', '🔥 ' + streak.current, 'лучшая: ' + streak.best + ' ' + U.plural(streak.best, ['день', 'дня', 'дней'])) +
      '</div>' +

      '<section class="card"><div class="card-head"><h2>' + (period === 'day' ? 'По часам' : 'По дням') + '</h2>' +
        (ch.goal ? '<span class="muted small"><span class="goal-swatch"></span> дневная цель</span>' : '') + '</div>' +
        Charts.bars(ch.items, { goal: ch.goal, label: 'Время по ' + (period === 'day' ? 'часам' : 'дням') }) +
      '</section>' +

      '<div class="grid-2">' +
        '<section class="card"><h2>По категориям</h2>' + breakdown(cats, total) + '</section>' +
        '<section class="card"><h2>По задачам</h2>' + breakdown(tasks, total, true) + '</section>' +
      '</div>' +

      '<section class="card assistant"><div class="card-head"><h2>💡 Помощник: обзор последних 7 дней</h2></div>' + App.renderInsights(App.insightsWeek()) + '</section>' +

      '<section class="card"><div class="card-head"><h2>Календарь активности</h2><span class="muted small">последние 18 недель</span></div>' + heatmap() + '</section>';
  }

  function kpi(label, value, sub, cls) {
    return '<div class="kpi card"><span class="kpi-label">' + label + '</span><span class="kpi-value">' + value + '</span><span class="kpi-sub ' + (cls || '') + '">' + U.esc(sub || '') + '</span></div>';
  }

  function breakdown(rows, total, showCat) {
    if (!rows.length) return '<p class="empty">За этот период пока пусто.</p>';
    const max = rows[0].sec;
    return '<ul class="breakdown">' + rows.map((r) =>
      '<li><div class="bd-top"><span><i style="background:' + r.color + '"></i>' + U.esc(r.name) +
      (showCat ? ' <small class="muted">' + U.esc(r.cat) + '</small>' : '') + '</span>' +
      '<b>' + U.human(r.sec) + ' <small class="muted">' + Math.round(r.sec / (total || 1) * 100) + '%</small></b></div>' +
      '<div class="bd-bar"><span style="width:' + (r.sec / max * 100) + '%;background:' + r.color + '"></span></div></li>'
    ).join('') + '</ul>';
  }

  document.addEventListener('click', (e) => {
    if (!root || !root.contains(e.target)) return;
    const b = e.target.closest('[data-st]');
    if (!b) return;
    if (b.dataset.st === 'period') { period = b.dataset.p; offset = 0; }
    if (b.dataset.st === 'prev') offset--;
    if (b.dataset.st === 'next' && offset < 0) offset++;
    App.render();
  });

  let ticks = 0;
  App.views.stats = {
    render,
    leave() { root = null; },
    tick() { if (Store.state.active && ++ticks % 30 === 0) App.render(); },
    key(e) {
      if (e.key === 'ArrowLeft') { offset--; App.render(); return true; }
      if (e.key === 'ArrowRight' && offset < 0) { offset++; App.render(); return true; }
    },
  };
})();
