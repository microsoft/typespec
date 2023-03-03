#!/usr/bin/env node

/* eslint-disable no-console */
import { NodePackage, resolvePath } from "@typespec/compiler";
import { readFile } from "fs/promises";
import * as semver from "semver";
import { migrationConfigurations } from "./migration-config.js";
import { migrateTypeSpecFiles } from "./migration-impl.js";
import { findTypeSpecFiles } from "./utils.js";

async function main() {
  let changesMake = false;
  const workingFolder = process.cwd();

  // Locate current package.json
  const pkgFile = resolvePath(workingFolder, "package.json");
  const packageJson: NodePackage = JSON.parse(await readFile(pkgFile, "utf-8"));
  let packageTypeSpecVersion: string;
  if (
    packageJson?.devDependencies === undefined ||
    packageJson?.devDependencies["@cadl-lang/compiler"] === undefined
  ) {
    console.log("Unable to find TypeSpec compiler version in package.json");
    return;
  } else {
    packageTypeSpecVersion = packageJson.devDependencies["@cadl-lang/compiler"];
  }

  // Iterate thru migration configuration and invoke
  console.log(`Current Typespec version ${packageTypeSpecVersion}.`);
  //  Object.keys(migrationConfigurations).forEach(async (key) => {
  const stepKeys = Object.keys(migrationConfigurations);
  for (const key of stepKeys) {
    if (semver.gt(key, packageTypeSpecVersion)) {
      console.log(
        `Migration step found to upgrade from ${packageTypeSpecVersion} to ${key}. Migrating...`
      );

      for (const item of migrationConfigurations[key]) {
        const files = await findTypeSpecFiles(workingFolder);
        const result = await migrateTypeSpecFiles(files, item);

        // If migration has been performed log status
        if (result.fileChanged.length > 0) {
          changesMake = true;
          console.log(`Updated ${result.fileChanged.length} typespec files:`);
          for (const file of result.fileChanged) {
            console.log(` - ${file}`);
          }
        }
      }

      packageTypeSpecVersion = key;
      return;
    }
  }

  if (changesMake) {
    console.log("This is a best effort migration, double check everything was migrated correctly.");
  } else {
    console.log("No typespec files migrated since no change was detected.");
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
