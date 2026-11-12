// Раздел «Языки → Уроки»: короткие игровые уроки от нейросети, которые подстраиваются под уровень.
//
// Как подстраивается: в запрос к нейросети уходят твой уровень (A1–C1), темы прошлых уроков,
// последние ошибки и слова из карточек, которые тебе даются трудно. После урока по результатам
// приложение предлагает повысить или понизить уровень.
(function () {
  'use strict';

  const App = window.App = window.App || {};
  App.views = App.views || {};

  const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
  const LEVEL_TXT = { A1: 'начальный', A2: 'элементарный', B1: 'средний', B2: 'выше среднего', C1: 'продвинутый' };
  const FOCUS = [['mix', 'Смешанный'], ['grammar', 'Грамматика'], ['vocab', 'Слова'], ['speak', 'Разговорные фразы']];
  const HEARTS = 3;

  let root = null;
  let game = null;     // текущий урок
  let focus = 'mix';

  function S() { return Store.state; }
  function P() { return S().lessons; }
  function langName() { return App.langName ? App.langName(P().lang) : 'Английский'; }

  // ---------- Подготовка запроса ----------

  function weakWords() {
    const words = [];
    S().decks.forEach((d) => {
      if (d.lang && d.lang !== P().lang) return;
      d.cards.forEach((c) => { if ((c.lapses || 0) > 0 || ((c.reps || 0) > 0 && (c.interval || 0) < 4)) words.push(c.front); });
    });
    return words.slice(-12);
  }

  function lessonPrompt(o) {
    const prof = P();
    const recent = prof.history.slice(-8).map((h) => h.title).filter(Boolean);
    const mistakes = (o.review ? prof.mistakes.slice(-15) : prof.mistakes.slice(-6)).map((m) => '«' + m.q + '» → правильно: ' + m.right);
    const words = weakWords();
    const focusTxt = { mix: 'смешанный (грамматика + слова)', grammar: 'грамматика', vocab: 'словарный запас', speak: 'разговорные фразы и живая речь' }[o.focus || 'mix'];
    return 'Язык: ' + langName() + '. Уровень ученицы: ' + (prof.level || 'A2') + '.\n' +
      (o.review ? 'Это урок РАБОТЫ НАД ОШИБКАМИ: построй все задания на этих ошибках (похожие, но не те же самые предложения):\n' + mistakes.join('\n') + '\n'
        : 'Тема: ' + (o.topic ? '«' + o.topic + '»' : 'выбери сама полезную тему для этого уровня, не повторяя недавние') + '. Фокус: ' + focusTxt + '.\n' +
          (recent.length ? 'Недавние уроки (не повторяй): ' + recent.join('; ') + '.\n' : '') +
          (mistakes.length ? 'Недавние ошибки (можно вплести 1-2 задания на них): ' + mistakes.join('; ') + '.\n' : '') +
          (words.length ? 'Слова, которые ей трудно даются (используй 2-4 из них): ' + words.join(', ') + '.\n' : '')) +
      'Составь урок из 9 заданий: 3 типа "choice", 2 типа "gap", 1 типа "order", 1 типа "error", 1 типа "translate", 1 типа "open". Задания — по возрастанию сложности, живые примеры из жизни студентки.\n' +
      'В "choice" делай ловушки: среди неверных вариантов — типичные ошибки русскоговорящих (калька с русского, лишний артикль, «I am agree» и т.п.), а в "explain" объясняй, в чём ловушка.\n' +
      '"error" — предложение с ОДНОЙ ошибкой, которую надо найти и исправить. "open" — либо вопрос на рассуждение «почему так, а не иначе?» (kind: "why"), либо творческое задание: написать 2-3 своих предложения с темой урока (kind: "creative").\n' +
      'Верни JSON строго такого вида:\n' +
      '{"title": "название урока по-русски", "intro": "объяснение темы по-русски, 2-4 коротких предложения, с 1-2 примерами", "exercises": [\n' +
      ' {"type": "choice", "question": "вопрос или предложение с пропуском ___", "options": ["вариант1", "вариант2", "вариант3", "вариант4"], "answer": 0, "explain": "почему так, по-русски, 1 предложение"},\n' +
      ' {"type": "gap", "sentence": "предложение с одним пропуском ___", "answer": "правильное слово", "accept": ["допустимые варианты"], "hint": "подсказка по-русски", "explain": "почему, по-русски"},\n' +
      ' {"type": "order", "translation": "перевод на русский", "answer": "правильное предложение на изучаемом языке из 4-9 слов"},\n' +
      ' {"type": "error", "sentence": "предложение с одной ошибкой", "answer": "исправленное предложение", "explain": "в чём была ошибка, по-русски"},\n' +
      ' {"type": "translate", "ru": "предложение по-русски", "answer": "эталонный перевод"},\n' +
      ' {"type": "open", "kind": "why" или "creative", "task": "задание по-русски", "sample": "пример хорошего ответа"}\n' +
      ']}';
  }

  const SYSTEM = 'Ты — добрая и точная преподавательница иностранных языков для русскоязычной студентки 3 курса. ' +
    'Пишешь задания без ошибок, объясняешь кратко и по-русски. Уровень заданий строго соответствует указанному.';

  // Приводим ответ нейросети к надёжному виду (выкидываем битые задания).
  function sanitize(lesson) {
    const ex = (lesson && Array.isArray(lesson.exercises) ? lesson.exercises : []).map((e) => {
      if (!e || !e.type) return null;
      if (e.type === 'choice') {
        const opts = (e.options || []).map(String).filter(Boolean);
        let ans = typeof e.answer === 'number' ? e.answer : opts.findIndex((x) => norm(x) === norm(e.answer));
        if (opts.length < 2 || ans < 0 || ans >= opts.length || !e.question) return null;
        // перемешиваем варианты, чтобы правильный не был всегда первым
        const order = shuffle(opts.map((_, i) => i));
        return { type: 'choice', question: String(e.question), options: order.map((i) => opts[i]), answer: order.indexOf(ans), explain: e.explain || '', level: e.level, topic: e.topic };
      }
      if (e.type === 'gap') {
        if (!e.sentence || !e.answer || !/_{2,}/.test(e.sentence)) return null;
        return { type: 'gap', sentence: String(e.sentence), answer: String(e.answer), accept: [e.answer].concat(e.accept || []).map(norm), hint: e.hint || '', explain: e.explain || '', topic: e.topic };
      }
      if (e.type === 'order') {
        const words = String(e.answer || '').trim().split(/\s+/);
        if (words.length < 3) return null;
        let sh = shuffle(words.slice());
        if (sh.join(' ') === words.join(' ')) sh = sh.reverse();
        return { type: 'order', translation: String(e.translation || ''), answer: words.join(' '), words: sh };
      }
      if (e.type === 'translate') {
        if (!e.ru || !e.answer) return null;
        return { type: 'translate', ru: String(e.ru), answer: String(e.answer) };
      }
      if (e.type === 'error') {
        if (!e.sentence || !e.answer || norm(e.sentence) === norm(e.answer)) return null;
        return { type: 'error', sentence: String(e.sentence), answer: String(e.answer), explain: e.explain || '', topic: e.topic };
      }
      if (e.type === 'open') {
        if (!e.task) return null;
        return { type: 'open', kind: e.kind === 'why' ? 'why' : 'creative', task: String(e.task), sample: String(e.sample || ''), topic: e.topic };
      }
      return null;
    }).filter(Boolean);
    return { title: String((lesson && lesson.title) || 'Урок'), intro: String((lesson && lesson.intro) || ''), exercises: ex };
  }

  function norm(s) { return String(s == null ? '' : s).toLowerCase().replace(/[’`]/g, "'").replace(/[.,!?;:"«»]/g, '').replace(/\s+/g, ' ').trim(); }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // ---------- Запуск уроков ----------

  async function startLesson(btn, o) {
    if (!AI.ready() && !AI._mock) { U.toast('Подключи нейросеть: Настройки → «Нейросеть»'); location.hash = '#/settings'; return; }
    const r = await AI.run(btn, () => AI.ask({ json: true, temperature: 0.8, system: SYSTEM, prompt: lessonPrompt(o) }));
    if (!r) return;
    const lesson = sanitize(r);
    if (lesson.exercises.length < 3) { U.toast('Урок получился неполным. Попробуй ещё раз или выбери другую модель.'); return; }
    game = { kind: o.review ? 'review' : 'lesson', lesson, i: -1, hearts: HEARTS, xp: 0, combo: 0, right: 0, answered: null, mistakes: [], started: Date.now(), topicId: o.topicId };
    if (!lesson.intro) game.i = 0;
    openGame();
  }

  // Автотаймер: время урока само записывается в задачу по языку
  function langTask() {
    const st = S();
    const last = {};
    st.sessions.forEach((x) => { if (!last[x.taskId] || x.start > last[x.taskId]) last[x.taskId] = x.start; });
    const langTasks = st.tasks.filter((t) => !t.archived && t.categoryId === 'lang').sort((a, b) => (last[b.id] || 0) - (last[a.id] || 0));
    if (langTasks[0]) return langTasks[0];
    const t = { id: U.uid(), name: langName(), categoryId: 'lang', createdAt: Date.now(), goalMin: 0 };
    st.tasks.push(t);
    return t;
  }
  function autoTimerStart() {
    if (S().settings.autoTimer === false || S().active) return;
    const t = langTask();
    S().settings.lastTask = t.id;
    Timer.start(t.id, 'watch');
    game.autoTaskId = t.id;
  }
  function autoTimerStop() {
    if (game && game.autoTaskId && S().active && S().active.taskId === game.autoTaskId) Timer.stop(true);
    if (game) game.autoTaskId = null;
  }

  function openGame() {
    autoTimerStart();
    if (location.hash.startsWith('#/lessons')) App.render(); else location.hash = '#/lessons';
    window.scrollTo(0, 0);
  }

  // Встроенный тест на уровень — без нейросети, мгновенно
  function startPlacement() {
    const lesson = sanitize({ title: 'Тест на уровень', exercises: (window.PLACEMENT || []).map((q) => Object.assign({ type: 'choice' }, q)) });
    game = { kind: 'placement', lesson, i: 0, hearts: Infinity, xp: 0, combo: 0, right: 0, answered: null, mistakes: [], byLevel: {}, started: Date.now() };
    openGame();
  }

  // Тренировка по теме из «Теории» — тоже без нейросети
  App.startDrill = function (t) {
    const lesson = sanitize({ title: 'Тренировка: ' + t.title, intro: '', exercises: t.drill.map((x) => Object.assign({ topic: t.id }, x)) });
    game = { kind: 'drill', topicId: t.id, lesson, i: 0, hearts: HEARTS, xp: 0, combo: 0, right: 0, answered: null, mistakes: [], started: Date.now() };
    openGame();
  };

  // Вопросы на понимание текста (из «Чтения»)
  App.startQuiz = function (title, questions, onDone, backHref) {
    const lesson = sanitize({ title, intro: '', exercises: questions });
    if (!lesson.exercises.length) { U.toast('Вопросы получились неполными'); return; }
    game = { kind: 'quiz', lesson, i: 0, hearts: Infinity, xp: 0, combo: 0, right: 0, answered: null, mistakes: [], started: Date.now(), onDone, backHref: backHref || '#/read' };
    openGame();
  };

  // Урок от нейросети по теме из «Теории»
  App.startTopicLesson = function (btn, t) {
    startLesson(btn, { focus: 'grammar', topic: t.title + ' (' + t.summary + ')', topicId: t.id });
  };

  // ---------- Проверка ответов ----------

  function current() { return game && game.lesson.exercises[game.i]; }

  function answer(correct, mine, extra) {
    const e = current();
    game.answered = Object.assign({ correct, mine }, extra || {});
    if (game.kind === 'placement') {
      const lv = e.level || 'B1';
      const b = game.byLevel[lv] || (game.byLevel[lv] = { ok: 0, n: 0 });
      b.n++; if (correct) b.ok++;
    }
    if (correct) {
      game.right++; game.combo++;
      const gain = 10 + (game.combo >= 3 ? 5 : 0);
      game.xp += gain;
      game.answered.gain = gain;
    } else {
      game.combo = 0;
      if (game.kind !== 'placement' && !(extra && extra.unknown)) game.hearts--;
      game.mistakes.push({ q: e.question || e.sentence || e.translation || e.ru, right: rightText(e), mine: e.type === 'choice' && e.options[Number(mine)] != null ? e.options[Number(mine)] : String(mine || ''), explain: e.explain || '', topic: e.topic || game.topicId || '' });
    }
    App.render();
  }

  function rightText(e) {
    if (e.type === 'choice') return e.options[e.answer];
    if (e.type === 'gap') return e.sentence.replace(/_{2,}/, e.answer);
    if (e.type === 'open') return e.sample || '';
    return e.answer;
  }

  function next() {
    game.answered = null;
    game.picked = null;
    game.i++;
    if (game.hearts <= 0 || game.i >= game.lesson.exercises.length) finish();
    App.render();
    window.scrollTo(0, 0);
  }

  function finish() {
    autoTimerStop();
    const prof = P();
    const total = game.lesson.exercises.length;
    const done = Math.min(total, game.i);
    game.done = true;
    if (game.kind === 'placement') {
      // Уровень = самый высокий, где ≥60% верно, при условии что нижние уровни тоже в основном верны
      let level = 'A1';
      for (const lv of LEVELS) {
        const b = game.byLevel[lv];
        if (!b) continue;
        if (b.ok / b.n >= 0.6) level = lv; else break;
      }
      game.result = { level };
      prof.level = level;
      prof.weakTopics = Array.from(new Set(game.mistakes.map((m) => m.topic).filter(Boolean)));
      prof.history.push({ ts: Date.now(), title: 'Тест на уровень', score: game.right, total, xp: 0, kind: 'placement', level });
    } else {
      const perfect = game.right === total;
      if (perfect) game.xp += 20;
      const ratio = game.right / total;
      const stars = ratio >= 0.9 ? 3 : ratio >= 0.7 ? 2 : ratio >= 0.5 ? 1 : 0;
      prof.xp += game.xp;
      prof.history.push({ ts: Date.now(), title: game.lesson.title, score: game.right, total, xp: game.xp, kind: game.kind, level: prof.level || 'A2', stars });
      // запоминаем ошибки (последние 40)
      game.mistakes.forEach((m) => prof.mistakes.push(Object.assign({ ts: Date.now() }, m)));
      prof.mistakes = prof.mistakes.slice(-40);
      game.result = { stars, ratio, perfect, suggestion: game.kind === 'lesson' ? suggestLevel() : null, done, total };
      if (game.kind === 'quiz' && game.onDone) game.onDone(Math.round(ratio * 100));
      if (game.kind === 'drill' && game.topicId) {
        prof.theoryDone = prof.theoryDone || {};
        prof.theoryDone[game.topicId] = Math.max(prof.theoryDone[game.topicId] || 0, Math.round(ratio * 100));
      }
    }
    S().practice.push({ id: U.uid(), ts: Date.now(), type: 'lesson', sec: Math.round((Date.now() - game.started) / 1000) });
    Store.save();
    if (window.Sound) Sound.chime('marimba');
  }

  // Совет по уровню на основе последних уроков того же уровня.
  function suggestLevel() {
    const prof = P();
    const lv = prof.level || 'A2';
    const same = prof.history.filter((h) => h.kind === 'lesson' && h.level === lv).slice(-3);
    const idx = LEVELS.indexOf(lv);
    if (same.length >= 3 && same.every((h) => h.score / h.total >= 0.85) && idx < LEVELS.length - 1) return { dir: 'up', to: LEVELS[idx + 1] };
    const last2 = same.slice(-2);
    if (last2.length === 2 && last2.every((h) => h.score / h.total < 0.5) && idx > 0) return { dir: 'down', to: LEVELS[idx - 1] };
    return null;
  }

  // Проверка перевода — через нейросеть.
  // Свободный ответ (найди ошибку / почему / творческое) — проверяет нейросеть
  async function checkOpen(btn, mine) {
    const e = current();
    if (e.type === 'error' && norm(mine) === norm(e.answer)) return answer(true, mine);
    const what = e.type === 'error' ? 'Задание: найти и исправить ошибку в предложении "' + e.sentence + '". Правильный вариант: "' + e.answer + '".'
      : e.kind === 'why' ? 'Вопрос на рассуждение: ' + e.task + (e.sample ? '\nПример хорошего ответа: ' + e.sample : '') + '\nОценивай, поняла ли она суть, а не формулировку.'
        : 'Творческое задание: ' + e.task + '\nОценивай, выполнено ли задание и правильно ли использована тема; мелкие ошибки исправь, но засчитывай, если суть верна.';
    const r = await AI.run(btn, () => AI.ask({
      json: true, temperature: 0.3, system: SYSTEM,
      prompt: 'Проверь ответ ученицы (уровень ' + (P().level || 'A2') + ').\n' + what + '\nОтвет ученицы: "' + mine + '"\n' +
        'Верни JSON: {"correct": true/false, "feedback": "2-3 предложения по-русски: что хорошо и что улучшить", "better": "исправленный или улучшенный вариант её ответа"}',
    }));
    if (!r) {
      if (e.type === 'error') return answer(false, mine, { feedback: 'Нейросеть недоступна — сравнила с правильным вариантом.' });
      return answer(true, mine, { feedback: 'Нейросеть недоступна, поэтому засчитываю. Сравни свой ответ с примером ниже.', unknown: false });
    }
    answer(!!r.correct, mine, { feedback: r.feedback || '', better: r.better || '' });
  }

  async function checkTranslate(btn, mine) {
    const e = current();
    const r = await AI.run(btn, () => AI.ask({
      json: true, temperature: 0.2, system: SYSTEM,
      prompt: 'Проверь перевод ученицы (уровень ' + (P().level || 'A2') + ').\nПо-русски: "' + e.ru + '"\nЭталон: "' + e.answer + '"\nОтвет ученицы: "' + mine + '"\n' +
        'Засчитывай любые верные по смыслу и грамматике варианты, мелкие опечатки не считай ошибкой. ' +
        'Верни JSON: {"correct": true/false, "feedback": "1-2 предложения по-русски: что хорошо и что исправить", "better": "исправленный вариант ответа ученицы"}',
    }));
    if (!r) {
      // без нейросети: сравниваем с эталоном
      return answer(norm(mine) === norm(e.answer), mine, { feedback: 'Сравнила с эталоном.' });
    }
    answer(!!r.correct, mine, { feedback: r.feedback || '', better: r.better || '' });
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = P().lang || 'en-US'; u.rate = 0.9;
    speechSynthesis.speak(u);
  }

  // ---------- Экраны ----------

  function render(el) {
    root = el;
    if (game) return game.done ? renderResult(el) : renderGame(el);
    renderHome(el);
  }

  function levelOf(xp) {
    // Уровень игрока по опыту: каждый следующий требует на 50 XP больше
    let lvl = 1, need = 100, left = xp;
    while (left >= need) { left -= need; lvl++; need += 50; }
    return { lvl, cur: left, need };
  }

  function renderHome(el) {
    const prof = P();
    const pl = levelOf(prof.xp);
    const today = U.dayKey(Date.now());
    const todayLessons = prof.history.filter((h) => U.dayKey(h.ts) === today && h.kind !== 'placement').length;
    const hist = prof.history.slice().reverse().slice(0, 8);
    const ready = AI.ready() || !!AI._mock;
    el.innerHTML =
      '<header class="page-head"><div><h1>Языки</h1><p class="muted">Короткие уроки, которые подстраиваются под тебя</p></div></header>' + App.langTabs('lessons') +
      (!ready ? '<div class="card soft-alert">' + I('sparkles') + '<div><b>Для уроков нужна нейросеть</b> — подключи её в <a href="#/settings">Настройках → «Нейросеть»</a>. ' +
        'Тест на уровень, <a href="#/theory">теория</a> и тренировки работают и без неё.</div></div>' : '') +
      '<div class="grid-2">' +
        '<section class="card lesson-profile">' +
          '<div class="lp-top"><div class="lp-level"><span>' + (prof.level || '?') + '</span><small>' + (prof.level ? LEVEL_TXT[prof.level] : 'уровень не задан') + '</small></div>' +
          '<div class="lp-xp"><div class="lp-xp-row"><b>Уровень игрока ' + pl.lvl + '</b><span class="muted small">' + pl.cur + ' / ' + pl.need + ' XP</span></div>' +
          '<div class="progress"><span style="width:' + (pl.cur / pl.need * 100) + '%"></span></div>' +
          '<span class="muted small">всего ' + prof.xp + ' XP · сегодня уроков: ' + todayLessons + '</span></div></div>' +
          '<div class="row"><label>Язык<select data-l="lang">' + (App.LANGS || []).filter((l) => l[0] && l[0] !== 'ru-RU').map(([c, n]) => '<option value="' + c + '"' + (c === prof.lang ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></label>' +
          '<label>Мой уровень<select data-l="level"><option value="">не знаю</option>' + LEVELS.map((l) => '<option' + (l === prof.level ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></label></div>' +
          '<button class="btn" data-l="placement">' + I('target') + ' ' + (prof.level ? 'Пройти тест на уровень заново' : 'Определить уровень тестом (20 вопросов, без нейросети)') + '</button>' +
        '</section>' +
        '<section class="card lesson-start">' +
          '<h2>Новый урок</h2>' +
          '<div class="seg" role="group" aria-label="Фокус урока">' + FOCUS.map(([k, n]) => '<button class="' + (focus === k ? 'on' : '') + '" data-l="focus" data-v="' + k + '">' + n + '</button>').join('') + '</div>' +
          '<input id="lesson-topic" maxlength="100" placeholder="Тема (необязательно): путешествия, Present Perfect, small talk…" aria-label="Тема урока">' +
          '<button class="btn primary big" data-l="start">' + I('play') + ' Начать урок</button>' +
          (prof.mistakes.length >= 3 ? '<button class="btn" data-l="review">' + I('target') + ' Работа над ошибками (' + Math.min(prof.mistakes.length, 15) + ')</button>' : '') +
          '<p class="muted small">8 заданий · 3 жизни · +10 XP за ответ, +5 за серию из 3, +20 за урок без ошибок</p>' +
        '</section>' +
      '</div>' +
      (hist.length ? '<section class="card"><h2>История</h2><ul class="lesson-hist">' + hist.map((h) =>
        '<li><span class="lh-stars">' + (h.kind === 'placement' ? '<span class="tag new">' + h.level + '</span>' : stars(h.stars || 0)) + '</span>' +
        '<span class="lh-title">' + U.esc(h.title) + (h.kind === 'review' ? ' <span class="tag">ошибки</span>' : '') + '</span>' +
        '<span class="muted small">' + h.score + '/' + h.total + (h.xp ? ' · +' + h.xp + ' XP' : '') + ' · ' + U.dateLabel(h.ts) + '</span></li>').join('') + '</ul></section>' : '');
  }

  function stars(n) {
    return [1, 2, 3].map((i) => '<span class="star' + (i <= n ? ' on' : '') + '">' + I('star') + '</span>').join('');
  }

  function renderGame(el) {
    const L = game.lesson;
    const total = L.exercises.length;
    const top =
      '<div class="game-top"><button class="icon-btn" data-l="quit" aria-label="Выйти из урока">' + I('x') + '</button>' +
      '<div class="progress game-progress"><span style="width:' + (Math.max(0, game.i) / total * 100) + '%"></span></div>' +
      (game.kind === 'placement' ? '<span class="muted small">' + (game.i + 1) + '/' + total + '</span>' :
        '<span class="hearts" aria-label="Жизни: ' + game.hearts + '">' + [0, 1, 2].map((k) => '<span class="heart' + (k < game.hearts ? ' on' : '') + '">' + I('heart') + '</span>').join('') + '</span>' +
        '<span class="xp-pill">' + game.xp + ' XP</span>') + '</div>' +
      (game.autoTaskId && S().active && S().active.taskId === game.autoTaskId ? '<div class="auto-timer muted small">' + I('timer') + ' время идёт в «' + U.esc((Store.task(game.autoTaskId) || {}).name || '') + '» <button class="link-btn" data-l="auto-off">выключить</button></div>' : '');

    if (game.i < 0) {
      el.innerHTML = '<div class="game">' + top + '<div class="card game-card"><h2>' + U.esc(L.title) + '</h2><p class="lesson-intro">' + U.esc(L.intro).replace(/\n/g, '<br>') + '</p>' +
        '<button class="btn primary big" data-l="next">Поехали ' + I('chevron-right') + '</button></div></div>';
      return;
    }
    const e = current();
    const a = game.answered;
    let body = '';
    if (e.type === 'choice') {
      body = '<p class="ex-kind">Выбери правильный вариант</p><p class="ex-q">' + fmtGap(e.question) + '</p><div class="choices">' +
        e.options.map((opt, k) => {
          let cls = '';
          if (a) cls = k === e.answer ? ' right' : (String(k) === String(a.mine) ? ' wrong' : ' dim');
          return '<button class="choice' + cls + '" data-l="choose" data-k="' + k + '"' + (a ? ' disabled' : '') + '><span class="ck">' + (k + 1) + '</span>' + U.esc(opt) + '</button>';
        }).join('') + '</div>';
    } else if (e.type === 'gap') {
      body = '<p class="ex-kind">Вставь пропущенное слово</p><p class="ex-q">' + fmtGap(e.sentence) + '</p>' +
        (e.hint ? '<p class="muted small">Подсказка: ' + U.esc(e.hint) + '</p>' : '') +
        '<form id="gap-form" class="gap-form"><input name="ans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="твой ответ"' + (a ? ' disabled value="' + U.esc(a.mine) + '"' : '') + '>' +
        (a ? '' : '<button class="btn primary">Проверить</button>') + '</form>';
    } else if (e.type === 'order') {
      const picked = game.picked || [];
      body = '<p class="ex-kind">Собери предложение</p><p class="ex-q">' + U.esc(e.translation) + '</p>' +
        '<div class="order-line">' + (picked.length ? picked.map((w, k) => '<button class="wchip on" data-l="unpick" data-k="' + k + '"' + (a ? ' disabled' : '') + '>' + U.esc(w.text) + '</button>').join('') : '<span class="muted small">нажимай на слова по порядку</span>') + '</div>' +
        '<div class="order-bank">' + e.words.map((w, k) => picked.some((p) => p.k === k) ? '<span class="wchip ghost">' + U.esc(w) + '</span>' : '<button class="wchip" data-l="pick" data-k="' + k + '"' + (a ? ' disabled' : '') + '>' + U.esc(w) + '</button>').join('') + '</div>' +
        (a ? '' : '<button class="btn primary" data-l="check-order"' + (picked.length === e.words.length ? '' : ' disabled') + '>Проверить</button>');
    } else if (e.type === 'error' || e.type === 'open') {
      const kind = e.type === 'error' ? 'Ловушка: найди и исправь ошибку' : e.kind === 'why' ? 'Подумай: почему?' : 'Творческое задание';
      body = '<p class="ex-kind">' + kind + '</p><p class="ex-q">' + U.esc(e.type === 'error' ? e.sentence : e.task) + '</p>' +
        (e.type === 'error' ? '<p class="muted small">Напиши всё предложение правильно.</p>' : '') +
        '<form id="open-form" class="gap-form tr-form"><textarea name="ans" rows="' + (e.type === 'error' ? 2 : 4) + '" placeholder="' + (e.type === 'error' ? 'исправленное предложение' : e.kind === 'why' ? 'объясни своими словами (можно по-русски)' : 'твой текст') + '"' + (a ? ' disabled' : '') + '>' +
        (a ? U.esc(a.mine) : (e.type === 'error' ? U.esc(e.sentence) : '')) + '</textarea>' +
        (a ? '' : '<button class="btn primary" type="submit">Проверить</button>') + '</form>';
    } else {
      body = '<p class="ex-kind">Переведи</p><p class="ex-q">' + U.esc(e.ru) + '</p>' +
        '<form id="tr-form" class="gap-form tr-form"><textarea name="ans" rows="2" placeholder="твой перевод"' + (a ? ' disabled' : '') + '>' + (a ? U.esc(a.mine) : '') + '</textarea>' +
        (a ? '' : '<button class="btn primary" data-l="check-tr" type="submit">Проверить</button>') + '</form>';
    }
    let fb = '';
    if (a) {
      const right = rightText(e);
      fb = '<div class="feedback ' + (a.correct ? 'ok' : a.unknown ? 'skip' : 'bad') + '"><div class="fb-head">' + (a.correct ? I('check-circle') + ' Верно!' + (a.gain ? ' <span class="xp-pill">+' + a.gain + ' XP</span>' : '') + (game.combo >= 3 ? ' <span class="tag new">серия ' + game.combo + '</span>' : '') : a.unknown ? I('book') + ' Ничего страшного — разберём' : I('alert') + ' Не совсем') + '</div>' +
        (e.type === 'open' ? (right ? '<p>Пример ответа: <i>' + U.esc(right) + '</i></p>' : '') : !a.correct || e.type !== 'choice' ? '<p>Правильно: <b>' + U.esc(right) + '</b> <button class="icon-btn small" data-l="speak" data-t="' + U.esc(right) + '" aria-label="Произнести">' + I('volume') + '</button></p>' : '') +
        (a.better && !a.correct ? '<p>Твой вариант, исправленный: <i>' + U.esc(a.better) + '</i></p>' : '') +
        (a.feedback ? '<p>' + U.esc(a.feedback) + '</p>' : '') +
        (e.explain ? '<p class="muted">' + U.esc(e.explain) + '</p>' : '') +
        '<div class="fb-actions"><button class="btn primary" data-l="next" id="next-btn">' + (game.hearts <= 0 ? 'Завершить' : 'Дальше') + ' ' + I('chevron-right') + '</button>' +
        (e.topic && App.grammarTopic(e.topic) ? '<a class="btn ghost small" href="#/theory/' + e.topic + '" target="_self">' + I('book') + ' Теория: ' + U.esc(App.grammarTopic(e.topic).title) + '</a>' : '') +
        '<button class="btn ghost small" data-l="ask-open">' + I('sparkles') + ' Спросить про это задание</button></div>' +
        '<div id="ex-ask"></div></div>';
    }
    const skip = !a ? '<button class="btn ghost small dontknow" data-l="dontknow">' + I('alert') + ' Не знаю — покажи ответ</button>' : '';
    el.innerHTML = '<div class="game">' + top + '<div class="card game-card">' + body + skip + '</div>' + fb + '</div>';
    const inp = el.querySelector('#gap-form input:not([disabled]), #tr-form textarea:not([disabled]), #open-form textarea:not([disabled])');
    if (inp) inp.focus();
    const nb = el.querySelector('#next-btn');
    if (nb) nb.focus();
  }

  function fmtGap(s) { return U.esc(s).replace(/_{2,}/g, '<span class="gap">&nbsp;</span>'); }

  function renderResult(el) {
    const r = game.result;
    if (game.kind === 'placement') {
      const topics = P().weakTopics || [];
      el.innerHTML = '<div class="game"><div class="card game-card result">' +
        '<div class="result-badge">' + r.level + '</div><h2>Твой уровень: ' + r.level + ' — ' + LEVEL_TXT[r.level] + '</h2>' +
        '<p class="muted">Верно ' + game.right + ' из ' + game.lesson.exercises.length + '. Уроки теперь будут под этот уровень. Его всегда можно поменять вручную.</p>' +
        '<div class="lvl-bars">' + LEVELS.map((lv) => { const b = game.byLevel[lv]; if (!b) return ''; return '<div class="lvl-bar"><span>' + lv + '</span><div class="progress"><span style="width:' + (b.ok / b.n * 100) + '%"></span></div><small>' + b.ok + '/' + b.n + '</small></div>'; }).join('') + '</div>' +
        (topics.length ? '<div class="mistakes"><h3>Темы, которые стоит подтянуть</h3><div class="topic-chips">' +
          topics.map((id) => App.grammarTopic(id)).filter(Boolean).map((t) => '<a class="chip" href="#/theory/' + t.id + '">' + I('book') + ' ' + U.esc(t.title) + '</a>').join('') + '</div></div>' : '') +
        mistakesHTML() +
        '<div class="row-btns"><a class="btn" href="#/theory">' + I('book') + ' К теории</a><button class="btn primary" data-l="home">К урокам ' + I('chevron-right') + '</button></div></div></div>';
      return;
    }
    const lost = game.hearts <= 0;
    const s = r.suggestion;
    el.innerHTML = '<div class="game"><div class="card game-card result">' +
      '<div class="result-stars">' + stars(r.stars) + '</div>' +
      '<h2>' + (lost ? 'Жизни закончились — но опыт остался!' : r.perfect ? 'Идеально! Ни одной ошибки' : r.stars >= 2 ? 'Отличный урок!' : 'Урок пройден!') + '</h2>' +
      '<p>Верно <b>' + game.right + '</b> из ' + r.total + ' · <span class="xp-pill">+' + game.xp + ' XP</span>' + (r.perfect ? ' <span class="tag new">бонус +20</span>' : '') + '</p>' +
      (s ? '<div class="level-suggest">' + (s.dir === 'up' ? I('trend-up') + ' Ты стабильно справляешься — попробуешь уровень <b>' + s.to + '</b>?' : I('trend-down') + ' Похоже, сейчас сложновато. Немного снизим до <b>' + s.to + '</b>?') +
        ' <button class="btn small primary" data-l="set-level" data-v="' + s.to + '">Да</button></div>' : '') +
      mistakesHTML('Эти ошибки попадут в «Работу над ошибками» и в следующие уроки.') +
      (game.kind === 'quiz' ? '<div class="row-btns"><a class="btn primary" href="' + game.backHref + '">' + I('book') + (game.backHref === '#/theory' ? ' К теории' : ' К чтению') + '</a></div>' :
        '<div class="row-btns"><button class="btn" data-l="home">К урокам</button><button class="btn primary" data-l="again">' + I('play') + ' Ещё урок</button></div>') +
      '</div></div>';
  }

  function mistakesHTML(note) {
    if (!game.mistakes.length) return '';
    return '<div class="mistakes"><h3>Разбор ошибок</h3><ul>' + game.mistakes.map((m) => {
      const t = m.topic && App.grammarTopic(m.topic);
      return '<li><span class="muted">' + U.esc(m.q) + '</span><br>' + (m.mine ? '<s>' + U.esc(m.mine) + '</s> → ' : '') + '<b>' + U.esc(m.right) + '</b>' +
        (m.explain ? '<div class="small">' + U.esc(m.explain) + '</div>' : '') +
        (t ? '<a class="small" href="#/theory/' + t.id + '">' + I('book') + ' ' + U.esc(t.title) + '</a>' : '') + '</li>';
    }).join('') + '</ul>' + (note ? '<p class="muted small">' + note + '</p>' : '') + '</div>';
  }

  // ---------- Вопрос нейросети («Спросить») ----------

  const askHistory = {};
  App.askBoxHTML = function (id, title, placeholder) {
    const h = askHistory[id] || [];
    return '<section class="card ask-box" data-ask="' + id + '"><h2 class="h-ic">' + I('sparkles') + ' ' + U.esc(title) + '</h2>' +
      '<div class="ask-log">' + h.map((m) => '<div class="ask-msg ' + m.role + '">' + (m.role === 'user' ? U.esc(m.text) : App.md(m.text)) + '</div>').join('') + '</div>' +
      '<form class="ask-form"><textarea name="q" rows="2" maxlength="600" placeholder="' + U.esc(placeholder || 'Задай вопрос') + '"></textarea>' +
      '<div class="ask-btns"><button class="btn primary">Спросить</button><button type="button" class="btn ghost small" data-ask-copy>' + I('note') + ' Скопировать запрос</button></div></form>' +
      '<p class="muted small">1 вопрос = 1 запрос к нейросети. Закончился лимит? «Скопировать запрос» — и вставь в любую другую нейросеть.</p></section>';
  };
  App.bindAskBox = function (el, id, contextFn, opts) {
    opts = opts || {};
    const box = el.querySelector('[data-ask="' + id + '"]');
    if (!box) return;
    const form = box.querySelector('form');
    const ta = form.querySelector('textarea');
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
    // Полный текст запроса — чтобы вставить в любую другую нейросеть
    const fullPrompt = (q) => (opts.copyIntro || 'Я учу английский. Объясни, пожалуйста, по-русски и коротко, с 1–2 примерами.') + '\n\n' + contextFn() +
      ((askHistory[id] || []).length ? '\n\nНаш разговор до этого:\n' + askHistory[id].map((m) => (m.role === 'user' ? 'Я: ' : 'Ответ: ') + m.text).join('\n') : '') +
      '\n\nМой вопрос: ' + (q || '…');
    const copy = async (q) => {
      try { await navigator.clipboard.writeText(fullPrompt(q)); U.toast('Запрос скопирован — вставь его в любую нейросеть'); }
      catch (err) { window.prompt('Скопируй текст запроса:', fullPrompt(q)); }
    };
    box.querySelector('[data-ask-copy]').addEventListener('click', () => copy(ta.value.trim()));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const q = ta.value.trim();
      if (!q) return;
      if (!AI.ready() && !AI._mock) { copy(q); return; }
      const h = askHistory[id] = askHistory[id] || [];
      const log = box.querySelector('.ask-log');
      log.insertAdjacentHTML('beforeend', '<div class="ask-msg user">' + U.esc(q) + '</div>');
      ta.value = '';
      const answer = await AI.run(form.querySelector('button'), () => AI.ask({
        temperature: opts.temperature == null ? 0.4 : opts.temperature,
        system: (opts.system || ('Ты — добрая преподавательница английского для русскоязычной студентки. Отвечай по-русски, понятно и коротко (до 120 слов), ' +
          'приводи 1–2 примера на английском с переводом. Можно выделять важное **жирным**. Если вопрос не про язык, мягко верни к теме.')) + '\n\nКонтекст:\n' + contextFn(),
        prompt: h.concat([{ role: 'user', text: q }]),
      }));
      if (!answer) {
        log.insertAdjacentHTML('beforeend', '<div class="ask-msg assistant">Не получилось получить ответ. Нажми «Скопировать запрос» и вставь его в другую нейросеть.</div>');
        ta.value = q;
        return;
      }
      h.push({ role: 'user', text: q }, { role: 'assistant', text: answer });
      if (h.length > 12) h.splice(0, h.length - 12);
      log.insertAdjacentHTML('beforeend', '<div class="ask-msg assistant">' + App.md(answer) + '</div>');
    });
  };

  App.speak = function (text, lang) {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang || P().lang || 'en-US'; u.rate = 0.9;
    speechSynthesis.speak(u);
  };

  // ---------- События ----------

  document.addEventListener('click', async (e) => {
    if (!root || !root.contains(e.target)) return;
    const b = e.target.closest('[data-l]');
    if (!b) return;
    const ex = current();
    switch (b.dataset.l) {
      case 'focus': focus = b.dataset.v; App.render(); break;
      case 'start': startLesson(b, { focus, topic: (root.querySelector('#lesson-topic') || {}).value }); break;
      case 'review': startLesson(b, { review: true }); break;
      case 'placement': startPlacement(); break;
      case 'ask-open': {
        const holder = root.querySelector('#ex-ask');
        if (!holder || holder.innerHTML) break;
        const id = 'ex-' + game.i + '-' + game.started;
        holder.innerHTML = App.askBoxHTML(id, 'Вопрос про задание', 'Например: «почему здесь не Past Simple?»');
        App.bindAskBox(holder, id, () => {
          const a = game.answered || {};
          return 'Задание из урока: ' + (ex.question || ex.sentence || ex.translation || ex.ru) + '\n' +
            (ex.options ? 'Варианты: ' + ex.options.join(' / ') + '\n' : '') +
            'Правильный ответ: ' + rightText(ex) + '\nОтвет ученицы: ' + (ex.type === 'choice' && ex.options[Number(a.mine)] != null ? ex.options[Number(a.mine)] : (a.mine || '')) +
            (a.correct ? ' (верно)' : ' (неверно)') + (ex.explain ? '\nКраткое объяснение: ' + ex.explain : '') + '\nУровень ученицы: ' + (P().level || 'неизвестен');
        });
        holder.querySelector('textarea').focus();
        b.remove();
        break;
      }
      case 'again': game = null; App.render(); startLesson(root.querySelector('[data-l=start]'), { focus }); break;
      case 'home': game = null; App.render(); break;
      case 'quit':
        if (game.done || game.i <= 0 || await App.confirm('Выйти из урока? Прогресс этого урока не сохранится, а записанное время останется.', 'Выйти')) { autoTimerStop(); game = null; App.render(); }
        break;
      case 'next': next(); break;
      case 'auto-off': autoTimerStop(); App.render(); break;
      case 'dontknow': if (!game.answered) answer(false, '', { unknown: true }); break;
      case 'choose': if (!game.answered) answer(Number(b.dataset.k) === ex.answer, b.dataset.k); break;
      case 'pick': game.picked = (game.picked || []).concat({ k: Number(b.dataset.k), text: ex.words[Number(b.dataset.k)] }); App.render(); break;
      case 'unpick': game.picked.splice(Number(b.dataset.k), 1); App.render(); break;
      case 'check-order': {
        const mine = (game.picked || []).map((p) => p.text).join(' ');
        answer(norm(mine) === norm(ex.answer), mine);
        break;
      }
      case 'speak': App.speak(b.dataset.t); break;
      case 'set-level': P().level = b.dataset.v; Store.save(); U.toast('Уровень теперь ' + b.dataset.v); b.closest('.level-suggest').remove(); break;
    }
  });

  document.addEventListener('submit', (e) => {
    if (!root || !root.contains(e.target)) return;
    if (e.target.id === 'gap-form') {
      e.preventDefault();
      const mine = e.target.ans.value.trim();
      if (!mine) return;
      answer(current().accept.includes(norm(mine)), mine);
    }
    if (e.target.id === 'tr-form') {
      e.preventDefault();
      const mine = e.target.ans.value.trim();
      if (!mine) return;
      checkTranslate(e.target.querySelector('button'), mine);
    }
    if (e.target.id === 'open-form') {
      e.preventDefault();
      const mine = e.target.ans.value.trim();
      if (!mine) return;
      checkOpen(e.target.querySelector('button'), mine);
    }
  });

  document.addEventListener('change', (e) => {
    if (!root || !root.contains(e.target)) return;
    const t = e.target.dataset.l;
    if (t === 'level') { P().level = e.target.value; Store.save(); App.render(); }
    if (t === 'lang') { P().lang = e.target.value; Store.save(); App.render(); }
  });

  App.views.lessons = {
    render,
    group: 'cards',
    leave() { root = null; },
    key(ev) {
      if (!game || game.done) return;
      const ex = current();
      if (game.answered && (ev.key === 'Enter' || ev.key === ' ')) { next(); return true; }
      if (ex && ex.type === 'choice' && !game.answered && /^[1-4]$/.test(ev.key) && Number(ev.key) <= ex.options.length) {
        answer(Number(ev.key) - 1 === ex.answer, String(Number(ev.key) - 1)); return true;
      }
      if (game.i < 0 && ev.key === 'Enter') { next(); return true; }
    },
  };

  App.levelOf = levelOf;
})();
