namespace TypeSpec.Http;

using TypeSpec.Reflection;

/**
 * Header options.
 */
model HeaderOptions {
  /**
   * Name of the header when sent over HTTP.
   */
  name?: string;

  /**
   * Determines the format of the array if type array is used.
   */
  format?: "csv" | "multi" | "tsv" | "ssv" | "pipes" | "simple" | "form";
}

/**
 * Specify this property is to be sent or received as an HTTP header.
 *
 * @param headerNameOrOptions Optional name of the header when sent over HTTP or header options.
 *  By default the header name will be the property name converted from camelCase to kebab-case. (e.g. `contentType` -> `content-type`)
 *
 * @example
 *
 * ```typespec
 * op read(@header accept: string): {@header("ETag") eTag: string};
 * op create(@header({name: "X-Color", format: "csv"}) colors: string[]): void;
 * ```
 *
 * @example Implicit header name
 *
 * ```typespec
 * op read(): {@header contentType: string}; // headerName: content-type
 * op update(@header ifMatch: string): void; // headerName: if-match
 * ```
 */
extern dec header(target: ModelProperty, headerNameOrOptions?: string | HeaderOptions);

/**
 * Query parameter options.
 */
model QueryOptions {
  /**
   * Name of the query when included in the url.
   */
  name?: string;

  /**
   * Determines the format of the array if type array is used.
   */
  format?: "multi" | "csv" | "ssv" | "tsv" | "simple" | "form" | "pipes";
}

/**
 * Specify this property is to be sent as a query parameter.
 *
 * @param queryNameOrOptions Optional name of the query when included in the url or query parameter options.
 *
 * @example
 *
 * ```typespec
 * op read(@query select: string, @query("order-by") orderBy: string): void;
 * op list(@query({name: "id", format: "multi"}) ids: string[]): void;
 * ```
 */
extern dec query(target: ModelProperty, queryNameOrOptions?: string | QueryOptions);

/**
 * Explicitly specify that this property is to be interpolated as a path parameter.
 *
 * @param paramName Optional name of the parameter in the url template.
 *
 * @example
 *
 * ```typespec
 * @route("/read/{explicit}/things/{implicit}")
 * op read(@path explicit: string, implicit: string): void;
 * ```
 */
extern dec path(target: ModelProperty, paramName?: valueof string);

/**
 * Explicitly specify that this property is to be set as the body
 *
 * @example
 *
 * ```typespec
 * op upload(@body image: bytes): void;
 * op download(): {@body image: bytes};
 * ```
 */
extern dec body(target: ModelProperty);

/**
 * Specify the status code for this response. Property type must be a status code integer or a union of status code integer.
 *
 * @example
 *
 * ```typespec
 * op read(): {@statusCode: 200, @body pet: Pet}
 * op create(): {@statusCode: 201 | 202}
 * ```
 */
extern dec statusCode(target: ModelProperty);

/**
 * Specify the HTTP verb for the target operation to be `GET`.
 *
 * @example
 *
 * ```typespec
 * @get op read(): string
 * ```
 */
extern dec get(target: Operation);

/**
 * Specify the HTTP verb for the target operation to be `PUT`.
 *
 * @example
 *
 * ```typespec
 * @put op set(pet: Pet): void
 * ```
 */
extern dec put(target: Operation);

/**
 * Specify the HTTP verb for the target operation to be `POST`.
 *
 * @example
 *
 * ```typespec
 * @post op create(pet: Pet): void
 * ```
 */
extern dec post(target: Operation);

/**
 * Specify the HTTP verb for the target operation to be `PATCH`.
 *
 * @example
 *
 * ```typespec
 * @patch op update(pet: Pet): void
 * ```
 */
extern dec patch(target: Operation);

/**
 * Specify the HTTP verb for the target operation to be `DELETE`.
 *
 * @example
 *
 * ```typespec
 * @delete op set(petId: string): void
 * ```
 */
extern dec delete(target: Operation);

/**
 * Specify the HTTP verb for the target operation to be `HEAD`.
 * @example
 *
 * ```typespec
 * @head op ping(petId: string): void
 * ```
 */
extern dec head(target: Operation);

/**
 * Specify the endpoint for this service.
 *  @param url Server endpoint
 *  @param description Description of the endpoint
 *  @param parameters Optional set of parameters used to interpolate the url.
 *
 * @example
 * ```typespec
 * @service
 * @server("https://example.com", "Single server endpoint")
 * namespace PetStore;
 * ```
 *
 * @example parameterized
 *
 * ```typespec
 * @server("https://{region}.foo.com", "Regional endpoint", {
 *   @doc("Region name")
 *   region?: string = "westus",
 * })
 * ```
 *
 */
extern dec server(
  target: Namespace,
  url: valueof string,
  description: valueof string,
  parameters?: Record<unknown>
);

/**
 * Specify this service authentication. See the [documentation in the Http library][https://microsoft.github.io/typespec/standard-library/rest/authentication] for full details.
 *
 * @param auth Authentication configuration. Can be a single security scheme, a union(either option is valid authentication) or a tuple(Must use all authentication together)
 * @example
 *
 * ```typespec
 * @service
 * @useAuth(BasicAuth)
 * namespace PetStore;
 * ```
 */
extern dec useAuth(target: Namespace, auth: {} | Union | {}[]);

/**
 * Specify if inapplicable metadata should be included in the payload for the given entity.
 * @param value If true, inapplicable metadata will be included in the payload.
 */
extern dec includeInapplicableMetadataInPayload(target: unknown, value: valueof boolean);

/**
 * Defines the relative route URI for the target operation
 *
 * The first argument should be a URI fragment that may contain one or more path parameter fields.
 * If the namespace or interface that contains the operation is also marked with a `@route` decorator,
 * it will be used as a prefix to the route URI of the operation.
 *
 * `@route` can only be applied to operations, namespaces, and interfaces.
 *
 * @param path Relative route path. Cannot include query parameters.
 * @param options Set of parameters used to configure the route. Supports `{shared: true}` which indicates that the route may be shared by several operations.
 *
 * @example
 *
 * ```typespec
 * @route("/widgets")
 * op getWidget(@path id: string): Widget;
 * ```
 */
extern dec route(
  target: Namespace | Interface | Operation,
  path: valueof string,
  options?: {
    shared?: boolean,
  }
);

/**
 * `@sharedRoute` marks the operation as sharing a route path with other operations.
 *
 * When an operation is marked with `@sharedRoute`, it enables other operations to share the same
 * route path as long as those operations are also marked with `@sharedRoute`.
 *
 * `@sharedRoute` can only be applied directly to operations.
 *
 * ```typespec
 * @sharedRoute
 * @route("/widgets")
 * op getWidget(@path id: string): Widget;
 * ```
 */
extern dec sharedRoute(target: Operation);

/**
 * Private decorators. Those are meant for internal use inside Http types only.
 */
namespace Private {
  extern dec plainData(target: TypeSpec.Reflection.Model);
}
