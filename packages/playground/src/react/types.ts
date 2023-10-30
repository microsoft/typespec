import { Program, TypeSpecLibrary } from "@typespec/compiler";
import { ReactElement } from "react";

export type CompilationCrashed = {
  readonly internalCompilerError: any;
};

export type CompileResult = {
  readonly program: Program;
  readonly outputFiles: string[];
};
export type CompilationState = CompileResult | CompilationCrashed;

export type EmitterOptions = Record<string, Record<string, unknown>>;

export interface FileOutputViewer {
  key: string;
  label: string;
  render: (props: ViewerProps) => ReactElement<any, any> | null;
}

export interface ViewerProps {
  filename: string;
  content: string;
}

export interface PlaygroundTspLibrary {
  name: string;
  isEmitter: boolean;
  definition?: TypeSpecLibrary<any>;
}
