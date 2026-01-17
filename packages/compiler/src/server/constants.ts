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
 * Usage: DEBUG=typespec:server_compile,typespec:compile_config
 */
export const DebugAreas = {
  SERVER_COMPILE: "typespec:server_compile",
  UPDATE_MANAGER: "typespec:update_manager",
  COMPILE_CONFIG: "typespec:compile_config",
} as const;

/**
 * Check if a debug area is enabled via the DEBUG environment variable.
 * Supports Node.js DEBUG pattern with wildcards and comma-separated values.
 * Examples:
 *   DEBUG=typespec:server_compile
 *   DEBUG=typespec:*
 *   DEBUG=typespec:server_compile,typespec:compile_config
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
