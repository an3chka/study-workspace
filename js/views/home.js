// Раздел «Сегодня»: задачи, таймер, Pomodoro, история за день.
(function () {
  'use strict';

  const App = window.App = window.App || {};
  App.views = App.views || {};

  let filter = 'all';
  let root = null;

  function S() { return Store.state; }

  function greeting() {
    const h = new Date().getHours();
    if (h < 5) return 'Доброй ночи';
    if (h < 12) return 'Доброе утро';
    if (h < 18) return 'Добрый день';
    return 'Добрый вечер';
  }

  function catOptions(selected) {
    return S().categories.map((c) => '<option value="' + c.id + '"' + (c.id === selected ? ' selected' : '') + '>' + U.esc(c.name) + '</option>').join('');
  }

  function render(el) {
    root = el;
    const st = S();
    const mode = st.settings.lastMode || 'watch';
    const tasks = st.tasks.filter((t) => !t.archived && (filter === 'all' || t.categoryId === filter));
    const todayFrom = U.startOfDay(Date.now());
    const todayList = Stats.inRange(todayFrom, U.addDays(todayFrom, 1));
    const perTask = {};
    todayList.forEach((s) => { perTask[s.taskId] = (perTask[s.taskId] || 0) + s.sec; });
    const totalPerTask = {};
    st.sessions.forEach((s) => { totalPerTask[s.taskId] = (totalPerTask[s.taskId] || 0) + s.sec; });
    const active = st.active;
    const usedCats = st.categories.filter((c) => st.tasks.some((t) => !t.archived && t.categoryId === c.id));
    // Последняя запись по каждой задаче — для блока «Продолжить»
    const last = {};
    st.sessions.forEach((x) => { if (!last[x.taskId] || x.start > last[x.taskId].start) last[x.taskId] = x; });
    // В открытой категории сначала показываем задачи, которыми занималась недавно
    if (filter !== 'all') tasks.sort((a, b) => (last[b.id] ? last[b.id].start : 0) - (last[a.id] ? last[a.id].start : 0));
    const recent = st.tasks
      .filter((t) => !t.archived && last[t.id] && (filter === 'all' || t.categoryId === filter) && !(active && active.taskId === t.id) && Date.now() - last[t.id].start < 21 * 86400000)
      .sort((a, b) => last[b.id].start - last[a.id].start)
      .slice(0, 3);

    el.innerHTML =
      '<header class="page-head"><div><h1>' + greeting() + '!</h1><p class="muted">' + U.weekday(Date.now()) + ', ' + U.dateLabel(Date.now()) + '</p></div></header>' +

      '<div class="grid-2">' +
        '<section class="card today-card" id="today-card">' + todayCard(todayList) + '</section>' +
        '<section class="card timer-card" id="timer-card">' + timerCard(mode) + '</section>' +
      '</div>' +
      App.gameCardHTML() +
      (function () {
        const ins = App.insightsToday();
        return ins.length ? '<section class="card assistant"><div class="card-head"><h2 class="h-ic">' + I('sparkles') + ' Помощник</h2><a class="small" href="#/stats">обзор недели ›</a></div>' + App.renderInsights(ins, 4) + '</section>' : '';
      })() +

      '<section class="card">' +
        '<div class="card-head"><h2>Задачи</h2>' +
          '<div class="seg" role="group" aria-label="Режим таймера">' +
            '<button class="' + (mode === 'watch' ? 'on' : '') + '" data-act="mode" data-mode="watch" title="Считает время, пока не остановишь">' + I('timer') + ' Секундомер</button>' +
            '<button class="' + (mode === 'pomo' ? 'on' : '') + '" data-act="mode" data-mode="pomo" title="' + st.settings.pomoWork + ' мин работы, потом перерыв">' + I('clock') + ' Pomodoro ' + st.settings.pomoWork + '/' + st.settings.pomoBreak + '</button>' +
          '</div></div>' +
        (usedCats.length > 1 ? '<div class="chips">' +
          '<button class="chip' + (filter === 'all' ? ' on' : '') + '" data-act="filter" data-id="all">Все</button>' +
          usedCats.map((c) => '<button class="chip' + (filter === c.id ? ' on' : '') + '" data-act="filter" data-id="' + c.id + '"><i style="background:' + c.color + '"></i>' + U.esc(c.name) + '</button>').join('') +
        '</div>' : '') +
        (recent.length ? '<div class="continue"><div class="continue-head">' + I('play') + ' Продолжить' + (filter !== 'all' ? ' в «' + U.esc(Store.category(filter).name) + '»' : '') + '</div><div class="continue-list">' +
          recent.map((t) => {
            const c = Store.category(t.categoryId);
            const l = last[t.id];
            return '<button class="continue-item" data-act="start" data-id="' + t.id + '" style="--c:' + c.color + '">' +
              '<span class="ci-play">' + I('play') + '</span><span class="ci-text"><b>' + U.esc(t.name) + '</b>' +
              '<small>' + whenLabel(l.start) + ' · ' + U.human(l.sec) + '</small></span></button>';
          }).join('') + '</div></div>' : '') +
        '<ul class="task-list">' + (tasks.length ? tasks.map((t) => {
          const c = Store.category(t.categoryId);
          const running = active && active.taskId === t.id;
          return '<li class="task' + (running ? ' running' : '') + '">' +
            '<button class="play" data-act="' + (running ? 'stop' : 'start') + '" data-id="' + t.id + '" aria-label="' + (running ? 'Остановить' : 'Запустить') + ' ' + U.esc(t.name) + '">' + (running ? I('stop') : I('play')) + '</button>' +
            '<div class="task-main"><div class="task-name">' + U.esc(t.name) + '</div>' +
            '<div class="task-meta"><span class="cat"><i style="background:' + c.color + '"></i>' + U.esc(c.name) + '</span>' +
            (t.goalMin ? '<span>цель ' + t.goalMin + ' мин/день</span>' : '') + '</div>' +
            (t.goalMin ? '<div class="mini-bar"><span style="width:' + Math.min(100, (perTask[t.id] || 0) / 60 / t.goalMin * 100) + '%;background:' + c.color + '"></span></div>' : '') +
            '</div>' +
            '<div class="task-time"><b data-live-task="' + t.id + '">' + U.human(perTask[t.id] || 0) + '</b><small>всего ' + U.human(totalPerTask[t.id] || 0) + '</small></div>' +
            '<button class="icon-btn" data-act="menu" data-id="' + t.id + '" aria-label="Действия с задачей">' + I('more') + '</button>' +
            '</li>';
        }).join('') : '<li class="empty">' + (st.tasks.length ? 'В этой категории нет задач' : 'Пока нет задач. Добавь первую — например, «Английский: слова» или «Рисование».') + '</li>') + '</ul>' +
        '<form class="add-task" id="add-task">' +
          '<input name="name" placeholder="Новая задача…" required maxlength="80" aria-label="Название задачи">' +
          '<select name="categoryId" aria-label="Категория">' + catOptions(filter !== 'all' ? filter : (st.settings.lastCat || 'lang')) + '</select>' +
          '<button class="btn primary">Добавить</button>' +
        '</form>' +
      '</section>' +

      '<section class="card">' +
        '<div class="card-head"><h2>История за сегодня</h2>' +
        (st.tasks.length ? '<button class="btn small" data-act="manual">+ Добавить время вручную</button>' : '') + '</div>' +
        historyList(todayList) +
      '</section>' +
      '<p class="hint muted small">Горячие клавиши: <kbd>Пробел</kbd> — старт/стоп последней задачи, <kbd>M</kbd> — звук, <kbd>1</kbd>–<kbd>7</kbd> — разделы.</p>';
  }

  // «сегодня в 14:20», «вчера», «3 дня назад»
  function whenLabel(ts) {
    const days = Math.round((U.startOfDay(Date.now()) - U.startOfDay(ts)) / 86400000);
    if (days <= 0) return 'сегодня в ' + U.timeLabel(ts);
    if (days === 1) return 'вчера';
    return days + ' ' + U.plural(days, ['день', 'дня', 'дней']) + ' назад';
  }

  function todayCard(todayList) {
    const total = Stats.sum(todayList);
    const goal = Stats.goalSec();
    const streak = Stats.streak();
    const frac = goal ? total / goal : 0;
    const cats = Stats.byCategory(todayList);
    return '<div class="today">' +
      Charts.ring(frac, '<b>' + U.human(total) + '</b><small>из ' + U.human(goal) + '</small>') +
      '<div class="today-info">' +
        '<div class="stat-line"><span class="big flame">' + I('flame') + streak.current + '</span> ' + U.plural(streak.current, ['день', 'дня', 'дней']) + ' подряд</div>' +
        '<p class="muted small">' + (frac >= 1 ? 'Цель на сегодня выполнена — ты молодец!' :
          goal ? 'Осталось ' + U.human(goal - total) + ' до дневной цели' : 'Дневная цель не задана') + '</p>' +
        (cats.length ? Charts.stack(cats.map((c) => ({ value: c.sec, color: c.color, label: c.name }))) +
          '<ul class="legend">' + cats.map((c) => '<li><i style="background:' + c.color + '"></i>' + U.esc(c.name) + ' <span class="muted">' + U.human(c.sec) + '</span></li>').join('') + '</ul>' : '') +
      '</div></div>';
  }

  function timerCard(mode) {
    const d = Timer.display();
    const st = S();
    if (!d) {
      const last = st.settings.lastTask && Store.task(st.settings.lastTask);
      return '<div class="timer idle">' +
        '<div class="timer-time">' + (mode === 'pomo' ? U.clock(st.settings.pomoWork * 60) : '00:00') + '</div>' +
        '<p class="muted">' + (last && !last.archived ? 'Последняя задача: <b>' + U.esc(last.name) + '</b>' : 'Выбери задачу ниже и нажми «старт»') + '</p>' +
        (last && !last.archived ? '<button class="btn primary big" data-act="start" data-id="' + last.id + '">' + I('play') + ' Продолжить «' + U.esc(last.name) + '»</button>' : '') +
        '</div>';
    }
    const a = st.active;
    const isPomo = a.mode === 'pomo';
    const total = isPomo ? (a.phase === 'work' ? st.settings.pomoWork : a.phase === 'long' ? st.settings.pomoLong : st.settings.pomoBreak) * 60 : 0;
    const frac = isPomo ? 1 - Timer.remaining() / total : 0;
    return '<div class="timer run phase-' + d.phase + '">' +
      '<div class="timer-label">' + (isPomo ? (d.phase === 'work' ? I('clock') : I('coffee')) : I('timer')) + U.esc(d.label) + '</div>' +
      '<div class="timer-time" id="timer-time">' + d.time + '</div>' +
      '<div class="timer-task">' + U.esc(d.name) + '</div>' +
      (isPomo ? '<div class="progress"><span id="timer-progress" style="width:' + (frac * 100) + '%"></span></div>' : '') +
      '<div class="timer-actions">' +
        (d.waiting ? '<button class="btn primary" data-act="resume">' + I('play') + ' Следующий помидор</button>' : '') +
        '<button class="btn primary" data-act="stop">' + I('stop') + ' Стоп и записать</button>' +
        (isPomo && !d.waiting ? '<button class="btn" data-act="skip">' + (d.phase === 'work' ? 'Завершить помидор' : 'Пропустить перерыв') + '</button>' : '') +
        '<button class="btn ghost" data-act="cancel" title="Не записывать это время">Сбросить</button>' +
      '</div></div>';
  }

  function historyList(list) {
    if (!list.length) return '<p class="empty">Сегодня ещё ничего не записано.</p>';
    return '<ul class="history">' + list.slice().sort((a, b) => b.start - a.start).map((s) => {
      const t = Store.task(s.taskId);
      const c = Store.category(t && t.categoryId);
      return '<li' + (s.live ? ' class="live"' : '') + '><i style="background:' + c.color + '"></i>' +
        '<span class="h-time">' + U.timeLabel(s.start) + '–' + (s.live ? 'сейчас' : U.timeLabel(s.end)) + '</span>' +
        '<span class="h-name">' + U.esc(t ? t.name : 'Удалённая задача') + (s.kind === 'pomo' ? ' <span class="tag">pomodoro</span>' : s.kind === 'manual' ? ' <span class="tag">вручную</span>' : '') + '</span>' +
        '<b' + (s.live ? ' data-live-session' : '') + '>' + U.human(s.sec) + '</b>' +
        (s.live ? '<span></span>' : '<button class="icon-btn small" data-act="edit-session" data-id="' + s.id + '" aria-label="Изменить запись">' + I('pencil') + '</button>') +
        '</li>';
    }).join('') + '</ul>';
  }

  // Обновление раз в секунду — только цифры, без полной перерисовки.
  let tickCount = 0;
  function tick() {
    if (!root) return;
    const d = Timer.display();
    const tt = root.querySelector('#timer-time');
    if (d && tt) tt.textContent = d.time;
    const pr = root.querySelector('#timer-progress');
    if (pr && S().active) {
      const a = S().active, st = S().settings;
      const total = (a.phase === 'work' ? st.pomoWork : a.phase === 'long' ? st.pomoLong : st.pomoBreak) * 60;
      pr.style.width = ((1 - Timer.remaining() / total) * 100) + '%';
    }
    // Раз в 15 секунд обновляем кольцо и время задач
    if (++tickCount % 15 === 0 && S().active) {
      const todayFrom = U.startOfDay(Date.now());
      const list = Stats.inRange(todayFrom, U.addDays(todayFrom, 1));
      const card = root.querySelector('#today-card');
      if (card) card.innerHTML = todayCard(list);
      const a = S().active;
      const el = root.querySelector('[data-live-task="' + a.taskId + '"]');
      if (el) el.textContent = U.human(Stats.sum(list.filter((s) => s.taskId === a.taskId)));
      const ls = root.querySelector('[data-live-session]');
      const live = list.find((s) => s.live);
      if (ls && live) ls.textContent = U.human(live.sec);
    }
  }

  function start(id) {
    const st = S();
    st.settings.lastTask = id;
    Timer.start(id, st.settings.lastMode || 'watch');
  }

  function taskModal(t) {
    const isNew = !t;
    t = t || { name: '', categoryId: 'lang', goalMin: '' };
    App.modal({
      title: isNew ? 'Новая задача' : 'Задача',
      body:
        '<label>Название<input name="name" required maxlength="80" value="' + U.esc(t.name) + '"></label>' +
        '<label>Категория<select name="categoryId">' + catOptions(t.categoryId) + '</select></label>' +
        '<label>Цель на день, мин (необязательно)<input name="goalMin" type="number" min="0" max="1440" value="' + U.esc(t.goalMin || '') + '" placeholder="например, 20"></label>',
      extra: isNew ? '' : '<button type="button" class="btn ghost" data-x="stats">' + I('chart') + ' Статистика</button><button type="button" class="btn ghost" data-x="archive">В архив</button><button type="button" class="btn ghost danger-text" data-x="delete">Удалить</button>',
      onOpen(form, close) {
        form.querySelectorAll('[data-x]').forEach((b) => b.addEventListener('click', async () => {
          if (b.dataset.x === 'stats') { close(); App.showStatsFor('task:' + t.id); return; }
          if (b.dataset.x === 'archive') {
            t.archived = true;
            if (S().active && S().active.taskId === t.id) Timer.stop();
            Store.save(); close(); App.render();
            U.toast('Задача в архиве. Вернуть можно в настройках.');
          } else {
            close();
            const n = S().sessions.filter((s) => s.taskId === t.id).length;
            if (await App.confirm('Удалить задачу «' + t.name + '»' + (n ? ' и ' + n + ' ' + U.plural(n, ['запись', 'записи', 'записей']) + ' времени' : '') + '? Это нельзя отменить.')) {
              if (S().active && S().active.taskId === t.id) S().active = null;
              S().tasks = S().tasks.filter((x) => x.id !== t.id);
              S().sessions = S().sessions.filter((s) => s.taskId !== t.id);
              Store.save(); App.render(); Timer.emit();
            }
          }
        }));
      },
      onSubmit(data) {
        if (!data.name) return false;
        if (isNew) {
          t = { id: U.uid(), createdAt: Date.now() };
          S().tasks.push(t);
        }
        t.name = data.name;
        t.categoryId = data.categoryId;
        t.goalMin = Number(data.goalMin) || 0;
        Store.save(); App.render();
      },
    });
  }

  function taskMenu(id) {
    const t = Store.task(id);
    if (t) taskModal(t);
  }

  function manualModal(taskId) {
    const st = S();
    const tasks = st.tasks.filter((t) => !t.archived);
    App.modal({
      title: 'Добавить время вручную',
      body:
        '<p class="muted small">Если забыла включить таймер — запиши время здесь.</p>' +
        '<label>Задача<select name="taskId">' + tasks.map((t) => '<option value="' + t.id + '"' + (t.id === (taskId || st.settings.lastTask) ? ' selected' : '') + '>' + U.esc(t.name) + '</option>').join('') + '</select></label>' +
        '<div class="row"><label>Минут<input name="min" type="number" min="1" max="1440" required value="30"></label>' +
        '<label>День<input name="day" type="date" required value="' + U.dayKey(Date.now()) + '" max="' + U.dayKey(Date.now()) + '"></label></div>',
      submit: 'Добавить',
      onSubmit(d) {
        const min = Number(d.min);
        if (!min || min <= 0) return false;
        Timer.addManual(d.taskId, min, new Date(d.day + 'T12:00:00').getTime());
        U.toast('Добавлено ' + U.human(min * 60));
      },
    });
  }

  function editSession(id) {
    const st = S();
    const s = st.sessions.find((x) => x.id === id);
    if (!s) return;
    App.modal({
      title: 'Запись времени',
      body:
        '<label>Задача<select name="taskId">' + st.tasks.map((t) => '<option value="' + t.id + '"' + (t.id === s.taskId ? ' selected' : '') + '>' + U.esc(t.name) + (t.archived ? ' (архив)' : '') + '</option>').join('') + '</select></label>' +
        '<label>Длительность, мин<input name="min" type="number" min="1" max="1440" step="1" required value="' + Math.max(1, Math.round(s.sec / 60)) + '"></label>',
      extra: '<button type="button" class="btn ghost danger-text" data-x="del">Удалить запись</button>',
      onOpen(form, close) {
        form.querySelector('[data-x=del]').addEventListener('click', () => {
          st.sessions = st.sessions.filter((x) => x.id !== id);
          Store.save(); close(); App.render();
          U.toast('Запись удалена');
        });
      },
      onSubmit(d) {
        s.taskId = d.taskId;
        s.sec = Math.round(Number(d.min) * 60);
        s.end = s.start + s.sec * 1000;
        Store.save(); App.render();
      },
    });
  }

  document.addEventListener('click', (e) => {
    if (!root || !root.contains(e.target)) return;
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const id = b.dataset.id;
    switch (b.dataset.act) {
      case 'start': start(id); break;
      case 'stop': Timer.stop(); break;
      case 'cancel': Timer.cancel(); break;
      case 'skip': Timer.skip(); break;
      case 'resume': Timer.resume(); break;
      case 'mode':
        S().settings.lastMode = b.dataset.mode; Store.save(); App.render();
        if (S().active && S().active.mode !== b.dataset.mode) U.toast('Режим изменится при следующем запуске');
        break;
      case 'filter': filter = id; App.render(); break;
      case 'menu': taskMenu(id); break;
      case 'manual': manualModal(); break;
      case 'edit-session': editSession(id); break;
    }
  });

  document.addEventListener('submit', (e) => {
    if (e.target.id !== 'add-task') return;
    e.preventDefault();
    const d = U.formData(e.target);
    if (!d.name) return;
    S().tasks.push({ id: U.uid(), name: d.name, categoryId: d.categoryId, createdAt: Date.now(), goalMin: 0 });
    S().settings.lastCat = d.categoryId;
    Store.save();
    App.render();
    const inp = root.querySelector('#add-task input[name=name]');
    if (inp) inp.focus();
  });

  App.views.home = {
    render,
    tick,
    leave() { root = null; },
    key(e) {
      if (e.key === ' ' || e.code === 'Space') {
        if (S().active) {
          if (S().active.waiting) Timer.resume(); else Timer.stop();
        } else {
          const last = S().settings.lastTask && Store.task(S().settings.lastTask);
          const t = last && !last.archived ? last : S().tasks.find((x) => !x.archived);
          if (t) start(t.id); else U.toast('Сначала добавь задачу');
        }
        return true;
      }
    },
  };
})();
