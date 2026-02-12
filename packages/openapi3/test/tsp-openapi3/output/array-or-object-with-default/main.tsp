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

model DogOwner {
  name?: string;
  dogs?: Dog[] | null = #[];
  home_address?: {
    street?: string;
    city?: string;
    state?: string;
    `zip.code`?: string;
  } = #{ street: "", city: "", state: "", `zip.code`: "" };
}

@route("/") @get op extensive(): DogOwner | {
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
