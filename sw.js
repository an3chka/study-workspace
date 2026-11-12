// Service worker: сохраняет файлы приложения, чтобы оно открывалось без интернета.
// При изменении файлов увеличь номер версии — тогда браузер скачает свежие.
const CACHE = 'kabinet-v30';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/icons.js', 'js/utils.js', 'js/store.js', 'js/ai.js', 'js/audio.js', 'js/timer.js', 'js/charts.js', 'js/stats-data.js', 'js/insights.js', 'js/game.js',
  'js/views/home.js', 'js/views/plan.js', 'js/views/calendar.js', 'js/views/stats.js', 'js/views/cards.js', 'js/views/read.js', 'js/views/lessons.js', 'js/views/theory.js', 'js/content/grammar.js', 'js/content/grammar2.js', 'js/content/placement.js', 'js/content/library.js', 'js/content/library-quiz.js', 'js/content/library2.js', 'js/content/vocab.js',
  'js/views/hobby.js', 'js/views/mind.js', 'js/views/settings.js', 'js/app.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Сначала пробуем сеть (чтобы видеть обновления), без сети — берём из кэша.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
  );
});
