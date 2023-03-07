import { getAnyExtensionFromPath, NodePackage } from "@typespec/compiler";
import type { CadlScriptNode } from "@typespec/compiler-v0.37";
import * as path from "path";
import type { TypeSpecCompilerV0_38 } from "../../migration-config.js";
import {
  createContentMigration,
  createFileRenameMigration,
  createPackageVersionMigration,
  fileRenameAction,
  MigrationContext,
  MigrationKind,
  packageVersionUpdateAction,
} from "../../migration-types.js";

export const updatePackageVersion = createPackageVersionMigration({
  name: "Update package version",
  kind: MigrationKind.PackageVersionUpdate,
  migrate: (pkg: NodePackage) => {
    const actions: Array<packageVersionUpdateAction> = [];

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

export const renameCadlFileNames = createFileRenameMigration({
  name: "Rename cadl file names",
  kind: MigrationKind.FileRename,
  migrate: (fileNames: string[]) => {
    const actions: Array<fileRenameAction> = [];
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
