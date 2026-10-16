import type {
  DecoratorContext,
  DecoratorValidatorCallbacks,
  Model,
  Namespace,
  Operation,
  Type,
} from "@typespec/compiler";

/**
 * Additional information for the OpenAPI document.
 */
export interface AdditionalInfo {
  readonly [key: string]: unknown;
  /**
   * The title of the API. Overrides the `@service` title.
   */
  readonly title?: string;
  /**
   * A short summary of the API. Overrides the `@summary` provided on the service namespace.
   */
  readonly summary?: string;
  /**
   * The version of the OpenAPI document (which is distinct from the OpenAPI Specification version or the API implementation version).
   */
  readonly version?: string;
  /**
   * A URL to the Terms of Service for the API. MUST be in the format of a URL.
   */
  readonly termsOfService?: string;
  /**
   * The contact information for the exposed API.
   */
  readonly contact?: Contact;
  /**
   * The license information for the exposed API.
   */
  readonly license?: License;
}

/**
 * Metadata for a tag that includes the name of the tag. Used with the array form of `@tagMetadata`.
 */
export interface TagMetadataWithName {
  readonly [key: string]: unknown;
  /**
   * The name of the tag.
   */
  readonly name: string;
  /**
   * A description of the tag.
   */
  readonly description?: string;
  /**
   * External documentation information for the tag.
   */
  readonly externalDocs?: ExternalDocs;
  /**
   * The name of a tag that this tag is nested under. Only supported in OpenAPI 3.2. For 3.0 and 3.1, this will be converted to `x-parent`.
   */
  readonly parent?: string;
  /**
   * A short summary of the tag, used for display purposes. Only supported natively in OpenAPI 3.2. For 3.0 and 3.1, this will be emitted as `x-oai-summary`.
   */
  readonly summary?: string;
  /**
   * A machine-readable string to categorize what sort of tag it is. Any string value can be used. Only supported natively in OpenAPI 3.2. For 3.0 and 3.1, this will be emitted as `x-oai-kind`.
   */
  readonly kind?: string;
}

/**
 * Metadata to a single tag that is used by operations.
 */
export interface TagMetadata {
  readonly [key: string]: unknown;
  /**
   * A description of the tag.
   */
  readonly description?: string;
  /**
   * External documentation information for the tag.
   */
  readonly externalDocs?: ExternalDocs;
  /**
   * The name of a tag that this tag is nested under. Only supported in OpenAPI 3.2. For 3.0 and 3.1, this will be converted to `x-parent`.
   */
  readonly parent?: string;
  /**
   * A short summary of the tag, used for display purposes. Only supported natively in OpenAPI 3.2. For 3.0 and 3.1, this will be emitted as `x-oai-summary`.
   */
  readonly summary?: string;
  /**
   * A machine-readable string to categorize what sort of tag it is. Any string value can be used. Only supported natively in OpenAPI 3.2. For 3.0 and 3.1, this will be emitted as `x-oai-kind`.
   */
  readonly kind?: string;
}

/**
 * Contact information for the exposed API.
 */
export interface Contact {
  readonly [key: string]: unknown;
  /**
   * The identifying name of the contact person/organization.
   */
  readonly name?: string;
  /**
   * The URL pointing to the contact information. MUST be in the format of a URL.
   */
  readonly url?: string;
  /**
   * The email address of the contact person/organization. MUST be in the format of an email address.
   */
  readonly email?: string;
}

/**
 * License information for the exposed API.
 */
export interface License {
  readonly [key: string]: unknown;
  /**
   * The license name used for the API.
   */
  readonly name: string;
  /**
   * A URL to the license used for the API. MUST be in the format of a URL. Mutually exclusive with `identifier`.
   */
  readonly url?: string;
  /**
   * An SPDX license expression for the API. Mutually exclusive with `url`. Only supported in OpenAPI 3.1+. For OpenAPI 3.0, this will be emitted as `x-oai-license-identifier`.
   */
  readonly identifier?: string;
}

/**
 * External Docs information.
 */
export interface ExternalDocs {
  readonly [key: string]: unknown;
  /**
   * Documentation url
   */
  readonly url: string;
  /**
   * Optional description
   */
  readonly description?: string;
}

/**
 * Specify the OpenAPI `operationId` property for this operation.
 *
 * @param operationId Operation id value.
 * @example
 * ```typespec
 * @operationId("download")
 * op read(): string;
 * ```
 */
export type OperationIdDecorator = (
  context: DecoratorContext,
  target: Operation,
  operationId: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Attach some custom data to the OpenAPI element generated from this type.
 *
 * @param key Extension key.
 * @param value Extension value.
 * @example
 * ```typespec
 * @extension("x-custom", "My value")
 * @extension("x-pageable", #{nextLink: "x-next-link"})
 * op read(): string;
 * ```
 */
export type ExtensionDecorator = (
  context: DecoratorContext,
  target: Type,
  key: string,
  value: unknown,
) => DecoratorValidatorCallbacks | void;

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
export type DefaultResponseDecorator = (
  context: DecoratorContext,
  target: Model,
) => DecoratorValidatorCallbacks | void;

/**
 * Specify the OpenAPI `externalDocs` property for this type.
 *
 * @param url Url to the docs
 * @param description Description of the docs
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
  description?: string,
) => DecoratorValidatorCallbacks | void;

/**
 * Specify OpenAPI additional information.
 * The service `title` is already specified using `@service`.
 *
 * @param additionalInfo Additional information
 */
export type InfoDecorator = (
  context: DecoratorContext,
  target: Namespace,
  additionalInfo: AdditionalInfo,
) => DecoratorValidatorCallbacks | void;

/**
 * Specify OpenAPI tag metadata. Can be used in two forms:
 * - Inline form: specify a single tag by name with optional metadata.
 * - Array form: specify an ordered list of tags with their metadata in a single decorator call.
 *
 * @param name Tag name (inline form) or array of tags with metadata (array form).
 * @param tagMetadata Additional information for the tag. Only used in inline form.
 * @example Inline form
 * ```typespec
 * @service()
 * @tagMetadata("Tag Name", #{description: "Tag description", externalDocs: #{url: "https://example.com", description: "More info.", `x-custom`: "string"}, `x-custom`: "string"})
 * @tagMetadata("Child Tag", #{description: "Child tag description", parent: "Tag Name"})
 * namespace PetStore {}
 * ```
 * @example Array form (preserves explicit tag order)
 * ```typespec
 * @service()
 * @tagMetadata(#[
 *   #{ name: "First Tag", description: "First tag description" },
 *   #{ name: "Second Tag", description: "Second tag description" },
 * ])
 * namespace PetStore {}
 * ```
 */
export type TagMetadataDecorator = (
  context: DecoratorContext,
  target: Namespace,
  name: string | readonly TagMetadataWithName[],
  tagMetadata?: TagMetadata,
) => DecoratorValidatorCallbacks | void;

export type TypeSpecOpenAPIDecorators = {
  operationId: OperationIdDecorator;
  extension: ExtensionDecorator;
  defaultResponse: DefaultResponseDecorator;
  externalDocs: ExternalDocsDecorator;
  info: InfoDecorator;
  tagMetadata: TagMetadataDecorator;
};
