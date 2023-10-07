import { ExtensionKey } from "@typespec/openapi";

export type Extensions = {
  [key in ExtensionKey]?: any;
};

export interface OpenAPI3Document extends Extensions {
  openapi: "3.0.0";

  /**
   * Provides metadata about the API. The metadata can be used by the clients if needed.
   */
  info: OpenAPI3Info;

  /** Additional external documentation. */
  externalDocs?: OpenAPI3ExternalDocs;

  /** The available paths and operations for the API */
  paths: Record<string, OpenAPI3PathItem>;

  /**
   * An array of Server Objects, which provide connectivity information to a target server.
   * If the servers property is not provided, or is an empty array, the default value would be a Server Object with a url value of /.
   */
  servers?: OpenAPI3Server[];

  /**
   * A list of tags used by the specification with additional metadata.
   * The order of the tags can be used to reflect on their order by the parsing tools.
   * Not all tags that are used by the Operation Object must be declared.
   * The tags that are not declared MAY be organized randomly or based on the tools' logic. Each tag name in the list MUST be unique.
   */
  tags?: OpenAPI3Tag[];

  /** An element to hold various schemas for the specification. */
  components?: OpenAPI3Components;

  /** A declaration of which security mechanisms can be used across the API. The list of values includes alternative security requirement objects that can be used. Only one of the security requirement objects need to be satisfied to authorize a request. Individual operations can override this definition. */
  security?: Record<string, string[]>[];
}

export interface OpenAPI3Info extends Extensions {
  title: string;
  description?: string;
  termsOfService?: string;
  version: string;
}

export interface OpenAPI3Server {
  url: string;
  description?: string;
  variables?: Record<string, OpenAPI3ServerVariable>;
}

export interface OpenAPI3ServerVariable {
  enum?: string[];
  default: string;
  description?: string;
}

export interface OpenAPI3ExternalDocs {
  url: string;
  description?: string;
}

export interface OpenAPI3Tag extends Extensions {
  name: string;
  description?: string;
  externalDocs?: OpenAPI3ExternalDocs;
}

export type HttpMethod = "get" | "put" | "post" | "delete" | "options" | "head" | "patch" | "trace";

/**
 * Describes the operations available on a single path. A Path Item may be empty, due to ACL constraints. The path itself is still exposed to the documentation viewer but they will not know which operations and parameters are available.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#pathItemObject
 */
export type OpenAPI3PathItem = {
  [method in HttpMethod]?: OpenAPI3Operation;
} & { parameters?: OpenAPI3Parameter[] } & Extensions;

export interface OpenAPI3Components extends Extensions {
  schemas?: Record<string, OpenAPI3Schema>;
  headers?: Record<string, OpenAPI3Header>;
  responses?: Record<string, OpenAPI3Response>;
  parameters?: Record<string, OpenAPI3Parameter>;
  examples?: Record<string, OpenAPI3Example>;
  requestBodies?: Record<string, OpenAPI3RequestBody>;
  securitySchemes?: Record<string, OpenAPI3SecurityScheme>;
  links?: Record<string, OpenAPI3Link>;
}

export type OpenAPI3StatusCode = string | "default" | "1XX" | "2XX" | "3XX" | "4XX" | "5XX";

export type OpenAPI3Responses = {
  [status: OpenAPI3StatusCode]: Refable<OpenAPI3Response>;
} & Extensions;

export type OpenAPI3Response = Extensions & {
  /** A short description of the response. CommonMark syntax MAY be used for rich text representation. */
  description: string;

  /** Maps a header name to its definition. RFC7230 states header names are case insensitive. If a response header is defined with the name "Content-Type", it SHALL be ignored. */
  headers: Record<string, Refable<OpenAPI3Header>>;

  /** A map containing descriptions of potential response payloads. The key is a media type or media type range and the value describes it. For responses that match multiple keys, only the most specific key is applicable. e.g. text/plain overrides text/* */
  content?: Record<string, OpenAPI3MediaType>;

  /** A map of operations links that can be followed from the response. The key of the map is a short name for the link, following the naming constraints of the names for Component Objects. */
  links?: Record<string, Refable<OpenAPI3Link>>;
};

/**
 * Each Media Type Object provides schema and examples for the media type identified by its key.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#mediaTypeObject
 */
export type OpenAPI3MediaType = Extensions & {
  /** The schema defining the content of the request, response, or parameter. */
  schema?: Refable<OpenAPI3Schema>;

  /** A map between a property name and its encoding information. The key, being the property name, MUST exist in the schema as a property. The encoding object SHALL only apply to requestBody objects when the media type is multipart or application/x-www-form-urlencoded.  */
  encoding?: Record<string, OpenAPI3Encoding>;
};

/**
 * A single encoding definition applied to a single schema property.
 *
 * see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#encodingObject
 */
export type OpenAPI3Encoding = Extensions & {
  /** the Content-Type for encoding a specific property. Default value depends on the property type: for string with format being binary – application/octet-stream; for other primitive types – text/plain; for object - application/json; for array – the default is defined based on the inner type. The value can be a specific media type (e.g. application/json), a wildcard media type (e.g. image/*), or a comma-separated list of the two types. */
  contentType?: string;

  /** A map allowing additional information to be provided as headers, for example Content-Disposition. Content-Type is described separately and SHALL be ignored in this section. This property SHALL be ignored if the request body media type is not a multipart. */
  headers?: Record<string, Refable<OpenAPI3Header>>;

  /** Describes how a specific property value will be serialized depending on its type. See Parameter Object for details on the style property. The behavior follows the same values as query parameters, including default values. This property SHALL be ignored if the request body media type is not application/x-www-form-urlencoded. */
  style?: "form" | "spaceDelimited" | "pipeDelimited" | "deepObject";

  /** When this is true, property values of type array or object generate separate parameters for each value of the array, or key-value-pair of the map. For other types of properties this property has no effect. When style is form, the default value is true. For all other styles, the default value is false. This property SHALL be ignored if the request body media type is not application/x-www-form-urlencoded. */
  explode?: boolean;

  /** Determines whether the parameter value SHOULD allow reserved characters, as defined by RFC3986 :/?#[]@!$&'()*+,;= to be included without percent-encoding. The default value is false. This property SHALL be ignored if the request body media type is not application/x-www-form-urlencoded */
  allowReserved?: boolean;
};

/**
 * Describes a single request body.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#request-body-object
 */
export type OpenAPI3RequestBody = Extensions & {
  /** A brief description of the request body. This could contain examples of use. CommonMark syntax MAY be used for rich text representation. */
  description: string;

  /** The content of the request body. The key is a media type or media type range and the value describes it. For requests that match multiple keys, only the most specific key is applicable. e.g. text/plain overrides text/* */
  content: Record<string, OpenAPI3MediaType>;

  /** Determines if the request body is required in the request. Defaults to false. */
  required?: boolean;
};

export type OpenAPI3SecurityScheme =
  | OpenAPI3ApiKeySecurityScheme
  | OpenAPI3OAuth2SecurityScheme
  | OpenAPI3OpenIdConnectSecurityScheme
  | OpenAPI3HttpSecurityScheme;

/**
 * defines a security scheme that can be used by the operations. Supported schemes are HTTP authentication, an API key (either as a header, a cookie parameter or as a query parameter), OAuth2's common flows (implicit, password, application and access code) as defined in RFC6749, and OpenID Connect Discovery.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#security-scheme-object
 */
export interface OpenAPI3SecuritySchemeBase extends Extensions {
  /** A short description for security scheme. CommonMark syntax MAY be used for rich text representation. */
  description?: string;
}

/**
 * defines an ApiKey security scheme that can be used by the operations
 */
export interface OpenAPI3ApiKeySecurityScheme extends OpenAPI3SecuritySchemeBase {
  /** ApiKey */
  type: "apiKey";

  /** The name of the header, query or cookie parameter to be used. */
  name: string;

  /** The location of the API key. */
  in: "cookie" | "header" | "query";
}

/**
 * defines an Http security scheme that can be used by the operations
 */
export interface OpenAPI3HttpSecurityScheme extends OpenAPI3SecuritySchemeBase {
  /** HTTP */
  type: "http";

  /** he name of the HTTP Authorization scheme to be used in the Authorization header as defined in RFC7235. */
  scheme: string;

  /** A hint to the client to identify how the bearer token is formatted. Bearer tokens are usually generated by an authorization server, so this information is primarily for documentation purposes. */
  bearerFormat?: string;
}

/**
 * defines an OAuth2 security scheme that can be used by the operations
 */
export interface OpenAPI3OAuth2SecurityScheme extends OpenAPI3SecuritySchemeBase {
  /* OAuth2 */
  type: "oauth2";

  /** An object containing configuration information for the flow types supported. */
  flows: OpenAPI3OAuthFlows;
}

/**
 * Allows configuration of the supported OAuth Flows.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#oauthFlowsObject
 */
export interface OpenAPI3OAuthFlows extends Extensions {
  /** Configuration for the OAuth Implicit flow */
  implicit?: OpenAPI3ImplicitOAuthFlow;

  /** Configuration for the OAuth Resource Owner Password flow */
  password?: OpenAPI3PasswordOAuthFlow;

  /** Configuration for the OAuth Client Credentials flow. Previously called application in OpenAPI 2.0. */
  clientCredentials?: OpenAPI3ClientCredentialsFlow;

  /** Configuration for the OAuth Authorization Code flow. Previously called accessCode in OpenAPI 2.0. */
  authorizationCode?: OpenAPI3AuthorizationCodeOAuthFlow;
}

/** Common definition for the OAuth flows */
export interface OpenAPI3OAuth2Flow extends Extensions {
  /** The URL to be used for obtaining refresh tokens. This MUST be in the form of a URL. */
  refreshUrl?: string;

  /** The available scopes for the OAuth2 security scheme. A map between the scope name and a short description for it. */
  scopes: Record<string, string>;
}

/** Configuration for the OAuth Client Credentials flow. Previously called application in OpenAPI 2.0. */
export interface OpenAPI3ClientCredentialsFlow extends OpenAPI3OAuth2Flow {
  /** The token URL to be used for this flow. This MUST be in the form of a URL. */
  tokenUrl: string;
}

/** Configuration for the OAuth Resource Owner Password flow */
export interface OpenAPI3PasswordOAuthFlow extends OpenAPI3OAuth2Flow {
  /** The token URL to be used for this flow. This MUST be in the form of a URL. */
  tokenUrl: string;
}

/** Configuration for the OAuth Implicit flow */
export interface OpenAPI3ImplicitOAuthFlow extends OpenAPI3OAuth2Flow {
  /** The authorization URL to be used for this flow. This MUST be in the form of a URL. */
  authorizationUrl: string;
}

/** Configuration for the OAuth Authorization Code flow. Previously called accessCode in OpenAPI 2.0. */
export interface OpenAPI3AuthorizationCodeOAuthFlow extends OpenAPI3OAuth2Flow {
  /** The authorization URL to be used for this flow. This MUST be in the form of a URL. */
  authorizationUrl: string;

  /** The token URL to be used for this flow. This MUST be in the form of a URL. */
  tokenUrl: string;
}

/** OpenIdConnect SecurityScheme */
export interface OpenAPI3OpenIdConnectSecurityScheme extends OpenAPI3SecuritySchemeBase {
  /** OpenID Connect */
  type: "openIdConnect";

  /** OpenId Connect URL to discover OAuth2 configuration values. This MUST be in the form of a URL. */
  openIdConnectUrl: string;
}

export type OpenAPI3Link =
  | {
      /** A relative or absolute reference to an OAS operation. This field is mutually exclusive of the operationId field, and MUST point to an Operation Object. Relative operationRef values MAY be used to locate an existing Operation Object in the OpenAPI definition.  */
      operationRef: Ref<unknown>;
    }
  | {
      /** the name of an existing, resolvable OAS operation, as defined with a unique operationId. This field is mutually exclusive of the operationRef field. */
      operationId: string;
    };

/**
 *  Allows sharing examples for operation responses.
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#exampleObject
 */
export interface OpenAPI3Example {
  /** The name of the property MUST be one of the Operation produces values (either implicit or inherited). The value SHOULD be an example of what such a response would look like. */
  [mineType: string]: unknown;
}

export interface OpenAPI3Discriminator extends Extensions {
  propertyName: string;
  mapping?: Record<string, string>;
}

export type JsonType = "array" | "boolean" | "integer" | "number" | "object" | "string";

/**
 * Autorest allows a few properties to be next to $ref of a property.
 */
export type OpenAPI3SchemaProperty = Ref<OpenAPI3Schema> | OpenAPI3Schema;

export type OpenAPI3Schema = Extensions & {
  /**
   * This attribute is a string that provides a short description of the instance property.
   *
   * @see https://tools.ietf.org/html/draft-wright-json-schema-validation-01#section-7.2
   */
  title?: string;

  /**
   * Must be strictly greater than 0.
   * A numeric instance is valid only if division by this keyword's value results in an integer.
   * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.1
   */
  multipleOf?: number;

  /**
   * Representing an inclusive upper limit for a numeric instance.
   * This keyword validates only if the instance is less than or exactly equal to "maximum".
   * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.2
   */
  maximum?: number;

  /**
   * Representing an exclusive upper limit for a numeric instance.
   * This keyword validates only if the instance is strictly less than (not equal to) to "exclusiveMaximum".
   * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.3
   */
  exclusiveMaximum?: boolean;

  /**
   * Representing an inclusive lower limit for a numeric instance.
   * This keyword validates only if the instance is greater than or exactly equal to "minimum".
   * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.4
   */
  minimum?: number;

  /**
   * Representing an exclusive lower limit for a numeric instance.
   * This keyword validates only if the instance is strictly greater than (not equal to) to "exclusiveMinimum".
   * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.5
   */
  exclusiveMinimum?: boolean;

  /**
   * Must be a non-negative integer.
   * A string instance is valid against this keyword if its length is less than, or equal to, the value of this keyword.
   * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.6
   */
  maxLength?: number;

  /**
   * Must be a non-negative integer.
   * A string instance is valid against this keyword if its length is greater than, or equal to, the value of this keyword.
   * Omitting this keyword has the same behavior as a value of 0.
   * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.7
   */
  minLength?: number;

  /**
   * Should be a valid regular expression, according to the ECMA 262 regular expression dialect.
   * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.8
   */
  pattern?: string;
  /**
   * Must be a non-negative integer.
   * An array instance is valid against "maxItems" if its size is less than, or equal to, the value of this keyword.
   * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.11
   */
  maxItems?: number;

  /**
   * Must be a non-negative integer.
   * An array instance is valid against "maxItems" if its size is greater than, or equal to, the value of this keyword.
   * Omitting this keyword has the same behavior as a value of 0.
   * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.12
   */
  minItems?: number;

  /**
   * If this keyword has boolean value false, the instance validates successfully.
   * If it has boolean value true, the instance validates successfully if all of its elements are unique.
   * Omitting this keyword has the same behavior as a value of false.
   * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.13
   */
  uniqueItems?: boolean;

  /**
   * Must be a non-negative integer.
   * An object instance is valid against "maxProperties" if its number of properties is less than, or equal to, the value of this keyword.
   * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.15
   */
  maxProperties?: number;

  /**
   * Must be a non-negative integer.
   * An object instance is valid against "maxProperties" if its number of properties is greater than,
   * or equal to, the value of this keyword.
   * Omitting this keyword has the same behavior as a value of 0.
   * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.16
   */
  minProperties?: number;

  /**
   * Elements of this array must be unique.
   * An object instance is valid against this keyword if every item in the array is the name of a property in the instance.
   * Omitting this keyword has the same behavior as an empty array.
   *
   * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.17
   */
  required?: Array<string>;

  /**
   * This provides an enumeration of all possible values that are valid
   * for the instance property. This MUST be an array, and each item in
   * the array represents a possible value for the instance value. If
   * this attribute is defined, the instance value MUST be one of the
   * values in the array in order for the schema to be valid.
   *
   * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.23
   */
  enum?: (string | number | boolean)[];

  /** the JSON type for the schema */
  type?: JsonType;

  /** The extending format for the previously mentioned type.  */
  format?: string;

  /**  This attribute is a string that provides a full description of the schema */
  description?: string;

  /**
   * A collection of schemas that this schema also must conform to.
   *
   * An instance validates successfully against this keyword if it validates successfully against all schemas defined by this keyword's value.
   *
   * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.26
   */
  allOf?: Refable<OpenAPI3Schema>[];

  /**
   * A collection of schemas that this schema may conform to one or more of.
   *
   * An instance validates successfully against this keyword if it validates successfully against at least one schema defined by this keyword's value.
   *
   * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.27
   */
  anyOf?: Refable<OpenAPI3Schema>[];

  /**
   * A collection of schemas that this schema may conform to only one of.
   *
   * An instance validates successfully against this keyword if it validates successfully against exactly one schema defined by this keyword's value.
   *
   * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.28
   */
  oneOf?: Refable<OpenAPI3Schema>[];

  /**
   *  An instance is valid against this keyword if it fails to validate successfully against the schema defined by this keyword.
   * @see https://datatracker.ietf.org/doc/html/draft-wright-json-schema-validation-00#section-5.29
   */
  not?: Refable<OpenAPI3Schema>;

  /**  This keyword determines how child instances validate for arrays, and does not directly validate the immediate instance itself. */
  items?: Refable<OpenAPI3Schema>;

  /**
   * This attribute is an object with property definitions that define the
   * valid values of instance object property values. When the instance
   * value is an object, the property values of the instance object MUST
   * conform to the property definitions in this object. In this object,
   * each property definition's value MUST be a schema, and the property's
   * name MUST be the name of the instance property that it defines.  The
   * instance property value MUST be valid according to the schema from
   * the property definition. Properties are considered unordered, the
   * order of the instance properties MAY be in any order.
   *
   */
  properties?: Record<string, OpenAPI3SchemaProperty>;

  /** indicates that additional unlisted properties can exist in this schema */
  additionalProperties?: boolean | Refable<OpenAPI3Schema>;

  /**
   * Declares the value of the property that the server will use if none is provided,
   * for example a "count" to control the number of results per page might default to 100 if not supplied by the client in the request.
   *
   * @note "default" has no meaning for required parameters.) See https://tools.ietf.org/html/draft-fge-json-schema-validation-00#section-6.2. Unlike JSON Schema this value MUST conform to the defined type for this parameter.
   */
  default?: string | boolean | number | Record<string, any>;

  /** Allows sending a null value for the defined schema. Default value is false. */
  nullable?: boolean;

  /**
   * Property is readonly.
   */
  readOnly?: boolean;

  /** Adds support for polymorphism. The discriminator is an object name that is used to differentiate between other schemas which may satisfy the payload description  */
  discriminator?: OpenAPI3Discriminator;

  /** Additional external documentation for this schema. */
  externalDocs?: OpenAPI3ExternalDocs;

  /** A free-form property to include an example of an instance for this schema. To represent examples that cannot be naturally represented in JSON or YAML, a string value can be used to contain the example with escaping where necessary. */
  example?: any;

  /** Specifies that a schema is deprecated and SHOULD be transitioned out of usage.Default value is false. */
  deprecated?: boolean;
};

export type OpenAPI3ParameterBase = Extensions & {
  /**A brief description of the parameter. This could contain examples of use. CommonMark syntax MAY be used for rich text representation. */
  description?: string;

  /**Determines whether this parameter is mandatory. If the parameter location is "path", this property is REQUIRED and its value MUST be true. Otherwise, the property MAY be included and its default value is false. */
  required?: boolean;

  /** Specifies that a parameter is deprecated and SHOULD be transitioned out of usage. Default value is false.  */
  deprecated?: boolean;

  /** When this is true, parameter values of type array or object generate separate parameters for each value of the array or key-value pair of the map. For other types of parameters this property has no effect. When style is form, the default value is true. For all other styles, the default value is false.  */
  explode?: boolean;

  schema: OpenAPI3Schema;
};

export type OpenAPI3QueryParameter = OpenAPI3ParameterBase & {
  /** Name of the parameter. */
  name: string;
  in: "query";
  /**
   * Describes how the parameter value will be serialized depending on the type of the parameter value.
   *
   * Default value for query parameters is form.
   * @see https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.2.md#style-values
   */
  style?: "form" | "spaceDelimited" | "pipeDelimited" | "deepObject";
};
export type OpenAPI3PathParameter = OpenAPI3ParameterBase & {
  /** Name of the parameter. */
  name: string;
  in: "path";
  /**
   * Describes how the parameter value will be serialized depending on the type of the parameter value.
   *
   * Default value for path parameters is simple.
   * @see https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.2.md#style-values
   */
  style?: "simple" | "label" | "matrix";
};
export type OpenAPI3HeaderParameter = OpenAPI3ParameterBase & {
  /** Name of the parameter. */
  name: string;
  in: "header";
  /**
   * Describes how the parameter value will be serialized depending on the type of the parameter value.
   *
   * Default value for header parameters is simple.
   * @see https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.2.md#style-values
   */
  style?: "simple";
};
export type OpenAPI3Parameter =
  | OpenAPI3HeaderParameter
  | OpenAPI3QueryParameter
  | OpenAPI3PathParameter;
export type OpenAPI3ParameterType = OpenAPI3Parameter["in"];

/**
 * The Header Object follows the structure of the Parameter Object with the following changes:
 *
 * name MUST NOT be specified, it is given in the corresponding headers map.
 * in MUST NOT be specified, it is implicitly in header.
 * All traits that are affected by the location MUST be applicable to a location of header (for example, style).
 *
 * @see https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.2.md#header-object
 */
export type OpenAPI3Header = OpenAPI3ParameterBase & {
  /** Describes how the parameter value will be serialized depending on the type of the parameter value
   *
   * simple - Simple style parameters defined by RFC6570. This option replaces collectionFormat with a csv value from OpenAPI 2.0
   */
  style?: "simple";
};

export type OpenAPI3Operation = Extensions & {
  description?: string;
  summary?: string;
  responses?: any;
  tags?: string[];
  operationId?: string;
  requestBody?: any;
  parameters: OpenAPI3Parameter[];
  deprecated?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Ref<T> {
  $ref: string;
}

export type Refable<T> = Ref<T> | T;
