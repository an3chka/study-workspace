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

  function friendlyError(status, text) {
    const t = String(text || '').toLowerCase();
    if (/location is not supported|user location|not available in your country|region/.test(t)) {
      return 'Сервис недоступен в твоём регионе. Включи VPN или выбери OpenRouter в настройках.';
    }
    if (status === 401 || status === 403 || /api key not valid|invalid api key|unauthorized/.test(t)) return 'Ключ не подошёл. Проверь его в Настройках → «Нейросеть».';
    if (status === 429 || /quota|rate limit|resource_exhausted/.test(t)) return 'Лимит бесплатных запросов исчерпан. Попробуй позже или выбери другую модель.';
    if (status === 404) return 'Модель не найдена. Выбери другую в Настройках → «Нейросеть».';
    if (status >= 500) return 'Сервис нейросети сейчас перегружен. Попробуй через минуту.';
    return 'Ошибка нейросети (' + status + '): ' + String(text || '').slice(0, 160);
  }

  async function request(url, opts) {
    let res;
    try {
      res = await fetch(url, opts);
    } catch (e) {
      throw new Error('Нет связи с сервисом нейросети. Проверь интернет' + (cfg().provider === 'gemini' ? ' или VPN.' : '.'));
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
    if (!st.aiUsage || st.aiUsage.day !== today) st.aiUsage = { day: today, n: 0 };
    st.aiUsage.n++;
    Store.saveSoon();
  }

  const AI = {
    PROVIDERS,
    cfg,
    parseJSON,

    ready() { const c = cfg(); return c.provider === 'custom' ? !!c.baseUrl : !!c.key; },

    model() { const c = cfg(); return c.model || (c.provider === 'gemini' && c.autoModel) || PROVIDERS[c.provider].defaultModel; },

    // Отправить запрос. system — инструкция, prompt — текст (или массив сообщений {role, text}).
    // json: true — попросить ответ в JSON и сразу разобрать его.
    async ask(o) {
      if (AI._mock) { countUse(); const r = await AI._mock(o); return o.json ? (typeof r === 'string' ? parseJSON(r) : r) : r; }
      const c = cfg();
      if (!AI.ready()) throw new Error('Нейросеть не подключена. Открой Настройки → «Нейросеть».');
      // Для Gemini один раз подбираем свежую модель из списка (названия моделей у Google меняются)
      if (c.provider === 'gemini' && !c.model && !c.autoModel) {
        try { const list = await AI.listModels(); if (list[0]) { c.autoModel = list[0].id; Store.saveSoon(); } } catch (e) { /* возьмём модель по умолчанию */ }
      }
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
        const data = await request('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(AI.model()) + ':generateContent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': c.key },
          body: JSON.stringify(body),
        });
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
        const data = await request(base + '/chat/completions', {
          method: 'POST', headers,
          body: JSON.stringify({ model: AI.model(), messages: msgs, temperature: o.temperature == null ? 0.7 : o.temperature }),
        });
        if (data.error) throw new Error(friendlyError(data.error.code || 0, data.error.message));
        text = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';
        if (!text) throw new Error('Пустой ответ от нейросети. Попробуй ещё раз или выбери другую модель.');
      }
      countUse();
      return o.json ? parseJSON(text) : text.trim();
    },

    // Список доступных моделей для выбора в настройках.
    async listModels() {
      const c = cfg();
      if (c.provider === 'gemini') {
        if (!c.key) throw new Error('Сначала вставь ключ');
        const data = await request('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': c.key } });
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

    // Проверка подключения: короткий запрос.
    async test() {
      const r = await AI.ask({ prompt: 'Ответь одним словом по-русски: привет', temperature: 0 });
      return r;
    },
  };

  // Чем выше — тем лучше модель для наших задач (грубая эвристика для сортировки).
  function score(id) {
    let s = 0;
    const v = /(\d+(?:\.\d+)?)/.exec(id.replace(/^.*?gemini-/, ''));
    if (/gemini/.test(id) && v) s += Number(v[1]) * 10;
    if (/flash/.test(id)) s += 5;
    if (/lite/.test(id)) s -= 3;
    if (/preview|exp/.test(id)) s -= 2;
    if (id === 'openrouter/free') s += 100;
    if (/deepseek|llama-[34].*70b|qwen.*(72|235)b|gemma-[34]-(27|31)b|ultra|large|mistral-medium/.test(id)) s += 30;
    if (/super|maverick/.test(id)) s += 15;
    if (/(\b|-)(0\.5|1|1\.7|2|2\.6|3|4|7|8)b\b|mini|small|nano|tiny|lightning/.test(id)) s -= 12;
    if (/code|coder/.test(id)) s -= 20;
    return s;
  }

  // Удобная обёртка: показывает «думаю…» на кнопке и тост с ошибкой.
  AI.run = async function (btn, fn) {
    const old = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> думаю…'; }
    try { return await fn(); } catch (e) { U.toast(e.message); return null; } finally { if (btn && btn.isConnected) { btn.disabled = false; btn.innerHTML = old; } }
  };

  window.AI = AI;
})();
