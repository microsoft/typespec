import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Serialization_Encoded_Name_JSON_Property = passOnSuccess({
  uri: "/serialization/encoded-name/json/property",
  mockMethods: [
    {
      method: "get",
      request: {},
      response: {
        status: 200,
        data: { wireName: true },
      },
      handler: (req: MockRequest) => {
        return {
          status: 200,
          body: json({ wireName: true }),
        };
      },
    },
    {
      method: "post",
      request: { body: { wireName: true } },
      response: { status: 204 },
      handler: (req: MockRequest) => {
        req.expect.bodyEquals({ wireName: true });
        return {
          status: 204,
        };
      },
    },
  ],
});
