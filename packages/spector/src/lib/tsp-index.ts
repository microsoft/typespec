import type { TypeSpecSpectorDecorators } from "../../generated-defs/TypeSpec.Spector.js";
import { $scenario, $scenarioDoc, $scenarioService, $scenarioTier } from "./decorators.js";
export { $lib } from "./lib.js";

/** @internal */
export const $decorators = {
  "TypeSpec.Spector": {
    scenario: $scenario,
    scenarioDoc: $scenarioDoc,
    scenarioService: $scenarioService,
    scenarioTier: $scenarioTier,
  } satisfies TypeSpecSpectorDecorators,
};
