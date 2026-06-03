import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Encode_Boolean_Property_boolAsString = passOnSuccess({
  uri: "/encode/boolean/property/bool-as-string",
  method: "post",
  request: {
    body: json({
      value: "true",
    }),
  },
  response: {
    status: 200,
    body: json({
      value: "true",
    }),
  },
  kind: "MockApiDefinition",
});
