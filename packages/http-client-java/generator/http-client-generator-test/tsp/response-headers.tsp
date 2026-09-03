import "@typespec/rest";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

@service(#{ title: "ResponseHeaders" })
namespace TspTest.ResponseHeaders;

@route("/response-headers")
interface ResponseHeaderOp {
  // HEAD operation with significant response headers but no response body.
  // Opts in (via "responseHeadersAsModel" client option) to return the strongly-typed
  // response-headers model from the convenience method, instead of "void".
  @route("/resource-metadata")
  @head
  getResourceMetadata(): {
    @statusCode statusCode: 200;

    // constant headers are omitted from the generated response headers model
    @header("x-constant-header") constantHeader: "constant-value";

    // required header, with mixed-case header name
    @header("ETag") eTag: string;

    // required header
    @header("x-resource-count") resourceCount: int32;

    // optional header, with mixed-case header name
    @header("Last-Modified") lastModified?: utcDateTime;
  };
}

@@clientOption(ResponseHeaderOp.getResourceMetadata, "responseHeadersAsModel", true, "java");
