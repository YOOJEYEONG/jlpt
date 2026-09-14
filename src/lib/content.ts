import type {
  BusinessPhrase,
  KanaChar,
  KanaData,
  Grammar,
  InterviewQuestion,
  JlptLevel,
  Kanji,
  LevelTestQuestion,
  ListeningItem,
  MockTest,
  ReadingPassage,
  RoadmapStage,
  Vocabulary,
} from "./types";

import vocabN5 from "@/data/vocabulary/n5.json";
import vocabN4 from "@/data/vocabulary/n4.json";
import vocabN3 from "@/data/vocabulary/n3.json";
import vocabN2 from "@/data/vocabulary/n2.json";
import vocabN1 from "@/data/vocabulary/n1.json";

import grammarBasic from "@/data/grammar/basic.json";
import grammarN5 from "@/data/grammar/n5.json";
import grammarN4 from "@/data/grammar/n4.json";
import grammarN3 from "@/data/grammar/n3.json";
import grammarN2 from "@/data/grammar/n2.json";
import grammarN1 from "@/data/grammar/n1.json";

import kanjiN5 from "@/data/kanji/n5.json";
import kanjiN4 from "@/data/kanji/n4.json";
import kanjiN3 from "@/data/kanji/n3.json";
import kanjiN2 from "@/data/kanji/n2.json";
import kanjiN1 from "@/data/kanji/n1.json";

import readingN5 from "@/data/reading/n5.json";
import readingN4 from "@/data/reading/n4.json";
import readingN3 from "@/data/reading/n3.json";
import readingN2 from "@/data/reading/n2.json";
import readingN1 from "@/data/reading/n1.json";

import listeningAll from "@/data/listening/all.json";
import businessAll from "@/data/job/business.json";
import interviewAll from "@/data/job/interview.json";
import roadmapAll from "@/data/tests/roadmap.json";
import levelTestAll from "@/data/tests/level-test.json";
import mockAll from "@/data/tests/mock.json";
import kanaAll from "@/data/kana.json";

export const VOCABULARY = [
  ...vocabN5,
  ...vocabN4,
  ...vocabN3,
  ...vocabN2,
  ...vocabN1,
] as Vocabulary[];

export const GRAMMAR = [
  ...grammarBasic,
  ...grammarN5,
  ...grammarN4,
  ...grammarN3,
  ...grammarN2,
  ...grammarN1,
] as Grammar[];

export const KANJI = [...kanjiN5, ...kanjiN4, ...kanjiN3, ...kanjiN2, ...kanjiN1] as Kanji[];

export const READINGS = [
  ...readingN5,
  ...readingN4,
  ...readingN3,
  ...readingN2,
  ...readingN1,
] as ReadingPassage[];

export const LISTENINGS = listeningAll as ListeningItem[];
export const BUSINESS_PHRASES = businessAll as BusinessPhrase[];
export const INTERVIEW_QUESTIONS = interviewAll as InterviewQuestion[];
export const ROADMAP = roadmapAll as RoadmapStage[];
export const LEVEL_TEST = levelTestAll as LevelTestQuestion[];
export const MOCK_TESTS = mockAll as MockTest[];
export const KANA = kanaAll as KanaData;

/** 가나 104자를 한 줄로 펼친 목록. 진도·복습 계산에 씁니다. */
export const KANA_CHARS: KanaChar[] = [
  ...KANA.basic,
  ...KANA.dakuten,
  ...KANA.yoon,
].flatMap((row) => row.chars);

export function findKana(id: string) {
  return KANA_CHARS.find((item) => item.id === id);
}

export const BUSINESS_CATEGORIES = Array.from(
  new Set(BUSINESS_PHRASES.map((phrase) => phrase.category)),
);

export const INTERVIEW_CATEGORIES = Array.from(
  new Set(INTERVIEW_QUESTIONS.map((question) => question.category)),
);

export function byLevel<T extends { level: JlptLevel }>(items: T[], level: JlptLevel | "ALL"): T[] {
  if (level === "ALL") return items;
  return items.filter((item) => item.level === level);
}

export function findVocabulary(id: string) {
  return VOCABULARY.find((item) => item.id === id);
}

export function findGrammar(id: string) {
  return GRAMMAR.find((item) => item.id === id);
}

export function findKanji(id: string) {
  return KANJI.find((item) => item.id === id);
}

export function findReading(id: string) {
  return READINGS.find((item) => item.id === id);
}

export function findListening(id: string) {
  return LISTENINGS.find((item) => item.id === id);
}

export function findMockTest(id: string) {
  return MOCK_TESTS.find((item) => item.id === id);
}

/** 콘텐츠 총량 — 진도율 계산의 분모로 사용합니다. */
export const CONTENT_TOTALS = {
  kana: KANA_CHARS.length,
  vocabulary: VOCABULARY.length,
  grammar: GRAMMAR.length,
  kanji: KANJI.length,
  reading: READINGS.length,
  listening: LISTENINGS.length,
  business: BUSINESS_PHRASES.length,
  interview: INTERVIEW_QUESTIONS.length,
};
