import {
  dyn,
  dynItem,
  json,
  MockRequest,
  passOnSuccess,
  ScenarioMockApi,
} from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const validUser = { name: "madge", role: "contributor" };
let createOrReplacePollCount = 0;
let deletePollCount = 0;
let exportPollCount = 0;

function createOrReplaceLroHandler(req: MockRequest) {
  req.expect.containsQueryParam("api-version", "2022-12-01-preview");
  const response =
    createOrReplacePollCount > 0
      ? { id: "operation1", status: "Succeeded" }
      : { id: "operation1", status: "InProgress" };
  createOrReplacePollCount += 1;
  return { status: 200, body: json(response) };
}

function deleteLroHandler(req: MockRequest) {
  req.expect.containsQueryParam("api-version", "2022-12-01-preview");
  const response =
    deletePollCount > 0
      ? { id: "operation2", status: "Succeeded" }
      : { id: "operation2", status: "InProgress" };
  deletePollCount += 1;
  return { status: 200, body: json(response) };
}

function exportLroHandler(req: MockRequest) {
  req.expect.containsQueryParam("api-version", "2022-12-01-preview");
  const response =
    exportPollCount > 0
      ? {
          id: "operation3",
          status: "Succeeded",
          result: { name: "madge", resourceUri: "/users/madge" },
        }
      : { id: "operation3", status: "InProgress" };
  exportPollCount += 1;
  return { status: 200, body: json(response) };
}

Scenarios.Azure_Core_Lro_Standard_createOrReplace = passOnSuccess([
  {
    uri: "/azure/core/lro/standard/users/madge",
    method: "put",
    request: {
      body: json({ role: "contributor" }),
      query: {
        "api-version": "2022-12-01-preview",
      },
    },
    response: {
      status: 201,
      headers: {
        "operation-location": dyn`${dynItem("baseUrl")}/azure/core/lro/standard/users/madge/operations/operation1`,
      },
      body: json(validUser),
    },
    handler: (req: MockRequest) => {
      req.expect.containsQueryParam("api-version", "2022-12-01-preview");
      req.expect.bodyEquals({ role: "contributor" });
      createOrReplacePollCount = 0;
      return {
        status: 201,
        headers: {
          "operation-location": `${req.baseUrl}/azure/core/lro/standard/users/madge/operations/operation1`,
        },
        body: json(validUser),
      };
    },
    kind: "MockApiDefinition",
  },
  {
    uri: "/azure/core/lro/standard/users/madge/operations/operation1",
    method: "get",
    request: {
      query: {
        "api-version": "2022-12-01-preview",
      },
    },
    response: {
      status: 200,
      body: json({ id: "operation1", status: "InProgress" }),
    },
    handler: createOrReplaceLroHandler,
    kind: "MockApiDefinition",
  },
  {
    uri: "/azure/core/lro/standard/users/madge/operations/operation1",
    method: "get",
    request: {
      query: {
        "api-version": "2022-12-01-preview",
      },
    },
    response: {
      status: 200,
      body: json({ id: "operation1", status: "Succeeded" }),
    },
    handler: createOrReplaceLroHandler,
    kind: "MockApiDefinition",
  },
  {
    uri: "/azure/core/lro/standard/users/madge",
    method: "get",
    request: {},
    response: {
      status: 200,
      body: json(validUser),
    },
    kind: "MockApiDefinition",
  },
]);

Scenarios.Azure_Core_Lro_Standard_delete = passOnSuccess([
  {
    uri: "/azure/core/lro/standard/users/madge",
    method: "delete",
    request: {
      query: {
        "api-version": "2022-12-01-preview",
      },
    },
    response: {
      status: 202,
      headers: {
        "operation-location": dyn`${dynItem("baseUrl")}/azure/core/lro/standard/users/madge/operations/operation2`,
      },
      body: json({ id: "operation2", status: "InProgress" }),
    },
    handler: (req: MockRequest) => {
      req.expect.containsQueryParam("api-version", "2022-12-01-preview");
      deletePollCount = 0;
      return {
        status: 202,
        headers: {
          "operation-location": `${req.baseUrl}/azure/core/lro/standard/users/madge/operations/operation2`,
        },
        body: json({ id: "operation2", status: "InProgress" }),
      };
    },
    kind: "MockApiDefinition",
  },
  {
    uri: "/azure/core/lro/standard/users/madge/operations/operation2",
    method: "get",
    request: {
      query: {
        "api-version": "2022-12-01-preview",
      },
    },
    response: {
      status: 200,
      body: json({ id: "operation2", status: "InProgress" }),
    },
    handler: deleteLroHandler,
    kind: "MockApiDefinition",
  },
  {
    uri: "/azure/core/lro/standard/users/madge/operations/operation2",
    method: "get",
    request: {
      query: {
        "api-version": "2022-12-01-preview",
      },
    },
    response: {
      status: 200,
      body: json({ id: "operation2", status: "Succeeded" }),
    },
    handler: deleteLroHandler,
    kind: "MockApiDefinition",
  },
]);

Scenarios.Azure_Core_Lro_Standard_export = passOnSuccess([
  {
    uri: "/azure/core/lro/standard/users/madge:export",
    method: "post",
    request: {
      query: {
        "api-version": "2022-12-01-preview",
        format: "json",
      },
    },
    response: {
      status: 202,
      headers: {
        "operation-location": dyn`${dynItem("baseUrl")}/azure/core/lro/standard/users/madge/operations/operation3`,
      },
      body: json({ id: "operation3", status: "InProgress" }),
    },
    handler: (req: MockRequest) => {
      req.expect.containsQueryParam("api-version", "2022-12-01-preview");
      req.expect.containsQueryParam("format", "json");
      exportPollCount = 0;
      return {
        status: 202,
        headers: {
          "operation-location": `${req.baseUrl}/azure/core/lro/standard/users/madge/operations/operation3`,
        },
        body: json({ id: "operation3", status: "InProgress" }),
      };
    },
    kind: "MockApiDefinition",
  },
  {
    uri: "/azure/core/lro/standard/users/madge/operations/operation3",
    method: "get",
    request: {
      query: {
        "api-version": "2022-12-01-preview",
      },
    },
    response: {
      status: 200,
      body: json({ id: "operation3", status: "InProgress" }),
    },
    handler: exportLroHandler,
    kind: "MockApiDefinition",
  },
  {
    uri: "/azure/core/lro/standard/users/madge/operations/operation3",
    method: "get",
    request: {
      query: {
        "api-version": "2022-12-01-preview",
      },
    },
    response: {
      status: 200,
      body: json({
        id: "operation3",
        status: "Succeeded",
        result: { name: "madge", resourceUri: "/users/madge" },
      }),
    },
    handler: exportLroHandler,
    kind: "MockApiDefinition",
  },
]);
