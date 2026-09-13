import { NextResponse } from "next/server";
import { createSession, hashPassword } from "@/lib/auth";
import { getDb, isDatabaseConfigured } from "@/lib/db";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "서버 저장이 설정되지 않았습니다." }, { status: 503 });
  }

  const { email, name, password, state } = await request.json();
  const normalized = String(email ?? "").trim().toLowerCase();

  if (!normalized || !password) {
    return NextResponse.json({ error: "이메일과 비밀번호를 입력해 주세요." }, { status: 400 });
  }
  if (String(password).length < 4) {
    return NextResponse.json({ error: "비밀번호는 4자 이상 입력해 주세요." }, { status: 400 });
  }

  const db = getDb();
  const existing = await db.user.findUnique({ where: { email: normalized } });
  if (existing) {
    return NextResponse.json({ error: "이미 가입된 이메일입니다." }, { status: 409 });
  }

  const user = await db.user.create({
    data: {
      email: normalized,
      name: String(name ?? "").trim() || "학습자",
      passwordHash: await hashPassword(String(password)),
      state: state ? { create: { data: state } } : undefined,
    },
  });

  await createSession(user.id);

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt.toISOString() },
    state: state ?? null,
  });
}
