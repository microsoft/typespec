import { NodePackage, TextRange } from "@typespec/compiler";
import { TypeSpecCompilers } from "./migration-config.js";

/** Defines the configuration dictionary  */
export interface MigrationStepsDictionary {
  [key: string]: Migration[];
}

/** This is the list of supported migration steps */
export enum MigrationKind {
  AstContentMigration,
  FileContentMigration,
  FileRename,
  PackageVersionUpdate,
}

/** Defines all migration actions */
export type MigrateAction =
  | AstContentMigrateAction
  | FileContentMigrationAction
  | FileRenameAction
  | PackageVersionUpdateAction;

/** Defines all migration functions that can be implemented by version specific migration functions.
 * These functions should return corresponding array migration actions to be performed.*/
export type Migration =
  | AstContentMigration<TypeSpecCompilerVersion>
  | FileContentMigration
  | FileRenameMigration
  | PackageVersionUpdateMigration;

/** Type of imported versions of tsp compilers defined in migration-config.ts. */
export type TypeSpecCompiler = TypeSpecCompilers[keyof TypeSpecCompilers];

/** Key type of all compiler versions defined in migration-config.ts. */
export type TypeSpecCompilerVersion = keyof TypeSpecCompilers;

/** Migration Context type that contains some helper functions */
export interface MigrationContext {
  /**
   * Print the text range as it is.
   */
  printNode(node: TextRange): string;

  /**
   * Print the entire text range from teh first node to the last.(Including anything in between the nodes.)
   */
  printNodes(node: readonly TextRange[]): string;
}

export interface MigrationBase {
  name: string;
  kind: MigrationKind;
}

/** ContentMigration interface definition. */
export interface AstContentMigration<TFrom extends TypeSpecCompilerVersion> extends MigrationBase {
  kind: MigrationKind.AstContentMigration;

  /**
   * Compiler version.
   */
  from: TFrom;

  /**
   * Target version
   */
  to: TypeSpecCompilerVersion;

  /**
   * Migrate logic.
   * @param compilerInstance Instance of the compiler at the `from` version.
   * @param script TypeSpec Script source node.
   */
  migrate(
    context: MigrationContext,
    compilerInstance: TypeSpecCompilers[TFrom],
    script: unknown
  ): MigrateAction[];
}

export interface FileContentMigration extends MigrationBase {
  kind: MigrationKind.FileContentMigration;

  migrate(fileNames: string[]): Promise<FileContentMigrationAction[]>;
}

/** File Rename migration interface definition. */
export interface FileRenameMigration extends MigrationBase {
  kind: MigrationKind.FileRename;

  migrate(fileNames: string[]): FileRenameAction[];
}

/** Package version update migration interface definition. */
export interface PackageVersionUpdateMigration extends MigrationBase {
  kind: MigrationKind.PackageVersionUpdate;

  migrate(pkg: NodePackage): PackageVersionUpdateAction[];
}

/** Base class for migration actions */
export interface MigrateActionBase {
  kind: MigrationKind;
}

/** Migration action that modifies contents */
export interface AstContentMigrateAction extends MigrateActionBase {
  kind: MigrationKind.AstContentMigration;

  target: TextRange; // TypeSpec  compiler node
  /**
   * Replaced content
   */
  content: string;
}

/** Migration action that renames a file */
export interface FileRenameAction extends MigrateActionBase {
  kind: MigrationKind.FileRename;
  sourceFileName: string;
  targetFileName: string;
}

export interface FileContentMigrationAction extends MigrateActionBase {
  kind: MigrationKind.FileContentMigration;
  fileName: string;
  newContent: string;
}

/** Migration action that updates a package version */
export interface PackageVersionUpdateAction extends MigrateActionBase {
  kind: MigrationKind.PackageVersionUpdate;
  packageName: string;
  renamePackageName?: string;
  toVersion: string;
}

/** Helper functions to define a custom migration function */
export function createContentMigration<TFrom extends TypeSpecCompilerVersion>(
  migration: AstContentMigration<TFrom>
): AstContentMigration<TFrom> {
  return migration;
}

/** Helper functions to define a custom migration function */
export function createFileRenameMigration(migration: FileRenameMigration): FileRenameMigration {
  return migration;
}

/** Helper functions to define a custom migration function */
export function createFileContentMigration(migration: FileContentMigration): FileContentMigration {
  return migration;
}

/** Helper functions to define a custom migration function */
export function createPackageVersionMigration(
  migration: PackageVersionUpdateMigration
): PackageVersionUpdateMigration {
  return migration;
}
