"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeSubscription } from "./useRealtimeSubscription";
import type { TeacherAttendance } from "@/types/database.types";

export function useLiveAttendance(schoolId?: string, date?: string) {
  const [records, setRecords] = useState<TeacherAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const targetDate = date || new Date().toISOString().slice(0, 10);

  const fetchLive = useCallback(async () => {
    if (!schoolId) {
      setRecords([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("teacher_attendance")
      .select("*, teacher:teacherid (id, firstname, lastname, staffcode, profileimage, userid)")
      .eq("schoolid", schoolId)
      .eq("work_date", targetDate)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRecords(data as unknown as TeacherAttendance[]);
    }
    setLoading(false);
  }, [schoolId, targetDate, supabase]);

  useEffect(() => {
    fetchLive();
  }, [fetchLive]);

  useRealtimeSubscription(
    "teacher_attendance",
    () => {
      fetchLive();
    },
    {
      filter: schoolId ? `schoolid=eq.${schoolId}` : undefined,
      enabled: Boolean(schoolId),
    }
  );

  return { records, loading, refetch: fetchLive };
}
