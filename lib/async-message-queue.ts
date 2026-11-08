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