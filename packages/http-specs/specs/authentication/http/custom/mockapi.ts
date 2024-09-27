import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Authentication_Http_Custom_valid = passOnSuccess({
  uri: `/authentication/http/custom/valid`,
  mockMethod: {
    method: "get",
    request: {
      headers: {
        authorization: "SharedAccessKey valid-key",
      },
    },
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      req.expect.containsHeader("authorization", "SharedAccessKey valid-key");
      return { status: 204 };
    },
  },
  kind: "MockApiDefinition",
});

Scenarios.Authentication_Http_Custom_invalid = passOnSuccess({
  uri: `/authentication/http/custom/invalid`,
  mockMethod: {
    method: "get",
    request: {
      headers: {
        authorization: "SharedAccessKey valid-key",
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
  kind: "MockApiDefinition",
});
