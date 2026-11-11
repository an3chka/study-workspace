// Хранилище данных: всё лежит в localStorage браузера под одним ключом.
(function () {
  'use strict';

  const KEY = 'study-workspace-v1';
  const VERSION = 1;

  const DEFAULT_CATEGORIES = [
    { id: 'lang', name: 'Языки', color: '#7fa8f0' },
    { id: 'study', name: 'Учёба', color: '#b49af0' },
    { id: 'hobby', name: 'Хобби', color: '#f2a0c4' },
    { id: 'sport', name: 'Спорт', color: '#72c9a8' },
    { id: 'other', name: 'Другое', color: '#f5b98a' },
  ];

  function defaults() {
    return {
      version: VERSION,
      categories: DEFAULT_CATEGORIES.map((c) => Object.assign({}, c)),
      tasks: [],
      sessions: [],          // записи времени: {id, taskId, start, end, sec, kind}
      active: null,          // запущенный таймер (переживает перезагрузку)
      settings: {
        dailyGoalMin: 60,
        pomoWork: 25,
        pomoBreak: 5,
        pomoLong: 15,
        pomoAutoBreak: true,
        theme: 'auto',
        newCardsPerDay: 20,
        chimeSound: 'marimba',
        autoTranslate: true,
      },
      sound: { master: 0.7, levels: {} },
      decks: [],
      hobbies: [],
      texts: [],             // тексты для чтения
      plan: [],              // блоки плана дня: {id, day, start, end, title, taskId, done}
      mood: [],              // отметки самочувствия
      journal: [],           // записи: благодарности, разгрузка мыслей
      practice: [],          // выполненные упражнения
      lessons: { level: '', lang: 'en-US', history: [], mistakes: [], xp: 0 }, // уроки с нейросетью
      known: {},             // знакомые слова по языкам: {'en-US': ['the', ...]}
    };
  }

  // Дополняет загруженные данные недостающими полями (на случай старых версий/импорта).
  function normalize(data) {
    const base = defaults();
    if (!data || typeof data !== 'object') return base;
    const out = Object.assign(base, data);
    out.settings = Object.assign(defaults().settings, data.settings || {});
    if (out.settings.chime === false) { out.settings.chimeSound = 'none'; }
    delete out.settings.chime;
    out.sound = Object.assign(defaults().sound, data.sound || {});
    ['categories', 'tasks', 'sessions', 'decks', 'hobbies', 'texts', 'plan', 'mood', 'journal', 'practice'].forEach((k) => {
      if (!Array.isArray(out[k])) out[k] = base[k];
    });
    if (!out.known || typeof out.known !== 'object' || Array.isArray(out.known)) out.known = {};
    out.lessons = Object.assign({ level: '', lang: 'en-US', history: [], mistakes: [], xp: 0 }, out.lessons && typeof out.lessons === 'object' ? out.lessons : {});
    if (!out.categories.length) out.categories = defaults().categories;
    out.decks.forEach((d) => { if (!Array.isArray(d.cards)) d.cards = []; });
    out.hobbies.forEach((h) => { if (!Array.isArray(h.log)) h.log = []; });
    out.version = VERSION;
    return out;
  }

  let state;
  try {
    state = normalize(JSON.parse(localStorage.getItem(KEY)));
  } catch (e) {
    console.warn('Не удалось прочитать данные, начинаем с чистого листа', e);
    state = defaults();
  }

  const listeners = new Set();
  let saveTimer = null;

  const Store = {
    get state() { return state; },

    // Сохранить сразу (используем после важных действий).
    save() {
      clearTimeout(saveTimer);
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch (e) {
        U.toast('Не получилось сохранить данные: ' + e.message);
      }
      listeners.forEach((fn) => fn());
    },

    // Сохранить «чуть позже» — для частых мелких изменений (например, громкость).
    saveSoon() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
      }, 400);
    },

    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    category(id) {
      return state.categories.find((c) => c.id === id) || { id: 'none', name: 'Без категории', color: '#8a8f98' };
    },
    task(id) { return state.tasks.find((t) => t.id === id); },

    exportJSON() {
      // Ключ нейросети в файл не попадает — файлом могут поделиться.
      const copy = JSON.parse(JSON.stringify(state));
      if (copy.settings && copy.settings.ai) copy.settings.ai.key = '';
      return JSON.stringify(Object.assign({ exportedAt: new Date().toISOString() }, copy), null, 2);
    },

    importJSON(text) {
      const data = JSON.parse(text);
      if (!data || typeof data !== 'object' || !Array.isArray(data.tasks)) {
        throw new Error('Это не похоже на файл рабочего кабинета');
      }
      delete data.exportedAt;
      // Не затираем свой ключ нейросети пустым из файла
      const myAi = state.settings && state.settings.ai;
      state = normalize(data);
      if (myAi && myAi.key && (!state.settings.ai || !state.settings.ai.key)) state.settings.ai = Object.assign({}, state.settings.ai || {}, { key: myAi.key });
      Store.save();
    },

    reset() {
      state = defaults();
      Store.save();
    },
  };

  // Если данные поменялись в другой вкладке — подхватываем их.
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY || !e.newValue) return;
    try {
      state = normalize(JSON.parse(e.newValue));
      listeners.forEach((fn) => fn());
    } catch (err) { /* ignore */ }
  });

  window.Store = Store;
})();
