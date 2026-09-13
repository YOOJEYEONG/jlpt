"use client";

import Link from "next/link";
import { Briefcase, Check, FileText, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/page-header";
import { jobReadiness } from "@/lib/plan";
import { useAppStore, useCurrentUser } from "@/lib/store";
import { cn } from "@/lib/utils";

const RESUME_CHECKLIST = [
  { key: "profile", label: "履歴書 기본 정보 정리 (이름 · 주소 · 학력 · 경력)" },
  { key: "photo", label: "증명사진 준비 (일본 규격 3×4cm)" },
  { key: "motivation", label: "志望動機 300자 작성" },
  { key: "career", label: "職務経歴書 담당 업무 · 실적 정리" },
  { key: "numbers", label: "성과를 숫자로 정리 (매출 · 비율 · 기간)" },
  { key: "selfpr", label: "自己PR 400자 작성" },
];

const CULTURE_NOTES = [
  { title: "報連相(호렌소)", body: "보고 · 연락 · 상담. 문제를 혼자 안고 있지 않고 빨리 공유하는 것이 기본입니다." },
  { title: "時間厳守", body: "면접은 10분 전 도착이 기본. 지각 연락은 반드시 전화로 합니다." },
  { title: "御社와 貴社", body: "말할 때는 御社(おんしゃ), 문서에 쓸 때는 貴社(きしゃ)입니다." },
  { title: "名刺交換", body: "명함은 두 손으로, 상대보다 낮은 위치에서 건넵니다. 받은 명함은 바로 넣지 않습니다." },
  { title: "残業과 有給", body: "회사마다 문화 차이가 큽니다. 면접에서 물어봐도 되지만 순서와 표현에 주의합니다." },
];

export default function JapaneseJobPage() {
  const user = useCurrentUser();
  const setJobProgress = useAppStore((state) => state.setJobProgress);
  if (!user) return null;

  const { data } = user;
  const readiness = jobReadiness(data);
  const checked = RESUME_CHECKLIST.filter((item) => data.jobProgress[`resume:${item.key}`] === 1);

  function toggle(key: string) {
    const fullKey = `resume:${key}`;
    const next = data.jobProgress[fullKey] === 1 ? 0 : 1;
    setJobProgress(fullKey, next);

    const count = RESUME_CHECKLIST.filter((item) =>
      item.key === key ? next === 1 : data.jobProgress[`resume:${item.key}`] === 1,
    ).length;
    setJobProgress("resume", Math.round((count / RESUME_CHECKLIST.length) * 100));
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="일본 취업 준비"
        description="일본어 실력과 서류 · 면접 준비가 어디까지 왔는지 한눈에 확인합니다."
      />

      <Card>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-accent" /> 취업 준비 진행률
        </CardTitle>
        <ul className="mt-4 space-y-4">
          {readiness.map((item) => (
            <li key={item.key}>
              <Progress
                value={item.value}
                label={item.label}
                barClassName={item.value >= 80 ? "bg-success" : item.value >= 40 ? "bg-primary" : "bg-accent"}
              />
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-xl bg-background px-3 py-2 text-xs text-muted">
          일본어 실력은 학습한 어휘 · 문법 · 한자 비율, JLPT N1은 N1 모의고사 최고 정답률, 면접 준비는 연습을
          마친 질문 수로 계산됩니다.
        </p>
      </Card>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <Card>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> 서류 준비 체크리스트
          </CardTitle>
          <p className="mt-1 text-xs text-muted">
            {checked.length} / {RESUME_CHECKLIST.length} 완료
          </p>
          <ul className="mt-3 space-y-1.5">
            {RESUME_CHECKLIST.map((item) => {
              const done = data.jobProgress[`resume:${item.key}`] === 1;
              return (
                <li key={item.key}>
                  <button
                    onClick={() => toggle(item.key)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                      done ? "border-success bg-[#e8f7ee] text-success" : "border-line hover:border-[#c9d2e6]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                        done ? "border-success bg-success text-white" : "border-line",
                      )}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : null}
                    </span>
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" /> 일본 회사 문화 핵심
          </CardTitle>
          <ul className="mt-3 space-y-2">
            {CULTURE_NOTES.map((note) => (
              <li key={note.title} className="rounded-xl bg-background p-3">
                <p className="jp text-sm font-bold">{note.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{note.body}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-4">
        <CardTitle>다음 단계</CardTitle>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/business-japanese">
            <Button variant="outline">비즈니스 표현 학습</Button>
          </Link>
          <Link href="/interview">
            <Button variant="outline">면접 답변 연습</Button>
          </Link>
          <Link href="/mock-test">
            <Button variant="outline">N1 모의고사 응시</Button>
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="primary">목표 {data.targetJlpt}</Badge>
          <Badge tone="accent">
            {data.jobGoal === "JLPT_N1" ? "JLPT 집중" : data.jobGoal === "JAPAN_JOB" ? "취업 집중" : "시험 + 취업"}
          </Badge>
        </div>
      </Card>
    </div>
  );
}
