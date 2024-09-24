import { json, mockapi, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const validBody = {
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
};

Scenarios.Client_AzureExampleClient_basicAction = passOnSuccess(
  mockapi.post("/azure/example/basic/basic", (req) => {
    req.expect.containsQueryParam("api-version", "2022-12-01-preview");
    req.expect.containsQueryParam("query-param", "query");
    req.expect.containsHeader("header-param", "header");
    req.expect.bodyEquals(validBody);
    return {
      status: 200,
      body: json({
        stringProperty: "text",
      }),
    };
  }),
);

Scenarios.Azure_Example_Basic = passOnSuccess({
  uri: "/azure/example/basic/basic",
  mockMethods: [
    {
      method: "post",
      request: {
        body: validBody,
        config: {
          params: {
            "api-version": "2022-12-01-preview",
            "query-param": "query",
          },
          headers: {
            "header-param": "header",
          },
        },
      },
      response: {
        status: 200,
        data: {
          stringProperty: "text",
        },
      },
    },
  ],
});
