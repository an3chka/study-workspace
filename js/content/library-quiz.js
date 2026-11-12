// Вопросы на понимание к текстам библиотеки (встроенные, без нейросети).
(function () {
  'use strict';

  window.LIBRARY_QUIZ = {
    'lib-my-day': [
      { type: 'choice', question: 'Who lives with Masha?', options: ['Her mum', 'Her cat', 'Her friend', 'Nobody'], answer: 1, explain: '«I live in a small flat with my cat, Tofu.»' },
      { type: 'choice', question: 'Which subject doesn’t Masha like?', options: ['Maths', 'English', 'History', 'Music'], answer: 2, explain: '«…but I don’t like history.»' },
      { type: 'choice', question: 'Why does Masha miss her mum?', options: ['Her mum is ill', 'Her mum lives in another city', 'They argued', 'Her mum works a lot'], answer: 1, explain: '«She lives in another city, and I miss her.»' },
    ],
    'lib-new-city': [
      { type: 'choice', question: 'When did the author move to the new city?', options: ['Last year', 'Last month', 'Last week', 'Yesterday'], answer: 1, explain: '«Last month I moved to a new city.»' },
      { type: 'choice', question: 'Why doesn’t the author run in the park yet?', options: ['She is lazy', 'It is cold', 'She has no time', 'She has a dog'], answer: 1, explain: '«I want to run too, but it is cold.»' },
      { type: 'choice', question: 'What did Olga give the author?', options: ['A book', 'Some coffee', 'An apple pie', 'A cake'], answer: 2, explain: '«…she gave me one with apples.»' },
    ],
    'lib-weekend': [
      { type: 'choice', question: 'Whose idea was the experiment?', options: ['The author’s', 'Dima’s', 'Her mum’s', 'A teacher’s'], answer: 1, explain: '«…my friend Dima suggested an experiment».' },
      { type: 'choice', question: 'How did the author feel on Saturday morning?', options: ['Calm and happy', 'Strange, almost nervous', 'Angry', 'Bored'], answer: 1, explain: '«I felt strange, almost nervous.»' },
      { type: 'choice', question: 'What did the author find out on Sunday evening?', options: ['Someone needed her urgently', 'None of the 42 messages were urgent', 'Her phone was broken', 'Dima called many times'], answer: 1, explain: '«None of them were urgent.»' },
      { type: 'choice', question: 'Will they repeat the experiment?', options: ['No, never', 'Yes, probably next month', 'Only in summer', 'The text doesn’t say'], answer: 1, explain: '«I think we will repeat the experiment next month.»' },
    ],
    'lib-trip': [
      { type: 'choice', question: 'How long did the train journey take?', options: ['Two hours', 'One day', 'Two days', 'A week'], answer: 2, explain: '«The journey took two days».' },
      { type: 'choice', question: 'What did women sell on the platforms?', options: ['Newspapers', 'Hot potatoes and berries', 'Tea in glasses', 'Toys'], answer: 1, explain: '«…women sold hot potatoes and fresh berries».' },
      { type: 'choice', question: 'How does the author travel now?', options: ['By train', 'By car', 'By plane', 'By bus'], answer: 2, explain: '«Now I usually fly.»' },
    ],
    'lib-procrastination': [
      { type: 'choice', question: 'According to the text, procrastination is often a way of managing…', options: ['time', 'money', 'emotions', 'other people'], answer: 2, explain: '«…procrastination is often a way of managing emotions, not time.»' },
      { type: 'choice', question: 'Why do we choose watching a video instead of the essay?', options: ['Videos are educational', 'It gives quick relief', 'Essays are not important', 'We forget about deadlines'], answer: 1, explain: 'Мозг ищет быстрый способ почувствовать себя лучше.' },
      { type: 'choice', question: 'What did research show about students who forgave themselves?', options: ['They failed more often', 'They procrastinated less next time', 'They studied less', 'Nothing changed'], answer: 1, explain: '«…procrastinated less before the next one.»' },
      { type: 'choice', question: 'Which advice is NOT in the text?', options: ['Make the first step very small', 'Be kind to yourself', 'Notice the feeling behind the delay', 'Study only at night'], answer: 3, explain: 'Про учёбу ночью в тексте ничего нет — это ловушка.' },
    ],
    'lib-music': [
      { type: 'choice', question: 'Why can songs with lyrics make reading harder?', options: ['They are too loud', 'The brain processes two streams of language', 'They are boring', 'They are in a foreign language'], answer: 1, explain: '«…our brain tries to process two streams of language».' },
      { type: 'choice', question: 'Which music is suggested for focus?', options: ['Loud rock', 'Songs in your language', 'Instrumental or ambient music', 'Any music'], answer: 2, explain: 'Instrumental music, lo-fi, ambient, classical.' },
      { type: 'choice', question: 'What does the author recommend in the end?', options: ['Never use music', 'Always use music', 'Experiment and compare', 'Ask a teacher'], answer: 2, explain: '«The best way to find out what works for you is to experiment.»' },
    ],
    'lib-ai': [
      { type: 'choice', question: 'What is the main argument against letting AI write for you?', options: ['AI makes mistakes', 'You don’t build understanding yourself', 'It is expensive', 'Teachers can detect it'], answer: 1, explain: '«…the text exists, but the understanding does not.»' },
      { type: 'choice', question: 'How does the author see AI when used wisely?', options: ['As a dangerous tool', 'As a patient tutor', 'As a replacement for teachers', 'As useless'], answer: 1, explain: '«…it can be an extraordinarily patient tutor.»' },
      { type: 'choice', question: 'What is the “useful rule” at the end?', options: ['Never use AI', 'Let AI help you understand, not understand instead of you', 'Use AI only for maths', 'Always check AI with Google'], answer: 1, explain: 'Главное — кто думает.' },
    ],
    'lib-habits': [
      { type: 'choice', question: 'According to the text, habits are formed through…', options: ['intensity', 'repetition', 'motivation', 'talent'], answer: 1, explain: '«Habits are formed through repetition, not intensity».' },
      { type: 'choice', question: 'What does “attach a new habit to an existing one” mean?', options: ['Do two habits at once', 'Link it to something you already do', 'Replace an old habit', 'Write it in a diary'], answer: 1, explain: 'Пример: после кофе — 10 карточек.' },
      { type: 'choice', question: 'What does the author say about missing one day?', options: ['It ruins everything', 'It is not a failure, but don’t miss two in a row', 'You must start again', 'It is fine to miss many days'], answer: 1, explain: '«…as long as you don’t miss two in a row.»' },
    ],
  };
})();
