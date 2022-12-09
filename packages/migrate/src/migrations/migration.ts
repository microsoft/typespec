import { TextRange } from "@cadl-lang/compiler";

export type MigrationKind = "Syntax";

// Update here before release.
export type CadlCompilerCurrent = typeof import("@cadl-lang/compiler");
export type CadlCompilerV0_38 = CadlCompilerCurrent;
export type CadlCompilerV0_37 = typeof import("@cadl-lang/compiler-v0.37");

export type CadlCompilers = {
  "0.37": CadlCompilerV0_37;
  "0.38": CadlCompilerV0_38;
};

export type CadlCompiler = CadlCompilers[keyof CadlCompilers];
export type CadlCompilerVersion = keyof CadlCompilers;

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

export interface Migration<TFrom extends CadlCompilerVersion> {
  name: string;
  kind: "Syntax";
  /**
   * Compiler version.
   */
  from: TFrom;

  /**
   * Target version
   */
  to: CadlCompilerVersion;

  /**
   * Migrate logic.
   * @param compilerInstance Instance of the compiler at the `from` version.
   * @param script Cadl Script source node.
   */
  migrate(
    context: MigrationContext,
    compilerInstance: CadlCompilers[TFrom],
    script: unknown
  ): MigrateAction[];
}

export interface MigrateAction {
  target: TextRange; // Cadl  compiler node
  /**
   * Replaced content
   */
  content: string;
}

export function createMigration<TFrom extends CadlCompilerVersion>(
  migration: Migration<TFrom>
): Migration<TFrom> {
  return migration;
}
