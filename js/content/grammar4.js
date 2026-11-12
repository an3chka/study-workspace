// Справочник грамматики, часть 4: B2–C1 и неправильные глаголы.
// Тексты написаны специально для этого проекта.
(function () {
  'use strict';

  const more = [
    // ---------- B2 ----------
    {
      id: 'past-perfect-cont', level: 'B2', title: 'Past Perfect Continuous',
      summary: '«Я ждала уже час, когда он пришёл».',
      theory: [
        '**had been + V-ing** — действие длилось какое-то время **до момента в прошлом**: I **had been waiting** for an hour when he finally arrived.',
        'Часто объясняет причину состояния в прошлом: Her eyes were red — she **had been crying**.',
        'Сравни: Past Perfect — результат к моменту в прошлом (I had finished), Past Perfect Continuous — процесс, длительность (I had been working for hours).',
      ],
      formula: ['had been + V-ing (+ for / since)', 'процесс до момента в прошлом'],
      examples: [['We had been driving for six hours before we stopped.', 'Мы ехали шесть часов, прежде чем остановились.'], ['The ground was wet because it had been raining.', 'Земля была мокрой, потому что шёл дождь.']],
      mistakes: [['I was waiting for an hour when he came.', 'I had been waiting for an hour when he came.', 'длительность до момента в прошлом']],
      drill: [
        { type: 'choice', question: 'She was exhausted because she ___ all night.', options: ['studied', 'had been studying', 'has been studying', 'was study'], answer: 1, explain: 'Процесс до момента в прошлом.' },
        { type: 'choice', question: 'How long ___ there before you got the job?', options: ['had you been working', 'have you worked', 'did you work', 'were you worked'], answer: 0, explain: 'Длительность до момента в прошлом.' },
      ],
    },
    {
      id: 'future-perfect', level: 'B2', title: 'Future Continuous и Future Perfect',
      summary: '«Завтра в это время я буду лететь» и «к пятнице я закончу».',
      theory: [
        '**Future Continuous: will be + V-ing** — действие будет в процессе в момент в будущем: This time tomorrow I**’ll be flying** to Istanbul.',
        'Ещё — вежливый вопрос о планах: **Will you be using** the laptop tonight?',
        '**Future Perfect: will have + V3** — действие будет **завершено к** моменту в будущем: By Friday I**’ll have finished** the report.',
        '**Future Perfect Continuous: will have been + V-ing** — сколько будет длиться к моменту: In June I’ll have been working here for two years.',
      ],
      formula: ['will be + V-ing — в процессе в будущем', 'will have + V3 — завершится к…', 'by + время — «к»'],
      examples: [['Don’t call at 8 — I’ll be having dinner.', 'Не звони в 8 — я буду ужинать.'], ['By the time you arrive, we’ll have eaten.', 'К твоему приходу мы уже поедим.']],
      mistakes: [['By Friday I will finish.', 'By Friday I will have finished.', 'с by — Future Perfect']],
      drill: [
        { type: 'choice', question: 'By 2030 she ___ her PhD.', options: ['will finish', 'will have finished', 'finishes', 'will be finishing'], answer: 1, explain: 'К моменту → will have finished.' },
        { type: 'choice', question: 'At 10 a.m. tomorrow I ___ an exam.', options: ['will take', 'will be taking', 'will have taken', 'take'], answer: 1, explain: 'В процессе → will be taking.' },
      ],
    },
    {
      id: 'passive-advanced', level: 'B2', title: 'Пассив: it is said that…',
      summary: '«Говорят, что…», «Считается, что…».',
      theory: [
        'Чтобы передать мнение «людей вообще», используют пассив с глаголами say, believe, think, expect, report, know: **It is said that** the castle is haunted.',
        'Второй вариант — с подлежащим и инфинитивом: The castle **is said to be** haunted. He **is believed to have left** the country (о прошлом — to have + V3).',
        'Пассив с модальными: The task **must be done** today. It **can’t be fixed**.',
      ],
      formula: ['It is said / believed / expected that…', 'Subject + is said + to V / to have V3', 'modal + be + V3'],
      examples: [['It is believed that the painting is a fake.', 'Считается, что картина — подделка.'], ['She is said to be a great teacher.', 'Говорят, она прекрасный преподаватель.'], ['The results will be published next week.', 'Результаты опубликуют на следующей неделе.']],
      mistakes: [['He is said that he is rich.', 'He is said to be rich. / It is said that he is rich.', 'не смешиваем две конструкции']],
      drill: [
        { type: 'choice', question: 'The company ___ to be planning layoffs.', options: ['says', 'is said', 'said', 'is saying'], answer: 1, explain: 'is said to…' },
        { type: 'choice', question: 'The thief is believed ___ the city yesterday.', options: ['to leave', 'to have left', 'leaving', 'left'], answer: 1, explain: 'О прошлом → to have + V3.' },
      ],
    },
    {
      id: 'participle-clauses', level: 'B2', title: 'Причастные обороты',
      summary: 'Короче и элегантнее: Having finished…, Feeling tired…',
      theory: [
        'Вместо придаточного можно использовать причастие, если подлежащее то же: **Feeling tired**, I went to bed (= Because I felt tired…).',
        '**Having + V3** — действие раньше другого: **Having finished** the essay, she went out (= After she had finished…).',
        'Причастие прошедшего времени — пассивное значение: **Written** in 1866, the novel is still popular (= It was written…).',
        'Важно: подлежащее у оборота и у главной части должно совпадать, иначе выйдет смешно: ~~Walking down the street, the rain started~~.',
      ],
      formula: ['V-ing… , main clause — одновременно / причина', 'Having V3… — сначала одно, потом другое', 'V3… — пассив'],
      examples: [['Not knowing what to say, I smiled.', 'Не зная, что сказать, я улыбнулась.'], ['Having lived in Spain, she speaks Spanish well.', 'Прожив в Испании, она хорошо говорит по-испански.'], ['Built in 1900, the house needs repairs.', 'Построенный в 1900 году, дом требует ремонта.']],
      mistakes: [['Walking home, the rain started.', 'While I was walking home, it started to rain.', 'подлежащие должны совпадать']],
      drill: [
        { type: 'choice', question: '___ the instructions, she started the experiment.', options: ['Read', 'Having read', 'Being read', 'To read'], answer: 1, explain: 'Сначала прочитала → Having read.' },
        { type: 'choice', question: '___ by a famous architect, the building attracts tourists.', options: ['Designing', 'Designed', 'Having designed', 'Design'], answer: 1, explain: 'Пассивное значение → Designed.' },
      ],
    },
    {
      id: 'unless-provided', level: 'B2', title: 'Unless, provided, as long as, in case',
      summary: 'Альтернативы if.',
      theory: [
        '**unless** = if not: We’ll go **unless** it rains (= if it doesn’t rain). После unless — утверждение, без not.',
        '**provided (that) / as long as** — «при условии, что»: You can borrow it **as long as** you return it tomorrow.',
        '**in case** — «на случай, если» (подготовка заранее): Take an umbrella **in case** it rains. (Это не то же самое, что if!)',
        '**otherwise** — «иначе»: Hurry up, **otherwise** we’ll be late.',
      ],
      formula: ['unless = if not', 'as long as / provided = при условии', 'in case — на всякий случай'],
      examples: [['I won’t go unless you come with me.', 'Я не пойду, если ты не пойдёшь со мной.'], ['Save your work in case the laptop crashes.', 'Сохраняй работу на случай, если ноутбук зависнет.']],
      mistakes: [['unless you don’t study', 'unless you study / if you don’t study', 'двойное отрицание'], ['Take a coat if it gets cold (заранее).', 'Take a coat in case it gets cold.', 'на всякий случай — in case']],
      drill: [
        { type: 'choice', question: 'You’ll fail ___ you start working now.', options: ['if', 'unless', 'in case', 'as long as'], answer: 1, explain: 'если не начнёшь → unless.' },
        { type: 'choice', question: 'Write down my number ___ you get lost.', options: ['unless', 'in case', 'provided', 'otherwise'], answer: 1, explain: 'на всякий случай → in case.' },
      ],
    },
    {
      id: 'modal-perfect', level: 'B2', title: 'Should have, could have, would have',
      summary: 'Сожаления и упрёки о прошлом.',
      theory: [
        '**should have + V3** — надо было (но не сделали): I **should have studied** more. **shouldn’t have** — не надо было (но сделали): You **shouldn’t have said** that.',
        '**could have + V3** — могла бы (была возможность, но не воспользовались): You **could have called** me!',
        '**would have + V3** — сделала бы (при других условиях): I **would have helped** if I had known.',
        '**needn’t have + V3** — зря сделала, не было необходимости: You **needn’t have bought** flowers.',
      ],
      formula: ['should(n’t) have V3 — надо было / не надо было', 'could have V3 — могла бы', 'would have V3 — сделала бы'],
      examples: [['We should have left earlier.', 'Надо было выйти раньше.'], ['You could have told me!', 'Могла бы мне сказать!'], ['I wouldn’t have worried so much.', 'Я бы так не переживала.']],
      mistakes: [['I should studied.', 'I should have studied.', 'нужен have + V3'], ['should of', 'should have', 'of — ошибка на слух']],
      drill: [
        { type: 'choice', question: 'I’m so tired. I ___ to bed earlier.', options: ['should go', 'should have gone', 'must have gone', 'could go'], answer: 1, explain: 'Сожаление → should have gone.' },
        { type: 'choice', question: 'Why didn’t you ask? I ___ you.', options: ['could have helped', 'should help', 'can help', 'could help'], answer: 0, explain: 'Была возможность → could have helped.' },
      ],
    },
    {
      id: 'contrast-linkers', level: 'B2', title: 'Although, despite, however, whereas',
      summary: 'Как выражать контраст в эссе.',
      theory: [
        '**although / even though + предложение**: **Although** it was late, we kept working.',
        '**despite / in spite of + существительное или V-ing**: **Despite** the rain, we went out. **Despite being** tired, she finished. (не despite it was…)',
        '**however** — «однако», начинает новое предложение, после запятая: The plan is good. **However**, it is expensive.',
        '**whereas / while** — противопоставление двух фактов: I love coffee, **whereas** my sister prefers tea.',
      ],
      formula: ['although + clause', 'despite + noun / V-ing', 'However, … (новое предложение)'],
      examples: [['Despite the traffic, we arrived on time.', 'Несмотря на пробки, мы приехали вовремя.'], ['Although he is young, he is very wise.', 'Хотя он молод, он очень мудр.']],
      mistakes: [['Despite it was raining…', 'Although it was raining… / Despite the rain…', 'despite — без предложения'], ['Despite of', 'Despite / In spite of', 'despite без of']],
      drill: [
        { type: 'choice', question: '___ studying hard, she didn’t pass.', options: ['Although', 'Despite', 'However', 'Whereas'], answer: 1, explain: '+ V-ing → despite.' },
        { type: 'choice', question: 'The flat is small. ___, it’s in a great area.', options: ['Although', 'Despite', 'However', 'Whereas'], answer: 2, explain: 'Новое предложение → However.' },
        { type: 'choice', question: '___ I was tired, I went to the party.', options: ['Despite', 'Although', 'In spite of', 'However'], answer: 1, explain: '+ предложение → Although.' },
      ],
    },

    // ---------- C1 ----------
    {
      id: 'subjunctive', level: 'C1', title: 'Сослагательное: I suggest he go…',
      summary: 'Формальные требования и предложения.',
      theory: [
        'После глаголов suggest, recommend, insist, demand, request, propose и выражений it’s essential / important / vital that… в формальном стиле глагол стоит в **начальной форме для всех лиц**: I suggest that he **go** to a doctor. It is essential that every student **submit** the form.',
        'Отрицание — просто **not + V**: They insisted that she **not be** told.',
        'В британском разговорном часто используют should: I suggest that he **should go**…',
        'Застывшие выражения: **If I were you**, **Be that as it may**, **God save the Queen**, **Long live…**',
      ],
      formula: ['suggest / insist / it’s essential + that + subject + V (без -s)', 'not + V'],
      examples: [['The doctor recommended that she rest.', 'Врач посоветовал ей отдохнуть.'], ['It’s vital that he be informed.', 'Крайне важно, чтобы ему сообщили.']],
      mistakes: [['I suggest him to go.', 'I suggest that he go. / I suggest going.', 'suggest + to — ошибка']],
      drill: [
        { type: 'choice', question: 'The committee demanded that the report ___ rewritten.', options: ['is', 'was', 'be', 'being'], answer: 2, explain: 'Сослагательное → be.' },
        { type: 'choice', question: 'I suggest that she ___ the offer.', options: ['accepts', 'accept', 'to accept', 'accepted'], answer: 1, explain: 'Без -s: accept.' },
      ],
    },
    {
      id: 'ellipsis', level: 'C1', title: 'So do I, neither do I и другие замены',
      summary: 'Как звучать естественно и не повторяться.',
      theory: [
        'Согласие с утверждением: **So + вспомогательный + подлежащее**: I love jazz. — **So do I.** She’s tired. — **So am I.**',
        'Согласие с отрицанием: **Neither / Nor + вспомогательный + подлежащее**: I can’t swim. — **Neither can I.**',
        'Замены вместо повтора: I think **so** / I hope **so** / I’m afraid **not**. Would you like one? — I’d love **one**.',
        'Эллипсис — опускаем то, что понятно: She can drive, but I **can’t** (drive). I wanted to go, but I **didn’t have time to**.',
      ],
      formula: ['+ : So do / am / can I', '− : Neither do / am / can I', 'I think so · I hope not'],
      examples: [['I’ve never been to Japan. — Neither have I.', 'Я никогда не была в Японии. — Я тоже.'], ['Is it going to rain? — I hope not.', 'Будет дождь? — Надеюсь, нет.']],
      mistakes: [['I like it. — Me too also.', 'So do I. / Me too.', 'без лишнего also'], ['I don’t like it. — So do I.', 'Neither do I.', 'на отрицание — neither']],
      drill: [
        { type: 'choice', question: 'I was really nervous. — ___', options: ['So did I.', 'So was I.', 'Neither was I.', 'So I was.'], answer: 1, explain: 'was → So was I.' },
        { type: 'choice', question: 'She hasn’t finished yet. — ___', options: ['Neither have I.', 'So have I.', 'Neither did I.', 'Me neither have.'], answer: 0, explain: 'Отрицание → Neither have I.' },
      ],
    },
    {
      id: 'academic-style', level: 'C1', title: 'Академический стиль: связки, hedging, номинализация',
      summary: 'Как писать эссе и научные тексты.',
      theory: [
        '**Связки**: добавление — moreover, furthermore, in addition; следствие — therefore, consequently, as a result; пример — for instance, such as; вывод — overall, in conclusion, to sum up.',
        '**Hedging** (смягчение уверенности) — наука не любит категоричности: it **appears** that…, this **may** suggest…, **tends to**, **is likely to**, **to some extent**.',
        '**Номинализация** — замена глаголов существительными делает текст формальнее: «Prices increased rapidly» → «There was **a rapid increase in** prices». «We analysed the data» → «**An analysis of** the data showed…».',
        'Избегай разговорного: get → obtain/become, a lot of → a considerable number of, think → argue/suggest.',
      ],
      formula: ['Moreover · Therefore · However · In conclusion', 'may / might / appears to / is likely to', 'verb → noun: analyse → analysis'],
      examples: [['The results appear to support this hypothesis.', 'Результаты, по-видимому, подтверждают эту гипотезу.'], ['There has been a significant decline in sales.', 'Наблюдается значительное снижение продаж.']],
      mistakes: [['This proves that…', 'This suggests that…', 'в науке осторожнее с «доказывает»'], ['a lot of researchers', 'a considerable number of researchers', 'формальнее']],
      drill: [
        { type: 'choice', question: 'Which sentence is more academic?', options: ['Prices went up a lot.', 'There was a substantial rise in prices.', 'Prices got really high.', 'Prices are super high now.'], answer: 1, explain: 'Номинализация + формальная лексика.' },
        { type: 'choice', question: 'The data ___ that stress affects sleep.', options: ['proves 100%', 'suggests', 'shows for sure', 'says'], answer: 1, explain: 'Hedging → suggests.' },
        { type: 'choice', question: '___, the study has several limitations.', options: ['But', 'However', 'Although', 'Despite'], answer: 1, explain: 'Начало предложения → However,' },
      ],
    },

    // ---------- Справочник: неправильные глаголы ----------
    {
      id: 'irregular-verbs', level: 'A2', title: 'Неправильные глаголы: таблица',
      summary: '80 самых нужных глаголов: V1 — V2 — V3.',
      theory: [
        'У большинства глаголов прошедшее время и третья форма образуются с **-ed** (work — worked — worked). Но самые частые глаголы — **неправильные**, их формы нужно запомнить.',
        '**V2** — для Past Simple (I **went**). **V3** — для Present/Past Perfect и пассива (I have **gone**, it was **written**).',
        'Учи группами по похожести: **без изменений** (cut, put, let, cost), **V2 = V3** (buy—bought—bought, think—thought—thought), **все три разные** (go—went—gone, write—wrote—written).',
        'Совет: добавь «Готовый набор» или создай колоду из этой таблицы и повторяй по 10 глаголов в день.',
      ],
      table: [
        ['be', 'was/were', 'been', 'быть'], ['become', 'became', 'become', 'становиться'], ['begin', 'began', 'begun', 'начинать'], ['break', 'broke', 'broken', 'ломать'],
        ['bring', 'brought', 'brought', 'приносить'], ['build', 'built', 'built', 'строить'], ['buy', 'bought', 'bought', 'покупать'], ['catch', 'caught', 'caught', 'ловить'],
        ['choose', 'chose', 'chosen', 'выбирать'], ['come', 'came', 'come', 'приходить'], ['cost', 'cost', 'cost', 'стоить'], ['cut', 'cut', 'cut', 'резать'],
        ['do', 'did', 'done', 'делать'], ['draw', 'drew', 'drawn', 'рисовать'], ['drink', 'drank', 'drunk', 'пить'], ['drive', 'drove', 'driven', 'водить'],
        ['eat', 'ate', 'eaten', 'есть'], ['fall', 'fell', 'fallen', 'падать'], ['feel', 'felt', 'felt', 'чувствовать'], ['fight', 'fought', 'fought', 'бороться'],
        ['find', 'found', 'found', 'находить'], ['fly', 'flew', 'flown', 'летать'], ['forget', 'forgot', 'forgotten', 'забывать'], ['forgive', 'forgave', 'forgiven', 'прощать'],
        ['get', 'got', 'got/gotten', 'получать'], ['give', 'gave', 'given', 'давать'], ['go', 'went', 'gone', 'идти'], ['grow', 'grew', 'grown', 'расти'],
        ['have', 'had', 'had', 'иметь'], ['hear', 'heard', 'heard', 'слышать'], ['hide', 'hid', 'hidden', 'прятать'], ['hit', 'hit', 'hit', 'ударять'],
        ['hold', 'held', 'held', 'держать'], ['hurt', 'hurt', 'hurt', 'ранить'], ['keep', 'kept', 'kept', 'хранить'], ['know', 'knew', 'known', 'знать'],
        ['lead', 'led', 'led', 'вести'], ['learn', 'learnt/learned', 'learnt/learned', 'учить'], ['leave', 'left', 'left', 'покидать'], ['lend', 'lent', 'lent', 'одалживать'],
        ['let', 'let', 'let', 'позволять'], ['lose', 'lost', 'lost', 'терять'], ['make', 'made', 'made', 'делать'], ['mean', 'meant', 'meant', 'значить'],
        ['meet', 'met', 'met', 'встречать'], ['pay', 'paid', 'paid', 'платить'], ['put', 'put', 'put', 'класть'], ['read', 'read', 'read', 'читать'],
        ['ride', 'rode', 'ridden', 'ездить верхом'], ['ring', 'rang', 'rung', 'звонить'], ['rise', 'rose', 'risen', 'подниматься'], ['run', 'ran', 'run', 'бежать'],
        ['say', 'said', 'said', 'сказать'], ['see', 'saw', 'seen', 'видеть'], ['sell', 'sold', 'sold', 'продавать'], ['send', 'sent', 'sent', 'отправлять'],
        ['set', 'set', 'set', 'устанавливать'], ['shake', 'shook', 'shaken', 'трясти'], ['shine', 'shone', 'shone', 'сиять'], ['show', 'showed', 'shown', 'показывать'],
        ['shut', 'shut', 'shut', 'закрывать'], ['sing', 'sang', 'sung', 'петь'], ['sit', 'sat', 'sat', 'сидеть'], ['sleep', 'slept', 'slept', 'спать'],
        ['speak', 'spoke', 'spoken', 'говорить'], ['spend', 'spent', 'spent', 'тратить'], ['stand', 'stood', 'stood', 'стоять'], ['steal', 'stole', 'stolen', 'красть'],
        ['swim', 'swam', 'swum', 'плавать'], ['take', 'took', 'taken', 'брать'], ['teach', 'taught', 'taught', 'учить (кого-то)'], ['tear', 'tore', 'torn', 'рвать'],
        ['tell', 'told', 'told', 'рассказывать'], ['think', 'thought', 'thought', 'думать'], ['throw', 'threw', 'thrown', 'бросать'], ['understand', 'understood', 'understood', 'понимать'],
        ['wake', 'woke', 'woken', 'просыпаться'], ['wear', 'wore', 'worn', 'носить'], ['win', 'won', 'won', 'побеждать'], ['write', 'wrote', 'written', 'писать'],
      ],
      examples: [['I bought a new phone yesterday.', 'Вчера я купила новый телефон.'], ['Have you ever written a poem?', 'Ты когда-нибудь писала стихи?']],
      mistakes: [['I have went', 'I have gone', 'после have — V3'], ['He brang', 'He brought', 'bring — brought — brought']],
      drill: [
        { type: 'gap', sentence: 'Yesterday I ___ (choose) a new book.', answer: 'chose', explain: 'choose — chose — chosen.' },
        { type: 'gap', sentence: 'Have you ever ___ (eat) sushi?', answer: 'eaten', explain: 'eat — ate — eaten.' },
        { type: 'gap', sentence: 'She ___ (teach) me to swim last summer.', answer: 'taught', explain: 'teach — taught — taught.' },
        { type: 'gap', sentence: 'The window was ___ (break) by the wind.', answer: 'broken', explain: 'break — broke — broken.' },
        { type: 'gap', sentence: 'We ___ (meet) at university.', answer: 'met', explain: 'meet — met — met.' },
        { type: 'gap', sentence: 'I’ve ___ (forget) my password again.', answer: 'forgotten', explain: 'forget — forgot — forgotten.' },
      ],
    },
  ];

  window.GRAMMAR = (window.GRAMMAR || []).concat(more);
})();
