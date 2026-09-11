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
  | "dispute" | "support_ticket" | "fee_structure" | "cbt_attempt" | "book_borrowing"
  | "conversation" | "conversation_participant" | "invitations" | "assessment_schedule"
  | "student_badges" | "faq_articles";

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
