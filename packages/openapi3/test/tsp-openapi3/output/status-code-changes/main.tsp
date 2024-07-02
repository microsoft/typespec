import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using OpenAPI;

@service({
  title: "(title)",
})
@info({
  version: "0.0.0",
})
namespace title;

model Pet {
  name: string;
}

/**
 * The request has succeeded.
 */
model extensive200ApplicationJsonResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: Pet;
}

/**
 * Client error
 */
@error
model extensive4XXResponse {
  @statusCode
  @minValue(400)
  @maxValue(499)
  statusCode: int32;
}

/**
 * Server error
 */
@error
model extensive5XXResponse {
  @statusCode
  @minValue(500)
  @maxValue(599)
  statusCode: int32;
}

@route("/") @get op extensive(
): extensive200ApplicationJsonResponse | extensive4XXResponse | extensive5XXResponse;
