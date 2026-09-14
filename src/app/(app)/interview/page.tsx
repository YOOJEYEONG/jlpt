"use client";

import { useMemo, useState } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/field";
import { Tabs } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { INTERVIEW_CATEGORIES, INTERVIEW_QUESTIONS } from "@/lib/content";
import { useAppStore, useCurrentUser } from "@/lib/store";
import { percent } from "@/lib/utils";
import { SpeakButton, VoiceNotice } from "@/components/study/speak-button";

export default function InterviewPage() {
  const user = useCurrentUser();
  const studyItem = useAppStore((state) => state.studyItem);
  const setDraft = useAppStore((state) => state.setDraft);

  const [category, setCategory] = useState<string>("전체");
  const [openId, setOpenId] = useState<string | null>(INTERVIEW_QUESTIONS[0]?.id ?? null);
  const [showAnswer, setShowAnswer] = useState(false);

  const options = useMemo(
    () => [{ value: "전체", label: "전체" }, ...INTERVIEW_CATEGORIES.map((item) => ({ value: item, label: item }))],
    [],
  );
  const items = useMemo(
    () =>
      category === "전체"
        ? INTERVIEW_QUESTIONS
        : INTERVIEW_QUESTIONS.filter((item) => item.category === category),
    [category],
  );

  const progress = user?.data.progress ?? {};
  if (!user) return null;

  const selected = items.find((item) => item.id === openId) ?? items[0];
  const learned = items.filter((item) => progress[item.id] && progress[item.id].status !== "new").length;
  const draftKey = selected ? `interview:${selected.id}` : "";
  const draft = user.data.drafts[draftKey] ?? "";

  return (
    <div className="animate-fade-up">
      <VoiceNotice />
      <PageHeader
        title="일본 취업 면접"
        description="질문 → 모범 답변 → 해석 → 주요 표현 → 직접 답변 연습 순서로 준비합니다."
      />

      <div className="mb-4 space-y-3">
        <Tabs
          size="sm"
          value={category}
          onChange={(value) => {
            setCategory(value);
            const next =
              value === "전체"
                ? INTERVIEW_QUESTIONS
                : INTERVIEW_QUESTIONS.filter((item) => item.category === value);
            setOpenId(next[0]?.id ?? null);
            setShowAnswer(false);
          }}
          options={options}
        />
        <Progress value={percent(learned, items.length)} label={`연습한 질문 ${learned} / ${items.length}`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <Card className="h-fit">
          <CardTitle>질문 목록</CardTitle>
          <ul className="mt-3 space-y-1">
            {items.map((item) => {
              const active = selected?.id === item.id;
              const done = progress[item.id] && progress[item.id].status !== "new";
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setOpenId(item.id);
                      setShowAnswer(false);
                    }}
                    className={
                      active
                        ? "flex w-full items-center gap-2 rounded-xl bg-primary px-3 py-2 text-left text-sm font-semibold text-white"
                        : "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-muted hover:bg-background"
                    }
                  >
                    {done ? <Check className="h-3.5 w-3.5 shrink-0" /> : null}
                    <span className="min-w-0 truncate">{item.category}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        {selected ? (
          <Card>
            <Badge tone="primary">{selected.category}</Badge>
            <p className="jp mt-3 text-lg font-bold">{selected.questionJp}</p>
            <p className="jp mt-1 text-xs text-muted">{selected.questionReading}</p>
            <p className="mt-1.5 text-sm text-muted">{selected.questionKo}</p>
            <SpeakButton className="mt-2" variant="text" label="질문 듣기" text={selected.questionReading} />

            <div className="mt-5">
              <p className="mb-1.5 text-sm font-bold">내 답변 연습</p>
              <Textarea
                rows={5}
                value={draft}
                placeholder="일본어로 직접 답변을 작성해 보세요. 작성한 내용은 저장됩니다."
                onChange={(event) => setDraft(draftKey, event.target.value)}
                className="jp"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAnswer((prev) => !prev)}>
                  {showAnswer ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showAnswer ? "모범 답변 숨기기" : "모범 답변 보기"}
                </Button>
                <SpeakButton variant="text" label="모범 답변 듣기" text={selected.sampleAnswerJp} />
              </div>
            </div>

            {showAnswer ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-primary-soft p-4">
                  <p className="text-xs font-bold text-primary">모범 답변</p>
                  <p className="jp mt-1.5 whitespace-pre-line text-sm leading-7">{selected.sampleAnswerJp}</p>
                </div>
                <div className="rounded-xl bg-background p-4">
                  <p className="text-xs font-bold text-muted">한국어 해석</p>
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed">{selected.sampleAnswerKo}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted">주요 표현</p>
                  <ul className="mt-2 space-y-1.5">
                    {selected.keyExpressions.map((expression) => (
                      <li key={expression.jp} className="flex items-center justify-between rounded-xl bg-background px-3 py-2">
                        <span className="jp text-sm font-semibold">{expression.jp}</span>
                        <span className="text-xs text-muted">{expression.ko}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="rounded-xl bg-accent-soft px-3 py-2 text-xs text-accent">
                  <span className="font-bold">면접 팁</span> · {selected.tip}
                </p>
              </div>
            ) : null}

            <Button
              className="mt-4 w-full"
              size="lg"
              onClick={() =>
                studyItem({
                  itemId: selected.id,
                  type: "interview",
                  countKey: "interview",
                  title: selected.questionKo,
                  correct: true,
                })
              }
            >
              <Check className="h-4 w-4" /> 이 질문 연습 완료
            </Button>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
