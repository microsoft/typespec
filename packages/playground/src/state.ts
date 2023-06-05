import { Program } from "@typespec/compiler";
import { atom } from "recoil";

export type CompilationCrashed = {
  readonly internalCompilerError: any;
};

export type CompileResult = {
  readonly program: Program;
  readonly outputFiles: string[];
};
export type CompilationState = CompileResult | CompilationCrashed;

export type EmitterOptions = Record<string, Record<string, unknown>>;

export const compilationState = atom<CompilationState | undefined>({
  key: "compile",
  default: undefined,
});

export const selectedSampleState = atom<string | undefined>({
  key: "selectedSampleState",
  default: undefined,
});
