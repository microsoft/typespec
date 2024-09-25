import { MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";
import { getValidAndInvalidScenarios } from "../commonapi.js";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const validAndInvalidScenarios = getValidAndInvalidScenarios(
  "oauth2",
  "invalid-grant",
  function addOptionalParamOldApiVersionNewClientValidate(req: MockRequest): void {
    req.expect.containsHeader("authorization", "Bearer https://security.microsoft.com/.default");
  },
);

Scenarios.Authentication_OAuth2_valid = validAndInvalidScenarios.valid;

Scenarios.Authentication_OAuth2_invalid = validAndInvalidScenarios.invalid;

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
          validStatuses: [403],
        },
      },
      response: {
        status: 403,
        data: {
          error: "invalid-grant",
        },
      },
    },
  ],
});
