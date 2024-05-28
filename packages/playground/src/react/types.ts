import type { Program } from "@typespec/compiler";
import type { ReactNode } from "react";

export type CompilationCrashed = {
  readonly internalCompilerError: any;
};

export type CompileResult = {
  readonly program: Program;
  readonly outputFiles: string[];
};
export type CompilationState = CompileResult | CompilationCrashed;

export type EmitterOptions = Record<string, Record<string, unknown>>;

export interface OutputViewerProps {
  readonly program: Program;
}

export type OutputViewer = ProgramViewer | FileOutputViewer;

export interface ProgramViewer {
  readonly kind: "program";
  readonly key: string;
  readonly label: string;
  readonly render: (props: OutputViewerProps) => ReactNode | null;
}

export interface FileOutputViewer {
  readonly kind: "file";
  key: string;
  label: string;
  render: (props: FileOutputViewerProps) => ReactNode | null;
}

export interface FileOutputViewerProps {
  filename: string;
  content: string;
}
