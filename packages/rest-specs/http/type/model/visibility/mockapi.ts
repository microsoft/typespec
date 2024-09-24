import { json, mockapi, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

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

Scenarios.Type_Model_Visibility_headModel = passOnSuccess(
  mockapi.head("/type/model/visibility", (req) => {
    req.expect.bodyEquals(genData(["queryProp"]));
    return { status: 200 };
  }),
);

Scenarios.Type_Model_Visibility_getModel = passOnSuccess(
  mockapi.get("/type/model/visibility", (req) => {
    req.expect.bodyEquals(genData(["queryProp"]));
    return {
      status: 200,
      body: json(genData(["readProp"])),
    };
  }),
);

Scenarios.Type_Model_Visibility_putModel = passOnSuccess(
  mockapi.put("/type/model/visibility", (req) => {
    req.expect.bodyEquals(genData(["createProp", "updateProp"]));
    return { status: 204 };
  }),
);

Scenarios.Type_Model_Visibility_patchModel = passOnSuccess(
  mockapi.patch("/type/model/visibility", (req) => {
    req.expect.bodyEquals(genData(["updateProp"]));
    return { status: 204 };
  }),
);

Scenarios.Type_Model_Visibility_postModel = passOnSuccess(
  mockapi.post("/type/model/visibility", (req) => {
    req.expect.bodyEquals(genData(["createProp"]));
    return { status: 204 };
  }),
);

Scenarios.Type_Model_Visibility_deleteModel = passOnSuccess(
  mockapi.delete("/type/model/visibility", (req) => {
    req.expect.bodyEquals(genData(["deleteProp"]));
    return { status: 204 };
  }),
);

const expectBody = {
  optionalNullableIntList: [1, 2, 3],
  optionalStringRecord: { k1: "value1", k2: "value2" },
};

Scenarios.Type_Model_Visibility_putReadOnlyModel = passOnSuccess(
  mockapi.put("/type/model/visibility/readonlyroundtrip", (req) => {
    req.expect.bodyEquals({});
    return { status: 200, body: json(expectBody) };
  }),
);

Scenarios.Type_Model_Visibility_ReadOnlyRoundTrip = passOnSuccess({
  uri: "/type/model/visibility/readonlyroundtrip",
  mockMethods: [
    {
      method: "put",
      request: {},
      response: {
        status: 200,
        data: {
          optionalNullableIntList: [1, 2, 3],
          optionalStringRecord: { k1: "value1", k2: "value2" },
        },
      },
    },
  ],
});

Scenarios.Type_Model_Visibility = passOnSuccess({
  uri: "/type/model/visibility",
  mockMethods: [
    {
      method: "head",
      request: {
        config: {
          data: { queryProp: 123 },
        },
      },
      response: {
        status: 200,
      },
    },
    {
      method: "get",
      request: {
        config: {
          data: { queryProp: 123 },
        },
      },
      response: {
        status: 200,
        data: { readProp: "abc" },
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
    },
    {
      method: "delete",
      request: {
        config: {
          data: { deleteProp: true },
        },
      },
      response: {
        status: 204,
      },
    },
  ],
});
