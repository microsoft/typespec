import "@typespec/rest";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Versioning;
using Azure.Core;
using Azure.Core.Traits;
using Azure.ClientGenerator.Core;

@service({
  title: "Response",
})
@versioned(ApiVersions)
namespace Cadl.Response;

enum ApiVersions {
  @useDependency(global.Azure.Core.Versions.v1_0_Preview_2)
  v2022_06_01_preview: "2022-06-01-preview",
}

@Foundations.Private.needsRoute
op RpcOperationWithAdditionalResponse<
  TParams,
  TResponse extends TypeSpec.Reflection.Model,
  TAdditionalResponse extends object,
  Traits extends object = {},
  TErrorResponse = Azure.Core.Foundations.ErrorResponse
> is Foundations.Operation<
  TParams & Azure.Core.Traits.Private.TraitProperties<Traits, TraitLocation.Parameters>,
  (TResponse &
    Azure.Core.Traits.Private.TraitProperties<
      Traits,
      TraitLocation.Response
    >) | TAdditionalResponse,
  Traits,
  TErrorResponse
>;

@resource("resources")
model Resource {
  @visibility("read")
  id: string;

  @key
  @visibility("read")
  name: string;

  description?: string;
  type: string;
}

model ResourceArray is Resource[];

// no "id" property
model OperationDetails1 {
  @doc("Operation ID")
  @key
  @visibility("read", "create")
  operationId: uuid;

  status: Azure.Core.Foundations.OperationState;
  error?: Azure.Core.Foundations.Error;

  @lroResult
  result?: Resource;
}

// no "result" property
model OperationDetails2 {
  @doc("Operation ID")
  @key
  @visibility("read", "create")
  id: uuid;

  status: Azure.Core.Foundations.OperationState;
  error?: Azure.Core.Foundations.Error;

  @lroResult
  lroResult?: Resource;
}

@pagedResult
model StringsList {
  @items
  value: string[];

  @nextLink
  nextLink?: string;
}

@pagedResult
model Int32sList {
  @items
  value: int32[];

  @nextLink
  nextLink?: string;
}

@pagedResult
model DateTimesList {
  @items
  value: utcDateTime[];

  @nextLink
  nextLink?: string;
}

op CustomLongRunningOperation<
  TParams extends TypeSpec.Reflection.Model,
  TResponse extends TypeSpec.Reflection.Model
> is Foundations.Operation<
  TParams,
  AcceptedResponse & {
    @pollingLocation
    @header("Operation-Location")
    operationLocation: ResourceLocation<TResponse>;
  }
>;

@Azure.ClientGenerator.Core.client({
  name: "ResponseClient",
  service: Cadl.Response,
})
@doc("Response")
@route("/response")
interface ResponseOp {
  // binary
  @route("/get-binary")
  @get
  getBinary(): OkResponse & {
    @header("content-type") contentType: "image/png";
    @body body: bytes;
  };

  @route("/get-array")
  getArray(): ResourceArray;

  @route("/get-another-array")
  getAnotherArray(): ResourceArray;

  // response with headers
  @route("/create-with-headers")
  @put
  createWithHeaders(): CreatedResponse & {
    @header("operation-location")
    operationLocation: ResourceLocation<Resource>;

    @body
    body: Resource;
  };

  @route("/delete-with-headers")
  @delete
  deleteWithHeaders(): NoContentResponse & {
    @header("operation-location")
    operationLocation: ResourceLocation<Resource>;
  };

  @route("/exists")
  @head
  exists is RpcOperationWithAdditionalResponse<
    {},
    {
      @doc("A response containing headers related to the Job Schedule, if it exists.")
      @statusCode
      code: "200";
    },
    {
      @doc("A response containing headers related to the Job Schedule, if it exists.")
      @statusCode
      code: "404";
    },
    {},
    Foundations.ErrorResponse
  >;

  // OperationDetails does not have "id" property
  @route("/lro-invalid-poll-response")
  lroInvalidPollResponse is CustomLongRunningOperation<
    {
      @body request: Resource;
    },
    OperationDetails1
  >;

  // OperationDetails does not have "result" property
  @route("/lro-invalid-result")
  lroInvalidResult is CustomLongRunningOperation<
    {
      @body request: Resource;
    },
    OperationDetails2
  >;

  @route("/paged-string")
  listStrings(): StringsList;

  @route("/paged-int32")
  listIntegers(): Int32sList;

  // @route("/paged-datetime")
  // listDateTimes(): DateTimesList;

  @route("/json-utf8-response")
  getJsonUtf8Response(): Resource & {
    @header contentType: "application/json;charset=utf-8";
  };

  @route("/plus-json-response")
  getPlusJsonResponse(): Resource & {
    @header contentType: "application/vnd.microsoft.appconfig.kv+json";
  };
}
