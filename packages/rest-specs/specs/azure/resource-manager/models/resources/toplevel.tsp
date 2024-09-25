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

@resource("topLevelTrackedResources")
model TopLevelTrackedResource is TrackedResource<TopLevelTrackedResourceProperties> {
  @key("topLevelTrackedResourceName")
  @path
  @segment("topLevelTrackedResources")
  @doc("arm resource name for path")
  @pattern("^[A-Za-z0-9]([A-Za-z0-9-_.]{0,62}[A-Za-z0-9])?$")
  name: string;
}

@doc("Top Level Arm Resource Properties.")
model TopLevelTrackedResourceProperties {
  @visibility("read")
  @doc("The status of the last operation.")
  provisioningState?: ProvisioningState;

  @doc("The description of the resource.")
  description?: string;
}

@doc("The details of a user notification.")
model NotificationDetails {
  @doc("The notification message.")
  message: string;

  @doc("If true, the notification is urgent.")
  urgent: boolean;
}

@armResourceOperations
interface TopLevelTrackedResources {
  @scenario
  @scenarioDoc("""
    Resource GET operation.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top
    Expected query parameter: api-version=2023-12-01-preview
    
    Expected response body:
    ```json
    {
      "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top",
      "name": "top",
      "type": "topLevel",
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
  get is ArmResourceRead<TopLevelTrackedResource>;

  @scenario
  @scenarioDoc("""
    Resource PUT operation.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top
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
      "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top",
      "name": "top",
      "type": "topLevel",
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
  createOrReplace is ArmResourceCreateOrReplaceAsync<TopLevelTrackedResource>;

  @scenario
  @scenarioDoc("""
    Resource PATCH operation.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top
    Expected query parameter: api-version=2023-12-01-preview
    Expected request body:
    ```json
    {
      "properties": {
        "description": "valid2"
      }
    }
    ```
    Expected response body:
    ```json
    {
      "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top",
      "name": "top",
      "type": "topLevel",
      "location": "eastus",
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
  update is ArmResourcePatchAsync<TopLevelTrackedResource, TopLevelTrackedResourceProperties>;

  @scenario
  @scenarioDoc("""
    Resource DELETE operation.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top
    Expected query parameter: api-version=2023-12-01-preview
    ```
    Expected response status code: 204
    """)
  delete is ArmResourceDeleteWithoutOkAsync<TopLevelTrackedResource>;

  @scenario
  @scenarioDoc("""
    Resource LIST by resource group operation.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources
    Expected query parameter: api-version=2023-12-01-preview
    
    Expected response body:
    ```json
    {
      "value": [{
        "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top",
        "name": "top",
        "type": "topLevel",
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
  listByResourceGroup is ArmResourceListByParent<TopLevelTrackedResource>;

  @scenario
  @scenarioDoc("""
    Resource LIST by subscription operation.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources
    Expected query parameter: api-version=2023-12-01-preview
    
    Expected response body:
    ```json
    {
      "value": [{
        "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top",
        "name": "top",
        "type": "topLevel",
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
  listBySubscription is ArmListBySubscription<TopLevelTrackedResource>;

  @scenario
  @scenarioDoc("""
      Resource sync action.
      Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.Resources/topLevelTrackedResources/top/actionSync
      Expected query parameter: api-version=2023-12-01-preview
      Expected request body:
      ```json
      {
        "message": "Resource action at top level.",
        "urgent": true
      }
      ```
    """)
  actionSync is ArmResourceActionNoContentSync<TopLevelTrackedResource, NotificationDetails>;
}
