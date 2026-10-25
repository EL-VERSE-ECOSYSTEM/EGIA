import { randomUUID } from "crypto";

// ===== CIRCUIT BREAKER PATTERN =====
type CircuitOptions = {
  failureThreshold?: number;
  recoveryTimeMs?: number;
  timeoutMs?: number;
};

type CircuitState = {
  failures: number;
  openedUntil: number;
};

const circuitStates = new Map<string, CircuitState>();

export class CircuitBreakerOpenError extends Error {
  constructor(name: string) {
    super(`${name} is temporarily unavailable. Please try again shortly.`);
    this.name = "CircuitBreakerOpenError";
  }
}

export async function withCircuitBreaker<T>(
  name: string,
  operation: () => Promise<T>,
  options: CircuitOptions = {},
) {
  const failureThreshold = options.failureThreshold ?? 3;
  const recoveryTimeMs = options.recoveryTimeMs ?? 30_000;
  const timeoutMs = options.timeoutMs ?? 5_000;
  const state = circuitStates.get(name) ?? { failures: 0, openedUntil: 0 };
  const now = Date.now();

  if (state.openedUntil > now) {
    throw new CircuitBreakerOpenError(name);
  }

  try {
    const result = await Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`${name} timed out.`)), timeoutMs);
      }),
    ]);
    circuitStates.set(name, { failures: 0, openedUntil: 0 });
    return result;
  } catch (error) {
    const failures = state.failures + 1;
    circuitStates.set(name, {
      failures,
      openedUntil: failures >= failureThreshold ? now + recoveryTimeMs : 0,
    });
    throw error;
  }
}

// ===== ASYNC MESSAGE QUEUE =====
type QueueOptions = {
  concurrency?: number;
  maxSize?: number;
};

export class AsyncMessageQueue {
  private pending: Array<() => Promise<void>> = [];
  private running = 0;
  private readonly concurrency: number;
  private readonly maxSize: number;

  constructor(
    readonly name: string,
    options: QueueOptions = {},
  ) {
    this.concurrency = options.concurrency ?? 1;
    this.maxSize = options.maxSize ?? 500;
  }

  enqueue<T>(task: () => Promise<T> | T) {
    if (this.pending.length >= this.maxSize) {
      return Promise.reject(new Error(`${this.name} queue is full.`));
    }

    return new Promise<T>((resolve, reject) => {
      this.pending.push(async () => {
        try {
          resolve(await task());
        } catch (error) {
          reject(error);
        }
      });
      this.drain();
    });
  }

  private drain() {
    while (this.running < this.concurrency && this.pending.length > 0) {
      const next = this.pending.shift();
      if (!next) return;
      this.running += 1;
      void next().finally(() => {
        this.running -= 1;
        this.drain();
      });
    }
  }
}

export function createMessageQueue(name: string, options?: QueueOptions) {
  return new AsyncMessageQueue(name, options);
}

// ===== CACHE STAMPEDE PROTECTION (IN-FLIGHT DEDUPLICATION) =====
const inFlightPromises = new Map<string, Promise<any>>();

export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  if (inFlightPromises.has(key)) {
    return inFlightPromises.get(key) as Promise<T>;
  }

  const promise = (async () => {
    try {
      return await fetcher();
    } finally {
      inFlightPromises.delete(key);
    }
  })();

  inFlightPromises.set(key, promise);
  return promise;
}

// ===== REQUEST TRACING & GLOBAL BUDGET =====
export function generateTraceId(): string {
  return `trace_${Date.now()}_${randomUUID().slice(0, 8)}`;
}

export class RequestBudget {
  private queryCount = 0;
  private readonly maxQueries: number;
  private readonly startTime: number;
  private readonly maxExecutionTimeMs: number;

  constructor(maxQueries = 30, maxExecutionTimeMs = 10_000) {
    this.maxQueries = maxQueries;
    this.maxExecutionTimeMs = maxExecutionTimeMs;
    this.startTime = Date.now();
  }

  trackQuery() {
    this.queryCount += 1;
    if (this.queryCount > this.maxQueries) {
      throw new Error(`Request budget exceeded: Maximum ${this.maxQueries} database queries per request limit reached.`);
    }
    const elapsed = Date.now() - this.startTime;
    if (elapsed > this.maxExecutionTimeMs) {
      throw new Error(`Request budget exceeded: Execution time limit of ${this.maxExecutionTimeMs}ms reached.`);
    }
  }
}

// ===== FEATURE FLAGS SYSTEM =====
const featureFlagsMap = new Map<string, boolean>([
  ["cbt_instant_grading", true],
  ["realtime_chat_presence", true],
  ["offline_sync_queue", true],
  ["korapay_auto_reconcile", true],
]);

export function isFeatureEnabled(flagKey: string, schoolId?: string): boolean {
  const globalSetting = featureFlagsMap.get(flagKey) ?? true;
  if (!globalSetting) return false;
  if (schoolId) {
    const schoolKey = `school:${schoolId}:${flagKey}`;
    if (featureFlagsMap.has(schoolKey)) {
      return featureFlagsMap.get(schoolKey)!;
    }
  }
  return globalSetting;
}

export function setFeatureFlag(flagKey: string, enabled: boolean, schoolId?: string) {
  const targetKey = schoolId ? `school:${schoolId}:${flagKey}` : flagKey;
  featureFlagsMap.set(targetKey, enabled);
}

// ===== CURSOR-BASED PAGINATION BUILDER =====
export interface CursorPaginationResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function buildCursorPagination<T extends { id: string }>(
  items: T[],
  limit: number,
): CursorPaginationResult<T> {
  const hasMore = items.length > limit;
  const slicedItems = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore && slicedItems.length > 0 ? slicedItems[slicedItems.length - 1].id : null;

  return {
    items: slicedItems,
    nextCursor,
    hasMore,
  };
}

// ===== OUTBOX EVENT QUEUE PATTERN =====
export interface OutboxEvent {
  id: string;
  eventType: string;
  payload: Record<string, any>;
  status: "PENDING" | "PROCESSED" | "FAILED";
  retryCount: number;
  createdAt: Date;
}

const memoryOutbox: OutboxEvent[] = [];

export function enqueueOutboxEvent(eventType: string, payload: Record<string, any>): OutboxEvent {
  const event: OutboxEvent = {
    id: `outbox_${Date.now()}_${randomUUID().slice(0, 8)}`,
    eventType,
    payload,
    status: "PENDING",
    retryCount: 0,
    createdAt: new Date(),
  };
  memoryOutbox.push(event);
  return event;
}

export function getPendingOutboxEvents(): OutboxEvent[] {
  return memoryOutbox.filter((e) => e.status === "PENDING");
}

export function markOutboxEventProcessed(eventId: string) {
  const evt = memoryOutbox.find((e) => e.id === eventId);
  if (evt) {
    evt.status = "PROCESSED";
  }
}

// ===== DELTA SYNC HELPER =====
export interface DeltaSyncPayload<T> {
  syncTimestamp: string;
  modifiedRecords: T[];
  deletedIds: string[];
}

export function buildDeltaSyncPayload<T extends { updatedAt?: Date | string | null }>(
  records: T[],
  sinceTimestamp?: string,
): DeltaSyncPayload<T> {
  const sinceMs = sinceTimestamp ? new Date(sinceTimestamp).getTime() : 0;
  const modifiedRecords = records.filter((r) => {
    if (!r.updatedAt) return true;
    const itemMs = new Date(r.updatedAt).getTime();
    return itemMs > sinceMs;
  });

  return {
    syncTimestamp: new Date().toISOString(),
    modifiedRecords,
    deletedIds: [],
  };
}
