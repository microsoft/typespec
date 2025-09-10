import "@azure-tools/typespec-client-generator-core";
import "./main.tsp";

using Http;
using Azure.Core;
using Azure.ClientGenerator.Core;
using Microsoft.SignalRService;

@TypeSpec.Versioning.useDependency(Azure.Core.Versions.v1_0_Preview_2)
@TypeSpec.Versioning.useDependency(Microsoft.SignalRService.Versions.v2025_01_01_preview)
namespace Customization;

@@clientName(Microsoft.SignalRService, "SignalRManagementClient", "javascript");

// Client name mappings to match the existing Java SDK naming conventions
@@clientName(NetworkACL, "NetworkAcl", "java");
@@clientName(PrivateEndpointACL, "PrivateEndpointAcl", "java");
@@clientName(ACLAction, "AclAction", "java");

// Property name mappings to maintain backward compatibility
@@clientName(SignalRProperties.externalIP, "externalIp", "java");
@@clientName(SignalRProperties.hostName, "hostname", "java");
@@clientName(SignalRProperties.hostNamePrefix, "hostnamePrefix", "java");

// Override the order of path parameters
#suppress "@azure-tools/typespec-azure-core/casing-style" "customization"
#suppress "@azure-tools/typespec-azure-resource-manager/arm-resource-operation" "customization"
#suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
op SignalRPrivateEndpointConnectionsGetCustomized(
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  provider: "Microsoft.ThisWillBeReplaced",

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @query("api-version")
  apiVersion: string,

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  subscriptionId: uuid,

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  privateEndpointConnectionName: string,

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  resourceGroupName: string,

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  resourceName: string,
): PrivateEndpointConnection;

#suppress "@azure-tools/typespec-azure-core/casing-style" "customization"
#suppress "@azure-tools/typespec-azure-resource-manager/arm-resource-operation" "customization"
#suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
op SignalRPrivateEndpointConnectionsUpdateCustomized(
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  provider: "Microsoft.ThisWillBeReplaced",

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @query("api-version")
  apiVersion: string,

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  subscriptionId: uuid,

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  privateEndpointConnectionName: string,

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  resourceGroupName: string,

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  resourceName: string,

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @body
  parameters: PrivateEndpointConnection,
): PrivateEndpointConnection;

#suppress "@azure-tools/typespec-azure-core/casing-style" "customization"
#suppress "@azure-tools/typespec-azure-resource-manager/arm-resource-operation" "customization"
#suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
op SignalRPrivateEndpointConnectionsDeleteCustomized(
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  provider: "Microsoft.ThisWillBeReplaced",

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @query("api-version")
  apiVersion: string,

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  subscriptionId: uuid,

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  privateEndpointConnectionName: string,

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  resourceGroupName: string,

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  resourceName: string,
): void;

#suppress "@azure-tools/typespec-azure-core/casing-style" "customization"
#suppress "@azure-tools/typespec-azure-resource-manager/arm-resource-operation" "customization"
#suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
op SignalRSharedPrivateLinkResourcesCreateOrUpdateCustomized(
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  provider: "Microsoft.ThisWillBeReplaced",

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @query("api-version")
  apiVersion: string,

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  subscriptionId: uuid,

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  sharedPrivateLinkResourceName: string,

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  resourceGroupName: string,

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  resourceName: string,

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @body
  parameters: SharedPrivateLinkResource,
): SharedPrivateLinkResource;

#suppress "@azure-tools/typespec-azure-core/casing-style" "customization"
#suppress "@azure-tools/typespec-azure-resource-manager/arm-resource-operation" "customization"
#suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
op SignalRSharedPrivateLinkResourcesGetCustomized(
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  provider: "Microsoft.ThisWillBeReplaced",

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @query("api-version")
  apiVersion: string,

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  subscriptionId: uuid,

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  sharedPrivateLinkResourceName: string,

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  resourceGroupName: string,

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  resourceName: string,
): SharedPrivateLinkResource;

#suppress "@azure-tools/typespec-azure-core/casing-style" "customization"
#suppress "@azure-tools/typespec-azure-resource-manager/arm-resource-operation" "customization"
#suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
op SignalRSharedPrivateLinkResourcesDeleteCustomized(
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  provider: "Microsoft.ThisWillBeReplaced",

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @query("api-version")
  apiVersion: string,

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  subscriptionId: uuid,

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  sharedPrivateLinkResourceName: string,

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  resourceGroupName: string,

  #suppress "@azure-tools/typespec-azure-core/documentation-required" "override"
  @path
  resourceName: string,
): void;

@@override(PrivateEndpointConnections.get,
  SignalRPrivateEndpointConnectionsGetCustomized,
  "python,java,go"
);
@@override(PrivateEndpointConnections.update,
  SignalRPrivateEndpointConnectionsUpdateCustomized,
  "python,java,go"
);
@@override(PrivateEndpointConnections.delete,
  SignalRPrivateEndpointConnectionsDeleteCustomized,
  "python,java,go"
);

@@override(SignalRSharedPrivateLinkResources.createOrUpdate,
  SignalRSharedPrivateLinkResourcesCreateOrUpdateCustomized,
  "python,java,go"
);
@@override(SignalRSharedPrivateLinkResources.get,
  SignalRSharedPrivateLinkResourcesGetCustomized,
  "python,java,go"
);
@@override(SignalRSharedPrivateLinkResources.delete,
  SignalRSharedPrivateLinkResourcesDeleteCustomized,
  "python,java,go"
);

// Resolve model naming breaking changes from Swagger directive migration
@@clientName(SignalRResource, "ResourceInfo", "go");
@@clientName(SignalRResourceList, "ResourceInfoList", "go");

@@clientName(Operation, "SignalROperationInfo", "csharp");
@@clientName(SignalRResource, "SignalR", "csharp");
@@clientName(CustomCertificate, "SignalRCustomCertificate", "csharp");
@@clientName(CustomDomain, "SignalRCustomDomain", "csharp");
@@clientName(PrivateEndpointConnection, "SignalRPrivateEndpointConnection", "csharp");
@@clientName(SharedPrivateLinkResource, "SignalRSharedPrivateLinkResource", "csharp");
@@clientName(ProvisioningState, "SignalRProvisioningState", "csharp");
@@clientName(FeatureFlags, "SignalRFeatureFlags", "csharp");
@@clientName(KeyType, "SignalRKeyType", "csharp");
@@clientName(LiveTraceCategory, "SignalRLiveTraceCategory", "csharp");
@@clientName(LiveTraceConfiguration, "SignalRLiveTraceConfiguration", "csharp");
@@clientName(ResourceLogCategory, "SignalRResourceLogCategory", "csharp");
@@clientName(ResourceSku, "SignalRResourceSku", "csharp");
@@clientName(ScaleType, "SignalRScaleType", "csharp");
@@clientName(ServiceKind, "SignalRServiceKind", "csharp");
@@clientName(SharedPrivateLinkResourceStatus, "SignalRSharedPrivateLinkResourceStatus", "csharp");
@@clientName(SkuCapacity, "SignalRSkuCapacity", "csharp");
@@clientName(UpstreamAuthSettings, "SignalRUpstreamAuthSettings", "csharp");
@@clientName(UpstreamAuthSettings.type, "AuthType", "csharp");
@@clientName(UpstreamAuthType, "SignalRUpstreamAuthType", "csharp");
@@clientName(UpstreamTemplate, "SignalRUpstreamTemplate", "csharp");
@@clientName(SignalRTlsSettings.clientCertEnabled, "IsClientCertEnabled", "csharp");
@@clientName(SignalROperationGroup.checkNameAvailability, "CheckSignalRNameAvailability", "csharp");
@@alternateType(SignalROperationGroup.checkNameAvailability::parameters.location,
  azureLocation,
  "csharp"
);
@@clientName(NetworkACL, "SignalRNetworkAcl", "csharp");
@@clientName(CustomCertificateList, "SignalRCustomCertificateList", "csharp");
@@clientName(CustomDomainList, "SignalRCustomDomainList", "csharp");
@@clientName(NameAvailability, "SignalRNameAvailabilityResult", "csharp");
@@clientName(NameAvailabilityParameters, "SignalRNameAvailabilityContent", "csharp");
@@clientName(NameAvailabilityParameters.type, "resourceType", "csharp");
@@alternateType(NameAvailabilityParameters.type, armResourceType, "csharp");
@@clientName(ACLAction, "SignalRNetworkAclAction", "csharp");
@@clientName(PrivateEndpointACL, "SignalRPrivateEndpointAcl", "csharp");
@@clientName(PrivateEndpointConnectionList, "SignalRPrivateEndpointConnectionListResult", "csharp");
@@clientName(PrivateLinkResourceList, "SignalRPrivateLinkResourceListResult", "csharp");
@@clientName(ResourceLogConfiguration, "SignalRResourceLogConfiguration", "csharp");
@@clientName(SharedPrivateLinkResourceList, "SignalRSharedPrivateLinkResourceListResult", "csharp");
@@clientName(SkuList, "SignalRSkuListResult", "csharp");
@@clientName(NameAvailability.nameAvailable, "IsNameAvailable", "csharp");
@@clientName(SignalRRequestType.RESTAPI, "RestApi", "csharp");
@@alternateType(Sku.resourceType, armResourceType, "csharp");
@@alternateType(CustomCertificateProperties.keyVaultBaseUri, url, "csharp");
@@clientName(PrivateEndpointConnectionProperties.privateLinkServiceConnectionState,
  "ConnectionState",
  "csharp"
);
@@alternateType(UsagesOperationGroup.list::parameters.location, azureLocation, "csharp");
@@alternateType(SharedPrivateLinkResourceProperties.privateLinkResourceId,
  armResourceIdentifier,
  "csharp"
);
@@clientName(ShareablePrivateLinkResourceProperties.type,
  "ShareablePrivateLinkResourcePropertiesType",
  "csharp"
);
@@alternateType(SignalRUsage.id, armResourceIdentifier, "csharp");
@@clientName(SignalRNetworkACLs, "SignalRNetworkAcls", "csharp");
@@clientName(PrivateLinkResource, "SignalRPrivateLinkResource", "csharp");
@@clientName(SignalRResources.list, "GetSignalRPrivateLinkResources", "csharp");
@@clientName(RegenerateKeyParameters, "SignalRRegenerateKeyContent", "csharp");

@@usage(ShareablePrivateLinkResourceProperties, Usage.input | Usage.output, "csharp");
@@usage(ShareablePrivateLinkResourceType, Usage.input | Usage.output, "csharp");
