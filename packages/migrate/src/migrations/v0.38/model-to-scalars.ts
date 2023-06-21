import type {
  CadlScriptNode,
  Node,
  TemplateParameterDeclarationNode,
} from "@typespec/compiler-v0.37";
import { TypeSpecCompilerV0_37 } from "../../migration-config.js";
import {
  AstContentMigrateAction,
  MigrationContext,
  MigrationKind,
  createContentMigration,
} from "../../migration-types.js";

export const migrateModelToScalar = createContentMigration({
  name: "Migrate Model To scalar",
  kind: MigrationKind.AstContentMigration,
  from: "0.37",
  to: "0.38",
  migrate: (
    { printNode, printNodes }: MigrationContext,
    compilerV37: TypeSpecCompilerV0_37,
    root: CadlScriptNode
  ) => {
    function printTemplateParameters(parameters: readonly TemplateParameterDeclarationNode[]) {
      if (parameters.length === 0) {
        return "";
      }
      return `<${parameters.map((x) => printNode(x)).join(", ")}>`;
    }

    const actions: AstContentMigrateAction[] = [];
    visitRecursive(compilerV37, root, (node) => {
      if (
        node.kind === compilerV37.SyntaxKind.ModelStatement &&
        node.is &&
        node.is.kind === compilerV37.SyntaxKind.TypeReference &&
        node.is.target.kind === compilerV37.SyntaxKind.Identifier &&
        builtInTypes.has(node.is.target.sv) &&
        node.properties.length === 0
      ) {
        const decorators = printNodes(node.decorators);
        actions.push({
          kind: MigrationKind.AstContentMigration,
          target: node,
          content: `${decorators ? decorators + " " : ""}scalar ${
            node.id.sv
          }${printTemplateParameters(node.templateParameters)} extends ${printNode(node.is)};`,
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

const builtInTypes = new Set([
  "bytes",
  "numeric",
  "integer",
  "float",
  "int64",
  "safeint",
  "int32",
  "int16",
  "int8",
  "uint64",
  "uint32",
  "uint16",
  "uint8",
  "float64",
  "float32",
  "string",
  "plainDate",
  "plainTime",
  "zonedDateTime",
  "duration",
  "boolean",
]);
