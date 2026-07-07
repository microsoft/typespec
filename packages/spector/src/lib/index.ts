export {
  $scenario,
  $scenarioDoc,
  $scenarioService,
  $surfaceDoc,
  getScenarioDoc,
  getScenarioEndpoints,
  getScenarioName,
  getSurfaceChecks,
  isScenario,
  listScenarioIn,
  listScenarios,
  listSurfaceDocs,
  Scenario,
  ScenarioEndpoint,
  SurfaceCheck,
  SurfaceDoc,
  SurfaceDocTarget,
} from "./decorators.js";
export { $lib, reportDiagnostic } from "./lib.js";
export { $onValidate } from "./validate.js";

/** @internal */
export { $decorators } from "./tsp-index.js";
