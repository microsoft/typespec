import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const SUBSCRIPTION_ID_EXPECTED = "00000000-0000-0000-0000-000000000000";
const RESOURCE_GROUP_EXPECTED = "test-rg";
const LOCATION_EXPECTED = "eastus";
const API_VERSION = "2023-12-01-preview";

// Resource objects
const validSubscriptionResource1 = {
  id: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/providers/Azure.ResourceManager.MethodSubscriptionId/subscriptionResource1s/sub-resource-1`,
  name: "sub-resource-1",
  type: "Azure.ResourceManager.MethodSubscriptionId/subscriptionResource1s",
  properties: {
    provisioningState: "Succeeded",
    description: "Valid subscription resource 1",
  },
  systemData: {
    createdBy: "AzureSDK",
    createdByType: "User",
    createdAt: "2023-01-01T00:00:00.000Z",
    lastModifiedBy: "AzureSDK",
    lastModifiedAt: "2023-01-01T00:00:00.000Z",
    lastModifiedByType: "User",
  },
};

const validSubscriptionResource2 = {
  id: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/providers/Azure.ResourceManager.MethodSubscriptionId/subscriptionResource2s/sub-resource-2`,
  name: "sub-resource-2",
  type: "Azure.ResourceManager.MethodSubscriptionId/subscriptionResource2s",
  properties: {
    provisioningState: "Succeeded",
    configValue: "test-config",
  },
  systemData: {
    createdBy: "AzureSDK",
    createdByType: "User",
    createdAt: "2023-01-01T00:00:00.000Z",
    lastModifiedBy: "AzureSDK",
    lastModifiedAt: "2023-01-01T00:00:00.000Z",
    lastModifiedByType: "User",
  },
};

const validMixedSubscriptionResource = {
  id: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/providers/Azure.ResourceManager.MethodSubscriptionId/subscriptionResources/sub-resource`,
  name: "sub-resource",
  type: "Azure.ResourceManager.MethodSubscriptionId/subscriptionResources",
  properties: {
    provisioningState: "Succeeded",
    subscriptionSetting: "test-sub-setting",
  },
  systemData: {
    createdBy: "AzureSDK",
    createdByType: "User",
    createdAt: "2023-01-01T00:00:00.000Z",
    lastModifiedBy: "AzureSDK",
    lastModifiedAt: "2023-01-01T00:00:00.000Z",
    lastModifiedByType: "User",
  },
};

const validResourceGroupResource = {
  id: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/resourceGroups/${RESOURCE_GROUP_EXPECTED}/providers/Azure.ResourceManager.MethodSubscriptionId/resourceGroupResources/rg-resource`,
  name: "rg-resource",
  type: "Azure.ResourceManager.MethodSubscriptionId/resourceGroupResources",
  location: LOCATION_EXPECTED,
  properties: {
    provisioningState: "Succeeded",
    resourceGroupSetting: "test-setting",
  },
  systemData: {
    createdBy: "AzureSDK",
    createdByType: "User",
    createdAt: "2023-01-01T00:00:00.000Z",
    lastModifiedBy: "AzureSDK",
    lastModifiedAt: "2023-01-01T00:00:00.000Z",
    lastModifiedByType: "User",
  },
};

// Helper function to create resource operations
function createResourceOperations(
  resourceTypePattern: string,
  resourceName: string,
  resourceObject: any,
  requestBody: any,
  isResourceGroupScoped = false,
) {
  const baseUri = isResourceGroupScoped
    ? `/subscriptions/:subscriptionId/resourceGroups/:resourceGroupName/providers/Azure.ResourceManager.MethodSubscriptionId/${resourceTypePattern}`
    : `/subscriptions/:subscriptionId/providers/Azure.ResourceManager.MethodSubscriptionId/${resourceTypePattern}`;

  const basePathParams = isResourceGroupScoped
    ? { subscriptionId: SUBSCRIPTION_ID_EXPECTED, resourceGroupName: RESOURCE_GROUP_EXPECTED }
    : { subscriptionId: SUBSCRIPTION_ID_EXPECTED };

  return {
    get: {
      uri: `${baseUri}/:name`,
      method: "get" as const,
      request: {
        pathParams: { ...basePathParams, name: resourceName },
        query: { "api-version": API_VERSION },
      },
      response: {
        status: 200,
        body: json(resourceObject),
      },
      kind: "MockApiDefinition" as const,
    },
    put: {
      uri: `${baseUri}/:name`,
      method: "put" as const,
      request: {
        body: json(requestBody),
        pathParams: { ...basePathParams, name: resourceName },
        query: { "api-version": API_VERSION },
      },
      response: {
        status: 200,
        body: json(resourceObject),
      },
      kind: "MockApiDefinition" as const,
    },
    delete: {
      uri: `${baseUri}/:name`,
      method: "delete" as const,
      request: {
        pathParams: { ...basePathParams, name: resourceName },
        query: { "api-version": API_VERSION },
      },
      response: {
        status: 204,
      },
      kind: "MockApiDefinition" as const,
    },
  };
}

// Resource operations using helper function
const subscriptionResource1Ops = createResourceOperations(
  "subscriptionResource1s",
  "sub-resource-1",
  validSubscriptionResource1,
  { properties: { description: "Valid subscription resource 1" } },
);

const subscriptionResource2Ops = createResourceOperations(
  "subscriptionResource2s",
  "sub-resource-2",
  validSubscriptionResource2,
  { properties: { configValue: "test-config" } },
);

const mixedSubscriptionResourceOps = createResourceOperations(
  "subscriptionResources",
  "sub-resource",
  validMixedSubscriptionResource,
  { properties: { subscriptionSetting: "test-sub-setting" } },
);

const resourceGroupResourceOps = createResourceOperations(
  "resourceGroupResources",
  "rg-resource",
  validResourceGroupResource,
  {
    location: LOCATION_EXPECTED,
    properties: { resourceGroupSetting: "test-setting" },
  },
  true,
);

// Operations scenario
Scenarios.Azure_ResourceManager_MethodSubscriptionId_Operations = passOnSuccess({
  uri: "/providers/Azure.ResourceManager.MethodSubscriptionId/operations",
  method: "get" as const,
  request: {
    query: { "api-version": API_VERSION },
  },
  response: {
    status: 200,
    body: json({
      value: [
        {
          name: "Azure.ResourceManager.MethodSubscriptionId/services/read",
          isDataAction: false,
          display: {
            provider: "Azure.ResourceManager.MethodSubscriptionId",
            resource: "services",
            operation: "Lists services",
            description: "Lists registered services",
          },
        },
      ],
    }),
  },
  kind: "MockApiDefinition" as const,
});

// Scenario assignments
Scenarios.Azure_ResourceManager_MethodSubscriptionId_TwoSubscriptionResourcesMethodLevel_SubscriptionResource1Operations_get =
  passOnSuccess(subscriptionResource1Ops.get);

Scenarios.Azure_ResourceManager_MethodSubscriptionId_TwoSubscriptionResourcesMethodLevel_SubscriptionResource1Operations_put =
  passOnSuccess(subscriptionResource1Ops.put);

Scenarios.Azure_ResourceManager_MethodSubscriptionId_TwoSubscriptionResourcesMethodLevel_SubscriptionResource1Operations_delete =
  passOnSuccess(subscriptionResource1Ops.delete);

Scenarios.Azure_ResourceManager_MethodSubscriptionId_TwoSubscriptionResourcesMethodLevel_SubscriptionResource2Operations_get =
  passOnSuccess(subscriptionResource2Ops.get);

Scenarios.Azure_ResourceManager_MethodSubscriptionId_TwoSubscriptionResourcesMethodLevel_SubscriptionResource2Operations_put =
  passOnSuccess(subscriptionResource2Ops.put);

Scenarios.Azure_ResourceManager_MethodSubscriptionId_TwoSubscriptionResourcesMethodLevel_SubscriptionResource2Operations_delete =
  passOnSuccess(subscriptionResource2Ops.delete);

Scenarios.Azure_ResourceManager_MethodSubscriptionId_MixedSubscriptionPlacement_SubscriptionResourceOperations_get =
  passOnSuccess(mixedSubscriptionResourceOps.get);

Scenarios.Azure_ResourceManager_MethodSubscriptionId_MixedSubscriptionPlacement_SubscriptionResourceOperations_put =
  passOnSuccess(mixedSubscriptionResourceOps.put);

Scenarios.Azure_ResourceManager_MethodSubscriptionId_MixedSubscriptionPlacement_SubscriptionResourceOperations_delete =
  passOnSuccess(mixedSubscriptionResourceOps.delete);

Scenarios.Azure_ResourceManager_MethodSubscriptionId_MixedSubscriptionPlacement_ResourceGroupResourceOperations_get =
  passOnSuccess(resourceGroupResourceOps.get);

Scenarios.Azure_ResourceManager_MethodSubscriptionId_MixedSubscriptionPlacement_ResourceGroupResourceOperations_put =
  passOnSuccess(resourceGroupResourceOps.put);

Scenarios.Azure_ResourceManager_MethodSubscriptionId_MixedSubscriptionPlacement_ResourceGroupResourceOperations_delete =
  passOnSuccess(resourceGroupResourceOps.delete);
