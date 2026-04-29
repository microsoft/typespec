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
using Azure.ClientGenerator.Core;

@armProviderNamespace
@service(#{ title: "ArmLegacy" })
@versioned(Versions)
@doc("Arm Resource Provider management API.")
namespace TspTest.ArmLegacy;

enum Versions {
  v2024_12_01: "2024-12-01",
}

model SkuResource is Azure.ResourceManager.ProxyResource<ResourceTypeSku> {
  ...ResourceNameParameter<
    Resource = SkuResource,
    KeyName = "sku",
    SegmentName = "skus",
    NamePattern = ""
  >;
}

@armResourceOperations
interface Skus {
  getNested is SkuNested.Read<SkuResource>;

  createNested is SkuNested.CreateOrUpdateSync<
    SkuResource,
    Response = ArmResourceUpdatedResponse<SkuResource>
  >;

  deleteNested is SkuNested.DeleteSync<SkuResource>;

  getRoot is SkuRoot.Read<SkuResource>;

  createRoot is SkuRoot.CreateOrUpdateSync<
    SkuResource,
    Response = ArmResourceUpdatedResponse<SkuResource>
  >;

  deleteRoot is SkuRoot.DeleteSync<SkuResource>;
}

model ResourceTypeSku {
  @visibility(Lifecycle.Read)
  provisioningState?: ProvisioningState;
}

union ProvisioningState {
  ResourceProvisioningState,
  Provisioning: "Provisioning",
  Updating: "Updating",
  Deleting: "Deleting",
  Accepted: "Accepted",
}

interface SkuRoot
  extends Azure.ResourceManager.Legacy.ExtensionOperations<
      {
        ...ApiVersionParameter,
        ...SubscriptionIdParameter,
        ...Azure.ResourceManager.Legacy.Provider,

        /** The name of the resource provider hosted within ProviderHub. */
        @path
        @segment("providerRegistrations")
        @key
        providerNamespace: string,

        /** The resource type. */
        @path
        @segment("resourcetypeRegistrations")
        @key
        resourceType: string,
      },
      {},
      {
        /** The SKU. */
        @path
        @segment("skus")
        @key
        sku: string,
      }
    > {}

interface SkuNested
  extends Azure.ResourceManager.Legacy.ExtensionOperations<
      {
        ...ApiVersionParameter,
        ...SubscriptionIdParameter,
        ...Azure.ResourceManager.Legacy.Provider,

        /** The name of the resource provider hosted within ProviderHub. */
        @path
        @segment("providerRegistrations")
        @key
        providerNamespace: string,

        /** The resource type. */
        @path
        @segment("resourcetypeRegistrations")
        @key
        resourceType: string,

        /** The first child resource type. */
        @path
        @segment("resourcetypeRegistrations")
        @key
        nestedResourceTypeFirst: string,
      },
      {},
      {
        /** The SKU. */
        @path
        @segment("skus")
        @key
        sku: string,
      }
    > {}
