// Игра: опыт (XP) за всё полезное, уровни, ежедневные задания и достижения.
// Опыт считается из уже записанных данных, поэтому его нельзя «потерять».
(function () {
  'use strict';

  const App = window.App = window.App || {};
  function S() { return Store.state; }
  function g() { const st = S(); st.game = st.game || { quests: {}, achievements: {} }; st.game.quests = st.game.quests || {}; st.game.achievements = st.game.achievements || {}; return st.game; }

  const TITLES = [[1, 'Новичок'], [3, 'Ученица'], [5, 'Исследовательница'], [8, 'Мастер фокуса'], [12, 'Мудрая сова'], [16, 'Легенда кабинета']];

  // Сколько раз сегодня/всего повторены карточки — считает раздел «Карточки»
  App.countReview = function () {
    const st = S();
    st.reviews = st.reviews || {};
    const k = U.dayKey(Date.now());
    st.reviews[k] = (st.reviews[k] || 0) + 1;
  };

  function dayFilter(list, key, field) { return list.filter((x) => U.dayKey(x[field || 'ts']) === key); }

  // Факты о дне — из них считаются задания
  function dayFacts(key) {
    const st = S();
    const from = new Date(key + 'T00:00:00').getTime();
    const min = Stats.sum(Stats.inRange(from, U.addDays(from, 1))) / 60;
    const plan = st.plan.filter((b) => b.day === key);
    return {
      minutes: min,
      goalMet: Stats.goalSec() > 0 && min * 60 >= Stats.goalSec(),
      reviews: (st.reviews || {})[key] || 0,
      lessons: st.lessons.history.filter((h) => U.dayKey(h.ts) === key).length,
      mood: st.mood.filter((m) => m.day === key).length,
      planDone: plan.filter((b) => b.done).length,
      planTotal: plan.length,
      // любое упражнение для себя (дыхание, дневник, самопознание…), кроме уроков
      breath: st.practice.filter((p) => U.dayKey(p.ts) === key && p.type !== 'lesson').length,
      journal: dayFilter(st.journal, key).length,
      read: st.texts.filter((t) => t.readAt && U.dayKey(t.readAt) === key).length,
      hobby: st.hobbies.reduce((n, h) => n + h.log.filter((l) => U.dayKey(l.ts) === key).length + (h.steps || []).filter((s) => s.doneAt && U.dayKey(s.doneAt) === key).length, 0),
      reflection: (st.reflections || []).filter((r) => r.day === key).length,
    };
  }

  const QUESTS = [
    { id: 'focus25', text: 'Позанимайся с таймером 25 минут', done: (f) => f.minutes >= 25, prog: (f) => Math.min(25, Math.floor(f.minutes)) + '/25 мин' },
    { id: 'goal', text: 'Набери дневную цель с таймером', done: (f) => f.goalMet, need: () => Stats.goalSec() > 0, prog: (f) => Math.floor(f.minutes) + '/' + Math.round(Stats.goalSec() / 60) + ' мин', href: '#/' },
    { id: 'cards10', text: 'Повтори 10 карточек', done: (f) => f.reviews >= 10, prog: (f) => Math.min(10, f.reviews) + '/10', need: () => S().decks.length > 0, href: '#/cards' },
    { id: 'lesson', text: 'Пройди урок, тренировку или тест', done: (f) => f.lessons >= 1, href: '#/lessons' },
    { id: 'mood', text: 'Отметь самочувствие', done: (f) => f.mood >= 1, href: '#/mind' },
    { id: 'mood2', text: 'Отметь самочувствие дважды (утром и вечером)', done: (f) => f.mood >= 2, prog: (f) => Math.min(2, f.mood) + '/2', href: '#/mind' },
    { id: 'plan2', text: 'Выполни 2 блока плана', done: (f) => f.planDone >= 2, prog: (f) => Math.min(2, f.planDone) + '/2', href: '#/plan' },
    { id: 'breath', text: 'Сделай любое упражнение для себя', done: (f) => f.breath >= 1, href: '#/mind' },
    { id: 'read', text: 'Дочитай текст на английском', done: (f) => f.read >= 1, href: '#/read' },
    { id: 'hobby', text: 'Сделай шаг в хобби', done: (f) => f.hobby >= 1, need: () => S().hobbies.some((h) => !h.done), href: '#/hobby' },
    { id: 'reflect', text: 'Ответь на вопрос дня', done: (f) => f.reflection >= 1, href: '#/mind' },
  ];

  // 3 задания на день: одно «про время» + два по очереди из остальных (одинаковые весь день)
  App.questsFor = function (key) {
    const saved = g().quests[key];
    if (saved && saved.ids) return saved.ids.map((id) => QUESTS.find((q) => q.id === id)).filter(Boolean);
    let seed = 0;
    for (const ch of key) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const first = Stats.goalSec() > 0 && seed % 2 ? 'goal' : 'focus25';
    const pool = QUESTS.filter((q) => q.id !== 'focus25' && q.id !== 'goal' && (!q.need || q.need()));
    const pick = [];
    while (pick.length < 2 && pool.length) { seed = (seed * 1103515245 + 12345) >>> 0; pick.push(pool.splice(seed % pool.length, 1)[0]); }
    const list = [QUESTS.find((q) => q.id === first)].concat(pick);
    if (key === U.dayKey(Date.now())) { g().quests[key] = { ids: list.map((q) => q.id), done: [] }; Store.saveSoon(); }
    return list;
  };

  // ---------- Опыт ----------

  App.xpBreakdown = function () {
    const st = S();
    const minutes = Math.floor(st.sessions.reduce((a, s) => a + s.sec, 0) / 60);
    const reviews = Object.values(st.reviews || {}).reduce((a, b) => a + b, 0);
    const questsDone = Object.values(g().quests).reduce((a, q) => a + ((q && q.done) || []).length, 0);
    const parts = {
      'Время с таймером': minutes,
      'Уроки и тесты': st.lessons.xp || 0,
      'Карточки': reviews * 2,
      'План': st.plan.filter((b) => b.done).length * 5,
      'Самочувствие': st.mood.length * 3 + st.practice.filter((p) => p.type !== 'lesson').length * 5 + st.journal.length * 5 + (st.reflections || []).length * 5,
      'Хобби': st.hobbies.reduce((n, h) => n + h.log.length * 5 + (h.steps || []).filter((s) => s.done).length * 5, 0),
      'Чтение': st.texts.filter((t) => t.read).length * 15,
      'Задания дня': questsDone * 20,
    };
    return { parts, total: Object.values(parts).reduce((a, b) => a + b, 0) };
  };

  App.playerLevel = function () {
    const xp = App.xpBreakdown().total;
    let lvl = 1, need = 100, left = xp;
    while (left >= need) { left -= need; lvl++; need += 50; }
    const title = TITLES.filter(([l]) => lvl >= l).pop()[1];
    return { lvl, cur: left, need, xp, title };
  };

  // ---------- Достижения ----------

  const ACH = [
    { id: 'first-timer', icon: 'timer', name: 'Первый шаг', desc: 'Записать первое время с таймером', ok: () => S().sessions.length >= 1 },
    { id: 'hours10', icon: 'clock', name: '10 часов фокуса', desc: 'Набрать 10 часов с таймером', ok: () => S().sessions.reduce((a, s) => a + s.sec, 0) >= 36000 },
    { id: 'hours50', icon: 'trophy', name: '50 часов фокуса', desc: 'Набрать 50 часов с таймером', ok: () => S().sessions.reduce((a, s) => a + s.sec, 0) >= 180000 },
    { id: 'streak3', icon: 'flame', name: 'Разгон', desc: 'Серия 3 дня подряд', ok: () => Stats.streak().best >= 3 },
    { id: 'streak7', icon: 'flame', name: 'Неделя огня', desc: 'Серия 7 дней подряд', ok: () => Stats.streak().best >= 7 },
    { id: 'streak30', icon: 'star', name: 'Месяц силы', desc: 'Серия 30 дней подряд', ok: () => Stats.streak().best >= 30 },
    { id: 'cards100', icon: 'cards', name: 'Сотня повторений', desc: 'Повторить 100 карточек', ok: () => Object.values(S().reviews || {}).reduce((a, b) => a + b, 0) >= 100 },
    { id: 'lesson1', icon: 'sparkles', name: 'Первый урок', desc: 'Пройти урок, тест или тренировку', ok: () => S().lessons.history.length >= 1 },
    { id: 'perfect', icon: 'star', name: 'Без единой ошибки', desc: 'Пройти урок на 100%', ok: () => S().lessons.history.some((h) => h.kind !== 'placement' && h.total && h.score === h.total) },
    { id: 'reader5', icon: 'book', name: 'Книжный червь', desc: 'Прочитать 5 текстов', ok: () => S().texts.filter((t) => t.read).length >= 5 },
    { id: 'plan100', icon: 'check-circle', name: 'Всё по плану', desc: 'Выполнить весь план дня (от 3 блоков)', ok: () => { const by = {}; S().plan.forEach((b) => { const d = by[b.day] || (by[b.day] = [0, 0]); d[1]++; if (b.done) d[0]++; }); return Object.values(by).some(([a, b]) => b >= 3 && a === b); } },
    { id: 'mood14', icon: 'heart', name: 'Слышу себя', desc: '14 отметок самочувствия', ok: () => S().mood.length >= 14 },
    { id: 'calm', icon: 'wind', name: 'Спокойствие', desc: '10 упражнений для себя', ok: () => S().practice.filter((p) => p.type !== 'lesson').length >= 10 },
    { id: 'quests', icon: 'target', name: 'Охотница за заданиями', desc: 'Выполнить все 3 задания дня', ok: () => Object.values(g().quests).some((q) => q && q.done && q.done.length >= 3) },
    { id: 'why', icon: 'heart', name: 'Знаю зачем', desc: 'Записать своё «зачем»', ok: () => (S().why || []).length >= 1 },
  ];
  App.achievements = function () {
    const got = g().achievements;
    return ACH.map((a) => Object.assign({ got: got[a.id] || null }, a));
  };

  // Проверка: отметить выполненные задания и новые достижения (с уведомлением)
  App.checkGame = function () {
    const st = S();
    const key = U.dayKey(Date.now());
    const facts = dayFacts(key);
    const quests = App.questsFor(key);
    const rec = g().quests[key] || (g().quests[key] = { ids: quests.map((q) => q.id), done: [] });
    let changed = false;
    quests.forEach((q) => {
      if (q.done(facts) && !rec.done.includes(q.id)) { rec.done.push(q.id); changed = true; U.toast('Задание дня выполнено: «' + q.text + '» +20 XP'); }
    });
    ACH.forEach((a) => {
      if (!g().achievements[a.id]) {
        let ok = false;
        try { ok = a.ok(); } catch (e) { ok = false; }
        if (ok) { g().achievements[a.id] = Date.now(); changed = true; U.toast('Новое достижение: «' + a.name + '»!'); }
      }
    });
    const lvl = App.playerLevel().lvl;
    if (st.game.lastLevel && lvl > st.game.lastLevel) { U.toast('Новый уровень: ' + lvl + '! ' + App.playerLevel().title); if (window.Sound) Sound.chime('marimba'); }
    if (st.game.lastLevel !== lvl) { st.game.lastLevel = lvl; changed = true; }
    if (changed) Store.saveSoon();
    return { facts, quests, rec };
  };

  // Блок для главной
  App.gameCardHTML = function () {
    const { facts, quests, rec } = App.checkGame();
    const L = App.playerLevel();
    const doneCount = rec.done.length;
    return '<section class="card game-card-home">' +
      '<div class="gh-top"><div class="lp-level"><span>' + L.lvl + '</span><small>уровень</small></div>' +
      '<div class="lp-xp"><div class="lp-xp-row"><b>' + U.esc(L.title) + '</b><span class="muted small">' + L.cur + ' / ' + L.need + ' XP</span></div>' +
      '<div class="progress"><span style="width:' + (L.cur / L.need * 100) + '%"></span></div>' +
      '<span class="muted small">всего ' + L.xp + ' XP · <a href="#/stats">достижения ›</a></span></div></div>' +
      '<div class="quests"><div class="q-head"><b>Задания дня</b><span class="muted small">' + doneCount + ' из 3 · +20 XP за каждое</span></div>' +
      '<p class="muted small q-note">Отмечаются сами, когда выполнишь. Нажми на задание — откроется нужный раздел.</p>' +
      quests.map((q) => {
        const ok = rec.done.includes(q.id);
        const text = q.id === 'goal' ? 'Набери ' + Math.round(Stats.goalSec() / 60) + ' мин с таймером (дневная цель)' : q.text;
        return '<a class="quest' + (ok ? ' ok' : '') + '"' + (q.href && !ok ? ' href="' + q.href + '"' : '') + '><span class="q-check">' + (ok ? I('check') : '') + '</span>' +
          '<span class="q-text">' + U.esc(text) + '</span>' + (q.prog && !ok ? '<span class="muted small">' + q.prog(facts) + '</span>' : '') + '</a>';
      }).join('') + '</div></section>';
  };

  // Блок достижений для статистики
  App.achievementsHTML = function () {
    const list = App.achievements();
    const xp = App.xpBreakdown();
    return '<section class="card"><div class="card-head"><h2 class="h-ic">' + I('trophy') + ' Достижения</h2><span class="muted small">' + list.filter((a) => a.got).length + ' из ' + list.length + '</span></div>' +
      '<div class="ach-grid">' + list.map((a) => '<div class="ach' + (a.got ? ' got' : '') + '" title="' + U.esc(a.desc) + '"><span class="ach-icon">' + I(a.icon) + '</span><b>' + U.esc(a.name) + '</b><small>' + U.esc(a.desc) + '</small></div>').join('') + '</div>' +
      '<details class="xp-details"><summary class="muted small">Откуда опыт</summary><ul class="plain small">' +
      Object.entries(xp.parts).map(([k, v]) => '<li>' + U.esc(k) + ': <b>' + v + '</b> XP</li>').join('') + '</ul></details></section>';
  };
})();
