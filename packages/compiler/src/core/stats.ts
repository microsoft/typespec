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
      [emitterName: string]: {
        total: number;
        steps: {
          [stepName: string]: number;
        };
      };
    };
  };
}
