import { TextRange } from "@typespec/compiler";

export type MigrationKind = "Syntax";

// Update here before release.
export type TypeSpecCompilerCurrent = typeof import("@typespec/compiler");
export type TypeSpecCompilerV0_38 = TypeSpecCompilerCurrent;
export type TypeSpecCompilerV0_37 = typeof import("@typespec/compiler-v0.37");

export type TypeSpecCompilers = {
  "0.37": TypeSpecCompilerV0_37;
  "0.38": TypeSpecCompilerV0_38;
};

export type TypeSpecCompiler = TypeSpecCompilers[keyof TypeSpecCompilers];
export type TypeSpecCompilerVersion = keyof TypeSpecCompilers;

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
  ): MigrateAction[];
}

export interface MigrateAction {
  target: TextRange; // TypeSpec  compiler node
  /**
   * Replaced content
   */
  content: string;
}

export function createMigration<TFrom extends TypeSpecCompilerVersion>(
  migration: Migration<TFrom>
): Migration<TFrom> {
  return migration;
}
