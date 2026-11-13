// ML → «Конспекты»: заметки из Obsidian (data/notes.json), Markdown + формулы + callout-блоки + [[ссылки]].
// По каждой заметке: «объясни глубже», тест и вопросы для собеса от нейросети, «сделать тему».
(function () {
  'use strict';

  const App = window.App = window.App || {};
  const MARKED = 'https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js';
  let data = null, loading = null, markedLoading = null;
  let query = '';

  function P() { const st = Store.state; st.ml = st.ml || {}; ['notesRead', 'noteQs', 'noteQuiz'].forEach((k) => { st.ml[k] = st.ml[k] || {}; }); return st.ml; }
  const enc = encodeURIComponent;
  const noteHref = (t) => '#/ml/n/' + enc(t);
  const nice = (s) => s.replace(/^\d\d\s+/, '');

  App.loadMarked = function () {
    if (window.marked) return Promise.resolve();
    if (!markedLoading) {
      markedLoading = new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = MARKED; s.onload = res; s.onerror = () => { markedLoading = null; rej(new Error('Не загрузилась библиотека Markdown')); };
        document.head.appendChild(s);
      });
    }
    return markedLoading;
  };

  App.mlNotesLoad = function () {
    if (data) return Promise.resolve(data);
    if (!loading) {
      loading = Promise.all([
        fetch('data/notes.json').then((r) => { if (!r.ok) throw new Error('конспекты не загрузились (' + r.status + ')'); return r.json(); }),
        App.loadMarked(),
      ]).then(([d]) => {
        d.byTitle = {};
        d.notes.forEach((n) => { d.byTitle[n.t.toLowerCase()] = n; });
        data = d;
        return d;
      }).catch((e) => { loading = null; throw e; });
    }
    return loading;
  };
  App.mlNote = (title) => data && data.byTitle[String(title).toLowerCase()];

  // Markdown в стиле Obsidian → HTML. Код не трогаем, формулы и [[ссылки]] — через заглушки.
  App.renderNoteMd = function (md) {
    const store = [];
    const put = (html) => 'Ⓚ' + (store.push(html) - 1) + 'Ⓚ';
    const src = String(md).split(/(```[\s\S]*?```|`[^`\n]+`)/g).map((p, i) => (i % 2 ? p : p
      .replace(/\$\$([\s\S]+?)\$\$/g, (m, t) => put(App.tex(t.replace(/^[ \t]*>[ \t]?/gm, '').trim(), true)))
      .replace(/\$([^\s$](?:[^$\n]*?[^\s$\\])?)\$/g, (m, t) => put(App.tex(t, false)))
      .replace(/\[\[([^\]|#]+)(#[^\]|]*)?(?:\|([^\]]*))?\]\]/g, (m, target, anchor, alias) => {
        const n = App.mlNote(target.trim());
        const label = U.esc((alias || target).trim());
        return put(n ? '<a class="wikilink" href="' + noteHref(n.t) + '">' + label + '</a>' : '<span class="wikilink dead">' + label + '</span>');
      }))).join('');
    let html = window.marked ? window.marked.parse(src, { gfm: true, breaks: true }) : '<pre>' + U.esc(src) + '</pre>';
    return html.replace(/Ⓚ(\d+)Ⓚ/g, (m, i) => store[+i]);
  };

  const CALLOUT = { info: 'Инфо', abstract: 'Кратко', summary: 'Кратко', tldr: 'Кратко', danger: 'Важно', warning: 'Внимание', caution: 'Внимание', note: 'Заметка',
    example: 'Пример', important: 'Важно', definition: 'Определение', question: 'Вопрос', faq: 'Вопрос', bug: 'Типичная ошибка', tip: 'Совет', hint: 'Совет',
    quote: 'Цитата', success: 'Получилось', check: 'Проверка', failure: 'Ошибка', todo: 'Сделать' };
  App.enhanceNote = function (root) {
    root.querySelectorAll('blockquote').forEach((bq) => {
      const p = bq.firstElementChild;
      if (!p || p.tagName !== 'P') return;
      const m = p.innerHTML.match(/^\s*\[!(\w+)\]([+-]?)[ \t]*([^<\n]*)(?:<br>)?\n?/);
      if (!m) return;
      const type = m[1].toLowerCase();
      p.innerHTML = p.innerHTML.slice(m[0].length);
      if (!p.textContent.trim() && !p.querySelector('.katex, img')) p.remove();
      const box = document.createElement(m[2] ? 'details' : 'div');
      box.className = 'callout callout-' + type;
      if (m[2] === '+') box.open = true;
      const head = document.createElement(m[2] ? 'summary' : 'div');
      head.className = 'callout-title';
      head.textContent = m[3].trim() || CALLOUT[type] || type;
      box.appendChild(head);
      while (bq.firstChild) box.appendChild(bq.firstChild);
      bq.replaceWith(box);
    });
    root.querySelectorAll('table').forEach((t) => { if (!t.parentElement.classList.contains('table-wrap')) { const w = document.createElement('div'); w.className = 'table-wrap'; t.replaceWith(w); w.appendChild(t); } });
  };

  // ---------- Список ----------

  function tree(notes) {
    const groups = {};
    notes.forEach((n) => { (groups[n.g] = groups[n.g] || []).push(n); });
    return Object.keys(groups).sort().map((g) => [g, groups[g]]);
  }

  App.mlNotesList = function (el, head) {
    el.innerHTML = head + '<section class="card notes-search"><input id="note-q" type="search" placeholder="Поиск по конспектам: например, «AdamW» или «утечка»" value="' + U.esc(query) + '"></section>' +
      '<div id="notes-body"><p class="muted">Загружаю конспекты…</p></div>';
    App.mlNotesLoad().then(() => {
      if (!el.isConnected) return;
      const inp = el.querySelector('#note-q');
      inp.addEventListener('input', () => { query = inp.value; drawList(el); });
      drawList(el);
    }).catch((e) => { el.querySelector('#notes-body').innerHTML = '<p class="muted">' + U.esc(e.message) + '. Проверь интернет и обнови страницу.</p>'; });
  };

  function drawList(el) {
    const pr = P();
    const body = el.querySelector('#notes-body');
    const q = query.trim().toLowerCase();
    if (q) {
      const hits = data.notes.filter((n) => n.t.toLowerCase().includes(q) || n.md.toLowerCase().includes(q)).slice(0, 60);
      body.innerHTML = '<section class="card"><h2>Найдено: ' + hits.length + '</h2><div class="note-list">' + hits.map((n) => {
        const i = n.md.toLowerCase().indexOf(q);
        const snip = i >= 0 ? n.md.slice(Math.max(0, i - 60), i + 90).replace(/[#>*`$\[\]]/g, '') : '';
        return '<a class="note-link" href="' + noteHref(n.t) + '"><b>' + U.esc(n.t) + '</b><small>' + U.esc(n.g.split('/').map(nice).join(' › ')) + '</small>' +
          (snip ? '<span class="muted small">…' + U.esc(snip) + '…</span>' : '') + '</a>';
      }).join('') + '</div></section>';
      return;
    }
    const read = data.notes.filter((n) => pr.notesRead[n.t]).length;
    let lastTop = '';
    body.innerHTML = '<p class="muted small">Твои заметки из Obsidian: ' + data.notes.length + ' конспектов, прочитано ' + read + '. Формулы, ссылки между заметками и блоки — как в Obsidian.</p>' +
      tree(data.notes).map(([g, list]) => {
        const segs = g.split('/');
        const top = segs[0];
        const sub = segs.slice(1).map(nice).join(' › ');
        const opener = top !== lastTop ? (lastTop ? '</section>' : '') + '<section class="card"><h2>' + U.esc(nice(top)) + '</h2>' : '';
        lastTop = top;
        return opener + (sub ? '<h3 class="notes-sub">' + U.esc(sub) + '</h3>' : '') + '<div class="note-list">' + list.map((n) =>
          '<a class="note-link' + (pr.notesRead[n.t] ? ' read' : '') + '" href="' + noteHref(n.t) + '"><b>' + U.esc(nice(n.t)) + '</b>' +
          (pr.notesRead[n.t] ? '<span class="topic-done">' + I('check') + '</span>' : '') + '</a>').join('') + '</div>';
      }).join('') + (lastTop ? '</section>' : '');
  }

  // ---------- Заметка ----------

  App.mlNoteView = function (el, head, title, backHTML) {
    el.innerHTML = head + (backHTML || '<a class="link-btn" href="#/ml/notes">' + I('chevron-left') + ' Все конспекты</a>') + '<div id="note-body"><p class="muted">Загружаю…</p></div>';
    App.mlNotesLoad().then(() => {
      if (!el.isConnected) return;
      const n = App.mlNote(title);
      const box = el.querySelector('#note-body');
      if (!n) { box.innerHTML = '<p class="muted">Такой заметки нет.</p>'; return; }
      const pr = P();
      const qs = (pr.noteQs[n.t] || { items: [] }).items;
      box.innerHTML =
        '<article class="card note-body"><p class="muted small">' + U.esc(n.g.split('/').map(nice).join(' › ')) + '</p>' +
          (/^\s*#\s/.test(n.md) ? '' : '<h1 class="note-title">' + U.esc(nice(n.t)) + '</h1>') + App.renderNoteMd(n.md) + '</article>' +
        '<section class="card theory-actions"><h2>Закрепить</h2><div class="row-btns">' +
          '<button class="btn primary" data-mn="read">' + I('check') + (pr.notesRead[n.t] ? ' Прочитано' : ' Отметить прочитанным') + '</button>' +
          App.mlBankBtns('note:' + n.t, 'data-mn', 'quiz', 'quiz-saved', 'Тест по конспекту') +
          '<button class="btn ai-btn" data-mn="qs">' + I('sparkles') + ' Вопросы для собеса</button>' +
          '<button class="btn ai-btn" data-mn="topic">' + I('book') + ' Сделать тему с тестами</button></div>' +
          (pr.noteQuiz[n.t] != null ? '<p class="muted small">Лучший результат теста: ' + pr.noteQuiz[n.t] + '%</p>' : '') +
          '<p class="muted small">Тест и вопросы нейросеть составит по тексту этой заметки и сохранит — пройти их снова можно без новых запросов. «Сделать тему» — появится в «Мои темы» с теорией, формулами, вопросами и тестом.</p></section>' +
        (qs.length ? '<section class="card"><h2 class="h-ic">' + I('sparkles') + ' Вопросы по конспекту (' + qs.length + ')</h2><div class="iv-list">' +
          qs.map((x, i) => App.mlIvCard({ id: 'note:' + n.t + '#' + i, module: 'notes', topic: { id: '', title: n.t }, href: noteHref(n.t), q: x[0], a: x[1] }, false)).join('') + '</div></section>' : '') +
        App.askBoxHTML('note-' + n.id, 'Объясни глубже', 'Например: «выведи формулу по шагам» или «приведи пример на числах»');
      App.enhanceNote(box.querySelector('.note-body'));
      App.bindAskBox(box, 'note-' + n.id, () => 'Конспект «' + n.t + '»:\n' + n.md.slice(0, 9000), {
        system: 'Ты — сильный преподаватель ML и математики для студентки 3 курса, которая изучает компьютерное зрение. Опираешься на её конспект, но объясняешь глубже: интуиция, строгая математика, вывод формул по шагам, пример на числах, код на numpy/PyTorch, если уместно. Формулы пиши в LaTeX: $...$ внутри строки и $$...$$ отдельной строкой. По-русски, структурно.',
        copyIntro: 'Объясни глубже по моему конспекту (формулы в LaTeX, по-русски):',
        temperature: 0.4,
      });
    }).catch((e) => { const b = el.querySelector('#note-body'); if (b) b.innerHTML = '<p class="muted">' + U.esc(e.message) + '</p>'; });
  };

  function currentNote() {
    const m = location.hash.match(/^#\/ml\/n\/(.+)$/);
    return m ? App.mlNote(decodeURIComponent(m[1])) : null;
  }

  async function noteQuiz(btn, n) {
    if (!AI.ready() && !AI._mock) { U.toast('Подключи нейросеть в Настройках'); return; }
    const r = await AI.run(btn, () => AI.ask({
      json: true, temperature: 0.5, maxTokens: 6000,
      system: 'Ты — экзаменатор по машинному обучению. Составляешь точные вопросы с одним правильным ответом по-русски. Формулы — в LaTeX внутри $...$. Это JSON, поэтому каждый обратный слэш пиши двойным: \\\\frac, \\\\sum.',
      prompt: 'Конспект «' + n.t + '»:\n' + n.md.slice(0, 12000) + '\n\nСоставь 8 вопросов по этому конспекту уровня собеседования: на понимание, на вычисление (формы, числа, формулы), на сравнение методов и 1–2 с ловушкой. Не спрашивай про оформление заметки. ' +
        'Верни JSON: {"questions": [{"question": "...", "options": ["...", "...", "...", "..."], "answer": 0, "explain": "почему так, 1–2 предложения"}]}',
    }));
    if (!r || !Array.isArray(r.questions) || !r.questions.length) return;
    const qs = r.questions.map((q) => App.fixTexDeep(q));
    App.mlQuizBankAdd('note:' + n.t, qs);
    App.startQuiz('Тест: ' + nice(n.t), qs.map((q) => Object.assign({ type: 'choice' }, q)), (pct) => {
      const pr = P(); pr.noteQuiz[n.t] = Math.max(pr.noteQuiz[n.t] || 0, pct); Store.save();
    }, noteHref(n.t));
  }

  async function noteQs(btn, n) {
    if (!AI.ready() && !AI._mock) { U.toast('Подключи нейросеть в Настройках'); return; }
    const pr = P();
    const have = (pr.noteQs[n.t] || { items: [] }).items;
    const r = await AI.run(btn, () => AI.ask({
      json: true, temperature: 0.5, maxTokens: 6000,
      system: 'Ты — интервьюер на позицию junior ML/CV-инженера. Задаёшь вопросы, которые реально задают на собеседованиях, и даёшь сильные развёрнутые ответы по-русски. Формулы — LaTeX в $...$; в JSON обратные слэши удваивай.',
      prompt: 'Конспект «' + n.t + '»:\n' + n.md.slice(0, 12000) + '\n\n' + (have.length ? 'Уже есть вопросы: ' + have.map((x) => x[0]).join(' | ') + '. Не повторяй их.\n' : '') +
        'Составь 6 вопросов для собеседования по этой теме: от базового к глубокому (почему, что будет если, сравни, выведи). Ответ — 3–6 предложений, как ответил бы сильный кандидат. ' +
        'Верни JSON: {"items": [{"q": "вопрос", "a": "ответ"}]}',
    }));
    if (!r || !Array.isArray(r.items)) return;
    const items = r.items.filter((x) => x && x.q && x.a).map((x) => [App.fixTex(x.q), App.fixTex(x.a)]);
    pr.noteQs[n.t] = { items: have.concat(items) };
    Store.save(); U.toast('Добавлено вопросов: ' + items.length + ' — они есть и во вкладке «Собеседование»');
    App.render();
  }

  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-mn]');
    if (!b) return;
    const n = currentNote();
    if (!n) return;
    const pr = P();
    switch (b.dataset.mn) {
      case 'read':
        if (pr.notesRead[n.t]) delete pr.notesRead[n.t]; else { pr.notesRead[n.t] = Date.now(); U.toast('Отмечено как прочитанное'); }
        Store.save(); App.render(); break;
      case 'quiz': noteQuiz(b, n); break;
      case 'quiz-saved': App.mlPlayBank('note:' + n.t, 'Тест: ' + nice(n.t), noteHref(n.t), (pct) => { const pr = P(); pr.noteQuiz[n.t] = Math.max(pr.noteQuiz[n.t] || 0, pct); Store.save(); }); break;
      case 'qs': noteQs(b, n); break;
      case 'topic': if (App.mlGenerateTopic) App.mlGenerateTopic(b, nice(n.t), n.md); break;
    }
  });
})();
