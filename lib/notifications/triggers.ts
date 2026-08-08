import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { notificationHistory, parent, student, userFcmToken } from "@/lib/db/schema";
import { sendMulticastFCM } from "@/lib/firebase/server";
import type { PushNotification } from "@/lib/firebase/types";

export async function notifyUser(userId: string, notification: PushNotification) {
  const tokens = await db.select({ token: userFcmToken.token }).from(userFcmToken).where(eq(userFcmToken.userId, userId));
  const active = tokens.map(({ token }) => token);
  const outcome = await sendMulticastFCM(active, notification);
  await db.insert(notificationHistory).values({ id: randomUUID(), userId, title: notification.title, body: notification.body, type: notification.type, data: notification.data, link: notification.link, delivered: outcome.success && outcome.failureCount === 0 });
  if (outcome.invalidTokens.length) await db.update(userFcmToken).set({ isActive: false, updatedAt: new Date() }).where(eq(userFcmToken.token, outcome.invalidTokens[0]));
  return outcome;
}

export async function notifyStudentAndParent(studentId: string, notification: PushNotification) {
  const record = await db.query.student.findFirst({ where: eq(student.id, studentId) });
  if (!record) return;
  const recipients = [record.userId];
  if (record.parentId) recipients.push((await db.query.parent.findFirst({ where: eq(parent.id, record.parentId) }))?.userId ?? null);
  await Promise.all(recipients.filter((id): id is string => Boolean(id)).map((id) => notifyUser(id, notification)));
}

export async function notifyParentProfile(parentId: string, notification: PushNotification) {
  const profile = await db.query.parent.findFirst({ where: eq(parent.id, parentId) });
  if (profile?.userId) return notifyUser(profile.userId, notification);
}
