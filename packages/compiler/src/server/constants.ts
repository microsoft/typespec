import { CompilerOptions } from "../core/options.js";
import { getEnvironmentVariable } from "../utils/misc.js";

export const serverOptions: CompilerOptions = {
  dryRun: true,
  designTimeBuild: true,
  parseOptions: {
    comments: true,
    docs: true,
  },
};

export const Commands = {
  APPLY_CODE_FIX: "typespec.applyCodeFix",
};

/**
 * Debug areas that can be enabled via TYPESPEC_DEBUG environment variable.
 * Usage: TYPESPEC_DEBUG=typespec:server_compile,typespec:compile_config
 *
 * Examples:
 *   TYPESPEC_DEBUG=typespec:server_compile      - Enable server compilation debug logs
 *   TYPESPEC_DEBUG=typespec:*                   - Enable all typespec debug logs
 *   TYPESPEC_DEBUG=typespec:server_compile,typespec:compile_config - Enable multiple areas
 */
const debugAreas = {
  serverCompile: "typespec:server_compile",
  updateManager: "typespec:update_manager",
  compileConfig: "typespec:compile_config",
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
