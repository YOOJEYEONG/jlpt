"use client";

import { useSyncExternalStore } from "react";
import { hasJapaneseVoice } from "@/lib/utils";

/** 음성 목록은 비동기로 로드됩니다. voiceschanged 이벤트와 한 번의 지연 확인으로 갱신합니다. */
function subscribe(onChange: () => void) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return () => {};
  const synth = window.speechSynthesis;
  synth.addEventListener?.("voiceschanged", onChange);
  const timer = window.setTimeout(onChange, 800);
  return () => {
    synth.removeEventListener?.("voiceschanged", onChange);
    window.clearTimeout(timer);
  };
}

/** 이 기기에서 일본어 발음을 재생할 수 있는지. 서버 렌더링 중에는 true로 둡니다. */
export function useJapaneseVoiceAvailable(): boolean {
  return useSyncExternalStore(subscribe, hasJapaneseVoice, () => true);
}
