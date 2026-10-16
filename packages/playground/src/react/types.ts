import type { DiagnosticTarget, Program } from "@typespec/compiler";
import type { ReactNode } from "react";

/** Compilation failed with an exception rather than returning a program with diagnostics. */
export type CompilationCrashed = {
  /** Original thrown value, retained for error reporting. */
  readonly internalCompilerError: any;
};

/** A returned compiler program and the emitted files available for viewing. */
export type CompileResult = {
  /** Compiled program, which may still contain error diagnostics. */
  readonly program: Program;
  /**
   * Output names under `tsp-output`; the playground may preserve earlier output during transient errors.
   * Currently, top-level names are `file.json` and nested names include a leading slash, such as
   * `/folder/file.json`. These are output identifiers, not absolute filesystem paths; read them
   * through `program.host.readFile("./tsp-output/" + name)` rather than resolving the names as paths.
   */
  readonly outputFiles: string[];
};
/** Distinguish an exception from a returned program by checking for `internalCompilerError`. */
export type CompilationState = CompileResult | CompilationCrashed;

/** Emitter-specific compiler options keyed first by emitter package name, then by option name. */
export type EmitterOptions = Record<string, Record<string, unknown>>;

export interface OutputViewerProps {
  readonly program: Program;
  /** Files emitted */
  readonly outputFiles: string[];
  /** Current viewer state (for viewers that have internal state) */
  readonly viewerState?: Record<string, any>;
  /** Callback to update viewer state */
  readonly onViewerStateChange?: (state: Record<string, any>) => void;
  /** Reveal in the editor where the given target is declared. */
  readonly onRevealSource?: (target: DiagnosticTarget) => void;
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
  /** Line numbers to highlight as changed (1-based). */
  readonly changedLineNumbers?: number[];
}
