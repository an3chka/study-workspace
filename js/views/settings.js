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
        '<label class="check"><input type="checkbox" name="autoTimer"' + (st.autoTimer !== false ? ' checked' : '') + '> Автотаймер: время уроков, тестов и тренировок записывается само</label>' +
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

      aiSection() +

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

  function aiSection() {
    const c = AI.cfg();
    const p = AI.PROVIDERS[c.provider];
    const used = Store.state.aiUsage && Store.state.aiUsage.day === U.dayKey(Date.now()) ? Store.state.aiUsage.n : 0;
    return '<section class="card ai-card"><div class="card-head"><h2 class="h-ic">' + I('sparkles') + ' Нейросеть</h2>' +
      '<span class="tag ' + (AI.ready() ? 'ok' : '') + '">' + (AI.ready() ? 'подключена' : 'не подключена') + '</span></div>' +
      '<p class="muted small">Нужна для уроков английского, объяснения слов в контексте и генерации карточек. Бесплатно: возьми ключ у одного из сервисов и вставь сюда. ' +
      'Ключ хранится только в этом браузере и не попадает в экспорт.</p>' +
      '<form id="ai-form" class="settings-form">' +
        '<label>Сервис<select name="provider">' + Object.keys(AI.PROVIDERS).map((k) => '<option value="' + k + '"' + (k === c.provider ? ' selected' : '') + '>' + AI.PROVIDERS[k].name + '</option>').join('') + '</select></label>' +
        (c.provider === 'gemini' ? '<p class="muted small">В России Gemini работает только через VPN. Если не открывается — выбери OpenRouter.</p>' : '') +
        (c.provider === 'openrouter' ? '<p class="muted small">Работает без VPN. Бесплатные модели: около 50 запросов в день (урок ≈ 2–4 запроса).</p>' : '') +
        (p.keyUrl ? '<ol class="plain small ai-steps"><li>Открой <a href="' + p.keyUrl + '" target="_blank" rel="noopener noreferrer">' + p.keyUrl.replace('https://', '') + '</a> и войди (можно через Google).</li>' +
          '<li>Нажми «Create key» / «Создать ключ» и скопируй его.</li><li>Вставь ключ в поле ниже и нажми «Проверить».</li></ol>' : '') +
        (c.provider === 'custom' ? '<label>Адрес (OpenAI-совместимый)<input name="baseUrl" value="' + U.esc(c.baseUrl || '') + '" placeholder="http://localhost:11434/v1"></label>' : '') +
        '<label>Ключ' + (c.provider === 'custom' ? ' (если нужен)' : '') + '<span class="inline-row"><input name="key" type="password" autocomplete="off" value="' + U.esc(c.key || '') + '" placeholder="вставь ключ сюда">' +
          '<button type="button" class="btn" data-s="ai-show">' + I('eye') + '</button></span></label>' +
        '<label>Модель<span class="inline-row"><select name="model"><option value="">' + U.esc(AI.model()) + ' (по умолчанию)</option>' +
          (c.models || []).map((m) => '<option value="' + U.esc(m.id) + '"' + (m.id === c.model ? ' selected' : '') + '>' + U.esc(m.label) + '</option>').join('') +
        '</select><button type="button" class="btn" data-s="ai-models">Загрузить список</button></span></label>' +
        '<div class="row-btns"><button type="button" class="btn primary" data-s="ai-test">Проверить подключение</button>' +
        (used ? '<span class="muted small">запросов сегодня: ' + used + '</span>' : '') + '</div>' +
        (c.lastTest ? '<div class="ai-status ' + (c.lastTest.ok ? 'ok' : 'bad') + '">' + I(c.lastTest.ok ? 'check-circle' : 'alert') +
          '<span>' + (c.lastTest.ok ? '<b>Работает!</b> Нейросеть ответила: «' + U.esc(c.lastTest.msg) + '»' : '<b>Не работает:</b> ' + U.esc(c.lastTest.msg)) +
          ' <small class="muted">(' + U.timeLabel(c.lastTest.ts) + ')</small></span></div>' : '') +
      '</form></section>';
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
    if (t.form && t.form.id === 'ai-form') {
      const c = AI.cfg();
      c.lastTest = null;
      if (t.name === 'provider') { c.provider = t.value; c.model = ''; c.models = []; c.autoModel = ''; }
      else { c[t.name] = t.value.trim(); if (t.name === 'key') c.autoModel = ''; }
      Store.save();
      if (t.name === 'provider' || t.name === 'key') App.render();
      return;
    }
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
    if (b.dataset.s === 'ai-show') {
      const inp = root.querySelector('#ai-form [name=key]');
      inp.type = inp.type === 'password' ? 'text' : 'password';
    }
    if (b.dataset.s === 'ai-models') {
      const list = await AI.run(b, () => AI.listModels());
      if (list) {
        AI.cfg().models = list.slice(0, 60);
        Store.save(); App.render();
        U.toast(list.length ? 'Нашлось моделей: ' + list.length : 'Подходящих моделей не нашлось');
      }
    }
    if (b.dataset.s === 'ai-test') {
      const c = AI.cfg();
      b.disabled = true;
      b.innerHTML = '<span class="spinner"></span> проверяю…';
      try {
        const r = await AI.test();
        c.lastTest = { ok: true, msg: String(r).slice(0, 60), ts: Date.now() };
        U.toast('Нейросеть отвечает — всё работает!');
      } catch (err) {
        c.lastTest = { ok: false, msg: err.message, ts: Date.now() };
      }
      Store.save();
      App.render();
    }
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
    if (root && (e.target.id === 'settings-form' || e.target.id === 'ai-form')) { e.preventDefault(); return; }
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
