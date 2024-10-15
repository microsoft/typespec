import { passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Server_Path_Multiple_noOperationParams = passOnSuccess({
  uri: "/server/path/multiple/v1.0",
  method: "get",
  request: {},
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Server_Path_Multiple_withOperationPathParam = passOnSuccess({
  uri: "/server/path/multiple/v1.0/test",
  method: "get",
  request: {},
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});
