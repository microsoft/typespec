export interface EsmResolutionContext {
  /** Original import specifier */
  readonly specifier: string;

  /** URL of the current package */
  readonly packageUrl: string;

  /**
   * List of condition to match
   * @example `["import", "require"]`
   */
  readonly conditions: readonly string[];

  /**
   * Folders where modules exist that are banned from being used in exports.
   * @example `["node_modules"]`
   */
  readonly moduleDirs: readonly string[];

  resolveId(id: string, baseDir: string | URL): any;

  /** Non standard option. Do not respect the default condition. */
  readonly ignoreDefaultCondition?: boolean;
}

function createBaseErrorMsg(importSpecifier: string) {
  return `Could not resolve import "${importSpecifier}" `;
}

function createErrorMsg(context: EsmResolutionContext, reason?: string, isImports?: boolean) {
  const { specifier, packageUrl } = context;
  const base = createBaseErrorMsg(specifier);
  const field = isImports ? "imports" : "exports";
  return `${base} using ${field} defined in ${packageUrl}.${reason ? ` ${reason}` : ""}`;
}

export class EsmResolveError extends Error {}

export class InvalidConfigurationError extends EsmResolveError {
  constructor(context: EsmResolutionContext, reason?: string) {
    super(createErrorMsg(context, `Invalid "exports" field. ${reason}`));
  }
}

export class InvalidModuleSpecifierError extends EsmResolveError {
  constructor(context: EsmResolutionContext, isImports?: boolean, reason?: string) {
    super(createErrorMsg(context, reason, isImports));
  }
}

export class InvalidPackageTargetError extends EsmResolveError {
  constructor(context: EsmResolutionContext, reason?: string) {
    super(createErrorMsg(context, reason));
  }
}

export class NoMatchingConditionsError extends InvalidPackageTargetError {
  constructor(context: EsmResolutionContext) {
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
