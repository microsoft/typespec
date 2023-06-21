import { Node, SyntaxKind, TypeSpecScriptNode } from "@typespec/compiler-v0.42";
import { TypeSpecCompilerV0_42 } from "../../migration-config.js";
import {
  AstContentMigrateAction,
  MigrationContext,
  MigrationKind,
  createContentMigration,
} from "../../migration-types.js";

export const migrateQueryHeaderRequiredFormat = createContentMigration({
  name: "Migrate Model To scalar",
  kind: MigrationKind.AstContentMigration,
  from: "0.42",
  to: "0.43",
  migrate: (
    { printNode, printNodes }: MigrationContext,
    compilerV37: TypeSpecCompilerV0_42,
    root: TypeSpecScriptNode
  ) => {
    const actions: AstContentMigrateAction[] = [];
    visitRecursive(compilerV37, root, (node) => {
      if (
        node.kind === SyntaxKind.ModelProperty &&
        node.value.kind === SyntaxKind.ArrayExpression
      ) {
        for (const decorator of node.decorators) {
          const decName =
            decorator.target.kind === SyntaxKind.Identifier
              ? decorator.target.sv
              : decorator.target.id.sv;
          if (decName === "header" || decName === "query") {
            const decId = printNode(decorator.target);
            const defaultFormat = decName === "header" ? "csv" : "multi";
            if (decorator.arguments.length === 0) {
              actions.push({
                kind: MigrationKind.AstContentMigration,
                target: decorator,
                content: `@${decId}({format: "${defaultFormat}"})`,
              });
            } else if (decorator.arguments[0].kind === SyntaxKind.StringLiteral) {
              actions.push({
                kind: MigrationKind.AstContentMigration,
                target: decorator,
                content: `@${decId}({name: ${printNode(
                  decorator.arguments[0]
                )},format: "${defaultFormat}"})`,
              });
            } else if (
              decorator.arguments[0].kind === SyntaxKind.ModelExpression &&
              !decorator.arguments[0].properties.find(
                (x) => x.kind === SyntaxKind.ModelProperty && x.id.sv === "format"
              )
            ) {
              const existingProperties = decorator.arguments[0].properties.map(
                (x) => `${printNode(x)},`
              );
              actions.push({
                kind: MigrationKind.AstContentMigration,
                target: decorator,
                content: `@${decId}({${existingProperties} format: "${defaultFormat}"})`,
              });
            }
          }
        }
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
