export {
  $scenario,
  $scenarioDoc,
  $scenarioService,
  Scenario,
  ScenarioEndpoint,
  getScenarioDoc,
  getScenarioEndpoints,
  getScenarioName,
  isScenario,
  listScenarioIn,
  listScenarios,
} from "./decorators.js";
export { $lib, reportDiagnostic } from "./lib.js";
export { $onValidate } from "./validate.js";

/** @internal */
export { $decorators } from "./tsp-index.js";
