import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

function genData(keys: string[]): Record<string, any> {
  const ret: Record<string, any> = {};
  const fullData: Record<string, any> = {
    readProp: "abc",
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
Scenarios.Type_Model_Visibility_putReadOnlyModel = passOnSuccess({
  uri: "/type/model/visibility/readonlyroundtrip",
  method: "put",
  request: {},
  response: {
    status: 200,
    body: json(expectBody),
  },
  kind: "MockApiDefinition",
});
Scenarios.Type_Model_Visibility_headModel = passOnSuccess({
  uri: "/type/model/visibility",
  method: "head",
  request: {
    query: { queryProp: 123 },
  },
  response: {
    status: 200,
  },
  kind: "MockApiDefinition",
});
Scenarios.Type_Model_Visibility_getModel = passOnSuccess({
  uri: "/type/model/visibility",
  method: "get",
  request: {
    query: { queryProp: 123 },
  },
  response: {
    status: 200,
    body: json(genData(["readProp"])),
  },
  kind: "MockApiDefinition",
});
Scenarios.Type_Model_Visibility_putModel = passOnSuccess({
  uri: "/type/model/visibility",
  method: "put",
  request: {
    body: json({
      createProp: ["foo", "bar"],
      updateProp: [1, 2],
    }),
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});
Scenarios.Type_Model_Visibility_patchModel = passOnSuccess({
  uri: "/type/model/visibility",
  method: "patch",
  request: {
    body: json({
      updateProp: [1, 2],
    }),
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});
Scenarios.Type_Model_Visibility_postModel = passOnSuccess({
  uri: "/type/model/visibility",
  method: "post",
  request: {
    body: json({
      createProp: ["foo", "bar"],
    }),
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});
Scenarios.Type_Model_Visibility_deleteModel = passOnSuccess({
  uri: "/type/model/visibility",
  method: "delete",
  request: {
    body: json({ deleteProp: true }),
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});
