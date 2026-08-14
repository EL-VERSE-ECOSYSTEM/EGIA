"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import type { RealtimeTable } from "@/types/database.types";

const tablesByRole: Record<string, RealtimeTable[]> = {
  student: ["assessment", "assessment_result", "notification", "attendance", "library_books", "book_borrowing", "message", "conversation", "conversation_participant"],
  teacher: ["assessment", "assessment_result", "attendance", "message", "notification", "conversation", "conversation_participant"],
  parent: ["assessment_result", "payment", "message", "notification", "attendance", "conversation", "conversation_participant"],
  admin: ["student", "teacher", "parent", "assessment", "assessment_result", "payment", "notification", "library_books", "message", "conversation", "conversation_participant"],
};

function TableSync({ table, refresh }: { table: RealtimeTable; refresh: () => void }) {
  useRealtimeSubscription(table, (event) => {
    refresh();
    if (event.eventType === "INSERT" && ["assessment_result", "payment", "message"].includes(table)) {
      toast("Dashboard updated", { description: `A new ${table.replaceAll("_", " ")} is available.` });
    }
  });
  return null;
}

/** Refreshes the server-rendered dashboard data after relevant Postgres events. */
export function DashboardRealtimeSync({ role }: { role: "admin" | "teacher" | "parent" | "student" }) {
  const router = useRouter();
  const timer = useRef<number | undefined>(undefined);
  const refresh = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => router.refresh(), 150);
  }, [router]);
  return <>{tablesByRole[role].map((table) => <TableSync key={table} table={table} refresh={refresh} />)}</>;
}
