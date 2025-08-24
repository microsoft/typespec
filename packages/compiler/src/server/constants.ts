import { CompilerOptions } from "../core/options.js";

export const serverOptions: CompilerOptions = {
  dryRun: true,
  designTimeBuild: true,
  parseOptions: {
    comments: true,
    docs: true,
  },
};

/**
 * Time in milliseconds to wait after a file change before recompiling.
 */
export const UPDATE_DEBOUNCE_TIME = 1000;
/**
 * Maximum number of parallel compilations at once.
 */
export const UPDATE_PARALLEL_LIMIT = 3;

export const Commands = {
  APPLY_CODE_FIX: "typespec.applyCodeFix",
};
