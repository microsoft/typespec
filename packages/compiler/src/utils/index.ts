// ---------------------------------------
// Exports for `@typespec/compiler/utils`.
// Be explicit about what get exported so we don't export utils that are not meant to be public.
// ---------------------------------------
export {
  DuplicateTracker,
  Queue,
  TwoLevelMap,
  createRekeyableMap,
  deepClone,
  deepEquals,
} from "./util.js";
