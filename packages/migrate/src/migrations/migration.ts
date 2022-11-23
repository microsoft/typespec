import { TextRange } from "@cadl-lang/compiler";

export type MigrationKind = "Syntax";

export type CadlCompilerVersion = "0.38" | "0.37";

export type CadlCompilerV0_38 = typeof import("@cadl-lang/compiler");
export type CadlCompilerV0_37 = typeof import("@cadl-lang/compiler-v0.36");

export type CadlCompiler = CadlCompilerV0_38 | CadlCompilerV0_37;

export interface MigrationContext {
  printNode(node: TextRange): string;
  printNodes(node: readonly TextRange[]): string;
}

export interface Migration<TCompiler extends CadlCompiler> {
  name: string;
  kind: "Syntax";
  /**
   * Compiler version.
   */
  from: CadlCompilerVersion;

  /**
   * Target version
   */
  to: CadlCompilerVersion;

  /**
   * Migrate logic.
   * @param compilerInstance Instance of the compiler at the `from` version.
   * @param script Cadl Script source node.
   */
  migrate(context: MigrationContext, compilerInstance: TCompiler, script: unknown): MigrateAction[];
}

export interface MigrateAction {
  target: TextRange; // Cadl  compiler node
  /**
   * Replaced content
   */
  content: string;
}

export function createMigration<TCompiler extends CadlCompiler>(
  migration: Migration<TCompiler>
): Migration<any> {
  return migration;
}
