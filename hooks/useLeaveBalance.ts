"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeSubscription } from "./useRealtimeSubscription";
import type { TeacherLeaveBalance } from "@/types/database.types";

export function useLeaveBalance(teacherId?: string, academicYear?: string) {
  const [balances, setBalances] = useState<TeacherLeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const currentYear = academicYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`;

  const fetchBalances = useCallback(async () => {
    if (!teacherId) {
      setBalances([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("teacher_leave_balance")
      .select("*, leave_type:leave_type_id (*)")
      .eq("teacherid", teacherId)
      .eq("academic_year", currentYear);

    if (!error && data) {
      setBalances(data as unknown as TeacherLeaveBalance[]);
    }
    setLoading(false);
  }, [teacherId, currentYear, supabase]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  useRealtimeSubscription(
    "teacher_leave_balance",
    () => {
      fetchBalances();
    },
    {
      filter: teacherId ? `teacherid=eq.${teacherId}` : undefined,
      enabled: Boolean(teacherId),
    }
  );

  return { balances, loading, refetch: fetchBalances };
}
