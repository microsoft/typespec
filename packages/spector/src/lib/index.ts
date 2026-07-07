export {
  $scenario,
  $scenarioDoc,
  $scenarioService,
  $surfaceDoc,
  Scenario,
  ScenarioEndpoint,
  SurfaceCheck,
  SurfaceDetails,
  SurfaceDoc,
  SurfaceDocTarget,
  UNSPECIFIED_CATEGORY,
  getScenarioDoc,
  getScenarioEndpoints,
  getScenarioName,
  getSurfaceDoc,
  getSurfaceKind,
  isScenario,
  listScenarioIn,
  listScenarios,
  listSurfaceDocs,
} from "./decorators.js";
export { $lib, reportDiagnostic } from "./lib.js";
export { $onValidate } from "./validate.js";

/** @internal */
export { $decorators } from "./tsp-index.js";
