import { passOnSuccess, mockapi, json, ValidationError } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const SUBSCRIPTION_ID_EXPECTED = "00000000-0000-0000-0000-000000000000";
const PRINCIPAL_ID_EXPECTED = "00000000-0000-0000-0000-000000000000";
const TENANT_ID_EXPECTED = "00000000-0000-0000-0000-000000000000";
const CLIENT_ID_EXPECTED = "00000000-0000-0000-0000-000000000000";
const LOCATION_REGION_EXPECTED = "eastus";
const RESOURCE_GROUP_EXPECTED = "test-rg";
const IDENTITY_TYPE_SYSTEM_ASSIGNED_EXPECTED = "SystemAssigned";
const IDENTITY_TYPE_SYSTEM_USER_ASSIGNED_EXPECTED = "SystemAssigned,UserAssigned";
const validSystemAssignedManagedIdentityResource = {
  id: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/resourceGroups/${RESOURCE_GROUP_EXPECTED}/providers/Azure.ResourceManager.Models.CommonTypes.ManagedIdentity/managedIdentityTrackedResources/identity`,
  location: `${LOCATION_REGION_EXPECTED}`,
  tags: {
    tagKey1: "tagValue1",
  },
  identity: {
    type: `${IDENTITY_TYPE_SYSTEM_ASSIGNED_EXPECTED}`,
    principalId: `${PRINCIPAL_ID_EXPECTED}`,
    tenantId: `${TENANT_ID_EXPECTED}`,
  },
  properties: {
    provisioningState: "Succeeded",
  },
};

const validUserAssignedAndSystemAssignedManagedIdentityResource = {
  id: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/resourceGroups/${RESOURCE_GROUP_EXPECTED}/providers/Azure.ResourceManager.Models.CommonTypes.ManagedIdentity/managedIdentityTrackedResources/identity`,
  location: `${LOCATION_REGION_EXPECTED}`,
  tags: {
    tagKey1: "tagValue1",
  },
  identity: {
    type: `${IDENTITY_TYPE_SYSTEM_USER_ASSIGNED_EXPECTED}`,
    userAssignedIdentities: {
      "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/id1":
        {
          principalId: `${PRINCIPAL_ID_EXPECTED}`,
          clientId: `${CLIENT_ID_EXPECTED}`,
        },
    },
    principalId: `${PRINCIPAL_ID_EXPECTED}`,
    tenantId: `${TENANT_ID_EXPECTED}`,
  },
  properties: {
    provisioningState: "Succeeded",
  },
};

const createExpectedIdentity = {
  type: `${IDENTITY_TYPE_SYSTEM_ASSIGNED_EXPECTED}`,
};

const updateExpectedIdentity = {
  type: `${IDENTITY_TYPE_SYSTEM_USER_ASSIGNED_EXPECTED}`,
  userAssignedIdentities: {
    "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/id1":
      {},
  },
};

// managed identity tracked resource
Scenarios.Azure_ResourceManager_Models_CommonTypes_ManagedIdentity_ManagedIdentityTrackedResources_get = passOnSuccess([
  mockapi.get(
    "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Models.CommonTypes.ManagedIdentity/managedIdentityTrackedResources/:managedIdentityResourceName",
    (req) => {
      req.expect.containsQueryParam("api-version", "2023-12-01-preview");
      if (req.params.subscriptionId !== SUBSCRIPTION_ID_EXPECTED) {
        throw new ValidationError("Unexpected subscriptionId", SUBSCRIPTION_ID_EXPECTED, req.params.subscriptionId);
      }
      if (req.params.resourceGroup.toLowerCase() !== RESOURCE_GROUP_EXPECTED) {
        throw new ValidationError("Unexpected resourceGroup", RESOURCE_GROUP_EXPECTED, req.params.resourceGroup);
      }
      if (req.params.managedIdentityResourceName.toLowerCase() !== "identity") {
        throw new ValidationError(
          "Unexpected managed identity resource name",
          "identity",
          req.params.managedIdentityResourceName,
        );
      }
      return {
        status: 200,
        body: json(validSystemAssignedManagedIdentityResource),
      };
    },
  ),
]);

Scenarios.Azure_ResourceManager_Models_CommonTypes_ManagedIdentity_ManagedIdentityTrackedResources_createWithSystemAssigned =
  passOnSuccess([
    mockapi.put(
      "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Models.CommonTypes.ManagedIdentity/managedIdentityTrackedResources/:managedIdentityResourceName",
      (req) => {
        req.expect.containsQueryParam("api-version", "2023-12-01-preview");
        if (req.params.subscriptionId !== SUBSCRIPTION_ID_EXPECTED) {
          throw new ValidationError("Unexpected subscriptionId", SUBSCRIPTION_ID_EXPECTED, req.params.subscriptionId);
        }
        if (req.params.resourceGroup.toLowerCase() !== RESOURCE_GROUP_EXPECTED) {
          throw new ValidationError("Unexpected resourceGroup", RESOURCE_GROUP_EXPECTED, req.params.resourceGroup);
        }
        if (req.params.managedIdentityResourceName.toLowerCase() !== "identity") {
          throw new ValidationError(
            "Unexpected managed identity resource name",
            "identity",
            req.params.managedIdentityResourceName,
          );
        }
        req.expect.deepEqual(req.body["identity"], createExpectedIdentity);
        return {
          status: 200,
          body: json(validSystemAssignedManagedIdentityResource),
        };
      },
    ),
  ]);

Scenarios.Azure_ResourceManager_Models_CommonTypes_ManagedIdentity_ManagedIdentityTrackedResources_updateWithUserAssignedAndSystemAssigned =
  passOnSuccess([
    mockapi.patch(
      "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Models.CommonTypes.ManagedIdentity/managedIdentityTrackedResources/:managedIdentityResourceName",
      (req) => {
        req.expect.containsQueryParam("api-version", "2023-12-01-preview");
        if (req.params.subscriptionId !== SUBSCRIPTION_ID_EXPECTED) {
          throw new ValidationError("Unexpected subscriptionId", SUBSCRIPTION_ID_EXPECTED, req.params.subscriptionId);
        }
        if (req.params.resourceGroup.toLowerCase() !== RESOURCE_GROUP_EXPECTED) {
          throw new ValidationError("Unexpected resourceGroup", RESOURCE_GROUP_EXPECTED, req.params.resourceGroup);
        }
        if (req.params.managedIdentityResourceName.toLowerCase() !== "identity") {
          throw new ValidationError(
            "Unexpected managed identity resource name",
            "identity",
            req.params.managedIdentityResourceName,
          );
        }
        req.expect.deepEqual(req.body["identity"], updateExpectedIdentity);
        return {
          status: 200,
          body: json(validUserAssignedAndSystemAssignedManagedIdentityResource),
        };
      },
    ),
  ]);

Scenarios.Azure_ResourceManager_Models_CommonTypes_ManagedIdentity_ManagedIdentityTrackedResources = passOnSuccess({
  uri: "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.CommonTypes.ManagedIdentity/managedIdentityTrackedResources/identity",
  mockMethods: [
    {
      method: "get",
      request: {
        config: {
          params: {
            "api-version": "2023-12-01-preview",
          },
        },
      },
      response: {
        status: 200,
        data: validSystemAssignedManagedIdentityResource,
      },
    },
    {
      method: "put",
      request: {
        body: {
          identity: createExpectedIdentity,
          location: LOCATION_REGION_EXPECTED,
          tags: { tagKey1: "tagValue1" },
        },
        config: {
          params: {
            "api-version": "2023-12-01-preview",
          },
        },
      },
      response: {
        status: 200,
        data: validSystemAssignedManagedIdentityResource,
      },
    },
    {
      method: "patch",
      request: {
        body: {
          identity: updateExpectedIdentity,
          location: LOCATION_REGION_EXPECTED,
          tags: { tagKey1: "tagValue1" },
        },
        config: {
          params: {
            "api-version": "2023-12-01-preview",
          },
        },
      },
      response: {
        status: 200,
        data: validUserAssignedAndSystemAssignedManagedIdentityResource,
      },
    },
  ],
});
