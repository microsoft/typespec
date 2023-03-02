import { TextRange } from "@typespec/compiler";
import { TypeSpecCompilers } from "./migration-config.js";

/** Type of imported versions of tsp compilers */
export type TypeSpecCompiler = TypeSpecCompilers[keyof TypeSpecCompilers];

/** Key type of all compiler versions */
export type TypeSpecCompilerVersion = keyof TypeSpecCompilers;

/** Defines individual config entries that consists list of migration functions */
export interface MigrationSteps<TFrom extends TypeSpecCompilerVersion> {
  [index: number]: Migration<TFrom>;
}

/** Defines the configuration dictionary  */
export interface MigrationStepsDictionary {
  [key: string]: MigrationSteps<TypeSpecCompilerVersion>;
}

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

/** The main */
export interface Migration<TFrom extends TypeSpecCompilerVersion> {
  name: string;
  kind: "Syntax";
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
  ): MigrateActionBase[];
}

/** Base class for migration actions */
export interface MigrateActionBase {}

/** Migration action that modifies contents */
export interface contentMigrateAction extends MigrateActionBase {
  target: TextRange; // TypeSpec  compiler node
  /**
   * Replaced content
   */
  content: string;
}

/** Migration action that renames a file */
export interface fileRenameAction extends MigrateActionBase {
  sourceFileName: string;
  targetFileName: string;
}

/** Migration action that updates a package version */
export interface packageVersionUpdateAction extends MigrateActionBase {
  packageName: string;
  fromVersion: string;
  toVersion: string;
}

/** Helper functions to define a custom migration function */
export function createMigration<TFrom extends TypeSpecCompilerVersion>(
  migration: Migration<TFrom>
): Migration<TFrom> {
  return migration;
}
