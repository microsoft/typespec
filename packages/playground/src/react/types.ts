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
  /** Files emitted */
  readonly outputFiles: string[];
  /** Current viewer state (for viewers that have internal state) */
  readonly viewerState?: Record<string, any>;
  /** Callback to update viewer state */
  readonly onViewerStateChange?: (state: Record<string, any>) => void;
}

export interface ProgramViewer {
  readonly key: string;
  readonly label: string;
  readonly icon: ReactNode;
  readonly render: (props: OutputViewerProps) => ReactNode | null;
}

export interface FileOutputViewer {
  readonly key: string;
  readonly label: string;
  readonly render: (props: FileOutputViewerProps) => ReactNode | null;
}

export interface FileOutputViewerProps {
  readonly filename: string;
  readonly content: string;
}
