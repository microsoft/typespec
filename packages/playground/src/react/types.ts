import { Program } from "@typespec/compiler";

export type CompilationCrashed = {
  readonly internalCompilerError: any;
};

export type CompileResult = {
  readonly program: Program;
  readonly outputFiles: string[];
};
export type CompilationState = CompileResult | CompilationCrashed;

export type EmitterOptions = Record<string, Record<string, unknown>>;
