import { existsSync } from "fs";
import { readFile, rm, writeFile } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

export const repo = {
  owner: "microsoft",
  repo: "typespec",
};

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

export interface CheckOptions {
  readonly check?: boolean;
}
export async function syncFile(filename: string, newContent: string, options: CheckOptions) {
  if (options.check) {
    const existingContent = await readFile(filename, "utf8");
    if (newContent === existingContent) {
      console.log(`${filename} is up to date.`);
    } else {
      console.error(
        `${filename} file label section is not up to date, run pnpm sync-labels to update it`,
      );
      process.exit(1);
    }
  } else {
    await writeFile(filename, newContent);
  }
}

export async function removeFile(filename: string, options: CheckOptions) {
  if (!existsSync(filename)) {
    console.log(`${filename} is correctly absent.`);
  } else if (options.check) {
    console.error(`${filename} should not exist, run pnpm sync-labels to remove it`);
    process.exit(1);
  } else {
    await rm(filename);
  }
}
