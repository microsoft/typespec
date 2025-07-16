import {
  dyn,
  dynItem,
  json,
  MockRequest,
  passOnSuccess,
  ScenarioMockApi,
  ValidationError,
  withServiceKeys,
} from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const SUBSCRIPTION_ID_EXPECTED = "00000000-0000-0000-0000-000000000000";
const RESOURCE_GROUP_EXPECTED = "test-rg";
const validOrder = {
  id: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/resourceGroups/${RESOURCE_GROUP_EXPECTED}/providers/Azure.ResourceManager.OperationTemplates/orders/order1`,
  name: "order1",
  type: "Azure.ResourceManager.Resources/orders",
  location: "eastus",
  properties: {
    provisioningState: "Succeeded",
    productId: "product1",
    amount: 1,
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
const validOperation = {
  name: "Microsoft.Compute/virtualMachines/write",
  isDataAction: false,
  display: {
    provider: "Microsoft Compute",
    resource: "Virtual Machines",
    operation: "Create or Update Virtual Machine.",
    description: "Add or modify virtual machines.",
  },
  origin: "user,system",
  actionType: "Internal",
};
const checkNameAvailabilityResponse = {
  nameAvailable: false,
  reason: "AlreadyExists",
  message: "Hostname 'checkName' already exists. Please select a different name.",
};
let createOrReplacePollCount = 0;
let postPollCount = 0;
let deletePollCount = 0;

// operation list
Scenarios.Azure_ResourceManager_OperationTemplates_ListAvailableOperations = passOnSuccess({
  uri: "/providers/Azure.ResourceManager.OperationTemplates/operations",
  method: "get",
  request: {
    query: {
      "api-version": "2023-12-01-preview",
    },
  },
  response: {
    status: 200,
    body: json({
      value: [validOperation],
    }),
  },
  kind: "MockApiDefinition",
});

// Check Global Name Availability
Scenarios.Azure_ResourceManager_OperationTemplates_CheckNameAvailability_checkGlobal =
  passOnSuccess({
    uri: "/subscriptions/:subscriptionId/providers/Azure.ResourceManager.OperationTemplates/checkNameAvailability",
    method: "post",
    request: {
      pathParams: {
        subscriptionId: SUBSCRIPTION_ID_EXPECTED,
      },
      query: {
        "api-version": "2023-12-01-preview",
      },
      body: json({
        name: "checkName",
        type: "Microsoft.Web/site",
      }),
    },
    response: {
      status: 200,
      body: json(checkNameAvailabilityResponse),
    },
    kind: "MockApiDefinition",
  });

// Check Local Name Availability
Scenarios.Azure_ResourceManager_OperationTemplates_CheckNameAvailability_checkLocal = passOnSuccess(
  {
    uri: "/subscriptions/:subscriptionId/providers/Azure.ResourceManager.OperationTemplates/locations/:location/checkNameAvailability",
    method: "post",
    request: {
      pathParams: {
        subscriptionId: SUBSCRIPTION_ID_EXPECTED,
        location: "westus",
      },
      query: {
        "api-version": "2023-12-01-preview",
      },
      body: json({
        name: "checkName",
        type: "Microsoft.Web/site",
      }),
    },
    response: {
      status: 200,
      body: json(checkNameAvailabilityResponse),
    },
    kind: "MockApiDefinition",
  },
);

// lro resource
Scenarios.Azure_ResourceManager_OperationTemplates_Lro_createOrReplace = passOnSuccess([
  {
    // LRO PUT initial request
    uri: "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.OperationTemplates/orders/:orderName",
    method: "put",
    request: {
      pathParams: {
        subscriptionId: SUBSCRIPTION_ID_EXPECTED,
        resourceGroup: RESOURCE_GROUP_EXPECTED,
        orderName: "order1",
      },
      query: {
        "api-version": "2023-12-01-preview",
      },
      body: json({
        location: "eastus",
        properties: {
          productId: "product1",
          amount: 1,
        },
      }),
    },
    response: {
      status: 201,
      headers: {
        "azure-asyncoperation": dyn`${dynItem("baseUrl")}/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/providers/Azure.ResourceManager.OperationTemplates/locations/eastus/operations/lro_create_aao`,
      },
      body: json({
        ...validOrder,
        properties: {
          provisioningState: "InProgress",
        },
      }),
    },
    handler: (req: MockRequest) => {
      createOrReplacePollCount = 0;
      return {
        status: 201,
        headers: {
          "azure-asyncoperation": `${req.baseUrl}/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/providers/Azure.ResourceManager.OperationTemplates/locations/eastus/operations/lro_create_aao`,
        },
        body: json({
          ...validOrder,
          properties: {
            provisioningState: "InProgress",
          },
        }),
      };
    },
    kind: "MockApiDefinition",
  },
  {
    // LRO PUT poll intermediate/get final result
    uri: "/subscriptions/:subscriptionId/providers/Azure.ResourceManager.OperationTemplates/locations/eastus/operations/lro_create_aao",
    method: "get",
    request: {
      pathParams: {
        subscriptionId: SUBSCRIPTION_ID_EXPECTED,
      },
      query: {
        "api-version": "2023-12-01-preview",
      },
    },
    response: {
      status: 202,
      body: json({
        id: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/providers/Azure.ResourceManager.OperationTemplates/locations/eastus/operations/lro_create_aao`,
        name: "lro_create_aao",
        startTime: "2024-11-08T01:41:53.5508583+00:00",
        status: "InProgress",
      }),
    },
    handler: (req: MockRequest) => {
      const aaoResponse = {
        id: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/providers/Azure.ResourceManager.OperationTemplates/locations/eastus/operations/lro_create_aao`,
        name: "lro_create_aao",
        startTime: "2024-11-08T01:41:53.5508583+00:00",
      };
      const response =
        createOrReplacePollCount > 0
          ? {
              ...aaoResponse,
              status: "Succeeded",
              endTime: "2024-11-08T01:42:41.5354192+00:00",
              properties: validOrder,
            }
          : { ...aaoResponse, status: "InProgress" };
      const statusCode = createOrReplacePollCount > 0 ? 200 : 202;
      createOrReplacePollCount += 1;
      return {
        status: statusCode,
        body: json(response),
      };
    },
    kind: "MockApiDefinition",
  },
  {
    // LRO PUT get final result through initial request uri
    uri: "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.OperationTemplates/orders/:orderName",
    method: "get",
    request: {
      pathParams: {
        subscriptionId: SUBSCRIPTION_ID_EXPECTED,
        resourceGroup: RESOURCE_GROUP_EXPECTED,
        orderName: "order1",
      },
      query: {
        "api-version": "2023-12-01-preview",
      },
    },
    response: {
      status: 200,
      body: json(validOrder),
    },
    kind: "MockApiDefinition",
  },
]);

Scenarios.Azure_ResourceManager_OperationTemplates_Lro_export = passOnSuccess([
  {
    // LRO POST initial request
    uri: "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.OperationTemplates/orders/:orderName/export",
    method: "post",
    request: {
      pathParams: {
        subscriptionId: SUBSCRIPTION_ID_EXPECTED,
        resourceGroup: RESOURCE_GROUP_EXPECTED,
        orderName: "order1",
      },
      query: {
        "api-version": "2023-12-01-preview",
      },
      body: json({
        format: "csv",
      }),
    },
    response: {
      status: 202,
      headers: {
        location: dyn`${dynItem("baseUrl")}/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/providers/Azure.ResourceManager.OperationTemplates/locations/eastus/operations/lro_post_location`,
        "azure-asyncoperation": dyn`${dynItem("baseUrl")}/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/providers/Azure.ResourceManager.OperationTemplates/locations/eastus/operations/lro_post_aao`,
      },
    },
    handler: (req: MockRequest) => {
      postPollCount = 0;
      return {
        status: 202,
        headers: {
          location: `${req.baseUrl}/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/providers/Azure.ResourceManager.OperationTemplates/locations/eastus/operations/lro_post_location`,
          "azure-asyncoperation": `${req.baseUrl}/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/providers/Azure.ResourceManager.OperationTemplates/locations/eastus/operations/lro_post_aao`,
        },
      };
    },
    kind: "MockApiDefinition",
  },
  {
    // LRO POST poll intermediate/get final result
    uri: "/subscriptions/:subscriptionId/providers/Azure.ResourceManager.OperationTemplates/locations/eastus/operations/:operation_name",
    method: "get",
    request: {
      pathParams: {
        subscriptionId: SUBSCRIPTION_ID_EXPECTED,
        operation_name: "lro_post_aao", // operation_name can be "lro_post_location" or "lro_post_aao", depending on the header you choose to poll. "lro_post_aao" here is just for passing e2e test
      },
      query: {
        "api-version": "2023-12-01-preview",
      },
    },
    response: {
      status: 200, // This is for passing e2e test. For actual status code, see "handler" definition below
    },
    handler: (req: MockRequest) => {
      let response;
      const operation_name = req.params["operation_name"];
      if (operation_name === "lro_post_location") {
        response =
          // first status will be 200, second and forward be 204
          postPollCount > 0
            ? {
                status: 200,
                body: json({
                  content: "order1,product1,1",
                }),
              }
            : { status: 202 };
      } else if (operation_name === "lro_post_aao") {
        const aaoResponse = {
          id: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/providers/Azure.ResourceManager.OperationTemplates/locations/eastus/operations/lro_post_aao`,
          name: "lro_post_aao",
          startTime: "2024-11-08T01:41:53.5508583+00:00",
        };
        // first provisioningState will be "InProgress", second and forward be "Succeeded"
        const responseBody =
          postPollCount > 0
            ? {
                ...aaoResponse,
                status: "Succeeded",
                endTime: "2024-11-08T01:42:41.5354192+00:00",
              }
            : { ...aaoResponse, status: "InProgress" };

        response = {
          status: 200, // aao always returns 200 with response body
          body: json(responseBody),
        };
      } else {
        throw new ValidationError(
          `Unexpected lro poll operation: ${operation_name}`,
          undefined,
          undefined,
        );
      }

      postPollCount += 1;

      return response;
    },
    kind: "MockApiDefinition",
  },
]);

Scenarios.Azure_ResourceManager_OperationTemplates_Lro_delete = passOnSuccess([
  {
    // LRO DELETE initial request
    uri: "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.OperationTemplates/orders/:orderName",
    method: "delete",
    request: {
      pathParams: {
        subscriptionId: SUBSCRIPTION_ID_EXPECTED,
        resourceGroup: RESOURCE_GROUP_EXPECTED,
        orderName: "order1",
      },
      query: {
        "api-version": "2023-12-01-preview",
      },
    },
    response: {
      status: 202,
      headers: {
        location: dyn`${dynItem("baseUrl")}/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/providers/Azure.ResourceManager.OperationTemplates/locations/eastus/operationResults/lro_delete_location`,
      },
    },
    handler: (req: MockRequest) => {
      deletePollCount = 0;
      return {
        status: 202,
        headers: {
          location: `${req.baseUrl}/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/providers/Azure.ResourceManager.OperationTemplates/locations/eastus/operationResults/lro_delete_location`,
        },
      };
    },
    kind: "MockApiDefinition",
  },
  {
    // LRO DELETE poll intermediate/get final result
    uri: "/subscriptions/:subscriptionId/providers/Azure.ResourceManager.OperationTemplates/locations/eastus/operationResults/lro_delete_location",
    method: "get",
    request: {
      pathParams: {
        subscriptionId: SUBSCRIPTION_ID_EXPECTED,
      },
      query: {
        "api-version": "2023-12-01-preview",
      },
    },
    response: {
      status: 202, // This is for passing e2e test. For actual status code, see "handler" definition below
    },
    handler: (req: MockRequest) => {
      const response =
        // first status will be 202, second and forward be 204
        deletePollCount > 0 ? { status: 204 } : { status: 202 };

      deletePollCount += 1;

      return response;
    },
    kind: "MockApiDefinition",
  },
]);

// Optional Body scenarios
const validWidget = {
  id: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/resourceGroups/${RESOURCE_GROUP_EXPECTED}/providers/Azure.ResourceManager.OperationTemplates/widgets/widget1`,
  name: "widget1",
  type: "Azure.ResourceManager.OperationTemplates/widgets",
  location: "eastus",
  properties: {
    name: "widget1",
    description: "A test widget",
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

// GET operation
Scenarios.Azure_ResourceManager_OperationTemplates_OptionalBody_get = passOnSuccess({
  uri: "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.OperationTemplates/widgets/:widgetName",
  method: "get",
  request: {
    pathParams: {
      subscriptionId: SUBSCRIPTION_ID_EXPECTED,
      resourceGroup: RESOURCE_GROUP_EXPECTED,
      widgetName: "widget1",
    },
    query: {
      "api-version": "2023-12-01-preview",
    },
  },
  response: {
    status: 200,
    body: json(validWidget),
  },
  kind: "MockApiDefinition",
});

// PATCH operation with optional body - test both with and without body
Scenarios.Azure_ResourceManager_OperationTemplates_OptionalBody_patch = withServiceKeys([
  "EmptyBody",
  "WithBody",
]).pass({
  uri: "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.OperationTemplates/widgets/:widgetName",
  method: "patch",
  request: {
    pathParams: {
      subscriptionId: SUBSCRIPTION_ID_EXPECTED,
      resourceGroup: RESOURCE_GROUP_EXPECTED,
      widgetName: "widget1",
    },
    query: {
      "api-version": "2023-12-01-preview",
    },
  },
  response: {
    status: 200,
  },
  handler: (req: MockRequest) => {
    // Check if request has a body with content
    if (req.body && Object.keys(req.body).length > 0) {
      // WithBody scenario - validate and merge request body with existing widget
      const requestBody = req.body as { properties?: { name?: string; description?: string } };

      // Validate expected values
      if (
        requestBody.properties?.name === "updated-widget" &&
        requestBody.properties?.description === "Updated description"
      ) {
        const updatedWidget = {
          ...validWidget,
          properties: {
            ...validWidget.properties,
            name: requestBody.properties.name,
            description: requestBody.properties.description,
          },
        };
        return {
          pass: "WithBody",
          status: 200,
          body: json(updatedWidget),
        };
      } else {
        // Invalid request body values
        return {
          pass: "WithBody",
          status: 400,
          body: json({
            error:
              "Invalid request body values. Expected properties: {name: 'updated-widget', description: 'Updated description'}",
          }),
        };
      }
    } else {
      // EmptyBody scenario - return original widget
      return {
        pass: "EmptyBody",
        status: 200,
        body: json(validWidget),
      };
    }
  },
  kind: "MockApiDefinition",
});

// POST action operation with optional body - test both with and without body
Scenarios.Azure_ResourceManager_OperationTemplates_OptionalBody_post = withServiceKeys([
  "EmptyBody",
  "WithBody",
]).pass({
  uri: "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.OperationTemplates/widgets/:widgetName/post",
  method: "post",
  request: {
    pathParams: {
      subscriptionId: SUBSCRIPTION_ID_EXPECTED,
      resourceGroup: RESOURCE_GROUP_EXPECTED,
      widgetName: "widget1",
    },
    query: {
      "api-version": "2023-12-01-preview",
    },
  },
  response: {
    status: 200,
  },
  handler: (req: MockRequest) => {
    // Check if request has a body with content
    if (req.body && Object.keys(req.body).length > 0) {
      // WithBody scenario - validate request body values
      const requestBody = req.body as { actionType?: string; parameters?: string };

      // Validate expected values
      if (requestBody.actionType === "perform" && requestBody.parameters === "test-parameters") {
        return {
          pass: "WithBody",
          status: 200,
          body: json({
            result: "Action completed successfully with parameters",
          }),
        };
      } else {
        // Invalid request body values
        return {
          pass: "WithBody",
          status: 400,
          body: json({
            error:
              "Invalid request body values. Expected actionType: 'perform', parameters: 'test-parameters'",
          }),
        };
      }
    } else {
      // EmptyBody scenario - action completed without parameters
      return {
        pass: "EmptyBody",
        status: 200,
        body: json({
          result: "Action completed successfully",
        }),
      };
    }
  },
  kind: "MockApiDefinition",
});

// Provider POST action operation with optional body - test both with and without body
Scenarios.Azure_ResourceManager_OperationTemplates_OptionalBody_providerPost = withServiceKeys([
  "EmptyBody",
  "WithBody",
]).pass({
  uri: "/subscriptions/:subscriptionId/providers/Azure.ResourceManager.OperationTemplates/providerPost",
  method: "post",
  request: {
    pathParams: {
      subscriptionId: SUBSCRIPTION_ID_EXPECTED,
    },
    query: {
      "api-version": "2023-12-01-preview",
    },
  },
  response: {
    status: 200,
  },
  handler: (req: MockRequest) => {
    // Check if request has a body with content
    if (req.body && Object.keys(req.body).length > 0) {
      // WithBody scenario - validate request body values
      const requestBody = req.body as { totalAllowed?: number; reason?: string };

      // Validate expected values
      if (requestBody.totalAllowed === 100 && requestBody.reason === "Increased demand") {
        return {
          pass: "WithBody",
          status: 200,
          body: json({
            totalAllowed: requestBody.totalAllowed,
            status: "Changed to requested allowance",
          }),
        };
      } else {
        // Invalid request body values
        return {
          pass: "WithBody",
          status: 400,
          body: json({
            error:
              "Invalid request body values. Expected totalAllowed: 100, reason: 'Increased demand'",
          }),
        };
      }
    } else {
      // EmptyBody scenario - use default allowance
      return {
        pass: "EmptyBody",
        status: 200,
        body: json({
          totalAllowed: 50,
          status: "Changed to default allowance",
        }),
      };
    }
  },
  kind: "MockApiDefinition",
});
