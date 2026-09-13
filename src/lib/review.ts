import { BUSINESS_PHRASES, GRAMMAR, KANJI, VOCABULARY } from "./content";
import type { QuizQuestion, StudyType } from "./types";
import type { DailyCounts } from "./store";
import { seededShuffle } from "./utils";

export interface ReviewItem {
  itemId: string;
  type: StudyType;
  countKey: keyof Omit<DailyCounts, "seconds">;
  prompt: string;
  subPrompt?: string;
  title: string;
  question: QuizQuestion;
}

function buildChoices(
  answer: string,
  pool: string[],
  seed: string,
): { choices: string[]; answerIndex: number } {
  const distractors = seededShuffle(pool.filter((value) => value !== answer), `${seed}:pool`).slice(0, 3);
  const choices = seededShuffle([answer, ...distractors], `${seed}:choices`);
  return { choices, answerIndex: choices.indexOf(answer) };
}

/** 복습 대상 id 목록을 4지선다 문제로 바꿉니다. */
export function buildReviewItems(dueIds: string[]): ReviewItem[] {
  const items: ReviewItem[] = [];

  dueIds.forEach((id) => {
    const vocabulary = VOCABULARY.find((item) => item.id === id);
    if (vocabulary) {
      const pool = VOCABULARY.filter((item) => item.level === vocabulary.level).map((item) => item.meaning);
      const { choices, answerIndex } = buildChoices(vocabulary.meaning, pool, id);
      items.push({
        itemId: id,
        type: "vocabulary",
        countKey: "vocabulary",
        title: `${vocabulary.word} (${vocabulary.reading})`,
        prompt: vocabulary.word,
        subPrompt: vocabulary.partOfSpeech,
        question: {
          id: `review-${id}`,
          question: "이 단어의 뜻은 무엇입니까?",
          choices,
          answerIndex,
          explanation: `${vocabulary.word}(${vocabulary.reading}) — ${vocabulary.meaning}\n例文: ${vocabulary.example}`,
        },
      });
      return;
    }

    const kanji = KANJI.find((item) => item.id === id);
    if (kanji) {
      const pool = KANJI.map((item) => item.meaning);
      const { choices, answerIndex } = buildChoices(kanji.meaning, pool, id);
      items.push({
        itemId: id,
        type: "kanji",
        countKey: "kanji",
        title: `${kanji.character} (${kanji.meaning})`,
        prompt: kanji.character,
        subPrompt: `${kanji.strokes}획`,
        question: {
          id: `review-${id}`,
          question: "이 한자의 뜻은 무엇입니까?",
          choices,
          answerIndex,
          explanation: `${kanji.character} — ${kanji.meaning} / 음독 ${kanji.onyomi.join("·") || "—"} / 훈독 ${kanji.kunyomi.join("·") || "—"}`,
        },
      });
      return;
    }

    const grammar = GRAMMAR.find((item) => item.id === id);
    if (grammar) {
      const pool = GRAMMAR.map((item) => item.meaning);
      const { choices, answerIndex } = buildChoices(grammar.meaning, pool, id);
      items.push({
        itemId: id,
        type: "grammar",
        countKey: "grammar",
        title: grammar.title,
        prompt: grammar.title,
        subPrompt: grammar.connection,
        question: {
          id: `review-${id}`,
          question: "이 문법의 의미는 무엇입니까?",
          choices,
          answerIndex,
          explanation: `${grammar.title} — ${grammar.meaning}\n${grammar.examples[0]?.jp ?? ""}`,
        },
      });
      return;
    }

    const phrase = BUSINESS_PHRASES.find((item) => item.id === id);
    if (phrase) {
      const pool = BUSINESS_PHRASES.map((item) => item.ko);
      const { choices, answerIndex } = buildChoices(phrase.ko, pool, id);
      items.push({
        itemId: id,
        type: "business",
        countKey: "business",
        title: phrase.jp,
        prompt: phrase.jp,
        subPrompt: phrase.category,
        question: {
          id: `review-${id}`,
          question: "이 표현의 뜻은 무엇입니까?",
          choices,
          answerIndex,
          explanation: `${phrase.jp} — ${phrase.ko}\n${phrase.note}`,
        },
      });
    }
  });

  return items;
}
