import {
  MockRequest,
  passOnSuccess,
  ScenarioMockApi,
  validateValueFormat,
} from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Azure_SpecialHeaders_XmsClientRequestId = passOnSuccess({
  uri: "/azure/special-headers/x-ms-client-request-id",
  method: "get",
  request: {
    headers: {
      "x-ms-client-request-id": "123e4567-e89b-12d3-a456-426614174000",
    },
  },
  response: {
    status: 204,
    headers: {
      "x-ms-client-request-id": "123e4567-e89b-12d3-a456-426614174000",
    },
  },
  handler: (req: MockRequest) => {
    validateValueFormat(req.headers["x-ms-client-request-id"], "uuid");
    return {
      status: 204,
      headers: {
        ["x-ms-client-request-id"]: req.headers["x-ms-client-request-id"],
      },
    };
  },
  kind: "MockApiDefinition",
});
