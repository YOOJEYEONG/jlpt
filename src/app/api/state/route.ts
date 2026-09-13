import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb, isDatabaseConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

/** 로그인한 사용자의 학습 기록 전체를 덮어씁니다(마지막 저장이 이깁니다). */
export async function PUT(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "서버 저장이 설정되지 않았습니다." }, { status: 503 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { state } = await request.json();
  if (!state || typeof state !== "object") {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const saved = await getDb().userState.upsert({
    where: { userId: user.id },
    create: { userId: user.id, data: state },
    update: { data: state },
  });

  return NextResponse.json({ ok: true, updatedAt: saved.updatedAt.toISOString() });
}
