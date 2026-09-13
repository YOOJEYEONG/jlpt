"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";
import { Badge, LevelBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/page-header";
import { LEVEL_TEST } from "@/lib/content";
import { useAppStore, useCurrentUser } from "@/lib/store";
import { JLPT_LEVELS, LEVEL_LABEL, type JlptLevel } from "@/lib/types";
import { cn, percent } from "@/lib/utils";

const AREAS = ["어휘", "문법", "한자", "독해"] as const;

export default function LevelTestPage() {
  const user = useCurrentUser();
  const saveLevelTest = useAppStore((state) => state.saveLevelTest);

  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{
    recommended: JlptLevel;
    strong: string[];
    weak: string[];
    score: number;
    total: number;
  } | null>(null);

  if (!user) return null;

  const question = LEVEL_TEST[index];

  function finish(finalAnswers: Record<string, number>) {
    const byLevel: Record<string, { correct: number; total: number }> = {};
    const byArea: Record<string, { correct: number; total: number }> = {};
    let score = 0;

    LEVEL_TEST.forEach((item) => {
      const correct = finalAnswers[item.id] === item.answerIndex;
      if (correct) score += 1;
      byLevel[item.level] = byLevel[item.level] ?? { correct: 0, total: 0 };
      byLevel[item.level].total += 1;
      if (correct) byLevel[item.level].correct += 1;

      byArea[item.area] = byArea[item.area] ?? { correct: 0, total: 0 };
      byArea[item.area].total += 1;
      if (correct) byArea[item.area].correct += 1;
    });

    // 정답률 60% 이상을 통과로 보고, 통과한 가장 높은 레벨의 다음 단계를 추천합니다.
    const order: JlptLevel[] = ["N5", "N4", "N3", "N2", "N1"];
    let highestPassed: JlptLevel | null = null;
    order.forEach((level) => {
      const stat = byLevel[level];
      if (stat && stat.total > 0 && stat.correct / stat.total >= 0.6) highestPassed = level;
    });

    let recommended: JlptLevel = "N5";
    if (highestPassed) {
      const passedIndex = JLPT_LEVELS.indexOf(highestPassed);
      recommended = JLPT_LEVELS[Math.min(passedIndex + 1, JLPT_LEVELS.length - 1)];
    } else {
      recommended = score === 0 ? "BASIC" : "N5";
    }

    const areaRates = AREAS.map((area) => ({
      area,
      rate: byArea[area] ? byArea[area].correct / byArea[area].total : 0,
    }));
    const strong = areaRates.filter((entry) => entry.rate >= 0.6).map((entry) => entry.area);
    const weak = areaRates.filter((entry) => entry.rate < 0.6).map((entry) => entry.area);

    const payload = { recommended, strong, weak, score, total: LEVEL_TEST.length };
    setResult(payload);
    saveLevelTest({ ...payload, takenAt: new Date().toISOString() });
  }

  if (result) {
    return (
      <div className="animate-fade-up">
        <PageHeader title="레벨 테스트 결과" description="결과에 따라 현재 레벨이 자동으로 설정되었습니다." />

        <Card className="text-center">
          <p className="text-sm text-muted">정답</p>
          <p className="mt-1 text-4xl font-bold text-primary">
            {result.score}
            <span className="text-xl text-muted"> / {result.total}</span>
          </p>
          <Progress className="mt-4" value={percent(result.score, result.total)} />
          <div className="mt-5 rounded-xl bg-primary-soft p-4">
            <p className="text-xs font-semibold text-primary">추천 시작 레벨</p>
            <p className="mt-1 text-2xl font-bold text-primary">{LEVEL_LABEL[result.recommended]}</p>
          </div>
        </Card>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Card>
            <CardTitle>강점</CardTitle>
            <div className="mt-3 flex flex-wrap gap-2">
              {result.strong.length > 0 ? (
                result.strong.map((area) => (
                  <Badge key={area} tone="success">
                    {area}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted">아직 두드러진 강점 영역이 없습니다.</p>
              )}
            </div>
          </Card>
          <Card>
            <CardTitle>보강이 필요한 영역</CardTitle>
            <div className="mt-3 flex flex-wrap gap-2">
              {result.weak.length > 0 ? (
                result.weak.map((area) => (
                  <Badge key={area} tone="danger">
                    {area}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted">모든 영역이 고르게 좋습니다.</p>
              )}
            </div>
          </Card>
        </div>

        <Card className="mt-3">
          <CardTitle>추천 학습 순서</CardTitle>
          <ol className="mt-3 space-y-2">
            {[
              { label: `${LEVEL_LABEL[result.recommended]} 어휘`, href: "/vocabulary" },
              { label: `${LEVEL_LABEL[result.recommended]} 한자`, href: "/kanji" },
              { label: `${LEVEL_LABEL[result.recommended]} 문법`, href: "/grammar" },
              { label: `${LEVEL_LABEL[result.recommended]} 독해`, href: "/reading" },
            ].map((step, stepIndex) => (
              <li key={step.href}>
                <Link
                  href={step.href}
                  className="flex items-center justify-between rounded-xl bg-background px-4 py-3 text-sm font-semibold hover:bg-primary-soft"
                >
                  <span>
                    {stepIndex + 1}. {step.label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-primary" />
                </Link>
              </li>
            ))}
          </ol>
          <Link href="/dashboard">
            <Button className="mt-4 w-full" size="lg">
              대시보드에서 오늘의 학습 시작하기
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="animate-fade-up">
        <PageHeader title="레벨 테스트" description="15문항으로 현재 수준과 부족한 영역을 진단합니다." />

        <Card>
          <ClipboardList className="h-8 w-8 text-primary" />
          <CardTitle className="mt-3">약 5분이면 끝납니다</CardTitle>
          <p className="mt-2 text-sm text-muted">
            N5부터 N1까지 어휘 · 문법 · 한자 · 독해 문항이 섞여 있습니다. 모르는 문제는 찍지 말고 가장 가까운
            답을 고르세요. 결과에 따라 시작 레벨이 자동으로 설정됩니다.
          </p>
          {user.data.levelTestResult ? (
            <p className="mt-3 rounded-xl bg-background px-3 py-2 text-xs text-muted">
              지난 결과: {user.data.levelTestResult.score} / {user.data.levelTestResult.total} · 추천{" "}
              {LEVEL_LABEL[user.data.levelTestResult.recommended]}
            </p>
          ) : null}
          <Button className="mt-4 w-full" size="lg" onClick={() => setStarted(true)}>
            테스트 시작하기
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="레벨 테스트" />

      <Progress value={percent(index + 1, LEVEL_TEST.length)} label={`${index + 1} / ${LEVEL_TEST.length} 문항`} />

      <Card className="mt-4">
        <div className="flex items-center gap-2">
          <LevelBadge level={question.level} />
          <Badge tone="primary">{question.area}</Badge>
        </div>
        <p className="jp mt-3 text-base font-bold">{question.question}</p>

        <ul className="mt-4 space-y-1.5">
          {question.choices.map((choice, choiceIndex) => (
            <li key={choice}>
              <button
                onClick={() => {
                  const next = { ...answers, [question.id]: choiceIndex };
                  setAnswers(next);
                  if (index + 1 >= LEVEL_TEST.length) {
                    finish(next);
                  } else {
                    setIndex((prev) => prev + 1);
                  }
                }}
                className={cn(
                  "jp flex w-full items-center gap-2 rounded-xl border border-line px-3 py-3 text-left text-sm transition-colors hover:border-primary hover:bg-primary-soft",
                )}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-bold">
                  {choiceIndex + 1}
                </span>
                {choice}
              </button>
            </li>
          ))}
        </ul>
      </Card>

      {index > 0 ? (
        <Button variant="ghost" className="mt-3" onClick={() => setIndex((prev) => prev - 1)}>
          이전 문항
        </Button>
      ) : null}
    </div>
  );
}
