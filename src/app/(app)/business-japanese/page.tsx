"use client";

import { useMemo, useState } from "react";
import { Check, Star, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { BUSINESS_CATEGORIES, BUSINESS_PHRASES } from "@/lib/content";
import { useAppStore, useCurrentUser } from "@/lib/store";
import { cn, percent, speakJapanese } from "@/lib/utils";

export default function BusinessJapanesePage() {
  const user = useCurrentUser();
  const studyItem = useAppStore((state) => state.studyItem);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const [category, setCategory] = useState<string>("전체");

  const options = useMemo(
    () => [{ value: "전체", label: "전체" }, ...BUSINESS_CATEGORIES.map((item) => ({ value: item, label: item }))],
    [],
  );
  const items = useMemo(
    () => (category === "전체" ? BUSINESS_PHRASES : BUSINESS_PHRASES.filter((item) => item.category === category)),
    [category],
  );

  const progress = user?.data.progress ?? {};
  if (!user) return null;

  const learned = items.filter((item) => progress[item.id] && progress[item.id].status !== "new").length;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="비즈니스 일본어"
        description="일본 회사에서 실제로 쓰는 표현입니다. 존경어 · 겸양어 · 전화 · 메일 · 회의 상황별로 익히세요."
      />

      <div className="mb-4 space-y-3">
        <Tabs size="sm" value={category} onChange={setCategory} options={options} />
        <Progress value={percent(learned, items.length)} label={`학습한 표현 ${learned} / ${items.length}`} />
      </div>

      <ul className="grid gap-2 lg:grid-cols-2">
        {items.map((item) => {
          const state = progress[item.id];
          const learnedItem = state && state.status !== "new";
          return (
            <li key={item.id}>
              <Card className="h-full">
                <div className="flex items-start justify-between gap-2">
                  <Badge tone="primary">{item.category}</Badge>
                  <div className="flex items-center gap-1">
                    <button
                      aria-label="발음 듣기"
                      onClick={() => speakJapanese(item.jp)}
                      className="rounded-lg p-1.5 text-muted hover:text-primary"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                    <button
                      aria-label="즐겨찾기"
                      onClick={() => toggleFavorite(item.id)}
                      className={cn("rounded-lg p-1.5", state?.favorite ? "text-accent" : "text-muted")}
                    >
                      <Star className={cn("h-4 w-4", state?.favorite && "fill-current")} />
                    </button>
                  </div>
                </div>

                <p className="jp mt-2 text-lg font-bold leading-relaxed">{item.jp}</p>
                <p className="jp mt-0.5 text-xs text-muted">{item.reading}</p>
                <p className="mt-2 text-sm font-semibold">{item.ko}</p>

                <div className="mt-3 space-y-1.5 text-xs">
                  <p className="rounded-lg bg-background px-3 py-2">
                    <span className="font-bold text-muted">사용 상황</span> · {item.situation}
                  </p>
                  <p className="rounded-lg bg-accent-soft px-3 py-2 text-accent">
                    <span className="font-bold">포인트</span> · {item.note}
                  </p>
                  {item.casual ? (
                    <p className="jp rounded-lg bg-background px-3 py-2 text-muted">
                      반말 표현: {item.casual}
                    </p>
                  ) : null}
                </div>

                <Button
                  className={cn("mt-3 w-full", learnedItem && "bg-success hover:bg-[#12833c]")}
                  variant={learnedItem ? "primary" : "outline"}
                  onClick={() =>
                    studyItem({
                      itemId: item.id,
                      type: "business",
                      countKey: "business",
                      title: item.jp,
                      correct: true,
                      isReview: state?.status === "learning",
                    })
                  }
                >
                  <Check className="h-4 w-4" /> {learnedItem ? "학습 완료 (다시 복습)" : "학습 완료"}
                </Button>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
