"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/field";
import { useAppStore } from "@/lib/store";

export default function SignupPage() {
  const router = useRouter();
  const signUp = useAppStore((state) => state.signUp);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 4) {
      setError("비밀번호는 4자 이상 입력해 주세요.");
      return;
    }
    const result = signUp({ name, email, password });
    if (!result.ok) {
      setError(result.message ?? "회원가입에 실패했습니다.");
      return;
    }
    router.push("/onboarding");
  }

  return (
    <Card className="p-6">
      <h1 className="text-xl font-bold">회원가입</h1>
      <p className="mt-1 text-sm text-muted">
        가입 후 간단한 설정만 하면 오늘의 학습이 바로 준비됩니다.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="name">이름</Label>
          <Input
            id="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="홍길동"
          />
        </div>
        <div>
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="4자 이상"
          />
        </div>

        {error ? (
          <p role="alert" className="rounded-xl bg-[#fdeaea] px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" size="lg">
          가입하고 시작하기
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-semibold text-primary">
          로그인
        </Link>
      </p>
      <p className="mt-4 rounded-xl bg-background px-3 py-2 text-xs leading-relaxed text-muted">
        계정과 학습 기록은 서버가 아닌 이 브라우저(localStorage)에 저장됩니다. 브라우저 데이터를 지우면
        기록도 함께 사라집니다.
      </p>
    </Card>
  );
}
