import "@typespec/http";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

@service
namespace ResponseReplacementHeaders;

enum ResponseState {
  ready,
  waiting,
}

enum BodyState {
  pending,
  complete,
}

model OriginalBody {
  state: BodyState;
}

model OriginalResponse {
  @statusCode statusCode: 200;
  @header("x-response-state") state: ResponseState;
  @body body: OriginalBody;
}

@get
@route("/void")
op voidResponse(): OriginalResponse;

@get
@route("/bytes")
op bytesResponse(): OriginalResponse;

#suppress "@azure-tools/typespec-client-generator-core/override-response-replacement" "Testing a void response replacement with typed headers."
@@override(voidResponse, replaceResponseWithVoid(voidResponse));

#suppress "@azure-tools/typespec-client-generator-core/override-response-replacement" "Testing a bytes response replacement with typed headers."
@@override(bytesResponse, replaceResponseWithBytes(bytesResponse));
