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
          '<button class="btn small ai-btn" data-pl="ai-plan">' + I('sparkles') + ' Составить план из текста</button>' +
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

  // ---------- План из текста (нейросеть) ----------

  function aiPlanPrompt(text, key) {
    const isToday = key === U.dayKey(Date.now());
    const now = new Date();
    const existing = blocksOf(key).map((b) => b.start + '–' + b.end + ' ' + b.title);
    const tasks = S().tasks.filter((t) => !t.archived).map((t) => t.name);
    return 'Составь расписание на ' + (isToday ? 'сегодня' : U.dateLabel(new Date(key + 'T12:00:00').getTime())) + ' по описанию студентки.\n' +
      (isToday ? 'Сейчас ' + U.pad(now.getHours()) + ':' + U.pad(now.getMinutes()) + ' — не ставь блоки в прошлое.\n' : '') +
      (existing.length ? 'Уже запланировано (не пересекайся): ' + existing.join('; ') + '.\n' : '') +
      (tasks.length ? 'Её задачи (если подходит — используй ровно эти названия): ' + tasks.join(', ') + '.\n' : '') +
      'Описание: «' + text + '»\n\n' +
      'Правила: реалистичные интервалы, короткие перерывы между долгими занятиями, время в формате ЧЧ:ММ. Если время не указано — расставь сама разумно. ' +
      'Верни JSON: {"blocks": [{"start": "09:00", "end": "10:30", "title": "коротко, по-русски"}], "tip": "один короткий совет по плану или пустая строка"}';
  }

  function aiPlanModal() {
    const key = U.dayKey(dayTs());
    App.modal({
      title: 'План из текста',
      body:
        '<p class="muted small">Опиши день своими словами — нейросеть разложит его по времени, а ты проверишь и добавишь.</p>' +
        '<textarea name="text" rows="5" required placeholder="Например: пары до 13, потом обед, 2 часа курсовая, полчаса английского, вечером спорт и созвон с мамой в 21"></textarea>',
      submit: 'Разложить по времени',
      extra: '<button type="button" class="btn ghost" data-x="copy">' + I('note') + ' Скопировать запрос</button>',
      onOpen(form) {
        form.querySelector('[data-x=copy]').addEventListener('click', async () => {
          const txt = aiPlanPrompt(form.text.value.trim() || '…', key);
          try { await navigator.clipboard.writeText(txt); U.toast('Запрос скопирован — вставь его в любую нейросеть'); } catch (e) { window.prompt('Скопируй:', txt); }
        });
      },
      onSubmit(d, form) {
        if (!d.text) return false;
        if (!AI.ready() && !AI._mock) { U.toast('Подключи нейросеть в настройках — или нажми «Скопировать запрос»'); return false; }
        const btn = form.querySelector('button[type=submit]');
        AI.run(btn, () => AI.ask({ json: true, temperature: 0.4, system: 'Ты — внимательный помощник по планированию дня для студентки.', prompt: aiPlanPrompt(d.text, key) }))
          .then((r) => {
            const blocks = (r && Array.isArray(r.blocks) ? r.blocks : []).filter((b) => /^\d{1,2}:\d{2}$/.test(b.start || '') && /^\d{1,2}:\d{2}$/.test(b.end || '') && b.title)
              .map((b) => ({ start: fromMin(toMin(b.start)), end: fromMin(toMin(b.end)), title: String(b.title).slice(0, 80) }))
              .filter((b) => toMin(b.end) > toMin(b.start));
            if (!blocks.length) { if (r) U.toast('Не получилось разобрать план. Попробуй описать подробнее.'); return; }
            App.closeModal();
            aiPlanPreview(key, blocks, r.tip || '');
          });
        return false; // окно закроем сами, когда придёт ответ
      },
    });
  }

  function aiPlanPreview(key, blocks, tip) {
    App.modal({
      title: 'Проверь план',
      body: (tip ? '<div class="ai-status ok">' + I('sparkles') + '<span>' + U.esc(tip) + '</span></div>' : '') +
        '<ul class="gen-list">' + blocks.map((b, i) => {
          const t = findTask(b.title);
          return '<li><label class="check"><input type="checkbox" name="b' + i + '" checked><span><b>' + b.start + '–' + b.end + '</b> ' + U.esc(b.title) +
            (t ? ' <span class="tag ok">задача</span>' : '') + '</span></label></li>';
        }).join('') + '</ul><p class="muted small">Блоки с меткой «задача» можно будет запускать таймером.</p>',
      submit: 'Добавить в план',
      onSubmit(d, form) {
        let n = 0;
        blocks.forEach((b, i) => {
          if (!form.querySelector('[name=b' + i + ']').checked) return;
          const t = findTask(b.title);
          S().plan.push({ id: U.uid(), day: key, start: b.start, end: b.end, title: b.title, taskId: t ? t.id : null, done: false });
          n++;
        });
        Store.save(); App.render();
        U.toast('Добавлено блоков: ' + n);
      },
    });
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
      case 'ai-plan': aiPlanModal(); break;
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
    if (b.done && sum.total && sum.done === sum.total) { U.toast('Весь план на день выполнен!'); if (window.Sound) Sound.notify(); }
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
  // Открыть план конкретного дня (из календаря)
  App.openPlanDay = function (key) {
    dayOffset = Math.round((new Date(key + 'T12:00:00').getTime() - U.startOfDay(Date.now()) - 12 * 3600000) / 86400000);
    location.hash = '#/plan';
    App.render();
  };

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
