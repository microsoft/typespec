import { PackageJson } from "../types/package-json.js";

export interface ResolveModuleHost {
  /**
   * Resolve the real path for the current host.
   */
  realpath(path: string): Promise<string>;

  /**
   * Get information about the given path
   */
  stat(path: string): Promise<{ isDirectory(): boolean; isFile(): boolean }>;

  /**
   * Read a utf-8 encoded file.
   */
  readFile(path: string): Promise<string>;
}

export type ModuleResolutionResult = ResolvedFile | ResolvedModule;

export interface ResolvedFile {
  type: "file";
  path: string;
}

export interface ResolvedModule {
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

export interface NodePackage extends PackageJson {
  readonly file: {
    readonly path: string;
    readonly text: string;
  };
}
