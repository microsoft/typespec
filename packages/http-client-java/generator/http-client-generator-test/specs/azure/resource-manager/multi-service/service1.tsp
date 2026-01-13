import "@typespec/versioning";
import "@azure-tools/typespec-azure-resource-manager";
import "@typespec/spector";

using TypeSpec.Versioning;
using Spector;

/**
 * Compute Client
 */
@armProviderNamespace("Microsoft.Compute")
@service(#{ title: "Azure Compute resource management API." })
@versioned(Versions)
namespace Azure.ResourceManager.MultiService.Compute;

/**
 * The available API versions.
 */
enum Versions {
  /**
   * The 2024-11-01 API version.
   */
  @armCommonTypesVersion(Azure.ResourceManager.CommonTypes.Versions.v3)
  v2024_11_01: "2024-11-01",

  /**
   * The 2025-04-01 API version.
   */
  @armCommonTypesVersion(Azure.ResourceManager.CommonTypes.Versions.v3)
  v2025_04_01: "2025-04-01",
}

/**
 * Describes a Virtual Machine.
 */
model VirtualMachine is Azure.ResourceManager.TrackedResource<VirtualMachineProperties> {
  ...ResourceNameParameter<
    Resource = VirtualMachine,
    KeyName = "vmName",
    SegmentName = "virtualMachines",
    NamePattern = ""
  >;
}

model VirtualMachineProperties {
  @visibility(Lifecycle.Read)
  provisioningState?: ResourceProvisioningState;
}

@armResourceOperations
interface VirtualMachines {
  /**
   * Retrieves information about the model view or the instance view of a virtual machine.
   */
  @scenario
  @scenarioDoc("""
    Test that a client can expose operations from multiple services. This operaton should be called like this: `client.virtualMachines.get(...)`.
    
    GET a Virtual Machine.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Microsoft.Compute/virtualMachines/vm1
    Expected query parameter: api-version=2025-04-01
    
    Expected response body:
    ```json
    {
      "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Microsoft.Compute/virtualMachines/vm1",
      "name": "vm1",
      "type": "Microsoft.Compute/virtualMachines",
      "location": "eastus",
      "properties": {
        "provisioningState": "Succeeded"
      }
    }
    ```
    """)
  get is ArmResourceRead<VirtualMachine>;

  /**
   * The operation to create or update a virtual machine. Please note some properties can be set only during virtual machine creation.
   */
  @scenario
  @scenarioDoc("""
    Test that a client can expose operations from multiple services. This operaton should be called like this: `client.virtualMachines.createOrUpdate(...)`.
    
    PUT (create or update) a Virtual Machine.
    Expected path: /subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Microsoft.Compute/virtualMachines/vm1
    Expected query parameter: api-version=2025-04-01
    Expected request body:
    ```json
    {
      "location": "eastus",
      "properties": {}
    }
    ```
    Expected response body:
    ```json
    {
      "id": "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/test-rg/providers/Microsoft.Compute/virtualMachines/vm1",
      "name": "vm1",
      "type": "Microsoft.Compute/virtualMachines",
      "location": "eastus",
      "properties": {
        "provisioningState": "Succeeded"
      }
    }
    ```
    """)
  createOrUpdate is ArmResourceCreateOrUpdateAsync<VirtualMachine>;
}
