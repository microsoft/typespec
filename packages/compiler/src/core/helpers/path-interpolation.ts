const VariableInterpolationRegex = /{([a-zA-Z-_.]+)}(\/|\.?)/g;

const UnsafePathSegmentCharsRegex = /[/\\:\0]/g;
const OnlyDotsRegex = /^\.+$/;

/**
 * Sanitize a value so it is safe to use as a single segment of a path.
 *
 * Path separators, drive letter separators and NUL are replaced with `_` and values only made of `.`(e.g. `.` or `..`) are replaced with `_`.
 * This prevents values coming from a TypeSpec spec(e.g. a version or a service name) from escaping the directory the file was meant to be written to.
 *
 * @param value Value to sanitize.
 *
 * @example
 * ```ts
 * sanitizePathSegment("2021-10-01-preview"); // "2021-10-01-preview"
 * sanitizePathSegment("../../etc/passwd"); // ".._.._etc_passwd"
 * ```
 */
export function sanitizePathSegment(value: string): string {
  const sanitized = value.replace(UnsafePathSegmentCharsRegex, "_");
  return OnlyDotsRegex.test(sanitized) ? "_" : sanitized;
}

/**
 * Interpolate a path template
 * @param pathTemplate Path template
 * @param predefinedVariables Variables that can be used in the path template.
 * @returns
 */
export function interpolatePath(
  pathTemplate: string,
  predefinedVariables: Record<string, string | undefined>,
): string {
  return pathTemplate.replace(VariableInterpolationRegex, (match, expression, suffix) => {
    const isPathSegment = suffix === "/" || suffix === ".";
    const resolved = resolveExpression(predefinedVariables, expression);
    if (resolved) {
      return isPathSegment ? `${resolved}${suffix}` : resolved;
    }
    return "";
  });
}

function resolveExpression(
  predefinedVariables: Record<string, string | undefined>,
  expression: string,
): string | undefined {
  const segments = expression.split(".");
  let resolved: any = predefinedVariables;
  for (const segment of segments) {
    resolved = resolved[segment];
    if (resolved === undefined) {
      return undefined;
    }
  }

  if (typeof resolved === "string") {
    return resolved;
  } else {
    return undefined;
  }
}
