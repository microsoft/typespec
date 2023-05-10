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
@doc("")
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
@doc("")
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

/**
 * The request has succeeded.
 */
model OkResponse is Response<200>;
/**
 * The request has succeeded and a new resource has been created as a result.
 */
model CreatedResponse is Response<201>;
/**
 * The request has been accepted for processing, but processing has not yet completed.
 */
model AcceptedResponse is Response<202>;
/**
 * There is no content to send for this request, but the headers may be useful.
 */
model NoContentResponse is Response<204>;
/**
 * The URL of the requested resource has been changed permanently. The new URL is given in the response.
 */
model MovedResponse is Response<301> {
  ...LocationHeader;
}
/**
 * The client has made a conditional request and the resource has not been modified.
 */
model NotModifiedResponse is Response<304>;
/**
 * The server could not understand the request due to invalid syntax.
 */
model BadRequestResponse is Response<400>;
/**
 * Access is unauthorized.
 */
model UnauthorizedResponse is Response<401>;
/**
 * Access is forbidden.
 */
model ForbiddenResponse is Response<403>;
/**
 * The server cannot find the requested resource.
 */
model NotFoundResponse is Response<404>;
/**
 * The request conflicts with the current state of the server.
 */
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
