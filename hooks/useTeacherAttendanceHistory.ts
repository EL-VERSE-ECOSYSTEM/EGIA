"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeSubscription } from "./useRealtimeSubscription";
import type { TeacherAttendance } from "@/types/database.types";

export function useTeacherAttendanceHistory(teacherId?: string, limit: number = 30) {
  const [history, setHistory] = useState<TeacherAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchHistory = useCallback(async () => {
    if (!teacherId) {
      setHistory([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("teacher_attendance")
      .select("*")
      .eq("teacherid", teacherId)
      .order("work_date", { ascending: false })
      .limit(limit);

    if (!error && data) {
      setHistory(data as unknown as TeacherAttendance[]);
    }
    setLoading(false);
  }, [teacherId, limit, supabase]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useRealtimeSubscription(
    "teacher_attendance",
    () => {
      fetchHistory();
    },
    {
      filter: teacherId ? `teacherid=eq.${teacherId}` : undefined,
      enabled: Boolean(teacherId),
    }
  );

  return { history, loading, refetch: fetchHistory };
}
