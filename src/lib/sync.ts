"use client";

import { useAppStore, type UserData } from "./store";

const SAVE_DELAY_MS = 1500;

let started = false;
let saveTimer: number | null = null;
let lastSerialized: string | null = null;

/** 서버와 브라우저 중 더 많이 진행된 쪽을 고릅니다(경험치는 줄어들지 않으므로 기준으로 쓸 수 있습니다). */
function isLocalAhead(local: UserData | undefined, server: UserData | null): boolean {
  if (!local) return false;
  if (!server) return true;
  if (local.xp !== server.xp) return local.xp > server.xp;
  return local.history.length > server.history.length;
}

async function save(state: UserData): Promise<void> {
  const store = useAppStore.getState();
  store.setSyncState("syncing");
  try {
    const response = await fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
      keepalive: true,
    });
    store.setSyncState(response.ok ? "idle" : "error");
  } catch {
    store.setSyncState("error");
  }
}

/** 예약된 저장을 취소합니다(로그아웃 시). */
export function cancelPendingSync(): void {
  if (saveTimer !== null) window.clearTimeout(saveTimer);
  saveTimer = null;
  lastSerialized = null;
}

/** 예약된 저장을 즉시 실행합니다(탭을 닫거나 숨길 때 호출). */
export function flushSync(): void {
  if (saveTimer === null) return;
  window.clearTimeout(saveTimer);
  saveTimer = null;

  const state = useAppStore.getState();
  if (!state.serverStorage || !state.currentEmail) return;
  const data = state.data[state.currentEmail];
  if (data) void save(data);
}

/**
 * 페이지를 한 번 열 때 한 번만 실행됩니다.
 * 컴포넌트가 다시 마운트돼도 서버 기록을 다시 덮어쓰거나 예약된 저장을 취소하지 않도록
 * 타이머와 구독을 모듈 수준에 둡니다.
 */
export function startSync(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  void bootstrap();

  useAppStore.subscribe((state) => {
    if (!state.serverStorage || !state.currentEmail) return;
    const data = state.data[state.currentEmail];
    if (!data) return;

    const serialized = JSON.stringify(data);
    if (serialized === lastSerialized) return;
    lastSerialized = serialized;

    if (saveTimer !== null) window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      saveTimer = null;
      // 대기 중에 로그아웃했다면 보내지 않습니다(세션이 없어 401이 납니다).
      const now = useAppStore.getState();
      if (!now.serverStorage || !now.currentEmail) return;
      void save(data);
    }, SAVE_DELAY_MS);
  });

  window.addEventListener("pagehide", flushSync);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushSync();
  });
}

async function bootstrap(): Promise<void> {
  const store = useAppStore.getState();

  try {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    const body = await response.json();

    store.setServerStorage(Boolean(body.serverStorage));
    if (!body.serverStorage) return;

    if (!body.user) {
      // 세션이 없거나 만료됨 — 로그인 상태를 정리합니다.
      if (useAppStore.getState().currentEmail) useAppStore.setState({ currentEmail: null });
      return;
    }

    const email = String(body.user.email).toLowerCase();
    const serverState = (body.state as UserData | null) ?? null;
    const localState = useAppStore.getState().data[email];

    if (isLocalAhead(localState, serverState)) {
      // 오프라인에서 더 공부한 기록이 있으면 그것을 서버에 올립니다.
      useAppStore.getState().applyServerSession(body.user, localState);
      lastSerialized = JSON.stringify(localState);
      await save(localState);
      return;
    }

    useAppStore.getState().applyServerSession(body.user, serverState);
    lastSerialized = serverState ? JSON.stringify(serverState) : null;

    if (!serverState) {
      const fresh = useAppStore.getState().data[email];
      if (fresh) {
        lastSerialized = JSON.stringify(fresh);
        await save(fresh);
      }
    }
  } catch {
    useAppStore.getState().setServerStorage(false);
  }
}
