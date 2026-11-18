import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, inArray, isNotNull, isNull, lt } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notificationHistory } from "@/lib/db/schema";

export async function GET(request: NextRequest) {
  const session = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "100", 10), 1), 200);
  const expiry = new Date(Date.now() - 72 * 60 * 60 * 1000);
  // Read notifications expire 72 hours after they were opened. Unread alerts remain available.
  await db.delete(notificationHistory).where(and(
    eq(notificationHistory.userId, session.user.id),
    isNotNull(notificationHistory.readAt),
    lt(notificationHistory.readAt, expiry),
  ));

  const items = await db
    .select({
      id: notificationHistory.id,
      title: notificationHistory.title,
      body: notificationHistory.body,
      type: notificationHistory.type,
      sentAt: notificationHistory.sentAt,
      delivered: notificationHistory.delivered,
      readAt: notificationHistory.readAt,
      link: notificationHistory.link,
      data: notificationHistory.data,
    })
    .from(notificationHistory)
    .where(eq(notificationHistory.userId, session.user.id))
    .orderBy(desc(notificationHistory.sentAt))
    .limit(limit);

  return NextResponse.json(items);
}

export async function PATCH(request: NextRequest) {
  const session = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = z
    .object({ ids: z.array(z.string().uuid()).min(1).max(100) })
    .safeParse(await request.json().catch(() => null));

  if (!body.success) {
    return NextResponse.json({ error: "Invalid notification ids. Maximum 100 IDs allowed per request." }, { status: 400 });
  }

  await db
    .update(notificationHistory)
    .set({ readAt: new Date() })
    .where(and(eq(notificationHistory.userId, session.user.id), inArray(notificationHistory.id, body.data.ids), isNull(notificationHistory.readAt)));

  return NextResponse.json({ success: true });
}
