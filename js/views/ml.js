// Раздел «ML»: теория по модулям (основы, DL, CV, LLM), собеседование, практика с кодом.
// Код на Python запускается прямо в браузере через Pyodide (в отдельном потоке — Web Worker).
(function () {
  'use strict';

  const App = window.App = window.App || {};
  App.views = App.views || {};

  let root = null;
  let ivModule = 'all';
  let ivReveal = {};
  let codeOut = '', codeTb = '', codeFor = ''; // вывод тестов последней задачи (сохраняется, пока ходишь в теорию и обратно)
  // Откуда пришли в теорию/конспект — чтобы вернуться к задаче одной кнопкой
  let backStack = [];
  window.addEventListener('hashchange', (e) => {
    const oldH = '#' + ((e.oldURL || '').split('#')[1] || '');
    const newH = location.hash;
    if (!/^#\/ml\/(t|n)\//.test(newH)) { backStack = []; return; }
    if (backStack[backStack.length - 1] === newH) backStack.pop();
    else if (/^#\/ml\/(code\/|t\/|n\/)/.test(oldH) && oldH !== newH) backStack.push(oldH);
  });
  function backLabel(h) {
    const m = h.match(/^#\/ml\/(code|t|n)\/(.+)$/);
    if (!m) return '';
    if (m[1] === 'code') return 'задача «' + ((task(m[2]) || {}).title || '') + '»';
    if (m[1] === 't') return 'тема «' + ((topic(m[2]) || {}).title || '') + '»';
    return 'конспект «' + decodeURIComponent(m[2]).replace(/^\d\d\s+/, '') + '»';
  }
  function backLinkHTML(href, text) {
    const b = backStack[backStack.length - 1];
    if (b && b !== location.hash) return '<a class="link-btn back-to" href="' + b + '">' + I('chevron-left') + ' Назад: ' + U.esc(backLabel(b)) + '</a>';
    return '<a class="link-btn" href="' + href + '">' + I('chevron-left') + ' ' + text + '</a>';
  }

  function S() { return Store.state; }
  function P() { const st = S(); st.ml = st.ml || {}; ['quiz', 'cards', 'code', 'solved', 'ans', 'checks', 'deep', 'noteQs', 'scratch', 'aiQuiz', 'runs', 'ansHist', 'hintLvl'].forEach((k) => { st.ml[k] = st.ml[k] || {}; }); st.ml.custom = st.ml.custom || []; return st.ml; }
  function topics() { return (window.ML_TOPICS || []).concat(P().custom); }
  function modules() { return (window.ML_MODULES || []).concat(P().custom.length ? [['mine', 'Мои темы', 'созданы по запросу или из конспектов']] : []); }
  function tasks() { return window.ML_TASKS || []; }
  function topic(id) { return topics().find((t) => t.id === id); }
  function task(id) { return tasks().find((t) => t.id === id); }
  function modName(m) { if (m === 'notes') return 'Из конспектов'; if (m === 'libs') return 'Библиотеки'; const x = modules().find((y) => y[0] === m); return x ? x[1] : m; }
  function parts() { return location.hash.replace(/^#\/?/, '').split('/'); } // ['ml', 't', id]

  // Все вопросы собеседования с идентификаторами
  function questions() {
    const out = [];
    topics().forEach((t) => (t.interview || []).forEach(([q, a], i) => out.push({ id: t.id + '#' + i, module: t.module, topic: t, href: '#/ml/t/' + t.id, q, a })));
    libs().forEach((l) => (l.interview || []).forEach(([q, a], i) =>
      out.push({ id: 'lib:' + l.id + '#' + i, module: 'libs', topic: { id: '', title: l.name }, href: '#/ml/lib/' + l.id, q, a })));
    const nq = P().noteQs;
    Object.keys(nq).forEach((title) => (nq[title].items || []).forEach(([q, a], i) =>
      out.push({ id: 'note:' + title + '#' + i, module: 'notes', topic: { id: '', title }, href: '#/ml/n/' + encodeURIComponent(title), q, a })));
    return out;
  }

  // ---------- Python в браузере (Pyodide) ----------

  const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
  let worker = null, ready = null, pending = null;

  // Python-обвязка: код из редактора, потом тесты или строки песочницы (последнее выражение печатается, как в Jupyter)
  const PY_RUNNER = String.raw`
import ast, re as _re
ns = {"__name__": "__main__", "USER_SOURCE": USER_CODE}
exec(compile(USER_CODE, "solution.py", "exec"), ns)
if TEST_CODE and MODE == "repl":
    _tree = ast.parse(TEST_CODE, "sandbox.py")
    _last = _tree.body.pop() if _tree.body and isinstance(_tree.body[-1], ast.Expr) else None
    exec(compile(_tree, "sandbox.py", "exec"), ns)
    if _last is not None:
        _v = eval(compile(ast.Expression(body=_last.value), "sandbox.py", "eval"), ns)
        if _v is not None:
            print(repr(_v))
elif TEST_CODE:
    # как pytest: каждая проверка (блок до print("✓ ...")) выполняется отдельно, падение одной не останавливает остальные
    _lines = TEST_CODE.split("\n")
    _chunks, _start = [], 0
    for _i, _l in enumerate(_lines):
        if _re.match(r"print\(\s*f?[\"']✓", _l):
            _chunks.append((_start, _i + 1))
            _start = _i + 1
    if any(_l.strip() for _l in _lines[_start:]):
        _chunks.append((_start, len(_lines)))
    _passed, _first = 0, None
    for _a, _b in _chunks:
        _name = "проверка"
        for _l in _lines[_a:_b]:
            _m = _re.match(r"print\(\s*f?[\"']✓\s*(.*?)[\"']\s*\)\s*$", _l)
            if _m:
                _name = _m.group(1)
        try:
            exec(compile("\n" * _a + "\n".join(_lines[_a:_b]), "tests.py", "exec"), ns)
            _passed += 1
        except (KeyboardInterrupt, SystemExit):
            raise
        except BaseException as _e:          # BaseException: pytest.fail / «DID NOT RAISE» тоже считаем провалом проверки
            _msg = str(_e)
            print("✗ " + _name + " — " + type(_e).__name__ + (": " + _msg if _msg else ""))
            if _first is None:
                _first = _e
    print("Итого: пройдено " + str(_passed) + " из " + str(len(_chunks)) + " проверок")
    if _first is not None:
        raise _first
`;

  function makeWorker() {
    const src = `
      const RUNNER = ${JSON.stringify(PY_RUNNER)};
      importScripts('${PYODIDE}pyodide.js');
      const boot = loadPyodide({ indexURL: '${PYODIDE}' }).then(async (py) => { await py.loadPackage('numpy'); return py; });
      self.onmessage = async (e) => {
        let py;
        try { py = await boot; } catch (err) { self.postMessage({ ok: false, out: '', err: 'Не удалось загрузить Python: ' + err }); return; }
        if (e.data.ping) { self.postMessage({ ready: true }); return; }
        const out = [];
        py.setStdout({ batched: (s) => out.push(s) });
        py.setStderr({ batched: (s) => out.push(s) });
        try {
          py.globals.set('USER_CODE', e.data.code);
          py.globals.set('TEST_CODE', e.data.tests || '');
          py.globals.set('MODE', e.data.mode || 'tests');
          await py.loadPackagesFromImports(e.data.code + '\\n' + (e.data.tests || ''));
          py.runPython(RUNNER);
          self.postMessage({ ok: true, out: out.join('\\n') });
        } catch (err) {
          self.postMessage({ ok: false, out: out.join('\\n'), tb: String(err.message || err) });
        }
      };`;
    worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'application/javascript' })));
    worker.onmessage = (e) => { if (pending) { const p = pending; pending = null; p(e.data); } };
    ready = null;
  }

  // Ошибка Python → коротко (какой тест, какая строка твоего кода) + чистый traceback только по нашим файлам
  function formatPyError(res, code, extra, mode) {
    if (!res.tb) return { short: res.err || 'Ошибка', tb: '' };
    const lines = res.tb.split('\n');
    const re = /File "(solution|tests|sandbox)\.py", line (\d+)/;
    const src = { solution: code || '', tests: mode === 'repl' ? '' : extra || '', sandbox: mode === 'repl' ? extra || '' : '' };
    const srcLine = (f, n) => ((src[f] || '').split('\n')[n - 1] || '').trim();
    const frames = [];
    const clean = ['Traceback (most recent call last):'];
    lines.forEach((l) => {
      const m = l.match(re);
      if (!m) return;
      frames.push({ file: m[1], line: +m[2] });
      clean.push(l.replace(/^\s*/, '  '));
      const t = srcLine(m[1], +m[2]);
      if (t) clean.push('    ' + t);
    });
    let last = lines.filter((l) => l.trim()).pop() || '';
    // у SyntaxError последняя строка — это сообщение, а перед ней Python печатает строку кода с ^
    const caret = lines.findIndex((l, i) => /^\s*\^+\s*$/.test(l) && i >= 2 && re.test(lines[i - 2]));
    if (caret > 0) { clean.pop(); clean.push(lines[caret - 1], lines[caret]); }
    clean.push(last);
    const testF = frames.filter((f) => f.file === 'tests').pop();
    const userF = frames.filter((f) => f.file !== 'tests').pop();
    const where = { solution: 'в твоём коде', sandbox: 'в песочнице' };
    const parts = [];
    if (testF) parts.push('Не прошёл тест (строка ' + testF.line + ' тестов):\n    ' + srcLine('tests', testF.line));
    if (userF) parts.push('Ошибка ' + where[userF.file] + ', строка ' + userF.line + ':\n    ' + srcLine(userF.file, userF.line));
    parts.push(last);
    return { short: parts.join('\n'), tb: frames.length ? clean.join('\n') : res.tb };
  }
  function nChecks(t) { return (String(t.tests || '').match(/^print\(\s*f?["']✓/gm) || []).length; }
  function tbHTML(tb) {
    return tb ? '<details class="tb-box"><summary>Полный вывод ошибки (traceback)</summary><pre class="code-out bad">' + U.esc(tb) + '</pre></details>' : '';
  }

  // Пакеты, которые грузятся при первом import (несколько МБ) — на это время даём больше
  const HEAVY = { pandas: 'pandas', sklearn: 'scikit-learn', scipy: 'SciPy', skimage: 'scikit-image', matplotlib: 'matplotlib', PIL: 'Pillow', pytest: 'pytest' };
  const loadedPkgs = new Set();
  function newHeavy(src) {
    return Object.keys(HEAVY).filter((m) => !loadedPkgs.has(m) && new RegExp('^\\s*(import|from)\\s+' + m + '\\b', 'm').test(src));
  }
  function loadingText(first, src, idle) {
    const h = worker ? newHeavy(src) : Object.keys(HEAVY).filter((m) => new RegExp('^\\s*(import|from)\\s+' + m + '\\b', 'm').test(src));
    const parts = [];
    if (first) parts.push('Python');
    if (h.length) parts.push(h.map((m) => HEAVY[m]).join(', '));
    return parts.length ? 'Загружаю ' + parts.join(' и ') + ' в браузер (один раз, до минуты)…' : idle;
  }
  function runPython(code, tests, timeoutMs, mode) {
    if (!worker) { makeWorker(); loadedPkgs.clear(); }
    const heavy = newHeavy(code + '\n' + (tests || ''));
    if (heavy.length) timeoutMs = Math.max(timeoutMs, 150000);
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        pending = null;
        worker.terminate(); worker = null; // бесконечный цикл — перезапускаем Python
        resolve({ ok: false, out: '', err: 'Превышено время (' + Math.round(timeoutMs / 1000) + ' с). Нет ли бесконечного цикла?' });
      }, timeoutMs);
      pending = (res) => { clearTimeout(timer); if (res.ok || res.tb) heavy.forEach((m) => loadedPkgs.add(m)); resolve(res); };
      worker.postMessage({ code, tests, mode });
    });
  }

  // ---------- Экраны ----------

  function render(el) {
    root = el;
    const p = parts();
    if (p[1] === 't' && topic(p[2])) return renderTopic(el, topic(p[2]));
    if (p[1] === 'code' && task(p[2])) return renderTask(el, task(p[2]));
    if (p[1] === 'code') return renderTasks(el);
    if (p[1] === 'play') return renderPlay(el);
    if (p[1] === 'libs') return renderLibs(el);
    if (p[1] === 'lib' && lib(p[2])) return renderLib(el, lib(p[2]));
    if (p[1] === 'interview') return renderInterview(el);
    if (p[1] === 'notes') return App.mlNotesList(el, header('Твои конспекты из Obsidian — с формулами, тестами и вопросами') + tabs('notes'));
    if (p[1] === 'n' && p[2]) return App.mlNoteView(el, header() + tabs('notes'), decodeURIComponent(p.slice(2).join('/')), backLinkHTML('#/ml/notes', 'Все конспекты'));
    renderHome(el);
  }

  function tabs(active) {
    return '<div class="seg lang-tabs" role="tablist">' +
      '<a class="' + (active === 'home' ? 'on' : '') + '" href="#/ml">' + I('book') + ' Темы</a>' +
      '<a class="' + (active === 'notes' ? 'on' : '') + '" href="#/ml/notes">' + I('note') + ' Конспекты</a>' +
      '<a class="' + (active === 'libs' ? 'on' : '') + '" href="#/ml/libs">' + I('grid') + ' Библиотеки</a>' +
      '<a class="' + (active === 'interview' ? 'on' : '') + '" href="#/ml/interview">' + I('sparkles') + ' Собеседование</a>' +
      '<a class="' + (active === 'code' ? 'on' : '') + '" href="#/ml/code">' + I('code') + ' Практика с кодом</a></div>';
  }

  function header(sub) {
    return '<header class="page-head"><div><h1>ML</h1><p class="muted">' + (sub || 'Теория, вопросы с собеседований и практика') + '</p></div></header>';
  }

  function renderHome(el) {
    const pr = P();
    const qs = questions();
    const known = qs.filter((q) => pr.cards[q.id] === 'known').length;
    const solved = tasks().filter((t) => pr.solved[t.id]).length;
    el.innerHTML = header() + tabs('home') +
      '<div class="kpis ml-kpis">' +
        '<div class="kpi card"><span class="kpi-label">Тем изучено</span><span class="kpi-value">' + topics().filter((t) => pr.quiz[t.id] >= 50).length + '/' + topics().length + '</span><span class="kpi-sub">тест ≥ 50%</span></div>' +
        '<div class="kpi card"><span class="kpi-label">Вопросы собеса</span><span class="kpi-value">' + known + '/' + qs.length + '</span><span class="kpi-sub">отмечено «знаю»</span></div>' +
        '<div class="kpi card"><span class="kpi-label">Задачи с кодом</span><span class="kpi-value">' + solved + '/' + tasks().length + '</span><span class="kpi-sub">все тесты пройдены</span></div>' +
      '</div>' + hwBanner() + modules().filter((m) => m[3] === 'top' && !tracks().some((tr) => tr.module === m[0])).map(modBanner).join('') + privateHint() +
      modules().filter((m) => m[3] === 'top').map(themeSection).join('') +
      newTopicCard() + modules().filter((m) => m[3] !== 'top').map(themeSection).join('');
  }

  // Баннер «задачи раздела» — для разделов с пометкой 'top' (то, над чем работаешь сейчас)
  function modBanner([m, name]) {
    const list = tasks().filter((t) => t.module === m);
    if (!list.length) return '';
    const done = list.filter((t) => P().solved[t.id]).length;
    return '<a class="card hw-banner" href="#/ml/code">' + I('code') + '<div><b>' + U.esc(name) + ' — задачи</b>' +
      '<small>' + list.length + ' ' + U.plural(list.length, ['задача', 'задачи', 'задач']) + ' · сделано ' + done + '</small>' +
      '<div class="bar"><i style="width:' + Math.round(100 * done / list.length) + '%"></i></div></div>' + I('chevron-right') + '</a>';
  }

  // Раздел тем на главной ML; если у раздела есть задачи — ссылка на них
  function themeSection([m, name, desc]) {
    const pr = P();
    const list = topics().filter((t) => t.module === m);
    const nTasks = tasks().filter((t) => t.module === m).length;
    return '<section class="card"><div class="card-head"><h2>' + U.esc(name) + '</h2><span class="muted small">' + U.esc(desc) +
      (nTasks ? ' · <a href="#/ml/code">задачи (' + nTasks + ') ›</a>' : '') + '</span></div>' +
      '<div class="topic-grid">' + list.map((t) => {
        const q = pr.quiz[t.id];
        return '<a class="topic-card' + (q >= 50 ? ' done' : '') + '" href="#/ml/t/' + t.id + '"><b>' + U.esc(t.title) + '</b><small>' + U.esc(t.summary) + '</small>' +
          (t.course ? '<span class="tag course-tag">' + U.esc(t.course) + '</span>' : '') +
          (q != null ? '<span class="topic-done">' + I('check') + ' ' + q + '%</span>' : '') + '</a>';
      }).join('') + '</div></section>';
  }


  const fmtTs = (ts) => new Date(ts).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const normText = (q) => String(q || '').toLowerCase().replace(/\s+/g, ' ').trim();

  // ---------- Банк вопросов от нейросети: сгенерированное не теряется и проходится снова без запросов ----------
  App.mlQuizBank = (key) => P().aiQuiz[key] || [];
  App.mlQuizBankAdd = function (key, qs) {
    const pr = P();
    const bank = pr.aiQuiz[key] = pr.aiQuiz[key] || [];
    const seen = new Set(bank.map((q) => normText(q.question)));
    qs.forEach((q) => { if (q && q.question && !seen.has(normText(q.question))) { seen.add(normText(q.question)); bank.push(Object.assign({ ts: Date.now() }, q)); } });
    if (bank.length > 80) bank.splice(0, bank.length - 80);
    Store.save();
  };
  App.mlBankBtns = function (key, attr, freshVal, savedVal, freshLabel) {
    const n = App.mlQuizBank(key).length;
    return (n ? '<button class="btn" ' + attr + '="' + savedVal + '">' + I('target') + ' Сохранённые вопросы нейросети (' + n + ')</button>' : '') +
      '<button class="btn ai-btn" ' + attr + '="' + freshVal + '">' + I('sparkles') + ' ' + (n ? 'Новые вопросы' : freshLabel) + '</button>';
  };
  App.mlPlayBank = function (key, title, backHref, onDone) {
    const bank = App.mlQuizBank(key).slice();
    for (let i = bank.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bank[i], bank[j]] = [bank[j], bank[i]]; }
    if (!bank.length) return;
    App.startQuiz(title + ' · из сохранённых', bank.slice(0, 10).map((q) => Object.assign({ type: 'choice' }, q)), onDone || null, backHref);
  };

  // ---------- История решений: каждая проверка сохраняет версию кода ----------
  function saveRun(t, code, ok, summary) {
    const pr = P();
    const list = pr.runs[t.id] = pr.runs[t.id] || [];
    const last = list[list.length - 1];
    if (last && last.code === code) Object.assign(last, { ts: Date.now(), ok, summary });
    else list.push({ ts: Date.now(), code, ok, summary });
    if (list.length > 20) list.splice(0, list.length - 20);
    Store.saveSoon();
    const box = root && root.querySelector('#run-hist');
    if (box) box.innerHTML = runsHTML(t);
  }
  function runsHTML(t) {
    const list = P().runs[t.id] || [];
    if (!list.length) return '';
    return '<details class="runs-box"><summary>История решений (' + list.length + ')</summary><div class="runs-list">' +
      list.map((r, idx) => [r, idx]).reverse().map(([r, idx]) =>
        '<div class="run-item' + (r.ok === true ? ' ok' : r.ok === false ? ' bad' : '') + '"><div class="run-head">' +
          '<b>' + (r.ok === true ? '✓' : r.ok === false ? '✗' : '•') + ' ' + fmtTs(r.ts) + '</b><span class="muted small">' + U.esc(r.summary || '') + '</span>' +
          '<button class="link-btn" data-ml="run-restore" data-i="' + idx + '">Вернуть в редактор</button></div>' +
          '<details><summary class="small">Показать код</summary><pre class="code-out">' + U.esc(r.code) + '</pre></details></div>').join('') + '</div></details>';
  }

  // ---------- Мои ответы на вопросы собеседования: история с оценками ----------
  function ansHist(id) { const pr = P(); return pr.ansHist[id] = pr.ansHist[id] || []; }
  function fbHTML(r, note) {
    return '<div class="iv-result"><b>' + (r.score != null ? 'Оценка: ' + r.score + '/10' : 'Оценка') + '</b>' + (note ? ' <span class="muted small">' + note + '</span>' : '') +
      (r.good ? '<p>' + I('check') + ' ' + App.md(r.good) + '</p>' : '') + (r.missing ? '<p>' + I('alert') + ' ' + App.md(r.missing) + '</p>' : '') +
      (r.better ? '<p><i>' + App.md(r.better) + '</i></p>' : '') + '</div>';
  }
  function pastAnswersHTML(id, current) {
    const list = ansHist(id).filter((x) => normText(x.text) !== normText(current));
    if (!list.length) return '';
    return '<details class="iv-past"><summary class="small">' + I('book') + ' Мои прошлые ответы (' + list.length + ')</summary>' +
      list.slice().reverse().map((x) => '<div class="iv-past-item"><div class="muted small">' + fmtTs(x.ts) + (x.ai && x.ai.score != null ? ' · <b>' + x.ai.score + '/10</b>' : '') + '</div><p>' + U.esc(x.text) + '</p></div>').join('') + '</details>';
  }


  // ---------- Шаблон вопроса для личных материалов: нейросеть на сайте выключена, текст копируется вручную ----------
  function templateBoxHTML() {
    return '<section class="card tpl-box"><h2 class="h-ic">' + I('lock') + ' Вопрос по своим материалам</h2>' +
      '<p class="muted small">Для личных материалов нейросеть на сайте выключена — отсюда ничего не отправляется. Напиши вопрос, и сайт соберёт шаблон: условие, твой код и вывод тестов. ' +
      'Скопируй его и сама реши, куда отправить. Учти: любая нейросеть, куда ты его вставишь, увидит этот текст.</p>' +
      '<textarea class="tpl-q iv-input" rows="3" placeholder="Что непонятно? Например: «почему не проходит проверка на пустой разметке?»"></textarea>' +
      '<label class="check"><input type="checkbox" class="tpl-hint" checked> Просить подсказку и объяснение, а не готовое решение</label>' +
      '<div class="row-btns"><button class="btn primary" data-ml="tpl-copy">' + I('note') + ' Собрать и скопировать шаблон</button></div>' +
      '<pre class="code-out tpl-out" hidden></pre></section>';
  }
  function buildTemplate(item, isTask, q, hintOnly) {
    const strip = (x) => String(x || '').replace(/\*\*/g, '');
    const parts = [hintOnly
      ? 'Помоги разобраться с учебной задачей. Объясни, в чём ошибка или что почитать, и дай наводящую подсказку — но не пиши готовое решение целиком. Отвечай по-русски.'
      : 'Помоги разобраться с учебной задачей. Объясни подробно, по-русски.'];
    if (isTask) {
      const ed = root.querySelector('#code-editor');
      parts.push('Задача: ' + item.title, 'Условие: ' + strip(item.desc));
      if (item.check) parts.push('Что должно получиться:\n- ' + item.check.join('\n- '));
      parts.push('Мой код:\n```python\n' + ((ed && ed.value) || '').trim() + '\n```');
      if (codeFor === item.id && codeOut) parts.push('Вывод тестов:\n```\n' + codeOut + (codeTb ? '\n\n' + codeTb : '') + '\n```');
    } else {
      parts.push('Тема: ' + item.title, 'Конспект:\n' + item.theory.map(strip).join('\n'));
    }
    parts.push('Мой вопрос: ' + (q || '…'));
    return parts.join('\n\n');
  }
  // Подсказка: где подключить свои файлы (если на этом устройстве ещё ничего не подключено)
  function privateHint() {
    if ((App.privateFiles && App.privateFiles().length) || (App.privateLocal && App.privateLocal.length)) return '';
    return '<a class="card hw-banner private-hint" href="#/settings/private">' + I('lock') + '<div><b>Свои материалы</b>' +
      '<small>Задачи и темы, которых нет на сайте, лежат у тебя в папке private/. Подключи их здесь: Настройки → Личные материалы → «Подключить файлы». Они хранятся только в этом браузере.</small></div>' + I('chevron-right') + '</a>';
  }

  // ---------- Подсказки по ступенькам и сравнение с другим решением ----------
  const HINT_LABELS = ['Идея', 'Чем воспользоваться', 'План по шагам'];
  function hintList(t) { return (t.hints && t.hints.length ? t.hints : [t.hint]).filter(Boolean); }
  function hintBtnHTML(t) {
    const n = hintList(t).length, lvl = Math.min(P().hintLvl[t.id] || 0, n);
    if (!n) return '';
    const label = lvl === 0 ? 'Подсказка' : lvl < n ? 'Ещё подсказка (' + (lvl + 1) + '/' + n + ')' : 'Все подсказки открыты';
    return '<button class="btn" data-ml="hint"' + (lvl >= n ? ' disabled' : '') + '>' + I('lightbulb') + ' ' + label + '</button>';
  }
  function hintsHTML(t) {
    const list = hintList(t), lvl = Math.min(P().hintLvl[t.id] || 0, list.length);
    if (!lvl) return '';
    return '<div class="hint-steps">' + list.slice(0, lvl).map((h, i) => '<div class="ai-status ok">' + I('lightbulb') + '<span>' +
      (list.length > 1 ? '<b>' + (HINT_LABELS[i] || 'Подсказка ' + (i + 1)) + '.</b> ' : '') + App.md(h) + '</span></div>').join('') + '</div>';
  }
  function nextHint(t) {
    const pr = P(), n = hintList(t).length;
    pr.hintLvl[t.id] = Math.min((pr.hintLvl[t.id] || 0) + 1, n); Store.saveSoon();
    root.querySelector('#hint-box').innerHTML = hintsHTML(t);
    const b = root.querySelector('[data-ml="hint"]'); if (b) b.outerHTML = hintBtnHTML(t);
  }
  // Для личных задач решение — только после своего: пройденные тесты или «Сделала». И оно не заменяет твой код, а показывается рядом.
  function solutionBtnHTML(t) {
    if (!t.private) return '<button class="btn ghost" data-ml="solution">Показать решение</button>';
    if (!P().solved[t.id]) return '<button class="btn ghost locked" data-ml="solution-locked" title="Откроется после твоего решения">' + I('lock') + ' Решение — после твоего</button>';
    return '<button class="btn ghost" data-ml="compare">' + I('code') + ' Сравнить с другим решением</button>';
  }
  function toggleCompare(t) {
    const box = root.querySelector('#compare-box');
    if (box.innerHTML) { box.innerHTML = ''; return; }
    const mine = (root.querySelector('#code-editor') || {}).value || '';
    box.innerHTML = '<div class="compare-grid"><div><b>Твоё решение</b><pre class="code-out">' + U.esc(mine) + '</pre></div>' +
      '<div><b>Другой вариант</b><pre class="code-out">' + U.esc(t.solution) + '</pre></div></div>' +
      (t.note ? '<div class="ai-status ok compare-note">' + I('book') + '<span>' + App.md(t.note) + '</span></div>' : '') +
      '<p class="muted small">Сравни: что сделано иначе, что короче или понятнее, какие крайние случаи учтены. Твой код в редакторе не изменился.</p>';
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  // Треки «по шагам»: старый window.ML_TRACK (задачи с module 'track') и любые из window.ML_TRACKS
  // (у каждого свой module). Трек с pin: 'top' показывается выше остальных.
  function tracks() {
    const list = (window.ML_TRACKS || []).filter((tr) => tr && tr.module);
    const old = window.ML_TRACK ? [Object.assign({ module: 'track' }, window.ML_TRACK)] : [];
    return list.filter((tr) => tr.pin === 'top').concat(old, list.filter((tr) => tr.pin !== 'top'));
  }
  function trackOf(t) { return tracks().find((tr) => tr.module === t.module) || null; }
  function trackTasks(tr) { return tasks().filter((t) => t.module === tr.module); }
  function hwTasks() { return tasks().filter((t) => trackOf(t)); }
  function hwBanner() { return tracks().map(trackBanner).join(''); }
  function trackBanner(hw) {
    const list = trackTasks(hw), done = list.filter((t) => P().solved[t.id]).length;
    if (!list.length) return '';
    return '<a class="card hw-banner" href="#/ml/code">' + I('target') + '<div><b>' + U.esc(hw.title) + ' — по шагам</b>' +
      '<small>' + list.length + ' ' + U.plural(list.length, ['задача', 'задачи', 'задач']) + (hw.sub ? ': ' + U.esc(hw.sub) : '') + ' · сделано ' + done + '</small>' +
      '<div class="bar"><i style="width:' + Math.round(100 * done / Math.max(1, list.length)) + '%"></i></div></div>' + I('chevron-right') + '</a>';
  }

  // Формулы темы — LaTeX
  function formulasHTML(list) {
    return '<div class="formula tex">' + list.map((f) => '<div class="formula-row">' + App.tex(f, true) + '</div>').join('') + '</div>';
  }

  // Карточка вопроса: сначала свой ответ, потом эталон
  function ivCardHTML(q, withMeta) {
    const pr = P();
    const st = pr.cards[q.id];
    const open = ivReveal[q.id];
    const mine = pr.ans[q.id] || '';
    const id = U.esc(q.id);
    return '<article class="card iv-card' + (st ? ' ' + st : '') + '" data-qid="' + id + '" data-meta="' + (withMeta ? 1 : 0) + '">' +
      '<div class="iv-top">' + (withMeta ? '<span class="tag">' + U.esc(modName(q.module)) + '</span><a class="small" href="' + q.href + '">' + U.esc(q.topic.title) + '</a>' : '') +
        (st === 'known' ? '<span class="tag ok">знаю</span>' : st === 'again' ? '<span class="tag warn">повторить</span>' : '') + '</div>' +
      '<p class="iv-question">' + App.md(q.q) + '</p>' +
      (open
        ? (mine ? '<div class="iv-mine"><b>Твой ответ</b><p>' + U.esc(mine) + '</p></div>' : '') +
          '<div class="iv-answer"><b>Эталонный ответ</b><p>' + App.md(q.a) + '</p></div>' +
          '<p class="muted small">Сравни: что совпало, что упустила? Честно отметь:</p>' +
          '<div class="row-btns"><button class="btn small" data-ml="iv-known" data-id="' + id + '">' + I('check') + ' Знаю</button>' +
            '<button class="btn small" data-ml="iv-again" data-id="' + id + '">Повторить</button>' +
            (mine && !(q.topic && q.topic.private) ? '<button class="btn small ai-btn" data-ml="iv-ai" data-id="' + id + '">' + I('sparkles') + ' Оценить мой ответ</button>' : '') +
            '<button class="btn small ghost" data-ml="iv-retry" data-id="' + id + '">Ответить заново</button></div>' +
          '<div class="iv-fb">' + (() => { const e = mine && ansHist(q.id).filter((x) => x.ai && normText(x.text) === normText(mine)).pop(); return e ? fbHTML(e.ai, fmtTs(e.ai.ts || e.ts)) : ''; })() + '</div>' +
          pastAnswersHTML(q.id, mine)
        : '<textarea class="iv-input" rows="3" data-id="' + id + '" placeholder="Сначала ответь своими словами — хоть коротко, тезисами. Потом сравнишь с эталоном.">' + U.esc(mine) + '</textarea>' +
          '<div class="row-btns"><button class="btn small primary" data-ml="iv-show" data-id="' + id + '">Сравнить с эталоном</button>' +
            '<button class="btn small ghost" data-ml="iv-show" data-id="' + id + '">Не знаю — показать</button></div>') +
      '</article>';
  }
  function refreshCard(card) {
    const q = questions().find((x) => x.id === card.dataset.qid);
    if (q) card.outerHTML = ivCardHTML(q, card.dataset.meta === '1');
  }

  // Какие конспекты из Obsidian углубляют тему сайта
  const NOTE_MAP = window.ML_NOTE_MAP || {};


  // Нейросеть иногда «съедает» обратные слэши LaTeX в JSON: \f, \t, \b, \r, \n становятся управляющими символами
  App.fixTex = function (s) {
    if (typeof s !== 'string') return s;
    s = s.replace(/\x0c/g, '\\f').replace(/\x08/g, '\\b').replace(/\t/g, '\\t').replace(/\r/g, '\\r');
    return s.replace(/\$[^$]*\$/g, (m) => m.replace(/\n(?=[a-zA-Z])/g, '\\n'));
  };
  App.fixTexDeep = function fix(x, key) {
    if (typeof x === 'string') { const f = App.fixTex(x); return key === 'formulas' ? f.replace(/\n(?=[a-zA-Z])/g, '\\n') : f; }
    if (Array.isArray(x)) return x.map((v) => fix(v, key));
    if (x && typeof x === 'object') { const o = {}; Object.keys(x).forEach((k) => { o[k] = fix(x[k], k === 'formulas' ? k : key); }); return o; }
    return x;
  };

  function newTopicCard() {
    return '<section class="card new-topic"><h2 class="h-ic">' + I('sparkles') + ' Новая тема одним запросом</h2>' +
      '<p class="muted small">Напиши тему — нейросеть соберёт урок: теория с выводом формул, главное, 8 вопросов для собеса с ответами и тест. Можно приложить свой конспект как материал.</p>' +
      '<input id="nt-title" class="nt-input" maxlength="120" placeholder="Например: «Batch Normalization», «ROC-AUC и PR-AUC», «ViT»">' +
      '<details class="nt-more"><summary class="small">Добавить свой материал (необязательно)</summary><textarea id="nt-mat" class="nt-input" rows="4" placeholder="Вставь конспект, статью или список вопросов"></textarea></details>' +
      '<div class="row-btns"><button class="btn primary ai-btn" data-ml="new-topic">' + I('sparkles') + ' Создать тему с тестами</button></div></section>';
  }

  App.mlGenerateTopic = async function (btn, name, material) {
    if (!AI.ready() && !AI._mock) { U.toast('Подключи нейросеть в Настройках'); return; }
    const r = await AI.run(btn, () => AI.ask({
      json: true, temperature: 0.4, maxTokens: 12000,
      system: 'Ты — сильный преподаватель машинного обучения и компьютерного зрения (продвинутый уровень) и опытный интервьюер. Пишешь по-русски, глубоко, но понятно для студентки 3 курса. ' +
        'Формулы — LaTeX: внутри текста $...$, в поле formulas — без долларов. Это JSON, поэтому каждый обратный слэш пиши двойным (\\\\frac, \\\\sum, \\\\theta).',
      prompt: 'Тема: «' + name + '».' + (material ? '\nМатериал (опирайся на него и исправь неточности):\n' + String(material).slice(0, 14000) : '') +
        '\n\nСоставь полноценный урок. Верни JSON:\n{"title": "короткое название", "summary": "одно предложение", ' +
        '"theory": ["8–12 абзацев по 3–6 предложений: интуиция → строгое определение → вывод ключевых формул по шагам → пример на числах → как это выглядит в коде (numpy/PyTorch) → практические советы → типичные ошибки → связь с соседними темами"], ' +
        '"formulas": ["3–6 ключевых формул в LaTeX"], "key": ["5–7 тезисов, которые нужно запомнить"], ' +
        '"interview": [["вопрос", "сильный ответ в 3–6 предложений"]] — 8 вопросов от базовых к глубоким, 1–2 с ловушкой, ' +
        '"quiz": [{"question": "...", "options": ["...", "...", "...", "..."], "answer": 0, "explain": "почему"}] — 8 вопросов, часть на вычисление}',
    }));
    if (!r) return;
    if (!r.title || !Array.isArray(r.theory) || !r.theory.length) { U.toast('Ответ получился неполным — попробуй ещё раз'); return; }
    const t = App.fixTexDeep(r);
    const topicObj = {
      id: 'c-' + Date.now().toString(36), module: 'mine', custom: true,
      title: String(t.title), summary: String(t.summary || ''),
      theory: t.theory.map(String), formulas: (t.formulas || []).map(String), key: (t.key || []).map(String),
      interview: (t.interview || []).map((x) => (Array.isArray(x) ? x : x && [x.q || x.question, x.a || x.answer])).filter((x) => x && x[0] && x[1]).map((x) => [String(x[0]), String(x[1])]),
      quiz: (t.quiz || []).filter((q) => q && q.question && Array.isArray(q.options) && q.options.length > 1),
    };
    P().custom.push(topicObj); Store.save();
    U.toast('Тема готова: теория, ' + topicObj.interview.length + ' вопросов и тест из ' + topicObj.quiz.length);
    location.hash = '#/ml/t/' + topicObj.id;
  };

  async function deepTopic(btn, t) {
    if (!AI.ready() && !AI._mock) { U.toast('Подключи нейросеть в Настройках'); return; }
    let material = '';
    const notes = NOTE_MAP[t.id] || [];
    if (notes.length) {
      try { await App.mlNotesLoad(); material = notes.map((n) => { const x = App.mlNote(n); return x ? '### ' + x.t + '\n' + x.md.slice(0, 4000) : ''; }).join('\n\n').slice(0, 12000); } catch (e) { /* без конспектов */ }
    }
    const md = await AI.run(btn, () => AI.ask({
      temperature: 0.4, maxTokens: 9000,
      system: 'Ты — сильный преподаватель ML и компьютерного зрения (продвинутый уровень). Пишешь подробные, точные и понятные разборы по-русски в Markdown. ' +
        'Формулы только в LaTeX: $...$ в строке и $$...$$ отдельной строкой (не используй \\( \\) и \\[ \\]). Код — в блоках ```python.',
      prompt: 'Тема: «' + t.title + '».\nКраткий конспект с сайта:\n' + t.theory.join('\n') + (material ? '\n\nКонспекты студентки по теме (используй, но иди глубже и исправь неточности):\n' + material : '') +
        '\n\nНапиши разбор глубже, чем конспект. Разделы (заголовки ##):\n## Интуиция\n## Строго: определения и обозначения\n## Вывод ключевых формул (по шагам)\n## Пример на числах\n## В коде\n## Подводные камни\n## Как спрашивают на собеседовании (4–5 вопросов, ответ под каждым)\n## Что почитать (только реально существующие книги/статьи: автор, название, глава)',
    }));
    if (!md) return;
    P().deep[t.id] = App.fixTex(String(md)); Store.save(); App.render();
  }

  function renderTopic(el, t) {
    const pr = P();
    const related = tasks().filter((x) => x.topic === t.id && !trackOf(x));
    const hwRel = hwTasks().filter((x) => x.topic === t.id);
    const topicQs = questions().filter((q) => q.topic.id === t.id);
    const myNotes = (NOTE_MAP[t.id] || []);
    el.innerHTML = header() +
      backLinkHTML('#/ml', 'Все темы') +
      '<div class="theory">' +
        '<section class="card theory-main"><div class="card-head"><h2>' + U.esc(t.title) + '</h2>' +
          '<span class="tag">' + U.esc(modName(t.module)) + '</span>' + (t.course ? '<span class="tag course-tag">' + U.esc(t.course) + (App.courseName ? ' ' + U.esc(App.courseName) : '') + '</span>' : '') + '</div>' +
          t.theory.map((p) => '<p>' + App.md(p) + '</p>').join('') +
          (t.formulas ? formulasHTML(t.formulas) : '') +
        '</section>' +
        (t.key && t.key.length ? '<section class="card"><h2>Главное запомнить</h2><ul class="key-list">' + t.key.map((k) => '<li>' + I('check') + '<span>' + App.md(k) + '</span></li>').join('') + '</ul></section>' : '') +
        (myNotes.length ? '<section class="card"><h2 class="h-ic">' + I('note') + ' Твои конспекты по теме</h2><div class="note-list">' +
          myNotes.map((n) => '<a class="note-link" href="#/ml/n/' + encodeURIComponent(n) + '"><b>' + U.esc(n.replace(/^\d\d\s+/, '')) + '</b></a>').join('') + '</div></section>' : '') +
        (t.private ? '' : '<section class="card deep-card"><div class="card-head"><h2 class="h-ic">' + I('book') + ' Разбор глубже</h2>' +
          (pr.deep[t.id] ? '<button class="btn small ghost" data-ml="deep-del">Удалить разбор</button>' : '') + '</div>' +
          (pr.deep[t.id] ? '<div class="note-body deep-body" id="deep-body"><p class="muted">Загружаю…</p></div>'
            : '<p class="muted small">Нейросеть напишет подробный разбор' + (myNotes.length ? ' с опорой на твои конспекты' : '') + ': интуиция, строгая математика с выводом, пример на числах, код, подводные камни, вопросы с собеседований и что почитать. Разбор сохранится здесь.</p>' +
              '<button class="btn ai-btn" data-ml="deep">' + I('sparkles') + ' Разобрать глубже</button>') + '</section>') +
        (topicQs.length ? '<section class="card"><h2 class="h-ic">' + I('sparkles') + ' Вопросы с собеседований (' + topicQs.length + ')</h2>' +
          '<p class="muted small">Ответь своими словами, потом сравни с эталоном. Все вопросы — во вкладке «Собеседование».</p>' +
          '<div class="iv-list">' + topicQs.map((q) => ivCardHTML(q, false)).join('') + '</div></section>' : '') +
        '<section class="card theory-actions"><h2>Практика</h2><div class="row-btns">' +
          (t.quiz && t.quiz.length ? '<button class="btn primary" data-ml="quiz">' + I('target') + ' Тест по теме (' + t.quiz.length + ')</button>' : '') +
          related.map((x) => '<a class="btn" href="#/ml/code/' + x.id + '">' + I('code') + ' ' + U.esc(x.title) + (pr.solved[x.id] ? ' ✓' : '') + '</a>').join('') +
          (hwRel.length ? '<a class="btn" href="#/ml/code">' + I('target') + ' ' + U.esc((trackOf(hwRel[0]) || {}).short || 'Трек') + ': задачи по теме (' + hwRel.length + ')</a>' : '') +
          (t.private ? '' : App.mlBankBtns('topic:' + t.id, 'data-ml', 'ai-quiz', 'ai-quiz-saved', 'Ещё вопросы от нейросети')) +
          (t.custom ? '<button class="btn ghost" data-ml="del-topic">Удалить тему</button>' : '') +
        '</div>' + (pr.quiz[t.id] != null ? '<p class="muted small">Лучший результат теста: ' + pr.quiz[t.id] + '%</p>' : '') + '</section>' +
        (t.private ? templateBoxHTML() : App.askBoxHTML('ml-' + t.id, 'Спросить про эту тему', 'Например: «объясни на примере, чем bias отличается от variance»')) +
      '</div>';
    if (pr.deep[t.id]) {
      App.loadMarked().then(() => { const b = el.querySelector('#deep-body'); if (b) { b.innerHTML = App.renderNoteMd(pr.deep[t.id]); App.enhanceNote(b); } })
        .catch(() => { const b = el.querySelector('#deep-body'); if (b) b.innerHTML = App.md(pr.deep[t.id]); });
    }
    if (!t.private) App.bindAskBox(el, 'ml-' + t.id, () => 'Тема: «' + t.title + '».\nКонспект:\n' + t.theory.join('\n'), {
      system: 'Ты — сильный и терпеливый преподаватель машинного обучения для студентки 3 курса, которая изучает компьютерное зрение. Объясняй по-русски, понятно, с интуицией, формулами и маленьким примером кода на numpy/PyTorch, если уместно. Коротко (до 200 слов). Если спрашивают про задание курса — давай идеи и подсказки, но не готовое решение целиком.',
      copyIntro: 'Объясни, пожалуйста, по-русски, с интуицией и примером:',
    });
  }

  function startTopicQuiz(t) {
    App.startQuiz('Тест: ' + t.title, t.quiz.map((q) => Object.assign({ type: 'choice' }, q)), (pct) => {
      const pr = P(); pr.quiz[t.id] = Math.max(pr.quiz[t.id] || 0, pct); Store.save();
    }, '#/ml/t/' + t.id);
  }

  async function aiQuiz(btn, t) {
    if (!AI.ready() && !AI._mock) { U.toast('Подключи нейросеть в Настройках'); return; }
    const r = await AI.run(btn, () => AI.ask({
      json: true, temperature: 0.7,
      system: 'Ты — интервьюер по машинному обучению. Составляешь точные вопросы с одним правильным ответом и короткими объяснениями по-русски.',
      prompt: 'Тема: «' + t.title + '». Конспект: ' + t.theory.join(' ') + '\nСоставь 6 вопросов уровня собеседования на junior ML/CV-позицию: часть на понимание, часть — посчитать (формы тензоров, метрики), один с ловушкой. ' +
        'Верни JSON: {"questions": [{"question": "...", "options": ["...", "...", "...", "..."], "answer": 0, "explain": "по-русски"}]}',
    }));
    if (!r || !Array.isArray(r.questions) || !r.questions.length) return;
    const qs = r.questions.map((q) => App.fixTexDeep(q));
    App.mlQuizBankAdd('topic:' + t.id, qs);
    App.startQuiz('Вопросы: ' + t.title, qs.map((q) => Object.assign({ type: 'choice' }, q)), null, '#/ml/t/' + t.id);
  }

  // ---------- Собеседование ----------

  function renderInterview(el) {
    const pr = P();
    let list = questions().filter((q) => ivModule === 'all' || q.module === ivModule);
    const order = { again: 0, undefined: 1, known: 2 };
    list = list.slice().sort((a, b) => order[pr.cards[a.id]] - order[pr.cards[b.id]]);
    const known = list.filter((q) => pr.cards[q.id] === 'known').length;
    el.innerHTML = header('Карточки с вопросами, которые реально задают на собеседованиях') + tabs('interview') +
      '<div class="card stats-bar"><div class="seg">' + [['all', 'Все']].concat(modules().map((m) => [m[0], m[1]])).concat([['libs', 'Библиотеки']]).concat(Object.keys(P().noteQs).length ? [['notes', 'Из конспектов']] : []).map(([k, n]) =>
        '<button class="' + (ivModule === k ? 'on' : '') + '" data-ml="iv-mod" data-v="' + k + '">' + U.esc(n) + '</button>').join('') + '</div>' +
        '<span class="muted small">знаю ' + known + ' из ' + list.length + ' · сначала «повторить» и новые</span></div>' +
      '<div class="iv-list">' + list.map((q) => ivCardHTML(q, true)).join('') + '</div>';
  }

  async function checkAnswer(btn, q, mine) {
    const box = btn.closest('.iv-card').querySelector('.iv-fb');
    const h = ansHist(q.id);
    const done = h.filter((x) => x.ai && normText(x.text) === normText(mine)).pop();
    if (done) { box.innerHTML = fbHTML(done.ai, 'из истории — без запроса к нейросети'); return; }
    const ask = 'Вопрос с собеседования: ' + q.q + '\nЭталонный ответ: ' + q.a + '\nОтвет кандидатки: ' + mine;
    if (!AI.ready() && !AI._mock) {
      try { await navigator.clipboard.writeText('Оцени мой ответ на вопрос с ML-собеседования, скажи, что упущено и как ответить сильнее.\n\n' + ask); U.toast('Нейросеть не подключена — запрос скопирован'); } catch (e) { /* ignore */ }
      return;
    }
    const r = await AI.run(btn, () => AI.ask({
      json: true, temperature: 0.3,
      system: 'Ты — доброжелательный интервьюер по ML. Оцениваешь ответ кандидата по существу, по-русски.',
      prompt: ask + '\nВерни JSON: {"score": 0-10, "good": "что верно", "missing": "что упущено или неточно", "better": "как ответить сильнее, 2-4 предложения"}',
    }));
    if (!r) return;
    const ai = { score: r.score, good: r.good, missing: r.missing, better: r.better, ts: Date.now() };
    let e = h.filter((x) => normText(x.text) === normText(mine)).pop();
    if (!e) { e = { ts: Date.now(), text: mine }; h.push(e); }
    e.ai = ai; Store.save();
    box.innerHTML = fbHTML(ai);
  }

  // ---------- Практика с кодом ----------

  function taskCard(t, num) {
    const pr = P();
    return '<a class="topic-card' + (pr.solved[t.id] ? ' done' : '') + '" href="#/ml/code/' + t.id + '">' +
      (num ? '<span class="hw-num">' + num + '</span>' : '') + '<b>' + U.esc(t.title) + '</b>' +
      '<small>' + '★'.repeat(t.level) + '☆'.repeat(3 - t.level) + ' · ' + (t.local ? 'PyTorch, у себя' : U.esc((topic(t.topic) || {}).title || '')) + '</small>' +
      (pr.solved[t.id] ? '<span class="topic-done">' + I('check') + (t.local ? ' сделано' : ' решено') + '</span>' : '') + '</a>';
  }

  function hwSection(hw) {
    if (!hw) return '';
    const pr = P(), list = trackTasks(hw), done = list.filter((t) => pr.solved[t.id]).length;
    if (!list.length) return '';
    return '<section class="card hw-track"><div class="card-head"><h2 class="h-ic">' + I('target') + ' ' + U.esc(hw.title) + '</h2>' +
        '<span class="tag course-tag">' + done + ' / ' + list.length + '</span></div>' +
      '<p>' + App.md(hw.intro) + '</p>' +
      '<div class="bar"><i style="width:' + Math.round(100 * done / Math.max(1, list.length)) + '%"></i></div>' +
      ((hw.tips || []).length ? '<details class="hw-tips"><summary>' + U.esc(hw.tipsTitle || 'Как экспериментировать, чтобы был толк') + '</summary><ul class="key-list">' +
        hw.tips.map((x) => '<li>' + I('check') + '<span>' + App.md(x) + '</span></li>').join('') + '</ul></details>' : '') +
      hw.stages.map(([n, name, sub]) => {
        const st = list.filter((t) => t.stage === n);
        const d = st.filter((t) => pr.solved[t.id]).length;
        if (!st.length) return '';
        return '<div class="hw-stage"><h3>' + (hw.stageWord === '' ? '' : (hw.stageWord || 'Часть') + ' ' + n + '. ') + U.esc(name) + ' <span class="muted small">' + d + '/' + st.length + '</span></h3>' +
          '<p class="muted small">' + U.esc(sub) + '</p>' +
          '<div class="topic-grid">' + st.map((t, i) => taskCard(t, n + '.' + (i + 1))).join('') + '</div></div>';
      }).join('') + '</section>';
  }

  function renderTasks(el) {
    const mods = window.ML_MODULES || [];
    const hasTrack = (m) => tracks().some((tr) => tr.module === m);
    const modSection = ([m, name, desc, pin]) => {
      const list = tasks().filter((t) => t.module === m);
      if (!list.length) return '';
      return '<section class="card"><h2>' + U.esc(name) + '</h2>' + (pin === 'top' && desc ? '<p class="muted small">' + U.esc(desc) + '</p>' : '') +
        '<div class="topic-grid">' + list.map((t) => taskCard(t)).join('') + '</div></section>';
    };
    el.innerHTML = header('Задачи на Python — запускаются прямо в браузере, проверка тестами') + tabs('code') +
      privateHint() +
      '<a class="card hw-banner play-banner" href="#/ml/play">' + I('play') + '<div><b>Песочница Python</b><small>Просто запусти код с numpy и посмотри вывод — без задач и тестов</small></div>' + I('chevron-right') + '</a>' +
      // Разделы с пометкой 'top' (например, то, над чем работаешь сейчас) — выше длинного трека
      mods.filter((m) => m[3] === 'top' && !hasTrack(m[0])).map(modSection).join('') + tracks().map(hwSection).join('') +
      mods.filter((m) => m[3] !== 'top' && !hasTrack(m[0])).map(modSection).join('') +
      '<section class="card"><h2 class="h-ic">' + I('grid') + ' Задачи по библиотекам</h2>' + libs().filter((l) => libTasks(l.id).length).map((l) =>
        '<h3 class="notes-sub"><a href="#/ml/lib/' + l.id + '">' + U.esc(l.name) + '</a></h3><div class="topic-grid">' + libTasks(l.id).map((t) => taskCard(t)).join('') + '</div>').join('') + '</section>' +
      '<p class="muted small">Python работает в браузере (Pyodide + numpy; pandas, scikit-learn и другие пакеты скачаются при первом import). Первый запуск занимает 10–20 секунд, дальше быстро.</p>';
  }

  const PLAY = { id: '_play', free: true };
  function sandboxHTML(t) {
    const sc = P().scratch[t.id] || '';
    const hint = t.free ? 'Пиши любой Python с numpy и смотри, что он выводит. Последнее выражение печатается само. Ctrl+Enter — выполнить.'
      : t.local ? 'PyTorch в браузере нет — здесь можно проверить numpy-части и логику (код из редактора не запускается).'
        : 'Сначала выполняется код из редактора (твои функции), потом эти строки — без тестов. Последнее выражение печатается само. Ctrl+Enter — выполнить.';
    return '<section class="card sandbox-card"><div class="card-head"><h2 class="h-ic">' + I('play') + ' Песочница</h2></div>' +
      '<textarea id="sandbox-editor" class="code-editor sandbox-editor" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="' +
        U.esc(t.free ? 'import numpy as np\nx = np.arange(6).reshape(2, 3)\nx.mean(axis=0)' : 'Проверяй по шагам, например:\nprint(len(GT))\nx = np.arange(6).reshape(2, 3)\nx.shape') + '">' + U.esc(sc) + '</textarea>' +
      '<div class="row-btns"><button class="btn primary" data-ml="play">' + I('play') + ' Выполнить</button><button class="btn ghost small" data-ml="play-clear">Очистить вывод</button></div>' +
      '<pre id="sandbox-out" class="code-out empty">Здесь будет то, что выводит Python</pre><div id="sandbox-tb"></div>' +
      '<p class="muted small">' + hint + '</p></section>';
  }
  function bindSandbox(el, t) {
    const sb = el.querySelector('#sandbox-editor');
    if (!sb) return;
    App.codeEditorKeys(sb, () => runSandbox(t));
    sb.addEventListener('input', () => { P().scratch[t.id] = sb.value; Store.saveSoon(); });
  }
  async function runSandbox(t) {
    const btn = root.querySelector('[data-ml="play"]'), out = root.querySelector('#sandbox-out');
    if (!btn || !out) return;
    if (pending) { U.toast('Подожди — Python ещё выполняет прошлый запуск'); return; }
    const ed = root.querySelector('#code-editor');
    const code = t.local || t.free || !ed ? '' : ed.value;
    const scratch = root.querySelector('#sandbox-editor').value;
    if (ed && !t.local && !t.free) P().code[t.id] = ed.value;
    P().scratch[t.id] = scratch; Store.saveSoon();
    const first = !worker;
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> ' + (first ? 'загружаю Python…' : 'выполняю…');
    out.className = 'code-out'; out.textContent = loadingText(first, code + '\n' + scratch, 'Выполняю…');
    const res = await runPython(code, scratch, first ? 90000 : 20000, 'repl');
    btn.disabled = false; btn.innerHTML = I('play') + ' Выполнить';
    out.className = 'code-out' + (res.ok ? '' : ' bad');
    const fe = res.ok ? null : formatPyError(res, code, scratch, 'repl');
    out.textContent = res.ok ? (res.out || '(ничего не выведено — добавь print(...) или выражение последней строкой)') : (res.out ? res.out + '\n' : '') + '✗ ' + fe.short;
    const tbBox = root.querySelector('#sandbox-tb');
    if (tbBox) tbBox.innerHTML = fe ? tbHTML(fe.tb) : '';
  }
  function renderPlay(el) {
    el.innerHTML = header('Песочница: просто запусти Python и посмотри, что он выводит') + tabs('code') +
      '<a class="link-btn" href="#/ml/code">' + I('chevron-left') + ' Все задачи</a>' + sandboxHTML(PLAY);
    bindSandbox(el, PLAY);
  }

  // ---------- Библиотеки ----------

  function libs() { return window.ML_LIBS || []; }
  function lib(id) { return libs().find((l) => l.id === id); }
  function libTasks(id) { return tasks().filter((t) => t.module === 'lib' && t.lib === id); }

  function renderLibs(el) {
    const pr = P();
    el.innerHTML = header('Библиотеки Python: самые нужные для учёбы и собеседований') + tabs('libs') +
      '<p class="muted">В каждой: зачем она нужна, главное с примерами кода, шпаргалка, частые ошибки, вопросы с собеседований, тест «что выведет код» и задачи. ' +
      'Задачи на numpy, pandas, scikit-learn, SciPy, scikit-image, Pillow, matplotlib и pytest запускаются прямо здесь, PyTorch — у себя.</p>' +
      '<div class="topic-grid lib-grid">' + libs().map((l) => {
        const lt = libTasks(l.id), done = lt.filter((t) => pr.solved[t.id]).length;
        const q = pr.quiz['lib:' + l.id];
        return '<a class="topic-card lib-card' + (lt.length && done === lt.length ? ' done' : '') + '" href="#/ml/lib/' + l.id + '">' +
          '<b>' + U.esc(l.name) + '</b><span class="tag course-tag">' + U.esc(l.used) + '</span>' +
          '<small>' + U.esc(l.why) + '</small>' +
          '<small class="lib-progress">' + (lt.length ? 'задачи ' + done + '/' + lt.length : 'теория и тест') + (q != null ? ' · тест ' + q + '%' : '') + (l.local ? ' · PyTorch у себя' : '') + '</small></a>';
      }).join('') + '</div>';
  }

  function renderLib(el, l) {
    const pr = P();
    const lt = libTasks(l.id);
    const qs = questions().filter((q) => q.id.startsWith('lib:' + l.id + '#'));
    const q = pr.quiz['lib:' + l.id];
    el.innerHTML = header() + tabs('libs') +
      backLinkHTML('#/ml/libs', 'Все библиотеки') +
      '<section class="card lib-head"><div class="card-head"><h2>' + U.esc(l.name) + '</h2><span class="tag course-tag">' + U.esc(l.used) + '</span></div>' +
        '<p>' + App.md(l.why) + '</p>' +
        '<div class="row-btns"><button class="btn primary" data-ml="lib-quiz">' + I('target') + ' Тест: что выведет код (' + (l.quiz || []).length + ')</button>' +
          App.mlBankBtns('lib:' + l.id, 'data-ml', 'lib-ai-quiz', 'lib-ai-quiz-saved', 'Ещё вопросы от нейросети') + '</div>' +
        (q != null ? '<p class="muted small">Лучший результат теста: ' + q + '%</p>' : '') + '</section>' +
      '<section class="card note-body lib-body" id="lib-body"><p class="muted">Загружаю…</p></section>' +
      '<section class="card"><h2 class="h-ic">' + I('note') + ' Шпаргалка</h2><div class="table-wrap"><table class="cheat-table"><tbody>' +
        l.cheats.map(([c, w]) => '<tr><td><code>' + U.esc(c) + '</code></td><td>' + U.esc(w) + '</td></tr>').join('') + '</tbody></table></div></section>' +
      '<section class="card"><h2 class="h-ic">' + I('alert') + ' Частые ошибки</h2><ul class="key-list">' +
        l.pitfalls.map((p) => '<li>' + I('alert') + '<span>' + App.md(p) + '</span></li>').join('') + '</ul></section>' +
      (lt.length ? '<section class="card"><h2 class="h-ic">' + I('code') + ' Задачи (' + lt.length + ')</h2><div class="topic-grid">' + lt.map((t, i) => taskCard(t, String(i + 1))).join('') + '</div>' +
        (lt.some((t) => !t.local) ? '<p class="muted small">Нужные пакеты скачаются при первом запуске (один раз, до минуты).</p>' : '') + '</section>' : '') +
      (qs.length ? '<section class="card"><h2 class="h-ic">' + I('sparkles') + ' Вопросы с собеседований (' + qs.length + ')</h2><div class="iv-list">' + qs.map((x) => ivCardHTML(x, false)).join('') + '</div></section>' : '') +
      ((l.notes || []).length ? '<section class="card"><h2 class="h-ic">' + I('note') + ' Твои конспекты</h2><div class="note-list">' +
        l.notes.map((n) => '<a class="note-link" href="#/ml/n/' + encodeURIComponent(n) + '"><b>' + U.esc(n.replace(/^\d\d\s+/, '')) + '</b></a>').join('') + '</div></section>' : '') +
      App.askBoxHTML('lib-' + l.id, 'Спросить про ' + l.name, 'Например: «чем view отличается от reshape?» или «покажи пример groupby»');
    App.loadMarked().then(() => {
      const b = el.querySelector('#lib-body');
      if (b) { b.innerHTML = l.sections.map((s) => App.renderNoteMd(s)).join(''); App.enhanceNote(b); }
    }).catch(() => { const b = el.querySelector('#lib-body'); if (b) b.innerHTML = l.sections.map((s) => '<pre>' + U.esc(s) + '</pre>').join(''); });
    App.bindAskBox(el, 'lib-' + l.id, () => 'Библиотека: ' + l.name + '. ' + l.why + '\nШпаргалка:\n' + l.cheats.map((c) => c.join(' — ')).join('\n'), {
      system: 'Ты — опытный Python-разработчик и ML-инженер, объясняешь библиотеку ' + l.name + ' студентке 3 курса, которая уже писала с ней задания, но плохо в ней разбирается. Отвечай по-русски, понятно, с коротким рабочим примером кода (```python), объясняй, что делает каждая строка и какие формы/типы получаются. Формулы — LaTeX в $...$.',
      copyIntro: 'Объясни по-русски с примером кода, я учу ' + l.name + ':',
    });
  }

  async function libAiQuiz(btn, l) {
    if (!AI.ready() && !AI._mock) { U.toast('Подключи нейросеть в Настройках'); return; }
    const r = await AI.run(btn, () => AI.ask({
      json: true, temperature: 0.6, maxTokens: 6000,
      system: 'Ты — интервьюер по Python для ML. Составляешь вопросы «что выведет этот код / какая будет форма / где ошибка» с одним правильным ответом и коротким объяснением по-русски. Код в вопросе — в обратных кавычках, одной строкой.',
      prompt: 'Библиотека: ' + l.name + '. Темы: ' + l.cheats.map((c) => c[0]).join('; ') + '\nСоставь 8 вопросов разной сложности, 2 из них — на типичные ошибки. ' +
        'Верни JSON: {"questions": [{"question": "...", "options": ["...", "...", "...", "..."], "answer": 0, "explain": "..."}]}',
    }));
    if (!r || !Array.isArray(r.questions) || !r.questions.length) return;
    const qs = r.questions.map((x) => App.fixTexDeep(x));
    App.mlQuizBankAdd('lib:' + l.id, qs);
    App.startQuiz('Вопросы: ' + l.name, qs.map((x) => Object.assign({ type: 'choice' }, x)), null, '#/ml/lib/' + l.id);
  }

  function hwNav(t) {
    const tr = trackOf(t);
    if (!tr && t.module !== 'lib') return '';
    const list = tr ? trackTasks(tr) : libTasks(t.lib), i = list.indexOf(t);
    const prev = list[i - 1], next = list[i + 1];
    return '<div class="hw-nav">' +
      (prev ? '<a class="btn ghost" href="#/ml/code/' + prev.id + '">' + I('chevron-left') + ' ' + U.esc(prev.title) + '</a>' : '<span></span>') +
      (next ? '<a class="btn" href="#/ml/code/' + next.id + '">' + U.esc(next.title) + ' ' + I('chevron-right') + '</a>' : '') + '</div>';
  }

  function renderTask(el, t) {
    const pr = P();
    const code = pr.code[t.id] != null ? pr.code[t.id] : t.starter;
    const hw = trackOf(t);
    const stage = hw ? (hw.stages || []).find((s) => s[0] === t.stage) : null;
    const checks = pr.checks[t.id] || [];
    if (codeFor !== t.id) { codeOut = ''; codeTb = ''; }
    el.innerHTML = header() +
      (t.module === 'lib' && lib(t.lib) ? backLinkHTML('#/ml/lib/' + t.lib, lib(t.lib).name + ': теория и задачи') : '<a class="link-btn" href="#/ml/code">' + I('chevron-left') + (hw ? ' ' + U.esc(hw.short || 'Трек') + ': все шаги' : ' Все задачи') + '</a>') +
      '<section class="card"><div class="card-head"><h2>' + U.esc(t.title) + '</h2><span class="muted small">' + '★'.repeat(t.level) + '☆'.repeat(3 - t.level) + '</span>' +
        (pr.solved[t.id] ? '<span class="tag ok">' + (t.local ? 'сделано' : 'решено') + '</span>' : '') + '</div>' +
        (stage ? '<p class="muted small">' + U.esc(hw.short || '') + ' · ' + (hw.stageWord === '' ? '' : (hw.stageWord || 'Часть') + ' ' + stage[0] + '. ') + U.esc(stage[1]) + '</p>' : '') +
        '<p>' + App.md(t.desc) + '</p>' +
        (topic(t.topic) ? '<a class="small" href="#/ml/t/' + t.topic + '">' + I('book') + ' Теория: ' + U.esc(topic(t.topic).title) + '</a>' : '') + '</section>' +
      (t.local ? '<section class="card"><h2 class="h-ic">' + I('check') + ' Чек-лист: что должно получиться</h2><ul class="check-list">' +
        t.check.map((c, i) => '<li><label><input type="checkbox" data-ml-check="' + i + '"' + (checks[i] ? ' checked' : '') + '> <span>' + App.md(c) + '</span></label></li>').join('') + '</ul>' +
        '<p class="muted small">Это PyTorch — он не запускается в браузере. Пиши здесь или сразу в своём файле (например, новой версией рядом со старой), запускай у себя' + (t.private ? '. Вопрос по задаче — через шаблон ниже.' : ', а проверить код можно нейросетью.') + '</p></section>' : '') +
      '<div class="code-grid"><section class="card code-card">' +
        '<textarea id="code-editor" class="code-editor" spellcheck="false" autocapitalize="off" autocomplete="off">' + U.esc(code) + '</textarea>' +
        '<div class="row-btns code-btns">' +
          (t.local
            ? (t.private ? '' : '<button class="btn primary ai-btn" data-ml="ai-review">' + I('sparkles') + ' Проверить код нейросетью</button>') +
              '<button class="btn" data-ml="copy-code">' + I('note') + ' Скопировать</button>' +
              '<button class="btn" data-ml="mark-done">' + I('check') + (pr.solved[t.id] ? ' Снять отметку' : ' Сделала') + '</button>'
            : '<button class="btn primary" data-ml="run">' + I('play') + ' Запустить тесты</button>') +
          hintBtnHTML(t) + solutionBtnHTML(t) +
          '<button class="btn ghost" data-ml="reset">Сбросить</button></div>' +
        '<div id="hint-box">' + hintsHTML(t) + '</div><div id="compare-box"></div>' +
        (t.local ? '' : '<pre id="code-out" class="code-out' + (codeOut ? (codeTb || /^✗/m.test(codeOut) ? ' bad' : ' ok') : ' empty') + '">' + U.esc(codeOut || 'Здесь появится результат тестов') + '</pre>' +
          '<div id="code-tb">' + tbHTML(codeTb) + '</div>' +
          '<details class="tests-box"><summary>Что проверяют тесты (' + nChecks(t) + ' ' + U.plural(nChecks(t), ['проверка', 'проверки', 'проверок']) + ')</summary><pre class="code-out">' + U.esc(t.tests) + '</pre>' +
          '<p class="muted small">Тесты выполняются после твоего кода. Каждая проверка идёт отдельно: «✓» — прошла, «✗» — нет, в конце итог. Номера строк в ошибке — по этому тексту.</p></details>') +
        '<div id="run-hist">' + runsHTML(t) + '</div>' +
      '</section>' + sandboxHTML(t) + '</div>' + hwNav(t) +
      (t.private ? templateBoxHTML() : App.askBoxHTML('code-' + t.id, t.local ? 'Проверка и вопросы' : 'Спросить про задачу', t.local ? 'Например: «почему val accuracy упала после разморозки?»' : 'Например: «почему у меня не совпадает градиент?»'));
    const ed = el.querySelector('#code-editor');
    App.codeEditorKeys(ed, () => { if (!t.local) root.querySelector('[data-ml=run]').click(); else runSandbox(t); });
    bindSandbox(el, t);
    ed.addEventListener('input', () => { P().code[t.id] = ed.value; Store.saveSoon(); });
    el.querySelectorAll('[data-ml-check]').forEach((cb) => cb.addEventListener('change', () => {
      const arr = P().checks[t.id] = P().checks[t.id] || [];
      arr[+cb.dataset.mlCheck] = cb.checked; Store.saveSoon();
    }));
    if (!t.private) App.bindAskBox(el, 'code-' + t.id, () => 'Задача: ' + t.desc + (t.check ? '\nКритерии:\n- ' + t.check.join('\n- ') : '') +
      '\nМой код:\n' + (root.querySelector('#code-editor') || {}).value + (t.local ? '' : '\nПоследний вывод тестов:\n' + codeOut), {
      system: t.local
        ? 'Ты — ментор по PyTorch и компьютерному зрению. Проверяешь код студентки по критериям: что выполнено, что нет, какие ошибки или ловушки (формы тензоров, model.eval, no_grad, requires_grad, совпадение архитектуры при загрузке весов). ' + (t.context ? 'Условия: ' + t.context + ' ' : '') + 'Отвечай по-русски, коротко, списком. Не переписывай всё решение, если не просят.'
        : 'Ты — ментор по Python и ML. Помогаешь студентке решить задачу: объясняешь ошибку и даёшь наводящую подсказку, но не пишешь полное решение, пока она прямо не попросит. По-русски, коротко.',
      copyIntro: t.local ? 'Проверь мой код на PyTorch по критериям (по-русски, коротко, списком):' : 'Помоги разобраться с задачей по Python/numpy (подсказкой, без готового решения):',
    });
  }

  async function runTask(btn, t) {
    if (pending) { U.toast('Подожди — Python ещё выполняет прошлый запуск'); return; }
    const code = root.querySelector('#code-editor').value;
    P().code[t.id] = code; Store.saveSoon();
    const out = root.querySelector('#code-out');
    btn.disabled = true;
    const first = !worker;
    btn.innerHTML = '<span class="spinner"></span> ' + (first ? 'загружаю Python…' : 'проверяю…');
    out.className = 'code-out'; out.textContent = loadingText(first, code + '\n' + t.tests, 'Запускаю тесты…');
    const res = await runPython(code, t.tests, first ? 90000 : 20000);
    btn.disabled = false; btn.innerHTML = I('play') + ' Запустить тесты';
    codeTb = ''; codeFor = t.id;
    if (res.ok) {
      codeOut = (res.out ? res.out + '\n' : '') + '🎉 Все тесты пройдены!';
      out.className = 'code-out ok';
      if (!P().solved[t.id]) {
        P().solved[t.id] = Date.now(); Store.save(); U.toast(t.private ? 'Задача решена! +30 XP. Теперь можно сравнить с другим решением' : 'Задача решена! +30 XP'); if (window.Sound) Sound.notify();
        const sb = root.querySelector('[data-ml="solution-locked"]'); if (sb) sb.outerHTML = solutionBtnHTML(t);
      }
    } else {
      const fe = formatPyError(res, code, t.tests, 'tests');
      codeOut = (res.out ? res.out + '\n' : '') + '✗ ' + fe.short;
      codeTb = fe.tb;
      out.className = 'code-out bad';
    }
    out.textContent = codeOut;
    const sum = (codeOut.match(/Итого: [^\n]*/) || [])[0] || (res.ok ? 'все тесты пройдены' : String(codeOut.split('\n').filter((l) => l.startsWith('✗')).pop() || 'ошибка').slice(0, 120));
    saveRun(t, code, !!res.ok, sum.replace('Итого: ', ''));
    const tbBox = root.querySelector('#code-tb');
    if (tbBox) tbBox.innerHTML = tbHTML(codeTb);
  }

  // ---------- События ----------

  document.addEventListener('click', async (e) => {
    if (!root || !root.contains(e.target)) return;
    const b = e.target.closest('[data-ml]');
    if (!b) return;
    const p = parts();
    const t = p[1] === 't' ? topic(p[2]) : null;
    const tk = p[1] === 'code' ? task(p[2]) : null;
    const pr = P();
    switch (b.dataset.ml) {
      case 'quiz': if (t) startTopicQuiz(t); break;
      case 'lib-quiz': {
        const l = p[1] === 'lib' ? lib(p[2]) : null;
        if (l) App.startQuiz('Тест: ' + l.name, l.quiz.map((x) => Object.assign({ type: 'choice' }, x)), (pct) => { const q = P(); q.quiz['lib:' + l.id] = Math.max(q.quiz['lib:' + l.id] || 0, pct); Store.save(); }, '#/ml/lib/' + l.id);
        break;
      }
      case 'lib-ai-quiz': { const l = p[1] === 'lib' ? lib(p[2]) : null; if (l) libAiQuiz(b, l); break; }
      case 'ai-quiz': if (t) aiQuiz(b, t); break;
      case 'ai-quiz-saved': if (t) App.mlPlayBank('topic:' + t.id, 'Вопросы: ' + t.title, '#/ml/t/' + t.id); break;
      case 'lib-ai-quiz-saved': { const l = p[1] === 'lib' ? lib(p[2]) : null; if (l) App.mlPlayBank('lib:' + l.id, 'Вопросы: ' + l.name, '#/ml/lib/' + l.id); break; }
      case 'run-restore': {
        const list = tk && P().runs[tk.id];
        const r = list && list[+b.dataset.i];
        if (!r) break;
        const ed = root.querySelector('#code-editor');
        if (ed.value !== r.code && !(await App.confirm('Вернуть эту версию в редактор? Текущий код сохранится в истории.', 'Вернуть'))) break;
        if (ed.value.trim() && ed.value !== r.code && !list.some((x) => x.code === ed.value)) saveRun(tk, ed.value, null, 'черновик перед возвратом');
        ed.value = r.code; P().code[tk.id] = r.code; Store.saveSoon(); U.toast('Версия от ' + fmtTs(r.ts) + ' в редакторе');
        break;
      }
      case 'iv-mod': ivModule = b.dataset.v; App.render(); break;
      case 'iv-show': {
        const card = b.closest('.iv-card'); const ta = card.querySelector('.iv-input');
        if (ta) {
          const v = ta.value.trim();
          if (v) {
            pr.ans[b.dataset.id] = v;
            const h = ansHist(b.dataset.id);
            if (!h.length || normText(h[h.length - 1].text) !== normText(v)) { h.push({ ts: Date.now(), text: v }); if (h.length > 15) h.splice(0, h.length - 15); }
          } else delete pr.ans[b.dataset.id];
        }
        ivReveal[b.dataset.id] = true; Store.save(); refreshCard(card); break;
      }
      case 'deep': if (t) deepTopic(b, t); break;
      case 'deep-del':
        if (t && await App.confirm('Удалить сохранённый разбор? Можно будет сгенерировать заново.', 'Удалить')) { delete pr.deep[t.id]; Store.save(); App.render(); }
        break;
      case 'del-topic':
        if (t && t.custom && await App.confirm('Удалить тему «' + t.title + '» вместе с её вопросами?', 'Удалить')) {
          pr.custom = pr.custom.filter((x) => x.id !== t.id); delete pr.quiz[t.id]; delete pr.deep[t.id]; Store.save(); location.hash = '#/ml';
        }
        break;
      case 'new-topic': {
        const name = (root.querySelector('#nt-title') || {}).value || '';
        if (!name.trim()) { U.toast('Напиши название темы'); root.querySelector('#nt-title').focus(); break; }
        App.mlGenerateTopic(b, name.trim(), (root.querySelector('#nt-mat') || {}).value || '');
        break;
      }
      case 'iv-retry': ivReveal[b.dataset.id] = false; refreshCard(b.closest('.iv-card')); break;
      case 'iv-known': pr.cards[b.dataset.id] = 'known'; Store.save(); refreshCard(b.closest('.iv-card')); break;
      case 'iv-again': pr.cards[b.dataset.id] = 'again'; Store.save(); refreshCard(b.closest('.iv-card')); break;
      case 'iv-ai': {
        const q = questions().find((x) => x.id === b.dataset.id);
        if (q && pr.ans[q.id]) checkAnswer(b, q, pr.ans[q.id]);
        break;
      }
      case 'run': if (tk) runTask(b, tk); break;
      case 'tpl-copy': {
        const box = b.closest('.tpl-box'); const item = tk || t;
        if (!box || !item) break;
        const text = buildTemplate(item, !!tk, box.querySelector('.tpl-q').value.trim(), box.querySelector('.tpl-hint').checked);
        const out = box.querySelector('.tpl-out'); out.hidden = false; out.textContent = text;
        try { await navigator.clipboard.writeText(text); U.toast('Шаблон скопирован — вставь его туда, куда решишь'); }
        catch (err) { U.toast('Не получилось скопировать — выдели текст ниже вручную'); }
        break;
      }
      case 'play': runSandbox(tk || PLAY); break;
      case 'play-clear': { const o = root.querySelector('#sandbox-out'); if (o) { o.className = 'code-out empty'; o.textContent = 'Здесь будет то, что выводит Python'; } const tb = root.querySelector('#sandbox-tb'); if (tb) tb.innerHTML = ''; break; }
      case 'copy-code':
        try { await navigator.clipboard.writeText(root.querySelector('#code-editor').value); U.toast('Код скопирован'); } catch (err) { U.toast('Не получилось скопировать'); }
        break;
      case 'mark-done':
        if (tk) {
          if (pr.solved[tk.id]) delete pr.solved[tk.id]; else { pr.solved[tk.id] = Date.now(); saveRun(tk, root.querySelector('#code-editor').value, true, 'отмечено сделанным'); U.toast('Отмечено! +30 XP'); }
          Store.save(); App.render();
        }
        break;
      case 'ai-review': {
        const box = root.querySelector('[data-ask="code-' + (tk && tk.id) + '"]');
        if (!box) break;
        saveRun(tk, root.querySelector('#code-editor').value, null, 'отправлено на проверку нейросети');
        box.querySelector('textarea').value = 'Проверь мой код по критериям из задачи: что выполнено, что нет, есть ли ошибки.';
        box.querySelector('form').requestSubmit();
        box.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      }
      case 'hint': if (tk) nextHint(tk); break;
      case 'compare': if (tk) toggleCompare(tk); break;
      case 'solution-locked': U.toast('Решение откроется, когда сама пройдёшь тесты' + (tk && tk.local ? ' или отметишь «Сделала»' : '') + ' — тогда сможешь сравнить'); break;
      case 'solution':
        if (tk && await App.confirm('Показать решение? Лучше сначала попробовать подсказку — так запомнится надёжнее.', 'Показать')) {
          root.querySelector('#code-editor').value = tk.solution; pr.code[tk.id] = tk.solution; Store.save();
        }
        break;
      case 'reset':
        if (tk && await App.confirm('Вернуть заготовку? Твой код в этой задаче сотрётся.', 'Сбросить')) {
          delete pr.code[tk.id]; codeOut = ''; codeTb = ''; Store.save(); App.render();
        }
        break;
    }
  });


  document.addEventListener('input', (e) => {
    if (!root || !e.target.classList || !e.target.classList.contains('iv-input')) return;
    const v = e.target.value.trim(); const pr = P();
    if (v) pr.ans[e.target.dataset.id] = v; else delete pr.ans[e.target.dataset.id];
    Store.saveSoon();
  });
  // KaTeX догрузился — перерисовать формулы
  App.onTexReady = function () { if (root && location.hash.startsWith('#/ml') && !document.activeElement.matches('textarea, input')) App.render(); };


  // Редактор кода как в IDE: автоотступ после Enter (и +4 после «:»), Tab/Shift+Tab для строк, Backspace удаляет отступ
  App.codeEditorKeys = function (ed, onRun) {
    const IND = '    ';
    const insert = (text) => {
      ed.focus();
      if (!document.execCommand || !document.execCommand('insertText', false, text)) {
        const s = ed.selectionStart;
        ed.value = ed.value.slice(0, s) + text + ed.value.slice(ed.selectionEnd);
        ed.selectionStart = ed.selectionEnd = s + text.length;
        ed.dispatchEvent(new Event('input'));
      }
    };
    const lineStart = (pos) => ed.value.lastIndexOf('\n', pos - 1) + 1;
    ed.addEventListener('keydown', (e) => {
      const v = ed.value, s = ed.selectionStart, end = ed.selectionEnd;
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); if (onRun) onRun(); return; }
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        const ls = lineStart(s);
        const line = v.slice(ls, s);
        let ind = (line.match(/^[ \t]*/) || [''])[0];
        if (/:\s*(#.*)?$/.test(line)) ind += IND;                      // for/if/def/class … : — следующий уровень
        else if (/^\s*(return|pass|break|continue|raise)\b/.test(line)) ind = ind.slice(0, Math.max(0, ind.length - 4));
        insert('\n' + ind);
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        if (s === end && !e.shiftKey) { insert(IND); return; }
        // несколько строк: сдвиг вправо / влево
        const ls = lineStart(s);
        const block = v.slice(ls, end);
        const lines = block.split('\n');
        const out = lines.map((l) => (e.shiftKey ? l.replace(/^ {1,4}|^\t/, '') : IND + l)).join('\n');
        ed.setSelectionRange(ls, end);
        insert(out);
        ed.setSelectionRange(ls, ls + out.length);
        return;
      }
      if (e.key === 'Backspace' && s === end && s > 0) {
        const ls = lineStart(s);
        const before = v.slice(ls, s);
        if (before.length && /^ +$/.test(before)) {
          e.preventDefault();
          const n = before.length % 4 || 4;
          ed.setSelectionRange(s - n, s);
          if (!document.execCommand || !document.execCommand('delete')) { ed.value = v.slice(0, s - n) + v.slice(s); ed.selectionStart = ed.selectionEnd = s - n; ed.dispatchEvent(new Event('input')); }
        }
      }
    });
  };

  App.mlIvCard = ivCardHTML;
  App.views.ml = { render, leave() { root = null; } };
})();
