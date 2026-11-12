import "@typespec/rest";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

@service(#{ title: "RequestHeaders" })
namespace TspTest.RequestHeaders;

enum MetadataValue {
  High: 100,
  Low: 0,
}

model MetadataHeaders {
  @header("x-ms-meta") metadata?: string;
  @header("x-ms-priority") priorities?: int32;
}

@encode("base64url")
scalar UrlSafeBytes extends bytes;

model ByteMetadataHeaders {
  @header("x-ms-meta") metadata?: bytes;
  @header("x-ms-url-meta") urlMetadata?: UrlSafeBytes;
}

@route("/request-headers")
interface RequestHeaderOps {
  @post
  send(...MetadataHeaders): void;

  @post
  @route("/byte-collections")
  sendByteCollections(...ByteMetadataHeaders): void;

  @post
  @route("/bytes")
  sendBytes(
    @header("Content-MD5") contentMD5?: bytes,
    @header("x-ms-content-md5") xMsContentMD5?: bytes,
    @header("x-ms-source-content-crc64") xMsSourceContentCrc64?: bytes,
    @query data?: bytes,
    @header("x-ms-url") @encode("base64url") url?: bytes,
  ): void;
}

@@alternateType(MetadataHeaders.metadata, Record<string>, "java");
@@clientOption(MetadataHeaders.metadata, "collectionHeaderPrefix", "x-ms-meta-", "java");
@@alternateType(MetadataHeaders.priorities, Record<MetadataValue>, "java");
@@clientOption(MetadataHeaders.priorities, "collectionHeaderPrefix", "x-ms-priority-", "java");
@@alternateType(ByteMetadataHeaders.metadata, Record<bytes>, "java");
@@clientOption(ByteMetadataHeaders.metadata, "collectionHeaderPrefix", "x-ms-meta-", "java");
@@alternateType(ByteMetadataHeaders.urlMetadata, Record<UrlSafeBytes>, "java");
@@clientOption(ByteMetadataHeaders.urlMetadata, "collectionHeaderPrefix", "x-ms-url-meta-", "java");
