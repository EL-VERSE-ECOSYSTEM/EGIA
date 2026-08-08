import type { WebhookPayload } from "@/types/webhook.types";
import { sendPushNotification } from "@/lib/services/notifications";
import { logger } from "../logger";
import { parentUserIdsForStudent, stringValue, supabaseAdmin } from "./shared";

export async function handleAttendanceWebhook(payload: WebhookPayload, eventKey: string) {
  const id = stringValue(payload.record?.id);
  if (!id || payload.record?.status !== "ABSENT" || (payload.type === "UPDATE" && payload.old_record?.status === "ABSENT")) return;
  const supabase = supabaseAdmin();
  const { data: attendance, error } = await supabase.from("attendance_records").select("id, student_id, date, subject_id, students(first_name,last_name), subjects(name)").eq("id", id).single();
  if (error || !attendance) throw new Error(`Unable to load attendance ${id}: ${error?.message ?? "not found"}`);
  const recipients = await parentUserIdsForStudent(attendance.student_id);
  const student = Array.isArray(attendance.students) ? attendance.students[0] : attendance.students;
  const subject = Array.isArray(attendance.subjects) ? attendance.subjects[0] : attendance.subjects;
  const studentName = student ? `${student.first_name} ${student.last_name}` : "Your child";
  await Promise.all(recipients.map((userId) => sendPushNotification({ userId, eventKey: `${eventKey}:${userId}`, type: "attendance", title: "Absence Alert", body: `${studentName} was marked absent on ${attendance.date} for ${subject?.name ?? "class"}`, data: { attendanceId: attendance.id, studentId: attendance.student_id, date: attendance.date, status: "ABSENT" }, link: "/dashboard/parent/attendance" })));
  logger.info("Attendance notifications processed", { attendanceId: id, recipientCount: recipients.length });
}
