"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/layout/page-header";
import { QuestionCard } from "@/components/study/question-card";
import { findListening, findReading } from "@/lib/content";
import { buildReviewItems, type ReviewItem } from "@/lib/review";
import { SRS_INTERVALS } from "@/lib/srs";
import { dueItemIds, useAppStore, useCurrentUser } from "@/lib/store";
import { percent } from "@/lib/utils";
import { SpeakButton } from "@/components/study/speak-button";

export default function ReviewPage() {
  const user = useCurrentUser();
  const studyItem = useAppStore((state) => state.studyItem);
  const addWrongAnswer = useAppStore((state) => state.addWrongAnswer);

  // 문제를 푸는 동안 목록이 줄어들어 문항을 건너뛰는 일이 없도록, 시작 시점의 목록을 고정합니다.
  const [queue, setQueue] = useState<ReviewItem[]>(() =>
    user ? buildReviewItems(dueItemIds(user.data)) : [],
  );
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState({ correct: 0, wrong: 0 });
  const [answeredCurrent, setAnsweredCurrent] = useState(false);

  if (!user) return null;

  const due = dueItemIds(user.data);
  const passages = due
    .map((id) => findReading(id) ?? findListening(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const current = queue[index];
  const finished = queue.length > 0 && index >= queue.length;
  const remainingDue = buildReviewItems(due).length;

  function reload() {
    setQueue(buildReviewItems(dueItemIds(user!.data)));
    setIndex(0);
    setResult({ correct: 0, wrong: 0 });
    setAnsweredCurrent(false);
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="오늘의 복습"
        description={`간격 반복(${SRS_INTERVALS.join(" · ")}일) 일정에 따라 오늘 다시 봐야 할 항목입니다. 틀린 항목은 오늘 안에 다시 나옵니다.`}
        action={
          queue.length > 0 ? (
            <Button variant="outline" size="sm" onClick={reload}>
              <RotateCcw className="h-4 w-4" /> 목록 새로고침
            </Button>
          ) : null
        }
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted">오늘 복습할 항목</p>
            <p className="mt-0.5 text-2xl font-bold">{queue.length + passages.length}개</p>
          </div>
          <div className="flex gap-2">
            <Badge tone="success">정답 {result.correct}</Badge>
            <Badge tone="danger">오답 {result.wrong}</Badge>
          </div>
        </div>
        {queue.length > 0 ? (
          <Progress className="mt-3" value={percent(Math.min(index, queue.length), queue.length)} />
        ) : null}
      </Card>

      {queue.length === 0 && passages.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-8 w-8 text-success" />}
          title="오늘 복습할 항목이 없습니다"
          description="단어와 문법을 학습하면 1일 · 3일 · 7일 뒤에 여기에서 다시 물어봅니다. 학습 중 '모름'을 누른 항목은 같은 날 바로 복습 목록에 올라옵니다."
          action={
            <Link href="/vocabulary">
              <Button>단어 학습하러 가기</Button>
            </Link>
          }
        />
      ) : finished ? (
        <Card className="text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
          <p className="mt-3 text-lg font-bold">이번 복습을 모두 마쳤습니다</p>
          <p className="mt-1 text-sm text-muted">
            정답 {result.correct}개 · 오답 {result.wrong}개
            {remainingDue > 0 ? ` — 틀린 ${remainingDue}개가 오늘 다시 복습 대상입니다.` : ""}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {remainingDue > 0 ? <Button onClick={reload}>틀린 항목 다시 풀기</Button> : null}
            <Link href="/dashboard">
              <Button variant="outline">대시보드로</Button>
            </Link>
            <Link href="/vocabulary">
              <Button variant="outline">새 단어 학습</Button>
            </Link>
          </div>
        </Card>
      ) : current ? (
        <Card>
          <div className="text-center">
            <Badge tone="primary">{current.subPrompt}</Badge>
            <p className="jp mt-3 text-3xl font-bold sm:text-4xl">{current.prompt}</p>
            <SpeakButton className="mt-2" variant="text" label="발음 듣기" text={current.speech} />
          </div>

          <div className="mt-5">
            <QuestionCard
              key={current.itemId}
              question={current.question}
              onAnswered={(correct, chosenIndex) => {
                setAnsweredCurrent(true);
                setResult((prev) => ({
                  correct: prev.correct + (correct ? 1 : 0),
                  wrong: prev.wrong + (correct ? 0 : 1),
                }));
                studyItem({
                  itemId: current.itemId,
                  type: current.type,
                  countKey: current.countKey,
                  title: current.title,
                  correct,
                  isReview: true,
                });
                if (!correct) {
                  addWrongAnswer({
                    type: current.type,
                    questionId: current.question.id,
                    question: `${current.prompt} — ${current.question.question}`,
                    choices: current.question.choices,
                    chosenIndex,
                    answerIndex: current.question.answerIndex,
                    explanation: current.question.explanation,
                    sourceTitle: "복습",
                  });
                }
              }}
            />
          </div>

          {answeredCurrent ? (
            <Button
              className="mt-3 w-full"
              size="lg"
              onClick={() => {
                setAnsweredCurrent(false);
                setIndex((prev) => prev + 1);
              }}
            >
              {index + 1 >= queue.length ? "복습 마치기" : `다음 문제 (${index + 1} / ${queue.length})`}
            </Button>
          ) : null}
        </Card>
      ) : null}

      {passages.length > 0 ? (
        <Card className="mt-4">
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-primary" /> 다시 볼 지문 · 청해
          </CardTitle>
          <ul className="mt-3 space-y-2">
            {passages.map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded-xl bg-background px-3 py-2">
                <span className="text-sm font-semibold">{item.title}</span>
                <Link
                  href={"content" in item ? "/reading" : "/listening"}
                  className="inline-flex min-h-6 items-center text-xs font-semibold text-primary"
                >
                  다시 풀기 →
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
