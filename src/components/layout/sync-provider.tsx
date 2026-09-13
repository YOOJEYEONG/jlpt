"use client";

import { useEffect, useRef } from "react";
import { useAppStore, type UserData } from "@/lib/store";

const SAVE_DELAY_MS = 1500;

/**
 * 서버 저장과 브라우저 저장을 잇는 계층.
 * - 화면을 열면 서버 세션을 확인해 로그인 상태와 학습 기록을 되살립니다.
 * - 학습 기록이 바뀌면 잠시 모았다가 서버에 올립니다(마지막 저장이 이깁니다).
 * - 서버가 없거나 연결이 끊기면 브라우저 저장만으로 계속 동작합니다.
 */
export function SyncProvider() {
  const timer = useRef<number | null>(null);
  const lastSent = useRef<string | null>(null);
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    let cancelled = false;

    async function bootstrap() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const body = await response.json();
        if (cancelled) return;

        const store = useAppStore.getState();
        store.setServerStorage(Boolean(body.serverStorage));

        if (!body.serverStorage) return;

        if (body.user) {
          store.applyServerSession(body.user, (body.state as UserData | null) ?? null);
          lastSent.current = body.state ? JSON.stringify(body.state) : null;

          // 서버에 기록이 없고 이 브라우저에만 있다면 그대로 올려 둡니다.
          if (!body.state) {
            const local = useAppStore.getState().data[body.user.email.toLowerCase()];
            if (local) void save(local);
          }
        } else if (store.currentEmail) {
          // 세션이 만료된 상태 — 다시 로그인하도록 로그아웃 처리합니다.
          useAppStore.setState({ currentEmail: null });
        }
      } catch {
        useAppStore.getState().setServerStorage(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = useAppStore.subscribe((state) => {
      if (!state.serverStorage || !state.currentEmail) return;
      const data = state.data[state.currentEmail];
      if (!data) return;

      const serialized = JSON.stringify(data);
      if (serialized === lastSent.current) return;

      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        lastSent.current = serialized;
        void save(data);
      }, SAVE_DELAY_MS);
    });

    return () => {
      unsubscribe();
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  return null;
}

async function save(state: UserData) {
  const store = useAppStore.getState();
  store.setSyncState("syncing");
  try {
    const response = await fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    });
    store.setSyncState(response.ok ? "idle" : "error");
  } catch {
    store.setSyncState("error");
  }
}
