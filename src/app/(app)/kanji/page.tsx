"use client";

import { useMemo, useState } from "react";
import { Check, Star } from "lucide-react";
import { Badge, LevelBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { KANJI } from "@/lib/content";
import { useAppStore, useCurrentUser } from "@/lib/store";
import { JLPT_LEVELS, LEVEL_LABEL, type JlptLevel } from "@/lib/types";
import { cn, percent } from "@/lib/utils";
import { SpeakButton, VoiceNotice } from "@/components/study/speak-button";

type LevelFilter = JlptLevel | "ALL";

const LEVEL_OPTIONS: { value: LevelFilter; label: string }[] = [
  { value: "ALL", label: "전체" },
  ...JLPT_LEVELS.filter((level) => level !== "BASIC").map((level) => ({
    value: level as LevelFilter,
    label: LEVEL_LABEL[level],
  })),
];

export default function KanjiPage() {
  const user = useCurrentUser();
  const studyItem = useAppStore((state) => state.studyItem);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);

  const [level, setLevel] = useState<LevelFilter>(
    user?.data.currentLevel === "BASIC" ? "N5" : (user?.data.currentLevel ?? "ALL"),
  );
  const items = useMemo(
    () => (level === "ALL" ? KANJI : KANJI.filter((item) => item.level === level)),
    [level],
  );
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);

  const progress = user?.data.progress ?? {};
  if (!user) return null;

  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  const learned = items.filter((item) => progress[item.id] && progress[item.id].status !== "new").length;

  function complete(correct: boolean) {
    if (!selected) return;
    studyItem({
      itemId: selected.id,
      type: "kanji",
      countKey: "kanji",
      title: `${selected.character} (${selected.meaning})`,
      correct,
      isReview: progress[selected.id]?.status === "learning",
    });
  }

  return (
    <div className="animate-fade-up">
      <VoiceNotice />
      <PageHeader title="한자 학습" description="음독 · 훈독 · 대표 단어 · 예문을 함께 익힙니다." />

      <div className="mb-4 space-y-3">
        <Tabs
          value={level}
          onChange={(value) => {
            setLevel(value);
            const next = value === "ALL" ? KANJI : KANJI.filter((item) => item.level === value);
            setSelectedId(next[0]?.id ?? null);
          }}
          options={LEVEL_OPTIONS}
        />
        <Progress value={percent(learned, items.length)} label={`학습한 한자 ${learned} / ${items.length}`} />
      </div>

      {items.length === 0 || !selected ? (
        <EmptyState title="표시할 한자가 없습니다" description="다른 레벨을 선택해 보세요." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <Card>
            <CardTitle>한자 목록</CardTitle>
            <ul className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
              {items.map((item) => {
                const state = progress[item.id];
                const active = item.id === selected.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setSelectedId(item.id)}
                      aria-pressed={active}
                      className={cn(
                        "jp flex aspect-square w-full items-center justify-center rounded-xl border text-2xl font-bold transition-colors",
                        active
                          ? "border-primary bg-primary text-white"
                          : state && state.status !== "new"
                            ? "border-transparent bg-[#e8f7ee] text-success"
                            : "border-line bg-surface hover:border-[#c9d2e6]",
                      )}
                    >
                      {item.character}
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <div className="flex items-start justify-between">
              <LevelBadge level={selected.level} />
              <button
                aria-label="즐겨찾기"
                onClick={() => toggleFavorite(selected.id)}
                className={cn("rounded-lg p-2", progress[selected.id]?.favorite ? "text-accent" : "text-muted")}
              >
                <Star className={cn("h-4 w-4", progress[selected.id]?.favorite && "fill-current")} />
              </button>
            </div>

            <div className="mt-2 flex items-center gap-5">
              <div
                className="jp flex h-28 w-28 items-center justify-center rounded-2xl border border-dashed border-line text-6xl font-bold"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #eceef2 1px, transparent 1px), linear-gradient(to bottom, #eceef2 1px, transparent 1px)",
                  backgroundSize: "50% 50%",
                }}
              >
                {selected.character}
              </div>
              <div>
                <p className="text-lg font-bold">{selected.meaning}</p>
                <p className="mt-1 text-xs text-muted">총 {selected.strokes}획</p>
                <SpeakButton
                  className="mt-2"
                  variant="text"
                  label="대표 단어 듣기"
                  text={selected.words[0]?.reading ?? selected.onyomi[0] ?? ""}
                />
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl bg-background p-3">
                <p className="text-xs font-bold text-muted">음독</p>
                <p className="jp mt-1 text-sm">{selected.onyomi.join(" · ") || "—"}</p>
              </div>
              <div className="rounded-xl bg-background p-3">
                <p className="text-xs font-bold text-muted">훈독</p>
                <p className="jp mt-1 text-sm">{selected.kunyomi.join(" · ") || "—"}</p>
              </div>
            </div>

            <div className="mt-3">
              <p className="text-xs font-bold text-muted">대표 단어</p>
              <ul className="mt-2 space-y-1.5">
                {selected.words.map((word) => (
                  <li key={word.word} className="flex items-center justify-between rounded-xl bg-primary-soft px-3 py-2">
                    <span>
                      <span className="jp text-sm font-bold">{word.word}</span>
                      <span className="jp ml-2 text-xs text-primary/70">{word.reading}</span>
                    </span>
                    <span className="text-xs text-foreground/80">{word.meaning}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-3 rounded-xl bg-background p-3">
              <p className="text-xs font-bold text-muted">예문</p>
              <p className="jp mt-1 text-sm">{selected.example.jp}</p>
              <p className="mt-1 text-xs text-muted">{selected.example.ko}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => complete(true)} className="bg-success hover:bg-[#12833c]">
                <Check className="h-4 w-4" /> 외웠어요
              </Button>
              <Button variant="outline" onClick={() => complete(false)}>
                아직 헷갈려요
              </Button>
              {progress[selected.id] ? (
                <Badge className="self-center">다음 복습 {progress[selected.id].nextReview}</Badge>
              ) : null}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
