import type { DiagnosticTarget, Program } from "@typespec/compiler";
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

/** Program and output supplied when rendering a program viewer inside the playground. */
export interface OutputViewerProps {
  /** Compiler program for the displayed compilation, including its host and diagnostics. */
  readonly program: Program;
  /** Emitted paths relative to `tsp-output`, potentially retained from the previous successful compilation. */
  readonly outputFiles: string[];
  /** Playground-owned state shared with program viewers; omitted if no state was supplied. */
  readonly viewerState?: Record<string, any>;
  /** Request replacement of the viewer-state record; merge any entries that should be retained. */
  readonly onViewerStateChange?: (state: Record<string, any>) => void;
  /** Reveal in the editor where the given target is declared. */
  readonly onRevealSource?: (target: DiagnosticTarget) => void;
}

/** Custom program-level view added to the playground's output tabs. */
export interface ProgramViewer {
  /** Stable tab identifier; a matching key replaces a built-in or earlier custom viewer. */
  readonly key: string;
  /** Accessible tab label shown as the icon's tooltip. */
  readonly label: string;
  /** Content displayed in the viewer's tab. */
  readonly icon: ReactNode;
  /** React renderer for the selected view; return null to display no content. */
  readonly render: (props: OutputViewerProps) => ReactNode | null;
}

/** Alternate rendering of a single emitted file, configured per emitter on the playground. */
export interface FileOutputViewer {
  /** Stable identifier in the file-view selector; matching keys replace earlier viewers. */
  readonly key: string;
  /** Display text in the file-view selector. */
  readonly label: string;
  /** Render the selected file's text; return null to display no content. */
  readonly render: (props: FileOutputViewerProps) => ReactNode | null;
}

/** Text and location of the emitted file selected in the output explorer. */
export interface FileOutputViewerProps {
  /** Selected output path relative to `tsp-output`. */
  readonly filename: string;
  /** File text read from the compilation host. */
  readonly content: string;
  /** Line numbers to highlight as changed (1-based). */
  readonly changedLineNumbers?: number[];
}
