// Готовые наборы слов (английский). Добавляются в «Карточки» одной кнопкой.
// Формат слова: [слово, перевод, пример].
(function () {
  'use strict';

  window.VOCAB_SETS = [
    {
      id: 'v-study', level: 'A2–B1', title: 'Учёба и университет', words: [
        ['lecture', 'лекция', 'The lecture starts at nine.'], ['seminar', 'семинар', 'We discuss cases at the seminar.'],
        ['assignment', 'задание', 'The assignment is due on Friday.'], ['deadline', 'крайний срок', 'I always work better close to a deadline.'],
        ['to submit', 'сдать, отправить', 'Submit your essay online.'], ['grade', 'оценка', 'She got a good grade in statistics.'],
        ['to pass an exam', 'сдать экзамен', 'I hope I pass the exam.'], ['to fail', 'провалить', 'He failed the test but retook it.'],
        ['to revise', 'повторять (к экзамену)', 'I need to revise chapter five.'], ['thesis', 'дипломная работа', 'My thesis is about data analysis.'],
        ['research', 'исследование', 'She does research on climate.'], ['scholarship', 'стипендия', 'He won a scholarship to study abroad.'],
        ['to take notes', 'конспектировать', 'I take notes on my laptop.'], ['attendance', 'посещаемость', 'Attendance is compulsory.'],
        ['tuition fees', 'плата за обучение', 'Tuition fees are high here.'], ['to procrastinate', 'откладывать на потом', 'Stop procrastinating and start!'],
        ['group project', 'групповой проект', 'Our group project went well.'], ['supervisor', 'научный руководитель', 'My supervisor is very helpful.'],
        ['to enrol', 'зачислиться, записаться', 'I enrolled in a Spanish course.'], ['campus', 'кампус', 'The library is on the main campus.'],
      ],
    },
    {
      id: 'v-travel', level: 'A2–B1', title: 'Путешествия', words: [
        ['journey', 'поездка, путь', 'The journey took six hours.'], ['to book', 'бронировать', 'Let’s book a hotel.'],
        ['luggage', 'багаж', 'My luggage is too heavy.'], ['boarding pass', 'посадочный талон', 'Show your boarding pass, please.'],
        ['delay', 'задержка', 'There is a two-hour delay.'], ['to check in', 'зарегистрироваться', 'We checked in online.'],
        ['round trip', 'поездка туда и обратно', 'A round trip ticket is cheaper.'], ['sightseeing', 'осмотр достопримечательностей', 'We went sightseeing in Rome.'],
        ['to get lost', 'заблудиться', 'We got lost in the old town.'], ['accommodation', 'жильё', 'Accommodation is expensive in summer.'],
        ['currency', 'валюта', 'What currency do they use?'], ['souvenir', 'сувенир', 'I bought a souvenir for my mum.'],
        ['passport control', 'паспортный контроль', 'The queue at passport control was long.'], ['to explore', 'исследовать', 'I love exploring new cities.'],
        ['crowded', 'многолюдный', 'The beach was very crowded.'], ['breathtaking', 'захватывающий дух', 'The view was breathtaking.'],
        ['itinerary', 'маршрут, план поездки', 'Our itinerary includes three cities.'], ['to set off', 'отправиться в путь', 'We set off early in the morning.'],
        ['jet lag', 'смена часовых поясов', 'I still have jet lag.'], ['local', 'местный', 'Try the local food!'],
      ],
    },
    {
      id: 'v-emotions', level: 'B1', title: 'Эмоции и состояние', words: [
        ['anxious', 'тревожный', 'I feel anxious before exams.'], ['overwhelmed', 'перегруженный', 'I’m overwhelmed with work.'],
        ['exhausted', 'измотанный', 'After the trip I was exhausted.'], ['relieved', 'с облегчением', 'I was relieved when it ended.'],
        ['proud of', 'гордиться', 'I’m proud of you!'], ['grateful', 'благодарный', 'I’m grateful for your support.'],
        ['frustrated', 'раздосадованный', 'She was frustrated by the delay.'], ['confident', 'уверенный', 'I feel more confident now.'],
        ['to calm down', 'успокоиться', 'Take a breath and calm down.'], ['mood', 'настроение', 'I’m in a good mood today.'],
        ['to cheer up', 'взбодриться, подбодрить', 'This song always cheers me up.'], ['lonely', 'одинокий', 'I felt lonely in the new city.'],
        ['embarrassed', 'смущённый', 'I was so embarrassed!'], ['excited about', 'в предвкушении', 'I’m excited about the trip.'],
        ['upset', 'расстроенный', 'Don’t be upset, it’s fine.'], ['burnout', 'выгорание', 'Rest is important to avoid burnout.'],
        ['to cope with', 'справляться с', 'How do you cope with stress?'], ['moody', 'с переменчивым настроением', 'He’s a bit moody in the morning.'],
        ['content', 'довольный', 'I’m content with my life.'], ['to vent', 'выговориться', 'Sometimes you just need to vent.'],
      ],
    },
    {
      id: 'v-work', level: 'B1–B2', title: 'Работа и собеседование', words: [
        ['job interview', 'собеседование', 'I have a job interview tomorrow.'], ['to apply for', 'подавать заявку на', 'She applied for an internship.'],
        ['internship', 'стажировка', 'The internship lasts three months.'], ['CV / résumé', 'резюме', 'Update your CV before applying.'],
        ['strengths', 'сильные стороны', 'What are your strengths?'], ['weaknesses', 'слабые стороны', 'Talk about your weaknesses honestly.'],
        ['experience', 'опыт', 'Do you have any experience in sales?'], ['salary', 'зарплата', 'The salary is competitive.'],
        ['to hire', 'нанимать', 'They hired two new analysts.'], ['to be in charge of', 'отвечать за', 'I was in charge of the budget.'],
        ['skills', 'навыки', 'Communication skills are important.'], ['team player', 'командный игрок', 'I’m a good team player.'],
        ['to meet a deadline', 'уложиться в срок', 'We always meet our deadlines.'], ['responsibility', 'обязанность', 'Main responsibilities include reporting.'],
        ['remote work', 'удалённая работа', 'I prefer remote work.'], ['colleague', 'коллега', 'My colleagues are friendly.'],
        ['promotion', 'повышение', 'She got a promotion last year.'], ['to resign', 'уволиться (по собственному)', 'He resigned to start a business.'],
        ['feedback', 'обратная связь', 'Thank you for your feedback.'], ['workload', 'объём работы', 'My workload is heavy this month.'],
      ],
    },
    {
      id: 'v-tech', level: 'B1–B2', title: 'Технологии и данные', words: [
        ['dataset', 'набор данных', 'We cleaned the dataset first.'], ['to analyse', 'анализировать', 'Let’s analyse the results.'],
        ['accuracy', 'точность', 'The model’s accuracy is 92%.'], ['to train a model', 'обучать модель', 'It takes hours to train the model.'],
        ['feature', 'признак, функция', 'We added a new feature.'], ['to deploy', 'развернуть, выложить', 'We deployed the app on Friday.'],
        ['bug', 'ошибка в программе', 'I found a bug in the code.'], ['to debug', 'отлаживать', 'I spent all night debugging.'],
        ['update', 'обновление', 'Install the latest update.'], ['to back up', 'сделать резервную копию', 'Always back up your files.'],
        ['user-friendly', 'удобный', 'The interface is user-friendly.'], ['reliable', 'надёжный', 'We need a reliable server.'],
        ['to store', 'хранить', 'The data is stored in the cloud.'], ['privacy', 'конфиденциальность', 'Privacy matters to users.'],
        ['to automate', 'автоматизировать', 'Let’s automate this report.'], ['outcome', 'результат', 'The outcome was surprising.'],
        ['trend', 'тенденция', 'There is a clear upward trend.'], ['to predict', 'предсказывать', 'The model predicts prices.'],
        ['bias', 'смещение, предвзятость', 'The data has a strong bias.'], ['overfitting', 'переобучение', 'Overfitting is a common problem.'],
      ],
    },
    {
      id: 'v-food', level: 'A2', title: 'Еда, кафе, магазин', words: [
        ['to order', 'заказывать', 'Are you ready to order?'], ['the bill', 'счёт', 'Can we have the bill, please?'],
        ['tip', 'чаевые', 'We left a 10% tip.'], ['takeaway', 'еда навынос', 'Let’s get a takeaway tonight.'],
        ['vegetarian', 'вегетарианский', 'Do you have vegetarian options?'], ['spicy', 'острый', 'This soup is too spicy.'],
        ['delicious', 'очень вкусный', 'The cake was delicious.'], ['to share', 'делить(ся)', 'Shall we share a pizza?'],
        ['receipt', 'чек', 'Keep the receipt.'], ['discount', 'скидка', 'There is a 20% discount today.'],
        ['grocery store', 'продуктовый магазин', 'I’ll stop at the grocery store.'], ['fresh', 'свежий', 'Buy some fresh bread.'],
        ['to be full', 'наесться', 'No dessert for me, I’m full.'], ['portion', 'порция', 'The portions are huge.'],
        ['to recommend', 'советовать', 'What do you recommend?'], ['allergic to', 'с аллергией на', 'I’m allergic to nuts.'],
      ],
    },
    {
      id: 'v-smalltalk', level: 'A2–B1', title: 'Small talk: живые фразы', words: [
        ['How’s it going?', 'Как дела?', 'Hey! How’s it going?'], ['Not bad, thanks.', 'Неплохо, спасибо.', 'Not bad, thanks. And you?'],
        ['What have you been up to?', 'Чем занималась?', 'Long time no see! What have you been up to?'], ['Long time no see!', 'Сто лет не виделись!', 'Long time no see! You look great.'],
        ['I’m into…', 'Я увлекаюсь…', 'I’m into photography.'], ['Sounds good!', 'Звучит отлично!', 'Pizza tonight? — Sounds good!'],
        ['No worries.', 'Не переживай / ничего страшного.', 'Sorry I’m late! — No worries.'], ['Fair enough.', 'Справедливо / логично.', 'I’m tired, let’s go home. — Fair enough.'],
        ['I’m not sure about that.', 'Я не уверена насчёт этого.', 'Maybe… I’m not sure about that.'], ['That makes sense.', 'Это логично.', 'Oh, that makes sense now.'],
        ['Catch you later!', 'До встречи!', 'Got to run. Catch you later!'], ['It’s up to you.', 'Решай сама.', 'Tea or coffee? — It’s up to you.'],
        ['I’ll keep you posted.', 'Буду держать в курсе.', 'I’ll keep you posted about the trip.'], ['To be honest…', 'Честно говоря…', 'To be honest, I didn’t like it.'],
        ['By the way…', 'Кстати…', 'By the way, did you see the news?'], ['Never mind.', 'Неважно / забудь.', 'Never mind, I’ll do it myself.'],
      ],
    },
    {
      id: 'v-phrasal', level: 'B1–B2', title: 'Фразовые глаголы на каждый день', words: [
        ['to give up', 'бросить, сдаться', 'Don’t give up now!'], ['to find out', 'узнать', 'I found out the truth.'],
        ['to look forward to', 'ждать с нетерпением', 'I look forward to the holidays.'], ['to put off', 'откладывать', 'Stop putting off the dentist.'],
        ['to come up with', 'придумать', 'She came up with a great idea.'], ['to figure out', 'разобраться', 'I can’t figure out this formula.'],
        ['to run out of', 'закончиться (о запасах)', 'We ran out of milk.'], ['to get along with', 'ладить с', 'I get along with my roommate.'],
        ['to catch up', 'наверстать', 'I need to catch up on sleep.'], ['to show up', 'появиться, прийти', 'He showed up late.'],
        ['to turn down', 'отклонить; убавить', 'She turned down the offer.'], ['to set up', 'настроить, основать', 'Let’s set up a meeting.'],
        ['to look up', 'посмотреть (в словаре)', 'Look up the word online.'], ['to go over', 'просмотреть, повторить', 'Let’s go over the plan again.'],
        ['to break down', 'сломаться; расплакаться', 'My laptop broke down.'], ['to take up', 'начать заниматься', 'I took up yoga this year.'],
      ],
    },
  ];
})();
