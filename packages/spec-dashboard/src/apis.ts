import {
  CoverageReport,
  GeneratorMetadata,
  ResolvedCoverageReport,
  ScenarioData,
  ScenarioManifest,
  SpecCoverageClient,
} from "@typespec/spec-coverage-sdk";
import { TierConfig } from "./utils/tier-filtering-utils.js";

export interface TableDefinition {
  /** Custom table name */
  name: string;
  /** Name of the spec set/package that this should apply to */
  packageName: string;
  /** Prefixes to filter the coverage data. Any scenarios starting with this prefix will be included in this table */
  prefixes?: string[];
  /** Optional emitter names specific to this table. If not provided, falls back to global emitterNames */
  emitterNames?: string[];
}

export interface CoverageFromAzureStorageOptions {
  readonly storageAccountName: string;
  readonly containerName: string;
  // TODO: why was this not back in the same place as the other options?
  readonly manifestContainerName: string;
  readonly emitterNames: string[];
  readonly modes?: string[];
  /** Optional table definitions to split scenarios into multiple tables */
  readonly tables?: TableDefinition[];
  /** Optional tier config to filter scenarios by tier */
  readonly tiers?: TierConfig;
}

export interface GeneratorCoverageSuiteReport extends CoverageReport {
  generatorMetadata: GeneratorMetadata;
}

export interface CoverageSummary {
  manifest: ScenarioManifest;
  generatorReports: Record<string, GeneratorCoverageSuiteReport | undefined>;
  /** Display name for the table */
  tableName: string;
}

let client: SpecCoverageClient | undefined;
export function getCoverageClient(options: CoverageFromAzureStorageOptions) {
  if (client === undefined) {
    client = new SpecCoverageClient(options.storageAccountName);
  }
  return client;
}

let manifestClient: SpecCoverageClient | undefined;
export function getManifestClient(options: CoverageFromAzureStorageOptions) {
  if (manifestClient === undefined) {
    manifestClient = new SpecCoverageClient(options.storageAccountName, {
      containerName: options.manifestContainerName,
    });
  }
  return manifestClient;
}

/**
 * Checks if a scenario name matches any of the given prefixes
 */
function matchesPrefixes(scenarioName: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => scenarioName.startsWith(prefix));
}

/**
 * Splits a manifest into multiple tables based on prefix filters
 * @internal - Exported for testing
 */
export function splitManifestByTables(
  manifest: ScenarioManifest,
  tableDefinitions: TableDefinition[],
): Array<{ manifest: ScenarioManifest; tableName: string; emitterNames?: string[] }> {
  const packageName = manifest.packageName ?? "";
  const defaultTableName = manifest.displayName || packageName;

  // Find table definitions that apply to this manifest
  const applicableTables = tableDefinitions.filter((table) => table.packageName === packageName);

  if (applicableTables.length === 0) {
    // No table definitions for this manifest, return as-is with a default name
    return [{ manifest, tableName: defaultTableName, emitterNames: undefined }];
  }

  const result: Array<{ manifest: ScenarioManifest; tableName: string; emitterNames?: string[] }> =
    [];
  const usedScenarios = new Set<string>();

  // First, identify which scenarios would match ANY prefix table (to reserve them from catch-all tables)
  const scenariosMatchingAnyPrefix = new Set<string>();
  for (const table of applicableTables) {
    if (table.prefixes && table.prefixes.length > 0) {
      for (const scenario of manifest.scenarios) {
        if (matchesPrefixes(scenario.name, table.prefixes)) {
          scenariosMatchingAnyPrefix.add(scenario.name);
        }
      }
    }
  }

  // Now process tables in the order they appear in tableDefinitions
  for (const table of applicableTables) {
    const isCatchAll = !table.prefixes || table.prefixes.length === 0;

    let matchingScenarios: ScenarioData[];
    if (isCatchAll) {
      // Catch-all table: only get scenarios not yet assigned AND not matching any prefix
      matchingScenarios = manifest.scenarios.filter(
        (s: ScenarioData) => !usedScenarios.has(s.name) && !scenariosMatchingAnyPrefix.has(s.name),
      );
    } else {
      // Table with prefixes: filter scenarios by prefixes
      matchingScenarios = manifest.scenarios.filter((s: ScenarioData) => {
        if (usedScenarios.has(s.name)) {
          return false; // Already assigned to another table
        }
        return matchesPrefixes(s.name, table.prefixes!);
      });
    }

    if (matchingScenarios.length > 0) {
      // Mark these scenarios as used
      matchingScenarios.forEach((s) => usedScenarios.add(s.name));

      result.push({
        manifest: {
          ...manifest,
          scenarios: matchingScenarios,
        },
        tableName: table.name,
        emitterNames: table.emitterNames,
      });
    }
  }

  // Handle scenarios that didn't match any table
  const unmatchedScenarios = manifest.scenarios.filter(
    (s: ScenarioData) => !usedScenarios.has(s.name),
  );

  if (unmatchedScenarios.length > 0) {
    result.push({
      manifest: {
        ...manifest,
        scenarios: unmatchedScenarios,
      },
      tableName: defaultTableName,
      emitterNames: undefined,
    });
  }

  return result;
}

export async function getCoverageSummaries(
  options: CoverageFromAzureStorageOptions,
): Promise<CoverageSummary[]> {
  const coverageClient = getCoverageClient(options);
  const manifestClient = getManifestClient(options);

  // First, split manifests to determine which emitters we need
  const manifests = await manifestClient.manifest.get();
  const allManifests: Array<{
    manifest: ScenarioManifest;
    tableName: string;
    emitterNames?: string[];
  }> = [];

  for (const manifest of manifests) {
    if (options.tables && options.tables.length > 0) {
      // Use table definitions to split scenarios
      const splitResults = splitManifestByTables(manifest, options.tables);
      allManifests.push(...splitResults);
    } else {
      // No table definitions, use default behavior
      allManifests.push({
        manifest,
        tableName: manifest.displayName || manifest.packageName || "",
        emitterNames: undefined,
      });
    }
  }

  // Collect all unique emitter names needed
  const allEmitterNames = new Set<string>(options.emitterNames);
  for (const { emitterNames } of allManifests) {
    if (emitterNames) {
      emitterNames.forEach((name) => allEmitterNames.add(name));
    }
  }

  // Load reports for all needed emitters
  const generatorReports = await loadReports(coverageClient, options, Array.from(allEmitterNames));

  const reports = Object.values(generatorReports)[0] as Record<
    string,
    ResolvedCoverageReport | undefined
  >;

  return allManifests.map(({ manifest, tableName, emitterNames }) => {
    // Use table-specific emitters if provided, otherwise use global emitters
    const effectiveEmitters = emitterNames ?? options.emitterNames;

    // Filter reports to only include the emitters for this table
    const filteredReports: Record<string, ResolvedCoverageReport | undefined> = {};
    for (const emitterName of effectiveEmitters) {
      if (reports[emitterName]) {
        filteredReports[emitterName] = reports[emitterName];
      }
    }

    return {
      manifest,
      generatorReports: processReports(filteredReports, manifest),
      tableName,
    };
  });
}

function processReports(
  reports: Record<string, ResolvedCoverageReport | undefined>,
  manifest: ScenarioManifest,
) {
  const generatorReports: Record<string, GeneratorCoverageSuiteReport | undefined> = {};
  for (const [emitterName, report] of Object.entries(reports)) {
    generatorReports[emitterName] = report && getSuiteReportForManifest(report, manifest);
  }
  return generatorReports;
}

function getSuiteReportForManifest(
  report: ResolvedCoverageReport,
  manifest: ScenarioManifest,
): GeneratorCoverageSuiteReport | undefined {
  let data;
  for (const [key, value] of Object.entries(report)) {
    if (key === "generatorMetadata") {
      continue;
    }
    if (
      value.scenariosMetadata.packageName === (manifest.packageName ?? "") ||
      value.scenariosMetadata.packageName === (manifest as any).setName /* old name*/
    ) {
      data = value;
    }
  }
  return data
    ? {
        generatorMetadata: report.generatorMetadata,
        ...data,
      }
    : undefined;
}

async function loadReports(
  coverageClient: SpecCoverageClient,
  options: CoverageFromAzureStorageOptions,
  emitterNames: string[],
): Promise<{
  [mode: string]: Record<string, ResolvedCoverageReport | undefined>;
}> {
  const results = await Promise.all(
    (options.modes ?? ["standard"]).map(
      async (mode): Promise<[string, Record<string, ResolvedCoverageReport | undefined>]> => {
        const items = await Promise.all(
          emitterNames.map(
            async (emitterName): Promise<[string, ResolvedCoverageReport | undefined]> => {
              try {
                const report = await coverageClient.coverage.getLatestCoverageFor(
                  emitterName,
                  mode,
                );
                return [emitterName, report];
              } catch (error) {
                // eslint-disable-next-line no-console
                console.error("Error resolving report", error);
                return [emitterName, undefined];
              }
            },
          ),
        );

        return [mode, Object.fromEntries(items) as any];
      },
    ),
  );

  return results.reduce<{
    [mode: string]: Record<string, ResolvedCoverageReport | undefined>;
  }>((results, [mode, reports]) => {
    results[mode] = reports;
    return results;
  }, {});
}
