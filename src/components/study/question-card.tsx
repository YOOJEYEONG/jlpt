"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QuizQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";

export function QuestionCard({
  question,
  index,
  onAnswered,
}: {
  question: QuizQuestion;
  index?: number;
  onAnswered?: (correct: boolean, chosenIndex: number) => void;
}) {
  const [chosen, setChosen] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const correct = submitted && chosen === question.answerIndex;

  function submit() {
    if (chosen === null) return;
    setSubmitted(true);
    onAnswered?.(chosen === question.answerIndex, chosen);
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="jp text-sm font-bold">
        {typeof index === "number" ? `${index + 1}. ` : ""}
        {question.question}
      </p>

      <ul className="mt-3 space-y-1.5">
        {question.choices.map((choice, choiceIndex) => {
          const isAnswer = choiceIndex === question.answerIndex;
          const isChosen = choiceIndex === chosen;
          return (
            <li key={choice}>
              <button
                disabled={submitted}
                onClick={() => setChosen(choiceIndex)}
                className={cn(
                  "jp flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                  submitted && isAnswer && "border-success bg-[#e8f7ee] text-success",
                  submitted && isChosen && !isAnswer && "border-danger bg-[#fdeaea] text-danger",
                  !submitted && isChosen && "border-primary bg-primary-soft",
                  !submitted && !isChosen && "border-line hover:border-[#c9d2e6]",
                  submitted && !isAnswer && !isChosen && "border-line opacity-60",
                )}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-bold">
                  {choiceIndex + 1}
                </span>
                <span className="min-w-0 flex-1">{choice}</span>
                {submitted && isAnswer ? <Check className="h-4 w-4" /> : null}
                {submitted && isChosen && !isAnswer ? <X className="h-4 w-4" /> : null}
              </button>
            </li>
          );
        })}
      </ul>

      {submitted ? (
        <div
          className={cn(
            "mt-3 rounded-xl px-3 py-2.5 text-sm",
            correct ? "bg-[#e8f7ee] text-success" : "bg-[#fdeaea] text-danger",
          )}
        >
          <p className="font-bold">{correct ? "정답입니다" : "오답입니다"}</p>
          <p className="mt-1 text-foreground/80">{question.explanation}</p>
        </div>
      ) : (
        <Button className="mt-3 w-full" disabled={chosen === null} onClick={submit}>
          정답 확인
        </Button>
      )}
    </div>
  );
}
