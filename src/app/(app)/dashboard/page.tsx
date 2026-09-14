"use client";

import Link from "next/link";
import { Award, CheckCircle2, Flame, PlayCircle, Sparkles, Target, TrendingUp } from "lucide-react";
import { Badge, LevelBadge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { Progress, ProgressRing } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/states";
import { ALL_BADGES, BADGE_LABELS, levelFromXp, todayCounts, useCurrentUser } from "@/lib/store";
import { areaProgress, buildTodayPlan, jobReadiness, remainingToTarget } from "@/lib/plan";
import { LEVEL_LABEL } from "@/lib/types";
import { formatDuration, percent } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  vocabulary: "단어",
  grammar: "문법",
  kanji: "한자",
  reading: "독해",
  listening: "청해",
  business: "비즈니스",
  interview: "면접",
  mock: "모의고사",
};

export default function DashboardPage() {
  const user = useCurrentUser();
  if (!user) return null;

  const { data, account } = user;
  const plan = buildTodayPlan(data);
  const counts = todayCounts(data);
  const areas = areaProgress(data);
  const remaining = remainingToTarget(data);
  const readiness = jobReadiness(data);
  const xp = levelFromXp(data.xp);
  const overall = percent(remaining.done, remaining.total);
  const weakest = [...areas].filter((area) => area.accuracy !== null).sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0))[0];
  const nextEntry = plan.entries.find((entry) => entry.done < entry.goal);

  return (
    <div className="animate-fade-up space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">안녕하세요, {account.name}님</p>
          <h1 className="mt-0.5 text-xl font-bold sm:text-2xl">오늘도 이어서 공부해 볼까요?</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="accent" className="gap-1">
            <Flame className="h-3.5 w-3.5" /> {data.streak}일 연속
          </Badge>
          <Badge tone="primary" className="gap-1">
            <Sparkles className="h-3.5 w-3.5" /> Lv.{xp.level}
          </Badge>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-4">
          <ProgressRing value={overall}>
            <span className="num text-lg font-bold">{overall}%</span>
            <span className="text-[10px] text-muted">진행률</span>
          </ProgressRing>
          <div className="min-w-0">
            <p className="text-xs text-muted">전체 학습 진도</p>
            <p className="mt-0.5 text-sm font-bold">
              {remaining.done} / {remaining.total} 항목
            </p>
            <p className="mt-1 text-xs text-muted">목표 {data.targetJlpt}까지 {remaining.remaining}개 남음</p>
          </div>
        </Card>

        <Card>
          <p className="text-xs text-muted">현재 / 목표 레벨</p>
          <div className="mt-2 flex items-center gap-2">
            <LevelBadge level={data.currentLevel} />
            <span className="text-muted">→</span>
            <LevelBadge level={data.targetJlpt} />
          </div>
          <p className="mt-3 text-xs text-muted">
            {LEVEL_LABEL[data.currentLevel]} 단계 콘텐츠를 학습 중입니다.
          </p>
          <Link href="/roadmap" className="mt-2 inline-flex min-h-6 items-center text-xs font-semibold text-primary">
            로드맵 보기 →
          </Link>
        </Card>

        <Card>
          <p className="text-xs text-muted">오늘 학습 시간</p>
          <p className="num mt-1 text-2xl font-bold">{formatDuration(counts.seconds)}</p>
          <p className="mt-2 text-xs text-muted">누적 경험치 {data.xp.toLocaleString()} XP</p>
          <Progress className="mt-2" value={percent(xp.current, xp.needed)} />
        </Card>
      </section>

      <Card className="border-primary/30 bg-gradient-to-br from-primary-soft to-surface">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> 오늘의 학습
            </CardTitle>
            <p className="mt-1 text-sm text-muted">
              {plan.completed
                ? "오늘 계획한 학습을 모두 마쳤습니다."
                : `총 ${plan.totalGoal}개 중 ${plan.totalDone}개 완료`}
            </p>
          </div>
          <div className="text-right">
            <p className="num text-2xl font-bold text-primary">{percent(plan.totalDone, plan.totalGoal)}%</p>
          </div>
        </div>

        <Progress className="mt-3" value={percent(plan.totalDone, plan.totalGoal)} />

        {plan.completed ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#e8f7ee] px-4 py-3 text-sm font-bold text-success">
            <CheckCircle2 className="h-5 w-5" /> 오늘의 학습 완료! 내일 또 만나요.
          </div>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {plan.entries.map((entry) => {
              const done = Math.min(entry.done, entry.goal);
              const finished = done >= entry.goal;
              return (
                <li key={entry.key}>
                  <Link
                    href={entry.href}
                    className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 transition-colors hover:border-primary"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      {finished ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <span className="h-4 w-4 rounded-full border-2 border-line" />
                      )}
                      {entry.label}
                    </span>
                    <span className={finished ? "num text-xs font-bold text-success" : "num text-xs font-bold text-muted"}>
                      {done} / {entry.goal}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <Link
          href={nextEntry?.href ?? "/review"}
          className="mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-bold text-white transition-colors hover:bg-[#2549b4]"
        >
          <PlayCircle className="h-5 w-5" />
          {plan.completed ? "복습 더 하기" : "오늘 공부 시작하기"}
        </Link>
      </Card>

      <section className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> 영역별 진행률
          </CardTitle>
          <ul className="mt-4 space-y-3">
            {areas.map((area) => (
              <li key={area.key}>
                <Progress
                  value={percent(area.studied, area.total)}
                  label={`${area.label} (${area.studied}/${area.total})`}
                />
              </li>
            ))}
          </ul>
          {weakest ? (
            <p className="mt-4 rounded-xl bg-accent-soft px-3 py-2 text-xs font-semibold text-accent">
              취약 영역: {weakest.label} · 정답률 {weakest.accuracy}%
            </p>
          ) : null}
        </Card>

        <Card>
          <CardTitle>일본 취업 준비 진행률</CardTitle>
          <ul className="mt-4 space-y-3">
            {readiness.map((item) => (
              <li key={item.key}>
                <Progress value={item.value} label={item.label} barClassName="bg-accent" />
              </li>
            ))}
          </ul>
          <Link href="/japanese-job" className="mt-4 inline-flex min-h-6 items-center text-xs font-semibold text-primary">
            취업 준비 상세 보기 →
          </Link>
        </Card>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardTitle>최근 학습 기록</CardTitle>
          {data.history.length === 0 ? (
            <EmptyState
              className="mt-4 border-0 bg-background py-8"
              title="아직 학습 기록이 없습니다"
              description="오늘의 학습에서 첫 항목을 완료해 보세요."
            />
          ) : (
            <ul className="mt-4 space-y-2">
              {data.history.slice(0, 6).map((record) => (
                <li
                  key={record.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-background px-3 py-2"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{record.title}</span>
                    <span className="text-xs text-muted">{TYPE_LABEL[record.type] ?? record.type}</span>
                  </span>
                  {record.correct === null ? (
                    <Badge>학습</Badge>
                  ) : record.correct ? (
                    <Badge tone="success">정답</Badge>
                  ) : (
                    <Badge tone="danger">오답</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-4 w-4 text-accent" /> 뱃지
          </CardTitle>
          <ul className="mt-4 grid grid-cols-2 gap-2">
            {ALL_BADGES.map((badge) => {
              const earned = data.badges.includes(badge.id);
              return (
                <li
                  key={badge.id}
                  className={
                    earned
                      ? "rounded-xl bg-accent-soft px-3 py-2 text-xs font-bold text-accent"
                      : "rounded-xl bg-background px-3 py-2 text-xs text-muted"
                  }
                >
                  {earned ? "🏆 " : "🔒 "}
                  {BADGE_LABELS[badge.id]}
                </li>
              );
            })}
          </ul>
        </Card>
      </section>
    </div>
  );
}
