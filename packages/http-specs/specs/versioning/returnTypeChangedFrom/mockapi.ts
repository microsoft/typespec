import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Versioning_ReturnTypeChangedFrom_test = passOnSuccess({
  uri: `/versioning/return-type-changed-from/api-version:v2/test`,
  method: `post`,
  request: {
    body: json("test"),
    headers: {
      "Content-Type": "text/plain",
    },
  },
  response: {
    status: 200,
    body: json("test"),
  },
  kind: "MockApiDefinition",
});
