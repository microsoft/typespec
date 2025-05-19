// Test script for verifying template initialization
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs/promises";
import { getPackageVersion } from "./dist/src/init/scaffold.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function testVersionResolution() {
  console.log("Testing version resolution...");
  
  // Test with a package that exists
  try {
    const typescCompilerVersion = await getPackageVersion({ 
      name: "@typespec/compiler", 
      version: "latest" 
    });
    console.log(`@typespec/compiler resolved to: ${typescCompilerVersion}`);
    
    // Check that it's a valid semver and not "latest"
    if (typescCompilerVersion === "latest") {
      console.error("❌ Version was not resolved correctly, still returned 'latest'");
    } else {
      console.log("✅ Version was resolved correctly!");
    }
  } catch (error) {
    console.error("❌ Error testing version resolution:", error);
  }
  
  // Test with custom version specified
  try {
    const customVersion = "0.47.0"; // Use a specific version for testing
    const specificVersion = await getPackageVersion({ 
      name: "@typespec/compiler", 
      version: customVersion 
    });
    console.log(`@typespec/compiler with custom version resolved to: ${specificVersion}`);
    
    if (specificVersion === customVersion) {
      console.log("✅ Custom version was preserved correctly!");
    } else {
      console.error(`❌ Custom version was not preserved: expected ${customVersion}, got ${specificVersion}`);
    }
  } catch (error) {
    console.error("❌ Error testing custom version:", error);
  }
  
  // Test with error case (non-existent package)
  try {
    const nonExistentPackage = await getPackageVersion({ 
      name: "@typespec/non-existent-package-for-testing-xyz", 
      version: "latest" 
    });
    console.log(`Non-existent package resolution result: ${nonExistentPackage}`);
    
    if (nonExistentPackage === "latest") {
      console.log("✅ Fallback to 'latest' works correctly for non-existent packages!");
    } else {
      console.error(`❌ Unexpected result for non-existent package: ${nonExistentPackage}`);
    }
  } catch (error) {
    console.error("❌ Error testing non-existent package:", error);
  }
}

// Run tests
testVersionResolution().catch(console.error);