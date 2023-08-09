#!/usr/bin/env node

/* eslint-disable no-console */
import { MANIFEST, NodePackage, resolvePath } from "@typespec/compiler";
import * as fs from "fs";
import { readFile } from "fs/promises";
import * as semver from "semver";
import yargs from "yargs";
import { migrationConfigurations } from "./migration-config.js";
import {
  migrateFileRename,
  migratePackageVersion,
  migrateTextFiles,
  migrateTypeSpecFiles,
} from "./migration-impl.js";
import { MigrationKind } from "./migration-types.js";
import { findTypeSpecFiles } from "./utils.js";

interface Options {
  path: string;
  tspVersion?: string;
}

async function main() {
  console.log(`TypeSpec migration tool v${MANIFEST.version}\n`);

  const cliOptions: Options = await yargs(process.argv.slice(2))
    .option("path", {
      alias: "p",
      describe: "Path to the input directory. Defaults to the current directory.",
      type: "string",
      default: process.cwd(),
    })
    .option("tspVersion", {
      alias: "t",
      describe:
        "Specifies the TypeSpec compiler version used by the input(Version you want to upgrade from). Defaults to the version of the compiler package in package.json.",
      type: "string",
    })
    .help().argv;

  const PackageJsonFile = "package.json";
  if (cliOptions.tspVersion === undefined) {
    // Locate current package.json
    const pkgFile = resolvePath(cliOptions.path, PackageJsonFile);
    const packageJson = await readPackageJson(pkgFile);
    if (packageJson) {
      cliOptions.tspVersion = lookupExistingVersion(packageJson);
    }
    // Locate current compiler version
  }

  if (cliOptions.tspVersion === undefined) {
    console.error(
      "Couldn't resolve TypeSpec compiler version to upgrade from. Use `--tspVersion` flag to specify it. (e.g. `--tspVersion=0.42.0` to upgrade from version 0.42.0)"
    );
    process.exit(1);
  }

  if (!fs.existsSync(cliOptions.path)) {
    console.error(`Path not found. ${cliOptions.path}`);
    return;
  }

  let changesMade = false;

  // Iterate thru migration configuration and invoke migration functions
  console.log(`Current Typespec version ${cliOptions.tspVersion}.`);
  const stepKeys = Object.keys(migrationConfigurations);
  for (const key of stepKeys) {
    const compKey = semver.coerce(key);
    if (compKey === null) {
      console.log(`Invalid migration step version; could not be coerced: ${key}`);
      process.exit(1);
    }
    if (semver.gt(compKey, cliOptions.tspVersion)) {
      console.log(
        `Migration step found to upgrade from ${cliOptions.tspVersion} to ${key}. Migrating...`
      );

      for (const migrationStep of migrationConfigurations[key]) {
        const files = await findTypeSpecFiles(cliOptions.path);
        switch (migrationStep.kind) {
          case MigrationKind.AstContentMigration:
            const result = await migrateTypeSpecFiles(files, migrationStep);
            // If migration has been performed log status
            if (result.filesChanged.length > 0) {
              changesMade = true;
              console.log(`Updated ${result.filesChanged.length} TypeSpec files:`);
              for (const file of result.filesChanged) {
                console.log(` - ${file}`);
              }
            }
            break;
          case MigrationKind.FileContentMigration:
            changesMade = await migrateTextFiles(files, migrationStep);
            break;
          case MigrationKind.FileRename:
            changesMade = await migrateFileRename(files, migrationStep);
            break;
          case MigrationKind.PackageVersionUpdate:
            const pkgFile = resolvePath(cliOptions.path, PackageJsonFile);
            changesMade = await migratePackageVersion(pkgFile, migrationStep);
            break;
          default:
            console.log(`Unexpected error: unknown migration kind: ${migrationStep} `);
        }
      }

      cliOptions.tspVersion = key;
    } else {
      console.log(
        `${cliOptions.tspVersion} is already greater than or equal to ${key}. Migration step skipped...`
      );
    }
  }

  if (changesMade) {
    console.log(
      "\nThis is a best effort migration, double check that everything was migrated correctly."
    );
  } else {
    console.log("\nNo typespec files have been migrated.");
  }
}

async function readPackageJson(pkgFile: string): Promise<NodePackage | undefined> {
  try {
    return JSON.parse(await readFile(pkgFile, "utf-8"));
  } catch (e) {
    return undefined;
  }
}
function lookupExistingVersion(packageJson: NodePackage) {
  const CadlCompiler = "@cadl-lang/compiler";
  const TypeSpecCompiler = "@typespec/compiler";

  const depKinds = ["devDependencies", "peerDependencies", "dependencies"] as const;
  for (const depKind of depKinds) {
    const deps = packageJson[depKind];
    if (deps === undefined) {
      continue;
    }
    const found = deps[CadlCompiler] ?? deps[TypeSpecCompiler];
    if (found) {
      return found;
    }
  }
  return undefined;
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
