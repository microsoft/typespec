import { passOnSuccess, mockapi, json } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const body = { requiredProp: "example-value" };

Scenarios.Type_Model_Usage_input = passOnSuccess(
  mockapi.post("/type/model/usage/input", (req) => {
    req.expect.bodyEquals(body);
    return { status: 204 };
  }),
);

Scenarios.Type_Model_Usage_output = passOnSuccess(
  mockapi.get("/type/model/usage/output", (req) => {
    return { status: 200, body: json(body) };
  }),
);

Scenarios.Type_Model_Usage_inputAndOutput = passOnSuccess(
  mockapi.post("/type/model/usage/input-output", (req) => {
    req.expect.bodyEquals(body);
    return { status: 200, body: json(body) };
  }),
);

Scenarios.Type_Model_Usage_Input = passOnSuccess({
  uri: "/type/model/usage/input",
  mockMethods: [
    {
      method: "post",
      request: {
        body: {
          requiredProp: "example-value",
        },
      },
      response: {
        status: 204,
      },
    },
  ],
});

Scenarios.Type_Model_Usage_Output = passOnSuccess({
  uri: "/type/model/usage/output",
  mockMethods: [
    {
      method: "get",
      request: {},
      response: {
        status: 200,
        data: {
          requiredProp: "example-value",
        },
      },
    },
  ],
});

Scenarios.Type_Model_Usage_Input_Output = passOnSuccess({
  uri: "/type/model/usage/input-output",
  mockMethods: [
    {
      method: "post",
      request: {
        body: {
          requiredProp: "example-value",
        },
      },
      response: {
        status: 200,
        data: {
          requiredProp: "example-value",
        },
      },
    },
  ],
});
