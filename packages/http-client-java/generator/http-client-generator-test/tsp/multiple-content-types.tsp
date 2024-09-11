import "@typespec/rest";
import "@typespec/http";
import "@azure-tools/typespec-client-generator-core";

using TypeSpec.Http;
using Azure.ClientGenerator.Core;

@service({
  title: "MultiContentTypes",
})
namespace Cadl.MultiContentTypes;

model Resource {
  @visibility("read")
  id: string;

  @key
  @visibility("read")
  name: string;
}

@route("/single/request")
interface SingleContentType {
  @doc("response is binary")
  @route("/download/image")
  @get
  downloadImageForSingleContentType(): OkResponse & {
    @header("content-type") contentType: "image/png";
    @body data: bytes;
  };

  @doc("request is binary")
  @route("/upload/image")
  @post
  uploadImageForSingleContentType(@body data: bytes, @header contentType: "image/png"): void;
}

@route("multiple/sharedroute/request")
interface MultipleContentTypesOnRequest {
  @doc("one data type maps to multiple content types")
  @route("upload/single-body-type")
  @post
  uploadBytesWithSingleBodyTypeForMultiContentTypes(
    @body data: bytes,
    @header contentType:
      | "application/octet-stream"
      | "image/jpeg"
      | "image/png"
      | "application/json-patch+json",
  ): void;

  @doc("multiple data types map to multiple content types using shared route")
  @route("upload/multi-body-types")
  @sharedRoute
  @post
  uploadBytesWithMultiBodyTypesForMultiContentTypes(
    @body data: bytes,
    @header contentType: "application/octet-stream" | "image/jpeg" | "image/png",
  ): void;

  @doc("multiple data types map to multiple content types using shared route")
  @route("upload/multi-body-types")
  @sharedRoute
  @post
  uploadJsonWithMultiBodyTypesForMultiContentTypes(
    @body data: Resource,
    @header contentType: "application/json",
  ): void;

  @doc("multiple data types map to multiple content types using shared route")
  @route("upload/multi-body-types")
  @sharedRoute
  @post
  uploadJsonOrBytesWithMultiBodyTypesForMultiContentTypes(
    @body data: bytes | Resource,
    @header contentType:
      | "application/json"
      | "application/octet-stream"
      | "image/jpeg"
      | "image/png",
  ): void;
}

// @route("multiple/sharedroute/response")
// interface MultipleContentTypesOnResponse {
//   @doc("multiple content types map to one response type")
//   @route("upload/single-response-type")
//   @post
//   uploadBytesWithSingleResponseTypeForMultiContentTypes(@body data: bytes, @header contentType: "application/octet-stream" | "image/jpeg" | "image/png"): bytes;

//   @doc("multiple content types map to multiple response types using shared route")
//   @route("upload/multi-response-types")
//   @sharedRoute
//   @post
//   uploadIntOrResourceWithMultiResponseTypesForMultiContentTypes(@body data: Resource | int32, @header contentType: "application/octet-stream" | "application/json"): Resource | int32;

//   @doc("multiple data types map to multiple content types using shared route")
//   @route("upload/multi-response-types")
//   @sharedRoute
//   @post
//   uploadResourceWithSingleBodyTypesForMultiContentTypes(@body data: Resource, @header contentType: "application/json"): Resource;

// }

// overload
@doc("multiple data types map to multiple content types")
@route("upload/overload/multi-body-types")
@post
op uploadWithOverload(
  @body data: string | bytes | Resource,
  @header contentType:
    | "text/plain"
    | "application/json"
    | "application/octet-stream"
    | "image/jpeg"
    | "image/png",
): void;

@doc("multiple data types map to multiple content types")
@route("upload/overload/multi-body-types")
@post
@overload(uploadWithOverload)
op uploadStringWithOverload(@body data: string, @header contentType: "text/plain"): void;

@doc("multiple data types map to multiple content types using `@overload`")
@route("upload/overload/multi-body-types")
@post
@overload(uploadWithOverload)
op uploadImagesWithOverload(
  @body data: bytes,
  @header contentType: "image/jpeg" | "image/png",
): void;

@doc("multiple data types map to multiple content types using `@overload`")
@route("upload/overload/multi-body-types")
@post
@overload(uploadWithOverload)
op uploadBytesOrJsonWithOverload(
  @body data: bytes | Resource,
  @header contentType: "application/octet-stream" | "image/jpeg" | "image/png" | "application/json",
): void;
