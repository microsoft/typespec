import "@typespec/http";
import "@typespec/rest";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-azure-resource-manager";

using TypeSpec.Http;
using TypeSpec.Rest;
using Azure.Core;
using Azure.ResourceManager;
using TypeSpec.OpenAPI;

namespace Azure.ResourceManager.Models.Resources;

@singleton("default")
model SingletonTrackedResource is TrackedResource<SingletonTrackedResourceProperties> {
  ...ResourceNameParameter<SingletonTrackedResource>;
}

@doc("Singleton Arm Resource Properties.")
model SingletonTrackedResourceProperties {
  @visibility("read")
  @doc("The status of the last operation.")
  provisioningState?: ProvisioningState;

  @doc("The description of the resource.")
  description?: string;
}

@armResourceOperations
interface SingletonTrackedResources {
  @scenario
  @scenarioDoc("""
    Resource GET operation.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/singletonTrackedResources/default
    Expected query parameter: api-version=2023-12-01-preview
    
    Expected response body:
    ```json
    {
      "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/singletonTrackedResources/default",
      "name": "default",
      "type": "Azure.ResourceManager.Models.Resources/singletonTrackedResources",
      "location": "eastus",
      "properties":{
        "description": "valid",
        "provisioningState": "Succeeded"
      },
      "systemData": {
        "createdBy": "AzureSDK",
        "createdByType": "User",
        "createdAt": <any date>,
        "lastModifiedBy": "AzureSDK",
        "lastModifiedAt": <any date>,
        "lastModifiedByType": "User",
      }
    }
    ```
    """)
  getByResourceGroup is ArmResourceRead<SingletonTrackedResource>;

  @scenario
  @scenarioDoc("""
    Resource PUT operation.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/singletonTrackedResources/default
    Expected query parameter: api-version=2023-12-01-preview
    Expected request body:
    ```json
    {
      "location": "eastus",
      "properties": {
        "description": "valid"
      }
    }
    ```
    Expected response body:
    ```json
    {
      "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/singletonTrackedResources/default",
      "name": "default",
      "type": "Azure.ResourceManager.Models.Resources/singletonTrackedResources",
      "location": "eastus",
      "properties": {
        "description": "valid",
        "provisioningState": "Succeeded"
      },
      "systemData": {
        "createdBy": "AzureSDK",
        "createdByType": "User",
        "createdAt": <any date>,
        "lastModifiedBy": "AzureSDK",
        "lastModifiedAt": <any date>,
        "lastModifiedByType": "User",
      }
    }
    ```
    """)
  createOrUpdate is ArmResourceCreateOrReplaceAsync<SingletonTrackedResource>;

  @scenario
  @scenarioDoc("""
    Resource PATCH operation.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/singletonTrackedResources/default
    Expected query parameter: api-version=2023-12-01-preview
    Expected request body:
    ```json
    {
      "location": "eastus2",
      "properties": {
        "description": "valid2"
      }
    }
    ```
    Expected response body:
    ```json
    {
      "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/singletonTrackedResources/default",
      "name": "default",
      "type": "Azure.ResourceManager.Models.Resources/singletonTrackedResources",
      "location": "eastus2",
      "properties":{
        "description": "valid2",
        "provisioningState": "Succeeded"
      },
      "systemData": {
        "createdBy": "AzureSDK",
        "createdByType": "User",
        "createdAt": <any date>,
        "lastModifiedBy": "AzureSDK",
        "lastModifiedAt": <any date>,
        "lastModifiedByType": "User",
      }
    }
    ```
    """)
  update is ArmResourcePatchSync<SingletonTrackedResource, SingletonTrackedResourceProperties>;

  @scenario
  @scenarioDoc("""
    Resource LIST by resource group operation.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/singletonTrackedResources
    Expected query parameter: api-version=2023-12-01-preview
    
    Expected response body:
    ```json
    {
      "value": [{
        "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/singletonTrackedResources/default",
        "name": "default",
        "type": "Azure.ResourceManager.Models.Resources/singletonTrackedResources",
        "location": "eastus",
        "properties":{
          "description": "valid",
          "provisioningState": "Succeeded"
        },
        "systemData": {
          "createdBy": "AzureSDK",
          "createdByType": "User",
          "createdAt": <any date>,
          "lastModifiedBy": "AzureSDK",
          "lastModifiedAt": <any date>,
          "lastModifiedByType": "User",
        }
      }]
    }
    ```
    """)
  listByResourceGroup is ArmResourceListByParent<SingletonTrackedResource>;
}
