import Link from "next/link";
import { ArrowRight, BarChart3, Briefcase, CalendarCheck, Map, RotateCcw } from "lucide-react";
import { CONTENT_TOTALS, ROADMAP } from "@/lib/content";

const FEATURES = [
  {
    icon: CalendarCheck,
    title: "오늘 할 공부를 정해 줍니다",
    body: "접속하면 단어·문법·한자·독해·복습 분량이 이미 정해져 있습니다. 무엇을 공부할지 고민할 필요가 없습니다.",
  },
  {
    icon: RotateCcw,
    title: "잊어버릴 때쯤 다시 물어봅니다",
    body: "1일 → 3일 → 7일 → 14일 → 30일 간격 반복 학습. 틀린 항목은 복습 주기를 자동으로 짧게 조정합니다.",
  },
  {
    icon: Map,
    title: "기초부터 N1까지 한 줄기 로드맵",
    body: "기초 · N5 · N4 · N3 · N2 · N1 · 일본 취업. 각 단계의 필요 학습량과 현재 진행률을 한눈에 봅니다.",
  },
  {
    icon: Briefcase,
    title: "JLPT로 끝나지 않습니다",
    body: "경어·전화 응대·메일 작성·면접 답변까지. 일본 기업에서 실제로 쓰는 일본어를 따로 준비합니다.",
  },
  {
    icon: BarChart3,
    title: "취약 영역을 숫자로 보여줍니다",
    body: "영역별 정답률과 오답노트가 쌓입니다. 약한 곳부터 다시 풀 수 있습니다.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <span className="jp flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
            日
          </span>
          <span className="text-sm font-bold">니혼고 로드맵</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-xl px-3 py-2 text-sm font-semibold text-muted hover:text-foreground"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-[#2549b4]"
          >
            시작하기
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 pb-12 pt-8 sm:pt-16">
        <p className="mb-3 inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent">
          JLPT N1 + 일본 취업, 한 곳에서
        </p>
        <h1 className="max-w-2xl text-3xl font-bold leading-tight sm:text-5xl">
          매일 &ldquo;오늘 뭐 공부하지?&rdquo;를
          <br />
          고민하지 않는 일본어 학습
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted sm:text-lg">
          히라가나부터 N1 모의고사, 그리고 일본 기업 면접까지. 수준을 진단하고, 매일 할 분량을 정해 주고,
          틀린 것을 다시 물어보는 학습 관리 플랫폼입니다.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white hover:bg-[#2549b4]"
          >
            무료로 시작하기 <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center rounded-xl border border-line bg-surface px-6 text-sm font-bold hover:bg-background"
          >
            이미 계정이 있어요
          </Link>
        </div>

        <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "수록 단어", value: CONTENT_TOTALS.vocabulary },
            { label: "문법 항목", value: CONTENT_TOTALS.grammar },
            { label: "한자", value: CONTENT_TOTALS.kanji },
            { label: "비즈니스 표현", value: CONTENT_TOTALS.business },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-line bg-surface p-4">
              <dt className="text-xs text-muted">{stat.label}</dt>
              <dd className="mt-1 text-2xl font-bold">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-10">
        <h2 className="text-xl font-bold sm:text-2xl">단어장이 아니라 학습 관리 도구입니다</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="rounded-2xl border border-line bg-surface p-5">
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 text-sm font-bold">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{feature.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-10">
        <h2 className="text-xl font-bold sm:text-2xl">기초부터 일본 취업까지의 경로</h2>
        <p className="mt-1 text-sm text-muted">각 단계의 예상 기간과 필요 학습량이 미리 계산되어 있습니다.</p>
        <ol className="mt-5 space-y-2">
          {ROADMAP.map((stage, index) => (
            <li
              key={stage.level}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-line bg-surface p-4"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-xs font-bold text-primary">
                {index + 1}
              </span>
              <span className="text-sm font-bold">{stage.name}</span>
              <span className="text-xs text-muted">{stage.months}</span>
              <span className="ml-auto text-xs text-muted">
                단어 {stage.words.toLocaleString()}개 · 한자 {stage.kanji}자 · 문법 {stage.grammar}개
              </span>
            </li>
          ))}
          <li className="flex items-center gap-4 rounded-2xl border border-primary bg-primary-soft p-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
              7
            </span>
            <span className="text-sm font-bold text-primary">일본 취업 일본어 — 경어 · 메일 · 전화 · 면접</span>
          </li>
        </ol>
      </section>

      <footer className="mx-auto max-w-5xl px-5 py-12">
        <div className="rounded-2xl bg-foreground p-7 text-center text-white">
          <p className="text-lg font-bold">오늘부터 시작해도 늦지 않습니다</p>
          <p className="mt-1.5 text-sm text-white/70">
            레벨 테스트 15문항이면 어디서 시작할지 정해집니다.
          </p>
          <Link
            href="/signup"
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-foreground"
          >
            무료로 시작하기 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <p className="mt-6 text-center text-xs text-muted">
          학습 기록은 이 브라우저에 저장됩니다.
        </p>
      </footer>
    </div>
  );
}
