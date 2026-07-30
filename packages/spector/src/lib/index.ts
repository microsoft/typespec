export {
  $scenario,
  $scenarioDoc,
  $scenarioService,
  Scenario,
  ScenarioEndpoint,
  SurfaceDetails,
  SurfaceDoc,
  SurfaceDocTarget,
  buildSurfaceDetails,
  getScenarioDoc,
  getScenarioEndpoints,
  getScenarioName,
  isScenario,
  listScenarioIn,
  listScenarios,
  listSurfaceDocs,
  listSurfaceDocsMissingScenarioDoc,
} from "./decorators.js";
export { $lib, reportDiagnostic } from "./lib.js";
export { $onValidate } from "./validate.js";

/** @internal */
export { $decorators } from "./tsp-index.js";
