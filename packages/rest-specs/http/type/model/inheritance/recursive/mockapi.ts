import { passOnSuccess, mockapi, json } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const body = {
  level: 0,
  extension: [
    {
      level: 1,
      extension: [
        {
          level: 2,
        },
      ],
    },
    {
      level: 1,
    },
  ],
};

Scenarios.Type_Model_Inheritance_Recursive_put = passOnSuccess(
  mockapi.put("/type/model/inheritance/recursive", (req) => {
    req.expect.bodyEquals(body);
    return { status: 204 };
  }),
);

Scenarios.Type_Model_Inheritance_Recursive_get = passOnSuccess(
  mockapi.get("/type/model/inheritance/recursive", (req) => {
    return { status: 200, body: json(body) };
  }),
);

Scenarios.Type_Model_Inheritance_Recursive = passOnSuccess({
  uri: "/type/model/inheritance/recursive",
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
