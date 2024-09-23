import { passOnSuccess, mockapi } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Parameters_CollectionFormat_Query_multi = passOnSuccess(
  mockapi.get("/parameters/collection-format/query/multi", (req) => {
    req.expect.containsQueryParam("colors", ["blue", "red", "green"], "multi");
    return {
      status: 204,
    };
  }),
);

Scenarios.Parameters_CollectionFormat_Query_csv = passOnSuccess(
  mockapi.get("/parameters/collection-format/query/csv", (req) => {
    req.expect.containsQueryParam("colors", ["blue", "red", "green"], "csv");
    return {
      status: 204,
    };
  }),
);

Scenarios.Parameters_CollectionFormat_Query_ssv = passOnSuccess(
  mockapi.get("/parameters/collection-format/query/ssv", (req) => {
    req.expect.containsQueryParam("colors", ["blue", "red", "green"], "ssv");
    return {
      status: 204,
    };
  }),
);

Scenarios.Parameters_CollectionFormat_Query_tsv = passOnSuccess(
  mockapi.get("/parameters/collection-format/query/tsv", (req) => {
    req.expect.containsQueryParam("colors", ["blue", "red", "green"], "tsv");
    return {
      status: 204,
    };
  }),
);

Scenarios.Parameters_CollectionFormat_Query_pipes = passOnSuccess(
  mockapi.get("/parameters/collection-format/query/pipes", (req) => {
    req.expect.containsQueryParam("colors", ["blue", "red", "green"], "pipes");
    return {
      status: 204,
    };
  }),
);

Scenarios.Parameters_CollectionFormat_Header_csv = passOnSuccess(
  mockapi.get("/parameters/collection-format/header/csv", (req) => {
    req.expect.containsHeader("colors", "blue,red,green");
    return {
      status: 204,
    };
  }),
);

const colors = ["blue", "red", "green"];

Scenarios.Parameters_Collection_Format_Query_Multi = passOnSuccess({
  uri: `/parameters/collection-format/query/multi`,
  mockMethods: [
    {
      method: "get",
      request: {
        config: {
          params: { colors: ["blue", "red", "green"] },
        },
      },
      response: {
        status: 204,
      },
    },
  ],
});

Scenarios.Parameters_Collection_Format_Query_CSV = passOnSuccess({
  uri: `/parameters/collection-format/query/csv`,
  mockMethods: [
    {
      method: "get",
      request: {
        config: {
          params: { colors: colors.join(",") },
        },
      },
      response: {
        status: 204,
      },
    },
  ],
});

Scenarios.Parameters_Collection_Format_Query_SSV = passOnSuccess({
  uri: `/parameters/collection-format/query/ssv`,
  mockMethods: [
    {
      method: "get",
      request: {
        config: {
          params: { colors: colors.join(" ") },
        },
      },
      response: {
        status: 204,
      },
    },
  ],
});

Scenarios.Parameters_Collection_Format_Query_TSV = passOnSuccess({
  uri: `/parameters/collection-format/query/tsv`,
  mockMethods: [
    {
      method: "get",
      request: {
        config: {
          params: { colors: colors.join("\t") },
        },
      },
      response: {
        status: 204,
      },
    },
  ],
});

Scenarios.Parameters_Collection_Format_Query_Pipes = passOnSuccess({
  uri: `/parameters/collection-format/query/pipes`,
  mockMethods: [
    {
      method: "get",
      request: {
        config: {
          params: { colors: colors.join("|") },
        },
      },
      response: {
        status: 204,
      },
    },
  ],
});

Scenarios.Parameters_Collection_Format_Header_CSV = passOnSuccess({
  uri: `/parameters/collection-format/header/csv`,
  mockMethods: [
    {
      method: "get",
      request: {
        config: {
          headers: { colors: colors.join(",") },
        },
      },
      response: {
        status: 204,
      },
    },
  ],
});
