import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const inheritanceValidBody = { name: "abc", age: 32, smart: true };

Scenarios.Type_Model_Inheritance_Not_Discriminated_Valid = passOnSuccess({
  uri: "/type/model/inheritance/not-discriminated/valid",
  mockMethods: [
    {
      method: "get",
      request: {},
      response: {
        status: 200,
        data: inheritanceValidBody,
      },
      handler: (req: MockRequest) => {
        return { status: 200, body: json(inheritanceValidBody) };
      },
    },
    {
      method: "put",
      request: {
        body: inheritanceValidBody,
      },
      response: {
        status: 200,
        data: inheritanceValidBody,
      },
      handler: (req: MockRequest) => {
        return { status: 200, body: json(req.body) };
      },
    },
    {
      method: "post",
      request: {
        body: inheritanceValidBody,
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.bodyEquals(inheritanceValidBody);
        return { status: 204 };
      },
    },
  ],
});
