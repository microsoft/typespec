import { passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

// Scenario 1: Move to existing sub client - Mock responses
Scenarios.Azure_ClientGenerator_Core_ClientLocation_MoveToExistingSubClient = passOnSuccess([
  {
    uri: "/azure/client-generator-core/client-location/user",
    method: "get",
    request: {},
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
  {
    uri: "/azure/client-generator-core/client-location/user",
    method: "delete",
    request: {},
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
  {
    uri: "/azure/client-generator-core/client-location/admin",
    method: "get",
    request: {},
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
]);

// Scenario 2: Move to new sub client - Mock responses
Scenarios.Azure_ClientGenerator_Core_ClientLocation_MoveToNewSubClient = passOnSuccess([
  {
    uri: "/azure/client-generator-core/client-location/products",
    method: "get",
    request: {},
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
  {
    uri: "/azure/client-generator-core/client-location/products/archive",
    method: "post",
    request: {},
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
]);

// Scenario 3: Move to root client - Mock responses
Scenarios.Azure_ClientGenerator_Core_ClientLocation_MoveToRootClient = passOnSuccess([
  {
    uri: "/azure/client-generator-core/client-location/resource",
    method: "get",
    request: {},
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
  {
    uri: "/azure/client-generator-core/client-location/health",
    method: "get",
    request: {},
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
]);
