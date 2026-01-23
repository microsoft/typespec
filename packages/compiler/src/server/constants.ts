import createDebug from "debug";
import { CompilerOptions } from "../core/options.js";

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
 * Debug loggers for different areas. Can be enabled via DEBUG environment variable.
 * Usage: DEBUG=typespec:server_compile,typespec:compile_config
 *
 * Examples:
 *   DEBUG=typespec:server_compile      - Enable server compilation debug logs
 *   DEBUG=typespec:*                   - Enable all typespec debug logs
 *   DEBUG=typespec:server_compile,typespec:compile_config - Enable multiple areas
 */
export const debugLoggers = {
  serverCompile: createDebug("typespec:server_compile"),
  updateManager: createDebug("typespec:update_manager"),
  compileConfig: createDebug("typespec:compile_config"),
} as const;
