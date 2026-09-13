import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";

export async function POST() {
  if (isDatabaseConfigured()) {
    await destroySession();
  }
  return NextResponse.json({ ok: true });
}
