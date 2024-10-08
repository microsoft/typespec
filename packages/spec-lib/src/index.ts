export {
  $scenario,
  $scenarioDoc,
  $scenarioService,
  $supportedBy,
  Scenario,
  ScenarioEndpoint,
  SupportedBy,
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
