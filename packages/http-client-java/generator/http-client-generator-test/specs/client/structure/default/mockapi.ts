import { passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";
import { createServerTests } from "../common/service.js";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Client_Structure_Service = passOnSuccess([
  createServerTests("/client/structure/default/one"),
  createServerTests("/client/structure/default/two"),
  createServerTests("/client/structure/default/three"),
  createServerTests("/client/structure/default/four"),
  createServerTests("/client/structure/default/five"),
  createServerTests("/client/structure/default/six"),
  createServerTests("/client/structure/default/seven"),
  createServerTests("/client/structure/default/eight"),
  createServerTests("/client/structure/default/nine"),
]);
