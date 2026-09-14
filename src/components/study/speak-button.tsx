"use client";

import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn, speakJapanese } from "@/lib/utils";
import { useJapaneseVoiceAvailable } from "@/hooks/use-japanese-voice";

/**
 * 발음 재생 버튼.
 * 기기에 일본어 음성이 없으면 잘못된 발음을 들려주는 대신 이유를 알려 줍니다.
 */
export function SpeakButton({
  text,
  label = "발음 듣기",
  className,
  variant = "icon",
}: {
  text: string;
  label?: string;
  className?: string;
  variant?: "icon" | "text";
}) {
  const available = useJapaneseVoiceAvailable();
  const [failed, setFailed] = useState(false);

  function play() {
    if (speakJapanese(text)) return;
    setFailed(true);
    window.setTimeout(() => setFailed(false), 4000);
  }

  const title = available ? label : "이 기기에 일본어 음성이 설치되어 있지 않습니다";

  if (variant === "text") {
    return (
      <span className="inline-flex flex-col items-start">
        <button
          onClick={play}
          title={title}
          className={cn("inline-flex items-center gap-1 text-xs font-semibold text-primary", !available && "text-muted", className)}
        >
          {available ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          {label}
        </button>
        {failed ? <span className="mt-1 text-[11px] text-danger">{title}</span> : null}
      </span>
    );
  }

  return (
    <button
      aria-label={label}
      title={title}
      onClick={play}
      className={cn("rounded-lg p-2 text-muted hover:bg-background hover:text-primary", !available && "opacity-50", className)}
    >
      {available ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
    </button>
  );
}

/** 일본어 음성이 없을 때 페이지 상단에 한 번 보여 주는 안내. */
export function VoiceNotice() {
  const available = useJapaneseVoiceAvailable();
  if (available) return null;

  return (
    <p className="mb-4 rounded-xl bg-accent-soft px-4 py-3 text-xs leading-relaxed text-accent">
      <span className="font-bold">발음 재생을 사용할 수 없습니다.</span> 이 기기에 일본어 음성이 설치되어
      있지 않습니다. 설치 전까지 발음 버튼은 동작하지 않습니다.
      <br />
      macOS: 시스템 설정 → 손쉬운 사용 → 읽기 콘텐츠 → 시스템 음성 → 일본어 음성 추가
      <br />
      Windows: 설정 → 시간 및 언어 → 언어 및 지역 → 일본어 추가(음성 포함)
    </p>
  );
}
