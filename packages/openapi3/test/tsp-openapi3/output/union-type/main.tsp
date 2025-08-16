import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using OpenAPI;

@service(#{ title: "(title)" })
@info(#{ version: "0.0.0" })
namespace title;

model Dog {
  name: string;
  age_in_dog_years?: int32;
}

model Cat {
  name: string;
  age_in_cat_years?: int32;
}

@oneOf
union Pet {
  Dog,
  Cat,
}

@route("/") @get op extensive(): Pet | {
  @statusCode
  @minValue(400)
  @maxValue(499)
  statusCode: int32;
} | {
  @statusCode
  @minValue(500)
  @maxValue(599)
  statusCode: int32;
};
