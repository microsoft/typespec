// Test for package-version.ts
import { fetchLatestPackageManifest } from "../src/package-manger/npm-registry-utils.js";

// Simplified version of getPackageVersion for testing
async function getPackageVersion(packageInfo: { name: string; version?: string }): Promise<string> {
  // If version is specified and not "latest", use it
  if (packageInfo.version && packageInfo.version !== "latest") {
    return packageInfo.version;
  }

  try {
    // If version is "latest" or not specified, fetch actual latest version from npm
    if (!packageInfo.name) {
      return "latest";
    }
    
    const manifest = await fetchLatestPackageManifest(packageInfo.name);
    return manifest.version;
  } catch (error) {
    console.warn(`Failed to resolve latest version for ${packageInfo.name}: ${error}`);
    return packageInfo.version ?? "latest";
  }
}

async function runTests() {
  console.log("Testing version resolution...");
  
  // Test with a package that exists
  console.log("\nTest 1: Resolving @typespec/compiler latest version");
  try {
    const version = await getPackageVersion({ name: "@typespec/compiler", version: "latest" });
    console.log(`✅ @typespec/compiler resolved to: ${version}`);
  } catch (error) {
    console.error("❌ Error:", error);
  }
  
  // Test with a specific version
  console.log("\nTest 2: Using specific version");
  try {
    const specificVersion = "0.48.0";
    const version = await getPackageVersion({ name: "@typespec/compiler", version: specificVersion });
    console.log(`Version returned: ${version}`);
    console.log(version === specificVersion ? "✅ Correct specific version returned" : "❌ Wrong version returned");
  } catch (error) {
    console.error("❌ Error:", error);
  }
  
  // Test with non-existent package
  console.log("\nTest 3: Handling non-existent package");
  try {
    const version = await getPackageVersion({ name: "@typespec/non-existent-package-123456789", version: "latest" });
    console.log(`Version returned: ${version}`);
    console.log(version === "latest" ? "✅ Correctly fell back to 'latest'" : "❌ Didn't fall back to 'latest'");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

runTests().catch(console.error);