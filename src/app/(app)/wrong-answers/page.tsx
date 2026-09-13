"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { QuestionCard } from "@/components/study/question-card";
import { useAppStore, useCurrentUser } from "@/lib/store";
import { cn } from "@/lib/utils";

type Filter = "all" | "todo" | "done";
type Mode = "list" | "retry";

const TYPE_LABEL: Record<string, string> = {
  reading: "독해",
  listening: "청해",
  mock: "모의고사",
  vocabulary: "단어",
  grammar: "문법",
  kanji: "한자",
};

export default function WrongAnswersPage() {
  const user = useCurrentUser();
  const markReviewed = useAppStore((state) => state.markWrongAnswerReviewed);
  const clearWrongAnswer = useAppStore((state) => state.clearWrongAnswer);

  const [filter, setFilter] = useState<Filter>("all");
  const [mode, setMode] = useState<Mode>("list");
  const [retryIndex, setRetryIndex] = useState(0);
  // 정답을 맞히면 목록에서 빠지므로, 다시 풀기를 시작한 시점의 목록을 고정합니다.
  const [retryQueue, setRetryQueue] = useState<typeof all>([]);

  const all = useMemo(() => user?.data.wrongAnswers ?? [], [user]);
  const items = useMemo(() => {
    if (filter === "todo") return all.filter((item) => !item.reviewedAt);
    if (filter === "done") return all.filter((item) => item.reviewedAt);
    return all;
  }, [all, filter]);

  if (!user) return null;

  const retryPool = all.filter((item) => !item.reviewedAt);
  const retryItem = retryQueue[retryIndex];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="오답노트"
        description="틀린 문제는 자동으로 저장됩니다. 모아서 다시 풀고, 복습이 끝나면 완료 처리하세요."
        action={
          retryPool.length > 0 ? (
            <Button
              onClick={() => {
                const next = mode === "retry" ? "list" : "retry";
                if (next === "retry") setRetryQueue(retryPool);
                setMode(next);
                setRetryIndex(0);
              }}
            >
              {mode === "retry" ? "목록 보기" : `오답 ${retryPool.length}개 다시 풀기`}
            </Button>
          ) : null
        }
      />

      {all.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-8 w-8 text-success" />}
          title="아직 틀린 문제가 없습니다"
          description="독해 · 청해 · 모의고사에서 문제를 풀면 틀린 문제가 여기에 자동으로 모입니다."
          action={
            <Link href="/mock-test">
              <Button>모의고사 풀어보기</Button>
            </Link>
          }
        />
      ) : mode === "retry" ? (
        retryItem ? (
          <Card>
            <div className="flex items-center justify-between">
              <Badge tone="primary">{TYPE_LABEL[retryItem.type] ?? retryItem.type}</Badge>
              <span className="text-xs text-muted">
                {retryIndex + 1} / {retryQueue.length}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted">출처: {retryItem.sourceTitle}</p>

            <div className="mt-3">
              <QuestionCard
                key={retryItem.id}
                question={{
                  id: retryItem.questionId,
                  question: retryItem.question,
                  choices: retryItem.choices,
                  answerIndex: retryItem.answerIndex,
                  explanation: retryItem.explanation,
                }}
                onAnswered={(correct) => {
                  if (correct) markReviewed(retryItem.id);
                }}
              />
            </div>

            <Button
              className="mt-3 w-full"
              onClick={() => {
                if (retryIndex + 1 >= retryQueue.length) {
                  setMode("list");
                  setRetryIndex(0);
                } else {
                  setRetryIndex((prev) => prev + 1);
                }
              }}
            >
              {retryIndex + 1 >= retryQueue.length ? "복습 마치기" : "다음 문제"}
            </Button>
          </Card>
        ) : (
          <EmptyState title="다시 풀 오답이 없습니다" description="모든 오답을 복습했습니다." />
        )
      ) : (
        <>
          <Tabs
            className="mb-4"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all" as Filter, label: `전체 ${all.length}` },
              { value: "todo" as Filter, label: `복습 전 ${all.filter((item) => !item.reviewedAt).length}` },
              { value: "done" as Filter, label: `복습 완료 ${all.filter((item) => item.reviewedAt).length}` },
            ]}
          />

          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id}>
                <Card>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="primary">{TYPE_LABEL[item.type] ?? item.type}</Badge>
                    <span className="text-xs text-muted">{item.sourceTitle}</span>
                    {item.reviewedAt ? <Badge tone="success">복습 완료</Badge> : <Badge tone="danger">복습 전</Badge>}
                    <button
                      aria-label="오답 삭제"
                      onClick={() => clearWrongAnswer(item.id)}
                      className="ml-auto rounded-lg p-1.5 text-muted hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <CardTitle className="jp mt-3">{item.question}</CardTitle>

                  <ul className="mt-3 space-y-1">
                    {item.choices.map((choice, index) => (
                      <li
                        key={choice}
                        className={cn(
                          "jp rounded-lg px-3 py-2 text-sm",
                          index === item.answerIndex
                            ? "bg-[#e8f7ee] font-semibold text-success"
                            : index === item.chosenIndex
                              ? "bg-[#fdeaea] text-danger line-through"
                              : "bg-background text-muted",
                        )}
                      >
                        {index + 1}. {choice}
                      </li>
                    ))}
                  </ul>

                  <p className="mt-3 rounded-xl bg-background p-3 text-sm text-muted">{item.explanation}</p>

                  {!item.reviewedAt ? (
                    <Button variant="outline" className="mt-3" size="sm" onClick={() => markReviewed(item.id)}>
                      복습 완료로 표시
                    </Button>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
