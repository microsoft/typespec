/**
 * Type for package.json https://docs.npmjs.com/cli/configuring-npm/package-json
 */
export interface PackageJson {
  /** Package name */
  name: string;
  /** Package version */
  version?: string;
  /** Package description */
  description?: string;

  packageManager?: string;
  devEngines?: DevEngines;
  type?: "module" | "commonjs";
  main?: string;
  tspMain?: string;
  homepage?: string;
  bugs?: {
    url?: string;
    email?: string;
  };
  /**
   * Subpath imports to define private mappings for imports within the package itself.
   * [Read more.](https://nodejs.org/api/packages.html#subpath-imports)
   */
  imports?: Imports | null;
  /**
   * Subpath exports to define entry points of the package.
   * [Read more.](https://nodejs.org/api/packages.html#subpath-exports)
   */
  exports?: Exports | null;
  private?: boolean;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  repository?: string | Repository;
}

/**
 * @see https://yarnpkg.com/en/docs/package-json#toc-repository
 * @see https://docs.npmjs.com/files/package.json#repository
 */
export interface Repository {
  directory?: string;
  type: string;
  url: string;
}
/**
 * Entry points of a module, optionally with conditions and subpath imports.
 */
export type Imports = {
  [path: string]: string | ImportConditions;
};

/**
 * A mapping of conditions and the paths to which they resolve.
 */
type ImportConditions = {
  [condition: string]: string | ImportConditions;
};

/**
 * Entry points of a module, optionally with conditions and subpath exports.
 */
export type Exports = string | Array<string | ExportConditions> | ExportConditions;

/**
 * A mapping of conditions and the paths to which they resolve.
 */
type ExportConditions = {
  [condition: string]: Exports;
};

export interface DevEngines {
  packageManager?: DevEngineDependency;
  cpu?: DevEngineDependency;
  os?: DevEngineDependency;
  libc?: DevEngineDependency;
  runtime?: DevEngineDependency;
}

export interface DevEngineDependency {
  name: string;
  version: string;
  onFail?: "ignore" | "warn" | "error";
}
