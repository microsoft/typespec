import { MigrationStepsDictionary } from "./migration-types.js";
import { migrateModelToScalar } from "./migrations/v0.38/model-to-scalars.js";
import {
  migrateCadlNameToTypeSpec,
  migrateTspConfigFile,
  renameCadlFileNames,
  updatePackageVersion,
} from "./migrations/v0.41/typespec-rename.js";
import { migrateQueryHeaderRequiredFormat } from "./migrations/v0.43/query-header-required-format.js";
import { migrateZonedDateTimeToUtcDateTime } from "./migrations/v0.43/zoned-date-time-to-utc-date-time.js";
// Update here before release.
export type TypeSpecCompilerCurrent = typeof import("@typespec/compiler");
export type TypeSpecCompilerV0_37 = typeof import("@typespec/compiler-v0.37");
export type TypeSpecCompilerV0_38 = typeof import("@typespec/compiler-v0.38");
export type TypeSpecCompilerV0_40 = typeof import("@typespec/compiler-v0.40");
export type TypeSpecCompilerV0_41 = typeof import("@typespec/compiler-v0.41");
export type TypeSpecCompilerV0_42 = typeof import("@typespec/compiler-v0.42");
export type TypeSpecCompilerV0_43 = TypeSpecCompilerCurrent;

/** Defines the list of compiler versions will be used */
export type TypeSpecCompilers = {
  "0.37": TypeSpecCompilerV0_37;
  "0.38": TypeSpecCompilerV0_38;
  "0.40": TypeSpecCompilerV0_40;
  "0.41": TypeSpecCompilerV0_41;
  "0.42": TypeSpecCompilerV0_42;
  "0.43": TypeSpecCompilerV0_43;
};

/** Please define the list of migration steps for each version.
 * Step sequence is respected */
export const migrationConfigurations: MigrationStepsDictionary = {
  "0.38": [migrateModelToScalar],
  "0.41": [
    migrateCadlNameToTypeSpec,
    renameCadlFileNames,
    updatePackageVersion,
    migrateTspConfigFile,
  ],
  "0.43": [migrateQueryHeaderRequiredFormat, migrateZonedDateTimeToUtcDateTime],
};
