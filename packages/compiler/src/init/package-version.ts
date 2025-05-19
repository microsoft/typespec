import { fetchLatestPackageManifest } from "../package-manger/npm-registry-utils.js";
import type { SystemHost } from "../core/types.js";

/**
 * Get the version for a package, resolving "latest" to the actual version.
 * @param packageInfo Package information including name and optional version
 * @param host The system host, used for tracing
 * @returns The resolved version string
 */
export async function getPackageVersion(
  packageInfo: { name: string; version?: string },
  host?: SystemHost
): Promise<string> {
  // If version is specified and not "latest", use it
  if (packageInfo.version && packageInfo.version !== "latest") {
    return packageInfo.version;
  }

  try {
    // If version is "latest" or not specified, fetch actual latest version from npm
    const manifest = await fetchLatestPackageManifest(packageInfo.name);
    return manifest.version;
  } catch (error) {
    // If there's an error fetching the latest version, fall back to "latest"
    if (host?.tracer) {
      host.tracer.trace("init", `Failed to resolve latest version for ${packageInfo.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
    return "latest";
  }
}