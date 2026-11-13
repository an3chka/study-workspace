// Быстрая карточка: выдели английское слово где угодно — появится кнопка «Перевести»;
// или нажми иконку карточек в верхней панели. Окно само подставит перевод и другие значения.
(function () {
  'use strict';

  const S = () => Store.state;
  const esc = (s) => U.esc(s == null ? '' : String(s));
  const EN_RE = /^[A-Za-z][A-Za-z'’-]*(?: [A-Za-z][A-Za-z'’-]*){0,4}$/;

  function enDecks() { return S().decks.filter((d) => !d.lang || /^en/.test(d.lang)); }
  function findCard(front) {
    const f = String(front || '').trim().toLowerCase();
    if (!f) return null;
    for (const d of enDecks()) {
      const c = d.cards.find((x) => String(x.front).trim().toLowerCase() === f);
      if (c) return { d, c };
    }
    return null;
  }

  App.quickCard = function (o) {
    o = o || {};
    const decks = enDecks();
    const pref = decks.some((d) => d.id === S().settings.quickDeck) ? S().settings.quickDeck : (decks[0] && decks[0].id);
    let groups = null, looked = '', autoBack = o.back || '', existing = null, timer = 0, seq = 0;

    App.modal({
      title: 'Новая карточка',
      submit: 'В карточки',
      body:
        '<label>Слово или фраза по-английски<input name="front" maxlength="200" required value="' + esc(o.word) + '" placeholder="например, except" autocomplete="off" autocapitalize="none" spellcheck="false"></label>' +
        '<p class="qc-status muted small" aria-live="polite"></p>' +
        '<label>Перевод<input name="back" maxlength="1000" required placeholder="перевод появится сам" value="' + esc(o.back) + '"></label>' +
        '<p class="qc-more small" hidden></p>' +
        (o.sentence
          ? '<label class="check small qc-ex"><input type="checkbox" name="useNote" checked> <span>пример: «' + esc(o.sentence) + '»</span></label>'
          : '<label>Пример или заметка <span class="muted small">(необязательно)</span><input name="note" maxlength="2000"></label>') +
        '<label>Колода<select name="deckId">' +
          decks.map((d) => '<option value="' + d.id + '"' + (d.id === pref ? ' selected' : '') + '>' + esc(d.name) + ' (' + d.cards.length + ')</option>').join('') +
          '<option value="__new"' + (decks.length ? '' : ' selected') + '>+ новая колода «Мои слова»</option></select></label>',
      onOpen(form) {
        const front = form.querySelector('[name=front]');
        const back = form.querySelector('[name=back]');
        const status = form.querySelector('.qc-status');
        const more = form.querySelector('.qc-more');
        const deckSel = form.querySelector('[name=deckId]');
        const submit = form.querySelector('[type=submit]');

        async function lookup() {
          const word = front.value.replace(/\s+/g, ' ').trim();
          if (word.toLowerCase() === looked) return;
          looked = word.toLowerCase();
          groups = null; more.hidden = true;
          // Уже есть такая карточка — покажем её и сохраним изменения в неё
          existing = findCard(word);
          deckSel.closest('label').hidden = !!existing;
          submit.textContent = existing ? 'Сохранить' : 'В карточки';
          if (existing && (!back.value || back.value === autoBack)) { back.value = existing.c.back; autoBack = back.value; }
          status.textContent = existing ? 'Уже есть в колоде «' + existing.d.name + '» — сохраню изменения в ней.' : '';
          if (!word || !EN_RE.test(word)) return;
          if (!S().settings.autoTranslate) { if (!existing) status.textContent = 'Автоперевод выключен в Настройках — впиши перевод сама.'; return; }
          if (navigator.onLine === false) { if (!existing) status.textContent = 'Нет интернета — впиши перевод сама.'; return; }
          const my = ++seq;
          if (!existing) status.textContent = 'перевожу…';
          const [mt, g] = await Promise.all([App.mtTranslate ? App.mtTranslate(word, 'en') : null, App.ruMeanings ? App.ruMeanings(word) : null]);
          if (my !== seq || !form.isConnected) return;
          groups = g;
          let main = '';
          if (g) main = App.ruRank(g, mt && mt.main)[0].words.join(', ');
          else if (mt) main = mt.main;
          if (main && (!back.value || back.value === autoBack)) { back.value = main; autoBack = main; }
          if (!existing) status.textContent = main ? '' : 'Не нашла перевод — впиши сама.';
          const rest = g ? App.ruMoreLine(g, back.value) : '';
          more.hidden = !rest;
          more.innerHTML = rest ? '<span class="muted">ещё:</span> ' + esc(rest) : '';
        }
        front.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(lookup, 600); });
        front.addEventListener('change', lookup);
        if (o.word) { lookup(); setTimeout(() => back.focus(), 40); }
      },
      onSubmit(d) {
        const word = String(d.front || '').replace(/\s+/g, ' ').trim();
        const tr = String(d.back || '').trim();
        if (!word || !tr) return false;
        const note = o.sentence ? (d.useNote ? o.sentence : '') : String(d.note || '').trim();
        const extra = groups && word.toLowerCase() === looked ? App.ruMoreLine(groups, tr) : undefined;
        existing = findCard(word);
        if (existing) {
          existing.c.back = tr;
          if (note && !existing.c.note) existing.c.note = note;
          if (extra !== undefined) existing.c.more = extra; else delete existing.c.more;
          U.toast('Карточка обновлена');
        } else {
          let deck = S().decks.find((x) => x.id === d.deckId);
          if (!deck) {
            deck = { id: U.uid(), name: 'Мои слова', lang: 'en-US', direction: 'fb', created: Date.now(), cards: [] };
            S().decks.push(deck);
          }
          const card = { id: U.uid(), front: word, back: tr, note, created: Date.now() };
          if (extra !== undefined) card.more = extra;
          deck.cards.push(card);
          S().settings.quickDeck = deck.id;
          U.toast('Добавлено в «' + deck.name + '»');
        }
        Store.save();
        // Перерисовываем только там, где видно карточки, чтобы не сбить ответ в уроке
        if (/^#\/(cards|read)/.test(location.hash)) App.render();
      },
    });
  };

  // ---------- Кнопка «Перевести» у выделенного слова ----------
  let chip = null;
  function hideChip() { if (chip) { chip.remove(); chip = null; } }

  function checkSelection() {
    const sel = window.getSelection && window.getSelection();
    const str = sel && sel.rangeCount ? sel.toString().replace(/\s+/g, ' ').trim() : '';
    if (!str || str.length > 60 || !EN_RE.test(str)) return hideChip();
    const range = sel.getRangeAt(0);
    const anc = range.commonAncestorContainer;
    const el = anc.nodeType === 1 ? anc : anc.parentElement;
    // В «Чтении» у слов своё окошко; в полях ввода и коде кнопка мешала бы
    if (!el || el.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], #reader, .word-pop, .modal-backdrop, .qc-chip, pre, code, .CodeMirror, .cm-editor')) return hideChip();
    const r = range.getBoundingClientRect();
    if (!r.width && !r.height) return hideChip();
    const block = el.closest('p, li, td, h1, h2, h3, h4, blockquote, .ex-q') || el;
    const text = (block.textContent || '').replace(/\s+/g, ' ');
    const sentence = text.length < 2000 && App.sentenceAround ? englishPart(App.sentenceAround(text, text.indexOf(str)), str) : '';

    if (!chip) {
      chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'qc-chip';
      chip.innerHTML = I('globe') + ' Перевести';
      // не даём кнопке снять выделение до клика
      chip.addEventListener('pointerdown', (e) => e.preventDefault());
      chip.addEventListener('mousedown', (e) => e.preventDefault());
      document.body.appendChild(chip);
    }
    chip.onclick = () => {
      hideChip();
      const s = window.getSelection();
      if (s) s.removeAllRanges();
      App.quickCard({ word: str.toLowerCase() === str || /^[A-Z][a-z]/.test(str) ? str.toLowerCase() : str, sentence: sentence && sentence !== str ? sentence : '' });
    };
    // Под выделением: на телефоне сверху своё меню «Копировать», не перекрываем его
    const w = chip.offsetWidth || 110;
    const left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2));
    let top = r.bottom + 8;
    if (top + 40 > window.innerHeight) top = Math.max(8, r.top - 44);
    chip.style.left = left + 'px';
    chip.style.top = top + 'px';
  }

  // В теории примеры стоят внутри русского текста: «Вопрос — ставим глагол вперёд: Are you tired?»
  // Берём только английский кусок после двоеточия или тире; если не получается — без примера.
  function englishPart(sent, word) {
    if (!sent || !/[а-яё]/i.test(sent)) return sent;
    const i = sent.indexOf(word);
    if (i < 0) return '';
    const head = sent.slice(0, i).split(/[:—–(«]/);
    const tail = (head[head.length - 1] + sent.slice(i)).replace(/[)»]+$/, '').trim();
    return /[а-яё]/i.test(tail) || tail.split(' ').length < 2 ? '' : tail;
  }

  let selTimer = 0;
  document.addEventListener('selectionchange', () => { clearTimeout(selTimer); selTimer = setTimeout(checkSelection, 250); });
  window.addEventListener('scroll', () => { if (chip) checkSelection(); }, { passive: true, capture: true });
  window.addEventListener('hashchange', hideChip);
})();
