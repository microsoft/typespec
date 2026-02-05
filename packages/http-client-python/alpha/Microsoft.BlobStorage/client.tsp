import "@azure-tools/typespec-client-generator-core";
import "./main.tsp";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;
using Storage.Blob;

namespace Customizations;

@@clientNamespace(Storage.Blob, "Azure.Storage.Blobs");
@@clientNamespace(Storage.Blob.Container, "Azure.Storage.Blobs");
@@clientNamespace(Storage.Blob.Blob, "Azure.Storage.Blobs");
@@clientNamespace(Storage.Blob.AppendBlob, "Azure.Storage.Blobs");
@@clientNamespace(Storage.Blob.BlockBlob, "Azure.Storage.Blobs");
@@clientNamespace(Storage.Blob.PageBlob, "Azure.Storage.Blobs");

@@clientName(Storage.Blob.Service, "BlobServiceClient", "rust");
@@clientName(Storage.Blob.Container, "BlobContainerClient", "rust");
@@clientName(Storage.Blob.Blob, "BlobClient", "rust");
@@clientName(Storage.Blob.AppendBlob, "AppendBlobClient", "rust");
@@clientName(Storage.Blob.BlockBlob, "BlockBlobClient", "rust");
@@clientName(Storage.Blob.PageBlob, "PageBlobClient", "rust");

@@clientName(ContainerProperties.denyEncryptionScopeOverride,
  "PreventEncryptionScopeOverride"
);
@@clientName(ContainerProperties.immutableStorageWithVersioningEnabled,
  "IsImmutableStorageWithVersioningEnabled"
);
@@clientName(BlobPropertiesInternal.expiryTime, "ExpiresOn");
@@clientName(BlobPropertiesInternal.sealed, "IsSealed");
@@clientName(BlobPropertiesInternal.lastAccessTime, "LastAccessedOn");
@@clientName(BlobPropertiesInternal.immutabilityPolicyUntilDate,
  "ImmutabilityPolicyExpiresOn"
);
@@clientName(MetadataHeaders.metadata, "metadata", "rust");
@@clientName(ObjectReplicationHeaders.objectReplicationRules,
  "objectReplicationRules",
  "rust"
);
@@clientName(ImmutabilityPolicyExpiryRequiredParameter.immutabilityPolicyExpiry,
  "expiry"
);

@@alternateType(AccessPolicy.start, string, "javascript");
@@alternateType(AccessPolicy.expiry, string, "javascript");
@@clientName(AccessPolicy.start, "startsOn", "javascript");
@@clientName(AccessPolicy.expiry, "expiresOn", "javascript");
@@clientName(AccessPolicy.permission, "permissions", "javascript");
@@clientName(BlobPropertiesInternal.accessTierChangeTime,
  "accessTierChangedOn",
  "javascript"
);
@@clientName(BlobPropertiesInternal.creationTime, "createdOn", "javascript");
@@clientName(BlobPropertiesInternal.copyCompletionTime,
  "copyCompletedOn",
  "javascript"
);
@@clientName(BlobPropertiesInternal.deletedTime, "deletedOn", "javascript");
@@clientName(BlobPropertiesInternal.eTag, "etag", "javascript");
@@clientName(ContainerProperties.deletedTime, "deletedOn", "javascript");
@@clientName(ContainerProperties.eTag, "etag", "javascript");
@@clientName(EtagResponseHeader.eTag, "etag", "javascript");
@@clientName(GeoReplication.lastSyncTime, "lastSyncOn", "javascript");
@@clientName(KeyInfo.start, "startsOn", "javascript");
@@clientName(KeyInfo.expiry, "expiresOn", "javascript");
@@clientName(BlobServiceProperties.logging,
  "blobAnalyticsLogging",
  "javascript"
);
@@clientName(Logging.delete, "deleteProperty", "javascript");
@@clientName(UserDelegationKey.signedOid, "signedObjectId", "javascript");
@@clientName(UserDelegationKey.signedTid, "signedTenantId", "javascript");
@@clientName(UserDelegationKey.signedStart, "signedStartsOn", "javascript");
@@clientName(UserDelegationKey.signedExpiry, "signedExpiresOn", "javascript");

@@alternateType(BlobPropertiesInternal.contentLength, uint64, "rust");
@@alternateType(BlobContentLengthRequired.size, uint64, "rust");
@@alternateType(ContentLengthResponseHeader.contentLength, uint64, "rust");
@@alternateType(ContentLengthParameter.contentLength, uint64, "rust");
@@alternateType(StructuredContentLengthParameter.structuredContentLength,
  uint64,
  "rust"
);
@@alternateType(StructuredContentLengthResponseHeader.structuredContentLength,
  uint64,
  "rust"
);

@@scope(Storage.Blob.Container.submitBatch, "!rust");
@@scope(Storage.Blob.Service.submitBatch, "!rust");

@@clientName(BlobPropertiesInternal, "BlobProperties", "go");
@@clientName(BlobItemInternal, "BlobItem", "go");
@@clientName(UserDelegationKey.signedOid, "SignedOID", "go");
@@clientName(UserDelegationKey.signedTid, "SignedTID", "go");
@@alternateType(AccessPolicy.start, utcDateTime, "go");
@@alternateType(AccessPolicy.expiry, utcDateTime, "go");
@@alternateType(BlobItemInternal.name, string, "go");
@@alternateType(BlobPrefix.name, string, "go");

@@alternateType(AccessPolicy.start, string, "python");
@@alternateType(AccessPolicy.expiry, string, "python");

@@clientName(QueryType, "QueryFormatType", "python");
@@clientName(Storage.Blob.BlockBlob.uploadBlobFromUrl,
  "putBlobFromUrl",
  "python"
);
@@clientName(BlobServiceProperties, "StorageServiceProperties", "python");
@@clientName(Storage.Blob.Blob.setProperties, "setHttpHeaders", "python");
@@clientName(Storage.Blob.PageBlob.setSequenceNumber,
  "updateSequenceNumber",
  "python"
);
@@clientName(Storage.Blob.Service.findBlobsByTags, "filterBlobs", "python");
@@clientName(Storage.Blob.Container.findBlobsByTags, "filterBlobs", "python");

@@alternateType(BlockIdParameter.blockid, string, "python");

@@Legacy.disablePageable(Storage.Blob.Container.listBlobFlatSegment,
  "python,javascript"
);
@@Legacy.disablePageable(Storage.Blob.Container.listBlobHierarchySegment,
  "python,javascript"
);
@@Legacy.disablePageable(Storage.Blob.Service.listContainersSegment,
  "python,javascript"
);


/** Parameter group for lease access conditions */
model LeaseAccessConditions {
  /** If specified, the operation only succeeds if the resource's lease is active and matches this ID. */
  leaseId?: string;
}

/** Parameter group for modified access conditions */
model ModifiedAccessConditions {
  /** Specify this header value to operate only on a blob if it has been modified since the specified date/time. */
  ifModifiedSince?: utcDateTime;

  /** Specify this header value to operate only on a blob if it has not been modified since the specified date/time. */
  ifUnmodifiedSince?: utcDateTime;

  /** Specify an ETag value to operate only on blobs with a matching value. */
  ifMatch?: string;

  /** Specify an ETag value to operate only on blobs without a matching value. */
  ifNoneMatch?: string;

  /** Specify a SQL where clause on blob tags to operate only on blobs with a matching value. */
  ifTags?: string;
}

/** Parameter group for customer-provided encryption key information */
model CpkInfo {
  /** The encryption key. */
  encryptionKey?: string;

  /** The SHA-256 hash of the encryption key. */
  encryptionKeySha256?: string;

  /** The algorithm used to produce the encryption key hash. */
  encryptionAlgorithm?: EncryptionAlgorithmType;
}

/** Custom download operation with grouped parameters for Python SDK */
op downloadCustom(

  /** Specifies the version of the operation to use for this request. */
  @apiVersion
  @access(Access.internal)
  @header("x-ms-version")
  version: string,

  ...SnapshotParameter,

  ...VersionIdParameter,
  ...TimeoutParameter,
  ...RangeParameter,

  /** When set to true and specified together with the Range, the service returns the MD5 hash for the range, as long as the range is less than or equal to 4 MB in size. */
  @header("x-ms-range-get-content-md5")
  rangeGetContentMd5?: boolean,

  /** Optional.  When this header is set to true and specified together with the Range header, the service returns the CRC64 hash for the range, as long as the range is less than or equal to 4 MB in size. */
  @header("x-ms-range-get-content-crc64")
  rangeGetContentCrc64?: boolean,

  /** Specifies the response content should be returned as a structured message and specifies the message schema version and properties. */
  @access(Access.internal)
  @header("x-ms-structured-body")
  structuredBodyType?: string,

  cpkInfo?: CpkInfo,
  modifiedAccessConditions?: ModifiedAccessConditions,
  leaseAccessConditions?: LeaseAccessConditions,
): void;

@@override(Storage.Blob.Blob.download, downloadCustom, "python");