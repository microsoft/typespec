import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-azure-resource-manager";
import "@typespec/openapi";
import "@typespec/rest";
import "./models.tsp";
import "./Replica.tsp";

using TypeSpec.Rest;
using Azure.ResourceManager;
using TypeSpec.Http;
using TypeSpec.OpenAPI;

namespace Microsoft.SignalRService;
/**
 * Describes a Shared Private Link Resource
 */
@parentResource(Replica)
model SharedPrivateLinkResource
  is Azure.ResourceManager.ProxyResource<SharedPrivateLinkResourceProperties> {
  ...ResourceNameParameter<
    Resource = SharedPrivateLinkResource,
    KeyName = "sharedPrivateLinkResourceName",
    SegmentName = "sharedPrivateLinkResources",
    NamePattern = "^[a-zA-Z][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]$"
  >;
}

@armResourceOperations
interface SharedPrivateLinkResourceOps
  extends Azure.ResourceManager.Legacy.LegacyOperations<
      {
        ...ApiVersionParameter,
        ...SubscriptionIdParameter,
        ...ResourceGroupParameter,
        ...Azure.ResourceManager.Legacy.Provider,

        /**
         * The name of the SignalRResource
         */
        @path
        @segment("signalR")
        @pattern("^[a-zA-Z][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]$")
        @minLength(3)
        @maxLength(63)
        resourceName: string,

        /**
         * The name of the Replica
         */
        @path
        @segment("replicas")
        @pattern("^[a-zA-Z][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]$")
        @minLength(3)
        @maxLength(63)
        replicaName: string,
      },
      {
        /**
         * The name of the SharedPrivateLinkResource
         */
        @path
        @segment("sharedPrivateLinkResources")
        @pattern("^[a-zA-Z][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]$")
        @minLength(3)
        @maxLength(63)
        sharedPrivateLinkResourceName: string,
      }
    > {}

@armResourceOperations
interface SharedPrivateLinkResources {
  /**
   * Get the specified shared private link resource
   */
  get is SharedPrivateLinkResourceOps.Read<SharedPrivateLinkResource>;

  /**
   * Create or update a shared private link resource
   */
  createOrUpdate is SharedPrivateLinkResourceOps.CreateOrUpdateAsync<SharedPrivateLinkResource>;

  /**
   * List shared private link resources
   */
  list is SharedPrivateLinkResourceOps.List<
    SharedPrivateLinkResource,
    Response = ArmResponse<SharedPrivateLinkResourceList>
  >;
}
#suppress "@azure-tools/typespec-azure-core/casing-style" "For backward compatibility"
@armResourceOperations
interface SignalRSharedPrivateLinkResourceOps
  extends Azure.ResourceManager.Legacy.LegacyOperations<
      {
        ...ApiVersionParameter,
        ...SubscriptionIdParameter,
        ...ResourceGroupParameter,
        ...Azure.ResourceManager.Legacy.Provider,

        /**
         * The name of the SignalRResource
         */
        @path
        @segment("signalR")
        @pattern("^[a-zA-Z][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]$")
        @minLength(3)
        @maxLength(63)
        resourceName: string,
      },
      {
        /**
         * The name of the SharedPrivateLinkResource
         */
        @path
        @segment("sharedPrivateLinkResources")
        @pattern("^[a-zA-Z][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]$")
        @minLength(3)
        @maxLength(63)
        sharedPrivateLinkResourceName: string,
      }
    > {}

#suppress "@azure-tools/typespec-azure-core/casing-style" "For backward compatibility"
@armResourceOperations
interface SignalRSharedPrivateLinkResources {
  /**
   * Get the specified shared private link resource
   */
  get is SignalRSharedPrivateLinkResourceOps.Read<SharedPrivateLinkResource>;

  /**
   * Create or update a shared private link resource
   */
  createOrUpdate is SignalRSharedPrivateLinkResourceOps.CreateOrUpdateAsync<SharedPrivateLinkResource>;

  /**
   * Delete the specified shared private link resource
   */
  #suppress "@azure-tools/typespec-azure-resource-manager/arm-delete-operation-response-codes" "For backward compatibility"
  delete is SignalRSharedPrivateLinkResourceOps.DeleteWithoutOkAsync<
    SharedPrivateLinkResource,
    Response = ArmDeletedResponse | ArmDeleteAcceptedLroResponse | ArmDeletedNoContentResponse
  >;

  /**
   * List shared private link resources
   */
  list is SignalRSharedPrivateLinkResourceOps.List<
    SharedPrivateLinkResource,
    Response = ArmResponse<SharedPrivateLinkResourceList>
  >;
}

@@maxLength(SharedPrivateLinkResource.name, 63);
@@minLength(SharedPrivateLinkResource.name, 3);
@@doc(SharedPrivateLinkResource.name, "The name of the shared private link resource.");
@@doc(SharedPrivateLinkResource.properties,
  "Describes the properties of an existing Shared Private Link Resource"
);
@@doc(SharedPrivateLinkResources.createOrUpdate::parameters.resource,
  "The shared private link resource"
);
@@doc(SignalRSharedPrivateLinkResources.createOrUpdate::parameters.resource,
  "The shared private link resource"
);
