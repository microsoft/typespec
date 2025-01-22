export {
  MutableType as unsafe_MutableType,
  mutateSubgraph as unsafe_mutateSubgraph,
  mutateSubgraphWithNamespace as unsafe_mutateSubgraphWithNamespace,
  Mutator as unsafe_Mutator,
  MutatorFilterFn as unsafe_MutatorFilterFn,
  MutatorFlow as unsafe_MutatorFlow,
  MutatorFn as unsafe_MutatorFn,
  MutatorRecord as unsafe_MutatorRecord,
  MutatorReplaceFn as unsafe_MutatorReplaceFn,
  MutatorWithNamespace as unsafe_MutatorWithNamespace,
} from "./mutators.js";
export { Realm as unsafe_Realm } from "./realm.js";
export { $ as unsafe_$ } from "./typekit/index.js";

import { useStateMap, useStateSet } from "../utils/state-accessor.js";

/** @deprecated use `useStateMap` from `@typespec/compiler/utils` instead */
export const unsafe_useStateMap = useStateMap;
/** @deprecated use `useStateSet` from `@typespec/compiler/utils` instead */
export const unsafe_useStateSet = useStateSet;
