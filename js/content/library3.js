// Ещё тексты библиотеки с вопросами на понимание. Написаны для этого проекта.
(function () {
  'use strict';

  const texts = [
    {
      id: 'lib-family', level: 'A1', title: 'My Family', topic: 'семья',
      body: 'I have a small family. There are four of us: my mum, my dad, my younger brother and me.\n\n' +
        'My mum is a doctor. She works in a big hospital and she is always busy. My dad is an engineer. He likes cooking, and on Sundays he makes pancakes for everyone.\n\n' +
        'My brother is twelve. He loves football and computer games. Sometimes he is noisy, but he is funny and kind.\n\n' +
        'We don’t live together now because I study in another city. But we talk on video every Sunday evening. I love my family very much.',
      quiz: [
        { type: 'choice', question: 'What is the mother’s job?', options: ['Engineer', 'Teacher', 'Doctor', 'Cook'], answer: 2, explain: '«My mum is a doctor.»' },
        { type: 'choice', question: 'What does the dad make on Sundays?', options: ['Soup', 'Pancakes', 'Pizza', 'Coffee'], answer: 1, explain: '«…he makes pancakes for everyone.»' },
        { type: 'choice', question: 'When does the family talk on video?', options: ['Every day', 'On Saturday mornings', 'Every Sunday evening', 'Never'], answer: 2, explain: '«…every Sunday evening.»' },
      ],
    },
    {
      id: 'lib-rainy', level: 'A2', title: 'A Rainy Sunday', topic: 'выходные',
      body: 'Last Sunday it rained all day. I wanted to go to the park with my friends, but we had to change our plans.\n\n' +
        'Instead, we stayed at Lena’s flat. We made hot chocolate and played board games. I won twice, and Lena was a bit angry, but then we laughed about it.\n\n' +
        'In the afternoon we watched an old comedy. It was so funny that Kirill fell off the sofa. After the film we cooked pasta together. It wasn’t perfect — we forgot the salt — but we ate everything.\n\n' +
        'When I went home in the evening, the rain had stopped. The streets were wet and quiet. I thought: sometimes bad weather gives you the best days.',
      quiz: [
        { type: 'choice', question: 'Why did they change their plans?', options: ['Lena was ill', 'It rained all day', 'The park was closed', 'They were tired'], answer: 1, explain: '«…it rained all day.»' },
        { type: 'choice', question: 'What went wrong with the pasta?', options: ['It was burnt', 'They forgot the salt', 'There wasn’t enough', 'Nothing'], answer: 1, explain: '«…we forgot the salt».' },
        { type: 'choice', question: 'What is the main idea of the last sentence?', options: ['Rain is always bad', 'Bad weather can bring good days', 'Parks are boring', 'Staying home is lonely'], answer: 1, explain: 'sometimes bad weather gives you the best days.' },
      ],
    },
    {
      id: 'lib-lost-phone', level: 'A2', title: 'The Lost Phone', topic: 'история',
      body: 'On Monday morning I was late for my first lecture, so I ran to the bus stop. On the bus I wanted to check the time, but my phone wasn’t in my pocket. I felt sick. All my notes, photos and contacts were on that phone!\n\n' +
        'After the lecture I went back to the bus stop. Of course, the phone wasn’t there. I asked in a small shop nearby. The woman at the counter smiled and said, “Is it black with a pink case?” A schoolboy had found it on the pavement and brought it to the shop.\n\n' +
        'I wanted to thank him, but he had already left. So I bought a big box of chocolates and left it at the shop for him. Since that day, I always check my pockets twice — and I try to be a little kinder to strangers.',
      quiz: [
        { type: 'choice', question: 'Why did the author run to the bus stop?', options: ['She was late', 'It was raining', 'She lost her bag', 'She saw a friend'], answer: 0, explain: '«I was late for my first lecture».' },
        { type: 'choice', question: 'Who found the phone?', options: ['The shop assistant', 'A bus driver', 'A schoolboy', 'Her friend'], answer: 2, explain: '«A schoolboy had found it».' },
        { type: 'choice', question: 'What did the author leave for the boy?', options: ['Money', 'A box of chocolates', 'A letter', 'Nothing'], answer: 1, explain: '«…bought a big box of chocolates».' },
      ],
    },
    {
      id: 'lib-stories', level: 'B1', title: 'Why We Love Stories', topic: 'психология',
      body: 'Long before people could write, they told stories around the fire. Today we still do the same, only the fire has become a screen.\n\n' +
        'Psychologists say that stories are one of the most effective ways our brain processes information. A list of facts is quickly forgotten, but a story about a person who struggles, makes a choice and changes stays in our memory for years. When we follow a character, our brain reacts almost as if we were living the events ourselves.\n\n' +
        'Stories also help us understand other people. Reading a novel about someone from a different country or background can make us more empathetic, because for a few hours we see the world through their eyes.\n\n' +
        'This is useful for learning, too. If you want to remember a difficult concept, try turning it into a story: who had a problem, what they tried, and what finally worked.',
      quiz: [
        { type: 'choice', question: 'Why do we remember stories better than lists of facts?', options: ['Stories are shorter', 'Our brain reacts as if living the events', 'Lists are boring', 'Stories have pictures'], answer: 1, explain: 'Мозг реагирует почти так, будто проживает события.' },
        { type: 'choice', question: 'How can novels make us more empathetic?', options: ['They teach grammar', 'We see the world through another person’s eyes', 'They are long', 'They are popular'], answer: 1, explain: '«…we see the world through their eyes.»' },
        { type: 'choice', question: 'What learning tip does the text give?', options: ['Read faster', 'Turn a concept into a story', 'Make lists', 'Study at night'], answer: 1, explain: 'Последний абзац.' },
      ],
    },
    {
      id: 'lib-volunteer', level: 'B1', title: 'A Summer of Volunteering', topic: 'опыт',
      body: 'Last summer, instead of looking for a paid job, I spent a month volunteering at an animal shelter outside the city. My friends thought I was crazy: why work for free?\n\n' +
        'The work was harder than I expected. Every morning started at seven with cleaning, feeding and walking the dogs. By lunchtime my arms ached and my clothes smelled terrible. But slowly I started to recognise each dog’s personality: the shy one who hid behind the water bowl, the old one who only wanted to be stroked, the clever puppy who learned to open the gate.\n\n' +
        'What surprised me most was how much I learned about myself. I became more patient, I stopped worrying about small things, and I realised that I enjoy work where I can see the result of my effort immediately.\n\n' +
        'I didn’t earn any money that summer, but I gained something I couldn’t buy: a clearer idea of what kind of person I want to be.',
      quiz: [
        { type: 'choice', question: 'Where did the author volunteer?', options: ['In a hospital', 'At an animal shelter', 'In a school', 'In a café'], answer: 1, explain: 'animal shelter outside the city.' },
        { type: 'choice', question: 'What did the author learn about herself?', options: ['She hates animals', 'She enjoys work with visible results', 'She wants to be a vet', 'She prefers paid jobs'], answer: 1, explain: '«…work where I can see the result of my effort immediately.»' },
        { type: 'choice', question: 'Which statement is NOT true?', options: ['The work started at seven', 'Her friends supported the idea', 'She became more patient', 'She earned no money'], answer: 1, explain: 'Друзья считали её «сумасшедшей» — ловушка.' },
      ],
    },
    {
      id: 'lib-motivation', level: 'B2', title: 'The Science of Motivation', topic: 'психология и учёба',
      body: 'We often talk about motivation as if it were a fuel: either you have it or you don’t. Research paints a more nuanced picture.\n\n' +
        'Psychologists distinguish between extrinsic motivation, driven by rewards and pressure, and intrinsic motivation, which comes from interest, curiosity or a sense of meaning. Extrinsic motivators such as grades or money can be effective in the short term, but people who rely on them alone tend to lose interest once the reward disappears.\n\n' +
        'Intrinsic motivation, on the other hand, seems to grow when three basic needs are met: autonomy (the feeling that you choose what you do), competence (the feeling that you are getting better), and relatedness (the feeling of being connected to others).\n\n' +
        'This has practical implications. Instead of waiting to “feel motivated”, it may be more effective to give yourself small choices, track visible progress, and study alongside people you like. Motivation, in this view, is less a mysterious spark and more something you can deliberately cultivate.',
      quiz: [
        { type: 'choice', question: 'What is a weakness of relying only on extrinsic motivation?', options: ['It never works', 'Interest fades when the reward disappears', 'It is too slow', 'It requires friends'], answer: 1, explain: '«…tend to lose interest once the reward disappears.»' },
        { type: 'choice', question: 'Which is NOT one of the three basic needs?', options: ['Autonomy', 'Competence', 'Relatedness', 'Discipline'], answer: 3, explain: 'Discipline в тексте нет — ловушка.' },
        { type: 'choice', question: 'What does the author suggest instead of waiting to feel motivated?', options: ['Promise yourself rewards', 'Give yourself choices, track progress, study with others', 'Work alone', 'Rest more'], answer: 1, explain: 'Последний абзац.' },
      ],
    },
    {
      id: 'lib-cities', level: 'B2', title: 'Cities of the Future', topic: 'общество',
      body: 'By the middle of this century, around two thirds of the world’s population is expected to live in cities. How these cities are designed will shape the daily lives of billions of people.\n\n' +
        'Many urban planners now argue for the “fifteen-minute city”: a neighbourhood where everything you need — shops, schools, doctors, parks — can be reached within fifteen minutes on foot or by bike. Supporters say this reduces traffic and pollution and gives people more time for themselves.\n\n' +
        'Critics, however, worry that such ideas might be used to restrict movement or that they suit wealthy central districts better than suburbs, where distances are longer and services fewer.\n\n' +
        'What most experts agree on is that cities work best when they are planned around people rather than cars: wide pavements, green spaces, reliable public transport and places where neighbours can meet. The challenge is to achieve this without pushing out the people who already live there.',
      quiz: [
        { type: 'choice', question: 'What is a “fifteen-minute city”?', options: ['A city built in fifteen years', 'A neighbourhood where needs are within 15 minutes on foot or by bike', 'A city with fast trains', 'A very small city'], answer: 1, explain: 'Определение во втором абзаце.' },
        { type: 'choice', question: 'What concern do critics raise?', options: ['It is too expensive', 'It may suit wealthy districts better than suburbs', 'People will walk too much', 'Parks will disappear'], answer: 1, explain: 'Третий абзац.' },
        { type: 'choice', question: 'What is the “challenge” mentioned at the end?', options: ['Building more roads', 'Improving cities without pushing out current residents', 'Banning cars', 'Building taller houses'], answer: 1, explain: '«…without pushing out the people who already live there.»' },
      ],
    },
    {
      id: 'lib-failure', level: 'C1', title: 'In Praise of Failure', topic: 'саморазвитие',
      body: 'Few words carry as much social weight as “failure”. We hide our rejected applications, delete unsuccessful projects from our CVs and present a curated version of our lives in which everything worked out on the first attempt.\n\n' +
        'Yet anyone who has learned a skill knows that progress is built almost entirely on failed attempts. The violinist’s fluency rests on thousands of out-of-tune notes; the programmer’s expertise on countless broken builds. What distinguishes those who improve from those who stagnate is rarely the absence of failure, but the way they interpret it.\n\n' +
        'Treating a failure as a verdict on one’s worth tends to produce avoidance: if every mistake confirms that we are not good enough, the rational strategy is to stop trying. Treating it as information, by contrast, turns the same event into a source of feedback. The question shifts from “What does this say about me?” to “What does this tell me about the next attempt?”\n\n' +
        'None of this makes failure pleasant. But perhaps the goal is not to enjoy it, merely to stop letting it decide whether we continue.',
      quiz: [
        { type: 'choice', question: 'What, according to the author, distinguishes people who improve?', options: ['They never fail', 'How they interpret failure', 'Natural talent', 'Hard work alone'], answer: 1, explain: '«…the way they interpret it.»' },
        { type: 'choice', question: 'Why does treating failure as a verdict lead to avoidance?', options: ['It is boring', 'If mistakes prove you are not good enough, stopping seems rational', 'Others criticise you', 'It takes too much time'], answer: 1, explain: 'Третий абзац.' },
        { type: 'choice', question: 'What is the author’s final point?', options: ['We should learn to enjoy failure', 'Failure should not decide whether we continue', 'Failure is always useful', 'We should hide failures'], answer: 1, explain: 'Последнее предложение.' },
      ],
    },
  ];

  window.LIBRARY = (window.LIBRARY || []).concat(texts.map((t) => ({ id: t.id, level: t.level, lang: 'en-US', title: t.title, topic: t.topic, body: t.body })));
  window.LIBRARY_QUIZ = window.LIBRARY_QUIZ || {};
  texts.forEach((t) => { window.LIBRARY_QUIZ[t.id] = t.quiz; });
})();
