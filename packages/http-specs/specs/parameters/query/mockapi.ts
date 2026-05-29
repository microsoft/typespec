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

Scenarios.Parameters_Query_DollarSign_filter = passOnSuccess({
  uri: "/parameters/query/dollar-sign/filter",
  method: "get",
  request: {
    query: { $filter: "status eq 'active'" },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Query_DollarSign_topAndSkip = passOnSuccess({
  uri: "/parameters/query/dollar-sign/top-and-skip",
  method: "get",
  request: {
    query: { $top: "10", $skip: "5" },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Parameters_Query_DollarSign_orderby = passOnSuccess({
  uri: "/parameters/query/dollar-sign/orderby",
  method: "get",
  request: {
    query: { $orderby: "name asc" },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});
