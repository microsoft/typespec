export type ScenarioManifest = {
  commit: string;
  version: string;
  scenarios: ScenarioData[];
  modes: string[];
};

export type ScenarioData = {
  name: string;
  scenarioDoc: string;
  location: ScenarioLocation;
};

export type ScenarioLocation = {
  path: string;
  start: LineAndCharacter;
  end: LineAndCharacter;
};

export type LineAndCharacter = {
  line: number;
  character: number;
};

export type ScenarioStatus =
  // Scenario was tested and passed
  | "pass"
  // Scenario was tested and failed
  | "fail"
  // Scenario was not tested
  | "not-implemented"
  // Scenario is explicitly not supported by the generator
  | "not-supported"
  // Scenario is not applicable in current test.
  | "not-applicable";

export interface CoverageReport {
  /**
   * Metadata for the scenario set for this report.
   */
  scenariosMetadata: ScenariosMetadata;

  /**
   * Coverage result.
   */
  results: Record<string, ScenarioStatus>;

  /**
   * UTC datetime the report was created.
   */
  createdAt: string;
}

export interface ResolvedCoverageReport extends CoverageReport {
  generatorMetadata: GeneratorMetadata;
}

export interface ScenariosMetadata {
  version: string;
  commit: string;
}

export interface GeneratorMetadata {
  name: string;
  version: string;
  mode: string;
  commit?: string;
}
