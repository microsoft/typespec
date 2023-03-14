import { MigrationStepsDictionary } from "./migration-types.js";
import { migrateModelToScalar } from "./migrations/v0.38/model-to-scalars.js";
import {
  migrateCadlNameToTypeSpec,
  migrateTspConfigFile,
  renameCadlFileNames,
  updatePackageVersion,
} from "./migrations/v0.41/typespec-rename.js";

// Update here before release.
export type TypeSpecCompilerCurrent = typeof import("@typespec/compiler");
export type TypeSpecCompilerV0_37 = typeof import("@typespec/compiler-v0.37");
export type TypeSpecCompilerV0_38 = typeof import("@typespec/compiler-v0.38");
export type TypeSpecCompilerV0_40 = typeof import("@typespec/compiler-v0.40");
export type TypeSpecCompilerV0_41 = TypeSpecCompilerCurrent;

/** Defines the list of compiler versions will be used */
export type TypeSpecCompilers = {
  "0.37.0": TypeSpecCompilerV0_37;
  "0.38.0": TypeSpecCompilerV0_38;
  "0.40.0": TypeSpecCompilerV0_40;
  "0.41.0": TypeSpecCompilerV0_41;
};

/** Please define the list of migration steps for each version.
 * Step sequence is respected */
export const migrationConfigurations: MigrationStepsDictionary = {
  "0.38.0": [migrateModelToScalar],
  "0.41.0": [
    migrateCadlNameToTypeSpec,
    renameCadlFileNames,
    updatePackageVersion,
    migrateTspConfigFile,
  ],
};
