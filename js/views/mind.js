// Раздел «Самочувствие»: отметки настроения/энергии/стресса, график, упражнения, дневник.
// Это не замена специалисту — просто инструмент, чтобы замечать своё состояние.
(function () {
  'use strict';

  const App = window.App = window.App || {};
  App.views = App.views || {};

  const MOODS = ['', '😣', '😕', '😐', '🙂', '😄'];
  const MOOD_TXT = ['', 'очень плохо', 'так себе', 'нормально', 'хорошо', 'отлично'];
  const TAGS = ['учёба', 'спорт', 'прогулка', 'друзья', 'семья', 'творчество', 'выспалась', 'не выспалась', 'много соцсетей', 'кофе', 'дедлайн', 'отдых'];

  const EXERCISES = [
    { id: 'box', icon: '🟦', name: 'Дыхание «квадрат»', desc: 'вдох 4 · пауза 4 · выдох 4 · пауза 4. Успокаивает и собирает внимание', kind: 'breath', phases: [['Вдох', 4, 'in'], ['Задержка', 4, 'hold'], ['Выдох', 4, 'out'], ['Пауза', 4, 'hold']], cycles: 6 },
    { id: '478', icon: '🌙', name: 'Дыхание 4-7-8', desc: 'вдох 4 · задержка 7 · медленный выдох 8. Помогает расслабиться и уснуть', kind: 'breath', phases: [['Вдох носом', 4, 'in'], ['Задержка', 7, 'hold'], ['Выдох ртом', 8, 'out']], cycles: 4 },
    { id: 'calm', icon: '🍃', name: 'Спокойное дыхание', desc: 'вдох 4 · выдох 6. Длинный выдох снижает тревогу', kind: 'breath', phases: [['Вдох', 4, 'in'], ['Выдох', 6, 'out']], cycles: 10 },
    { id: 'ground', icon: '🖐️', name: 'Заземление 5-4-3-2-1', desc: 'вернуться «сюда и сейчас», когда накрывает тревога', kind: 'steps', steps: [
      ['👀', 'Назови 5 вещей, которые ты видишь'], ['✋', 'Найди 4 вещи, которых можешь коснуться'], ['👂', 'Прислушайся: 3 звука вокруг'],
      ['👃', '2 запаха, которые чувствуешь (или любимых)'], ['👅', '1 вкус — или сделай глоток воды'], ['💛', 'Сделай медленный вдох и выдох. Ты здесь, ты справляешься.']] },
    { id: 'body', icon: '🧘‍♀️', name: 'Пауза для тела', desc: '2 минуты: разминка после долгого сидения', kind: 'timed', steps: [
      ['🙆‍♀️', 'Потянись вверх, как после сна', 20], ['🔄', 'Покрути плечами вперёд и назад', 20], ['↔️', 'Медленные наклоны головы вправо-влево', 20],
      ['✊', 'Сожми и разожми кулаки, покрути кистями', 20], ['🔭', 'Посмотри вдаль, дай глазам отдохнуть', 20], ['💧', 'Выпей воды', 20]] },
    { id: 'gratitude', icon: '🌼', name: 'Три хороших вещи', desc: 'запиши 3 вещи, за которые благодарна сегодня', kind: 'journal' },
    { id: 'thoughts', icon: '🗒️', name: 'Разгрузка мыслей', desc: 'выгрузи то, что крутится в голове, и найди один маленький шаг', kind: 'journal' },
  ];

  let root = null;
  let ex = null;      // текущее упражнение
  let exTimers = [];

  function S() { return Store.state; }

  function stopEx() { exTimers.forEach((t) => { clearTimeout(t); clearInterval(t); }); exTimers = []; }

  function logPractice(type, sec) {
    S().practice.push({ id: U.uid(), ts: Date.now(), type, sec: Math.round(sec || 0) });
    Store.save();
  }

  // ---------- Подсчёты ----------

  // Средние значения по дням за последние n дней
  function daily(n) {
    const today = U.startOfDay(Date.now());
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = U.addDays(today, -i);
      const k = U.dayKey(d);
      const list = S().mood.filter((m) => m.day === k);
      const avg = (f) => list.length ? Math.round(list.reduce((a, m) => a + m[f], 0) / list.length * 10) / 10 : null;
      out.push({ day: k, label: String(new Date(d).getDate()), title: U.dateLabel(d), mood: avg('mood'), energy: avg('energy'), stress: avg('stress') });
    }
    return out;
  }

  // Что влияет на настроение: среднее в дни с тегом против дней без него.
  App.moodInsights = function () {
    const byDay = {};
    S().mood.forEach((m) => {
      const d = byDay[m.day] || (byDay[m.day] = { sum: 0, n: 0, tags: new Set() });
      d.sum += m.mood; d.n++;
      (m.tags || []).forEach((t) => d.tags.add(t));
    });
    const days = Object.values(byDay).map((d) => ({ mood: d.sum / d.n, tags: d.tags }));
    if (days.length < 5) return [];
    const res = [];
    TAGS.concat(Array.from(new Set(S().mood.flatMap((m) => m.tags || [])))).forEach((tag) => {
      if (res.some((r) => r.tag === tag)) return;
      const yes = days.filter((d) => d.tags.has(tag));
      const no = days.filter((d) => !d.tags.has(tag));
      if (yes.length < 3 || no.length < 2) return;
      const a = yes.reduce((s, d) => s + d.mood, 0) / yes.length;
      const b = no.reduce((s, d) => s + d.mood, 0) / no.length;
      if (Math.abs(a - b) >= 0.4) res.push({ tag, diff: Math.round((a - b) * 10) / 10, n: yes.length });
    });
    return res.sort((x, y) => Math.abs(y.diff) - Math.abs(x.diff)).slice(0, 4);
  };

  // ---------- Экраны ----------

  function render(el) {
    root = el;
    if (ex) return renderExercise(el);
    const today = U.dayKey(Date.now());
    const todays = S().mood.filter((m) => m.day === today).sort((a, b) => b.ts - a.ts);
    const pts = daily(30);
    const hasData = pts.some((p) => p.mood != null);
    const insights = App.moodInsights();
    const lowStreak = pts.slice(-4).filter((p) => p.mood != null && p.mood <= 2).length >= 3;
    const journal = S().journal.slice().sort((a, b) => b.ts - a.ts).slice(0, 6);
    const practicedToday = S().practice.filter((p) => U.dayKey(p.ts) === today).length;

    el.innerHTML =
      '<header class="page-head"><div><h1>Самочувствие</h1><p class="muted">Замечай, как ты, — и бережно заботься о себе</p></div></header>' +

      (lowStreak ? '<div class="card soft-alert">💛 Последние дни были тяжёлыми. Попробуй упражнение ниже, сделай перерыв или поговори с кем-то близким. ' +
        'Если плохо долго — это нормальный повод обратиться к психологу. В экстренной ситуации звони <b>112</b>.</div>' : '') +

      '<div class="grid-2">' +
      '<section class="card"><h2>Как ты сейчас?</h2>' +
        '<form id="mood-form" class="mood-form">' +
          scale('mood', 'Настроение', [1, 2, 3, 4, 5].map((v) => [v, MOODS[v], MOOD_TXT[v]]), 0) +
          scale('energy', 'Энергия', [1, 2, 3, 4, 5].map((v) => [v, String(v), ['', 'нет сил', 'мало', 'средне', 'бодро', 'полна сил'][v]]), 0) +
          scale('stress', 'Тревога / стресс', [1, 2, 3, 4, 5].map((v) => [v, String(v), ['', 'спокойно', 'чуть-чуть', 'заметно', 'сильно', 'очень сильно'][v]]), 0) +
          '<div class="tags-pick">' + TAGS.map((t) => '<label class="chip-check"><input type="checkbox" name="tag" value="' + U.esc(t) + '"><span>' + U.esc(t) + '</span></label>').join('') + '</div>' +
          '<div class="row"><label>Сон, часов<input type="number" name="sleep" min="0" max="24" step="0.5" placeholder="например, 7.5"></label><span></span></div>' +
          '<textarea name="note" rows="2" maxlength="500" placeholder="Пара слов о дне (необязательно)" aria-label="Заметка"></textarea>' +
          '<button class="btn primary">Сохранить отметку</button>' +
        '</form>' +
        (todays.length ? '<h3>Сегодня</h3><ul class="mood-today">' + todays.map((m) =>
          '<li><span class="mood-emoji">' + MOODS[m.mood] + '</span><span class="muted small">' + U.timeLabel(m.ts) + '</span>' +
          '<span class="small">энергия ' + m.energy + ' · стресс ' + m.stress + (m.sleep ? ' · сон ' + m.sleep + ' ч' : '') + (m.tags && m.tags.length ? ' · ' + U.esc(m.tags.join(', ')) : '') + '</span>' +
          (m.note ? '<span class="small mood-note">' + U.esc(m.note) + '</span>' : '') +
          '<button class="icon-btn small" data-m="del-mood" data-id="' + m.id + '" aria-label="Удалить отметку">✕</button></li>').join('') + '</ul>' : '') +
      '</section>' +

      '<section class="card"><div class="card-head"><h2>Упражнения</h2>' + (practicedToday ? '<span class="tag ok">сегодня: ' + practicedToday + '</span>' : '') + '</div>' +
        '<div class="ex-list">' + EXERCISES.map((e) =>
          '<button class="ex-item" data-m="ex" data-id="' + e.id + '"><span class="ex-icon">' + e.icon + '</span><span><b>' + e.name + '</b><small>' + e.desc + '</small></span></button>').join('') +
        '</div></section>' +
      '</div>' +

      '<section class="card"><div class="card-head"><h2>Последние 30 дней</h2>' +
        (hasData ? '<span class="legend small"><span><i style="background:var(--accent)"></i>настроение</span><span><i style="background:var(--good)"></i>энергия</span><span><i style="background:var(--bad)"></i>стресс</span></span>' : '') + '</div>' +
        (hasData ? Charts.line(pts, { min: 1, max: 5, label: 'Настроение, энергия и стресс по дням', series: [
          { key: 'mood', name: 'настроение', color: 'var(--accent)' }, { key: 'energy', name: 'энергия', color: 'var(--good)' }, { key: 'stress', name: 'стресс', color: 'var(--bad)' }] })
          : '<p class="empty">Отмечай самочувствие хотя бы раз в день — здесь появится график.</p>') +
        (insights.length ? '<h3>Что связано с твоим настроением</h3><ul class="insights">' + insights.map((i) =>
          '<li>' + (i.diff > 0 ? '⬆️' : '⬇️') + ' В дни с «' + U.esc(i.tag) + '» настроение в среднем ' + (i.diff > 0 ? 'выше' : 'ниже') + ' на <b>' + Math.abs(i.diff) + '</b> <span class="muted small">(' + i.n + ' ' + U.plural(i.n, ['день', 'дня', 'дней']) + ')</span></li>').join('') +
          '</ul><p class="muted small">Это корреляция, а не доказательство — но хороший повод присмотреться.</p>' :
          (hasData ? '<p class="muted small">Отмечай теги («прогулка», «не выспалась»…) — через неделю-две здесь появится, что влияет на настроение.</p>' : '')) +
      '</section>' +

      (journal.length ? '<section class="card"><h2>Дневник</h2><ul class="journal">' + journal.map((j) =>
        '<li><div class="j-head"><span>' + (j.type === 'gratitude' ? '🌼 Три хороших вещи' : '🗒️ Разгрузка мыслей') + '</span><span class="muted small">' + U.dateLabel(j.ts) + '</span>' +
        '<button class="icon-btn small" data-m="del-journal" data-id="' + j.id + '" aria-label="Удалить запись">✕</button></div>' +
        '<div class="j-text">' + U.esc(j.text).replace(/\n/g, '<br>') + '</div></li>').join('') + '</ul></section>' : '') +

      '<p class="hint muted small">Записи хранятся только в этом браузере. Это не медицинский инструмент: если тебе долго плохо — обратись к специалисту.</p>';
  }

  function scale(name, label, items) {
    return '<fieldset class="scale"><legend>' + label + '</legend><div class="scale-row">' + items.map(([v, face, title]) =>
      '<label title="' + U.esc(title) + '"><input type="radio" name="' + name + '" value="' + v + '"' + (v === 3 ? ' checked' : '') + '><span>' + face + '</span></label>').join('') +
      '</div><div class="scale-ends muted small"><span>' + U.esc(items[0][2]) + '</span><span>' + U.esc(items[items.length - 1][2]) + '</span></div></fieldset>';
  }

  // ---------- Упражнения ----------

  function renderExercise(el) {
    const e = ex.def;
    let body = '';
    if (e.kind === 'breath') {
      body =
        '<div class="breath"><div class="breath-circle" id="breath-circle"></div><div class="breath-text"><b id="breath-phase">Готова?</b><span id="breath-count"></span></div></div>' +
        '<p class="muted center" id="breath-cycle">' + e.cycles + ' ' + U.plural(e.cycles, ['цикл', 'цикла', 'циклов']) + ' · примерно ' + Math.round(e.cycles * e.phases.reduce((a, p) => a + p[1], 0) / 60 * 10) / 10 + ' мин</p>' +
        '<div class="row-btns"><button class="btn primary big" data-m="breath-start" id="breath-btn">▶ Начать</button></div>';
    } else if (e.kind === 'steps' || e.kind === 'timed') {
      const st = e.steps[ex.step];
      body =
        '<div class="ex-step"><div class="ex-step-icon">' + st[0] + '</div><p class="ex-step-text">' + U.esc(st[1]) + '</p>' +
        (e.kind === 'timed' ? '<div class="timer-time small-time" id="step-time">' + (ex.left != null ? ex.left : st[2]) + '</div>' : '') +
        '<p class="muted">Шаг ' + (ex.step + 1) + ' из ' + e.steps.length + '</p>' +
        '<div class="progress"><span style="width:' + ((ex.step) / e.steps.length * 100) + '%"></span></div></div>' +
        '<div class="row-btns">' + (ex.step > 0 ? '<button class="btn" data-m="step-prev">‹ Назад</button>' : '') +
        (e.kind === 'timed' && !ex.running ? '<button class="btn primary big" data-m="timed-start">▶ Начать</button>' :
          '<button class="btn primary big" data-m="step-next">' + (ex.step === e.steps.length - 1 ? 'Готово ✓' : 'Дальше ›') + '</button>') + '</div>';
    } else if (e.id === 'gratitude') {
      body = '<form id="journal-form" class="journal-form"><p class="muted">Даже мелочи считаются: вкусный кофе, солнце, сообщение от друга.</p>' +
        [1, 2, 3].map((i) => '<input name="g' + i + '" maxlength="200" placeholder="' + i + '. Я благодарна за…" ' + (i === 1 ? 'required' : '') + '>').join('') +
        '<button class="btn primary">Сохранить</button></form>';
    } else {
      body = '<form id="journal-form" class="journal-form">' +
        '<label>Что сейчас крутится в голове? Пиши как есть, без фильтра.<textarea name="worry" rows="5" maxlength="2000" required></textarea></label>' +
        '<label>Что из этого зависит от меня?<textarea name="control" rows="2" maxlength="600"></textarea></label>' +
        '<label>Один маленький шаг, который я могу сделать сегодня<input name="step" maxlength="200" placeholder="например, написать преподавателю"></label>' +
        '<button class="btn primary">Сохранить и выдохнуть</button></form>';
    }
    el.innerHTML =
      '<div class="exercise"><div class="study-top"><button class="link-btn" data-m="ex-close">‹ Назад</button><span class="muted">' + e.icon + ' ' + e.name + '</span><span></span></div>' +
      '<div class="card ex-card"><p class="muted center">' + e.desc + '</p>' + body + '</div></div>';
  }

  function finishExercise(sec) {
    const e = ex.def;
    stopEx();
    logPractice(e.id, sec);
    ex = null;
    App.render();
    U.toast('Готово 💛 Отметь, как ты сейчас, — так будет видно, что помогает.');
    const f = root && root.querySelector('#mood-form');
    if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function startBreath() {
    const e = ex.def;
    const circle = root.querySelector('#breath-circle');
    const phaseEl = root.querySelector('#breath-phase');
    const countEl = root.querySelector('#breath-count');
    const cycleEl = root.querySelector('#breath-cycle');
    const btn = root.querySelector('#breath-btn');
    btn.textContent = '■ Закончить';
    btn.dataset.m = 'breath-stop';
    btn.classList.remove('primary');
    const started = Date.now();
    let cycle = 0, pi = 0;
    function phase() {
      if (!ex || !root || !root.contains(circle)) return;
      if (pi >= e.phases.length) { pi = 0; cycle++; }
      if (cycle >= e.cycles) { finishExercise((Date.now() - started) / 1000); return; }
      const [name, dur, kind] = e.phases[pi];
      phaseEl.textContent = name;
      cycleEl.textContent = 'Цикл ' + (cycle + 1) + ' из ' + e.cycles;
      circle.style.transitionDuration = dur + 's';
      if (kind === 'in') circle.classList.add('big');
      if (kind === 'out') circle.classList.remove('big');
      circle.dataset.kind = kind;
      let left = dur;
      countEl.textContent = left;
      const iv = setInterval(() => { left--; if (left > 0) countEl.textContent = left; }, 1000);
      exTimers.push(iv);
      exTimers.push(setTimeout(() => { clearInterval(iv); pi++; phase(); }, dur * 1000));
    }
    phase();
    ex.started = started;
  }

  function startTimedStep() {
    const e = ex.def;
    ex.running = true;
    ex.started = ex.started || Date.now();
    const run = () => {
      ex.left = e.steps[ex.step][2];
      App.render();
      const iv = setInterval(() => {
        if (!ex) return clearInterval(iv);
        ex.left--;
        const t = root && root.querySelector('#step-time');
        if (t) t.textContent = Math.max(0, ex.left);
        if (ex.left <= 0) {
          clearInterval(iv);
          if (ex.step >= e.steps.length - 1) { finishExercise((Date.now() - ex.started) / 1000); return; }
          ex.step++;
          if (window.Sound) Sound.chime('wood');
          run();
        }
      }, 1000);
      exTimers.push(iv);
    };
    run();
  }

  // ---------- События ----------

  document.addEventListener('click', async (e) => {
    if (!root || !root.contains(e.target)) return;
    const b = e.target.closest('[data-m]');
    if (!b) return;
    switch (b.dataset.m) {
      case 'ex': ex = { def: EXERCISES.find((x) => x.id === b.dataset.id), step: 0, started: Date.now() }; App.render(); window.scrollTo(0, 0); break;
      case 'ex-close': stopEx(); ex = null; App.render(); break;
      case 'breath-start': startBreath(); break;
      case 'breath-stop': finishExercise((Date.now() - (ex.started || Date.now())) / 1000); break;
      case 'timed-start': startTimedStep(); break;
      case 'step-prev': stopEx(); ex.running = false; ex.left = null; ex.step = Math.max(0, ex.step - 1); App.render(); break;
      case 'step-next':
        if (ex.step >= ex.def.steps.length - 1) { finishExercise((Date.now() - ex.started) / 1000); break; }
        stopEx(); ex.step++;
        if (ex.def.kind === 'timed') startTimedStep(); else App.render();
        break;
      case 'del-mood': S().mood = S().mood.filter((m) => m.id !== b.dataset.id); Store.save(); App.render(); break;
      case 'del-journal':
        if (await App.confirm('Удалить запись из дневника?')) { S().journal = S().journal.filter((j) => j.id !== b.dataset.id); Store.save(); App.render(); }
        break;
    }
  });

  document.addEventListener('submit', (e) => {
    if (!root || !root.contains(e.target)) return;
    if (e.target.id === 'mood-form') {
      e.preventDefault();
      const fd = new FormData(e.target);
      const m = {
        id: U.uid(), ts: Date.now(), day: U.dayKey(Date.now()),
        mood: Number(fd.get('mood')) || 3, energy: Number(fd.get('energy')) || 3, stress: Number(fd.get('stress')) || 3,
        sleep: Number(fd.get('sleep')) || null, tags: fd.getAll('tag'), note: String(fd.get('note') || '').trim(),
      };
      S().mood.push(m);
      Store.save(); App.render();
      U.toast(m.mood <= 2 ? 'Записала. Береги себя 💛 — может, упражнение справа?' : 'Записано ' + MOODS[m.mood]);
    }
    if (e.target.id === 'journal-form') {
      e.preventDefault();
      const d = U.formData(e.target);
      let text;
      if (ex.def.id === 'gratitude') text = [d.g1, d.g2, d.g3].filter(Boolean).map((x, i) => (i + 1) + '. ' + x).join('\n');
      else text = d.worry + (d.control ? '\n\nЗависит от меня: ' + d.control : '') + (d.step ? '\nМаленький шаг: ' + d.step : '');
      S().journal.push({ id: U.uid(), ts: Date.now(), type: ex.def.id, text });
      finishExercise((Date.now() - ex.started) / 1000);
    }
  });

  App.views.mind = {
    render,
    leave() { stopEx(); ex = null; root = null; },
  };
})();
