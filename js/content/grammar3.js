// Справочник грамматики, часть 3: дополнительные темы A1–B1.
// Тексты написаны специально для этого проекта.
(function () {
  'use strict';

  const more = [
    // ---------- A1 ----------
    {
      id: 'numbers-time', level: 'A1', title: 'Числа, даты и время',
      summary: 'Как сказать время, дату и год.',
      theory: [
        'Порядковые числительные: first (1st), second (2nd), third (3rd), fourth (4th)… twentieth (20th), twenty-first (21st). В датах говорим **the** + порядковое: **the fifth of May** или **May the fifth**.',
        'Годы читаем парами: 1998 — **nineteen ninety-eight**, 2025 — **twenty twenty-five** (или two thousand and twenty-five).',
        'Время: 7:00 — **seven o’clock**; 7:15 — **quarter past seven**; 7:30 — **half past seven**; 7:45 — **quarter to eight**; 7:10 — ten past seven; 7:50 — ten to eight. Можно и цифрами: seven fifteen.',
        'a.m. — до полудня, p.m. — после полудня: 9 p.m. = 21:00.',
      ],
      formula: ['past — «после» (до :30) · to — «до» (после :30)', 'the + порядковое в датах: the 3rd of June'],
      examples: [['My birthday is on the 3rd of June.', 'Мой день рождения 3 июня.'], ['It’s quarter to nine.', 'Без пятнадцати девять.'], ['She was born in 2004.', 'Она родилась в 2004 году.']],
      mistakes: [['It’s half past of seven.', 'It’s half past seven.', 'без of'], ['on 5 May (читаем «five May»)', 'the fifth of May', 'в дате — порядковое']],
      drill: [
        { type: 'choice', question: '8:45 is…', options: ['quarter past eight', 'quarter to nine', 'half past eight', 'eight to quarter'], answer: 1, explain: 'Без пятнадцати девять → quarter to nine.' },
        { type: 'choice', question: '21st is read as…', options: ['twenty-one', 'twenty-first', 'twentieth-first', 'twenty-oneth'], answer: 1, explain: '21st → twenty-first.' },
        { type: 'choice', question: '6:30 is…', options: ['half to seven', 'half past six', 'six and half', 'thirty to seven'], answer: 1, explain: 'half past six.' },
      ],
    },
    {
      id: 'demonstratives', level: 'A1', title: 'This, that, these, those',
      summary: 'Этот, тот, эти, те.',
      theory: [
        '**this** — этот (близко, ед. ч.), **these** — эти (близко, мн. ч.).',
        '**that** — тот (далеко, ед. ч.), **those** — те (далеко, мн. ч.).',
        'Так же говорим о времени: this week (эта неделя), those days (те дни). И при знакомстве по телефону: **This is** Anna (Это Аня).',
      ],
      formula: ['близко: this (1) / these (много)', 'далеко: that (1) / those (много)'],
      examples: [['Is this your bag?', 'Это твоя сумка?'], ['Those shoes are beautiful!', 'Те туфли прекрасны!'], ['These are my friends.', 'Это мои друзья.']],
      mistakes: [['This books are new.', 'These books are new.', 'мн. число → these'], ['That are my keys.', 'Those are my keys.', 'мн. число → those']],
      drill: [
        { type: 'choice', question: '___ apples here are sweet.', options: ['This', 'That', 'These', 'Those'], answer: 2, explain: 'Близко + мн. ч. → these.' },
        { type: 'choice', question: 'Look at ___ star over there!', options: ['this', 'that', 'these', 'those'], answer: 1, explain: 'Далеко + ед. ч. → that.' },
      ],
    },
    {
      id: 'have-got', level: 'A1', title: 'Have / have got: у меня есть',
      summary: '«У меня есть кот» по-английски.',
      theory: [
        'В английском «у меня есть» = «я имею»: **I have** a cat. В британском разговорном — **I’ve got** a cat. Смысл одинаковый.',
        'С he/she/it: **has** / **has got**: She has a car. She’s got a car.',
        'Отрицание и вопрос: **I don’t have** / **I haven’t got**; **Do you have…?** / **Have you got…?**',
        'В значении действий (have breakfast, have a shower, have fun) **have got** не используется.',
      ],
      formula: ['I/you/we/they have (got) · he/she/it has (got)', 'Do you have…? = Have you got…?'],
      examples: [['I have two brothers.', 'У меня два брата.'], ['Have you got a pen?', 'У тебя есть ручка?'], ['She doesn’t have time today.', 'У неё сегодня нет времени.']],
      mistakes: [['She have a dog.', 'She has a dog.', 'she → has'], ['I have got breakfast at 8.', 'I have breakfast at 8.', 'have breakfast — действие, без got']],
      drill: [
        { type: 'choice', question: 'My sister ___ long hair.', options: ['have', 'has', 'have got', 'is'], answer: 1, explain: 'she → has.' },
        { type: 'choice', question: '___ you got any brothers?', options: ['Do', 'Have', 'Are', 'Has'], answer: 1, explain: 'Have you got…?' },
        { type: 'choice', question: 'We usually ___ lunch at one.', options: ['have got', 'have', 'has', 'got'], answer: 1, explain: 'Действие → have lunch.' },
      ],
    },
    {
      id: 'imperative', level: 'A1', title: 'Повелительное наклонение',
      summary: 'Просьбы, советы, инструкции.',
      theory: [
        'Глагол в начальной форме без подлежащего: **Open** the window. **Sit** down, please.',
        'Отрицание — **Don’t** + глагол: **Don’t worry!** **Don’t be** late.',
        'Предложение что-то сделать вместе — **Let’s** + глагол: **Let’s go!** **Let’s not** argue.',
        'Чтобы звучало вежливее, добавляем please или используем вопрос: **Could you** open the window, please?',
      ],
      formula: ['V! · Don’t + V! · Let’s + V!', 'вежливо: Could you…, please?'],
      examples: [['Turn left at the corner.', 'На углу поверните налево.'], ['Don’t forget your umbrella!', 'Не забудь зонт!'], ['Let’s have a break.', 'Давай сделаем перерыв.']],
      mistakes: [['Not worry!', 'Don’t worry!', 'отрицание — don’t'], ['Let’s to go!', 'Let’s go!', 'после let’s — без to']],
      drill: [
        { type: 'choice', question: '___ touch the oven — it’s hot!', options: ['Not', 'No', 'Don’t', 'Doesn’t'], answer: 2, explain: 'Запрет → Don’t.' },
        { type: 'choice', question: 'Let’s ___ a pizza tonight.', options: ['order', 'to order', 'ordering', 'orders'], answer: 0, explain: 'Let’s + V.' },
      ],
    },
    {
      id: 'pronouns', level: 'A1', title: 'Местоимения: I – me – my – mine – myself',
      summary: 'Пять форм одного местоимения.',
      theory: [
        'Подлежащее: **I, you, he, she, it, we, they**. Дополнение (меня, ему…): **me, you, him, her, it, us, them** — после глаголов и предлогов: Call **me**. Come with **us**.',
        'Перед существительным: **my, your, his, her, its, our, their** (my book). Без существительного: **mine, yours, his, hers, ours, theirs** (The book is **mine**).',
        'Возвратные: **myself, yourself, himself, herself, itself, ourselves, yourselves, themselves** — «сам/себя»: I did it **myself**. Enjoy **yourself**!',
      ],
      formula: ['I → me → my → mine → myself', 'she → her → her → hers → herself', 'they → them → their → theirs → themselves'],
      examples: [['Can you help me?', 'Можешь мне помочь?'], ['Is this pen yours?', 'Это твоя ручка?'], ['She taught herself to code.', 'Она сама научилась программировать.']],
      mistakes: [['Me and Anna went…', 'Anna and I went…', 'подлежащее → I'], ['This is mine book.', 'This is my book. / This book is mine.', 'перед существительным — my']],
      drill: [
        { type: 'choice', question: 'I gave ___ my notes.', options: ['she', 'her', 'hers', 'herself'], answer: 1, explain: 'Дополнение → her.' },
        { type: 'choice', question: 'Whose jacket is it? — It’s ___.', options: ['my', 'me', 'mine', 'myself'], answer: 2, explain: 'Без существительного → mine.' },
        { type: 'choice', question: 'They built the website ___.', options: ['theirs', 'them', 'themselves', 'their'], answer: 2, explain: 'Сами → themselves.' },
      ],
    },

    // ---------- A2 ----------
    {
      id: 'prepositions-place', level: 'A2', title: 'Предлоги места: in, on, at, under…',
      summary: 'Где что находится.',
      theory: [
        '**in** — внутри: in the box, in the room, in Moscow. **on** — на поверхности: on the table, on the wall, on the second floor. **at** — в точке, у места: at the door, at the bus stop, at university, at home.',
        'Другие: **under** (под), **above/over** (над), **next to / beside** (рядом), **between** (между двумя), **behind** (позади), **in front of** (перед), **opposite** (напротив).',
        'Устойчивые: on the bus/train (в транспорте), in a car, at work, at school, in bed, on the internet.',
      ],
      formula: ['in — внутри · on — на поверхности · at — у точки', 'on the bus / in a car · at home / at work'],
      examples: [['The keys are on the table.', 'Ключи на столе.'], ['I’ll wait for you at the entrance.', 'Подожду тебя у входа.'], ['The café is opposite the library.', 'Кафе напротив библиотеки.']],
      mistakes: [['in the bus', 'on the bus', 'в общественном транспорте — on'], ['I’m in home.', 'I’m at home.', 'at home']],
      drill: [
        { type: 'choice', question: 'There’s a picture ___ the wall.', options: ['in', 'on', 'at', 'under'], answer: 1, explain: 'На стене → on.' },
        { type: 'choice', question: 'Let’s meet ___ the bus stop.', options: ['in', 'on', 'at', 'between'], answer: 2, explain: 'У точки → at.' },
        { type: 'choice', question: 'I read a lot ___ the train.', options: ['in', 'on', 'at', 'by'], answer: 1, explain: 'on the train.' },
      ],
    },
    {
      id: 'adverbs', level: 'A2', title: 'Прилагательное или наречие: quick — quickly',
      summary: 'Какой? и Как?',
      theory: [
        'Прилагательное описывает **существительное** (какой?): a **quick** answer. Наречие описывает **действие** (как?): She answered **quickly**.',
        'Наречие обычно = прилагательное + **-ly**: careful → carefully, easy → easily, happy → happily.',
        'Исключения: good → **well**, fast → **fast**, hard → **hard** (hardly = «едва»), late → **late** (lately = «в последнее время»).',
        'После глаголов-состояний (be, look, feel, sound, smell, taste) — **прилагательное**: You look **tired**. It sounds **good**.',
      ],
      formula: ['adj + -ly = adverb', 'good → well · fast → fast · hard → hard', 'look / feel / sound + adj'],
      examples: [['She speaks English fluently.', 'Она бегло говорит по-английски.'], ['He works hard.', 'Он усердно работает.'], ['This soup tastes great.', 'Этот суп отличный на вкус.']],
      mistakes: [['She sings good.', 'She sings well.', 'как? → well'], ['I feel badly.', 'I feel bad.', 'после feel — прилагательное']],
      drill: [
        { type: 'choice', question: 'He drives very ___.', options: ['careful', 'carefully', 'care', 'carefuly'], answer: 1, explain: 'Как водит? → carefully.' },
        { type: 'choice', question: 'You did the test really ___!', options: ['good', 'well', 'goodly', 'nice'], answer: 1, explain: 'good → well.' },
        { type: 'choice', question: 'The cake smells ___.', options: ['wonderfully', 'wonderful', 'wonder', 'wonderly'], answer: 1, explain: 'После smell — прилагательное.' },
      ],
    },
    {
      id: 'linking-basic', level: 'A2', title: 'Связки: and, but, because, so, or',
      summary: 'Как соединять мысли.',
      theory: [
        '**and** — и, добавляем: I like tea **and** coffee. **but** — но, противопоставление: It’s cheap **but** good. **or** — или.',
        '**because** — потому что (причина): I stayed home **because** I was tired. **so** — поэтому (следствие): I was tired, **so** I stayed home.',
        'Не путай: because + причина, so + результат.',
      ],
      formula: ['причина: because … · результат: …, so …', 'and — и · but — но · or — или'],
      examples: [['I was late because the bus broke down.', 'Я опоздала, потому что сломался автобус.'], ['It was raining, so we took a taxi.', 'Шёл дождь, поэтому мы взяли такси.']],
      mistakes: [['Because I was tired, so I slept.', 'Because I was tired, I slept. / I was tired, so I slept.', 'because и so вместе не нужны']],
      drill: [
        { type: 'choice', question: 'I didn’t go out ___ I had a lot of homework.', options: ['so', 'because', 'but', 'or'], answer: 1, explain: 'Причина → because.' },
        { type: 'choice', question: 'The film was long, ___ it was interesting.', options: ['but', 'so', 'because', 'or'], answer: 0, explain: 'Противопоставление → but.' },
        { type: 'choice', question: 'I missed the bus, ___ I walked.', options: ['because', 'so', 'or', 'but'], answer: 1, explain: 'Результат → so.' },
      ],
    },
    {
      id: 'present-cont-future', level: 'A2', title: 'Present Continuous о будущем',
      summary: '«Завтра я встречаюсь с подругой».',
      theory: [
        'Если о будущем уже **договорились** (есть время, место, билеты), часто используют Present Continuous: I**’m meeting** Dasha tomorrow at 6. We**’re flying** to Sochi on Friday.',
        'Это звучит естественнее, чем will, когда план уже конкретный.',
        'Обязательно указываем время (tomorrow, on Friday, next week), иначе поймут как «прямо сейчас».',
      ],
      formula: ['am/is/are + V-ing + время в будущем = договорённость'],
      examples: [['What are you doing this weekend?', 'Что делаешь на выходных?'], ['I’m seeing the doctor on Monday.', 'В понедельник я иду к врачу.']],
      mistakes: [['I will meet Dasha tomorrow (договорились).', 'I’m meeting Dasha tomorrow.', 'договорённость → Continuous']],
      drill: [
        { type: 'choice', question: 'I can’t come on Saturday — I ___ my grandma.', options: ['visit', 'am visiting', 'visited', 'have visited'], answer: 1, explain: 'Договорённость → am visiting.' },
        { type: 'choice', question: 'What time ___ you leaving tomorrow?', options: ['do', 'are', 'will', 'have'], answer: 1, explain: 'Continuous → are you leaving.' },
      ],
    },

    // ---------- B1 ----------
    {
      id: 'present-perfect-cont', level: 'B1', title: 'Present Perfect Continuous',
      summary: '«Я учу английский уже три года» и «я весь день бегала».',
      theory: [
        '**have/has been + V-ing** — действие началось в прошлом и **длится до сих пор** (или только что закончилось и виден след): I**’ve been learning** English for three years. You look tired — **have you been running**?',
        'Сравни с Present Perfect: **Perfect Continuous** — про процесс и длительность (how long?), **Present Perfect** — про результат и количество (how many?): I’ve been writing my thesis all day. I’ve written ten pages.',
        'Глаголы состояния (know, like, have в значении «иметь») в Continuous не ставим: I’ve **known** her for years.',
      ],
      formula: ['have/has been + V-ing (+ for / since)', 'процесс → Continuous · результат → Perfect'],
      examples: [['It has been raining since morning.', 'Дождь идёт с утра.'], ['How long have you been waiting?', 'Как долго ты ждёшь?'], ['I’ve been reading this book for a week, and I’ve read 200 pages.', 'Читаю эту книгу неделю и прочитала 200 страниц.']],
      mistakes: [['I learn English for 3 years.', 'I’ve been learning English for 3 years.', 'длится до сих пор'], ['I’ve been knowing her…', 'I’ve known her…', 'know — без -ing']],
      drill: [
        { type: 'choice', question: 'She ___ for two hours. She needs a break.', options: ['studies', 'has been studying', 'studied', 'is study'], answer: 1, explain: 'Длительность до сих пор → has been studying.' },
        { type: 'choice', question: 'I ___ three emails this morning.', options: ['have been writing', 'have written', 'write', 'am writing'], answer: 1, explain: 'Количество/результат → have written.' },
        { type: 'choice', question: 'We ___ each other since childhood.', options: ['have been knowing', 'have known', 'know', 'knew'], answer: 1, explain: 'know — глагол состояния.' },
      ],
    },
    {
      id: 'so-such', level: 'B1', title: 'So и such',
      summary: '«Такой красивый день» и «так красиво».',
      theory: [
        '**so + прилагательное / наречие**: It’s **so** cold! She speaks **so** fast.',
        '**such + (a/an) + (прилагательное) + существительное**: It’s **such a** cold day! They’re **such** nice people.',
        'Часто с that — «настолько…, что»: It was **so** hot **that** we stayed inside. It was **such** a hot day **that**…',
        'so much / so many + существительное: I have **so much** work!',
      ],
      formula: ['so + adj/adv', 'such (a/an) + adj + noun', '… that … — настолько, что'],
      examples: [['The film was so boring!', 'Фильм был таким скучным!'], ['It was such a good idea.', 'Это была такая хорошая идея.'], ['There were so many people.', 'Там было так много людей.']],
      mistakes: [['It was so a nice day.', 'It was such a nice day.', 'с существительным — such'], ['such interesting', 'so interesting', 'без существительного — so']],
      drill: [
        { type: 'choice', question: 'She’s ___ kind person.', options: ['so', 'such a', 'so a', 'such'], answer: 1, explain: 'с существительным → such a.' },
        { type: 'choice', question: 'I’m ___ tired that I can’t think.', options: ['such', 'so', 'such a', 'too'], answer: 1, explain: 'с прилагательным → so.' },
      ],
    },
    {
      id: 'quantifiers', level: 'B1', title: 'All, both, either, neither, each, every',
      summary: 'Все, оба, ни один, каждый.',
      theory: [
        '**both** — оба (из двух): **Both** my parents work. **either** — любой из двух / тоже нет (в отрицаниях): You can take **either** bus. **neither** — ни один из двух: **Neither** answer is correct.',
        '**all** — все (из многих): **All** students passed. **none** — никто/ничто из многих.',
        '**each** и **every** + единственное число: **every** student **has** a laptop. each — подчёркивает «каждый по отдельности», every — «все без исключения».',
        'После neither / either of + мн. ч.: Neither **of them** knows.',
      ],
      formula: ['из двух: both / either / neither', 'из многих: all / none / every / each', 'every/each + ед. ч.'],
      examples: [['Both answers are possible.', 'Оба ответа возможны.'], ['Neither of us was ready.', 'Никто из нас (двоих) не был готов.'], ['Every room has a balcony.', 'В каждом номере есть балкон.']],
      mistakes: [['Every students have…', 'Every student has…', 'every + ед. ч.'], ['The both…', 'Both…', 'без the']],
      drill: [
        { type: 'choice', question: 'I have two sisters. ___ live in Moscow.', options: ['All', 'Every', 'Both', 'Either'], answer: 2, explain: 'Из двух → both.' },
        { type: 'choice', question: '___ of the two options is good. Let’s think again.', options: ['Both', 'Neither', 'All', 'Every'], answer: 1, explain: 'Ни один из двух → neither.' },
        { type: 'choice', question: '___ child gets a present.', options: ['All', 'Every', 'Both', 'Neither'], answer: 1, explain: 'every + ед. ч.' },
      ],
    },
    {
      id: 'indirect-questions', level: 'B1', title: 'Вежливые (косвенные) вопросы',
      summary: 'Do you know where…? Could you tell me…?',
      theory: [
        'Чтобы вопрос звучал вежливо, его начинают с **Could you tell me…? / Do you know…? / I wonder…**',
        'После такого начала порядок слов — **прямой**, как в утверждении: Where **is the station**? → Could you tell me where **the station is**?',
        'Вспомогательные do/does/did исчезают: What time **does the shop open**? → Do you know what time **the shop opens**?',
        'Для да/нет — **if / whether**: Is she coming? → Do you know **if** she’s coming?',
      ],
      formula: ['Could you tell me / Do you know + wh- + подлежащее + глагол', 'да/нет → if / whether'],
      examples: [['Could you tell me where the toilet is?', 'Не подскажете, где туалет?'], ['Do you know when the exam starts?', 'Ты не знаешь, когда начинается экзамен?'], ['I wonder if it will rain.', 'Интересно, пойдёт ли дождь.']],
      mistakes: [['Can you tell me where is the bank?', 'Can you tell me where the bank is?', 'прямой порядок'], ['Do you know what time does it start?', 'Do you know what time it starts?', 'без does']],
      drill: [
        { type: 'choice', question: 'Could you tell me how much ___?', options: ['does it cost', 'it costs', 'costs it', 'is it cost'], answer: 1, explain: 'Прямой порядок: it costs.' },
        { type: 'choice', question: 'Do you know ___ he is married?', options: ['that', 'if', 'what', 'does'], answer: 1, explain: 'да/нет → if.' },
      ],
    },
    {
      id: 'make-do-say-tell', level: 'B1', title: 'Make vs do, say vs tell',
      summary: 'Пары, которые все путают.',
      theory: [
        '**do** — деятельность, работа, «делать вообще»: do homework, do sport, do the dishes, do a course, do your best, do business.',
        '**make** — создавать, производить результат: make a cake, make a mistake, make a decision, make money, make friends, make a plan, make noise.',
        '**say** — сказать что-то (без адресата или с to): She **said** (that) she was tired. Say hello **to** her.',
        '**tell** — сказать **кому-то** (адресат сразу после глагола): She **told me** she was tired. Также: tell a story, tell the truth, tell a lie, tell a joke.',
      ],
      formula: ['do — деятельность · make — результат', 'say (to someone) · tell + someone'],
      examples: [['I made a mistake in the test.', 'Я ошиблась в тесте.'], ['Have you done your homework?', 'Ты сделала домашку?'], ['Tell me the truth.', 'Скажи мне правду.']],
      mistakes: [['do a mistake', 'make a mistake', 'устойчивое: make a mistake'], ['She said me…', 'She told me… / She said to me…', 'tell + кому']],
      drill: [
        { type: 'choice', question: 'Let’s ___ a decision today.', options: ['do', 'make', 'take', 'say'], answer: 1, explain: 'make a decision.' },
        { type: 'choice', question: 'I need to ___ the shopping.', options: ['make', 'do', 'tell', 'say'], answer: 1, explain: 'do the shopping.' },
        { type: 'choice', question: 'He ___ us a funny story.', options: ['said', 'told', 'spoke', 'talked'], answer: 1, explain: 'tell a story.' },
      ],
    },
    {
      id: 'verb-patterns', level: 'B1', title: 'Let, make, help, want someone to…',
      summary: '«Мама разрешила мне…», «он заставил меня…».',
      theory: [
        '**let / make + кто + V (без to)**: My parents **let me go** to the party. The teacher **made us rewrite** the essay.',
        '**help + кто + (to) V**: можно и с to, и без: She helped me (to) find a flat.',
        '**want / ask / tell / expect / advise + кто + to V**: I **want you to know**. He **asked me to wait**. (не I want that you know)',
      ],
      formula: ['let / make + obj + V', 'help + obj + (to) V', 'want / ask / tell + obj + to V'],
      examples: [['Don’t let him lie to you.', 'Не позволяй ему врать тебе.'], ['This song makes me cry.', 'От этой песни я плачу.'], ['I’d like you to meet my sister.', 'Хочу познакомить тебя с сестрой.']],
      mistakes: [['I want that you come.', 'I want you to come.', 'want + кого + to V'], ['She made me to wait.', 'She made me wait.', 'после make — без to']],
      drill: [
        { type: 'choice', question: 'My boss let me ___ early.', options: ['to leave', 'leave', 'leaving', 'left'], answer: 1, explain: 'let + V без to.' },
        { type: 'choice', question: 'She asked me ___ her.', options: ['help', 'helping', 'to help', 'that I help'], answer: 2, explain: 'ask + obj + to V.' },
      ],
    },
    {
      id: 'dependent-prepositions', level: 'B1', title: 'Предлоги после слов: interested in, depend on',
      summary: 'Сочетания, которые просто нужно запомнить.',
      theory: [
        'Многие прилагательные и глаголы требуют определённого предлога, и он часто не совпадает с русским.',
        'Прилагательные: interested **in**, good/bad **at**, afraid **of**, proud **of**, tired **of**, keen **on**, famous **for**, responsible **for**, different **from**, similar **to**, married **to**.',
        'Глаголы: depend **on**, listen **to**, wait **for**, look **for**, look **at**, belong **to**, agree **with** (someone) / **on** (something), apologise **for**, concentrate **on**, believe **in**, think **about/of**.',
        'Если после предлога идёт глагол — он в **-ing**: I’m good at **drawing**.',
      ],
      formula: ['interested in · good at · afraid of · depend on · listen to · wait for', 'предлог + V-ing'],
      examples: [['I’m really interested in psychology.', 'Мне очень интересна психология.'], ['It depends on the weather.', 'Это зависит от погоды.'], ['She’s afraid of flying.', 'Она боится летать.']],
      mistakes: [['depend from', 'depend on', 'по-английски — on'], ['married with', 'married to', 'замужем за — to'], ['listen music', 'listen to music', 'нужен to']],
      drill: [
        { type: 'choice', question: 'I’m not very good ___ maths.', options: ['in', 'at', 'on', 'for'], answer: 1, explain: 'good at.' },
        { type: 'choice', question: 'We’re waiting ___ the results.', options: ['to', 'on', 'for', 'at'], answer: 2, explain: 'wait for.' },
        { type: 'choice', question: 'This city is famous ___ its architecture.', options: ['of', 'for', 'with', 'by'], answer: 1, explain: 'famous for.' },
      ],
    },
  ];

  window.GRAMMAR = (window.GRAMMAR || []).concat(more);
})();
