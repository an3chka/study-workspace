// Раздел «План»: расписание на день — блоки времени с отметкой «сделано».
// Блок можно привязать к задаче — тогда его можно запустить таймером,
// а в итогах видно, сколько времени реально ушло.
(function () {
  'use strict';

  const App = window.App = window.App || {};
  App.views = App.views || {};

  let root = null;
  let dayOffset = 0;

  function S() { return Store.state; }
  function dayTs() { return U.addDays(U.startOfDay(Date.now()), dayOffset); }
  function toMin(hhmm) { const [h, m] = String(hhmm || '0:0').split(':').map(Number); return h * 60 + (m || 0); }
  function fromMin(min) { min = Math.max(0, Math.min(24 * 60 - 1, min)); return U.pad(Math.floor(min / 60)) + ':' + U.pad(min % 60); }

  function blocksOf(dayKey) {
    return S().plan.filter((b) => b.day === dayKey).sort((a, b) => toMin(a.start) - toMin(b.start));
  }

  // Сколько реально записано по задаче блока в этот день.
  function trackedFor(block) {
    if (!block.taskId) return 0;
    const from = new Date(block.day + 'T00:00:00').getTime();
    return Stats.sum(Stats.inRange(from, U.addDays(from, 1)).filter((s) => s.taskId === block.taskId));
  }

  App.planSummary = function (dayKey) {
    const list = blocksOf(dayKey || U.dayKey(Date.now()));
    const done = list.filter((b) => b.done).length;
    const plannedMin = list.reduce((a, b) => a + Math.max(0, toMin(b.end) - toMin(b.start)), 0);
    return { total: list.length, done, plannedMin, list };
  };

  function render(el) {
    root = el;
    const d = dayTs();
    const key = U.dayKey(d);
    const list = blocksOf(key);
    const isToday = dayOffset === 0;
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    const sum = App.planSummary(key);
    const pct = sum.total ? Math.round(sum.done / sum.total * 100) : 0;
    const title = dayOffset === 0 ? 'Сегодня' : dayOffset === 1 ? 'Завтра' : dayOffset === -1 ? 'Вчера' : U.weekday(d) + ', ' + U.dateLabel(d);
    const lastEnd = list.length ? list[list.length - 1].end : (isToday ? fromMin(Math.ceil((nowMin + 5) / 15) * 15) : '09:00');

    el.innerHTML =
      '<header class="page-head"><div><h1>План дня</h1><p class="muted">Расписание по времени — отмечай, что сделано</p></div></header>' +

      '<div class="card stats-bar">' +
        '<div class="period-nav"><button class="icon-btn" data-pl="prev" aria-label="Предыдущий день">' + I('chevron-left') + '</button><b>' + U.esc(title) + '</b>' +
        '<button class="icon-btn" data-pl="next" aria-label="Следующий день">' + I('chevron-right') + '</button></div>' +
        (dayOffset !== 0 ? '<button class="btn small" data-pl="today">К сегодняшнему дню</button>' : '') +
        (sum.total ? '<div class="plan-progress"><div class="progress"><span style="width:' + pct + '%"></span></div><span class="muted small">' + sum.done + ' из ' + sum.total + ' · ' + U.human(sum.plannedMin * 60) + ' запланировано</span></div>' : '') +
      '</div>' +

      (isToday ? carryCard() : '') +
      '<section class="card">' +
        (list.length ? '<ol class="timeline">' + list.map((b) => {
          const s = toMin(b.start), e = toMin(b.end);
          const now = isToday && nowMin >= s && nowMin < e;
          const past = (dayOffset < 0) || (isToday && nowMin >= e);
          const task = b.taskId && Store.task(b.taskId);
          const c = task ? Store.category(task.categoryId) : null;
          const tracked = trackedFor(b);
          const running = task && S().active && S().active.taskId === task.id;
          return '<li class="tl-item' + (b.done ? ' done' : '') + (now ? ' now' : '') + (past && !b.done ? ' missed' : '') + '">' +
            '<div class="tl-time"><b>' + b.start + '</b><span>' + b.end + '</span></div>' +
            '<div class="tl-body"' + (c ? ' style="--c:' + c.color + '"' : '') + '>' +
              '<label class="tl-check"><input type="checkbox" data-pl="done" data-id="' + b.id + '"' + (b.done ? ' checked' : '') + ' aria-label="Сделано: ' + U.esc(b.title) + '">' +
              '<span class="tl-title">' + U.esc(b.title) + '</span></label>' +
              '<div class="tl-meta">' + (now ? '<span class="tag new">сейчас</span>' : '') +
                '<span>' + U.human((e - s) * 60) + '</span>' +
                (c ? '<span class="cat"><i style="background:' + c.color + '"></i>' + U.esc(c.name) + '</span>' : '') +
                (tracked ? '<span>записано ' + U.human(tracked) + '</span>' : '') + '</div>' +
            '</div>' +
            '<div class="tl-actions">' +
              (task && isToday ? '<button class="icon-btn" data-pl="' + (running ? 'stop' : 'start') + '" data-id="' + b.id + '" aria-label="' + (running ? 'Остановить таймер' : 'Запустить таймер') + '">' + (running ? I('stop') : I('play')) + '</button>' : '') +
              '<button class="icon-btn" data-pl="edit" data-id="' + b.id + '" aria-label="Изменить блок">' + I('pencil') + '</button>' +
            '</div></li>';
        }).join('') + '</ol>' :
          '<div class="empty-state"><p>На этот день ничего не запланировано.</p>' +
          '<p class="muted">Добавь первый блок ниже или скопируй план с другого дня.</p></div>') +

        '<form class="plan-add" id="plan-add">' +
          '<input type="time" name="start" value="' + lastEnd + '" required aria-label="Начало">' +
          '<input type="time" name="end" value="' + fromMin(toMin(lastEnd) + 60) + '" required aria-label="Конец">' +
          '<input name="title" list="plan-tasks" placeholder="Что делаю (или выбери задачу)" maxlength="80" required aria-label="Что делаю">' +
          '<datalist id="plan-tasks">' + S().tasks.filter((t) => !t.archived).map((t) => '<option value="' + U.esc(t.name) + '">').join('') + '</datalist>' +
          '<button class="btn primary">Добавить</button>' +
        '</form>' +
        '<div class="row-btns plan-copy">' +
          '<button class="btn small" data-pl="copy" data-from="-1">Скопировать со вчера</button>' +
          '<button class="btn small" data-pl="copy" data-from="-7">Как в тот же день прошлой недели</button>' +
          (list.length ? '<button class="btn small ghost danger-text" data-pl="clear">Очистить день</button>' : '') +
        '</div>' +
      '</section>' +
      '<p class="hint muted small">Если название совпадает с задачей из «Сегодня», блок можно запустить таймером — и время запишется в статистику.</p>';
  }

  // Несделанные блоки за последние 7 дней, которые ещё не переносили и не скрывали
  function leftovers() {
    const today = U.dayKey(Date.now());
    const weekAgo = U.dayKey(U.addDays(U.startOfDay(Date.now()), -7));
    return S().plan.filter((b) => !b.done && !b.carried && !b.skipped && b.day < today && b.day >= weekAgo)
      .sort((a, b) => (a.day + a.start).localeCompare(b.day + b.start));
  }

  function carryCard() {
    const left = leftovers();
    if (!left.length) return '';
    return '<section class="card carry"><div class="card-head"><h2 class="h-ic">' + I('calendar') + ' Незавершённое с прошлых дней</h2></div>' +
      '<ul class="carry-list">' + left.slice(0, 6).map((b) => '<li><span class="muted small">' + U.dateLabel(new Date(b.day + 'T12:00:00').getTime()) + ', ' + b.start + '</span> ' + U.esc(b.title) + '</li>').join('') +
      (left.length > 6 ? '<li class="muted small">и ещё ' + (left.length - 6) + '</li>' : '') + '</ul>' +
      '<div class="row-btns"><button class="btn primary" data-pl="carry">Перенести на сегодня (' + left.length + ')</button><button class="btn ghost" data-pl="skip-left">Не нужно</button></div></section>';
  }

  function findTask(title) {
    const t = title.trim().toLowerCase();
    return S().tasks.find((x) => !x.archived && x.name.trim().toLowerCase() === t);
  }

  function blockModal(b) {
    App.modal({
      title: 'Блок плана',
      body:
        '<div class="row"><label>Начало<input type="time" name="start" value="' + b.start + '" required></label>' +
        '<label>Конец<input type="time" name="end" value="' + b.end + '" required></label></div>' +
        '<label>Что делаю<input name="title" list="plan-tasks-m" value="' + U.esc(b.title) + '" maxlength="80" required></label>' +
        '<datalist id="plan-tasks-m">' + S().tasks.filter((t) => !t.archived).map((t) => '<option value="' + U.esc(t.name) + '">').join('') + '</datalist>',
      extra: '<button type="button" class="btn ghost danger-text" data-x="del">Удалить</button>',
      onOpen(form, close) {
        form.querySelector('[data-x=del]').addEventListener('click', () => {
          S().plan = S().plan.filter((x) => x.id !== b.id); Store.save(); close(); App.render();
        });
      },
      onSubmit(d) {
        if (toMin(d.end) <= toMin(d.start)) { U.toast('Конец должен быть позже начала'); return false; }
        b.start = d.start; b.end = d.end; b.title = d.title;
        const t = findTask(d.title); b.taskId = t ? t.id : null;
        Store.save(); App.render();
      },
    });
  }

  document.addEventListener('click', async (e) => {
    if (!root || !root.contains(e.target)) return;
    const btn = e.target.closest('[data-pl]');
    if (!btn || btn.dataset.pl === 'done') return;
    const b = S().plan.find((x) => x.id === btn.dataset.id);
    switch (btn.dataset.pl) {
      case 'prev': dayOffset--; App.render(); break;
      case 'next': dayOffset++; App.render(); break;
      case 'today': dayOffset = 0; App.render(); break;
      case 'edit': if (b) blockModal(b); break;
      case 'start': if (b && b.taskId) { S().settings.lastTask = b.taskId; Timer.start(b.taskId, S().settings.lastMode || 'watch'); } break;
      case 'stop': Timer.stop(); break;
      case 'carry': {
        const key = U.dayKey(Date.now());
        const left = leftovers();
        left.forEach((x) => {
          S().plan.push({ id: U.uid(), day: key, start: x.start, end: x.end, title: x.title, taskId: x.taskId, done: false });
          x.carried = true;
        });
        Store.save(); App.render();
        U.toast('Перенесено на сегодня: ' + left.length);
        break;
      }
      case 'skip-left':
        leftovers().forEach((x) => { x.skipped = true; });
        Store.save(); App.render();
        break;
      case 'clear':
        if (await App.confirm('Удалить все блоки на этот день?')) {
          const key = U.dayKey(dayTs());
          S().plan = S().plan.filter((x) => x.day !== key); Store.save(); App.render();
        }
        break;
      case 'copy': {
        const key = U.dayKey(dayTs());
        const fromKey = U.dayKey(U.addDays(dayTs(), Number(btn.dataset.from)));
        const src = blocksOf(fromKey);
        if (!src.length) { U.toast('В тот день плана не было'); break; }
        const existing = new Set(blocksOf(key).map((x) => x.start + x.title));
        let n = 0;
        src.forEach((x) => {
          if (existing.has(x.start + x.title)) return;
          S().plan.push({ id: U.uid(), day: key, start: x.start, end: x.end, title: x.title, taskId: x.taskId, done: false });
          n++;
        });
        Store.save(); App.render();
        U.toast('Скопировано блоков: ' + n);
        break;
      }
    }
  });

  document.addEventListener('change', (e) => {
    if (!root || !root.contains(e.target) || e.target.dataset.pl !== 'done') return;
    const b = S().plan.find((x) => x.id === e.target.dataset.id);
    if (!b) return;
    b.done = e.target.checked;
    Store.save();
    const sum = App.planSummary(b.day);
    if (b.done && sum.total && sum.done === sum.total) { U.toast('Весь план на день выполнен!'); if (window.Sound) Sound.chime(); }
    App.render();
  });

  document.addEventListener('submit', (e) => {
    if (!root || e.target.id !== 'plan-add') return;
    e.preventDefault();
    const d = U.formData(e.target);
    if (!d.title) return;
    if (toMin(d.end) <= toMin(d.start)) { U.toast('Конец должен быть позже начала'); return; }
    const t = findTask(d.title);
    S().plan.push({ id: U.uid(), day: U.dayKey(dayTs()), start: d.start, end: d.end, title: d.title, taskId: t ? t.id : null, done: false });
    Store.save(); App.render();
    const inp = root.querySelector('#plan-add [name=title]');
    if (inp) inp.focus();
  });

  let ticks = 0;
  App.views.plan = {
    render,
    leave() { root = null; },
    tick() { if (++ticks % 60 === 0 && dayOffset === 0) App.render(); }, // раз в минуту обновляем «сейчас»
    key(e) {
      if (e.key === 'ArrowLeft') { dayOffset--; App.render(); return true; }
      if (e.key === 'ArrowRight') { dayOffset++; App.render(); return true; }
    },
  };
})();
