export interface RealtimeMessage<T = any> {
  id: string;
  channel: string;
  event: string;
  payload: T;
  timestamp: string;
}

export type MessageHandler<T = any> = (msg: RealtimeMessage<T>) => void;

const channelSubscriptions = new Map<string, Set<MessageHandler>>();

/**
 * Authorizes a user to subscribe to a realtime channel, ensuring clients cannot
 * listen to other schools' channels (CBT monitoring, assessments, attendance, etc.)
 */
export function authorizeChannelSubscription(
  channel: string,
  user: { role?: string; schoolId?: string | null; id?: string }
): boolean {
  if (!user) return false;
  const role = (user.role || '').toUpperCase();
  if (role === 'SUPER_ADMIN') return true;

  if (channel.startsWith('school:')) {
    const channelSchoolId = channel.split(':')[1];
    return Boolean(user.schoolId && user.schoolId === channelSchoolId);
  }

  if (channel.startsWith('user:')) {
    const channelUserId = channel.split(':')[1];
    return Boolean(user.id && user.id === channelUserId);
  }

  if (channel === 'announcements' || channel === 'public') {
    return true;
  }

  return false;
}

export function subscribeRealtimeChannel<T = any>(
  channel: string,
  handler: MessageHandler<T>
): () => void {
  if (!channelSubscriptions.has(channel)) {
    channelSubscriptions.set(channel, new Set());
  }

  channelSubscriptions.get(channel)!.add(handler as MessageHandler);

  return () => {
    channelSubscriptions.get(channel)?.delete(handler as MessageHandler);
  };
}

export function publishRealtimeEvent<T = any>(
  channel: string,
  event: string,
  payload: T
): RealtimeMessage<T> {
  const message: RealtimeMessage<T> = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    channel,
    event,
    payload,
    timestamp: new Date().toISOString(),
  };

  const handlers = channelSubscriptions.get(channel);
  if (handlers) {
    for (const h of handlers) {
      try {
        h(message);
      } catch (err) {
        console.warn(`Error in realtime handler for channel ${channel}:`, err);
      }
    }
  }

  return message;
}

// ===== ONLINE PRESENCE & HEARTBEAT SYSTEM =====
export interface PresenceUser {
  userId: string;
  schoolId?: string | null;
  role?: string | null;
  lastHeartbeat: number;
}

const activePresenceStore = new Map<string, PresenceUser>();

export function recordPresenceHeartbeat(
  userId: string,
  schoolId?: string | null,
  role?: string | null
) {
  activePresenceStore.set(userId, {
    userId,
    schoolId,
    role,
    lastHeartbeat: Date.now(),
  });
}

export function getOnlineUsersCount(schoolId?: string): number {
  const now = Date.now();
  const timeoutMs = 45_000; // 45 second stale timeout
  let count = 0;

  for (const [userId, user] of activePresenceStore) {
    if (now - user.lastHeartbeat > timeoutMs) {
      activePresenceStore.delete(userId);
      continue;
    }
    if (!schoolId || user.schoolId === schoolId) {
      count += 1;
    }
  }

  return count;
}
