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
  type?: "module" | "commonjs";
  main?: string;
  tspMain?: string;
  homepage?: string;
  bugs?: {
    url?: string;
    email?: string;
  };
  /**
   * Subpath exports to define entry points of the package.
   * [Read more.](https://nodejs.org/api/packages.html#subpath-exports)
   */
  exports?: Exports | null;
  private?: boolean;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

/**
 * Entry points of a module, optionally with conditions and subpath exports.
 */
export type Exports = string | Array<string | ExportConditions> | ExportConditions;

/**
	A mapping of conditions and the paths to which they resolve.
	*/
type ExportConditions = {
  [condition: string]: Exports;
};
