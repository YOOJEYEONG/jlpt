import { NextResponse } from "next/server";
import { createSession, verifyPassword } from "@/lib/auth";
import { getDb, isDatabaseConfigured } from "@/lib/db";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "서버 저장이 설정되지 않았습니다." }, { status: 503 });
  }

  const { email, password } = await request.json();
  const normalized = String(email ?? "").trim().toLowerCase();

  const db = getDb();
  const user = await db.user.findUnique({ where: { email: normalized }, include: { state: true } });
  if (!user) {
    return NextResponse.json({ error: "등록되지 않은 이메일입니다." }, { status: 404 });
  }
  if (!(await verifyPassword(String(password ?? ""), user.passwordHash))) {
    return NextResponse.json({ error: "비밀번호가 일치하지 않습니다." }, { status: 401 });
  }

  await createSession(user.id);

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt.toISOString() },
    state: user.state?.data ?? null,
  });
}
