import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <p className="jp text-5xl font-bold text-primary">404</p>
      <h1 className="mt-3 text-xl font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="mt-1.5 text-sm text-muted">주소가 바뀌었거나 삭제된 페이지입니다.</p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-bold text-white"
      >
        대시보드로 이동
      </Link>
    </div>
  );
}
