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

/** Program and output supplied when rendering a program viewer inside the playground. */
export interface OutputViewerProps {
  /** Compiler program for the displayed compilation, including its host and diagnostics. */
  readonly program: Program;
  /**
   * Output names under `tsp-output`, potentially retained from the previous successful compilation.
   * Currently, top-level names are `file.json` and nested names include a leading slash, such as
   * `/folder/file.json`. These are output identifiers, not absolute filesystem paths; read them
   * through `program.host.readFile("./tsp-output/" + name)` rather than resolving the names as paths.
   */
  readonly outputFiles: string[];
  /** Playground-owned state shared with program viewers; the playground supplies `{}` when no state is stored. */
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
  /**
   * Selected output name using the representation in {@link OutputViewerProps.outputFiles}:
   * `file.json` for a top-level file or `/folder/file.json` for a nested file.
   * A leading slash here does not identify an absolute filesystem path.
   */
  readonly filename: string;
  /** File text read from the compilation host. */
  readonly content: string;
  /** Line numbers to highlight as changed (1-based). */
  readonly changedLineNumbers?: number[];
}
