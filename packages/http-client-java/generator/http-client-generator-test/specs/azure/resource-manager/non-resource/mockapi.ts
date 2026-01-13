import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const SUBSCRIPTION_ID_EXPECTED = "00000000-0000-0000-0000-000000000000";
const LOCATION_EXPECTED = "eastus";

const nonResource = {
  id: "id",
  name: "hello",
  type: "nonResource",
};

Scenarios.Azure_ResourceManager_NonResource_NonResourceOperations_get = passOnSuccess({
  uri: "/subscriptions/:subscriptionId/providers/Microsoft.NonResource/locations/:location/otherParameters/:parameter",
  method: "get",
  request: {
    pathParams: {
      subscriptionId: SUBSCRIPTION_ID_EXPECTED,
      location: LOCATION_EXPECTED,
      parameter: "hello",
      "api-version": "2023-12-01-preview",
    },
  },
  response: {
    status: 200,
    body: json(nonResource),
  },
  kind: "MockApiDefinition",
});

Scenarios.Azure_ResourceManager_NonResource_NonResourceOperations_create = passOnSuccess({
  uri: "/subscriptions/:subscriptionId/providers/Microsoft.NonResource/locations/:location/otherParameters/:parameter",
  method: "put",
  request: {
    pathParams: {
      subscriptionId: SUBSCRIPTION_ID_EXPECTED,
      location: LOCATION_EXPECTED,
      parameter: "hello",
      "api-version": "2023-12-01-preview",
    },
    body: json(nonResource),
  },
  response: {
    status: 200,
    body: json(nonResource),
  },
  kind: "MockApiDefinition",
});
