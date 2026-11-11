// Встроенная библиотека текстов для чтения (английский, A1–B2).
// Все тексты написаны специально для этого проекта.
(function () {
  'use strict';

  window.LIBRARY = [
    {
      id: 'lib-my-day', level: 'A1', lang: 'en-US', title: 'My Day', topic: 'повседневная жизнь',
      body: 'My name is Masha. I am twenty years old, and I am a student. I live in a small flat with my cat, Tofu.\n\n' +
        'I get up at seven o’clock. I drink a cup of tea and eat some toast. Tofu eats too. Then I take the bus to the university. The bus is always full in the morning.\n\n' +
        'My classes start at nine. I like maths and English, but I don’t like history. At one o’clock I have lunch with my friends in the canteen. The soup there is cheap and very good.\n\n' +
        'In the evening I do my homework and listen to music. Sometimes I call my mum. She lives in another city, and I miss her.\n\n' +
        'I go to bed at eleven. Tofu sleeps on my bed. It is a simple day, but I am happy.',
    },
    {
      id: 'lib-new-city', level: 'A1', lang: 'en-US', title: 'A New City', topic: 'город',
      body: 'Last month I moved to a new city. Everything is new for me: the streets, the shops, the people.\n\n' +
        'There is a big park near my house. There are old trees and a small lake. In the morning, people run there with their dogs. I want to run too, but it is cold.\n\n' +
        'There is a nice café on my street. The coffee is good and the music is quiet. I often sit there with a book.\n\n' +
        'I don’t have many friends here yet. But my neighbour is very kind. Her name is Olga. She is sixty, and she bakes amazing pies. Yesterday she gave me one with apples.\n\n' +
        'The city is big and a little scary. But every day it is more and more my home.',
    },
    {
      id: 'lib-weekend', level: 'A2', lang: 'en-US', title: 'A Weekend Without a Phone', topic: 'привычки',
      body: 'Last Friday my friend Dima suggested an experiment: a whole weekend without our phones. I laughed, but then I agreed.\n\n' +
        'On Saturday morning I woke up and automatically looked for my phone. It wasn’t there — I had put it in a drawer. I felt strange, almost nervous. What if somebody needed me?\n\n' +
        'So I made breakfast slowly and actually tasted it. After that I went for a long walk. I noticed things I usually miss: a small bookshop, a mural on an old building, a man playing the saxophone.\n\n' +
        'In the afternoon I read half of a novel that I started months ago. In the evening Dima and I met at a café. We talked for three hours. Nobody checked messages, nobody took photos of the food.\n\n' +
        'On Sunday evening I opened the drawer. I had forty-two messages. None of them were urgent. I think we will repeat the experiment next month.',
    },
    {
      id: 'lib-trip', level: 'A2', lang: 'en-US', title: 'The Train to the Sea', topic: 'путешествия',
      body: 'Every summer my family travelled to the sea by train. The journey took two days, and for a child it was a real adventure.\n\n' +
        'We always took too much food: boiled eggs, cucumbers, chicken and a big bag of sweets. My dad made tea in glasses with metal holders. My brother and I slept on the top bunks and watched the forests and fields through the window.\n\n' +
        'At the big stations, women sold hot potatoes and fresh berries on the platform. My mum always bought something, even when we weren’t hungry.\n\n' +
        'Now I usually fly. It is faster and more comfortable, of course. But sometimes I miss those slow days on the train, when there was nothing to do except look out of the window, talk and dream.',
    },
    {
      id: 'lib-procrastination', level: 'B1', lang: 'en-US', title: 'Why We Procrastinate', topic: 'психология и учёба',
      body: 'Most students know the feeling: the deadline is in two days, the essay hasn’t been started, and suddenly cleaning the kitchen seems incredibly important.\n\n' +
        'For a long time people thought procrastination was simply a problem of laziness or bad time management. Psychologists now describe it differently. When a task makes us feel anxious, bored or unsure, our brain looks for a quick way to feel better. Watching a video or tidying a desk gives us that relief immediately, while the reward for finishing the essay is far away.\n\n' +
        'In other words, procrastination is often a way of managing emotions, not time. That is why strict schedules alone rarely help.\n\n' +
        'What does help? First, make the first step ridiculously small: “open the document and write one sentence”. Second, be kind to yourself. Research has shown that students who forgave themselves for procrastinating on one exam procrastinated less before the next one. Finally, notice the feeling behind the delay. If you are afraid the work won’t be perfect, remind yourself that a finished draft is better than a perfect plan.',
    },
    {
      id: 'lib-music', level: 'B1', lang: 'en-US', title: 'Studying With Music', topic: 'музыка и фокус',
      body: 'Some people can’t study without music, while others need complete silence. Who is right? As usual, the answer is: it depends.\n\n' +
        'Music with lyrics can make reading harder, because our brain tries to process two streams of language at the same time. If you are learning new words or writing an essay, songs in a language you understand may distract you more than you think.\n\n' +
        'Instrumental music is a different story. Calm lo-fi beats, ambient sounds or classical pieces can hide background noise and create a feeling of a “bubble” where it is easier to focus. Some people also find that the same playlist becomes a signal for the brain: when it starts, it is time to work.\n\n' +
        'Volume matters too. Quiet music usually works better than loud music, which can increase stress.\n\n' +
        'The best way to find out what works for you is to experiment. Try one week with music and one week without, and compare how much you have actually done.',
    },
    {
      id: 'lib-ai', level: 'B2', lang: 'en-US', title: 'Learning in the Age of AI', topic: 'технологии',
      body: 'A few years ago, students worried that search engines would make memory unnecessary. Today the same question is being asked about artificial intelligence: if a chatbot can write an essay in seconds, why should anyone learn to write at all?\n\n' +
        'The problem with this argument is that learning has never been only about producing a result. When you struggle to explain an idea in your own words, you are not just creating a text — you are building connections in your mind that will stay there long after the assignment has been forgotten. If a machine does the struggling for you, the text exists, but the understanding does not.\n\n' +
        'That doesn’t mean AI should be avoided. Used wisely, it can be an extraordinarily patient tutor. It can explain a statistical concept five different ways, generate practice questions, or point out why a sentence sounds unnatural. The key difference is who is doing the thinking.\n\n' +
        'A useful rule might be this: let AI help you understand, but don’t let it understand instead of you. Ask it to check your reasoning rather than to provide the answer, and you will get the benefits of the technology without losing what makes learning worthwhile.',
    },
    {
      id: 'lib-habits', level: 'B2', lang: 'en-US', title: 'Small Habits, Big Changes', topic: 'саморазвитие',
      body: 'When we decide to change our lives, we usually think big: run every day, learn a language in three months, never eat sugar again. And usually, within a couple of weeks, we have given up.\n\n' +
        'Researchers who study behaviour suggest the opposite approach. Habits are formed through repetition, not intensity, so a tiny action performed every day is more powerful than a heroic effort performed once. Reading two pages is not impressive, but if you had read two pages every evening for the last year, you would have finished several books.\n\n' +
        'Another useful idea is to attach a new habit to an existing one. “After I pour my morning coffee, I will review ten flashcards” is much easier to remember than a vague promise to “study more”.\n\n' +
        'Finally, it helps to change how we see ourselves. Instead of thinking “I want to learn English”, try thinking “I am someone who practises English every day”. Every small action then becomes a vote for the person you are becoming — and missing one day is not a failure, as long as you don’t miss two in a row.',
    },
  ];
})();
