// ---------------------------------------
// Exports for `@typespec/compiler/utils`.
// Be explicit about what get exported so we don't export utils that are not meant to be public.
// ---------------------------------------
export { DuplicateTracker } from "./duplicate-tracker.js";
export { Queue, TwoLevelMap, createRekeyableMap, deepClone, deepEquals } from "./misc.js";
