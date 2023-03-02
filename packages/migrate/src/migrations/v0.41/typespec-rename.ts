import type { CadlScriptNode } from "@typespec/compiler-v0.37";
import { TypeSpecCompilerV0_41 } from "../../migration-config.js";
import { createMigration, MigrationContext } from "../../migration-types.js";

export const migrateCadlNameToTypeSpec = createMigration({
  name: "Migrate Model To scalar",
  kind: "Syntax",
  from: "0.38",
  to: "0.40",
  migrate: (
    { printNode, printNodes }: MigrationContext,
    compilerV40: TypeSpecCompilerV0_41,
    root: CadlScriptNode
  ) => {
    // let migrationResult: MigrateActionBase[];
    return [];
  },
});
