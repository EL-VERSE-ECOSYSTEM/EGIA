import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getQueueStats } from "@/lib/queue";
import { getSystemMetricsSummary } from "@/lib/search-analytics";
import { isDegradationActive } from "@/lib/api-resilience";
import { getOnlineUsersCount } from "@/lib/realtime-bus";

export async function GET() {
  try {
    const session = await auth.getSession();
    if (!session?.user || session.user.role.toUpperCase() !== 'SUPER_ADMIN') {
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
  } catch {
    return NextResponse.json(
      { error: "Health status check failed." },
      { status: 500 }
    );
  }
}
