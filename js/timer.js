// Таймер задач: секундомер и Pomodoro.
// Состояние таймера хранится в Store.state.active, поэтому оно переживает
// переход между разделами и даже перезагрузку страницы.
(function () {
  'use strict';

  const listeners = new Set();
  const baseTitle = document.title;

  function S() { return Store.state; }

  function record(taskId, start, end, kind) {
    const sec = Math.round((end - start) / 1000);
    if (sec < 5) return null; // слишком короткие запуски не сохраняем
    const s = { id: U.uid(), taskId, start, end, sec, kind };
    S().sessions.push(s);
    return s;
  }

  function phaseLength(phase) {
    const st = S().settings;
    if (phase === 'work') return st.pomoWork * 60000;
    if (phase === 'long') return st.pomoLong * 60000;
    return st.pomoBreak * 60000;
  }

  const Timer = {
    onChange(fn) { listeners.add(fn); },
    emit() { listeners.forEach((fn) => fn()); },

    get active() { return S().active; },

    // Сколько секунд прошло (секундомер) или осталось (Pomodoro).
    elapsed() {
      const a = S().active;
      if (!a) return 0;
      return (Date.now() - a.start) / 1000;
    },
    remaining() {
      const a = S().active;
      if (!a || a.mode !== 'pomo') return 0;
      return Math.max(0, (a.phaseEnd - Date.now()) / 1000);
    },

    start(taskId, mode) {
      if (S().active) Timer.stop(true);
      const now = Date.now();
      const a = { taskId, mode: mode || 'watch', start: now };
      if (a.mode === 'pomo') {
        a.phase = 'work';
        a.round = 1;
        a.phaseEnd = now + phaseLength('work');
      }
      S().active = a;
      Store.save();
      Timer.emit();
      Notify.askPermission();
    },

    // Остановить и записать время.
    stop(silent) {
      const a = S().active;
      if (!a) return;
      let saved = null;
      if (a.mode === 'watch' || a.phase === 'work') {
        saved = record(a.taskId, a.start, Date.now(), a.mode);
      }
      S().active = null;
      Store.save();
      Timer.emit();
      if (!silent) {
        U.toast(saved ? 'Записано: ' + U.human(saved.sec) : 'Таймер остановлен');
      }
    },

    // Сбросить без записи.
    cancel() {
      S().active = null;
      Store.save();
      Timer.emit();
      U.toast('Таймер сброшен, время не записано');
    },

    // Пропустить текущую фазу Pomodoro (например, перерыв).
    skip() {
      const a = S().active;
      if (!a || a.mode !== 'pomo') return;
      a.phaseEnd = Date.now();
      Timer.tick();
    },

    addManual(taskId, minutes, dayTs) {
      const sec = Math.round(minutes * 60);
      if (!sec || sec < 0) return;
      // Ставим запись на 12:00 выбранного дня (или «закончилась сейчас», если это сегодня).
      let end = Date.now();
      if (U.dayKey(dayTs) !== U.dayKey(end)) end = U.startOfDay(dayTs) + 12 * 3600000 + sec * 1000;
      S().sessions.push({ id: U.uid(), taskId, start: end - sec * 1000, end, sec, kind: 'manual' });
      Store.save();
      Timer.emit();
    },

    // Вызывается раз в секунду.
    tick() {
      const a = S().active;
      if (a && a.mode === 'pomo' && Date.now() >= a.phaseEnd) {
        const st = S().settings;
        const lateMs = Date.now() - a.phaseEnd;
        const task = Store.task(a.taskId);
        if (a.phase === 'work') {
          record(a.taskId, a.start, a.phaseEnd, 'pomo');
          const long = a.round % 4 === 0;
          if (st.pomoAutoBreak && lateMs < 60000) {
            a.phase = long ? 'long' : 'break';
            a.start = a.phaseEnd;
            a.phaseEnd = a.start + phaseLength(a.phase);
            Notify.alert('Помидор готов!', (task ? task.name + ': ' : '') + 'время отдохнуть ' + (long ? st.pomoLong : st.pomoBreak) + ' мин');
          } else {
            S().active = null;
            Notify.alert('Помидор готов!', 'Время записано. Можно отдохнуть.');
          }
        } else {
          // Перерыв закончился — ждём, пока пользователь сам начнёт следующий помидор.
          a.phase = 'work';
          a.round += 1;
          a.start = Date.now();
          a.phaseEnd = a.start + phaseLength('work');
          a.waiting = true;
          Notify.alert('Перерыв окончен', 'Нажми «Продолжить», чтобы начать следующий помидор');
        }
        Store.save();
        Timer.emit();
      }
      // Если ждём продолжения — время не идёт.
      if (a && a.waiting) {
        a.start = Date.now();
        a.phaseEnd = a.start + phaseLength('work');
      }
      Timer.updateTitle();
      listeners.forEach((fn) => fn('tick'));
    },

    resume() {
      const a = S().active;
      if (!a) return;
      a.waiting = false;
      a.start = Date.now();
      a.phaseEnd = a.start + phaseLength('work');
      Store.save();
      Timer.emit();
    },

    // Текст для отображения: «12:34» и подпись.
    display() {
      const a = S().active;
      if (!a) return null;
      const task = Store.task(a.taskId);
      const name = task ? task.name : 'Задача';
      if (a.mode === 'pomo') {
        const label = a.waiting ? 'ждёт продолжения' : a.phase === 'work' ? 'помидор ' + a.round : a.phase === 'long' ? 'длинный перерыв' : 'перерыв';
        return { time: U.clock(Timer.remaining()), name, label, phase: a.phase, waiting: !!a.waiting };
      }
      return { time: U.clock(Timer.elapsed()), name, label: 'идёт', phase: 'work' };
    },

    updateTitle() {
      const d = Timer.display();
      document.title = d ? d.time + (d.phase === 'work' ? '' : ' перерыв') + ' · ' + d.name : baseTitle;
    },
  };

  // Уведомления и короткий сигнал по окончании фазы.
  const Notify = {
    askPermission() {
      if ('Notification' in window && Notification.permission === 'default') {
        try { Notification.requestPermission(); } catch (e) { /* ignore */ }
      }
    },
    alert(title, body) {
      if (window.Sound) Sound.chime(S().settings.chimeSound);
      U.toast(title + ' ' + body);
      if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
        try { new Notification(title, { body, icon: 'icons/icon-192.png' }); } catch (e) { /* ignore */ }
      }
    },
  };

  setInterval(Timer.tick, 1000);

  window.Timer = Timer;
})();
