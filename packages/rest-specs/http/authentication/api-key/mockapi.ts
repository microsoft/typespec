import { MockRequest, passOnSuccess, json } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";
import { getValidAndInvalidScenarios } from "../commonapi.js";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const validAndInvalidScenarios = getValidAndInvalidScenarios(
  "api-key",
  "invalid-api-key",
  function addOptionalParamOldApiVersionNewClientValidate(req: MockRequest): void {
    req.expect.containsHeader("x-ms-api-key", "valid-key");
  },
);

Scenarios.Authentication_ApiKey_valid = validAndInvalidScenarios.valid;

Scenarios.Authentication_ApiKey_invalid = validAndInvalidScenarios.invalid;

Scenarios.Authentication_ApiKey_InValid_Server_Test = passOnSuccess({
  uri: `/authentication/api-key/invalid`,
  mockMethods: [
    {
      method: `get`,
      request: {
        config: {
          headers: {
            "x-ms-api-key": "valid-key",
          },
          validStatuses: [403],
        },
      },
      response: {
        status: 403,
        data: {
          error: "invalid-api-key",
        },
      },
    },
  ],
});

Scenarios.Authentication_ApiKey_Valid_Server_Test = passOnSuccess({
  uri: `/authentication/api-key/valid`,
  mockMethods: [
    {
      method: `get`,
      request: {
        config: {
          headers: {
            "x-ms-api-key": "valid-key",
          },
        },
      },
      response: {
        status: 204,
      },
    },
  ],
});
