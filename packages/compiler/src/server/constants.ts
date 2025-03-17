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
export const UPDATE_DEBOUNCE_TIME = 200;

export const Commands = {
  APPLY_CODE_FIX: "typespec.applyCodeFix",
};
