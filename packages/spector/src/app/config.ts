export interface ApiMockAppConfig {
  /**
   * Mock API server port.
   */
  port: number;

  /**
   * Path where are the scenarios.
   */
  scenarioPath: string | string[];

  /**
   * Coverage file Path.
   */
  coverageFile: string;

  /**
   * Host/interface the server should bind to. Defaults to loopback only.
   */
  host?: string;
}
