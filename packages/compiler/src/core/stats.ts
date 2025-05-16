export interface Stats {
  total: number;
  parser: number;
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
