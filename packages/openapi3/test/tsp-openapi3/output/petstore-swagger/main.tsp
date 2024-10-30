import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";

using Http;
using OpenAPI;

/**
 * This is a sample Pet Store Server based on the OpenAPI 3.0 specification.  You can find out more about
 * Swagger at [http://swagger.io](http://swagger.io). In the third iteration of the pet store, we've switched to the design first approach!
 * You can now help us improve the API whether it's by making changes to the definition itself or to the code.
 * That way, with time, we can improve the API in general, and expose some of the new features in OAS3.
 *
 * Some useful links:
 * - [The Pet Store repository](https://github.com/swagger-api/swagger-petstore)
 * - [The source API definition for the Pet Store](https://github.com/swagger-api/swagger-petstore/blob/master/src/main/resources/openapi.yaml)
 */
@service({
  title: "Swagger Petstore - OpenAPI 3.0",
})
@info({
  version: "1.0.20-SNAPSHOT",
  contact: {
    email: "apiteam@swagger.io",
  },
  license: {
    name: "Apache 2.0",
    url: "http://www.apache.org/licenses/LICENSE-2.0.html",
  },
  termsOfService: "http://swagger.io/terms/",
})
namespace SwaggerPetstoreOpenAPI30;

@extension("x-swagger-router-model", "io.swagger.petstore.model.Order")
model Order {
  id?: int64;
  petId?: int64;
  @maxValue(10) quantity?: int32;
  shipDate?: utcDateTime;

  /**
   * Order Status
   */
  status?: "placed" | "approved" | "delivered";

  complete?: boolean;
}

model Customer {
  id?: int64;
  username?: string;
  address?: Address[];
}

model Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

@extension("x-swagger-router-model", "io.swagger.petstore.model.Category")
model Category {
  id?: int64;
  name?: string;
}

@extension("x-swagger-router-model", "io.swagger.petstore.model.User")
model User {
  id?: int64;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone?: string;

  /**
   * User Status
   */
  userStatus?: int32;
}

@extension("x-swagger-router-model", "io.swagger.petstore.model.Tag")
model Tag {
  id?: int64;
  name?: string;
}

@extension("x-swagger-router-model", "io.swagger.petstore.model.Pet")
model Pet {
  id?: int64;
  name: string;
  category?: Category;
  photoUrls: string[];
  tags?: Tag[];

  /**
   * pet status in the store
   */
  status?: "available" | "pending" | "sold";
}

model ApiResponse {
  code?: int32;
  type?: string;
  message?: string;
}

/**
 * Successful operation
 */
model addPet200ApplicationXmlResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: Pet;
  @header contentType: "application/xml";
}

/**
 * Successful operation
 */
model addPet200ApplicationJsonResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: Pet;
}

/**
 * Invalid input
 */
@error
model addPet405Response {
  @statusCode statusCode: 405;
}

/**
 * Successful operation
 */
model updatePet200ApplicationXmlResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: Pet;
  @header contentType: "application/xml";
}

/**
 * Successful operation
 */
model updatePet200ApplicationJsonResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: Pet;
}

/**
 * Invalid ID supplied
 */
@error
model updatePet400Response {
  @statusCode statusCode: 400;
}

/**
 * Pet not found
 */
@error
model updatePet404Response {
  @statusCode statusCode: 404;
}

/**
 * Validation exception
 */
@error
model updatePet405Response {
  @statusCode statusCode: 405;
}

/**
 * successful operation
 */
model findPetsByStatus200ApplicationXmlResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: Pet[];
  @header contentType: "application/xml";
}

/**
 * successful operation
 */
model findPetsByStatus200ApplicationJsonResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: Pet[];
}

/**
 * Invalid status value
 */
@error
model findPetsByStatus400Response {
  @statusCode statusCode: 400;
}

/**
 * successful operation
 */
model findPetsByTags200ApplicationXmlResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: Pet[];
  @header contentType: "application/xml";
}

/**
 * successful operation
 */
model findPetsByTags200ApplicationJsonResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: Pet[];
}

/**
 * Invalid tag value
 */
@error
model findPetsByTags400Response {
  @statusCode statusCode: 400;
}

/**
 * Invalid pet value
 */
@error
model deletePet400Response {
  @statusCode statusCode: 400;
}

/**
 * successful operation
 */
model getPetById200ApplicationXmlResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: Pet;
  @header contentType: "application/xml";
}

/**
 * successful operation
 */
model getPetById200ApplicationJsonResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: Pet;
}

/**
 * Invalid ID supplied
 */
@error
model getPetById400Response {
  @statusCode statusCode: 400;
}

/**
 * Pet not found
 */
@error
model getPetById404Response {
  @statusCode statusCode: 404;
}

/**
 * Invalid input
 */
@error
model updatePetWithForm405Response {
  @statusCode statusCode: 405;
}

/**
 * successful operation
 */
model uploadFile200ApplicationJsonResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: ApiResponse;
}

/**
 * successful operation
 */
model getInventory200ApplicationJsonResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: Record<int32>;
}

/**
 * successful operation
 */
model placeOrder200ApplicationJsonResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: Order;
}

/**
 * Invalid input
 */
@error
model placeOrder405Response {
  @statusCode statusCode: 405;
}

/**
 * Invalid ID supplied
 */
@error
model deleteOrder400Response {
  @statusCode statusCode: 400;
}

/**
 * Order not found
 */
@error
model deleteOrder404Response {
  @statusCode statusCode: 404;
}

/**
 * successful operation
 */
model getOrderById200ApplicationXmlResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: Order;
  @header contentType: "application/xml";
}

/**
 * successful operation
 */
model getOrderById200ApplicationJsonResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: Order;
}

/**
 * Invalid ID supplied
 */
@error
model getOrderById400Response {
  @statusCode statusCode: 400;
}

/**
 * Order not found
 */
@error
model getOrderById404Response {
  @statusCode statusCode: 404;
}

/**
 * successful operation
 */
@defaultResponse
model createUserDefaultApplicationJsonResponse {
  @bodyRoot body: User;
}

/**
 * successful operation
 */
@defaultResponse
model createUserDefaultApplicationXmlResponse {
  @bodyRoot body: User;
  @header contentType: "application/xml";
}

/**
 * Successful operation
 */
model createUsersWithListInput200ApplicationXmlResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: User;
  @header contentType: "application/xml";
}

/**
 * Successful operation
 */
model createUsersWithListInput200ApplicationJsonResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: User;
}

/**
 * successful operation
 */
@defaultResponse
model createUsersWithListInputDefaultResponse {}

/**
 * successful operation
 */
model loginUser200ApplicationXmlResponse {
  /**
   * calls per hour allowed by the user
   */
  @header("X-Rate-Limit") XRateLimit?: int32;

  /**
   * date in UTC when token expires
   */
  @header("X-Expires-After") XExpiresAfter?: utcDateTime;

  @statusCode statusCode: 200;
  @bodyRoot body: string;
  @header contentType: "application/xml";
}

/**
 * successful operation
 */
model loginUser200ApplicationJsonResponse {
  /**
   * calls per hour allowed by the user
   */
  @header("X-Rate-Limit") XRateLimit?: int32;

  /**
   * date in UTC when token expires
   */
  @header("X-Expires-After") XExpiresAfter?: utcDateTime;

  @statusCode statusCode: 200;
  @bodyRoot body: string;
}

/**
 * Invalid username/password supplied
 */
@error
model loginUser400Response {
  @statusCode statusCode: 400;
}

/**
 * successful operation
 */
@defaultResponse
model logoutUserDefaultResponse {}

/**
 * Invalid username supplied
 */
@error
model deleteUser400Response {
  @statusCode statusCode: 400;
}

/**
 * User not found
 */
@error
model deleteUser404Response {
  @statusCode statusCode: 404;
}

/**
 * successful operation
 */
model getUserByName200ApplicationXmlResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: User;
  @header contentType: "application/xml";
}

/**
 * successful operation
 */
model getUserByName200ApplicationJsonResponse {
  @statusCode statusCode: 200;
  @bodyRoot body: User;
}

/**
 * Invalid username supplied
 */
@error
model getUserByName400Response {
  @statusCode statusCode: 400;
}

/**
 * User not found
 */
@error
model getUserByName404Response {
  @statusCode statusCode: 404;
}

/**
 * successful operation
 */
@defaultResponse
model updateUserDefaultResponse {}

/**
 * Add a new pet to the store
 */
@tag("pet")
@route("/pet")
@post
@summary("Add a new pet to the store")
op addPet(
  @header contentType: "application/json" | "application/xml" | "application/x-www-form-urlencoded",
  @bodyRoot body: Pet,
): addPet200ApplicationXmlResponse | addPet200ApplicationJsonResponse | addPet405Response;

/**
 * Update an existing pet by Id
 */
@tag("pet")
@route("/pet")
@put
@summary("Update an existing pet")
op updatePet(
  @header contentType: "application/json" | "application/xml" | "application/x-www-form-urlencoded",
  @bodyRoot body: Pet,
):
  | updatePet200ApplicationXmlResponse
  | updatePet200ApplicationJsonResponse
  | updatePet400Response
  | updatePet404Response
  | updatePet405Response;

/**
 * Multiple status values can be provided with comma separated strings
 */
@tag("pet")
@route("/pet/findByStatus")
@get
@summary("Finds Pets by status")
op findPetsByStatus(
  /**
   * Status values that need to be considered for filter
   */
  @query({
    format: "form",
  })
  status?: "available" | "pending" | "sold" = "available",
): findPetsByStatus200ApplicationXmlResponse | findPetsByStatus200ApplicationJsonResponse | findPetsByStatus400Response;

/**
 * Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 */
@tag("pet")
@route("/pet/findByTags")
@get
@summary("Finds Pets by tags")
op findPetsByTags(
  /**
   * Tags to filter by
   */
  @query({
    format: "form",
  })
  tags?: string[],
): findPetsByTags200ApplicationXmlResponse | findPetsByTags200ApplicationJsonResponse | findPetsByTags400Response;

@tag("pet")
@route("/pet/{petId}")
@delete
@summary("Deletes a pet")
op deletePet(
  @header api_key?: string,

  /**
   * Pet id to delete
   */
  @path petId: int64,
): deletePet400Response;

/**
 * Returns a single pet
 */
@tag("pet")
@route("/pet/{petId}")
@get
@summary("Find pet by ID")
op getPetById(
  /**
   * ID of pet to return
   */
  @path petId: int64,
):
  | getPetById200ApplicationXmlResponse
  | getPetById200ApplicationJsonResponse
  | getPetById400Response
  | getPetById404Response;

@tag("pet")
@route("/pet/{petId}")
@post
@summary("Updates a pet in the store with form data")
op updatePetWithForm(
  /**
   * ID of pet that needs to be updated
   */
  @path petId: int64,

  /**
   * Name of pet that needs to be updated
   */
  @query name?: string,

  /**
   * Status of pet that needs to be updated
   */
  @query status?: string,
): updatePetWithForm405Response;

@tag("pet")
@route("/pet/{petId}/uploadImage")
@post
@summary("uploads an image")
op uploadFile(
  /**
   * ID of pet to update
   */
  @path petId: int64,

  /**
   * Additional Metadata
   */
  @query additionalMetadata?: string,

  @header contentType: "application/octet-stream",
  @bodyRoot body: bytes,
): uploadFile200ApplicationJsonResponse;

/**
 * Returns a map of status codes to quantities
 */
@tag("store")
@extension("x-swagger-router-controller", "OrderController")
@route("/store/inventory")
@get
@summary("Returns pet inventories by status")
op getInventory(): getInventory200ApplicationJsonResponse;

/**
 * Place a new order in the store
 */
@tag("store")
@extension("x-swagger-router-controller", "OrderController")
@route("/store/order")
@post
@summary("Place an order for a pet")
op placeOrder(
  @header contentType: "application/json" | "application/xml" | "application/x-www-form-urlencoded",
  @bodyRoot body: Order,
): placeOrder200ApplicationJsonResponse | placeOrder405Response;

/**
 * For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 */
@tag("store")
@extension("x-swagger-router-controller", "OrderController")
@route("/store/order/{orderId}")
@delete
@summary("Delete purchase order by ID")
op deleteOrder(
  /**
   * ID of the order that needs to be deleted
   */
  @path orderId: int64,
): deleteOrder400Response | deleteOrder404Response;

/**
 * For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 */
@tag("store")
@extension("x-swagger-router-controller", "OrderController")
@route("/store/order/{orderId}")
@get
@summary("Find purchase order by ID")
op getOrderById(
  /**
   * ID of order that needs to be fetched
   */
  @path orderId: int64,
):
  | getOrderById200ApplicationXmlResponse
  | getOrderById200ApplicationJsonResponse
  | getOrderById400Response
  | getOrderById404Response;

/**
 * This can only be done by the logged in user.
 */
@tag("user")
@route("/user")
@post
@summary("Create user")
op createUser(
  @header contentType: "application/json" | "application/xml" | "application/x-www-form-urlencoded",
  @bodyRoot body: User,
): createUserDefaultApplicationJsonResponse | createUserDefaultApplicationXmlResponse;

/**
 * Creates list of users with given input array
 */
@tag("user")
@extension("x-swagger-router-controller", "UserController")
@route("/user/createWithList")
@post
@summary("Creates list of users with given input array")
op createUsersWithListInput(
  @bodyRoot body: User[],
): createUsersWithListInput200ApplicationXmlResponse | createUsersWithListInput200ApplicationJsonResponse | createUsersWithListInputDefaultResponse;

@tag("user")
@route("/user/login")
@get
@summary("Logs user into the system")
op loginUser(
  /**
   * The user name for login
   */
  @query username?: string,

  /**
   * The password for login in clear text
   */
  @query password?: string,
): loginUser200ApplicationXmlResponse | loginUser200ApplicationJsonResponse | loginUser400Response;

@tag("user")
@route("/user/logout")
@get
@summary("Logs out current logged in user session")
op logoutUser(): logoutUserDefaultResponse;

/**
 * This can only be done by the logged in user.
 */
@tag("user")
@route("/user/{username}")
@delete
@summary("Delete user")
op deleteUser(
  /**
   * The name that needs to be deleted
   */
  @path username: string,
): deleteUser400Response | deleteUser404Response;

@tag("user")
@route("/user/{username}")
@get
@summary("Get user by user name")
op getUserByName(
  /**
   * The name that needs to be fetched. Use user1 for testing.
   */
  @path username: string,
):
  | getUserByName200ApplicationXmlResponse
  | getUserByName200ApplicationJsonResponse
  | getUserByName400Response
  | getUserByName404Response;

/**
 * This can only be done by the logged in user.
 */
@tag("user")
@extension("x-swagger-router-controller", "UserController")
@route("/user/{username}")
@put
@summary("Update user")
op updateUser(
  /**
   * name that needs to be updated
   */
  @path username: string,

  @header contentType: "application/json" | "application/xml" | "application/x-www-form-urlencoded",
  @bodyRoot body: User,
): updateUserDefaultResponse;
