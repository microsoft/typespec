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

  /**
   * Emitters this sample is compatible with.
   * Entries can be emitter tags (e.g. "http", "schema", "grpc") or exact package names.
   * When filtering the sample gallery by emitter, a sample matches if any entry
   * matches the emitter's tags or package name.
   */
  compatibleEmitters?: string[];
}

export interface PlaygroundTspLibrary {
  name: string;
  packageJson: PackageJson;
  isEmitter: boolean;
  /** Tags describing the emitter category (e.g. "http", "schema", "grpc"). */
  emitterTags: string[];
  definition?: TypeSpecLibrary<any>;
  linter?: LinterDefinition;
}

export interface BrowserHost extends CompilerHost {
  compiler: typeof import("@typespec/compiler");
  libraries: Record<string, PlaygroundTspLibrary>;
}
