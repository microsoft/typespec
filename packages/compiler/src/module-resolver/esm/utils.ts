export interface ParsedNodeModuleImport {
  readonly packageName: string;
  readonly subPath: string;
}
// returns the imported package name for bare module imports
export function parseNodeModuleImport(id: string): ParsedNodeModuleImport | null {
  if (id.startsWith(".") || id.startsWith("/")) {
    return null;
  }

  const split = id.split("/");

  // @my-scope/my-package/foo.js -> @my-scope/my-package
  // @my-scope/my-package -> @my-scope/my-package
  if (split[0][0] === "@") {
    return { packageName: `${split[0]}/${split[1]}`, subPath: split.slice(2).join("/") };
  }

  // my-package/foo.js -> my-package
  // my-package -> my-package
  return { packageName: split[0], subPath: split.slice(1).join("/") };
}

export interface Context {
  readonly importSpecifier: string;
  readonly pkgJsonPath: string;
  readonly packageUrl: URL;
  readonly moduleDirs: readonly string[];
  readonly conditions: readonly string[];
  resolveId(id: string, baseDir: string | URL): any;
}

function createBaseErrorMsg(importSpecifier: string) {
  return `Could not resolve import "${importSpecifier}" `;
}

function createErrorMsg(context: Context, reason?: string, isImports?: boolean) {
  const { importSpecifier, pkgJsonPath } = context;
  const base = createBaseErrorMsg(importSpecifier);
  const field = isImports ? "imports" : "exports";
  return `${base} using ${field} defined in ${pkgJsonPath}.${reason ? ` ${reason}` : ""}`;
}

export class ResolveError extends Error {}

export class InvalidConfigurationError extends ResolveError {
  constructor(context: Context, reason?: string) {
    super(createErrorMsg(context, `Invalid "exports" field. ${reason}`));
  }
}

export class InvalidModuleSpecifierError extends ResolveError {
  constructor(context: Context, isImports?: boolean, reason?: string) {
    super(createErrorMsg(context, reason, isImports));
  }
}

export class InvalidPackageTargetError extends ResolveError {
  constructor(context: Context, reason?: string) {
    super(createErrorMsg(context, reason));
  }
}
export function isUrl(str: string) {
  try {
    return !!new URL(str);
  } catch (_) {
    return false;
  }
}
