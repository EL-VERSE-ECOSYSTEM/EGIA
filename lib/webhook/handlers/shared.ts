import { createClient } from "@supabase/supabase-js";

export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase service credentials are not configured");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export function stringValue(value: unknown): string | null { return typeof value === "string" && value.length ? value : null; }
export function numberValue(value: unknown): number { const number = Number(value); return Number.isFinite(number) ? number : 0; }

export async function parentUserIdsForStudent(studentId: string) {
  const supabase = supabaseAdmin();
  const { data: links, error } = await supabase.from("parent_students").select("parent_id").eq("student_id", studentId);
  if (error) throw new Error(`Unable to load student guardians: ${error.message}`);
  const parentIds = [...new Set((links ?? []).map((link) => link.parent_id).filter(Boolean))];
  if (!parentIds.length) return [] as string[];
  const { data: parents, error: parentsError } = await supabase.from("parents").select("user_id").in("id", parentIds);
  if (parentsError) throw new Error(`Unable to load guardian accounts: ${parentsError.message}`);
  return [...new Set((parents ?? []).map((parent) => parent.user_id).filter(Boolean))] as string[];
}
