import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const newKey = process.argv[2];
if (!newKey) {
  console.log("One argument for telemetry-key to use is expected. Exit without updating anything");
} else {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const targetPackageJsonFile = path.resolve(__dirname, "../package.json");
  const packageJson = JSON.parse(fs.readFileSync(targetPackageJsonFile, "utf8"));
  const oldKey = packageJson.telemetryKey;

  const getLastSegOfKey = (key) => key.substring(Math.max(0, newKey.length - 12));

  console.log(
    `Updating telemetry key from ...${getLastSegOfKey(oldKey)} to ...${getLastSegOfKey(newKey)}`,
  );
  packageJson.telemetryKey = newKey;

  fs.writeFileSync(targetPackageJsonFile, JSON.stringify(packageJson, null, 2));

  console.log("package.json updated successfully");
}
