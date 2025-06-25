export interface VersionData {
  latest: string;
  requested: string;
  resolved: string;
  importMap: ImportMap;
}

export interface ImportMap {
  imports: Record<string, string>;
}

export async function loadImportMap({
  latestVersion,
}: {
  latestVersion: string;
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
  const importMapUrl = `https://typespec.blob.core.windows.net/pkgs/indexes/typespec/${
    requestedVersion ?? latestVersion
  }.json`;

  const response = await fetch(importMapUrl);
  const content = await response.text();

  const importMap = JSON.parse(content);

  (window as any).importShim.addImportMap(importMap);

  return {
    latest: latestVersion,
    requested: requestedVersion!,
    resolved: requestedVersion ?? latestVersion,
    importMap,
  };
}
