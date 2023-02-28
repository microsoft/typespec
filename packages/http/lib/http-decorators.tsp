namespace TypeSpec.Http;

using TypeSpec.Reflection;

/**
 * Header options.
 */
model HeaderOptions {
  /**
   * Name of the header when sent over http.
   */
  name?: string;
  /**
   * Determines the format of the array if type array is used.
   */
  format?: "csv";
}

/**
 * Specify this property is to be sent or received as an http header.
 *
 * @param headerNameOrOptions Optional name of the header when sent over http or header options.
 *
 * @example
 *
 * ```typespec
 * op read(@header accept: string): {@header("E-Tag") eTag: string};
 * op create(@header({name: "X-Color", format: "csv"}) colors: string[]): void;
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
  format?: "multi" | "csv";
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
extern dec path(target: ModelProperty, paramName?: string);

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
 * Specify the http verb for the target operation to be `GET`.
 *
 * @example
 *
 * ```typespec
 * @get op read(): string
 * ```
 */
extern dec get(target: Operation);

/**
 * Specify the http verb for the target operation to be `PUT`.
 *
 * @example
 *
 * ```typespec
 * @put op set(pet: Pet): void
 * ```
 */
extern dec put(target: Operation);

/**
 * Specify the http verb for the target operation to be `POST`.
 *
 * @example
 *
 * ```typespec
 * @post op create(pet: Pet): void
 * ```
 */
extern dec post(target: Operation);

/**
 * Specify the http verb for the target operation to be `PATCH`.
 *
 * @example
 *
 * ```typespec
 * @patch op update(pet: Pet): void
 * ```
 */
extern dec patch(target: Operation);

/**
 * Specify the http verb for the target operation to be `DELETE`.
 *
 * @example
 *
 * ```typespec
 * @delete op set(petId: string): void
 * ```
 */
extern dec delete(target: Operation);

/**
 * Specify the http verb for the target operation to be `HEAD`.
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
 *  @param url Description of the endpoint
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
extern dec server(target: Namespace, url: string, description: string, parameters?: object);

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
extern dec useAuth(target: Namespace, auth: object | Union | object[]);

/**
 * Specify if inapplicable metadata should be included in the payload for the given entity.
 */
extern dec includeInapplicableMetadataInPayload(target: unknown, value: boolean);
