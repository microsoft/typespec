import { mkdir, readFile, writeFile } from "fs/promises";
import { KnownDirectories } from "../cli/common.js";
import { joinPaths } from "../core/path-utils.js";
import { downloadPackageVersion } from "../package-manger/npm-registry-utils.js";

export interface LoadedCoreTemplates {
  readonly baseUri: string;
  readonly templates: Record<string, any>;
}

const LAST_CHECK_FILE_NAME = ".last-check.json";
const CHECK_TIMEOUT = 86400_000; // 24 hours in milliseconds

export async function getTypeSpecCoreTemplates(): Promise<LoadedCoreTemplates> {
  const lastCheck = await readLastCheckFile();
  if (lastCheck === undefined || new Date().getTime() > lastCheck?.getTime() + CHECK_TIMEOUT) {
    await mkdir(KnownDirectories.initTemplates, { recursive: true });
    await downloadPackageVersion("@typespec/compiler", "latest", KnownDirectories.initTemplates);
    await saveLastCheckFile();
  }

  return (await import(`${KnownDirectories.initTemplates}/src/index.js`)).default;
}

async function readLastCheckFile(): Promise<Date | undefined> {
  try {
    const lastCheck = await readFile(
      joinPaths(KnownDirectories.initTemplates, LAST_CHECK_FILE_NAME),
      "utf8",
    );
    return new Date(JSON.parse(lastCheck).time);
  } catch (e) {
    return undefined;
  }
}

async function saveLastCheckFile() {
  await writeFile(
    joinPaths(KnownDirectories.initTemplates, LAST_CHECK_FILE_NAME),
    JSON.stringify({ time: new Date().toISOString() }, null, 2),
    "utf8",
  );
}
