"use client";

import Link from "next/link";
import { Briefcase, Check, ChevronDown } from "lucide-react";
import { Badge, LevelBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/page-header";
import { GRAMMAR, KANJI, LISTENINGS, READINGS, ROADMAP, VOCABULARY } from "@/lib/content";
import { useCurrentUser } from "@/lib/store";
import { JLPT_LEVELS, type JlptLevel } from "@/lib/types";
import { cn, percent } from "@/lib/utils";

function countStudied(ids: string[], progress: Record<string, { status: string }>) {
  return ids.filter((id) => progress[id] && progress[id].status !== "new").length;
}

export default function RoadmapPage() {
  const user = useCurrentUser();
  if (!user) return null;

  const { data } = user;
  const currentIndex = JLPT_LEVELS.indexOf(data.currentLevel);
  const targetIndex = JLPT_LEVELS.indexOf(data.targetJlpt);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="학습 로드맵"
        description="기초부터 일본 취업까지의 전체 경로입니다. 각 단계의 예상 기간과 필요 학습량, 현재 진행률을 확인하세요."
      />

      <Card className="mb-5 flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted">현재 단계</span>
        <LevelBadge level={data.currentLevel} />
        <ChevronDown className="h-4 w-4 -rotate-90 text-muted" />
        <span className="text-sm text-muted">목표</span>
        <LevelBadge level={data.targetJlpt} />
        <Link href="/settings" className="ml-auto text-xs font-semibold text-primary">
          목표 변경 →
        </Link>
      </Card>

      <ol className="relative space-y-3 pl-6">
        <span className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-line" aria-hidden />

        {ROADMAP.map((stage, index) => {
          const levelItems = {
            vocabulary: VOCABULARY.filter((item) => item.level === stage.level),
            grammar: GRAMMAR.filter((item) => item.level === stage.level),
            kanji: KANJI.filter((item) => item.level === stage.level),
            reading: READINGS.filter((item) => item.level === stage.level),
            listening: LISTENINGS.filter((item) => item.level === stage.level),
          };
          const total = Object.values(levelItems).reduce((sum, items) => sum + items.length, 0);
          const studied = Object.values(levelItems).reduce(
            (sum, items) => sum + countStudied(items.map((item) => item.id), data.progress),
            0,
          );
          const rate = percent(studied, total);
          const state: "done" | "current" | "todo" =
            rate === 100 ? "done" : index === currentIndex ? "current" : index < currentIndex ? "done" : "todo";
          const inScope = index <= targetIndex;

          return (
            <li key={stage.level} className="relative">
              <span
                className={cn(
                  "absolute -left-6 top-5 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-surface text-[10px] font-bold",
                  state === "done"
                    ? "border-success text-success"
                    : state === "current"
                      ? "border-primary bg-primary text-white"
                      : "border-line text-muted",
                )}
              >
                {state === "done" ? <Check className="h-3 w-3" /> : index + 1}
              </span>

              <Card className={cn(state === "current" && "border-primary", !inScope && "opacity-60")}>
                <div className="flex flex-wrap items-center gap-2">
                  <LevelBadge level={stage.level as JlptLevel} />
                  <h2 className="text-base font-bold">{stage.name}</h2>
                  <Badge>{stage.months}</Badge>
                  {state === "current" ? <Badge tone="primary">학습 중</Badge> : null}
                  {rate === 100 ? <Badge tone="success">완료</Badge> : null}
                </div>

                <p className="mt-2 text-sm text-muted">{stage.description}</p>

                <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {[
                    { label: "단어", value: stage.words.toLocaleString() },
                    { label: "한자", value: stage.kanji.toLocaleString() },
                    { label: "문법", value: stage.grammar },
                    { label: "독해", value: stage.reading },
                    { label: "청해", value: stage.listening },
                  ].map((entry) => (
                    <div key={entry.label} className="rounded-xl bg-background px-3 py-2">
                      <dt className="text-[11px] text-muted">{entry.label}</dt>
                      <dd className="text-sm font-bold">{entry.value}</dd>
                    </div>
                  ))}
                </dl>

                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {stage.goals.map((goal) => (
                    <li key={goal} className="rounded-lg bg-primary-soft px-2.5 py-1 text-xs text-primary">
                      {goal}
                    </li>
                  ))}
                </ul>

                <Progress
                  className="mt-3"
                  value={rate}
                  label={`수록 콘텐츠 진행률 (${studied}/${total})`}
                  barClassName={rate === 100 ? "bg-success" : undefined}
                />
              </Card>
            </li>
          );
        })}

        <li className="relative">
          <span className="absolute -left-6 top-5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-accent bg-accent text-[10px] font-bold text-white">
            <Briefcase className="h-3 w-3" />
          </span>
          <Card className="border-accent/40 bg-accent-soft">
            <h2 className="text-base font-bold text-accent">일본 취업 일본어</h2>
            <p className="mt-2 text-sm text-foreground/80">
              JLPT와 별개로 진행합니다. 경어 · 전화 응대 · 메일 작성 · 면접 답변 · 이력서 표현을 다룹니다.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/business-japanese" className="rounded-xl bg-accent px-3 py-2 text-xs font-bold text-white">
                비즈니스 일본어
              </Link>
              <Link href="/interview" className="rounded-xl bg-surface px-3 py-2 text-xs font-bold text-accent">
                면접 일본어
              </Link>
              <Link href="/japanese-job" className="rounded-xl bg-surface px-3 py-2 text-xs font-bold text-accent">
                취업 준비 현황
              </Link>
            </div>
          </Card>
        </li>
      </ol>
    </div>
  );
}
