import {
  BarChart3,
  BookOpen,
  Briefcase,
  ClipboardList,
  FileText,
  GraduationCap,
  Headphones,
  Home,
  Languages,
  Map,
  MessageSquare,
  RotateCcw,
  Settings,
  ShieldCheck,
  SpellCheck,
  UserRound,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: typeof Home;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "학습 관리",
    items: [
      { href: "/dashboard", label: "대시보드", icon: Home },
      { href: "/roadmap", label: "학습 로드맵", icon: Map },
      { href: "/level-test", label: "레벨 테스트", icon: ClipboardList },
    ],
  },
  {
    title: "JLPT 학습",
    items: [
      { href: "/vocabulary", label: "단어", icon: Languages },
      { href: "/grammar", label: "문법", icon: SpellCheck },
      { href: "/kanji", label: "한자", icon: BookOpen },
      { href: "/reading", label: "독해", icon: FileText },
      { href: "/listening", label: "청해", icon: Headphones },
    ],
  },
  {
    title: "문제 풀이",
    items: [
      { href: "/mock-test", label: "모의고사", icon: GraduationCap },
      { href: "/wrong-answers", label: "오답노트", icon: RotateCcw },
      { href: "/review", label: "복습", icon: RotateCcw },
    ],
  },
  {
    title: "일본 취업",
    items: [
      { href: "/business-japanese", label: "비즈니스 일본어", icon: Briefcase },
      { href: "/interview", label: "면접 일본어", icon: MessageSquare },
      { href: "/japanese-job", label: "취업 준비", icon: UserRound },
    ],
  },
  {
    title: "기타",
    items: [
      { href: "/statistics", label: "학습 통계", icon: BarChart3 },
      { href: "/settings", label: "설정", icon: Settings },
      { href: "/admin", label: "콘텐츠 관리", icon: ShieldCheck },
    ],
  },
];

export const BOTTOM_NAV: NavItem[] = [
  { href: "/dashboard", label: "홈", icon: Home },
  { href: "/vocabulary", label: "학습", icon: Languages },
  { href: "/review", label: "복습", icon: RotateCcw },
  { href: "/statistics", label: "통계", icon: BarChart3 },
  { href: "/settings", label: "마이", icon: UserRound },
];
