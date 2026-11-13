// Личные материалы — файлы, которые не публикуются (папка private/ в .gitignore).
// 1) Сайт открыт с этого компьютера (localhost) — файлы из private/ подхватываются сами.
// 2) На опубликованном сайте файл можно подключить в «Настройках»: он хранится только в этом браузере
//    (отдельно от остальных данных, в экспорт не попадает) и никуда не отправляется.
(function () {
  'use strict';
  const App = window.App = window.App || {};
  const KEY = 'kabinet-private-v1';
  const LOCAL_FILES = ['private/course.js', 'private/ml-track.js'];

  function run(code, name) {
    try { new Function(code)(); return true; }
    catch (e) { console.warn('Личный файл «' + name + '» не подключился:', e); return false; }
  }
  function stored() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; }
  }

  App.privateFiles = () => stored().map((f) => ({ name: f.name, size: f.code.length, ts: f.ts }));
  App.privateLocal = [];
  App.addPrivateFile = function (name, code) {
    if (!run(code, name)) return false;
    const list = stored().filter((f) => f.name !== name);
    list.push({ name, code, ts: Date.now() });
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { return false; }
    if (App.render) App.render();
    return true;
  };
  App.removePrivateFiles = function () {
    localStorage.removeItem(KEY);
    location.reload();
  };

  const saved = stored();
  saved.forEach((f) => run(f.code, f.name));
  if (saved.length && App.render) App.render();

  // Локальный запуск: пробуем папку private/ (на опубликованном сайте её нет — даже не запрашиваем)
  if (!saved.length && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) {
    LOCAL_FILES.reduce((p, file) => p.then(() => fetch(file, { cache: 'no-store' })
      .then((r) => (r.ok ? r.text() : null))
      .then((code) => { if (code && run(code, file)) App.privateLocal.push(file); })
      .catch(() => {})), Promise.resolve())
      .then(() => { if (App.privateLocal.length && App.render) App.render(); });
  }
})();
