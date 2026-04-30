export interface IntegrationTestsConfig {
  suites: Record<string, IntegrationTestSuite>;
}

export interface IntegrationTestSuite {
  repo: string;
  branch: string;
  pattern?: string;
  entrypoints?: Entrypoint[];
}

export interface Entrypoint {
  name: string;
  options?: string[];
}
