import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const body = {};

Scenarios.Type_Model_Empty_putEmpty = passOnSuccess({
  uri: "/type/model/empty/alone",
  method: "put",
  request: {
    body: body,
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
Scenarios.Type_Model_Empty_getEmpty = passOnSuccess({
  uri: "/type/model/empty/alone",
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

Scenarios.Type_Model_Empty_postRoundTripEmpty = passOnSuccess({
  uri: "/type/model/empty/round-trip",
  method: "post",
  request: {
    body: body,
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
