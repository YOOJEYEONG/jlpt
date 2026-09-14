"use client";

import { useMemo, useState } from "react";
import { BookMarked, Check, ChevronDown, Star } from "lucide-react";
import { Badge, LevelBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { GRAMMAR } from "@/lib/content";
import { useAppStore, useCurrentUser } from "@/lib/store";
import { JLPT_LEVELS, LEVEL_LABEL, type JlptLevel } from "@/lib/types";
import { cn, percent } from "@/lib/utils";
import { SpeakButton } from "@/components/study/speak-button";

type LevelFilter = JlptLevel | "ALL";

const LEVEL_OPTIONS: { value: LevelFilter; label: string }[] = [
  { value: "ALL", label: "전체" },
  ...JLPT_LEVELS.map((level) => ({ value: level as LevelFilter, label: LEVEL_LABEL[level] })),
];

const DIFFICULTY_LABEL = ["", "쉬움", "보통", "어려움"];

export default function GrammarPage() {
  const user = useCurrentUser();
  const studyItem = useAppStore((state) => state.studyItem);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);

  const [level, setLevel] = useState<LevelFilter>(user?.data.currentLevel ?? "ALL");
  const [openId, setOpenId] = useState<string | null>(null);

  const progress = user?.data.progress ?? {};
  const items = useMemo(
    () => (level === "ALL" ? GRAMMAR : GRAMMAR.filter((item) => item.level === level)),
    [level],
  );

  if (!user) return null;

  const learned = items.filter((item) => progress[item.id] && progress[item.id].status !== "new").length;

  function complete(id: string, title: string, understood: boolean) {
    studyItem({
      itemId: id,
      type: "grammar",
      countKey: "grammar",
      title,
      correct: understood,
      isReview: progress[id]?.status === "learning",
    });
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="문법 학습"
        description="의미 · 접속 · 예문 · 비슷한 문법과의 차이까지 한 화면에서 확인합니다."
      />

      <div className="mb-4 space-y-3">
        <Tabs label="JLPT 레벨" value={level} onChange={setLevel} options={LEVEL_OPTIONS} />
        <Progress value={percent(learned, items.length)} label={`학습한 문법 ${learned} / ${items.length}`} />
      </div>

      {items.length === 0 ? (
        <EmptyState title="표시할 문법이 없습니다" description="다른 레벨을 선택해 보세요." />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const open = openId === item.id;
            const state = progress[item.id];
            return (
              <li key={item.id}>
                <Card className="p-0">
                  <button
                    onClick={() => setOpenId(open ? null : item.id)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-3 p-5 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="jp text-lg font-bold">{item.title}</span>
                        <LevelBadge level={item.level} />
                        <Badge>{DIFFICULTY_LABEL[item.difficulty]}</Badge>
                        {state && state.status !== "new" ? (
                          <Badge tone={state.status === "known" ? "success" : "primary"}>
                            {state.status === "known" ? "이해 완료" : "학습 중"}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-muted">{item.meaning}</p>
                    </div>
                    <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted transition-transform", open && "rotate-180")} />
                  </button>

                  {open ? (
                    <div className="space-y-4 border-t border-line p-5">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-background p-3">
                          <p className="text-xs font-bold text-muted">접속</p>
                          <p className="jp mt-1 text-sm">{item.connection}</p>
                        </div>
                        <div className="rounded-xl bg-background p-3">
                          <p className="text-xs font-bold text-muted">출제 포인트</p>
                          <p className="mt-1 text-sm">{item.examPoint}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-muted">설명</p>
                        <p className="mt-1 text-sm leading-relaxed">{item.explanation}</p>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-muted">예문</p>
                        <ul className="mt-2 space-y-2">
                          {item.examples.map((example) => (
                            <li key={example.jp} className="rounded-xl bg-primary-soft p-3">
                              <div className="flex items-start justify-between gap-2">
                                <p className="jp text-base font-semibold">{example.jp}</p>
                                <SpeakButton label="예문 듣기" text={example.reading} className="shrink-0" />
                              </div>
                              <p className="jp mt-0.5 text-xs text-primary">{example.reading}</p>
                              <p className="mt-1 text-sm text-foreground/80">{example.ko}</p>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {item.related.length > 0 ? (
                        <div>
                          <p className="flex items-center gap-1.5 text-xs font-bold text-muted">
                            <BookMarked className="h-3.5 w-3.5" /> 비슷한 문법과의 차이
                          </p>
                          <ul className="mt-2 space-y-1.5">
                            {item.related.map((related) => (
                              <li key={related.title} className="rounded-xl bg-background p-3 text-sm">
                                <span className="jp font-bold">{related.title}</span>
                                <span className="mt-0.5 block text-muted">{related.difference}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => complete(item.id, item.title, true)} className="bg-success hover:bg-[#115c31]">
                          <Check className="h-4 w-4" /> 이해했어요
                        </Button>
                        <Button variant="outline" onClick={() => complete(item.id, item.title, false)}>
                          아직 어려워요 (복습 예약)
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => toggleFavorite(item.id)}
                          className={state?.favorite ? "text-accent" : undefined}
                        >
                          <Star className={cn("h-4 w-4", state?.favorite && "fill-current")} /> 즐겨찾기
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
