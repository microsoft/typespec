import { DecoratorContext, Model, Operation, Type, TypeSpecValue } from "@typespec/compiler";

/**
 * Specify the OpenAPI `operationId` property for this operation.
 *
 * @param Operation id value.
 * @example
 * ```typespec
 * @operationId("download")
 * op read(): string;
 * ```
 */
export type OperationIdDecorator = (
  context: DecoratorContext,
  target: Operation,
  operationId: string
) => void;

/**
 * Attach some custom data to the OpenAPI element generated from this type.
 *
 * @param Extension key. Must start with `x-`
 * @param Extension value.
 * @example
 * ```typespec
 * @extension("x-custom", "My value")
 * @extension("x-pageable", {nextLink: "x-next-link"})
 * op read(): string;
 * ```
 */
export type ExtensionDecorator = (
  context: DecoratorContext,
  target: Type,
  key: string,
  value: TypeSpecValue
) => void;

/**
 * Specify that this model is to be treated as the OpenAPI `default` response.
 * This differs from the compiler built-in `@error` decorator as this does not necessarily represent an error.
 *
 * @example
 * ```typespec
 * @defaultResponse
 * model PetStoreResponse is object;
 *
 * op listPets(): Pet[] | PetStoreResponse;
 * ```
 */
export type DefaultResponseDecorator = (context: DecoratorContext, target: Model) => void;

/**
 * Specify the OpenAPI `externalDocs` property for this type.
 *
 * @param Url to the docs
 * @param Description of the docs
 * @example
 * ```typespec
 * @externalDocs("https://example.com/detailed.md", "Detailed information on how to use this operation")
 * op listPets(): Pet[];
 * ```
 */
export type ExternalDocsDecorator = (
  context: DecoratorContext,
  target: Type,
  url: string,
  description?: string
) => void;
