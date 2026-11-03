export interface JobRecord {
  id: string;
  queue: string;
  type: string;
  payload: any;
  status: string;
  priority: number;
  attempts: number;
  maxAttempts: number;
  availableAt: Date;
  lockedAt?: Date | null;
  lockedBy?: string | null;
  lastError?: string | null;
  idempotencyKey?: string | null;
  createdAt: Date;
  startedAt?: Date | null;
  completedAt?: Date | null;
  failedAt?: Date | null;
}

export type JobHandler<T = any> = (payload: T, job: JobRecord) => Promise<any>;

class HandlerRegistry {
  private handlers = new Map<string, JobHandler>();

  register<T = any>(type: string, handler: JobHandler<T>) {
    this.handlers.set(type, handler);
  }

  get(type: string): JobHandler | undefined {
    return this.handlers.get(type);
  }

  has(type: string): boolean {
    return this.handlers.has(type);
  }

  listTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}

export const registry = new HandlerRegistry();
