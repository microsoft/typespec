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
 * A private endpoint connection to an azure resource
 */
@parentResource(SignalRResource)
model PrivateEndpointConnection
  is Azure.ResourceManager.ProxyResource<PrivateEndpointConnectionProperties> {
  ...ResourceNameParameter<
    Resource = PrivateEndpointConnection,
    KeyName = "privateEndpointConnectionName",
    SegmentName = "privateEndpointConnections",
    NamePattern = ""
  >;
}

@armResourceOperations
interface PrivateEndpointConnections {
  /**
   * Get the specified private endpoint connection
   */
  get is ArmResourceRead<PrivateEndpointConnection>;

  /**
   * Update the state of specified private endpoint connection
   */
  #suppress "@azure-tools/typespec-azure-resource-manager/arm-put-operation-response-codes" "For backward compatibility"
  update is ArmResourceCreateOrReplaceSync<
    PrivateEndpointConnection,
    Response = ArmResourceUpdatedResponse<PrivateEndpointConnection>
  >;

  /**
   * Delete the specified private endpoint connection
   */
  #suppress "@azure-tools/typespec-azure-resource-manager/arm-delete-operation-response-codes" "For backward compatibility"
  delete is ArmResourceDeleteWithoutOkAsync<
    PrivateEndpointConnection,
    Response = ArmDeletedResponse | ArmDeleteAcceptedLroResponse | ArmDeletedNoContentResponse
  >;

  /**
   * List private endpoint connections
   */
  list is ArmResourceListByParent<
    PrivateEndpointConnection,
    Response = ArmResponse<PrivateEndpointConnectionList>
  >;
}

@@doc(PrivateEndpointConnection.name,
  "The name of the private endpoint connection associated with the Azure resource."
);
@@doc(PrivateEndpointConnection.properties, "Private endpoint connection properties");
@@doc(PrivateEndpointConnections.update::parameters.resource,
  "The resource of private endpoint and its properties"
);
