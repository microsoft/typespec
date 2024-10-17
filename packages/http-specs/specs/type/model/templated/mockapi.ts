import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Type_Model_Templated_numericType = passOnSuccess({
  uri: "/type/model/templated/numericType",
  method: "put",
  request: {
    body: {
      kind: "Int32Values",
      values: [1234],
      value: 1234,
    },
  },
  response: {
    status: 200,
    body: json({
      kind: "Int32Values",
      values: [1234],
      value: 1234,
    }),
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Model_Templated_float32Type = passOnSuccess({
  uri: "/type/model/templated/float32ValuesType",
  method: "put",
  request: {
    body: {
      kind: "Float32Values",
      values: [0.5],
      value: 0.5,
    },
  },
  response: {
    status: 200,
    body: json({
      kind: "Float32Values",
      values: [0.5],
      value: 0.5,
    }),
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Model_Templated_int32Type = passOnSuccess({
  uri: "/type/model/templated/int32ValuesType",
  method: "put",
  request: {
    body: {
      kind: "Int32Values",
      values: [1234],
      value: 1234,
    },
  },
  response: {
    status: 200,
    body: json({
      kind: "Int32Values",
      values: [1234],
      value: 1234,
    }),
  },
  kind: "MockApiDefinition",
});
