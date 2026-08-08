import type { WebhookPayload } from "@/types/webhook.types";
import { sendPushNotification } from "@/lib/services/notifications";
import { logger } from "../logger";
import { numberValue, stringValue, supabaseAdmin } from "./shared";

export async function handlePaymentWebhook(payload: WebhookPayload, eventKey: string) {
  const id = stringValue(payload.record?.id);
  if (!id || payload.record?.status !== "COMPLETED") return;
  if (payload.type === "UPDATE" && payload.old_record?.status === "COMPLETED") return;
  const supabase = supabaseAdmin();
  const { data: payment, error } = await supabase.from("payments").select("id, amount_paid, amount, reference, parent_id, student_id, students(first_name,last_name)").eq("id", id).single();
  if (error || !payment) throw new Error(`Unable to load payment ${id}: ${error?.message ?? "not found"}`);
  const { data: parent, error: parentError } = await supabase.from("parents").select("user_id").eq("id", payment.parent_id).single();
  if (parentError || !parent?.user_id) throw new Error(`Payment ${id} has no parent recipient`);
  const student = Array.isArray(payment.students) ? payment.students[0] : payment.students;
  const studentName = student ? `${student.first_name} ${student.last_name}` : "your child";
  const amount = numberValue(payment.amount_paid || payment.amount);
  await sendPushNotification({ userId: parent.user_id, eventKey, type: "payment_confirmation", title: "Payment Confirmed", body: `Payment of ₦${amount.toLocaleString()} for ${studentName} is confirmed. Ref: ${payment.reference}`, data: { paymentId: payment.id, studentId: payment.student_id, amount, reference: payment.reference }, link: "/dashboard/parent/payments/history" });
  logger.info("Payment notification processed", { paymentId: id });
}
