import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using OpenAPI;

@service(#{ title: "(title)" })
@info(#{ version: "0.0.0" })
namespace title;

model Dog {
  type: string;
  name: string;
  age_in_dog_years?: int32;
}

model Cat {
  type: string;
  name: string;
  age_in_cat_years?: int32;
}

@discriminated(#{ envelope: "none", discriminatorPropertyName: "type" })
@oneOf
union Pet {
  dog: Dog,
  cat: Cat,
  null,
}

model PetOwner {
  name?: string;
  pet?: Pet;
}

@route("/") @get op extensive(): PetOwner | {
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
