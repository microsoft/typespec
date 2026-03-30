import { passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Payload_Head_getProperties = passOnSuccess({
  uri: "/payload/head/properties",
  method: "head",
  request: {},
  response: {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-ms-meta": "hello",
    },
  },
  kind: "MockApiDefinition",
});
