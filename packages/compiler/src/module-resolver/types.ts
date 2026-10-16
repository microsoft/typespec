import type { PackageJson } from "../types/package-json.js";

/** File-system operations needed to resolve package and file specifiers without loading their code. */
export interface ResolveModuleHost {
  /**
   * Resolve the real path for the current host.
   */
  realpath(path: string): Promise<string>;

  /**
   * Inspect a path without reading its contents.
   * The result's `isDirectory()` and `isFile()` predicates distinguish package directories
   * from candidate entry-point files. Reject with a host error such as `ENOENT` for a missing path.
   */
  stat(path: string): Promise<{
    /** Whether the path identifies a directory. */
    isDirectory(): boolean;
    /** Whether the path identifies a regular file. */
    isFile(): boolean;
  }>;

  /**
   * Read a utf-8 encoded file.
   */
  readFile(path: string): Promise<string>;
}

/** A resolved standalone file or a package entry point together with its package metadata. */
export type ModuleResolutionResult = ResolvedFile | ResolvedModule;

/** A file resolved directly, without an associated package manifest. */
export interface ResolvedFile {
  /** Discriminant for direct-file resolution. */
  type: "file";
  /** Absolute, normalized path to the resolved file. */
  path: string;
}

/** A resolved package entry point, including its root directory and parsed manifest. */
export interface ResolvedModule {
  /** Discriminant for resolution through a package. */
  type: "module";

  /**
   * Root of the package. (Same level as package.json)
   */
  path: string;

  /**
   * Resolved main file for the module.
   */
  mainFile: string;

  /**
   * Value of package.json.
   */
  manifest: PackageJson;
}

/** Parsed package metadata augmented with the package root and original manifest source. */
export interface NodePackage extends PackageJson {
  /** Package root dir(Where package.json is located) */
  readonly dir: string;
  /** Location and unparsed contents of the package's `package.json`. */
  readonly file: {
    /** Absolute path to the manifest file. */
    readonly path: string;
    /** Original manifest text, retained for source diagnostics. */
    readonly text: string;
  };
}
