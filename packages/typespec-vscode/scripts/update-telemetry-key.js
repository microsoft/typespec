import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const newKey = process.argv[2];
if (!newKey) {
  console.log("One argument for telemetry-key to use is expected. Exit without updating anything");
  process.exit(1);
} else {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const targetPackageJsonFile = path.resolve(__dirname, "../package.json");
  console.log(`Updating package.json at ${targetPackageJsonFile}`);
  const packageJson = JSON.parse(fs.readFileSync(targetPackageJsonFile, "utf8"));
  const oldKey = packageJson.telemetryKey ?? "";
  const keyToString = (key) =>
    `'${key.substring(0, 8)}...${key.substring(Math.max(0, key.length - 17))}'(length: ${key.length})`;

  console.log(`Updating telemetry key from ${keyToString(oldKey)} to ${keyToString(newKey)}`);
  packageJson.telemetryKey = newKey;

  fs.writeFileSync(targetPackageJsonFile, JSON.stringify(packageJson, null, 2));

  // double verify the updated result
  const newPackageJson = JSON.parse(fs.readFileSync(targetPackageJsonFile, "utf8"));
  const updatedKey = newPackageJson.telemetryKey ?? "";
  if (updatedKey !== newKey) {
    console.error(
      `Failed to update telemetry key in package.json. Actual = ${keyToString(updatedKey)}; Expected = ${keyToString(newKey)}`,
    );
    process.exit(2);
  } else {
    console.log(
      `telemetryKey in package.json updated to '${keyToString(updatedKey)}' successfully`,
    );
  }
}
