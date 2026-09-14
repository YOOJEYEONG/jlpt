"use client";

import { useMemo, useState } from "react";
import { Check, Lightbulb, RotateCcw, X } from "lucide-react";
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
import { SpeakButton, VoiceNotice } from "@/components/study/speak-button";
import { KanaTracer } from "@/components/study/kana-tracer";

type Script = "hiragana" | "katakana";
type Group = "basic" | "dakuten" | "yoon";
type Mode = "table" | "trace" | "practice";

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
  const clearProgress = useAppStore((state) => state.clearProgress);
  const [confirmReset, setConfirmReset] = useState(false);

  const [script, setScript] = useState<Script>("hiragana");
  const [group, setGroup] = useState<Group>("basic");
  const [mode, setMode] = useState<Mode>("table");
  const [selected, setSelected] = useState<KanaChar | null>(null);

  const [traceIndex, setTraceIndex] = useState(0);
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

  const traceChar = groupChars[traceIndex % Math.max(1, groupChars.length)];
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
      <VoiceNotice />
      <PageHeader
        title="히라가나 · 가타카나"
        description="일본어의 출발점입니다. 표에서 소리를 익히고, 따라쓰기로 손에 익힌 뒤, 소리 맞히기로 확인하세요."
      />

      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Tabs
            label="글자 종류"
            value={script}
            onChange={(value) => { setScript(value); setSelected(null); setChosen(null); }}
            options={[
              { value: "hiragana" as Script, label: "히라가나" },
              { value: "katakana" as Script, label: "가타카나" },
            ]}
          />
          <Tabs
            label="학습 방식"
            size="sm"
            value={mode}
            onChange={(value) => { setMode(value); setChosen(null); setQuizIndex(0); setTraceIndex(0); setScore({ correct: 0, wrong: 0 }); }}
            options={[
              { value: "table" as Mode, label: "표 보기" },
              { value: "trace" as Mode, label: "따라쓰기" },
              { value: "practice" as Mode, label: "소리 맞히기" },
            ]}
          />
        </div>

        <Tabs
          label="글자 묶음"
          size="sm"
          value={group}
          onChange={(value) => { setGroup(value); setSelected(null); setChosen(null); setQuizIndex(0); setTraceIndex(0); }}
          options={(Object.keys(GROUP_LABEL) as Group[]).map((key) => ({ value: key, label: GROUP_LABEL[key] }))}
        />

        <Progress value={percent(learned, KANA_CHARS.length)} label={`외운 글자 ${learned} / ${KANA_CHARS.length}`} />

        {learned > 0 ? (
          <div className="flex justify-end">
            {confirmReset ? (
              <span className="flex items-center gap-2">
                <span className="text-xs text-muted">외운 글자 {learned}자를 모두 지웁니다.</span>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    clearProgress(KANA_CHARS.map((item) => item.id), ["kana"]);
                    setConfirmReset(false);
                  }}
                >
                  정말 지웁니다
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>
                  취소
                </Button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-danger"
              >
                <RotateCcw className="h-3.5 w-3.5" /> 가나 진행도 초기화
              </button>
            )}
          </div>
        ) : null}
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
                  <SpeakButton label="소리 듣기" text={selected.example?.word ?? selected.hiragana} />
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
                  className="mt-4 w-full bg-success hover:bg-[#115c31]"
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
      ) : mode === "trace" && traceChar ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge tone="primary">
                {GROUP_LABEL[group]} · {traceIndex + 1} / {groupChars.length}
              </Badge>
              <div className="flex items-center gap-2">
                <span className="jp text-sm text-muted">
                  {traceChar.romaji} · {traceChar.korean}
                </span>
                <SpeakButton label="소리 듣기" text={traceChar.example?.word ?? traceChar.hiragana} />
              </div>
            </div>

            <KanaTracer
              key={`${script}-${traceChar.id}`}
              character={script === "hiragana" ? traceChar.hiragana : traceChar.katakana}
              romaji={traceChar.romaji}
            />

            <div className="mt-4 grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => setTraceIndex((prev) => (prev - 1 + groupChars.length) % groupChars.length)}
              >
                이전
              </Button>
              <Button
                className="bg-success hover:bg-[#115c31]"
                onClick={() => {
                  studyItem({
                    itemId: traceChar.id,
                    type: "kana",
                    countKey: "kana",
                    title: `${traceChar.hiragana} / ${traceChar.katakana} 쓰기`,
                    correct: true,
                    isReview: progress[traceChar.id]?.status === "learning",
                  });
                  setTraceIndex((prev) => (prev + 1) % groupChars.length);
                }}
              >
                <Check className="h-4 w-4" /> 다 썼어요
              </Button>
              <Button
                variant="outline"
                onClick={() => setTraceIndex((prev) => (prev + 1) % groupChars.length)}
              >
                다음
              </Button>
            </div>
          </Card>

          <Card className="h-fit">
            <CardTitle>쓰는 순서 요령</CardTitle>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted">
              <li>· 왼쪽에서 오른쪽으로, 위에서 아래로 씁니다.</li>
              <li>· 가로획을 먼저 긋고 세로획을 나중에 긋는 경우가 많습니다.</li>
              <li>· 바깥을 먼저 만들고 안을 채웁니다.</li>
              <li>· 글자가 격자 가운데에 오도록 크기를 맞춥니다.</li>
            </ul>

            <div className="mt-4 rounded-xl bg-background p-3 text-center">
              <p className="jp text-4xl font-bold">
                {script === "hiragana" ? traceChar.hiragana : traceChar.katakana}
              </p>
              <p className="mt-1 text-xs text-muted">
                {script === "hiragana" ? "히라가나" : "가타카나"} · {traceChar.romaji}
              </p>
              {traceChar.example ? (
                <p className="jp mt-2 text-sm">
                  {traceChar.example.word}
                  <span className="ml-1 text-xs text-muted">{traceChar.example.meaning}</span>
                </p>
              ) : null}
            </div>

            {traceChar.tip ? (
              <p className="mt-3 flex gap-2 rounded-xl bg-accent-soft p-3 text-xs text-accent">
                <Lightbulb className="h-4 w-4 shrink-0" />
                {traceChar.tip}
              </p>
            ) : null}
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
