import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-azure-resource-manager";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.Versioning;
using Azure.ResourceManager;

@armProviderNamespace
@service(#{ title: "ArmApiVersionOverride" })
@versioned(Versions)
@doc("Management API with an operation-group API-version override.")
namespace TspTest.ArmApiVersionOverride;

enum Versions {
  v2026_03_01: "2026-03-01",
}

model NetworkInterface is ProxyResource<NetworkInterfaceProperties> {
  ...ResourceNameParameter<NetworkInterface>;
}

model NetworkInterfaceProperties {
  @visibility(Lifecycle.Read)
  provisioningState?: ResourceProvisioningState;
}

@armResourceOperations
interface NetworkInterfaces {
  get is ArmResourceRead<NetworkInterface>;
}

alias VmssNetworkInterfaceOps = Azure.ResourceManager.Legacy.RoutedOperations<
  {
    ...ApiVersionParameter;
    ...SubscriptionIdParameter;
    ...ResourceGroupParameter;
  },
  {},
  ResourceRoute = #{
    route: "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Compute",
  }
>;

#suppress "@azure-tools/typespec-azure-core/no-legacy-usage" "Exercise the Network VMSS API-version override."
@Azure.Core.Legacy.overrideApiVersion("2018-10-01")
@armResourceOperations(#{ allowStaticRoutes: true })
interface VmssNetworkInterfaces {
  @get
  @route("/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Compute/virtualMachineScaleSets/{virtualMachineScaleSetName}/networkInterfaces/{networkInterfaceName}")
  get is VmssNetworkInterfaceOps.ActionSync<
    NetworkInterface,
    Request = void,
    Parameters = {
      @path
      virtualMachineScaleSetName: string;

      @path
      networkInterfaceName: string;
    },
    Response = ArmResponse<NetworkInterface>
  >;
}
