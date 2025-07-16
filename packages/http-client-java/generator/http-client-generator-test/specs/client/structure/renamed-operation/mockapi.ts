import { passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";
import { createServerTests } from "../common/service.js";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Client_Structure_RenamedOperation = passOnSuccess([
  createServerTests("/client/structure/renamed-operation/one"),
  createServerTests("/client/structure/renamed-operation/two"),
  createServerTests("/client/structure/renamed-operation/three"),
  createServerTests("/client/structure/renamed-operation/four"),
  createServerTests("/client/structure/renamed-operation/five"),
  createServerTests("/client/structure/renamed-operation/six"),
]);
