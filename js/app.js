// Главный файл: переключение разделов, нижняя панель (таймер + плеер), окна, горячие клавиши.
// Раздел меняется без перезагрузки страницы — поэтому музыка и таймер не прерываются.
(function () {
  'use strict';

  const App = window.App = window.App || {};
  App.views = App.views || {};

  const viewEl = document.getElementById('view');
  let current = null;

  // ---------- Разделы ----------

  function routeName() {
    const h = location.hash.replace(/^#\/?/, '').split('/')[0];
    return App.views[h] ? h : 'home';
  }

  App.render = function () {
    const name = routeName();
    const view = App.views[name];
    if (current && current !== view && current.leave) current.leave();
    current = view;
    // Сохраняем прокрутку, если перерисовываем тот же раздел
    const y = window.scrollY;
    view.render(viewEl);
    if (App._lastRoute === name) window.scrollTo(0, y); else window.scrollTo(0, 0);
    App._lastRoute = name;
    document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('active', a.dataset.route === (view.group || name)));
    renderSidebarStreak();
  };

  window.addEventListener('hashchange', App.render);

  // ---------- Мини-таймер в нижней панели ----------

  const dockTimer = document.getElementById('dock-timer');

  function renderDockTimer() {
    const d = Timer.display();
    if (!d) { dockTimer.hidden = true; return; }
    dockTimer.hidden = false;
    dockTimer.className = 'dock-timer phase-' + d.phase + (d.waiting ? ' waiting' : '');
    dockTimer.innerHTML =
      '<span class="dt-dot"></span>' +
      '<span class="dt-name" title="' + U.esc(d.name) + '">' + U.esc(d.name) + '</span>' +
      '<span class="dt-label">' + U.esc(d.label) + '</span>' +
      '<span class="dt-time">' + d.time + '</span>' +
      (d.waiting ? '<button class="btn small primary" data-dock="resume">Продолжить</button>' : '') +
      '<button class="btn small" data-dock="stop" title="Остановить и записать">' + I('stop') + ' Стоп</button>';
  }

  dockTimer.addEventListener('click', (e) => {
    const b = e.target.closest('[data-dock]');
    if (!b) return;
    if (b.dataset.dock === 'stop') Timer.stop();
    if (b.dataset.dock === 'resume') Timer.resume();
  });

  Timer.onChange((kind) => {
    renderDockTimer();
    if (kind === 'tick') {
      if (current && current.tick) current.tick();
    } else {
      App.render();
    }
  });

  // ---------- Плеер и микшер ----------

  const P = {
    toggle: document.getElementById('player-toggle'),
    title: document.getElementById('player-title'),
    sub: document.getElementById('player-sub'),
    vol: document.getElementById('player-vol'),
    mixer: document.getElementById('mixer'),
  };

  P.vol.value = Sound.master;
  P.vol.addEventListener('input', () => Sound.setMaster(Number(P.vol.value)));

  P.toggle.addEventListener('click', () => {
    if (Sound.anyPlaying()) { Sound.rememberCurrent(); Sound.stopAll(); } else Sound.resumeLast();
  });

  function toggleMixer(force) {
    const open = typeof force === 'boolean' ? force : P.mixer.hidden;
    P.mixer.hidden = !open;
    if (open) renderMixer();
  }
  document.getElementById('player-open').addEventListener('click', () => toggleMixer());
  document.getElementById('player-mixer').addEventListener('click', () => toggleMixer());
  document.addEventListener('click', (e) => {
    if (!P.mixer.hidden && !e.target.closest('#dock')) toggleMixer(false);
  });

  function renderPlayer() {
    const on = Sound.tracks.filter((t) => Sound.isPlaying(t.id));
    const loading = Sound.tracks.some((t) => Sound.isLoading(t.id) && Sound.isPlaying(t.id));
    P.toggle.innerHTML = on.length ? I('pause') : I('play');
    P.toggle.classList.toggle('on', on.length > 0);
    P.title.textContent = on.length ? on.map((t) => t.name).join(' + ') : 'Фоновые звуки';
    P.sub.textContent = loading ? 'готовлю звук…' : on.length ? 'играет' : 'нажми, чтобы выбрать';
    if (!P.mixer.hidden) renderMixer();
  }

  function renderMixer() {
    P.mixer.innerHTML =
      '<div class="mixer-head"><strong>Микшер звуков</strong><span class="muted small">можно включить несколько сразу</span>' +
      '<button class="icon-btn" data-mix="close" aria-label="Закрыть">' + I('x') + '</button></div>' +
      '<div class="mixer-list">' + Sound.tracks.map((t) => {
        const on = Sound.isPlaying(t.id);
        const loading = Sound.isLoading(t.id);
        return '<div class="mix-row' + (on ? ' on' : '') + '">' +
          '<button class="mix-btn" data-mix="toggle" data-id="' + t.id + '" aria-pressed="' + on + '">' +
          '<span class="mix-icon">' + I(t.icon) + '</span><span><b>' + t.name + '</b><small>' + (loading && on ? 'готовлю… (пара секунд)' : t.desc) + '</small></span></button>' +
          '<input type="range" min="0" max="1" step="0.01" value="' + Sound.level(t.id) + '" data-mix="level" data-id="' + t.id + '" aria-label="Громкость: ' + t.name + '">' +
          '</div>';
      }).join('') + '</div>' +
      '<p class="muted small mixer-note">Все звуки создаются кодом прямо в браузере (Web Audio API) — без чужих записей.</p>';
  }

  P.mixer.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mix]');
    if (!b) return;
    if (b.dataset.mix === 'close') toggleMixer(false);
    if (b.dataset.mix === 'toggle') { Sound.toggle(b.dataset.id); setTimeout(Sound.rememberCurrent, 50); }
  });
  P.mixer.addEventListener('input', (e) => {
    if (e.target.dataset.mix === 'level') Sound.setLevel(e.target.dataset.id, Number(e.target.value));
  });

  Sound.onChange(renderPlayer);

  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.setActionHandler('play', () => Sound.resumeLast());
      navigator.mediaSession.setActionHandler('pause', () => { Sound.rememberCurrent(); Sound.stopAll(); });
    } catch (e) { /* ignore */ }
  }

  // ---------- Окна (модальные) ----------

  const modalRoot = document.getElementById('modal-root');

  // App.modal({title, body, submit, onSubmit(data, form) → false чтобы не закрывать})
  App.modal = function (o) {
    modalRoot.innerHTML =
      '<div class="modal-backdrop"><form class="modal" role="dialog" aria-modal="true" aria-label="' + U.esc(o.title) + '">' +
      '<div class="modal-head"><h2>' + U.esc(o.title) + '</h2><button type="button" class="icon-btn" data-close aria-label="Закрыть">' + I('x') + '</button></div>' +
      '<div class="modal-body">' + o.body + '</div>' +
      '<div class="modal-foot">' + (o.extra || '') + '<span class="spacer"></span>' +
      '<button type="button" class="btn" data-close>Отмена</button>' +
      '<button type="submit" class="btn ' + (o.danger ? 'danger' : 'primary') + '">' + U.esc(o.submit || 'Сохранить') + '</button></div>' +
      '</form></div>';
    const form = modalRoot.querySelector('form');
    const close = () => { modalRoot.innerHTML = ''; };
    modalRoot.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close));
    modalRoot.querySelector('.modal-backdrop').addEventListener('mousedown', (e) => { if (e.target.classList.contains('modal-backdrop')) close(); });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (o.onSubmit && o.onSubmit(U.formData(form), form) === false) return;
      close();
    });
    if (o.onOpen) o.onOpen(form, close);
    const first = form.querySelector('input:not([type=hidden]):not([type=color]), textarea, select');
    if (first) setTimeout(() => first.focus(), 30);
    return { form, close };
  };

  App.confirm = function (text, okText) {
    return new Promise((resolve) => {
      let ok = false;
      const m = App.modal({ title: 'Подтверди действие', body: '<p>' + U.esc(text) + '</p>', submit: okText || 'Удалить', danger: true, onSubmit: () => { ok = true; } });
      const obs = new MutationObserver(() => { if (!modalRoot.contains(m.form)) { obs.disconnect(); resolve(ok); } });
      obs.observe(modalRoot, { childList: true });
    });
  };

  App.closeModal = () => { modalRoot.innerHTML = ''; };

  // ---------- Горячие клавиши ----------

  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
    if (e.key === 'Escape') { App.closeModal(); toggleMixer(false); document.querySelectorAll('.word-pop').forEach((n) => n.remove()); return; }
    if (modalRoot.innerHTML || e.ctrlKey || e.metaKey || e.altKey) return;
    if (current && current.key && current.key(e) === true) { e.preventDefault(); return; }
    if (e.key === 'm' || e.key === 'ь') { P.toggle.click(); e.preventDefault(); }
    const routes = { '1': '#/', '2': '#/plan', '3': '#/stats', '4': '#/cards', '5': '#/hobby', '6': '#/mind', '7': '#/settings' };
    if (routes[e.key]) { location.hash = routes[e.key]; e.preventDefault(); }
  });

  // ---------- Тема ----------

  App.applyTheme = function () {
    const t = Store.state.settings.theme;
    if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t;
    else delete document.documentElement.dataset.theme;
  };

  // ---------- Серия в боковой панели ----------

  function renderSidebarStreak() {
    const el = document.getElementById('sidebar-streak');
    const s = Stats.streak();
    el.innerHTML = '<div class="streak-mini' + (s.todayDone ? ' done' : '') + '">' + I('flame') + ' <b>' + s.current + '</b> ' +
      U.plural(s.current, ['день', 'дня', 'дней']) + ' подряд</div>' +
      (App.playerLevel ? '<div class="level-mini">' + I('star') + ' уровень <b>' + App.playerLevel().lvl + '</b> · ' + U.esc(App.playerLevel().title) + '</div>' : '');
  }

  // ---------- Напоминание о резервной копии ----------

  function backupReminder() {
    const st = Store.state;
    const last = st.settings.lastBackup || 0;
    const hasData = st.sessions.length > 10 || st.decks.length || st.hobbies.length;
    if (hasData && Date.now() - last > 14 * 86400000 && Date.now() - (st.settings.backupNag || 0) > 3 * 86400000) {
      st.settings.backupNag = Date.now();
      Store.saveSoon();
      setTimeout(() => U.toast('Давно не было резервной копии. Настройки → «Экспорт» сохранит все данные в файл.'), 1500);
    }
  }

  // ---------- Офлайн-режим (PWA) ----------

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Service worker не установлен', e));
    });
  }

  // Предупреждаем перед закрытием, только если играет музыка (таймер и так сохранится).
  window.addEventListener('beforeunload', (e) => {
    if (Sound.anyPlaying()) { e.preventDefault(); e.returnValue = ''; }
  });

  let gameTimer = null;
  Store.onChange(() => {
    App.applyTheme();
    // Проверяем задания и достижения (с небольшой задержкой, чтобы не на каждое сохранение)
    clearTimeout(gameTimer);
    gameTimer = setTimeout(() => { if (App.checkGame) { App.checkGame(); renderSidebarStreak(); } }, 800);
  });

  // ---------- Запуск ----------
  // Иконки в статичной разметке (меню, плеер)
  document.querySelectorAll('[data-icon]').forEach((el) => { el.innerHTML = I(el.dataset.icon); });
  App.applyTheme();
  renderPlayer();
  renderDockTimer();
  Timer.tick();
  App.render();
  backupReminder();

  // Через пару секунд после загрузки заранее готовим последние включённые звуки.
  const prep = () => Sound.prepare(Store.state.sound.last || []);
  if ('requestIdleCallback' in window) requestIdleCallback(() => setTimeout(prep, 1500)); else setTimeout(prep, 3000);
})();
