import { addDays, toDateKey } from "./utils";

/** 간격 반복 복습 주기(일). 박스가 올라갈수록 간격이 길어집니다. */
export const SRS_INTERVALS = [1, 3, 7, 14, 30, 60] as const;

export const MAX_BOX = SRS_INTERVALS.length - 1;

export interface SrsState {
  box: number;
  nextReview: string;
  correctCount: number;
  wrongCount: number;
}

export function createSrsState(): SrsState {
  return { box: 0, nextReview: toDateKey(), correctCount: 0, wrongCount: 0 };
}

export function reviewSrs(state: SrsState | undefined, correct: boolean): SrsState {
  const base = state ?? createSrsState();
  const today = toDateKey();

  if (correct) {
    const box = Math.min(base.box + 1, MAX_BOX);
    return {
      box,
      nextReview: addDays(today, SRS_INTERVALS[box]),
      correctCount: base.correctCount + 1,
      wrongCount: base.wrongCount,
    };
  }

  return {
    box: 0,
    nextReview: addDays(today, SRS_INTERVALS[0]),
    correctCount: base.correctCount,
    wrongCount: base.wrongCount + 1,
  };
}

export function isDue(state: SrsState | undefined, today = toDateKey()): boolean {
  if (!state) return false;
  return state.nextReview <= today;
}

export function srsLabel(box: number): string {
  if (box <= 0) return "학습 시작";
  if (box >= MAX_BOX) return "장기 기억";
  return `${SRS_INTERVALS[box]}일 후 복습`;
}
