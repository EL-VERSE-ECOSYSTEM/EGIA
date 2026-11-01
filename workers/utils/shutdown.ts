export class GracefulShutdownHandler {
  private isTerminating = false;
  private readonly callbacks: Array<() => Promise<void>> = [];

  constructor() {
    if (typeof process !== 'undefined') {
      const handleSignal = async (signal: string) => {
        if (this.isTerminating) return;
        this.isTerminating = true;
        console.log(`[Worker] Received ${signal}, initiating graceful shutdown...`);

        for (const cb of this.callbacks) {
          try {
            await cb();
          } catch (e) {
            console.error('[Worker] Error during shutdown callback:', e);
          }
        }
      };

      process.on('SIGINT', () => handleSignal('SIGINT'));
      process.on('SIGTERM', () => handleSignal('SIGTERM'));
    }
  }

  onShutdown(callback: () => Promise<void>) {
    this.callbacks.push(callback);
  }

  isStopping(): boolean {
    return this.isTerminating;
  }
}

export const shutdownManager = new GracefulShutdownHandler();
