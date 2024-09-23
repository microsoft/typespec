import { passOnSuccess, mockapi, json } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

let generationPollCount = 0;

Scenarios.Azure_Core_Lro_Rpc_longRunningRpc = passOnSuccess([
  mockapi.post("/azure/core/lro/rpc/generations:submit", (req) => {
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
  }),
  mockapi.get("/azure/core/lro/rpc/generations/operations/operation1", (req) => {
    req.expect.containsQueryParam("api-version", "2022-12-01-preview");
    const response =
      generationPollCount > 0
        ? { id: "operation1", status: "Succeeded", result: { data: "text data" } }
        : { id: "operation1", status: "InProgress" };
    generationPollCount += 1;
    return { status: 200, body: json(response) };
  }),
]);

Scenarios.Azure_Core_LRO_RPC_Generations_Operations = passOnSuccess({
  uri: "/azure/core/lro/rpc/generations/operations/operation1",
  mockMethods: [
    {
      method: "get",
      request: {
        config: {
          params: {
            "api-version": "2022-12-01-preview",
          },
        },
      },
      response: {
        status: 200,
        data: { id: "operation1", status: "InProgress" },
      },
    },
    {
      method: "get",
      request: {
        config: {
          params: {
            "api-version": "2022-12-01-preview",
          },
        },
      },
      response: {
        status: 200,
        data: { id: "operation1", status: "Succeeded", result: { data: "text data" } },
      },
    },
  ],
});

Scenarios.Azure_Core_LRO_RPC_Generations = passOnSuccess({
  uri: "/azure/core/lro/rpc/generations:submit",
  mockMethods: [
    {
      method: "post",
      request: {
        body: { prompt: "text" },
        config: {
          params: {
            "api-version": "2022-12-01-preview",
          },
        },
      },
      response: {
        status: 202,
        headers: {
          "operation-location": `/azure/core/lro/rpc/generations/operations/operation1`,
        },
        data: { id: "operation1", status: "InProgress" },
      },
    },
  ],
});
