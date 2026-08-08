import type { WebhookPayload } from "@/types/webhook.types";
import { sendPushNotification } from "@/lib/services/notifications";
import { logger } from "../logger";
import { numberValue, parentUserIdsForStudent, stringValue, supabaseAdmin } from "./shared";

export async function handleResultWebhook(payload: WebhookPayload, eventKey: string) {
  const id = stringValue(payload.record?.id);
  if (!id || payload.record?.is_graded !== true || (payload.type === "UPDATE" && payload.old_record?.is_graded === true)) return;
  const supabase = supabaseAdmin();
  const { data: result, error } = await supabase.from("results").select("id, student_id, score, percentage, grade, assessments(title, subjects(name)), students(first_name,last_name)").eq("id", id).single();
  if (error || !result) throw new Error(`Unable to load result ${id}: ${error?.message ?? "not found"}`);
  const recipients = await parentUserIdsForStudent(result.student_id);
  const student = Array.isArray(result.students) ? result.students[0] : result.students;
  const assessment = Array.isArray(result.assessments) ? result.assessments[0] : result.assessments;
  const subject = assessment && (Array.isArray(assessment.subjects) ? assessment.subjects[0] : assessment.subjects);
  const studentName = student ? `${student.first_name} ${student.last_name}` : "Your child";
  const score = numberValue(result.percentage ?? result.score);
  await Promise.all(recipients.map((userId) => sendPushNotification({ userId, eventKey: `${eventKey}:${userId}`, type: "result", title: "Result Available", body: `${studentName} scored ${score}% (${result.grade ?? "N/A"}) in ${subject?.name ?? "an assessment"}`, data: { resultId: result.id, studentId: result.student_id, score, grade: result.grade, subject: subject?.name, assessmentTitle: assessment?.title }, link: "/dashboard/parent/results/current" })));
  logger.info("Result notifications processed", { resultId: id, recipientCount: recipients.length });
}
