import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using OpenAPI;

@service(#{ title: "Swagger Petstore" })
@info(#{ version: "1.0.0", license: #{ name: "MIT" } })
@server("http://petstore.swagger.io/v1")
namespace SwaggerPetstore;

model Pet {
  id: int64;
  name: string;
  tag?: string;
}

model Pets is Pet[];

model Error {
  code: int32;
  message: string;
}

@tag("pets")
@route("/pets")
@get
@summary("List all pets")
op listPets(
  /**
   * How many items to return at one time (max 100)
   */
  @query(#{ explode: true }) limit?: int32,
): {
  /**
   * A link to the next page of responses
   */
  @header("x-next") xNext?: string;

  @body body: Pets;
} | GeneratedHelpers.DefaultResponse<Description = "unexpected error", Body = Error>;

@tag("pets")
@route("/pets")
@post
@summary("Create a pet")
op createPets(): CreatedResponse | GeneratedHelpers.DefaultResponse<
  Description = "unexpected error",
  Body = Error
>;

@tag("pets")
@route("/pets/{petId}")
@get
@summary("Info for a specific pet")
op showPetById(
  /**
   * The id of the pet to retrieve
   */
  @path petId: string,
): Pet | GeneratedHelpers.DefaultResponse<Description = "unexpected error", Body = Error>;

namespace GeneratedHelpers {
  @doc(Description)
  @error
  model DefaultResponse<
    Description extends valueof string = "",
    Body = void,
    Headers extends {} = {}
  > {
    @body body: Body;
    ...Headers;
  }
}
