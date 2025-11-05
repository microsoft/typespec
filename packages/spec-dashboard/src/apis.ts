import {
  CoverageReport,
  GeneratorMetadata,
  ResolvedCoverageReport,
  ScenarioManifest,
  SpecCoverageClient,
} from "@typespec/spec-coverage-sdk";

export interface CoverageFromAzureStorageOptions {
  readonly storageAccountName: string;
  readonly containerName: string;
  // TODO: why was this not back in the same place as the other options?
  readonly manifestContainerName: string;
  readonly emitterNames: string[];
  readonly modes?: string[];
}

export interface GeneratorCoverageSuiteReport extends CoverageReport {
  generatorMetadata: GeneratorMetadata;
}

export type CoverageSummaryCategory =
  | "standard"
  | "azure-data-plane"
  | "azure-management-plane";

export interface CoverageSummary {
  manifest: ScenarioManifest;
  generatorReports: Record<string, GeneratorCoverageSuiteReport | undefined>;
  category: CoverageSummaryCategory;
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
 * Determines if a scenario belongs to Azure management plane based on its name.
 * Management plane scenarios typically include ARM (Azure Resource Manager) operations.
 */
function isManagementPlaneScenario(scenarioName: string): boolean {
  const lowerName = scenarioName.toLowerCase();
  // Check for ARM-related patterns in scenario names
  return (
    lowerName.includes("azure_arm") ||
    lowerName.includes("azure-arm") ||
    lowerName.includes("_arm_") ||
    lowerName.includes("resource_manager") ||
    lowerName.includes("resource-manager") ||
    lowerName.startsWith("arm_") ||
    lowerName.startsWith("arm-")
  );
}

/**
 * Splits Azure manifests into separate data plane and management plane manifests
 */
function splitAzureManifest(manifest: ScenarioManifest): ScenarioManifest[] {
  if (manifest.setName !== "@azure-tools/azure-http-specs") {
    return [manifest];
  }

  const managementScenarios = manifest.scenarios.filter((s: any) =>
    isManagementPlaneScenario(s.name),
  );
  const dataScenarios = manifest.scenarios.filter(
    (s: any) => !isManagementPlaneScenario(s.name),
  );

  const result: ScenarioManifest[] = [];

  if (dataScenarios.length > 0) {
    result.push({
      ...manifest,
      scenarios: dataScenarios,
    });
  }

  if (managementScenarios.length > 0) {
    result.push({
      ...manifest,
      scenarios: managementScenarios,
    });
  }

  return result;
}

export async function getCoverageSummaries(
  options: CoverageFromAzureStorageOptions,
): Promise<CoverageSummary[]> {
  const coverageClient = getCoverageClient(options);
  const manifestClient = getManifestClient(options);
  const [manifests, generatorReports] = await Promise.all([
    manifestClient.manifest.get(),
    loadReports(coverageClient, options),
  ]);

  const reports = Object.values(generatorReports)[0] as Record<
    string,
    ResolvedCoverageReport | undefined
  >;

  // Split Azure manifests into data plane and management plane
  const allManifests: Array<{
    manifest: ScenarioManifest;
    category: CoverageSummaryCategory;
  }> = [];
  for (const manifest of manifests) {
    if (manifest.setName === "@azure-tools/azure-http-specs") {
      const splitManifests = splitAzureManifest(manifest);
      if (splitManifests.length > 1) {
        // We have both data and management plane scenarios
        allManifests.push({
          manifest: splitManifests[0],
          category: "azure-data-plane",
        });
        allManifests.push({
          manifest: splitManifests[1],
          category: "azure-management-plane",
        });
      } else if (splitManifests.length === 1) {
        // Only one type of scenarios
        const hasManagement = splitManifests[0].scenarios.some((s: any) =>
          isManagementPlaneScenario(s.name),
        );
        allManifests.push({
          manifest: splitManifests[0],
          category: hasManagement
            ? "azure-management-plane"
            : "azure-data-plane",
        });
      }
    } else {
      allManifests.push({ manifest, category: "standard" });
    }
  }

  return allManifests.map(({ manifest, category }) => {
    return {
      manifest,
      generatorReports: processReports(reports, manifest),
      category,
    };
  });
}

function processReports(
  reports: Record<string, ResolvedCoverageReport | undefined>,
  manifest: ScenarioManifest,
) {
  const generatorReports: Record<
    string,
    GeneratorCoverageSuiteReport | undefined
  > = {};
  for (const [emitterName, report] of Object.entries(reports)) {
    generatorReports[emitterName] =
      report && getSuiteReportForManifest(report, manifest);
  }
  return generatorReports;
}

function getSuiteReportForManifest(
  report: ResolvedCoverageReport,
  manifest: ScenarioManifest,
): GeneratorCoverageSuiteReport | undefined {
  let data: any;
  for (const [key, value] of Object.entries(report)) {
    if (key === "generatorMetadata") {
      continue;
    }
    if ((value as any).scenariosMetadata.packageName === manifest.setName) {
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
): Promise<{
  [mode: string]: Record<string, ResolvedCoverageReport | undefined>;
}> {
  const results = await Promise.all(
    (options.modes ?? ["standard"]).map(
      async (
        mode,
      ): Promise<
        [string, Record<string, ResolvedCoverageReport | undefined>]
      > => {
        const items = await Promise.all(
          options.emitterNames.map(
            async (
              emitterName,
            ): Promise<[string, ResolvedCoverageReport | undefined]> => {
              try {
                const report =
                  await coverageClient.coverage.getLatestCoverageFor(
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
