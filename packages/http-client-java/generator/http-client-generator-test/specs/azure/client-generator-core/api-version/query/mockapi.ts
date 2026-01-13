import { passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Client_AlternateApiVersion_Service_Query_queryApiVersion = passOnSuccess([
  {
    uri: "/azure/client-generator-core/api-version/query",
    method: "post",
    request: {
      query: {
        version: "2025-01-01",
      },
    },
    response: {
      status: 200,
    },
    kind: "MockApiDefinition",
  },
]);
