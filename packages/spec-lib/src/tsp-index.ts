import type { TypeSpecSpecLibDecorators } from "../generated-defs/TypeSpec.SpecLib.js";
import { $scenario, $scenarioDoc, $scenarioService, $supportedBy } from "./decorators.js";
export { $lib } from "./lib.js";

/** @internal */
export const $decorators = {
  "TypeSpec.SpecLib": {
    scenario: $scenario,
    scenarioDoc: $scenarioDoc,
    scenarioService: $scenarioService,
    supportedBy: $supportedBy,
  } satisfies TypeSpecSpecLibDecorators,
};
