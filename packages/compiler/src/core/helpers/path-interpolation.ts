const VariableInterpolationRegex = /{([a-zA-Z-_.]+)}(\/|\.?)/g;

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
