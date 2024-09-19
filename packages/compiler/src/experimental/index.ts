import { createConsoleSink } from "../core/logger/console-sink.js";
import { createLogger } from "../core/logger/logger.js";

const logSink = createConsoleSink({ pretty: true });
const logger = createLogger({ sink: logSink, level: "warning" });
logger.warn(
  "Functionality from @typespec/compiler/experimental is highly likely to change or be removed.",
);

export {
  MutableType as unsafe_MutableType,
  mutateSubgraph as unsafe_mutateSubgraph,
  Mutator as unsafe_Mutator,
  MutatorFilterFn as unsafe_MutatorFilterFn,
  MutatorFlow as unsafe_MutatorFlow,
  MutatorFn as unsafe_MutatorFn,
  MutatorRecord as unsafe_MutatorRecord,
  MutatorReplaceFn as unsafe_MutatorReplaceFn,
} from "./mutators.js";
export { Realm as unsafe_Realm } from "./realm.js";
export { unsafe_useStateMap, unsafe_useStateSet } from "./state-accessor.js";
export { $ as unsafe_$ } from "./typekit/index.js";
