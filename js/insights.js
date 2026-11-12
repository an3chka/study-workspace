// «Помощник»: смотрит на твои данные и пишет короткие выводы и советы.
// Работает по простым правилам (без нейросети) — всё считается прямо в браузере.
(function () {
  'use strict';

  const App = window.App = window.App || {};

  function S() { return Store.state; }
  const pct = (a, b) => (b ? Math.round((a - b) / b * 100) : null);

  function sumRange(from, to) { return Stats.sum(Stats.inRange(from, to)); }

  // Советы на сегодня.
  App.insightsToday = function () {
    const out = [];
    const now = Date.now();
    const hour = new Date().getHours();
    const today = U.startOfDay(now);
    const key = U.dayKey(now);
    const goal = Stats.goalSec();
    const total = sumRange(today, U.addDays(today, 1));
    const a = S().active;

    if (a && !a.waiting && a.mode === 'watch' && now - a.start > 90 * 60000) {
      out.push({ icon: 'activity', tone: 'warn', text: 'Ты работаешь без перерыва уже ' + U.human((now - a.start) / 1000) + '. Сделай «Паузу для тела» — 2 минуты.', href: '#/mind' });
    }
    if (goal) {
      if (total >= goal) out.push({ icon: 'target', tone: 'good', text: 'Дневная цель выполнена — ' + U.human(total) + '. Отличная работа!' });
      else if (hour >= 17 && total < goal * 0.5) out.push({ icon: 'clock', tone: 'info', text: 'До цели ' + U.human(goal - total) + '. Один-два помидора — и день засчитан.' });
    }

    const plan = App.planSummary ? App.planSummary(key) : null;
    if (plan && plan.total) {
      const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
      const missed = plan.list.filter((b) => !b.done && toMin(b.end) <= nowMin).length;
      if (plan.done === plan.total) out.push({ icon: 'check-circle', tone: 'good', text: 'Весь план на сегодня выполнен (' + plan.total + ' ' + U.plural(plan.total, ['блок', 'блока', 'блоков']) + ').' });
      else if (missed) out.push({ icon: 'calendar', tone: 'warn', text: 'Есть ' + missed + ' ' + U.plural(missed, ['пропущенный блок', 'пропущенных блока', 'пропущенных блоков']) + ' в плане. Отметь сделанное или перенеси на завтра — это нормально.', href: '#/plan' });
      else out.push({ icon: 'calendar', tone: 'info', text: 'План: сделано ' + plan.done + ' из ' + plan.total + '.', href: '#/plan' });
    } else if (hour < 14) {
      out.push({ icon: 'pen', tone: 'info', text: 'Составь план на день — с ним проще начать и не забыть важное.', href: '#/plan' });
    }

    const moodToday = S().mood.filter((m) => m.day === key);
    const last = moodToday[moodToday.length - 1];
    if (last && last.stress >= 4) out.push({ icon: 'wind', tone: 'warn', text: 'Стресс сегодня высокий. Попробуй «Спокойное дыхание» — 1 минута.', href: '#/mind' });
    const why = S().why || [];
    if (why.length && last && (last.stress >= 4 || last.mood <= 2)) {
      out.unshift({ icon: 'heart', tone: 'info', text: 'Помнишь, зачем ты это делаешь? «' + why[Math.floor(Math.random() * why.length)].text + '». Ты справляешься.', href: '#/mind' });
    }
    else if (!moodToday.length && hour >= 12) out.push({ icon: 'heart', tone: 'info', text: 'Как ты сегодня? Отметь самочувствие — это 10 секунд.', href: '#/mind' });

    const due = S().decks.reduce((n, d) => n + d.cards.filter((c) => (c.reps || c.lapses || c.seenAt) && c.due <= now).length, 0);
    if (due) out.push({ icon: 'cards', tone: 'info', text: due + ' ' + U.plural(due, ['карточка ждёт', 'карточки ждут', 'карточек ждут']) + ' повторения.', href: '#/cards' });

    const st = Stats.streak();
    if (st.current >= 3 && !st.todayDone) out.push({ icon: 'flame', tone: 'info', text: 'Серия ' + st.current + ' ' + U.plural(st.current, ['день', 'дня', 'дней']) + ' — не дай ей прерваться сегодня!' });

    return out;
  };

  // Обзор последних 7 дней.
  App.insightsWeek = function () {
    const out = [];
    const today = U.startOfDay(Date.now());
    const from = U.addDays(today, -6), to = U.addDays(today, 1);
    const prevFrom = U.addDays(from, -7);
    const list = Stats.inRange(from, to);
    const total = Stats.sum(list);
    const prev = sumRange(prevFrom, from);
    const goal = Stats.goalSec();

    if (!total && !prev) return [{ icon: 'sparkles', tone: 'info', text: 'Пока мало данных. Позанимайся пару дней с таймером — и здесь появится разбор недели.' }];

    const ch = pct(total, prev);
    out.push({ icon: ch === null || ch >= 0 ? 'trend-up' : 'trend-down', tone: ch === null || ch >= 0 ? 'good' : 'info',
      text: 'За 7 дней: ' + U.human(total) + (ch === null ? '.' : ' — это ' + (ch >= 0 ? 'на ' + ch + '% больше' : 'на ' + Math.abs(ch) + '% меньше') + ', чем неделей раньше.') });

    const byDay = Stats.byDay(list);
    const active = Object.keys(byDay).filter((k) => byDay[k] >= 60).length;
    const goalDays = goal ? Object.keys(byDay).filter((k) => byDay[k] >= goal).length : 0;
    if (goal) out.push({ icon: 'target', tone: goalDays >= 5 ? 'good' : 'info', text: 'Цель выполнена в ' + goalDays + ' из 7 дней, занималась ' + active + ' ' + U.plural(active, ['день', 'дня', 'дней']) + '.' + (goalDays <= 2 && active >= 4 ? ' Может, цель слишком большая? Её можно уменьшить в настройках.' : '') });

    const cats = Stats.byCategory(list);
    if (cats.length) {
      const top = cats[0];
      out.push({ icon: 'trophy', tone: 'info', text: 'Больше всего времени — «' + top.name + '»: ' + Math.round(top.sec / total * 100) + '% недели.' });
    }
    // Забытые категории: были раньше, но не на этой неделе
    const older = Stats.byCategory(Stats.inRange(U.addDays(from, -21), from));
    const now = new Set(cats.map((c) => c.id));
    older.filter((c) => !now.has(c.id) && c.sec >= 1800).slice(0, 2).forEach((c) => {
      out.push({ icon: 'alert', tone: 'warn', text: 'На этой неделе не было «' + c.name + '», хотя раньше ты на это тратила ' + U.human(c.sec) + ' за 3 недели. Запланируй хотя бы 20 минут?', href: '#/plan' });
    });

    // Лучшее время дня
    const parts = { 'утром': 0, 'днём': 0, 'вечером': 0, 'ночью': 0 };
    list.forEach((s) => { const h = new Date(s.start).getHours(); parts[h < 5 ? 'ночью' : h < 12 ? 'утром' : h < 18 ? 'днём' : h < 23 ? 'вечером' : 'ночью'] += s.sec; });
    const best = Object.keys(parts).sort((a, b) => parts[b] - parts[a])[0];
    if (total >= 3600 && parts[best] / total >= 0.5) out.push({ icon: 'clock', tone: 'info', text: 'Чаще всего ты занимаешься ' + best + ' (' + Math.round(parts[best] / total * 100) + '%). Ставь важное в плане на это время.' });

    // План
    let planned = 0, planDone = 0;
    for (let d = from; d < to; d = U.addDays(d, 1)) {
      const p = App.planSummary(U.dayKey(d));
      planned += p.total; planDone += p.done;
    }
    if (planned) out.push({ icon: 'calendar', tone: planDone / planned >= 0.7 ? 'good' : 'info', text: 'План выполнен на ' + Math.round(planDone / planned * 100) + '% (' + planDone + ' из ' + planned + ' блоков).' + (planDone / planned < 0.5 ? ' Попробуй планировать меньше — лучше сделать 3 из 3, чем 5 из 10.' : '') });

    // Хобби без движения
    S().hobbies.filter((h) => !h.done).forEach((h) => {
      const times = h.log.map((l) => l.ts).concat((h.steps || []).filter((s) => s.doneAt).map((s) => s.doneAt)).concat([h.created || 0]);
      const days = Math.floor((Date.now() - Math.max(...times)) / 86400000);
      if (days >= 10) out.push({ icon: 'palette', tone: 'warn', text: 'Цель «' + h.name + '» без движения ' + days + ' ' + U.plural(days, ['день', 'дня', 'дней']) + '. Маленький шаг тоже считается!', href: '#/hobby' });
    });

    // Самочувствие
    const moodWeek = S().mood.filter((m) => m.ts >= from);
    const moodPrev = S().mood.filter((m) => m.ts >= prevFrom && m.ts < from);
    const avg = (l, f) => l.reduce((a, m) => a + m[f], 0) / l.length;
    if (moodWeek.length >= 3) {
      const a = avg(moodWeek, 'mood');
      const st = avg(moodWeek, 'stress');
      let t = 'Среднее настроение за неделю: ' + a.toFixed(1) + ' из 5';
      if (moodPrev.length >= 3) { const d = a - avg(moodPrev, 'mood'); if (Math.abs(d) >= 0.3) t += d > 0 ? ' — лучше, чем неделей раньше' : ' — ниже, чем неделей раньше'; }
      out.push({ icon: 'heart', tone: a >= 3.5 ? 'good' : 'info', text: t + '.', href: '#/mind' });
      if (st >= 3.7) out.push({ icon: 'wind', tone: 'warn', text: 'Стресс всю неделю высокий (' + st.toFixed(1) + '). Запланируй отдых так же серьёзно, как учёбу.', href: '#/mind' });
      // Связь учёбы и настроения
      if (goal) {
        const md = {};
        S().mood.forEach((m) => { (md[m.day] = md[m.day] || []).push(m.mood); });
        const allByDay = Stats.byDay();
        const yes = [], no = [];
        Object.keys(md).forEach((k) => { const v = md[k].reduce((x, y) => x + y, 0) / md[k].length; ((allByDay[k] || 0) >= goal ? yes : no).push(v); });
        if (yes.length >= 3 && no.length >= 3) {
          const d = yes.reduce((x, y) => x + y, 0) / yes.length - no.reduce((x, y) => x + y, 0) / no.length;
          if (d >= 0.4) out.push({ icon: 'lightbulb', tone: 'good', text: 'В дни, когда ты выполняешь цель, настроение в среднем выше на ' + d.toFixed(1) + '. Работа на тебя работает!' });
        }
      }
      const mi = App.moodInsights ? App.moodInsights()[0] : null;
      if (mi) out.push({ icon: 'search', tone: 'info', text: 'В дни с «' + mi.tag + '» настроение ' + (mi.diff > 0 ? 'выше' : 'ниже') + ' на ' + Math.abs(mi.diff) + '.', href: '#/mind' });
    } else {
      out.push({ icon: 'heart', tone: 'info', text: 'Отмечай самочувствие — тогда помощник покажет, как учёба и сон влияют на настроение.', href: '#/mind' });
    }

    const practice = S().practice.filter((p) => p.ts >= from).length;
    if (practice) out.push({ icon: 'activity', tone: 'good', text: 'Упражнений для себя за неделю: ' + practice + '. Забота о себе — тоже продуктивность.' });

    return out;
  };

  function toMin(hhmm) { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + (m || 0); }

  App.renderInsights = function (items, limit) {
    if (!items.length) return '<p class="empty">Пока всё спокойно</p>';
    return '<ul class="insights">' + items.slice(0, limit || 99).map((i) =>
      '<li class="ins ' + i.tone + '"><span class="ins-icon">' + I(i.icon) + '</span><span>' + U.esc(i.text) + '</span>' +
      (i.href ? '<a class="ins-go" href="' + i.href + '" aria-label="Перейти">' + I('chevron-right') + '</a>' : '') + '</li>').join('') + '</ul>';
  };
})();
