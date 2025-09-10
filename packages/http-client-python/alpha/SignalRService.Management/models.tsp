import "@typespec/rest";
import "@typespec/http";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-azure-resource-manager";

using TypeSpec.Rest;
using TypeSpec.Http;
using Azure.ResourceManager;
using Azure.ResourceManager.Foundations;

namespace Microsoft.SignalRService;

/**
 * Optional tier of this particular SKU. 'Standard' or 'Free'.
 *
 * `Basic` is deprecated, use `Standard` instead.
 */
union SignalRSkuTier {
  string,
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Free: "Free",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Basic: "Basic",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Standard: "Standard",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Premium: "Premium",
}

/**
 * Provisioning state of the resource.
 */
union ProvisioningState {
  string,
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Unknown: "Unknown",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Succeeded: "Succeeded",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Failed: "Failed",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Canceled: "Canceled",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Running: "Running",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Creating: "Creating",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Updating: "Updating",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Deleting: "Deleting",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Moving: "Moving",
}

/**
 * Indicates whether the connection has been Approved/Rejected/Removed by the owner of the service.
 */
union PrivateLinkServiceConnectionStatus {
  string,
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Pending: "Pending",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Approved: "Approved",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Rejected: "Rejected",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Disconnected: "Disconnected",
}

/**
 * The type of identity that created the resource.
 */
union CreatedByType {
  string,
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  User: "User",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Application: "Application",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  ManagedIdentity: "ManagedIdentity",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Key: "Key",
}

/**
 * Status of the shared private link resource
 */
union SharedPrivateLinkResourceStatus {
  string,
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Pending: "Pending",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Approved: "Approved",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Rejected: "Rejected",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Disconnected: "Disconnected",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Timeout: "Timeout",
}

/**
 * FeatureFlags is the supported features of Azure SignalR service.
 * - ServiceMode: Flag for backend server for SignalR service. Values allowed: "Default": have your own backend server; "Serverless": your application doesn't have a backend server; "Classic": for backward compatibility. Support both Default and Serverless mode but not recommended; "PredefinedOnly": for future use.
 * - EnableConnectivityLogs: "true"/"false", to enable/disable the connectivity log category respectively.
 * - EnableMessagingLogs: "true"/"false", to enable/disable the connectivity log category respectively.
 * - EnableLiveTrace: Live Trace allows you to know what's happening inside Azure SignalR service, it will give you live traces in real time, it will be helpful when you developing your own Azure SignalR based web application or self-troubleshooting some issues. Please note that live traces are counted as outbound messages that will be charged. Values allowed: "true"/"false", to enable/disable live trace feature.
 */
union FeatureFlags {
  string,
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  ServiceMode: "ServiceMode",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  EnableConnectivityLogs: "EnableConnectivityLogs",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  EnableMessagingLogs: "EnableMessagingLogs",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  EnableLiveTrace: "EnableLiveTrace",
}

/**
 * Upstream auth type enum.
 */
union UpstreamAuthType {
  string,
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  None: "None",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  ManagedIdentity: "ManagedIdentity",
}

/**
 * Azure Networking ACL Action.
 */
union ACLAction {
  string,
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Allow: "Allow",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Deny: "Deny",
}

/**
 * The incoming request type to the service
 */
union SignalRRequestType {
  string,
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  ClientConnection: "ClientConnection",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  ServerConnection: "ServerConnection",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  RESTAPI: "RESTAPI",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Trace: "Trace",
}

#suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
union ClientConnectionCountRuleDiscriminator {
  string,
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  ThrottleByJwtSignatureRule: "ThrottleByJwtSignatureRule",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  ThrottleByUserIdRule: "ThrottleByUserIdRule",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  ThrottleByJwtCustomClaimRule: "ThrottleByJwtCustomClaimRule",
}

#suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
union ClientTrafficControlRuleDiscriminator {
  string,
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  TrafficThrottleByJwtSignatureRule: "TrafficThrottleByJwtSignatureRule",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  TrafficThrottleByUserIdRule: "TrafficThrottleByUserIdRule",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  TrafficThrottleByJwtCustomClaimRule: "TrafficThrottleByJwtCustomClaimRule",
}

/**
 * The kind of the service
 */
union ServiceKind {
  string,
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  SignalR: "SignalR",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  RawWebSockets: "RawWebSockets",
}

/**
 * Represents the identity type: systemAssigned, userAssigned, None
 */
union ManagedIdentityType {
  string,
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  None: "None",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  SystemAssigned: "SystemAssigned",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  UserAssigned: "UserAssigned",
}

/**
 * The type of access key.
 */
union KeyType {
  string,
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Primary: "Primary",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Secondary: "Secondary",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Salt: "Salt",
}

/**
 * The scale type applicable to the sku.
 */
union ScaleType {
  string,
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  None: "None",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Manual: "Manual",
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  Automatic: "Automatic",
}

/**
 * REST API operation supported by resource provider.
 */
model Operation {
  /**
   * Name of the operation with format: {provider}/{resource}/{operation}
   */
  name?: string;

  /**
   * If the operation is a data action. (for data plane rbac)
   */
  isDataAction?: boolean;

  /**
   * The object that describes a operation.
   */
  display?: OperationDisplay;

  /**
   * Optional. The intended executor of the operation; governs the display of the operation in the RBAC UX and the audit logs UX.
   */
  origin?: string;

  /**
   * Extra Operation properties.
   */
  properties?: OperationProperties;
}

/**
 * The object that describes a operation.
 */
model OperationDisplay {
  /**
   * Friendly name of the resource provider
   */
  provider?: string;

  /**
   * Resource type on which the operation is performed.
   */
  resource?: string;

  /**
   * The localized friendly name for the operation.
   */
  operation?: string;

  /**
   * The localized friendly description for the operation
   */
  description?: string;
}

/**
 * Extra Operation properties.
 */
model OperationProperties {
  /**
   * An object that describes a specification.
   */
  serviceSpecification?: ServiceSpecification;
}

/**
 * An object that describes a specification.
 */
model ServiceSpecification {
  /**
   * Specifications of the Metrics for Azure Monitoring.
   */
  @OpenAPI.extension("x-ms-identifiers", #["name", "unit"])
  metricSpecifications?: MetricSpecification[];

  /**
   * Specifications of the Logs for Azure Monitoring.
   */
  @OpenAPI.extension("x-ms-identifiers", #["name"])
  logSpecifications?: LogSpecification[];
}

/**
 * Specifications of the Metrics for Azure Monitoring.
 */
model MetricSpecification {
  /**
   * Name of the metric.
   */
  name?: string;

  /**
   * Localized friendly display name of the metric.
   */
  displayName?: string;

  /**
   * Localized friendly description of the metric.
   */
  displayDescription?: string;

  /**
   * The unit that makes sense for the metric.
   */
  unit?: string;

  /**
   * Only provide one value for this field. Valid values: Average, Minimum, Maximum, Total, Count.
   */
  aggregationType?: string;

  /**
   * Optional. If set to true, then zero will be returned for time duration where no metric is emitted/published.
   * Ex. a metric that returns the number of times a particular error code was emitted. The error code may not appear
   * often, instead of the RP publishing 0, Shoebox can auto fill in 0s for time periods where nothing was emitted.
   */
  fillGapWithZero?: string;

  /**
   * The name of the metric category that the metric belongs to. A metric can only belong to a single category.
   */
  category?: string;

  /**
   * The dimensions of the metrics.
   */
  @OpenAPI.extension("x-ms-identifiers", #["name"])
  dimensions?: Dimension[];
}

/**
 * Specifications of the Dimension of metrics.
 */
model Dimension {
  /**
   * The public facing name of the dimension.
   */
  name?: string;

  /**
   * Localized friendly display name of the dimension.
   */
  displayName?: string;

  /**
   * Name of the dimension as it appears in MDM.
   */
  internalName?: string;

  /**
   * A Boolean flag indicating whether this dimension should be included for the shoebox export scenario.
   */
  toBeExportedForShoebox?: boolean;
}

/**
 * Specifications of the Logs for Azure Monitoring.
 */
model LogSpecification {
  /**
   * Name of the log.
   */
  name?: string;

  /**
   * Localized friendly display name of the log.
   */
  displayName?: string;
}

/**
 * Data POST-ed to the nameAvailability action
 */
model NameAvailabilityParameters {
  /**
   * The resource type. Can be "Microsoft.SignalRService/SignalR", "Microsoft.SignalRService/WebPubSub", "Microsoft.SignalRService/SignalR/replicas" or "Microsoft.SignalRService/WebPubSub/replicas"
   */
  type: string;

  /**
   * The resource name to validate. e.g."my-resource-name"
   */
  name: string;
}

/**
 * Result of the request to check name availability. It contains a flag and possible reason of failure.
 */
model NameAvailability {
  /**
   * Indicates whether the name is available or not.
   */
  nameAvailable?: boolean;

  /**
   * The reason of the availability. Required if name is not available.
   */
  reason?: string;

  /**
   * The message of the operation.
   */
  message?: string;
}

/**
 * Object that includes an array of the resource usages and a possible link for next set.
 */
#suppress "@azure-tools/typespec-azure-core/casing-style" "For backward compatibility"
model SignalRUsageList is Azure.Core.Page<SignalRUsage>;

/**
 * Object that describes a specific usage of the resources.
 */
#suppress "@azure-tools/typespec-azure-core/casing-style" "For backward compatibility"
model SignalRUsage {
  /**
   * Fully qualified ARM resource id
   */
  id?: string;

  /**
   * Current value for the usage quota.
   */
  currentValue?: int64;

  /**
   * The maximum permitted value for the usage quota. If there is no limit, this value will be -1.
   */
  limit?: int64;

  /**
   * Localizable String object containing the name and a localized value.
   */
  name?: SignalRUsageName;

  /**
   * Representing the units of the usage quota. Possible values are: Count, Bytes, Seconds, Percent, CountPerSecond, BytesPerSecond.
   */
  unit?: string;
}

/**
 * Localizable String object containing the name and a localized value.
 */
#suppress "@azure-tools/typespec-azure-core/casing-style" "For backward compatibility"
model SignalRUsageName {
  /**
   * The identifier of the usage.
   */
  value?: string;

  /**
   * Localized name of the usage.
   */
  localizedValue?: string;
}

/**
 * Object that includes an array of resources and a possible link for next set.
 */
#suppress "@azure-tools/typespec-azure-core/casing-style" "For backward compatibility"
model SignalRResourceList is Azure.Core.Page<SignalRResource>;

/**
 * The billing information of the resource.
 */
model ResourceSku {
  /**
   * The name of the SKU. Required.
   *
   * Allowed values: Standard_S1, Free_F1, Premium_P1, Premium_P2
   */
  name: string;

  /**
   * Optional tier of this particular SKU. 'Standard' or 'Free'.
   *
   * `Basic` is deprecated, use `Standard` instead.
   */
  tier?: SignalRSkuTier;

  /**
   * Not used. Retained for future use.
   */
  @visibility(Lifecycle.Read)
  size?: string;

  /**
   * Not used. Retained for future use.
   */
  @visibility(Lifecycle.Read)
  family?: string;

  /**
   * Optional, integer. The unit count of the resource.
   * 1 for Free_F1/Standard_S1/Premium_P1, 100 for Premium_P2 by default.
   *
   * If present, following values are allowed:
   *     Free_F1: 1;
   *     Standard_S1: 1,2,3,4,5,6,7,8,9,10,20,30,40,50,60,70,80,90,100;
   *     Premium_P1:  1,2,3,4,5,6,7,8,9,10,20,30,40,50,60,70,80,90,100;
   *     Premium_P2:  100,200,300,400,500,600,700,800,900,1000;
   */
  capacity?: int32;
}

/**
 * A class that describes the properties of the resource
 */
#suppress "@azure-tools/typespec-azure-core/casing-style" "For backward compatibility"
model SignalRProperties {
  /**
   * Provisioning state of the resource.
   */
  @visibility(Lifecycle.Read)
  provisioningState?: ProvisioningState;

  /**
   * The publicly accessible IP of the resource.
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "For backward compatibility"
  @visibility(Lifecycle.Read)
  externalIP?: string;

  /**
   * FQDN of the service instance.
   */
  @visibility(Lifecycle.Read)
  hostName?: string;

  /**
   * The publicly accessible port of the resource which is designed for browser/client side usage.
   */
  @visibility(Lifecycle.Read)
  publicPort?: int32;

  /**
   * The publicly accessible port of the resource which is designed for customer server side usage.
   */
  @visibility(Lifecycle.Read)
  serverPort?: int32;

  /**
   * Version of the resource. Probably you need the same or higher version of client SDKs.
   */
  @visibility(Lifecycle.Read)
  version?: string;

  /**
   * Private endpoint connections to the resource.
   */
  @visibility(Lifecycle.Read)
  @OpenAPI.extension("x-ms-identifiers", #[])
  privateEndpointConnections?: PrivateEndpointConnection[];

  /**
   * The list of shared private link resources.
   */
  @visibility(Lifecycle.Read)
  @OpenAPI.extension("x-ms-identifiers", #[])
  sharedPrivateLinkResources?: SharedPrivateLinkResource[];

  /**
   * TLS settings for the resource
   */
  tls?: SignalRTlsSettings;

  /**
   * Deprecated.
   */
  @visibility(Lifecycle.Read)
  hostNamePrefix?: string;

  /**
   * List of the featureFlags.
   *
   * FeatureFlags that are not included in the parameters for the update operation will not be modified.
   * And the response will only include featureFlags that are explicitly set.
   * When a featureFlag is not explicitly set, its globally default value will be used
   * But keep in mind, the default value doesn't mean "false". It varies in terms of different FeatureFlags.
   */
  @OpenAPI.extension("x-ms-identifiers", #[])
  features?: SignalRFeature[];

  /**
   * Live trace configuration of a Microsoft.SignalRService resource.
   */
  liveTraceConfiguration?: LiveTraceConfiguration;

  /**
   * Resource log configuration of a Microsoft.SignalRService resource.
   */
  resourceLogConfiguration?: ResourceLogConfiguration;

  /**
   * Cross-Origin Resource Sharing (CORS) settings.
   */
  cors?: SignalRCorsSettings;

  /**
   * Serverless settings.
   */
  serverless?: ServerlessSettings;

  /**
   * The settings for the Upstream when the service is in server-less mode.
   */
  upstream?: ServerlessUpstreamSettings;

  /**
   * Network ACLs for the resource
   */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "For backward compatibility"
  networkACLs?: SignalRNetworkACLs;

  /**
   * Application firewall settings for the resource
   */
  applicationFirewall?: ApplicationFirewallSettings;

  /**
   * Enable or disable public network access. Default to "Enabled".
   * When it's Enabled, network ACLs still apply.
   * When it's Disabled, public network access is always disabled no matter what you set in network ACLs.
   */
  publicNetworkAccess?: string = "Enabled";

  /**
   * DisableLocalAuth
   * Enable or disable local auth with AccessKey
   * When set as true, connection with AccessKey=xxx won't work.
   */
  disableLocalAuth?: boolean = false;

  /**
   * DisableLocalAuth
   * Enable or disable aad auth
   * When set as true, connection with AuthType=aad won't work.
   */
  disableAadAuth?: boolean = false;

  /**
   * Enable or disable the regional endpoint. Default to "Enabled".
   * When it's Disabled, new connections will not be routed to this endpoint, however existing connections will not be affected.
   * This property is replica specific. Disable the regional endpoint without replica is not allowed.
   */
  regionEndpointEnabled?: string = "Enabled";

  /**
   * Stop or start the resource.  Default to "False".
   * When it's true, the data plane of the resource is shutdown.
   * When it's false, the data plane of the resource is started.
   */
  resourceStopped?: string = "false";

  /**
   * Route settings for the resource
   */
  routeSettings?: RouteSettings;
}

/**
 * Private endpoint connection properties
 */
model PrivateEndpointConnectionProperties {
  /**
   * Provisioning state of the resource.
   */
  @visibility(Lifecycle.Read)
  provisioningState?: ProvisioningState;

  /**
   * Private endpoint
   */
  privateEndpoint?: PrivateEndpoint;

  /**
   * Group IDs
   */
  @visibility(Lifecycle.Read)
  @OpenAPI.extension("x-ms-identifiers", #[])
  groupIds?: string[];

  /**
   * Connection state of the private endpoint connection
   */
  privateLinkServiceConnectionState?: PrivateLinkServiceConnectionState;
}

/**
 * Private endpoint
 */
model PrivateEndpoint {
  /**
   * Full qualified Id of the private endpoint
   */
  id?: string;
}

/**
 * Connection state of the private endpoint connection
 */
model PrivateLinkServiceConnectionState {
  /**
   * Indicates whether the connection has been Approved/Rejected/Removed by the owner of the service.
   */
  status?: PrivateLinkServiceConnectionStatus;

  /**
   * The reason for approval/rejection of the connection.
   */
  description?: string;

  /**
   * A message indicating if changes on the service provider require any updates on the consumer.
   */
  actionsRequired?: string;
}

/**
 * Describes the properties of an existing Shared Private Link Resource
 */
model SharedPrivateLinkResourceProperties {
  /**
   * The group id from the provider of resource the shared private link resource is for
   */
  groupId: string;

  /**
   * The resource id of the resource the shared private link resource is for
   */
  privateLinkResourceId: string;

  /**
   * Provisioning state of the resource.
   */
  @visibility(Lifecycle.Read)
  provisioningState?: ProvisioningState;

  /**
   * The request message for requesting approval of the shared private link resource
   */
  requestMessage?: string;

  /**
   * A list of FQDNs for third party private link service
   */
  @OpenAPI.extension("x-ms-identifiers", #[])
  fqdns?: string[];

  /**
   * Status of the shared private link resource
   */
  @visibility(Lifecycle.Read)
  status?: SharedPrivateLinkResourceStatus;
}

/**
 * TLS settings for the resource
 */
#suppress "@azure-tools/typespec-azure-core/casing-style" "For backward compatibility"
model SignalRTlsSettings {
  /**
   * Request client certificate during TLS handshake if enabled. Not supported for free tier. Any input will be ignored for free tier.
   */
  clientCertEnabled?: boolean = false;
}

/**
 * Feature of a resource, which controls the runtime behavior.
 */
#suppress "@azure-tools/typespec-azure-core/casing-style" "For backward compatibility"
model SignalRFeature {
  /**
   * FeatureFlags is the supported features of Azure SignalR service.
   * - ServiceMode: Flag for backend server for SignalR service. Values allowed: "Default": have your own backend server; "Serverless": your application doesn't have a backend server; "Classic": for backward compatibility. Support both Default and Serverless mode but not recommended; "PredefinedOnly": for future use.
   * - EnableConnectivityLogs: "true"/"false", to enable/disable the connectivity log category respectively.
   * - EnableMessagingLogs: "true"/"false", to enable/disable the connectivity log category respectively.
   * - EnableLiveTrace: Live Trace allows you to know what's happening inside Azure SignalR service, it will give you live traces in real time, it will be helpful when you developing your own Azure SignalR based web application or self-troubleshooting some issues. Please note that live traces are counted as outbound messages that will be charged. Values allowed: "true"/"false", to enable/disable live trace feature.
   */
  flag: FeatureFlags;

  /**
   * Value of the feature flag. See Azure SignalR service document https://docs.microsoft.com/azure/azure-signalr/ for allowed values.
   */
  @maxLength(128)
  @minLength(1)
  value: string;

  /**
   * Optional properties related to this feature.
   */
  #suppress "@azure-tools/typespec-azure-resource-manager/arm-no-record" "For backward compatibility"
  properties?: Record<string>;
}

/**
 * Live trace configuration of a Microsoft.SignalRService resource.
 */
model LiveTraceConfiguration {
  /**
   * Indicates whether or not enable live trace.
   * When it's set to true, live trace client can connect to the service.
   * Otherwise, live trace client can't connect to the service, so that you are unable to receive any log, no matter what you configure in "categories".
   * Available values: true, false.
   * Case insensitive.
   */
  enabled?: string = "false";

  /**
   * Gets or sets the list of category configurations.
   */
  @OpenAPI.extension("x-ms-identifiers", #["name"])
  categories?: LiveTraceCategory[];
}

/**
 * Live trace category configuration of a Microsoft.SignalRService resource.
 */
model LiveTraceCategory {
  /**
   * Gets or sets the live trace category's name.
   * Available values: ConnectivityLogs, MessagingLogs.
   * Case insensitive.
   */
  name?: string;

  /**
   * Indicates whether or the live trace category is enabled.
   * Available values: true, false.
   * Case insensitive.
   */
  enabled?: string;
}

/**
 * Resource log configuration of a Microsoft.SignalRService resource.
 */
model ResourceLogConfiguration {
  /**
   * Gets or sets the list of category configurations.
   */
  @OpenAPI.extension("x-ms-identifiers", #["name"])
  categories?: ResourceLogCategory[];
}

/**
 * Resource log category configuration of a Microsoft.SignalRService resource.
 */
model ResourceLogCategory {
  /**
   * Gets or sets the resource log category's name.
   * Available values: ConnectivityLogs, MessagingLogs.
   * Case insensitive.
   */
  name?: string;

  /**
   * Indicates whether or the resource log category is enabled.
   * Available values: true, false.
   * Case insensitive.
   */
  enabled?: string;
}

/**
 * Cross-Origin Resource Sharing (CORS) settings.
 */
#suppress "@azure-tools/typespec-azure-core/casing-style" "For backward compatibility"
model SignalRCorsSettings {
  /**
   * Gets or sets the list of origins that should be allowed to make cross-origin calls (for example: http://example.com:12345). Use "*" to allow all. If omitted, allow all by default.
   */
  @OpenAPI.extension("x-ms-identifiers", #[])
  allowedOrigins?: string[];
}

/**
 * Serverless settings.
 */
model ServerlessSettings {
  /**
   * Gets or sets Client Connection Timeout. Optional to be set.
   * Value in seconds.
   * Default value is 30 seconds.
   * Customer should set the timeout to a shorter period if messages are expected to be sent in shorter intervals,
   * and want the client to disconnect more quickly after the last message is sent.
   * You can set the timeout to a longer period if messages are expected to be sent in longer intervals,
   * and they want to keep the same client connection alive during this session.
   * The service considers the client disconnected if it hasn't received a message (including keep-alive) in this interval.
   */
  @maxValue(120)
  @minValue(1)
  connectionTimeoutInSeconds?: int32 = 30;

  /**
   * Gets or sets the Keep-Alive Interval. Optional to set.
   * Value is in seconds.
   * The default value is 15 seconds.
   * Customers should set this value to a shorter period if they want the service to send keep-alive messages more frequently,
   * ensuring timely checks of the connection status.
   * Conversely, customers can set this value to a longer period if they want the service to send keep-alive messages less frequently,
   * reducing network traffic, but note that it may take longer to detect a disconnection.
   * This interval ensures that the connection is maintained by sending periodic keep-alive messages to the client.
   */
  @maxValue(120)
  @minValue(1)
  keepAliveIntervalInSeconds?: int32;
}

/**
 * The settings for the Upstream when the service is in server-less mode.
 */
model ServerlessUpstreamSettings {
  /**
   * Gets or sets the list of Upstream URL templates. Order matters, and the first matching template takes effects.
   */
  @OpenAPI.extension("x-ms-identifiers", #[])
  templates?: UpstreamTemplate[];
}

/**
 * Upstream template item settings. It defines the Upstream URL of the incoming requests.
 * The template defines the pattern of the event, the hub or the category of the incoming request that matches current URL template.
 */
model UpstreamTemplate {
  /**
   * Gets or sets the matching pattern for hub names. If not set, it matches any hub.
   * There are 3 kind of patterns supported:
   *     1. "*", it to matches any hub name.
   *     2. Combine multiple hubs with ",", for example "hub1,hub2", it matches "hub1" and "hub2".
   *     3. The single hub name, for example, "hub1", it matches "hub1".
   */
  hubPattern?: string;

  /**
   * Gets or sets the matching pattern for event names. If not set, it matches any event.
   * There are 3 kind of patterns supported:
   *     1. "*", it to matches any event name.
   *     2. Combine multiple events with ",", for example "connect,disconnect", it matches event "connect" and "disconnect".
   *     3. The single event name, for example, "connect", it matches "connect".
   */
  eventPattern?: string;

  /**
   * Gets or sets the matching pattern for category names. If not set, it matches any category.
   * There are 3 kind of patterns supported:
   *     1. "*", it to matches any category name.
   *     2. Combine multiple categories with ",", for example "connections,messages", it matches category "connections" and "messages".
   *     3. The single category name, for example, "connections", it matches the category "connections".
   */
  categoryPattern?: string;

  /**
   * Gets or sets the Upstream URL template. You can use 3 predefined parameters {hub}, {category} {event} inside the template, the value of the Upstream URL is dynamically calculated when the client request comes in.
   * For example, if the urlTemplate is `http://example.com/{hub}/api/{event}`, with a client request from hub `chat` connects, it will first POST to this URL: `http://example.com/chat/api/connect`.
   */
  urlTemplate: string;

  /**
   * Upstream auth settings. If not set, no auth is used for upstream messages.
   */
  auth?: UpstreamAuthSettings;
}

/**
 * Upstream auth settings. If not set, no auth is used for upstream messages.
 */
model UpstreamAuthSettings {
  /**
   * Upstream auth type enum.
   */
  type?: UpstreamAuthType;

  /**
   * Managed identity settings for upstream.
   */
  managedIdentity?: ManagedIdentitySettings;
}

/**
 * Managed identity settings for upstream.
 */
model ManagedIdentitySettings {
  /**
   * The Resource indicating the App ID URI of the target resource.
   * It also appears in the aud (audience) claim of the issued token.
   */
  resource?: string;
}

/**
 * Network ACLs for the resource
 */
#suppress "@azure-tools/typespec-azure-core/casing-style" "For backward compatibility"
model SignalRNetworkACLs {
  /**
   * Azure Networking ACL Action.
   */
  defaultAction?: ACLAction;

  /**
   * Network ACL
   */
  publicNetwork?: NetworkACL;

  /**
   * ACLs for requests from private endpoints
   */
  @OpenAPI.extension("x-ms-identifiers", #["name"])
  privateEndpoints?: PrivateEndpointACL[];

  /**
   * IP rules for filtering public traffic
   */
  @OpenAPI.extension("x-ms-identifiers", #[])
  @maxItems(30)
  ipRules?: IPRule[];
}

/**
 * Network ACL
 */
#suppress "@azure-tools/typespec-azure-core/casing-style" "For backward compatibility"
model NetworkACL {
  /**
   * Allowed request types. The value can be one or more of: ClientConnection, ServerConnection, RESTAPI.
   */
  @OpenAPI.extension("x-ms-identifiers", #[])
  allow?: SignalRRequestType[];

  /**
   * Denied request types. The value can be one or more of: ClientConnection, ServerConnection, RESTAPI.
   */
  @OpenAPI.extension("x-ms-identifiers", #[])
  deny?: SignalRRequestType[];
}

/**
 * ACL for a private endpoint
 */
#suppress "@azure-tools/typespec-azure-core/composition-over-inheritance" "For backward compatibility"
#suppress "@azure-tools/typespec-azure-core/casing-style" "For backward compatibility"
model PrivateEndpointACL extends NetworkACL {
  /**
   * Name of the private endpoint connection
   */
  name: string;
}

/**
 * An IP rule
 */
model IPRule {
  /**
   * An IP or CIDR or ServiceTag
   */
  value?: string;

  /**
   * Azure Networking ACL Action.
   */
  action?: ACLAction;
}

/**
 * Application firewall settings for the resource
 */
model ApplicationFirewallSettings {
  /**
   * Rules to control the client connection count
   */
  @OpenAPI.extension("x-ms-identifiers", #[])
  @maxItems(10)
  clientConnectionCountRules?: ClientConnectionCountRule[];

  /**
   * Rules to control the client traffic
   */
  @OpenAPI.extension("x-ms-identifiers", #[])
  @maxItems(10)
  clientTrafficControlRules?: ClientTrafficControlRule[];

  /**
   * Config to control the client connection lifetime in seconds, can be set to 0 to disable the config
   */
  @maxValue(604800)
  @minValue(0)
  maxClientConnectionLifetimeInSeconds?: int64;
}

/**
 * A base class for client connection count rules
 */
@discriminator("type")
model ClientConnectionCountRule {
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  type: ClientConnectionCountRuleDiscriminator;
}

/**
 * A base class for client traffic control rules
 */
@discriminator("type")
model ClientTrafficControlRule {
  #suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
  type: ClientTrafficControlRuleDiscriminator;
}

/**
 * Route settings for the resource
 */
model RouteSettings {
  /**
   * Gets or sets the server balance weight.
   * A higher value means a greater balance of client connections across different app server instances.
   * A value of 0 distributes connections randomly, while a value of 255 ensures maximum balancing.
   * The default value is 255.
   * Recommended ```255``` for multiple app servers in same size.
   */
  @maxValue(255)
  @minValue(0)
  serverBalanceWeight?: int32;

  /**
   * Gets or sets the connection balance weight.
   * A higher value means a greater balance of client connections across different server connections.
   * A value of 0 distributes connections randomly, while a value of 255 ensures maximum balancing.
   * The default value is 255.
   * Recommended ```255``` for all of the cases.
   */
  @maxValue(255)
  @minValue(0)
  connectionBalanceWeight?: int32;

  /**
   * Gets or sets the weight for latency-based routing.
   * A higher value increases the influence of latency-based routing.
   * A value of 0 disables latency-based routing entirely, while a value of 255 enables it fully.
   * The default value is 0.
   * Recommended ```255``` for replicas or app servers in different regions for disaster recovery.
   */
  @maxValue(255)
  @minValue(0)
  latencyWeight?: int32;
}

/**
 * A class represent managed identities used for request and response
 */
model ManagedIdentity {
  /**
   * Represents the identity type: systemAssigned, userAssigned, None
   */
  type?: ManagedIdentityType;

  /**
   * Get or set the user assigned identities
   */
  #suppress "@azure-tools/typespec-azure-resource-manager/arm-no-record" "For backward compatibility"
  userAssignedIdentities?: Record<UserAssignedIdentityProperty>;

  /**
   * Get the principal id for the system assigned identity.
   * Only be used in response.
   */
  @visibility(Lifecycle.Read)
  principalId?: string;

  /**
   * Get the tenant id for the system assigned identity.
   * Only be used in response
   */
  @visibility(Lifecycle.Read)
  tenantId?: string;
}

/**
 * Properties of user assigned identity.
 */
model UserAssignedIdentityProperty {
  /**
   * Get the principal id for the user assigned identity
   */
  @visibility(Lifecycle.Read)
  principalId?: string;

  /**
   * Get the client id for the user assigned identity
   */
  @visibility(Lifecycle.Read)
  clientId?: string;
}

/**
 * Custom certificates list.
 */
model CustomCertificateList is Azure.Core.Page<CustomCertificate>;

/**
 * Custom certificate properties.
 */
model CustomCertificateProperties {
  /**
   * Provisioning state of the resource.
   */
  @visibility(Lifecycle.Read)
  provisioningState?: ProvisioningState;

  /**
   * Base uri of the KeyVault that stores certificate.
   */
  @visibility(Lifecycle.Read, Lifecycle.Create)
  keyVaultBaseUri: string;

  /**
   * Certificate secret name.
   */
  @visibility(Lifecycle.Read, Lifecycle.Create)
  keyVaultSecretName: string;

  /**
   * Certificate secret version.
   */
  @visibility(Lifecycle.Read, Lifecycle.Create)
  keyVaultSecretVersion?: string;
}

/**
 * Custom domains list
 */
model CustomDomainList is Azure.Core.Page<CustomDomain>;

/**
 * Properties of a custom domain.
 */
model CustomDomainProperties {
  /**
   * Provisioning state of the resource.
   */
  @visibility(Lifecycle.Read)
  provisioningState?: ProvisioningState;

  /**
   * The custom domain name.
   */
  domainName: string;

  /**
   * Reference to a resource.
   */
  customCertificate: ResourceReference;
}

/**
 * Reference to a resource.
 */
model ResourceReference {
  /**
   * Resource ID.
   */
  id?: string;
}

/**
 * A class represents the access keys of the resource.
 */
#suppress "@azure-tools/typespec-azure-core/casing-style" "For backward compatibility"
model SignalRKeys {
  /**
   * The primary access key.
   */
  @secret
  primaryKey?: string;

  /**
   * The secondary access key.
   */
  @secret
  secondaryKey?: string;

  /**
   * Connection string constructed via the primaryKey
   */
  @secret
  primaryConnectionString?: string;

  /**
   * Connection string constructed via the secondaryKey
   */
  @secret
  secondaryConnectionString?: string;
}

/**
 * A list of private endpoint connections
 */
model PrivateEndpointConnectionList is Azure.Core.Page<PrivateEndpointConnection>;

/**
 * Contains a list of PrivateLinkResource and a possible link to query more results
 */
model PrivateLinkResourceList is Azure.Core.Page<PrivateLinkResource>;

/**
 * Private link resource
 */
#suppress "@azure-tools/typespec-azure-core/composition-over-inheritance" "For backward compatibility"
model PrivateLinkResource extends Azure.ResourceManager.CommonTypes.ProxyResource {
  /**
   * Private link resource properties
   */
  #suppress "@azure-tools/typespec-azure-core/no-private-usage" "For backward compatibility"
  @Azure.ResourceManager.Private.conditionalClientFlatten
  properties?: PrivateLinkResourceProperties;
}

/**
 * Private link resource properties
 */
model PrivateLinkResourceProperties {
  /**
   * Group Id of the private link resource
   */
  groupId?: string;

  /**
   * Required members of the private link resource
   */
  @OpenAPI.extension("x-ms-identifiers", #[])
  requiredMembers?: string[];

  /**
   * Required private DNS zone names
   */
  @OpenAPI.extension("x-ms-identifiers", #[])
  requiredZoneNames?: string[];

  /**
   * The list of resources that are onboarded to private link service
   */
  @OpenAPI.extension("x-ms-identifiers", #[])
  shareablePrivateLinkResourceTypes?: ShareablePrivateLinkResourceType[];
}

/**
 * Describes a  resource type that has been onboarded to private link service
 */
model ShareablePrivateLinkResourceType {
  /**
   * The name of the resource type that has been onboarded to private link service
   */
  name?: string;

  /**
   * Describes the properties of a resource type that has been onboarded to private link service
   */
  properties?: ShareablePrivateLinkResourceProperties;
}

/**
 * Describes the properties of a resource type that has been onboarded to private link service
 */
model ShareablePrivateLinkResourceProperties {
  /**
   * The description of the resource type that has been onboarded to private link service
   */
  description?: string;

  /**
   * The resource provider group id for the resource that has been onboarded to private link service
   */
  groupId?: string;

  /**
   * The resource provider type for the resource that has been onboarded to private link service
   */
  type?: string;
}

/**
 * Parameters describes the request to regenerate access keys
 */
model RegenerateKeyParameters {
  /**
   * The type of access key.
   */
  keyType?: KeyType;
}

#suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
model ReplicaList is Azure.Core.Page<Replica>;

#suppress "@azure-tools/typespec-azure-core/documentation-required" "For backward compatibility"
model ReplicaProperties {
  /**
   * Provisioning state of the resource.
   */
  @visibility(Lifecycle.Read)
  provisioningState?: ProvisioningState;

  /**
   * Enable or disable the regional endpoint. Default to "Enabled".
   * When it's Disabled, new connections will not be routed to this endpoint, however existing connections will not be affected.
   */
  regionEndpointEnabled?: string = "Enabled";

  /**
   * Stop or start the resource.  Default to "false".
   * When it's true, the data plane of the resource is shutdown.
   * When it's false, the data plane of the resource is started.
   */
  resourceStopped?: string = "false";
}

/**
 * A list of shared private link resources
 */
model SharedPrivateLinkResourceList is Azure.Core.Page<SharedPrivateLinkResource>;

/**
 * The list skus operation response
 */
model SkuList {
  /**
   * The list of skus available for the resource.
   */
  @visibility(Lifecycle.Read)
  @OpenAPI.extension("x-ms-identifiers", #["resourceType", "/sku/name", "/sku/tier"])
  value?: Sku[];

  /**
   * The URL the client should use to fetch the next page (per server side paging).
   * It's null for now, added for future use.
   */
  @visibility(Lifecycle.Read)
  nextLink?: string;
}

/**
 * Describes an available sku."
 */
model Sku {
  /**
   * The resource type that this object applies to
   */
  @visibility(Lifecycle.Read)
  resourceType?: string;

  /**
   * The billing information of the resource.
   */
  #suppress "@azure-tools/typespec-client-generator-core/property-name-conflict" "For backward compatibility"
  @visibility(Lifecycle.Read)
  sku?: ResourceSku;

  /**
   * Describes scaling information of a sku.
   */
  @visibility(Lifecycle.Read)
  capacity?: SkuCapacity;
}

/**
 * Describes scaling information of a sku.
 */
model SkuCapacity {
  /**
   * The lowest permitted capacity for this resource
   */
  @visibility(Lifecycle.Read)
  minimum?: int32;

  /**
   * The highest permitted capacity for this resource
   */
  @visibility(Lifecycle.Read)
  maximum?: int32;

  /**
   * The default capacity.
   */
  @visibility(Lifecycle.Read)
  default?: int32;

  /**
   * Allows capacity value list.
   */
  @visibility(Lifecycle.Read)
  @OpenAPI.extension("x-ms-identifiers", #[])
  allowedValues?: int32[];

  /**
   * The scale type applicable to the sku.
   */
  @visibility(Lifecycle.Read)
  scaleType?: ScaleType;
}

/**
 * Throttle the client connection by a custom JWT claim
 */
model ThrottleByJwtCustomClaimRule extends ClientConnectionCountRule {
  /**
   * The name of the claim in the JWT token. The client connection with the same claim value will be aggregated. If the claim is not found in the token, the connection will be allowed.
   */
  claimName: string;

  /**
   * Maximum connection count allowed for the same Jwt claim value. Clients with the same Jwt claim will get rejected if the connection count exceeds this value. Default value is 20.
   */
  @maxValue(2147483647)
  @minValue(0)
  maxCount?: int32 = 20;

  type: "ThrottleByJwtCustomClaimRule";
}

/**
 * Throttle the client connection by the JWT signature
 */
model ThrottleByJwtSignatureRule extends ClientConnectionCountRule {
  /**
   * Maximum connection count allowed for the same JWT signature. Clients with the same JWT signature will get rejected if the connection count exceeds this value. Default value is 20.
   */
  @maxValue(2147483647)
  @minValue(0)
  maxCount?: int32 = 20;

  type: "ThrottleByJwtSignatureRule";
}

/**
 * Throttle the client connection by the user ID
 */
model ThrottleByUserIdRule extends ClientConnectionCountRule {
  /**
   * Maximum connection count allowed for the same user ID. Clients with the same user ID will get rejected if the connection count exceeds this value. Default value is 20.
   */
  @maxValue(2147483647)
  @minValue(0)
  maxCount?: int32 = 20;

  type: "ThrottleByUserIdRule";
}

/**
 * Throttle the client traffic by a custom JWT claim
 */
model TrafficThrottleByJwtCustomClaimRule extends ClientTrafficControlRule {
  /**
   * The name of the claim in the JWT token. The message bytes with the same claim value will be aggregated. If the claim is not found in the token, the rule will be skipped.
   */
  claimName: string;

  /**
   * Maximum accumulated inbound message bytes allowed for the same JWT signature within a time window. Clients with the same JWT claim will get disconnected if the message bytes exceeds this value. Default value is 1GB.
   */
  @minValue(0)
  maxInboundMessageBytes?: int64;

  /**
   * The aggregation window for the message bytes. The message bytes will be aggregated in this window and be reset after the window. Default value is 60 seconds.
   */
  @maxValue(3600)
  @minValue(10)
  aggregationWindowInSeconds?: int32 = 60;

  type: "TrafficThrottleByJwtCustomClaimRule";
}

/**
 * Throttle the client traffic by the JWT signature
 */
model TrafficThrottleByJwtSignatureRule extends ClientTrafficControlRule {
  /**
   * Maximum accumulated inbound message bytes allowed for the same JWT signature within a time window. Clients with the same JWT signature will get disconnected if the message bytes exceeds this value. Default value is 1GB.
   */
  @minValue(0)
  maxInboundMessageBytes?: int64;

  /**
   * The aggregation window for the message bytes. The message bytes will be aggregated in this window and be reset after the window. Default value is 60 seconds.
   */
  @maxValue(3600)
  @minValue(10)
  aggregationWindowInSeconds?: int32 = 60;

  type: "TrafficThrottleByJwtSignatureRule";
}

/**
 * Throttle the client traffic by the user ID
 */
model TrafficThrottleByUserIdRule extends ClientTrafficControlRule {
  /**
   * Maximum accumulated inbound message bytes allowed for the same user ID within a time window. Clients with the same user ID will get disconnected if the message bytes exceeds this value. Default value is 1GB.
   */
  @minValue(0)
  maxInboundMessageBytes?: int64;

  /**
   * The aggregation window for the message bytes. The message bytes will be aggregated in this window and be reset after the window. Default value is 60 seconds.
   */
  @maxValue(3600)
  @minValue(10)
  aggregationWindowInSeconds?: int32 = 60;

  type: "TrafficThrottleByUserIdRule";
}

/**
 * A list of REST API operations supported by an Azure Resource Provider. It contains an URL link to get the next set of results.
 */
model OperationList is Azure.Core.Page<Operation>;
