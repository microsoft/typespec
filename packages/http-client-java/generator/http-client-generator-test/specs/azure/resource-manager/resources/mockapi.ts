import { json, passOnSuccess, ScenarioMockApi, ValidationError } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const SUBSCRIPTION_ID_EXPECTED = "00000000-0000-0000-0000-000000000000";
const RESOURCE_GROUP_EXPECTED = "test-rg";
const LOCATION_EXPECTED = "eastus";
const SUBSCRIPTION_SCOPE_URI = `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}`;
const RESOURCE_GROUP_SCOPE_URI = `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/resourceGroups/${RESOURCE_GROUP_EXPECTED}`;
const RESOURCE_SCOPE_URI = `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/resourceGroups/${RESOURCE_GROUP_EXPECTED}/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top`;
const EXTENSION_RESOURCE_NAME = "extension";
const validTopLevelResource = {
  id: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/resourceGroups/${RESOURCE_GROUP_EXPECTED}/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top`,
  name: "top",
  type: "Azure.ResourceManager.Resources/topLevelTrackedResources",
  location: "eastus",
  properties: {
    provisioningState: "Succeeded",
    description: "valid",
  },
  systemData: {
    createdBy: "AzureSDK",
    createdByType: "User",
    createdAt: "2024-10-04T00:56:07.442Z",
    lastModifiedBy: "AzureSDK",
    lastModifiedAt: "2024-10-04T00:56:07.442Z",
    lastModifiedByType: "User",
  },
};

const validNestedResource = {
  id: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/resourceGroups/${RESOURCE_GROUP_EXPECTED}/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top/nestedProxyResources/nested`,
  name: "nested",
  type: "Azure.ResourceManager.Resources/topLevelTrackedResources/top/nestedProxyResources",
  properties: {
    provisioningState: "Succeeded",
    description: "valid",
  },
  systemData: {
    createdBy: "AzureSDK",
    createdByType: "User",
    createdAt: "2024-10-04T00:56:07.442Z",
    lastModifiedBy: "AzureSDK",
    lastModifiedAt: "2024-10-04T00:56:07.442Z",
    lastModifiedByType: "User",
  },
};

const validSingletonResource = {
  id: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/resourceGroups/${RESOURCE_GROUP_EXPECTED}/providers/Azure.ResourceManager.Resources/singletonTrackedResources/default`,
  name: "default",
  type: "Azure.ResourceManager.Resources/singletonTrackedResources",
  location: "eastus",
  properties: {
    provisioningState: "Succeeded",
    description: "valid",
  },
  systemData: {
    createdBy: "AzureSDK",
    createdByType: "User",
    createdAt: "2024-10-04T00:56:07.442Z",
    lastModifiedBy: "AzureSDK",
    lastModifiedAt: "2024-10-04T00:56:07.442Z",
    lastModifiedByType: "User",
  },
};

const validLocationResource = {
  id: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/providers/Azure.ResourceManager.Resources/locations/${LOCATION_EXPECTED}/locationResources/resource`,
  name: "resource",
  type: "Azure.ResourceManager.Resources/locationResources",
  properties: {
    description: "valid",
    provisioningState: "Succeeded",
  },
  systemData: {
    createdBy: "AzureSDK",
    createdByType: "User",
    createdAt: "2024-10-04T00:56:07.442Z",
    lastModifiedBy: "AzureSDK",
    lastModifiedAt: "2024-10-04T00:56:07.442Z",
    lastModifiedByType: "User",
  },
};

const validResourceGroupExtensionsResource = {
  id: `${RESOURCE_GROUP_SCOPE_URI}/providers/Azure.ResourceManager.Resources/extensionsResources/extension`,
  name: EXTENSION_RESOURCE_NAME,
  type: "Azure.ResourceManager.Resources/extensionsResources",
  properties: {
    description: "valid",
    provisioningState: "Succeeded",
  },
  systemData: {
    createdBy: "AzureSDK",
    createdByType: "User",
    createdAt: "2024-10-04T00:56:07.442Z",
    lastModifiedBy: "AzureSDK",
    lastModifiedAt: "2024-10-04T00:56:07.442Z",
    lastModifiedByType: "User",
  },
};

const validSubscriptionExtensionsResource = {
  id: `${SUBSCRIPTION_SCOPE_URI}/providers/Azure.ResourceManager.Resources/extensionsResources/extension`,
  name: EXTENSION_RESOURCE_NAME,
  type: "Azure.ResourceManager.Resources/extensionsResources",
  properties: {
    description: "valid",
    provisioningState: "Succeeded",
  },
  systemData: {
    createdBy: "AzureSDK",
    createdByType: "User",
    createdAt: "2024-10-04T00:56:07.442Z",
    lastModifiedBy: "AzureSDK",
    lastModifiedAt: "2024-10-04T00:56:07.442Z",
    lastModifiedByType: "User",
  },
};

const validTenantExtensionsResource = {
  id: `/providers/Azure.ResourceManager.Resources/extensionsResources/extension`,
  name: EXTENSION_RESOURCE_NAME,
  type: "Azure.ResourceManager.Resources/extensionsResources",
  properties: {
    description: "valid",
    provisioningState: "Succeeded",
  },
  systemData: {
    createdBy: "AzureSDK",
    createdByType: "User",
    createdAt: "2024-10-04T00:56:07.442Z",
    lastModifiedBy: "AzureSDK",
    lastModifiedAt: "2024-10-04T00:56:07.442Z",
    lastModifiedByType: "User",
  },
};

const validResourceExtensionsResource = {
  id: `${RESOURCE_SCOPE_URI}/providers/Azure.ResourceManager.Resources/extensionsResources/extension`,
  name: EXTENSION_RESOURCE_NAME,
  type: "Azure.ResourceManager.Resources/extensionsResources",
  properties: {
    description: "valid",
    provisioningState: "Succeeded",
  },
  systemData: {
    createdBy: "AzureSDK",
    createdByType: "User",
    createdAt: "2024-10-04T00:56:07.442Z",
    lastModifiedBy: "AzureSDK",
    lastModifiedAt: "2024-10-04T00:56:07.442Z",
    lastModifiedByType: "User",
  },
};

// extension tracked resource
Scenarios.Azure_ResourceManager_Resources_ExtensionsResources_get = passOnSuccess([
  {
    uri: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/resourceGroups/${RESOURCE_GROUP_EXPECTED}/providers/Azure.ResourceManager.Resources/extensionsResources/${EXTENSION_RESOURCE_NAME}`,
    method: "get",
    request: {
      query: {
        "api-version": "2023-12-01-preview",
      },
    },
    response: {
      status: 200,
      body: json(validResourceGroupExtensionsResource),
    },
    kind: "MockApiDefinition",
  },
  {
    uri: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/providers/Azure.ResourceManager.Resources/extensionsResources/${EXTENSION_RESOURCE_NAME}`,
    method: "get",
    request: {
      query: {
        "api-version": "2023-12-01-preview",
      },
    },
    response: {
      status: 200,
      body: json(validSubscriptionExtensionsResource),
    },
    kind: "MockApiDefinition",
  },
  {
    uri: `/providers/Azure.ResourceManager.Resources/extensionsResources/${EXTENSION_RESOURCE_NAME}`,
    method: "get",
    request: {
      query: {
        "api-version": "2023-12-01-preview",
      },
    },
    response: {
      status: 200,
      body: json(validTenantExtensionsResource),
    },
    kind: "MockApiDefinition",
  },
  {
    uri: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/resourceGroups/${RESOURCE_GROUP_EXPECTED}/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top/providers/Azure.ResourceManager.Resources/extensionsResources/${EXTENSION_RESOURCE_NAME}`,
    method: "get",
    request: {
      query: {
        "api-version": "2023-12-01-preview",
      },
    },
    response: {
      status: 200,
      body: json(validResourceExtensionsResource),
    },
    kind: "MockApiDefinition",
  },
]);

Scenarios.Azure_ResourceManager_Resources_ExtensionsResources_createOrUpdate = passOnSuccess([
  {
    uri: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/resourceGroups/${RESOURCE_GROUP_EXPECTED}/providers/Azure.ResourceManager.Resources/extensionsResources/${EXTENSION_RESOURCE_NAME}`,
    method: "put",
    request: {
      query: {
        "api-version": "2023-12-01-preview",
      },
      body: json({
        properties: {
          description: "valid",
        },
      }),
    },
    response: {
      status: 200,
      body: json(validResourceGroupExtensionsResource),
    },
    kind: "MockApiDefinition",
  },
  {
    uri: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/providers/Azure.ResourceManager.Resources/extensionsResources/${EXTENSION_RESOURCE_NAME}`,
    method: "put",
    request: {
      query: {
        "api-version": "2023-12-01-preview",
      },
      body: json({
        properties: {
          description: "valid",
        },
      }),
    },
    response: {
      status: 200,
      body: json(validSubscriptionExtensionsResource),
    },
    kind: "MockApiDefinition",
  },
  {
    uri: `/providers/Azure.ResourceManager.Resources/extensionsResources/${EXTENSION_RESOURCE_NAME}`,
    method: "put",
    request: {
      query: {
        "api-version": "2023-12-01-preview",
      },
      body: json({
        properties: {
          description: "valid",
        },
      }),
    },
    response: {
      status: 200,
      body: json(validTenantExtensionsResource),
    },
    kind: "MockApiDefinition",
  },
  {
    uri: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/resourceGroups/${RESOURCE_GROUP_EXPECTED}/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top/providers/Azure.ResourceManager.Resources/extensionsResources/${EXTENSION_RESOURCE_NAME}`,
    method: "put",
    request: {
      query: {
        "api-version": "2023-12-01-preview",
      },
      body: json({
        properties: {
          description: "valid",
        },
      }),
    },
    response: {
      status: 200,
      body: json(validResourceExtensionsResource),
    },
    kind: "MockApiDefinition",
  },
]);

Scenarios.Azure_ResourceManager_Resources_ExtensionsResources_update = passOnSuccess([
  {
    uri: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/resourceGroups/${RESOURCE_GROUP_EXPECTED}/providers/Azure.ResourceManager.Resources/extensionsResources/${EXTENSION_RESOURCE_NAME}`,
    method: "patch",
    request: {
      query: {
        "api-version": "2023-12-01-preview",
      },
      body: json({
        properties: {
          description: "valid2",
        },
      }),
    },
    response: {
      status: 200,
      body: json({
        ...validResourceGroupExtensionsResource,
        properties: {
          provisioningState: "Succeeded",
          description: "valid2",
        },
      }),
    },
    kind: "MockApiDefinition",
  },
  {
    uri: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/providers/Azure.ResourceManager.Resources/extensionsResources/${EXTENSION_RESOURCE_NAME}`,
    method: "patch",
    request: {
      query: {
        "api-version": "2023-12-01-preview",
      },
      body: json({
        properties: {
          description: "valid2",
        },
      }),
    },
    response: {
      status: 200,
      body: json({
        ...validSubscriptionExtensionsResource,
        properties: {
          provisioningState: "Succeeded",
          description: "valid2",
        },
      }),
    },
    kind: "MockApiDefinition",
  },
  {
    uri: `/providers/Azure.ResourceManager.Resources/extensionsResources/${EXTENSION_RESOURCE_NAME}`,
    method: "patch",
    request: {
      query: {
        "api-version": "2023-12-01-preview",
      },
      body: json({
        properties: {
          description: "valid2",
        },
      }),
    },
    response: {
      status: 200,
      body: json({
        ...validTenantExtensionsResource,
        properties: {
          provisioningState: "Succeeded",
          description: "valid2",
        },
      }),
    },
    kind: "MockApiDefinition",
  },
  {
    uri: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/resourceGroups/${RESOURCE_GROUP_EXPECTED}/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top/providers/Azure.ResourceManager.Resources/extensionsResources/${EXTENSION_RESOURCE_NAME}`,
    method: "patch",
    request: {
      query: {
        "api-version": "2023-12-01-preview",
      },
      body: json({
        properties: {
          description: "valid2",
        },
      }),
    },
    response: {
      status: 200,
      body: json({
        ...validResourceExtensionsResource,
        properties: {
          provisioningState: "Succeeded",
          description: "valid2",
        },
      }),
    },
    kind: "MockApiDefinition",
  },
]);

Scenarios.Azure_ResourceManager_Resources_ExtensionsResources_delete = passOnSuccess([
  {
    uri: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/resourceGroups/${RESOURCE_GROUP_EXPECTED}/providers/Azure.ResourceManager.Resources/extensionsResources/${EXTENSION_RESOURCE_NAME}`,
    method: "delete",
    request: {
      query: {
        "api-version": "2023-12-01-preview",
      },
    },
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
  {
    uri: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/providers/Azure.ResourceManager.Resources/extensionsResources/${EXTENSION_RESOURCE_NAME}`,
    method: "delete",
    request: {
      query: {
        "api-version": "2023-12-01-preview",
      },
    },
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
  {
    uri: `/providers/Azure.ResourceManager.Resources/extensionsResources/${EXTENSION_RESOURCE_NAME}`,
    method: "delete",
    request: {
      query: {
        "api-version": "2023-12-01-preview",
      },
    },
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
  {
    uri: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/resourceGroups/${RESOURCE_GROUP_EXPECTED}/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top/providers/Azure.ResourceManager.Resources/extensionsResources/${EXTENSION_RESOURCE_NAME}`,
    method: "delete",
    request: {
      query: {
        "api-version": "2023-12-01-preview",
      },
    },
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  },
]);

Scenarios.Azure_ResourceManager_Resources_ExtensionsResources_listByScope = passOnSuccess([
  {
    uri: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/resourceGroups/${RESOURCE_GROUP_EXPECTED}/providers/Azure.ResourceManager.Resources/extensionsResources`,
    method: "get",
    request: {
      query: {
        "api-version": "2023-12-01-preview",
      },
    },
    response: {
      status: 200,
      body: json({
        value: [validResourceGroupExtensionsResource],
      }),
    },
    kind: "MockApiDefinition",
  },
  {
    uri: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/providers/Azure.ResourceManager.Resources/extensionsResources`,
    method: "get",
    request: {
      query: {
        "api-version": "2023-12-01-preview",
      },
    },
    response: {
      status: 200,
      body: json({
        value: [validSubscriptionExtensionsResource],
      }),
    },
    kind: "MockApiDefinition",
  },
  {
    uri: `/providers/Azure.ResourceManager.Resources/extensionsResources`,
    method: "get",
    request: {
      query: {
        "api-version": "2023-12-01-preview",
      },
    },
    response: {
      status: 200,
      body: json({
        value: [validTenantExtensionsResource],
      }),
    },
    kind: "MockApiDefinition",
  },
  {
    uri: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/resourceGroups/${RESOURCE_GROUP_EXPECTED}/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top/providers/Azure.ResourceManager.Resources/extensionsResources`,
    method: "get",
    request: {
      query: {
        "api-version": "2023-12-01-preview",
      },
    },
    response: {
      status: 200,
      body: json({
        value: [validResourceExtensionsResource],
      }),
    },
    kind: "MockApiDefinition",
  },
]);

// location resource
Scenarios.Azure_ResourceManager_Resources_LocationResources_get = passOnSuccess({
  uri: "/subscriptions/:subscriptionId/providers/Azure.ResourceManager.Resources/locations/:location/locationResources/:locationResourceName",
  method: "get",
  request: {
    pathParams: {
      subscriptionId: SUBSCRIPTION_ID_EXPECTED,
      resourceGroup: RESOURCE_GROUP_EXPECTED,
      topLevelResourceName: "top",
    },
    query: {
      "api-version": "2023-12-01-preview",
    },
  },
  response: {
    status: 200,
    body: json(validLocationResource),
  },
  kind: "MockApiDefinition",
});

Scenarios.Azure_ResourceManager_Resources_LocationResources_createOrUpdate = passOnSuccess({
  uri: "/subscriptions/:subscriptionId/providers/Azure.ResourceManager.Resources/locations/:location/locationResources/:locationResourceName",
  method: "put",
  request: {
    pathParams: {
      subscriptionId: SUBSCRIPTION_ID_EXPECTED,
      resourceGroup: RESOURCE_GROUP_EXPECTED,
      topLevelResourceName: "top",
    },
    query: {
      "api-version": "2023-12-01-preview",
    },
    body: json({
      properties: {
        description: "valid",
      },
    }),
  },
  response: {
    status: 200,
    body: json(validLocationResource),
  },
  kind: "MockApiDefinition",
});

Scenarios.Azure_ResourceManager_Resources_LocationResources_update = passOnSuccess({
  uri: "/subscriptions/:subscriptionId/providers/Azure.ResourceManager.Resources/locations/:location/locationResources/:locationResourceName",
  method: "patch",
  request: {
    pathParams: {
      subscriptionId: SUBSCRIPTION_ID_EXPECTED,
      resourceGroup: RESOURCE_GROUP_EXPECTED,
      topLevelResourceName: "top",
    },
    query: {
      "api-version": "2023-12-01-preview",
    },
    body: json({
      properties: {
        description: "valid2",
      },
    }),
  },
  response: {
    status: 200,
    body: json({
      ...validLocationResource,
      properties: {
        provisioningState: "Succeeded",
        description: "valid2",
      },
    }),
  },
  kind: "MockApiDefinition",
});

Scenarios.Azure_ResourceManager_Resources_LocationResources_delete = passOnSuccess({
  uri: "/subscriptions/:subscriptionId/providers/Azure.ResourceManager.Resources/locations/:location/locationResources/:locationResourceName",
  method: "delete",
  request: {
    pathParams: {
      subscriptionId: SUBSCRIPTION_ID_EXPECTED,
      resourceGroup: RESOURCE_GROUP_EXPECTED,
      topLevelResourceName: "top",
    },
    query: {
      "api-version": "2023-12-01-preview",
    },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Azure_ResourceManager_Resources_LocationResources_listByLocation = passOnSuccess({
  uri: "/subscriptions/:subscriptionId/providers/Azure.ResourceManager.Resources/locations/:location/locationResources",
  method: "get",
  request: {
    pathParams: {
      subscriptionId: SUBSCRIPTION_ID_EXPECTED,
      location: LOCATION_EXPECTED,
    },
    query: { "api-version": "2023-12-01-preview" },
  },
  response: {
    status: 200,
    body: json({
      value: [validLocationResource],
    }),
  },
  kind: "MockApiDefinition",
});

// singleton tracked resource
Scenarios.Azure_ResourceManager_Resources_Singleton_getByResourceGroup = passOnSuccess({
  uri: "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Resources/singletonTrackedResources/default",
  method: "get",
  request: {
    pathParams: {
      subscriptionId: SUBSCRIPTION_ID_EXPECTED,
      resourceGroup: RESOURCE_GROUP_EXPECTED,
    },
    query: {
      "api-version": "2023-12-01-preview",
    },
  },
  response: {
    status: 200,
    body: json(validSingletonResource),
  },
  kind: "MockApiDefinition",
});

Scenarios.Azure_ResourceManager_Resources_Singleton_createOrUpdate = passOnSuccess({
  uri: "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Resources/singletonTrackedResources/default",
  method: "put",
  request: {
    pathParams: {
      subscriptionId: SUBSCRIPTION_ID_EXPECTED,
      resourceGroup: RESOURCE_GROUP_EXPECTED,
    },
    query: {
      "api-version": "2023-12-01-preview",
    },
    body: json({
      location: "eastus",
      properties: {
        description: "valid",
      },
    }),
  },
  response: {
    status: 200,
    body: json(validSingletonResource),
  },
  kind: "MockApiDefinition",
});

Scenarios.Azure_ResourceManager_Resources_Singleton_update = passOnSuccess({
  uri: "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Resources/singletonTrackedResources/default",
  method: "patch",
  request: {
    pathParams: {
      subscriptionId: SUBSCRIPTION_ID_EXPECTED,
      resourceGroup: RESOURCE_GROUP_EXPECTED,
    },
    query: {
      "api-version": "2023-12-01-preview",
    },
    body: json({
      properties: {
        description: "valid2",
      },
    }),
  },
  response: {
    status: 200,
    body: json({
      ...validSingletonResource,
      properties: {
        provisioningState: "Succeeded",
        description: "valid2",
      },
    }),
  },
  kind: "MockApiDefinition",
  handler: (req) => {
    if (req.body["properties"]["description"] !== "valid2") {
      throw new ValidationError(
        "Body should contain 'properties.description' property",
        "valid2",
        req.body,
      );
    }
    return {
      status: 200,
      body: json({
        ...validSingletonResource,
        properties: {
          provisioningState: "Succeeded",
          description: "valid2",
        },
      }),
    };
  },
});

Scenarios.Azure_ResourceManager_Resources_Singleton_listByResourceGroup = passOnSuccess({
  uri: "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Resources/singletonTrackedResources",
  method: "get",
  request: {
    pathParams: {
      subscriptionId: SUBSCRIPTION_ID_EXPECTED,
      resourceGroup: RESOURCE_GROUP_EXPECTED,
    },
    query: {
      "api-version": "2023-12-01-preview",
    },
  },
  response: {
    status: 200,
    body: json({
      value: [validSingletonResource],
    }),
  },
  kind: "MockApiDefinition",
});

Scenarios.Azure_ResourceManager_Resources_TopLevel_actionSync = passOnSuccess({
  uri: "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/:topLevelResourceName/actionSync",
  method: "post",
  request: {
    pathParams: {
      subscriptionId: SUBSCRIPTION_ID_EXPECTED,
      resourceGroup: RESOURCE_GROUP_EXPECTED,
      topLevelResourceName: "top",
    },
    query: {
      "api-version": "2023-12-01-preview",
    },
    body: json({
      message: "Resource action at top level.",
      urgent: true,
    }),
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

// top level tracked resource
Scenarios.Azure_ResourceManager_Resources_TopLevel_get = passOnSuccess({
  uri: "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/:topLevelResourceName",
  method: "get",
  request: {
    pathParams: {
      subscriptionId: SUBSCRIPTION_ID_EXPECTED,
      resourceGroup: RESOURCE_GROUP_EXPECTED,
      topLevelResourceName: "top",
    },
    query: {
      "api-version": "2023-12-01-preview",
    },
  },
  response: {
    status: 200,
    body: json(validTopLevelResource),
  },
  kind: "MockApiDefinition",
});

Scenarios.Azure_ResourceManager_Resources_TopLevel_createOrReplace = passOnSuccess({
  uri: "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/:topLevelResourceName",
  method: "put",
  request: {
    pathParams: {
      subscriptionId: SUBSCRIPTION_ID_EXPECTED,
      resourceGroup: RESOURCE_GROUP_EXPECTED,
      topLevelResourceName: "top",
    },
    query: {
      "api-version": "2023-12-01-preview",
    },
    body: json({
      location: "eastus",
      properties: {
        description: "valid",
      },
    }),
  },
  response: {
    status: 200,
    body: json(validTopLevelResource),
  },
  kind: "MockApiDefinition",
});

Scenarios.Azure_ResourceManager_Resources_TopLevel_update = passOnSuccess({
  uri: "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/:topLevelResourceName",
  method: "patch",
  request: {
    pathParams: {
      subscriptionId: SUBSCRIPTION_ID_EXPECTED,
      resourceGroup: RESOURCE_GROUP_EXPECTED,
      topLevelResourceName: "top",
    },
    query: {
      "api-version": "2023-12-01-preview",
    },
    body: json({
      properties: {
        description: "valid2",
      },
    }),
  },
  response: {
    status: 200,
    body: json({
      ...validTopLevelResource,
      properties: {
        provisioningState: "Succeeded",
        description: "valid2",
      },
    }),
  },
  kind: "MockApiDefinition",
  handler: (req) => {
    if (req.body["properties"]["description"] !== "valid2") {
      throw new ValidationError(
        "Body should contain 'properties.description' property",
        "valid2",
        req.body,
      );
    }
    return {
      status: 200,
      body: json({
        ...validTopLevelResource,
        properties: {
          provisioningState: "Succeeded",
          description: "valid2",
        },
      }),
    };
  },
});

Scenarios.Azure_ResourceManager_Resources_TopLevel_delete = passOnSuccess({
  uri: "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/:topLevelResourceName",
  method: "delete",
  request: {
    pathParams: {
      subscriptionId: SUBSCRIPTION_ID_EXPECTED,
      resourceGroup: RESOURCE_GROUP_EXPECTED,
      topLevelResourceName: "top",
    },
    query: {
      "api-version": "2023-12-01-preview",
    },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Azure_ResourceManager_Resources_TopLevel_listByResourceGroup = passOnSuccess({
  uri: "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Resources/topLevelTrackedResources",
  method: "get",
  request: {
    pathParams: {
      subscriptionId: SUBSCRIPTION_ID_EXPECTED,
      resourceGroup: RESOURCE_GROUP_EXPECTED,
    },
    query: {
      "api-version": "2023-12-01-preview",
    },
  },
  response: {
    status: 200,
    body: json({
      value: [validTopLevelResource],
    }),
  },
  kind: "MockApiDefinition",
});

Scenarios.Azure_ResourceManager_Resources_TopLevel_listBySubscription = passOnSuccess({
  uri: "/subscriptions/:subscriptionId/providers/Azure.ResourceManager.Resources/topLevelTrackedResources",
  method: "get",
  request: {
    pathParams: {
      subscriptionId: SUBSCRIPTION_ID_EXPECTED,
    },
    query: { "api-version": "2023-12-01-preview" },
  },
  response: {
    status: 200,
    body: json({
      value: [validTopLevelResource],
    }),
  },
  kind: "MockApiDefinition",
});

// nested proxy resource
Scenarios.Azure_ResourceManager_Resources_Nested_get = passOnSuccess({
  uri: "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/:topLevelResourceName/nestedProxyResources/:nestedResourceName",
  method: "get",
  request: {
    pathParams: {
      subscriptionId: SUBSCRIPTION_ID_EXPECTED,
      resourceGroup: RESOURCE_GROUP_EXPECTED,
      topLevelResourceName: "top",
      nestedResourceName: "nested",
    },
    query: { "api-version": "2023-12-01-preview" },
  },
  response: {
    status: 200,
    body: json(validNestedResource),
  },
  kind: "MockApiDefinition",
});

Scenarios.Azure_ResourceManager_Resources_Nested_createOrReplace = passOnSuccess({
  uri: "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/:topLevelResourceName/nestedProxyResources/:nestedResourceName",
  method: "put",
  request: {
    pathParams: {
      subscriptionId: SUBSCRIPTION_ID_EXPECTED,
      resourceGroup: RESOURCE_GROUP_EXPECTED,
      topLevelResourceName: "top",
      nestedResourceName: "nested",
    },
    query: { "api-version": "2023-12-01-preview" },
    body: json({
      properties: {
        description: "valid",
      },
    }),
  },
  response: {
    status: 200,
    body: json(validNestedResource),
  },
  kind: "MockApiDefinition",
});

Scenarios.Azure_ResourceManager_Resources_Nested_update = passOnSuccess({
  uri: "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/:topLevelResourceName/nestedProxyResources/:nestedResourceName",
  method: "patch",
  request: {
    pathParams: {
      subscriptionId: SUBSCRIPTION_ID_EXPECTED,
      resourceGroup: RESOURCE_GROUP_EXPECTED,
      topLevelResourceName: "top",
      nestedResourceName: "nested",
    },
    query: { "api-version": "2023-12-01-preview" },
    body: json({
      properties: {
        description: "valid2",
      },
    }),
  },
  response: {
    status: 200,
    body: json({
      ...validNestedResource,
      properties: {
        provisioningState: "Succeeded",
        description: "valid2",
      },
    }),
  },
  kind: "MockApiDefinition",
});

Scenarios.Azure_ResourceManager_Resources_Nested_delete = passOnSuccess({
  uri: "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/:topLevelResourceName/nestedProxyResources/:nestedResourceName",
  method: "delete",
  request: {
    pathParams: {
      subscriptionId: SUBSCRIPTION_ID_EXPECTED,
      resourceGroup: RESOURCE_GROUP_EXPECTED,
      topLevelResourceName: "top",
      nestedResourceName: "nested",
    },
    query: { "api-version": "2023-12-01-preview" },
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

Scenarios.Azure_ResourceManager_Resources_Nested_listByTopLevelTrackedResource = passOnSuccess({
  uri: "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/:topLevelResourceName/nestedProxyResources",
  method: "get",
  request: {
    pathParams: {
      subscriptionId: SUBSCRIPTION_ID_EXPECTED,
      resourceGroup: RESOURCE_GROUP_EXPECTED,
      topLevelResourceName: "top",
    },
    query: {
      "api-version": "2023-12-01-preview",
    },
  },
  response: {
    status: 200,
    body: json({
      value: [validNestedResource],
    }),
  },
  kind: "MockApiDefinition",
});
