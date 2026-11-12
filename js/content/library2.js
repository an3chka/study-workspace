// Дополнительные тексты библиотеки с вопросами на понимание. Написаны для этого проекта.
(function () {
  'use strict';

  const texts = [
    {
      id: 'lib-coffee', level: 'A1', lang: 'en-US', title: 'At the Café', topic: 'диалог',
      body: '— Hi! What can I get you?\n— Hi. Can I have a cappuccino, please?\n— Sure. Small, medium or large?\n— Medium, please. And do you have any cakes?\n' +
        '— Yes, we have chocolate cake and carrot cake.\n— Carrot cake, please. How much is it?\n— That’s six dollars fifty. Is it to have here or to go?\n' +
        '— To have here, thanks.\n— Great. Please take a seat. I’ll bring it to your table.\n— Thank you!',
      quiz: [
        { type: 'choice', question: 'What drink does the customer order?', options: ['Tea', 'A latte', 'A cappuccino', 'Juice'], answer: 2, explain: '«Can I have a cappuccino, please?»' },
        { type: 'choice', question: 'Which cake does she choose?', options: ['Chocolate', 'Carrot', 'Cheesecake', 'None'], answer: 1, explain: '«Carrot cake, please.»' },
        { type: 'choice', question: 'Where will she eat?', options: ['At home', 'In the café', 'In the park', 'At work'], answer: 1, explain: '«To have here» = в кафе.' },
      ],
    },
    {
      id: 'lib-first-job', level: 'A2', lang: 'en-US', title: 'My First Job', topic: 'работа',
      body: 'When I was eighteen, I got my first job in a small bookshop. I worked there on Saturdays and Sundays.\n\n' +
        'At first, everything was difficult. I didn’t know where the books were, and I was afraid to talk to customers. Once, a man asked me for a book about birds, and I gave him a cookbook by mistake. We both laughed.\n\n' +
        'My manager, Irina, was very patient. She taught me how to use the cash register and how to recommend books. After a few weeks I started to enjoy it. I read a lot during quiet hours and discovered many new authors.\n\n' +
        'The salary was small, but I learned something important: it’s normal to make mistakes when you start something new.',
      quiz: [
        { type: 'choice', question: 'When did the author work?', options: ['Every day', 'On weekdays', 'At weekends', 'Only in summer'], answer: 2, explain: 'Saturdays and Sundays.' },
        { type: 'choice', question: 'What mistake did the author make?', options: ['Gave the wrong change', 'Gave a cookbook instead of a book about birds', 'Was late', 'Lost a book'], answer: 1, explain: '«…I gave him a cookbook by mistake.»' },
        { type: 'choice', question: 'What is the main lesson of the text?', options: ['Bookshops pay well', 'Mistakes are normal at the start', 'Don’t work at 18', 'Read more cookbooks'], answer: 1, explain: 'Последнее предложение.' },
      ],
    },
    {
      id: 'lib-sleep', level: 'B1', lang: 'en-US', title: 'The Student Sleep Problem', topic: 'здоровье',
      body: 'Many students treat sleep as the easiest thing to sacrifice. When there is an exam tomorrow, it seems logical to study until 3 a.m. and sleep later.\n\n' +
        'However, research suggests this strategy often backfires. During sleep, the brain organises information learned during the day and stores it in long-term memory. A tired brain also struggles to concentrate, so the hours of late-night studying are less effective than they feel.\n\n' +
        'Sleep affects mood too. After a few short nights, people tend to feel more anxious and irritable, and small problems start to look huge.\n\n' +
        'Experts usually recommend seven to nine hours for young adults, going to bed at roughly the same time every day, and avoiding bright screens just before sleep. If you have to choose between one more hour of revision and one more hour of sleep, the second option may actually give you a better grade.',
      quiz: [
        { type: 'choice', question: 'What does the brain do during sleep, according to the text?', options: ['Rests completely', 'Organises and stores information', 'Forgets unimportant things only', 'Nothing special'], answer: 1, explain: '«…the brain organises information… and stores it in long-term memory.»' },
        { type: 'choice', question: 'How do short nights affect mood?', options: ['People feel calmer', 'People feel more anxious and irritable', 'No effect', 'People become more creative'], answer: 1, explain: 'more anxious and irritable.' },
        { type: 'choice', question: 'Which recommendation is NOT mentioned?', options: ['7–9 hours of sleep', 'Regular bedtime', 'No bright screens before sleep', 'Drink warm milk'], answer: 3, explain: 'Про молоко в тексте нет — ловушка.' },
        { type: 'choice', question: 'What does “backfires” most likely mean?', options: ['Works perfectly', 'Has the opposite effect', 'Is expensive', 'Is popular'], answer: 1, explain: 'Стратегия «даёт обратный эффект».' },
      ],
    },
    {
      id: 'lib-languages', level: 'B1', lang: 'en-US', title: 'How Polyglots Learn', topic: 'изучение языков',
      body: 'People who speak five or six languages often say they are not especially talented. What they share is a set of habits.\n\n' +
        'First, they practise a little every day instead of studying for hours once a week. Ten minutes with flashcards on the bus adds up quickly.\n\n' +
        'Second, they are not afraid of sounding silly. They start speaking early, make mistakes, and learn from the corrections. Waiting until your grammar is “perfect” usually means waiting forever.\n\n' +
        'Third, they connect the language to things they already enjoy: series, music, games or cooking videos. When learning is linked to pleasure, it stops feeling like homework.\n\n' +
        'Finally, they accept plateaus — periods when progress seems to stop. These moments are normal, and they usually come right before a new jump in understanding.',
      quiz: [
        { type: 'choice', question: 'According to polyglots, what matters most?', options: ['Talent', 'Habits', 'Expensive courses', 'Living abroad'], answer: 1, explain: '«What they share is a set of habits.»' },
        { type: 'choice', question: 'Why should you start speaking early?', options: ['Grammar is not important', 'Waiting for perfect grammar means waiting forever', 'Teachers require it', 'It is faster to read'], answer: 1, explain: 'Ждать «идеальной» грамматики можно вечно.' },
        { type: 'choice', question: 'What is a “plateau” in the text?', options: ['A type of exam', 'A period when progress seems to stop', 'A high level of fluency', 'A learning app'], answer: 1, explain: 'periods when progress seems to stop.' },
      ],
    },
    {
      id: 'lib-remote', level: 'B2', lang: 'en-US', title: 'The Hidden Cost of Working From Anywhere', topic: 'работа и общество',
      body: 'Remote work was once a rare privilege; for many young professionals it is now the default. The advantages are obvious: no commute, flexible hours and the freedom to live wherever rent is cheaper.\n\n' +
        'Yet the arrangement has costs that are easy to overlook. Without informal conversations in corridors, newcomers miss out on the tacit knowledge that experienced colleagues pass on almost accidentally. A quick question that would take thirty seconds at a neighbouring desk can turn into a formal message that nobody answers for hours.\n\n' +
        'The boundary between work and rest also tends to blur. When your laptop sits on the kitchen table, it is tempting to answer “just one more email” at ten in the evening, and the working day quietly expands.\n\n' +
        'None of this means that remote work is a mistake. It does suggest, however, that it works best when people deliberately build what an office used to provide automatically: regular contact, mentoring, and a clear point at which the day ends.',
      quiz: [
        { type: 'choice', question: 'What do newcomers miss when working remotely, according to the text?', options: ['Higher salaries', 'Tacit knowledge from informal conversations', 'Cheap rent', 'Flexible hours'], answer: 1, explain: 'tacit knowledge… passed on almost accidentally.' },
        { type: 'choice', question: 'What happens to the boundary between work and rest?', options: ['It becomes clearer', 'It tends to blur', 'It disappears completely', 'It doesn’t change'], answer: 1, explain: '«…the boundary… tends to blur.»' },
        { type: 'choice', question: 'What is the author’s overall position?', options: ['Remote work is a mistake', 'Remote work is perfect', 'Remote work works best if people deliberately recreate what offices provided', 'Everyone should return to offices'], answer: 2, explain: 'Последний абзац.' },
      ],
    },
    {
      id: 'lib-attention', level: 'C1', lang: 'en-US', title: 'The Economy of Attention', topic: 'психология и технологии',
      body: 'We tend to describe our phones as tools, but tools are usually indifferent to whether we use them. The apps on our screens are not. Many of them are financed by advertising, which means that their revenue depends on a single, finite resource: our attention.\n\n' +
        'This creates an uncomfortable asymmetry. On one side is an individual trying to read a chapter before dinner; on the other, teams of engineers and psychologists optimising every notification, colour and scrolling gesture to keep that individual engaged for a few more minutes. Framed this way, a lapse in concentration looks less like a personal failing and more like a predictable outcome.\n\n' +
        'Recognising the asymmetry is not an excuse for helplessness, though. Small structural changes — turning off non-essential notifications, keeping the phone in another room while working, deciding in advance when to check messages — shift the balance surprisingly well, precisely because they do not rely on willpower in the moment.\n\n' +
        'Attention, after all, is not merely a productivity resource. What we repeatedly attend to gradually shapes what we care about, and, in the long run, who we become.',
      quiz: [
        { type: 'choice', question: 'Why are many apps “not indifferent” to how we use them?', options: ['They are badly designed', 'Their revenue depends on our attention', 'They are free', 'They collect photos'], answer: 1, explain: 'Доход от рекламы зависит от внимания.' },
        { type: 'choice', question: 'What does the “asymmetry” refer to?', options: ['Rich vs poor users', 'An individual vs teams optimising for engagement', 'Phones vs computers', 'Reading vs writing'], answer: 1, explain: 'Один человек против команд инженеров и психологов.' },
        { type: 'choice', question: 'Why do structural changes work, according to the author?', options: ['They are expensive', 'They don’t rely on willpower in the moment', 'They are recommended by apps', 'They take a long time'], answer: 1, explain: '«…because they do not rely on willpower in the moment.»' },
        { type: 'choice', question: 'What is the main idea of the last paragraph?', options: ['Attention only matters for productivity', 'What we attend to shapes who we become', 'Phones should be banned', 'Concentration is a talent'], answer: 1, explain: 'Внимание формирует то, что для нас важно, и нас самих.' },
      ],
    },
  ];

  window.LIBRARY = (window.LIBRARY || []).concat(texts.map((t) => ({ id: t.id, level: t.level, lang: t.lang, title: t.title, topic: t.topic, body: t.body })));
  window.LIBRARY_QUIZ = window.LIBRARY_QUIZ || {};
  texts.forEach((t) => { window.LIBRARY_QUIZ[t.id] = t.quiz; });
})();
