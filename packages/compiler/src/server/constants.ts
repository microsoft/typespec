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
 * Environment variables to enable some logging when needed
 */
export const ENABLE_SERVER_COMPILE_LOGGING = "ENABLE_SERVER_COMPILE_LOGGING";
export const ENABLE_UPDATE_MANAGER_LOGGING = "ENABLE_UPDATE_MANAGER_LOGGING";
