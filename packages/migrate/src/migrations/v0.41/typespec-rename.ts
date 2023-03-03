import type { CadlScriptNode } from "@typespec/compiler-v0.37";
import type { TypeSpecCompilerV0_38 } from "../../migration-config.js";
import { createMigration, MigrationContext } from "../../migration-types.js";

export const migrateCadlNameToTypeSpec = createMigration({
  name: "Migrate Model To scalar",
  kind: "Syntax",
  from: "0.38.0",
  to: "0.40.0",
  migrate: (
    { printNode, printNodes }: MigrationContext,
    compilerV38: TypeSpecCompilerV0_38,
    root: CadlScriptNode
  ) => {
    // let migrationResult: MigrateActionBase[];
    return [];
  },
});
