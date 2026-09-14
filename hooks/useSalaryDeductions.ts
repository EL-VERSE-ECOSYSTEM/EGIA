"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeSubscription } from "./useRealtimeSubscription";
import type { TeacherSalaryDeduction } from "@/types/database.types";

export function useSalaryDeductions(schoolId?: string, month?: string, teacherId?: string) {
  const [deductions, setDeductions] = useState<TeacherSalaryDeduction[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const targetMonth = month || new Date().toISOString().slice(0, 7);

  const fetchDeductions = useCallback(async () => {
    if (!schoolId) {
      setDeductions([]);
      setLoading(false);
      return;
    }

    let query = supabase
      .from("teacher_salary_deductions")
      .select("*, teacher:teacherid (id, firstname, lastname, staffcode)")
      .eq("schoolid", schoolId)
      .eq("month", targetMonth)
      .order("created_at", { ascending: false });

    if (teacherId) {
      query = query.eq("teacherid", teacherId);
    }

    const { data, error } = await query;
    if (!error && data) {
      setDeductions(data as unknown as TeacherSalaryDeduction[]);
    }
    setLoading(false);
  }, [schoolId, targetMonth, teacherId, supabase]);

  useEffect(() => {
    fetchDeductions();
  }, [fetchDeductions]);

  useRealtimeSubscription(
    "teacher_salary_deductions",
    () => {
      fetchDeductions();
    },
    {
      filter: schoolId ? `schoolid=eq.${schoolId}` : undefined,
      enabled: Boolean(schoolId),
    }
  );

  return { deductions, loading, refetch: fetchDeductions };
}
