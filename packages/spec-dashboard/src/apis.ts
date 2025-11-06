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

export interface CoverageSummary {
  manifest: ScenarioManifest;
  generatorReports: Record<string, GeneratorCoverageSuiteReport | undefined>;
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

export async function getCoverageSummaries(
  options: CoverageFromAzureStorageOptions,
): Promise<CoverageSummary[]> {
  const coverageClient = getCoverageClient(options);
  const manifestClient = getManifestClient(options);
  const [manifests, generatorReports] = await Promise.all([
    manifestClient.manifest.get(),
    loadReports(coverageClient, options),
  ]);

  const reports = Object.values(generatorReports);

  return manifests.map((manifest, i) => {
    return {
      manifest,
      generatorReports: processReports(reports[0], manifest),
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
      value.scenariosMetadata.packageName === manifest.packageName ||
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
): Promise<{ [mode: string]: Record<string, ResolvedCoverageReport | undefined> }> {
  const results = await Promise.all(
    (options.modes ?? ["standard"]).map(
      async (mode): Promise<[string, Record<string, ResolvedCoverageReport | undefined>]> => {
        const items = await Promise.all(
          options.emitterNames.map(
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
