// Справочник грамматики английского языка (A1–B2).
// Тексты объяснений и примеры написаны специально для этого проекта.
//
// Формат темы:
//   id, level, title, summary — короткое описание
//   theory — абзацы (поддерживается **жирный** и `код`)
//   formula — строки-схемы
//   examples — [английский, русский]
//   mistakes — [как неправильно, как правильно, пояснение]
//   drill — короткая тренировка (типы choice / gap, как в уроках)
(function () {
  'use strict';

  window.GRAMMAR = [
    // ---------- A1 ----------
    {
      id: 'to-be', level: 'A1', title: 'Глагол to be: am / is / are',
      summary: 'Как сказать «я студентка», «он дома», «мы устали».',
      theory: [
        'В русском мы говорим «Я студентка» без глагола. В английском так нельзя: нужен глагол **to be** («быть»). Он связывает подлежащее с тем, кто или какой кто-то, где находится.',
        'Форма зависит от подлежащего: **I am**, **he / she / it is**, **we / you / they are**. В разговоре сокращают: I’m, she’s, they’re.',
        'Отрицание — добавляем **not**: I’m not, she isn’t, they aren’t. Вопрос — ставим глагол вперёд: **Are** you tired? **Is** he at home?',
      ],
      formula: ['I am · he/she/it is · we/you/they are', 'Отрицание: am not / isn’t / aren’t', 'Вопрос: Am I…? Is she…? Are they…?'],
      examples: [['I am a student.', 'Я студентка.'], ['She is at the library.', 'Она в библиотеке.'], ['We aren’t ready yet.', 'Мы ещё не готовы.'], ['Are you tired?', 'Ты устала?']],
      mistakes: [['She student.', 'She is a student.', 'глагол to be обязателен'], ['I is happy.', 'I am happy.', 'с I — только am']],
      drill: [
        { type: 'choice', question: 'My friends ___ at the café.', options: ['is', 'are', 'am', 'be'], answer: 1, explain: 'friends — это they → are.' },
        { type: 'choice', question: '___ she your sister?', options: ['Are', 'Is', 'Am', 'Does'], answer: 1, explain: 'Вопрос с to be: глагол вперёд, she → is.' },
        { type: 'gap', sentence: 'I ___ not hungry, thanks.', answer: 'am', explain: 'I → am.' },
        { type: 'choice', question: 'It ___ cold today.', options: ['are', 'am', 'is', 'be'], answer: 2, explain: 'it → is.' },
      ],
    },
    {
      id: 'present-simple', level: 'A1', title: 'Present Simple: привычки и факты',
      summary: 'Что ты делаешь обычно, регулярно, всегда.',
      theory: [
        '**Present Simple** — время для привычек, расписаний и фактов: «Я пью кофе по утрам», «Лекции начинаются в 9».',
        'Глагол — в начальной форме, но с **he / she / it** добавляем **-s**: I work → she work**s**, go → go**es**, study → stud**ies**.',
        'Для отрицаний и вопросов нужен помощник **do / does**: I **don’t** like it. **Does** she study here? После does окончание -s пропадает: Does she work**?** (не works).',
        'Частые слова-подсказки: always, usually, often, sometimes, never, every day, on Mondays.',
      ],
      formula: ['I / you / we / they + V', 'he / she / it + V-s', 'don’t / doesn’t + V · Do / Does … + V?'],
      examples: [['I usually get up at 7.', 'Я обычно встаю в 7.'], ['She studies economics.', 'Она изучает экономику.'], ['We don’t watch TV.', 'Мы не смотрим телевизор.'], ['Does he play the guitar?', 'Он играет на гитаре?']],
      mistakes: [['She work in a bank.', 'She works in a bank.', 'с she — окончание -s'], ['Does she works?', 'Does she work?', 'после does — без -s'], ['I not like coffee.', 'I don’t like coffee.', 'нужен don’t']],
      drill: [
        { type: 'choice', question: 'He ___ to the gym on Mondays.', options: ['go', 'goes', 'going', 'is go'], answer: 1, explain: 'he → goes.' },
        { type: 'choice', question: '___ you like jazz?', options: ['Does', 'Are', 'Do', 'Is'], answer: 2, explain: 'you → Do.' },
        { type: 'gap', sentence: 'My sister ___ (not / eat) meat.', answer: "doesn't eat", accept: ['does not eat'], explain: 'she → doesn’t + глагол без -s.' },
        { type: 'choice', question: 'The lecture ___ at 9 a.m.', options: ['start', 'starts', 'is start', 'starting'], answer: 1, explain: 'Расписание → Present Simple, it → starts.' },
      ],
    },
    {
      id: 'articles', level: 'A1', title: 'Артикли a / an / the',
      summary: 'Маленькие слова, которых нет в русском.',
      theory: [
        '**a / an** — «какой-то, один из многих». Ставим перед исчисляемым существительным в единственном числе, когда говорим о нём впервые или неважно, какой именно: I have **a** cat.',
        '**an** — перед гласным **звуком**: **an** apple, **an** hour (h не читается), но **a** university (звук «ю»).',
        '**the** — «тот самый, понятно какой»: уже упоминали, он один такой или ясно из ситуации: I have a cat. **The** cat is black. Close **the** door, please.',
        'Без артикля: множественное число и неисчисляемое «вообще»: I like **cats**. **Music** helps me relax.',
      ],
      formula: ['a + согласный звук · an + гласный звук', 'the — конкретный, известный', '— (ничего) — вообще, во множественном числе'],
      examples: [['She’s an engineer.', 'Она инженер.'], ['I bought a book. The book is great.', 'Я купила книгу. Книга отличная.'], ['The sun is bright today.', 'Солнце сегодня яркое.'], ['I love coffee.', 'Я люблю кофе (вообще).']],
      mistakes: [['She is student.', 'She is a student.', 'профессия/роль — с a'], ['I like the music.', 'I like music.', 'если про музыку вообще — без артикля']],
      drill: [
        { type: 'choice', question: 'I need ___ umbrella.', options: ['a', 'an', 'the', '—'], answer: 1, explain: 'umbrella начинается с гласного звука → an.' },
        { type: 'choice', question: 'Can you open ___ window, please?', options: ['a', 'an', 'the', '—'], answer: 2, explain: 'Понятно, какое окно → the.' },
        { type: 'choice', question: 'She studies at ___ university in Moscow.', options: ['a', 'an', 'the', '—'], answer: 0, explain: 'university читается «ю» — согласный звук → a.' },
        { type: 'choice', question: '___ books are expensive these days.', options: ['A', 'An', 'The', '— (ничего)'], answer: 3, explain: 'Книги вообще, мн. число → без артикля.' },
      ],
    },
    {
      id: 'there-is', level: 'A1', title: 'There is / there are',
      summary: 'Как сказать «в комнате есть стол».',
      theory: [
        'Когда сообщаем, что **где-то что-то есть**, используем **there is** (одна вещь) и **there are** (несколько).',
        'Порядок слов — обратный русскому: «На столе книга» → **There is a book on the table.**',
        'Вопрос: **Is there** a café near here? **Are there** any tickets? Отрицание: There **isn’t** any milk. There **aren’t** any seats.',
      ],
      formula: ['There is + единственное число', 'There are + множественное число', 'Is there…? / Are there…?'],
      examples: [['There is a park near my house.', 'Рядом с моим домом есть парк.'], ['There are 20 students in our group.', 'В нашей группе 20 студентов.'], ['Is there a pharmacy here?', 'Здесь есть аптека?']],
      mistakes: [['In my room is a desk.', 'There is a desk in my room.', 'нужна конструкция there is'], ['There is many people.', 'There are many people.', 'people — множественное число']],
      drill: [
        { type: 'choice', question: '___ two bags on the chair.', options: ['There is', 'There are', 'It is', 'They are'], answer: 1, explain: 'Две сумки → there are.' },
        { type: 'choice', question: '___ a bus stop near here?', options: ['Are there', 'Is it', 'Is there', 'There is'], answer: 2, explain: 'Вопрос, единственное число → Is there.' },
        { type: 'gap', sentence: "There ___ any milk in the fridge.", answer: "isn't", accept: ['is not'], explain: 'milk неисчисляемое → isn’t.' },
      ],
    },

    // ---------- A2 ----------
    {
      id: 'past-simple', level: 'A2', title: 'Past Simple: что было вчера',
      summary: 'Законченные действия в прошлом.',
      theory: [
        '**Past Simple** — для действий, которые случились и закончились в прошлом, часто с указанием времени: yesterday, last week, in 2020, two days ago.',
        'Правильные глаголы получают **-ed**: work → work**ed**, study → stud**ied**, stop → sto**pped**. Неправильные нужно запомнить: go → **went**, see → **saw**, have → **had**, buy → **bought**.',
        'Отрицание и вопрос — через **did**, а глагол возвращается в начальную форму: I **didn’t go**. **Did** you **see** it? (не did you saw).',
      ],
      formula: ['V-ed / 2-я форма', 'didn’t + V', 'Did … + V?'],
      examples: [['I watched a film yesterday.', 'Вчера я смотрела фильм.'], ['We went to Kazan last summer.', 'Прошлым летом мы ездили в Казань.'], ['She didn’t call me.', 'Она мне не позвонила.'], ['Did you pass the exam?', 'Ты сдала экзамен?']],
      mistakes: [['I didn’t went.', 'I didn’t go.', 'после didn’t — начальная форма'], ['Did you saw it?', 'Did you see it?', 'после did — начальная форма']],
      drill: [
        { type: 'choice', question: 'Yesterday I ___ a new phone.', options: ['buy', 'buyed', 'bought', 'have bought'], answer: 2, explain: 'buy — неправильный: bought.' },
        { type: 'gap', sentence: 'We ___ (not / go) out last night.', answer: "didn't go", accept: ['did not go'], explain: 'didn’t + начальная форма.' },
        { type: 'choice', question: '___ you enjoy the concert?', options: ['Do', 'Did', 'Were', 'Have'], answer: 1, explain: 'Прошлое → Did.' },
        { type: 'choice', question: 'She ___ for the exam all weekend.', options: ['studyed', 'studied', 'studies', 'study'], answer: 1, explain: 'study → studied (y → ied).' },
      ],
    },
    {
      id: 'present-continuous', level: 'A2', title: 'Present Continuous: прямо сейчас',
      summary: 'Действие в процессе и планы на ближайшее время.',
      theory: [
        '**Present Continuous** показывает, что действие **идёт прямо сейчас** или в этот период: I’m reading. She’s working on her thesis this month.',
        'Строится так: **am / is / are + глагол-ing**. Подсказки: now, at the moment, right now, today, this week, Look! Listen!',
        'Ещё его используют для **договорённостей на будущее**: I’m meeting Anya tomorrow.',
        'Некоторые глаголы почти не бывают в -ing: know, like, love, want, need, understand. Говорим I **know**, а не I’m knowing.',
      ],
      formula: ['am / is / are + V-ing', 'Present Simple — обычно; Continuous — сейчас'],
      examples: [['I’m listening to a podcast now.', 'Я сейчас слушаю подкаст.'], ['Look, it’s snowing!', 'Смотри, идёт снег!'], ['We’re flying to Sochi on Friday.', 'В пятницу мы летим в Сочи.']],
      mistakes: [['I reading now.', 'I’m reading now.', 'нужен am/is/are'], ['I’m knowing the answer.', 'I know the answer.', 'know не используется в -ing']],
      drill: [
        { type: 'choice', question: 'Be quiet! The baby ___.', options: ['sleeps', 'is sleeping', 'sleep', 'slept'], answer: 1, explain: 'Прямо сейчас → is sleeping.' },
        { type: 'choice', question: 'I usually ___ tea, but today I ___ coffee.', options: ['drink / drink', 'am drinking / drink', 'drink / am drinking', 'drinks / drinking'], answer: 2, explain: 'Обычно — Simple, сегодня — Continuous.' },
        { type: 'choice', question: 'I ___ what you mean.', options: ['am understanding', 'understand', 'understanding', 'am understand'], answer: 1, explain: 'understand не ставится в -ing.' },
      ],
    },
    {
      id: 'future', level: 'A2', title: 'Будущее: will и going to',
      summary: 'Решение «на лету» против готового плана.',
      theory: [
        '**will + V** — решение, принятое прямо сейчас, обещание, предположение: I’ll help you! I think it **will** rain.',
        '**be going to + V** — план, который уже есть, или то, что явно вот-вот случится: I’m **going to** learn Spanish this year. Look at those clouds — it’s **going to** rain.',
        'Для договорённостей с конкретным временем часто берут Present Continuous: I’m seeing the dentist on Monday.',
      ],
      formula: ['will + V — решаю сейчас, обещаю, думаю', 'am/is/are going to + V — уже планирую'],
      examples: [['The phone is ringing. — I’ll get it.', 'Телефон звонит. — Я возьму.'], ['I’m going to apply for a master’s.', 'Я собираюсь поступать в магистратуру.'], ['Don’t worry, you’ll pass.', 'Не переживай, ты сдашь.']],
      mistakes: [['I will to call you.', 'I will call you.', 'после will — без to'], ['I going to study.', 'I’m going to study.', 'нужен am/is/are']],
      drill: [
        { type: 'choice', question: '— It’s cold here. — I ___ close the window.', options: ['am going to', 'will', 'going to', 'close'], answer: 1, explain: 'Решение прямо сейчас → will.' },
        { type: 'choice', question: 'We’ve bought the tickets. We ___ visit Paris in May.', options: ['will', 'are going to', 'go to', 'would'], answer: 1, explain: 'План уже есть → going to.' },
        { type: 'gap', sentence: 'I promise I ___ be late again.', answer: "won't", accept: ['will not'], explain: 'Обещание → will not / won’t.' },
      ],
    },
    {
      id: 'comparatives', level: 'A2', title: 'Сравнения: bigger, more interesting, the best',
      summary: 'Сравнительная и превосходная степень.',
      theory: [
        'Короткие прилагательные: **-er / the -est**: cheap → cheap**er** → the cheap**est**; big → bi**gger** → the bi**ggest**; easy → eas**ier** → the eas**iest**.',
        'Длинные (2+ слога, кроме на -y): **more / the most**: interesting → **more** interesting → **the most** interesting.',
        'Исключения: good → **better** → **the best**; bad → **worse** → **the worst**; far → further.',
        'Сравниваем через **than**: Moscow is bigger **than** Kazan. Равенство — **as … as**: She’s **as** tall **as** me.',
      ],
      formula: ['short: -er than / the -est', 'long: more … than / the most …', 'good → better → best · bad → worse → worst'],
      examples: [['This course is harder than last year’s.', 'Этот курс сложнее прошлогоднего.'], ['It’s the most beautiful city I’ve seen.', 'Это самый красивый город, который я видела.'], ['My English is better now.', 'Мой английский теперь лучше.']],
      mistakes: [['more better', 'better', 'не удваиваем сравнение'], ['bigger then', 'bigger than', 'than, а не then']],
      drill: [
        { type: 'choice', question: 'This exam was ___ than I expected.', options: ['easyer', 'more easy', 'easier', 'easiest'], answer: 2, explain: 'easy → easier.' },
        { type: 'choice', question: 'It’s ___ film of the year.', options: ['the best', 'the better', 'the most good', 'best'], answer: 0, explain: 'good → the best.' },
        { type: 'gap', sentence: 'Statistics is more interesting ___ I thought.', answer: 'than', explain: 'Сравнение → than.' },
      ],
    },
    {
      id: 'modals-basic', level: 'A2', title: 'Модальные: can, must, have to, should',
      summary: 'Умею, должна, стоит.',
      theory: [
        'После модальных глаголов идёт глагол **без to** и без -s: She **can swim** (не can to swim, не cans).',
        '**can** — умею / могу / можно: I can speak three languages. **can’t** — не могу / нельзя.',
        '**must** — сильная необходимость (часто моя собственная): I must finish this today. **mustn’t** — **нельзя**!',
        '**have to** — надо из-за правил или обстоятельств: I have to wear a uniform. **don’t have to** — **не обязательно** (а не «нельзя»).',
        '**should** — совет «стоит / следует»: You should sleep more.',
      ],
      formula: ['модальный + V (без to)', 'mustn’t = нельзя · don’t have to = не нужно'],
      examples: [['You should take a break.', 'Тебе стоит сделать перерыв.'], ['We don’t have to come early.', 'Нам не обязательно приходить рано.'], ['You mustn’t use phones in the exam.', 'На экзамене нельзя пользоваться телефонами.']],
      mistakes: [['She can to drive.', 'She can drive.', 'после can — без to'], ['You mustn’t come (= не обязательно).', 'You don’t have to come.', 'mustn’t — это запрет']],
      drill: [
        { type: 'choice', question: 'Tomorrow is Sunday, so I ___ get up early.', options: ['mustn’t', 'don’t have to', 'can’t', 'shouldn’t to'], answer: 1, explain: 'Не обязательно → don’t have to.' },
        { type: 'choice', question: 'You look tired. You ___ go to bed.', options: ['should', 'must to', 'can', 'have'], answer: 0, explain: 'Совет → should.' },
        { type: 'choice', question: 'She ___ play the piano very well.', options: ['cans', 'can to', 'can', 'is can'], answer: 2, explain: 'can + глагол без to.' },
      ],
    },

    // ---------- B1 ----------
    {
      id: 'present-perfect', level: 'B1', title: 'Present Perfect vs Past Simple',
      summary: 'Опыт и результат против «когда именно».',
      theory: [
        '**Present Perfect = have / has + 3-я форма** (V3): I **have seen**, she **has finished**.',
        'Используем, когда важен **результат сейчас** или **опыт в жизни**, а время не указано: I’ve lost my keys (и сейчас их нет). Have you ever been to London?',
        'Также для периода, который **ещё длится**: I’ve lived here **for** three years / **since** 2022. Слова-подсказки: ever, never, already, yet, just, for, since.',
        'Если есть **конкретное время в прошлом** (yesterday, last year, in 2020, when…) — только **Past Simple**: I saw that film **yesterday** (не have seen yesterday).',
      ],
      formula: ['have / has + V3 — опыт, результат, «до сих пор»', 'Past Simple — когда именно (yesterday, in 2020)', 'for + период · since + точка отсчёта'],
      examples: [['I’ve never tried sushi.', 'Я никогда не пробовала суши.'], ['She has just left.', 'Она только что ушла.'], ['We’ve known each other since school.', 'Мы знаем друг друга со школы.'], ['I went to Spain in 2023.', 'Я ездила в Испанию в 2023.']],
      mistakes: [['I have seen him yesterday.', 'I saw him yesterday.', 'с yesterday — Past Simple'], ['I live here since 2020.', 'I have lived here since 2020.', 'с since — Present Perfect'], ['Did you ever be…?', 'Have you ever been…?', 'опыт → Present Perfect']],
      drill: [
        { type: 'choice', question: 'I ___ this book three times.', options: ['read', 'have read', 'am reading', 'had read'], answer: 1, explain: 'Опыт, время не указано → have read.' },
        { type: 'choice', question: 'We ___ to Italy last summer.', options: ['have gone', 'went', 'have been', 'go'], answer: 1, explain: 'last summer → Past Simple.' },
        { type: 'choice', question: 'She has worked here ___ 2021.', options: ['for', 'since', 'from', 'during'], answer: 1, explain: 'Точка отсчёта → since.' },
        { type: 'gap', sentence: 'Have you ___ been to Saint Petersburg?', answer: 'ever', explain: 'Опыт в жизни → ever.' },
      ],
    },
    {
      id: 'conditionals', level: 'B1', title: 'Условные предложения 0, 1, 2',
      summary: '«Если…, то…» — реальное и воображаемое.',
      theory: [
        '**Zero:** If + Present, Present — общие истины: If you heat ice, it melts.',
        '**First:** If + Present, **will** + V — реальное будущее: If it rains, I’**ll** stay home. Важно: после if **не** ставим will (не if it will rain).',
        '**Second:** If + Past, **would** + V — воображаемое, нереальное сейчас: If I **had** more time, I **would travel**. С to be часто **were** для всех лиц: If I **were** you, I’d apply.',
      ],
      formula: ['0: if + Present, Present', '1: if + Present, will + V', '2: if + Past, would + V'],
      examples: [['If I finish early, I’ll call you.', 'Если закончу рано, позвоню тебе.'], ['If I knew the answer, I would tell you.', 'Если бы я знала ответ, я бы сказала.'], ['If I were you, I’d take the job.', 'На твоём месте я бы согласилась на работу.']],
      mistakes: [['If it will rain…', 'If it rains…', 'после if — без will'], ['If I would have money…', 'If I had money…', 'would — только во второй части']],
      drill: [
        { type: 'choice', question: 'If you ___ hard, you will pass.', options: ['will study', 'study', 'studied', 'would study'], answer: 1, explain: 'First conditional: if + Present.' },
        { type: 'choice', question: 'If I ___ rich, I would buy a house by the sea.', options: ['am', 'will be', 'were', 'would be'], answer: 2, explain: 'Нереальное → were.' },
        { type: 'choice', question: 'If she calls, I ___ her the news.', options: ['tell', 'would tell', 'will tell', 'told'], answer: 2, explain: 'Реальное будущее → will.' },
      ],
    },
    {
      id: 'passive', level: 'B1', title: 'Пассивный залог',
      summary: '«Книга была написана», «здесь говорят по-английски».',
      theory: [
        'Пассив нужен, когда важно **действие или объект**, а не кто это сделал: The museum **was built** in 1890. English **is spoken** here.',
        'Строится как **be + V3**, а время показывает глагол be: is made, was made, has been made, will be made.',
        'Если всё-таки важно, кто сделал, добавляем **by**: The song was written **by** Zemfira.',
      ],
      formula: ['be (в нужном времени) + V3', 'by — кем сделано'],
      examples: [['Coffee is grown in Brazil.', 'Кофе выращивают в Бразилии.'], ['The exam was postponed.', 'Экзамен перенесли.'], ['The results will be announced tomorrow.', 'Результаты объявят завтра.']],
      mistakes: [['The house was build in 1900.', 'The house was built in 1900.', 'нужна 3-я форма'], ['It is speak here.', 'It is spoken here.', 'be + V3']],
      drill: [
        { type: 'choice', question: 'This bridge ___ in 2010.', options: ['built', 'was built', 'is building', 'has build'], answer: 1, explain: 'Прошлое, пассив → was built.' },
        { type: 'choice', question: 'The emails ___ every morning.', options: ['are checked', 'checked', 'are check', 'is checked'], answer: 0, explain: 'Регулярно, мн. число → are checked.' },
        { type: 'gap', sentence: 'The book was written ___ a young author.', answer: 'by', explain: 'Кем → by.' },
      ],
    },
    {
      id: 'used-to', level: 'B1', title: 'Used to: раньше так было',
      summary: 'Привычки и состояния в прошлом, которых больше нет.',
      theory: [
        '**used to + V** — то, что было регулярно или долго в прошлом, но сейчас уже не так: I **used to** play the piano (а теперь нет).',
        'Отрицание и вопрос через did, и тогда **use** без d: I **didn’t use to** like olives. **Did** you **use to** live here?',
        'Не путай с **be used to + -ing** — «привыкла к»: I’m used to getting up early.',
      ],
      formula: ['used to + V — раньше (а теперь нет)', 'didn’t use to + V · Did … use to + V?', 'be used to + V-ing — привыкнуть к'],
      examples: [['I used to be shy.', 'Раньше я была застенчивой.'], ['We used to go to the dacha every summer.', 'Раньше мы каждое лето ездили на дачу.'], ['She’s used to working at night.', 'Она привыкла работать ночью.']],
      mistakes: [['I use to live there.', 'I used to live there.', 'в утверждении — used'], ['I am used to get up early.', 'I am used to getting up early.', 'после be used to — ing']],
      drill: [
        { type: 'choice', question: 'I ___ have long hair, but now it’s short.', options: ['use to', 'used to', 'am used to', 'was used'], answer: 1, explain: 'Раньше, а теперь нет → used to.' },
        { type: 'choice', question: 'Did you ___ play any sport at school?', options: ['used to', 'use to', 'using to', 'be used'], answer: 1, explain: 'После did → use to.' },
        { type: 'choice', question: 'After a year in London, she is used to ___ on the left.', options: ['drive', 'driving', 'drove', 'be driving'], answer: 1, explain: 'be used to + ing.' },
      ],
    },
    {
      id: 'relative', level: 'B1', title: 'Придаточные с who / which / that / where',
      summary: '«Девушка, которая…», «город, где…».',
      theory: [
        '**who** — про людей: The girl **who** sits next to me is from Minsk.',
        '**which** — про вещи и животных: The laptop **which** I bought is fast. **that** можно и про людей, и про вещи (чаще в разговоре).',
        '**where** — про места: This is the café **where** we met. **whose** — «чей»: the student **whose** project won.',
        'Если who/which/that — дополнение (после него идёт новое подлежащее), его можно опустить: The book (that) I’m reading is great.',
      ],
      formula: ['люди — who / that', 'вещи — which / that', 'место — where · чей — whose'],
      examples: [['She’s the teacher who helped me.', 'Это преподавательница, которая мне помогла.'], ['That’s the song which made me cry.', 'Это та песня, от которой я плакала.'], ['I remember the city where I was born.', 'Я помню город, где родилась.']],
      mistakes: [['The man which called…', 'The man who called…', 'про людей — who'], ['the place which we met', 'the place where we met', 'место — where']],
      drill: [
        { type: 'choice', question: 'The professor ___ teaches statistics is very kind.', options: ['which', 'who', 'where', 'whose'], answer: 1, explain: 'Человек → who.' },
        { type: 'choice', question: 'This is the library ___ I study.', options: ['which', 'who', 'where', 'whose'], answer: 2, explain: 'Место → where.' },
        { type: 'choice', question: 'I know a girl ___ brother is a pilot.', options: ['who', 'whose', 'which', 'that'], answer: 1, explain: '«чей» → whose.' },
      ],
    },

    // ---------- B2 ----------
    {
      id: 'past-perfect', level: 'B2', title: 'Past Perfect: что было раньше прошлого',
      summary: '«Когда я пришла, лекция уже началась».',
      theory: [
        '**Past Perfect = had + V3.** Показывает, что одно действие в прошлом случилось **раньше** другого: When I arrived, the lecture **had** already **started**.',
        'Часто с already, just, never, by the time, before, after.',
        'Если события идут просто по порядку, хватает Past Simple: I got up, had breakfast and left.',
      ],
      formula: ['had + V3 — более раннее прошлое', 'by the time + Past Simple, … had + V3'],
      examples: [['I had never seen snow before I moved to Moscow.', 'До переезда в Москву я никогда не видела снег.'], ['By the time we got there, the shop had closed.', 'Пока мы доехали, магазин уже закрылся.']],
      mistakes: [['When I came, he already left.', 'When I came, he had already left.', 'более раннее действие → had + V3']],
      drill: [
        { type: 'choice', question: 'She was nervous because she ___ on a plane before.', options: ['never was', 'had never been', 'has never been', 'never had been'], answer: 1, explain: 'Раньше другого прошлого → had never been.' },
        { type: 'choice', question: 'By the time the film started, we ___ all the popcorn.', options: ['ate', 'had eaten', 'have eaten', 'were eating'], answer: 1, explain: 'by the time → had + V3.' },
      ],
    },
    {
      id: 'third-conditional', level: 'B2', title: 'Third conditional и I wish',
      summary: 'Сожаления о прошлом и «вот бы…».',
      theory: [
        '**Third conditional:** If + had + V3, would have + V3 — о прошлом, которое уже не изменить: If I **had studied**, I **would have passed**.',
        '**I wish + Past** — хотелось бы, чтобы сейчас было иначе: I wish I **had** more free time.',
        '**I wish + had + V3** — сожаление о прошлом: I wish I **had gone** to the party.',
      ],
      formula: ['If + had V3, would have V3', 'I wish + Past (сейчас) · I wish + had V3 (прошлое)'],
      examples: [['If we had left earlier, we wouldn’t have missed the train.', 'Если бы мы вышли раньше, мы бы не опоздали на поезд.'], ['I wish I spoke French.', 'Жаль, что я не говорю по-французски.'], ['I wish I hadn’t said that.', 'Жаль, что я это сказала.']],
      mistakes: [['If I would have known…', 'If I had known…', 'в части с if — had + V3']],
      drill: [
        { type: 'choice', question: 'If she ___ the alarm, she wouldn’t have been late.', options: ['heard', 'had heard', 'would hear', 'has heard'], answer: 1, explain: 'Третий тип → had + V3.' },
        { type: 'choice', question: 'I wish I ___ more confident now.', options: ['am', 'were', 'had been', 'will be'], answer: 1, explain: 'Желание о настоящем → were.' },
      ],
    },
    {
      id: 'reported-speech', level: 'B2', title: 'Косвенная речь',
      summary: '«Она сказала, что…».',
      theory: [
        'Когда пересказываем чужие слова после **said / told**, время обычно «сдвигается» на шаг назад: "I **am** tired" → She said she **was** tired. "I **will** call" → He said he **would** call.',
        '**say** — без человека: She said (that)… **tell** — с человеком: She **told me** (that)…',
        'Вопросы становятся обычным порядком слов: "Where **do you** live?" → He asked where I **lived**. Для да/нет — if/whether: She asked **if** I was ready.',
      ],
      formula: ['am/is → was · will → would · Present Perfect → Past Perfect', 'say + (that) · tell + кому', 'asked + if / where … + прямой порядок'],
      examples: [['She said she was busy.', 'Она сказала, что занята.'], ['He told me he had finished.', 'Он сказал мне, что закончил.'], ['They asked if we needed help.', 'Они спросили, нужна ли нам помощь.']],
      mistakes: [['She said me…', 'She told me…', 'с человеком — told'], ['He asked where did I live.', 'He asked where I lived.', 'прямой порядок слов']],
      drill: [
        { type: 'choice', question: '"I’m hungry," she said. → She said she ___ hungry.', options: ['is', 'was', 'has been', 'will be'], answer: 1, explain: 'am → was.' },
        { type: 'choice', question: 'He ___ me that he would be late.', options: ['said', 'told', 'asked', 'spoke'], answer: 1, explain: 'С человеком → told.' },
        { type: 'choice', question: 'She asked me where ___.', options: ['did I work', 'I worked', 'do I work', 'worked I'], answer: 1, explain: 'Прямой порядок слов.' },
      ],
    },
    {
      id: 'gerund-infinitive', level: 'B2', title: 'Герундий или инфинитив: doing / to do',
      summary: 'enjoy reading, но decide to read.',
      theory: [
        'После одних глаголов идёт **-ing**: enjoy, finish, mind, avoid, keep, suggest, can’t stand: I enjoy **reading**.',
        'После других — **to + V**: want, decide, plan, hope, agree, refuse, manage, need: I decided **to apply**.',
        'После предлогов — всегда **-ing**: I’m interested **in learning**. Thank you **for helping**.',
        'Некоторые меняют смысл: **stop doing** — перестать делать; **stop to do** — остановиться, чтобы сделать. **remember doing** — помнить, что сделала; **remember to do** — не забыть сделать.',
      ],
      formula: ['enjoy / finish / avoid / keep + V-ing', 'want / decide / plan / hope + to V', 'предлог + V-ing'],
      examples: [['I’ve finished writing my essay.', 'Я дописала эссе.'], ['She refused to answer.', 'Она отказалась отвечать.'], ['Remember to lock the door!', 'Не забудь запереть дверь!']],
      mistakes: [['I enjoy to read.', 'I enjoy reading.', 'после enjoy — ing'], ['I’m interested in learn.', 'I’m interested in learning.', 'после предлога — ing']],
      drill: [
        { type: 'choice', question: 'I’m thinking about ___ a new course.', options: ['take', 'to take', 'taking', 'took'], answer: 2, explain: 'После предлога about → ing.' },
        { type: 'choice', question: 'We decided ___ a taxi.', options: ['taking', 'to take', 'take', 'took'], answer: 1, explain: 'decide + to.' },
        { type: 'choice', question: 'Please stop ___ me during the lecture!', options: ['to text', 'texting', 'text', 'texted'], answer: 1, explain: 'Перестать делать → stop + ing.' },
      ],
    },
  ];
})();
