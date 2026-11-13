// Раздел «Языки → Практика»: свободное письмо и разговор на английском.
// Разговор на тему, текст или диалог с вопросами, описание картинки и мини-дневник.
// Пишешь сколько хочешь — нейросеть исправляет ошибки, хвалит, подсказывает слова и задаёт вопрос, чтобы продолжить.
(function () {
  'use strict';

  const App = window.App = window.App || {};
  App.views = App.views || {};

  let root = null;
  const S = () => Store.state;
  function W() {
    const st = S();
    if (!st.writing || typeof st.writing !== 'object' || Array.isArray(st.writing)) st.writing = {};
    const w = st.writing;
    ['diary', 'items', 'talks'].forEach((k) => { if (!Array.isArray(w[k])) w[k] = []; });
    return w;
  }
  const level = () => S().lessons.level || 'A2';
  const ready = () => AI.ready() || !!AI._mock;
  const sub = () => decodeURIComponent(location.hash.split('/')[2] || '');
  const esc = (s) => U.esc(s == null ? '' : String(s));

  const TOPICS = ['Путешествия мечты', 'Сериалы и фильмы', 'Учёба и универ', 'Еда и готовка', 'Музыка', 'Технологии и ИИ', 'Спорт и здоровье',
    'Друзья', 'Мой город', 'Работа мечты', 'Детство', 'Книги', 'Мода и стиль', 'Животные', 'Праздники', 'Соцсети', 'Хобби', 'Будущее через 10 лет'];

  // Подсказки для дневника: по одной на день, можно листать
  const PROMPTS = [
    ['What made you smile today?', 'Что сегодня заставило тебя улыбнуться?'],
    ['Describe your perfect lazy Sunday.', 'Опиши идеальное ленивое воскресенье.'],
    ['If you could have dinner with anyone, who would it be and why?', 'С кем бы ты поужинала, если можно с кем угодно?'],
    ['What is something new you learned this week?', 'Что нового ты узнала на этой неделе?'],
    ['Write about a place where you feel calm.', 'Место, где тебе спокойно.'],
    ['What would you tell your 15-year-old self?', 'Что бы ты сказала себе в 15 лет?'],
    ['Describe your room to someone who has never seen it.', 'Опиши свою комнату тому, кто её не видел.'],
    ['What small habit do you want to start, and why?', 'Какую маленькую привычку хочешь завести?'],
    ['Tell the story of a funny mistake you made.', 'Расскажи про смешную ошибку.'],
    ['What is the best thing you ate recently?', 'Самое вкусное, что ты ела недавно.'],
    ['If you could live in any city for a year, which one would you choose?', 'В каком городе ты бы пожила год?'],
    ['What are you looking forward to?', 'Чего ты ждёшь с нетерпением?'],
    ['Describe today in three colours and explain why.', 'Опиши сегодняшний день тремя цветами.'],
    ['What skill are you proud of?', 'Каким умением ты гордишься?'],
    ['Which film or series changed the way you think?', 'Фильм или сериал, который что-то поменял в тебе.'],
    ['Plan an ideal weekend with no limits.', 'Спланируй идеальные выходные без ограничений.'],
    ['What do you like about machine learning?', 'Что тебе нравится в машинном обучении?'],
    ['Write a short letter to yourself in five years.', 'Письмо себе через пять лет.'],
    ['What is something you used to believe, but don’t anymore?', 'Во что ты раньше верила, а теперь нет?'],
    ['Describe a person who inspires you.', 'Человек, который тебя вдохновляет.'],
    ['What would your dream job look like?', 'Какой была бы работа мечты?'],
    ['What happened today that you want to remember?', 'Что сегодня хочется запомнить?'],
    ['If you could invent an app, what would it do?', 'Какое приложение ты бы придумала?'],
    ['Write about three things you are grateful for.', 'Три вещи, за которые ты благодарна.'],
    ['How does the weather affect your mood?', 'Как погода влияет на твоё настроение?'],
    ['Describe a dream you remember.', 'Сон, который ты помнишь.'],
    ['What is the most interesting thing you read recently?', 'Самое интересное, что ты недавно прочитала.'],
    ['Where would you go with a free plane ticket?', 'Куда бы ты полетела с бесплатным билетом?'],
    ['What does a good day look like for you?', 'Какой он, хороший день для тебя?'],
    ['Tell me about a tradition in your family.', 'Традиция в твоей семье.'],
  ];
  let promptShift = 0;
  function todayPrompt() {
    const day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5);
    return PROMPTS[((day + promptShift) % PROMPTS.length + PROMPTS.length) % PROMPTS.length];
  }

  // ---------- Проверка письма ----------
  const WRITING_JSON = '{"corrected": "весь её текст, исправленный: сохрани её мысли, содержание и стиль, исправь только язык, сделай звучание естественным", ' +
    '"notes": [{"was": "фрагмент с ошибкой — ТОЧНАЯ цитата из её текста, символ в символ", "better": "как правильно", "why": "почему, по-русски, коротко"}], ' +
    '"help": [{"meant": "русское слово или место, где она не знала, как сказать (цитата из её текста)", "en": "как это сказать по-английски", "note": "пояснение по-русски, если вариантов несколько"}], ' +
    '"good": "что получилось хорошо, по-русски, 1-2 предложения, конкретно", ' +
    '"words": [{"en": "полезное слово или фраза для этой темы, которой не было в тексте", "ru": "перевод"}], ' +
    '"question": "один интересный вопрос по-английски, чтобы продолжить мысль"}';
  const WRITING_RULES = 'Проверь текст русскоязычной студентки (уровень ' + '%LVL%' + ') на английском. Длина любая — читай весь текст. ' +
    'В "notes" — до 8 самых важных НАСТОЯЩИХ ошибок (если ошибок нет — пустой массив, и прямо похвали). Перед тем как записать ошибку, перечитай это место в её тексте: ' +
    'не придумывай ошибок, которых нет, и не исправляй то, что написано верно. Не придирайся к стилю, если всё верно. ' +
    'Русские слова в тексте и фразы вроде «I don’t know how to say» — это не ошибки, а просьба о помощи: подскажи английский вариант в "help". ' +
    'Если непонятно, что она имела в виду, — не угадывай по контексту и не подставляй своё: в "help" предложи 2-3 варианта, что она могла иметь в виду, и как сказать каждый. ' +
    'В "words" — 3-5 полезных слов или фраз её уровня по теме. Отвечай только JSON:\n';

  // opt.images — приложить картинку к тому же запросу; opt.fallback — текст задания, если модель картинки не принимает
  async function checkWriting(btn, context, text, opt) {
    opt = opt || {};
    const ask = (ctx, images) => AI.ask({
      json: true, temperature: 0.2, images,
      system: 'Ты — добрая и точная преподавательница английского. Объясняешь по-русски, коротко и конкретно, без занудства. Никогда не меняешь смысл того, что написала ученица.',
      prompt: WRITING_RULES.replace('%LVL%', level()) + WRITING_JSON + '\n\n' + ctx + '\n\nЕё текст:\n"""\n' + text + '\n"""',
      maxTokens: 4000,
    });
    const fb = await AI.run(btn, async () => {
      if (opt.images) {
        try { const r = await ask(context, opt.images); if (r) r.saw = true; return r; }
        catch (e) { if (!opt.fallback) throw e; } // модель не умеет смотреть картинки — проверим только язык
      }
      const r = await ask(opt.images ? opt.fallback : context);
      if (r && opt.images) r.saw = false;
      return r;
    });
    return fb && cleanFeedback(fb, text);
  }

  // Картинка для нейросети (base64), чтобы она её видела
  const imgCache = new Map();
  async function imageData(src) {
    if (imgCache.has(src)) return imgCache.get(src);
    const r = await fetch(src);
    if (!r.ok) throw new Error('картинка не загрузилась');
    const blob = await r.blob();
    const data = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.onerror = rej; fr.readAsDataURL(blob); });
    const out = { mime: blob.type || 'image/jpeg', data };
    imgCache.set(src, out);
    return out;
  }

  // Нейросеть иногда «находит» ошибку в слове, которого в тексте нет (например, «charch», когда написано «church»).
  // Оставляем только замечания, которые цитируют её текст и что-то в нём меняют.
  function cleanFeedback(fb, text) {
    const n = (x) => String(x || '').toLowerCase().replace(/[’‘`]/g, "'").replace(/[“”«»]/g, '"').replace(/\s+/g, ' ').trim();
    const src = n(text);
    ['notes', 'content'].forEach((k) => { if (Array.isArray(fb[k])) fb[k] = fb[k].filter((x) => x && x.was && src.includes(n(x.was)) && n(x.was) !== n(x.better)); });
    if (!Array.isArray(fb.help)) fb.help = [];
    fb.help = fb.help.filter((x) => x && x.en);
    return fb;
  }

  function feedbackHTML(fb, opts) {
    if (!fb) return '';
    opts = opts || {};
    const notes = Array.isArray(fb.notes) ? fb.notes.filter((n) => n && (n.was || n.better)) : [];
    const words = Array.isArray(fb.words) ? fb.words.filter((w) => w && w.en) : [];
    return '<div class="wr-fb">' +
      (fb.good ? '<p class="wr-good">' + I('sparkles') + ' ' + esc(fb.good) + '</p>' : '') +
      (notes.length ? '<ul class="wr-notes">' + notes.map((n) => '<li><s>' + esc(n.was) + '</s> → <b>' + esc(n.better) + '</b>' + (n.why ? '<br><span class="muted small">' + esc(n.why) + '</span>' : '') + '</li>').join('') + '</ul>'
        : '<p class="small">' + I('check') + ' Ошибок не нашлось — отлично!</p>') +
      (fb.content && fb.content.length ? '<div class="wr-help"><span class="muted small">По картинке:</span><ul>' + fb.content.map((c) =>
        '<li><s>' + esc(c.was) + '</s> → <b>' + esc(c.better) + '</b>' + (c.why ? '<br><span class="muted small">' + esc(c.why) + '</span>' : '') + '</li>').join('') + '</ul></div>' : '') +
      (fb.more ? '<p class="small"><span class="muted">Ещё на фото можно заметить:</span> <i>' + esc(fb.more) + '</i></p>' : '') +
      (opts.pic && fb.saw === false ? '<p class="muted small">Эта модель нейросети не умеет смотреть картинки, поэтому проверила только язык.</p>' : '') +
      (fb.help && fb.help.length ? '<div class="wr-help"><span class="muted small">Как сказать:</span><ul>' + fb.help.map((h) =>
        '<li>' + (h.meant ? esc(h.meant) + ' → ' : '') + '<b>' + esc(h.en) + '</b>' + (h.note ? '<br><span class="muted small">' + esc(h.note) + '</span>' : '') + '</li>').join('') + '</ul></div>' : '') +
      (fb.corrected ? '<details class="wr-corrected"><summary class="small">Исправленный текст целиком</summary><p>' + esc(fb.corrected).replace(/\n/g, '<br>') + '</p></details>' : '') +
      (words.length ? '<div class="wr-words"><span class="muted small">Пригодится:</span>' + words.map((w) =>
        '<button type="button" class="chip" data-p="word" data-en="' + esc(w.en) + '" data-ru="' + esc(w.ru) + '" title="Добавить в карточки">' + esc(w.en) + ' — ' + esc(w.ru) + ' +</button>').join('') + '</div>' : '') +
      (fb.question ? '<p class="wr-q"><span class="muted small">Чтобы продолжить:</span> <i>' + esc(fb.question) + '</i>' +
        (opts.askBtn ? ' <button type="button" class="link-btn" data-p="' + opts.askBtn + '" data-q="' + esc(fb.question) + '">ответить</button>' : '') + '</p>' : '') +
      '</div>';
  }

  function gainXP(n) {
    const p = S().lessons;
    p.xp = (p.xp || 0) + n;
    U.toast('+' + n + ' XP');
  }

  async function copyPrompt(text) {
    try { await navigator.clipboard.writeText(text); U.toast('Запрос скопирован — вставь его в любую нейросеть'); }
    catch (e) { window.prompt('Скопируй текст запроса:', text); }
  }
  const noAI = '<p class="muted small">Нейросеть не подключена: писать и сохранять можно, а для проверки подключи её в <a href="#/settings">Настройках</a> или нажми «Скопировать запрос».</p>';

  // ---------- Экраны ----------

  function render(el) {
    root = el;
    const m = sub();
    const head = '<header class="page-head"><div><h1>Языки</h1><p class="muted">Свободная практика: пиши и говори сколько хочешь</p></div></header>' + App.langTabs('practice');
    if (m === 'talk') return renderTalk(el, head);
    if (m === 'text') return renderText(el, head);
    if (m === 'picture') return renderPicture(el, head);
    if (m === 'diary') return renderDiary(el, head);
    renderHome(el, head);
  }

  function renderHome(el, head) {
    const w = W();
    const cards = [
      ['talk', 'globe', 'Разговор на тему', 'Выбираешь тему или придумываешь свою — нейросеть задаёт вопросы, ты отвечаешь как хочешь, она мягко поправляет.'],
      ['text', 'book', 'Текст или диалог + вопросы', 'Короткий текст или диалог на твою тему и уровень, потом вопросы: что поняла и что думаешь сама.'],
      ['picture', 'camera', 'Опиши картинку', 'Случайная фотография дня из Википедии — опиши, что видишь и что чувствуешь. Потом узнаешь, что на ней на самом деле.'],
      ['diary', 'pen', 'Мини-дневник', 'Пара строк или целая страница о своём дне. Подсказка на каждый день, проверка ошибок и новые слова.'],
    ];
    const recent = w.items.slice().reverse().slice(0, 6);
    el.innerHTML = head +
      (!ready() ? '<div class="card soft-alert">' + I('sparkles') + '<div><b>Для проверки и разговора нужна нейросеть</b> — подключи её в <a href="#/settings">Настройках → «Нейросеть»</a>. Дневник можно вести и без неё.</div></div>' : '') +
      '<div class="pr-grid">' + cards.map(([id, ic, t, d]) =>
        '<a class="card pr-card" href="#/practice/' + id + '"><span class="pr-ic">' + I(ic) + '</span><h2>' + t + '</h2><p class="muted small">' + d + '</p></a>').join('') + '</div>' +
      '<section class="card"><h2>Недавно</h2>' +
        (recent.length || w.diary.length ? '<ul class="pr-hist">' +
          (w.diary.length ? '<li><a href="#/practice/diary">' + I('pen') + ' Дневник: ' + w.diary.length + ' ' + U.plural(w.diary.length, ['запись', 'записи', 'записей']) + '</a></li>' : '') +
          recent.map((it) => '<li><span>' + I(it.kind === 'picture' ? 'camera' : 'book') + ' ' + esc(it.title) + '</span><span class="muted small">' + U.dateLabel(it.ts) + '</span></li>').join('') + '</ul>'
          : '<p class="muted">Пока пусто. Начни с дневника — хоть одно предложение.</p>') +
      '</section>';
  }

  // --- Разговор на тему ---
  function topicPicker(kind, extra) {
    return '<div class="topic-chips pr-topics">' + TOPICS.map((t) => '<button type="button" class="chip" data-p="pick-topic" data-k="' + kind + '" data-t="' + esc(t) + '">' + esc(t) + '</button>').join('') +
      '<button type="button" class="chip" data-p="pick-topic" data-k="' + kind + '" data-t="__random">' + I('sparkles') + ' Удиви меня</button></div>' +
      '<form class="pr-own" data-k="' + kind + '"><label>Или своя тема, вопрос, ситуация — что угодно<textarea name="topic" rows="2" placeholder="например: собеседование на стажировку в ML; спор о том, нужны ли экзамены; заказываю кофе в Лондоне"></textarea></label>' +
      (extra || '') + '<button class="btn primary">' + I('play') + ' Начать</button></form>';
  }

  function renderTalk(el, head) {
    const w = W();
    const cur = w.talks.find((t) => t.id === w.talkId);
    if (!cur) {
      el.innerHTML = head + '<section class="card"><a class="link-btn" href="#/practice">‹ Практика</a><h2>Разговор на тему</h2>' +
        '<p class="muted">Нейросеть — твоя собеседница: спрашивает, слушает, отвечает коротко, чтобы больше говорила ты. Ошибки поправляет строкой «✏️ Better:». Пиши сколько хочешь.</p>' +
        topicPicker('talk') + '</section>' +
        (w.talks.length ? '<section class="card"><h2>Прошлые разговоры</h2><ul class="pr-hist">' + w.talks.slice().reverse().slice(0, 8).map((t) =>
          '<li><button class="link-btn" data-p="resume-talk" data-id="' + t.id + '">' + esc(t.topic) + '</button><span class="muted small">' + U.dateLabel(t.ts) + '</span></li>').join('') + '</ul></section>' : '');
      return;
    }
    const id = 'practice-talk-' + cur.id;
    el.innerHTML = head + '<div class="pr-bar"><a class="link-btn" href="#/practice">‹ Практика</a><b>' + esc(cur.topic) + '</b><button class="btn small" data-p="new-talk">Другая тема</button></div>' +
      App.askBoxHTML(id, 'Разговор: ' + cur.topic, 'Пиши по-английски, ошибки — это нормально. Можно и по-русски, если не знаешь, как сказать.');
    App.bindAskBox(el, id, () => 'Тема разговора: ' + cur.topic, {
      temperature: 0.8, multiline: true,
      system: 'You are a friendly English conversation partner for a Russian-speaking university student (level ' + level() + '). The topic: "' + cur.topic + '". ' +
        'Speak English at her level. Keep your replies short (2-5 sentences) so that she does most of the talking. React to what she says with real interest, sometimes share a short opinion or story of your own, and end with ONE open question. ' +
        'If the topic is a situation (an interview, a café, an argument), play your role in it. ' +
        'If her message has real mistakes, first show the corrected version of her message in one line starting with "✏️ Better:", then continue. Do not correct style if it is fine. ' +
        'If she writes in Russian, help her say it in English. Now and then **bold** one useful phrase for this topic.',
      opener: '[начало] Start the conversation about the topic: greet me briefly and ask your first question.',
      copyIntro: 'Let’s talk in English about: ' + cur.topic + '. Be my conversation partner: short replies, correct my mistakes gently with “✏️ Better:”, ask me questions.',
    });
  }

  // --- Текст или диалог + вопросы ---
  function renderText(el, head) {
    const w = W();
    const c = w.current;
    if (!c) {
      el.innerHTML = head + '<section class="card"><a class="link-btn" href="#/practice">‹ Практика</a><h2>Текст или диалог + вопросы</h2>' +
        '<p class="muted">Выбери тему — получишь короткий текст или живой диалог твоего уровня, а потом вопросы: на понимание и про твоё мнение. Отвечай развёрнуто.</p>' +
        topicPicker('text', '<div class="seg" role="group" aria-label="Формат"><button type="button" class="' + (w.textKind !== 'dialog' ? 'on' : '') + '" data-p="kind" data-v="text">Текст</button>' +
          '<button type="button" class="' + (w.textKind === 'dialog' ? 'on' : '') + '" data-p="kind" data-v="dialog">Диалог</button></div>') + '</section>';
      return;
    }
    const lines = String(c.text || '').split(/\n+/).filter(Boolean);
    const body = lines.map((l) => {
      const m = l.match(/^([A-Z][\w .'-]{0,20}):\s*(.+)$/);
      return m ? '<p class="pr-line"><b>' + esc(m[1]) + ':</b> ' + esc(m[2]) + '</p>' : '<p>' + esc(l) + '</p>';
    }).join('');
    const checked = !!c.fb;
    el.innerHTML = head + '<div class="pr-bar"><a class="link-btn" href="#/practice">‹ Практика</a><span class="muted small">' + (c.kind === 'dialog' ? 'Диалог' : 'Текст') + ' · ' + esc(c.topic) + '</span><button class="btn small" data-p="new-text">Новый текст</button></div>' +
      '<section class="card pr-text"><div class="card-head"><h2>' + esc(c.title) + '</h2><button class="btn small" data-p="speak-text">' + I('volume') + ' Послушать</button></div>' + body +
        (c.glossary && c.glossary.length ? '<div class="wr-words"><span class="muted small">Слова:</span>' + c.glossary.map((g) =>
          '<button type="button" class="chip" data-p="word" data-en="' + esc(g.en) + '" data-ru="' + esc(g.ru) + '" title="Добавить в карточки">' + esc(g.en) + ' — ' + esc(g.ru) + ' +</button>').join('') + '</div>' : '') +
        '<p class="muted small">Незнакомое слово можно выделить — появится «Перевести».</p></section>' +
      '<form class="card pr-questions" id="pr-q-form"><h2>Вопросы</h2>' + c.questions.map((q, i) => {
        const r = c.fb && c.fb.answers && c.fb.answers[i];
        return '<div class="pr-q"><p><b>' + (i + 1) + '.</b> ' + esc(q) + '</p>' +
          '<textarea name="a' + i + '" rows="3" placeholder="твой ответ — сколько хочешь"' + (checked ? ' disabled' : '') + '>' + esc((c.answers || [])[i] || '') + '</textarea>' +
          (r ? '<div class="pr-q-fb ' + (r.ok ? 'ok' : 'bad') + '">' + (r.ok ? I('check') : I('alert')) + ' ' + esc(r.comment || '') + (r.better ? '<br><span class="small">Можно так: <i>' + esc(r.better) + '</i></span>' : '') + '</div>' : '') + '</div>';
      }).join('') +
      (checked ? feedbackHTML(c.fb.overall && { good: c.fb.overall, words: c.fb.words, question: c.fb.question }) +
        '<div class="row-btns"><button type="button" class="btn" data-p="retry-text">Ответить заново</button><button type="button" class="btn primary" data-p="new-text">Новый текст</button></div>'
        : '<div class="row-btns"><button class="btn primary">' + I('check') + ' Проверить ответы</button><button type="button" class="btn ghost small" data-p="copy-text">' + I('note') + ' Скопировать запрос</button></div>' + (ready() ? '' : noAI)) +
      '</form>';
  }

  async function newText(btn, topic, kind) {
    const isDialog = kind === 'dialog';
    const r = await AI.run(btn, () => AI.ask({
      json: true, temperature: 0.9, maxTokens: 4000,
      system: 'Ты пишешь живые, интересные учебные тексты на английском для русскоязычной студентки 3 курса. Без занудства, с юмором и деталями из жизни.',
      prompt: 'Уровень: ' + level() + '. Тема: «' + topic + '».\n' +
        (isDialog ? 'Напиши живой диалог 2-3 человек (12-18 реплик), каждая реплика с новой строки в формате «Имя: текст».' : 'Напиши связный текст 150-220 слов (2-4 абзаца, абзацы через пустую строку).') +
        ' Используй 5-8 полезных слов и выражений по теме, уровень строго ' + level() + '.\n' +
        'Потом 5 вопросов по-английски: 2 на понимание текста, 3 открытых — про её мнение и её опыт (на них хочется ответить развёрнуто).\n' +
        'Верни JSON: {"title": "название по-английски", "text": "текст", "glossary": [{"en": "слово или выражение из текста", "ru": "перевод"}], "questions": ["вопрос1", "…"]}',
    }));
    if (!r || !r.text || !Array.isArray(r.questions) || !r.questions.length) { if (r) U.toast('Текст получился неполным — попробуй ещё раз'); return; }
    W().current = { id: U.uid(), topic, kind: isDialog ? 'dialog' : 'text', title: String(r.title || topic), text: String(r.text),
      glossary: (r.glossary || []).filter((g) => g && g.en).slice(0, 10), questions: r.questions.map(String).slice(0, 7), answers: [], fb: null, ts: Date.now() };
    Store.save();
    App.render();
  }

  function textCheckPrompt(c) {
    return 'Студентка (уровень ' + level() + ') прочитала ' + (c.kind === 'dialog' ? 'диалог' : 'текст') + ' и ответила на вопросы по-английски.\n' +
      'Текст:\n"""\n' + c.text + '\n"""\n\n' + c.questions.map((q, i) => (i + 1) + '. ' + q + '\nОтвет: ' + ((c.answers || [])[i] || '(нет ответа)')).join('\n\n') +
      '\n\nДля каждого ответа: верен ли он по смыслу (для вопросов на мнение — засчитывай любое мнение, оценивай язык), ' +
      'коротко по-русски — что хорошо и какие ошибки (с исправлением), и как сказать лучше (если есть что улучшить).\n' +
      'Верни JSON: {"answers": [{"ok": true/false, "comment": "по-русски, 1-3 предложения", "better": "исправленный ответ или пустая строка"}], ' +
      '"overall": "общий итог по-русски, 1-2 предложения", "words": [{"en": "полезная фраза", "ru": "перевод"}], "question": "ещё один вопрос по-английски, чтобы продолжить"}';
  }

  // --- Опиши картинку ---
  async function loadPicture(btn) {
    for (let attempt = 0; attempt < 6; attempt++) {
      const from = Date.UTC(2015, 0, 1), to = Date.now() - 2 * 864e5;
      const d = new Date(from + Math.random() * (to - from));
      const path = d.getUTCFullYear() + '/' + String(d.getUTCMonth() + 1).padStart(2, '0') + '/' + String(d.getUTCDate()).padStart(2, '0');
      try {
        if (btn) btn.disabled = true;
        const r = await fetch('https://api.wikimedia.org/feed/v1/wikipedia/en/featured/' + path);
        if (!r.ok) continue;
        const j = await r.json();
        const im = j && j.image;
        const src = im && im.thumbnail && im.thumbnail.source;
        if (!src || !/\.(jpe?g|png|webp)/i.test(src)) continue;
        W().pic = { src, desc: (im.description && im.description.text) || '', title: String(im.title || '').replace(/^File:/, '').replace(/\.[a-z]+$/i, ''),
          page: im.file_page || '', artist: (im.artist && im.artist.text) || '', ts: Date.now(), text: '', fb: null };
        Store.save();
        App.render();
        return;
      } catch (e) { /* пробуем другой день */ } finally { if (btn && btn.isConnected) btn.disabled = false; }
    }
    U.toast('Не получилось загрузить картинку — проверь интернет');
  }

  function renderPicture(el, head) {
    const w = W();
    const p = w.pic;
    if (!p) {
      el.innerHTML = head + '<section class="card"><a class="link-btn" href="#/practice">‹ Практика</a><h2>Опиши картинку</h2>' +
        '<p class="muted">Каждый раз — случайная «картинка дня» из Википедии: природа, города, животные, искусство. Опиши, что видишь, что происходит, какое настроение. Потом откроется, что на ней на самом деле.</p>' +
        '<button class="btn primary" data-p="new-pic">' + I('camera') + ' Показать картинку</button></section>';
      return;
    }
    const checked = !!p.fb;
    el.innerHTML = head + '<div class="pr-bar"><a class="link-btn" href="#/practice">‹ Практика</a><span></span><button class="btn small" data-p="new-pic">Другая картинка</button></div>' +
      '<section class="card pr-pic"><img src="' + esc(p.src) + '" alt="Картинка для описания" referrerpolicy="no-referrer">' +
        '<p class="muted small">Фото: ' + (p.artist ? esc(p.artist) + ', ' : '') + '<a href="' + esc(p.page) + '" target="_blank" rel="noopener noreferrer">Wikimedia Commons</a></p></section>' +
      '<form class="card" id="pr-pic-form"><h2>Что ты видишь?</h2>' +
        '<details class="pr-phrases"><summary class="small">Фразы-помощники</summary><p class="small">In the picture I can see… · In the foreground / background… · On the left / right… · In the middle… · It looks like… · It seems that… · I think this place is… · It reminds me of… · The atmosphere is calm / busy / mysterious… · If I were there, I would…</p></details>' +
        '<textarea name="text" rows="6" placeholder="Describe the picture in English — as much as you like"' + (checked ? ' disabled' : '') + '>' + esc(p.text || w.picDraft || '') + '</textarea>' +
        (checked ? feedbackHTML(p.fb, { pic: true }) + (p.desc ? '<p class="pr-reveal"><span class="muted small">Подпись из Википедии (для интереса — описывать можно по-своему):</span><br>' + esc(p.desc) + '</p>' : '') +
          '<div class="row-btns"><button type="button" class="btn" data-p="retry-pic">Описать заново</button><button type="button" class="btn primary" data-p="new-pic">Другая картинка</button></div>'
          : '<div class="row-btns"><button class="btn primary">' + I('check') + ' Проверить</button><button type="button" class="btn ghost small" data-p="copy-pic">' + I('note') + ' Скопировать запрос</button></div>' + (ready() ? '' : noAI)) +
      '</form>';
  }
  function picSeenContext(p) {
    return 'Задание: она описывала эту фотографию — фото приложено, посмотри на него внимательно. Подпись из Википедии для справки (она её не знает и не должна знать): «' + (p.desc || p.title) + '». ' +
      'Проверяй прежде всего английский. По содержанию: если она что-то назвала не так, как на фото (перепутала предмет, цвет, количество), мягко поправь это в отдельном поле "content" (формат как у "notes": was — точная цитата из её текста). ' +
      'Не считай ошибкой, что она чего-то не заметила или не знает, что это за место, и не заменяй её наблюдения своими. Если по фото понятно, что она имела в виду под непонятным словом, — подскажи в "help", как это сказать. ' +
      'В "good" похвали за конкретные детали, которые она заметила. Добавь поле "more": 1-2 интересные детали с фото, которых нет в её описании, — по-английски, простыми словами её уровня.';
  }
  function picContext(p) {
    return 'Задание: она описывала фотографию так, как её видит. ТЫ ЭТУ ФОТОГРАФИЮ НЕ ВИДИШЬ. Для справки — подпись к фото из Википедии: «' + (p.desc || p.title) + '». ' +
      'Подпись может описывать фото совсем по-другому, а ученица её не знает и не должна знать. НИКОГДА не подгоняй её описание под подпись: ' +
      'не заменяй её слова словами из подписи, не считай ошибкой, что она увидела другое или не назвала место, не исправляй содержание. Проверяй только английский язык. ' +
      'В "good" похвали за то, что она сама заметила и описала.';
  }

  // --- Дневник ---
  function renderDiary(el, head) {
    const w = W();
    const [en, ru] = todayPrompt();
    const entries = w.diary.slice().reverse();
    el.innerHTML = head + '<div class="pr-bar"><a class="link-btn" href="#/practice">‹ Практика</a><span class="muted small">' + w.diary.length + ' ' + U.plural(w.diary.length, ['запись', 'записи', 'записей']) + '</span><span></span></div>' +
      '<form class="card" id="pr-diary-form"><h2>' + I('pen') + ' Дорогой дневник</h2>' +
        '<p class="pr-prompt"><span class="muted small">Подсказка (можно писать и о чём угодно):</span><br><b>' + esc(w.diaryQ || en) + '</b>' + (w.diaryQ ? '' : ' <span class="muted small">— ' + esc(ru) + '</span>') +
        ' <button type="button" class="link-btn" data-p="next-prompt">другая</button></p>' +
        '<textarea name="text" rows="8" placeholder="Today I…">' + esc(w.diaryDraft || '') + '</textarea>' +
        '<div class="row-btns"><button class="btn primary" data-p="save-check">' + I('check') + ' Проверить и сохранить</button><button type="button" class="btn" data-p="save-plain">Просто сохранить</button></div>' + (ready() ? '' : noAI) +
      '</form>' +
      (entries.length ? '<section class="card"><h2>Записи</h2>' + entries.map((e) =>
        '<article class="pr-entry"><div class="pr-entry-head"><b>' + U.dateLabel(e.ts) + '</b>' + (e.prompt ? '<span class="muted small">' + esc(e.prompt) + '</span>' : '') +
          '<button class="icon-btn small" data-p="del-entry" data-id="' + e.id + '" aria-label="Удалить запись">' + I('x') + '</button></div>' +
          '<p>' + esc(e.text).replace(/\n/g, '<br>') + '</p>' +
          (e.fb ? '<details><summary class="small">Разбор</summary>' + feedbackHTML(e.fb, { askBtn: 'answer-q' }) + '</details>'
            : '<button class="btn small" data-p="check-entry" data-id="' + e.id + '">' + I('sparkles') + ' Проверить</button>') +
        '</article>').join('') + '</section>' : '');
  }

  // ---------- События ----------

  function addWord(en, ru) {
    if (App.quickCard) App.quickCard({ word: en, back: ru });
  }

  document.addEventListener('click', async (e) => {
    if (!root || !root.contains(e.target)) return;
    const b = e.target.closest('[data-p]');
    if (!b) return;
    const w = W();
    const act = b.dataset.p;
    if (act === 'word') addWord(b.dataset.en, b.dataset.ru);
    if (act === 'pick-topic') {
      let t = b.dataset.t;
      if (t === '__random') t = TOPICS[Math.floor(Math.random() * TOPICS.length)];
      startTopic(b, b.dataset.k, t);
    }
    if (act === 'kind') { w.textKind = b.dataset.v; Store.save(); App.render(); }
    if (act === 'new-talk') { w.talkId = null; Store.save(); App.render(); }
    if (act === 'resume-talk') { w.talkId = b.dataset.id; Store.save(); App.render(); }
    if (act === 'new-text') { w.current = null; Store.save(); App.render(); }
    if (act === 'retry-text' && w.current) { w.current.fb = null; Store.save(); App.render(); }
    if (act === 'speak-text' && w.current) App.speak(String(w.current.text).replace(/^[A-Z][\w .'-]{0,20}:\s*/gm, ''), 'en-US');
    if (act === 'copy-text' && w.current) { saveTextAnswers(); copyPrompt(textCheckPrompt(w.current)); }
    if (act === 'new-pic') { w.picDraft = ''; loadPicture(b); }
    if (act === 'retry-pic' && w.pic) { w.picDraft = w.pic.text; w.pic.fb = null; w.pic.text = ''; Store.save(); App.render(); }
    if (act === 'copy-pic' && w.pic) {
      const t = (root.querySelector('#pr-pic-form textarea') || {}).value || '';
      copyPrompt('Я учу английский (уровень ' + level() + '). Я описывала картинку: ' + (w.pic.desc || w.pic.title) + '\nПроверь моё описание: исправь ошибки, объясни их по-русски и подскажи полезные слова.\n\n' + t);
    }
    if (act === 'next-prompt') { w.diaryQ = ''; promptShift++; App.render(); }
    if (act === 'answer-q') { w.diaryQ = b.dataset.q; location.hash = '#/practice/diary'; App.render(); window.scrollTo(0, 0); }
    if (act === 'save-plain') saveDiary(null, false);
    if (act === 'del-entry') {
      if (!(await App.confirm('Удалить эту запись из дневника?', 'Удалить'))) return;
      w.diary = w.diary.filter((x) => x.id !== b.dataset.id); Store.save(); App.render();
    }
    if (act === 'check-entry') {
      const en = w.diary.find((x) => x.id === b.dataset.id);
      if (!en) return;
      if (!ready()) { copyPrompt('Я учу английский (уровень ' + level() + '). Проверь мою запись в дневнике: исправь ошибки, объясни по-русски, подскажи полезные слова.\n\n' + en.text); return; }
      const fb = await checkWriting(b, 'Это запись в её личном дневнике' + (en.prompt ? ' на тему «' + en.prompt + '»' : '') + '. Отнесись тепло.', en.text);
      if (fb) { en.fb = fb; Store.save(); App.render(); }
    }
  });

  function startTopic(btn, kind, topic) {
    topic = String(topic || '').trim();
    if (!topic) return;
    const w = W();
    if (kind === 'talk') {
      if (!ready()) { U.toast('Для разговора подключи нейросеть: Настройки → «Нейросеть»'); return; }
      const t = { id: U.uid(), topic, ts: Date.now() };
      w.talks.push(t);
      if (w.talks.length > 30) w.talks.splice(0, w.talks.length - 30);
      w.talkId = t.id;
      Store.save(); App.render();
    } else {
      if (!ready()) { U.toast('Для текста подключи нейросеть: Настройки → «Нейросеть»'); return; }
      newText(btn, topic, w.textKind);
    }
  }

  function saveTextAnswers() {
    const c = W().current;
    const f = root && root.querySelector('#pr-q-form');
    if (!c || !f) return;
    c.answers = c.questions.map((_, i) => ((f.querySelector('[name=a' + i + ']') || {}).value || '').trim());
    Store.saveSoon();
  }

  async function saveDiary(btn, check) {
    const w = W();
    const f = root.querySelector('#pr-diary-form');
    const text = (f.querySelector('textarea').value || '').trim();
    if (!text) { U.toast('Напиши хоть пару слов'); return; }
    const entry = { id: U.uid(), ts: Date.now(), prompt: w.diaryQ || todayPrompt()[0], text, fb: null };
    if (check) {
      if (!ready()) { copyPrompt('Я учу английский (уровень ' + level() + '). Проверь мою запись в дневнике: исправь ошибки, объясни по-русски, подскажи полезные слова.\n\n' + text); }
      else entry.fb = await checkWriting(btn, 'Это запись в её личном дневнике на тему «' + entry.prompt + '» (тему можно не соблюдать). Отнесись тепло.', text);
    }
    w.diary.push(entry);
    w.diaryDraft = ''; w.diaryQ = '';
    gainXP(15);
    Store.save(); App.render();
  }

  document.addEventListener('submit', async (e) => {
    if (!root || !root.contains(e.target)) return;
    const f = e.target;
    const w = W();
    if (f.classList.contains('pr-own')) {
      e.preventDefault();
      startTopic(f.querySelector('button.primary'), f.dataset.k, f.querySelector('textarea').value);
    }
    if (f.id === 'pr-q-form') {
      e.preventDefault();
      saveTextAnswers();
      const c = w.current;
      if (!c.answers.some(Boolean)) { U.toast('Ответь хотя бы на один вопрос'); return; }
      if (!ready()) { copyPrompt(textCheckPrompt(c)); return; }
      const r = await AI.run(f.querySelector('button.primary'), () => AI.ask({ json: true, temperature: 0.3, maxTokens: 4000,
        system: 'Ты — добрая и точная преподавательница английского. Объясняешь по-русски, коротко и конкретно.', prompt: textCheckPrompt(c) }));
      if (!r) return;
      c.fb = { answers: Array.isArray(r.answers) ? r.answers : [], overall: r.overall || '', words: r.words || [], question: r.question || '' };
      w.items.push({ id: c.id, kind: 'text', title: c.title, ts: Date.now() });
      gainXP(5 * c.answers.filter(Boolean).length);
      Store.save(); App.render();
    }
    if (f.id === 'pr-pic-form') {
      e.preventDefault();
      const p = w.pic;
      const text = (f.querySelector('textarea').value || '').trim();
      if (!text) { U.toast('Опиши хоть пару предложений'); return; }
      p.text = text;
      if (!ready()) { Store.save(); copyPrompt('Я учу английский (уровень ' + level() + '). Я описывала картинку: ' + (p.desc || p.title) + '\nПроверь моё описание: исправь ошибки, объясни их по-русски и подскажи полезные слова.\n\n' + text); return; }
      let img = null;
      try { img = await imageData(p.src); } catch (err) { /* без картинки — проверим только язык */ }
      const fb = await checkWriting(f.querySelector('button.primary'), img ? picSeenContext(p) : picContext(p), text, img ? { images: [img], fallback: picContext(p) } : null);
      if (!fb) return;
      p.fb = fb; w.picDraft = '';
      w.items.push({ id: U.uid(), kind: 'picture', title: 'Картинка: ' + (p.title || 'фото дня').slice(0, 60), ts: Date.now() });
      gainXP(10);
      Store.save(); App.render();
    }
    if (f.id === 'pr-diary-form') {
      e.preventDefault();
      saveDiary(f.querySelector('[data-p=save-check]'), true);
    }
  });

  // Черновики не теряются при переходе между разделами
  document.addEventListener('input', (e) => {
    if (!root || !root.contains(e.target)) return;
    const w = W();
    const f = e.target.form;
    if (!f) return;
    if (f.id === 'pr-diary-form') { w.diaryDraft = e.target.value; Store.saveSoon(); }
    if (f.id === 'pr-pic-form') { w.picDraft = e.target.value; Store.saveSoon(); }
    if (f.id === 'pr-q-form') saveTextAnswers();
  });

  App.views.practice = { render, group: 'cards', leave() { root = null; } };
})();
