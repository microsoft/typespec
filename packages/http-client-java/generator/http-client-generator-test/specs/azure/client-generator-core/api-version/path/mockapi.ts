import { passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Client_AlternateApiVersion_Service_Path_pathApiVersion = passOnSuccess([
  {
    uri: "/azure/client-generator-core/api-version/path/2025-01-01",
    method: "post",
    request: {},
    response: {
      status: 200,
    },
    kind: "MockApiDefinition",
  },
]);
