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

  /** Package-manager name and version recorded by the project, such as `pnpm@10.0.0`. */
  packageManager?: string;
  /** Development-environment requirements and mismatch policies recorded in the manifest. */
  devEngines?: DevEngines;
  /** Default module interpretation for JavaScript files in the package. */
  type?: "module" | "commonjs";
  /** Legacy JavaScript entry point relative to the package root. */
  main?: string;
  /** TypeSpec entry point relative to the package root. */
  tspMain?: string;
  /** URL of the package's home page. */
  homepage?: string;
  /** Locations where package users can report issues. */
  bugs?: {
    /** Issue tracker URL. */
    url?: string;
    /** Email address for issue reports. */
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
  /** Whether the package is marked as non-publishable. */
  private?: boolean;
  /** Runtime dependency names mapped to package version ranges or other dependency specifiers. */
  dependencies?: Record<string, string>;
  /** Compatible dependency versions expected to be supplied by the consuming project. */
  peerDependencies?: Record<string, string>;
  /** Dependencies used to develop, build, or test this package. */
  devDependencies?: Record<string, string>;
  /** Source repository location, either as a shorthand string or structured metadata. */
  repository?: string | Repository;
}

/**
 * Specify the place where your code lives.
 * @see https://yarnpkg.com/en/docs/package-json#toc-repository
 * @see https://docs.npmjs.com/files/package.json#repository
 */
export interface Repository {
  /** Package directory within the repository, for a package maintained in a monorepo. */
  directory?: string;
  /** Version-control system, commonly `"git"`. */
  type: string;
  /** Repository clone URL. */
  url: string;
}
/**
 * Entry points of a module, optionally with conditions and subpath imports.
 */
export type Imports = {
  /** Map a private import specifier or pattern to a target or conditional target map. */
  [path: string]: string | ImportConditions;
};

/**
 * A mapping of conditions and the paths to which they resolve.
 */
type ImportConditions = {
  /** Select a target or nested condition map for a matching import condition. */
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
  /** Map an export condition or subpath to its entry point, nested alternatives, or fallbacks. */
  [condition: string]: Exports;
};

/** Toolchain and platform requirements declared for developers working on a package. */
export interface DevEngines {
  /** Required package-manager identity and version. */
  packageManager?: DevEngineDependency;
  /** Expected CPU architecture for development. */
  cpu?: DevEngineDependency;
  /** Expected operating system for development. */
  os?: DevEngineDependency;
  /** Expected C standard library for development. */
  libc?: DevEngineDependency;
  /** Required runtime identity and version, such as Node.js. */
  runtime?: DevEngineDependency;
}

/** One development-environment requirement and the requested response to a mismatch. */
export interface DevEngineDependency {
  /** Tool or platform identifier whose compatibility is required. */
  name: string;
  /** Required version or version range. */
  version: string;
  /** Requested mismatch handling; omitted values leave the package manager's default policy in effect. */
  onFail?: "ignore" | "warn" | "error";
}
