#!/usr/bin/env node

/* eslint-disable no-console */
import { NodePackage, resolvePath } from "@typespec/compiler";
import { readFile } from "fs/promises";
import * as semver from "semver";
import { migrationConfigurations } from "./migration-config.js";
import {
  migrateFileRename,
  migratePackageVersion,
  migrateTypeSpecFiles,
} from "./migration-impl.js";
import { MigrationKind } from "./migration-types.js";
import { findTypeSpecFiles } from "./utils.js";

async function main() {
  let changesMake = false;
  const workingFolder = process.cwd();

  // Locate current package.json
  const pkgFile = resolvePath(workingFolder, "package.json");
  const packageJson: NodePackage = JSON.parse(await readFile(pkgFile, "utf-8"));

  // Locate current compiler version
  const CadlCompiler = "@cadl-lang/compiler";
  const TypeSpecCompiler = "@typespec/compiler";
  let packageTypeSpecVersion: string;
  if (
    packageJson?.devDependencies !== undefined &&
    packageJson?.devDependencies[CadlCompiler] !== undefined
  ) {
    packageTypeSpecVersion = packageJson.devDependencies[CadlCompiler];
  } else if (
    packageJson?.devDependencies !== undefined &&
    packageJson?.devDependencies[TypeSpecCompiler] !== undefined
  ) {
    packageTypeSpecVersion = packageJson.devDependencies[TypeSpecCompiler];
  } else {
    console.error("Unable to find TypeSpec compiler version in package.json.");
    return;
  }

  // Iterate thru migration configuration and invoke
  console.log(`Current Typespec version ${packageTypeSpecVersion}.`);
  const stepKeys = Object.keys(migrationConfigurations);
  for (const key of stepKeys) {
    if (semver.gt(key, packageTypeSpecVersion)) {
      console.log(
        `Migration step found to upgrade from ${packageTypeSpecVersion} to ${key}. Migrating...`
      );

      for (const migrationStep of migrationConfigurations[key]) {
        switch (migrationStep.kind) {
          case MigrationKind.Content:
            const files = await findTypeSpecFiles(workingFolder);
            const result = await migrateTypeSpecFiles(files, migrationStep);
            // If migration has been performed log status
            if (result.fileChanged.length > 0) {
              changesMake = true;
              console.log(`Updated ${result.fileChanged.length} typespec files:`);
              for (const file of result.fileChanged) {
                console.log(` - ${file}`);
              }
            }
            break;
          case MigrationKind.FileRename:
            const srcFiles = await findTypeSpecFiles(workingFolder);
            await migrateFileRename(srcFiles, migrationStep);
            break;
          case MigrationKind.PackageVersionUpdate:
            await migratePackageVersion(pkgFile, migrationStep);
            break;
          default:
            console.log(`Unexpected error: unknown migration kind: ${migrationStep} `);
        }
      }

      packageTypeSpecVersion = key;
    } else {
      console.log(
        `${packageTypeSpecVersion} is already greater than or equal to ${key}. Migration step skipped...`
      );
    }
  }

  if (changesMake) {
    console.log(
      "\nThis is a best effort migration, double check everything was migrated correctly."
    );
  } else {
    console.log("\nNo typespec files has been migrated.");
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
