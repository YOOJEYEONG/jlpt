import {
  BUSINESS_PHRASES,
  GRAMMAR,
  KANJI,
  LISTENINGS,
  READINGS,
  VOCABULARY,
} from "./content";
import { isDue } from "./srs";
import type { JlptLevel } from "./types";
import { JLPT_LEVELS } from "./types";
import type { DailyCounts, UserData } from "./store";
import { toDateKey } from "./utils";

/** 현재 레벨에서 학습할 콘텐츠 레벨. 기초 단계는 기초 + N5를 함께 봅니다. */
export function studyLevels(currentLevel: JlptLevel): JlptLevel[] {
  if (currentLevel === "BASIC") return ["BASIC", "N5"];
  return [currentLevel];
}

function pickUnlearned<T extends { id: string; level: JlptLevel }>(
  items: T[],
  data: UserData,
  levels: JlptLevel[],
  limit: number,
): T[] {
  const pool = items.filter((item) => levels.includes(item.level));
  const fresh = pool.filter((item) => !data.progress[item.id] || data.progress[item.id].status === "new");
  const rest = pool.filter((item) => data.progress[item.id] && data.progress[item.id].status === "learning");
  return [...fresh, ...rest].slice(0, limit);
}

export interface TodayPlanEntry {
  key: keyof Omit<DailyCounts, "seconds">;
  label: string;
  href: string;
  goal: number;
  done: number;
  ids: string[];
}

export interface TodayPlan {
  entries: TodayPlanEntry[];
  totalGoal: number;
  totalDone: number;
  completed: boolean;
  dueIds: string[];
}

export function buildTodayPlan(data: UserData): TodayPlan {
  const today = toDateKey();
  const counts = data.daily[today];
  const levels = studyLevels(data.currentLevel);
  const goal = data.dailyGoal;

  const dueIds = Object.entries(data.progress)
    .filter(([, progress]) => progress.status !== "new" && isDue(progress, today))
    .map(([id]) => id);

  const vocabulary = pickUnlearned(VOCABULARY, data, levels, goal.vocabulary);
  const grammar = pickUnlearned(GRAMMAR, data, levels, goal.grammar);
  const kanji = pickUnlearned(KANJI, data, levels, goal.kanji);
  const reading = pickUnlearned(READINGS, data, levels, goal.reading);
  const listening = pickUnlearned(LISTENINGS, data, levels, goal.listening);
  const business = BUSINESS_PHRASES.filter(
    (phrase) => !data.progress[phrase.id] || data.progress[phrase.id].status === "new",
  ).slice(0, goal.business);

  const allEntries: TodayPlanEntry[] = [
    { key: "vocabulary", label: "단어", href: "/vocabulary", goal: Math.min(goal.vocabulary, vocabulary.length || goal.vocabulary), done: counts?.vocabulary ?? 0, ids: vocabulary.map((item) => item.id) },
    { key: "kanji", label: "한자", href: "/kanji", goal: Math.min(goal.kanji, kanji.length || goal.kanji), done: counts?.kanji ?? 0, ids: kanji.map((item) => item.id) },
    { key: "grammar", label: "문법", href: "/grammar", goal: Math.min(goal.grammar, grammar.length || goal.grammar), done: counts?.grammar ?? 0, ids: grammar.map((item) => item.id) },
    { key: "reading", label: "독해", href: "/reading", goal: Math.min(goal.reading, reading.length || goal.reading), done: counts?.reading ?? 0, ids: reading.map((item) => item.id) },
    { key: "listening", label: "청해", href: "/listening", goal: Math.min(goal.listening, listening.length || goal.listening), done: counts?.listening ?? 0, ids: listening.map((item) => item.id) },
    { key: "review", label: "복습", href: "/review", goal: Math.min(goal.review, dueIds.length), done: counts?.review ?? 0, ids: dueIds.slice(0, goal.review) },
    { key: "business", label: "비즈니스 일본어", href: "/business-japanese", goal: Math.min(goal.business, business.length || goal.business), done: counts?.business ?? 0, ids: business.map((item) => item.id) },
  ];

  const entries = allEntries.filter((entry) => entry.goal > 0);

  const totalGoal = entries.reduce((sum, entry) => sum + entry.goal, 0);
  const totalDone = entries.reduce((sum, entry) => sum + Math.min(entry.done, entry.goal), 0);

  return {
    entries,
    totalGoal,
    totalDone,
    completed: totalGoal > 0 && totalDone >= totalGoal,
    dueIds,
  };
}

export interface AreaProgress {
  key: string;
  label: string;
  studied: number;
  total: number;
  accuracy: number | null;
}

function accuracyOf(data: UserData, ids: string[]): number | null {
  let correct = 0;
  let wrong = 0;
  ids.forEach((id) => {
    const progress = data.progress[id];
    if (!progress) return;
    correct += progress.correctCount;
    wrong += progress.wrongCount;
  });
  if (correct + wrong === 0) return null;
  return Math.round((correct / (correct + wrong)) * 100);
}

export function areaProgress(data: UserData): AreaProgress[] {
  const sets = [
    { key: "vocabulary", label: "어휘", items: VOCABULARY },
    { key: "grammar", label: "문법", items: GRAMMAR },
    { key: "kanji", label: "한자", items: KANJI },
    { key: "reading", label: "독해", items: READINGS },
    { key: "listening", label: "청해", items: LISTENINGS },
    { key: "business", label: "비즈니스", items: BUSINESS_PHRASES },
  ];

  return sets.map((set) => {
    const ids = set.items.map((item) => item.id);
    const studied = ids.filter((id) => data.progress[id] && data.progress[id].status !== "new").length;
    return {
      key: set.key,
      label: set.label,
      studied,
      total: ids.length,
      accuracy: accuracyOf(data, ids),
    };
  });
}

/** 목표 레벨까지 남은 학습량(현재 수록 콘텐츠 기준). */
export function remainingToTarget(data: UserData) {
  const targetIndex = JLPT_LEVELS.indexOf(data.targetJlpt);
  const inScope = <T extends { id: string; level: JlptLevel }>(items: T[]) =>
    items.filter((item) => JLPT_LEVELS.indexOf(item.level) <= targetIndex);

  const all = [
    ...inScope(VOCABULARY),
    ...inScope(GRAMMAR),
    ...inScope(KANJI),
    ...inScope(READINGS),
    ...inScope(LISTENINGS),
  ];
  const done = all.filter((item) => data.progress[item.id] && data.progress[item.id].status !== "new").length;

  return { done, total: all.length, remaining: all.length - done };
}

export const JOB_READINESS_KEYS = [
  { key: "japanese", label: "일본어 실력" },
  { key: "jlpt", label: "JLPT N1" },
  { key: "business", label: "비즈니스 일본어" },
  { key: "interview", label: "면접 준비" },
  { key: "resume", label: "이력서 준비" },
] as const;

export function jobReadiness(data: UserData) {
  const areas = areaProgress(data);
  const find = (key: string) => areas.find((area) => area.key === key);

  const vocab = find("vocabulary");
  const grammar = find("grammar");
  const kanji = find("kanji");
  const business = find("business");

  const japanese = Math.round(
    (((vocab?.studied ?? 0) / Math.max(1, vocab?.total ?? 1)) * 0.4 +
      ((grammar?.studied ?? 0) / Math.max(1, grammar?.total ?? 1)) * 0.3 +
      ((kanji?.studied ?? 0) / Math.max(1, kanji?.total ?? 1)) * 0.3) *
      100,
  );

  const n1Mock = data.mockResults.filter((result) => result.level === "N1");
  const bestN1 = n1Mock.reduce((best, result) => Math.max(best, result.correct / Math.max(1, result.total)), 0);
  const jlpt = Math.round(bestN1 * 100);

  const businessPercent = Math.round(((business?.studied ?? 0) / Math.max(1, business?.total ?? 1)) * 100);

  const interviewStudied = Object.entries(data.progress).filter(
    ([id, progress]) => id.startsWith("i-") && progress.status !== "new",
  ).length;
  const interview = Math.round((interviewStudied / 12) * 100);

  const resume = data.jobProgress.resume ?? 0;

  return [
    { key: "japanese", label: "일본어 실력", value: Math.min(100, japanese) },
    { key: "jlpt", label: "JLPT N1", value: Math.min(100, jlpt) },
    { key: "business", label: "비즈니스 일본어", value: Math.min(100, businessPercent) },
    { key: "interview", label: "면접 준비", value: Math.min(100, interview) },
    { key: "resume", label: "이력서 준비", value: Math.min(100, resume) },
  ];
}
