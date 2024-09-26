import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const body = {};

Scenarios.Type_Model_Empty_Alone = passOnSuccess({
  uri: "/type/model/empty/alone",
  mockMethods: [
    {
      method: "get",
      request: {},
      response: {
        status: 200,
        data: body,
      },
      handler: (req: MockRequest) => {
        return { status: 200, body: json(body) };
      },
    },
    {
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
    },
  ],
});

Scenarios.Type_Model_Empty_Round_Trip = passOnSuccess({
  uri: "/type/model/empty/round-trip",
  mockMethods: [
    {
      method: "post",
      request: {
        body: body,
      },
      response: {
        status: 200,
        data: body,
      },
      handler: (req: MockRequest) => {
        req.expect.bodyEquals(body);
        return { status: 200, body: json(body) };
      },
    },
  ],
});
