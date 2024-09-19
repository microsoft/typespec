import { createConsoleSink } from "../core/logger/console-sink.js";
import { createLogger } from "../core/logger/logger.js";

const logSink = createConsoleSink({ pretty: true });
const logger = createLogger({ sink: logSink, level: "warning" });
logger.warn(
  "Functionality from @typespec/compiler/experimental is highly likely to change or be removed.",
);

export {
  MutableType,
  mutateSubgraph,
  Mutator,
  MutatorFilterFn,
  MutatorFlow,
  MutatorFn,
  MutatorRecord,
  MutatorReplaceFn,
} from "./mutators.js";
export { Realm } from "./realm.js";
export { unsafe_useStateMap, unsafe_useStateSet } from "./state-accessor.js";
export { $ } from "./typekit/index.js";
