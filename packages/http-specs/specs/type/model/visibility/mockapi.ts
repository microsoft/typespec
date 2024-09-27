import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function genData(keys: string[]): Record<string, any> {
  const ret: Record<string, any> = {};
  const fullData: Record<string, any> = {
    readProp: "abc",
    queryProp: 123,
    createProp: ["foo", "bar"],
    updateProp: [1, 2],
    deleteProp: true,
  };
  for (const k of keys) {
    if (k in fullData) {
      ret[k] = fullData[k];
    }
  }
  return ret;
}
const expectBody = {
  optionalNullableIntList: [1, 2, 3],
  optionalStringRecord: { k1: "value1", k2: "value2" },
};
Scenarios.Type_Model_Visibility_ReadOnlyRoundTrip = passOnSuccess({
  uri: "/type/model/visibility/readonlyroundtrip",
  mockMethods: [
    {
      method: "put",
      request: {},
      response: {
        status: 200,
        body: {
          optionalNullableIntList: [1, 2, 3],
          optionalStringRecord: { k1: "value1", k2: "value2" },
        },
      },
      handler: (req: MockRequest) => {
        req.expect.bodyEquals({});
        return { status: 200, body: json(expectBody) };
      },
    },
  ],
  kind: "MockApiDefinition",
});
Scenarios.Type_Model_Visibility = passOnSuccess({
  uri: "/type/model/visibility",
  mockMethods: [
    {
      method: "head",
      request: {
        body: { queryProp: 123 },
      },
      response: {
        status: 200,
      },
      handler: (req: MockRequest) => {
        req.expect.bodyEquals(genData(["queryProp"]));
        return { status: 200 };
      },
    },
    {
      method: "get",
      request: {
        body: { queryProp: 123 },
      },
      response: {
        status: 200,
        body: { readProp: "abc" },
      },
      handler: (req: MockRequest) => {
        req.expect.bodyEquals(genData(["queryProp"]));
        return {
          status: 200,
          body: json(genData(["readProp"])),
        };
      },
    },
    {
      method: "put",
      request: {
        body: {
          createProp: ["foo", "bar"],
          updateProp: [1, 2],
        },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.bodyEquals(genData(["createProp", "updateProp"]));
        return { status: 204 };
      },
    },
    {
      method: "patch",
      request: {
        body: {
          updateProp: [1, 2],
        },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.bodyEquals(genData(["updateProp"]));
        return { status: 204 };
      },
    },
    {
      method: "post",
      request: {
        body: {
          createProp: ["foo", "bar"],
        },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.bodyEquals(genData(["createProp"]));
        return { status: 204 };
      },
    },
    {
      method: "delete",
      request: {
        body: { deleteProp: true },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.bodyEquals(genData(["deleteProp"]));
        return { status: 204 };
      },
    },
  ],
  kind: "MockApiDefinition",
});
