import { sql } from "drizzle-orm";

export function buildTsVectorSearchQuery(searchTerm: string) {
  const cleanTerm = searchTerm.trim().replace(/['"\\]/g, "");
  if (!cleanTerm) return null;

  const formattedKeywords = cleanTerm
    .split(/\s+/)
    .map((w) => `${w}:*`)
    .join(" & ");

  return sql`to_tsquery('english', ${formattedKeywords})`;
}

// ===== CUSTOM METRICS COLLECTION =====
export interface ApiMetricEntry {
  path: string;
  method: string;
  statusCode: number;
  durationMs: number;
  timestamp: Date;
}

const metricsLogStore: ApiMetricEntry[] = [];

export function recordApiMetric(
  path: string,
  method: string,
  statusCode: number,
  durationMs: number
) {
  metricsLogStore.push({
    path,
    method,
    statusCode,
    durationMs,
    timestamp: new Date(),
  });

  if (metricsLogStore.length > 2000) {
    metricsLogStore.shift();
  }
}

export function getSystemMetricsSummary() {
  const total = metricsLogStore.length;
  if (total === 0) {
    return {
      totalRequests: 0,
      averageDurationMs: 0,
      errorRate: 0,
    };
  }

  const sumDuration = metricsLogStore.reduce((acc, m) => acc + m.durationMs, 0);
  const errorCount = metricsLogStore.filter((m) => m.statusCode >= 400).length;

  return {
    totalRequests: total,
    averageDurationMs: Math.round(sumDuration / total),
    errorRate: Number(((errorCount / total) * 100).toFixed(2)),
  };
}

// ===== ANALYTICS EVENT LOGGING =====
export interface AnalyticsEvent {
  id: string;
  eventName: string;
  userId?: string | null;
  schoolId?: string | null;
  properties?: Record<string, any>;
  timestamp: Date;
}

const analyticsEventStore: AnalyticsEvent[] = [];

export function logAnalyticsEvent(
  eventName: string,
  userId?: string | null,
  schoolId?: string | null,
  properties?: Record<string, any>
) {
  analyticsEventStore.push({
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    eventName,
    userId: userId || null,
    schoolId: schoolId || null,
    properties: properties || {},
    timestamp: new Date(),
  });

  if (analyticsEventStore.length > 5000) {
    analyticsEventStore.shift();
  }
}
