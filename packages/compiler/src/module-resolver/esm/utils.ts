export interface Context {
  readonly importSpecifier: string;
  readonly pkgJsonPath: string;
  readonly packageUrl: URL;
  readonly moduleDirs: readonly string[];
  readonly conditions: readonly string[];

  /** Non standard option. Do not respect the default condition. */
  readonly ignoreDefaultCondition?: boolean;
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

export class NoMatchingConditionsError extends InvalidPackageTargetError {
  constructor(context: Context) {
    super(context, `No conditions matched`);
  }
}

export function isUrl(str: string) {
  try {
    return !!new URL(str);
  } catch (_) {
    return false;
  }
}
