import "@typespec/rest";
import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Versioning;
using Azure.Core;
using Azure.Core.Traits;
using Azure.ClientGenerator.Core;

@service(#{ title: "Response" })
@versioned(ApiVersions)
namespace TspTest.Response;

enum ApiVersions {
  @useDependency(global.Azure.Core.Versions.v1_0_Preview_2)
  v2022_06_01_preview: "2022-06-01-preview",
}

@Foundations.Private.needsRoute
op RpcOperationWithAdditionalResponse<
  TParams,
  TResponse extends TypeSpec.Reflection.Model,
  TAdditionalResponse extends {},
  Traits extends {} = {},
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
  @visibility(Lifecycle.Read)
  id: string;

  @key
  @visibility(Lifecycle.Read)
  name: string;

  description?: string;
  type: string;
}

model ResourceArray is Resource[];

// no "id" property
model OperationDetails1 {
  @doc("Operation ID")
  @key
  @visibility(Lifecycle.Create, Lifecycle.Read)
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
  @visibility(Lifecycle.Create, Lifecycle.Read)
  id: uuid;

  status: Azure.Core.Foundations.OperationState;
  error?: Azure.Core.Foundations.Error;

  @lroResult
  @clientName("longRunningResult", "java")
  @encodedName("application/json", "lro_result")
  lroResult?: Resource;
}

model StringsList {
  @pageItems
  @clientName("items", "java")
  @encodedName("application/json", "items_value")
  value: string[];

  @nextLink
  @clientName("nextLink", "java")
  @encodedName("application/json", "next_link")
  next?: string;
}

model Int32sList {
  @pageItems
  value: int32[];
}

model DateTimesList {
  @pageItems
  value: utcDateTime[];
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
  service: TspTest.Response,
})
@doc("Response")
@route("/response")
interface ResponseOp {
  // file as BinaryData
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

  // expect boolean response, true for 200, false for 404
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
  // expect final result be OperationDetails1, as the response does not follow the standard
  @route("/lro-invalid-poll-response")
  lroInvalidPollResponse is CustomLongRunningOperation<
    {
      @body request: Resource;
    },
    OperationDetails1
  >;

  // OperationDetails does not have "result" property
  // expect final result be OperationDetails2, as the response does not follow the standard
  @route("/lro-invalid-result")
  lroInvalidResult is CustomLongRunningOperation<
    {
      @body request: Resource;
    },
    OperationDetails2
  >;

  @route("/paged-string")
  @list
  listStrings(): StringsList;

  @route("/paged-int32")
  @list
  listIntegers(): Int32sList;

  // @route("/paged-datetime")
  // @list
  // listDateTimes(): DateTimesList;

  @route("/json-utf8-response")
  getJsonUtf8Response(): Resource & {
    @header contentType: "application/json;charset=utf-8";
  };

  // expect same method signature as "application/json"
  @route("/plus-json-response")
  getPlusJsonResponse(): Resource & {
    @header contentType: "application/vnd.microsoft.appconfig.kv+json";
  };

  // expect BinaryData as response
  @route("/union-response")
  getUnionResponse(): OperationDetails1 | OperationDetails2;
}
