import { Node, SyntaxKind, TypeSpecScriptNode } from "@typespec/compiler-v0.42";
import { TypeSpecCompilerV0_42 } from "../../migration-config.js";
import {
  AstContentMigrateAction,
  MigrationContext,
  MigrationKind,
  createContentMigration,
} from "../../migration-types.js";

export const migrateZonedDateTimeToUtcDateTime = createContentMigration({
  name: "Migrate zonedDateTime to utcDateTime",
  kind: MigrationKind.AstContentMigration,
  from: "0.42",
  to: "0.43",
  migrate: (
    { printNode, printNodes }: MigrationContext,
    compilerV42: TypeSpecCompilerV0_42,
    root: TypeSpecScriptNode
  ) => {
    const actions: AstContentMigrateAction[] = [];
    visitRecursive(compilerV42, root, (node) => {
      if (
        node.kind === SyntaxKind.TypeReference &&
        node.target.kind === SyntaxKind.Identifier &&
        node.target.sv === "zonedDateTime"
      ) {
        actions.push({
          kind: MigrationKind.AstContentMigration,
          target: node.target,
          content: "utcDateTime",
        });
      }
    });

    return actions;
  },
});

function visitRecursive(compiler: any, root: Node, callback: (node: Node) => void) {
  const visit = (node: Node) => {
    callback(node);
    compiler.visitChildren(node, visit);
  };
  visit(root);
}
