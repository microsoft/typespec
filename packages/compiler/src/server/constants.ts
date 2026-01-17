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
 * Debug areas that can be enabled via DEBUG environment variable.
 * Usage: DEBUG=typespec:compile,typespec:config
 */
export const DebugAreas = {
  SERVER_COMPILE: "typespec:compile",
  UPDATE_MANAGER: "typespec:update",
  COMPILE_CONFIG: "typespec:config",
} as const;

/**
 * Check if a debug area is enabled via the DEBUG environment variable.
 * Supports Node.js DEBUG pattern with wildcards and comma-separated values.
 * Examples:
 *   DEBUG=typespec:compile
 *   DEBUG=typespec:*
 *   DEBUG=typespec:compile,typespec:config
 */
export function isDebugEnabled(area: string): boolean {
  const debug = getEnvironmentVariable("DEBUG");
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
