/** An error here would mean that the decorator is not exported or doesn't have the right name. */
import { $scenario, $scenarioDoc, $scenarioService } from "@typespec/spec-lib";
import type {
  ScenarioDecorator,
  ScenarioDocDecorator,
  ScenarioServiceDecorator,
} from "./__global__.js";

type Decorators = {
  $scenarioService: ScenarioServiceDecorator;
  $scenario: ScenarioDecorator;
  $scenarioDoc: ScenarioDocDecorator;
};

/** An error here would mean that the exported decorator is not using the same signature. Make sure to have export const $decName: DecNameDecorator = (...) => ... */
const _: Decorators = {
  $scenarioService,
  $scenario,
  $scenarioDoc,
};
