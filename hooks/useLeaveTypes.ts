"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeSubscription } from "./useRealtimeSubscription";
import type { LeaveType } from "@/types/database.types";

export function useLeaveTypes(schoolId?: string) {
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchTypes = useCallback(async () => {
    let query = supabase
      .from("leave_types")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (schoolId) {
      query = query.or(`schoolid.eq.${schoolId},schoolid.is.null`);
    } else {
      query = query.is("schoolid", null);
    }

    const { data, error } = await query;
    if (!error && data) {
      setTypes(data as unknown as LeaveType[]);
    }
    setLoading(false);
  }, [schoolId, supabase]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  useRealtimeSubscription(
    "leave_types",
    () => {
      fetchTypes();
    },
    {
      enabled: true,
    }
  );

  return { types, loading, refetch: fetchTypes };
}
