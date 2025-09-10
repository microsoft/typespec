import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-azure-resource-manager";
import "@typespec/openapi";
import "@typespec/rest";
import "./models.tsp";

using TypeSpec.Rest;
using Azure.ResourceManager;
using TypeSpec.Http;
using TypeSpec.OpenAPI;

namespace Microsoft.SignalRService;

/**
 * A class representing a resource.
 */
#suppress "@azure-tools/typespec-azure-core/casing-style" "For backward compatibility"
model SignalRResource is Azure.ResourceManager.TrackedResource<SignalRProperties> {
  ...ResourceNameParameter<
    Resource = SignalRResource,
    KeyName = "resourceName",
    SegmentName = "signalR",
    NamePattern = "^[a-zA-Z][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]$"
  >;

  /**
   * The billing information of the resource.
   */
  #suppress "@azure-tools/typespec-azure-resource-manager/arm-resource-invalid-envelope-property" "For backward compatibility"
  sku?: ResourceSku;

  /**
   * The kind of the service
   */
  #suppress "@azure-tools/typespec-azure-resource-manager/arm-resource-invalid-envelope-property" "For backward compatibility"
  @visibility(Lifecycle.Read, Lifecycle.Create)
  kind?: ServiceKind;

  /**
   * A class represent managed identities used for request and response
   */
  #suppress "@azure-tools/typespec-azure-resource-manager/arm-resource-invalid-envelope-property" "For backward compatibility"
  identity?: ManagedIdentity;
}

#suppress "@azure-tools/typespec-azure-core/casing-style" "For backward compatibility"
@armResourceOperations
interface SignalRResources {
  /**
   * Get the resource and its properties.
   */
  get is ArmResourceRead<SignalRResource>;

  /**
   * Create or update a resource.
   */
  #suppress "@azure-tools/typespec-azure-resource-manager/arm-put-operation-response-codes" "For backward compatibility"
  #suppress "@azure-tools/typespec-azure-core/invalid-final-state" "For backward compatibility"
  @Azure.Core.useFinalStateVia("azure-async-operation")
  createOrUpdate is ArmResourceCreateOrReplaceAsync<
    SignalRResource,
    Response = ArmResourceUpdatedResponse<SignalRResource> | ArmResourceCreatedResponse<SignalRResource> | ArmAcceptedLroResponse<LroHeaders = ArmLroLocationHeader<FinalResult = SignalRResource> &
      Azure.Core.Foundations.RetryAfterHeader>
  >;

  /**
   * Operation to update an exiting resource.
   */
  @patch(#{ implicitOptionality: false })
  update is ArmCustomPatchAsync<SignalRResource, PatchModel = SignalRResource>;

  /**
   * Operation to delete a resource.
   */
  #suppress "@azure-tools/typespec-azure-resource-manager/arm-delete-operation-response-codes" "For backward compatibility"
  delete is ArmResourceDeleteWithoutOkAsync<
    SignalRResource,
    Response = ArmDeletedResponse | ArmDeleteAcceptedLroResponse | ArmDeletedNoContentResponse
  >;

  /**
   * Handles requests to list all resources in a resource group.
   */
  listByResourceGroup is ArmResourceListByParent<
    SignalRResource,
    Response = ArmResponse<SignalRResourceList>
  >;

  /**
   * Handles requests to list all resources in a subscription.
   */
  listBySubscription is ArmListBySubscription<
    SignalRResource,
    Response = ArmResponse<SignalRResourceList>
  >;

  /**
   * Get the access keys of the resource.
   */
  listKeys is ArmResourceActionSync<SignalRResource, void, ArmResponse<SignalRKeys>>;

  /**
   * Regenerate the access key for the resource. PrimaryKey and SecondaryKey cannot be regenerated at the same time.
   */
  #suppress "@azure-tools/typespec-azure-resource-manager/no-response-body" "For backward compatibility"
  regenerateKey is ArmResourceActionAsyncBase<
    SignalRResource,
    RegenerateKeyParameters,
    ArmResponse<SignalRKeys> | (ArmAcceptedLroResponse<LroHeaders = ArmLroLocationHeader<FinalResult = SignalRKeys> &
      Azure.Core.Foundations.RetryAfterHeader> & {
      @bodyRoot body: SignalRKeys;
    }),
    BaseParameters = Azure.ResourceManager.Foundations.DefaultBaseParameters<SignalRResource>
  >;

  /**
   * Operation to restart a resource.
   */
  #suppress "@azure-tools/typespec-azure-resource-manager/arm-post-operation-response-codes" "For backward compatibility"
  restart is ArmResourceActionAsync<SignalRResource, void, void>;

  /**
   * List all available skus of the resource.
   */
  @get
  @action("skus")
  listSkus is ArmResourceActionSync<SignalRResource, void, ArmResponse<SkuList>>;

  /**
   * Get the private link resources that need to be created for a resource.
   */
  @get
  @list
  @action("privateLinkResources")
  list is ArmResourceActionSync<SignalRResource, void, ArmResponse<PrivateLinkResourceList>>;
}

@@maxLength(SignalRResource.name, 63);
@@minLength(SignalRResource.name, 3);
@@doc(SignalRResource.name, "The name of the resource.");
@@doc(SignalRResource.properties, "A class that describes the properties of the resource");
@@doc(SignalRResources.createOrUpdate::parameters.resource,
  "Parameters for the create or update operation"
);
@@doc(SignalRResources.update::parameters.properties, "Parameters for the update operation");
@@doc(SignalRResources.regenerateKey::parameters.body,
  "Parameter that describes the Regenerate Key Operation."
);
