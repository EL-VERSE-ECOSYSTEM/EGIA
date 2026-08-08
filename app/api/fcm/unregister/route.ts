import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userFcmToken } from "@/lib/db/schema";
export async function POST(request: NextRequest) {
  const session = await auth.getSession(); if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = z.object({ token: z.string().min(20) }).safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  await db.update(userFcmToken).set({ isActive: false, updatedAt: new Date() }).where(and(eq(userFcmToken.userId, session.user.id), eq(userFcmToken.token, parsed.data.token)));
  return NextResponse.json({ success: true });
}
