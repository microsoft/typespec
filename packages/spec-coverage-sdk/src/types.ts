/**
 * Versioned catalog of scenarios and their source locations, published independently
 * of the generator reports that record results for those scenarios.
 */
export type ScenarioManifest = {
  /** Name of the package providing the scenarios, when package metadata is available. */
  packageName?: string;
  /** Optional human-readable label for the scenario package. */
  displayName?: string;
  /** Repository where scenarios live */
  repo?: string;
  /**
   * Template of where the source file lives
   * Interpolate {scenarioPath} with the scenario file path
   * @example "https://github.com/microsoft/typespec/tree/main/packages/http-specs/specs/{scenarioPath}"
   */
  sourceUrl?: string;
  /** Source repository revision from which this catalog was produced. */
  commit: string;
  /** Scenario package version, also used as the versioned manifest's storage key. */
  version: string;
  /** Scenario definitions in this catalog; coverage results refer to their names. */
  scenarios: ScenarioData[];
};

/** A scenario's identity, explanatory documentation, and declaration location. */
export type ScenarioData = {
  /** Scenario identifier used as a key in {@link CoverageReport.results}. */
  name: string;
  /** Documentation describing the behavior exercised by this scenario. */
  scenarioDoc: string;
  /** Source range of the scenario declaration, not of an individual test execution. */
  location: ScenarioLocation;
};

/** Source range of a scenario declaration within its scenario set. */
export type ScenarioLocation = {
  /** Source file path relative to the scenario root, with forward-slash separators. */
  path: string;
  /** Inclusive start of the declaration. */
  start: LineAndCharacter;
  /** Exclusive end of the declaration. */
  end: LineAndCharacter;
};

/** Zero-based source coordinates, measured in UTF-16 code units within each line. */
export type LineAndCharacter = {
  /** Zero-based line index in the source file. */
  line: number;
  /** Zero-based UTF-16 offset from the start of the line. */
  character: number;
};

/**
 * Outcome recorded for a scenario. `"pass"` and `"fail"` describe tested behavior;
 * `"not-implemented"` means it was not tested, `"not-supported"` explicitly excludes
 * it for the generator, and `"not-applicable"` excludes it for the current test.
 */
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

/** Results for one scenario package at a particular version and source revision. */
export interface CoverageReport {
  /**
   * Metadata for the scenario set for this report.
   */
  scenariosMetadata: ScenariosMetadata;

  /**
   * Results keyed by scenario name, matching {@link ScenarioData.name}.
   * A missing key is not automatically converted to a status by the SDK.
   */
  results: Record<string, ScenarioStatus>;

  /**
   * UTC date and time the report was created, serialized as an ISO 8601 string.
   */
  createdAt: string;
}

/**
 * Numeric-keyed coverage aggregate with shared generator metadata.
 *
 * `getLatestCoverageFor` does not normalize stored JSON into this shape:
 * `SpecCoverageOperations.upload` writes a single {@link CoverageReport}'s fields
 * at the top level. Do not assume a downloaded payload has numeric entries.
 */
export interface ResolvedCoverageReport extends Record<number, CoverageReport> {
  /** Generator build and mode that produced the results. */
  generatorMetadata: GeneratorMetadata;
}

/** Identifies the scenario package and source snapshot used to produce a coverage report. */
export interface ScenariosMetadata {
  /** Version of the scenario package, not the generator version. */
  version: string;
  /** Source repository revision of the scenarios tested. */
  commit: string;
  /** Package name used to associate this report with its scenario manifest. */
  packageName: string;
}

/** Identifies the generator build and execution mode associated with stored coverage. */
export interface GeneratorMetadata {
  /** Generator identifier used as the report storage prefix and index key. */
  name: string;
  /** Generator version used as the report directory beneath that prefix. */
  version: string;
  /** Execution mode distinguishing reports for the same generator version. */
  mode: string;
  /** Optional source repository revision of the generator build. */
  commit?: string;
}
