import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-azure-resource-manager";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Versioning;
using Azure.ResourceManager;

@armProviderNamespace
@service(#{ title: "ArmVersioned" })
@versioned(Versions)
@doc("Arm Resource Provider management API.")
namespace TspTest.ArmVersioned;

enum Versions {
  v2023_12_01: "2023-12-01",
  v2024_10_01_preview: "2024-10-01-preview",
  v2024_12_01: "2024-12-01",
}

@resource("topLevelArmResources")
model TopLevelArmResource is TrackedResource<TopLevelArmResourceProperties> {
  ...ResourceNameParameter<TopLevelArmResourceProperties>;
}

@doc("Top Level Arm Resource Properties.")
model TopLevelArmResourceProperties {
  @visibility(Lifecycle.Read)
  provisioningState?: ResourceProvisioningState;
}

model OpParameters {
  @query
  parameter?: string;

  @added(Versions.v2024_10_01_preview)
  @query
  newParameter?: string;
}

model Response {}

interface TopLevelArmResources {
  createOrUpdate is ArmResourceCreateOrUpdateAsync<TopLevelArmResource, Parameters = OpParameters>;
  listBySubscription is ArmListBySubscription<TopLevelArmResource, Parameters = OpParameters>;
  listByResourceGroup is ArmResourceListByParent<TopLevelArmResource, Parameters = OpParameters>;
  get is ArmResourceRead<TopLevelArmResource, Parameters = OpParameters>;
  delete is ArmResourceDeleteWithoutOkAsync<TopLevelArmResource, Parameters = OpParameters>;
  action is ArmResourceActionSync<
    TopLevelArmResource,
    Request = void,
    Response = Response,
    Parameters = OpParameters
  >;
}
