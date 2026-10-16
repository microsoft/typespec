import type { PerfReporter, Timer } from "./types.js";

/** Start a monotonic timer whose `end` method returns elapsed milliseconds without stopping the clock. */
export function startTimer(): Timer {
  const start = performance.now();
  return {
    end: () => {
      return performance.now() - start;
    },
  };
}

/** Run a synchronous callback and return its elapsed time in milliseconds; callback errors propagate. */
export function time(fn: () => void): number {
  const timer = startTimer();
  fn();
  return timer.end();
}

/** Await a callback and return its elapsed time in milliseconds; callback rejections propagate. */
export async function timeAsync(fn: () => Promise<void>): Promise<number> {
  const timer = startTimer();
  await fn();
  return timer.end();
}

/** Lightweight elapsed-time utilities that do not retain measurements between calls. */
export const perf = {
  /** Start a monotonic timer that reports elapsed milliseconds. */
  startTimer,
  /** Measure a synchronous callback's elapsed time in milliseconds. */
  time,
  /** Measure an asynchronous callback's elapsed time in milliseconds. */
  timeAsync,
};

/**
 * Create an independent collector of named durations in milliseconds.
 * Recording a label again replaces its previous duration; timed callbacks return their original result.
 */
export function createPerfReporter(): PerfReporter {
  const measures: Record<string, number> = {};
  function startReportingTimer(label: string): Timer {
    const timer = startTimer();
    return {
      end: () => {
        const time = timer.end();
        measures[label] = time;
        return time;
      },
    };
  }

  return {
    startTimer: startReportingTimer,
    time: <T>(label: string, fn: () => T): T => {
      const timer = startReportingTimer(label);
      const result = fn();
      timer.end();
      return result;
    },
    timeAsync: async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
      const timer = startReportingTimer(label);
      const result = await fn();
      timer.end();
      return result;
    },
    report: (label: string, duration: number) => {
      measures[label] = duration;
    },
    measures,
  };
}
