"use client";

import { useMemo, useState } from "react";
import { Check, RotateCcw, Star, Volume2, X } from "lucide-react";
import { Badge, LevelBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { VOCABULARY } from "@/lib/content";
import { srsLabel } from "@/lib/srs";
import { useAppStore, useCurrentUser } from "@/lib/store";
import { JLPT_LEVELS, LEVEL_LABEL, type JlptLevel } from "@/lib/types";
import { cn, percent, speakJapanese } from "@/lib/utils";

type LevelFilter = JlptLevel | "ALL";
type Mode = "learn" | "card" | "list";

const LEVEL_OPTIONS: { value: LevelFilter; label: string }[] = [
  { value: "ALL", label: "전체" },
  ...JLPT_LEVELS.filter((level) => level !== "BASIC").map((level) => ({
    value: level as LevelFilter,
    label: LEVEL_LABEL[level],
  })),
];

export default function VocabularyPage() {
  const user = useCurrentUser();
  const studyItem = useAppStore((state) => state.studyItem);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);

  const [level, setLevel] = useState<LevelFilter>(user?.data.currentLevel === "BASIC" ? "N5" : (user?.data.currentLevel ?? "ALL"));
  const [mode, setMode] = useState<Mode>("learn");
  const [onlyFavorite, setOnlyFavorite] = useState(false);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const progress = useMemo(() => user?.data.progress ?? {}, [user]);

  const items = useMemo(() => {
    let pool = level === "ALL" ? VOCABULARY : VOCABULARY.filter((item) => item.level === level);
    if (onlyFavorite) pool = pool.filter((item) => progress[item.id]?.favorite);
    return pool;
  }, [level, onlyFavorite, progress]);

  if (!user) return null;

  const learned = items.filter((item) => progress[item.id] && progress[item.id].status !== "new").length;
  const current = items[Math.min(index, Math.max(0, items.length - 1))];

  function answer(correct: boolean | null) {
    if (!current) return;
    studyItem({
      itemId: current.id,
      type: "vocabulary",
      countKey: "vocabulary",
      title: `${current.word} (${current.reading})`,
      correct,
      isReview: progress[current.id]?.status === "learning",
    });
    setRevealed(false);
    setIndex((prev) => (prev + 1) % Math.max(1, items.length));
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="단어 학습"
        description={
          mode === "learn"
            ? "읽기와 뜻, 예문을 함께 보면서 단어를 익힙니다. 다 외웠다면 테스트 모드로 확인하세요."
            : mode === "card"
              ? "뜻을 떠올린 뒤 카드를 확인하고, 아는지 모르는지 직접 평가하세요. 결과에 따라 복습 날짜가 정해집니다."
              : "레벨별 단어를 한눈에 훑어봅니다."
        }
      />

      <div className="mb-4 space-y-3">
        <Tabs value={level} onChange={(value) => { setLevel(value); setIndex(0); setRevealed(false); }} options={LEVEL_OPTIONS} />
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            size="sm"
            value={mode}
            onChange={setMode}
            options={[
              { value: "learn" as Mode, label: "학습" },
              { value: "card" as Mode, label: "테스트" },
              { value: "list" as Mode, label: "목록" },
            ]}
          />
          <button
            onClick={() => { setOnlyFavorite((prev) => !prev); setIndex(0); }}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              onlyFavorite ? "border-transparent bg-accent text-white" : "border-line bg-surface text-muted",
            )}
          >
            ★ 즐겨찾기만
          </button>
        </div>
        <Progress value={percent(learned, items.length)} label={`학습한 단어 ${learned} / ${items.length}`} />
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="표시할 단어가 없습니다"
          description={onlyFavorite ? "즐겨찾기한 단어가 아직 없습니다." : "다른 레벨을 선택해 보세요."}
          action={
            onlyFavorite ? (
              <Button variant="outline" onClick={() => setOnlyFavorite(false)}>
                전체 단어 보기
              </Button>
            ) : null
          }
        />
      ) : mode === "learn" && current ? (
        <div>
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <LevelBadge level={current.level} />
              <div className="flex items-center gap-1">
                <button
                  aria-label="발음 듣기"
                  onClick={() => speakJapanese(current.word)}
                  className="rounded-lg p-2 text-muted hover:bg-background hover:text-primary"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
                <button
                  aria-label="즐겨찾기"
                  onClick={() => toggleFavorite(current.id)}
                  className={cn(
                    "rounded-lg p-2 hover:bg-background",
                    progress[current.id]?.favorite ? "text-accent" : "text-muted",
                  )}
                >
                  <Star className={cn("h-4 w-4", progress[current.id]?.favorite && "fill-current")} />
                </button>
              </div>
            </div>

            <div className="text-center">
              <p className="jp text-sm text-primary">{current.reading}</p>
              <p className="jp mt-1 text-4xl font-bold sm:text-5xl">{current.word}</p>
              <p className="mt-3 text-xl font-bold">{current.meaning}</p>
              <p className="mt-1 text-xs text-muted">{current.partOfSpeech}</p>
            </div>

            <div className="mt-5 rounded-xl bg-background px-4 py-3">
              <p className="text-xs font-semibold text-muted">例文</p>
              <p className="jp mt-1 text-base">{current.example}</p>
              <p className="jp mt-0.5 text-xs text-muted">{current.exampleReading}</p>
              <p className="mt-1.5 text-sm text-muted">{current.exampleTranslation}</p>
              <button
                onClick={() => speakJapanese(current.example)}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary"
              >
                <Volume2 className="h-3.5 w-3.5" /> 예문 듣기
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => answer(null)}>
                아직 모르겠어요
              </Button>
              <Button className="bg-success hover:bg-[#12833c]" onClick={() => answer(true)}>
                <Check className="h-4 w-4" /> 외웠어요
              </Button>
            </div>
          </Card>

          <div className="mt-3 flex items-center justify-between text-xs text-muted">
            <button
              onClick={() => setIndex((prev) => (prev - 1 + items.length) % items.length)}
              className="rounded-lg px-2 py-1 hover:text-foreground"
            >
              ← 이전 단어
            </button>
            <span>
              {Math.min(index + 1, items.length)} / {items.length}
            </span>
            <button
              onClick={() => setIndex((prev) => (prev + 1) % items.length)}
              className="rounded-lg px-2 py-1 hover:text-foreground"
            >
              다음 단어 →
            </button>
          </div>
        </div>
      ) : mode === "card" && current ? (
        <div>
          <Card className="text-center">
            <div className="mb-4 flex items-center justify-between">
              <LevelBadge level={current.level} />
              <div className="flex items-center gap-1">
                <button
                  aria-label="발음 듣기"
                  onClick={() => speakJapanese(current.word)}
                  className="rounded-lg p-2 text-muted hover:bg-background hover:text-primary"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
                <button
                  aria-label="즐겨찾기"
                  onClick={() => toggleFavorite(current.id)}
                  className={cn(
                    "rounded-lg p-2 hover:bg-background",
                    progress[current.id]?.favorite ? "text-accent" : "text-muted",
                  )}
                >
                  <Star className={cn("h-4 w-4", progress[current.id]?.favorite && "fill-current")} />
                </button>
              </div>
            </div>

            <p className="jp text-4xl font-bold sm:text-5xl">{current.word}</p>
            <p className="jp mt-2 text-base text-muted">{revealed ? current.reading : "• • •"}</p>

            {revealed ? (
              <div className="mt-5 space-y-4 text-left">
                <div className="rounded-xl bg-primary-soft px-4 py-3">
                  <p className="text-xs font-semibold text-primary">{current.partOfSpeech}</p>
                  <p className="mt-0.5 text-lg font-bold text-foreground">{current.meaning}</p>
                </div>
                <div className="rounded-xl bg-background px-4 py-3">
                  <p className="text-xs font-semibold text-muted">例文</p>
                  <p className="jp mt-1 text-base">{current.example}</p>
                  <p className="jp mt-0.5 text-xs text-muted">{current.exampleReading}</p>
                  <p className="mt-1.5 text-sm text-muted">{current.exampleTranslation}</p>
                  <button
                    onClick={() => speakJapanese(current.example)}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary"
                  >
                    <Volume2 className="h-3.5 w-3.5" /> 예문 듣기
                  </button>
                </div>
                {progress[current.id] ? (
                  <p className="text-center text-xs text-muted">
                    다음 복습: {progress[current.id].nextReview} ({srsLabel(progress[current.id].box)})
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted">뜻이 떠올랐다면 카드를 확인하세요.</p>
            )}

            {revealed ? (
              <div className="mt-6 grid grid-cols-3 gap-2">
                <Button variant="danger" onClick={() => answer(false)}>
                  <X className="h-4 w-4" /> 모름
                </Button>
                <Button variant="outline" onClick={() => answer(null)}>
                  <RotateCcw className="h-4 w-4" /> 다시 보기
                </Button>
                <Button onClick={() => answer(true)} className="bg-success hover:bg-[#12833c]">
                  <Check className="h-4 w-4" /> 알고 있음
                </Button>
              </div>
            ) : (
              <Button className="mt-6 w-full" size="lg" onClick={() => setRevealed(true)}>
                뜻 확인하기
              </Button>
            )}
          </Card>

          <div className="mt-3 flex items-center justify-between text-xs text-muted">
            <button
              onClick={() => { setIndex((prev) => (prev - 1 + items.length) % items.length); setRevealed(false); }}
              className="rounded-lg px-2 py-1 hover:text-foreground"
            >
              ← 이전 단어
            </button>
            <span>
              {Math.min(index + 1, items.length)} / {items.length}
            </span>
            <button
              onClick={() => { setIndex((prev) => (prev + 1) % items.length); setRevealed(false); }}
              className="rounded-lg px-2 py-1 hover:text-foreground"
            >
              다음 단어 →
            </button>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const state = progress[item.id];
            return (
              <li key={item.id}>
                <Card className="flex flex-wrap items-center gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="jp text-lg font-bold">{item.word}</span>
                      <span className="jp text-xs text-muted">{item.reading}</span>
                      <LevelBadge level={item.level} />
                    </div>
                    <p className="mt-0.5 text-sm">{item.meaning}</p>
                    <p className="jp mt-1 text-xs text-muted">{item.example}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {state && state.status !== "new" ? (
                      <Badge tone={state.status === "known" ? "success" : "primary"}>
                        {state.status === "known" ? "암기 완료" : "학습 중"}
                      </Badge>
                    ) : (
                      <Badge>미학습</Badge>
                    )}
                    <button
                      aria-label="발음 듣기"
                      onClick={() => speakJapanese(item.word)}
                      className="rounded-lg p-2 text-muted hover:text-primary"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                    <button
                      aria-label="즐겨찾기"
                      onClick={() => toggleFavorite(item.id)}
                      className={cn("rounded-lg p-2", state?.favorite ? "text-accent" : "text-muted")}
                    >
                      <Star className={cn("h-4 w-4", state?.favorite && "fill-current")} />
                    </button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
