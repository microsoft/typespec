export interface ApiMockAppConfig {
  /**
   * Mock API server port.
   */
  port: number;

  /**
   * Path where are the scenarios.
   */
  scenarioPath: string;

  /**
   * Coverage file Path.
   */
  coverageFile: string;
}
