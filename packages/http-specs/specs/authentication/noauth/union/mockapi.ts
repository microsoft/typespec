import { passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Authentication_Noauth_Union_validNoAuth = passOnSuccess({
  uri: `/authentication/noauth/union/valid`,
  method: "get",
  request: {},
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Authentication_Noauth_Union_validToken = passOnSuccess({
  uri: `/authentication/noauth/union/validtoken`,
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
