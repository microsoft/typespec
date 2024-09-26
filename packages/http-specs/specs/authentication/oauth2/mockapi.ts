import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Authentication_OAuth2_Valid_Server_Test = passOnSuccess({
  uri: `/authentication/oauth2/valid`,
  mockMethods: [
    {
      method: "get",
      request: {
        config: {
          headers: {
            authorization: "Bearer https://security.microsoft.com/.default",
          },
        },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.containsHeader(
          "authorization",
          "Bearer https://security.microsoft.com/.default",
        );
        return { status: 204 };
      },
    },
  ],
});

Scenarios.Authentication_OAuth2_Invalid_Server_Test = passOnSuccess({
  uri: `/authentication/oauth2/invalid`,
  mockMethods: [
    {
      method: "get",
      request: {
        config: {
          validStatus: 403,
        },
      },
      response: {
        status: 403,
        data: {
          error: "invalid-grant",
        },
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
  ],
});
