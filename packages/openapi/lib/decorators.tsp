using TypeSpec.Reflection;

namespace OpenAPI;

/**
 * Specify the OpenAPI `operationId` property for this operation.
 *
 * @param operationId Operation id value.
 *
 * @example
 *
 * ```typespec
 * @operationId("download")
 * op read(): string;
 * ```
 */
extern dec operationId(target: Operation, operationId: string);

/**
 * Attach some custom data to the OpenAPI element generated from this type.
 *
 * @param key Extension key. Must start with `x-`
 * @param value Extension value.
 *
 * @example
 *
 * ```typespec
 * @extension("x-custom", "My value")
 * @extension("x-pageable", {nextLink: "x-next-link"})
 * op read(): string;
 * ```
 */
extern dec extension(target: unknown, key: string, value: unknown);

/**
 * Specify that this model is to be treated as the OpenAPI `default` response.
 * This differs from the compiler built-in `@error` decorator as this does not necessarily represent an error.
 *
 * @example
 *
 * ```typespec
 * @defaultResponse
 * model PetStoreResponse is object;
 *
 * op listPets(): Pet[] | PetStoreResponse;
 * ```
 */
extern dec defaultResponse(target: Model);

/**
 * Specify the OpenAPI `externalDocs` property for this type.
 *
 * @param url Url to the docs
 * @param description Description of the docs
 *
 * @example
 * ```typespec
 * @externalDocs("https://example.com/detailed.md", "Detailed information on how to use this operation")
 * op listPets(): Pet[];
 * ```
 */
extern dec externalDocs(target: unknown, url: string, description?: string);
