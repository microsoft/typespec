import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Response_StatusCodeRange_errorResponseStatusCodeInRange = passOnSuccess({
  uri: "/response/status-code-range/error-response-status-code-in-range",
  method: "get",
  request: {
    status: 494,
  },
  response: {
    status: 494,
    body: json({
      code: "request-header-too-large",
      message: "Request header too large",
    }),
  },
  kind: "MockApiDefinition",
});

Scenarios.Response_StatusCodeRange_errorResponseStatusCode404 = passOnSuccess({
  uri: "/response/status-code-range/error-response-status-code-404",
  method: "get",
  request: {
    status: 404,
  },
  response: {
    status: 404,
    body: json({
      code: "not-found",
      resourceId: "resource1",
    }),
  },
  kind: "MockApiDefinition",
});
