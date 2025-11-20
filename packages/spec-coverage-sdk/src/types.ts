export type ScenarioManifest = {
  packageName?: string;
  displayName?: string;
  /** Repository where scenarios live */
  repo?: string;
  /**
   * Template of where the source file lives
   * Interpolate {scenarioPath} with the scenario file path
   * @example "https://github.com/microsoft/typespec/tree/main/packages/http-specs/specs/{scenarioPath}"
   */
  sourceUrl?: string;
  commit: string;
  version: string;
  scenarios: ScenarioData[];
};

export type ScenarioData = {
  name: string;
  scenarioDoc: string;
  location: ScenarioLocation;
  tier: "core" | "extended" | "edge";
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

export interface ResolvedCoverageReport extends Record<number, CoverageReport> {
  generatorMetadata: GeneratorMetadata;
}

export interface ScenariosMetadata {
  version: string;
  commit: string;
  packageName: string;
}

export interface GeneratorMetadata {
  name: string;
  version: string;
  mode: string;
  commit?: string;
}
