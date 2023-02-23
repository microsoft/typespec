import "../dist/src/index.js";
import "./http-decorators.tsp";
import "./auth.tsp";

namespace TypeSpec.Http;

using Private;

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
 */
model Body<T> {
  @body
  body: T;
}

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
 *`@header`, `@body`, and `@path` decorators removed from all properties.
 */
@plainData
model PlainData<T> {
  ...T;
}
