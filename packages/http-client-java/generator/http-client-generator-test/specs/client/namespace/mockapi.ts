import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Client_ClientNamespace = passOnSuccess([
  {
    uri: "/client/client-namespace/first",
    method: "get",
    response: {
      status: 200,
      body: json({ name: "first" }),
    },
    kind: "MockApiDefinition",
  },
  {
    uri: "/client/client-namespace/second",
    method: "get",
    response: {
      status: 200,
      body: json({ type: "second" }),
    },
    kind: "MockApiDefinition",
  },
]);
