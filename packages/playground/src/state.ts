import { Program } from "@typespec/compiler";
import { atom } from "recoil";
import { PlaygroundManifest } from "./manifest.js";

export type CompilationCrashed = {
  readonly internalCompilerError: any;
};

export type CompileResult = {
  readonly program: Program;
  readonly outputFiles: string[];
};
export type CompilationState = CompileResult | CompilationCrashed;

export const compilationState = atom<CompilationState | undefined>({
  key: "compile",
  default: undefined,
});
export const emittersOptionsState = atom<Record<string, Record<string, unknown>>>({
  key: "emitterOptions",
  default: {},
});

export const selectedEmitterState = atom({
  key: "selectedEmitter",
  default: PlaygroundManifest.defaultEmitter,
});
