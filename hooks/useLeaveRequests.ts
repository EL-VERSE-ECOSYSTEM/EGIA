"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeSubscription } from "./useRealtimeSubscription";
import type { TeacherLeaveRequest } from "@/types/database.types";

export function useLeaveRequests(schoolId?: string, teacherId?: string, statusFilter?: string) {
  const [requests, setRequests] = useState<TeacherLeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchRequests = useCallback(async () => {
    let query = supabase
      .from("teacher_leave_requests")
      .select("*, leave_type:leave_type_id (*), teacher:teacherid (id, firstname, lastname, staffcode, profileimage)")
      .order("created_at", { ascending: false });

    if (schoolId) query = query.eq("schoolid", schoolId);
    if (teacherId) query = query.eq("teacherid", teacherId);
    if (statusFilter && statusFilter !== "ALL") query = query.eq("status", statusFilter);

    const { data, error } = await query;
    if (!error && data) {
      setRequests(data as unknown as TeacherLeaveRequest[]);
    }
    setLoading(false);
  }, [schoolId, teacherId, statusFilter, supabase]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useRealtimeSubscription(
    "teacher_leave_requests",
    () => {
      fetchRequests();
    },
    {
      filter: schoolId ? `schoolid=eq.${schoolId}` : undefined,
      enabled: Boolean(schoolId || teacherId),
    }
  );

  return { requests, loading, refetch: fetchRequests };
}
