"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <h1 className="text-xl font-bold">문제가 발생했습니다</h1>
      <p className="mt-1.5 max-w-md text-sm text-muted">
        화면을 표시하는 중 오류가 생겼습니다. 다시 시도해도 같은 문제가 계속되면 설정에서 학습 기록을
        초기화해 보세요.
      </p>
      <button
        onClick={reset}
        className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-bold text-white"
      >
        다시 시도
      </button>
    </div>
  );
}
