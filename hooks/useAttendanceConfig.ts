"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeSubscription } from "./useRealtimeSubscription";
import type { SchoolAttendanceConfig } from "@/types/database.types";

export function useAttendanceConfig(schoolId?: string) {
  const [config, setConfig] = useState<SchoolAttendanceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchConfig = useCallback(async () => {
    if (!schoolId) {
      setConfig(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("school_attendance_config")
      .select("*")
      .eq("schoolid", schoolId)
      .maybeSingle();

    if (!error && data) {
      setConfig(data as unknown as SchoolAttendanceConfig);
    } else {
      setConfig(null);
    }
    setLoading(false);
  }, [schoolId, supabase]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useRealtimeSubscription(
    "school_attendance_config",
    () => {
      fetchConfig();
    },
    {
      filter: schoolId ? `schoolid=eq.${schoolId}` : undefined,
      enabled: Boolean(schoolId),
    }
  );

  return { config, loading, refetch: fetchConfig };
}
