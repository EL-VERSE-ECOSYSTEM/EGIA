"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeSubscription } from "./useRealtimeSubscription";
import type { TeacherAttendance } from "@/types/database.types";

export function useTeacherAttendance(teacherId?: string, date?: string) {
  const [record, setRecord] = useState<TeacherAttendance | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const targetDate = date || new Date().toISOString().slice(0, 10);

  const fetchRecord = useCallback(async () => {
    if (!teacherId) {
      setRecord(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("teacher_attendance")
      .select("*, teacher:teacherid (id, firstname, lastname, staffcode, profileimage)")
      .eq("teacherid", teacherId)
      .eq("work_date", targetDate)
      .maybeSingle();

    if (!error && data) {
      setRecord(data as unknown as TeacherAttendance);
    } else {
      setRecord(null);
    }
    setLoading(false);
  }, [teacherId, targetDate, supabase]);

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  useRealtimeSubscription(
    "teacher_attendance",
    () => {
      fetchRecord();
    },
    {
      filter: teacherId ? `teacherid=eq.${teacherId}` : undefined,
      enabled: Boolean(teacherId),
    }
  );

  return { record, loading, refetch: fetchRecord };
}
