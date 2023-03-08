import { getAnyExtensionFromPath, NodePackage } from "@typespec/compiler";
import type { CadlScriptNode, Node } from "@typespec/compiler-v0.40";
import * as path from "path";
import type { TypeSpecCompilerV0_40 } from "../../migration-config.js";
import {
  ContentMigrateAction,
  createContentMigration,
  createFileRenameMigration,
  createPackageVersionMigration,
  FileRenameAction,
  MigrationContext,
  MigrationKind,
  PackageVersionUpdateAction,
} from "../../migration-types.js";

export const updatePackageVersion = createPackageVersionMigration({
  name: "Update package version",
  kind: MigrationKind.PackageVersionUpdate,
  migrate: (pkg: NodePackage) => {
    const actions: Array<PackageVersionUpdateAction> = [];

    actions.push({
      kind: MigrationKind.PackageVersionUpdate,
      packageName: "@cadl-lang/compiler",
      renamePackageName: "@typespec/compiler",
      toVersion: "0.41.0",
    });
    actions.push({
      kind: MigrationKind.PackageVersionUpdate,
      packageName: "@cadl-lang/openapi",
      renamePackageName: "@typespec/openapi",
      toVersion: "0.41.0",
    });
    actions.push({
      kind: MigrationKind.PackageVersionUpdate,
      packageName: "@cadl-lang/openapi3",
      renamePackageName: "@typespec/openapi3",
      toVersion: "0.41.0",
    });
    actions.push({
      kind: MigrationKind.PackageVersionUpdate,
      packageName: "@cadl-lang/http",
      renamePackageName: "@typespec/http",
      toVersion: "0.41.0",
    });
    actions.push({
      kind: MigrationKind.PackageVersionUpdate,
      packageName: "@cadl-lang/versioning",
      renamePackageName: "@typespec/versioning",
      toVersion: "0.41.0",
    });
    actions.push({
      kind: MigrationKind.PackageVersionUpdate,
      packageName: "@cadl-lang/rest",
      renamePackageName: "@typespec/rest",
      toVersion: "0.41.0",
    });
    actions.push({
      kind: MigrationKind.PackageVersionUpdate,
      packageName: "@cadl-lang/lint",
      renamePackageName: "@typespec/lint",
      toVersion: "0.41.0",
    });
    actions.push({
      kind: MigrationKind.PackageVersionUpdate,
      packageName: "@azure-tools/cadl-autorest",
      renamePackageName: "@azure-tools/typespec-autorest",
      toVersion: "0.27.0",
    });
    actions.push({
      kind: MigrationKind.PackageVersionUpdate,
      packageName: "@azure-tools/cadl-azure-core",
      renamePackageName: "@azure-tools/typespec-azure-core",
      toVersion: "0.27.0",
    });
    actions.push({
      kind: MigrationKind.PackageVersionUpdate,
      packageName: "@azure-tools/cadl-azure-resource-manager",
      renamePackageName: "@azure-tools/typespec-azure-resource-manager",
      toVersion: "0.27.0",
    });
    actions.push({
      kind: MigrationKind.PackageVersionUpdate,
      packageName: "@azure-tools/cadl-dpg",
      renamePackageName: "@azure-tools/typespec-client-generator-core",
      toVersion: "0.27.0",
    });
    actions.push({
      kind: MigrationKind.PackageVersionUpdate,
      packageName: "@azure-tools/cadl-providerhub",
      renamePackageName: "@azure-tools/typespec-providerhub",
      toVersion: "0.27.0",
    });
    actions.push({
      kind: MigrationKind.PackageVersionUpdate,
      packageName: "@azure-tools/cadl-providerhub-controller",
      renamePackageName: "@azure-tools/typespec-providerhub-controller",
      toVersion: "0.27.0",
    });

    return actions;
  },
});

export const migrateCadlNameToTypeSpec = createContentMigration({
  name: "Migrate Model To scalar",
  kind: MigrationKind.Content,
  from: "0.40.0",
  to: "0.41.0",
  migrate: (
    { printNode, printNodes }: MigrationContext,
    compilerV40: TypeSpecCompilerV0_40,
    root: CadlScriptNode
  ) => {
    const actions: ContentMigrateAction[] = [];
    visitRecursive(compilerV40, root, (node) => {
      if (node.kind === compilerV40.SyntaxKind.ImportStatement && node.path.value.length > 0) {
        let newContent = "";

        if (node.path.value.includes("/cadl-dpg")) {
          newContent = node.path.value.replace("/cadl-dpg", "/typespec-client-generator-core");
        } else if (node.path.value.includes("@cadl-lang")) {
          newContent = node.path.value.replace("@cadl-lang", "@typespec");
        } else if (node.path.value.includes("@azure-tools/cadl")) {
          newContent = node.path.value.replace("@azure-tools/cadl", "@azure-tools/typespec");
        }

        if (newContent.length > 0) {
          actions.push({
            kind: MigrationKind.Content,
            target: node,
            content: `import "${newContent}";`,
          });
        }
      } else if (
        node.kind === compilerV40.SyntaxKind.UsingStatement &&
        node.name !== undefined &&
        node.name.kind === compilerV40.SyntaxKind.MemberExpression
      ) {
        if (node.name.id.sv === "DPG") {
          actions.push({
            kind: MigrationKind.Content,
            target: node.name,
            content: `Azure.ClientGenerator.Core`,
          });
        }

        if (
          node.name.base !== undefined &&
          node.name.base.kind === compilerV40.SyntaxKind.Identifier &&
          node.name.base.sv === "Cadl"
        ) {
          actions.push({
            kind: MigrationKind.Content,
            target: node.name.base,
            content: `TypeSpec`,
          });
        }
      }
    });
    return actions;
  },
});

export const renameCadlFileNames = createFileRenameMigration({
  name: "Rename cadl file names",
  kind: MigrationKind.FileRename,
  migrate: (fileNames: string[]) => {
    const actions: Array<FileRenameAction> = [];
    for (let i = 0; i < fileNames.length; i++) {
      let toName: string | undefined = undefined;
      const pathOnly = path.dirname(fileNames[i]);
      const fileName = path.basename(fileNames[i]);

      if (fileName === "cadl-project.yaml") {
        toName = "tspconfig.yaml";
      }
      if (getAnyExtensionFromPath(fileName) === ".cadl") {
        toName = fileName.slice(0, fileName.lastIndexOf(".")) + ".tsp";
      }

      if (toName !== undefined) {
        actions.push({
          kind: MigrationKind.FileRename,
          sourceFileName: fileNames[i],
          targetFileName: path.join(pathOnly, toName),
        });
      }
    }
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
