"use client";

import { useEffect } from "react";
import { startSync } from "@/lib/sync";

/**
 * 서버 저장과 브라우저 저장을 잇습니다.
 * 실제 동작은 모듈 수준에서 한 번만 시작되므로, 이 컴포넌트가 여러 번 마운트돼도 안전합니다.
 */
export function SyncProvider() {
  useEffect(() => {
    startSync();
  }, []);

  return null;
}
