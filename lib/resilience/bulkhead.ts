export class BulkheadRejectedError extends Error {
  constructor(public readonly bulkheadName: string) {
    super(`Bulkhead '${bulkheadName}' capacity reached. Request rejected.`);
    this.name = 'BulkheadRejectedError';
  }
}

export interface BulkheadConfig {
  maxConcurrent: number;
  maxQueue?: number;
}

export class Bulkhead {
  readonly name: string;
  readonly maxConcurrent: number;
  readonly maxQueue: number;

  private active = 0;
  private queue: Array<() => void> = [];

  constructor(name: string, config: BulkheadConfig) {
    this.name = name;
    this.maxConcurrent = config.maxConcurrent;
    this.maxQueue = config.maxQueue ?? 0;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active < this.maxConcurrent) {
      this.active++;
      try {
        return await fn();
      } finally {
        this.active--;
        this.processNext();
      }
    }

    if (this.queue.length >= this.maxQueue) {
      throw new BulkheadRejectedError(this.name);
    }

    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        this.active++;
        try {
          resolve(await fn());
        } catch (error) {
          reject(error);
        } finally {
          this.active--;
          this.processNext();
        }
      });
    });
  }

  private processNext() {
    if (this.active < this.maxConcurrent && this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    }
  }

  getStats() {
    return {
      name: this.name,
      active: this.active,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent,
      maxQueue: this.maxQueue,
    };
  }
}

// System-wide bulkhead compartments
export const bulkheads = {
  interactiveApi: new Bulkhead('interactive-api', { maxConcurrent: 100, maxQueue: 50 }),
  cbt: new Bulkhead('cbt', { maxConcurrent: 150, maxQueue: 50 }),
  ai: new Bulkhead('ai', { maxConcurrent: 10, maxQueue: 20 }),
  pdf: new Bulkhead('pdf', { maxConcurrent: 15, maxQueue: 30 }),
  exports: new Bulkhead('exports', { maxConcurrent: 5, maxQueue: 10 }),
  notifications: new Bulkhead('notifications', { maxConcurrent: 25, maxQueue: 100 }),
  imports: new Bulkhead('imports', { maxConcurrent: 5, maxQueue: 10 }),
};
