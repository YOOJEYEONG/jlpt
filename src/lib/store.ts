"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createSrsState, isDue, markForToday, reviewSrs, type SrsState } from "./srs";
import type { JlptLevel, JobGoal, StudyType } from "./types";
import { diffDays, toDateKey } from "./utils";

export interface DailyGoal {
  vocabulary: number;
  grammar: number;
  kanji: number;
  reading: number;
  listening: number;
  review: number;
  business: number;
}

export const DEFAULT_DAILY_GOAL: DailyGoal = {
  vocabulary: 30,
  grammar: 5,
  kanji: 10,
  reading: 1,
  listening: 1,
  review: 10,
  business: 1,
};

export interface ItemProgress extends SrsState {
  status: "new" | "learning" | "known";
  favorite: boolean;
  lastStudied: string | null;
}

export interface StudyRecord {
  id: string;
  type: StudyType;
  targetId: string;
  title: string;
  correct: boolean | null;
  studiedAt: string;
}

export interface WrongAnswerRecord {
  id: string;
  type: StudyType;
  questionId: string;
  question: string;
  choices: string[];
  chosenIndex: number;
  answerIndex: number;
  explanation: string;
  sourceTitle: string;
  createdAt: string;
  reviewedAt: string | null;
}

export interface MockResult {
  id: string;
  testId: string;
  level: JlptLevel;
  total: number;
  correct: number;
  sectionScores: Record<string, { correct: number; total: number }>;
  takenAt: string;
}

export interface DailyCounts {
  vocabulary: number;
  grammar: number;
  kanji: number;
  reading: number;
  listening: number;
  review: number;
  business: number;
  interview: number;
  seconds: number;
}

function emptyCounts(): DailyCounts {
  return {
    vocabulary: 0,
    grammar: 0,
    kanji: 0,
    reading: 0,
    listening: 0,
    review: 0,
    business: 0,
    interview: 0,
    seconds: 0,
  };
}

export interface UserAccount {
  email: string;
  name: string;
  password: string;
  createdAt: string;
}

export interface UserData {
  currentLevel: JlptLevel;
  targetJlpt: JlptLevel;
  jobGoal: JobGoal;
  dailyGoal: DailyGoal;
  onboarded: boolean;
  levelTestResult: {
    recommended: JlptLevel;
    strong: string[];
    weak: string[];
    score: number;
    total: number;
    takenAt: string;
  } | null;
  progress: Record<string, ItemProgress>;
  history: StudyRecord[];
  wrongAnswers: WrongAnswerRecord[];
  mockResults: MockResult[];
  daily: Record<string, DailyCounts>;
  jobProgress: Record<string, number>;
  drafts: Record<string, string>;
  xp: number;
  streak: number;
  lastStudyDate: string | null;
  badges: string[];
}

export function createUserData(): UserData {
  return {
    currentLevel: "N5",
    targetJlpt: "N1",
    jobGoal: "BOTH",
    dailyGoal: { ...DEFAULT_DAILY_GOAL },
    onboarded: false,
    levelTestResult: null,
    progress: {},
    history: [],
    wrongAnswers: [],
    mockResults: [],
    daily: {},
    jobProgress: {},
    drafts: {},
    xp: 0,
    streak: 0,
    lastStudyDate: null,
    badges: [],
  };
}

type CountKey = keyof Omit<DailyCounts, "seconds">;

interface JsonResponse {
  ok: boolean;
  status: number;
  error?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
}

let serverStorageProbe: Promise<boolean> | null = null;

/** 서버 저장 사용 여부를 한 번만 확인합니다(로그인 화면이 뜨자마자 눌러도 순서가 꼬이지 않도록). */
async function probeServerStorage(): Promise<boolean> {
  if (!serverStorageProbe) {
    serverStorageProbe = fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((body) => Boolean(body?.serverStorage))
      .catch(() => false);
  }
  return serverStorageProbe;
}

/** 네트워크 오류나 서버 저장 미설정을 503으로 통일해 로컬 저장으로 넘어가게 합니다. */
async function postJson(url: string, payload: unknown): Promise<JsonResponse> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, error: body?.error, body };
  } catch {
    return { ok: false, status: 503, error: "서버에 연결할 수 없습니다.", body: {} };
  }
}

const XP_BY_TYPE: Record<CountKey, number> = {
  vocabulary: 4,
  grammar: 6,
  kanji: 5,
  reading: 15,
  listening: 15,
  review: 3,
  business: 8,
  interview: 10,
};

interface AppState {
  accounts: UserAccount[];
  currentEmail: string | null;
  data: Record<string, UserData>;
  /** null = 아직 확인 전, true = 서버 저장 사용, false = 이 브라우저에만 저장 */
  serverStorage: boolean | null;
  syncState: "idle" | "syncing" | "error";

  signUp: (input: { email: string; name: string; password: string }) => Promise<{ ok: boolean; message?: string }>;
  signIn: (input: { email: string; password: string }) => Promise<{ ok: boolean; message?: string }>;
  signOut: () => Promise<void>;
  applyServerSession: (user: { email: string; name: string; createdAt: string }, state: UserData | null) => void;
  setServerStorage: (enabled: boolean) => void;
  setSyncState: (value: "idle" | "syncing" | "error") => void;

  completeOnboarding: (input: { currentLevel: JlptLevel; jobGoal: JobGoal; targetJlpt: JlptLevel }) => void;
  updateSettings: (input: Partial<Pick<UserData, "currentLevel" | "targetJlpt" | "jobGoal" | "dailyGoal">>) => void;
  saveLevelTest: (result: NonNullable<UserData["levelTestResult"]>) => void;
  resetProgress: () => void;

  studyItem: (input: {
    itemId: string;
    type: StudyType;
    countKey: CountKey;
    title: string;
    correct: boolean | null;
    isReview?: boolean;
  }) => void;
  toggleFavorite: (itemId: string) => void;
  addWrongAnswer: (input: Omit<WrongAnswerRecord, "id" | "createdAt" | "reviewedAt">) => void;
  markWrongAnswerReviewed: (id: string) => void;
  clearWrongAnswer: (id: string) => void;
  saveMockResult: (input: Omit<MockResult, "id" | "takenAt">) => void;
  setJobProgress: (category: string, value: number) => void;
  setDraft: (key: string, value: string) => void;
  addStudySeconds: (seconds: number) => void;
}

function applyToCurrent(state: AppState, updater: (data: UserData) => UserData): Partial<AppState> {
  const email = state.currentEmail;
  if (!email) return {};
  const current = state.data[email] ?? createUserData();
  return { data: { ...state.data, [email]: updater(current) } };
}

function bumpStreak(data: UserData): UserData {
  const today = toDateKey();
  if (data.lastStudyDate === today) return data;
  const streak =
    data.lastStudyDate && diffDays(data.lastStudyDate, today) === 1 ? data.streak + 1 : 1;
  return { ...data, streak, lastStudyDate: today };
}

const BADGE_RULES: { id: string; label: string; test: (data: UserData) => boolean }[] = [
  { id: "first-step", label: "첫 학습 완료", test: (d) => d.history.length >= 1 },
  { id: "streak-3", label: "3일 연속 학습", test: (d) => d.streak >= 3 },
  { id: "streak-7", label: "7일 연속 학습", test: (d) => d.streak >= 7 },
  { id: "streak-30", label: "30일 연속 학습", test: (d) => d.streak >= 30 },
  {
    id: "vocab-100",
    label: "단어 100개 학습",
    test: (d) => Object.values(d.daily).reduce((sum, day) => sum + day.vocabulary, 0) >= 100,
  },
  { id: "mock-first", label: "첫 모의고사 응시", test: (d) => d.mockResults.length >= 1 },
  {
    id: "mock-pass",
    label: "모의고사 정답률 60% 달성",
    test: (d) => d.mockResults.some((r) => r.total > 0 && r.correct / r.total >= 0.6),
  },
  { id: "xp-1000", label: "경험치 1,000 달성", test: (d) => d.xp >= 1000 },
  {
    id: "business-10",
    label: "비즈니스 표현 10개 학습",
    test: (d) =>
      Object.values(d.progress).filter((p) => p.status !== "new").length >= 10 &&
      Object.values(d.daily).reduce((sum, day) => sum + day.business, 0) >= 10,
  },
];

function refreshBadges(data: UserData): UserData {
  const earned = BADGE_RULES.filter((rule) => rule.test(data)).map((rule) => rule.id);
  return { ...data, badges: earned };
}

export const BADGE_LABELS: Record<string, string> = Object.fromEntries(
  BADGE_RULES.map((rule) => [rule.id, rule.label]),
);

export const ALL_BADGES = BADGE_RULES.map(({ id, label }) => ({ id, label }));

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      accounts: [],
      currentEmail: null,
      data: {},
      serverStorage: null,
      syncState: "idle",

      signUp: async ({ email, name, password }) => {
        const normalized = email.trim().toLowerCase();
        if (!normalized || !password) return { ok: false, message: "이메일과 비밀번호를 입력해 주세요." };

        // 서버 저장이 없는 환경이면 요청을 보내지 않습니다.
        const useServer = get().serverStorage ?? (await probeServerStorage());
        const server = useServer
          ? await postJson("/api/auth/signup", { email: normalized, name: name.trim(), password })
          : { ok: false, status: 503, body: {} };

        if (server.status === 503) {
          // 서버 저장이 없는 환경에서는 이 브라우저에만 저장합니다.
          if (get().accounts.some((account) => account.email === normalized)) {
            return { ok: false, message: "이미 가입된 이메일입니다." };
          }
          set((state) => ({
            serverStorage: false,
            accounts: [
              ...state.accounts,
              { email: normalized, name: name.trim() || "학습자", password, createdAt: new Date().toISOString() },
            ],
            currentEmail: normalized,
            data: { ...state.data, [normalized]: state.data[normalized] ?? createUserData() },
          }));
          return { ok: true };
        }

        if (!server.ok) return { ok: false, message: server.error ?? "회원가입에 실패했습니다." };

        get().applyServerSession(server.body.user, server.body.state ?? null);
        return { ok: true };
      },

      signIn: async ({ email, password }) => {
        const normalized = email.trim().toLowerCase();

        const useServer = get().serverStorage ?? (await probeServerStorage());
        const server = useServer
          ? await postJson("/api/auth/login", { email: normalized, password })
          : { ok: false, status: 503, body: {} };

        if (server.status === 503) {
          const account = get().accounts.find((item) => item.email === normalized);
          if (!account) return { ok: false, message: "등록되지 않은 이메일입니다." };
          if (account.password !== password) return { ok: false, message: "비밀번호가 일치하지 않습니다." };
          set((state) => ({
            serverStorage: false,
            currentEmail: normalized,
            data: { ...state.data, [normalized]: state.data[normalized] ?? createUserData() },
          }));
          return { ok: true };
        }

        if (!server.ok) return { ok: false, message: server.error ?? "로그인에 실패했습니다." };

        get().applyServerSession(server.body.user, server.body.state ?? null);
        return { ok: true };
      },

      applyServerSession: (user, state) =>
        set((current) => {
          const email = user.email.toLowerCase();
          const accounts = current.accounts.some((account) => account.email === email)
            ? current.accounts.map((account) =>
                account.email === email ? { ...account, name: user.name, createdAt: user.createdAt } : account,
              )
            : [...current.accounts, { email, name: user.name, password: "", createdAt: user.createdAt }];

          return {
            serverStorage: true,
            accounts,
            currentEmail: email,
            data: { ...current.data, [email]: state ?? current.data[email] ?? createUserData() },
          };
        }),

      setServerStorage: (enabled) => set({ serverStorage: enabled }),
      setSyncState: (value) => set({ syncState: value }),

      signOut: async () => {
        if (get().serverStorage !== false) await postJson("/api/auth/logout", {});
        set({ currentEmail: null, syncState: "idle" });
      },

      completeOnboarding: ({ currentLevel, jobGoal, targetJlpt }) =>
        set((state) =>
          applyToCurrent(state, (data) => ({
            ...data,
            currentLevel,
            jobGoal,
            targetJlpt,
            onboarded: true,
          })),
        ),

      updateSettings: (input) =>
        set((state) => applyToCurrent(state, (data) => ({ ...data, ...input }))),

      saveLevelTest: (result) =>
        set((state) =>
          applyToCurrent(state, (data) => ({
            ...data,
            levelTestResult: result,
            currentLevel: result.recommended,
          })),
        ),

      resetProgress: () =>
        set((state) =>
          applyToCurrent(state, (data) => ({
            ...createUserData(),
            currentLevel: data.currentLevel,
            targetJlpt: data.targetJlpt,
            jobGoal: data.jobGoal,
            dailyGoal: data.dailyGoal,
            onboarded: data.onboarded,
          })),
        ),

      studyItem: ({ itemId, type, countKey, title, correct, isReview }) =>
        set((state) =>
          applyToCurrent(state, (data) => {
            const today = toDateKey();
            const previous = data.progress[itemId] ?? { ...createSrsState(), status: "new" as const, favorite: false, lastStudied: null };
            const srs = correct === null ? markForToday(previous) : reviewSrs(previous, correct);
            const status: ItemProgress["status"] =
              correct === false ? "learning" : srs.box >= 3 ? "known" : "learning";

            const dayCounts = { ...(data.daily[today] ?? emptyCounts()) };
            dayCounts[countKey] += 1;
            if (isReview) dayCounts.review += 1;

            const record: StudyRecord = {
              id: `${itemId}-${Date.now()}`,
              type,
              targetId: itemId,
              title,
              correct,
              studiedAt: new Date().toISOString(),
            };

            const next: UserData = {
              ...data,
              progress: {
                ...data.progress,
                [itemId]: { ...srs, status, favorite: previous.favorite, lastStudied: today },
              },
              daily: { ...data.daily, [today]: dayCounts },
              history: [record, ...data.history].slice(0, 300),
              xp: data.xp + XP_BY_TYPE[countKey] + (correct ? 2 : 0),
            };

            return refreshBadges(bumpStreak(next));
          }),
        ),

      toggleFavorite: (itemId) =>
        set((state) =>
          applyToCurrent(state, (data) => {
            const previous =
              data.progress[itemId] ?? { ...createSrsState(), status: "new" as const, favorite: false, lastStudied: null };
            return {
              ...data,
              progress: { ...data.progress, [itemId]: { ...previous, favorite: !previous.favorite } },
            };
          }),
        ),

      addWrongAnswer: (input) =>
        set((state) =>
          applyToCurrent(state, (data) => {
            const filtered = data.wrongAnswers.filter((item) => item.questionId !== input.questionId);
            return {
              ...data,
              wrongAnswers: [
                {
                  ...input,
                  id: `${input.questionId}-${Date.now()}`,
                  createdAt: new Date().toISOString(),
                  reviewedAt: null,
                },
                ...filtered,
              ].slice(0, 200),
            };
          }),
        ),

      markWrongAnswerReviewed: (id) =>
        set((state) =>
          applyToCurrent(state, (data) => ({
            ...data,
            wrongAnswers: data.wrongAnswers.map((item) =>
              item.id === id ? { ...item, reviewedAt: new Date().toISOString() } : item,
            ),
          })),
        ),

      clearWrongAnswer: (id) =>
        set((state) =>
          applyToCurrent(state, (data) => ({
            ...data,
            wrongAnswers: data.wrongAnswers.filter((item) => item.id !== id),
          })),
        ),

      saveMockResult: (input) =>
        set((state) =>
          applyToCurrent(state, (data) => {
            const next: UserData = {
              ...data,
              mockResults: [
                { ...input, id: `${input.testId}-${Date.now()}`, takenAt: new Date().toISOString() },
                ...data.mockResults,
              ].slice(0, 50),
              xp: data.xp + 50,
            };
            return refreshBadges(bumpStreak(next));
          }),
        ),

      setJobProgress: (category, value) =>
        set((state) =>
          applyToCurrent(state, (data) => ({
            ...data,
            jobProgress: { ...data.jobProgress, [category]: value },
          })),
        ),

      setDraft: (key, value) =>
        set((state) =>
          applyToCurrent(state, (data) => ({ ...data, drafts: { ...data.drafts, [key]: value } })),
        ),

      addStudySeconds: (seconds) =>
        set((state) =>
          applyToCurrent(state, (data) => {
            const today = toDateKey();
            const dayCounts = { ...(data.daily[today] ?? emptyCounts()) };
            dayCounts.seconds += seconds;
            return { ...data, daily: { ...data.daily, [today]: dayCounts } };
          }),
        ),
    }),
    {
      name: "nihongo-lms-v1",
      version: 1,
    },
  ),
);

/** 현재 로그인한 사용자의 데이터. 로그인 상태가 아니면 null. */
export function useCurrentUser() {
  const email = useAppStore((state) => state.currentEmail);
  const account = useAppStore((state) => (email ? state.accounts.find((a) => a.email === email) : undefined));
  const data = useAppStore((state) => (email ? state.data[email] : undefined));
  if (!email || !account || !data) return null;
  return { account, data };
}

export function todayCounts(data: UserData): DailyCounts {
  return data.daily[toDateKey()] ?? emptyCounts();
}

export function dueItemIds(data: UserData): string[] {
  const today = toDateKey();
  return Object.entries(data.progress)
    .filter(([, progress]) => progress.status !== "new" && isDue(progress, today))
    .map(([id]) => id);
}

export function levelFromXp(xp: number): { level: number; current: number; needed: number } {
  const level = Math.floor(Math.sqrt(xp / 80)) + 1;
  const currentFloor = 80 * (level - 1) ** 2;
  const nextFloor = 80 * level ** 2;
  return { level, current: xp - currentFloor, needed: nextFloor - currentFloor };
}

export { emptyCounts };
