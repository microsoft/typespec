import { passOnSuccess, mockapi, json, MockApi } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};
/**
 * Return the put operation.
 * @param route The route under /azure/client-generator-core/flatten-property for your function.
 * @param request The request body you are expecting and will return.
 * @param response The response body you are expecting and will return.
 */
function createMockApis(route: string, request: any, response: any): MockApi {
  const url = `/azure/client-generator-core/flatten-property/${route}`;
  return mockapi.put(url, (req) => {
    req.expect.bodyEquals(request);
    return {
      status: 200,
      body: json(response),
    };
  });
}

Scenarios.Azure_ClientGenerator_Core_FlattenProperty_putFlattenModel = passOnSuccess(
  createMockApis(
    "flattenModel",
    {
      name: "foo",
      properties: {
        description: "bar",
        age: 10,
      },
    },
    {
      name: "test",
      properties: {
        description: "test",
        age: 1,
      },
    },
  ),
);

Scenarios.Azure_ClientGenerator_Core_FlattenProperty_putNestedFlattenModel = passOnSuccess(
  createMockApis(
    "nestedFlattenModel",
    {
      name: "foo",
      properties: {
        summary: "bar",
        properties: {
          description: "test",
          age: 10,
        },
      },
    },
    {
      name: "test",
      properties: {
        summary: "test",
        properties: {
          description: "foo",
          age: 1,
        },
      },
    },
  ),
);

Scenarios.Azure_ClientGenerator_Core_Flatten_Property_FlattenModel = passOnSuccess({
  uri: "/azure/client-generator-core/flatten-property/flattenModel",
  mockMethods: [
    {
      method: "put",
      request: {
        body: {
          name: "foo",
          properties: {
            description: "bar",
            age: 10,
          },
        },
      },
      response: {
        status: 200,
        data: {
          name: "test",
          properties: {
            description: "test",
            age: 1,
          },
        },
      },
    },
  ],
});

Scenarios.Azure_ClientGenerator_Core_Flatten_Property_Nested_FlattenModel = passOnSuccess({
  uri: "/azure/client-generator-core/flatten-property/nestedFlattenModel",
  mockMethods: [
    {
      method: "put",
      request: {
        body: {
          name: "foo",
          properties: {
            summary: "bar",
            properties: {
              description: "test",
              age: 10,
            },
          },
        },
      },
      response: {
        status: 200,
        data: {
          name: "test",
          properties: {
            summary: "test",
            properties: {
              description: "foo",
              age: 1,
            },
          },
        },
      },
    },
  ],
});
