import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const body = { requiredProp: "example-value" };

Scenarios.Type_Model_Usage_input = passOnSuccess({
  uri: "/type/model/usage/input",
  method: "post",
  request: {
    body: {
      requiredProp: "example-value",
    },
  },
  response: {
    status: 204,
  },
  handler: (req: MockRequest) => {
    req.expect.bodyEquals(body);
    return { status: 204 };
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Model_Usage_output = passOnSuccess({
  uri: "/type/model/usage/output",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: json(body),
  },
  handler: (req: MockRequest) => {
    return { status: 200, body: json(body) };
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Model_Usage_inputAndOutput = passOnSuccess({
  uri: "/type/model/usage/input-output",
  method: "post",
  request: {
    body: {
      requiredProp: "example-value",
    },
  },
  response: {
    status: 200,
    body: json(body),
  },
  handler: (req: MockRequest) => {
    req.expect.bodyEquals(body);
    return { status: 200, body: json(body) };
  },
  kind: "MockApiDefinition",
});
