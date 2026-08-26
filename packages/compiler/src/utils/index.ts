// ---------------------------------------
// Exports for `@typespec/compiler/utils`.
// Be explicit about what get exported so we don't export utils that are not meant to be public.
// ---------------------------------------
export { createPerfReporter, perf } from "../core/perf.js";
export { DuplicateTracker } from "./duplicate-tracker.js";
// eslint-disable-next-line @typescript-eslint/no-deprecated
export { Queue, TwoLevelMap, createRekeyableMap, deepClone, deepEquals } from "./misc.js";
export { useStateMap, useStateSet } from "./state-accessor.js";
