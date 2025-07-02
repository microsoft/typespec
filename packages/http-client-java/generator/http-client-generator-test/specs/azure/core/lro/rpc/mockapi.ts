import {
  dyn,
  dynItem,
  json,
  MockRequest,
  passOnSuccess,
  ScenarioMockApi,
} from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

let generationPollCount = 0;

Scenarios.Azure_Core_Lro_Rpc_longRunningRpc = passOnSuccess([
  {
    uri: "/azure/core/lro/rpc/generations:submit",
    method: "post",
    request: {
      body: json({ prompt: "text" }),
      query: {
        "api-version": "2022-12-01-preview",
      },
    },
    response: {
      status: 202,
      headers: {
        "operation-location": dyn`${dynItem("baseUrl")}/azure/core/lro/rpc/generations/operations/operation1`,
      },
      body: json({ id: "operation1", status: "InProgress" }),
    },
    handler: (req: MockRequest) => {
      req.expect.containsQueryParam("api-version", "2022-12-01-preview");
      req.expect.bodyEquals({ prompt: "text" });
      generationPollCount = 0;
      return {
        status: 202,
        headers: {
          "operation-location": `${req.baseUrl}/azure/core/lro/rpc/generations/operations/operation1`,
        },
        body: json({ id: "operation1", status: "InProgress" }),
      };
    },
    kind: "MockApiDefinition",
  },
  {
    uri: "/azure/core/lro/rpc/generations/operations/operation1",
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
    handler: lroHandler,
    kind: "MockApiDefinition",
  },
  {
    uri: "/azure/core/lro/rpc/generations/operations/operation1",
    method: "get",
    request: {
      query: {
        "api-version": "2022-12-01-preview",
      },
    },
    response: {
      status: 200,
      body: json({ id: "operation1", status: "Succeeded", result: { data: "text data" } }),
    },
    handler: lroHandler,
    kind: "MockApiDefinition",
  },
]);

function lroHandler(req: MockRequest) {
  req.expect.containsQueryParam("api-version", "2022-12-01-preview");
  const response =
    generationPollCount > 0
      ? { id: "operation1", status: "Succeeded", result: { data: "text data" } }
      : { id: "operation1", status: "InProgress" };
  generationPollCount += 1;
  return { status: 200, body: json(response) };
}
