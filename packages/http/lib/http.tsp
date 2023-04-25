import "../dist/src/index.js";
import "./http-decorators.tsp";
import "./auth.tsp";

namespace TypeSpec.Http;

using Private;

/**
 * Describes an HTTP response.
 *
 * @template Status The status code of the response.
 */
model Response<Status> {
  @doc("The status code.")
  @statusCode
  statusCode: Status;
}

/**
 * Defines a model with a single property of the given type, marked with `@body`.
 *
 * This can be useful in situations where you cannot use a bare T as the body
 * and it is awkward to add a property.
 *
 * @template T The type of the model's `body` property.
 */
model Body<T> {
  @body
  body: T;
}

/**
 * The Location header contains the URL where the status of the long running operation can be checked.
 */
model LocationHeader {
  @doc("The Location header contains the URL where the status of the long running operation can be checked.")
  @header
  location: string;
}

// Don't put @doc on these, change `getStatusCodeDescription` implementation
// to update the default descriptions for these status codes. This ensures
// that we get consistent emit between different ways to spell the same
// responses in TypeSpec.
model OkResponse is Response<200>;
model CreatedResponse is Response<201>;
model AcceptedResponse is Response<202>;
model NoContentResponse is Response<204>;
model MovedResponse is Response<301> {
  ...LocationHeader;
}
model NotModifiedResponse is Response<304>;
model BadRequestResponse is Response<400>;
model UnauthorizedResponse is Response<401>;
model ForbiddenResponse is Response<403>;
model NotFoundResponse is Response<404>;
model ConflictResponse is Response<409>;

/**
 * Produces a new model with the same properties as T, but with `@query`,
 * `@header`, `@body`, and `@path` decorators removed from all properties.
 * @template T The model to spread as the plain data.
 */
@plainData
model PlainData<T> {
  ...T;
}
