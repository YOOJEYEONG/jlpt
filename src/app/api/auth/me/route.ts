import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb, isDatabaseConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ serverStorage: false, user: null, state: null });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ serverStorage: true, user: null, state: null });
  }

  const state = await getDb().userState.findUnique({ where: { userId: user.id } });
  return NextResponse.json({
    serverStorage: true,
    user,
    state: state?.data ?? null,
    updatedAt: state?.updatedAt.toISOString() ?? null,
  });
}
