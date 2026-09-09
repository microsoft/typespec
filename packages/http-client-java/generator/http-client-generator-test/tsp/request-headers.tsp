import "@typespec/rest";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

@service(#{ title: "RequestHeaders" })
namespace TspTest.RequestHeaders;

model MetadataHeaders {
  @header("x-ms-meta") metadata?: string;
}

@route("/request-headers")
interface RequestHeaderOps {
  @post
  send(...MetadataHeaders): void;
}

@@alternateType(MetadataHeaders.metadata, Record<string>, "java");
@@clientOption(MetadataHeaders.metadata, "collectionHeaderPrefix", "x-ms-meta-", "java");
