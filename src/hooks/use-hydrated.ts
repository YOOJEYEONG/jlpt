"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** localStorage 기반 스토어가 복원되기 전까지 서버/클라이언트 불일치를 막습니다. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
