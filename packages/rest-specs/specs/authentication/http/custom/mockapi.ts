import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

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
      handler: (req: MockRequest) => {
        req.expect.containsHeader("authorization", "SharedAccessKey valid-key");
        return { status: 204 };
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
          validStatus: 403,
        },
      },
      response: {
        status: 403,
        data: {
          error: "invalid-api-key",
        },
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
});
