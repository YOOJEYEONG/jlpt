"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Headphones } from "lucide-react";
import { Badge, LevelBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { AudioPlayer } from "@/components/study/audio-player";
import { QuestionCard } from "@/components/study/question-card";
import { LISTENINGS } from "@/lib/content";
import { useAppStore, useCurrentUser } from "@/lib/store";
import { JLPT_LEVELS, LEVEL_LABEL, type JlptLevel } from "@/lib/types";

type LevelFilter = JlptLevel | "ALL";

const LEVEL_OPTIONS: { value: LevelFilter; label: string }[] = [
  { value: "ALL", label: "전체" },
  ...JLPT_LEVELS.filter((level) => level !== "BASIC").map((level) => ({
    value: level as LevelFilter,
    label: LEVEL_LABEL[level],
  })),
];

export default function ListeningPage() {
  const user = useCurrentUser();
  const studyItem = useAppStore((state) => state.studyItem);
  const addWrongAnswer = useAppStore((state) => state.addWrongAnswer);

  const [level, setLevel] = useState<LevelFilter>("ALL");
  const [openId, setOpenId] = useState<string | null>(null);
  const [showScript, setShowScript] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});

  const items = useMemo(
    () => (level === "ALL" ? LISTENINGS : LISTENINGS.filter((item) => item.level === level)),
    [level],
  );
  const progress = user?.data.progress ?? {};
  if (!user) return null;

  const item = items.find((entry) => entry.id === openId);

  if (item) {
    const answered = item.questions.filter((question) => question.id in results).length;
    const correctCount = item.questions.filter((question) => results[question.id]).length;

    return (
      <div className="animate-fade-up">
        <button
          onClick={() => {
            setOpenId(null);
            setResults({});
            setShowScript(false);
            setShowTranslation(false);
          }}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> 목록으로
        </button>

        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <LevelBadge level={item.level} />
            <h1 className="text-lg font-bold">{item.title}</h1>
          </div>
          <p className="mt-1 text-sm text-muted">{item.scene}</p>

          <div className="mt-4">
            <AudioPlayer
              audioUrl={item.audioUrl}
              durationSec={item.durationSec}
              lines={item.transcript.map((line) => line.jp)}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowScript((prev) => !prev)}>
              {showScript ? "스크립트 숨기기" : "스크립트 보기"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowTranslation((prev) => !prev)}>
              {showTranslation ? "해석 숨기기" : "한국어 해석 보기"}
            </Button>
          </div>

          {showScript ? (
            <ul className="mt-3 space-y-2">
              {item.transcript.map((line, index) => (
                <li key={index} className="rounded-xl bg-background p-3">
                  <p className="text-xs font-bold text-primary">{line.speaker}</p>
                  <p className="jp mt-0.5 text-sm">{line.jp}</p>
                  {showTranslation ? <p className="mt-1 text-xs text-muted">{line.ko}</p> : null}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-4">
            <p className="text-xs font-bold text-muted">주요 표현</p>
            <ul className="mt-2 space-y-1.5">
              {item.keyExpressions.map((expression) => (
                <li key={expression.jp} className="rounded-xl bg-primary-soft px-3 py-2">
                  <span className="jp text-sm font-semibold">{expression.jp}</span>
                  <span className="ml-2 text-xs text-foreground/70">{expression.ko}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <div className="mt-4 space-y-3">
          {item.questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              onAnswered={(correct, chosenIndex) => {
                setResults((prev) => ({ ...prev, [question.id]: correct }));
                if (!correct) {
                  addWrongAnswer({
                    type: "listening",
                    questionId: question.id,
                    question: question.question,
                    choices: question.choices,
                    chosenIndex,
                    answerIndex: question.answerIndex,
                    explanation: question.explanation,
                    sourceTitle: item.title,
                  });
                }
              }}
            />
          ))}
        </div>

        {answered === item.questions.length ? (
          <Card className="mt-4 text-center">
            <p className="text-sm text-muted">채점 결과</p>
            <p className="mt-1 text-2xl font-bold">
              {correctCount} / {item.questions.length} 정답
            </p>
            <Button
              className="mt-4 w-full"
              size="lg"
              onClick={() => {
                studyItem({
                  itemId: item.id,
                  type: "listening",
                  countKey: "listening",
                  title: item.title,
                  correct: correctCount === item.questions.length,
                  isReview: progress[item.id]?.status === "learning",
                });
                setOpenId(null);
                setResults({});
              }}
            >
              학습 완료하고 목록으로
            </Button>
          </Card>
        ) : null}
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="청해 학습"
        description="음원을 듣고 문제를 풉니다. 속도 조절, 스크립트, 해석, 주요 표현을 함께 제공합니다."
      />

      <Tabs label="JLPT 레벨" className="mb-4" value={level} onChange={setLevel} options={LEVEL_OPTIONS} />

      {items.length === 0 ? (
        <EmptyState title="표시할 청해 문제가 없습니다" description="다른 레벨을 선택해 보세요." />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {items.map((entry) => {
            const state = progress[entry.id];
            return (
              <li key={entry.id}>
                <button onClick={() => setOpenId(entry.id)} className="w-full text-left">
                  <Card className="h-full transition-colors hover:border-primary">
                    <div className="flex flex-wrap items-center gap-2">
                      <LevelBadge level={entry.level} />
                      {state && state.status !== "new" ? <Badge tone="success">완료</Badge> : null}
                    </div>
                    <CardTitle className="mt-2">{entry.title}</CardTitle>
                    <p className="mt-1 text-sm text-muted">{entry.scene}</p>
                    <p className="mt-2 flex items-center gap-1 text-xs text-primary">
                      <Headphones className="h-3.5 w-3.5" /> 약 {entry.durationSec}초 · 문제 {entry.questions.length}개
                    </p>
                  </Card>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
