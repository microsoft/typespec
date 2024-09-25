import { mockapi, passOnSuccess, ScenarioMockApi, validateValueFormat } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Azure_SpecialHeaders_XmsClientRequestId = passOnSuccess(
  mockapi.get("/azure/special-headers/x-ms-client-request-id", (req) => {
    validateValueFormat(req.headers["x-ms-client-request-id"], "uuid");
    return {
      status: 204,
      headers: {
        ["x-ms-client-request-id"]: req.headers["x-ms-client-request-id"],
      },
    };
  }),
);

Scenarios.Azure_Special_Headers_XmsClientRequestId = passOnSuccess({
  uri: "/azure/special-headers/x-ms-client-request-id",
  mockMethods: [
    {
      method: "get",
      request: {
        config: {
          headers: {
            "x-ms-client-request-id": "86aede1f-96fa-4e7f-b1e1-bf8a947cb804",
          },
        },
      },
      response: {
        status: 204,
        headers: {
          "x-ms-client-request-id": "86aede1f-96fa-4e7f-b1e1-bf8a947cb804",
        },
      },
    },
  ],
});
