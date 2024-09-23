import { passOnSuccess, mockapi, json, ValidationError } from "@typespec/spec-api";
import { ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const SUBSCRIPTION_ID_EXPECTED = "00000000-0000-0000-0000-000000000000";
const RESOURCE_GROUP_EXPECTED = "test-rg";
const validTopLevelResource = {
  id: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/resourceGroups/${RESOURCE_GROUP_EXPECTED}/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top`,
  name: "top",
  type: "Azure.ResourceManager.Models.Resources/topLevelTrackedResources",
  location: "eastus",
  properties: {
    provisioningState: "Succeeded",
    description: "valid",
  },
  systemData: {
    createdBy: "AzureSDK",
    createdByType: "User",
    createdAt: new Date(),
    lastModifiedBy: "AzureSDK",
    lastModifiedAt: new Date(),
    lastModifiedByType: "User",
  },
};

const validNestedResource = {
  id: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/resourceGroups/${RESOURCE_GROUP_EXPECTED}/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top/nestedProxyResources/nested`,
  name: "nested",
  type: "Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top/nestedProxyResources",
  properties: {
    provisioningState: "Succeeded",
    description: "valid",
  },
  systemData: {
    createdBy: "AzureSDK",
    createdByType: "User",
    createdAt: new Date(),
    lastModifiedBy: "AzureSDK",
    lastModifiedAt: new Date(),
    lastModifiedByType: "User",
  },
};

const validSingletonResource = {
  id: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/resourceGroups/${RESOURCE_GROUP_EXPECTED}/providers/Azure.ResourceManager.Models.Resources/singletonTrackedResources/default`,
  name: "default",
  type: "Azure.ResourceManager.Models.Resources/singletonTrackedResources",
  location: "eastus",
  properties: {
    provisioningState: "Succeeded",
    description: "valid",
  },
  systemData: {
    createdBy: "AzureSDK",
    createdByType: "User",
    createdAt: new Date(),
    lastModifiedBy: "AzureSDK",
    lastModifiedAt: new Date(),
    lastModifiedByType: "User",
  },
};

// singleton tracked resource
Scenarios.Azure_ResourceManager_Models_Resources_SingletonTrackedResources_getByResourceGroup = passOnSuccess([
  mockapi.get(
    "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Models.Resources/singletonTrackedResources/default",
    (req) => {
      req.expect.containsQueryParam("api-version", "2023-12-01-preview");
      if (req.params.subscriptionId !== SUBSCRIPTION_ID_EXPECTED) {
        throw new ValidationError("Unexpected subscriptionId", SUBSCRIPTION_ID_EXPECTED, req.params.subscriptionId);
      }
      if (req.params.resourceGroup.toLowerCase() !== RESOURCE_GROUP_EXPECTED) {
        throw new ValidationError("Unexpected resourceGroup", RESOURCE_GROUP_EXPECTED, req.params.resourceGroup);
      }
      return {
        status: 200,
        body: json(validSingletonResource),
      };
    },
  ),
]);

Scenarios.Azure_ResourceManager_Models_Resources_SingletonTrackedResources_createOrUpdate = passOnSuccess([
  mockapi.put(
    "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Models.Resources/singletonTrackedResources/default",
    (req) => {
      req.expect.containsQueryParam("api-version", "2023-12-01-preview");
      if (req.params.subscriptionId !== SUBSCRIPTION_ID_EXPECTED) {
        throw new ValidationError("Unexpected subscriptionId", SUBSCRIPTION_ID_EXPECTED, req.params.subscriptionId);
      }
      if (req.params.resourceGroup.toLowerCase() !== RESOURCE_GROUP_EXPECTED) {
        throw new ValidationError("Unexpected resourceGroup", RESOURCE_GROUP_EXPECTED, req.params.resourceGroup);
      }
      req.expect.bodyEquals({
        location: "eastus",
        properties: {
          description: "valid",
        },
      });
      return {
        status: 200,
        body: json(validSingletonResource),
      };
    },
  ),
]);

Scenarios.Azure_ResourceManager_Models_Resources_SingletonTrackedResources_update = passOnSuccess([
  mockapi.patch(
    "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Models.Resources/singletonTrackedResources/default",
    (req) => {
      req.expect.containsQueryParam("api-version", "2023-12-01-preview");
      if (req.params.subscriptionId !== SUBSCRIPTION_ID_EXPECTED) {
        throw new ValidationError("Unexpected subscriptionId", SUBSCRIPTION_ID_EXPECTED, req.params.subscriptionId);
      }
      if (req.params.resourceGroup.toLowerCase() !== RESOURCE_GROUP_EXPECTED) {
        throw new ValidationError("Unexpected resourceGroup", RESOURCE_GROUP_EXPECTED, req.params.resourceGroup);
      }
      req.expect.bodyEquals({
        location: "eastus2",
        properties: {
          description: "valid2",
        },
      });
      const resource = JSON.parse(JSON.stringify(validSingletonResource));
      resource.location = "eastus2";
      resource.properties.description = "valid2";
      return {
        status: 200,
        body: json(resource),
      };
    },
  ),
]);

Scenarios.Azure_ResourceManager_Models_Resources_SingletonTrackedResources_listByResourceGroup = passOnSuccess([
  mockapi.get(
    "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Models.Resources/singletonTrackedResources",
    (req) => {
      req.expect.containsQueryParam("api-version", "2023-12-01-preview");
      if (req.params.subscriptionId !== SUBSCRIPTION_ID_EXPECTED) {
        throw new ValidationError("Unexpected subscriptionId", SUBSCRIPTION_ID_EXPECTED, req.params.subscriptionId);
      }
      if (req.params.resourceGroup.toLowerCase() !== RESOURCE_GROUP_EXPECTED) {
        throw new ValidationError("Unexpected resourceGroup", RESOURCE_GROUP_EXPECTED, req.params.resourceGroup);
      }
      return {
        status: 200,
        body: json({
          value: [validSingletonResource],
        }),
      };
    },
  ),
]);

Scenarios.Azure_ResourceManager_Models_Resources_TopLevelTrackedResources_actionSync = passOnSuccess([
  mockapi.post(
    "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/:topLevelResourceName/actionSync",
    (req) => {
      req.expect.containsQueryParam("api-version", "2023-12-01-preview");
      if (req.params.subscriptionId !== SUBSCRIPTION_ID_EXPECTED) {
        throw new ValidationError("Unexpected subscriptionId", SUBSCRIPTION_ID_EXPECTED, req.params.subscriptionId);
      }
      if (req.params.resourceGroup.toLowerCase() !== RESOURCE_GROUP_EXPECTED) {
        throw new ValidationError("Unexpected resourceGroup", RESOURCE_GROUP_EXPECTED, req.params.resourceGroup);
      }
      if (req.params.topLevelResourceName.toLowerCase() !== "top") {
        throw new ValidationError("Unexpected top level resource name", "top", req.params.topLevelResourceName);
      }
      req.expect.bodyEquals({
        message: "Resource action at top level.",
        urgent: true,
      });
      return {
        status: 204,
      };
    },
  ),
]);

// top level tracked resource
Scenarios.Azure_ResourceManager_Models_Resources_TopLevelTrackedResources_get = passOnSuccess([
  mockapi.get(
    "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/:topLevelResourceName",
    (req) => {
      req.expect.containsQueryParam("api-version", "2023-12-01-preview");
      if (req.params.subscriptionId !== SUBSCRIPTION_ID_EXPECTED) {
        throw new ValidationError("Unexpected subscriptionId", SUBSCRIPTION_ID_EXPECTED, req.params.subscriptionId);
      }
      if (req.params.resourceGroup.toLowerCase() !== RESOURCE_GROUP_EXPECTED) {
        throw new ValidationError("Unexpected resourceGroup", RESOURCE_GROUP_EXPECTED, req.params.resourceGroup);
      }
      if (req.params.topLevelResourceName.toLowerCase() !== "top") {
        throw new ValidationError("Unexpected top level resource name", "top", req.params.topLevelResourceName);
      }
      return {
        status: 200,
        body: json(validTopLevelResource),
      };
    },
  ),
]);

Scenarios.Azure_ResourceManager_Models_Resources_TopLevelTrackedResources_createOrReplace = passOnSuccess([
  mockapi.put(
    "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/:topLevelResourceName",
    (req) => {
      req.expect.containsQueryParam("api-version", "2023-12-01-preview");
      if (req.params.subscriptionId !== SUBSCRIPTION_ID_EXPECTED) {
        throw new ValidationError("Unexpected subscriptionId", SUBSCRIPTION_ID_EXPECTED, req.params.subscriptionId);
      }
      if (req.params.resourceGroup.toLowerCase() !== RESOURCE_GROUP_EXPECTED) {
        throw new ValidationError("Unexpected resourceGroup", RESOURCE_GROUP_EXPECTED, req.params.resourceGroup);
      }
      if (req.params.topLevelResourceName.toLowerCase() !== "top") {
        throw new ValidationError("Unexpected top level resource name", "top", req.params.topLevelResourceName);
      }
      req.expect.bodyEquals({
        location: "eastus",
        properties: {
          description: "valid",
        },
      });
      return {
        status: 200,
        body: json(validTopLevelResource),
      };
    },
  ),
]);

Scenarios.Azure_ResourceManager_Models_Resources_TopLevelTrackedResources_update = passOnSuccess([
  mockapi.patch(
    "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/:topLevelResourceName",
    (req) => {
      req.expect.containsQueryParam("api-version", "2023-12-01-preview");
      if (req.params.subscriptionId !== SUBSCRIPTION_ID_EXPECTED) {
        throw new ValidationError("Unexpected subscriptionId", SUBSCRIPTION_ID_EXPECTED, req.params.subscriptionId);
      }
      if (req.params.resourceGroup.toLowerCase() !== RESOURCE_GROUP_EXPECTED) {
        throw new ValidationError("Unexpected resourceGroup", RESOURCE_GROUP_EXPECTED, req.params.resourceGroup);
      }
      if (req.params.topLevelResourceName.toLowerCase() !== "top") {
        throw new ValidationError("Unexpected top level resource name", "top", req.params.topLevelResourceName);
      }
      req.expect.deepEqual(req.body.properties, {
        description: "valid2",
      });
      const resource = JSON.parse(JSON.stringify(validTopLevelResource));
      resource.properties.description = "valid2";
      return {
        status: 200,
        body: json(resource),
      };
    },
  ),
]);

Scenarios.Azure_ResourceManager_Models_Resources_TopLevelTrackedResources_delete = passOnSuccess([
  mockapi.delete(
    "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/:topLevelResourceName",
    (req) => {
      req.expect.containsQueryParam("api-version", "2023-12-01-preview");
      if (req.params.subscriptionId !== SUBSCRIPTION_ID_EXPECTED) {
        throw new ValidationError("Unexpected subscriptionId", SUBSCRIPTION_ID_EXPECTED, req.params.subscriptionId);
      }
      if (req.params.resourceGroup.toLowerCase() !== RESOURCE_GROUP_EXPECTED) {
        throw new ValidationError("Unexpected resourceGroup", RESOURCE_GROUP_EXPECTED, req.params.resourceGroup);
      }
      if (req.params.topLevelResourceName.toLowerCase() !== "top") {
        throw new ValidationError("Unexpected top level resource name", "top", req.params.topLevelResourceName);
      }
      return {
        status: 204,
      };
    },
  ),
]);

Scenarios.Azure_ResourceManager_Models_Resources_TopLevelTrackedResources_listByResourceGroup = passOnSuccess([
  mockapi.get(
    "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources",
    (req) => {
      req.expect.containsQueryParam("api-version", "2023-12-01-preview");
      if (req.params.subscriptionId !== SUBSCRIPTION_ID_EXPECTED) {
        throw new ValidationError("Unexpected subscriptionId", SUBSCRIPTION_ID_EXPECTED, req.params.subscriptionId);
      }
      if (req.params.resourceGroup.toLowerCase() !== RESOURCE_GROUP_EXPECTED) {
        throw new ValidationError("Unexpected resourceGroup", RESOURCE_GROUP_EXPECTED, req.params.resourceGroup);
      }
      return {
        status: 200,
        body: json({
          value: [validTopLevelResource],
        }),
      };
    },
  ),
]);

Scenarios.Azure_ResourceManager_Models_Resources_TopLevelTrackedResources_listBySubscription = passOnSuccess([
  mockapi.get(
    "/subscriptions/:subscriptionId/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources",
    (req) => {
      req.expect.containsQueryParam("api-version", "2023-12-01-preview");
      if (req.params.subscriptionId !== SUBSCRIPTION_ID_EXPECTED) {
        throw new ValidationError("Unexpected subscriptionId", SUBSCRIPTION_ID_EXPECTED, req.params.subscriptionId);
      }
      return {
        status: 200,
        body: json({
          value: [validTopLevelResource],
        }),
      };
    },
  ),
]);

// nested proxy resource
Scenarios.Azure_ResourceManager_Models_Resources_NestedProxyResources_get = passOnSuccess([
  mockapi.get(
    "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/:topLevelResourceName/nestedProxyResources/:nestedResourceName",
    (req) => {
      req.expect.containsQueryParam("api-version", "2023-12-01-preview");
      if (req.params.subscriptionId !== SUBSCRIPTION_ID_EXPECTED) {
        throw new ValidationError("Unexpected subscriptionId", SUBSCRIPTION_ID_EXPECTED, req.params.subscriptionId);
      }
      if (req.params.resourceGroup.toLowerCase() !== RESOURCE_GROUP_EXPECTED) {
        throw new ValidationError("Unexpected resourceGroup", RESOURCE_GROUP_EXPECTED, req.params.resourceGroup);
      }
      if (req.params.topLevelResourceName.toLowerCase() !== "top") {
        throw new ValidationError("Unexpected top level resource name", "top", req.params.topLevelResourceName);
      }
      if (req.params.nestedResourceName.toLowerCase() !== "nested") {
        throw new ValidationError("Unexpected nested resource name", "nested", req.params.nestedResourceName);
      }
      return {
        status: 200,
        body: json(validNestedResource),
      };
    },
  ),
]);

Scenarios.Azure_ResourceManager_Models_Resources_NestedProxyResources_createOrReplace = passOnSuccess([
  mockapi.put(
    "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/:topLevelResourceName/nestedProxyResources/:nestedResourceName",
    (req) => {
      req.expect.containsQueryParam("api-version", "2023-12-01-preview");
      if (req.params.subscriptionId !== SUBSCRIPTION_ID_EXPECTED) {
        throw new ValidationError("Unexpected subscriptionId", SUBSCRIPTION_ID_EXPECTED, req.params.subscriptionId);
      }
      if (req.params.resourceGroup.toLowerCase() !== RESOURCE_GROUP_EXPECTED) {
        throw new ValidationError("Unexpected resourceGroup", RESOURCE_GROUP_EXPECTED, req.params.resourceGroup);
      }
      if (req.params.topLevelResourceName.toLowerCase() !== "top") {
        throw new ValidationError("Unexpected top level resource name", "top", req.params.topLevelResourceName);
      }
      if (req.params.nestedResourceName.toLowerCase() !== "nested") {
        throw new ValidationError("Unexpected nested resource name", "nested", req.params.nestedResourceName);
      }
      req.expect.bodyEquals({
        properties: {
          description: "valid",
        },
      });
      return {
        status: 200,
        body: json(validNestedResource),
      };
    },
  ),
]);

Scenarios.Azure_ResourceManager_Models_Resources_NestedProxyResources_update = passOnSuccess([
  mockapi.patch(
    "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/:topLevelResourceName/nestedProxyResources/:nestedResourceName",
    (req) => {
      req.expect.containsQueryParam("api-version", "2023-12-01-preview");
      if (req.params.subscriptionId !== SUBSCRIPTION_ID_EXPECTED) {
        throw new ValidationError("Unexpected subscriptionId", SUBSCRIPTION_ID_EXPECTED, req.params.subscriptionId);
      }
      if (req.params.resourceGroup.toLowerCase() !== RESOURCE_GROUP_EXPECTED) {
        throw new ValidationError("Unexpected resourceGroup", RESOURCE_GROUP_EXPECTED, req.params.resourceGroup);
      }
      if (req.params.topLevelResourceName.toLowerCase() !== "top") {
        throw new ValidationError("Unexpected top level resource name", "top", req.params.topLevelResourceName);
      }
      if (req.params.nestedResourceName.toLowerCase() !== "nested") {
        throw new ValidationError("Unexpected nested resource name", "nested", req.params.nestedResourceName);
      }
      req.expect.bodyEquals({
        properties: {
          description: "valid2",
        },
      });
      const resource = JSON.parse(JSON.stringify(validNestedResource));
      resource.properties.description = "valid2";
      return {
        status: 200,
        body: json(resource),
      };
    },
  ),
]);

Scenarios.Azure_ResourceManager_Models_Resources_NestedProxyResources_delete = passOnSuccess([
  mockapi.delete(
    "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/:topLevelResourceName/nestedProxyResources/:nestedResourceName",
    (req) => {
      req.expect.containsQueryParam("api-version", "2023-12-01-preview");
      return {
        status: 204,
      };
    },
  ),
]);

Scenarios.Azure_ResourceManager_Models_Resources_NestedProxyResources_listByTopLevelTrackedResource = passOnSuccess([
  mockapi.get(
    "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/:topLevelResourceName/nestedProxyResources",
    (req) => {
      req.expect.containsQueryParam("api-version", "2023-12-01-preview");
      if (req.params.subscriptionId !== SUBSCRIPTION_ID_EXPECTED) {
        throw new ValidationError("Unexpected subscriptionId", SUBSCRIPTION_ID_EXPECTED, req.params.subscriptionId);
      }
      if (req.params.resourceGroup.toLowerCase() !== RESOURCE_GROUP_EXPECTED) {
        throw new ValidationError("Unexpected resourceGroup", RESOURCE_GROUP_EXPECTED, req.params.resourceGroup);
      }
      if (req.params.topLevelResourceName.toLowerCase() !== "top") {
        throw new ValidationError("Unexpected top level resource name", "top", req.params.topLevelResourceName);
      }
      return {
        status: 200,
        body: json({
          value: [validNestedResource],
        }),
      };
    },
  ),
]);

Scenarios.Azure_ResourceManager_Models_Resources_TopLevelTracked_Resources_ActionSync = passOnSuccess({
  uri: "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top/actionSync",
  mockMethods: [
    {
      method: "post",
      request: {
        body: {
          message: "Resource action at top level.",
          urgent: true,
        },
        config: {
          params: {
            "api-version": "2023-12-01-preview",
            "subscriptionId": "00000000-0000-0000-0000-000000000000",
            "resourceGroup": "test-rg",
            "topLevelResourceName": "top",
          },
        },
      },
      response: {
        status: 204,
      },
    },
  ],
});

Scenarios.Azure_ResourceManager_Models_Resources_TopLevelTracked_Resources = passOnSuccess({
  uri: "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top",
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
        data: validTopLevelResource,
      },
    },
    {
      method: "put",
      request: {
        body: {
          location: "eastus",
          properties: {
            description: "valid",
          },
        },
        config: {
          params: {
            "api-version": "2023-12-01-preview",
          },
        },
      },
      response: {
        status: 200,
        data: validTopLevelResource,
      },
    },
    {
      method: "patch",
      request: {
        body: {
          properties: {
            description: "valid2",
          },
        },
        config: {
          params: {
            "api-version": "2023-12-01-preview",
          },
        },
      },
      response: {
        status: 200,
        data: {
          id: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/resourceGroups/${RESOURCE_GROUP_EXPECTED}/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top`,
          name: "top",
          type: "Azure.ResourceManager.Models.Resources/topLevelTrackedResources",
          location: "eastus",
          properties: {
            provisioningState: "Succeeded",
            description: "valid2",
          },
          systemData: {
            createdBy: "AzureSDK",
            createdByType: "User",
            createdAt: new Date(),
            lastModifiedBy: "AzureSDK",
            lastModifiedAt: new Date(),
            lastModifiedByType: "User",
          },
        },
      },
    },
    {
      method: "delete",
      request: {
        config: {
          params: {
            "api-version": "2023-12-01-preview",
          },
        },
      },
      response: {
        status: 204,
      },
    },
  ],
});

Scenarios.Azure_ResourceManager_Models_Resources_TopLevelTracked_Resources_ListByRG = passOnSuccess({
  uri: "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources",
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
        data: {
          value: [
            {
              id: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/resourceGroups/${RESOURCE_GROUP_EXPECTED}/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top`,
              name: "top",
              type: "Azure.ResourceManager.Models.Resources/topLevelTrackedResources",
              location: "eastus",
              properties: {
                provisioningState: "Succeeded",
                description: "valid",
              },
              systemData: {
                createdBy: "AzureSDK",
                createdByType: "User",
                lastModifiedBy: "AzureSDK",
                lastModifiedByType: "User",
              },
            },
          ],
        },
      },
    },
  ],
});

Scenarios.Azure_ResourceManager_Models_Resources_TopLevelTracked_Resources_ListBySubscription = passOnSuccess({
  uri: "/subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources",
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
        data: {
          value: [
            {
              id: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/resourceGroups/${RESOURCE_GROUP_EXPECTED}/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top`,
              name: "top",
              type: "Azure.ResourceManager.Models.Resources/topLevelTrackedResources",
              location: "eastus",
              properties: {
                provisioningState: "Succeeded",
                description: "valid",
              },
              systemData: {
                createdBy: "AzureSDK",
                createdByType: "User",
                lastModifiedBy: "AzureSDK",
                lastModifiedByType: "User",
              },
            },
          ],
        },
      },
    },
  ],
});

Scenarios.Azure_ResourceManager_Models_Resources_NestedProxyResources = passOnSuccess({
  uri: "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top/nestedProxyResources/nested",
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
        data: validNestedResource,
      },
    },
    {
      method: "put",
      request: {
        body: {
          properties: {
            description: "valid",
          },
        },
        config: {
          params: {
            "api-version": "2023-12-01-preview",
          },
        },
      },
      response: {
        status: 200,
        data: validNestedResource,
      },
    },
    {
      method: "patch",
      request: {
        body: {
          properties: {
            description: "valid2",
          },
        },
        config: {
          params: {
            "api-version": "2023-12-01-preview",
          },
        },
      },
      response: {
        status: 200,
        data: {
          id: `/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top/nestedProxyResources/nested`,
          name: "nested",
          type: "Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top/nestedProxyResources",
          properties: {
            provisioningState: "Succeeded",
            description: "valid2",
          },
          systemData: {
            createdBy: "AzureSDK",
            createdByType: "User",
            lastModifiedBy: "AzureSDK",
            lastModifiedByType: "User",
          },
        },
      },
    },
    {
      method: "delete",
      request: {
        config: {
          params: {
            "api-version": "2023-12-01-preview",
          },
        },
      },
      response: {
        status: 204,
      },
    },
  ],
});

Scenarios.Azure_ResourceManager_Models_Resources_NestedProxyResources_listByTopResource = passOnSuccess({
  uri: "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top/nestedProxyResources",
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
        data: {
          value: [
            {
              id: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/resourceGroups/${RESOURCE_GROUP_EXPECTED}/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top/nestedProxyResources/nested`,
              name: "nested",
              type: "Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top/nestedProxyResources",
              properties: {
                provisioningState: "Succeeded",
                description: "valid",
              },
              systemData: {
                createdBy: "AzureSDK",
                createdByType: "User",
                lastModifiedBy: "AzureSDK",
                lastModifiedByType: "User",
              },
            },
          ],
        },
      },
    },
  ],
});
