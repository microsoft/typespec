import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Authentication_OAuth2_valid = passOnSuccess({
  uri: `/authentication/oauth2/valid`,
  mockMethod: {
    method: "get",
    request: {
      headers: {
        authorization: "Bearer https://security.microsoft.com/.default",
      },
    },
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      req.expect.containsHeader("authorization", "Bearer https://security.microsoft.com/.default");
      return { status: 204 };
    },
  },
  kind: "MockApiDefinition",
});

Scenarios.Authentication_OAuth2_invalid = passOnSuccess({
  uri: `/authentication/oauth2/invalid`,
  mockMethod: {
    method: "get",
    request: {
      status: 403,
    },
    response: {
      status: 403,
      body: json({
        error: "invalid-grant",
      }),
    },
    handler: (req: MockRequest) => {
      return {
        status: 403,
        body: json({
          error: "invalid-grant",
        }),
      };
    },
  },
  kind: "MockApiDefinition",
});
