import { json, MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Type_Enum_Fixed_String_getKnownValue = passOnSuccess({
  uri: "/type/enum/fixed/string/known-value",
  method: "get",
  request: {},
  response: {
    status: 200,
    body: json("Monday"),
  },
  handler: (req: MockRequest) => {
    return { status: 200, body: json("Monday") };
  },
  kind: "MockApiDefinition",
});
Scenarios.Type_Enum_Fixed_String_putKnownValue = passOnSuccess({
  uri: "/type/enum/fixed/string/known-value",
  method: "put",
  request: {
    body: "Monday",
    headers: {
      "Content-Type": "application/json",
    },
  },
  response: {
    status: 204,
  },
  handler: (req: MockRequest) => {
    req.expect.bodyEquals("Monday");
    return { status: 204 };
  },
  kind: "MockApiDefinition",
});

Scenarios.Type_Enum_Fixed_String_putUnknownValue = passOnSuccess({
  uri: "/type/enum/fixed/string/unknown-value",
  method: "put",
  request: {
    body: "Weekend",
    headers: {
      "Content-Type": "application/json",
    },
    status: 500,
  },
  response: {
    status: 500,
  },
  handler: (req: MockRequest) => {
    req.expect.bodyEquals("Weekend");
    return { status: 500 };
  },
  kind: "MockApiDefinition",
});
