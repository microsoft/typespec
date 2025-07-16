import { MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const colors = ["blue", "red", "green"];

Scenarios.Parameters_CollectionFormat_Query_multi = passOnSuccess({
  uri: `/parameters/collection-format/query/multi`,
  method: "get",
  request: {
    query: { colors: ["blue", "red", "green"] },
  },
  response: {
    status: 204,
  },
  handler: (req: MockRequest) => {
    req.expect.containsQueryParam("colors", ["blue", "red", "green"], "multi");
    return {
      status: 204,
    };
  },
  kind: "MockApiDefinition",
});

Scenarios.Parameters_CollectionFormat_Query_csv = passOnSuccess({
  uri: `/parameters/collection-format/query/csv`,
  method: "get",
  request: {
    query: { colors: colors.join(",") },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Parameters_CollectionFormat_Query_ssv = passOnSuccess({
  uri: `/parameters/collection-format/query/ssv`,
  method: "get",
  request: {
    query: { colors: colors.join(" ") },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Parameters_CollectionFormat_Query_pipes = passOnSuccess({
  uri: `/parameters/collection-format/query/pipes`,
  method: "get",
  request: {
    query: { colors: colors.join("|") },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Parameters_CollectionFormat_Header_csv = passOnSuccess({
  uri: `/parameters/collection-format/header/csv`,
  method: "get",
  request: {
    headers: { colors: colors.join(",") },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});
