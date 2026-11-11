// Раздел «Настройки»: цель, Pomodoro, тема, категории, архив, экспорт/импорт.
(function () {
  'use strict';

  const App = window.App = window.App || {};
  App.views = App.views || {};

  let root = null;
  function S() { return Store.state; }

  function render(el) {
    root = el;
    const st = S().settings;
    const archived = S().tasks.filter((t) => t.archived);
    const counts = 'задач: ' + S().tasks.length + ', записей времени: ' + S().sessions.length + ', колод: ' + S().decks.length + ', целей хобби: ' + S().hobbies.length;
    el.innerHTML =
      '<header class="page-head"><div><h1>Настройки</h1><p class="muted">Всё сохраняется автоматически</p></div></header>' +

      '<div class="grid-2">' +
      '<section class="card"><h2>Цель и таймер</h2><form id="settings-form" class="settings-form">' +
        '<label>Дневная цель, минут<input type="number" name="dailyGoalMin" min="0" max="1440" value="' + st.dailyGoalMin + '"></label>' +
        '<p class="muted small">День засчитывается в серию, когда набрана цель.</p>' +
        '<div class="row3">' +
          '<label>Помидор, мин<input type="number" name="pomoWork" min="1" max="180" value="' + st.pomoWork + '"></label>' +
          '<label>Перерыв<input type="number" name="pomoBreak" min="1" max="60" value="' + st.pomoBreak + '"></label>' +
          '<label>Длинный<input type="number" name="pomoLong" min="1" max="90" value="' + st.pomoLong + '"></label>' +
        '</div>' +
        '<p class="muted small">Длинный перерыв — после каждого 4-го помидора.</p>' +
        '<label class="check"><input type="checkbox" name="pomoAutoBreak"' + (st.pomoAutoBreak ? ' checked' : '') + '> Перерыв начинается сам после помидора</label>' +
        '<label>Сигнал в конце помидора<span class="inline-row"><select name="chimeSound">' +
          Sound.chimes.map(([v, n]) => '<option value="' + v + '"' + (st.chimeSound === v ? ' selected' : '') + '>' + n + '</option>').join('') +
        '</select><button type="button" class="btn" data-s="test-chime">' + I('play') + ' Прослушать</button></span></label>' +
        '<label class="check"><input type="checkbox" name="autoTranslate"' + (st.autoTranslate ? ' checked' : '') + '> Автоперевод слов в «Чтении» (бесплатный сервис MyMemory, ему отправляется только слово)</label>' +
        '<label>Новых карточек в день (на колоду)<input type="number" name="newCardsPerDay" min="1" max="200" value="' + st.newCardsPerDay + '"></label>' +
        '<label>Тема<select name="theme">' +
          [['auto', 'Как в системе'], ['dark', 'Тёмная'], ['light', 'Светлая']].map(([v, n]) => '<option value="' + v + '"' + (st.theme === v ? ' selected' : '') + '>' + n + '</option>').join('') +
        '</select></label>' +
      '</form></section>' +

      '<section class="card"><h2>Категории</h2>' +
        '<ul class="cat-list">' + S().categories.map((c) => {
          const n = S().tasks.filter((t) => t.categoryId === c.id).length;
          return '<li><input type="color" value="' + c.color + '" data-cat-color="' + c.id + '" aria-label="Цвет категории ' + U.esc(c.name) + '">' +
            '<input value="' + U.esc(c.name) + '" maxlength="30" data-cat-name="' + c.id + '" aria-label="Название категории">' +
            '<span class="muted small">' + n + ' ' + U.plural(n, ['задача', 'задачи', 'задач']) + '</span>' +
            '<button class="icon-btn small" data-s="del-cat" data-id="' + c.id + '" aria-label="Удалить категорию"' + (S().categories.length <= 1 ? ' disabled' : '') + '>' + I('x') + '</button></li>';
        }).join('') + '</ul>' +
        '<form id="add-cat" class="add-task"><input name="name" placeholder="Новая категория" maxlength="30" required aria-label="Новая категория"><button class="btn">Добавить</button></form>' +
        (archived.length ? '<h3>Архив задач</h3><ul class="archive">' + archived.map((t) =>
          '<li><span>' + U.esc(t.name) + '</span><button class="btn small" data-s="unarchive" data-id="' + t.id + '">Вернуть</button></li>').join('') + '</ul>' : '') +
      '</section>' +
      '</div>' +

      '<section class="card"><h2>Данные</h2>' +
        '<p>Все данные хранятся <b>только в этом браузере</b> на этом устройстве (' + counts + '). ' +
        'На другом устройстве или в другом браузере будет пустой кабинет — перенести данные можно файлом.</p>' +
        '<div class="row-btns">' +
          '<button class="btn primary" data-s="export">' + I('download') + ' Экспорт в JSON</button>' +
          '<label class="btn">' + I('upload') + ' Импорт из JSON<input type="file" accept="application/json,.json" id="import-file" hidden></label>' +
          '<button class="btn ghost danger-text" data-s="reset">Стереть всё</button>' +
        '</div>' +
        '<p class="muted small">' + (st.lastBackup ? 'Последний экспорт: ' + U.dateLabel(st.lastBackup) + ' ' + new Date(st.lastBackup).getFullYear() : 'Резервных копий ещё не было') + '. Импорт заменяет текущие данные содержимым файла.</p>' +
      '</section>' +

      '<div class="grid-2">' +
      '<section class="card"><h2 class="h-ic">' + I('phone') + ' На телефон</h2>' +
        '<p>Открой сайт в браузере телефона и добавь на главный экран:</p>' +
        '<ul class="plain"><li><b>Android (Chrome):</b> меню ⋮ → «Добавить на гл. экран» / «Установить приложение».</li>' +
        '<li><b>iPhone (Safari):</b> кнопка «Поделиться» → «На экран «Домой»».</li></ul>' +
        '<p class="muted small">После этого кабинет открывается как приложение и работает без интернета.</p>' +
      '</section>' +
      '<section class="card"><h2 class="h-ic">' + I('keyboard') + ' Горячие клавиши</h2><ul class="plain keys">' +
        '<li><kbd>Пробел</kbd> старт/стоп последней задачи (раздел «Сегодня»)</li>' +
        '<li><kbd>M</kbd> включить/выключить звук</li>' +
        '<li><kbd>1</kbd>–<kbd>7</kbd> переход между разделами</li>' +
        '<li><kbd>←</kbd> <kbd>→</kbd> листать дни в плане</li>' +
        '<li><kbd>Пробел</kbd> перевернуть карточку, <kbd>1</kbd>–<kbd>4</kbd> оценка</li>' +
        '<li><kbd>←</kbd> <kbd>→</kbd> листать периоды в статистике</li>' +
        '<li><kbd>Esc</kbd> закрыть окно</li></ul></section>' +
      '</div>';
  }

  function download(name, text) {
    const blob = new Blob([text], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  document.addEventListener('change', (e) => {
    if (!root || !root.contains(e.target)) return;
    const t = e.target;
    const st = S().settings;
    if (t.form && t.form.id === 'settings-form') {
      if (t.type === 'checkbox') st[t.name] = t.checked;
      else if (t.type === 'number') {
        const v = Number(t.value);
        if (!isNaN(v) && v >= Number(t.min || 0)) st[t.name] = v; else t.value = st[t.name];
      } else st[t.name] = t.value;
      Store.save();
      if (t.name === 'theme') App.applyTheme();
      if (t.name === 'chimeSound') Sound.chime(t.value);
      U.toast('Сохранено');
      return;
    }
    if (t.dataset.catColor) {
      const c = S().categories.find((x) => x.id === t.dataset.catColor);
      if (c) { c.color = t.value; Store.save(); }
    }
    if (t.dataset.catName) {
      const c = S().categories.find((x) => x.id === t.dataset.catName);
      if (c && t.value.trim()) { c.name = t.value.trim(); Store.save(); } else if (c) t.value = c.name;
    }
    if (t.id === 'import-file' && t.files[0]) {
      const file = t.files[0];
      App.confirm('Заменить текущие данные содержимым файла «' + file.name + '»? Сначала лучше сделать экспорт текущих.', 'Импортировать').then((ok) => {
        if (!ok) { t.value = ''; return; }
        file.text().then((text) => {
          try {
            Store.importJSON(text);
            App.applyTheme();
            Timer.emit();
            U.toast('Данные загружены');
          } catch (err) {
            U.toast('Не получилось импортировать: ' + err.message);
          }
        });
      });
    }
  });

  document.addEventListener('click', async (e) => {
    if (!root || !root.contains(e.target)) return;
    const b = e.target.closest('[data-s]');
    if (!b) return;
    const id = b.dataset.id;
    if (b.dataset.s === 'export') {
      S().settings.lastBackup = Date.now();
      Store.save();
      download('рабочий-кабинет-' + U.dayKey(Date.now()) + '.json', Store.exportJSON());
      App.render();
    }
    if (b.dataset.s === 'test-chime') {
      Sound.chime(root.querySelector('[name=chimeSound]').value);
    }
    if (b.dataset.s === 'reset') {
      if (await App.confirm('Стереть ВСЕ данные: задачи, время, карточки, цели? Это нельзя отменить. Сначала сделай экспорт, если данные нужны.', 'Стереть всё')) {
        Store.reset(); App.applyTheme(); Timer.emit(); U.toast('Всё стёрто');
      }
    }
    if (b.dataset.s === 'unarchive') {
      const t = Store.task(id);
      if (t) { t.archived = false; Store.save(); App.render(); }
    }
    if (b.dataset.s === 'del-cat') {
      const c = S().categories.find((x) => x.id === id);
      const tasks = S().tasks.filter((t) => t.categoryId === id);
      const rest = S().categories.filter((x) => x.id !== id);
      if (!c || !rest.length) return;
      if (await App.confirm('Удалить категорию «' + c.name + '»?' + (tasks.length ? ' Её задачи (' + tasks.length + ') перейдут в «' + rest[0].name + '».' : ''), 'Удалить')) {
        tasks.forEach((t) => { t.categoryId = rest[0].id; });
        S().categories = rest;
        Store.save(); App.render();
      }
    }
  });

  document.addEventListener('submit', (e) => {
    if (root && e.target.id === 'settings-form') { e.preventDefault(); return; }
    if (!root || e.target.id !== 'add-cat') return;
    e.preventDefault();
    const name = U.formData(e.target).name;
    if (!name) return;
    const palette = ['#7fa8f0', '#f2a0c4', '#b49af0', '#72c9a8', '#f5b98a', '#8fd0e8', '#e8c46f', '#e59ad8'];
    S().categories.push({ id: U.uid(), name, color: palette[S().categories.length % palette.length] });
    Store.save(); App.render();
  });

  App.views.settings = { render, leave() { root = null; } };
})();
