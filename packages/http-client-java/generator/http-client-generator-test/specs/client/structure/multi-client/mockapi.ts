import { passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";
import { createServerTests } from "../common/service.js";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Client_Structure_MultiClient = passOnSuccess([
  createServerTests("/client/structure/multi-client/one"),
  createServerTests("/client/structure/multi-client/two"),
  createServerTests("/client/structure/multi-client/three"),
  createServerTests("/client/structure/multi-client/four"),
  createServerTests("/client/structure/multi-client/five"),
  createServerTests("/client/structure/multi-client/six"),
]);
