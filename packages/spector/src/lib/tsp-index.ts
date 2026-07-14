import type { TypeSpecSpectorDecorators } from "../../generated-defs/TypeSpec.Spector.js";
import { $scenario, $scenarioDoc, $scenarioService, $surfaceDoc } from "./decorators.js";
export { $lib } from "./lib.js";
export { $onValidate } from "./validate.js";

/** @internal */
export const $decorators = {
  "TypeSpec.Spector": {
    scenario: $scenario,
    scenarioDoc: $scenarioDoc,
    scenarioService: $scenarioService,
    surfaceDoc: $surfaceDoc,
  } satisfies TypeSpecSpectorDecorators,
};
