import {
  MockRequest,
  passOnSuccess,
  ScenarioMockApi,
  validateValueFormat,
  ValidationError,
} from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.SpecialHeaders_Repeatability_immediateSuccess = passOnSuccess({
  uri: "/special-headers/repeatability/immediateSuccess",
  method: "post",
  request: {
    headers: {
      "Repeatability-First-Sent": "Tue, 15 Nov 2022 12:45:26 GMT",
      "Repeatability-Request-ID": "2378d9bc-1726-11ee-be56-0242ac120002", // fake uuid
    },
  },
  response: {
    status: 204,
    headers: {
      "repeatability-result": "accepted",
    },
  },
  handler: (req: MockRequest) => {
    if (!("repeatability-request-id" in req.headers)) {
      throw new ValidationError("Repeatability-Request-ID is missing", "A UUID string", undefined);
    }
    if (!("repeatability-first-sent" in req.headers)) {
      throw new ValidationError(
        "Repeatability-First-Sent is missing",
        "A date-time in headers format",
        undefined,
      );
    }
    validateValueFormat(req.headers["repeatability-request-id"], "uuid");
    validateValueFormat(req.headers["repeatability-first-sent"], "rfc7231");
    return {
      status: 204,
      headers: {
        "repeatability-result": "accepted",
      },
    };
  },
  kind: "MockApiDefinition",
});
