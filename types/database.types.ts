/**
 * The public Supabase schema used by the application.
 *
 * This is intentionally a permissive hand-maintained contract: it keeps the
 * frontend type-safe while schema migrations remain the source of truth. Run
 * `supabase gen types typescript` during a schema release to replace it with a
 * generated definition.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "ADMIN" | "TEACHER" | "PARENT" | "STUDENT";
export type TermType = "FIRST" | "SECOND" | "THIRD";
export type AssessmentType = "CBT" | "ASSIGNMENT" | "TEST" | "EXAM";

export interface PublicRow {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: Json | undefined;
}

type PublicTable = {
  Row: PublicRow;
  Insert: Partial<PublicRow> & { id?: string };
  Update: Partial<PublicRow>;
  Relationships: [];
};

export type RealtimeTable =
  | "user" | "student" | "teacher" | "parent" | "assessment" | "assessment_result"
  | "payment" | "message" | "notification" | "library_books" | "attendance"
  | "dispute" | "support_ticket" | "support_ticket_replies" | "school_registration_application"
  | "student_gifts" | "fee_structure" | "cbt_attempt" | "book_borrowing"
  | "conversation" | "conversation_participant" | "invitations" | "assessment_schedule"
  | "student_badges" | "faq_articles" | "school" | "audit_log" | "transaction_ledger"
  | "assessment_logs" | "school_admin_roles" | "school_payment_config" | "payment_receipt_uploads"
  | "teacher_attendance" | "leave_types" | "teacher_leave_requests" | "teacher_leave_balance"
  | "teacher_salary_deductions" | "school_attendance_config" | "nigerian_banks" | "system_settings"
  | "teacher_wallet" | "teacher_request" | "academic_session" | "term" | "disciplinary_records" | "report_card";

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE' | 'SUSPENDED';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type DeductionType = 'ABSENCE' | 'LATE' | 'EARLY_EXIT' | 'UNPAID_LEAVE' | 'OTHER';
export type AdminLevel = 'PRIMARY_ADMIN' | 'VICE_PRINCIPAL_ACADEMICS' | 'VICE_PRINCIPAL_ADMIN' | 'HOD_SCIENCE' | 'HOD_ARTS' | 'HOD_COMMERCIAL';

export interface TeacherAttendance {
  id: string;
  schoolid: string;
  teacherid: string;
  work_date: string;
  clock_in_at?: string | null;
  clock_out_at?: string | null;
  clock_in_ip?: string | null;
  clock_out_ip?: string | null;
  clock_in_device?: string | null;
  clock_out_device?: string | null;
  clock_in_lat?: number | null;
  clock_in_lng?: number | null;
  clock_out_lat?: number | null;
  clock_out_lng?: number | null;
  total_minutes?: number | null;
  status: AttendanceStatus;
  late_minutes?: number;
  early_exit_minutes?: number;
  overtime_minutes?: number;
  is_manual_override?: boolean;
  override_by?: string | null;
  override_reason?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  teacher?: {
    id: string;
    firstname: string;
    lastname: string;
    staffcode?: string | null;
    profileimage?: string | null;
    user?: {
      name?: string | null;
      email?: string | null;
    };
  };
}

export interface LeaveType {
  id: string;
  schoolid?: string | null;
  name: string;
  code: string;
  default_days_per_year: number;
  is_paid: boolean;
  requires_attachment: boolean;
  is_active: boolean;
  created_at: string;
}

export interface TeacherLeaveRequest {
  id: string;
  schoolid: string;
  teacherid: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  attachment_url?: string | null;
  attachment_path?: string | null;
  status: LeaveStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  admin_comment?: string | null;
  rejection_reason?: string | null;
  is_paid?: boolean;
  created_at: string;
  updated_at: string;
  leave_type?: LeaveType;
  teacher?: {
    id: string;
    firstname: string;
    lastname: string;
    staffcode?: string | null;
    profileimage?: string | null;
  };
}

export interface TeacherLeaveBalance {
  id: string;
  schoolid: string;
  teacherid: string;
  leave_type_id: string;
  academic_year: string;
  allocated_days: number;
  used_days: number;
  pending_days: number;
  remaining_days: number;
  created_at: string;
  updated_at: string;
  leave_type?: LeaveType;
}

export interface TeacherSalaryDeduction {
  id: string;
  schoolid: string;
  teacherid: string;
  month: string;
  deduction_type: DeductionType;
  reference_attendance_id?: string | null;
  reference_leave_id?: string | null;
  amount: number;
  reason?: string | null;
  applied_by?: string | null;
  applied_at: string;
  reversed?: boolean;
  reversed_by?: string | null;
  reversed_at?: string | null;
  reversal_reason?: string | null;
  created_at: string;
  teacher?: {
    id: string;
    firstname: string;
    lastname: string;
    staffcode?: string | null;
  };
}

export interface SchoolAttendanceConfig {
  id: string;
  schoolid: string;
  work_start_time: string;
  work_end_time: string;
  late_threshold_minutes: number;
  early_exit_threshold_minutes: number;
  half_day_minutes: number;
  auto_absent_if_no_clockin?: boolean;
  require_selfie?: boolean;
  require_location?: boolean;
  auto_deduct_absence?: boolean;
  auto_deduct_late?: boolean;
  auto_deduct_early_exit?: boolean;
  unpaid_leave_deduction?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SchoolAdminRole {
  id: string;
  schoolid: string;
  userid: string;
  level: AdminLevel;
  department?: string | null;
  is_active?: boolean;
  created_at: string;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
}

type Tables = { [K in RealtimeTable]: PublicTable } & Record<string, PublicTable>;

export interface Database {
  public: {
    Tables: Tables;
    Views: Record<string, { Row: PublicRow; Relationships: [] }>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      term_type: TermType;
      assessment_type: AssessmentType;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type TableRow<T extends RealtimeTable> = Database["public"]["Tables"][T]["Row"];
export type TableInsert<T extends RealtimeTable> = Database["public"]["Tables"][T]["Insert"];
export type TableUpdate<T extends RealtimeTable> = Database["public"]["Tables"][T]["Update"];
