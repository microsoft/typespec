import { passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Authentication_Union_validKey = passOnSuccess({
  uri: `/authentication/union/validkey`,
  method: "get",
  request: {
    headers: {
      "x-ms-api-key": "valid-key",
    },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Authentication_Union_validToken = passOnSuccess({
  uri: `/authentication/union/validtoken`,
  method: "get",
  request: {
    headers: {
      authorization: "Bearer https://security.microsoft.com/.default",
    },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});
