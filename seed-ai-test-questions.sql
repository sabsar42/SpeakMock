-- Starter IELTS Speaking question bank for the AI Avatar Test feature.
-- REVIEW BEFORE RUNNING. Run cue_cards first (question_bank.cue_card_id references it).
-- Paste into Supabase SQL Editor once you're happy with the content.

-- ============================================================
-- CUE CARDS (20) — Part 2
-- ============================================================

INSERT INTO cue_cards (topic, bullet_points, closing_prompt) VALUES
('Describe a person who has influenced you',
 ARRAY['who this person is', 'how you know them', 'what they have done', 'and explain why they have influenced you'],
 'You should say...'),
('Describe a place you would like to visit in the future',
 ARRAY['where it is', 'how you learned about it', 'what you would do there', 'and explain why you want to visit this place'],
 'You should say...'),
('Describe a skill you would like to learn',
 ARRAY['what the skill is', 'how you would learn it', 'how long it would take', 'and explain why you want to learn this skill'],
 'You should say...'),
('Describe a memorable meal you had',
 ARRAY['where you had it', 'who you were with', 'what you ate', 'and explain why it was memorable'],
 'You should say...'),
('Describe a book that made a strong impression on you',
 ARRAY['what the book was about', 'when you read it', 'why you decided to read it', 'and explain why it made a strong impression on you'],
 'You should say...'),
('Describe a piece of technology you find useful',
 ARRAY['what it is', 'how often you use it', 'how you learned to use it', 'and explain why you find it useful'],
 'You should say...'),
('Describe a time you helped someone',
 ARRAY['who you helped', 'what the situation was', 'what you did', 'and explain how you felt about helping them'],
 'You should say...'),
('Describe a decision that was difficult to make',
 ARRAY['what the decision was', 'what the options were', 'how you made the decision', 'and explain why it was difficult'],
 'You should say...'),
('Describe a festival or celebration in your country',
 ARRAY['what it is called', 'when it takes place', 'how people celebrate it', 'and explain why it is important'],
 'You should say...'),
('Describe a teacher who has influenced you',
 ARRAY['who this teacher was', 'what subject they taught', 'what was special about them', 'and explain how they influenced you'],
 'You should say...'),
('Describe a hobby you enjoy',
 ARRAY['what the hobby is', 'how you started doing it', 'how much time you spend on it', 'and explain why you enjoy it'],
 'You should say...'),
('Describe a city you have visited that you liked',
 ARRAY['where it is', 'when you visited', 'what you did there', 'and explain why you liked it'],
 'You should say...'),
('Describe a goal you want to achieve in the future',
 ARRAY['what the goal is', 'how you plan to achieve it', 'how long it will take', 'and explain why this goal is important to you'],
 'You should say...'),
('Describe an important item you own',
 ARRAY['what it is', 'how you got it', 'how long you have had it', 'and explain why it is important to you'],
 'You should say...'),
('Describe a time you learned something new',
 ARRAY['what you learned', 'how you learned it', 'who or what helped you', 'and explain how you felt about it'],
 'You should say...'),
('Describe a form of exercise you like',
 ARRAY['what it is', 'where you do it', 'how often you do it', 'and explain why you like it'],
 'You should say...'),
('Describe a change you would like to make in your life',
 ARRAY['what the change is', 'why you want to make it', 'how you plan to make it', 'and explain how it would improve your life'],
 'You should say...'),
('Describe a piece of good news you received',
 ARRAY['what the news was', 'how you received it', 'who told you', 'and explain how you felt'],
 'You should say...'),
('Describe a public place that could be improved',
 ARRAY['where it is', 'what it is currently used for', 'what problems it has', 'and explain how it could be improved'],
 'You should say...'),
('Describe a job you would like to have in the future',
 ARRAY['what the job is', 'what qualifications it requires', 'why you find it interesting', 'and explain why you would like to have this job'],
 'You should say...');

-- ============================================================
-- PART 1 QUESTIONS (60) — across 10 topic categories, 6 each
-- ============================================================

INSERT INTO question_bank (part, topic_category, question_text) VALUES
-- Home & Accommodation
(1, 'Home', 'Do you live in a house or an apartment?'),
(1, 'Home', 'How long have you lived there?'),
(1, 'Home', 'What do you like most about your home?'),
(1, 'Home', 'Would you like to move somewhere else in the future?'),
(1, 'Home', 'Is your neighborhood a good place to live? Why or why not?'),
(1, 'Home', 'What kind of place would you like to live in when you are older?'),

-- Family
(1, 'Family', 'How many people are there in your family?'),
(1, 'Family', 'Do you spend a lot of time with your family?'),
(1, 'Family', 'Who are you closest to in your family?'),
(1, 'Family', 'What activities do you enjoy doing with your family?'),
(1, 'Family', 'Has your relationship with your family changed as you have grown older?'),
(1, 'Family', 'Is family important in your culture?'),

-- Work / Study
(1, 'Work or Study', 'Do you work or are you a student?'),
(1, 'Work or Study', 'What do you like most about your job or studies?'),
(1, 'Work or Study', 'What are your responsibilities at work or school?'),
(1, 'Work or Study', 'Is there anything you would like to change about your job or course?'),
(1, 'Work or Study', 'What are your plans for your career in the future?'),
(1, 'Work or Study', 'Do you prefer working alone or in a team?'),

-- Hobbies
(1, 'Hobbies', 'What do you like to do in your free time?'),
(1, 'Hobbies', 'How did you become interested in this hobby?'),
(1, 'Hobbies', 'Do you think hobbies are important? Why?'),
(1, 'Hobbies', 'Has your favorite hobby changed since you were a child?'),
(1, 'Hobbies', 'Do you prefer hobbies you can do alone or with other people?'),
(1, 'Hobbies', 'How much time do you spend on your hobby each week?'),

-- Food
(1, 'Food', 'What is your favorite food?'),
(1, 'Food', 'Do you enjoy cooking?'),
(1, 'Food', 'What kind of food is popular in your country?'),
(1, 'Food', 'Do you prefer eating at home or eating out?'),
(1, 'Food', 'Has your diet changed over the years?'),
(1, 'Food', 'Do you think it is important to eat healthy food?'),

-- Travel
(1, 'Travel', 'Do you enjoy traveling?'),
(1, 'Travel', 'What is the most interesting place you have visited?'),
(1, 'Travel', 'Do you prefer traveling alone or with others?'),
(1, 'Travel', 'What kind of transport do you usually use when traveling?'),
(1, 'Travel', 'Is there a country you would like to visit in the future?'),
(1, 'Travel', 'Do you prefer traveling to cities or the countryside?'),

-- Daily Routine
(1, 'Daily Routine', 'What time do you usually wake up?'),
(1, 'Daily Routine', 'What is the first thing you do in the morning?'),
(1, 'Daily Routine', 'Does your daily routine change on weekends?'),
(1, 'Daily Routine', 'What part of your day do you enjoy the most?'),
(1, 'Daily Routine', 'Do you think having a routine is important?'),
(1, 'Daily Routine', 'How has your daily routine changed over the last few years?'),

-- Technology
(1, 'Technology', 'What electronic device do you use most often?'),
(1, 'Technology', 'How has technology changed the way you study or work?'),
(1, 'Technology', 'Do you think you spend too much time on your phone?'),
(1, 'Technology', 'What was the last app you downloaded?'),
(1, 'Technology', 'Do you prefer reading books in print or digitally?'),
(1, 'Technology', 'How do you think technology will change in the next ten years?'),

-- Weather / Seasons
(1, 'Weather', 'What is your favorite season?'),
(1, 'Weather', 'What is the weather like in your hometown?'),
(1, 'Weather', 'Does the weather affect your mood?'),
(1, 'Weather', 'What activities do you do in different seasons?'),
(1, 'Weather', 'Do you prefer hot or cold weather?'),
(1, 'Weather', 'Has the climate in your country changed in recent years?'),

-- Neighbors / Community
(1, 'Community', 'Do you know your neighbors well?'),
(1, 'Community', 'Is your neighborhood a friendly place?'),
(1, 'Community', 'Do you take part in any community activities?'),
(1, 'Community', 'How has your neighborhood changed over time?'),
(1, 'Community', 'Do you think it is important to help your neighbors?'),
(1, 'Community', 'What facilities are available in your neighborhood?');

-- ============================================================
-- PART 3 QUESTIONS (60) — 3 linked to each of the 20 cue cards
-- Selected by joining on cue_cards.topic via a lookup, since we
-- need the generated cue_card ids. Run this AFTER the cue_cards
-- insert above completes in the same session/transaction.
-- ============================================================

INSERT INTO question_bank (part, topic_category, question_text, cue_card_id)
SELECT 3, 'Influential People', q, c.id
FROM cue_cards c,
UNNEST(ARRAY[
  'What qualities make someone a good role model?',
  'Do you think celebrities have a responsibility to be good role models?',
  'How do people''s role models change as they get older?'
]) AS q
WHERE c.topic = 'Describe a person who has influenced you';

INSERT INTO question_bank (part, topic_category, question_text, cue_card_id)
SELECT 3, 'Travel & Tourism', q, c.id
FROM cue_cards c,
UNNEST(ARRAY[
  'How has tourism changed in your country in recent years?',
  'What are the advantages and disadvantages of tourism for local communities?',
  'Do you think space tourism will become common in the future?'
]) AS q
WHERE c.topic = 'Describe a place you would like to visit in the future';

INSERT INTO question_bank (part, topic_category, question_text, cue_card_id)
SELECT 3, 'Skills & Learning', q, c.id
FROM cue_cards c,
UNNEST(ARRAY[
  'What skills do you think will be important in the future job market?',
  'Is it better to learn a skill through formal education or by practicing on your own?',
  'Do you think schools teach enough practical skills?'
]) AS q
WHERE c.topic = 'Describe a skill you would like to learn';

INSERT INTO question_bank (part, topic_category, question_text, cue_card_id)
SELECT 3, 'Food Culture', q, c.id
FROM cue_cards c,
UNNEST(ARRAY[
  'How have eating habits changed in your country over the last few decades?',
  'Do you think fast food is becoming more popular than traditional food?',
  'What impact does food culture have on tourism?'
]) AS q
WHERE c.topic = 'Describe a memorable meal you had';

INSERT INTO question_bank (part, topic_category, question_text, cue_card_id)
SELECT 3, 'Reading & Literature', q, c.id
FROM cue_cards c,
UNNEST(ARRAY[
  'Do you think reading habits have changed because of the internet?',
  'What are the benefits of reading fiction compared to non-fiction?',
  'Should children be encouraged to read more books?'
]) AS q
WHERE c.topic = 'Describe a book that made a strong impression on you';

INSERT INTO question_bank (part, topic_category, question_text, cue_card_id)
SELECT 3, 'Technology in Daily Life', q, c.id
FROM cue_cards c,
UNNEST(ARRAY[
  'How has technology changed the way people communicate?',
  'Do you think people rely too much on technology nowadays?',
  'What technology do you think will be most important in the next decade?'
]) AS q
WHERE c.topic = 'Describe a piece of technology you find useful';

INSERT INTO question_bank (part, topic_category, question_text, cue_card_id)
SELECT 3, 'Helping Others', q, c.id
FROM cue_cards c,
UNNEST(ARRAY[
  'Why do you think some people are more willing to help others than others?',
  'Do you think community volunteering should be encouraged more?',
  'How has technology changed the way people help each other?'
]) AS q
WHERE c.topic = 'Describe a time you helped someone';

INSERT INTO question_bank (part, topic_category, question_text, cue_card_id)
SELECT 3, 'Decision Making', q, c.id
FROM cue_cards c,
UNNEST(ARRAY[
  'Do you think people are generally good at making decisions?',
  'How does age affect the way people make decisions?',
  'Is it better to make decisions quickly or take a long time to think them through?'
]) AS q
WHERE c.topic = 'Describe a decision that was difficult to make';

INSERT INTO question_bank (part, topic_category, question_text, cue_card_id)
SELECT 3, 'Festivals & Traditions', q, c.id
FROM cue_cards c,
UNNEST(ARRAY[
  'Why do you think traditional festivals are still popular today?',
  'Do you think festivals will change as societies become more modern?',
  'What is the social importance of festivals in a community?'
]) AS q
WHERE c.topic = 'Describe a festival or celebration in your country';

INSERT INTO question_bank (part, topic_category, question_text, cue_card_id)
SELECT 3, 'Education', q, c.id
FROM cue_cards c,
UNNEST(ARRAY[
  'What qualities make someone a good teacher?',
  'Do you think the role of teachers will change due to technology?',
  'Should teachers be paid more than they currently are?'
]) AS q
WHERE c.topic = 'Describe a teacher who has influenced you';

INSERT INTO question_bank (part, topic_category, question_text, cue_card_id)
SELECT 3, 'Leisure & Hobbies', q, c.id
FROM cue_cards c,
UNNEST(ARRAY[
  'Do you think people have less free time now than in the past?',
  'How do hobbies benefit a person''s mental health?',
  'Should companies encourage employees to have hobbies outside of work?'
]) AS q
WHERE c.topic = 'Describe a hobby you enjoy';

INSERT INTO question_bank (part, topic_category, question_text, cue_card_id)
SELECT 3, 'Urban Life', q, c.id
FROM cue_cards c,
UNNEST(ARRAY[
  'What are the benefits and drawbacks of living in a big city?',
  'How do you think cities will change in the future?',
  'Do you think city planning should prioritize public transport?'
]) AS q
WHERE c.topic = 'Describe a city you have visited that you liked';

INSERT INTO question_bank (part, topic_category, question_text, cue_card_id)
SELECT 3, 'Goals & Ambition', q, c.id
FROM cue_cards c,
UNNEST(ARRAY[
  'Do you think it is important for people to set long-term goals?',
  'How does society''s definition of success affect people''s goals?',
  'Is it better to have one big goal or several smaller ones?'
]) AS q
WHERE c.topic = 'Describe a goal you want to achieve in the future';

INSERT INTO question_bank (part, topic_category, question_text, cue_card_id)
SELECT 3, 'Possessions', q, c.id
FROM cue_cards c,
UNNEST(ARRAY[
  'Do people today value possessions differently than in the past?',
  'Do you think materialism is a growing problem in modern society?',
  'How do personal possessions reflect someone''s identity?'
]) AS q
WHERE c.topic = 'Describe an important item you own';

INSERT INTO question_bank (part, topic_category, question_text, cue_card_id)
SELECT 3, 'Lifelong Learning', q, c.id
FROM cue_cards c,
UNNEST(ARRAY[
  'Why is it important for adults to keep learning new things?',
  'Do you think online learning is as effective as traditional classroom learning?',
  'What barriers stop people from learning new skills later in life?'
]) AS q
WHERE c.topic = 'Describe a time you learned something new';

INSERT INTO question_bank (part, topic_category, question_text, cue_card_id)
SELECT 3, 'Health & Fitness', q, c.id
FROM cue_cards c,
UNNEST(ARRAY[
  'Why do you think obesity rates are rising in many countries?',
  'Should governments do more to encourage people to exercise?',
  'How has the pandemic changed the way people think about fitness?'
]) AS q
WHERE c.topic = 'Describe a form of exercise you like';

INSERT INTO question_bank (part, topic_category, question_text, cue_card_id)
SELECT 3, 'Personal Change', q, c.id
FROM cue_cards c,
UNNEST(ARRAY[
  'Do you think people generally find it easy or hard to change their habits?',
  'What role does motivation play in helping people change?',
  'Is it more effective to make small changes or big changes at once?'
]) AS q
WHERE c.topic = 'Describe a change you would like to make in your life';

INSERT INTO question_bank (part, topic_category, question_text, cue_card_id)
SELECT 3, 'News & Media', q, c.id
FROM cue_cards c,
UNNEST(ARRAY[
  'How do people usually get their news nowadays?',
  'Do you think social media has made people more or less informed?',
  'What responsibility do news organizations have to report accurately?'
]) AS q
WHERE c.topic = 'Describe a piece of good news you received';

INSERT INTO question_bank (part, topic_category, question_text, cue_card_id)
SELECT 3, 'Urban Planning', q, c.id
FROM cue_cards c,
UNNEST(ARRAY[
  'What role should the government play in maintaining public spaces?',
  'How can cities better involve residents in urban planning decisions?',
  'Do you think green spaces in cities are important? Why?'
]) AS q
WHERE c.topic = 'Describe a public place that could be improved';

INSERT INTO question_bank (part, topic_category, question_text, cue_card_id)
SELECT 3, 'Careers', q, c.id
FROM cue_cards c,
UNNEST(ARRAY[
  'Do you think job satisfaction is more important than salary?',
  'How is the job market changing due to automation and AI?',
  'What advice would you give someone choosing a career path?'
]) AS q
WHERE c.topic = 'Describe a job you would like to have in the future';
