import { passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Parameters_Path_normal = passOnSuccess({
  uri: "/parameters/path/normal/foo",
  method: "get",

  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Path_optional = passOnSuccess([
  {
    uri: "/parameters/path/optional",
    method: "get",

    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
  {
    uri: "/parameters/path/optional/foo",
    method: "get",

    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
]);
