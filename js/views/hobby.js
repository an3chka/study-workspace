// Раздел «Хобби»: цели, отметки прогресса, история.
// Цель бывает двух видов: с числом («прочитать 12 книг») или по шагам
// (чек-лист: «купить пряжу», «связать образец»…).
(function () {
  'use strict';

  const App = window.App = window.App || {};
  App.views = App.views || {};

  // Иконки для целей (название иконки из js/icons.js)
  const ICONS = ['palette', 'music', 'book', 'yarn', 'camera', 'activity', 'heart', 'utensils', 'leaf', 'pen', 'gamepad', 'star', 'mountain', 'target'];
  const iconOf = (h) => (h.icon && I.names.includes(h.icon) ? h.icon : 'target');
  let root = null;
  let showDone = false;

  function S() { return Store.state; }
  function hobby(id) { return S().hobbies.find((h) => h.id === id); }

  function progressOf(h) {
    if (h.kind === 'steps') {
      const steps = h.steps || [];
      const done = steps.filter((s) => s.done).length;
      return { value: done, target: steps.length, frac: steps.length ? done / steps.length : 0 };
    }
    const value = h.log.reduce((a, l) => a + (Number(l.amount) || 0), 0);
    return { value, target: h.target || 0, frac: h.target ? value / h.target : 0 };
  }

  function lastActivity(h) {
    const times = h.log.map((l) => l.ts).concat((h.steps || []).filter((s) => s.doneAt).map((s) => s.doneAt));
    return times.length ? Math.max(...times) : 0;
  }

  function render(el) {
    root = el;
    const list = S().hobbies.filter((h) => showDone ? h.done : !h.done);
    const doneCount = S().hobbies.filter((h) => h.done).length;
    el.innerHTML =
      '<header class="page-head"><div><h1>Хобби</h1><p class="muted">Цели и маленькие шаги к ним</p></div>' +
      '<button class="btn primary" data-h="new">+ Цель</button></header>' +
      (doneCount ? '<div class="seg" role="group"><button class="' + (!showDone ? 'on' : '') + '" data-h="tab" data-v="0">В процессе</button><button class="' + (showDone ? 'on' : '') + '" data-h="tab" data-v="1">Достигнуто (' + doneCount + ')</button></div>' : '') +
      '<div class="hobby-grid">' + (list.length ? list.map(card).join('') :
        '<div class="card empty-state"><p>' + (showDone ? 'Пока ничего не достигнуто — всё впереди!' : 'Целей пока нет.') + '</p>' +
        (showDone ? '' : '<p class="muted">Например: «Прочитать 12 книг», «Нарисовать 30 скетчей», «Связать шарф» (по шагам).</p><div class="row-btns"><button class="btn primary" data-h="new">Добавить цель</button></div>') + '</div>') +
      '</div>';
  }

  function card(h) {
    const p = progressOf(h);
    const pct = Math.min(100, Math.round(p.frac * 100));
    const last = lastActivity(h);
    const daysAgo = last ? Math.floor((U.startOfDay(Date.now()) - U.startOfDay(last)) / 86400000) : null;
    const recent = h.log.slice().sort((a, b) => b.ts - a.ts).slice(0, 3);
    let deadline = '';
    if (h.deadline && !h.done) {
      const left = Math.round((new Date(h.deadline + 'T23:59:59').getTime() - Date.now()) / 86400000);
      deadline = '<span class="tag' + (left < 0 ? ' warn' : '') + '">' + (left < 0 ? 'срок прошёл' : left === 0 ? 'срок сегодня' : 'ещё ' + left + ' ' + U.plural(left, ['день', 'дня', 'дней'])) + '</span>';
    }
    return '<article class="card hobby' + (h.done ? ' done' : '') + '">' +
      '<div class="hobby-head"><span class="hobby-emoji">' + I(iconOf(h)) + '</span>' +
      '<div><h2>' + U.esc(h.name) + '</h2>' + (h.note ? '<p class="muted small">' + U.esc(h.note) + '</p>' : '') + '</div>' +
      '<button class="icon-btn" data-h="edit" data-id="' + h.id + '" aria-label="Изменить цель">' + I('more') + '</button></div>' +
      '<div class="hobby-progress"><div class="progress"><span style="width:' + pct + '%"></span></div>' +
      '<span class="muted small">' + (h.kind === 'steps' ? p.value + ' из ' + p.target + ' шагов' : fmt(p.value) + ' из ' + fmt(p.target) + ' ' + U.esc(h.unit || '')) + ' · ' + pct + '%</span></div>' +
      '<div class="hobby-tags">' + deadline + (daysAgo !== null && !h.done ? '<span class="tag">' + (daysAgo === 0 ? 'было сегодня' : daysAgo === 1 ? 'было вчера' : daysAgo + ' дн. назад') + '</span>' : '') + '</div>' +
      (h.kind === 'steps' ? '<ul class="steps">' + (h.steps || []).map((s) =>
        '<li><label><input type="checkbox" data-h="step" data-id="' + h.id + '" data-step="' + s.id + '"' + (s.done ? ' checked' : '') + '> <span>' + U.esc(s.text) + '</span></label></li>').join('') +
        '</ul><form class="add-step" data-hobby="' + h.id + '"><input name="text" placeholder="Новый шаг…" maxlength="120" aria-label="Новый шаг"><button class="btn small">+</button></form>'
        : (recent.length ? '<ul class="hobby-log">' + recent.map((l) => '<li><span class="muted">' + U.dateLabel(l.ts) + '</span> <b>+' + fmt(l.amount) + '</b> ' + U.esc(l.note || '') + '</li>').join('') + '</ul>' : '') +
          (h.done ? '' : '<button class="btn primary" data-h="log" data-id="' + h.id + '">+ Отметить прогресс</button>')) +
      (h.done ? '<p class="muted small done-line">' + I('trophy') + ' Достигнуто ' + (h.doneAt ? U.dateLabel(h.doneAt) : '') + '</p>' : '') +
      '</article>';
  }

  function fmt(n) { return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100); }

  function checkDone(h) {
    const p = progressOf(h);
    if (!h.done && p.target > 0 && p.value >= p.target) {
      h.done = true;
      h.doneAt = Date.now();
      U.toast('Цель «' + h.name + '» достигнута! Поздравляю!');
      if (window.Sound) Sound.chime();
    }
  }

  function hobbyModal(h) {
    const isNew = !h;
    h = h || { name: '', kind: 'number', target: 10, unit: '', icon: 'palette', note: '', deadline: '' };
    App.modal({
      title: isNew ? 'Новая цель' : 'Цель',
      body:
        '<label>Название<input name="name" required maxlength="80" value="' + U.esc(h.name) + '" placeholder="например, Прочитать 12 книг"></label>' +
        '<div class="emoji-pick">' + ICONS.map((e) => '<label title="' + e + '"><input type="radio" name="icon" value="' + e + '"' + (e === iconOf(h) ? ' checked' : '') + '><span>' + I(e) + '</span></label>').join('') + '</div>' +
        '<label>Как считать прогресс<select name="kind"' + (isNew ? '' : ' disabled') + '>' +
          '<option value="number"' + (h.kind === 'number' ? ' selected' : '') + '>Числом (книги, страницы, часы, рисунки…)</option>' +
          '<option value="steps"' + (h.kind === 'steps' ? ' selected' : '') + '>По шагам (чек-лист)</option></select></label>' +
        '<div class="row" data-only="number"><label>Цель<input name="target" type="number" min="1" step="any" value="' + U.esc(h.target || 10) + '"></label>' +
        '<label>Единица<input name="unit" maxlength="20" value="' + U.esc(h.unit || '') + '" placeholder="книг"></label></div>' +
        (isNew ? '<label data-only="steps">Шаги (каждый с новой строки)<textarea name="steps" rows="4" placeholder="Купить пряжу&#10;Связать образец&#10;Связать шарф"></textarea></label>' : '') +
        '<label>Срок (необязательно)<input name="deadline" type="date" value="' + U.esc(h.deadline || '') + '"></label>' +
        '<label>Заметка<input name="note" maxlength="140" value="' + U.esc(h.note || '') + '" placeholder="зачем мне это"></label>',
      extra: isNew ? '' :
        '<button type="button" class="btn ghost danger-text" data-x="del">Удалить</button>' +
        '<button type="button" class="btn ghost" data-x="done">' + (h.done ? 'Вернуть в работу' : 'Отметить достигнутой') + '</button>',
      onOpen(form, close) {
        const kind = form.querySelector('[name=kind]');
        const sync = () => form.querySelectorAll('[data-only]').forEach((x) => { x.hidden = x.dataset.only !== kind.value; });
        kind.addEventListener('change', sync); sync();
        const del = form.querySelector('[data-x=del]');
        if (del) del.addEventListener('click', async () => {
          close();
          if (await App.confirm('Удалить цель «' + h.name + '» вместе с историей?')) {
            S().hobbies = S().hobbies.filter((x) => x.id !== h.id); Store.save(); App.render();
          }
        });
        const dn = form.querySelector('[data-x=done]');
        if (dn) dn.addEventListener('click', () => {
          h.done = !h.done; h.doneAt = h.done ? Date.now() : null;
          Store.save(); close(); App.render();
          if (h.done) U.toast('Отлично!');
        });
      },
      onSubmit(d) {
        if (isNew) {
          h = { id: U.uid(), created: Date.now(), log: [], kind: d.kind };
          if (d.kind === 'steps') h.steps = String(d.steps || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean).map((text) => ({ id: U.uid(), text, done: false }));
          S().hobbies.push(h);
        }
        h.name = d.name; h.icon = d.icon || 'target'; h.note = d.note; h.deadline = d.deadline;
        if (h.kind !== 'steps') { h.target = Number(d.target) || 1; h.unit = d.unit; }
        Store.save(); App.render();
      },
    });
  }

  function logModal(h) {
    App.modal({
      title: h.name,
      body:
        '<div class="row"><label>Сколько добавить' + (h.unit ? ' (' + U.esc(h.unit) + ')' : '') + '<input name="amount" type="number" step="any" min="0.01" value="1" required></label>' +
        '<label>День<input name="day" type="date" value="' + U.dayKey(Date.now()) + '" max="' + U.dayKey(Date.now()) + '"></label></div>' +
        '<label>Что сделала (необязательно)<input name="note" maxlength="140" placeholder="например, дочитала «Мастера и Маргариту»"></label>' +
        (h.log.length ? '<details><summary>История (' + h.log.length + ')</summary><ul class="hobby-log full">' +
          h.log.slice().sort((a, b) => b.ts - a.ts).map((l) => '<li><span class="muted">' + U.dateLabel(l.ts) + '</span> <b>+' + fmt(l.amount) + '</b> ' + U.esc(l.note || '') +
          ' <button type="button" class="icon-btn small" data-del-log="' + l.id + '" aria-label="Удалить запись">' + I('x') + '</button></li>').join('') + '</ul></details>' : ''),
      submit: 'Отметить',
      onOpen(form, close) {
        form.querySelectorAll('[data-del-log]').forEach((b) => b.addEventListener('click', () => {
          h.log = h.log.filter((l) => l.id !== b.dataset.delLog);
          Store.save(); b.closest('li').remove(); App.render();
        }));
      },
      onSubmit(d) {
        const amount = Number(d.amount);
        if (!amount) return false;
        const isToday = d.day === U.dayKey(Date.now());
        h.log.push({ id: U.uid(), ts: isToday ? Date.now() : new Date(d.day + 'T12:00:00').getTime(), amount, note: d.note });
        checkDone(h);
        Store.save(); App.render();
        if (!h.done) U.toast('Записано! Ещё шаг к цели');
      },
    });
  }

  document.addEventListener('click', (e) => {
    if (!root || !root.contains(e.target)) return;
    const b = e.target.closest('[data-h]');
    if (!b || b.dataset.h === 'step') return;
    switch (b.dataset.h) {
      case 'new': hobbyModal(); break;
      case 'edit': hobbyModal(hobby(b.dataset.id)); break;
      case 'log': logModal(hobby(b.dataset.id)); break;
      case 'tab': showDone = b.dataset.v === '1'; App.render(); break;
    }
  });

  document.addEventListener('change', (e) => {
    if (!root || !root.contains(e.target) || e.target.dataset.h !== 'step') return;
    const h = hobby(e.target.dataset.id);
    const s = h && (h.steps || []).find((x) => x.id === e.target.dataset.step);
    if (!s) return;
    s.done = e.target.checked;
    s.doneAt = s.done ? Date.now() : null;
    checkDone(h);
    if (h.done && !s.done) { h.done = false; h.doneAt = null; }
    Store.save(); App.render();
  });

  document.addEventListener('submit', (e) => {
    if (!root || !root.contains(e.target) || !e.target.classList.contains('add-step')) return;
    e.preventDefault();
    const h = hobby(e.target.dataset.hobby);
    const text = U.formData(e.target).text;
    if (!h || !text) return;
    h.steps = h.steps || [];
    h.steps.push({ id: U.uid(), text, done: false });
    if (h.done) { h.done = false; h.doneAt = null; }
    Store.save(); App.render();
    const inp = root.querySelector('.add-step[data-hobby="' + h.id + '"] input');
    if (inp) inp.focus();
  });

  App.views.hobby = { render, leave() { root = null; } };
})();
