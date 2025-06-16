export interface Stats {
  complexity: ComplexityStats;
  runtime: RuntimeStats;
}

export interface ComplexityStats {
  createdTypes: number;
  finishedTypes: number;
}

export interface RuntimeStats {
  total: number;
  loader: number;
  resolver: number;
  checker: number;
  validation: {
    total: number;
    validators: {
      [validator: string]: number;
    };
  };
  linter: {
    total: number;
    rules: {
      [rule: string]: number;
    };
  };
  emit: {
    total: number;
    emitters: {
      [rule: string]: number;
    };
  };
}

export interface Timer {
  end: () => number;
}

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
