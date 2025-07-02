import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Azure_Example_Basic = passOnSuccess({
  uri: "/azure/example/basic/basic",
  method: "post",
  request: {
    query: {
      "api-version": "2022-12-01-preview",
      "query-param": "query",
    },
    headers: {
      "header-param": "header",
    },
    body: json({
      stringProperty: "text",
      modelProperty: {
        int32Property: 1,
        float32Property: 1.5,
        enumProperty: "EnumValue1",
      },
      arrayProperty: ["item"],
      recordProperty: {
        record: "value",
      },
    }),
  },
  response: {
    status: 200,
    body: json({
      stringProperty: "text",
    }),
  },
  kind: "MockApiDefinition",
});
