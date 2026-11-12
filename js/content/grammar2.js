// Дополнительные темы грамматики (A1–C1). Формат тот же, что в grammar.js.
// Тексты написаны специально для этого проекта.
(function () {
  'use strict';

  const more = [
    // ---------- A1 ----------
    {
      id: 'possessives', level: 'A1', title: 'Притяжательные: my, your, ’s',
      summary: 'Чьё это: моя книга, мамина машина.',
      theory: [
        'Притяжательные слова стоят **перед** существительным: **my** phone, **your** bag, **his** car, **her** idea, **its** colour, **our** flat, **their** friends.',
        'Чтобы сказать «чей-то» о человеке, добавляем **’s**: **Anna’s** laptop, my **mum’s** birthday. Если слово во множественном числе на -s, ставим только апостроф: my **parents’** house.',
        'Не путай **its** (его/её — о предмете) и **it’s** (= it is).',
      ],
      formula: ['my · your · his · her · its · our · their + существительное', 'Anna’s book · the students’ results'],
      examples: [['This is my brother’s room.', 'Это комната моего брата.'], ['Their flat is near the metro.', 'Их квартира рядом с метро.'], ['The cat is licking its paw.', 'Кот лижет свою лапу.']],
      mistakes: [['the book of Anna', 'Anna’s book', 'про людей — ’s'], ['It’s colour is red.', 'Its colour is red.', 'its — без апострофа']],
      drill: [
        { type: 'choice', question: 'This is ___ phone. (Маша)', options: ['Masha', 'Masha’s', 'Mashas', 'of Masha'], answer: 1, explain: 'Чей → ’s.' },
        { type: 'choice', question: 'We love ___ new flat.', options: ['us', 'we', 'our', 'ours'], answer: 2, explain: 'Перед существительным → our.' },
        { type: 'choice', question: 'The company changed ___ logo.', options: ['it’s', 'its', 'it', 'his'], answer: 1, explain: 'О компании (it) → its.' },
      ],
    },
    {
      id: 'prepositions-time', level: 'A1', title: 'Предлоги времени: in, on, at',
      summary: 'in May, on Monday, at 5 o’clock.',
      theory: [
        '**at** — точное время и «точки»: at 7 o’clock, at noon, at night, at the weekend (брит.).',
        '**on** — дни и даты: on Monday, on 8 March, on my birthday, on Friday evening.',
        '**in** — периоды побольше: in May, in 2025, in summer, in the morning, in the evening.',
        'Без предлога: this week, next Monday, last year, every day, tomorrow.',
      ],
      formula: ['at — время · on — дни, даты · in — месяцы, годы, части дня', 'next / last / this / every — без предлога'],
      examples: [['The exam is on Thursday at 10.', 'Экзамен в четверг в 10.'], ['I was born in 2005.', 'Я родилась в 2005.'], ['See you next week!', 'Увидимся на следующей неделе!']],
      mistakes: [['in Monday', 'on Monday', 'дни — с on'], ['on the next week', 'next week', 'с next — без предлога']],
      drill: [
        { type: 'choice', question: 'My birthday is ___ June.', options: ['at', 'on', 'in', '—'], answer: 2, explain: 'Месяц → in.' },
        { type: 'choice', question: 'Let’s meet ___ Saturday.', options: ['in', 'on', 'at', '—'], answer: 1, explain: 'День недели → on.' },
        { type: 'choice', question: 'The film starts ___ 8 p.m.', options: ['in', 'on', 'at', '—'], answer: 2, explain: 'Точное время → at.' },
        { type: 'choice', question: 'I’m going to Kazan ___ next month.', options: ['in', 'on', 'at', '— (ничего)'], answer: 3, explain: 'С next предлог не нужен.' },
      ],
    },
    {
      id: 'question-words', level: 'A1', title: 'Вопросы: what, where, when, why, how',
      summary: 'Как задать вопрос с вопросительным словом.',
      theory: [
        'Схема: **вопросительное слово + помощник + подлежащее + глагол**: **Where do** you **live**? **What did** she **say**?',
        'С to be помощник не нужен — глагол сам идёт вперёд: **Where is** the library?',
        'Если спрашиваем **о подлежащем** (кто сделал?), порядок прямой и без do: **Who called** you? (не Who did call).',
        'Полезные: how much / how many (сколько), how often (как часто), how long (как долго), which (который из).',
      ],
      formula: ['Wh- + do/does/did + подлежащее + V', 'Wh- + am/is/are + подлежащее', 'Who / What + глагол (вопрос к подлежащему)'],
      examples: [['How often do you go to the gym?', 'Как часто ты ходишь в спортзал?'], ['Why are you so happy?', 'Почему ты такая счастливая?'], ['Who told you that?', 'Кто тебе это сказал?']],
      mistakes: [['Where you live?', 'Where do you live?', 'нужен помощник do'], ['Who did call you?', 'Who called you?', 'вопрос к подлежащему — без did']],
      drill: [
        { type: 'choice', question: '___ does the lecture start?', options: ['What', 'When', 'Who', 'Which'], answer: 1, explain: 'Когда → When.' },
        { type: 'choice', question: 'Where ___ she work?', options: ['do', 'is', 'does', 'did she'], answer: 2, explain: 'she → does.' },
        { type: 'choice', question: 'Who ___ the window?', options: ['did break', 'broke', 'breaked', 'does broke'], answer: 1, explain: 'Вопрос к подлежащему → broke.' },
      ],
    },

    // ---------- A2 ----------
    {
      id: 'countable', level: 'A2', title: 'Исчисляемые и нет: some, any, much, many',
      summary: 'Сколько: много, немного, несколько.',
      theory: [
        'Исчисляемые можно посчитать: an apple, two apples. Неисчисляемые — нет: water, money, information, advice, homework.',
        '**many / a few** — с исчисляемыми (во мн. числе): many friends, a few questions. **much / a little** — с неисчисляемыми: much time, a little sugar. **a lot of** — с любыми.',
        '**some** — в утверждениях и просьбах: I have some ideas. Can I have some tea? **any** — в отрицаниях и вопросах: I don’t have any money. Are there any questions?',
        'Внимание: **information, advice, news, furniture** в английском неисчисляемые: some advice (не an advice), the news **is** good.',
      ],
      formula: ['many / a few + исчисляемые', 'much / a little + неисчисляемые', 'some (+) · any (− ?)'],
      examples: [['I don’t have much time.', 'У меня мало времени.'], ['There are a few cafés nearby.', 'Рядом есть несколько кафе.'], ['Can you give me some advice?', 'Можешь дать совет?']],
      mistakes: [['many money', 'much money', 'money — неисчисляемое'], ['an advice / advices', 'some advice / a piece of advice', 'advice — неисчисляемое']],
      drill: [
        { type: 'choice', question: 'How ___ students are in your group?', options: ['much', 'many', 'a little', 'any'], answer: 1, explain: 'students — исчисляемые → many.' },
        { type: 'choice', question: 'I need ___ information about the course.', options: ['an', 'many', 'some', 'a few'], answer: 2, explain: 'information — неисчисляемое → some.' },
        { type: 'choice', question: 'There isn’t ___ milk left.', options: ['some', 'any', 'many', 'a few'], answer: 1, explain: 'Отрицание → any.' },
        { type: 'choice', question: 'The news ___ surprising.', options: ['are', 'is', 'were', 'be'], answer: 1, explain: 'news — единственное число → is.' },
      ],
    },
    {
      id: 'frequency', level: 'A2', title: 'Наречия частоты и порядок слов',
      summary: 'always, usually, often… — куда их ставить.',
      theory: [
        'Шкала: **always** (всегда) → usually → often → sometimes → rarely / seldom → **never** (никогда).',
        'Ставим **перед основным глаголом**: I **often** cook. Но **после** to be: She is **always** late.',
        'С вспомогательным — между ним и глаголом: I have **never** been there. You can **always** call me.',
        'Sometimes можно и в начало: **Sometimes** I study at night.',
      ],
      formula: ['подлежащее + always/never + глагол', 'am/is/are + always/never', 'have / can + never + глагол'],
      examples: [['I usually get up at 7.', 'Обычно я встаю в 7.'], ['He is never on time.', 'Он никогда не приходит вовремя.'], ['We rarely watch TV.', 'Мы редко смотрим телевизор.']],
      mistakes: [['I go always to the gym.', 'I always go to the gym.', 'наречие — перед глаголом'], ['She always is busy.', 'She is always busy.', 'после to be']],
      drill: [
        { type: 'choice', question: 'Choose the correct sentence:', options: ['I drink often coffee.', 'I often drink coffee.', 'Often I coffee drink.', 'I drink coffee often always.'], answer: 1, explain: 'Наречие перед глаголом.' },
        { type: 'choice', question: 'Choose the correct sentence:', options: ['They are usually tired.', 'They usually are tired.', 'Usually they tired are.', 'They are tired usually always.'], answer: 0, explain: 'После to be.' },
      ],
    },
    {
      id: 'past-continuous', level: 'A2', title: 'Past Continuous: что происходило в момент',
      summary: '«Я готовила ужин, когда позвонил Дима».',
      theory: [
        '**was / were + V-ing** — действие, которое было **в процессе** в какой-то момент прошлого: At 8 p.m. I **was cooking**.',
        'Часто вместе с Past Simple: длинное действие (Continuous) прервало короткое (Simple): I **was walking** home when it **started** to rain.',
        '**while** — «в то время как», обычно с Continuous: **While** I was studying, my sister was watching TV.',
      ],
      formula: ['was / were + V-ing', 'длинное (Past Continuous) + when + короткое (Past Simple)'],
      examples: [['What were you doing at midnight?', 'Что ты делала в полночь?'], ['She was sleeping when I came.', 'Она спала, когда я пришла.'], ['While we were talking, the bus left.', 'Пока мы болтали, автобус уехал.']],
      mistakes: [['I was go home.', 'I was going home.', 'нужен -ing'], ['When I was arriving, he left.', 'When I arrived, he was leaving / he left.', 'короткие события — Past Simple']],
      drill: [
        { type: 'choice', question: 'I ___ a shower when the phone rang.', options: ['had', 'was having', 'have', 'am having'], answer: 1, explain: 'Длинное действие прервали → was having.' },
        { type: 'choice', question: 'While they ___, it started to snow.', options: ['walked', 'were walking', 'walk', 'was walking'], answer: 1, explain: 'they → were walking.' },
        { type: 'gap', sentence: 'What ___ you doing at 9 last night?', answer: 'were', explain: 'you → were.' },
      ],
    },
    {
      id: 'too-enough', level: 'A2', title: 'Too и enough',
      summary: '«Слишком дорого» и «достаточно тепло».',
      theory: [
        '**too + прилагательное** — «слишком» (обычно с оттенком «и поэтому нельзя»): It’s **too cold** to swim.',
        '**прилагательное + enough** — «достаточно»: She’s **old enough** to drive. Обрати внимание: enough **после** прилагательного.',
        '**enough + существительное** — перед ним: We don’t have **enough time**.',
        'Не путай **too** и **very**: very — просто «очень», too — «чересчур».',
      ],
      formula: ['too + adj (+ to V)', 'adj + enough', 'enough + noun'],
      examples: [['This bag is too heavy for me.', 'Эта сумка слишком тяжёлая для меня.'], ['Is the room warm enough?', 'В комнате достаточно тепло?'], ['I didn’t have enough money.', 'У меня не хватило денег.']],
      mistakes: [['enough good', 'good enough', 'enough — после прилагательного'], ['It’s too nice! (= очень)', 'It’s very nice!', 'too — это «чересчур»']],
      drill: [
        { type: 'choice', question: 'The coffee is ___ to drink.', options: ['enough hot', 'too hot', 'hot too', 'very hot enough'], answer: 1, explain: 'Слишком горячий → too hot.' },
        { type: 'choice', question: 'He isn’t ___ for the team.', options: ['enough tall', 'tall enough', 'too tall enough', 'enough tallness'], answer: 1, explain: 'adj + enough.' },
      ],
    },

    // ---------- B1 ----------
    {
      id: 'modals-deduction', level: 'B1', title: 'Догадки: must, might, can’t',
      summary: '«Наверное, она дома», «не может быть».',
      theory: [
        '**must** — почти уверена, что да: She’s not answering — she **must** be asleep.',
        '**might / may / could** — возможно: He **might** be at the library.',
        '**can’t** — почти уверена, что нет: That **can’t** be true!',
        'О прошлом — **модальный + have + V3**: She **must have forgotten**. They **might have missed** the bus. He **can’t have said** that.',
      ],
      formula: ['must (точно да) · might/may/could (возможно) · can’t (точно нет)', 'о прошлом: must/might/can’t + have + V3'],
      examples: [['You must be tired after the trip.', 'Ты, наверное, устала после поездки.'], ['It might rain later.', 'Позже, возможно, пойдёт дождь.'], ['She can’t have seen us.', 'Она не могла нас видеть.']],
      mistakes: [['He mustn’t be at home. (= наверное, нет)', 'He can’t be at home.', 'в догадках «нет» — can’t'], ['She must forgot.', 'She must have forgotten.', 'о прошлом — have + V3']],
      drill: [
        { type: 'choice', question: 'The lights are off. They ___ be at home.', options: ['must', 'can’t', 'should', 'have to'], answer: 1, explain: 'Почти уверены, что нет → can’t.' },
        { type: 'choice', question: 'I can’t find my keys. I ___ left them at work.', options: ['must have', 'must', 'can’t have', 'should'], answer: 0, explain: 'Догадка о прошлом → must have.' },
        { type: 'choice', question: 'Take an umbrella — it ___ rain.', options: ['must', 'can’t', 'might', 'mustn’t'], answer: 2, explain: 'Возможно → might.' },
      ],
    },
    {
      id: 'question-tags', level: 'B1', title: 'Разделительные вопросы: …, isn’t it?',
      summary: '«Хорошая погода, правда?»',
      theory: [
        'В конце утверждения добавляем короткий вопрос: утверждение **+**, хвостик **−** и наоборот: It’s cold, **isn’t it**? You don’t smoke, **do you**?',
        'Хвостик повторяет вспомогательный глагол: She **can** swim, **can’t** she? They **went** home, **didn’t** they?',
        'Особые случаи: I’m right, **aren’t I**? Let’s go, **shall we**?',
      ],
      formula: ['+ утверждение, − хвостик?', '− утверждение, + хвостик?'],
      examples: [['You’re a student, aren’t you?', 'Ты же студентка, да?'], ['He hasn’t called, has he?', 'Он ведь не звонил?'], ['Let’s have a break, shall we?', 'Давай сделаем перерыв?']],
      mistakes: [['She likes jazz, isn’t she?', 'She likes jazz, doesn’t she?', 'помощник — does'], ['I’m late, am not I?', 'I’m late, aren’t I?', 'особый случай']],
      drill: [
        { type: 'choice', question: 'You finished the essay, ___?', options: ['did you', 'didn’t you', 'don’t you', 'haven’t you'], answer: 1, explain: 'Past Simple, + → didn’t you.' },
        { type: 'choice', question: 'She can’t drive, ___?', options: ['can she', 'can’t she', 'does she', 'is she'], answer: 0, explain: '− → + can she.' },
      ],
    },
    {
      id: 'phrasal-verbs', level: 'B1', title: 'Фразовые глаголы: самые нужные',
      summary: 'give up, look for, find out — глагол + маленькое слово.',
      theory: [
        'Фразовый глагол = глагол + частица (up, out, on, off…), и смысл часто **меняется полностью**: give (дать) → **give up** (сдаться, бросить).',
        'Самые полезные: **find out** (узнать), **look for** (искать), **look after** (присматривать), **turn on/off** (включить/выключить), **put off** (отложить), **get up** (вставать), **figure out** (разобраться), **run out of** (закончиться).',
        'У многих дополнение может стоять в середине: turn **the light** off / turn off **the light**. Но если это местоимение — только в середине: turn **it** off (не turn off it).',
      ],
      formula: ['глагол + частица = новое значение', 'местоимение — в середину: put it off'],
      examples: [['I gave up sugar last month.', 'Я отказалась от сахара в прошлом месяце.'], ['Don’t put off your homework.', 'Не откладывай домашку.'], ['We ran out of coffee.', 'У нас закончился кофе.']],
      mistakes: [['Turn off it.', 'Turn it off.', 'местоимение — в середину'], ['I’m searching my keys.', 'I’m looking for my keys.', 'искать — look for']],
      drill: [
        { type: 'choice', question: 'Can you ___ my cat while I’m away?', options: ['look for', 'look after', 'look up', 'look out'], answer: 1, explain: 'Присматривать → look after.' },
        { type: 'choice', question: 'I need to ___ when the exam is.', options: ['find out', 'find up', 'give up', 'put off'], answer: 0, explain: 'Узнать → find out.' },
        { type: 'choice', question: 'The music is loud. Please ___.', options: ['turn down it', 'turn it down', 'turn it on', 'turn down'], answer: 1, explain: 'Местоимение в середину.' },
      ],
    },

    // ---------- B2 ----------
    {
      id: 'causative', level: 'B2', title: 'Have something done: сделать не сама',
      summary: '«Я подстриглась» = мне подстригли.',
      theory: [
        'Когда действие делает **кто-то другой для тебя**, используем **have / get + объект + V3**: I **had my hair cut**. We’re **getting the flat painted**.',
        'Время показывает глагол have: I’**m having** my laptop **repaired**. She **will have** the documents **translated**.',
        'Ещё так говорят о неприятностях: He **had** his phone **stolen**.',
      ],
      formula: ['have / get + что + V3', 'время — у глагола have'],
      examples: [['I need to have my eyes tested.', 'Мне надо проверить зрение.'], ['She got her nails done.', 'Она сделала маникюр.'], ['We had our car stolen last year.', 'В прошлом году у нас угнали машину.']],
      mistakes: [['I cut my hair at the hairdresser’s.', 'I had my hair cut.', 'если стригли тебя — have … done'], ['I had repaired my phone.', 'I had my phone repaired.', 'порядок: have + объект + V3']],
      drill: [
        { type: 'choice', question: 'I’m going to ___ tomorrow.', options: ['cut my hair', 'have my hair cut', 'have cut my hair', 'my hair cut'], answer: 1, explain: 'Стрижёт мастер → have my hair cut.' },
        { type: 'choice', question: 'She ___ her essay checked by a tutor.', options: ['had', 'did', 'made', 'was'], answer: 0, explain: 'have + объект + V3.' },
      ],
    },
    {
      id: 'mixed-conditionals', level: 'B2', title: 'Смешанные условные',
      summary: 'Прошлое влияет на настоящее — и наоборот.',
      theory: [
        'Иногда условие и результат в **разном времени**.',
        '**Прошлое → настоящее:** If I **had taken** the job, I **would be** in London now. (Не взяла работу тогда → сейчас не в Лондоне.)',
        '**Настоящее → прошлое:** If I **were** more organised, I **wouldn’t have missed** the deadline. (Я вообще неорганизованная → тогда пропустила дедлайн.)',
      ],
      formula: ['If + had V3, would + V (сейчас)', 'If + Past, would have + V3 (тогда)'],
      examples: [['If I had slept more, I wouldn’t be so tired now.', 'Если бы я больше спала, я бы сейчас не была такой уставшей.'], ['If she spoke English, she would have got the job.', 'Если бы она говорила по-английски, она бы получила ту работу.']],
      mistakes: [['If I had studied, I would have be a doctor now.', 'If I had studied, I would be a doctor now.', 'результат сейчас → would + V']],
      drill: [
        { type: 'choice', question: 'If I had saved money, I ___ a new laptop now.', options: ['would have', 'would have had', 'will have', 'had'], answer: 0, explain: 'Прошлое → сейчас: would + V.' },
        { type: 'choice', question: 'If he ___ so shy, he would have asked her out.', options: ['wasn’t', 'weren’t', 'hadn’t', 'isn’t'], answer: 1, explain: 'Черта характера сейчас → If + Past (were).' },
      ],
    },
    {
      id: 'articles-advanced', level: 'B2', title: 'Артикли: сложные случаи',
      summary: 'the + названия, «вообще» и «в частности».',
      theory: [
        '**the** с названиями: рек, морей, океанов, гор-цепей и стран-«объединений»: **the** Volga, **the** Alps, **the** USA, **the** UK. **Без** артикля: большинство стран, городов, улиц, отдельных гор и озёр: Russia, Kazan, Lake Baikal.',
        '«Вообще» про категорию — без артикля во мн. числе: **Dogs** are loyal. А про изобретения и виды — часто the + ед. число: **The smartphone** changed our lives.',
        'Устойчивые сочетания без артикля: go to **school / university / bed / work** (по назначению). Но: I went to **the** school to meet the teacher (просто как в здание).',
      ],
      formula: ['the + реки, моря, горные цепи, the USA/UK', 'без артикля: страны, города, улицы', 'go to school / bed / work — без артикля'],
      examples: [['We sailed down the Volga.', 'Мы плыли по Волге.'], ['She’s at university now.', 'Она сейчас в университете (учится).'], ['The bicycle was invented in the 19th century.', 'Велосипед изобрели в XIX веке.']],
      mistakes: [['the Russia', 'Russia', 'страны — обычно без артикля'], ['I go to the bed at 11.', 'I go to bed at 11.', 'устойчивое сочетание']],
      drill: [
        { type: 'choice', question: 'Have you ever been to ___ USA?', options: ['a', 'an', 'the', '—'], answer: 2, explain: 'the USA.' },
        { type: 'choice', question: '___ Lake Baikal is the deepest lake in the world.', options: ['The', 'A', '— (ничего)', 'An'], answer: 2, explain: 'Lake + название → без артикля.' },
        { type: 'choice', question: 'I’m tired, I’m going to ___ bed.', options: ['the', 'a', '—', 'my the'], answer: 2, explain: 'go to bed — без артикля.' },
      ],
    },

    // ---------- C1 ----------
    {
      id: 'inversion', level: 'C1', title: 'Инверсия для выразительности',
      summary: 'Never have I seen… — как в книгах.',
      theory: [
        'После некоторых отрицательных или ограничительных слов в **начале** предложения порядок меняется как в вопросе: **Never have I seen** such a view.',
        'Типичные: Never, Rarely, Seldom, Not only… but also, No sooner… than, Hardly… when, Only then, Under no circumstances.',
        'Пример: **Not only did she** pass the exam, **but** she **also** got the highest score. **Under no circumstances should you** share your password.',
        'Условные без if: **Had I known**, I would have helped. (= If I had known). **Should you need** help, call me.',
      ],
      formula: ['Never / Rarely / Not only + вспомогательный + подлежащее + глагол', 'Had I known… = If I had known…'],
      examples: [['Rarely do we get such a chance.', 'Редко нам выпадает такой шанс.'], ['No sooner had we arrived than it started to rain.', 'Не успели мы приехать, как пошёл дождь.'], ['Should you have any questions, contact us.', 'Если у вас возникнут вопросы, свяжитесь с нами.']],
      mistakes: [['Never I have seen…', 'Never have I seen…', 'после Never — инверсия'], ['Not only she passed…', 'Not only did she pass…', 'нужен вспомогательный did']],
      drill: [
        { type: 'choice', question: 'Seldom ___ such an honest answer.', options: ['I hear', 'do I hear', 'I do hear', 'hear I'], answer: 1, explain: 'Seldom в начале → do I hear.' },
        { type: 'choice', question: '___ I known, I would have come earlier.', options: ['If', 'Had', 'Have', 'Did'], answer: 1, explain: 'Had I known = If I had known.' },
      ],
    },
    {
      id: 'cleft', level: 'C1', title: 'Выделение: It was… that / What I need is…',
      summary: 'Как сделать акцент на главном.',
      theory: [
        '**It is / was … that / who …** выделяет одну часть: **It was Anna who** found the mistake (а не кто-то другой). **It’s the deadline that** worries me.',
        '**What … is / was …** — выделяет действие или вещь: **What I need is** a long holiday. **What surprised me was** his calmness.',
        '**All I want is…**, **The thing is…**, **The reason why… is that…** — тоже частые способы расставить акценты в речи и эссе.',
      ],
      formula: ['It + be + выделенное + that/who + остальное', 'What + подлежащее + глагол + be + выделенное'],
      examples: [['It was in Kazan that we first met.', 'Именно в Казани мы впервые встретились.'], ['What I love about this city is the river.', 'Что я люблю в этом городе — это реку.'], ['All I need is some sleep.', 'Всё, что мне нужно, — немного поспать.']],
      mistakes: [['It was Anna which found it.', 'It was Anna who found it.', 'про людей — who/that'], ['What I need it is…', 'What I need is…', 'без лишнего it']],
      drill: [
        { type: 'choice', question: '___ I don’t understand is why he left.', options: ['That', 'What', 'Which', 'It'], answer: 1, explain: 'What … is …' },
        { type: 'choice', question: 'It was my sister ___ told me the news.', options: ['which', 'what', 'who', 'whom'], answer: 2, explain: 'Человек → who.' },
      ],
    },
  ];

  window.GRAMMAR = (window.GRAMMAR || []).concat(more);
})();
