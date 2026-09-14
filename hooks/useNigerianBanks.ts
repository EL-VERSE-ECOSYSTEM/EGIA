"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface NigerianBank {
  id: string;
  name: string;
  code: string;
  slug?: string | null;
}

export function useNigerianBanks() {
  const [banks, setBanks] = useState<NigerianBank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchBanks() {
      const { data } = await supabase
        .from("nigerian_banks")
        .select("id, name, code, slug")
        .eq("is_active", true)
        .order("name");

      setBanks((data as NigerianBank[]) || []);
      setLoading(false);
    }

    fetchBanks();

    const channel = supabase
      .channel("banks-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nigerian_banks" },
        () => fetchBanks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { banks, loading };
}
