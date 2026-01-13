import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

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
Scenarios.Type_Model_Inheritance_Recursive_put = passOnSuccess({
  uri: "/type/model/inheritance/recursive",
  method: "put",
  request: {
    body: json(body),
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});
Scenarios.Type_Model_Inheritance_Recursive_get = passOnSuccess({
  uri: "/type/model/inheritance/recursive",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: json(body),
  },
  kind: "MockApiDefinition",
});
