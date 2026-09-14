"use client";

import { useMemo, useState } from "react";
import { Check, Lightbulb, Volume2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { KANA, KANA_CHARS } from "@/lib/content";
import { useAppStore, useCurrentUser } from "@/lib/store";
import type { KanaChar, KanaRow } from "@/lib/types";
import { cn, percent, seededShuffle, speakJapanese } from "@/lib/utils";

type Script = "hiragana" | "katakana";
type Group = "basic" | "dakuten" | "yoon";
type Mode = "table" | "practice";

const GROUP_LABEL: Record<Group, string> = {
  basic: "기본 46자",
  dakuten: "탁음 · 반탁음",
  yoon: "요음",
};

/** 같은 글자에는 항상 같은 보기 순서가 나오도록 시드를 씁니다. */
function makeChoices(target: KanaChar, pool: KanaChar[]) {
  const distractors = seededShuffle(
    pool.filter((item) => item.romaji !== target.romaji),
    `${target.id}:pool`,
  ).slice(0, 3);
  const choices = seededShuffle([target, ...distractors], `${target.id}:choices`);
  return { choices, answerIndex: choices.findIndex((item) => item.id === target.id) };
}

export default function KanaPage() {
  const user = useCurrentUser();
  const studyItem = useAppStore((state) => state.studyItem);

  const [script, setScript] = useState<Script>("hiragana");
  const [group, setGroup] = useState<Group>("basic");
  const [mode, setMode] = useState<Mode>("table");
  const [selected, setSelected] = useState<KanaChar | null>(null);

  const [quizIndex, setQuizIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });

  const rows: KanaRow[] = KANA[group];
  const groupChars = useMemo(() => rows.flatMap((row) => row.chars), [rows]);
  const quizList = useMemo(() => seededShuffle(groupChars, `${group}:${script}`), [groupChars, group, script]);

  const progress = user?.data.progress ?? {};
  if (!user) return null;

  const learned = KANA_CHARS.filter((item) => progress[item.id] && progress[item.id].status !== "new").length;
  const groupLearned = groupChars.filter((item) => progress[item.id] && progress[item.id].status !== "new").length;

  const current = quizList[quizIndex % Math.max(1, quizList.length)];
  const quiz = current ? makeChoices(current, groupChars) : null;

  function answer(index: number) {
    if (!current || !quiz || chosen !== null) return;
    setChosen(index);
    const correct = index === quiz.answerIndex;
    setScore((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      wrong: prev.wrong + (correct ? 0 : 1),
    }));
    studyItem({
      itemId: current.id,
      type: "kana",
      countKey: "kana",
      title: `${current.hiragana} / ${current.katakana} (${current.romaji})`,
      correct,
      isReview: progress[current.id]?.status === "learning",
    });
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="히라가나 · 가타카나"
        description="일본어의 출발점입니다. 표에서 글자를 눌러 소리와 예시 단어를 확인하고, 연습 모드로 외웠는지 확인하세요."
      />

      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            value={script}
            onChange={(value) => { setScript(value); setSelected(null); setChosen(null); }}
            options={[
              { value: "hiragana" as Script, label: "히라가나" },
              { value: "katakana" as Script, label: "가타카나" },
            ]}
          />
          <Tabs
            size="sm"
            value={mode}
            onChange={(value) => { setMode(value); setChosen(null); setQuizIndex(0); setScore({ correct: 0, wrong: 0 }); }}
            options={[
              { value: "table" as Mode, label: "표 보기" },
              { value: "practice" as Mode, label: "연습하기" },
            ]}
          />
        </div>

        <Tabs
          size="sm"
          value={group}
          onChange={(value) => { setGroup(value); setSelected(null); setChosen(null); setQuizIndex(0); }}
          options={(Object.keys(GROUP_LABEL) as Group[]).map((key) => ({ value: key, label: GROUP_LABEL[key] }))}
        />

        <Progress value={percent(learned, KANA_CHARS.length)} label={`외운 글자 ${learned} / ${KANA_CHARS.length}`} />
      </div>

      {mode === "table" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <Card>
            <CardTitle>
              {GROUP_LABEL[group]} · {script === "hiragana" ? "히라가나" : "가타카나"}
            </CardTitle>
            <p className="mt-1 text-xs text-muted">글자를 누르면 소리가 나고, 오른쪽에 자세한 설명이 나옵니다.</p>

            <div className="mt-4 space-y-3">
              {rows.map((row) => (
                <div key={row.row}>
                  <p className="mb-1.5 text-[11px] font-bold text-muted">{row.row}</p>
                  <ul className="flex flex-wrap gap-2">
                    {row.chars.map((char) => {
                      const state = progress[char.id];
                      const done = state && state.status !== "new";
                      const active = selected?.id === char.id;
                      return (
                        <li key={char.id}>
                          <button
                            onClick={() => { setSelected(char); speakJapanese(char.example?.word ?? char.hiragana); }}
                            className={cn(
                              "flex h-16 w-16 flex-col items-center justify-center rounded-xl border transition-colors",
                              active
                                ? "border-primary bg-primary text-white"
                                : done
                                  ? "border-transparent bg-[#e8f7ee] text-success"
                                  : "border-line bg-surface hover:border-[#c9d2e6]",
                            )}
                          >
                            <span className="jp text-2xl font-bold leading-none">
                              {script === "hiragana" ? char.hiragana : char.katakana}
                            </span>
                            <span className={cn("mt-1 text-[10px]", active ? "text-white/80" : "text-muted")}>
                              {char.romaji}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </Card>

          <Card className="h-fit lg:sticky lg:top-4">
            {selected ? (
              <>
                <div className="flex items-start justify-between">
                  <Badge tone="primary">{selected.romaji}</Badge>
                  <button
                    aria-label="소리 듣기"
                    onClick={() => speakJapanese(selected.example?.word ?? selected.hiragana)}
                    className="rounded-lg p-2 text-muted hover:text-primary"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-xl bg-background py-4">
                    <p className="jp text-4xl font-bold">{selected.hiragana}</p>
                    <p className="mt-1 text-[11px] text-muted">히라가나</p>
                  </div>
                  <div className="rounded-xl bg-background py-4">
                    <p className="jp text-4xl font-bold">{selected.katakana}</p>
                    <p className="mt-1 text-[11px] text-muted">가타카나</p>
                  </div>
                </div>

                <p className="mt-3 text-center text-sm">
                  한국어 소리 <span className="font-bold">{selected.korean}</span>
                </p>

                {selected.example ? (
                  <div className="mt-3 rounded-xl bg-primary-soft p-3 text-center">
                    <p className="text-[11px] font-bold text-primary">예시 단어</p>
                    <p className="jp mt-1 text-lg font-bold">{selected.example.word}</p>
                    <p className="text-xs text-foreground/80">{selected.example.meaning}</p>
                  </div>
                ) : null}

                {selected.tip ? (
                  <p className="mt-3 flex gap-2 rounded-xl bg-accent-soft p-3 text-xs text-accent">
                    <Lightbulb className="h-4 w-4 shrink-0" />
                    {selected.tip}
                  </p>
                ) : null}

                <Button
                  className="mt-4 w-full bg-success hover:bg-[#12833c]"
                  onClick={() =>
                    studyItem({
                      itemId: selected.id,
                      type: "kana",
                      countKey: "kana",
                      title: `${selected.hiragana} / ${selected.katakana}`,
                      correct: true,
                      isReview: progress[selected.id]?.status === "learning",
                    })
                  }
                >
                  <Check className="h-4 w-4" /> 이 글자 외웠어요
                </Button>
              </>
            ) : (
              <div className="py-10 text-center">
                <p className="jp text-4xl">あ</p>
                <p className="mt-3 text-sm text-muted">왼쪽 표에서 글자를 눌러 보세요.</p>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <Card>
          <div className="flex items-center justify-between">
            <Badge tone="primary">
              {GROUP_LABEL[group]} · {quizIndex + 1} / {quizList.length}
            </Badge>
            <span className="flex gap-2">
              <Badge tone="success">정답 {score.correct}</Badge>
              <Badge tone="danger">오답 {score.wrong}</Badge>
            </span>
          </div>

          {current && quiz ? (
            <>
              <div className="mt-6 text-center">
                <p className="jp text-7xl font-bold">
                  {script === "hiragana" ? current.hiragana : current.katakana}
                </p>
                <p className="mt-2 text-sm text-muted">이 글자의 소리는?</p>
              </div>

              <ul className="mt-6 grid grid-cols-2 gap-2">
                {quiz.choices.map((choice, index) => {
                  const isAnswer = index === quiz.answerIndex;
                  const isChosen = index === chosen;
                  return (
                    <li key={choice.id}>
                      <button
                        disabled={chosen !== null}
                        onClick={() => answer(index)}
                        className={cn(
                          "flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-base font-bold transition-colors",
                          chosen !== null && isAnswer && "border-success bg-[#e8f7ee] text-success",
                          chosen !== null && isChosen && !isAnswer && "border-danger bg-[#fdeaea] text-danger",
                          chosen === null && "border-line hover:border-primary hover:bg-primary-soft",
                          chosen !== null && !isAnswer && !isChosen && "border-line opacity-50",
                        )}
                      >
                        {choice.romaji}
                        <span className="text-xs font-medium text-muted">{choice.korean}</span>
                        {chosen !== null && isAnswer ? <Check className="h-4 w-4" /> : null}
                        {chosen !== null && isChosen && !isAnswer ? <X className="h-4 w-4" /> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {chosen !== null ? (
                <div className="mt-4">
                  <div className="rounded-xl bg-background p-3 text-center text-sm">
                    <span className="jp text-lg font-bold">{current.hiragana} / {current.katakana}</span>
                    <span className="ml-2">{current.romaji} · {current.korean}</span>
                    {current.example ? (
                      <p className="jp mt-1 text-xs text-muted">
                        예: {current.example.word} ({current.example.meaning})
                      </p>
                    ) : null}
                  </div>
                  <Button
                    className="mt-3 w-full"
                    size="lg"
                    onClick={() => { setChosen(null); setQuizIndex((prev) => (prev + 1) % quizList.length); }}
                  >
                    다음 글자
                  </Button>
                </div>
              ) : (
                <p className="mt-4 text-center text-xs text-muted">
                  외운 글자 {groupLearned} / {groupChars.length}
                </p>
              )}
            </>
          ) : null}
        </Card>
      )}
    </div>
  );
}
