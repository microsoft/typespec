using TypeSpec.Reflection;

namespace TypeSpec.OpenAPI;

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
extern dec operationId(target: Operation, operationId: valueof string);

/**
 * Attach some custom data to the OpenAPI element generated from this type.
 *
 * @param key Extension key.
 * @param value Extension value.
 *
 * @example
 *
 * ```typespec
 * @extension("x-custom", "My value")
 * @extension("x-pageable", #{nextLink: "x-next-link"})
 * op read(): string;
 * ```
 */
extern dec extension(target: unknown, key: valueof string, value: valueof unknown);

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
extern dec externalDocs(target: unknown, url: valueof string, description?: valueof string);

/** Additional information for the OpenAPI document. */
model AdditionalInfo {
  /** The title of the API. Overrides the `@service` title. */
  title?: string;

  /** A short summary of the API. Overrides the `@summary` provided on the service namespace. */
  summary?: string;

  /** The version of the OpenAPI document (which is distinct from the OpenAPI Specification version or the API implementation version). */
  version?: string;

  /** A URL to the Terms of Service for the API. MUST be in the format of a URL. */
  termsOfService?: url;

  /** The contact information for the exposed API. */
  contact?: Contact;

  /** The license information for the exposed API. */
  license?: License;

  ...Record<unknown>;
}

/** Contact information for the exposed API. */
model Contact {
  /** The identifying name of the contact person/organization. */
  name?: string;

  /** The URL pointing to the contact information. MUST be in the format of a URL. */
  url?: url;

  /** The email address of the contact person/organization. MUST be in the format of an email address. */
  email?: string;

  ...Record<unknown>;
}

/** License information for the exposed API. */
model License {
  /** The license name used for the API. */
  name: string;

  /** A URL to the license used for the API. MUST be in the format of a URL. */
  url?: url;

  ...Record<unknown>;
}

/**
 * Specify OpenAPI additional information.
 * The service `title` is already specified using `@service`.
 * @param additionalInfo Additional information
 */
extern dec info(target: Namespace, additionalInfo: valueof AdditionalInfo);

/** Metadata to a single tag that is used by operations. */
model TagMetadata {
  /** A description of the tag. */
  description?: string;

  /** External documentation information for the tag. */
  externalDocs?: ExternalDocs;

  /** The name of a tag that this tag is nested under. Only supported in OpenAPI 3.2. For 3.0 and 3.1, this will be converted to `x-parent`. */
  parent?: string;

  /** A short summary of the tag, used for display purposes. Only supported natively in OpenAPI 3.2. For 3.0 and 3.1, this will be emitted as `x-oai-summary`. */
  summary?: string;

  /** A machine-readable string to categorize what sort of tag it is. Any string value can be used. Only supported natively in OpenAPI 3.2. For 3.0 and 3.1, this will be emitted as `x-oai-kind`. */
  kind?: string;

  /** Attach some custom data, The extension key must start with `x-`. */
  ...Record<unknown>;
}

/** Metadata for a tag that includes the name of the tag. Used with the array form of `@tagMetadata`. */
model TagMetadataWithName {
  /** The name of the tag. */
  name: string;

  ...TagMetadata;
}

/** External Docs information. */
model ExternalDocs {
  /** Documentation url */
  url: string;

  /** Optional description */
  description?: string;

  /** Attach some custom data, The extension key must start with `x-`. */
  ...Record<unknown>;
}

/**
 * Specify OpenAPI tag metadata. Can be used in two forms:
 * - Inline form: specify a single tag by name with optional metadata.
 * - Array form: specify an ordered list of tags with their metadata in a single decorator call.
 *
 * @param name Tag name (inline form) or array of tags with metadata (array form).
 * @param tagMetadata Additional information for the tag. Only used in inline form.
 *
 * @example Inline form
 * ```typespec
 * @service()
 * @tagMetadata("Tag Name", #{description: "Tag description", externalDocs: #{url: "https://example.com", description: "More info.", `x-custom`: "string"}, `x-custom`: "string"})
 * @tagMetadata("Child Tag", #{description: "Child tag description", parent: "Tag Name"})
 * namespace PetStore {}
 * ```
 *
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
extern dec tagMetadata(
  target: Namespace,
  name: valueof string | TagMetadataWithName[],
  tagMetadata?: valueof TagMetadata
);
