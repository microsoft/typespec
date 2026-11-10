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

@route("/request-headers")
interface RequestHeaderOps {
  @post
  send(...MetadataHeaders): void;
}

@@alternateType(MetadataHeaders.metadata, Record<string>, "java");
@@clientOption(MetadataHeaders.metadata, "collectionHeaderPrefix", "x-ms-meta-", "java");
@@alternateType(MetadataHeaders.priorities, Record<MetadataValue>, "java");
@@clientOption(MetadataHeaders.priorities, "collectionHeaderPrefix", "x-ms-priority-", "java");
