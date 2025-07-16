import { passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

// Test parameter reordering with @override decorator
// Verifies that parameters are reordered correctly in client method signature
// Expected path: /azure/client-generator-core/override/reorder/{param2}/{param1}
// Where param1="param1" and param2="param2"
Scenarios.Azure_ClientGenerator_Core_Override_ReorderParameters_reorder = passOnSuccess([
  {
    uri: "/azure/client-generator-core/override/reorder/param2/param1",
    method: "get",
    request: {},
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
]);

// Test parameter grouping with @override decorator
// Verifies that parameters are grouped correctly into GroupParametersOptions
// Expected query parameters: param1="param1", param2="param2"
Scenarios.Azure_ClientGenerator_Core_Override_GroupParameters_group = passOnSuccess([
  {
    uri: "/azure/client-generator-core/override/group",
    method: "get",
    request: {
      query: {
        param1: "param1",
        param2: "param2",
      },
    },
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
]);
