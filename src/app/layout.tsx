import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "니혼고 로드맵 — JLPT N1 & 일본 취업 학습 플랫폼",
  description:
    "히라가나부터 JLPT N1, 비즈니스 일본어와 일본 기업 면접까지. 매일 무엇을 공부할지 알려주는 일본어 학습 관리 플랫폼.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2f5bd8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
