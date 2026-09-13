"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/field";
import { PageHeader } from "@/components/layout/page-header";
import { DEFAULT_DAILY_GOAL, useAppStore, useCurrentUser, type DailyGoal } from "@/lib/store";
import { cancelPendingSync, flushSync } from "@/lib/sync";
import { JLPT_LEVELS, LEVEL_LABEL, type JlptLevel, type JobGoal } from "@/lib/types";

const GOAL_FIELDS: { key: keyof DailyGoal; label: string }[] = [
  { key: "vocabulary", label: "단어" },
  { key: "kanji", label: "한자" },
  { key: "grammar", label: "문법" },
  { key: "reading", label: "독해" },
  { key: "listening", label: "청해" },
  { key: "review", label: "복습" },
  { key: "business", label: "비즈니스 일본어" },
];

export default function SettingsPage() {
  const router = useRouter();
  const user = useCurrentUser();
  const updateSettings = useAppStore((state) => state.updateSettings);
  const resetProgress = useAppStore((state) => state.resetProgress);
  const signOut = useAppStore((state) => state.signOut);

  const [currentLevel, setCurrentLevel] = useState<JlptLevel>(user?.data.currentLevel ?? "N5");
  const [targetJlpt, setTargetJlpt] = useState<JlptLevel>(user?.data.targetJlpt ?? "N1");
  const [jobGoal, setJobGoal] = useState<JobGoal>(user?.data.jobGoal ?? "BOTH");
  const [dailyGoal, setDailyGoal] = useState<DailyGoal>(user?.data.dailyGoal ?? DEFAULT_DAILY_GOAL);
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!user) return null;

  function save() {
    updateSettings({ currentLevel, targetJlpt, jobGoal, dailyGoal });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="animate-fade-up">
      <PageHeader title="설정" description="학습 목표와 하루 분량을 조정합니다." />

      <Card>
        <CardTitle>계정</CardTitle>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between rounded-xl bg-background px-3 py-2">
            <dt className="text-muted">이름</dt>
            <dd className="font-semibold">{user.account.name}</dd>
          </div>
          <div className="flex justify-between rounded-xl bg-background px-3 py-2">
            <dt className="text-muted">이메일</dt>
            <dd className="font-semibold">{user.account.email}</dd>
          </div>
          <div className="flex justify-between rounded-xl bg-background px-3 py-2">
            <dt className="text-muted">가입일</dt>
            <dd className="font-semibold">{new Date(user.account.createdAt).toLocaleDateString("ko-KR")}</dd>
          </div>
        </dl>
      </Card>

      <Card className="mt-3">
        <CardTitle>학습 목표</CardTitle>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="current">현재 레벨</Label>
            <Select id="current" value={currentLevel} onChange={(event) => setCurrentLevel(event.target.value as JlptLevel)}>
              {JLPT_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {LEVEL_LABEL[level]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="target">목표 레벨</Label>
            <Select id="target" value={targetJlpt} onChange={(event) => setTargetJlpt(event.target.value as JlptLevel)}>
              {JLPT_LEVELS.filter((level) => level !== "BASIC").map((level) => (
                <option key={level} value={level}>
                  {LEVEL_LABEL[level]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="goal">최종 목표</Label>
            <Select id="goal" value={jobGoal} onChange={(event) => setJobGoal(event.target.value as JobGoal)}>
              <option value="JLPT_N1">JLPT N1 합격</option>
              <option value="JAPAN_JOB">일본 취업</option>
              <option value="BOTH">JLPT N1 + 일본 취업</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="mt-3">
        <CardTitle>하루 학습 목표</CardTitle>
        <p className="mt-1 text-sm text-muted">대시보드의 &ldquo;오늘의 학습&rdquo; 분량이 이 값으로 계산됩니다.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {GOAL_FIELDS.map((field) => (
            <div key={field.key}>
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                type="number"
                min={0}
                max={200}
                value={dailyGoal[field.key]}
                onChange={(event) =>
                  setDailyGoal((prev) => ({ ...prev, [field.key]: Math.max(0, Number(event.target.value) || 0) }))
                }
              />
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button onClick={save}>
            <Save className="h-4 w-4" /> 저장하기
          </Button>
          <Button variant="outline" onClick={() => setDailyGoal(DEFAULT_DAILY_GOAL)}>
            기본값으로
          </Button>
          {saved ? <span className="text-sm font-semibold text-success">저장되었습니다.</span> : null}
        </div>
      </Card>

      <Card className="mt-3">
        <CardTitle>데이터</CardTitle>
        <p className="mt-1 text-sm text-muted">
          학습 기록은 이 브라우저에만 저장됩니다. 초기화하면 되돌릴 수 없습니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              // 남은 변경분을 먼저 올린 뒤 세션을 끊습니다.
              flushSync();
              cancelPendingSync();
              await signOut();
              router.push("/login");
            }}
          >
            <LogOut className="h-4 w-4" /> 로그아웃
          </Button>
          {confirmReset ? (
            <>
              <Button
                variant="danger"
                onClick={() => {
                  resetProgress();
                  setConfirmReset(false);
                }}
              >
                정말 초기화합니다
              </Button>
              <Button variant="ghost" onClick={() => setConfirmReset(false)}>
                취소
              </Button>
            </>
          ) : (
            <Button variant="ghost" className="text-danger" onClick={() => setConfirmReset(true)}>
              <Trash2 className="h-4 w-4" /> 학습 기록 초기화
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
