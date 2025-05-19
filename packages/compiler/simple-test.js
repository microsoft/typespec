// Testing npm version resolution
const registry = `https://registry.npmjs.org`;

async function fetchLatestPackageManifest(packageName) {
  return fetchPackageManifest(packageName, "latest");
}

async function fetchPackageManifest(packageName, version) {
  const url = `${registry}/${packageName}/${version}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch package info for ${packageName}@${version}: ${res.status} ${res.statusText}`);
  }
  return await res.json();
}

async function getPackageVersion(packageInfo) {
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
    console.warn(`Failed to resolve latest version for ${packageInfo.name}: ${error.message}`);
    return packageInfo.version ?? "latest";
  }
}

async function runTests() {
  console.log("Testing package version resolution");
  
  // Test resolving @typespec/compiler latest version
  try {
    const version = await getPackageVersion({ name: "@typespec/compiler", version: "latest" });
    console.log(`✅ @typespec/compiler latest version: ${version}`);
  } catch (error) {
    console.error(`❌ Error fetching @typespec/compiler: ${error.message}`);
  }
  
  // Test with specific version
  try {
    const specificVersion = "0.48.0";
    const version = await getPackageVersion({ name: "@typespec/compiler", version: specificVersion });
    console.log(`✅ @typespec/compiler specific version: ${version} (should be ${specificVersion})`);
  } catch (error) {
    console.error(`❌ Error with specific version: ${error.message}`);
  }
  
  // Test with non-existent package
  try {
    const version = await getPackageVersion({ name: "@typespec/non-existent-package-test", version: "latest" });
    console.log(`✅ Non-existent package: ${version} (should fall back to "latest")`);
  } catch (error) {
    console.error(`❌ Error with non-existent package: ${error.message}`);
  }
}

runTests().catch(error => {
  console.error("Unhandled error:", error);
});