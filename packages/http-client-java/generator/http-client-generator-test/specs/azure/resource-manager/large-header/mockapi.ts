import {
  dyn,
  dynItem,
  json,
  MockRequest,
  passOnSuccess,
  ScenarioMockApi,
  ValidationError,
} from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const SUBSCRIPTION_ID_EXPECTED = "00000000-0000-0000-0000-000000000000";
const RESOURCE_GROUP_EXPECTED = "test-rg";
const SIX_KB_STRING = "a".repeat(1024 * 6);
let pollCount = 0;

Scenarios.Azure_ResourceManager_LargeHeader_LargeHeaders_two6k = passOnSuccess([
  {
    // LRO POST initial request
    uri: "/subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Azure.ResourceManager.LargeHeader/largeHeaders/header1/two6k",
    method: "post",
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
      status: 202,
      headers: {
        location: dyn`${dynItem("baseUrl")}/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/providers/Azure.ResourceManager.LargeHeaders/locations/eastus/operations/post_location?userContext=${SIX_KB_STRING}`,
        "azure-asyncoperation": dyn`${dynItem("baseUrl")}/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/providers/Azure.ResourceManager.LargeHeaders/locations/eastus/operations/post_aao?userContext=${SIX_KB_STRING}`,
      },
    },
    handler: (req: MockRequest) => {
      pollCount = 0;
      return {
        status: 202,
        headers: {
          location: `${req.baseUrl}/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/providers/Azure.ResourceManager.LargeHeaders/locations/eastus/operations/post_location?userContext=${SIX_KB_STRING}`,
          "azure-asyncoperation": `${req.baseUrl}/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/providers/Azure.ResourceManager.LargeHeaders/locations/eastus/operations/post_aao?userContext=${SIX_KB_STRING}`,
        },
      };
    },
    kind: "MockApiDefinition",
  },
  {
    // LRO POST poll intermediate/get final result
    uri: "/subscriptions/:subscriptionId/providers/Azure.ResourceManager.LargeHeaders/locations/eastus/operations/:operation_name",
    method: "get",
    request: {
      pathParams: {
        subscriptionId: SUBSCRIPTION_ID_EXPECTED,
        operation_name: "post_aao", // operation_name can be "post_location" or "post_aao", depending on the header you choose to poll. "post_aao" here is just for passing e2e test
      },
      query: {
        "api-version": "2023-12-01-preview",
        userContext: SIX_KB_STRING,
      },
    },
    response: {
      status: 200, // This is for passing e2e test. For actual status code, see "handler" definition below
    },
    handler: (req: MockRequest) => {
      let response;
      const operation_name = req.params["operation_name"];
      if (operation_name === "post_location") {
        response =
          // first status will be 200, second and forward be 204
          pollCount > 0
            ? {
                status: 200,
                body: json({
                  succeeded: true,
                }),
              }
            : { status: 202 };
      } else if (operation_name === "post_aao") {
        const aaoResponse = {
          id: `/subscriptions/${SUBSCRIPTION_ID_EXPECTED}/providers/Azure.ResourceManager.LargeHeaders/locations/eastus/operations/post_aao?userContext=${SIX_KB_STRING}`,
          name: "lro_post_aao",
          startTime: "2024-11-08T01:41:53.5508583+00:00",
        };
        // first provisioningState will be "InProgress", second and forward be "Succeeded"
        const responseBody =
          pollCount > 0
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

      pollCount += 1;

      return response;
    },
    kind: "MockApiDefinition",
  },
]);
