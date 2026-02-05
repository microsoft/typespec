import "@typespec/rest";
import "@typespec/http";
import "@typespec/xml";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-client-generator-core";

using Azure.Core;
using TypeSpec.Http;
using TypeSpec.Versioning;
using Azure.ClientGenerator.Core;

namespace Storage.Blob;

@encode(BytesKnownEncoding.base64)
scalar base64Bytes extends bytes;

/** The error response. */
@error
@mediaTypeHint("application/xml")
model StorageError {
  /** The error code. */
  @header("x-ms-error-code")
  errorCode?: StorageErrorCode;

  /** The error code for the copy source. */
  @header("x-ms-copy-source-error-code")
  xMsCopySourceErrorCode?: string;

  /** The status code for the copy source. */
  @header("x-ms-copy-source-status-code")
  xMsCopySourceStatusCode?: int32;

  /** The error code. */
  @Xml.name("Code") code?: string;

  /** The error message. */
  @Xml.name("Message") message?: string;

  /** Copy source status code */
  @Xml.name("CopySourceStatusCode") copySourceStatusCode?: int32;

  /** Copy source error code */
  @Xml.name("CopySourceErrorCode") copySourceErrorCode?: string;

  /** Copy source error message */
  @Xml.name("CopySourceErrorMessage") copySourceErrorMessage?: string;
}

/** Error codes returned by the Azure Blob Storage service. */
#suppress "@azure-tools/typespec-azure-core/no-enum" "Existing API"
union StorageErrorCode {
  /** Account already exists. */
  AccountAlreadyExists: "AccountAlreadyExists",

  /** Account is being created. */
  AccountBeingCreated: "AccountBeingCreated",

  /** Account is disabled. */
  AccountIsDisabled: "AccountIsDisabled",

  /** Authentication failed. */
  AuthenticationFailed: "AuthenticationFailed",

  /** Authorization failure. */
  AuthorizationFailure: "AuthorizationFailure",

  /** Condition headers not supported. */
  ConditionHeadersNotSupported: "ConditionHeadersNotSupported",

  /** Condition not met. */
  ConditionNotMet: "ConditionNotMet",

  /** Empty metadata key. */
  EmptyMetadataKey: "EmptyMetadataKey",

  /** Insufficient account permissions. */
  InsufficientAccountPermissions: "InsufficientAccountPermissions",

  /** Internal error. */
  InternalError: "InternalError",

  /** Invalid authentication information. */
  InvalidAuthenticationInfo: "InvalidAuthenticationInfo",

  /** Invalid header value. */
  InvalidHeaderValue: "InvalidHeaderValue",

  /** Invalid HTTP verb. */
  InvalidHttpVerb: "InvalidHttpVerb",

  /** Invalid input. */
  InvalidInput: "InvalidInput",

  /** Invalid MD5. */
  InvalidMd5: "InvalidMd5",

  /** Invalid metadata. */
  InvalidMetadata: "InvalidMetadata",

  /** Invalid query parameter value. */
  InvalidQueryParameterValue: "InvalidQueryParameterValue",

  /** Invalid range. */
  InvalidRange: "InvalidRange",

  /** Invalid request URL. */
  InvalidRequestUrl: "InvalidRequestUrl",

  /** Invalid URI. */
  InvalidUri: "InvalidUri",

  /** Invalid XML document. */
  InvalidXmlDocument: "InvalidXmlDocument",

  /** Invalid XML node value. */
  InvalidXmlNodeValue: "InvalidXmlNodeValue",

  /** MD5 mismatch. */
  Md5Mismatch: "Md5Mismatch",

  /** Metadata too large. */
  MetadataTooLarge: "MetadataTooLarge",

  /** Missing content length header. */
  MissingContentLengthHeader: "MissingContentLengthHeader",

  /** Missing required XML node. */
  MissingRequiredXmlNode: "MissingRequiredXmlNode",

  /** Missing required header. */
  MissingRequiredHeader: "MissingRequiredHeader",

  /** Missing required query parameter. */
  MissingRequiredQueryParameter: "MissingRequiredQueryParameter",

  /** Multiple condition headers not supported. */
  MultipleConditionHeadersNotSupported: "MultipleConditionHeadersNotSupported",

  /** Operation timed out. */
  OperationTimedOut: "OperationTimedOut",

  /** Out of range input. */
  OutOfRangeInput: "OutOfRangeInput",

  /** Out of range query parameter value. */
  OutOfRangeQueryParameterValue: "OutOfRangeQueryParameterValue",

  /** Request body too large. */
  RequestBodyTooLarge: "RequestBodyTooLarge",

  /** Resource type mismatch. */
  ResourceTypeMismatch: "ResourceTypeMismatch",

  /** Request URL failed to parse. */
  RequestUrlFailedToParse: "RequestUrlFailedToParse",

  /** Resource already exists. */
  ResourceAlreadyExists: "ResourceAlreadyExists",

  /** Resource not found. */
  ResourceNotFound: "ResourceNotFound",

  /** Server busy. */
  ServerBusy: "ServerBusy",

  /** Unsupported header. */
  UnsupportedHeader: "UnsupportedHeader",

  /** Unsupported XML node. */
  UnsupportedXmlNode: "UnsupportedXmlNode",

  /** Unsupported query parameter. */
  UnsupportedQueryParameter: "UnsupportedQueryParameter",

  /** Unsupported HTTP verb. */
  UnsupportedHttpVerb: "UnsupportedHttpVerb",

  /** Append position condition not met. */
  AppendPositionConditionNotMet: "AppendPositionConditionNotMet",

  /** Blob already exists. */
  BlobAlreadyExists: "BlobAlreadyExists",

  /** Blob is immutable due to policy. */
  BlobImmutableDueToPolicy: "BlobImmutableDueToPolicy",

  /** Blob not found. */
  BlobNotFound: "BlobNotFound",

  /** Blob overwritten. */
  BlobOverwritten: "BlobOverwritten",

  /** Blob tier inadequate for content length. */
  BlobTierInadequateForContentLength: "BlobTierInadequateForContentLength",

  /** Blob uses customer specified encryption. */
  BlobUsesCustomerSpecifiedEncryption: "BlobUsesCustomerSpecifiedEncryption",

  /** Block count exceeds limit. */
  BlockCountExceedsLimit: "BlockCountExceedsLimit",

  /** Block list too long. */
  BlockListTooLong: "BlockListTooLong",

  /** Cannot change to lower tier. */
  CannotChangeToLowerTier: "CannotChangeToLowerTier",

  /** Cannot verify copy source. */
  CannotVerifyCopySource: "CannotVerifyCopySource",

  /** Container already exists. */
  ContainerAlreadyExists: "ContainerAlreadyExists",

  /** Container being deleted. */
  ContainerBeingDeleted: "ContainerBeingDeleted",

  /** Container disabled. */
  ContainerDisabled: "ContainerDisabled",

  /** Container not found. */
  ContainerNotFound: "ContainerNotFound",

  /** Content length larger than tier limit. */
  ContentLengthLargerThanTierLimit: "ContentLengthLargerThanTierLimit",

  /** Copy across accounts not supported. */
  CopyAcrossAccountsNotSupported: "CopyAcrossAccountsNotSupported",

  /** Copy ID mismatch. */
  CopyIdMismatch: "CopyIdMismatch",

  /** Feature version mismatch. */
  FeatureVersionMismatch: "FeatureVersionMismatch",

  /** Incremental copy blob mismatch. */
  IncrementalCopyBlobMismatch: "IncrementalCopyBlobMismatch",

  /** Incremental copy of earlier version snapshot not allowed. */
  IncrementalCopyOfEarlierVersionSnapshotNotAllowed: "IncrementalCopyOfEarlierVersionSnapshotNotAllowed",

  /** Incremental copy source must be snapshot. */
  IncrementalCopySourceMustBeSnapshot: "IncrementalCopySourceMustBeSnapshot",

  /** Infinite lease duration required. */
  InfiniteLeaseDurationRequired: "InfiniteLeaseDurationRequired",

  /** Invalid blob or block. */
  InvalidBlobOrBlock: "InvalidBlobOrBlock",

  /** Invalid blob tier. */
  InvalidBlobTier: "InvalidBlobTier",

  /** Invalid blob type. */
  InvalidBlobType: "InvalidBlobType",

  /** Invalid block ID. */
  InvalidBlockId: "InvalidBlockId",

  /** Invalid block list. */
  InvalidBlockList: "InvalidBlockList",

  /** Invalid operation. */
  InvalidOperation: "InvalidOperation",

  /** Invalid page range. */
  InvalidPageRange: "InvalidPageRange",

  /** Invalid source blob type. */
  InvalidSourceBlobType: "InvalidSourceBlobType",

  /** Invalid source blob URL. */
  InvalidSourceBlobUrl: "InvalidSourceBlobUrl",

  /** Invalid version for page blob operation. */
  InvalidVersionForPageBlobOperation: "InvalidVersionForPageBlobOperation",

  /** Lease already present. */
  LeaseAlreadyPresent: "LeaseAlreadyPresent",

  /** Lease already broken. */
  LeaseAlreadyBroken: "LeaseAlreadyBroken",

  /** Lease ID mismatch with blob operation. */
  LeaseIdMismatchWithBlobOperation: "LeaseIdMismatchWithBlobOperation",

  /** Lease ID mismatch with container operation. */
  LeaseIdMismatchWithContainerOperation: "LeaseIdMismatchWithContainerOperation",

  /** Lease ID mismatch with lease operation. */
  LeaseIdMismatchWithLeaseOperation: "LeaseIdMismatchWithLeaseOperation",

  /** Lease ID missing. */
  LeaseIdMissing: "LeaseIdMissing",

  /** Lease is breaking and cannot be acquired. */
  LeaseIsBreakingAndCannotBeAcquired: "LeaseIsBreakingAndCannotBeAcquired",

  /** Lease is breaking and cannot be changed. */
  LeaseIsBreakingAndCannotBeChanged: "LeaseIsBreakingAndCannotBeChanged",

  /** Lease is broken and cannot be renewed. */
  LeaseIsBrokenAndCannotBeRenewed: "LeaseIsBrokenAndCannotBeRenewed",

  /** Lease lost. */
  LeaseLost: "LeaseLost",

  /** Lease not present with blob operation. */
  LeaseNotPresentWithBlobOperation: "LeaseNotPresentWithBlobOperation",

  /** Lease not present with container operation. */
  LeaseNotPresentWithContainerOperation: "LeaseNotPresentWithContainerOperation",

  /** Lease not present with lease operation. */
  LeaseNotPresentWithLeaseOperation: "LeaseNotPresentWithLeaseOperation",

  /** Maximum blob size condition not met. */
  MaxBlobSizeConditionNotMet: "MaxBlobSizeConditionNotMet",

  /** No pending copy operation. */
  NoPendingCopyOperation: "NoPendingCopyOperation",

  /** Operation not allowed on incremental copy blob. */
  OperationNotAllowedOnIncrementalCopyBlob: "OperationNotAllowedOnIncrementalCopyBlob",

  /** Pending copy operation. */
  PendingCopyOperation: "PendingCopyOperation",

  /** Previous snapshot not found. */
  PreviousSnapshotNotFound: "PreviousSnapshotNotFound",

  /** Previous snapshot operation not supported. */
  PreviousSnapshotOperationNotSupported: "PreviousSnapshotOperationNotSupported",

  /** Previous snapshot cannot be newer. */
  PreviousSnapshotCannotBeNewer: "PreviousSnapshotCannotBeNewer",

  /** Sequence number condition not met. */
  SequenceNumberConditionNotMet: "SequenceNumberConditionNotMet",

  /** Sequence number increment too large. */
  SequenceNumberIncrementTooLarge: "SequenceNumberIncrementTooLarge",

  /** Snapshot count exceeded. */
  SnapshotCountExceeded: "SnapshotCountExceeded",

  /** Snapshot operation rate exceeded. */
  SnapshotOperationRateExceeded: "SnapshotOperationRateExceeded",

  /** Snapshots present. */
  SnapshotsPresent: "SnapshotsPresent",

  /** Source condition not met. */
  SourceConditionNotMet: "SourceConditionNotMet",

  /** System in use. */
  SystemInUse: "SystemInUse",

  /** Target condition not met. */
  TargetConditionNotMet: "TargetConditionNotMet",

  /** Unauthorized blob overwrite. */
  UnauthorizedBlobOverwrite: "UnauthorizedBlobOverwrite",

  /** Blob being rehydrated. */
  BlobBeingRehydrated: "BlobBeingRehydrated",

  /** Blob archived. */
  BlobArchived: "BlobArchived",

  /** Blob not archived. */
  BlobNotArchived: "BlobNotArchived",

  /** Authorization source IP mismatch. */
  AuthorizationSourceIPMismatch: "AuthorizationSourceIPMismatch",

  /** Authorization protocol mismatch. */
  AuthorizationProtocolMismatch: "AuthorizationProtocolMismatch",

  /** Authorization permission mismatch. */
  AuthorizationPermissionMismatch: "AuthorizationPermissionMismatch",

  /** Authorization service mismatch. */
  AuthorizationServiceMismatch: "AuthorizationServiceMismatch",

  /** Authorization resource type mismatch. */
  AuthorizationResourceTypeMismatch: "AuthorizationResourceTypeMismatch",

  /** Blob access tier not supported for account type. */
  BlobAccessTierNotSupportedForAccountType: "BlobAccessTierNotSupportedForAccountType",

  /** Extensible */
  string,
}

/// Models

/** Represents a single block in a block blob. It describes the block's ID and size. */
model Block {
  /** The base64 encoded block ID. */
  @Xml.name("Name")
  name: base64Bytes;

  /** The block size in bytes. */
  @Xml.name("Size")
  size: int64;
}

/** Contains the committed and uncommitted blocks in a block blob. */
model BlockList {
  /** The list of committed blocks. */
  @Xml.name("CommittedBlocks")
  committedBlocks?: Block[];

  /** The list of uncommitted blocks. */
  @Xml.name("UncommittedBlocks")
  uncommittedBlocks?: Block[];
}

/** The Block lookup list. */
@Xml.name("BlockList")
model BlockLookupList {
  /** The committed blocks */
  @Xml.unwrapped
  @Xml.name("Committed")
  committed?: base64Bytes[];

  /** The uncommitted blocks */
  @Xml.unwrapped
  @Xml.name("Uncommitted")
  uncommitted?: base64Bytes[];

  /** The latest blocks */
  @Xml.unwrapped
  @Xml.name("Latest")
  latest?: base64Bytes[];
}

/** Represents an array of signed identifiers */
model SignedIdentifiers {
  /** The array of signed identifiers. */
  @Xml.unwrapped
  @Xml.name("SignedIdentifier")
  items: Array<SignedIdentifier>;
}

/** The signed identifier. */
@Xml.name("SignedIdentifier")
model SignedIdentifier {
  /** The unique ID for the signed identifier. */
  @Xml.name("Id") id: string;

  /** The access policy for the signed identifier. */
  @Xml.name("AccessPolicy") accessPolicy: AccessPolicy;
}

/** The result of a Filter Blobs API call */
@Xml.name("EnumerationResults")
model FilterBlobSegment {
  /** The service endpoint. */
  @Xml.attribute
  @Xml.name("ServiceEndpoint")
  serviceEndpoint: string;

  /** The filter for the blobs. */
  @Xml.name("Where") where: string;

  /** The blob segment. */
  @Xml.name("Blobs") blobs: FilterBlobItem[];

  /** The next marker of the blobs. */
  @Xml.name("NextMarker")
  nextMarker?: string;
}

/** The filter blob item. */
@Xml.name("Blob")
model FilterBlobItem {
  /** The name of the blob. */
  @Xml.name("Name") name: string;

  /** The properties of the blob. */
  @Xml.name("ContainerName") containerName: string;

  /** The metadata of the blob. */
  @Xml.unwrapped tags?: BlobTags;

  /** The version ID of the blob. */
  @Xml.name("VersionId") versionId?: string;

  /** Whether it is the current version of the blob */
  @Xml.name("IsCurrentVersion") isCurrentVersion?: boolean;
}

/** Include this parameter to specify that the container's metadata be returned as part of the response body. */
#suppress "@azure-tools/typespec-azure-core/no-enum" "Existing API"
enum ListContainersIncludeType {
  /** Include metadata */
  metadata: "metadata",

  /** Include deleted */
  deleted: "deleted",

  /** Include system */
  system: "system",
}

/** The filter blobs includes. */
#suppress "@azure-tools/typespec-azure-core/no-enum" "Existing API"
enum FilterBlobsIncludeItem {
  /** The filter includes no versions. */
  None: "none",

  /** The filter includes n versions. */
  Versions: "versions",
}

/** The account kind. */
#suppress "@azure-tools/typespec-azure-core/no-enum" "Existing API"
enum AccountKind {
  /** The storage account is a general-purpose account. */
  Storage: "Storage",

  /** The storage account is a blob storage account. */
  BlobStorage: "BlobStorage",

  /** The storage account is a storage V2 account. */
  StorageV2: "StorageV2",

  /** The storage account is a file storage account. */
  FileStorage: "FileStorage",

  /** The storage account is a block blob storage account. */
  BlockBlobStorage: "BlockBlobStorage",
}

/** The SKU types */
#suppress "@azure-tools/typespec-azure-core/no-enum" "Existing API"
enum SkuName {
  /** The standard LRS SKU. */
  StandardLRS: "Standard_LRS",

  /** The standard GRS SKU. */
  StandardGRS: "Standard_GRS",

  /** The standard RAGRS SKU. */
  StandardRAGRS: "Standard_RAGRS",

  /** The standard ZRS SKU. */
  StandardZRS: "Standard_ZRS",

  /** The premium LRS SKU. */
  PremiumLRS: "Premium_LRS",

  /** The standard GZRS SKU. */
  @added(Versions.v2026_04_06)
  StandardGZRS: "Standard_GZRS",

  /** The premium ZRS SKU. */
  @added(Versions.v2026_04_06)
  PremiumZRS: "Premium_ZRS",

  /** The standard RAGZRS SKU. */
  @added(Versions.v2026_04_06)
  StandardRAGZRS: "Standard_RAGZRS",
}

/** The list container segment response */
@Xml.name("EnumerationResults")
model ListContainersSegmentResponse {
  /** The service endpoint. */
  @Xml.attribute
  @Xml.name("ServiceEndpoint")
  serviceEndpoint: string;

  /** The prefix of the containers. */
  @Xml.name("Prefix") prefix?: string;

  /** The marker of the containers. */
  @Xml.name("Marker") marker?: string;

  /** The max results of the containers. */
  @Xml.name("MaxResults") maxResults?: int32;

  /** The container segment. */
  @pageItems
  @Xml.name("Containers")
  containerItems: ContainerItem[];

  /** The next marker of the containers. */
  #suppress "@azure-tools/typespec-azure-core/casing-style" "Existing API. The casing is correct."
  @continuationToken
  @Xml.name("NextMarker")
  NextMarker?: string;
}

/** An Azure Storage container. */
@Xml.name("Container")
model ContainerItem {
  /** The name of the container. */
  @Xml.name("Name") name: string;

  /** Whether the container is deleted. */
  @Xml.name("Deleted") delete?: boolean;

  /** The version of the container. */
  @Xml.name("Version") version?: string;

  /** The properties of the container. */
  @Xml.name("Properties") properties: ContainerProperties;

  /** The metadata of the container. */
  #suppress "@azure-tools/typespec-autorest/unsupported-param-type" "Existing API"
  @Xml.name("Metadata") metadata?: Record<string>;
}

/** The properties of a container. */
model ContainerProperties {
  /** The date-time the container was last modified in RFC1123 format. */
  #suppress "@azure-tools/typespec-azure-core/known-encoding" "Existing API"
  @encode("rfc7231")
  @Xml.name("Last-Modified")
  lastModified: utcDateTime;

  /** The ETag of the container. */
  @Xml.name("ETag") eTag: string;

  /** The lease status of the container. */
  @Xml.name("LeaseStatus") leaseStatus?: LeaseStatus;

  /** The lease state of the container. */
  @Xml.name("LeaseState") leaseState?: LeaseState;

  /** The lease duration of the container. */
  @Xml.name("LeaseDuration") leaseDuration?: LeaseDuration;

  /** The public access type of the container. */
  @Xml.name("PublicAccess") publicAccess?: PublicAccessType;

  /** Whether it has an immutability policy. */
  @Xml.name("HasImmutabilityPolicy") hasImmutabilityPolicy?: boolean;

  /** The has legal hold status of the container. */
  @Xml.name("HasLegalHold") hasLegalHold?: boolean;

  /** The default encryption scope of the container. */
  @Xml.name("DefaultEncryptionScope") defaultEncryptionScope?: string;

  /** Whether to prevent encryption scope override. */
  @Xml.name("DenyEncryptionScopeOverride")
  denyEncryptionScopeOverride?: boolean;

  /** The deleted time of the container. */
  #suppress "@azure-tools/typespec-azure-core/known-encoding" "Existing API"
  @encode("rfc7231")
  @Xml.name("DeletedTime")
  deletedTime?: utcDateTime;

  /** The remaining retention days of the container. */
  @Xml.name("RemainingRetentionDays") remainingRetentionDays?: int32;

  /** Whether immutable storage with versioning is enabled. */
  @Xml.name("ImmutableStorageWithVersioningEnabled")
  immutableStorageWithVersioningEnabled?: boolean;
}

/** Stats for the storage service. */
model StorageServiceStats {
  /** The geo replication stats. */
  @Xml.name("GeoReplication") geoReplication?: GeoReplication;
}

/** Geo-Replication information for the Secondary Storage Service */
model GeoReplication {
  /** The status of the secondary location */
  @Xml.name("Status") status: GeoReplicationStatusType;

  /** A GMT date/time value, to the second. All primary writes preceding this value are guaranteed to be available for read operations at the secondary. Primary writes after this point in time may or may not be available for reads. */
  #suppress "@azure-tools/typespec-azure-core/known-encoding" "Existing API"
  @encode("rfc7231")
  @Xml.name("LastSyncTime")
  lastSyncTime: utcDateTime;
}

/** The geo replication status. */
union GeoReplicationStatusType {
  /** The geo replication is live. */
  Live: "live",

  /** The geo replication is bootstrap. */
  Bootstrap: "bootstrap",

  /** The geo replication is unavailable. */
  Unavailable: "unavailable",

  /** Extensible */
  string,
}

/** Key information */
model KeyInfo {
  /** The date-time the key is active. */
  @Xml.name("Start") start: string;

  /** The date-time the key expires. */
  @Xml.name("Expiry") expiry: string;

  /** The delegated user tenant id in Azure AD. */
  @Xml.name("DelegatedUserTid")
  @added(Versions.v2026_04_06)
  delegatedUserTid?: uuid;
}

/** A user delegation key. */
model UserDelegationKey {
  /** The Azure Active Directory object ID in GUID format. */
  @Xml.name("SignedOid") signedOid: uuid;

  /** The Azure Active Directory tenant ID in GUID format. */
  @Xml.name("SignedTid") signedTid: uuid;

  /** The date-time the key is active. */
  @Xml.name("SignedStart") signedStart: string;

  /** The date-time the key expires. */
  @Xml.name("SignedExpiry") signedExpiry: string;

  /** Abbreviation of the Azure Storage service that accepts the key. */
  @Xml.name("SignedService") signedService: string;

  /** The service version that created the key. */
  @Xml.name("SignedVersion") signedVersion: string;

  /** The delegated user tenant id in Azure AD. Return if DelegatedUserTid is specified. */
  @Xml.name("SignedDelegatedUserTid")
  @added(Versions.v2026_04_06)
  signedDelegatedUserTid?: uuid;

  /** The key as a base64 string. */
  @Xml.name("Value")
  value: base64Bytes;
}

/** The public access types. */
union PublicAccessType {
  /** Blob access. */
  Blob: "blob",

  /** Container access. */
  Container: "container",

  /** Extensible */
  string,
}

/** The copy status. */
#suppress "@azure-tools/typespec-azure-core/no-enum" "Existing API"
enum CopyStatus {
  /** The copy operation is pending. */
  Pending: "pending",

  /** The copy operation succeeded. */
  Success: "success",

  /** The copy operation failed. */
  Failed: "failed",

  /** The copy operation is aborted. */
  Aborted: "aborted",
}

/** The lease duration. */
#suppress "@azure-tools/typespec-azure-core/no-enum" "Existing API"
enum LeaseDuration {
  /** The lease is of infinite duration. */
  Infinite: "infinite",

  /** The lease is of fixed duration. */
  Fixed: "fixed",
}

/** The lease state. */
#suppress "@azure-tools/typespec-azure-core/no-enum" "Existing API"
enum LeaseState {
  /** The lease is available. */
  Available: "available",

  /** The lease is currently leased. */
  Leased: "leased",

  /** The lease is expired. */
  Expired: "expired",

  /** The lease is breaking. */
  Breaking: "breaking",

  /** The lease is broken. */
  Broken: "broken",
}

/** The lease status. */
#suppress "@azure-tools/typespec-azure-core/no-enum" "Existing API"
enum LeaseStatus {
  /** The lease is unlocked. */
  Unlocked: "unlocked",

  /** The lease is locked. */
  Locked: "locked",
}

/** Represents an access policy. */
model AccessPolicy {
  /** The date-time the policy is active. */
  @Xml.name("Start")
  @encode("rfc3339-fixed-width")
  start: utcDateTime;

  /** The date-time the policy expires. */
  @Xml.name("Expiry")
  @encode("rfc3339-fixed-width")
  expiry: utcDateTime;

  /** The permissions for acl the policy. */
  @Xml.name("Permission") permission: string;
}

/** The access tiers. */
union AccessTier {
  /** The hot P4 tier. */
  P4: "P4",

  /** The hot P6 tier. */
  P6: "P6",

  /** The hot P10 tier. */
  P10: "P10",

  /** The hot P15 tier. */
  P15: "P15",

  /** The hot P20 tier. */
  P20: "P20",

  /** The hot P30 tier. */
  P30: "P30",

  /** The hot P40 tier. */
  P40: "P40",

  /** The hot P50 tier. */
  P50: "P50",

  /** The hot P60 tier. */
  P60: "P60",

  /** The hot P70 tier. */
  P70: "P70",

  /** The hot P80 tier. */
  P80: "P80",

  /** The hot access tier. */
  Hot: "Hot",

  /** The cool access tier. */
  Cool: "Cool",

  /** The archive access tier. */
  Archive: "Archive",

  /** The Premium access tier. */
  Premium: "Premium",

  /** The Cold access tier. */
  Cold: "Cold",

  /** Extensible */
  string,
}

/** The archive status. */
union ArchiveStatus {
  /** The archive status is rehydrating pending to hot. */
  RehydratePendingToHot: "rehydrate-pending-to-hot",

  /** The archive status is rehydrating pending to cool. */
  RehydratePendingToCool: "rehydrate-pending-to-cool",

  /** The archive status is rehydrating pending to archive. */
  RehydratePendingToCold: "rehydrate-pending-to-cold",

  /** Extensible */
  string,
}

/** An Azure Storage Blob */
@Xml.name("Blob")
model BlobItemInternal {
  /** The name of the blob. */
  @Xml.name("Name") name: BlobName;

  /** Whether the blob is deleted. */
  @Xml.name("Deleted") deleted: boolean;

  /** The snapshot of the blob. */
  @Xml.name("Snapshot") snapshot: string;

  /** The version id of the blob. */
  @Xml.name("VersionId") versionId?: string;

  /** Whether the blob is the current version. */
  @Xml.name("IsCurrentVersion") isCurrentVersion?: boolean;

  /** The properties of the blob. */
  @Xml.name("Properties") properties: BlobPropertiesInternal;

  /** The metadata of the blob. */
  @Xml.name("Metadata") metadata?: BlobMetadata;

  /** The tags of the blob. */
  @Xml.name("BlobTags") blobTags?: BlobTags;

  /** The object replication metadata of the blob. */
  #suppress "@azure-tools/typespec-autorest/unsupported-param-type" "Existing API"
  @Xml.name("OrMetadata")
  objectReplicationMetadata?: ObjectReplicationMetadata;

  /** Whether the blob has versions only. */
  @Xml.name("HasVersionsOnly") hasVersionsOnly?: boolean;
}

/** The properties of a blob. */
@Xml.name("Properties")
model BlobPropertiesInternal {
  /** The date-time the blob was created in RFC1123 format. */
  #suppress "@azure-tools/typespec-azure-core/known-encoding" "Existing API"
  @encode("rfc7231")
  @Xml.name("Creation-Time")
  creationTime?: utcDateTime;

  /** The date-time the blob was last modified in RFC1123 format. */
  #suppress "@azure-tools/typespec-azure-core/known-encoding" "Existing API"
  @encode("rfc7231")
  @Xml.name("Last-Modified")
  lastModified: utcDateTime;

  /** The blob ETag. */
  @Xml.name("Etag") eTag: string;

  /** The content length of the blob. */
  @Xml.name("Content-Length") contentLength?: int64;

  /** The content type of the blob. */
  @Xml.name("Content-Type") contentType?: string;

  /** The content encoding of the blob. */
  @Xml.name("Content-Encoding") contentEncoding?: string;

  /** The content language of the blob. */
  @Xml.name("Content-Language") contentLanguage?: string;

  /** The content MD5 of the blob. */
  @Xml.name("Content-MD5") contentMd5?: bytes;

  /** The content disposition of the blob. */
  @Xml.name("Content-Disposition") contentDisposition?: string;

  /** The cache control of the blob. */
  @Xml.name("Cache-Control") cacheControl?: string;

  /** The sequence number of the blob. */
  @Xml.name("x-ms-blob-sequence-number") blobSequenceNumber?: int64;

  /** The blob type. */
  @Xml.name("BlobType") blobType?: BlobType;

  /** The lease status of the blob. */
  @Xml.name("LeaseStatus") leaseStatus?: LeaseStatus;

  /** The lease state of the blob. */
  @Xml.name("LeaseState") leaseState?: LeaseState;

  /** The lease duration of the blob. */
  @Xml.name("LeaseDuration") leaseDuration?: LeaseDuration;

  /** The copy ID of the blob. */
  @Xml.name("CopyId") copyId?: string;

  /** The copy status of the blob. */
  @Xml.name("CopyStatus") copyStatus?: CopyStatus;

  /** The copy source of the blob. */
  @Xml.name("CopySource") copySource?: string;

  /** The copy progress of the blob. */
  @Xml.name("CopyProgress") copyProgress?: string;

  /** The copy completion time of the blob. */
  #suppress "@azure-tools/typespec-azure-core/known-encoding" "Existing API"
  @encode("rfc7231")
  @Xml.name("CopyCompletionTime")
  copyCompletionTime?: utcDateTime;

  /** The copy status description of the blob. */
  @Xml.name("CopyStatusDescription") copyStatusDescription?: string;

  /** Whether the blob is encrypted on the server. */
  @Xml.name("ServerEncrypted") serverEncrypted?: boolean;

  /** Whether the blob is incremental copy. */
  @Xml.name("IncrementalCopy") incrementalCopy?: boolean;

  /** The name of the destination snapshot. */
  @Xml.name("DestinationSnapshot") destinationSnapshot?: string;

  /** The time the blob was deleted. */
  #suppress "@azure-tools/typespec-azure-core/known-encoding" "Existing API"
  @encode("rfc7231")
  @Xml.name("DeletedTime")
  deletedTime?: utcDateTime;

  /** The remaining retention days of the blob. */
  @Xml.name("RemainingRetentionDays") remainingRetentionDays?: int32;

  /** The access tier of the blob. */
  @Xml.name("AccessTier") accessTier?: AccessTier;

  /** Whether the access tier is inferred. */
  @Xml.name("AccessTierInferred") accessTierInferred?: boolean;

  /** The archive status of the blob. */
  @Xml.name("ArchiveStatus") archiveStatus?: ArchiveStatus;

  /** Customer provided key sha256 */
  @Xml.name("CustomerProvidedKeySha256") customerProvidedKeySha256?: string;

  /** The encryption scope of the blob. */
  @Xml.name("EncryptionScope") encryptionScope?: string;

  /** The access tier change time of the blob. */
  #suppress "@azure-tools/typespec-azure-core/known-encoding" "Existing API"
  @encode("rfc7231")
  @Xml.name("AccessTierChangeTime")
  accessTierChangeTime?: utcDateTime;

  /** The number of tags for the blob. */
  @Xml.name("TagCount") tagCount?: int32;

  /** The expire time of the blob. */
  #suppress "@azure-tools/typespec-azure-core/known-encoding" "Existing API"
  @encode("rfc7231")
  @Xml.name("Expiry-Time")
  expiryTime?: utcDateTime;

  /** Whether the blob is sealed. */
  @Xml.name("Sealed")
  sealed?: boolean;

  /** The rehydrate priority of the blob. */
  @Xml.name("RehydratePriority") rehydratePriority?: RehydratePriority;

  /** The last access time of the blob. */
  #suppress "@azure-tools/typespec-azure-core/known-encoding" "Existing API"
  @encode("rfc7231")
  @Xml.name("LastAccessTime")
  lastAccessTime?: utcDateTime;

  /** The immutability policy until time of the blob. */
  #suppress "@azure-tools/typespec-azure-core/known-encoding" "Existing API"
  @encode("rfc7231")
  @Xml.name("ImmutabilityPolicyUntilDate")
  immutabilityPolicyUntilDate?: utcDateTime;

  /** The immutability policy mode of the blob. */
  @Xml.name("ImmutabilityPolicyMode")
  immutabilityPolicyMode?: ImmutabilityPolicyMode;

  /** Whether the blob is under legal hold. */
  @Xml.name("LegalHold") legalHold?: boolean;
}

/** The immutability policy mode used in requests and responses. */
#suppress "@azure-tools/typespec-azure-core/no-enum" "Existing API"
enum ImmutabilityPolicyMode {
  /** The immutability policy is mutable. Should never be set, only returned. */
  Mutable: "mutable",

  /** The immutability policy is locked. */
  Locked: "locked",

  /** The immutability policy is unlocked. */
  Unlocked: "unlocked",
}

/** The blob type. */
#suppress "@azure-tools/typespec-azure-core/no-enum" "Existing API"
enum BlobType {
  /** The blob is a block blob. */
  BlockBlob: "BlockBlob",

  /** The blob is a page blob. */
  PageBlob: "PageBlob",

  /** The blob is an append blob. */
  AppendBlob: "AppendBlob",
}

/** If an object is in rehydrate pending state then this header is returned with priority of rehydrate. Valid values are High and Standard. */
@Xml.name("RehydratePriority")
union RehydratePriority {
  /** The rehydrate priority is high. */
  High: "High",

  /** The rehydrate priority is standard. */
  Standard: "Standard",

  /** Extensible */
  string,
}

/** The blob metadata. */
// TODO: check if this needs an unwrapped decorator
#suppress "@azure-tools/typespec-autorest/unsupported-param-type" "Existing API"
#suppress "@azure-tools/typespec-azure-core/bad-record-type" "Existing API"
model BlobMetadata is Record<string> {
  /** Whether the blob metadata is encrypted. */
  @Xml.attribute
  @Xml.name("Encrypted")
  encrypted?: string;
}

/** The blob tags. */
@Xml.name("Tag")
model BlobTag {
  /** The key of the tag. */
  @Xml.name("Key") key: string;

  /** The value of the tag. */
  @Xml.name("Value") value: string;
}

/** The object replication metadata. */
#suppress "@azure-tools/typespec-autorest/unsupported-param-type" "Existing API"
@Xml.name("OrMetadata")
model ObjectReplicationMetadata is Record<string>;

/// Service Properties

/** The service properties. */
@Xml.name("StorageServiceProperties")
model BlobServiceProperties {
  /** The logging properties. */
  @Xml.name("Logging") logging?: Logging;

  /** The hour metrics properties. */
  @Xml.name("HourMetrics") hourMetrics?: Metrics;

  /** The minute metrics properties. */
  @Xml.name("MinuteMetrics") minuteMetrics?: Metrics;

  /** The CORS properties. */
  @Xml.name("Cors") cors?: CorsRule[];

  /** The default service version. */
  @Xml.name("DefaultServiceVersion") defaultServiceVersion?: string;

  /** The delete retention policy. */
  @Xml.name("DeleteRetentionPolicy") deleteRetentionPolicy?: RetentionPolicy;

  /** The static website properties. */
  @Xml.name("StaticWebsite") staticWebsite?: StaticWebsite;
}

/** The properties that enable an account to host a static website */
model StaticWebsite {
  /** Indicates whether this account is hosting a static website */
  @Xml.name("Enabled") enabled: boolean;

  /** The index document. */
  @Xml.name("IndexDocument") indexDocument?: string;

  /** The error document. */
  @Xml.name("ErrorDocument404Path") errorDocument404Path?: string;

  /** Absolute path of the default index page */
  @Xml.name("DefaultIndexDocumentPath") defaultIndexDocumentPath?: string;
}

/** CORS is an HTTP feature that enables a web application running under one domain to access resources in another domain. Web browsers implement a security restriction known as same-origin policy that prevents a web page from calling APIs in a different domain; CORS provides a secure way to allow one domain (the origin domain) to call APIs in another domain */
model CorsRule {
  /** The allowed origins. */
  @Xml.name("AllowedOrigins") allowedOrigins: string;

  /** The allowed methods. */
  @Xml.name("AllowedMethods") allowedMethods: string;

  /** The allowed headers. */
  @Xml.name("AllowedHeaders") allowedHeaders: string;

  /** The exposed headers. */
  @Xml.name("ExposedHeaders") exposedHeaders: string;

  /** The maximum age in seconds. */
  @Xml.name("MaxAgeInSeconds")
  @minValue(0)
  maxAgeInSeconds: int32;
}

/** The metrics properties. */
model Metrics {
  /** The version of the metrics properties. */
  @Xml.name("Version") version?: string;

  /** Whether it is enabled. */
  @Xml.name("Enabled") enabled: boolean;

  /** Whether to include API in the metrics. */
  @Xml.name("IncludeAPIs") includeApis?: boolean;

  /** The retention policy of the metrics. */
  @Xml.name("RetentionPolicy") retentionPolicy?: RetentionPolicy;
}

/** Azure Analytics Logging settings. */
model Logging {
  /** The version of the logging properties. */
  @Xml.name("Version") version: string;

  /** Whether delete operation is logged. */
  @Xml.name("Delete") delete: boolean;

  /** Whether read operation is logged. */
  @Xml.name("Read") read: boolean;

  /** Whether write operation is logged. */
  @Xml.name("Write") write: boolean;

  /** The retention policy of the logs. */
  @Xml.name("RetentionPolicy") retentionPolicy: RetentionPolicy;
}

/** The retention policy. */
model RetentionPolicy {
  /** Whether to enable the retention policy. */
  @Xml.name("Enabled") enabled: boolean;

  /** The number of days to retain the logs. */
  @Xml.name("Days")
  @minValue(1)
  days?: int32;

  /** Whether to allow permanent delete. */
  @Xml.name("AllowPermanentDelete") allowPermanentDelete?: boolean;
}

// List Blobs

/** An enumeration of blobs. */
@Xml.name("EnumerationResults")
model ListBlobsFlatSegmentResponse {
  /** The service endpoint. */
  @Xml.attribute
  @Xml.name("ServiceEndpoint")
  serviceEndpoint: string;

  /** The container name. */
  @Xml.attribute
  @Xml.name("ContainerName")
  containerName: string;

  /** The prefix of the blobs. */
  @Xml.name("Prefix") prefix?: string;

  /** The marker of the blobs. */
  @Xml.name("Marker") marker?: string;

  /** The max results of the blobs. */
  @Xml.name("MaxResults") maxResults?: int32;

  /** The blob segment. */
  @Xml.name("Blobs")
  segment: BlobFlatListSegment;

  /** The next marker of the blobs. */
  @continuationToken
  @Xml.name("NextMarker")
  nextMarker?: string;
}

/** The blob flat list segment. */
model BlobFlatListSegment {
  /** The blob items. */
  @pageItems
  @Xml.name("Blob")
  @Xml.unwrapped
  blobItems: BlobItemInternal[];
}

/** Represents a page list. */
model PageList {
  /** The page ranges. */
  @Xml.unwrapped
  @Xml.name("PageRange")
  pageRange?: PageRange[];

  /** The clear ranges. */
  @Xml.unwrapped
  @Xml.name("ClearRange")
  clearRange?: ClearRange[];

  /** The next marker. */
  @continuationToken
  @Xml.name("NextMarker")
  nextMarker?: string;
}

/** The page range. */
model PageRange {
  /** The start of the byte range. */
  @Xml.name("Start") start: int64;

  /** The end of the byte range. */
  @Xml.name("End") end: int64;
}

/** The clear range. */
model ClearRange {
  /** The start of the byte range. */
  @Xml.name("Start") start: int64;

  /** The end of the byte range. */
  @Xml.name("End") end: int64;
}

/** Represents blob tags. */
@Xml.name("Tags")
model BlobTags {
  /** Represents the blob tags. */
  @Xml.name("TagSet") blobTagSet: BlobTag[];
}

/** The query request, note only SQL supported */
#suppress "@azure-tools/typespec-azure-core/no-enum" "Existing API"
enum QueryRequestType {
  /** The SQL request query type. */
  SQL: "SQL",
}

/** Groups the set of query request settings. */
model QueryRequest {
  /** Required. The type of the provided query expression. */
  @Xml.name("QueryType") queryType: QueryRequestType;

  /** The query expression in SQL. The maximum size of the query expression is 256KiB. */
  @Xml.name("Expression") expression: string;

  /** The input serialization settings. */
  @Xml.name("InputSerialization") inputSerialization?: QuerySerialization;

  /** The output serialization settings. */
  @Xml.name("OutputSerialization") outputSerialization?: QuerySerialization;
}

/** The query serialization settings. */
model QuerySerialization {
  /** The query format. */
  @Xml.name("Format") format: QueryFormat;
}

/** The query format settings. */
model QueryFormat {
  /** The query type. */
  @Xml.name("Type") type: QueryType;

  /** The delimited text configuration. */
  @Xml.name("DelimitedTextConfiguration")
  delimitedTextConfiguration?: DelimitedTextConfiguration;

  /** The JSON text configuration. */
  @Xml.name("JsonTextConfiguration")
  jsonTextConfiguration?: JsonTextConfiguration;

  /** The Apache Arrow configuration. */
  @Xml.name("ArrowConfiguration") arrowConfiguration?: ArrowConfiguration;

  /** The Parquet configuration. */
  #suppress "@azure-tools/typespec-azure-core/bad-record-type" "Existing API"
  @Xml.name("ParquetConfiguration")
  parquetTextConfiguration?: ParquetConfiguration;
}

/** Represents the delimited text configuration. */
model DelimitedTextConfiguration {
  /** The string used to separate columns. */
  @Xml.name("ColumnSeparator") columnSeparator?: string;

  /** The string used to quote a specific field. */
  @Xml.name("FieldQuote") fieldQuote?: string;

  /** The string used to separate records. */
  @Xml.name("RecordSeparator") recordSeparator?: string;

  /** The string used to escape a quote character in a field. */
  @Xml.name("EscapeChar") escapeChar?: string;

  /** Represents whether the data has headers. */
  @Xml.name("HasHeaders") headersPresent?: boolean;
}

/** Represents the JSON text configuration. */
model JsonTextConfiguration {
  /** The string used to separate records. */
  @Xml.name("RecordSeparator") recordSeparator?: string;
}

/** Represents the Apache Arrow configuration. */
model ArrowConfiguration {
  /** The Apache Arrow schema */
  @Xml.name("Schema") schema: ArrowField[];
}

/** Represents an Apache Arrow field. */
@Xml.name("Field")
model ArrowField {
  /** The arrow field type. */
  @Xml.name("Type") type: string;

  /** The arrow field name. */
  @Xml.name("Name") name?: string;

  /** The arrow field precision. */
  @Xml.name("Precision") precision?: int32;

  /** The arrow field scale. */
  @Xml.name("Scale") scale?: int32;
}

/** Represents the Parquet configuration. */
#suppress "@azure-tools/typespec-azure-core/bad-record-type" "Existing API"
model ParquetConfiguration is Record<unknown>;

/** The query format type. */
#suppress "@azure-tools/typespec-azure-core/no-enum" "Existing API"
@Xml.name("Type")
enum QueryType {
  /** The query format type is delimited. */
  Delimited: "delimited",

  /** The query format type is JSON. */
  JSON: "json",

  /** The query format type is Apache Arrow. */
  Arrow: "arrow",

  /** The query format type is Parquet. */
  Parquet: "parquet",
}

/// Parameters

/** The blob append offset response header. */
alias BlobAppendOffsetResponseHeader = {
  /** This response header is returned only for append operations. It returns the offset at which the block was committed, in bytes. */
  @header("x-ms-blob-append-offset")
  blobAppendOffset?: string;
};

/** The blob condition append position parameter. */
alias BlobConditionAppendPosParameter = {
  /** Optional conditional header, used only for the Append Block operation. A number indicating the byte offset to compare. Append Block will succeed only if the append position is equal to this number. If it is not, the request will fail with the AppendPositionConditionNotMet error (HTTP status code 412 - Precondition Failed). */
  @header("x-ms-blob-condition-appendpos")
  appendPosition?: int64;
};

/** The blob condition max size parameter. */
alias BlobConditionMaxSizeParameter = {
  /** Optional conditional header. The max length in bytes permitted for the append blob. If the Append Block operation would cause the blob to exceed that limit or if the blob size is already greater than the value specified in this header, the request will fail with MaxBlobSizeConditionNotMet error (HTTP status code 412 - Precondition Failed). */
  @header("x-ms-blob-condition-maxsize")
  maxSize?: int64;
};

/** The sequence number action parameter. */
alias SequenceNumberActionParameter = {
  /** Required if the x-ms-blob-sequence-number header is set for the request. This property applies to page blobs only. This property indicates how the service should modify the blob's sequence number */
  @header("x-ms-sequence-number-action")
  sequenceNumberAction: SequenceNumberActionType;
};

/** The sequence number actions. */
#suppress "@azure-tools/typespec-azure-core/no-enum" "Existing API"
enum SequenceNumberActionType {
  /** Increment the sequence number. */
  Increment: "increment",

  /** Set the maximum for the sequence number. */
  Max: "max",

  /** Update the sequence number. */
  Update: "update",
}

/** The sequence number parameter. */
alias SequenceNumberParameter = {
  /** Set for page blobs only. The sequence number is a user-controlled value that you can use to track requests. The value of the sequence number must be between 0 and 2^63 - 1. */
  @header("x-ms-blob-sequence-number")
  blobSequenceNumber?: int64 = 0;
};

/** The blob content length required parameter. */
alias BlobContentLengthResponseHeader = {
  /** The size of the blob in bytes. */
  @header("x-ms-blob-content-length")
  blobContentLength?: int64;
};
/** The blob content length required parameter. */
alias BlobContentLengthRequired = {
  /** This header specifies the maximum size for the page blob, up to 1 TB. The page blob size must be aligned to a 512-byte boundary. */
  @header("x-ms-blob-content-length")
  size: int64;
};

/** The deny encryption scope override response header. */
alias DenyEncryptionScopeOverride = {
  /** If a blob has a lease and the lease is of infinite duration then the value of this header is set to true, otherwise it is set to false. */
  @clientName("PreventEncryptionScopeOverride")
  @header("x-ms-deny-encryption-scope-override")
  denyEncryptionScopeOverride?: boolean;
};

/** Specifies whether data in the container may be accessed publicly and the level of access */
alias BlobPublicAccess = {
  /** The public access setting for the container. */
  @header("x-ms-blob-public-access")
  access?: PublicAccessType;
};

/** Optional: Indicates the priority with which to rehydrate an archived blob. */
alias RehydratePriorityHeader = {
  /** If an object is in rehydrate pending state then this header is returned with priority of rehydrate. Valid values are High and Standard. */
  @header("x-ms-rehydrate-priority")
  rehydratePriority?: RehydratePriority;
};

/** The expires on response header. */
alias ExpiryTimeHeader = {
  /** The time this blob will expire. */
  #suppress "@azure-tools/typespec-azure-core/known-encoding" "Existing API"
  @clientName("ExpiresOn")
  @encode("rfc7231")
  @header("x-ms-expiry-time")
  expiryTime?: utcDateTime;
};

/** The immutability policy expires on response header. */
alias ImmutabilityPolicyExpiresOnResponseHeader = {
  /** UTC date/time value generated by the service that indicates the time at which the blob immutability policy will expire. */
  #suppress "@azure-tools/typespec-azure-core/known-encoding" "Existing API"
  @clientName("ImmutabilityPolicyExpiresOn")
  @encode("rfc7231")
  @header("x-ms-immutability-policy-until-date")
  immutabilityPolicyUntilDate?: utcDateTime;
};

/** The immutability policy expires on response header. */
alias ImmutabilityPolicyExpiresOnResponseHeaderPrivate = {
  /** UTC date/time value generated by the service that indicates the time at which the blob immutability policy will expire. */
  #suppress "@azure-tools/typespec-azure-core/known-encoding" "Existing API"
  @clientName("ImmutabilityPolicyExpiresOn")
  @encode("rfc7231")
  @access(Access.internal)
  @header("x-ms-immutability-policy-until-date")
  immutabilityPolicyUntilDate?: utcDateTime;
};

/** The last accessed response header. */
alias LastAccessedResponseHeader = {
  /** UTC date/time value generated by the service that indicates the time at which the blob was last read or written to */
  #suppress "@azure-tools/typespec-azure-core/known-encoding" "Existing API"
  @encode("rfc7231")
  @header("x-ms-last-access-time")
  lastAccessed?: utcDateTime;
};

/** The is sealed response header. */
alias IsSealedResponseHeader = {
  /** If this blob has been sealed */
  @header("x-ms-blob-sealed")
  isSealed?: boolean;
};

/** The tag count response header. */
alias TagCountResponseHeader = {
  /** The number of tags associated with the blob */
  @header("x-ms-tag-count")
  tagCount?: int64;
};

/** The blob committed block count response header. */
alias BlobCommittedBlockCountResponseHeader = {
  /** The number of committed blocks present in the blob. This header is returned only for append blobs. */
  @header("x-ms-blob-committed-block-count")
  blobCommittedBlockCount?: int32;
};

/** The accept ranges response header. */
alias AcceptRangesResponseHeader = {
  /** Indicates that the service supports requests for partial blob content. */
  @header("Accept-Ranges") acceptRanges?: string;
};

/** The private accept ranges response header. */
alias AcceptRangesResponseHeaderPrivate = {
  /** Indicates that the service supports requests for partial blob content. */
  @access(Access.internal)
  @header("Accept-Ranges")
  acceptRanges?: string;
};

/** The is current version response header. */
alias IsCurrentVersionResponseHeader = {
  /** The value of this header indicates whether version of this blob is a current version, see also x-ms-version-id header. */
  @header("x-ms-is-current-version")
  isCurrentVersion?: boolean;
};

/** The lease status response header. */
alias LeaseStatusResponseHeader = {
  /** The lease status of the blob. */
  @header("x-ms-lease-status")
  leaseStatus?: LeaseStatus;
};

/** The lease state response header. */
alias LeaseStateResponseHeader = {
  /** Lease state of the blob. */
  @header("x-ms-lease-state")
  leaseState?: LeaseState;
};

/** The copy source response header. */
alias CopySourceResponseHeader = {
  /** URL up to 2 KB in length that specifies the source blob or file used in the last attempted Copy Blob operation where this blob was the destination blob. This header does not appear if this blob has never been the destination in a Copy Blob operation, or if this blob has been modified after a concluded Copy Blob operation using Set Blob Properties, Put Blob, or Put Block List. */
  @header("x-ms-copy-source")
  copySource?: string;
};

/** The copy progress response header. */
alias CopyProgressResponseHeader = {
  /** Contains the number of bytes copied and the total bytes in the source in the last attempted Copy Blob operation where this blob was the destination blob. Can show between 0 and Content-Length bytes copied. This header does not appear if this blob has never been the destination in a Copy Blob operation, or if this blob has been modified after a concluded Copy Blob operation using Set Blob Properties, Put Blob, or Put Block List */
  @header("x-ms-copy-progress")
  copyProgress?: string;
};

/** The copy status description response header. */
alias CopyStatusDescriptionResponseHeader = {
  /** Only appears when x-ms-copy-status is failed or pending. Describes the cause of the last fatal or non-fatal copy operation failure. This header does not appear if this blob has never been the destination in a Copy Blob operation, or if this blob has been modified after a concluded Copy Blob operation using Set Blob Properties, Put Blob, or Put Block List */
  @header("x-ms-copy-status-description")
  copyStatusDescription?: string;
};

/** The copy completion time response header. */
alias CopyCompletionTimeResponseHeader = {
  /** Conclusion time of the last attempted Copy Blob operation where this blob was the destination blob. This value can specify the time of a completed, aborted, or failed copy attempt. This header does not appear if a copy is pending, if this blob has never been the destination in a Copy Blob operation, or if this blob has been modified after a concluded Copy Blob operation using Set Blob Properties, Put Blob, or Put Block List. */
  #suppress "@azure-tools/typespec-azure-core/known-encoding" "Existing API"
  @encode("rfc7231")
  @header("x-ms-copy-completion-time")
  copyCompletionTime?: utcDateTime;
};

/** The blob type response header. */
alias BlobTypeResponseHeader = {
  /** The type of the blob. */
  @header("x-ms-blob-type")
  blobType?: BlobType;
};

/** The object replication policy response header. */
alias ObjectReplicationPolicyIdResponseHeader = {
  /** Optional. Only valid when Object Replication is enabled for the storage container and on the destination blob of the replication. */
  @header("x-ms-or-policy-id")
  objectReplicationPolicyId?: string;
};

/** The if sequence number equal to parameter. */
alias IfSequenceNumberEqualToParameter = {
  /** Specify this header value to operate only on a blob if it has the specified sequence number. */
  @header("x-ms-if-sequence-number-eq")
  ifSequenceNumberEqualTo?: int64;
};

/** THe if sequence number less than parameter. */
alias IfSequenceNumberLessThanParameter = {
  /** Specify this header value to operate only on a blob if it has a sequence number less than the specified. */
  @header("x-ms-if-sequence-number-lt")
  ifSequenceNumberLessThan?: int64;
};

/** The if sequence number less than or equal to parameter. */
alias IfSequenceNumberLessThanOrEqualToParameter = {
  /** Specify this header value to operate only on a blob if it has a sequence number less than or equal to the specified. */
  @header("x-ms-if-sequence-number-le")
  ifSequenceNumberLessThanOrEqualTo?: int64;
};

/** The block list types. */
#suppress "@azure-tools/typespec-azure-core/no-enum" "Existing API"
enum BlockListType {
  /** The list of committed blocks. */
  Committed: "committed",

  /** The list of uncommitted blocks. */
  Uncommitted: "uncommitted",

  /** Both lists together. */
  All: "all",
}

/** The source content CRC64 parameter. */
alias SourceContentCrc64Parameter = {
  /** Specify the crc64 calculated for the range of bytes that must be read from the copy source. */
  @header("x-ms-source-content-crc64")
  sourceContentCrc64?: bytes;
};

/** The source range parameter. */
alias SourceRangeParameter = {
  /** Bytes of source data in the specified range. */
  @header("x-ms-source-range")
  sourceRange?: string;
};

/** The source URL parameter. */
alias SourceUrlParameter = {
  /** Specify a URL to the copy source. */
  @header("x-ms-copy-source")
  sourceUrl: string;
};

/** The Block ID parameter. */
alias BlockIdParameter = {
  /** A valid Base64 string value that identifies the block. Prior to encoding, the string must be less than or equal to 64 bytes in size. For a given blob, the length of the value specified for the blockid parameter must be the same size for each block. */
  @query
  @clientName("blockId")
  blockid: base64Bytes;
};

/** The account kind response header. */
alias AccountKindResponseHeader = {
  /** Identifies the account kind */
  @header("x-ms-account-kind")
  accountKind?: AccountKind;
};

/** The SKU name response header. */
alias SkuNameResponseHeader = {
  /** Identifies the sku name of the account */
  @header("x-ms-sku-name")
  skuName?: SkuName;
};

/** The content CRC 64 response header. */
alias ContentCrc64ResponseHeader = {
  /** This response header is returned so that the client can check for the integrity of the copied content. */
  @header("x-ms-content-crc64")
  contentCrc64?: bytes;
};

/** The copy status response header. */
alias CopyStatusResponseHeader = {
  /** State of the copy operation identified by x-ms-copy-id. */
  @header("x-ms-copy-status")
  copyStatus?: CopyStatus;
};

/** The copy ID response header. */
alias CopyIdResponseHeader = {
  /** String identifier for this copy operation. Use with Get Blob Properties to check the status of this copy operation, or pass to Abort Copy Blob to abort a pending copy. */
  @header("x-ms-copy-id")
  copyId?: string;
};

/** The source if unmodified since parameter. */
alias SourceIfUnmodifiedSinceParameter = {
  /** Specify this header value to operate only on a blob if it has not been modified since the specified date/time. */
  #suppress "@azure-tools/typespec-azure-core/known-encoding" "Existing API"
  @encode("rfc7231")
  @header("x-ms-source-if-unmodified-since")
  sourceIfUnmodifiedSince?: utcDateTime;
};

/** The lease time response header. */
alias LeaseTimeResponseHeader = {
  /** Approximate time remaining in the lease period, in seconds. */
  @header("x-ms-lease-time")
  leaseTime?: int32;
};

/** The lease break period parameter. */
alias LeaseBreakPeriodParameter = {
  /** For a break operation, proposed duration the lease should continue before it is broken, in seconds, between 0 and 60. This break period is only used if it is shorter than the time remaining on the lease. If longer, the time remaining on the lease is used. A new lease will not be available before the break period has expired, but the lease may be held for longer than the break period. If this header does not appear with a break operation, a fixed-duration lease breaks after the remaining lease period elapses, and an infinite lease breaks immediately. */
  @header("x-ms-lease-break-period")
  breakPeriod?: int32;
};

/** The lease ID parameter. */
alias LeaseIdOptionalParameter = {
  /** If specified, the operation only succeeds if the resource's lease is active and matches this ID. */
  @header("x-ms-lease-id") leaseId?: string;
};

/** The lease ID required parameter. */
alias LeaseIdRequiredParameter = {
  /** Required.  A lease ID for the source path. If specified, the source path must have an active lease and the lease ID must match. */
  @header("x-ms-lease-id")
  leaseId: string;
};

/** The lease ID response header. */
alias LeaseIdResponseHeader = {
  /** Uniquely identifies a blobs' lease */
  @header("x-ms-lease-id")
  leaseId?: string;
};

/** The request server encrypted response header. */
alias RequestServerEncryptedResponseHeader = {
  /** The value of this header is set to true if the contents of the request are successfully encrypted using the specified algorithm, and false otherwise. */
  @header("x-ms-request-server-encrypted")
  isServerEncrypted?: boolean;
};

/** The private request server encrypted response header. */
alias RequestServerEncryptedResponseHeaderPrivate = {
  /** The value of this header is set to true if the contents of the request are successfully encrypted using the specified algorithm, and false otherwise. */
  @access(Access.internal)
  @header("x-ms-request-server-encrypted")
  isServerEncrypted?: boolean;
};

/** The server encrypted response header. */
alias ServerEncryptedResponseHeader = {
  /** The value of this header is set to true if the contents of the request are successfully encrypted using the specified algorithm, and false otherwise. */
  @header("x-ms-server-encrypted")
  isServerEncrypted?: boolean;
};

/** The server encrypted response header. */
alias ServerEncryptedResponseHeaderPrivate = {
  /** The value of this header is set to true if the contents of the request are successfully encrypted using the specified algorithm, and false otherwise. */
  @access(Access.internal)
  @header("x-ms-server-encrypted")
  isServerEncrypted?: boolean;
};

/** The legal hold response header. */
alias LegalHoldResponseHeader = {
  /** Specifies the legal hold status to set on the blob. */
  @header("x-ms-legal-hold")
  legalHold: boolean;
};

/** The legal hold response header. */
alias LegalHoldResponseHeaderPrivate = {
  /** Specifies the legal hold status to set on the blob. */
  @access(Access.internal)
  @header("x-ms-legal-hold")
  legalHold: boolean;
};

/** The legal hold required parameter. */
alias LegalHoldRequiredParameter = {
  /** Required.  Specifies the legal hold status to set on the blob. */
  @header("x-ms-legal-hold")
  legalHold: boolean;
};

/** The immutability policy mode response header. */
alias ImmutabilityPolicyModeResponseHeader = {
  /** Indicates the immutability policy mode of the blob. */
  @header("x-ms-immutability-policy-mode")
  immutabilityPolicyMode: ImmutabilityPolicyMode;
};

/** The immutability policy mode response header. */
alias ImmutabilityPolicyModeResponseHeaderPrivate = {
  /** Indicates the immutability policy mode of the blob. */
  @access(Access.internal)
  @header("x-ms-immutability-policy-mode")
  immutabilityPolicyMode: ImmutabilityPolicyMode;
};

/** The blob sequence number response header. */
alias BlobSequenceNumberResponseHeader = {
  /** The current sequence number for a page blob. This header is not returned for block blobs or append blobs. */
  @header("x-ms-blob-sequence-number")
  blobSequenceNumber: int64;
};

/** The private blob sequence number response header. */
alias BlobSequenceNumberResponseHeaderPrivate = {
  /** The current sequence number for a page blob. This header is not returned for block blobs or append blobs. */
  @access(Access.internal)
  @header("x-ms-blob-sequence-number")
  blobSequenceNumber: int64;
};

/** The blob expiration options parameter. */
alias BlobExpiryOptionsParameter = {
  /** Required. Indicates mode of the expiry time */
  @header("x-ms-expiry-option")
  expiryOptions: BlobExpiryOptions;
};

/** The blob expiration options. */
union BlobExpiryOptions {
  /** Never expire. */
  NeverExpire: "NeverExpire",

  /** Relative to creation time. */
  RelativeToCreation: "RelativeToCreation",

  /** Relative to now. */
  RelativeToNow: "RelativeToNow",

  /** Absolute time. */
  Absolute: "Absolute",

  /** Extensible */
  string,
}

/** The Content-Language response header. */
alias ContentLanguageResponseHeader = {
  /** This header returns the value that was specified for the Content-Language request header. */
  @header("Content-Language") contentLanguage: string;
};

/** The Content-Disposition response header. */
alias ContentDispositionResponseHeader = {
  /** This header returns the value that was specified for the 'x-ms-blob-content-disposition' header. The Content-Disposition response header field conveys additional information about how to process the response payload, and also can be used to attach additional metadata. For example, if set to attachment, it indicates that the user-agent should not display the response, but instead show a Save As dialog with a filename other than the blob name specified. */
  @header("Content-Disposition") contentDisposition: string;
};

/** The Cache-Control response header. */
alias CacheControlResponseHeader = {
  /** This header is returned if it was previously specified for the blob. */
  @header("Cache-Control") cacheControl: string;
};

/** The Content-Encoding response header. */
alias ContentEncodingResponseParameter = {
  /** This header returns the value that was specified for the Content-Encoding request header */
  @header("Content-Encoding") contentEncoding: string;
};

/** The Content-Range response header. */
alias ContentRangeResponseHeader = {
  /** Indicates the range of bytes returned in the event that the client requested a subset of the blob by setting the 'Range' request header. */
  @header("Content-Range") contentRange: string;
};

/** The Content-MD5 response header. */
alias ContentMd5ResponseHeader = {
  /** If the blob has an MD5 hash and this operation is to read the full blob, this response header is returned so that the client can check for message content integrity. */
  @header("Content-MD5") contentMd5: bytes;
};

/** The Content-Length response header. */
alias ContentLengthResponseHeader = {
  /** The number of bytes present in the response body. */
  @header("Content-Length") contentLength: int64;
};

/** The version ID response header. */
alias VersionIdResponseHeader = {
  /** A DateTime value returned by the service that uniquely identifies the blob. The value of this header indicates the blob version, and may be used in subsequent requests to access this version of the blob. */
  @header("x-ms-version-id")
  versionId: string;
};

/** The private version ID response header. */
alias VersionIdResponseHeaderPrivate = {
  /** A DateTime value returned by the service that uniquely identifies the blob. The value of this header indicates the blob version, and may be used in subsequent requests to access this version of the blob. */
  @access(Access.internal)
  @header("x-ms-version-id")
  versionId: string;
};

/** The creation time response header. */
alias CreationTimeResponseHeader = {
  /** Returns the date and time the blob was created. */
  #suppress "@azure-tools/typespec-azure-core/known-encoding" "Existing API"
  @encode("rfc7231")
  @header("x-ms-creation-time")
  creationTime: utcDateTime;
};

/** The last modified response header */
alias LastModifiedResponseHeader = {
  /** The date/time that the container was last modified. */
  #suppress "@azure-tools/typespec-azure-core/known-encoding" "Existing API"
  @encode("rfc7231")
  @header("Last-Modified")
  lastModified: utcDateTime;
};

/** The private last modified response header */
alias LastModifiedResponseHeaderPrivate = {
  /** The date/time that the container was last modified. */
  #suppress "@azure-tools/typespec-azure-core/known-encoding" "Existing API"
  @encode("rfc7231")
  @access(Access.internal)
  @header("Last-Modified")
  lastModified: utcDateTime;
};

/** The Date response header */
alias DateResponseHeader = {
  /** UTC date/time value generated by the service that indicates the time at which the response was initiated */
  #suppress "@azure-tools/typespec-azure-core/known-encoding" "Existing API"
  @encode("rfc7231")
  @header("Date")
  date: utcDateTime;
};

/** The private Date response header */
alias DateResponseHeaderPrivate = {
  /** UTC date/time value generated by the service that indicates the time at which the response was initiated */
  #suppress "@azure-tools/typespec-azure-core/known-encoding" "Existing API"
  @encode("rfc7231")
  @access(Access.internal)
  @header("Date")
  date: utcDateTime;
};

/** The ETag response header */
alias EtagResponseHeader = {
  /** The ETag contains a value that you can use to perform operations conditionally. */
  @header("ETag") eTag: string;
};

/** The private ETag response header */
alias EtagResponseHeaderPrivate = {
  /** The ETag contains a value that you can use to perform operations conditionally. */
  @access(Access.internal)
  @header("ETag")
  eTag: string;
};

/** The copy source tags header parameter. */
alias CopySourceTagsParameter = {
  /** Optional, default 'replace'.  Indicates if source tags should be copied or replaced with the tags specified by x-ms-tags. */
  @header("x-ms-copy-source-tag-option")
  copySourceTags?: BlobCopySourceTags;
};

/** The blob copy source tags types. */
#suppress "@azure-tools/typespec-azure-core/no-enum" "Existing API"
enum BlobCopySourceTags {
  /** The replace blob source tags option. */
  Replace: "REPLACE",

  /** The copy blob source tags option. */
  Copy: "COPY",
}

/** The copy source authorization header parameter */
alias CopySourceAuthorizationParameter = {
  /** Only Bearer type is supported. Credentials should be a valid OAuth access token to copy source. */
  @header("x-ms-copy-source-authorization")
  copySourceAuthorization?: string;
};

alias SourceEncryptionKeyParameter = {
  /** Optional. Specifies the source encryption key to use to encrypt the source data provided in the request. */
  @added(Versions.v2026_04_06)
  @header("x-ms-source-encryption-key")
  sourceEncryptionKey?: string;
};

alias SourceEncryptionKeySha256Parameter = {
  /** The SHA-256 hash of the provided source encryption key. Must be provided if the x-ms-source-encryption-key header is provided. */
  @added(Versions.v2026_04_06)
  @header("x-ms-source-encryption-key-sha256")
  sourceEncryptionKeySha256?: string;
};

alias SourceEncryptionAlgorithmParameter = {
  /** The algorithm used to produce the source encryption key hash. Currently, the only accepted value is "AES256". Must be provided if the x-ms-source-encryption-key is provided. */
  @added(Versions.v2026_04_06)
  @header("x-ms-source-encryption-algorithm")
  sourceEncryptionAlgorithm?: EncryptionAlgorithmType;
};

/** The copy source blob properties parameter. */
alias CopySourceBlobPropertiesParameter = {
  /** Optional, default is true.  Indicates if properties from the source blob should be copied. */
  @header("x-ms-copy-source-blob-properties")
  copySourceBlobProperties?: boolean;
};

/** The copy source header parameter. */
alias CopySourceParameter = {
  /** Specifies the name of the source page blob snapshot. This value is a URL of up to 2 KB in length that specifies a page blob snapshot. The value should be URL-encoded as it would appear in a request URI. The source blob must either be public or must be authenticated via a shared access signature. */
  @header("x-ms-copy-source")
  copySource: string;
};

/** The source content MD5 header parameter. */
alias SourceContentMd5Parameter = {
  /** Specify the md5 calculated for the range of bytes that must be read from the copy source. */
  @header("x-ms-source-content-md5")
  sourceContentMd5?: bytes;
};

/** The source if tags parameter. */
alias SourceIfTagsParameter = {
  /** Specify a SQL where clause on blob tags to operate only on blobs with a matching value. */
  @header("x-ms-source-if-tags")
  sourceIfTags?: string;
};

/** The source if match parameter. */
alias SourceIfMatchParameter = {
  /** Specify an ETag value to operate only on blobs with a matching value. */
  @header("x-ms-source-if-match")
  sourceIfMatch?: string;
};

/** The source if none match parameter. */
alias SourceIfNoneMatchParameter = {
  /** Specify this header value to operate only on a blob if it has been modified since the specified date/time. */
  @header("x-ms-source-if-none-match")
  sourceIfNoneMatch?: string;
};

/** The source if modified since parameter. */
alias SourceIfModifiedSinceParameter = {
  /** Specify this header value to operate only on a blob if it has been modified since the specified date/time. */
  #suppress "@azure-tools/typespec-azure-core/known-encoding" "Existing API"
  @header("x-ms-source-if-modified-since")
  @encode("rfc7231")
  sourceIfModifiedSince?: utcDateTime;
};

/** The content CRC64 parameter. */
alias ContentCrc64Parameter = {
  /** Specify the transactional crc64 for the body, to be validated by the service. */
  @clientName("transactionalContentCrc64")
  @header("x-ms-content-crc64")
  contentCrc64?: bytes;
};

/** The access tier optional parameter. */
alias AccessTierHeader = {
  /** The tier to be set on the blob. */
  @header("x-ms-access-tier")
  tier?: AccessTier;
};

/** The content MD5 parameter. */
alias ContentMd5Parameter = {
  /** Optional. An MD5 hash of the blob content. Note that this hash is not validated, as the hashes for the individual blocks were validated when each was uploaded. */
  @clientName("transactionalContentMD5")
  @header("Content-MD5")
  contentMd5?: bytes;
};

/** The legal hold optional parameter. */
alias LegalHoldOptionalParameter = {
  /** Specified if a legal hold should be set on the blob. */
  @header("x-ms-legal-hold")
  legalHold?: boolean;
};

/** The immutability policy mode parameter. */
alias ImmutabilityPolicyModeParameter = {
  /** Specifies the immutability policy mode to set on the blob. */
  @header("x-ms-immutability-policy-mode")
  immutabilityPolicyMode?: ImmutabilityPolicyMode;
};

/** The immutability policy expiration parameter. */
alias ImmutabilityPolicyExpiryRequiredParameter = {
  /** Specifies the date time when the blobs immutability policy is set to expire. */
  #suppress "@azure-tools/typespec-azure-core/known-encoding" "Existing API"
  @encode("rfc7231")
  @header("x-ms-immutability-policy-until-date")
  immutabilityPolicyExpiry: utcDateTime;
};

/** The immutability policy expiration parameter. */
alias ImmutabilityPolicyExpiryParameter = {
  /** Specifies the date time when the blobs immutability policy is set to expire. */
  #suppress "@azure-tools/typespec-azure-core/known-encoding" "Existing API"
  @encode("rfc7231")
  @header("x-ms-immutability-policy-until-date")
  immutabilityPolicyExpiry?: utcDateTime;
};

/** The blobs tags header parameter. */
alias BlobTagsHeaderParameter = {
  /** Optional.  Used to set blob tags in various blob operations. */
  @clientName("BlobTagsString")
  @header("x-ms-tags")
  blobTags?: string;
};

/** The encryption scope parameter. */
alias EncryptionScopeParameter = {
  /** Optional.  Version 2019-07-07 and later.  Specifies the encryption scope to use to encrypt the data provided in the request. If not specified, the request will be encrypted with the root account key. */
  @header("x-ms-encryption-scope")
  encryptionScope?: string;
};

/** The encryption scope response header. */
alias EncryptionScopeResponseHeader = {
  /** If the blob has a MD5 hash, and if request contains range header (Range or x-ms-range), this response header is returned with the value of the whole blob's MD5 value. This value may or may not be equal to the value returned in Content-MD5 header, with the latter calculated from the requested range */
  @header("x-ms-encryption-scope")
  encryptionScope?: string;
};

/** The private encryption scope response header. */
alias EncryptionScopeResponseHeaderPrivate = {
  /** If the blob has a MD5 hash, and if request contains range header (Range or x-ms-range), this response header is returned with the value of the whole blob's MD5 value. This value may or may not be equal to the value returned in Content-MD5 header, with the latter calculated from the requested range */
  @access(Access.internal)
  @header("x-ms-encryption-scope")
  encryptionScope?: string;
};

/** The blob content disposition parameter. */
alias BlobContentDispositionParameter = {
  /** Optional. Sets the blob's content disposition. If specified, this property is stored with the blob and returned with a read request. */
  @header("x-ms-blob-content-disposition")
  blobContentDisposition?: string;
};

/** The blob cache control parameter. */
alias BlobCacheControlParameter = {
  /** Optional. Sets the blob's cache control. If specified, this property is stored with the blob and returned with a read request. */
  @header("x-ms-blob-cache-control")
  blobCacheControl?: string;
};

/** The blob content MD5 parameter. */
alias BlobContentMd5Parameter = {
  /** Optional. An MD5 hash of the blob content. Note that this hash is not validated, as the hashes for the individual blocks were validated when each was uploaded. */
  @header("x-ms-blob-content-md5")
  blobContentMd5?: bytes;
};

/** The blob content MD5 response header. */
alias BlobContentMd5ResponseHeader = {
  /** If the blob has a MD5 hash, and if request contains range header (Range or x-ms-range), this response header is returned with the value of the whole blob's MD5 value. This value may or may not be equal to the value returned in Content-MD5 header, with the latter calculated from the requested range */
  @header("x-ms-blob-content-md5")
  blobContentMd5?: bytes;
};

/** The blob content type parameter. */
alias BlobContentLanguageParameter = {
  /** Optional. Set the blob's content language. If specified, this property is stored with the blob and returned with a read request. */
  @header("x-ms-blob-content-language")
  blobContentLanguage?: string;
};

/** The blob content type parameter. */
alias BlobContentEncodingParameter = {
  /** Optional. Sets the blob's content encoding. If specified, this property is stored with the blob and returned with a read request. */
  @header("x-ms-blob-content-encoding")
  blobContentEncoding?: string;
};

/** The blob content type parameter. */
alias BlobContentTypeParameter = {
  /** Optional. Sets the blob's content type. If specified, this property is stored with the blob and returned with a read request. */
  @header("x-ms-blob-content-type")
  blobContentType?: string;
};

/** The premium page blob access tier types. */
union PremiumPageBlobAccessTier {
  /** The premium page blob access tier is P4. */
  P4: "P4",

  /** The premium page blob access tier is P6. */
  P6: "P6",

  /** The premium page blob access tier is P10. */
  P10: "P10",

  /** The premium page blob access tier is P15. */
  P15: "P15",

  /** The premium page blob access tier is P20. */
  P20: "P20",

  /** The premium page blob access tier is P30. */
  P30: "P30",

  /** The premium page blob access tier is P40. */
  P40: "P40",

  /** The premium page blob access tier is P50. */
  P50: "P50",

  /** The premium page blob access tier is P60. */
  P60: "P60",

  /** The premium page blob access tier is P70. */
  P70: "P70",

  /** The premium page blob access tier is P80. */
  P80: "P80",

  /** Extensible */
  string,
}

/** The type of blob deletions. */
#suppress "@azure-tools/typespec-azure-core/no-enum" "Existing API"
enum BlobDeleteType {
  /** Permanently delete the blob. */
  Permanent: "Permanent",
}

/** The delete snapshots option type. */
#suppress "@azure-tools/typespec-azure-core/no-enum" "Existing API"
enum DeleteSnapshotsOptionType {
  /** The delete snapshots include option is only. */
  Only: "only",

  /** The delete snapshots include option is include. */
  Include: "include",
}

/** The encryption algorithm parameter. */
alias EncryptionAlgorithmParameter = {
  /** Optional.  Version 2019-07-07 and later.  Specifies the algorithm to use for encryption. If not specified, the default is AES256. */
  @header("x-ms-encryption-algorithm")
  encryptionAlgorithm?: EncryptionAlgorithmType;
};

/** The algorithm used to produce the encryption key hash. Currently, the only accepted value is \"AES256\". Must be provided if the x-ms-encryption-key header is provided. */
#suppress "@azure-tools/typespec-azure-core/no-enum" "Existing API"
enum EncryptionAlgorithmType {
  /** The AES256 encryption algorithm. */
  AES256: "AES256",
}

/** The encryption key SHA256 hash parameter. */
alias EncryptionKeySha256Parameter = {
  /** Optional.  Version 2019-07-07 and later.  Specifies the SHA256 hash of the encryption key used to encrypt the data provided in the request. This header is only used for encryption with a customer-provided key. If the request is authenticated with a client token, this header should be specified using the SHA256 hash of the encryption key. */
  @header("x-ms-encryption-key-sha256")
  encryptionKeySha256?: string;
};

/** The encryption key SHA256 response header. */
alias EncryptionKeySha256ResponseHeader = {
  /** The SHA-256 hash of the encryption key used to encrypt the blob. This header is only returned when the blob was encrypted with a customer-provided key. */
  @header("x-ms-encryption-key-sha256")
  encryptionKeySha256?: string;
};

/** The private encryption key SHA256 response header. */
alias EncryptionKeySha256ResponseHeaderPrivate = {
  /** The SHA-256 hash of the encryption key used to encrypt the blob. This header is only returned when the blob was encrypted with a customer-provided key. */
  @access(Access.internal)
  @header("x-ms-encryption-key-sha256")
  encryptionKeySha256?: string;
};

/** The encryption key parameter. */
alias EncryptionKeyParameter = {
  /** Optional.  Version 2019-07-07 and later.  Specifies the encryption key to use to encrypt the data provided in the request. If not specified, the request will be encrypted with the root account key. */
  @header("x-ms-encryption-key")
  encryptionKey?: string;
};

alias AccessTierIfModifiedSinceParameter = {
  /** Specify this header value to operate only on a blob if the access-tier has been modified since the specified date/time. */
  @added(Versions.v2026_04_06)
  @header("x-ms-access-tier-if-modified-since")
  @encode("rfc7231")
  accessTierIfModifiedSince?: utcDateTime;
};

alias AccessTierIfUnmodifiedSinceParameter = {
  /** Specify this header value to operate only on a blob if the access-tier has not been modified since the specified date/time. */
  @added(Versions.v2026_04_06)
  @header("x-ms-access-tier-if-unmodified-since")
  @encode("rfc7231")
  accessTierIfUnmodifiedSince?: utcDateTime;
};

/** The If-Tags parameters. */
alias IfTagsParameter = {
  /** Specify a SQL where clause on blob tags to operate only on blobs with a matching value. */
  @header("x-ms-if-tags")
  ifTags?: string;
};

/** The If-Match parameter. */
alias IfMatchParameter = {
  /** A condition that must be met in order for the request to be processed. */
  @header("If-Match")
  ifMatch?: string;
};

/** The If-None-Match parameter. */
alias IfNoneMatchParameter = {
  /** A condition that must be met in order for the request to be processed. */
  @header("If-None-Match")
  ifNoneMatch?: string;
};

/** The range parameter. */
alias RangeParameter = {
  /** Return only the bytes of the blob in the specified range. */
  @header("Range")
  range?: string;
};

/** The version ID parameter. */
alias VersionIdParameter = {
  /** The version id parameter is an opaque DateTime value that, when present, specifies the version of the blob to operate on. It's for service version 2019-10-10 and newer. */
  @query
  @clientName("versionId")
  versionid?: string;
};

/** The snapshot parameter. */
alias SnapshotParameter = {
  @doc("The snapshot parameter is an opaque DateTime value that, when present, specifies the blob snapshot to retrieve. For more information on working with blob snapshots, see <a href=\"https://docs.microsoft.com/en-us/rest/api/storageservices/fileservices/creating-a-snapshot-of-a-blob\">Creating a Snapshot of a Blob.</a>")
  @query
  snapshot?: string;
};

/** Represents a blob name. */
model BlobName {
  /** Whether the blob name is encoded. */
  @Xml.attribute
  @Xml.name("Encoded")
  encoded?: boolean;

  /** The blob name. */
  @Xml.unwrapped content?: string;
}

/** Represents a blob prefix. */
model BlobPrefix {
  /** The blob name. */
  @Xml.name("Name") name: BlobName;
}

/** Represents an array of blobs. */
model BlobHierarchyListSegment {
  /** The blob items */
  @pageItems
  @Xml.name("Blob")
  @Xml.unwrapped
  blobItems: BlobItemInternal[];

  /** The blob prefixes. */
  @Xml.name("BlobPrefix")
  @Xml.unwrapped
  blobPrefixes?: BlobPrefix[];
}

/** An enumeration of blobs */
@Xml.name("EnumerationResults")
model ListBlobsHierarchySegmentResponse {
  /** The service endpoint. */
  @Xml.attribute
  @Xml.name("ServiceEndpoint")
  serviceEndpoint: string;

  /** The container name. */
  @Xml.attribute
  @Xml.name("ContainerName")
  containerName: string;

  /** The delimiter of the blobs. */
  @Xml.name("Delimiter") delimiter?: string;

  /** The prefix of the blobs. */
  @Xml.name("Prefix") prefix?: string;

  /** The marker of the blobs. */
  @Xml.name("Marker") marker?: string;

  /** The max results of the blobs. */
  @Xml.name("MaxResults") maxResults?: int32;

  /** The blob segment. */
  @Xml.name("Blobs")
  segment: BlobHierarchyListSegment;

  /** The next marker of the blobs. */
  @continuationToken
  @Xml.name("NextMarker")
  nextMarker?: string;
}

/** The list blob includes parameter. */
alias ListBlobsIncludeParameter = {
  /** Include this parameter to specify one or more datasets to include in the response. */
  @query
  include?: ListBlobsIncludeItem[];
};

/** The list blob includes parameter values. */
#suppress "@azure-tools/typespec-azure-core/no-enum" "Existing API"
enum ListBlobsIncludeItem {
  /** The include copies. */
  Copy: "copy",

  /** The include deleted blobs. */
  Deleted: "deleted",

  /** The include metadata. */
  Metadata: "metadata",

  /** The include snapshots. */
  Snapshots: "snapshots",

  /** The include uncommitted blobs. */
  UncommittedBlobs: "uncommittedblobs",

  /** The include versions. */
  Versions: "versions",

  /** The include tags. */
  Tags: "tags",

  /** The include immutable policy. */
  ImmutabilityPolicy: "immutabilitypolicy",

  /** The include legal hold. */
  LegalHold: "legalhold",

  /** The include deleted with versions. */
  DeletedWithVersions: "deletedwithversions",
}

/** The lease duration parameter. */
alias LeaseDurationResponseHeader = {
  /** Specifies the duration of the lease, in seconds, or negative one (-1) for a lease that never expires. A non-infinite lease can be between 15 and 60 seconds. A lease duration cannot be changed using renew or change. */
  @header("x-ms-lease-duration")
  duration?: LeaseDuration;
};

/** The lease duration parameter. */
alias LeaseDurationHeaderParameter = {
  /** Specifies the duration of the lease, in seconds, or negative one (-1) for a lease that never expires. A non-infinite lease can be between 15 and 60 seconds. A lease duration cannot be changed using renew or change. */
  @header("x-ms-lease-duration")
  duration: int32;
};

// NOTE: This does not explicitly let emitters know that this is a collection header for metadata. Logic should be handwritten to handle this.
alias MetadataHeadersParameter = {
  /** The metadata headers. */
  @alternateType(Record<string>, "rust")
  @header("x-ms-meta")
  metadata: string;
};

// NOTE: This does not explicitly let emitters know that this is a collection header for metadata. Logic should be handwritten to handle this.
alias MetadataHeaders = {
  /** The metadata headers. */
  @alternateType(Record<string>, "rust")
  @header("x-ms-meta")
  metadata?: string;
};

// NOTE: this does not explicitly let emitters know that this is a special type of header used for collection of object replication headers. Logic should be handwritten to handle this.
alias ObjectReplicationHeaders = {
  /** Optional. Only valid when Object Replication is enabled for the storage container and on the source blob of the replication. When retrieving this header, it will return the header with the policy id and rule id (e.g. x-ms-or-policyid_ruleid), and the value will be the status of the replication (e.g. complete, failed). */
  @alternateType(Record<string>, "rust")
  @header("x-ms-or")
  objectReplicationRules?: string;
};

/** The If-Unmodified-Since header. */
alias IfUnmodifiedSinceParameter = {
  /** A date-time value. A request is made under the condition that the resource has not been modified since the specified date-time. */
  #suppress "@azure-tools/typespec-azure-core/known-encoding" "Existing API"
  @encode("rfc7231")
  @header("If-Unmodified-Since")
  ifUnmodifiedSince?: utcDateTime;
};

/** The If-Modified-Since header. */
alias IfModifiedSinceParameter = {
  /** A date-time value. A request is made under the condition that the resource has been modified since the specified date-time. */
  #suppress "@azure-tools/typespec-azure-core/known-encoding" "Existing API"
  @encode("rfc7231")
  @header("If-Modified-Since")
  ifModifiedSince?: utcDateTime;
};

/** The filter blobs include parameter. */
alias FilterBlobsIncludeParameter = {
  /** Include this parameter to specify one or more datasets to include in the response. */
  @query
  include?: FilterBlobsIncludeItem[];
};

/** The filter blobs where parameter. */
alias FilterBlobsWhereParameter = {
  /** Filters the results to return only to return only blobs whose tags match the specified expression. */
  @query
  @clientName("filterExpression")
  where: string;
};

/** The Content-Length header. */
alias ContentLengthParameter = {
  /** The length of the request. */
  @header("Content-Length") contentLength: int64;
};

/** The max results parameter. */
alias MaxResultsParameter = {
  /** Specifies the maximum number of containers to return. If the request does not specify maxresults, or specifies a value greater than 5000, the server will return up to 5000 items. */
  @query
  @minValue(1)
  maxresults?: int32;
};

/** The marker parameter. */
alias MarkerParameter = {
  /** A string value that identifies the portion of the list of containers to be returned with the next listing operation. The operation returns the NextMarker value within the response body if the listing operation did not return all containers remaining to be listed with the current page. The NextMarker value can be used as the value for the marker parameter in a subsequent call to request the next page of list items. The marker value is opaque to the client. */
  @continuationToken
  @query
  marker?: string;
};

/** The prefix parameter. */
alias PrefixParameter = {
  /** Filters the results to return only containers whose name begins with the specified prefix. */
  @query prefix?: string;
};

/** The timeout parameter. */
alias TimeoutParameter = {
  @doc("The timeout parameter is expressed in seconds. For more information, see <a href=\"https://docs.microsoft.com/en-us/rest/api/storageservices/fileservices/setting-timeouts-for-blob-service-operations\">Setting Timeouts for Blob Service Operations.</a>")
  @query
  @minValue(0)
  timeout?: int32;
};

/** The required lease ID header. */
alias ProposedLeaseIdRequiredParameter = {
  /** Required.  The proposed lease ID for the container. */
  @header("x-ms-proposed-lease-id") proposedLeaseId: string;
};

/** The optional lease ID header. */
alias ProposedLeaseIdOptionalParameter = {
  /** Optional.  The proposed lease ID for the container. */
  @header("x-ms-proposed-lease-id") proposedLeaseId?: string;
};

/** The body parameter. */
alias BodyParameter = {
  /** The body of the request. */
  @body
  body: bytes;
};

/** The multipart body parameter. */
alias MultipartBodyParameter = {
  /** The body of the request. */
  @multipartBody body: {
    name: HttpPart<string>;
    body: HttpPart<bytes>;
  };
};

alias IsHierarchicalNamespaceEnabled = {
  /** Version 2019-07-07 and newer. Indicates if the account has a hierarchical namespace enabled. */
  @header("x-ms-is-hns-enabled")
  isHierarchicalNamespaceEnabled?: boolean;
};

alias StructuredBodyTypeResponseHeader = {
  /** Indicates the response body contains a structured message and specifies the message schema version and properties. */
  @access(Access.internal)
  @header("x-ms-structured-body")
  structuredBodyType?: string;
};

alias StructuredContentLengthParameter = {
  /** Required if the request body is a structured message. Specifies the length of the blob/file content inside the message body. Will always be smaller than Content-Length. */
  @header("x-ms-structured-content-length")
  structuredContentLength?: int64;
};

alias StructuredContentLengthResponseHeader = {
  /** The length of the blob/file content inside the message body when the response body is returned as a structured message. Will always be smaller than Content-Length. */
  @access(Access.internal)
  @header("x-ms-structured-content-length")
  structuredContentLength?: int64;
};

alias StructuredBodyParameter = {
  /** Required if the request body is a structured message. Specifies the message schema version and properties. */
  @access(Access.internal)
  @header("x-ms-structured-body")
  structuredBodyType?: string;
};

/** The file share token intent types. */
union FileShareTokenIntent {
  /** The file share token intent is backup. */
  Backup: "backup",

  /** Extensible */
  string,
}

alias FileRequestIntentParameter = {
  /** Valid value is backup */
  @header("x-ms-file-request-intent")
  fileRequestIntent?: FileShareTokenIntent;
};

alias ClientRequestIdHeader = {
  @access(Access.internal)
  @header("x-ms-client-request-id")
  @doc("An opaque, globally-unique, client-generated string identifier for the request.")
  clientRequestId?: uuid;
};

alias RequestIdResponseHeader = {
  @access(Access.internal)
  @visibility(Lifecycle.Read)
  @header("x-ms-request-id")
  @doc("An opaque, globally-unique, server-generated string identifier for the request.")
  requestId?: uuid;
};

alias LeaseActionParameter<TAction extends string> = {
  /** Describes what lease action to take. */
  @header("x-ms-lease-action")
  action: TAction;
};

alias PageWriteParameter<TPageWrite extends string> = {
  /** Required. You may specify one of the following options:\n  - Update: Writes the bytes specified by the request body into the specified range. The Range and Content-Length headers must match to perform the update.\n  - Clear: Clears the specified range and releases the space used in storage for that range. To clear a range, set the Content-Length header to zero, and the Range header to a value that indicates the range to clear, up to maximum blob size. */
  @header("x-ms-page-write")
  pageWrite: TPageWrite;
};

alias IfBlobMatchHeader = {
  /** Specify an ETag value to operate only on blobs with a matching value. */
  @added(Versions.v2026_02_06)
  @header("x-ms-blob-if-match")
  ifMatch?: string;
};

alias IfBlobModifiedSinceHeader = {
  /** Specify this header value to operate only on a blob if it has been modified since the specified date/time. */
  @added(Versions.v2026_02_06)
  @header("x-ms-blob-if-modified-since")
  @encode("rfc7231")
  ifModifiedSince?: utcDateTime;
};

alias IfBlobNoneMatchHeader = {
  /** Specify an ETag value to operate only on blobs without a matching value. */
  @added(Versions.v2026_02_06)
  @header("x-ms-blob-if-none-match")
  ifNoneMatch?: string;
};

alias IfBlobUnmodifiedSinceHeader = {
  /** Specify this header value to operate only on a blob if it has not been modified since the specified date/time. */
  @added(Versions.v2026_02_06)
  @header("x-ms-blob-if-unmodified-since")
  @encode("rfc7231")
  ifUnmodifiedSince?: utcDateTime;
};

alias ListBlobsStartFrom = {
  /** Specifies the relative path to list paths from. For non-recursive list, only one entity level is supported; For recursive list, multiple entity levels are supported. (Inclusive) */
  @added(Versions.v2026_02_06)
  @query
  startFrom?: string;
};
