// Встроенный тест на уровень английского (без нейросети).
// 20 вопросов: по 4 на уровни A1, A2, B1, B2, C1. У каждого — объяснение и ссылка на тему в «Теории».
(function () {
  'use strict';

  window.PLACEMENT = [
    // A1
    { level: 'A1', topic: 'to-be', question: 'My parents ___ teachers.', options: ['is', 'are', 'am', 'be'], answer: 1, explain: 'parents = they → are.' },
    { level: 'A1', topic: 'present-simple', question: 'She ___ in a bank.', options: ['work', 'works', 'working', 'is work'], answer: 1, explain: 'С he/she/it в Present Simple добавляем -s: works.' },
    { level: 'A1', topic: 'articles', question: 'I want to buy ___ new laptop.', options: ['an', 'a', 'the', '—'], answer: 1, explain: 'Какой-то, впервые упоминаем, перед согласным звуком → a.' },
    { level: 'A1', topic: 'there-is', question: '___ a lot of people in the park today.', options: ['There is', 'It is', 'There are', 'They are'], answer: 2, explain: 'people — множественное число → there are.' },
    // A2
    { level: 'A2', topic: 'past-simple', question: 'We ___ to the cinema last weekend.', options: ['go', 'went', 'have gone', 'goes'], answer: 1, explain: 'last weekend — конкретное прошлое → Past Simple: went.' },
    { level: 'A2', topic: 'present-continuous', question: 'Can you call back later? I ___ dinner right now.', options: ['cook', 'cooks', 'am cooking', 'cooked'], answer: 2, explain: 'right now — действие в процессе → am cooking.' },
    { level: 'A2', topic: 'comparatives', question: 'Today is ___ day of the year!', options: ['the hotter', 'hottest', 'the hottest', 'more hot'], answer: 2, explain: 'Превосходная степень: hot → the hottest.' },
    { level: 'A2', topic: 'modals-basic', question: 'It’s a holiday tomorrow, so we ___ go to university.', options: ['mustn’t', 'don’t have to', 'can’t to', 'shouldn’t to'], answer: 1, explain: '«Не обязательно» → don’t have to. mustn’t — это «нельзя».' },
    // B1
    { level: 'B1', topic: 'present-perfect', question: 'I ___ my keys. I can’t get into the flat.', options: ['lost', 'have lost', 'was losing', 'lose'], answer: 1, explain: 'Важен результат сейчас (не могу войти) → Present Perfect.' },
    { level: 'B1', topic: 'present-perfect', question: 'She ___ in this company since 2019.', options: ['works', 'worked', 'has worked', 'is working'], answer: 2, explain: 'since + «до сих пор» → has worked.' },
    { level: 'B1', topic: 'conditionals', question: 'If I ___ you, I would talk to her.', options: ['am', 'was being', 'were', 'will be'], answer: 2, explain: 'Second conditional: If I were you…' },
    { level: 'B1', topic: 'passive', question: 'This song ___ by millions of people every day.', options: ['listens to', 'is listened to', 'is listening', 'listened'], answer: 1, explain: 'Песню слушают (не она слушает) → пассив: is listened to.' },
    // B2
    { level: 'B2', topic: 'past-perfect', question: 'When we arrived at the station, the train ___.', options: ['already left', 'has already left', 'had already left', 'was already leaving'], answer: 2, explain: 'Поезд ушёл раньше, чем мы пришли → Past Perfect.' },
    { level: 'B2', topic: 'third-conditional', question: 'If you ___ me, I would have helped you.', options: ['asked', 'had asked', 'would ask', 'have asked'], answer: 1, explain: 'Третий тип: If + had + V3, would have + V3.' },
    { level: 'B2', topic: 'reported-speech', question: 'She asked me where ___.', options: ['did I live', 'I lived', 'do I live', 'lived I'], answer: 1, explain: 'В косвенном вопросе — прямой порядок слов: where I lived.' },
    { level: 'B2', topic: 'gerund-infinitive', question: 'I’m really looking forward to ___ you.', options: ['see', 'seeing', 'to see', 'saw'], answer: 1, explain: 'look forward to — здесь to предлог, после него -ing.' },
    // C1
    { level: 'C1', topic: 'third-conditional', question: 'Had I known about the problem, I ___ something.', options: ['would do', 'would have done', 'had done', 'will have done'], answer: 1, explain: 'Инверсия Had I known = If I had known → would have done.' },
    { level: 'C1', topic: 'gerund-infinitive', question: 'He denied ___ the documents.', options: ['to sign', 'signing', 'sign', 'to have sign'], answer: 1, explain: 'deny + -ing.' },
    { level: 'C1', topic: 'past-perfect', question: 'No sooner ___ home than it started to rain.', options: ['I had got', 'had I got', 'I got', 'did I got'], answer: 1, explain: 'No sooner в начале → инверсия: had I got.' },
    { level: 'C1', topic: 'third-conditional', question: 'It’s high time you ___ your own decisions.', options: ['make', 'made', 'will make', 'have made'], answer: 1, explain: 'It’s high time + Past Simple: made.' },
  ];
})();
