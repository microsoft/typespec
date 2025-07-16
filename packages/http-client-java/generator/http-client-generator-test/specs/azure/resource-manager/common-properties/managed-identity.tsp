import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-azure-resource-manager";
import "@typespec/spector";

using Http;
using Rest;
using Versioning;
using Azure.Core;
using Azure.ResourceManager;
using OpenAPI;
using Spector;

namespace Azure.ResourceManager.CommonProperties;

@resource("managedIdentityTrackedResources")
model ManagedIdentityTrackedResource
  is Azure.ResourceManager.TrackedResource<ManagedIdentityTrackedResourceProperties> {
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
  @visibility(Lifecycle.Read)
  @doc("The status of the last operation.")
  provisioningState: string;
}

@armResourceOperations
interface ManagedIdentity {
  @scenario
  @scenarioDoc("""
    Resource GET operation.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.CommonProperties/managedIdentityTrackedResources/identity",
    Expected query parameter: api-version=2023-12-01-preview
    
    Expected response body:
    ```json
    {
      "id":"/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.CommonProperties/managedIdentityTrackedResources/identity",
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
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.CommonProperties/managedIdentityTrackedResources/identity",
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
      "id":"/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.CommonProperties/managedIdentityTrackedResources/identity",
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
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.CommonProperties/managedIdentityTrackedResources/identity",
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
      "id":"/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Azure.ResourceManager.CommonProperties/managedIdentityTrackedResources/identity",
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
