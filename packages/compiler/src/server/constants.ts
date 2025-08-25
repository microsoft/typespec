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
 *
 * From AI as below, let's start from 1s and see whether further improvement is needed
 *  - If users tend to type in short bursts and pause, a 1–1.5s debounce will catch those pauses effectively.
 *  - If they type continuously for longer periods, consider a throttle mechanism or manual trigger (e.g., "Run" button).
 *
 * TODO: have a spin for compiling with parallel
 */
export const UPDATE_DEBOUNCE_TIME = 1000;
/**
 * Maximum number of parallel compilations for update at once.
 */
export const UPDATE_PARALLEL_LIMIT = 2;

export const Commands = {
  APPLY_CODE_FIX: "typespec.applyCodeFix",
};
