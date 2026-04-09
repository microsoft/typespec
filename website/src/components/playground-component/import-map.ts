export interface VersionData {
  latest: string;
  requested: string;
  resolved: string;
  importMap: ImportMap;
}

export interface ImportMap {
  imports: Record<string, string>;
}

const pkgsBaseUrl = "https://typespec.blob.core.windows.net/pkgs";

async function fetchAdditionalPackageImports(
  packageNames: readonly string[],
): Promise<Record<string, string>> {
  const imports: Record<string, string> = {};

  const results = await Promise.allSettled(
    packageNames.map(async (name) => {
      const url = `${pkgsBaseUrl}/${name}/latest.json`;
      const response = await fetch(url);
      if (!response.ok) {
        // eslint-disable-next-line no-console
        console.warn(`Failed to load latest index for ${name}: ${response.status}`);
        return undefined;
      }
      return JSON.parse(await response.text()) as ImportMap;
    }),
  );

  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      Object.assign(imports, result.value.imports);
    }
  }

  return imports;
}

export async function loadImportMap({
  latestVersion,
  additionalPackages = [],
}: {
  latestVersion: string;
  additionalPackages?: readonly string[];
}): Promise<VersionData> {
  const optionsScript = document.querySelector("script[type=playground-options]");
  if (optionsScript === undefined) {
    throw new Error("Could not find script[type=playground-options] script");
  }
  if (latestVersion === undefined) {
    throw new Error("script[type=playground-options] missing latestVersion property.");
  }
  const parsed = new URLSearchParams(window.location.search);

  const requestedVersion = parsed.get("version");
  const importMapUrl = `${pkgsBaseUrl}/indexes/typespec/${requestedVersion ?? latestVersion}.json`;

  const [mainResponse, additionalImports] = await Promise.all([
    fetch(importMapUrl),
    fetchAdditionalPackageImports(additionalPackages),
  ]);

  const importMap: ImportMap = JSON.parse(await mainResponse.text());
  Object.assign(importMap.imports, additionalImports);

  (window as any).importShim.addImportMap(importMap);

  return {
    latest: latestVersion,
    requested: requestedVersion!,
    resolved: requestedVersion ?? latestVersion,
    importMap,
  };
}
