"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppStore, useCurrentUser } from "@/lib/store";
import type { JlptLevel, JobGoal } from "@/lib/types";
import { cn } from "@/lib/utils";

const LEVEL_OPTIONS: { value: JlptLevel; title: string; body: string }[] = [
  { value: "BASIC", title: "일본어를 처음 시작합니다", body: "히라가나·가타카나 104자부터 차근차근 시작합니다." },
  { value: "N5", title: "N5 수준입니다", body: "기본 인사와 간단한 문장을 압니다." },
  { value: "N4", title: "N4 수준입니다", body: "일상 회화를 어느 정도 이해합니다." },
  { value: "N3", title: "N3 수준입니다", body: "기본 신문·안내문을 읽을 수 있습니다." },
  { value: "N2", title: "N2 수준입니다", body: "폭넓은 장면의 일본어를 이해합니다." },
  { value: "N1", title: "N1 수준입니다", body: "고난도 논설문까지 읽을 수 있습니다." },
];

const GOAL_OPTIONS: { value: JobGoal; title: string; body: string; target: JlptLevel }[] = [
  { value: "JLPT_N1", title: "JLPT N1 합격", body: "시험 합격이 최우선 목표입니다.", target: "N1" },
  { value: "JAPAN_JOB", title: "일본 취업", body: "실무 일본어와 면접 준비에 집중합니다.", target: "N2" },
  { value: "BOTH", title: "JLPT N1 + 일본 취업", body: "시험과 실무를 함께 준비합니다.", target: "N1" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);

  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<JlptLevel>(user?.data.currentLevel ?? "BASIC");
  const [goal, setGoal] = useState<JobGoal>(user?.data.jobGoal ?? "BOTH");

  function finish() {
    const target = GOAL_OPTIONS.find((option) => option.value === goal)?.target ?? "N1";
    completeOnboarding({ currentLevel: level, jobGoal: goal, targetJlpt: target });
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-sm font-semibold text-primary">환영합니다{user ? `, ${user.account.name}님` : ""}!</p>
      <h1 className="mt-1 text-2xl font-bold">
        {step === 0 ? "현재 일본어 실력을 알려주세요" : "최종 목표를 선택해 주세요"}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {step === 0
          ? "선택한 수준에 맞춰 오늘의 학습 분량이 자동으로 구성됩니다."
          : "목표에 따라 대시보드와 추천 학습이 달라집니다."}
      </p>

      <div className="mt-6 space-y-2">
        {step === 0
          ? LEVEL_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setLevel(option.value)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
                  level === option.value
                    ? "border-primary bg-primary-soft"
                    : "border-line bg-surface hover:border-[#c9d2e6]",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-12 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                    level === option.value ? "bg-primary text-white" : "bg-background text-muted",
                  )}
                >
                  {option.value === "BASIC" ? "기초" : option.value}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{option.title}</span>
                  <span className="block text-xs text-muted">{option.body}</span>
                </span>
                {level === option.value ? <Check className="ml-auto h-4 w-4 text-primary" /> : null}
              </button>
            ))
          : GOAL_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setGoal(option.value)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
                  goal === option.value
                    ? "border-primary bg-primary-soft"
                    : "border-line bg-surface hover:border-[#c9d2e6]",
                )}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{option.title}</span>
                  <span className="block text-xs text-muted">{option.body}</span>
                </span>
                {goal === option.value ? <Check className="ml-auto h-4 w-4 text-primary" /> : null}
              </button>
            ))}
      </div>

      <Card className="mt-5 bg-background">
        <p className="text-xs leading-relaxed text-muted">
          지금 선택한 내용은 설정에서 언제든 바꿀 수 있습니다. 정확한 수준이 궁금하다면 가입 후 레벨 테스트
          15문항을 풀어 보세요.
        </p>
      </Card>

      <div className="mt-5 flex gap-2">
        {step === 1 ? (
          <Button variant="outline" size="lg" onClick={() => setStep(0)}>
            이전
          </Button>
        ) : null}
        <Button size="lg" className="flex-1" onClick={() => (step === 0 ? setStep(1) : finish())}>
          {step === 0 ? "다음" : "학습 시작하기"} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
