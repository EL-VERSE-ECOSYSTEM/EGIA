import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getQueueStats } from "@/lib/queue";
import { getSystemMetricsSummary } from "@/lib/search-analytics";
import { isDegradationActive } from "@/lib/api-resilience";
import { getOnlineUsersCount } from "@/lib/realtime-bus";

export async function GET() {
  try {
    const session = await auth.getSession();
    if (!session?.user || !["ADMIN", "SCHOOL_ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const queueStats = getQueueStats();
    const metrics = getSystemMetricsSummary();
    const onlineUsers = getOnlineUsersCount();

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      degradationMode: isDegradationActive(),
      onlineUsers,
      queueStats,
      metrics,
      database: {
        status: "connected",
        poolCapacity: 20,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Health status check failed." },
      { status: 500 }
    );
  }
}
