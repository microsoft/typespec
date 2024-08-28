export * from "./mutators.js";
export * from "./realm.js";

import { createConsoleSink } from "../core/logger/console-sink.js";
import { createLogger } from "../core/logger/logger.js";

const logSink = createConsoleSink({ pretty: true });
const logger = createLogger({ sink: logSink, level: "warning" });
logger.warn(
  "Functionality from @typespec/compiler/experimental is highly likely to change or be removed."
);
