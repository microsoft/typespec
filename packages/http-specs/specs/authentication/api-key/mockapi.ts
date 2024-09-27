import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Authentication_ApiKey_InValid = passOnSuccess({
  uri: `/authentication/api-key/invalid`,
  mockMethods: [
    {
      method: `get`,
      request: {
        headers: {
          "x-ms-api-key": "valid-key",
        },
        status: 403,
      },
      response: {
        status: 403,
        body: json({
          error: "invalid-api-key",
        }),
      },
      handler: (req: MockRequest) => {
        return {
          status: 403,
          body: json({
            error: "invalid-api-key",
          }),
        };
      },
    },
  ],
  kind: "MockApiDefinition",
});

Scenarios.Authentication_ApiKey_Valid = passOnSuccess({
  uri: `/authentication/api-key/valid`,
  mockMethods: [
    {
      method: `get`,
      request: {
        headers: {
          "x-ms-api-key": "valid-key",
        },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.containsHeader("x-ms-api-key", "valid-key");
        return { status: 204 };
      },
    },
  ],
  kind: "MockApiDefinition",
});
