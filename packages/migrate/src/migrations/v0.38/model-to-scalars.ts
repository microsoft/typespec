import type { CadlScriptNode, TemplateParameterDeclarationNode } from "@cadl-lang/compiler-v0.36";
import {
  CadlCompilerV0_37,
  createMigration,
  MigrateAction,
  MigrationContext,
} from "../migration.js";

export const migrateModelToScalar = createMigration<CadlCompilerV0_37>({
  name: "Migrate Model To scalar",
  kind: "Syntax",
  from: "0.37",
  to: "0.38",
  migrate: (
    { printNode, printNodes }: MigrationContext,
    compilerV37: CadlCompilerV0_37,
    root: CadlScriptNode
  ) => {
    function printTemplateParameters(parameters: readonly TemplateParameterDeclarationNode[]) {
      if (parameters.length === 0) {
        return "";
      }
      return `<${parameters.map((x) => printNode(x)).join(", ")}>`;
    }

    const actions: MigrateAction[] = [];
    compilerV37.visitChildren(root, (node) => {
      if (
        node.kind === compilerV37.SyntaxKind.ModelStatement &&
        node.is &&
        node.properties.length === 0
      ) {
        actions.push({
          target: node,
          content: `${printNodes(node.decorators)}scalar ${node.id.sv}${printTemplateParameters(
            node.templateParameters
          )} extends ${printNode(node.is)};`,
        });
      }
    });

    return actions;
  },
});
