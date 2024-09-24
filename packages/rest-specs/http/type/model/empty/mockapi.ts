import { json, mockapi, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const body = {};

Scenarios.Type_Model_Empty_putEmpty = passOnSuccess(
  mockapi.put("/type/model/empty/alone", (req) => {
    req.expect.bodyEquals(body);
    return { status: 204 };
  }),
);

Scenarios.Type_Model_Empty_getEmpty = passOnSuccess(
  mockapi.get("/type/model/empty/alone", (req) => {
    return { status: 200, body: json(body) };
  }),
);

Scenarios.Type_Model_Empty_postRoundTripEmpty = passOnSuccess(
  mockapi.post("/type/model/empty/round-trip", (req) => {
    req.expect.bodyEquals(body);
    return { status: 200, body: json(body) };
  }),
);

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
    },
    {
      method: "put",
      request: {
        body: body,
      },
      response: {
        status: 204,
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
    },
  ],
});
