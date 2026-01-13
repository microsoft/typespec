import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Azure_ClientGenerator_Core_DeserializeEmptyStringAsNull_get = passOnSuccess({
  uri: "/azure/client-generator-core/deserialize-empty-string-as-null/responseModel",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: json({
      sampleUrl: "",
    }),
  },
  kind: "MockApiDefinition",
});
