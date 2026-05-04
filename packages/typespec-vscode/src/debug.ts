/**
 * Debug logger for Language Model operations.
 * Can be enabled via TYPESPEC_DEBUG environment variable.
 *
 * Note: We use TYPESPEC_DEBUG instead of DEBUG because the DEBUG environment variable
 * is not supported in VSCode extensions. See: https://github.com/microsoft/vscode/issues/290140
 *
 * Usage: TYPESPEC_DEBUG=lm
 *
 * Examples:
 *   TYPESPEC_DEBUG=lm                   - Enable Language Model debug logs
 *   TYPESPEC_DEBUG=*                    - Enable all debug logs
 */
function isDebugEnabled(area: string): boolean {
  const debug = process.env.TYPESPEC_DEBUG;
  if (!debug) {
    return false;
  }

  const areas = debug.split(",").map((a) => a.trim());

  return areas.some((pattern) => {
    // Exact match
    if (pattern === area) {
      return true;
    }

    // Wildcard pattern matching
    if (pattern.includes("*")) {
      const regexPattern = pattern.replace(/\*/g, ".*");
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(area);
    }

    return false;
  });
}

export const debugLoggers = {
  lm: { enabled: isDebugEnabled("lm") },
} as const;
