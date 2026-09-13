"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Eye, EyeOff } from "lucide-react";
import { Badge, LevelBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { QuestionCard } from "@/components/study/question-card";
import { READINGS } from "@/lib/content";
import { useAppStore, useCurrentUser } from "@/lib/store";
import { JLPT_LEVELS, LEVEL_LABEL, type JlptLevel } from "@/lib/types";
import { percent } from "@/lib/utils";

type LevelFilter = JlptLevel | "ALL";

const LEVEL_OPTIONS: { value: LevelFilter; label: string }[] = [
  { value: "ALL", label: "전체" },
  ...JLPT_LEVELS.filter((level) => level !== "BASIC").map((level) => ({
    value: level as LevelFilter,
    label: LEVEL_LABEL[level],
  })),
];

export default function ReadingPage() {
  const user = useCurrentUser();
  const studyItem = useAppStore((state) => state.studyItem);
  const addWrongAnswer = useAppStore((state) => state.addWrongAnswer);

  const [level, setLevel] = useState<LevelFilter>(
    user?.data.currentLevel === "BASIC" ? "N5" : (user?.data.currentLevel ?? "ALL"),
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});

  const items = useMemo(
    () => (level === "ALL" ? READINGS : READINGS.filter((item) => item.level === level)),
    [level],
  );
  const progress = user?.data.progress ?? {};
  if (!user) return null;

  const passage = items.find((item) => item.id === openId);

  if (passage) {
    const answeredCount = passage.questions.filter((question) => question.id in results).length;
    const correctCount = passage.questions.filter((question) => results[question.id]).length;
    const finished = answeredCount === passage.questions.length;

    return (
      <div className="animate-fade-up">
        <button
          onClick={() => {
            setOpenId(null);
            setResults({});
            setShowTranslation(false);
          }}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> 목록으로
        </button>

        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <LevelBadge level={passage.level} />
            <Badge tone="primary">{passage.type}</Badge>
            <h1 className="text-lg font-bold">{passage.title}</h1>
          </div>

          <div className="jp mt-4 whitespace-pre-line rounded-xl bg-background p-4 text-[15px] leading-8">
            {passage.content}
          </div>

          <button
            onClick={() => setShowTranslation((prev) => !prev)}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
          >
            {showTranslation ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showTranslation ? "해석 숨기기" : "한국어 해석 보기"}
          </button>

          {showTranslation ? (
            <p className="mt-2 whitespace-pre-line rounded-xl bg-primary-soft p-4 text-sm leading-relaxed">
              {passage.translation}
            </p>
          ) : null}

          {passage.vocabHints.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs font-bold text-muted">주요 단어</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {passage.vocabHints.map((hint) => (
                  <li key={hint.word} className="rounded-lg bg-background px-2.5 py-1 text-xs">
                    <span className="jp font-bold">{hint.word}</span>
                    <span className="jp ml-1 text-muted">({hint.reading})</span>
                    <span className="ml-1.5">{hint.meaning}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>

        <div className="mt-4 space-y-3">
          {passage.questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              index={index}
              onAnswered={(correct, chosenIndex) => {
                setResults((prev) => ({ ...prev, [question.id]: correct }));
                if (!correct) {
                  addWrongAnswer({
                    type: "reading",
                    questionId: question.id,
                    question: question.question,
                    choices: question.choices,
                    chosenIndex,
                    answerIndex: question.answerIndex,
                    explanation: question.explanation,
                    sourceTitle: passage.title,
                  });
                }
              }}
            />
          ))}
        </div>

        {finished ? (
          <Card className="mt-4 text-center">
            <p className="text-sm text-muted">채점 결과</p>
            <p className="mt-1 text-2xl font-bold">
              {correctCount} / {passage.questions.length} 정답
            </p>
            <Button
              className="mt-4 w-full"
              size="lg"
              onClick={() => {
                studyItem({
                  itemId: passage.id,
                  type: "reading",
                  countKey: "reading",
                  title: passage.title,
                  correct: correctCount === passage.questions.length,
                  isReview: progress[passage.id]?.status === "learning",
                });
                setOpenId(null);
                setResults({});
                setShowTranslation(false);
              }}
            >
              학습 완료하고 목록으로
            </Button>
          </Card>
        ) : null}
      </div>
    );
  }

  const done = items.filter((item) => progress[item.id] && progress[item.id].status !== "new").length;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="독해 학습"
        description="JLPT 유형별 지문을 읽고 문제를 풉니다. 해석과 주요 단어를 함께 확인할 수 있습니다."
      />

      <div className="mb-4 space-y-3">
        <Tabs value={level} onChange={setLevel} options={LEVEL_OPTIONS} />
        <p className="text-xs text-muted">
          완료한 지문 {done} / {items.length} ({percent(done, items.length)}%)
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState title="표시할 지문이 없습니다" description="다른 레벨을 선택해 보세요." />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {items.map((item) => {
            const state = progress[item.id];
            return (
              <li key={item.id}>
                <button onClick={() => setOpenId(item.id)} className="w-full text-left">
                  <Card className="h-full transition-colors hover:border-primary">
                    <div className="flex flex-wrap items-center gap-2">
                      <LevelBadge level={item.level} />
                      <Badge tone="primary">{item.type}</Badge>
                      {state && state.status !== "new" ? <Badge tone="success">완료</Badge> : null}
                    </div>
                    <CardTitle className="mt-2">{item.title}</CardTitle>
                    <p className="jp mt-1 line-clamp-2 text-sm text-muted">{item.content}</p>
                    <p className="mt-2 flex items-center gap-1 text-xs text-primary">
                      <BookOpen className="h-3.5 w-3.5" /> 문제 {item.questions.length}개
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
