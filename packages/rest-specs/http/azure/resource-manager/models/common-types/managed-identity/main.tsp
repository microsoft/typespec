import "@azure-tools/cadl-ranch-expect";
import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-azure-resource-manager";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Versioning;
using Azure.Core;
using Azure.ResourceManager;
using TypeSpec.OpenAPI;

@armProviderNamespace
@service
@versioned(Versions)
@doc("Arm Managed Identity Provider management API.")
namespace Azure.ResourceManager.Models.CommonTypes.ManagedIdentity;

@doc("Azure API versions.")
enum Versions {
  @useDependency(Azure.Core.Versions.v1_0_Preview_2)
  @useDependency(Azure.ResourceManager.Versions.v1_0_Preview_1)
  @doc("Preview API version 2023-12-01-preview.")
  v2023_12_01_preview: "2023-12-01-preview",
}

@resource("managedIdentityTrackedResources")
model ManagedIdentityTrackedResource is TrackedResource<ManagedIdentityTrackedResourceProperties> {
  @key("managedIdentityTrackedResourceName")
  @path
  @segment("managedIdentityTrackedResources")
  @doc("arm resource name for path")
  @pattern("^[A-Za-z0-9]([A-Za-z0-9-_.]{0,62}[A-Za-z0-9])?$")
  name: string;

  ...ManagedServiceIdentityProperty;
}

@doc("Managed Identity Arm Resource Properties.")
model ManagedIdentityTrackedResourceProperties {
  @visibility("read")
  @doc("The status of the last operation.")
  provisioningState: string;
}

@armResourceOperations
interface ManagedIdentityTrackedResources {
  @scenario
  @scenarioDoc("""
    Resource GET operation.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.CommonTypes.ManagedIdentity/managedIdentityTrackedResources/identity",
    Expected query parameter: api-version=2023-12-01-preview
    
    Expected response body:
    ```json
    {
      "id":"/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.CommonTypes.ManagedIdentity/managedIdentityTrackedResources/identity",
      "location": "eastus",
      "tags": {
        "tagKey1": "tagValue1"
      },
      "identity": {
        "type": "SystemAssigned",
        "principalId": <any uuid string>
        "tenantId": <any uuid string>
       },
      "properties": {
        "provisioningState": "Succeeded"
      }
    }
    ```
    """)
  get is ArmResourceRead<ManagedIdentityTrackedResource>;

  @scenario
  @scenarioDoc("""
    Resource PUT operation.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.CommonTypes.ManagedIdentity/managedIdentityTrackedResources/identity",
    Expected query parameter: api-version=2023-12-01-preview
    Expected request body:
    ```json
    {
      "location": "eastus",
      "tags": {
        "tagKey1": "tagValue1"
      },
      "properties": {},
      "identity": {
        "type": "SystemAssigned"
      }
    }
    ```
     Expected response body:
    ```json
    {
      "id":"/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.CommonTypes.ManagedIdentity/managedIdentityTrackedResources/identity",
      "location": "eastus",
      "tags": {
        "tagKey1": "tagValue1"
      },
      "identity": {
        "type": "SystemAssigned",
        "principalId": <any uuid string>,
        "tenantId": <any uuid string>
       },
      "properties": {
        "provisioningState": "Succeeded"
      }
    }
    ```
    """)
  createWithSystemAssigned is ArmResourceCreateOrReplaceSync<ManagedIdentityTrackedResource>;

  @scenario
  @scenarioDoc("""
    Resource PATCH operation.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.CommonTypes.ManagedIdentity/managedIdentityTrackedResources/identity",
    Expected query parameter: api-version=2023-12-01-preview
    Expected request body:
    ```json
    {
      "identity": {
        "type": "SystemAssigned,UserAssigned",
        "userAssignedIdentities": {
          "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/id1": {}
        }
      }
    }
    ```
     Expected response body:
    ```json
    {
      "id":"/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.Models.CommonTypes.ManagedIdentity/managedIdentityTrackedResources/identity",
      "location": "eastus",
      "tags": {
        "tagKey1": "tagValue1"
      },
      "identity": {
        "type": "SystemAssigned,UserAssigned",
        "userAssignedIdentities": {
          "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/id1": {
            "principalId": <any uuid string>,
            "clientId": <any uuid string>
          },
        },
        "principalId": <any uuid string>,
        "tenantId": <any uuid string>
      },
      "properties": {
        "provisioningState": "Succeeded"
      }
    }
    ```
    """)
  updateWithUserAssignedAndSystemAssigned is ArmResourcePatchSync<
    ManagedIdentityTrackedResource,
    ManagedIdentityTrackedResourceProperties
  >;
}
