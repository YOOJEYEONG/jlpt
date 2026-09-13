"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/field";
import { useAppStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const signIn = useAppStore((state) => state.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const result = signIn({ email, password });
    if (!result.ok) {
      setError(result.message ?? "로그인에 실패했습니다.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <Card className="p-6">
      <h1 className="text-xl font-bold">로그인</h1>
      <p className="mt-1 text-sm text-muted">학습 기록을 이어서 계속합니다.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호"
          />
        </div>

        {error ? (
          <p role="alert" className="rounded-xl bg-[#fdeaea] px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" size="lg">
          로그인
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="font-semibold text-primary">
          회원가입
        </Link>
      </p>
    </Card>
  );
}
