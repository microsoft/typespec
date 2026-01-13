import { passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";
import { createServerTests } from "../common/service.js";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Client_Structure_TwoOperationGroup = passOnSuccess([
  createServerTests("/client/structure/two-operation-group/one"),
  createServerTests("/client/structure/two-operation-group/two"),
  createServerTests("/client/structure/two-operation-group/three"),
  createServerTests("/client/structure/two-operation-group/four"),
  createServerTests("/client/structure/two-operation-group/five"),
  createServerTests("/client/structure/two-operation-group/six"),
]);
