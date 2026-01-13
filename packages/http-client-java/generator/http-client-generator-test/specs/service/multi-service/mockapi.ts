import { passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Service_MultiService_ServiceA_Foo_test = passOnSuccess({
  uri: "/service/multi-service/service-a/foo/test",
  method: "get",
  request: {
    query: {
      "api-version": "av2",
    },
  },
  response: { status: 204 },
  kind: "MockApiDefinition",
});

Scenarios.Service_MultiService_ServiceB_Bar_test = passOnSuccess({
  uri: "/service/multi-service/service-b/bar/test",
  method: "get",
  request: {
    query: {
      "api-version": "bv2",
    },
  },
  response: { status: 204 },
  kind: "MockApiDefinition",
});
