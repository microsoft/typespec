import { passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Parameters_Query_Constant_post = passOnSuccess({
  uri: "/parameters/query/constant",
  method: `post`,
  request: {
    query: { queryParam: "constantValue" },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Query_List_post = passOnSuccess({
  uri: "/parameters/query/list",
  method: `post`,
  request: {
    query: { listParameter: "a,b,c" },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});
