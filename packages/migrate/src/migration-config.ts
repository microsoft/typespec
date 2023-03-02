import { MigrationStepsDictionary } from "./migration-types.js";
import { migrateModelToScalar } from "./migrations/v0.38/model-to-scalars.js";
import { migrateCadlNameToTypeSpec } from "./migrations/v0.41/typespec-rename.js";

// Update here before release.
export type TypeSpecCompilerCurrent = typeof import("@typespec/compiler");
export type TypeSpecCompilerV0_37 = typeof import("@typespec/compiler-v0.37");
export type TypeSpecCompilerV0_40 = typeof import("@typespec/compiler-v0.40");
export type TypeSpecCompilerV0_41 = TypeSpecCompilerCurrent;

export type TypeSpecCompilers = {
  "0.37": TypeSpecCompilerV0_37;
  "0.38": TypeSpecCompilerV0_37;
  "0.40": TypeSpecCompilerV0_40;
};

export const migrationConfigurations: MigrationStepsDictionary = {
  "0.37": [],
  "0.38": [migrateModelToScalar],
  "0.40": [migrateCadlNameToTypeSpec],
};
