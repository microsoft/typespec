import type { PerfReporter, Timer } from "./types.js";

export function startTimer(): Timer {
  const start = performance.now();
  return {
    end: () => {
      return performance.now() - start;
    },
  };
}

export function time(fn: () => void): number {
  const timer = startTimer();
  fn();
  return timer.end();
}

export async function timeAsync(fn: () => Promise<void>): Promise<number> {
  const timer = startTimer();
  await fn();
  return timer.end();
}

/** Perf utils  */
export const perf = {
  startTimer,
  time,
  timeAsync,
};

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
