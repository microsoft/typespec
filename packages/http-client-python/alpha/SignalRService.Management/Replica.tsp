import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-azure-resource-manager";
import "@typespec/openapi";
import "@typespec/rest";
import "./models.tsp";
import "./SignalRResource.tsp";

using TypeSpec.Rest;
using Azure.ResourceManager;
using TypeSpec.Http;
using TypeSpec.OpenAPI;

namespace Microsoft.SignalRService;
/**
 * A class represent a replica resource.
 */
@parentResource(SignalRResource)
model Replica is Azure.ResourceManager.TrackedResource<ReplicaProperties> {
  ...ResourceNameParameter<
    Resource = Replica,
    KeyName = "replicaName",
    SegmentName = "replicas",
    NamePattern = "^[a-zA-Z][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]$"
  >;

  /**
   * The billing information of the resource.
   */
  #suppress "@azure-tools/typespec-azure-resource-manager/arm-resource-invalid-envelope-property" "For backward compatibility"
  sku?: ResourceSku;
}

@armResourceOperations
interface Replicas {
  /**
   * Get the replica and its properties.
   */
  get is ArmResourceRead<Replica>;

  /**
   * Create or update a replica.
   */
  createOrUpdate is ArmResourceCreateOrReplaceAsync<Replica>;

  /**
   * Operation to update an exiting replica.
   */
  #suppress "@azure-tools/typespec-azure-resource-manager/no-response-body" "For backward compatibility"
  @patch(#{ implicitOptionality: false })
  update is ArmCustomPatchAsync<
    Replica,
    PatchModel = Replica,
    Response = ArmResponse<Replica> | (ArmAcceptedLroResponse<LroHeaders = ArmLroLocationHeader<FinalResult = Replica> &
      Azure.Core.Foundations.RetryAfterHeader> & {
      @bodyRoot
      _: Replica;
    })
  >;

  /**
   * Operation to delete a replica.
   */
  delete is ArmResourceDeleteSync<Replica>;

  /**
   * List all replicas belong to this resource
   */
  list is ArmResourceListByParent<Replica, Response = ArmResponse<ReplicaList>>;

  /**
   * List all available skus of the replica resource.
   */
  @get
  @action("skus")
  listReplicaSkus is ArmResourceActionSync<Replica, void, ArmResponse<SkuList>>;

  /**
   * Operation to restart a replica.
   */
  #suppress "@azure-tools/typespec-azure-resource-manager/arm-post-operation-response-codes" "For backward compatibility"
  restart is ArmResourceActionAsync<Replica, void, void>;
}

@@maxLength(Replica.name, 63);
@@minLength(Replica.name, 3);
@@doc(Replica.name, "The name of the replica.");
@@doc(Replica.properties, "");
@@doc(Replicas.createOrUpdate::parameters.resource,
  "Parameters for the create or update operation"
);
@@doc(Replicas.update::parameters.properties, "Parameters for the update operation");
