export class MetricsCollector {
  private counters = new Map<string, number>();
  private timings = new Map<string, number[]>();

  increment(metric: string, count = 1) {
    const current = this.counters.get(metric) || 0;
    this.counters.set(metric, current + count);
  }

  recordTiming(metric: string, durationMs: number) {
    const list = this.timings.get(metric) || [];
    list.push(durationMs);
    if (list.length > 500) list.shift(); // retain sliding window
    this.timings.set(metric, list);
  }

  getSnapshot() {
    const stats: Record<string, any> = {};
    for (const [key, val] of this.counters.entries()) {
      stats[key] = val;
    }
    for (const [key, durations] of this.timings.entries()) {
      if (durations.length === 0) continue;
      const sorted = [...durations].sort((a, b) => a - b);
      stats[`${key}_p50`] = sorted[Math.floor(sorted.length * 0.5)];
      stats[`${key}_p95`] = sorted[Math.floor(sorted.length * 0.95)];
      stats[`${key}_p99`] = sorted[Math.floor(sorted.length * 0.99)];
    }
    return stats;
  }

  reset() {
    this.counters.clear();
    this.timings.clear();
  }
}

export const metrics = new MetricsCollector();
