import { MockRequest, passOnSuccess, json } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";
import { getValidAndInvalidScenarios } from "../../commonapi.js";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const validAndInvalidScenarios = getValidAndInvalidScenarios(
  "http/custom",
  "invalid-api-key",
  function addOptionalParamOldApiVersionNewClientValidate(req: MockRequest): void {
    req.expect.containsHeader("authorization", "SharedAccessKey valid-key");
  },
);

Scenarios.Authentication_Http_Custom_Valid_Key = passOnSuccess({
  uri: `/authentication/http/custom/valid`,
  mockMethods: [
    {
      method: "get",
      request: {
        config: {
          headers: {
            authorization: "SharedAccessKey valid-key",
          },
        },
      },
      response: {
        status: 204,
      },
    },
  ],
});

Scenarios.Authentication_Http_Custom_InValid_Key = passOnSuccess({
  uri: `/authentication/http/custom/invalid`,
  mockMethods: [
    {
      method: "get",
      request: {
        config: {
          headers: {
            authorization: "SharedAccessKey valid-key",
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

Scenarios.Authentication_Http_Custom_valid = validAndInvalidScenarios.valid;

Scenarios.Authentication_Http_Custom_invalid = validAndInvalidScenarios.invalid;
