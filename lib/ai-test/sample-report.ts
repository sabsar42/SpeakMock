import type { AiTestReportData } from "@/lib/ai-test/pdf/report";

/**
 * A fictional, realistic band-6.5 result used for the landing page preview
 * and the downloadable sample PDF (/api/sample-report). Built from the same
 * types as a real result, so the sample is rendered by the exact code that
 * produces students' reports and can't drift from what they actually get.
 */
export const SAMPLE_REPORT: AiTestReportData = {
  studentName: "Sample Candidate",
  testDate: "Sat, Oct 4, 2026",
  overallBand: 6.5,
  overallFeedback:
    "A confident, well-developed performance. You speak at length without noticeable effort and link ideas clearly, but rely on a small set of connectives and make occasional errors with complex structures. Widening your topic vocabulary and practising conditional sentences are the fastest routes to Band 7.",
  fluencyCoherence: {
    score: 7,
    justification:
      "You kept talking at length in Part 2 with only brief hesitation, and your answers were easy to follow. Some repetition of 'and also' and 'so' made linking feel mechanical.",
    examples: [
      "\"I have been living there for about three years now, mainly because the commute was taking almost an hour.\"",
      "\"So... and also the market at the weekend, so it can get noisy.\"",
    ],
    tip: "Swap repeated linkers for a wider range: 'on top of that', 'which means', 'having said that'.",
  },
  lexicalResource: {
    score: 6.5,
    justification:
      "Vocabulary is adequate for familiar topics with some less common items, but you paraphrased rather than using precise words on abstract Part 3 questions.",
    examples: [
      "\"a good counterbalance to my work, which is very screen-based and analytical\"",
      "\"things that are... how to say, useful for life\"",
    ],
    tip: "Learn 5-6 topic phrases per common theme (education, technology, environment) and use them in Part 3.",
  },
  grammaticalRange: {
    score: 6,
    justification:
      "A mix of simple and complex sentences, but errors appear when attempting conditionals and relative clauses, though they rarely affect meaning.",
    examples: [
      "\"If I would have more time, I learn the piano.\"",
      "\"The skill which I want to learn it is piano.\"",
    ],
    tip: "Drill second conditionals: 'If I had more time, I would learn...' until they come out automatically.",
  },
  pronunciation: {
    score: 6.5,
    justification:
      "Generally clear and easy to understand, with good sentence stress. Some word endings were dropped, and intonation flattened in longer answers.",
    examples: [
      "everything I need is within walkin' distance",
      "I have been living there for about three years now",
    ],
    tip: "Record one Part 2 answer and listen for dropped endings ('-ed', '-s', '-ing').",
  },
  transcript: [
    {
      speaker: "examiner",
      text: "Do you live in a house or an apartment?",
      part: 1,
      question_id: null,
      at: "2026-10-04T09:00:00.000Z",
    },
    {
      speaker: "student",
      text: "I live in a fairly small apartment in the centre of the city, on the fourth floor. It suits me well because everything I need is within walking distance.",
      part: 1,
      question_id: null,
      at: "2026-10-04T09:00:20.000Z",
    },
    {
      speaker: "examiner",
      text: "Describe a skill you would like to learn. You have one minute to prepare, then up to two minutes to speak.",
      part: 2,
      question_id: null,
      at: "2026-10-04T09:05:00.000Z",
    },
    {
      speaker: "student",
      text: "The skill I would most like to learn is playing the piano. I have wanted to learn it since I was a child, but we never had an instrument at home. I would take weekly lessons with a teacher, because having someone correct your technique early on makes a big difference, and it would be a good counterbalance to my work, which is very screen-based and analytical.",
      part: 2,
      question_id: null,
      at: "2026-10-04T09:06:10.000Z",
    },
    {
      speaker: "examiner",
      text: "What skills do you think will be most important for young people in the future?",
      part: 3,
      question_id: null,
      at: "2026-10-04T09:09:00.000Z",
    },
    {
      speaker: "student",
      text: "I think the most important skills will be the ones machines are not good at, like creative problem solving and communication. Technical skills change so quickly that the ability to keep learning is probably more valuable.",
      part: 3,
      question_id: null,
      at: "2026-10-04T09:09:25.000Z",
    },
  ],
};
