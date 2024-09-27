import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

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
  kind: "MockApiDefinition",
});
