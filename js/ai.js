// Подключение нейросети. Работает напрямую из браузера, без своего сервера.
// Поддерживаются: Gemini (Google AI Studio), OpenRouter (бесплатные модели)
// и «свой адрес» в формате OpenAI (например, Ollama на ноутбуке).
// Ключ хранится только в этом браузере (localStorage) и не попадает в экспорт.
(function () {
  'use strict';

  const PROVIDERS = {
    gemini: { name: 'Gemini (Google)', keyUrl: 'https://aistudio.google.com/apikey', defaultModel: 'gemini-2.5-flash' },
    openrouter: { name: 'OpenRouter (бесплатные модели)', keyUrl: 'https://openrouter.ai/settings/keys', defaultModel: 'openrouter/free' },
    custom: { name: 'Свой адрес (Ollama и т.п.)', keyUrl: '', defaultModel: 'llama3.1' },
  };

  function cfg() {
    const s = Store.state.settings;
    s.ai = s.ai || { provider: 'openrouter', key: '', model: '', baseUrl: 'http://localhost:11434/v1' };
    return s.ai;
  }

  // Короткая выдержка из ответа сервиса — чтобы было видно настоящую причину
  function detail(text) {
    let msg = String(text || '');
    try { const j = JSON.parse(msg); msg = (j.error && (j.error.message || j.error.status)) || j.message || msg; } catch (e) { /* не JSON */ }
    msg = String(msg).replace(/\s+/g, ' ').trim();
    return msg ? ' (ответ сервиса: «' + msg.slice(0, 140) + (msg.length > 140 ? '…' : '') + '»)' : '';
  }

  function friendlyError(status, text) {
    const t = String(text || '').toLowerCase();
    if (/location is not supported|user location|not available in your country|region/.test(t)) {
      return 'Сервис недоступен в твоём регионе. Включи VPN или выбери OpenRouter в настройках.';
    }
    if (/api key not valid|invalid api key|api_key_invalid|unauthorized|no auth|user not found/.test(t) || status === 401) return 'Ключ не подошёл. Проверь, что он скопирован целиком и выбран нужный сервис.' + detail(text);
    if (status === 403) return 'Доступ запрещён. Для Gemini обычно это значит: нет VPN или в Google Cloud выключен доступ к API для этого ключа.' + detail(text);
    if (status === 429 || /quota|rate limit|resource_exhausted/.test(t)) return 'Лимит бесплатных запросов исчерпан. Попробуй позже или выбери другую модель.' + detail(text);
    if (status === 404) return 'Модель не найдена. Выбери другую в Настройках → «Нейросеть».';
    if (status >= 500) return 'Сервис нейросети сейчас перегружен. Попробуй через минуту.';
    return 'Ошибка нейросети (' + status + ').' + detail(text);
  }

  async function request(url, opts, timeoutMs) {
    let res;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs || 60000);
    try {
      res = await fetch(url, Object.assign({}, opts, { signal: ctrl.signal }));
    } catch (e) {
      if (e.name === 'AbortError') throw Object.assign(new Error('Модель слишком долго думала (нет ответа ' + Math.round((timeoutMs || 60000) / 1000) + ' с).'), { retry: true, kind: 'timeout' });
      throw Object.assign(new Error('Нет связи с сервисом нейросети: браузер не смог отправить запрос. Проверь интернет' + (cfg().provider === 'gemini' ? ' или VPN.' : '.')), { kind: 'network' });
    } finally {
      clearTimeout(timer);
    }
    const text = await res.text();
    if (!res.ok) throw new Error(friendlyError(res.status, text));
    try { return JSON.parse(text); } catch (e) { throw new Error('Сервис вернул непонятный ответ'); }
  }

  // Достаём JSON из ответа модели (иногда она оборачивает его в ```json ... ```).
  function parseJSON(text) {
    let t = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    try { return JSON.parse(t); } catch (e) { /* попробуем вырезать */ }
    const a = t.search(/[[{]/);
    const b = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'));
    if (a >= 0 && b > a) {
      try { return JSON.parse(t.slice(a, b + 1)); } catch (e) { /* ignore */ }
    }
    throw new Error('Нейросеть ответила не по формату. Попробуй ещё раз.');
  }

  function countUse() {
    const st = Store.state;
    const today = U.dayKey(Date.now());
    if (!st.aiUsage || st.aiUsage.day !== today) st.aiUsage = { day: today, n: 0, by: {} };
    st.aiUsage.n++;
    st.aiUsage.by = st.aiUsage.by || {};
    const p = cfg().provider;
    st.aiUsage.by[p] = (st.aiUsage.by[p] || 0) + 1;
    Store.saveSoon();
  }

  const AI = {
    PROVIDERS,
    cfg,
    parseJSON,

    ready() { const c = cfg(); return c.provider === 'custom' ? !!c.baseUrl : !!c.key; },

    // Переключение сервиса: у каждого свой ключ
    setProvider(p) {
      const c = cfg();
      c.keys = c.keys || {};
      c.keys[c.provider] = c.key || '';
      c.provider = p;
      c.key = c.keys[p] || '';
      c.model = ''; c.models = []; c.autoModel = ''; c.lastTest = null;
      Store.save();
    },

    // Подсказка, если ключ явно от другого сервиса
    keyProblem() {
      const c = cfg();
      const k = String(c.key || '').trim();
      if (!k) return '';
      if (/\s/.test(k)) return 'В ключе есть пробел или перенос строки — скопируй его заново.';
      if (c.provider === 'gemini' && /^sk-/.test(k)) return 'Это похоже на ключ OpenRouter, а выбран Gemini. Ключ Gemini начинается с «AIza».';
      if (c.provider === 'openrouter' && /^AIza/.test(k)) return 'Это ключ Gemini, а выбран OpenRouter. Переключи «Сервис» на Gemini.';
      if (c.provider === 'gemini' && k.length < 30) return 'Ключ слишком короткий — похоже, скопировался не целиком.';
      if (c.provider === 'openrouter' && !/^sk-or-/.test(k)) return 'Ключ OpenRouter обычно начинается с «sk-or-». Проверь, что скопирован целиком.';
      return '';
    },

    model() { const c = cfg(); return c.model || ((c.provider === 'gemini' || c.provider === 'openrouter') && c.autoModel) || PROVIDERS[c.provider].defaultModel; },

    // Отправить запрос. system — инструкция, prompt — текст (или массив сообщений {role, text}).
    // json: true — попросить ответ в JSON и сразу разобрать его.
    // Запрос с запасным вариантом: если основной сервис не ответил,
    // пробуем другой сервис, для которого тоже сохранён ключ.
    async ask(o) {
      if (AI._mock) { countUse(); const r = await AI._mock(o); return o.json ? (typeof r === 'string' ? parseJSON(r) : r) : r; }
      const c = cfg();
      AI.lastProvider = c.provider;
      AI.lastPrimaryError = '';
      if (c.provider === 'custom') return AI.askOne(o);
      try {
        return await tryKeys(c.provider, o);
      } catch (err) {
        AI.lastPrimaryError = err.message; // почему основной сервис не ответил — покажем в настройках
        const backup = AI.backupProvider();
        if (!backup) throw err;
        AI.status = 'переключаюсь на ' + PROVIDERS[backup].name.split(' ')[0] + '…';
        try {
          const r = await tryKeys(backup, o);
          AI.lastProvider = backup;
          if (!AI._warned) { AI._warned = true; U.toast(PROVIDERS[c.provider].name.split(' ')[0] + ' не ответил — ответ дал запасной ' + PROVIDERS[backup].name.split(' ')[0] + '.'); }
          return r;
        } catch (err2) {
          throw new Error(err.message + ' Запасной вариант тоже не ответил: ' + err2.message);
        }
      }
    },

    // Все ключи сервиса (можно несколько — по одному в строке)
    pool(p) { return poolOf(p); },

    // Запасной сервис — тот, у которого сохранён ключ (кроме текущего)
    backupProvider() {
      const c = cfg();
      return ['openrouter', 'gemini'].find((p) => p !== c.provider && poolOf(p).length) || '';
    },

    async askOne(o) {
      const c = cfg();
      if (!AI.ready()) throw new Error('Нейросеть не подключена. Открой Настройки → «Нейросеть».');
      const kp = AI.keyProblem();
      if (kp) throw new Error(kp);
      const messages = Array.isArray(o.prompt) ? o.prompt : [{ role: 'user', text: o.prompt }];
      const system = (o.system || '') + (o.json ? '\nОтвечай ТОЛЬКО валидным JSON без пояснений и без ```.' : '');
      let text;
      if (c.provider === 'gemini') {
        const body = {
          contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text }] })),
          generationConfig: { temperature: o.temperature == null ? 0.7 : o.temperature },
        };
        if (system.trim()) body.systemInstruction = { parts: [{ text: system }] };
        if (o.json) body.generationConfig.responseMimeType = 'application/json';
        // Перебираем модели (названия у Google меняются) и адреса (ключи AQ.… могут работать через Vertex AI)
        const models = c.model ? [c.model] : await geminiCandidates();
        let data = null, firstErr = null, lastErr = null, timeouts = 0;
        const deadline = Date.now() + (o.json ? 120000 : 45000); // общий предел на все попытки
        outer: for (const model of models) {
          for (const ep of geminiEndpoints(model)) {
            if (Date.now() > deadline) { firstErr = firstErr || new Error('Google слишком долго не отвечает. Проверь VPN и попробуй ещё раз.'); break outer; }
            AI.status = 'пробую ' + model + (ep.kind === 'vertex' ? ' (Vertex)' : '') + '…';
            try {
              const simple = c.simpleMode && ep.kind === 'studio';
              data = await request(simple ? ep.url + '?key=' + encodeURIComponent(c.key) : ep.url,
                simple ? { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(body) }
                  : { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': c.key }, body: JSON.stringify(body) },
                o.json ? 90000 : 30000);
              if (c.endpoint !== ep.kind || (!c.model && c.autoModel !== model)) { c.endpoint = ep.kind; if (!c.model) c.autoModel = model; Store.saveSoon(); }
              break outer;
            } catch (e) {
              lastErr = e;
              // Google молчит или недоступен — дальше перебирать бессмысленно
              if (/слишком долго|Нет связи/.test(e.message)) {
                timeouts++;
                firstErr = new Error((e.kind === 'timeout' ? 'Google принял запрос, но не ответил за 30 с (модель ' + model + ').' : 'Браузер не смог отправить запрос в Google (модель ' + model + ').') + ' Нажми «Диагностика Gemini» в настройках.');
                break outer;
              }
              if (!/Модель не найдена/.test(e.message)) firstErr = firstErr || e;
              // ключ, регион, связь — дальше перебирать бессмысленно
              if (/регионе/.test(e.message) || (/Ключ не подошёл/.test(e.message) && !/^AQ\./.test(String(c.key)))) break outer;
            }
          }
          if (c.autoModel === model) c.autoModel = '';
        }
        AI.status = '';
        if (!data) throw (firstErr || new Error((lastErr ? lastErr.message : 'Модель не найдена.') + ' Перепробовала: ' + models.join(', ') + '.'));
        const cand = data.candidates && data.candidates[0];
        text = cand && cand.content && cand.content.parts ? cand.content.parts.map((p) => p.text || '').join('') : '';
        if (!text) throw new Error(cand && cand.finishReason === 'SAFETY' ? 'Нейросеть отказалась отвечать на этот запрос.' : 'Пустой ответ от нейросети.');
      } else {
        const base = c.provider === 'openrouter' ? 'https://openrouter.ai/api/v1' : String(c.baseUrl).replace(/\/+$/, '');
        const headers = { 'Content-Type': 'application/json' };
        if (c.key) headers.Authorization = 'Bearer ' + c.key;
        if (c.provider === 'openrouter') { headers['X-Title'] = 'Study Workspace'; }
        const msgs = [];
        if (system.trim()) msgs.push({ role: 'system', content: system });
        messages.forEach((m) => msgs.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text }));
        // Модели-кандидаты: выбранная вручную — или подобранные автоматически (до 3 попыток)
        const candidates = c.model || c.provider !== 'openrouter' ? [AI.model()] : await openRouterCandidates();
        let lastErr = null;
        for (const model of candidates) {
          AI.status = 'спрашиваю ' + shortName(model) + '…';
          try {
            const data = await request(base + '/chat/completions', {
              method: 'POST', headers,
              body: JSON.stringify({
                model, messages: msgs,
                temperature: o.temperature == null ? 0.7 : o.temperature,
                max_tokens: o.maxTokens || 4000,
                reasoning: { effort: 'low' }, // «думающие» модели пусть думают покороче
              }),
            }, 75000);
            if (data.error) throw Object.assign(new Error(friendlyError(data.error.code || 0, data.error.message)), { retry: true });
            const msg = data.choices && data.choices[0] && data.choices[0].message;
            text = msg && msg.content ? String(msg.content) : '';
            if (!text.trim()) throw Object.assign(new Error('Модель вернула пустой ответ.'), { retry: true });
            if (o.json) parseJSON(text); // проверим формат сразу, чтобы при ошибке попробовать другую модель
            if (c.provider === 'openrouter' && !c.model && c.autoModel !== model) { c.autoModel = model; Store.saveSoon(); }
            lastErr = null;
            break;
          } catch (e) {
            lastErr = e;
            if (c.provider === 'openrouter' && !c.model && c.autoModel === model) { c.autoModel = ''; }
            // неверный ключ или дневной лимит аккаунта — другие модели не помогут
            if (/Ключ не подошёл|Нет связи|per-day|per day|daily/i.test(e.message)) break;
          }
        }
        AI.status = '';
        if (lastErr) throw new Error(lastErr.message + (candidates.length > 1 ? ' (попробовала ' + candidates.length + ' модели)' : '') + ' Попробуй ещё раз через минуту.');
      }
      countUse();
      return o.json ? parseJSON(text) : text.trim();
    },

    // Список доступных моделей для выбора в настройках.
    async listModels() {
      const c = cfg();
      if (c.provider === 'gemini') {
        if (!c.key) throw new Error('Сначала вставь ключ');
        const data = await request('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': c.key } }, 8000);
        return (data.models || [])
          .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent') && /gemini/.test(m.name) && !/(image|tts|audio|live|embedding|vision|thinking-exp)/.test(m.name))
          .map((m) => ({ id: m.name.replace(/^models\//, ''), label: m.displayName || m.name }))
          .sort((a, b) => score(b.id) - score(a.id));
      }
      if (c.provider === 'openrouter') {
        const data = await request('https://openrouter.ai/api/v1/models', {});
        return (data.data || [])
          .filter((m) => m.pricing && Number(m.pricing.prompt) === 0 && Number(m.pricing.completion) === 0 && /->text$/.test((m.architecture && m.architecture.modality) || '->text'))
          .map((m) => ({ id: m.id, label: m.id === 'openrouter/free' ? 'Автовыбор бесплатной модели (рекомендуется)' : (m.name || m.id).replace(/\s*\(free\)\s*/i, '') + ' — бесплатно' }))
          .sort((a, b) => score(b.id) - score(a.id));
      }
      const base = String(c.baseUrl).replace(/\/+$/, '');
      const data = await request(base + '/models', { headers: c.key ? { Authorization: 'Bearer ' + c.key } : {} });
      return (data.data || data.models || []).map((m) => ({ id: m.id || m.name, label: m.id || m.name }));
    },

    // Подробная проверка Gemini по шагам — для поиска причины
    async diagnoseGemini(onStep) {
      const c = cfg();
      const key = poolOf('gemini')[0] || c.key;
      const lines = [];
      const step = async (name, fn) => {
        const t0 = Date.now();
        onStep && onStep(name + '…');
        try { const r = await fn(); lines.push('✓ ' + name + ': ' + r + ' (' + ((Date.now() - t0) / 1000).toFixed(1) + ' с)'); return true; }
        catch (e) { lines.push('✗ ' + name + ': ' + e.message + ' (' + ((Date.now() - t0) / 1000).toFixed(1) + ' с)'); return false; }
      };
      if (!key) return ['✗ Нет ключа Gemini'];
      lines.push('Ключ: ' + key.slice(0, 6) + '… (' + key.length + ' символов)');
      let model = c.autoBy && c.autoBy.gemini || c.autoModel || '';
      await step('Список моделей', async () => {
        const data = await request('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': key } }, 20000);
        const names = (data.models || []).filter((m) => (m.supportedGenerationMethods || []).includes('generateContent')).map((m) => m.name.replace('models/', ''));
        const flash = names.filter((n) => /flash/.test(n) && !/(image|tts|audio|live|thinking)/.test(n));
        if (!model) model = flash.find((n) => /flash-latest/.test(n)) || flash.find((n) => !/lite|preview|exp/.test(n)) || flash[0] || names[0] || 'gemini-flash-latest';
        return names.length + ' моделей, flash: ' + flash.slice(0, 6).join(', ');
      });
      model = model || 'gemini-flash-latest';
      const body = JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Ответь одним словом: привет' }] }] });
      const reply = (data) => { const p = data.candidates && data.candidates[0] && data.candidates[0].content; const t = p && p.parts ? p.parts.map((x) => x.text || '').join('') : ''; if (!t) throw new Error('пустой ответ: ' + JSON.stringify(data).slice(0, 120)); return '«' + t.trim().slice(0, 40) + '»'; };
      const okA = await step('Запрос к ' + model + ' (обычный, ждём до 90 с)', async () =>
        reply(await request('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent',
          { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body }, 90000)));
      const okB = await step('Запрос к ' + model + ' (ключ в адресе, без доп. заголовков)', async () =>
        reply(await request('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(key),
          { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body }, 90000)));
      if (/^AQ\./.test(key)) {
        await step('Запрос через Vertex AI', async () =>
          reply(await request('https://aiplatform.googleapis.com/v1/publishers/google/models/' + encodeURIComponent(model) + ':generateContent',
            { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body }, 60000)));
      }
      if (okA || okB) { c.autoBy = c.autoBy || {}; c.autoBy.gemini = model; if (c.provider === 'gemini') c.autoModel = model; if (okB && !okA) c.simpleMode = true; Store.save(); }
      return lines;
    },

    // Проверка подключения: короткий запрос.
    async test() {
      const r = await AI.ask({ prompt: 'Ответь одним словом по-русски: привет', temperature: 0 });
      return r;
    },
  };

  // Какие модели Gemini пробовать: запомненная → из списка Google → известные названия
  async function geminiCandidates() {
    const c = cfg();
    const out = [];
    AI.status = 'спрашиваю у Google список моделей…';
    if (c.autoModel) out.push(c.autoModel);
    try {
      const list = await AI.listModels();
      list.slice(0, 2).forEach((m) => out.push(m.id));
    } catch (e) { /* список недоступен — возьмём известные названия */ }
    ['gemini-flash-latest', 'gemini-3-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-lite-latest'].forEach((m) => out.push(m));
    return Array.from(new Set(out)).slice(0, 6);
  }

  function geminiEndpoints(model) {
    const c = cfg();
    const studio = { kind: 'studio', url: 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent' };
    const vertex = { kind: 'vertex', url: 'https://aiplatform.googleapis.com/v1/publishers/google/models/' + encodeURIComponent(model) + ':generateContent' };
    if (!/^AQ\./.test(String(c.key || ''))) return [studio];
    return c.endpoint === 'vertex' ? [vertex, studio] : [studio, vertex];
  }

  function poolOf(p) {
    const c = cfg();
    let list = (c.pools && c.pools[p]) || [];
    if (!list.length && c.keys && c.keys[p]) list = [c.keys[p]];
    if (!list.length && p === c.provider && c.key) list = [c.key];
    return list.map((k) => String(k).trim()).filter(Boolean);
  }

  // Ошибки, при которых стоит попробовать другой ключ того же сервиса
  const KEY_ERR = /Лимит|Ключ не подошёл|Доступ запрещён|credits|402|недостаточно/i;

  // Перебираем ключи сервиса, начиная с последнего удачного
  async function tryKeys(p, o) {
    const c = cfg();
    const keys = poolOf(p);
    if (!keys.length) throw new Error('Нет ключа для ' + PROVIDERS[p].name);
    c.keyIdx = c.keyIdx || {};
    const start = Math.min(c.keyIdx[p] || 0, keys.length - 1);
    let lastErr = null;
    for (let i = 0; i < keys.length; i++) {
      const idx = (start + i) % keys.length;
      if (keys.length > 1) AI.status = 'ключ ' + (idx + 1) + ' из ' + keys.length + '…';
      try {
        const r = await withProvider(p, keys[idx], () => AI.askOne(o));
        if (c.keyIdx[p] !== idx) { c.keyIdx[p] = idx; Store.saveSoon(); }
        return r;
      } catch (e) {
        lastErr = e;
        if (!KEY_ERR.test(e.message)) throw e; // сеть, модель и т.п. — другой ключ не поможет
      }
    }
    throw new Error(lastErr.message + (keys.length > 1 ? ' (все ' + keys.length + ' ключа исчерпаны)' : ''));
  }

  // Временно выполнить запрос от имени сервиса p с ключом key (своя модель у каждого сервиса)
  async function withProvider(p, key, fn) {
    const c = cfg();
    c.autoBy = c.autoBy || {};
    c.autoBy[c.provider] = c.autoModel || '';
    const saved = { provider: c.provider, key: c.key, model: c.model, autoModel: c.autoModel, endpoint: c.endpoint };
    const same = p === c.provider;
    c.provider = p; c.key = key;
    if (!same) { c.model = ''; c.autoModel = c.autoBy[p] || ''; c.endpoint = ''; }
    try { return await fn(); } finally {
      const auto = c.autoModel, ep = c.endpoint;
      c.autoBy[p] = auto || '';
      Object.assign(c, saved);
      if (same) { c.autoModel = auto; c.endpoint = ep; }
      Store.saveSoon();
    }
  }

  // Для OpenRouter: последняя сработавшая модель + лучшие быстрые бесплатные + общий автовыбор.
  let orCache = null;
  async function openRouterCandidates() {
    const c = cfg();
    const out = [];
    if (c.autoModel) out.push(c.autoModel);
    try {
      if (!orCache) orCache = await AI.listModels();
      orCache.filter((m) => m.id !== 'openrouter/free' && !SLOW.test(m.id)).slice(0, 3).forEach((m) => out.push(m.id));
    } catch (e) { /* без списка — только автовыбор */ }
    out.push('openrouter/free');
    return Array.from(new Set(out)).slice(0, 3);
  }
  // «Думающие» и узкоспециальные модели — медленные или не про текст
  const SLOW = /reason|think|r1\b|omni|-vl|vision|lyria|code|coder|guard|embed/i;
  function shortName(id) { return String(id).split('/').pop().replace(/:free$/, ''); }

  // Чем выше — тем лучше модель для наших задач (грубая эвристика для сортировки).
  function score(id) {
    let s = 0;
    const v = /(\d+(?:\.\d+)?)/.exec(id.replace(/^.*?gemini-/, ''));
    if (/gemini/.test(id) && v) s += Number(v[1]) * 10;
    if (/flash/.test(id)) s += 5;
    if (/lite/.test(id)) s -= 3;
    if (/preview|exp/.test(id)) s -= 2;
    if (id === 'openrouter/free') s += 100;
    if (/gemma-4-31b|gemma-3-27b|llama-3\.3-70b|mistral-small|deepseek-chat|qwen.*instruct/.test(id)) s += 20;
    if (SLOW.test(id)) s -= 40;
    if (/550b|405b|ultra/.test(id)) s -= 8; // огромные модели на бесплатных серверах часто медленные
    if (/deepseek|llama-[34].*70b|qwen.*(72|235)b|gemma-[34]-(27|31)b|ultra|large|mistral-medium/.test(id)) s += 30;
    if (/super|maverick/.test(id)) s += 15;
    if (/(\b|-)(0\.5|1|1\.7|2|2\.6|3|4|7|8)b\b|mini|small|nano|tiny|lightning/.test(id)) s -= 12;
    if (/code|coder/.test(id)) s -= 20;
    return s;
  }

  // Удобная обёртка: показывает «думаю…» на кнопке и тост с ошибкой.
  AI.run = async function (btn, fn) {
    const old = btn ? btn.innerHTML : '';
    const started = Date.now();
    const paint = () => {
      if (!btn || !btn.isConnected) return;
      const sec = Math.round((Date.now() - started) / 1000);
      btn.innerHTML = '<span class="spinner"></span> ' + U.esc(AI.status || 'думаю…') + (sec >= 3 ? ' ' + sec + ' с' : '');
    };
    let iv = null;
    if (btn) { btn.disabled = true; paint(); iv = setInterval(paint, 1000); }
    try { return await fn(); } catch (e) { U.toast(e.message); return null; } finally {
      clearInterval(iv);
      if (btn && btn.isConnected) { btn.disabled = false; btn.innerHTML = old; }
    }
  };

  window.AI = AI;
})();
