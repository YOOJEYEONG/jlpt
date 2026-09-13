"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlarmClock, ArrowLeft, ArrowRight, GraduationCap } from "lucide-react";
import { Badge, LevelBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/page-header";
import { MOCK_TESTS } from "@/lib/content";
import { useAppStore, useCurrentUser } from "@/lib/store";
import type { MockQuestion, MockSection } from "@/lib/types";
import { cn, percent } from "@/lib/utils";

const SECTIONS: MockSection[] = ["문자·어휘", "문법", "독해", "청해"];

export default function MockTestPage() {
  const user = useCurrentUser();
  const saveMockResult = useAppStore((state) => state.saveMockResult);
  const addWrongAnswer = useAppStore((state) => state.addWrongAnswer);

  const [testId, setTestId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [index, setIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const test = useMemo(() => MOCK_TESTS.find((item) => item.id === testId), [testId]);

  useEffect(() => {
    if (!test || submitted) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [test, submitted]);

  const result = useMemo(() => {
    if (!test) return null;
    const sectionScores: Record<string, { correct: number; total: number }> = {};
    SECTIONS.forEach((section) => {
      sectionScores[section] = { correct: 0, total: 0 };
    });
    let correct = 0;
    test.questions.forEach((question) => {
      const score = sectionScores[question.section];
      score.total += 1;
      if (answers[question.id] === question.answerIndex) {
        score.correct += 1;
        correct += 1;
      }
    });
    return { correct, total: test.questions.length, sectionScores };
  }, [test, answers]);

  useEffect(() => {
    if (!submitted || !test || !result) return;
    saveMockResult({
      testId: test.id,
      level: test.level,
      total: result.total,
      correct: result.correct,
      sectionScores: result.sectionScores,
    });
    test.questions.forEach((question) => {
      const chosen = answers[question.id];
      if (chosen !== question.answerIndex) {
        addWrongAnswer({
          type: "mock",
          questionId: question.id,
          question: question.question,
          choices: question.choices,
          chosenIndex: chosen ?? -1,
          answerIndex: question.answerIndex,
          explanation: question.explanation,
          sourceTitle: test.title,
        });
      }
    });
    // 제출 시 1회만 기록합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  if (!user) return null;

  function start(id: string) {
    const target = MOCK_TESTS.find((item) => item.id === id);
    if (!target) return;
    setTestId(id);
    setAnswers({});
    setIndex(0);
    setSubmitted(false);
    setSecondsLeft(target.minutes * 60);
  }

  function reset() {
    setTestId(null);
    setSubmitted(false);
    setAnswers({});
    setIndex(0);
  }

  if (test && submitted && result) {
    const weakest = SECTIONS.map((section) => ({
      section,
      ...result.sectionScores[section],
    }))
      .filter((entry) => entry.total > 0)
      .sort((a, b) => a.correct / a.total - b.correct / b.total)[0];
    const wrongQuestions = test.questions.filter((question) => answers[question.id] !== question.answerIndex);

    return (
      <div className="animate-fade-up">
        <PageHeader title={`${test.title} 결과`} description="영역별 점수와 틀린 문제를 확인하세요." />

        <Card className="text-center">
          <p className="text-sm text-muted">총점</p>
          <p className="mt-1 text-4xl font-bold text-primary">
            {result.correct}
            <span className="text-xl text-muted"> / {result.total}</span>
          </p>
          <p className="mt-1 text-sm text-muted">정답률 {percent(result.correct, result.total)}%</p>
          <Progress className="mt-4" value={percent(result.correct, result.total)} />
        </Card>

        <Card className="mt-3">
          <CardTitle>영역별 점수</CardTitle>
          <ul className="mt-4 space-y-3">
            {SECTIONS.map((section) => {
              const score = result.sectionScores[section];
              if (!score || score.total === 0) return null;
              return (
                <li key={section}>
                  <Progress
                    value={percent(score.correct, score.total)}
                    label={`${section} (${score.correct}/${score.total})`}
                  />
                </li>
              );
            })}
          </ul>
          {weakest ? (
            <p className="mt-4 rounded-xl bg-accent-soft px-3 py-2 text-sm font-semibold text-accent">
              취약 영역: {weakest.section} — 이 영역부터 복습하세요.
            </p>
          ) : null}
        </Card>

        <Card className="mt-3">
          <CardTitle>틀린 문제 ({wrongQuestions.length}개)</CardTitle>
          {wrongQuestions.length === 0 ? (
            <p className="mt-3 text-sm text-success">모두 정답입니다. 훌륭합니다!</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {wrongQuestions.map((question) => (
                <li key={question.id} className="rounded-xl bg-background p-3">
                  <p className="jp text-sm font-semibold">{question.question}</p>
                  <p className="mt-1 text-xs text-danger">
                    내 답: {answers[question.id] !== undefined ? question.choices[answers[question.id]] : "미응답"}
                  </p>
                  <p className="text-xs text-success">정답: {question.choices[question.answerIndex]}</p>
                  <p className="mt-1 text-xs text-muted">{question.explanation}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="mt-3">
          <CardTitle>추천 복습</CardTitle>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/wrong-answers">
              <Button variant="outline">오답노트에서 다시 풀기</Button>
            </Link>
            <Link href="/review">
              <Button variant="outline">오늘의 복습 하기</Button>
            </Link>
            <Button onClick={() => start(test.id)}>다시 응시</Button>
            <Button variant="ghost" onClick={reset}>
              목록으로
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (test) {
    const question: MockQuestion = test.questions[index];
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="animate-fade-up">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={reset} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted">
            <ArrowLeft className="h-4 w-4" /> 시험 종료
          </button>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold",
              secondsLeft < 60 ? "bg-[#fdeaea] text-danger" : "bg-primary-soft text-primary",
            )}
          >
            <AlarmClock className="h-4 w-4" />
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>

        <Progress value={percent(index + 1, test.questions.length)} label={`${index + 1} / ${test.questions.length} 문항`} />

        <Card className="mt-4">
          <div className="flex items-center gap-2">
            <Badge tone="primary">{question.section}</Badge>
            <LevelBadge level={test.level} />
          </div>

          {question.passage ? (
            <p className="jp mt-3 whitespace-pre-line rounded-xl bg-background p-4 text-sm leading-7">
              {question.passage}
            </p>
          ) : null}
          {question.script ? (
            <div className="mt-3 rounded-xl bg-background p-4">
              <p className="text-xs font-bold text-muted">음성 스크립트</p>
              <p className="jp mt-1 whitespace-pre-line text-sm leading-7">{question.script}</p>
            </div>
          ) : null}

          <p className="jp mt-4 text-base font-bold">{question.question}</p>

          <ul className="mt-3 space-y-1.5">
            {question.choices.map((choice, choiceIndex) => (
              <li key={choice}>
                <button
                  onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: choiceIndex }))}
                  className={cn(
                    "jp flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                    answers[question.id] === choiceIndex
                      ? "border-primary bg-primary-soft"
                      : "border-line hover:border-[#c9d2e6]",
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

        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="outline" disabled={index === 0} onClick={() => setIndex((prev) => prev - 1)}>
            <ArrowLeft className="h-4 w-4" /> 이전
          </Button>
          <span className="text-xs text-muted">{answeredCount} / {test.questions.length} 응답</span>
          {index === test.questions.length - 1 ? (
            <Button onClick={() => setSubmitted(true)}>제출하고 채점</Button>
          ) : (
            <Button onClick={() => setIndex((prev) => prev + 1)}>
              다음 <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="JLPT 모의고사"
        description="문자·어휘 / 문법 / 독해 / 청해 4개 영역으로 구성된 샘플 모의고사입니다. 제출하면 영역별 점수와 취약 영역을 알려줍니다."
      />

      <ul className="grid gap-2 sm:grid-cols-2">
        {MOCK_TESTS.map((item) => {
          const past = user.data.mockResults.filter((entry) => entry.testId === item.id);
          const best = past.reduce((max, entry) => Math.max(max, percent(entry.correct, entry.total)), 0);
          return (
            <li key={item.id}>
              <Card className="h-full">
                <div className="flex items-center gap-2">
                  <LevelBadge level={item.level} />
                  {past.length > 0 ? <Badge tone="primary">최고 {best}%</Badge> : null}
                </div>
                <CardTitle className="mt-2">{item.title}</CardTitle>
                <p className="mt-1 text-sm text-muted">
                  {item.questions.length}문항 · 제한시간 {item.minutes}분
                </p>
                <Button className="mt-4 w-full" onClick={() => start(item.id)}>
                  <GraduationCap className="h-4 w-4" /> 시험 시작
                </Button>
              </Card>
            </li>
          );
        })}
      </ul>

      {user.data.mockResults.length > 0 ? (
        <Card className="mt-4">
          <CardTitle>최근 응시 기록</CardTitle>
          <ul className="mt-3 space-y-2">
            {user.data.mockResults.slice(0, 6).map((entry) => (
              <li key={entry.id} className="flex items-center justify-between rounded-xl bg-background px-3 py-2">
                <span className="flex items-center gap-2 text-sm">
                  <LevelBadge level={entry.level} />
                  {new Date(entry.takenAt).toLocaleDateString("ko-KR")}
                </span>
                <span className="text-sm font-bold">
                  {entry.correct} / {entry.total} ({percent(entry.correct, entry.total)}%)
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
