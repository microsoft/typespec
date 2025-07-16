import { passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";
import { createServerTests } from "../common/service.js";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Client_Structure_ClientOperationGroup = passOnSuccess([
  createServerTests("/client/structure/client-operation-group/one"),
  createServerTests("/client/structure/client-operation-group/two"),
  createServerTests("/client/structure/client-operation-group/three"),
  createServerTests("/client/structure/client-operation-group/four"),
]);

Scenarios.Client_Structure_AnotherClientOperationGroup = passOnSuccess([
  createServerTests("/client/structure/client-operation-group/five"),
  createServerTests("/client/structure/client-operation-group/six"),
]);
