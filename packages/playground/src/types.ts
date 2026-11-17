import type {
  CompilerHost,
  CompilerOptions,
  LinterDefinition,
  PackageJson,
  TypeSpecLibrary,
} from "@typespec/compiler";

/** Source and optional compilation settings for a named entry in the sample gallery. */
export interface PlaygroundSample {
  /** Source filename, relative to the sample root when loaded by the build tooling. */
  filename: string;
  /** Emitter selected when this sample's compilation settings are loaded. */
  preferredEmitter?: string;
  /** TypeSpec source copied into the editor when the sample is selected. */
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

/** Metadata for a library available to a browser host, including unloaded deferred emitters. */
export interface PlaygroundTspLibrary {
  /** Package import specifier used as the key in {@link BrowserHost.libraries}. */
  name: string;
  /** Package metadata; deferred emitters initially expose only a name and an empty version. */
  packageJson: PackageJson;
  /** Whether this library can be selected as an emitter. */
  isEmitter: boolean;
  /** Library's exported `$lib`, absent if unavailable or not yet loaded. */
  definition?: TypeSpecLibrary<any>;
  /** Library's exported `$linter`, absent if unavailable or not yet loaded. */
  linter?: LinterDefinition;

  /**
   * Whether the library module has been declared but not imported yet.
   *
   * Deferred emitters are only imported the first time they are used, so their `definition`,
   * `linter` and `packageJson` are placeholders until then.
   */
  deferred?: boolean;
}

/**
 * Compiler host backed by an in-memory filesystem rooted at `/test`.
 * Library files and JavaScript modules are supplied by browser-compatible library bundles.
 */
export interface BrowserHost extends CompilerHost {
  /** Compiler module loaded for this host, which may differ from the application's compiler version. */
  compiler: typeof import("@typespec/compiler");
  /** Libraries keyed by package name; deferred placeholders are replaced when loaded. */
  libraries: Record<string, PlaygroundTspLibrary>;

  /**
   * Import a library that was registered as a deferred emitter and make its files available to the
   * compiler. Resolves immediately for libraries that are already loaded.
   */
  loadLibrary(name: string): Promise<void>;
}
