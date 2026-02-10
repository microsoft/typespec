import { getEnvironmentVariable } from "../utils/misc.js";

/**
 * Debug areas that can be enabled via TYPESPEC_DEBUG environment variable.
 *
 * Note: We use TYPESPEC_DEBUG instead of DEBUG because the DEBUG environment variable
 * is not supported in VSCode extensions. See: https://github.com/microsoft/vscode/issues/290140
 *
 * Usage: TYPESPEC_DEBUG=server.compile,compile.config
 *
 * Examples:
 *   TYPESPEC_DEBUG=server.compile      - Enable server compilation debug logs
 *   TYPESPEC_DEBUG=*                   - Enable all debug logs
 *   TYPESPEC_DEBUG=server.compile,compile.config - Enable multiple areas
 */
const debugAreas = {
  serverCompile: "server.compile",
  updateManager: "update.manager",
  compileConfig: "compile.config",
} as const;

/**
 * Check if a debug area is enabled via the TYPESPEC_DEBUG environment variable.
 * Supports comma-separated values and wildcards.
 */
function isDebugEnabled(area: string): boolean {
  const debug = getEnvironmentVariable("TYPESPEC_DEBUG");
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
  serverCompile: { enabled: isDebugEnabled(debugAreas.serverCompile) },
  updateManager: { enabled: isDebugEnabled(debugAreas.updateManager) },
  compileConfig: { enabled: isDebugEnabled(debugAreas.compileConfig) },
} as const;
