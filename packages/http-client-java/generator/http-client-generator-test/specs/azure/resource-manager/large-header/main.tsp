import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-azure-resource-manager";
import "@azure-tools/typespec-client-generator-core";
import "@typespec/spector";

using Http;
using Rest;
using Versioning;
using Azure.Core;
using Azure.ResourceManager;
using OpenAPI;
using Spector;

@armProviderNamespace
@service
@versioned(Versions)
@doc("Arm Resource Provider management API.")
namespace Azure.ResourceManager.LargeHeader;

@doc("Azure API versions.")
enum Versions {
  @armCommonTypesVersion(CommonTypes.Versions.v5)
  @useDependency(Azure.Core.Versions.v1_0_Preview_2)
  @useDependency(Azure.ResourceManager.Versions.v1_0_Preview_1)
  @doc("Preview API version 2023-12-01-preview.")
  v2023_12_01_preview: "2023-12-01-preview",
}

@resource("largeHeaders")
model LargeHeader is TrackedResource<LargeHeaderProperties> {
  ...ResourceNameParameter<LargeHeader>;
}

model LargeHeaderProperties {
  @doc("The provisioning state of the resource.")
  @visibility(Lifecycle.Read)
  provisioningState?: string;
}

model CancelResult {
  succeeded: boolean;
}

@armResourceOperations
interface LargeHeaders {
  @scenario
  @scenarioDoc("""
    Resource POST operation with long LRO headers(> 6KB + 6KB = 12KB).
    To pass the test, client should accept both:
      1. Single header size that's more than 6KB. 7KB is sure to pass the test.
      2. Total headers size that's more than 12KB. 13KB is sure to pass the test.
    
    Service returns both Location and Azure-AsyncOperation header on initial request.
    final-state-via: location
    
    Expected verb: POST
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.LargeHeader/largeHeaders/header1/two6k
    Expected query parameter: api-version=2023-12-01-preview
    Expected response status code: 202
    Expected response headers: 
      - Azure-AsyncOperation={endpoint}/subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.LargeHeader/locations/eastus/operations/post?userContext=<6KB-string>
      - Location={endpoint}/subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.LargeHeader/operations/post?userContext=<6KB-string>
    Expected no response body
    
    Whether you do polling through AAO, Location or combined, first one will respond with provisioning state "InProgress", second one with "Succeeded".
    
    AAO first poll.
    Expected verb: GET
    Expected URL: {endpoint}/subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.LargeHeader/locations/eastus/operations/post_aao?userContext=<6KB-string>
    Expected status code: 200
    Expected response body:
    ```json
    {
      "id": "/subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.LargeHeader/locations/eastus/operations/post_aao?userContext=<6KB-string>",
      "name": "post_aao",
      "status" : "InProgress",
      "startTime": "2024-11-08T01:41:53.5508583+00:00"
    }
    ```
    
    AAO second poll.
    Expected verb: GET
    Expected URL: {endpoint}/subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.LargeHeader/locations/eastus/operations/post_aao?userContext=<6KB-string>
    Expected status code: 200
    Expected response body:
    ```json
    {
      "id": "/subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.LargeHeader/locations/eastus/operations/post_aao?userContext=<6KB-string>",
      "name": "post_aao",
      "status" : "Succeeded",
      "startTime": "2024-11-08T01:41:53.5508583+00:00",
      "endTime": "2024-11-08T01:42:41.5354192+00:00"
    }
    ```
    
    Location first poll.
    Expected verb: GET
    Expected URL: {endpoint}/subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.LargeHeader/locations/eastus/operations/post_location?userContext=<6KB-string>
    Expected status code: 202
    Expected no response body
    
    Location second poll.
    Expected verb: GET
    Expected URL: {endpoint}/subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.LargeHeader/locations/eastus/operations/post_location?userContext=<6KB-string>
    Expected status code: 200
    Expected response body:
    ```json
    {
      "succeeded": true
    }
    ```
    """)
  two6k is ArmResourceActionAsync<
    LargeHeader,
    void,
    CancelResult,
    LroHeaders = ArmCombinedLroHeaders<FinalResult = CancelResult> &
      Azure.Core.Foundations.RetryAfterHeader,
    OptionalRequestBody = true
  >;
}
