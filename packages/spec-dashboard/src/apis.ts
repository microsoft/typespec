import {
  ResolvedCoverageReport,
  ScenarioManifest,
  SpecCoverageClient,
} from "@typespec/spec-coverage-sdk";

const storageAccountName = "typespec";

export type GeneratorNames =
  | "@typespec/http-client-python"
  | "@typespec/http-client-csharp"
  | "@azure-tools/typespec-ts-rlc"
  | "@azure-tools/typespec-ts-modular"
  | "@typespec/http-client-java"
  | "test";
const query = new URLSearchParams(window.location.search);
const generatorNames: GeneratorNames[] = [
  "@typespec/http-client-python",
  "@typespec/http-client-csharp",
  "@azure-tools/typespec-ts-rlc",
  "@azure-tools/typespec-ts-modular",
  "@typespec/http-client-java",
  ...(query.has("showtest") ? (["test"] as const) : []),
];

export interface CoverageSummary {
  manifest: ScenarioManifest;
  generatorReports: Record<GeneratorNames, ResolvedCoverageReport | undefined>;
}

let client: SpecCoverageClient | undefined;
export function getCoverageClient() {
  if (client === undefined) {
    client = new SpecCoverageClient(storageAccountName);
  }
  return client;
}

let manifestClient: SpecCoverageClient | undefined;
export function getManifestClient() {
  if (manifestClient === undefined) {
    manifestClient = new SpecCoverageClient(storageAccountName, {
      containerName: "manifests-typespec",
    });
  }
  return manifestClient;
}

export async function getCoverageSummaries(): Promise<CoverageSummary[]> {
  const coverageClient = getCoverageClient();
  const manifestClient = getManifestClient();
  const [manifests, generatorReports] = await Promise.all([
    manifestClient.manifest.get(),
    loadReports(coverageClient, generatorNames),
  ]);

  const manifestStandard = manifests.filter(
    (manifest: ScenarioManifest) => manifest.setName !== "@azure-tools/azure-http-specs",
  )[0];
  for (const key in generatorReports["standard"]) {
    if (!(generatorReports["standard"] as any)[key]) {
      continue;
    }
    (generatorReports["standard"] as any)[key] = {
      ...(generatorReports["standard"] as any)[key][0],
      generatorMetadata: (generatorReports["standard"] as any)[key]["generatorMetadata"],
    };
  }

  return [
    {
      manifest: manifestStandard,
      generatorReports: generatorReports["standard"],
    },
  ];
}

enum GeneratorMode {
  standard = "standard",
}

async function loadReports(
  coverageClient: SpecCoverageClient,
  generatorNames: GeneratorNames[],
): Promise<{ [mode: string]: Record<GeneratorNames, ResolvedCoverageReport | undefined> }> {
  const results = await Promise.all(
    Object.keys(GeneratorMode).map(
      async (
        mode,
      ): Promise<[string, Record<GeneratorNames, ResolvedCoverageReport | undefined>]> => {
        const items = await Promise.all(
          generatorNames.map(
            async (
              generatorName,
            ): Promise<[GeneratorNames, ResolvedCoverageReport | undefined]> => {
              try {
                const report = await coverageClient.coverage.getLatestCoverageFor(
                  generatorName,
                  mode,
                );
                return [generatorName, report];
              } catch (error) {
                // eslint-disable-next-line no-console
                console.error("Error resolving report", error);
                return [generatorName, undefined];
              }
            },
          ),
        );
        return [mode, Object.fromEntries(items) as any];
      },
    ),
  );

  return results.reduce<{
    [mode: string]: Record<GeneratorNames, ResolvedCoverageReport | undefined>;
  }>((results, [mode, reports]) => {
    results[mode] = reports;
    return results;
  }, {});
}
