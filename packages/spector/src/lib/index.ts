export {
  $scenario,
  $scenarioDoc,
  $scenarioService,
  $surfaceDoc,
  Scenario,
  ScenarioEndpoint,
  SurfaceDetails,
  SurfaceDoc,
  SurfaceDocTarget,
  SurfaceSubject,
  buildSurfaceDetails,
  getScenarioDoc,
  getScenarioEndpoints,
  getScenarioName,
  isScenario,
  listScenarioIn,
  listScenarios,
  listSurfaceDocs,
} from "./decorators.js";
export { $lib, reportDiagnostic } from "./lib.js";
export { $onValidate } from "./validate.js";

/** @internal */
export { $decorators } from "./tsp-index.js";
