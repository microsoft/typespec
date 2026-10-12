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

model NoContentResponse {
  @statusCode statusCode: 204;
  @header("x-response-id") responseId: string;
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

@get
@route("/parameter-override-optional")
op parameterOverrideOptionalBytesResponse(@query first: string, @query second: string):
  | EncodedBytesResponse
  | NoContentResponse;

@get
@route("/optional-bytes")
op optionalBytesResponse(): EncodedBytesResponse | NoContentResponse;

@get
@route("/optional-void")
op optionalVoidResponse(): WidgetResponse | NoContentResponse;

@get
@route("/bodyless-bytes")
op bodylessBytesResponse(): NoContentResponse | ErrorResponse;

#suppress "@typespec/http-client-java/bytes-response-replacement-without-body" "Testing suppression of a bodyless replacement warning."
@get
@route("/suppressed-bodyless-bytes")
op suppressedBodylessBytesResponse(): NoContentResponse;

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

@@override(
  parameterOverrideOptionalBytesResponse,
  reorderParameters(parameterOverrideOptionalBytesResponse, #["second", "first"])
);

#suppress "@azure-tools/typespec-client-generator-core/override-response-replacement" "Testing replacement of optional encoded bytes."
@@override(optionalBytesResponse, replaceResponseWithBytes(optionalBytesResponse));

#suppress "@azure-tools/typespec-client-generator-core/override-response-replacement" "Testing replacement of an optional response with void."
@@override(optionalVoidResponse, replaceResponseWithVoid(optionalVoidResponse));

#suppress "@azure-tools/typespec-client-generator-core/override-response-replacement" "Testing a bodyless bytes replacement."
@@override(bodylessBytesResponse, replaceResponseWithBytes(bodylessBytesResponse));

#suppress "@azure-tools/typespec-client-generator-core/override-response-replacement" "Testing suppression of a bodyless replacement warning."
@@override(
  suppressedBodylessBytesResponse,
  replaceResponseWithBytes(suppressedBodylessBytesResponse)
);
