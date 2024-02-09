export type ExtensionKey = `x-${string}`;

/**
 * OpenAPI additional information
 */
export interface AdditionalInfo {
  /** The title of the API. Overrides the `@service` title. */
  title?: string;

  /** A short summary of the API. Overrides the `@summary` provided on the service namespace. */
  summary?: string;

  /** The version of the OpenAPI document (which is distinct from the OpenAPI Specification version or the API implementation version). */
  version?: string;

  /** A URL to the Terms of Service for the API. MUST be in the format of a URL. */
  termsOfService?: string;

  /** The contact information for the exposed API. */
  contact?: Contact;

  /** The license information for the exposed API. */
  license?: License;
}

export interface Contact {
  /** The identifying name of the contact person/organization. */
  name?: string;

  /** The URL pointing to the contact information. MUST be in the format of a URL. */
  url?: string;

  /** The email address of the contact person/organization. MUST be in the format of an email address. */
  email?: string;
}

export interface License {
  /** The license name used for the API. */
  name: string;

  /** A URL to the license used for the API. MUST be in the format of a URL. */
  url?: string;
}
