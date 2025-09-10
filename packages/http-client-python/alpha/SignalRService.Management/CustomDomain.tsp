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
 * A custom domain
 */
@parentResource(SignalRResource)
model CustomDomain is Azure.ResourceManager.ProxyResource<CustomDomainProperties, false> {
  ...ResourceNameParameter<
    Resource = CustomDomain,
    KeyName = "name",
    SegmentName = "customDomains",
    NamePattern = ""
  >;
}

@armResourceOperations
interface CustomDomains {
  /**
   * Get a custom domain.
   */
  get is ArmResourceRead<CustomDomain>;

  /**
   * Create or update a custom domain.
   */
  #suppress "@azure-tools/typespec-azure-resource-manager/arm-put-operation-response-codes" "For backward compatibility"
  #suppress "@azure-tools/typespec-azure-core/invalid-final-state" "For backward compatibility"
  @Azure.Core.useFinalStateVia("azure-async-operation")
  createOrUpdate is ArmResourceCreateOrReplaceAsync<
    CustomDomain,
    Response = ArmResourceCreatedResponse<CustomDomain>
  >;

  /**
   * Delete a custom domain.
   */
  #suppress "@azure-tools/typespec-azure-resource-manager/arm-delete-operation-response-codes" "For backward compatibility"
  delete is ArmResourceDeleteWithoutOkAsync<
    CustomDomain,
    Response = ArmDeletedResponse | ArmDeleteAcceptedLroResponse | ArmDeletedNoContentResponse
  >;

  /**
   * List all custom domains.
   */
  list is ArmResourceListByParent<CustomDomain, Response = ArmResponse<CustomDomainList>>;
}

@@doc(CustomDomain.name, "Custom domain name.");
@@doc(CustomDomain.properties, "Properties of a custom domain.");
@@doc(CustomDomains.createOrUpdate::parameters.resource, "");
