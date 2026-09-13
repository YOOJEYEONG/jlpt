export type JlptLevel = "BASIC" | "N5" | "N4" | "N3" | "N2" | "N1";

export const JLPT_LEVELS: JlptLevel[] = ["BASIC", "N5", "N4", "N3", "N2", "N1"];

export const LEVEL_LABEL: Record<JlptLevel, string> = {
  BASIC: "기초",
  N5: "N5",
  N4: "N4",
  N3: "N3",
  N2: "N2",
  N1: "N1",
};

export type JobGoal = "JLPT_N1" | "JAPAN_JOB" | "BOTH";

export type StudyType =
  | "vocabulary"
  | "grammar"
  | "kanji"
  | "reading"
  | "listening"
  | "business"
  | "interview"
  | "mock";

export interface Vocabulary {
  id: string;
  word: string;
  reading: string;
  meaning: string;
  partOfSpeech: string;
  level: JlptLevel;
  example: string;
  exampleReading: string;
  exampleTranslation: string;
  importance: 1 | 2 | 3;
  tags?: string[];
}

export interface Grammar {
  id: string;
  title: string;
  meaning: string;
  connection: string;
  explanation: string;
  level: JlptLevel;
  difficulty: 1 | 2 | 3;
  examples: { jp: string; reading: string; ko: string }[];
  related: { title: string; difference: string }[];
  examPoint: string;
}

export interface Kanji {
  id: string;
  character: string;
  meaning: string;
  onyomi: string[];
  kunyomi: string[];
  strokes: number;
  level: JlptLevel;
  words: { word: string; reading: string; meaning: string }[];
  example: { jp: string; ko: string };
}

export type ReadingPassageType =
  | "단문"
  | "공지문"
  | "이메일"
  | "광고"
  | "기사"
  | "설명문"
  | "논설문"
  | "장문";

export interface QuizQuestion {
  id: string;
  question: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
  relatedGrammar?: string;
  relatedVocabulary?: string;
}

export interface ReadingPassage {
  id: string;
  title: string;
  type: ReadingPassageType;
  level: JlptLevel;
  content: string;
  translation: string;
  vocabHints: { word: string; reading: string; meaning: string }[];
  questions: QuizQuestion[];
}

export interface ListeningItem {
  id: string;
  title: string;
  level: JlptLevel;
  audioUrl: string | null;
  durationSec: number;
  scene: string;
  transcript: { speaker: string; jp: string; ko: string }[];
  keyExpressions: { jp: string; ko: string }[];
  questions: QuizQuestion[];
}

export type MockSection = "문자·어휘" | "문법" | "독해" | "청해";

export interface MockQuestion extends QuizQuestion {
  section: MockSection;
  passage?: string;
  script?: string;
}

export interface MockTest {
  id: string;
  level: JlptLevel;
  title: string;
  minutes: number;
  questions: MockQuestion[];
}

export interface LevelTestQuestion extends QuizQuestion {
  level: JlptLevel;
  area: "어휘" | "문법" | "한자" | "독해";
}

export type BusinessCategory =
  | "기본 비즈니스 표현"
  | "존경어"
  | "겸양어"
  | "정중어"
  | "전화"
  | "이메일"
  | "회의"
  | "보고"
  | "부탁"
  | "거절"
  | "일정 조율";

export interface BusinessPhrase {
  id: string;
  category: BusinessCategory;
  jp: string;
  reading: string;
  ko: string;
  situation: string;
  note: string;
  casual?: string;
}

export interface InterviewQuestion {
  id: string;
  category: string;
  questionJp: string;
  questionReading: string;
  questionKo: string;
  sampleAnswerJp: string;
  sampleAnswerKo: string;
  keyExpressions: { jp: string; ko: string }[];
  tip: string;
}

export interface RoadmapStage {
  level: JlptLevel;
  name: string;
  months: string;
  words: number;
  kanji: number;
  grammar: number;
  reading: number;
  listening: number;
  description: string;
  goals: string[];
}
