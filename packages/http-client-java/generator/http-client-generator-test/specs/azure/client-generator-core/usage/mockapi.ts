import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Azure_ClientGenerator_Core_Usage_ModelInOperation = passOnSuccess([
  {
    uri: "/azure/client-generator-core/usage/inputToInputOutput",
    method: "post",
    request: {
      body: json({
        name: "Madge",
      }),
    },
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
  {
    uri: "/azure/client-generator-core/usage/outputToInputOutput",
    method: "get",
    request: {},
    response: {
      status: 200,
      body: json({ name: "Madge" }),
    },
    kind: "MockApiDefinition",
  },
  {
    uri: "/azure/client-generator-core/usage/modelInReadOnlyProperty",
    method: "put",
    request: {},
    response: {
      status: 200,
      body: json({ result: { name: "Madge" } }),
    },
    kind: "MockApiDefinition",
  },
  {
    uri: "/azure/client-generator-core/usage/orphanModelSerializable",
    method: "put",
    request: {
      body: json({
        name: "name",
        desc: "desc",
      }),
    },
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
]);
