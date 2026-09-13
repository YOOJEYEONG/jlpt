"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const RATES = [0.7, 0.85, 1, 1.15];

/**
 * 실제 MP3가 있으면 오디오 태그로 재생하고, 없으면 스크립트를 브라우저 음성 합성으로 읽어 줍니다.
 * 나중에 audioUrl만 채우면 동일한 UI로 실제 음원이 재생됩니다.
 */
export function AudioPlayer({
  audioUrl,
  lines,
  durationSec,
}: {
  audioUrl: string | null;
  lines: string[];
  durationSec: number;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function stop() {
    setPlaying(false);
    if (audioRef.current) audioRef.current.pause();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  function play() {
    if (audioUrl && audioRef.current) {
      audioRef.current.playbackRate = rate;
      void audioRef.current.play();
      setPlaying(true);
      return;
    }
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    setPlaying(true);
    lines.forEach((line, index) => {
      const utterance = new SpeechSynthesisUtterance(line);
      utterance.lang = "ja-JP";
      utterance.rate = rate * 0.95;
      if (index === lines.length - 1) utterance.onend = () => setPlaying(false);
      window.speechSynthesis.speak(utterance);
    });
  }

  return (
    <div className="rounded-2xl bg-background p-4">
      {audioUrl ? (
        <audio ref={audioRef} src={audioUrl} onEnded={() => setPlaying(false)} className="hidden" />
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => (playing ? stop() : play())}
          aria-label={playing ? "일시정지" : "재생"}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-[#2549b4]"
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-0.5" />}
        </button>

        <button
          onClick={() => {
            stop();
            setTimeout(play, 120);
          }}
          className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-semibold"
        >
          <RotateCcw className="h-3.5 w-3.5" /> 다시 듣기
        </button>

        <div className="flex items-center gap-1">
          <span className="mr-1 text-xs text-muted">속도</span>
          {RATES.map((value) => (
            <button
              key={value}
              onClick={() => setRate(value)}
              className={cn(
                "rounded-lg px-2 py-1 text-xs font-semibold transition-colors",
                rate === value ? "bg-primary text-white" : "bg-surface text-muted",
              )}
            >
              {value}x
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs text-muted">약 {durationSec}초</span>
      </div>

      {!audioUrl ? (
        <p className="mt-3 text-[11px] leading-relaxed text-muted">
          현재는 음원 파일 대신 브라우저 음성 합성으로 재생합니다. 데이터의 audioUrl에 MP3 경로를 넣으면
          같은 화면에서 실제 음원이 재생됩니다.
        </p>
      ) : null}
    </div>
  );
}
