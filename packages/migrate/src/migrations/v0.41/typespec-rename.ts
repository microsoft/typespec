import type { Node, TypeSpecScriptNode } from "@typespec/compiler";
import { NodePackage, getAnyExtensionFromPath } from "@typespec/compiler";
import { readFile } from "fs/promises";
import * as yaml from "js-yaml";
import * as path from "path";
import type { TypeSpecCompilerV0_40 } from "../../migration-config.js";
import {
  AstContentMigrateAction,
  FileContentMigrationAction,
  FileRenameAction,
  MigrationContext,
  MigrationKind,
  PackageVersionUpdateAction,
  createContentMigration,
  createFileContentMigration,
  createFileRenameMigration,
  createPackageVersionMigration,
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
  kind: MigrationKind.AstContentMigration,
  from: "0.40.0",
  to: "0.41.0",
  migrate: (
    { printNode, printNodes }: MigrationContext,
    compilerV40: TypeSpecCompilerV0_40,
    root: TypeSpecScriptNode
  ) => {
    const actions: AstContentMigrateAction[] = [];
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
            kind: MigrationKind.AstContentMigration,
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
            kind: MigrationKind.AstContentMigration,
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
            kind: MigrationKind.AstContentMigration,
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

export const migrateTspConfigFile = createFileContentMigration({
  name: "Migrate cadl-project.yaml and tspConfig.yaml",
  kind: MigrationKind.FileContentMigration,
  migrate: async (fileNames: string[]) => {
    // Old cadl-project.yaml file would have been migrated already.
    // So we only need to deal with new config file name.
    const TspConfigFileName = "tspconfig.yaml";
    const actions: Array<FileContentMigrationAction> = [];

    for (let i = 0; i < fileNames.length; i++) {
      const fileName = path.basename(fileNames[i]);

      if (fileName === TspConfigFileName) {
        // loading content
        const buffer = await readFile(fileName);
        let content = buffer.toString();

        // replacing cadl with typespec
        const replaceKeys = Object.keys(CadlToTypeSpecReplacement);
        for (const key of replaceKeys) {
          content = content.replace(key, CadlToTypeSpecReplacement[key]);
        }

        // load data & convert to new format if needed to
        let tspConfig: any;
        try {
          tspConfig = yaml.load(content);
          // if config has older deprecated emitters format, convert to new format
          if (tspConfig?.emitters !== undefined) {
            (tspConfig as { emit: Array<string> }).emit = [];
            (tspConfig as { options: Record<string, any> }).options = {};

            // convert each emitters to new emit format
            for (const key in tspConfig.emitters) {
              tspConfig.emit.push(key);
              if (typeof tspConfig.emitters[key] !== "boolean") {
                tspConfig.options[key] = tspConfig.emitters[key];
              }
            }

            // clean up config object for minimal output
            tspConfig.emitters = undefined;
            if (tspConfig.options.length === 0) tspConfig.options = undefined;

            content = yaml.dump(tspConfig);
          }
        } catch (err) {
          console.warn(
            `Failed to load ${fileNames[i]}. File may not have been migrated correctly. Error details: ${err}`
          );
        }

        // Create replacement action
        actions.push({
          kind: MigrationKind.FileContentMigration,
          fileName: fileNames[i],
          newContent: content,
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

const CadlToTypeSpecReplacement: { [key: string]: string } = {
  "@cadl-lang/": "@typespec/",
  "@azure-tools/cadl-": "@azure-tools/typespec-",
};
