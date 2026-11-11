// Небольшие вспомогательные функции, которыми пользуются все разделы.
(function () {
  'use strict';

  const U = {};

  // Экранирование текста перед вставкой в HTML (защита от «поломки» вёрстки).
  U.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  U.uid = function () {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  };

  U.pad = (n) => String(n).padStart(2, '0');

  // Ключ дня в локальном времени: «2026-11-11».
  U.dayKey = function (ts) {
    const d = new Date(ts);
    return d.getFullYear() + '-' + U.pad(d.getMonth() + 1) + '-' + U.pad(d.getDate());
  };

  U.startOfDay = function (ts) {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  U.addDays = function (ts, n) {
    const d = new Date(ts);
    d.setDate(d.getDate() + n);
    return d.getTime();
  };

  // Неделя начинается с понедельника.
  U.startOfWeek = function (ts) {
    const d = new Date(U.startOfDay(ts));
    const wd = (d.getDay() + 6) % 7; // 0 = понедельник
    d.setDate(d.getDate() - wd);
    return d.getTime();
  };

  U.startOfMonth = function (ts) {
    const d = new Date(ts);
    return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  };

  U.addMonths = function (ts, n) {
    const d = new Date(ts);
    return new Date(d.getFullYear(), d.getMonth() + n, 1).getTime();
  };

  // 3725 сек → «01:02:05»
  U.clock = function (sec) {
    sec = Math.max(0, Math.floor(sec));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return (h ? U.pad(h) + ':' : '') + U.pad(m) + ':' + U.pad(s);
  };

  // 3725 сек → «1 ч 2 мин»
  U.human = function (sec) {
    sec = Math.round(sec || 0);
    if (sec < 60) return sec > 0 ? '< 1 мин' : '0 мин';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (!h) return m + ' мин';
    return h + ' ч' + (m ? ' ' + m + ' мин' : '');
  };

  U.MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля',
    'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  U.MONTHS_NOM = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль',
    'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  U.WD = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  U.dateLabel = function (ts) {
    const d = new Date(ts);
    return d.getDate() + ' ' + U.MONTHS[d.getMonth()];
  };

  U.timeLabel = function (ts) {
    const d = new Date(ts);
    return U.pad(d.getHours()) + ':' + U.pad(d.getMinutes());
  };

  U.weekday = function (ts) {
    return U.WD[(new Date(ts).getDay() + 6) % 7];
  };

  // Склонение: plural(5, ['день','дня','дней']) → «дней»
  U.plural = function (n, forms) {
    const a = Math.abs(n) % 100;
    const b = a % 10;
    if (a > 10 && a < 20) return forms[2];
    if (b > 1 && b < 5) return forms[1];
    if (b === 1) return forms[0];
    return forms[2];
  };

  // Всплывающее уведомление внизу экрана.
  U.toast = function (text) {
    const box = document.getElementById('toasts');
    if (!box) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = text;
    box.appendChild(t);
    setTimeout(() => t.classList.add('hide'), 2600);
    setTimeout(() => t.remove(), 3100);
  };

  // Собирает значения полей формы в объект.
  U.formData = function (form) {
    const out = {};
    new FormData(form).forEach((v, k) => { out[k] = typeof v === 'string' ? v.trim() : v; });
    return out;
  };

  window.U = U;
})();
