import { passOnSuccess, mockapi, json } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Serialization_EncodedName_Json_Property_send = passOnSuccess(
  mockapi.post("/serialization/encoded-name/json/property", (req) => {
    req.expect.bodyEquals({ wireName: true });
    return {
      status: 204,
    };
  }),
);
Scenarios.Serialization_EncodedName_Json_Property_get = passOnSuccess(
  mockapi.get("/serialization/encoded-name/json/property", (req) => {
    return {
      status: 200,
      body: json({ wireName: true }),
    };
  }),
);

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
    },
    {
      method: "post",
      request: { body: { wireName: true } },
      response: { status: 204 },
    },
  ],
});
