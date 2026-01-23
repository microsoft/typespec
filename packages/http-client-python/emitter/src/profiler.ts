/**
 * Simple profiler utility to measure execution time of code blocks.
 * Usage:
 *   import { Profiler } from "./profiler.js";
 *
 *   // For sync functions
 *   const result = Profiler.measure('myFunction', () => myFunction(args));
 *
 *   // For async functions
 *   const result = await Profiler.measureAsync('myAsyncFunction', () => myAsyncFunction(args));
 *
 *   // Print summary at the end
 *   Profiler.printSummary();
 */

interface TimingEntry {
  totalMs: number;
  callCount: number;
  minMs: number;
  maxMs: number;
}

class ProfilerClass {
  private timings: Map<string, TimingEntry> = new Map();
  private enabled: boolean = true;

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  reset() {
    this.timings.clear();
  }

  private record(label: string, durationMs: number) {
    const existing = this.timings.get(label);
    if (existing) {
      existing.totalMs += durationMs;
      existing.callCount += 1;
      existing.minMs = Math.min(existing.minMs, durationMs);
      existing.maxMs = Math.max(existing.maxMs, durationMs);
    } else {
      this.timings.set(label, {
        totalMs: durationMs,
        callCount: 1,
        minMs: durationMs,
        maxMs: durationMs,
      });
    }
  }

  /**
   * Measure execution time of a synchronous function
   */
  measure<T>(label: string, fn: () => T): T {
    if (!this.enabled) {
      return fn();
    }
    const start = performance.now();
    try {
      return fn();
    } finally {
      const duration = performance.now() - start;
      this.record(label, duration);
      console.log(`[Profiler] ${label}: ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Measure execution time of an asynchronous function
   */
  async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    if (!this.enabled) {
      return fn();
    }
    const start = performance.now();
    try {
      return await fn();
    } finally {
      const duration = performance.now() - start;
      this.record(label, duration);
      console.log(`[Profiler] ${label}: ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Start a manual timer (useful for measuring code blocks without wrapping)
   */
  start(label: string): () => void {
    if (!this.enabled) {
      return () => {};
    }
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.record(label, duration);
      console.log(`[Profiler] ${label}: ${duration.toFixed(2)}ms`);
    };
  }

  /**
   * Print a summary of all recorded timings, sorted by total time
   */
  printSummary() {
    if (this.timings.size === 0) {
      console.log("[Profiler] No timings recorded.");
      return;
    }

    console.log("\n" + "=".repeat(80));
    console.log("PROFILER SUMMARY");
    console.log("=".repeat(80));

    // Sort by total time descending
    const sorted = [...this.timings.entries()].sort((a, b) => b[1].totalMs - a[1].totalMs);

    const totalTime = sorted.reduce((sum, [, entry]) => sum + entry.totalMs, 0);

    console.log(
      `${"Label".padEnd(40)} ${"Total(ms)".padStart(12)} ${"Calls".padStart(8)} ${"Avg(ms)".padStart(12)} ${"Min(ms)".padStart(10)} ${"Max(ms)".padStart(10)} ${"%".padStart(8)}`,
    );
    console.log("-".repeat(80));

    for (const [label, entry] of sorted) {
      const avg = entry.totalMs / entry.callCount;
      const percent = ((entry.totalMs / totalTime) * 100).toFixed(1);
      console.log(
        `${label.padEnd(40)} ${entry.totalMs.toFixed(2).padStart(12)} ${String(entry.callCount).padStart(8)} ${avg.toFixed(2).padStart(12)} ${entry.minMs.toFixed(2).padStart(10)} ${entry.maxMs.toFixed(2).padStart(10)} ${(percent + "%").padStart(8)}`,
      );
    }

    console.log("-".repeat(80));
    console.log(`${"TOTAL".padEnd(40)} ${totalTime.toFixed(2).padStart(12)}`);
    console.log("=".repeat(80) + "\n");
  }

  /**
   * Get timings as JSON for programmatic access
   */
  getTimings(): Record<string, TimingEntry & { avgMs: number }> {
    const result: Record<string, TimingEntry & { avgMs: number }> = {};
    for (const [label, entry] of this.timings) {
      result[label] = {
        ...entry,
        avgMs: entry.totalMs / entry.callCount,
      };
    }
    return result;
  }
}

export const Profiler = new ProfilerClass();
