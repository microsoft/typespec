import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Serialization_EncodedName_Json_Property_send = passOnSuccess({
  uri: "/serialization/encoded-name/json/property",
  mockMethod: {
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
  kind: "MockApiDefinition",
});

Scenarios.Serialization_EncodedName_Json_Property_get = passOnSuccess({
  uri: "/serialization/encoded-name/json/property",
  mockMethod: {
    method: "get",
    request: {},
    response: {
      status: 200,
      body: json({ wireName: true }),
    },
    handler: (req: MockRequest) => {
      return {
        status: 200,
        body: json({ wireName: true }),
      };
    },
  },
  kind: "MockApiDefinition",
});
