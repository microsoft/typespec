import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Client_Naming_EnumConflict_FirstOperations_first = passOnSuccess({
  uri: "/client/naming/enum-conflict/first",
  method: "post",
  request: {
    body: json({ status: "active", name: "test" }),
  },
  response: {
    status: 200,
    body: json({ status: "active", name: "test" }),
  },
  kind: "MockApiDefinition",
});

Scenarios.Client_Naming_EnumConflict_SecondOperations_second = passOnSuccess({
  uri: "/client/naming/enum-conflict/second",
  method: "post",
  request: {
    body: json({ status: "running", description: "test description" }),
  },
  response: {
    status: 200,
    body: json({ status: "running", description: "test description" }),
  },
  kind: "MockApiDefinition",
});
