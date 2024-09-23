import { passOnSuccess, mockapi, json } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const inheritanceValidBody = { name: "abc", age: 32, smart: true };
Scenarios.Type_Model_Inheritance_NotDiscriminated_postValid = passOnSuccess(
  mockapi.post("/type/model/inheritance/not-discriminated/valid", (req) => {
    req.expect.bodyEquals(inheritanceValidBody);
    return { status: 204 };
  }),
);

Scenarios.Type_Model_Inheritance_NotDiscriminated_getValid = passOnSuccess(
  mockapi.get("/type/model/inheritance/not-discriminated/valid", (req) => {
    return { status: 200, body: json(inheritanceValidBody) };
  }),
);

Scenarios.Type_Model_Inheritance_NotDiscriminated_putValid = passOnSuccess(
  mockapi.put("/type/model/inheritance/not-discriminated/valid", (req) => {
    return { status: 200, body: json(req.body) };
  }),
);

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
    },
    {
      method: "post",
      request: {
        body: inheritanceValidBody,
      },
      response: {
        status: 204,
      },
    },
  ],
});
