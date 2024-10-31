import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using OpenAPI;

@service({
  title: "Swagger Petstore",
})
@info({
  version: "1.0.0",
  license: {
    name: "MIT",
  },
})
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

/**
 * A paged array of pets
 */
model listPets200ApplicationJsonResponse {
  /**
   * A link to the next page of responses
   */
  @header("x-next") xNext?: string;

  @statusCode statusCode: 200;
  @bodyRoot body: Pets;
}

/**
 * unexpected error
 */
@defaultResponse
model listPetsDefaultApplicationJsonResponse {
  @bodyRoot body: Error;
}

/**
 * Null response
 */
model createPets201Response {
  @statusCode statusCode: 201;
}

/**
 * unexpected error
 */
@defaultResponse
model createPetsDefaultApplicationJsonResponse {
  @bodyRoot body: Error;
}

/**
 * Expected response to a valid request
 */
model showPetById200ApplicationJsonResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: Pet;
}

/**
 * unexpected error
 */
@defaultResponse
model showPetByIdDefaultApplicationJsonResponse {
  @bodyRoot body: Error;
}

@tag("pets")
@route("/pets")
@get
@summary("List all pets")
op listPets(
  /**
   * How many items to return at one time (max 100)
   */
  @query limit?: int32,
): listPets200ApplicationJsonResponse | listPetsDefaultApplicationJsonResponse;

@tag("pets")
@route("/pets")
@post
@summary("Create a pet")
op createPets(): createPets201Response | createPetsDefaultApplicationJsonResponse;

@tag("pets")
@route("/pets/{petId}")
@get
@summary("Info for a specific pet")
op showPetById(
  /**
   * The id of the pet to retrieve
   */
  @path petId: string,
): showPetById200ApplicationJsonResponse | showPetByIdDefaultApplicationJsonResponse;
