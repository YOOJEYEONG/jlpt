"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

const TICK_SECONDS = 15;

/** 탭이 보이는 동안 학습 시간을 누적합니다. */
export function StudyTimer() {
  const addStudySeconds = useAppStore((state) => state.addStudySeconds);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        addStudySeconds(TICK_SECONDS);
      }
    }, TICK_SECONDS * 1000);
    return () => window.clearInterval(timer);
  }, [addStudySeconds]);

  return null;
}
