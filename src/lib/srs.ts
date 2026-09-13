import { addDays, toDateKey } from "./utils";

/**
 * 간격 반복 복습 주기(일). 정답을 맞힐 때마다 한 칸씩 올라가 간격이 길어집니다.
 * 틀린 항목은 0칸으로 떨어지고 "오늘 다시"로 예약되어, 같은 날 복습에 바로 다시 나옵니다.
 */
export const SRS_INTERVALS = [1, 3, 7, 14, 30, 60] as const;

/** 박스 0 = 오늘 다시, 박스 1~6 = SRS_INTERVALS의 각 간격. */
export const MAX_BOX = SRS_INTERVALS.length;

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
      nextReview: addDays(today, SRS_INTERVALS[box - 1]),
      correctCount: base.correctCount + 1,
      wrongCount: base.wrongCount,
    };
  }

  return {
    box: 0,
    nextReview: today,
    correctCount: base.correctCount,
    wrongCount: base.wrongCount + 1,
  };
}

/** "다시 보기"처럼 정답/오답 판정 없이 넘긴 항목은 당일 복습으로 돌립니다. */
export function markForToday(state: SrsState | undefined): SrsState {
  const base = state ?? createSrsState();
  return { ...base, box: 0, nextReview: toDateKey() };
}

export function isDue(state: SrsState | undefined, today = toDateKey()): boolean {
  if (!state) return false;
  return state.nextReview <= today;
}

export function srsLabel(box: number): string {
  if (box <= 0) return "오늘 다시 복습";
  if (box >= MAX_BOX) return "장기 기억 (60일 후)";
  return `${SRS_INTERVALS[box - 1]}일 후 복습`;
}
