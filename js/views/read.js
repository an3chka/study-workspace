// Раздел «Чтение»: вставляешь текст, нажимаешь на слово — переводишь и добавляешь в карточки.
// Подсветка: жёлтым — слова, которые ты учишь (они есть в колодах),
// зелёным подчёркиванием — уже выученные, синим (по желанию) — ещё не отмеченные слова.
(function () {
  'use strict';

  const App = window.App = window.App || {};
  App.views = App.views || {};

  const WORD_RE = /([\p{L}\p{M}\p{N}]+(?:['’\-][\p{L}\p{M}\p{N}]+)*)/u;
  let root = null;
  let openId = null;
  let pop = null;

  function S() { return Store.state; }
  // Текст: свой — из данных, библиотечный — из встроенной библиотеки (если его не правили)
  function bodyOf(t) {
    if (t.body) return t.body;
    const x = t.libId && (window.LIBRARY || []).find((l) => l.id === t.libId);
    return x ? x.body : '';
  }
  function text(id) { return S().texts.find((t) => t.id === id); }
  function norm(w) { return String(w).toLowerCase().replace(/’/g, "'").trim(); }

  function knownSet(lang) {
    const k = S().known[lang || '_'] || [];
    return new Set(k);
  }

  // Словарь: слово → карточка (из колод того же языка).
  function dictFor(lang) {
    const map = new Map();
    S().decks.forEach((d) => {
      if (lang && d.lang && d.lang !== lang) return;
      d.cards.forEach((c) => {
        const f = norm(c.front);
        const entry = { deck: d, card: c };
        map.set(f, entry);
        if (f.startsWith('to ')) map.set(f.slice(3), entry);   // to borrow → borrow
        f.split(/[,/]/).forEach((part) => { if (part.trim() && !map.has(part.trim())) map.set(part.trim(), entry); });
      });
    });
    return map;
  }

  function status(w, dict, known) {
    const e = dict.get(w);
    if (e) return (e.card.interval || 0) >= 21 ? 'learned' : 'learning';
    if (known.has(w)) return 'known';
    return 'unknown';
  }

  function paragraphs(body) {
    return String(body || '').split(/\n+/).map((p) => p.trim()).filter(Boolean);
  }

  function wordsOf(body) {
    const out = [];
    String(body || '').split(WORD_RE).forEach((tok, i) => { if (i % 2 === 1) out.push(norm(tok)); });
    return out;
  }

  function textStats(t) {
    const dict = dictFor(t.lang);
    const known = knownSet(t.lang);
    const uniq = Array.from(new Set(wordsOf(bodyOf(t)).filter((w) => !/^\d+$/.test(w))));
    const c = { total: uniq.length, learning: 0, learned: 0, known: 0, unknown: 0 };
    uniq.forEach((w) => { c[status(w, dict, known)]++; });
    return c;
  }

  function tabs(active) {
    return '<div class="seg lang-tabs" role="tablist">' +
      '<a role="tab" class="' + (active === 'cards' ? 'on' : '') + '" href="#/cards">' + I('cards') + ' Карточки</a>' +
      '<a role="tab" class="' + (active === 'read' ? 'on' : '') + '" href="#/read">' + I('book') + ' Чтение</a>' +
      '<a role="tab" class="' + (active === 'lessons' ? 'on' : '') + '" href="#/lessons">' + I('sparkles') + ' Уроки</a>' +
      '<a role="tab" class="' + (active === 'theory' ? 'on' : '') + '" href="#/theory">' + I('cards') + ' Теория</a></div>';
  }
  App.langTabs = tabs;

  // ---------- Экраны ----------

  function render(el) {
    root = el;
    closePop();
    const t = openId && text(openId);
    if (t) renderReader(el, t); else { openId = null; renderList(el); }
  }

  function renderList(el) {
    const texts = S().texts;
    el.innerHTML =
      '<header class="page-head"><div><h1>Языки</h1><p class="muted">Читай тексты и собирай незнакомые слова в карточки</p></div>' +
      '<button class="btn primary" data-r="new">+ Текст</button></header>' + tabs('read') +
      '<div class="deck-grid">' + (texts.length ? texts.slice().reverse().map((t) => {
        const s = textStats(t);
        const pctKnown = s.total ? Math.round((s.known + s.learned) / s.total * 100) : 0;
        return '<article class="card deck">' +
          '<div class="deck-head"><h2>' + U.esc(t.title) + '</h2><span class="tag">' + U.esc(App.langName(t.lang)) + '</span></div>' +
          '<p class="muted small text-preview">' + U.esc(String(bodyOf(t)).slice(0, 140)) + (bodyOf(t).length > 140 ? '…' : '') + '</p>' +
          '<div class="deck-nums"><span><b>' + s.total + '</b> слов</span><span><b class="c-due">' + s.learning + '</b> учу</span><span><b class="c-new">' + s.unknown + '</b> не отмечено</span></div>' +
          '<div class="progress" title="Знакомые слова"><span style="width:' + pctKnown + '%"></span></div>' +
          '<div class="deck-actions"><button class="btn primary" data-r="open" data-id="' + t.id + '">Читать</button>' +
          '<button class="btn" data-r="edit" data-id="' + t.id + '">Изменить</button></div></article>';
      }).join('') :
        '<div class="card empty-state"><p>Текстов пока нет.</p><p class="muted">Вставь статью, главу книги или текст песни — и нажимай на незнакомые слова.</p>' +
        '<div class="row-btns"><button class="btn primary" data-r="new">Добавить текст</button><button class="btn" data-r="sample">Пример на английском</button></div></div>') +
      '</div>' + libraryHTML();
  }

  // Встроенная библиотека текстов по уровням
  function libraryHTML() {
    const lib = window.LIBRARY || [];
    if (!lib.length) return '';
    const mine = new Set(S().texts.map((t) => t.libId).filter(Boolean));
    const level = S().lessons && S().lessons.level;
    return '<section class="card"><div class="card-head"><h2 class="h-ic">' + I('book') + ' Библиотека</h2>' +
      '<span class="muted small">тексты по уровням, написаны для кабинета' + (level ? ' · твой уровень ' + level : '') + '</span></div>' +
      '<div class="lib-grid">' + lib.map((x) => {
        const words = x.body.split(/\s+/).length;
        return '<button class="lib-item' + (level === x.level ? ' mine-level' : '') + '" data-r="lib-open" data-id="' + x.id + '">' +
          '<span class="lvl-badge">' + x.level + '</span><b>' + U.esc(x.title) + '</b>' +
          '<small>' + U.esc(x.topic) + ' · ' + Math.max(1, Math.round(words / 150)) + ' мин чтения' + (mine.has(x.id) ? ' · ' + I('check', 'inline') + ' открыт' : '') + '</small></button>';
      }).join('') + '</div></section>';
  }

  function openLibrary(id) {
    const x = (window.LIBRARY || []).find((l) => l.id === id);
    if (!x) return;
    let t = S().texts.find((y) => y.libId === id);
    if (!t) {
      t = { id: U.uid(), libId: id, created: Date.now(), title: x.title, lang: x.lang }; // текст не копируем — берём из библиотеки
      S().texts.push(t);
      Store.save();
    }
    openId = t.id;
    App.render();
    window.scrollTo(0, 0);
  }

  function renderReader(el, t) {
    const dict = dictFor(t.lang);
    const known = knownSet(t.lang);
    const showUnknown = S().settings.readHighlightUnknown;
    const s = textStats(t);
    const html = paragraphs(bodyOf(t)).map((p, pi) => {
      const parts = p.split(WORD_RE);
      return '<p data-p="' + pi + '">' + parts.map((tok, i) => {
        if (i % 2 === 0) return U.esc(tok);
        const w = norm(tok);
        if (/^\d+$/.test(w)) return U.esc(tok);
        return '<span class="w ' + status(w, dict, known) + '" data-w="' + U.esc(w) + '" data-i="' + i + '">' + U.esc(tok) + '</span>';
      }).join('') + '</p>';
    }).join('');

    el.innerHTML =
      '<header class="page-head"><div><button class="link-btn" data-r="back">‹ Все тексты</button><h1>' + U.esc(t.title) + '</h1>' +
      '<p class="muted">' + U.esc(App.langName(t.lang)) + ' · ' + s.total + ' разных слов · учу ' + s.learning + ' · выучено ' + s.learned + '</p></div>' +
      '<div class="row-btns"><button class="btn" data-r="edit" data-id="' + t.id + '">Изменить</button></div></header>' +
      '<div class="card reader-bar">' +
        '<label class="check"><input type="checkbox" data-r="toggle-unknown"' + (showUnknown ? ' checked' : '') + '> Подсвечивать неотмеченные слова</label>' +
        '<div class="reader-legend small"><span class="w learning">учу</span><span class="w learned">выучено</span>' + (showUnknown ? '<span class="w unknown">не отмечено</span>' : '') + '</div>' +
      '</div>' +
      '<article class="card reader' + (showUnknown ? ' show-unknown' : '') + '" id="reader" lang="' + U.esc((t.lang || '').split('-')[0]) + '">' + html + '</article>' +
      '<div class="reader-foot">' +
        '<p class="muted small">Нажми на слово, чтобы перевести и добавить в карточки. Можно выделить несколько слов — добавится фраза.</p>' +
        (s.unknown ? '<button class="btn" data-r="all-known">' + I('check') + ' Я знаю все неотмеченные слова (' + s.unknown + ')</button>' : '') +
      '</div>';

    const reader = el.querySelector('#reader');
    reader.addEventListener('mouseup', onSelect);
    reader.addEventListener('touchend', () => setTimeout(onSelect, 30));
  }

  function onSelect() {
    const sel = window.getSelection();
    const str = sel ? sel.toString().replace(/\s+/g, ' ').trim() : '';
    if (!str || !/\s/.test(str) || str.length > 120) return;
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const anc = range.commonAncestorContainer;
    const pEl = (anc.nodeType === 1 ? anc : anc.parentElement).closest('p');
    openPop({ word: str, display: str, rect, sentence: pEl ? sentenceAround(pEl.textContent, pEl.textContent.indexOf(str)) : '' });
  }

  // Предложение вокруг позиции — его кладём в заметку карточки как пример.
  function sentenceAround(str, pos) {
    if (pos < 0) return '';
    let a = pos, b = pos;
    while (a > 0 && !/[.!?…]/.test(str[a - 1])) a--;
    while (b < str.length && !/[.!?…]/.test(str[b])) b++;
    const out = str.slice(a, b + 1).trim();
    return out.length > 280 ? out.slice(0, 277) + '…' : out;
  }

  // ---------- Всплывающее окно слова ----------

  function closePop() { if (pop) { pop.remove(); pop = null; } }

  function openPop(o) {
    closePop();
    const t = text(openId);
    if (!t) return;
    const w = norm(o.word);
    const dict = dictFor(t.lang);
    const entry = dict.get(w);
    const known = knownSet(t.lang).has(w);
    const decks = S().decks.filter((d) => !t.lang || !d.lang || d.lang === t.lang);
    const preferred = t.deckId && decks.find((d) => d.id === t.deckId) ? t.deckId : decks[0] && decks[0].id;
    const sl = (t.lang || 'auto').split('-')[0] || 'auto';
    const trUrl = 'https://translate.google.com/?sl=' + encodeURIComponent(sl) + '&tl=ru&op=translate&text=' + encodeURIComponent(o.display);

    const src0 = (t.lang || '').split('-')[0];
    pop = document.createElement('div');
    pop.className = 'word-pop';
    pop.setAttribute('role', 'dialog');
    pop.innerHTML =
      '<div class="wp-head"><b>' + U.esc(o.display) + '</b>' +
      (t.lang && 'speechSynthesis' in window ? '<button class="icon-btn small" data-wp="speak" aria-label="Произнести">' + I('volume') + '</button>' : '') +
      '<span class="tag ' + (entry ? ((entry.card.interval || 0) >= 21 ? 'ok' : 'warn-soft') : known ? 'ok' : 'new') + '">' +
        (entry ? ((entry.card.interval || 0) >= 21 ? 'выучено' : 'учу · ' + U.esc(entry.deck.name)) : known ? 'знаю' : 'новое') + '</span>' +
      '<button class="icon-btn small wp-close" data-wp="close" aria-label="Закрыть">' + I('x') + '</button></div>' +
      '<form class="wp-form">' +
        '<input name="front" value="' + U.esc(entry ? entry.card.front : o.display.toLowerCase()) + '" aria-label="Слово для карточки" maxlength="200">' +
        '<input name="back" value="' + U.esc(entry ? entry.card.back : '') + '" placeholder="Перевод…" aria-label="Перевод" maxlength="300" required>' +
        (o.sentence ? '<label class="check small wp-ex"><input type="checkbox" name="useNote" checked> <span>пример: «' + U.esc(o.sentence) + '»</span></label>' : '') +
        '<div class="wp-more">' +
          (o.sentence ? '<button type="button" class="btn small ai-btn" data-wp="ai">' + I('sparkles') + ' Объяснить в контексте</button>' : '') +
          (o.sentence && src0 && src0 !== 'ru' ? '<button type="button" class="btn small" data-wp="sent">' + I('globe') + ' Перевести предложение</button>' : '') +
          (src0 === 'en' && !/\s/.test(o.display) ? '<button type="button" class="btn small" data-wp="defs">' + I('book') + ' Значения слова</button>' : '') +
        '</div><div class="wp-info" hidden></div>' +
        (entry ? '' : decks.length ?
          '<select name="deckId" aria-label="Колода">' + decks.map((d) => '<option value="' + d.id + '"' + (d.id === preferred ? ' selected' : '') + '>в колоду: ' + U.esc(d.name) + '</option>').join('') + '<option value="__new">+ новая колода…</option></select>' :
          '<input type="hidden" name="deckId" value="__new"><p class="muted small">Колода «' + U.esc(t.title.slice(0, 30)) + '» создастся автоматически.</p>') +
        '<div class="wp-actions">' +
          '<a class="btn small ghost" href="' + trUrl + '" target="_blank" rel="noopener noreferrer">Переводчик ' + I('external') + '</a>' +
          '<span class="spacer"></span>' +
          (entry ? '' : known ? '<button type="button" class="btn small" data-wp="unknown">Не знаю</button>' : '<button type="button" class="btn small" data-wp="known">' + I('check') + ' Знаю</button>') +
          '<button class="btn small primary">' + (entry ? 'Сохранить' : '+ В карточки') + '</button>' +
        '</div>' +
      '</form>';
    document.body.appendChild(pop);

    // Позиция: под словом (на телефоне — снизу экрана, через CSS)
    const r = o.rect;
    const pw = Math.min(360, window.innerWidth - 24);
    let left = r.left + r.width / 2 - pw / 2 + window.scrollX;
    left = Math.max(12, Math.min(left, window.innerWidth - pw - 12));
    let top = r.bottom + 8 + window.scrollY;
    pop.style.width = pw + 'px';
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
    const ph = pop.offsetHeight;
    if (r.bottom + ph + 90 > window.innerHeight && r.top - ph - 8 > 0) pop.style.top = (r.top - ph - 8 + window.scrollY) + 'px';

    const form = pop.querySelector('form');
    const back = form.querySelector('[name=back]');
    setTimeout(() => back.focus(), 20);

    // Автоперевод: подставляем перевод, если его ещё нет
    const src = (t.lang || '').split('-')[0];
    if (!entry && S().settings.autoTranslate && src && src !== 'ru' && navigator.onLine !== false) {
      back.placeholder = 'перевожу…';
      const myPop = pop;
      translate(o.display, src).then((res) => {
        if (pop !== myPop || !res) { back.placeholder = 'Перевод…'; return; }
        if (!back.value) back.value = res.main;
        back.placeholder = 'Перевод…';
        if (res.alts.length) {
          const box = document.createElement('div');
          box.className = 'wp-alts';
          box.innerHTML = '<span class="muted small">варианты:</span>' + res.alts.map((a) => '<button type="button" class="chip">' + U.esc(a) + '</button>').join('');
          box.addEventListener('click', (e) => { const c = e.target.closest('.chip'); if (c) { back.value = c.textContent; back.focus(); } });
          back.insertAdjacentElement('afterend', box);
        }
      });
    }

    pop.addEventListener('click', (e) => {
      const b = e.target.closest('[data-wp]');
      if (!b) return;
      if (b.dataset.wp === 'close') closePop();
      if (b.dataset.wp === 'speak') speak(o.display, t.lang);
      if (b.dataset.wp === 'ai') {
        if (!AI.ready() && !AI._mock) { U.toast('Подключи нейросеть: Настройки → «Нейросеть»'); return; }
        const myPop = pop;
        AI.run(b, () => AI.ask({
          json: true, temperature: 0.3,
          system: 'Ты — преподаватель иностранного языка для русскоязычной студентки. Объясняй коротко и понятно, по-русски.',
          prompt: 'Язык текста: ' + (App.langName(t.lang) || 'не указан') + '.\nСлово или фраза: "' + o.display + '"\nПредложение: "' + o.sentence + '"\n\n' +
            'Объясни значение именно в этом предложении. Верни JSON: {"lemma": "начальная форма слова (для глаголов в английском с to)", ' +
            '"translation": "перевод в этом контексте, 1-3 слова", "pos": "часть речи по-русски", ' +
            '"meaning": "1-2 предложения: что значит здесь и чем отличается от других значений", ' +
            '"example": "ещё один простой пример с этим значением на языке оригинала", "example_ru": "перевод примера"}',
        })).then((r) => {
          if (!r || pop !== myPop) return;
          const info = pop.querySelector('.wp-info');
          info.hidden = false;
          info.insertAdjacentHTML('afterbegin',
            '<div class="wp-ai"><div class="wp-ai-head">' + I('sparkles') + ' <b>' + U.esc(r.translation || '') + '</b>' + (r.pos ? ' <span class="tag">' + U.esc(r.pos) + '</span>' : '') + '</div>' +
            (r.meaning ? '<p>' + U.esc(r.meaning) + '</p>' : '') +
            (r.example ? '<p class="muted"><i>' + U.esc(r.example) + '</i>' + (r.example_ru ? '<br>' + U.esc(r.example_ru) : '') + '</p>' : '') +
            '<button type="button" class="btn small" data-wp="ai-fill">' + I('check') + ' Подставить в карточку</button></div>');
          o.ai = r;
          b.remove();
        });
      }
      if (b.dataset.wp === 'ai-fill' && o.ai) {
        const f = pop.querySelector('form');
        if (o.ai.lemma) f.front.value = o.ai.lemma;
        if (o.ai.translation) f.back.value = o.ai.translation;
        if (o.ai.example) o.aiNote = o.ai.example + (o.ai.example_ru ? ' — ' + o.ai.example_ru : '');
        U.toast('Подставила. Нажми «В карточки», чтобы сохранить.');
      }
      if (b.dataset.wp === 'sent' || b.dataset.wp === 'defs') {
        const info = pop.querySelector('.wp-info');
        const myPop = pop;
        b.disabled = true;
        info.hidden = false;
        info.insertAdjacentHTML('beforeend', '<p class="muted small wp-loading">загружаю…</p>');
        const done = (html) => {
          if (pop !== myPop) return;
          const l = info.querySelector('.wp-loading'); if (l) l.remove();
          // Перевод предложения — всегда сверху, значения — ниже
          info.insertAdjacentHTML(b.dataset.wp === 'sent' ? 'afterbegin' : 'beforeend', html);
        };
        if (b.dataset.wp === 'sent') {
          translate(o.sentence, src0).then((res) => {
            if (res) o.sentenceTr = res.main;
            done(res ? '<div class="wp-sent"><span class="muted small">перевод предложения:</span><p>' + U.esc(res.main) + '</p></div>' :
              '<p class="muted small">Не получилось перевести (нет интернета или закончился дневной лимит сервиса).</p>');
          });
        } else {
          definitions(o.display).then((defs) => {
            done(defs && defs.length ? '<div class="wp-defs">' + defs.map((d) =>
              '<div><span class="tag">' + U.esc(POS[d.pos] || d.pos) + '</span>' + (d.items.length ? '<ol>' : '') + d.items.map((it) =>
                '<li>' + U.esc(it.def) + (it.ex ? '<br><i class="muted">' + U.esc(it.ex) + '</i>' : '') + '</li>').join('') + (d.items.length ? '</ol>' : '') + '</div>').join('') +
              '<p class="muted small">Значения на английском — из Викисловаря (Wiktionary).</p></div>' :
              '<p class="muted small">Словарь не нашёл это слово. Попробуй начальную форму (например, «go» вместо «went»).</p>');
          });
        }
      }
      if (b.dataset.wp === 'known' || b.dataset.wp === 'unknown') {
        setKnown(t.lang, [w], b.dataset.wp === 'known');
        App.render();
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = U.formData(form);
      if (!d.back) { back.focus(); return; }
      const note = form.querySelector('[name=useNote]') && form.querySelector('[name=useNote]').checked
        ? o.sentence + (o.sentenceTr ? ' — ' + o.sentenceTr : '') : (o.aiNote || '');
      if (entry) {
        entry.card.front = d.front || entry.card.front;
        entry.card.back = d.back;
        if (note && !entry.card.note) entry.card.note = note;
        U.toast('Карточка обновлена');
      } else {
        let deck = S().decks.find((x) => x.id === d.deckId);
        if (!deck) {
          const name = d.deckId === '__new' && decks.length ? (prompt('Название новой колоды', 'Слова из «' + t.title + '»') || '').trim() : 'Слова из «' + t.title + '»';
          if (!name) return;
          deck = { id: U.uid(), name, lang: t.lang, direction: 'fb', created: Date.now(), cards: [] };
          S().decks.push(deck);
        }
        deck.cards.push({ id: U.uid(), front: d.front || o.display, back: d.back, note, created: Date.now(), source: t.id });
        t.deckId = deck.id;
        setKnown(t.lang, [w], false);
        U.toast('Добавлено в «' + deck.name + '»');
      }
      Store.save();
      App.render();
    });
  }

  // Бесплатный перевод через MyMemory (без ключа). Отправляется только само слово/фраза.
  const trCache = new Map();
  function translate(str, src) {
    const key = src + '|' + str.toLowerCase();
    if (trCache.has(key)) return Promise.resolve(trCache.get(key));
    const url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(str) + '&langpair=' + encodeURIComponent(src + '|ru');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    return fetch(url, { signal: ctrl.signal }).then((r) => r.json()).then((data) => {
      clearTimeout(timer);
      const clean = (x) => String(x || '').replace(/\s+/g, ' ').trim();
      const main = clean(data && data.responseData && data.responseData.translatedText);
      if (!main || /MYMEMORY WARNING|INVALID/i.test(main)) return null;
      const seen = new Set([main.toLowerCase()]);
      const alts = [];
      ((data && data.matches) || []).forEach((m) => {
        const tr = clean(m.translation);
        const low = tr.toLowerCase();
        if (/[а-яё]/i.test(tr) && tr.length < 60 && !/[a-z]{3,}/i.test(tr) && !seen.has(low) && alts.length < 3) {
          seen.add(low);
          alts.push(str[0] === str[0].toLowerCase() ? tr.charAt(0).toLowerCase() + tr.slice(1) : tr);
        }
      });
      // Если слово в тексте с маленькой буквы — и перевод с маленькой.
      const lower = str[0] === str[0].toLowerCase();
      const res = { main: lower ? main.charAt(0).toLowerCase() + main.slice(1) : main, alts };
      trCache.set(key, res);
      return res;
    }).catch(() => { clearTimeout(timer); return null; });
  }

  // Значения английского слова по частям речи (бесплатный словарь, без ключа).
  const POS = { noun: 'сущ.', verb: 'глаг.', adjective: 'прил.', adverb: 'нареч.', pronoun: 'местоим.', preposition: 'предлог', conjunction: 'союз', interjection: 'межд.' };
  const defCache = new Map();
  function definitions(word) {
    const key = word.toLowerCase();
    if (defCache.has(key)) return Promise.resolve(defCache.get(key));
    return fromWiktionary(key)
      .catch(() => null)
      .then((r) => (r && r.length ? r : fromDictionaryApi(key)))
      .then((r) => { if (r && r.length) defCache.set(key, r); return r; })
      .catch(() => null);
  }

  // Убираем HTML-разметку из ответа Викисловаря
  function stripHtml(html) {
    const el = document.createElement('div');
    el.innerHTML = String(html || '');
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  // Основной источник — Викисловарь (английский). Для форм вроде «smells» идём к «smell».
  async function fromWiktionary(word, depth) {
    const r = await fetch('https://en.wiktionary.org/api/rest_v1/page/definition/' + encodeURIComponent(word));
    if (!r.ok) return null;
    const data = await r.json();
    const out = [];
    const lemmas = [];
    (data.en || []).forEach((entry) => {
      const items = [];
      (entry.definitions || []).forEach((d) => {
        const html = d.definition || '';
        if (/form-of-definition/.test(html)) {
          // ссылка на начальную форму: <span class="form-of-definition-link">…<a href="/wiki/life#English">
          const m = html.match(/form-of-definition-link[\s\S]*?href="\/wiki\/([^"#]+)/);
          if (m) {
            const lemma = decodeURIComponent(m[1]).replace(/_/g, ' ');
            if (!lemmas.some((x) => x.lemma === lemma)) lemmas.push({ lemma, pos: String(entry.partOfSpeech || '').toLowerCase() });
          }
          return;
        }
        const def = stripHtml(html);
        if (!def || items.length >= 3) return;
        const ex = (d.examples && d.examples[0]) ? stripHtml(d.examples[0]) : (d.parsedExamples && d.parsedExamples[0] ? stripHtml(d.parsedExamples[0].example) : '');
        items.push({ def, ex: ex.length < 160 ? ex : '' });
      });
      const pos = String(entry.partOfSpeech || '').toLowerCase();
      if (items.length && !/symbol|letter|abbreviation|initialism|proper noun|prefix|suffix/.test(pos)) out.push({ pos, items });
    });
    // Слово — форма другого слова: показываем значения начальных форм (до двух)
    if (!depth && lemmas.length) {
      const extra = [];
      for (const l of lemmas.slice(0, 2)) {
        if (l.lemma.toLowerCase() === word) continue;
        const base = await fromWiktionary(l.lemma.toLowerCase(), 1).catch(() => null);
        if (!base || !base.length) continue;
        const same = base.filter((b) => b.pos === l.pos);
        extra.push({ pos: '→ ' + l.lemma + ' (' + (POS[l.pos] || l.pos) + ')', items: [] });
        (same.length ? same : base).slice(0, 2).forEach((b) => extra.push(b));
      }
      return out.concat(extra).slice(0, 6);
    }
    return out.slice(0, 4);
  }

  // Запасной источник — dictionaryapi.dev
  function fromDictionaryApi(key) {
    return fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(key))
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const byPos = new Map();
        (Array.isArray(data) ? data : []).forEach((entry) => (entry.meanings || []).forEach((m) => {
          const list = byPos.get(m.partOfSpeech) || [];
          (m.definitions || []).forEach((d) => { if (list.length < 3 && d.definition) list.push({ def: d.definition, ex: d.example || '' }); });
          byPos.set(m.partOfSpeech, list);
        }));
        return Array.from(byPos, ([pos, items]) => ({ pos, items })).filter((x) => x.items.length).slice(0, 4);
      });
  }

  function setKnown(lang, words, isKnown) {
    const key = lang || '_';
    const set = new Set(S().known[key] || []);
    words.forEach((w) => { if (isKnown) set.add(w); else set.delete(w); });
    S().known[key] = Array.from(set);
    Store.save();
  }

  function speak(str, lang) {
    if (!('speechSynthesis' in window) || !lang) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(str);
    u.lang = lang; u.rate = 0.9;
    speechSynthesis.speak(u);
  }

  // ---------- Окно текста ----------

  function textModal(t) {
    const isNew = !t;
    t = t || { title: '', lang: 'en-US', body: '' };
    App.modal({
      title: isNew ? 'Новый текст' : 'Текст',
      body:
        '<label>Название<input name="title" required maxlength="80" value="' + U.esc(t.title) + '" placeholder="например, Глава 1"></label>' +
        '<label>Язык<select name="lang">' + App.LANGS.map(([c, n]) => '<option value="' + c + '"' + (c === t.lang ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></label>' +
        '<label>Текст<textarea name="body" rows="10" required placeholder="Вставь сюда текст на изучаемом языке">' + U.esc(bodyOf(t)) + '</textarea></label>',
      extra: isNew ? '' : '<button type="button" class="btn ghost danger-text" data-x="del">Удалить</button>',
      onOpen(form, close) {
        const del = form.querySelector('[data-x=del]');
        if (del) del.addEventListener('click', async () => {
          close();
          if (await App.confirm('Удалить текст «' + t.title + '»? Карточки, которые ты из него добавила, останутся.')) {
            S().texts = S().texts.filter((x) => x.id !== t.id);
            openId = null; Store.save(); App.render();
          }
        });
      },
      onSubmit(d) {
        const body = d.body || '';
        if (!d.title || !body) return false;
        if (isNew) { t = { id: U.uid(), created: Date.now() }; S().texts.push(t); }
        t.title = d.title; t.lang = d.lang; t.body = body;
        openId = t.id;
        Store.save(); App.render();
      },
    });
  }

  function addSample() {
    const t = {
      id: U.uid(), created: Date.now(), title: 'A quiet morning', lang: 'en-US',
      body: 'Every morning, Anna wakes up before the city gets loud. She makes a cup of tea and opens the window. The street is still empty, and the air smells of rain.\n\n' +
        'Although she has a busy schedule, she always finds twenty minutes for English. Today she is reading a short story about a journey across the mountains. ' +
        'Some words are new, so she writes them down and tries to guess their meaning from the context.\n\n' +
        'Later, at the university, she will meet her friends. They often rely on each other when exams are coming. ' +
        'Anna is grateful for that. She believes that small steps every day help you achieve big goals.',
    };
    S().texts.push(t);
    openId = t.id;
    Store.save();
    App.render();
  }

  // ---------- События ----------

  document.addEventListener('click', async (e) => {
    const selStr = window.getSelection ? window.getSelection().toString().trim() : '';
    if (pop && pop.isConnected && !pop.contains(e.target) && !e.target.closest('.w') && !/\s/.test(selStr)) closePop();
    if (!root || !root.contains(e.target)) return;
    const w = e.target.closest('.w');
    if (w && root.querySelector('#reader') && root.querySelector('#reader').contains(w)) {
      const sel = window.getSelection();
      if (sel && /\s/.test(sel.toString().trim())) return; // выделена фраза — её обработает onSelect
      const p = w.closest('p');
      const before = Array.from(p.childNodes).slice(0, Array.from(p.childNodes).indexOf(w)).map((n) => n.textContent).join('');
      openPop({ word: w.dataset.w, display: w.textContent, rect: w.getBoundingClientRect(), sentence: sentenceAround(p.textContent, before.length) });
      return;
    }
    const b = e.target.closest('[data-r]');
    if (!b) return;
    const t = openId && text(openId);
    switch (b.dataset.r) {
      case 'new': textModal(); break;
      case 'sample': addSample(); break;
      case 'lib-open': openLibrary(b.dataset.id); break;
      case 'open': openId = b.dataset.id; App.render(); break;
      case 'back': openId = null; App.render(); break;
      case 'edit': textModal(text(b.dataset.id)); break;
      case 'all-known': {
        if (!t) break;
        const dict = dictFor(t.lang);
        const known = knownSet(t.lang);
        const list = Array.from(new Set(wordsOf(bodyOf(t)))).filter((x) => !/^\d+$/.test(x) && status(x, dict, known) === 'unknown');
        if (await App.confirm('Отметить ' + list.length + ' ' + U.plural(list.length, ['слово', 'слова', 'слов']) + ' как знакомые? Они перестанут подсвечиваться во всех текстах на этом языке.', 'Отметить')) {
          setKnown(t.lang, list, true); App.render();
        }
        break;
      }
    }
  });

  document.addEventListener('change', (e) => {
    if (!root || !root.contains(e.target) || e.target.dataset.r !== 'toggle-unknown') return;
    S().settings.readHighlightUnknown = e.target.checked;
    Store.save(); App.render();
  });

  window.addEventListener('resize', closePop);

  App.views.read = {
    render,
    group: 'cards',
    leave() { root = null; closePop(); },
    key(e) { if (e.key === 'Escape' && pop) { closePop(); return true; } },
  };
})();
