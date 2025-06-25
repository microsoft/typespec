// @ts-check
import { readFile, writeFile } from "fs/promises";
import { resolve } from "path";

const filename = resolve(import.meta.dirname, "../playground-versions.json");
const currentContent = await readFile(filename);
const current = JSON.parse(currentContent.toString());

console.log("Current versions:", current);

async function getMajorMinorVersion() {
  const version = JSON.parse(
    (
      await readFile(resolve(import.meta.dirname, "../../packages/compiler/package.json"))
    ).toString(),
  ).version;
  const [major, minor] = version.split(".");
  return `${major}.${minor}.x`;
}

const latestVersion = await getMajorMinorVersion();

if (current.includes(latestVersion)) {
  console.log(`Latest version ${latestVersion} is already in the list.`);
  process.exit(0);
}

const newVersions = [latestVersion, ...current];
console.log("New versions: ", newVersions);
const newContent = JSON.stringify(newVersions, null, 2);
await writeFile(filename, newContent);
