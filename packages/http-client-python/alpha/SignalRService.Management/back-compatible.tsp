import "@azure-tools/typespec-client-generator-core";

using Azure.ClientGenerator.Core;
using Microsoft.SignalRService;

#suppress "deprecated" "@flattenProperty decorator is not recommended to use."
@@flattenProperty(PrivateLinkResource.properties);

@@clientName(SignalRResources.createOrUpdate::parameters.resource, "parameters");
@@clientName(SignalRResources.update::parameters.properties, "parameters");
@@clientName(SignalRResources.regenerateKey::parameters.body, "parameters");
#suppress "deprecated" "@flattenProperty decorator is not recommended to use."
@@flattenProperty(SignalRResource.properties);

@@clientName(PrivateEndpointConnections.update::parameters.resource, "parameters");
#suppress "deprecated" "@flattenProperty decorator is not recommended to use."
@@flattenProperty(PrivateEndpointConnection.properties);

@@clientName(SharedPrivateLinkResources.createOrUpdate::parameters.resource, "parameters");
@@clientName(SignalRSharedPrivateLinkResources.createOrUpdate::parameters.resource, "parameters");
#suppress "deprecated" "@flattenProperty decorator is not recommended to use."
@@flattenProperty(SharedPrivateLinkResource.properties);

@@clientName(CustomCertificates.createOrUpdate::parameters.resource, "parameters");
#suppress "deprecated" "@flattenProperty decorator is not recommended to use."
@@flattenProperty(CustomCertificate.properties);

@@clientName(CustomDomains.createOrUpdate::parameters.resource, "parameters");
#suppress "deprecated" "@flattenProperty decorator is not recommended to use."
@@flattenProperty(CustomDomain.properties);

@@clientName(Replicas.createOrUpdate::parameters.resource, "parameters");
@@clientName(Replicas.update::parameters.properties, "parameters");
#suppress "deprecated" "@flattenProperty decorator is not recommended to use."
@@flattenProperty(Replica.properties);

@@clientName(SignalROperationGroup.checkNameAvailability::parameters.body, "parameters");

@@clientLocation(CustomCertificates.get, "SignalRCustomCertificates", "!csharp");
@@clientLocation(CustomCertificates.createOrUpdate, "SignalRCustomCertificates", "!csharp");
@@clientLocation(CustomCertificates.delete, "SignalRCustomCertificates", "!csharp");
@@clientLocation(CustomCertificates.list, "SignalRCustomCertificates", "!csharp");
@@clientLocation(CustomDomains.get, "SignalRCustomDomains", "!csharp");
@@clientLocation(CustomDomains.createOrUpdate, "SignalRCustomDomains", "!csharp");
@@clientLocation(CustomDomains.delete, "SignalRCustomDomains", "!csharp");
@@clientLocation(CustomDomains.list, "SignalRCustomDomains", "!csharp");
@@clientLocation(PrivateEndpointConnections.get, "SignalRPrivateEndpointConnections", "!csharp");
@@clientLocation(PrivateEndpointConnections.update, "SignalRPrivateEndpointConnections", "!csharp");
@@clientLocation(PrivateEndpointConnections.delete, "SignalRPrivateEndpointConnections", "!csharp");
@@clientLocation(PrivateEndpointConnections.list, "SignalRPrivateEndpointConnections", "!csharp");
@@clientLocation(Replicas.get, "SignalRReplicas", "!csharp");
@@clientLocation(Replicas.createOrUpdate, "SignalRReplicas", "!csharp");
@@clientLocation(Replicas.update, "SignalRReplicas", "!csharp");
@@clientLocation(Replicas.delete, "SignalRReplicas");
@@clientLocation(Replicas.list, "SignalRReplicas");
@@clientLocation(Replicas.restart, "SignalRReplicas");
@@clientLocation(Replicas.listReplicaSkus, "SignalR");
@@clientLocation(SharedPrivateLinkResources.get,
  "SignalRReplicaSharedPrivateLinkResources",
  "!csharp"
);
@@clientLocation(SharedPrivateLinkResources.createOrUpdate,
  "SignalRReplicaSharedPrivateLinkResources",
  "!csharp"
);
@@clientLocation(SharedPrivateLinkResources.list,
  "SignalRReplicaSharedPrivateLinkResources",
  "!csharp"
);
@@clientLocation(SignalROperationGroup.checkNameAvailability, "SignalR");
@@clientLocation(SignalRResources.get, "SignalR", "!csharp");
@@clientLocation(SignalRResources.createOrUpdate, "SignalR", "!csharp");
@@clientLocation(SignalRResources.update, "SignalR", "!csharp");
@@clientLocation(SignalRResources.delete, "SignalR", "!csharp");
@@clientLocation(SignalRResources.listByResourceGroup, "SignalR", "!csharp");
@@clientLocation(SignalRResources.listBySubscription, "SignalR", "!csharp");
@@clientLocation(SignalRResources.listKeys, "SignalR", "!csharp");
@@clientLocation(SignalRResources.regenerateKey, "SignalR", "!csharp");
@@clientLocation(SignalRResources.restart, "SignalR", "!csharp");
@@clientLocation(SignalRResources.listSkus, "SignalR", "!csharp");
@@clientLocation(SignalRResources.list, "SignalRPrivateLinkResources", "!csharp");
@@clientLocation(UsagesOperationGroup.list, "Usages");
