// Фоновые звуки. Все звуки генерируются прямо в браузере через Web Audio API —
// никаких скачанных файлов, поэтому и лицензии не нужны.
//
// Как это устроено: каждый звук один раз «рендерится» в аудиобуфер
// (OfflineAudioContext), а потом проигрывается по кругу (loop = true).
// Зацикливание делает сам браузер, без таймеров, поэтому звук не обрывается
// ни при переходе между разделами, ни в фоновой вкладке.
(function () {
  'use strict';

  let ctx = null;
  let master = null;
  let analyser = null;
  const buffers = {};   // id → AudioBuffer (готовые петли)
  const rendering = {}; // id → Promise
  const playing = {};   // id → {src, gain}
  const listeners = new Set();
  const SR = 44100;

  function emit() { listeners.forEach((fn) => fn()); }

  // Детерминированный генератор случайных чисел (чтобы мелодия была одинаковой).
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = Store.state.sound.master;
      master.connect(ctx.destination);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      master.connect(analyser);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // ---------- Генерация шума ----------

  function fillNoise(data, type, rand) {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
    for (let i = 0; i < data.length; i++) {
      const w = rand() * 2 - 1;
      if (type === 'white') {
        data[i] = w * 0.5;
      } else if (type === 'pink') {
        // Фильтр Пола Келлета
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.96900 * b2 + w * 0.1538520; b3 = 0.86650 * b3 + w * 0.3104856;
        b4 = 0.55000 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      } else { // brown
        last = (last + 0.02 * w) / 1.02;
        data[i] = last * 3.5;
      }
    }
  }

  // Буфер шума длиной sec, со сглаженным стыком (чтобы не было щелчка на повторе).
  function noiseBuffer(c, sec, type, seed) {
    const len = Math.floor(sec * c.sampleRate);
    const fade = Math.floor(0.5 * c.sampleRate);
    const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const raw = new Float32Array(len + fade);
      fillNoise(raw, type, rng(seed + ch * 101));
      const out = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) out[i] = raw[i];
      for (let i = 0; i < fade; i++) {
        const k = i / fade;
        out[i] = raw[i] * Math.sqrt(k) + raw[len + i] * Math.sqrt(1 - k);
      }
    }
    return buf;
  }

  // Рендерит сцену длиной sec (+ хвост), хвост накладывается на начало — получается бесшовная петля.
  function renderLoop(sec, tailSec, build) {
    const len = Math.floor(sec * SR);
    const tail = Math.floor(tailSec * SR);
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const oc = new OAC(2, len + tail, SR);
    build(oc, sec);
    return oc.startRendering().then((rendered) => {
      // AudioBuffer можно создать без AudioContext — поэтому звук можно готовить заранее.
      const out = new AudioBuffer({ numberOfChannels: 2, length: len, sampleRate: SR });
      for (let ch = 0; ch < 2; ch++) {
        const src = rendered.getChannelData(ch);
        const dst = out.getChannelData(ch);
        for (let i = 0; i < len; i++) dst[i] = src[i];
        for (let i = 0; i < tail; i++) dst[i] += src[len + i];
      }
      return out;
    });
  }

  // ---------- Lo-fi ----------

  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  function buildLofi(oc, total) {
    const rand = rng(7);
    const bpm = 72;
    const beat = 60 / bpm;
    const bar = beat * 4;
    const bars = Math.round(total / bar);

    // «Тёплый» общий фильтр, как у старой кассеты
    const tape = oc.createBiquadFilter();
    tape.type = 'lowpass'; tape.frequency.value = 4200; tape.Q.value = 0.4;
    const bus = oc.createGain(); bus.gain.value = 0.9;
    tape.connect(bus); bus.connect(oc.destination);

    // Лёгкое «плавание» высоты тона (wow)
    const wow = oc.createOscillator();
    wow.frequency.value = 27 / total;
    const wowDepth = oc.createGain(); wowDepth.gain.value = 7;
    wow.connect(wowDepth); wow.start(0);

    // Эхо для мелодии
    const delay = oc.createDelay(2); delay.delayTime.value = beat * 0.75;
    const fb = oc.createGain(); fb.gain.value = 0.35;
    const wet = oc.createGain(); wet.gain.value = 0.4;
    delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(tape);

    const noise = noiseBuffer(oc, 1, 'white', 3);

    const chords = [
      { bass: 41, notes: [53, 57, 60, 64, 67] }, // Fmaj9
      { bass: 40, notes: [52, 55, 59, 62] },     // Em7
      { bass: 38, notes: [50, 53, 57, 60, 64] }, // Dm9
      { bass: 36, notes: [48, 52, 55, 59, 62] }, // Cmaj9
    ];
    const scale = [72, 74, 76, 79, 81, 84];

    function keys(t, notes, dur, vel) {
      const lp = oc.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 1600;
      lp.connect(tape);
      notes.forEach((n, i) => {
        const st = t + i * 0.018 + rand() * 0.01; // лёгкое «арпеджио» как от руки
        ['sine', 'triangle'].forEach((type, k) => {
          const o = oc.createOscillator();
          o.type = type;
          o.frequency.value = midi(n);
          o.detune.value = k ? 4 : -3;
          wowDepth.connect(o.detune);
          const g = oc.createGain();
          const peak = vel * (k ? 0.025 : 0.05);
          g.gain.setValueAtTime(0, st);
          g.gain.linearRampToValueAtTime(peak, st + 0.015);
          g.gain.exponentialRampToValueAtTime(peak * 0.35, st + 0.9);
          g.gain.setValueAtTime(peak * 0.35, st + dur);
          g.gain.exponentialRampToValueAtTime(0.0001, st + dur + 0.6);
          o.connect(g); g.connect(lp);
          o.start(st); o.stop(st + dur + 0.7);
        });
      });
    }

    function bass(t, n, dur) {
      const o = oc.createOscillator();
      o.type = 'sine'; o.frequency.value = midi(n);
      const g = oc.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.32, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.12, t + dur);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.15);
      o.connect(g); g.connect(tape);
      o.start(t); o.stop(t + dur + 0.2);
    }

    function lead(t, n, dur) {
      const o = oc.createOscillator();
      o.type = 'triangle'; o.frequency.value = midi(n);
      wowDepth.connect(o.detune);
      const g = oc.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.045, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      const lp = oc.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
      o.connect(lp); lp.connect(g); g.connect(tape); g.connect(delay);
      o.start(t); o.stop(t + dur + 0.05);
    }

    function kick(t, v) {
      const o = oc.createOscillator();
      o.frequency.setValueAtTime(110, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
      const g = oc.createGain();
      g.gain.setValueAtTime(0.85 * v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
      o.connect(g); g.connect(tape);
      o.start(t); o.stop(t + 0.45);
    }

    function hit(t, freq, type, q, dur, v) {
      const s = oc.createBufferSource();
      s.buffer = noise;
      const f = oc.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = oc.createGain();
      g.gain.setValueAtTime(v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(tape);
      s.start(t, rand() * 0.5, dur + 0.02);
    }

    for (let b = 0; b < bars; b++) {
      const t0 = b * bar;
      const ch = chords[b % chords.length];
      const v = 0.85 + rand() * 0.25;
      keys(t0, ch.notes, beat * 2.3, v);
      keys(t0 + beat * 2.5, ch.notes.slice(1), beat * 1.3, v * 0.8);
      bass(t0, ch.bass, beat * 1.6);
      bass(t0 + beat * 2.5, ch.bass + (b % 2 ? 7 : 0), beat * 1.1);

      // Барабаны со «свингом»
      kick(t0, 1);
      kick(t0 + beat * 2.5, 0.8);
      if (b % 4 === 3) kick(t0 + beat * 3.6, 0.55);
      hit(t0 + beat, 1800, 'bandpass', 0.7, 0.2, 0.55);
      hit(t0 + beat * 3, 1800, 'bandpass', 0.7, 0.2, 0.55);
      for (let i = 0; i < 8; i++) {
        const tt = t0 + Math.floor(i / 2) * beat + (i % 2 ? 0.6 * beat : 0);
        hit(tt, 7500, 'highpass', 0.5, 0.045, 0.1 + rand() * 0.06);
      }

      // Мелодия появляется не сразу и не везде
      if (b >= 4) {
        for (let i = 0; i < 8; i++) {
          if (rand() < 0.28) {
            const n = scale[Math.floor(rand() * scale.length)];
            lead(t0 + i * beat * 0.5 + (i % 2 ? 0.05 * beat : 0), n, beat * (0.6 + rand() * 0.8));
          }
        }
      }
    }

    // Треск винила
    const len = Math.floor(total * oc.sampleRate);
    const crackle = oc.createBuffer(1, len, oc.sampleRate);
    const cd = crackle.getChannelData(0);
    for (let i = 0; i < len; i++) {
      if (rand() < 7 / oc.sampleRate) cd[i] = (rand() * 2 - 1) * (0.3 + rand() * 0.7);
    }
    const cs = oc.createBufferSource(); cs.buffer = crackle;
    const chp = oc.createBiquadFilter(); chp.type = 'highpass'; chp.frequency.value = 1200;
    const cg = oc.createGain(); cg.gain.value = 0.25;
    cs.connect(chp); chp.connect(cg); cg.connect(oc.destination);
    cs.start(0);

    const hiss = oc.createBufferSource(); hiss.buffer = noiseBuffer(oc, total, 'pink', 11);
    const hg = oc.createGain(); hg.gain.value = 0.012;
    hiss.connect(hg); hg.connect(oc.destination); hiss.start(0);
  }

  // ---------- Дождь ----------

  function buildRain(oc, total) {
    const rand = rng(21);
    const base = oc.createBufferSource(); base.buffer = noiseBuffer(oc, total, 'pink', 5);
    const hp = oc.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500;
    const lp = oc.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000;
    const g = oc.createGain(); g.gain.value = 0.7;
    // Медленные «порывы»: громкость плавно гуляет
    const lfo = oc.createOscillator(); lfo.frequency.value = 3 / total;
    const lfoG = oc.createGain(); lfoG.gain.value = 0.18;
    lfo.connect(lfoG); lfoG.connect(g.gain); lfo.start(0);
    base.connect(hp); hp.connect(lp); lp.connect(g); g.connect(oc.destination);
    base.start(0);

    // Низкий гул (капли по крыше вдалеке)
    const rumble = oc.createBufferSource(); rumble.buffer = noiseBuffer(oc, total, 'brown', 8);
    const rl = oc.createBiquadFilter(); rl.type = 'lowpass'; rl.frequency.value = 350;
    const rg = oc.createGain(); rg.gain.value = 0.35;
    rumble.connect(rl); rl.connect(rg); rg.connect(oc.destination); rumble.start(0);

    // Отдельные капли
    const n = oc.createBuffer(1, oc.sampleRate * 0.2, oc.sampleRate);
    fillNoise(n.getChannelData(0), 'white', rand);
    const drops = Math.floor(total * 14);
    for (let i = 0; i < drops; i++) {
      const t = rand() * total;
      const s = oc.createBufferSource(); s.buffer = n;
      const f = oc.createBiquadFilter(); f.type = 'bandpass';
      f.frequency.value = 1800 + rand() * 4500; f.Q.value = 3 + rand() * 6;
      const dg = oc.createGain();
      const v = 0.08 + rand() * 0.25;
      const d = 0.02 + rand() * 0.05;
      dg.gain.setValueAtTime(v, t);
      dg.gain.exponentialRampToValueAtTime(0.0001, t + d);
      const p = oc.createStereoPanner ? oc.createStereoPanner() : null;
      s.connect(f); f.connect(dg);
      if (p) { p.pan.value = rand() * 1.6 - 0.8; dg.connect(p); p.connect(oc.destination); } else dg.connect(oc.destination);
      s.start(t, 0, d + 0.02);
    }
  }

  // ---------- Океан ----------

  function buildOcean(oc, total) {
    const src = oc.createBufferSource(); src.buffer = noiseBuffer(oc, total, 'pink', 31);
    const lp = oc.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.5;
    const g = oc.createGain();
    src.connect(lp); lp.connect(g); g.connect(oc.destination);
    // Волны: каждые ~8 секунд накат и откат
    const waves = Math.round(total / 8);
    const w = total / waves;
    lp.frequency.setValueAtTime(300, 0);
    g.gain.setValueAtTime(0.15, 0);
    for (let i = 0; i < waves + 1; i++) {
      const t = i * w;
      lp.frequency.linearRampToValueAtTime(1600, t + w * 0.45);
      lp.frequency.linearRampToValueAtTime(300, t + w);
      g.gain.linearRampToValueAtTime(0.9, t + w * 0.45);
      g.gain.linearRampToValueAtTime(0.15, t + w);
    }
    src.start(0);
  }

  // «Фабрика» буферов без AudioContext (для шумов, которые генерируются сразу).
  const bufFactory = {
    sampleRate: SR,
    createBuffer: (ch, len, sr) => new AudioBuffer({ numberOfChannels: ch, length: len, sampleRate: sr }),
  };

  // ---------- Список звуков ----------

  const TRACKS = [
    { id: 'lofi', name: 'Lo-fi', icon: 'headphones', desc: 'спокойный бит с пианино', make: () => renderLoop(53.333, 1.5, buildLofi) },
    { id: 'rain', name: 'Дождь', icon: 'rain', desc: 'капли и шум дождя', make: () => renderLoop(24, 0, buildRain) },
    { id: 'ocean', name: 'Океан', icon: 'waves', desc: 'медленные волны', make: () => renderLoop(32, 0, buildOcean) },
    { id: 'white', name: 'Белый шум', icon: 'noise', desc: 'ровный шипящий шум', make: () => Promise.resolve(noiseBuffer(bufFactory, 10, 'white', 1)) },
    { id: 'pink', name: 'Розовый шум', icon: 'noise', desc: 'мягче белого', make: () => Promise.resolve(noiseBuffer(bufFactory, 10, 'pink', 2)) },
    { id: 'brown', name: 'Коричневый шум', icon: 'noise', desc: 'низкий, как гул поезда', make: () => Promise.resolve(noiseBuffer(bufFactory, 10, 'brown', 4)) },
  ];

  const DEFAULT_LEVEL = { lofi: 0.8, rain: 0.6, ocean: 0.6, white: 0.25, pink: 0.35, brown: 0.5 };

  function level(id) {
    const l = Store.state.sound.levels[id];
    return typeof l === 'number' ? l : DEFAULT_LEVEL[id];
  }

  function getBuffer(id) {
    if (buffers[id]) return Promise.resolve(buffers[id]);
    if (!rendering[id]) {
      const tr = TRACKS.find((t) => t.id === id);
      rendering[id] = tr.make().then((b) => { buffers[id] = b; delete rendering[id]; return b; });
      emit();
    }
    return rendering[id];
  }

  const Sound = {
    tracks: TRACKS,
    onChange(fn) { listeners.add(fn); },

    isPlaying(id) { return !!playing[id]; },
    isLoading(id) { return !!rendering[id]; },
    anyPlaying() { return Object.keys(playing).length > 0; },
    level,
    get master() { return Store.state.sound.master; },

    play(id) {
      ensureCtx();
      if (playing[id]) return Promise.resolve();
      playing[id] = { pending: true };
      emit();
      return getBuffer(id).then((buf) => {
        if (!playing[id] || !playing[id].pending) return; // успели выключить
        const src = ctx.createBufferSource();
        src.buffer = buf; src.loop = true;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(level(id), ctx.currentTime + 1.2);
        src.connect(gain); gain.connect(master);
        src.start();
        playing[id] = { src, gain };
        Sound.updateMediaSession();
        emit();
      }).catch((e) => {
        delete playing[id];
        U.toast('Не удалось запустить звук: ' + e.message);
        emit();
      });
    },

    stop(id) {
      const p = playing[id];
      if (!p) return;
      delete playing[id];
      if (p.src) {
        const now = ctx.currentTime;
        p.gain.gain.cancelScheduledValues(now);
        p.gain.gain.setValueAtTime(p.gain.gain.value, now);
        p.gain.gain.linearRampToValueAtTime(0, now + 0.6);
        p.src.stop(now + 0.65);
      }
      Sound.updateMediaSession();
      emit();
    },

    toggle(id) { return Sound.isPlaying(id) ? Sound.stop(id) : Sound.play(id); },

    stopAll() { Object.keys(playing).forEach(Sound.stop); },

    // Последний набор звуков, чтобы кнопка «▶» в плеере знала, что включать.
    resumeLast() {
      const last = Store.state.sound.last && Store.state.sound.last.length ? Store.state.sound.last : ['lofi'];
      last.forEach((id) => Sound.play(id));
    },

    rememberCurrent() {
      const ids = Object.keys(playing);
      if (ids.length) { Store.state.sound.last = ids; Store.saveSoon(); }
    },

    setLevel(id, v) {
      Store.state.sound.levels[id] = v;
      const p = playing[id];
      if (p && p.gain) p.gain.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
      Store.saveSoon();
    },

    setMaster(v) {
      Store.state.sound.master = v;
      if (master) master.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
      Store.saveSoon();
      emit();
    },

    // Заранее подготовить звуки (без воспроизведения), чтобы потом включались мгновенно.
    prepare(ids) {
      ids.forEach((id) => { if (TRACKS.some((t) => t.id === id)) getBuffer(id).catch(() => {}); });
    },

    // Для проверки: состояние и громкость сигнала на выходе.
    debug() {
      if (!ctx) return { state: 'none' };
      const data = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
      return { state: ctx.state, time: Math.round(ctx.currentTime * 10) / 10, rms: Math.round(Math.sqrt(sum / data.length) * 1000) / 1000 };
    },

    // Сигнал в конце помидора. kind — один из Sound.chimes.
    chime(kind) {
      kind = kind || Store.state.settings.chimeSound || 'marimba';
      if (kind === 'none') return;
      try {
        const c = ensureCtx();
        const t = c.currentTime + 0.05;
        const out = c.createGain();
        out.gain.value = 0.9;
        out.connect(c.destination);
        const tone = (freq, start, dur, peak, type, attack) => {
          const o = c.createOscillator(); o.type = type || 'sine'; o.frequency.value = freq;
          const g = c.createGain();
          g.gain.setValueAtTime(0, start);
          g.gain.linearRampToValueAtTime(peak, start + (attack || 0.008));
          g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
          o.connect(g); g.connect(out);
          o.start(start); o.stop(start + dur + 0.05);
          return o;
        };
        if (kind === 'bell') {
          [[76, 0], [83, 0.18], [88, 0.36]].forEach(([n, d]) => tone(midi(n), t + d, 1.4, 0.25));
        } else if (kind === 'marimba') {
          // Мягкая «маримба»: основной тон + короткий обертон
          [[72, 0], [76, 0.13], [79, 0.26], [84, 0.42]].forEach(([n, d]) => {
            tone(midi(n), t + d, 0.9, 0.3);
            tone(midi(n) * 4, t + d, 0.12, 0.06);
          });
        } else if (kind === 'gong') {
          // Тихий гонг: низкий тон с «неровными» обертонами, долго затухает
          [[1, 0.3], [2.76, 0.12], [5.4, 0.05], [8.93, 0.025]].forEach(([k, v]) => tone(110 * k, t, 4.5 / Math.sqrt(k), v, 'sine', 0.04));
        } else if (kind === 'wood') {
          // Три деревянных «тук»
          [0, 0.2, 0.4].forEach((d, i) => {
            tone(i === 2 ? 1250 : 950, t + d, 0.09, 0.4, 'triangle', 0.002);
            tone(i === 2 ? 2500 : 1900, t + d, 0.04, 0.12, 'sine', 0.002);
          });
        } else if (kind === 'birds') {
          // Пара птичьих «чирик»
          [0, 0.16, 0.5, 0.62, 0.74].forEach((d, i) => {
            const o = tone(2600, t + d, 0.11, 0.12, 'sine', 0.01);
            o.frequency.setValueAtTime(2400 + (i % 2) * 300, t + d);
            o.frequency.exponentialRampToValueAtTime(4200 - (i % 3) * 300, t + d + 0.07);
          });
        }
      } catch (e) { /* ignore */ }
    },

    chimes: [
      ['marimba', 'Маримба'], ['bell', 'Колокольчик'], ['gong', 'Тихий гонг'],
      ['wood', 'Деревянный «тук-тук»'], ['birds', 'Птички'], ['none', 'Без звука'],
    ],

    // Подпись в системном плеере (на телефоне / в шторке уведомлений, где поддерживается).
    updateMediaSession() {
      if (!('mediaSession' in navigator)) return;
      const names = TRACKS.filter((t) => playing[t.id]).map((t) => t.name);
      try {
        navigator.mediaSession.metadata = names.length
          ? new MediaMetadata({ title: names.join(' + '), artist: 'Рабочий кабинет' })
          : null;
      } catch (e) { /* ignore */ }
    },
  };

  window.Sound = Sound;
})();
