"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import type { RealtimeTable } from "@/types/database.types";

const tablesByRole: Record<string, RealtimeTable[]> = {
  student: [
    "assessment", "assessment_result", "notification", "attendance", "library_books",
    "message", "conversation", "conversation_participant", "assessment_schedule",
    "student_badges", "payment", "school", "nigerian_banks", "system_settings",
    "cbt_attempt", "student_gifts", "fee_structure", "report_card", "disciplinary_records"
  ],
  teacher: [
    "assessment", "assessment_result", "attendance", "message", "notification",
    "conversation", "conversation_participant", "library_books", "assessment_schedule",
    "school", "nigerian_banks", "system_settings", "teacher_attendance",
    "teacher_leave_requests", "teacher_leave_balance", "teacher_salary_deductions",
    "teacher_wallet", "teacher_request", "report_card", "disciplinary_records"
  ],
  parent: [
    "assessment_result", "payment", "message", "notification", "attendance",
    "conversation", "conversation_participant", "fee_structure", "library_books",
    "student", "school", "nigerian_banks", "system_settings", "report_card",
    "disciplinary_records", "student_gifts"
  ],
  admin: [
    "student", "teacher", "parent", "assessment", "assessment_result", "payment",
    "notification", "library_books", "message", "conversation", "conversation_participant",
    "invitations", "fee_structure", "school", "audit_log", "assessment_logs",
    "school_payment_config", "nigerian_banks", "system_settings", "teacher_attendance",
    "teacher_leave_requests", "teacher_leave_balance", "teacher_salary_deductions",
    "teacher_wallet", "teacher_request", "academic_session", "term", "disciplinary_records",
    "payment_receipt_uploads", "school_admin_roles", "dispute", "support_ticket"
  ],
  "super-admin": [
    "school_registration_application", "school", "user", "student", "teacher", "parent",
    "assessment", "assessment_result", "payment", "notification", "library_books",
    "message", "conversation", "conversation_participant", "invitations", "fee_structure",
    "support_ticket", "support_ticket_replies", "audit_log", "assessment_logs",
    "nigerian_banks", "system_settings", "transaction_ledger", "student_gifts",
    "disciplinary_records", "dispute", "teacher_wallet", "teacher_request"
  ],
  "super_admin": [
    "school_registration_application", "school", "user", "student", "teacher", "parent",
    "assessment", "assessment_result", "payment", "notification", "library_books",
    "message", "conversation", "conversation_participant", "invitations", "fee_structure",
    "support_ticket", "support_ticket_replies", "audit_log", "assessment_logs",
    "nigerian_banks", "system_settings", "transaction_ledger", "student_gifts",
    "disciplinary_records", "dispute", "teacher_wallet", "teacher_request"
  ],
};

function TableSync({ table, refresh }: { table: RealtimeTable; refresh: () => void }) {
  useRealtimeSubscription(table, () => {
    refresh();
  });
  return null;
}

/** Refreshes the server-rendered dashboard data after relevant Postgres events. */
export function DashboardRealtimeSync({ role }: { role?: "admin" | "teacher" | "parent" | "student" | "super-admin" | "super_admin" | string }) {
  const router = useRouter();
  const timer = useRef<number | undefined>(undefined);
  const refresh = useCallback(() => {
    if (typeof window !== "undefined") {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => router.refresh(), 150);
    }
  }, [router]);
  const safeRole = (role || "admin").toLowerCase();
  const tables = tablesByRole[safeRole] || tablesByRole.admin;
  return <>{tables.map((table) => <TableSync key={table} table={table} refresh={refresh} />)}</>;
}
