import type {
  CompilerHost,
  CompilerOptions,
  LinterDefinition,
  PackageJson,
  TypeSpecLibrary,
} from "@typespec/compiler";

export interface PlaygroundSample {
  filename: string;
  preferredEmitter?: string;
  content: string;

  /**
   * A short description of what this sample demonstrates.
   */
  description?: string;

  /**
   * Category for grouping samples in the sample gallery.
   */
  category?: string;

  /**
   * Compiler options for the sample.
   */
  compilerOptions?: CompilerOptions;
}

export interface PlaygroundTspLibrary {
  name: string;
  packageJson: PackageJson;
  isEmitter: boolean;
  definition?: TypeSpecLibrary<any>;
  linter?: LinterDefinition;

  /**
   * Whether the library module has been declared but not imported yet.
   *
   * Deferred emitters are only imported the first time they are used, so their `definition`,
   * `linter` and `packageJson` are placeholders until then.
   */
  deferred?: boolean;
}

export interface BrowserHost extends CompilerHost {
  compiler: typeof import("@typespec/compiler");
  libraries: Record<string, PlaygroundTspLibrary>;

  /**
   * Import a library that was registered as a deferred emitter and make its files available to the
   * compiler. Resolves immediately for libraries that are already loaded.
   */
  loadLibrary(name: string): Promise<void>;
}
