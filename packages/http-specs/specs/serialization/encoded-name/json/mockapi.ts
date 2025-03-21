import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Serialization_EncodedName_Json_Property_send = passOnSuccess({
  uri: "/serialization/encoded-name/json/property",
  method: "post",
  request: { body: json({ wireName: true }) },
  response: { status: 204 },
  kind: "MockApiDefinition",
});

Scenarios.Serialization_EncodedName_Json_Property_get = passOnSuccess({
  uri: "/serialization/encoded-name/json/property",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: json({ wireName: true }),
  },
  kind: "MockApiDefinition",
});
