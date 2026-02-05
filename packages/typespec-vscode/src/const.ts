export const StartFileName = "main.tsp";
export const TspConfigFileName = "tspconfig.yaml";
export const EmptyGuid = "00000000-0000-0000-0000-000000000000";

/**
 * Debug logger for Language Model operations.
 * Can be enabled via TYPESPEC_DEBUG environment variable.
 * Usage: TYPESPEC_DEBUG=typespec:lm
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
  lm: { enabled: isDebugEnabled("typespec:lm") },
} as const;
