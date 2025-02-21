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
@service(#{ title: "Swagger Petstore - OpenAPI 3.0" })
@info(#{
  version: "1.0.20-SNAPSHOT",
  contact: #{ email: "apiteam@swagger.io" },
  license: #{ name: "Apache 2.0", url: "http://www.apache.org/licenses/LICENSE-2.0.html" },
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
 * Add a new pet to the store
 */
@tag("pet")
@route("/pet")
@post
@summary("Add a new pet to the store")
op addPet(
  @header contentType: "application/json" | "application/xml" | "application/x-www-form-urlencoded",

  /**
   * Create a new pet in the store
   */
  @body body: Pet,
): {
  @header contentType: "application/xml";
  @body body: Pet;
} | Pet | {
  @statusCode statusCode: 405;
};

/**
 * Update an existing pet by Id
 */
@tag("pet")
@route("/pet")
@put
@summary("Update an existing pet")
op updatePet(
  @header contentType: "application/json" | "application/xml" | "application/x-www-form-urlencoded",

  /**
   * Update an existent pet in the store
   */
  @body body: Pet,
):
  | {
      @header contentType: "application/xml";
      @body body: Pet;
    }
  | Pet
  | BadRequestResponse
  | NotFoundResponse
  | {
      @statusCode statusCode: 405;
    };

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
  @query(#{ explode: true }) status?: "available" | "pending" | "sold" = "available",
): {
  @header contentType: "application/xml";
  @body body: Pet[];
} | Body<Pet[]> | BadRequestResponse;

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
  @query(#{ explode: true }) tags?: string[],
): {
  @header contentType: "application/xml";
  @body body: Pet[];
} | Body<Pet[]> | BadRequestResponse;

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
): BadRequestResponse;

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
  | {
      @header contentType: "application/xml";
      @body body: Pet;
    }
  | Pet
  | BadRequestResponse
  | NotFoundResponse;

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
  @query(#{ explode: true }) name?: string,

  /**
   * Status of pet that needs to be updated
   */
  @query(#{ explode: true }) status?: string,
): {
  @statusCode statusCode: 405;
};

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
  @query(#{ explode: true }) additionalMetadata?: string,

  @header contentType: "application/octet-stream",
  @body body: bytes,
): ApiResponse;

/**
 * Returns a map of status codes to quantities
 */
@tag("store")
@extension("x-swagger-router-controller", "OrderController")
@route("/store/inventory")
@get
@summary("Returns pet inventories by status")
op getInventory(): Body<Record<int32>>;

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
  @body body: Order,
): Order | {
  @statusCode statusCode: 405;
};

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
): BadRequestResponse | NotFoundResponse;

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
  | {
      @header contentType: "application/xml";
      @body body: Order;
    }
  | Order
  | BadRequestResponse
  | NotFoundResponse;

/**
 * This can only be done by the logged in user.
 */
@tag("user")
@route("/user")
@post
@summary("Create user")
op createUser(
  @header contentType: "application/json" | "application/xml" | "application/x-www-form-urlencoded",

  /**
   * Created user object
   */
  @body body: User,
): GeneratedHelpers.DefaultResponse<
  Description = "successful operation",
  Body = User
> | GeneratedHelpers.DefaultResponse<
  Description = "successful operation",
  Headers = {
    @header contentType: "application/xml";
  },
  Body = User
>;

/**
 * Creates list of users with given input array
 */
@tag("user")
@extension("x-swagger-router-controller", "UserController")
@route("/user/createWithList")
@post
@summary("Creates list of users with given input array")
op createUsersWithListInput(@body body: User[]): {
  @header contentType: "application/xml";
  @body body: User;
} | User | GeneratedHelpers.DefaultResponse<Description = "successful operation">;

@tag("user")
@route("/user/login")
@get
@summary("Logs user into the system")
op loginUser(
  /**
   * The user name for login
   */
  @query(#{ explode: true }) username?: string,

  /**
   * The password for login in clear text
   */
  @query(#{ explode: true }) password?: string,
): {
  /**
   * calls per hour allowed by the user
   */
  @header("X-Rate-Limit") XRateLimit?: int32;

  /**
   * date in UTC when token expires
   */
  @header("X-Expires-After") XExpiresAfter?: utcDateTime;

  @header contentType: "application/xml";
  @body body: string;
} | {
  /**
   * calls per hour allowed by the user
   */
  @header("X-Rate-Limit") XRateLimit?: int32;

  /**
   * date in UTC when token expires
   */
  @header("X-Expires-After") XExpiresAfter?: utcDateTime;

  @body body: string;
} | BadRequestResponse;

@tag("user")
@route("/user/logout")
@get
@summary("Logs out current logged in user session")
op logoutUser(): GeneratedHelpers.DefaultResponse<Description = "successful operation">;

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
): BadRequestResponse | NotFoundResponse;

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
  | {
      @header contentType: "application/xml";
      @body body: User;
    }
  | User
  | BadRequestResponse
  | NotFoundResponse;

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

  /**
   * Update an existent user in the store
   */
  @body body: User,
): GeneratedHelpers.DefaultResponse<Description = "successful operation">;

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
