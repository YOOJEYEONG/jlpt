"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Flame, Target, Timer, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/layout/page-header";
import { areaProgress } from "@/lib/plan";
import { levelFromXp, useCurrentUser } from "@/lib/store";
import { addDays, formatDuration, percent, toDateKey } from "@/lib/utils";

const CHART_COLORS = ["#2f5bd8", "#f0913a", "#16a34a", "#7c5cd6", "#0ea5a5", "#dc2626"];

export default function StatisticsPage() {
  const user = useCurrentUser();

  const weekly = useMemo(() => {
    if (!user) return [];
    const today = toDateKey();
    return Array.from({ length: 7 }, (_, index) => {
      const key = addDays(today, index - 6);
      const counts = user.data.daily[key];
      const total = counts
        ? counts.vocabulary + counts.grammar + counts.kanji + counts.reading + counts.listening + counts.business + counts.interview
        : 0;
      return { date: key.slice(5), 학습량: total };
    });
  }, [user]);

  const monthly = useMemo(() => {
    if (!user) return [];
    const today = toDateKey();
    return Array.from({ length: 30 }, (_, index) => {
      const key = addDays(today, index - 29);
      const counts = user.data.daily[key];
      const total = counts
        ? counts.vocabulary + counts.grammar + counts.kanji + counts.reading + counts.listening + counts.business + counts.interview
        : 0;
      return { date: key.slice(5), 학습량: total };
    });
  }, [user]);

  if (!user) return null;

  const { data } = user;
  const areas = areaProgress(data);
  const totalSeconds = Object.values(data.daily).reduce((sum, day) => sum + day.seconds, 0);
  const totals = Object.values(data.daily).reduce(
    (sum, day) => ({
      vocabulary: sum.vocabulary + day.vocabulary,
      questions: sum.questions + day.reading + day.listening,
    }),
    { vocabulary: 0, questions: 0 },
  );

  const answered = Object.values(data.progress).reduce(
    (sum, item) => ({ correct: sum.correct + item.correctCount, wrong: sum.wrong + item.wrongCount }),
    { correct: 0, wrong: 0 },
  );
  const accuracy =
    answered.correct + answered.wrong > 0
      ? Math.round((answered.correct / (answered.correct + answered.wrong)) * 100)
      : 0;
  const xp = levelFromXp(data.xp);
  const hasData = Object.keys(data.daily).length > 0;

  return (
    <div className="animate-fade-up">
      <PageHeader title="학습 통계" description="학습량 · 정답률 · 연속 학습일을 한눈에 확인합니다." />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Timer, label: "총 학습 시간", value: formatDuration(totalSeconds) },
          { icon: Flame, label: "연속 학습일", value: `${data.streak}일` },
          { icon: Target, label: "전체 정답률", value: `${accuracy}%` },
          { icon: TrendingUp, label: "레벨 / 경험치", value: `Lv.${xp.level} · ${data.xp.toLocaleString()} XP` },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <Icon className="h-4 w-4 text-primary" />
              <p className="mt-2 text-xs text-muted">{stat.label}</p>
              <p className="mt-0.5 text-lg font-bold">{stat.value}</p>
            </Card>
          );
        })}
      </section>

      <section className="mt-3 grid gap-3 lg:grid-cols-2">
        <Card>
          <CardTitle>주간 학습량</CardTitle>
          {hasData ? (
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e6e8ec", fontSize: 12 }} />
                  <Bar dataKey="학습량" radius={[6, 6, 0, 0]} fill="#2f5bd8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState className="mt-4 border-0 bg-background py-10" title="아직 학습 기록이 없습니다" />
          )}
        </Card>

        <Card>
          <CardTitle>최근 30일 추이</CardTitle>
          {hasData ? (
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                    interval={6}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e6e8ec", fontSize: 12 }} />
                  <Line type="monotone" dataKey="학습량" stroke="#f0913a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState className="mt-4 border-0 bg-background py-10" title="데이터가 쌓이면 그래프가 표시됩니다" />
          )}
        </Card>
      </section>

      <section className="mt-3 grid gap-3 lg:grid-cols-2">
        <Card>
          <CardTitle>영역별 정답률</CardTitle>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areas.map((area) => ({ name: area.label, 정답률: area.accuracy ?? 0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e6e8ec", fontSize: 12 }} />
                <Bar dataKey="정답률" radius={[6, 6, 0, 0]}>
                  {areas.map((area, index) => (
                    <Cell key={area.key} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle>누적 학습량</CardTitle>
          <ul className="mt-4 space-y-3">
            {areas.map((area) => (
              <li key={area.key}>
                <Progress value={percent(area.studied, area.total)} label={`${area.label} (${area.studied}/${area.total})`} />
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-background p-3">
              <p className="text-xs text-muted">단어 학습 횟수</p>
              <p className="mt-0.5 font-bold">{totals.vocabulary}회</p>
            </div>
            <div className="rounded-xl bg-background p-3">
              <p className="text-xs text-muted">푼 독해 · 청해</p>
              <p className="mt-0.5 font-bold">{totals.questions}회</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="success">정답 {answered.correct}</Badge>
            <Badge tone="danger">오답 {answered.wrong}</Badge>
            <Badge tone="primary">모의고사 {data.mockResults.length}회</Badge>
          </div>
        </Card>
      </section>
    </div>
  );
}
