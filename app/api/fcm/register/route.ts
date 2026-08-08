import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userFcmToken } from "@/lib/db/schema";
const schema = z.object({ token: z.string().min(20).max(4096), deviceName: z.string().max(255).optional(), deviceType: z.literal("web").optional(), browser: z.string().max(1000).optional() });
export async function POST(request: NextRequest) {
  const session = await auth.getSession(); if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid token registration" }, { status: 400 });
  const existing = await db.select({ id: userFcmToken.id }).from(userFcmToken).where(and(eq(userFcmToken.userId, session.user.id), eq(userFcmToken.token, parsed.data.token))).limit(1);
  if (existing[0]) await db.update(userFcmToken).set({ isActive: true, deviceName: parsed.data.deviceName, browser: parsed.data.browser, updatedAt: new Date() }).where(eq(userFcmToken.id, existing[0].id));
  else await db.insert(userFcmToken).values({ id: randomUUID(), userId: session.user.id, token: parsed.data.token, deviceName: parsed.data.deviceName, deviceType: "web", browser: parsed.data.browser, isActive: true });
  return NextResponse.json({ success: true });
}
