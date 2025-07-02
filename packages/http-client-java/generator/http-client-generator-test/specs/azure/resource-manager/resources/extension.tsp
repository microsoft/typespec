import "@typespec/http";
import "@typespec/rest";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-azure-resource-manager";
import "@typespec/spector";

using Http;
using Rest;
using Azure.Core;
using Azure.ResourceManager;
using OpenAPI;
using Spector;

namespace Azure.ResourceManager.Resources;

model ExtensionsResource is ExtensionResource<ExtensionsResourceProperties> {
  ...ResourceNameParameter<ExtensionsResource>;
}

/** ExtensionsResource properties */
model ExtensionsResourceProperties {
  @doc("The description of the resource.")
  description?: string;

  /** The status of the last operation. */
  @visibility(Lifecycle.Read)
  provisioningState?: ProvisioningState;
}

/** The interface of extensions resources,
 * it contains 4 kinds of scopes (resource, resource group, subscription and tenant)
 */
@armResourceOperations
interface ExtensionsResources {
  @scenario
  @scenarioDoc("""
    This test is passed by calling the API 4 times, by providing different parameters.
    Resource GET extension resource by tenant.
    Expected path: /providers/Azure.ResourceManager.Resources/extensionsResources/extension
    Expected query parameter: api-version=2023-12-01-preview
    
    Expected response body:
      ```json
    {
      "id": "/providers/Azure.ResourceManager.Resources/extensionsResources/extension",
      "name": "extension",
      "type": "Azure.ResourceManager.Resources/extensionsResources",
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
    
    Resource GET extension resource by subscription.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.Resources/extensionsResources/extension
    Expected query parameter: api-version=2023-12-01-preview
    
    Expected response body:
    ```json
    {
      "id": "/subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.Resources/extensionsResources/extension",
      "name": "extension",
      "type": "Azure.ResourceManager.Resources/extensionsResources",
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
    
    Resource GET extension resource by resource group.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/extensionsResources/extension
    Expected query parameter: api-version=2023-12-01-preview
    
    Expected response body:
    ```json
    {
      "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/extensionsResources/extension",
      "name": "extension",
      "type": "Azure.ResourceManager.Resources/extensionsResources",
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
    
    Resource GET extension resource by resource.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top/providers/Azure.ResourceManager.Resources/extensionsResources/extension
    Expected query parameter: api-version=2023-12-01-preview
    
    Expected response body:
    ```json
    {
      "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top/providers/Azure.ResourceManager.Resources/extensionsResources/extension",
      "name": "extension",
      "type": "Azure.ResourceManager.Resources/extensionsResources",
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
  get is ArmResourceRead<ExtensionsResource>;

  @scenario
  @scenarioDoc("""
    This test is passed by calling the API 4 times, by providing different parameters.
    Resource PUT extension resource by tenant.
    Expected path: /providers/Azure.ResourceManager.Resources/extensionsResources/extension
    Expected query parameter: api-version=2023-12-01-preview
    
    Expected request body:
    ```json
    {
      "properties":{
        "description": "valid",
      }
    }
    ```
    
    Expected response body:
    ```json
    {
      "id": "/providers/Azure.ResourceManager.Resources/extensionsResources/extension",
      "name": "extension",
      "type": "Azure.ResourceManager.Resources/extensionsResources",
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
    
    Resource PUT extension resource by subscription.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.Resources/extensionsResources/extension
    Expected query parameter: api-version=2023-12-01-preview
    
    Expected request body:
    ```json
    {
      "properties":{
        "description": "valid",
      }
    }
    ```
    
    Expected response body:
    ```json
    {
      "id": "/subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.Resources/extensionsResources/extension",
      "name": "extension",
      "type": "Azure.ResourceManager.Resources/extensionsResources",
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
    
    Resource PUT extension resource by resource group.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/extensionsResources/extension
    Expected query parameter: api-version=2023-12-01-preview
    
    Expected request body:
    ```json
    {
      "properties":{
       "description": "valid",
      }
    }
    ```
    
    Expected response body:
    ```json
    {
      "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/extensionsResources/extension",
      "name": "extension",
      "type": "Azure.ResourceManager.Resources/extensionsResources",
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
    
    Resource PUT extension resource by resource.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top/providers/Azure.ResourceManager.Resources/extensionsResources/extension
    Expected query parameter: api-version=2023-12-01-preview
    
    Expected request body:
    ```json
    {
      "properties":{
        "description": "valid",
      }
    }
    ```
    
    Expected response body:
    ```json
    {
      "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top/providers/Azure.ResourceManager.Resources/extensionsResources/extension",
      "name": "extension",
      "type": "Azure.ResourceManager.Resources/extensionsResources",
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
  createOrUpdate is ArmResourceCreateOrReplaceAsync<ExtensionsResource>;

  @scenario
  @scenarioDoc("""
    This test is passed by calling the API 4 times, by providing different parameters.
    Resource Patch extension resource by tenant.
    Expected path: /providers/Azure.ResourceManager.Resources/extensionsResources/extension
    Expected query parameter: api-version=2023-12-01-preview
    
    Expected request body:
    ```json
    {
      "properties":{
        "description": "valid2",
      }
    }
    ```
    
    Expected response body:
    ```json
    {
      "id": "/providers/Azure.ResourceManager.Resources/extensionsResources/extension",
      "name": "extension",
      "type": "Azure.ResourceManager.Resources/extensionsResources",
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
    
    Resource Patch extension resource by subscription.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.Resources/extensionsResources/extension
    Expected query parameter: api-version=2023-12-01-preview
    
    Expected request body:
    ```json
    {
      "properties":{
        "description": "valid2",
      }
    }
    ```
    
    Expected response body:
    ```json
    {
      "id": "/subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.Resources/extensionsResources/extension",
      "name": "extension",
      "type": "Azure.ResourceManager.Resources/extensionsResources",
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
    
    Resource Patch extension resource by resource group.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/extensionsResources/extension
    Expected query parameter: api-version=2023-12-01-preview
    
    Expected request body:
    ```json
    {
      "properties":{
        "description": "valid2",
      }
    }
    ```
    
    Expected response body:
    ```json
    {
      "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/extensionsResources/extension",
      "name": "extension",
      "type": "Azure.ResourceManager.Resources/extensionsResources",
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
    
    Resource Patch extension resource by resource.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top/providers/Azure.ResourceManager.Resources/extensionsResources/extension
    Expected query parameter: api-version=2023-12-01-preview
    
    Expected request body:
    ```json
    {
      "properties":{
        "description": "valid2",
      }
    }
    ```
    
    Expected response body:
    ```json
    {
      "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top/providers/Azure.ResourceManager.Resources/extensionsResources/extension",
      "name": "extension",
      "type": "Azure.ResourceManager.Resources/extensionsResources",
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
  update is ArmResourcePatchSync<ExtensionsResource, ExtensionsResourceProperties>;

  @scenario
  @scenarioDoc("""
    This test is passed by calling the API 4 times, by providing different parameters.
    Resource DELETE extension resource by tenant.
    Expected path: /providers/Azure.ResourceManager.Resources/extensionsResources/extension
    Expected query parameter: api-version=2023-12-01-preview
    Expected response status code: 204
    
    Resource DELETE extension resource by subscription.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.Resources/extensionsResources/extension
    Expected query parameter: api-version=2023-12-01-preview
    Expected response status code: 204
    
    Resource DELETE extension resource by resource group.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/extensionsResources/extension
    Expected query parameter: api-version=2023-12-01-preview
    Expected response status code: 204
    
    Resource DELETE extension resource by resource.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top/providers/Azure.ResourceManager.Resources/extensionsResources/extension
    Expected query parameter: api-version=2023-12-01-preview
    Expected response status code: 204
    """)
  delete is ArmResourceDeleteSync<ExtensionsResource>;

  @scenario
  @scenarioDoc("""
    This test is passed by calling the API 4 times, by providing different parameters.
    Resource LIST extension resources by tenant.
    Expected path: /providers/Azure.ResourceManager.Resources/extensionResources
    Expected query parameter: api-version=2023-12-01-preview
    
    Expected response body:
    ```json
    {
      "value": [{
        "id": "/providers/Azure.ResourceManager.Resources/extensionsResources/extension",
        "name": "extension",
        "type": "Azure.ResourceManager.Resources/extensionsResources",
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
    
    Resource LIST extension resources by subscription.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.Resources/extensionResources
    Expected query parameter: api-version=2023-12-01-preview
    
    Expected response body:
    ```json
    {
      "value": [{
        "id": "/subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.Resources/extensionsResources/extension",
        "name": "extension",
        "type": "Azure.ResourceManager.Resources/extensionsResources",
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
    
    Resource LIST extension resources by resource group.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/extensionResources
    Expected query parameter: api-version=2023-12-01-preview
    
    Expected response body:
    ```json
    {
      "value": [{
        "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/extensionsResources/extension",
        "name": "extension",
        "type": "Azure.ResourceManager.Resources/extensionsResources",
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
    
    Resource LIST extension resources by resource.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top/providers/Azure.ResourceManager.Resources/extensionResources
    Expected query parameter: api-version=2023-12-01-preview
    
    Expected response body:
    ```json
    {
      "value": [{
        "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Resources/topLevelTrackedResources/top/providers/Azure.ResourceManager.Resources/extensionsResources/extension",
        "name": "extension",
        "type": "Azure.ResourceManager.Resources/extensionsResources",
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
  listByScope is ArmResourceListByParent<ExtensionsResource>;
}
