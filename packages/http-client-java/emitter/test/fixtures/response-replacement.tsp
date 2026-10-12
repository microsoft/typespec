import "@typespec/http";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

@service
namespace ResponseReplacement;

model Widget {
  name: string;
}

model WidgetResponse {
  @statusCode statusCode: 200;
  @header("x-response-id") responseId: string;
  @body body: Widget;
}

model EncodedBytesResponse {
  @header contentType: "application/json";
  @body body: bytes;
}

@error
model ErrorResponse {
  @statusCode statusCode: 400;
  message: string;
}

@post
@route("/void")
op voidResponse(): WidgetResponse | ErrorResponse;

@get
@route("/bytes")
op bytesResponse(): WidgetResponse | ErrorResponse;

@get
@route("/widget")
op widgetResponse(): Widget;

@get
@route("/encoded-bytes")
op encodedBytesResponse(): EncodedBytesResponse;

@get
@route("/parameter-override")
op parameterOverrideBytesResponse(
  @query first: string,
  @query second: string,
): EncodedBytesResponse;

#suppress "@azure-tools/typespec-client-generator-core/override-response-replacement" "Testing a void response replacement."
@@override(voidResponse, replaceResponseWithVoid(voidResponse));

#suppress "@azure-tools/typespec-client-generator-core/override-response-replacement" "Testing a raw bytes response replacement."
@@override(bytesResponse, replaceResponseWithBytes(bytesResponse));

#suppress "@azure-tools/typespec-client-generator-core/override-response-replacement" "Testing replacement of encoded bytes with raw bytes."
@@override(encodedBytesResponse, replaceResponseWithBytes(encodedBytesResponse));

@@override(
  parameterOverrideBytesResponse,
  reorderParameters(parameterOverrideBytesResponse, #["second", "first"])
);
