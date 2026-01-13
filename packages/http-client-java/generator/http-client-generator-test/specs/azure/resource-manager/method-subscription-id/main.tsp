import "@typespec/http";
import "@typespec/rest";
import "@typespec/spector";
import "@typespec/versioning";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-azure-resource-manager";
import "@azure-tools/typespec-client-generator-core";

using Rest;
using Spector;
using Versioning;
using Azure.ResourceManager.Foundations;

@armProviderNamespace
@service
@versioned(Versions)
@doc("Test for ARM method level subscription ID parameter placement")
namespace Azure.ResourceManager.MethodSubscriptionId;

@doc("Azure API versions.")
enum Versions {
  @armCommonTypesVersion(CommonTypes.Versions.v5)
  @doc("Preview API version 2023-12-01-preview.")
  v2023_12_01_preview: "2023-12-01-preview",
}

@scenario
@scenarioDoc("""
  Operations list GET operation for Azure.ResourceManager.MethodSubscriptionId.
  Expected path: /providers/Azure.ResourceManager.MethodSubscriptionId/operations
  Expected query parameter: api-version=2023-12-01-preview
  Expected response body:
  ```json
  {
    "value": [
      {
        "name": "Azure.ResourceManager.MethodSubscriptionId/services/read",
        "isDataAction": false,
        "display": {
          "provider": "Azure.ResourceManager.MethodSubscriptionId",
          "resource": "services",
          "operation": "Lists services",
          "description": "Lists registered services"
        }
      }
    ]
  }
  ```
  """)
interface Operations extends Azure.ResourceManager.Operations {}

/**
 * Scenario 1: Two subscription level resources with subscriptionId at method level for all operations
 *
 * Test that subscriptionId parameter stays at method level for all operations on subscription-scoped resources.
 *
 * This scenario has two subscription-level resources (SubscriptionResource1 and SubscriptionResource2) where
 * the subscriptionId parameter is explicitly moved from client level to method level for all operations
 * using @clientLocation decorator.
 *
 * Expected behavior:
 * - Client should not have subscriptionId parameter in initialization
 * - All operations (get, put, delete) should have subscriptionId as method-level parameter
 */
namespace TwoSubscriptionResourcesMethodLevel {
  @subscriptionResource
  @resource("subscriptionResource1s")
  model SubscriptionResource1 is ProxyResource<SubscriptionResource1Properties> {
    ...ResourceNameParameter<SubscriptionResource1>;
  }

  @doc("Properties of subscription resource 1.")
  model SubscriptionResource1Properties {
    @visibility(Lifecycle.Read)
    @doc("The status of the last operation.")
    provisioningState?: ResourceProvisioningState;

    @doc("The description of the resource.")
    description?: string;
  }

  @subscriptionResource
  @resource("subscriptionResource2s")
  model SubscriptionResource2 is ProxyResource<SubscriptionResource2Properties> {
    ...ResourceNameParameter<SubscriptionResource2>;
  }

  @doc("Properties of subscription resource 2.")
  model SubscriptionResource2Properties {
    @visibility(Lifecycle.Read)
    @doc("The status of the last operation.")
    provisioningState?: ResourceProvisioningState;

    @doc("The configuration value.")
    configValue?: string;
  }

  // Define base parameter models to enable subscriptionId parameter access
  model GetSubscriptionResource1BaseParameter
    is Azure.ResourceManager.Foundations.DefaultBaseParameters<SubscriptionResource1>;
  model PutSubscriptionResource1BaseParameter
    is Azure.ResourceManager.Foundations.DefaultBaseParameters<SubscriptionResource1>;
  model DeleteSubscriptionResource1BaseParameter
    is Azure.ResourceManager.Foundations.DefaultBaseParameters<SubscriptionResource1>;

  model GetSubscriptionResource2BaseParameter
    is Azure.ResourceManager.Foundations.DefaultBaseParameters<SubscriptionResource2>;
  model PutSubscriptionResource2BaseParameter
    is Azure.ResourceManager.Foundations.DefaultBaseParameters<SubscriptionResource2>;
  model DeleteSubscriptionResource2BaseParameter
    is Azure.ResourceManager.Foundations.DefaultBaseParameters<SubscriptionResource2>;

  @armResourceOperations
  interface SubscriptionResource1Operations {
    @scenario
    @scenarioDoc("""
      Resource GET operation for SubscriptionResource1 with method-level subscriptionId.
      Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.MethodSubscriptionId/subscriptionResource1s/sub-resource-1
      Expected query parameter: api-version=2023-12-01-preview
      
      Expected response body:
      ```json
      {
        "id": "/subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.MethodSubscriptionId/subscriptionResource1s/sub-resource-1",
        "name": "sub-resource-1",
        "type": "Azure.ResourceManager.MethodSubscriptionId/subscriptionResource1s",
        "properties":{
          "description": "Valid subscription resource 1",
          "provisioningState": "Succeeded"
        },
        "systemData": {
          "createdBy": "AzureSDK",
          "createdByType": "User",
          "createdAt": "2023-01-01T00:00:00.000Z",
          "lastModifiedBy": "AzureSDK",
          "lastModifiedAt": "2023-01-01T00:00:00.000Z",
          "lastModifiedByType": "User"
        }
      }
      ```
      """)
    get is ArmResourceRead<
      SubscriptionResource1,
      BaseParameters = GetSubscriptionResource1BaseParameter
    >;

    @scenario
    @scenarioDoc("""
      Resource PUT operation for SubscriptionResource1 with method-level subscriptionId.
      Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.MethodSubscriptionId/subscriptionResource1s/sub-resource-1
      Expected query parameter: api-version=2023-12-01-preview
      Expected request body:
      ```json
      {
        "properties":{
          "description": "Valid subscription resource 1"
        }
      }
      ```
      Expected response body:
      ```json
      {
        "id": "/subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.MethodSubscriptionId/subscriptionResource1s/sub-resource-1",
        "name": "sub-resource-1",
        "type": "Azure.ResourceManager.MethodSubscriptionId/subscriptionResource1s",
        "properties":{
          "description": "Valid subscription resource 1",
          "provisioningState": "Succeeded"
        },
        "systemData": {
          "createdBy": "AzureSDK",
          "createdByType": "User",
          "createdAt": "2023-01-01T00:00:00.000Z",
          "lastModifiedBy": "AzureSDK",
          "lastModifiedAt": "2023-01-01T00:00:00.000Z",
          "lastModifiedByType": "User"
        }
      }
      ```
      """)
    put is ArmResourceCreateOrReplaceSync<
      SubscriptionResource1,
      BaseParameters = PutSubscriptionResource1BaseParameter
    >;

    @scenario
    @scenarioDoc("""
      Resource DELETE operation for SubscriptionResource1 with method-level subscriptionId.
      Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.MethodSubscriptionId/subscriptionResource1s/sub-resource-1
      Expected query parameter: api-version=2023-12-01-preview
      Expected response status code: 204
      """)
    delete is ArmResourceDeleteSync<
      SubscriptionResource1,
      BaseParameters = DeleteSubscriptionResource1BaseParameter
    >;
  }

  @armResourceOperations
  interface SubscriptionResource2Operations {
    @scenario
    @scenarioDoc("""
      Resource GET operation for SubscriptionResource2 with method-level subscriptionId.
      Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.MethodSubscriptionId/subscriptionResource2s/sub-resource-2
      Expected query parameter: api-version=2023-12-01-preview
      
      Expected response body:
      ```json
      {
        "id": "/subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.MethodSubscriptionId/subscriptionResource2s/sub-resource-2",
        "name": "sub-resource-2",
        "type": "Azure.ResourceManager.MethodSubscriptionId/subscriptionResource2s",
        "properties":{
          "configValue": "test-config",
          "provisioningState": "Succeeded"
        },
        "systemData": {
          "createdBy": "AzureSDK",
          "createdByType": "User",
          "createdAt": "2023-01-01T00:00:00.000Z",
          "lastModifiedBy": "AzureSDK",
          "lastModifiedAt": "2023-01-01T00:00:00.000Z",
          "lastModifiedByType": "User"
        }
      }
      ```
      """)
    get is ArmResourceRead<
      SubscriptionResource2,
      BaseParameters = GetSubscriptionResource2BaseParameter
    >;

    @scenario
    @scenarioDoc("""
      Resource PUT operation for SubscriptionResource2 with method-level subscriptionId.
      Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.MethodSubscriptionId/subscriptionResource2s/sub-resource-2
      Expected query parameter: api-version=2023-12-01-preview
      Expected request body:
      ```json
      {
        "properties":{
          "configValue": "test-config"
        }
      }
      ```
      Expected response body:
      ```json
      {
        "id": "/subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.MethodSubscriptionId/subscriptionResource2s/sub-resource-2",
        "name": "sub-resource-2",
        "type": "Azure.ResourceManager.MethodSubscriptionId/subscriptionResource2s",
        "properties":{
          "configValue": "test-config",
          "provisioningState": "Succeeded"
        },
        "systemData": {
          "createdBy": "AzureSDK",
          "createdByType": "User",
          "createdAt": "2023-01-01T00:00:00.000Z",
          "lastModifiedBy": "AzureSDK",
          "lastModifiedAt": "2023-01-01T00:00:00.000Z",
          "lastModifiedByType": "User"
        }
      }
      ```
      """)
    put is ArmResourceCreateOrReplaceSync<
      SubscriptionResource2,
      BaseParameters = PutSubscriptionResource2BaseParameter
    >;

    @scenario
    @scenarioDoc("""
      Resource DELETE operation for SubscriptionResource2 with method-level subscriptionId.
      Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.MethodSubscriptionId/subscriptionResource2s/sub-resource-2
      Expected query parameter: api-version=2023-12-01-preview
      Expected response status code: 204
      """)
    delete is ArmResourceDeleteSync<
      SubscriptionResource2,
      BaseParameters = DeleteSubscriptionResource2BaseParameter
    >;
  }
}

/**
 * Scenario 2: One subscription level resource (method-level subscriptionId) and one resource group level resource (client-level subscriptionId)
 *
 * Test mixed parameter placement: subscription resource with method-level subscriptionId and resource group resource with client-level subscriptionId.
 *
 * This scenario has:
 * 1. One subscription-level resource (SubscriptionResource) with subscriptionId moved to method level
 * 2. One resource group-level resource (ResourceGroupResource) with subscriptionId staying at client level
 *
 * Expected behavior:
 * - Client should have subscriptionId parameter in initialization (for ResourceGroupResource operations)
 * - SubscriptionResource operations should have subscriptionId as method-level parameter
 * - ResourceGroupResource operations should not have subscriptionId as method-level parameter (uses client-level)
 */
namespace MixedSubscriptionPlacement {
  @subscriptionResource
  @resource("subscriptionResources")
  model SubscriptionResource is ProxyResource<SubscriptionResourceProperties> {
    ...ResourceNameParameter<SubscriptionResource>;
  }

  @doc("Properties of subscription resource.")
  model SubscriptionResourceProperties {
    @visibility(Lifecycle.Read)
    @doc("The status of the last operation.")
    provisioningState?: ResourceProvisioningState;

    @doc("The subscription-scoped setting.")
    subscriptionSetting?: string;
  }

  @resource("resourceGroupResources")
  model ResourceGroupResource is TrackedResource<ResourceGroupResourceProperties> {
    ...ResourceNameParameter<ResourceGroupResource>;
  }

  @doc("Properties of resource group resource.")
  model ResourceGroupResourceProperties {
    @visibility(Lifecycle.Read)
    @doc("The status of the last operation.")
    provisioningState?: ResourceProvisioningState;

    @doc("The resource group-scoped setting.")
    resourceGroupSetting?: string;
  }

  // Define base parameter models only for subscription resource to enable subscriptionId parameter access
  model GetSubscriptionResourceBaseParameter is DefaultBaseParameters<SubscriptionResource>;
  model PutSubscriptionResourceBaseParameter is DefaultBaseParameters<SubscriptionResource>;
  model DeleteSubscriptionResourceBaseParameter is DefaultBaseParameters<SubscriptionResource>;

  @armResourceOperations
  interface SubscriptionResourceOperations {
    @scenario
    @scenarioDoc("""
      Resource GET operation for subscription-scoped resource with method-level subscriptionId in mixed scenario.
      Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.MethodSubscriptionId/subscriptionResources/sub-resource
      Expected query parameter: api-version=2023-12-01-preview
      
      Expected response body:
      ```json
      {
        "id": "/subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.MethodSubscriptionId/subscriptionResources/sub-resource",
        "name": "sub-resource",
        "type": "Azure.ResourceManager.MethodSubscriptionId/subscriptionResources",
        "properties":{
          "subscriptionSetting": "test-sub-setting",
          "provisioningState": "Succeeded"
        },
        "systemData": {
          "createdBy": "AzureSDK",
          "createdByType": "User",
          "createdAt": "2023-01-01T00:00:00.000Z",
          "lastModifiedBy": "AzureSDK",
          "lastModifiedAt": "2023-01-01T00:00:00.000Z",
          "lastModifiedByType": "User"
        }
      }
      ```
      """)
    get is ArmResourceRead<
      SubscriptionResource,
      BaseParameters = GetSubscriptionResourceBaseParameter
    >;

    @scenario
    @scenarioDoc("""
      Resource PUT operation for subscription-scoped resource with method-level subscriptionId in mixed scenario.
      Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.MethodSubscriptionId/subscriptionResources/sub-resource
      Expected query parameter: api-version=2023-12-01-preview
      Expected request body:
      ```json
      {
        "properties":{
          "subscriptionSetting": "test-sub-setting"
        }
      }
      ```
      Expected response body:
      ```json
      {
        "id": "/subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.MethodSubscriptionId/subscriptionResources/sub-resource",
        "name": "sub-resource",
        "type": "Azure.ResourceManager.MethodSubscriptionId/subscriptionResources",
        "properties":{
          "subscriptionSetting": "test-sub-setting",
          "provisioningState": "Succeeded"
        },
        "systemData": {
          "createdBy": "AzureSDK",
          "createdByType": "User",
          "createdAt": "2023-01-01T00:00:00.000Z",
          "lastModifiedBy": "AzureSDK",
          "lastModifiedAt": "2023-01-01T00:00:00.000Z",
          "lastModifiedByType": "User"
        }
      }
      ```
      """)
    put is ArmResourceCreateOrReplaceSync<
      SubscriptionResource,
      BaseParameters = PutSubscriptionResourceBaseParameter
    >;

    @scenario
    @scenarioDoc("""
      Resource DELETE operation for subscription-scoped resource with method-level subscriptionId in mixed scenario.
      Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/providers/Azure.ResourceManager.MethodSubscriptionId/subscriptionResources/sub-resource
      Expected query parameter: api-version=2023-12-01-preview
      Expected response status code: 204
      """)
    delete is ArmResourceDeleteSync<
      SubscriptionResource,
      BaseParameters = DeleteSubscriptionResourceBaseParameter
    >;
  }

  @armResourceOperations
  interface ResourceGroupResourceOperations {
    @scenario
    @scenarioDoc("""
      Resource GET operation for resource group-scoped resource with client-level subscriptionId in mixed scenario.
      Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.MethodSubscriptionId/resourceGroupResources/rg-resource
      Expected query parameter: api-version=2023-12-01-preview
      
      Expected response body:
      ```json
      {
        "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.MethodSubscriptionId/resourceGroupResources/rg-resource",
        "name": "rg-resource",
        "type": "Azure.ResourceManager.MethodSubscriptionId/resourceGroupResources",
        "location": "eastus",
        "properties":{
          "resourceGroupSetting": "test-setting",
          "provisioningState": "Succeeded"
        },
        "systemData": {
          "createdBy": "AzureSDK",
          "createdByType": "User",
          "createdAt": "2023-01-01T00:00:00.000Z",
          "lastModifiedBy": "AzureSDK",
          "lastModifiedAt": "2023-01-01T00:00:00.000Z",
          "lastModifiedByType": "User"
        }
      }
      ```
      """)
    get is ArmResourceRead<ResourceGroupResource>;

    @scenario
    @scenarioDoc("""
      Resource PUT operation for resource group-scoped resource with client-level subscriptionId in mixed scenario.
      Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.MethodSubscriptionId/resourceGroupResources/rg-resource
      Expected query parameter: api-version=2023-12-01-preview
      Expected request body:
      ```json
      {
        "location": "eastus",
        "properties":{
          "resourceGroupSetting": "test-setting"
        }
      }
      ```
      Expected response body:
      ```json
      {
        "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.MethodSubscriptionId/resourceGroupResources/rg-resource",
        "name": "rg-resource",
        "type": "Azure.ResourceManager.MethodSubscriptionId/resourceGroupResources",
        "location": "eastus",
        "properties":{
          "resourceGroupSetting": "test-setting",
          "provisioningState": "Succeeded"
        },
        "systemData": {
          "createdBy": "AzureSDK",
          "createdByType": "User",
          "createdAt": "2023-01-01T00:00:00.000Z",
          "lastModifiedBy": "AzureSDK",
          "lastModifiedAt": "2023-01-01T00:00:00.000Z",
          "lastModifiedByType": "User"
        }
      }
      ```
      """)
    put is ArmResourceCreateOrReplaceSync<ResourceGroupResource>;

    @scenario
    @scenarioDoc("""
      Resource DELETE operation for resource group-scoped resource with client-level subscriptionId in mixed scenario.
      Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.MethodSubscriptionId/resourceGroupResources/rg-resource
      Expected query parameter: api-version=2023-12-01-preview
      Expected response status code: 204
      """)
    delete is ArmResourceDeleteSync<ResourceGroupResource>;
  }
}
