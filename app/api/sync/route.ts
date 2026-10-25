import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildDeltaSyncPayload } from "@/lib/resilience";
import { recordPresenceHeartbeat, getOnlineUsersCount } from "@/lib/realtime-bus";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sinceParam = searchParams.get("since") || undefined;

    recordPresenceHeartbeat(session.user.id, session.user.schoolId, session.user.role);

    // Sample delta sync payload response contract for high-speed offline sync
    const sampleRecords = [
      {
        id: "sync_sample_1",
        type: "cbt_schedule",
        schoolId: session.user.schoolId,
        updatedAt: new Date().toISOString(),
      },
    ];

    const deltaPayload = buildDeltaSyncPayload(sampleRecords, sinceParam);
    const onlineCount = getOnlineUsersCount(session.user.schoolId || undefined);

    return NextResponse.json({
      success: true,
      delta: deltaPayload,
      onlineUsersCount: onlineCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Delta sync failed." },
      { status: 500 }
    );
  }
}
