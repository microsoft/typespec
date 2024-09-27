import { MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const colors = ["blue", "red", "green"];

Scenarios.Parameters_CollectionFormat_Query_multi = passOnSuccess({
  uri: `/parameters/collection-format/query/multi`,
  mockMethod: {
    method: "get",
    request: {
      params: { colors: ["blue", "red", "green"] },
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
  },
  kind: "MockApiDefinition",
});

Scenarios.Parameters_CollectionFormat_Query_csv = passOnSuccess({
  uri: `/parameters/collection-format/query/csv`,
  mockMethod: {
    method: "get",
    request: {
      params: { colors: colors.join(",") },
    },
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      req.expect.containsQueryParam("colors", ["blue", "red", "green"], "csv");
      return {
        status: 204,
      };
    },
  },
  kind: "MockApiDefinition",
});

Scenarios.Parameters_CollectionFormat_Query_ssv = passOnSuccess({
  uri: `/parameters/collection-format/query/ssv`,
  mockMethod: {
    method: "get",
    request: {
      params: { colors: colors.join(" ") },
    },
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      req.expect.containsQueryParam("colors", ["blue", "red", "green"], "ssv");
      return {
        status: 204,
      };
    },
  },
  kind: "MockApiDefinition",
});

Scenarios.Parameters_CollectionFormat_Query_tsv = passOnSuccess({
  uri: `/parameters/collection-format/query/tsv`,
  mockMethod: {
    method: "get",
    request: {
      params: { colors: colors.join("\t") },
    },
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      req.expect.containsQueryParam("colors", ["blue", "red", "green"], "tsv");
      return {
        status: 204,
      };
    },
  },
  kind: "MockApiDefinition",
});

Scenarios.Parameters_CollectionFormat_Query_pipes = passOnSuccess({
  uri: `/parameters/collection-format/query/pipes`,
  mockMethod: {
    method: "get",
    request: {
      params: { colors: colors.join("|") },
    },
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      req.expect.containsQueryParam("colors", ["blue", "red", "green"], "pipes");
      return {
        status: 204,
      };
    },
  },
  kind: "MockApiDefinition",
});

Scenarios.Parameters_CollectionFormat_Header_csv = passOnSuccess({
  uri: `/parameters/collection-format/header/csv`,
  mockMethod: {
    method: "get",
    request: {
      headers: { colors: colors.join(",") },
    },
    response: {
      status: 204,
    },
    handler: (req: MockRequest) => {
      req.expect.containsHeader("colors", "blue,red,green");
      return {
        status: 204,
      };
    },
  },
  kind: "MockApiDefinition",
});
