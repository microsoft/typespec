import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Response_StatusCodeRange_errorResponse = passOnSuccess({
  uri: "/response/status-code-range/error-response",
  method: "get",
  request: {
    status: 494,
  },
  response: {
    status: 494,
    body: json({
      code: "request-header-too-large",
      message: "Request header too large"
    }),
  },
  kind: "MockApiDefinition",
});
