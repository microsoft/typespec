/**
 * Pattern for extension keys.
 * In OpenAPI only unknown properties starting with `x-` are allowed.
 */
export type ExtensionKey = `x-${string}`;

/**
 * OpenAPI additional information
 */
export interface AdditionalInfo {
  /** The title of the API. Overrides the `@service` title. */
  title?: string;

  /** A short summary of the API. Overrides the `@summary` provided on the service namespace. */
  summary?: string;

  /** A description of the API. Overrides the `@doc` provided on the service namespace. */
  description?: string;

  /** The version of the OpenAPI document (which is distinct from the OpenAPI Specification version or the API implementation version). */
  version?: string;

  /** A URL to the Terms of Service for the API. MUST be in the format of a URL. */
  termsOfService?: string;

  /** The contact information for the exposed API. */
  contact?: Contact;

  /** The license information for the exposed API. */
  license?: License;
}

/**
 * Contact information
 */
export interface Contact {
  /** The identifying name of the contact person/organization. */
  name?: string;

  /** The URL pointing to the contact information. MUST be in the format of a URL. */
  url?: string;

  /** The email address of the contact person/organization. MUST be in the format of an email address. */
  email?: string;
}

/**
 * License information
 */
export interface License {
  /** The license name used for the API. */
  name: string;

  /** A URL to the license used for the API. MUST be in the format of a URL. Mutually exclusive with `identifier`. */
  url?: string;

  /** An SPDX license expression for the API. Mutually exclusive with `url`. Only supported in OpenAPI 3.1+. For OpenAPI 3.0, this will be emitted as `x-oai-license-identifier`. */
  identifier?: string;
}

/**
 * External Docs info
 */
export interface ExternalDocs {
  /** Documentation url */
  url: string;
  /** Optional description */
  description?: string;
}

/**
 * Metadata for a tag.
 */
export interface TagMetadata {
  /** A description of the tag. */
  description?: string;

  /** External documentation for the tag. */
  externalDocs?: ExternalDocs;

  /** The name of a parent tag (only supported natively in OpenAPI 3.2; emitted as `x-oai-parent` for 3.0 and 3.1). */
  parent?: string;

  /** A short summary of the tag, used for display purposes. Only supported natively in OpenAPI 3.2. For 3.0 and 3.1, this will be emitted as `x-oai-summary`. */
  summary?: string;

  /** A machine-readable string to categorize what sort of tag it is. Only supported natively in OpenAPI 3.2. For 3.0 and 3.1, this will be emitted as `x-oai-kind`. */
  kind?: string;

  /** Additional extension data. Keys must start with `x-`. */
  [extensionKey: string]: unknown;
}

/**
 * Metadata for a tag including the tag name. Used with the array form of `@tagMetadata`.
 */
export interface TagMetadataWithName extends TagMetadata {
  /** The name of the tag. */
  name: string;
}
