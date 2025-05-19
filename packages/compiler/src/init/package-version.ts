import { fetchLatestPackageManifest } from "../package-manger/npm-registry-utils.js";

/**
 * Get the version for a package, resolving "latest" to the actual version.
 * @param packageInfo Package information including name and optional version
 * @returns The resolved version string
 */
/**
 * Get the version for a package, resolving "latest" to the actual version.
 * @param packageInfo Package information including name and optional version
 * @returns The resolved version string
 */
export async function getPackageVersion(packageInfo: { name: string; version?: string }): Promise<string> {
  // If version is specified and not "latest", use it
  if (packageInfo.version && packageInfo.version !== "latest") {
    return packageInfo.version;
  }

  try {
    // If version is "latest" or not specified, fetch actual latest version from npm
    if (!packageInfo.name) {
      // If we don't have a package name, fall back to "latest"
      return "latest";
    }
    
    const manifest = await fetchLatestPackageManifest(packageInfo.name);
    return manifest.version;
  } catch (error) {
    // If there's an error fetching the latest version, fall back to "latest"
    console.warn(`Failed to resolve latest version for ${packageInfo.name}: ${error instanceof Error ? error.message : String(error)}`);
    return packageInfo.version ?? "latest";
  }
}