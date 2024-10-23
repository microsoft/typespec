import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using OpenAPI;

@service({
  title: "OneAnyAll Service",
})
@info({
  version: "0.0.0",
})
namespace OneAnyAllService;

model Cat {
  ...Pet;
  hunts: boolean;
}

model Dog {
  ...Pet;
  bark: boolean;
  breed: "Husky" | "Corgi" | "Terrier";
}

model Pet {
  age: int32;
}

/**
 * There is no content to send for this request, but the headers may be useful.
 */
model putAny204Response {
  @statusCode statusCode: 204;
}

/**
 * There is no content to send for this request, but the headers may be useful.
 */
model putOne204Response {
  @statusCode statusCode: 204;
}

@route("/any") @post op putAny(
  @bodyRoot body: {
    pet: Dog | Cat;
  },
): putAny204Response;

@route("/one") @post op putOne(
  @bodyRoot body: {
    @oneOf
    pet: Dog | Cat;
  },
): putOne204Response;
