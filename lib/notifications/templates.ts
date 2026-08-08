import type { PushNotification } from "@/lib/firebase/types";

export const notificationTemplates = {
  assessmentResult: (student: string, subject: string, grade: string, score: number): PushNotification => ({ title: "📝 Assessment Result Available", body: `${student} scored ${score}% (${grade}) in ${subject}`, type: "assessment_result", link: "/dashboard/student/results", data: { grade, score: String(score) } }),
  paymentConfirmed: (student: string, amount: number, reference: string): PushNotification => ({ title: "✅ Payment Confirmed", body: `Payment of ₦${amount.toLocaleString()} for ${student} is confirmed. Ref: ${reference}`, type: "payment", link: "/dashboard/parent/payments", data: { reference } }),
  attendanceAbsent: (student: string, date: string, subject: string): PushNotification => ({ title: "⚠️ Absence Alert", body: `${student} was marked absent on ${date} for ${subject}`, type: "attendance", link: "/dashboard/parent/attendance", data: { date, subject } }),
  announcement: (title: string, message: string): PushNotification => ({ title: `📢 ${title}`, body: message, type: "announcement", link: "/dashboard", data: {} }),
  newMessage: (sender: string, preview: string): PushNotification => ({ title: "💬 New Message", body: `From ${sender}: ${preview}`, type: "message", link: "/dashboard", data: {} }),
};
