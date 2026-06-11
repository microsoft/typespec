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

Scenarios.Parameters_Query_SpecialChar_dollarSign = passOnSuccess({
  uri: "/parameters/query/special-char/dollarSign",
  method: "get",
  request: {
    query: { $filter: "status eq 'active'" },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});
