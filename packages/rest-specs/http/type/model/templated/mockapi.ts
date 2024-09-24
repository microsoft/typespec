import { json, mockapi, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Type_Model_Templated_numericType = passOnSuccess(
  mockapi.put("/type/model/templated/numericType", (req) => {
    const body = {
      kind: "Int32Values",
      values: [1234],
      value: 1234,
    };
    req.expect.bodyEquals(body);
    return {
      status: 200,
      body: json(body),
    };
  }),
);

Scenarios.Type_Model_Templated_float32Type = passOnSuccess(
  mockapi.put("/type/model/templated/float32ValuesType", (req) => {
    const body = {
      kind: "Float32Values",
      values: [0.5],
      value: 0.5,
    };
    req.expect.bodyEquals(body);
    return {
      status: 200,
      body: json(body),
    };
  }),
);

Scenarios.Type_Model_Templated_int32Type = passOnSuccess(
  mockapi.put("/type/model/templated/int32ValuesType", (req) => {
    const body = {
      kind: "Int32Values",
      values: [1234],
      value: 1234,
    };
    req.expect.bodyEquals(body);
    return {
      status: 200,
      body: json(body),
    };
  }),
);
